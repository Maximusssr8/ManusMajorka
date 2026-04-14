/**
 * Apify pintostudio AliExpress actor — typed wrapper.
 *
 * Actor: pintostudio~aliexpress-product-search
 *   https://apify.com/pintostudio/aliexpress-product-search
 *
 * This is the highest-signal product source in the pipeline: keyword / trending /
 * bestseller / hot_products / new_arrivals modes, sorted by orders, with
 * ship-to filter. It is a paid rental actor — if it returns 402/403 the
 * pipeline must still finish (partial) rather than crash.
 *
 * We use the REST API directly (the `apify-client` npm package is banned
 * elsewhere in this repo for the same reason — smaller cold-start, fewer
 * surprises in serverless).
 */

import { getFxRates, FALLBACK_RATES } from './fx-rates';
import { getSupabaseAdmin } from '../_core/supabase';
import { finishRun, startRun, type SourceBreakdown } from './pipelineLogs';

const APIFY_BASE = 'https://api.apify.com/v2';
/** Paid rental actor. If Apify ever changes the slug, update here. */
export const PINTOSTUDIO_ACTOR = 'pintostudio~aliexpress-product-search';
/** Per-actor run timeout (seconds) handed to Apify. */
const RUN_TIMEOUT_SECS = 180;
/** Client-side polling budget — each poll is 3s. */
const MAX_POLLS = 60;
const POLL_INTERVAL_MS = 3000;

const QUALITY_MIN_TITLE_LEN = 5;
const QUALITY_MIN_PRICE_AUD = 0.5;

const DEFAULT_NEW_ARRIVAL_ORDERS_FLOOR = 1000;
const TARGET_SUCCESS_ROWS = 500;

/**
 * Demand-signal queries — NO category searches, pure order-volume signals.
 * Each query triggers one pintostudio actor call, sorted by ORDERS desc.
 * Query terms tuned empirically — broader terms yield more results on AliExpress
 * than niche/compound phrases. Bucket mapping = SourceBreakdown keys:
 *   trending[] → 'trending'   bestsellers[] → 'bestsellers'
 *   hot[]      → 'hot'        newArrivals[] → 'new_arrivals'
 */
const TRENDING_QUERIES: ReadonlyArray<string> = [
  'best selling', 'trending now', 'top selling', 'most ordered', 'viral product',
  'hot selling', 'popular items', 'fast selling', 'top rated sellers', 'most bought',
];

const BESTSELLER_QUERIES: ReadonlyArray<string> = [
  'hot product', 'top sale', 'flash sale', 'bestseller', 'big discount',
  'clearance', 'promotion', 'hot deal', 'top deal', 'limited offer',
];

const HOT_QUERIES: ReadonlyArray<string> = [
  'viral', 'tiktok viral product', 'trending product',
];

/** New-arrival queries — filter post-hoc to orders >= 1000. */
const NEW_HIGH_VOLUME_QUERIES: ReadonlyArray<string> = [
  'new product 2025', '2025 new arrival', 'just released',
  'newest gadget', 'new launch',
];

function log(tag: string, msg: string): void {
  if (process.env.NODE_ENV !== 'production') {
    process.stdout.write(`[${tag}] ${msg}\n`);
  }
}

function logErr(tag: string, msg: string): void {
  process.stderr.write(`[${tag}] ${msg}\n`);
}

function getToken(): string {
  return process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || '';
}

/** Narrow a value to string with a default. */
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : v != null ? String(v) : fallback;
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const parsed = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function ordersFromAny(item: Record<string, unknown>): number {
  const raw = str(item.sold ?? item.orders ?? item.totalSold ?? item.monthlySales ?? item.tradeCount ?? '0');
  const base = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
  const m = raw.toLowerCase();
  if (m.includes('k')) return Math.round(base * 1000);
  if (m.includes('m')) return Math.round(base * 1_000_000);
  return Math.round(base);
}

export interface PintostudioInput {
  /** Run mode — drives which request shape we send. */
  mode: 'trending' | 'bestsellers' | 'hot_products' | 'new_arrivals';
  keyword?: string;
  categoryUrl?: string;
  country?: 'AU' | 'US' | 'UK';
  limit: number;
}

export interface PintostudioItem {
  sourceProductId: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  priceUsd: number;
  priceAud: number;
  orders: number;
  rating: number | null;
  reviewCount: number;
  category: string | null;
  sellerName: string | null;
  currency: string;
}

/**
 * Start a pintostudio run synchronously and wait for results (polling).
 * Returns [] on any failure so callers can treat missing data as partial.
 */
