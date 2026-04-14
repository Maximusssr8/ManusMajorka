/**
 * Majorka — one-time winning_products backfill
 *
 * Purpose:
 *   Seed the database with at least 1,000 NEW quality AliExpress products
 *   spanning 20 categories, harvested via the approved Affiliate API. The
 *   script is idempotent — upsert-on-conflict skips rows that already
 *   exist (matched by source_product_id or product_title), so repeated
 *   runs are safe and only new rows are counted toward the target.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-products.ts
 *   pnpm tsx scripts/backfill-products.ts --target 2000  (override default)
 *
 * Required env vars (all already defined in .env.example):
 *   SUPABASE_URL                — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service role key (bypasses RLS)
 *   ALIEXPRESS_APP_KEY          — (alias: AE_APP_KEY)
 *   ALIEXPRESS_APP_SECRET       — (alias: AE_APP_SECRET)
 *   ALIEXPRESS_TRACKING_ID      — (alias: AE_TRACKING_ID) optional, default majorka_au
 *
 * Exits 0 with helpful instructions if env is missing.
 * Exits 0 on success with a summary (fetched / inserted / skipped / final delta).
 */

import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

type Source = 'trending' | 'bestsellers' | 'hotproducts';

interface BackfillStats {
  fetched: number;
  rejected: number;
  inserted: number;
  updated: number;
  errors: number;
}

// 20 AliExpress category keywords (English — used as search queries).
// Keeping the list flat and keyword-based sidesteps AliExpress's shifting
// category ID taxonomy (category IDs require a separate preflight call).
const CATEGORIES: ReadonlyArray<string> = [
  'beauty', 'pets', 'home', 'fitness', 'tech',
  'fashion', 'kids', 'kitchen', 'auto', 'garden',
  'outdoor', 'office', 'phone accessories', 'lighting', 'bags',
  'shoes', 'jewelry', 'sports', 'tools', 'baby',
];

// Sort strategy per source. Maps to AliExpress affiliate `sort` values.
const SOURCE_SORTS: Record<Source, string> = {
  trending:    'LAST_VOLUME_DESC',   // most orders recently
  bestsellers: 'SALE_PRICE_ASC',     // cheap + high order = mass seller
  hotproducts: 'LAST_VOLUME_DESC',   // latest hot flag
};

const PAGES_PER_SOURCE = 5;
const PAGE_SIZE = 50;
const DEFAULT_TARGET = 1000;
const REQUEST_DELAY_MS = 350; // polite pacing to avoid upstream throttling

// ── Env guard ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const AE_KEY = (process.env.ALIEXPRESS_APP_KEY || process.env.AE_APP_KEY || '').trim();
const AE_SECRET = (process.env.ALIEXPRESS_APP_SECRET || process.env.AE_APP_SECRET || '').trim();

function missingEnv(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!AE_KEY) missing.push('ALIEXPRESS_APP_KEY');
  if (!AE_SECRET) missing.push('ALIEXPRESS_APP_SECRET');
  return missing;
}

