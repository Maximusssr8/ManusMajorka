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
 *
 * v2 — 2026-04-15: 50+ queries, batched parallelism, quality scoring,
 * AU-specific + high-volume + seasonal buckets for 1000+ products per run.
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

const TARGET_SUCCESS_ROWS = 500;

/** Max items per actor call — higher = more products per query. */
const ITEMS_PER_QUERY = 50;
/** How many actor calls to run in parallel per batch (avoid Apify rate limits). */
const BATCH_SIZE = 10;
/** Delay between batches in ms to be kind to Apify. */
const INTER_BATCH_DELAY_MS = 1500;

// ─── Query definitions ──────────────────────────────────────────────────────

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

/**
 * Bucket 1 — Trending keywords (15 queries).
 * Viral, social-driven, impulse-buy products.
 */
const TRENDING_KEYWORDS: ReadonlyArray<string> = [
  'trending products 2026',
  'viral products',
  'hot selling items',
  'most ordered products',
  'best dropshipping products',
  'tiktok viral products',
  'amazon trending',
  'shopify best sellers',
  'winning products dropshipping',
  'high demand products',
  'fast selling items',
  'impulse buy products',
  'gadgets 2026',
  'new arrival hot',
  'flash deal trending',
];

/**
 * Bucket 2 — Category bestsellers (15 keyword queries).
 * Top sellers within specific niches.
 */
const CATEGORY_BESTSELLER_KEYWORDS: ReadonlyArray<string> = [
  'pet accessories bestseller',
  'kitchen gadgets hot',
  'home organization storage',
  'beauty skincare trending',
  'fitness equipment portable',
  'phone accessories popular',
  'car accessories 2026',
  'baby products trending',
  'outdoor camping gadgets',
  'jewelry accessories women',
  'men grooming tools',
  'LED lights home decor',
  'cleaning tools innovative',
  'office desk organizer',
  'fashion accessories trendy',
];

/**
 * Bucket 3 — AU-specific (10 queries).
 * Products relevant to the Australian market.
 */
const AU_SPECIFIC_KEYWORDS: ReadonlyArray<string> = [
  'australia warehouse ship',
  'AU delivery fast shipping',
  'australian dropshipping products',
  'ships from australia',
  'pet products australia popular',
  'kitchen AU bestseller',
  'home decor australia style',
  'summer products outdoor australia',
  'BBQ accessories australia',
  'beach products popular',
];

/**
 * Bucket 4 — High-volume movers (10 queries).
 * Proven mega-sellers with massive order counts.
 */
const HIGH_VOLUME_KEYWORDS: ReadonlyArray<string> = [
  '10000 orders product',
  '50000 orders aliexpress',
  '100000 sold items',
  'mega bestseller aliexpress',
  'most popular aliexpress 2026',
  'top rated 10000 orders',
  'bulk order popular',
  'wholesale trending items',
  'high volume consumer products',
  'mass market gadgets',
];

/**
 * Bucket 5 — Hidden gems (high rating, moderate orders).
 */
const HIDDEN_GEM_KEYWORDS: ReadonlyArray<string> = [
  'top rated products 4.8',
  'highly rated new product',
  'best reviewed gadget',
  'five star product aliexpress',
  'premium quality trending',
];

/**
 * Bucket 6 — Seasonal AU (opposite seasons to US/UK).
 * April in AU = autumn heading into winter.
 */
const SEASONAL_AU_KEYWORDS: ReadonlyArray<string> = [
  'winter warm blanket',
  'heated products electric',
  'cozy home winter gadgets',
  'warm clothing accessories',
  'indoor exercise equipment',
];

// ─── Per-bucket minimum order thresholds ─────────────────────────────────────

const MIN_ORDERS_TRENDING = 500;
const MIN_ORDERS_BESTSELLER_KW = 500;
const MIN_ORDERS_AU = 100;
const MIN_ORDERS_HIGH_VOLUME = 5000;
const MIN_ORDERS_HIDDEN_GEM = 1000;
const MIN_ORDERS_SEASONAL = 300;
const MIN_ORDERS_CATEGORY = 100;
const MIN_ORDERS_NEW_ARRIVAL = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  auWarehouseAvailable: boolean;
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
    auWarehouseAvailable: detectAuWarehouse(item),
  };
}

