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
import { cache } from './cache';

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

/** 20 bestseller category URLs — tuned for AU dropship demand. */
const BESTSELLER_CATEGORIES: ReadonlyArray<{ id: string; name: string; url: string }> = [
  { id: '200003655', name: 'Beauty & Health', url: 'https://www.aliexpress.com/category/200003655/beauty-health.html?SortType=total_tranpro_desc' },
  { id: '200000343', name: 'Pet Products', url: 'https://www.aliexpress.com/category/200000343/pet-products.html?SortType=total_tranpro_desc' },
  { id: '200000783', name: 'Home & Garden', url: 'https://www.aliexpress.com/category/200000783/home-garden.html?SortType=total_tranpro_desc' },
  { id: '200000506', name: 'Sports & Fitness', url: 'https://www.aliexpress.com/category/200000506/sports-entertainment.html?SortType=total_tranpro_desc' },
  { id: '200000340', name: 'Consumer Electronics', url: 'https://www.aliexpress.com/category/200000340/consumer-electronics.html?SortType=total_tranpro_desc' },
  { id: '200000345', name: 'Mother & Kids', url: 'https://www.aliexpress.com/category/200000345/mother-kids.html?SortType=total_tranpro_desc' },
  { id: '200000344', name: 'Apparel Accessories', url: 'https://www.aliexpress.com/category/200000344/apparel-accessories.html?SortType=total_tranpro_desc' },
  { id: '1501',      name: 'Phone Accessories', url: 'https://www.aliexpress.com/category/1501/phone-accessories.html?SortType=total_tranpro_desc' },
  { id: '200000828', name: 'Automotive', url: 'https://www.aliexpress.com/category/200000828/automotive.html?SortType=total_tranpro_desc' },
  { id: '44',        name: 'Tools', url: 'https://www.aliexpress.com/category/44/tools.html?SortType=total_tranpro_desc' },
  { id: '200000532', name: 'Jewelry', url: 'https://www.aliexpress.com/category/200000532/jewelry.html?SortType=total_tranpro_desc' },
  { id: '200001996', name: 'Watches', url: 'https://www.aliexpress.com/category/200001996/watches.html?SortType=total_tranpro_desc' },
  { id: '15',        name: 'Office & School', url: 'https://www.aliexpress.com/category/15/office-school-supplies.html?SortType=total_tranpro_desc' },
  { id: '1503',      name: 'Computer & Office', url: 'https://www.aliexpress.com/category/1503/computer-office.html?SortType=total_tranpro_desc' },
  { id: '200003498', name: 'Lights & Lighting', url: 'https://www.aliexpress.com/category/200003498/lights-lighting.html?SortType=total_tranpro_desc' },
  { id: '200000297', name: 'Bags & Luggage', url: 'https://www.aliexpress.com/category/200000297/luggage-bags.html?SortType=total_tranpro_desc' },
  { id: '200000298', name: 'Shoes', url: 'https://www.aliexpress.com/category/200000298/shoes.html?SortType=total_tranpro_desc' },
  { id: '509',       name: 'Toys & Hobbies', url: 'https://www.aliexpress.com/category/509/toys-hobbies.html?SortType=total_tranpro_desc' },
  { id: '6',         name: 'Security & Protection', url: 'https://www.aliexpress.com/category/6/security-protection.html?SortType=total_tranpro_desc' },
  { id: '200001075', name: 'Furniture', url: 'https://www.aliexpress.com/category/200001075/furniture.html?SortType=total_tranpro_desc' },
];

/** Trending keyword seeds per market. */
const TRENDING_KEYWORDS_PER_MARKET: ReadonlyArray<{ market: 'AU' | 'US' | 'UK'; keywords: string[] }> = [
  { market: 'AU', keywords: ['viral gadget', 'tiktok made me buy', 'trending home', 'cooling', 'led'] },
  { market: 'US', keywords: ['viral gadget', 'tiktok made me buy', 'aesthetic', 'skincare', 'gaming'] },
  { market: 'UK', keywords: ['viral gadget', 'tiktok made me buy', 'kitchen', 'pet', 'fitness'] },
];