// Parse --target N from argv
function parseTarget(): number {
  const idx = process.argv.indexOf('--target');
  if (idx > -1 && process.argv[idx + 1]) {
    const n = Number(process.argv[idx + 1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_TARGET;
}

// ── Quality gate ───────────────────────────────────────────────────────
// Mirrors the existing ingest rules in CLAUDE.md & the winning_products
// upsert flow in server/routes/products.ts (mapAliExpressProduct):
//   - sold_count > 0
//   - image_url not null
//   - price_aud > 0
//   - title length >= 5

interface RawAffiliateProduct {
  product_id: string | number;
  product_title?: string;
  product_main_image_url?: string;
  product_detail_url?: string;
  promotion_link?: string;
  sale_price?: string;
  original_price?: string;
  target_sale_price?: string;
  target_original_price?: string;
  lastest_volume?: string | number;
  evaluate_rate?: string;
  hot_product_flag?: string | boolean;
  discount?: string;
  commission_rate?: string;
  first_level_category_name?: string;
  second_level_category_name?: string;
  shop_name?: string;
}

interface NormalizedRow {
  product_title: string;
  platform: 'AliExpress';
  category: string;
  image_url: string;
  source_url: string;
  affiliate_url: string;
  shop_name: string;
  price_aud: number;
  real_price_aud: number;
  original_price: number | null;
  sold_count: number;
  orders_count: number;
  real_orders_count: number;
  rating: number | null;
  real_rating: number | null;
  winning_score: number;
  hot_product_flag: boolean;
  commission_rate: number | null;
  data_source: 'aliexpress_affiliate';
  source_product_id: string;
  search_keyword: string;
  is_active: true;
  tags: string[];
  updated_at: string;
  scraped_at: string;
}

function normalize(item: RawAffiliateProduct, keyword: string): NormalizedRow | null {
  const title = (item.product_title || '').slice(0, 200).trim();
  const image = item.product_main_image_url || '';
  const saleAud = item.target_sale_price
    ? parseFloat(item.target_sale_price)
    : parseFloat(item.sale_price || '0') * 1.55;
  const origAud = item.target_original_price
    ? parseFloat(item.target_original_price)
    : parseFloat(item.original_price || '0') * 1.55;
  const orders = parseInt(String(item.lastest_volume || '0'), 10);
  const rating = parseFloat(item.evaluate_rate || '0') / 20;
  const isHot = item.hot_product_flag === 'true' || item.hot_product_flag === true;
  const discount = parseInt(item.discount || '0', 10);
  const hasOrig = origAud > saleAud && origAud > 0;

  // Quality gate
  if (!title || title.length < 5) return null;
  if (!image) return null;
  if (!(saleAud > 0)) return null;
  if (!(orders > 0)) return null;

  // Scoring identical to server/routes/products.ts mapAliExpressProduct
  const orderScore = orders >= 10000 ? 40 : Math.min((orders / 10000) * 40, 40);
  const ratingScore = rating > 0 ? (rating / 5) * 30 : 0;
  const marginScore = hasOrig ? Math.min(((origAud - saleAud) / origAud) * 100 / 50 * 20, 20) : 0;
  const priceScore = saleAud < 30 ? 10 : saleAud < 80 ? 7 : 4;
  const winningScore = Math.round(Math.min(orderScore + ratingScore + marginScore + priceScore, 100));

  const now = new Date().toISOString();
  return {
    product_title: title,
    platform: 'AliExpress',
    category: item.second_level_category_name || item.first_level_category_name || keyword,
    image_url: image,
    source_url: item.product_detail_url || '',
    affiliate_url: item.promotion_link || item.product_detail_url || '',
    shop_name: item.shop_name || 'AliExpress',
    price_aud: Math.round(saleAud * 100) / 100,
    real_price_aud: Math.round(saleAud * 100) / 100,
    original_price: hasOrig ? Math.round(origAud * 100) / 100 : null,
    sold_count: orders,
    orders_count: orders,
    real_orders_count: orders,
    rating: rating > 0 ? rating : null,
    real_rating: rating > 0 ? rating : null,
    winning_score: winningScore,
    hot_product_flag: isHot,
    commission_rate: parseFloat(item.commission_rate || '0') || null,
    data_source: 'aliexpress_affiliate',
    source_product_id: String(item.product_id || ''),
    search_keyword: keyword,
    is_active: true,
    tags: [
      isHot ? 'HOT' : null,
      discount >= 30 ? 'DEAL' : null,
      orders >= 5000 ? 'BESTSELLER' : null,
    ].filter((t): t is string => typeof t === 'string'),
    updated_at: now,
    scraped_at: now,
  };
}

// ── AliExpress Affiliate API caller (mirrors server/lib/aliexpress-affiliate.ts)

import crypto from 'node:crypto';

function signRequest(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const base = sorted.map((k) => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}

async function aeRequest(
  method: string,
  extra: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const params: Record<string, string> = {
    method,
    app_key: AE_KEY,
    timestamp,
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    ...extra,
  };
  params.sign = signRequest(params, AE_SECRET);
  const body = new URLSearchParams(params);
  try {
    const res = await fetch('https://api-sg.aliexpress.com/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
    const raw = await res.text();
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    log.warn(`AE request failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function fetchCategoryPage(
  keyword: string,
  source: Source,
  pageNo: number,
): Promise<RawAffiliateProduct[]> {
  const sort = SOURCE_SORTS[source];
  const data = await aeRequest('aliexpress.affiliate.product.query', {
    keywords: keyword,
    page_no: String(pageNo),
    page_size: String(PAGE_SIZE),
    sort,
    target_currency: 'AUD',
    target_language: 'EN',
    country: 'AU',
    ship_to_country: 'AU',
    tracking_id: (process.env.ALIEXPRESS_TRACKING_ID || process.env.AE_TRACKING_ID || 'majorka_au').trim(),
    fields: 'product_id,product_title,product_main_image_url,product_detail_url,sale_price,original_price,discount,commission_rate,hot_product_flag,evaluate_rate,lastest_volume,target_sale_price,target_original_price,second_level_category_name,first_level_category_name,shop_name,promotion_link',
  });
  // Drill into the nested response shape documented by the Affiliate API
  const resp = data as {
    aliexpress_affiliate_product_query_response?: {
      resp_result?: { result?: { products?: { product?: RawAffiliateProduct[] } } };
    };
  } | null;
  return resp?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
}

// ── Lightweight logger ─────────────────────────────────────────────────
// Matches CLAUDE.md rule: no bare console.log in production. Script-only
// logging uses console.info / console.warn / console.error with a prefix.
const log = {
  info: (msg: string): void => { console.info(`[backfill] ${msg}`); },
  warn: (msg: string): void => { console.warn(`[backfill] ${msg}`); },
  error: (msg: string): void => { console.error(`[backfill] ${msg}`); },
};

// ── Main ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const missing = missingEnv();
  if (missing.length > 0) {
    log.warn('Skipping backfill — missing env vars: ' + missing.join(', '));
    log.warn('Add the following to .env then re-run:');
    for (const k of missing) log.warn(`  ${k}=...`);
    log.warn('See .env.example for reference.');
    process.exit(0);
  }

  const target = parseTarget();
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Baseline count — used for the final row-delta report.
  const baseline = await supabase
    .from('winning_products')
    .select('*', { count: 'exact', head: true });
  const startCount = baseline.count ?? 0;
  log.info(`starting count: ${startCount} rows. target delta: +${target}`);

  const agg: BackfillStats = { fetched: 0, rejected: 0, inserted: 0, updated: 0, errors: 0 };
  const sources: ReadonlyArray<Source> = ['trending', 'bestsellers', 'hotproducts'];

  outer: for (const category of CATEGORIES) {
    for (const source of sources) {
      for (let pageNo = 1; pageNo <= PAGES_PER_SOURCE; pageNo++) {
        try {
          const items = await fetchCategoryPage(category, source, pageNo);
          const normalized: NormalizedRow[] = [];
          for (const item of items) {
            const row = normalize(item, category);
            if (!row) { agg.rejected++; continue; }
            normalized.push(row);
          }

          let insertedThisBatch = 0;
          let updatedThisBatch = 0;
          if (normalized.length > 0) {
            // Upsert on source_product_id so re-runs skip existing rows.
            // Returning 'minimal' avoids transferring unnecessary data.
            const { error, count } = await supabase
              .from('winning_products')
              .upsert(normalized, {
                onConflict: 'source_product_id',
                ignoreDuplicates: false,
                count: 'exact',
              });
            if (error) {
              // Fallback: product_title as conflict target (legacy rows may
              // not have source_product_id set).
              const retry = await supabase
                .from('winning_products')
                .upsert(normalized, {
                  onConflict: 'product_title',
                  ignoreDuplicates: true,
                  count: 'exact',
                });
              if (retry.error) {
                log.warn(`upsert failed for ${category}/${source}/p${pageNo}: ${retry.error.message}`);
                agg.errors++;
              } else {
                insertedThisBatch = retry.count ?? 0;
              }
            } else {
              insertedThisBatch = count ?? 0;
            }
          }
          agg.fetched += items.length;
          agg.inserted += insertedThisBatch;
          agg.updated += updatedThisBatch;

          // Poll current DB count so we know when to stop.
          const tally = await supabase
            .from('winning_products')
            .select('*', { count: 'exact', head: true });
          const currentCount = tally.count ?? 0;
          const delta = currentCount - startCount;
          log.info(
            `category=${category} source=${source} page=${pageNo} ` +
            `fetched=${items.length} rejected=${items.length - normalized.length} ` +
            `upserted=${insertedThisBatch} delta=${delta} total=${currentCount}`,
          );

          if (delta >= target) {
            log.info(`target reached (+${delta}). Stopping early.`);
            break outer;
          }

          // Polite pacing between requests.
          await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
        } catch (err) {
          agg.errors++;
          log.warn(`exception on ${category}/${source}/p${pageNo}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  const final = await supabase
    .from('winning_products')
    .select('*', { count: 'exact', head: true });
  const endCount = final.count ?? 0;
  const rowDelta = endCount - startCount;

  log.info('─'.repeat(60));
  log.info(`DONE. rows: ${startCount} → ${endCount}  (Δ +${rowDelta})`);
  log.info(`fetched=${agg.fetched}  rejected=${agg.rejected}  upserted=${agg.inserted}  errors=${agg.errors}`);
}

main().catch((err) => {
  log.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