/**
 * AU warehouse detection — pintostudio responses are noisy; we look in
 * the obvious shipsFrom / warehouse fields plus any free-text "Ships
 * from: Australia" / "AU warehouse" occurrence in the listing payload.
 */
function detectAuWarehouse(item: Record<string, unknown>): boolean {
  const candidates = [
    item.shipsFrom, item.shipFrom, item.warehouse, item.warehouseLocation,
    item.shipFromCountry, item.country, item.location, item.deliveryCountry,
  ];
  for (const c of candidates) {
    const v = String(c ?? '').toLowerCase();
    if (!v) continue;
    if (v === 'au' || v === 'aus' || v === 'australia') return true;
    if (v.includes('australia') && (v.includes('ship') || v.includes('warehouse'))) return true;
  }
  // Free-text fallback — flatten the whole item to a single string and
  // grep for the marketing strings the AliExpress listing uses.
  try {
    const blob = JSON.stringify(item).toLowerCase();
    if (blob.includes('ships from: australia')) return true;
    if (blob.includes('ships from australia')) return true;
    if (blob.includes('au warehouse')) return true;
    if (blob.includes('australian warehouse')) return true;
  } catch {
    /* item is not serialisable — give up */
  }
  return false;
}

// ─── Quality scoring on ingest ───────────────────────────────────────────────

/**
 * Score a product 0–100 for dropshipping quality. Products scoring below
 * 30 are rejected before upsert.
 */
function ingestQualityScore(item: PintostudioItem): number {
  let score = 0;

  // Order volume (0-30 points)
  if (item.orders >= 100_000) score += 30;
  else if (item.orders >= 50_000) score += 25;
  else if (item.orders >= 10_000) score += 20;
  else if (item.orders >= 5_000) score += 15;
  else if (item.orders >= 1_000) score += 10;
  else if (item.orders >= 500) score += 5;

  // Rating (0-20 points)
  if (item.rating != null) {
    if (item.rating >= 4.8) score += 20;
    else if (item.rating >= 4.5) score += 15;
    else if (item.rating >= 4.0) score += 10;
    else if (item.rating >= 3.5) score += 5;
  }

  // Price sweet spot for dropshipping (0-15 points)
  if (item.priceAud >= 5 && item.priceAud <= 50) score += 15;
  else if (item.priceAud > 50 && item.priceAud <= 100) score += 10;
  else if (item.priceAud > 0) score += 5;

  // Has image (0-10 points)
  if (item.imageUrl) score += 10;

  // Title quality (0-10 points)
  if (item.title && item.title.length >= 10) score += 10;

  // Category assigned (0-5 points)
  if (item.category && item.category !== 'general') score += 5;

  // Ships from AU (0-10 points bonus)
  if (item.auWarehouseAvailable) score += 10;

  return score; // max 100
}

/** Minimum ingest quality score to accept a product. */
const MIN_INGEST_QUALITY_SCORE = 30;

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

/** A single job to run within the pipeline. */
interface PipelineJob {
  input: PintostudioInput;
  bucket: string;
  minOrders: number;
}

/**
 * Build the full job list: ~80 queries across 7 buckets.
 * Each job is an independent Apify actor call.
 */