const HOT_PRODUCT_KEYWORDS = ['hot product', 'bestseller', 'new trending'];
const NEW_ARRIVAL_KEYWORDS = ['new arrival', 'just launched', 'latest'];

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
    logErr('pintostudio', 'APIFY_API_TOKEN not set');
    return [];
  }

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
      logErr('pintostudio', `start ${startRes.status}: ${text.slice(0, 200)}`);
      return [];
    }
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
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      const mapped = mapItem(r as Record<string, unknown>, audRate);
      if (mapped) out.push(mapped);
    }
    log('pintostudio', `mode=${input.mode} got=${out.length} from dataset=${datasetId}`);
    return out;
  } catch (e: unknown) {
    logErr('pintostudio', e instanceof Error ? e.message : 'unknown error');
    return [];
  }
}

function buildInput(input: PintostudioInput): Record<string, unknown> {
  const shipTo = input.country ?? 'AU';
  switch (input.mode) {
    case 'trending':
      return {
        keyword: input.keyword ?? 'trending',
        maxItems: input.limit,
        sortBy: 'ORDERS',
        shipTo,
      };
    case 'bestsellers':
      return {
        startUrls: input.categoryUrl ? [{ url: input.categoryUrl }] : [],
        maxItems: input.limit,
        sortBy: 'ORDERS',
        shipTo,
      };
    case 'hot_products':
      return {
        keyword: input.keyword ?? 'hot product',
        maxItems: input.limit,
        sortBy: 'ORDERS',
        shipTo,
      };
    case 'new_arrivals':
      return {
        keyword: input.keyword ?? 'new arrival',
        maxItems: input.limit,
        sortBy: 'NEWEST',
        shipTo,
      };
  }
}