export async function runPintostudio(input: PintostudioInput): Promise<PintostudioItem[]> {
  const token = getToken();
  if (!token) {
    logErr('pintostudio', 'APIFY_API_TOKEN missing — check Vercel env APIFY_API_KEY');
    return [];
  }
  // Debug — prints first 8 chars of key and mode/country. Never the full key.
  logErr('pintostudio', `mode=${input.mode} country=${input.country ?? 'AU'} key=${token.slice(0, 8)}… limit=${input.limit}`);

  const body = buildInput(input);
  try {
    const startUrl = `${APIFY_BASE}/acts/${PINTOSTUDIO_ACTOR}/runs?token=${token}&timeout=${RUN_TIMEOUT_SECS}`;
    const startRes = await fetch(startUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!startRes.ok) {
      const text = await startRes.text().catch(() => '');
      logErr('pintostudio', `start HTTP ${startRes.status}: ${text.slice(0, 300)}`);
      return [];
    }
    logErr('pintostudio', `start OK HTTP ${startRes.status}`);
    const startData = (await startRes.json()) as { data?: { id?: string; defaultDatasetId?: string } };
    const runId = startData.data?.id;
    if (!runId) return [];

    let datasetId: string | undefined = startData.data?.defaultDatasetId;
    let status = 'RUNNING';
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const pollRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!pollRes.ok) continue;
      const pollData = (await pollRes.json()) as {
        data?: { status?: string; defaultDatasetId?: string };
      };
      status = pollData.data?.status ?? 'RUNNING';
      datasetId = pollData.data?.defaultDatasetId ?? datasetId;
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') break;
    }

    if (!datasetId || status !== 'SUCCEEDED') {
      logErr('pintostudio', `run ${runId} ended status=${status}`);
      if (!datasetId) return [];
    }

    const itemsRes = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&clean=true&limit=${input.limit}`,
      { signal: AbortSignal.timeout(20_000) },
    );
    if (!itemsRes.ok) return [];
    const raw = (await itemsRes.json()) as unknown[];
    if (!Array.isArray(raw)) return [];

    const fx = await getFxRates();
    const audRate = fx.AUD || FALLBACK_RATES.AUD;
    const out: PintostudioItem[] = [];
    // pintostudio wraps the real product list inside `{ data: { content: [...] } }`
    // — flatten before mapping. Items that are already flat (legacy shape) still work.
    const flattened: Record<string, unknown>[] = [];
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      const maybeWrapped = r as Record<string, unknown>;
      const dataVal = maybeWrapped.data;
      if (dataVal && typeof dataVal === 'object') {
        const content = (dataVal as Record<string, unknown>).content;
        if (Array.isArray(content)) {
          for (const c of content) {
            if (c && typeof c === 'object') flattened.push(c as Record<string, unknown>);
          }
          continue;
        }
      }
      flattened.push(maybeWrapped);
    }
    for (const f of flattened) {
      const mapped = mapItem(f, audRate);
      if (mapped) out.push(mapped);
    }
    logErr('pintostudio', `mode=${input.mode} raw=${raw.length} flat=${flattened.length} mapped=${out.length} dataset=${datasetId}`);
    return out;
  } catch (e: unknown) {
    logErr('pintostudio', e instanceof Error ? e.message : 'unknown error');
    return [];
  }
}

/**
 * Build the actor input. Pintostudio describes itself as
 * "Search for products on AliExpress based on a query" — it is query-based,
 * NOT URL-based. We defensively send every common synonym for the search
 * field (`query`, `keyword`, `searchQuery`, `text`, `searchText`, `q`) and
 * every common sort-field name so the actor cannot silently no-op because
 * we used the wrong key. Apify actors ignore unknown inputs.
 */
function buildInput(input: PintostudioInput): Record<string, unknown> {
  const shipTo = input.country ?? 'AU';
  const q = queryForMode(input);
  const sortKey = input.mode === 'new_arrivals' ? 'NEWEST' : 'ORDERS';
  return {
    query: q,
    keyword: q,
    searchQuery: q,
    searchText: q,
    text: q,
    q,
    maxItems: input.limit,
    maxResults: input.limit,
    resultsLimit: input.limit,
    sortBy: sortKey,
    sort: sortKey,
    sortType: sortKey === 'ORDERS' ? 'total_tranqt_desc' : 'newest_desc',
    shipTo,
    shipCountry: shipTo,
    country: shipTo,
  };
}

/**
 * Derive a search query from the input mode. For bestsellers (category-based)
 * we fall back to the keyword field if provided, else extract a human-readable
 * category name from the URL slug.
 */
function queryForMode(input: PintostudioInput): string {
  if (input.keyword && input.keyword.trim().length > 0) return input.keyword;
  // Every mode is now query-based. No category URL synthesis.
  switch (input.mode) {
    case 'trending':
      return 'best selling';
    case 'hot_products':
      return 'hot selling';
    case 'new_arrivals':
      return 'new arrival hot';
    case 'bestsellers':
      return 'bestseller';
  }
}

// ──────────────────────────────────────────────────────────────────────────
// pintostudio actor result shape (verified 2026-04-14 via /api/admin/test-apify):
// {
//   productId: "3256810280552947",
//   title: { displayTitle: "...", seoTitle: "..." },
//   image: { imgUrl: "//ae-pic-a1.aliexpress-media.com/kf/...jpg" },
//   images: [{ imgUrl }, ...],
//   prices: {
//     salePrice:     { minPrice: 8.54,  formattedPrice: "US $8.54", discount: 74 },
//     originalPrice: { minPrice: 34.11, formattedPrice: "US $34.11" }
//   },
//   trade: { realTradeCount: 436, tradeDesc: "436 sold" },
//   evaluation: { starRating: 4.2 },
//   lunchTime: "2025-11-30 00:00:00"
// }
// ──────────────────────────────────────────────────────────────────────────
function pick<T = unknown>(obj: Record<string, unknown>, path: string): T | undefined {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur as T | undefined;
}

function normalizeUrl(u: string | undefined): string {
  if (!u) return '';
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('http')) return u;
  return u;
}

function mapItem(item: Record<string, unknown>, audRate: number): PintostudioItem | null {
  // Title — prefer nested displayTitle, fall back to flat shape (legacy/alt actors).
  const titleDisplay = str(pick<string>(item, 'title.displayTitle') ?? pick<string>(item, 'title.seoTitle'));
  const title = (titleDisplay || str(item.title ?? item.name ?? item.productTitle)).trim();
  if (title.length < QUALITY_MIN_TITLE_LEN) return null;

  // Image — nested `image.imgUrl` (protocol-relative) with flat fallbacks.
  const imgNested = pick<string>(item, 'image.imgUrl')
    ?? pick<string>(item, 'images.0.imgUrl');
  const imageUrl = normalizeUrl(
    imgNested
      ?? str(item.imageUrl ?? item.mainImage ?? item.thumbnail ?? item.imgUrl)
      ?? (typeof item.image === 'string' ? (item.image as string) : ''),
  );
  if (!imageUrl) return null;

  // Product URL — actor omits it; synthesise from productId.
  const productIdRaw = str(item.productId ?? item.id ?? item.itemId ?? '');
  const productUrl = str(item.url ?? item.link ?? item.productUrl)
    || (productIdRaw ? `https://www.aliexpress.com/item/${productIdRaw}.html` : '');

  // Price — prefer nested salePrice, then originalPrice, then flat fallbacks.
  const priceRaw =
    numOrNull(pick<number>(item, 'prices.salePrice.minPrice'))
    ?? numOrNull(pick<number>(item, 'prices.originalPrice.minPrice'))
    ?? numOrNull(item.price ?? item.priceMin ?? item.salePrice ?? item.discountPrice);
  if (priceRaw == null || priceRaw <= 0) return null;

  const priceUsd = priceRaw;
  const priceAud = Math.round(priceUsd * audRate * 100) / 100;
  if (priceAud < QUALITY_MIN_PRICE_AUD) return null;

  // Orders — prefer nested trade.realTradeCount, fall back to flat.
  // Global quality gate: require orders >= 1000 (demand-signal-only spec).
  const ordersRaw = numOrNull(pick<number>(item, 'trade.realTradeCount'));
  const orders = ordersRaw != null && ordersRaw > 0 ? Math.round(ordersRaw) : ordersFromAny(item);
  if (orders < 1000) return null;

  // Rating — nested evaluation.starRating, fall back to flat.
  const rating = numOrNull(pick<number>(item, 'evaluation.starRating'))
    ?? numOrNull(item.rating ?? item.starRating ?? item.score);
  const reviewCount = ordersFromAny({ sold: pick<number>(item, 'evaluation.reviewCount') ?? item.reviews ?? item.reviewCount ?? item.commentCount ?? 0 });
  const sourceProductId = productIdRaw.slice(0, 120) || str(productUrl).slice(0, 120);
  if (!sourceProductId) return null;

  return {
    sourceProductId,
    title: title.slice(0, 500),
    imageUrl,
    productUrl,
    priceUsd: Math.round(priceUsd * 100) / 100,
    priceAud,
    orders,
    rating: rating != null && rating > 0 ? rating : null,
    reviewCount,
    category: str(item.category ?? item.categoryName) || null,
    sellerName: str(item.storeName ?? item.seller ?? item.shopName) || null,
    currency: 'USD',
  };
}