function buildJobList(): PipelineJob[] {
  const jobs: PipelineJob[] = [];

  // Bucket 1 — Trending keywords (15 queries, AU market)
  for (const kw of TRENDING_KEYWORDS) {
    jobs.push({
      input: { mode: 'trending', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'trending',
      minOrders: MIN_ORDERS_TRENDING,
    });
  }

  // Bucket 2 — Category bestseller keywords (15 queries)
  for (const kw of CATEGORY_BESTSELLER_KEYWORDS) {
    jobs.push({
      input: { mode: 'hot_products', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'bestsellers',
      minOrders: MIN_ORDERS_BESTSELLER_KW,
    });
  }

  // Bucket 3 — AU-specific (10 queries)
  for (const kw of AU_SPECIFIC_KEYWORDS) {
    jobs.push({
      input: { mode: 'trending', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'trending',
      minOrders: MIN_ORDERS_AU,
    });
  }

  // Bucket 4 — High-volume movers (10 queries)
  for (const kw of HIGH_VOLUME_KEYWORDS) {
    jobs.push({
      input: { mode: 'hot_products', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'hot',
      minOrders: MIN_ORDERS_HIGH_VOLUME,
    });
  }

  // Bucket 5 — Hidden gems (5 queries)
  for (const kw of HIDDEN_GEM_KEYWORDS) {
    jobs.push({
      input: { mode: 'trending', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'trending',
      minOrders: MIN_ORDERS_HIDDEN_GEM,
    });
  }

  // Bucket 6 — Seasonal AU (5 queries)
  for (const kw of SEASONAL_AU_KEYWORDS) {
    jobs.push({
      input: { mode: 'hot_products', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'hot',
      minOrders: MIN_ORDERS_SEASONAL,
    });
  }

  // Bucket 7 — Category URL bestsellers (20 categories)
  for (const cat of BESTSELLER_CATEGORIES) {
    jobs.push({
      input: { mode: 'bestsellers', categoryUrl: cat.url, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'bestsellers',
      minOrders: MIN_ORDERS_CATEGORY,
    });
  }

  // Bucket 8 — New arrivals (5 keywords, lower threshold)
  const newArrivalKeywords = [
    'new arrival 2026',
    'just launched trending',
    'latest products hot',
    'new release gadget',
    'recently added bestseller',
  ];
  for (const kw of newArrivalKeywords) {
    jobs.push({
      input: { mode: 'new_arrivals', keyword: kw, country: 'AU', limit: ITEMS_PER_QUERY },
      bucket: 'new_arrivals',
      minOrders: MIN_ORDERS_NEW_ARRIVAL,
    });
  }

  return jobs;
}

/**
 * Execute a batch of jobs in parallel using Promise.allSettled.
 */
async function executeBatch(
  batch: PipelineJob[],
): Promise<Array<{ job: PipelineJob; items: PintostudioItem[] }>> {
  const results = await Promise.allSettled(
    batch.map(async (job) => {
      const items = await runPintostudio(job.input);
      return { job, items };
    }),
  );

  const out: Array<{ job: PipelineJob; items: PintostudioItem[] }> = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      out.push(r.value);
    }
  }
  return out;
}

/**
 * Runs the full pipeline: ~80 queries across 7 buckets, batched 10 at a time
 * with Promise.allSettled. Quality scoring + per-bucket order thresholds.
 * Writes one pipeline_logs row.
 */
export async function runApifyPintostudioPipeline(): Promise<PipelineResult> {
  const run = await startRun();
  const t0 = Date.now();
  const errors: string[] = [];
  const breakdown: SourceBreakdown = { trending: 0, bestsellers: 0, hot: 0, new_arrivals: 0 };
  let added = 0;
  let updated = 0;
  let rejected = 0;

  const jobs = buildJobList();
  log('pipeline', `built ${jobs.length} jobs across buckets`);

  // Deduplicate products across all batches by source_product_id
  const seenProductIds = new Set<string>();
  const allQualifiedItems: Array<{ item: PintostudioItem; source: string }> = [];

  // Split jobs into batches and execute
  const batches: PipelineJob[][] = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    batches.push(jobs.slice(i, i + BATCH_SIZE));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    log('pipeline', `executing batch ${batchIdx + 1}/${batches.length} (${batch.length} jobs)`);

    const results = await executeBatch(batch);

    for (const { job, items } of results) {
      if (items.length === 0) {
        const label = job.input.keyword ?? job.input.categoryUrl ?? job.input.mode;
        errors.push(`${job.bucket}:${label}:empty`);
        continue;
      }

      // Apply per-bucket minimum orders threshold
      const filtered = items.filter((item) => item.orders >= job.minOrders);

      // Apply quality scoring
      for (const item of filtered) {
        const score = ingestQualityScore(item);
        if (score < MIN_INGEST_QUALITY_SCORE) {
          rejected++;
          continue;
        }
        // Deduplicate across batches
        if (seenProductIds.has(item.sourceProductId)) continue;
        seenProductIds.add(item.sourceProductId);
        allQualifiedItems.push({ item, source: `${job.bucket}:${job.input.keyword ?? job.input.mode}` });
      }
    }

    // Delay between batches (except after the last)
    if (batchIdx < batches.length - 1) {
      await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
    }
  }

  log('pipeline', `collected ${allQualifiedItems.length} unique qualified products (rejected ${rejected} below quality threshold)`);

  // Upsert all qualified products in chunks of 500
  const UPSERT_CHUNK_SIZE = 500;
  for (let i = 0; i < allQualifiedItems.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = allQualifiedItems.slice(i, i + UPSERT_CHUNK_SIZE);
    const chunkItems = chunk.map((c) => c.item);
    const primarySource = chunk[0]?.source ?? 'mixed';
    const u = await upsertProducts(chunkItems, primarySource);
    added += u.added;
    updated += u.updated;
    rejected += u.rejected;

    // Attribute to breakdown buckets
    for (const c of chunk) {
      const bucket = c.source.split(':')[0];
      if (bucket in breakdown) {
        breakdown[bucket]++;
      }
    }
  }

  const total = added + updated;
  let status: 'success' | 'partial' | 'error';
  if (total === 0) status = 'error';
  else if (total >= TARGET_SUCCESS_ROWS && errors.length <= jobs.length / 2) status = 'success';
  else status = 'partial';

  const durationMs = Date.now() - t0;
  await finishRun(run, {
    products_added: added,
    products_updated: updated,
    products_rejected: rejected,
    source_breakdown: breakdown,
    status,
    error_message: errors.length > 0 ? errors.slice(0, 20).join('; ') : null,
  });

  // Invalidate cached dashboard / stats / products responses now that the
  // underlying data changed. Scoped to the prefixes we actually cache.
  try {
    cache.clearPrefixes(['dashboard:', 'stats:', 'products:', 'categories:']);
  } catch {
    /* cache invalidation is best-effort */
  }

  log('pipeline', `done: added=${added} updated=${updated} rejected=${rejected} duration=${durationMs}ms status=${status}`);

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
      au_warehouse_available: i.auWarehouseAvailable,
      is_active: true,
      scraped_at: nowIso,
      last_refreshed: nowIso,
      last_seen_at: nowIso,
      last_seen_in_scrape_at: nowIso,
    };
  });

  // Quality gate already enforced in mapItem (title>=5, image, price, orders>0)
  // plus ingestQualityScore >= 30.

  let added = 0;
  let updated = 0;
  const rejected = 0;

  // Check existing by source_product_id in one round-trip.
  const ids = rows.map((r) => r.source_product_id).filter(Boolean);
  const existingIds = new Set<string>();
  if (ids.length > 0) {
    // Supabase .in() has a limit; chunk if needed
    const IN_CHUNK = 500;
    for (let i = 0; i < ids.length; i += IN_CHUNK) {
      const chunk = ids.slice(i, i + IN_CHUNK);
      const { data } = await supabase
        .from('winning_products')
        .select('source_product_id')
        .in('source_product_id', chunk);
      for (const row of data ?? []) {
        const v = (row as { source_product_id?: string }).source_product_id;
        if (v) existingIds.add(v);
      }
    }
  }

  // Upsert in chunks to stay within Supabase payload limits
  const UPSERT_CHUNK = 200;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from('winning_products')
      .upsert(chunk, { onConflict: 'source_product_id', ignoreDuplicates: false });

    if (error) {
      logErr('upsert', `${source}: ${error.message}`);
      return { added: 0, updated: 0, rejected: rows.length };
    }
  }

  for (const r of rows) {
    if (existingIds.has(r.source_product_id)) updated++;
    else added++;
  }

  return { added, updated, rejected };
}

/**
 * Velocity-weighted score. Mirrors the existing formula used across the repo
 * (orders volume + rating quality + price fit). Clamp to 50-98.
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
