/**
 * Apify service — raw fetch REST API only (apify-client npm is BANNED)
 * Primary actor: pintostudio~aliexpress-product-search (paid rental required)
 * Fallback: apify~playwright-scraper (free but lower success rate on AE)
 * Fire-and-forget pattern: start run -> return runId -> harvest cron collects
 */

const APIFY_BASE = 'https://api.apify.com/v2';

/** Primary AliExpress search actor — requires rental at console.apify.com */
export const ALIEXPRESS_ACTOR = 'pintostudio~aliexpress-product-search';
/** Fallback AliExpress scraper — free, lower success rate */
export const ALIEXPRESS_FALLBACK_ACTOR = 'apify~playwright-scraper';

function getToken(): string {
  return process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || '';
}

export interface ApifyProduct {
  productId: string;
  title: string;
  priceUsd: number;
  originalPriceUsd?: number; // AliExpress list/crossed-out price; undefined if no discount
  imageUrl: string;
  productUrl: string;
  orders: number;
  rating: number;
  reviewCount: number;
  category: string;
  supplier: string;
  source: 'aliexpress' | 'tiktok_shop';
}

/** Start an Apify actor run — fire and forget, returns runId */
export async function startApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 120
): Promise<string | null> {
  const token = getToken();
  if (!token) { console.error('[apify-svc] No APIFY_API_KEY set'); return null; }

  try {
    const url = `${APIFY_BASE}/acts/${actorId}/runs?token=${token}&timeout=${timeoutSecs}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input), // FLAT input — never nest under {input:{}}
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[apify-svc] Start failed ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const data = await res.json() as { data?: { id?: string } };
    return data?.data?.id ?? null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[apify-svc] startApifyActor error:', msg);
    return null;
  }
}

/** Fetch dataset items from a completed run */
export async function fetchApifyDataset(datasetId: string, limit = 200): Promise<unknown[]> {
  const token = getToken();
  try {
    const url = `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&limit=${limit}&clean=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const items = await res.json();
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

/** Check run status */
export async function getApifyRunStatus(runId: string): Promise<{ status: string; datasetId?: string }> {
  const token = getToken();
  try {
    const url = `${APIFY_BASE}/actor-runs/${runId}?token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json() as { data?: { status?: string; defaultDatasetId?: string } };
    return {
      status: data?.data?.status ?? 'UNKNOWN',
      datasetId: data?.data?.defaultDatasetId,
    };
  } catch {
    return { status: 'UNKNOWN' };
  }
}

/**
 * Start AliExpress keyword search via pintostudio actor (primary).
 * Input: { keyword, maxItems: 50, sortBy: 'ORDERS', shipTo: 'AU' }
 * Returns runId for harvest cron to pick up.
 */
export async function startAliExpressKeywordScrape(
  keyword: string,
  maxResults = 50
): Promise<string | null> {
  const token = getToken();

  // Try pintostudio primary actor first
  try {
    const url = `${APIFY_BASE}/acts/${ALIEXPRESS_ACTOR}/runs?token=${token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword,
        maxItems: maxResults,
        sortBy: 'ORDERS',   // Real demand signal — sorted by total orders
        shipTo: 'AU',        // AU-shippable products only
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json() as { data?: { id?: string } };
      const runId = data?.data?.id ?? null;
      if (runId) {
        console.info(`[apify-svc] pintostudio run started: ${runId} (keyword: ${keyword})`);
        return runId;
      }
    }

    // If actor not rented or failed, log and fall through to playwright fallback
    const errText = await res.text().catch(() => '');
    if (errText.includes('actor-is-not-rented')) {
      console.warn('[apify-svc] pintostudio actor not rented — falling back to playwright scraper');
    } else {
      console.error(`[apify-svc] pintostudio failed ${res.status}: ${errText.slice(0, 100)}`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[apify-svc] pintostudio error:', msg);
  }

  // DISABLED — playwright-scraper fallback produced 0 results for AE since Apr 1.
  // Pintostudio rental must be restored at console.apify.com. Returning null here
  // fails loudly so the caller + pipeline_logs surface the real problem instead
  // of silently writing zero rows every cron tick.
  console.error('[apify-svc] pintostudio unavailable and playwright fallback is disabled — check APIFY rental');
  return null;
}

/** Map pintostudio item to ApifyProduct */
export function mapToApifyProduct(item: Record<string, unknown>, category: string): ApifyProduct | null {
  const title = String(item.title || item.name || item.productTitle || '');
  // pintostudio returns price, priceMin, salePrice
  const priceUsd = parseFloat(String(item.price || item.priceMin || item.salePrice || '0').replace(/[^0-9.]/g, ''));
  if (!title || priceUsd <= 0) return null;

  // Orders: pintostudio returns sold, orders, totalSold, monthlySales — some have 'k' suffix
  const ordersRaw = String(item.sold || item.orders || item.totalSold || item.monthlySales || '0');
  let orders = parseInt(ordersRaw.replace(/[^0-9]/g, ''), 10) || 0;
  if (ordersRaw.toLowerCase().includes('k')) orders = Math.round(parseFloat(ordersRaw) * 1000);

  // Capture original/list price (shown as crossed-out on AliExpress)
  const rawOriginal = item.originalPrice || item.original_price || item.listPrice || item.marketPrice;
  const originalPriceUsd = rawOriginal
    ? parseFloat(String(rawOriginal).replace(/[^0-9.]/g, ''))
    : undefined;

  return {
    productId: String(item.id || item.productId || item.itemId || `ae-${Date.now()}`).slice(0, 50),
    title: title.slice(0, 255),
    priceUsd,
    originalPriceUsd: originalPriceUsd && originalPriceUsd > priceUsd ? originalPriceUsd : undefined,
    imageUrl: String(item.image || item.imageUrl || item.mainImage || item.thumbnail || ''),
    productUrl: String(item.url || item.link || item.productUrl || ''),
    orders,
    rating: parseFloat(String(item.rating || item.starRating || item.score || '0')) || 0,
    reviewCount: parseInt(String(item.reviews || item.reviewCount || item.commentCount || '0'), 10) || 0,
    category,
    supplier: String(item.storeName || item.seller || item.shopName || 'AliExpress'),
    source: 'aliexpress',
  };
}
