/**
 * AliExpress Bestseller URL Scraper (Trend-First, No Keywords)
 * Scrapes AE's own curated bestseller/trending pages.
 * AliExpress decides what's trending — we just capture and enrich it.
 *
 * Uses pintostudio~aliexpress-product-search actor.
 * Field: "query" (not "keyword") — empty string triggers URL browse mode.
 * Max 2 concurrent runs (4096MB each = 8192MB Apify limit).
 */

import { startApifyActor, fetchApifyDataset, getApifyRunStatus, ALIEXPRESS_ACTOR } from '../services/apify';
import { getSupabaseAdmin } from '../_core/supabase';
import { calculateTrendScore } from '../lib/trendScoring';

const AUD = 1.55;

// AliExpress curated bestseller/trending pages — no category bias
export const AE_BESTSELLER_URLS = [
  { url: 'https://www.aliexpress.com/gcp/300000604/best-sellers.html',                      label: 'Best Sellers' },
  { url: 'https://www.aliexpress.com/gcp/300000512/nnmixchannel.html',                      label: 'Hot Products' },
  { url: 'https://www.aliexpress.com/promotion/promotion_topPicksList.html',                 label: 'Top Picks' },
  { url: 'https://www.aliexpress.com/p/aliexpress-choice/index.html',                       label: 'AE Choice' },
  { url: 'https://www.aliexpress.com/gcp/300000528/flash-deals.html',                       label: 'Flash Deals' },
  { url: 'https://www.aliexpress.com/wholesale?SortType=total_tranpro_desc',                 label: 'Top Orders' },
];

const BULK_KW = ['lot ', 'bulk', 'wholesale', 'pcs ', 'pack of', '100pcs', '50pcs', '20pcs'];

/**
 * Parse pintostudio's nested schema.
 * Actor returns: [{ data: { content: [product, ...] } }]
 * Each product has: title.displayTitle, prices.originalPrice.minPrice,
 *   trade.realTradeCount, evaluation.starRating, image.imgUrl, productId
 */
function extractProducts(rawItems: Record<string, unknown>[]): Record<string, unknown>[] {
  const products: Record<string, unknown>[] = [];
  for (const item of rawItems) {
    // Nested structure: item.data.content[]
    const content = (item as { data?: { content?: unknown[] } }).data?.content;
    if (Array.isArray(content)) {
      products.push(...(content as Record<string, unknown>[]));
    } else {
      // Flat item (fallback)
      products.push(item);
    }
  }
  return products;
}

function getTitle(item: Record<string, unknown>): string {
  const t = item.title as { displayTitle?: string } | string | undefined;
  if (typeof t === 'object' && t?.displayTitle) return t.displayTitle;
  return String(item.title || item.name || '');
}

function getPrice(item: Record<string, unknown>): number {
  const p = item.prices as { originalPrice?: { minPrice?: number }; salePrice?: { minPrice?: number } } | undefined;
  if (p?.salePrice?.minPrice) return p.salePrice.minPrice;
  if (p?.originalPrice?.minPrice) return p.originalPrice.minPrice;
  return parseFloat(String(item.price || item.priceMin || '0').replace(/[^\d.]/g, ''));
}

function getOrders(item: Record<string, unknown>): number {
  const trade = item.trade as { realTradeCount?: string; tradeDesc?: string } | undefined;
  if (trade?.realTradeCount) return parseInt(trade.realTradeCount.replace(/[^\d]/g, ''), 10) || 0;
  const raw = String(item.sold || item.orders || item.totalSold || '0');
  let n = parseInt(raw.replace(/[^\d]/g, ''), 10) || 0;
  if (raw.toLowerCase().includes('k')) n = Math.round(parseFloat(raw) * 1000);
  return n;
}

function getRating(item: Record<string, unknown>): number {
  const ev = item.evaluation as { starRating?: number } | undefined;
  if (ev?.starRating) return ev.starRating;
  return parseFloat(String(item.rating || item.starRating || '0')) || 0;
}

function getImage(item: Record<string, unknown>): string {
  const img = item.image as { imgUrl?: string } | undefined;
  let url = img?.imgUrl || String(item.imageUrl || item.mainImage || '');
  if (url && !url.startsWith('http')) url = 'https:' + url;
  return url;
}

function getProductUrl(item: Record<string, unknown>): string {
  const pid = String(item.productId || item.redirectedId || item.id || '');
  if (pid) return `https://www.aliexpress.com/item/${pid}.html`;
  return String(item.url || item.link || '');
}