function mapItem(item: Record<string, unknown>, audRate: number): PintostudioItem | null {
  const title = str(item.title ?? item.name ?? item.productTitle).trim();
  if (title.length < QUALITY_MIN_TITLE_LEN) return null;

  const imageUrl = str(
    item.image ?? item.imageUrl ?? item.mainImage ?? item.thumbnail ?? item.imgUrl,
  );
  if (!imageUrl) return null;

  const productUrl = str(item.url ?? item.link ?? item.productUrl);
  const rawCurrency = str(item.currency ?? item.currencyCode ?? 'USD').toUpperCase().slice(0, 3) || 'USD';
  const priceRaw = numOrNull(item.price ?? item.priceMin ?? item.salePrice ?? item.discountPrice);
  if (priceRaw == null || priceRaw <= 0) return null;

  const priceUsd = rawCurrency === 'USD' ? priceRaw : priceRaw; // pintostudio normalises to USD
  const priceAud = Math.round(priceUsd * audRate * 100) / 100;
  if (priceAud < QUALITY_MIN_PRICE_AUD) return null;

  const orders = ordersFromAny(item);
  if (orders <= 0) return null;

  const rating = numOrNull(item.rating ?? item.starRating ?? item.score);
  const reviewCount = ordersFromAny({ sold: item.reviews ?? item.reviewCount ?? item.commentCount ?? 0 });
  const sourceProductId = str(item.id ?? item.productId ?? item.itemId ?? productUrl).slice(0, 120);
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
    currency: rawCurrency,
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

  // Trending across 3 markets (×5 keywords each = 15 calls × 100 items)
  for (const m of TRENDING_KEYWORDS_PER_MARKET) {
    for (const kw of m.keywords) {
      const items = await runPintostudio({ mode: 'trending', keyword: kw, country: m.market, limit: 100 });
      if (items.length === 0) errors.push(`trending:${m.market}:${kw}:empty`);
      const u = await upsertProducts(items, `trending:${m.market}`);
      breakdown.trending += u.added + u.updated;
      added += u.added; updated += u.updated; rejected += u.rejected;
    }
  }

  // Bestsellers — 20 categories × 100 items
  for (const cat of BESTSELLER_CATEGORIES) {
    const items = await runPintostudio({
      mode: 'bestsellers',
      categoryUrl: cat.url,
      country: 'AU',
      limit: 100,
    });
    if (items.length === 0) errors.push(`bestsellers:${cat.name}:empty`);
    const u = await upsertProducts(items, `bestsellers:${cat.id}`);
    breakdown.bestsellers += u.added + u.updated;
    added += u.added; updated += u.updated; rejected += u.rejected;
  }

  // Hot products — single deep call
  for (const kw of HOT_PRODUCT_KEYWORDS) {
    const items = await runPintostudio({ mode: 'hot_products', keyword: kw, country: 'AU', limit: 200 });
    if (items.length === 0) errors.push(`hot_products:${kw}:empty`);
    const u = await upsertProducts(items, 'hot_products');
    breakdown.hot += u.added + u.updated;
    added += u.added; updated += u.updated; rejected += u.rejected;
  }

  // New arrivals — filter to orders >= 1000
  for (const kw of NEW_ARRIVAL_KEYWORDS) {
    const items = await runPintostudio({ mode: 'new_arrivals', keyword: kw, country: 'AU', limit: 300 });
    const filtered = items.filter((i) => i.orders >= DEFAULT_NEW_ARRIVAL_ORDERS_FLOOR);
    if (filtered.length === 0) errors.push(`new_arrivals:${kw}:empty`);
    const u = await upsertProducts(filtered, 'new_arrivals');
    breakdown.new_arrivals += u.added + u.updated;
    added += u.added; updated += u.updated; rejected += u.rejected;
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

  // Invalidate cached dashboard / stats / products responses now that the
  // underlying data changed. Scoped to the prefixes we actually cache.
  try {
    cache.clearPrefixes(['dashboard:', 'stats:', 'products:', 'categories:']);
  } catch {
    /* cache invalidation is best-effort */
  }

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
      hi_res_image_url: i.imageUrl,
      category: i.category ?? 'general',
      platform: 'aliexpress' as const,
      price_aud: i.priceAud,
      cost_price_aud: Math.round(i.priceAud * 0.4 * 100) / 100,
      supplier_cost_aud: Math.round(i.priceAud * 0.4 * 100) / 100,
      sold_count: i.orders,
      orders_count: i.orders,
      rating: i.rating,
      review_count: i.reviewCount,
      shop_name: i.sellerName ?? 'AliExpress',
      winning_score: winningScore,
      au_relevance: 'High',
      units_per_day: unitsPerDay,
      est_daily_revenue_aud: estDailyRevenueAud,
      est_monthly_revenue_aud: Math.round(estDailyRevenueAud * 30 * 100) / 100,
      profit_margin: 60,
      aliexpress_url: i.productUrl || null,
      aliexpress_id: i.sourceProductId,
      source_product_id: i.sourceProductId,
      source_url: i.productUrl,
      data_source: `apify-pintostudio:${source}`,
      source_currency: i.currency,
      is_active: true,
      scraped_at: nowIso,
      last_refreshed: nowIso,
      last_seen_at: nowIso,
      last_seen_in_scrape_at: nowIso,
    };
  });

  // Quality gate already enforced in mapItem (title>=5, image, price, orders>0).
  // Anything missing fails on the NOT NULL columns and is counted as rejected.

  let added = 0;
  let updated = 0;
  let rejected = 0;

  // Check existing by source_product_id in one round-trip.
  const ids = rows.map((r) => r.source_product_id).filter(Boolean);
  const existingIds = new Set<string>();
  if (ids.length > 0) {
    const { data } = await supabase
      .from('winning_products')
      .select('source_product_id')
      .in('source_product_id', ids);
    for (const row of data ?? []) {
      const v = (row as { source_product_id?: string }).source_product_id;
      if (v) existingIds.add(v);
    }
  }

  // Upsert in a single call — Supabase will INSERT or UPDATE per row.
  const { error } = await supabase
    .from('winning_products')
    .upsert(rows, { onConflict: 'source_product_id', ignoreDuplicates: false });

  if (error) {
    logErr('upsert', `${source}: ${error.message}`);
    return { added: 0, updated: 0, rejected: rows.length };
  }

  for (const r of rows) {
    if (existingIds.has(r.source_product_id)) updated++;
    else added++;
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
