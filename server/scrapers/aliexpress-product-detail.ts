/**
 * Phase 2: AliExpress Product Detail Scraper
 * Launches Apify actor to fetch real prices/orders/ratings for existing products.
 * Fire-and-forget pattern — results harvested later by cron.
 */
import { getSupabaseAdmin } from '../_core/supabase';
import { startApifyRun, fetchDatasetItems } from '../lib/apifyFireForget';

const USD_TO_AUD = 1.55;
const ACTOR_ID = 'clockworks~aliexpress-scraper';
const MAX_PER_RUN = 50;

// ── parseOrders ──────────────────────────────────────────────────────────

export function parseOrders(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return Math.round(raw);

  const s = String(raw).trim().toLowerCase().replace(/[+,\s]/g, '');

  // Handle "2.6k sold" or "2.6k"
  const kMatch = s.match(/^([\d.]+)k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const mMatch = s.match(/^([\d.]+)m/);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1_000_000);

  // Strip trailing non-numeric like "sold"
  const numStr = s.replace(/[^\d.]/g, '');
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// ── Launch scrape ────────────────────────────────────────────────────────

export async function launchAEDetailScrape(
  productIds?: string[]
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  let ids = productIds;
  if (!ids || ids.length === 0) {
    // Fetch unverified products with aliexpress_id
    const { data, error } = await supabase
      .from('winning_products')
      .select('aliexpress_id')
      .not('aliexpress_id', 'is', null)
      .or('link_status.is.null,link_status.neq.verified')
      .limit(MAX_PER_RUN);

    if (error) {
      console.error('[ae-detail] Query error:', error.message);
      return null;
    }
    ids = (data || [])
      .map((r: { aliexpress_id: string | null }) => r.aliexpress_id)
      .filter((id): id is string => !!id);
  }

  if (ids.length === 0) {
    console.log('[ae-detail] No unverified products to scrape');
    return null;
  }

  // Trim to max
  const batch = ids.slice(0, MAX_PER_RUN);
  console.log(`[ae-detail] Launching scrape for ${batch.length} products`);

  const result = await startApifyRun(ACTOR_ID, 'ae_product_detail', {
    productIds: batch,
    maxItems: MAX_PER_RUN,
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL'],
    },
  });

  return result?.runId || null;
}

// ── Process results ──────────────────────────────────────────────────────

function extractAliexpressId(item: Record<string, unknown>): string | null {
  // Try direct field
  if (item.itemId) return String(item.itemId);
  if (item.productId) return String(item.productId);
  if (item.id) return String(item.id);

  // Extract from URL
  const url = String(item.url || item.link || '');
  const match = url.match(/\/(\d{8,15})\.html/) || url.match(/item\/(\d{8,15})/);
  return match ? match[1] : null;
}

export async function processAEDetailResults(
  runId: string,
  datasetId: string
): Promise<{ updated: number; dead: number }> {
  const items = await fetchDatasetItems(datasetId, 200);
  if (items.length === 0) {
    console.log('[ae-detail] No items in dataset');
    return { updated: 0, dead: 0 };
  }

  const supabase = getSupabaseAdmin();
  let updated = 0;
  let dead = 0;

  for (const item of items) {
    const aliexpressId = extractAliexpressId(item);
    if (!aliexpressId) continue;

    const isAvailable = item.isAvailable !== false;
    const linkStatus = isAvailable ? 'verified' : 'dead';
    const now = new Date().toISOString();

    if (!isAvailable) {
      // Mark as dead
      const { error } = await supabase
        .from('winning_products')
        .update({ link_status: 'dead', link_verified_at: now })
        .eq('aliexpress_id', aliexpressId);

      if (!error) dead++;
      continue;
    }

    // Map real data
    const realPriceUsd = parseFloat(String(item.price || item.originalPrice || 0));
    const realPriceAud = parseFloat((realPriceUsd * USD_TO_AUD).toFixed(2));
    const realOrdersCount = parseOrders(item.tradeCount || item.soldCount || item.orders);
    const realRating = parseFloat(String(item.starRating || item.rating || 0));
    const realReviewCount = parseInt(String(item.reviewCount || item.totalEvalNum || 0), 10) || 0;

    const updateData: Record<string, unknown> = {
      link_status: linkStatus,
      link_verified_at: now,
    };

    // Only set real values if they're meaningful
    if (realPriceUsd > 0) {
      updateData.real_price_usd = realPriceUsd;
      updateData.real_price_aud = realPriceAud;
    }
    if (realOrdersCount > 0) updateData.real_orders_count = realOrdersCount;
    if (realRating > 0) updateData.real_rating = realRating;
    if (realReviewCount > 0) updateData.real_review_count = realReviewCount;

    const { error } = await supabase
      .from('winning_products')
      .update(updateData)
      .eq('aliexpress_id', aliexpressId);

    if (!error) updated++;
  }

  console.log(`[ae-detail] Processed run ${runId}: ${updated} updated, ${dead} dead`);
  return { updated, dead };
}