function qualityGate(item: Record<string, unknown>): boolean {
  const title  = getTitle(item);
  const price  = getPrice(item);
  const img    = getImage(item);
  const orders = getOrders(item);

  if (title.length <= 10) return false;
  if (BULK_KW.some(k => title.toLowerCase().includes(k))) return false;
  if (price < 2 || price > 150) return false;
  if (!img.startsWith('http')) return false;
  if (orders < 50) return false;
  return true;
}

function mapItem(item: Record<string, unknown>): Record<string, unknown> {
  const title    = getTitle(item).slice(0, 255);
  const priceUsd = getPrice(item);
  const priceAud = Math.round(priceUsd * AUD * 100) / 100;
  const costAud  = Math.round(priceAud * 0.35 * 100) / 100;
  const orders   = getOrders(item);
  const rating   = getRating(item);
  const img      = getImage(item);
  const url      = getProductUrl(item);
  const prodId   = String(item.productId || item.redirectedId || item.id || '').slice(0, 50);

  const { score, breakdown } = calculateTrendScore({
    source: 'aliexpress', orders, rating,
    priceUsd, costUsd: costAud / AUD,
  });

  return {
    product_title:      title,
    category:           '',  // Haiku assigns in enrichment step
    platform:           'aliexpress',
    image_url:          img,
    price_aud:          priceAud,
    cost_price_aud:     costAud,
    supplier_cost_aud:  costAud,
    profit_margin:      priceAud > 0 ? Math.round((priceAud - costAud) / priceAud * 100) : 60,
    winning_score:      score,
    trend:              orders > 10000 ? 'Exploding' : orders > 2000 ? 'Rising' : 'Steady',
    competition_level:  'Medium',
    orders_count:       orders,
    real_orders_count:  orders,
    real_price_usd:     priceUsd,
    real_price_aud:     priceAud,
    rating,
    data_source:        'aliexpress_scraper',
    source_url:         url,
    aliexpress_url:     url,
    aliexpress_id:      prodId,
    link_status:        'verified',
    link_verified_at:   new Date().toISOString(),
    tiktok_signal:      orders > 5000,
    score_breakdown:    breakdown,
    tags:               ['ae-bestseller', 'pintostudio'],
    scraped_at:         new Date().toISOString(),
    created_at:         new Date().toISOString(),
    updated_at:         new Date().toISOString(),
  };
}

/**
 * Launch pintostudio runs for all AE bestseller URLs.
 * Fire-and-forget — returns runIds for harvest cron.
 */
export async function launchAEBestsellerScrapes(): Promise<string[]> {
  const runIds: string[] = [];
  for (const entry of AE_BESTSELLER_URLS) {
    const runId = await startApifyActor(ALIEXPRESS_ACTOR, {
      query:     '',               // empty = URL browse mode
      startUrls: [{ url: entry.url }],
      maxItems:  200,
      sortBy:    'ORDERS',
      shipTo:    'AU',
    }, 600).catch(() => null);

    if (runId) {
      runIds.push(runId);
      console.info(`[ae-bestseller] Started "${entry.label}": ${runId}`);
    } else {
      console.warn(`[ae-bestseller] Failed to start "${entry.label}"`);
    }
    await new Promise(r => setTimeout(r, 600));
  }
  return runIds;
}

/**
 * Harvest completed pintostudio runs and upsert to winning_products.
 * Called by harvest cron after launchAEBestsellerScrapes().
 */
export async function harvestAEBestsellerRuns(runIds: string[]): Promise<number> {
  const supabase = getSupabaseAdmin();
  let total = 0;

  for (const runId of runIds) {
    const { status, datasetId } = await getApifyRunStatus(runId);
    if (status !== 'SUCCEEDED' || !datasetId) {
      console.warn(`[ae-bestseller] Run ${runId} status: ${status}`);
      continue;
    }

    const rawItems = await fetchApifyDataset(datasetId, 300) as Record<string, unknown>[];
    const items = extractProducts(rawItems);
    const rows = items.filter(qualityGate).map(mapItem);
    if (!rows.length) continue;

    const { error } = await supabase.from('winning_products').upsert(rows as Parameters<typeof supabase.from>[0][], {
      onConflict: 'aliexpress_id',
      ignoreDuplicates: true,
    } as { onConflict: string; ignoreDuplicates: boolean });

    if (error) console.error('[ae-bestseller] DB error:', error.message);
    else {
      total += rows.length;
      console.info(`[ae-bestseller] Harvested ${rows.length} from run ${runId}`);
    }
  }

  return total;
}