// ─── Pipeline orchestration ────────────────────────────────────────────────

export interface PipelineResult {
  status: 'success' | 'partial' | 'error';
  productsAdded: number;
  productsUpdated: number;
  productsRejected: number;
  sourceBreakdown: SourceBreakdown;
  errors: string[];
  durationMs: number;
  logId: string | null;
}

interface Upserted {
  added: number;
  updated: number;
  rejected: number;
}

/**
 * Runs the full pipeline: trending × 3 markets + 20 bestseller categories
 * + hot_products + new_arrivals. Writes one pipeline_logs row.
 */
export async function runApifyPintostudioPipeline(): Promise<PipelineResult> {
  const run = await startRun();
  const t0 = Date.now();
  const errors: string[] = [];
  const breakdown: SourceBreakdown = { trending: 0, bestsellers: 0, hot: 0, new_arrivals: 0 };
  let added = 0;
  let updated = 0;
  let rejected = 0;

  // 25 parallel calls: 10 trending + 10 bestsellers + 5 new-high-volume.
  // Zero category-based searches. Every query is a pure demand signal.
  type Call = {
    input: PintostudioInput;
    source: string;
    bucket: keyof SourceBreakdown;
    minOrders?: number;
  };
  const calls: Call[] = [];

  for (const q of TRENDING_QUERIES) {
    calls.push({
      input: { mode: 'trending', keyword: q, country: 'AU', limit: 100 },
      source: `trending:${q}`,
      bucket: 'trending',
    });
  }
  for (const q of BESTSELLER_QUERIES) {
    calls.push({
      input: { mode: 'trending', keyword: q, country: 'AU', limit: 100 },
      source: `bestsellers:${q}`,
      bucket: 'bestsellers',
    });
  }
  for (const q of HOT_QUERIES) {
    calls.push({
      input: { mode: 'hot_products', keyword: q, country: 'AU', limit: 100 },
      source: `hot:${q}`,
      bucket: 'hot',
    });
  }
  for (const q of NEW_HIGH_VOLUME_QUERIES) {
    calls.push({
      input: { mode: 'new_arrivals', keyword: q, country: 'AU', limit: 100 },
      source: `new_high_volume:${q}`,
      bucket: 'new_arrivals',
      minOrders: DEFAULT_NEW_ARRIVAL_ORDERS_FLOOR,
    });
  }

  logErr('pintostudio', `[PIPELINE START] firing ${calls.length} parallel actor calls (10 trending + 10 bestsellers + 5 new-high-volume)`);
  const results = await Promise.allSettled(calls.map(async (c) => {
    const items = await runPintostudio(c.input);
    const filtered = c.minOrders != null ? items.filter((i) => i.orders >= c.minOrders!) : items;
    const u = await upsertProducts(filtered, c.source);
    return { call: c, items: filtered, upserted: u };
  }));

  for (const r of results) {
    if (r.status !== 'fulfilled') {
      errors.push(`fatal:${(r.reason as Error)?.message ?? 'unknown'}`);
      continue;
    }
    const { call, items, upserted } = r.value;
    if (items.length === 0) errors.push(`${call.source}:empty`);
    breakdown[call.bucket] += upserted.added + upserted.updated;
    added += upserted.added;
    updated += upserted.updated;
    rejected += upserted.rejected;
  }

  const total = added + updated;
  let status: 'success' | 'partial' | 'error';
  if (total === 0) status = 'error';
  else if (total >= TARGET_SUCCESS_ROWS && errors.length === 0) status = 'success';
  else status = 'partial';

  const durationMs = Date.now() - t0;
  await finishRun(run, {
    products_added: added,
    products_updated: updated,
    products_rejected: rejected,
    source_breakdown: breakdown,
    status,
    error_message: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
  });

  return {
    status,
    productsAdded: added,
    productsUpdated: updated,
    productsRejected: rejected,
    sourceBreakdown: breakdown,
    errors,
    durationMs,
    logId: run?.id ?? null,
  };
}

/**
 * Map + UPSERT a batch into winning_products.
 * Conflict on source_product_id — fallback is product_title when absent.
 */
async function upsertProducts(items: PintostudioItem[], source: string): Promise<Upserted> {
  if (items.length === 0) return { added: 0, updated: 0, rejected: 0 };

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const rows = items.map((i) => {
    const unitsPerDay = Math.max(1, Math.round(i.orders / 365));
    const estDailyRevenueAud = Math.round(i.priceAud * unitsPerDay * 100) / 100;
    const winningScore = computeWinningScore({
      orders: i.orders,
      priceAud: i.priceAud,
      rating: i.rating,
      reviewCount: i.reviewCount,
    });
    return {
      product_title: i.title,
      image_url: i.imageUrl,
      category: i.category ?? 'general',
      platform: 'aliexpress', // REQUIRED — composite unique is (product_title, platform)
      price_aud: i.priceAud,
      sold_count: i.orders,
      winning_score: winningScore,
      est_daily_revenue_aud: estDailyRevenueAud,
      aliexpress_url: i.productUrl || null,
      aliexpress_id: i.sourceProductId,
    };
  });
  void nowIso; // kept for future use when snapshot migrations land

  let added = 0;
  let updated = 0;
  let rejected = 0;

  // No unique constraint on aliexpress_id so ON CONFLICT fails. Two-pass:
  //   1. SELECT existing aliexpress_ids → INSERT only truly-new rows
  //   2. For existing rows, bulk UPDATE sold_count / winning_score / scraped_at
  //      so the dashboard sees fresh demand numbers even when no new SKUs arrive.
  const ids = rows.map((r) => r.aliexpress_id).filter(Boolean);
  const existingIds = new Set<string>();
  if (ids.length > 0) {
    const { data, error: selErr } = await supabase
      .from('winning_products')
      .select('aliexpress_id')
      .in('aliexpress_id', ids);
    if (selErr) {
      logErr('upsert', `select existing ${source}: ${selErr.message}`);
    }
    for (const row of data ?? []) {
      const v = (row as { aliexpress_id?: string }).aliexpress_id;
      if (v) existingIds.add(v);
    }
  }
  const newRows = rows.filter((r) => !existingIds.has(r.aliexpress_id));
  const existingRows = rows.filter((r) => existingIds.has(r.aliexpress_id));

  logErr('upsert', `${source}: items=${items.length} rows=${rows.length} new=${newRows.length} existing=${existingRows.length}`);

  // Insert new rows — use upsert with onConflict on (product_title, platform)
  // so title-collisions with existing rows silently no-op instead of throwing.
  if (newRows.length > 0) {
    const { error: insErr } = await supabase
      .from('winning_products')
      .upsert(newRows, {
        onConflict: 'product_title,platform',
        ignoreDuplicates: true,
      });
    if (insErr) {
      const msg = `insert ${source} n=${newRows.length}: ${insErr.message}${insErr.details ? ` | ${insErr.details}` : ''}${insErr.hint ? ` | hint: ${insErr.hint}` : ''}`;
      logErr('upsert', msg);
      // Don't throw — partial batch success is better than losing all 25 calls.
      rejected += newRows.length;
    } else {
      added = newRows.length;
    }
  }

  // Refresh existing rows — UPDATE demand signals per aliexpress_id
  for (const r of existingRows) {
    const { error: updErr } = await supabase
      .from('winning_products')
      .update({
        sold_count: r.sold_count,
        winning_score: r.winning_score,
        est_daily_revenue_aud: r.est_daily_revenue_aud,
        price_aud: r.price_aud,
        image_url: r.image_url,
      })
      .eq('aliexpress_id', r.aliexpress_id);
    if (updErr) {
      // Don't throw — log and count as rejected so the rest of the batch lands.
      logErr('upsert', `update ${source} aid=${r.aliexpress_id}: ${updErr.message}`);
      rejected++;
      continue;
    }
    updated++;
  }

  return { added, updated, rejected };
}

/**
 * Velocity-weighted score. Mirrors the existing formula used across the repo
 * (orders volume + rating quality + price fit). Clamp to 50–98.
 */
function computeWinningScore(input: {
  orders: number;
  priceAud: number;
  rating: number | null;
  reviewCount: number;
}): number {
  const ordersScore = Math.min(50, Math.log10(Math.max(1, input.orders)) * 12);
  const ratingScore = input.rating ? Math.min(20, (input.rating / 5) * 20) : 10;
  const reviewScore = Math.min(15, Math.log10(Math.max(1, input.reviewCount)) * 5);
  const priceScore = input.priceAud >= 10 && input.priceAud <= 80 ? 15 : 8;
  const total = ordersScore + ratingScore + reviewScore + priceScore;
  return Math.max(50, Math.min(98, Math.round(total)));
}
