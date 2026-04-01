/**
 * Apify service — raw fetch REST API only (apify-client npm is BANNED)
 * Uses fire-and-forget pattern: start run -> return runId -> harvest cron collects
 */

const APIFY_BASE = 'https://api.apify.com/v2';

function getToken(): string {
  return process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || '';
}

export interface ApifyProduct {
  productId: string;
  title: string;
  priceUsd: number;
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
 * Start AliExpress keyword search via playwright-scraper.
 * Returns runId for harvest cron to pick up.
 */
export async function startAliExpressKeywordScrape(
  keyword: string,
  maxResults = 60
): Promise<string | null> {
  const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}&SortType=total_tranpro_desc`;

  const input = {
    startUrls: [{ url: searchUrl }],
    pageFunction: `async function pageFunction(context) {
      const { page } = context;
      await page.waitForTimeout(3000);
      const items = await page.$$eval('[class*="product-snippet"]', cards => {
        return cards.slice(0, ${maxResults}).map(card => {
          const title = card.querySelector('[class*="title"]')?.textContent?.trim() || '';
          const priceEl = card.querySelector('[class*="price"]');
          const price = priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0';
          const img = card.querySelector('img')?.src || card.querySelector('img')?.getAttribute('data-src') || '';
          const link = card.querySelector('a')?.href || '';
          const orders = card.querySelector('[class*="sold"]')?.textContent?.replace(/[^0-9]/g, '') || '0';
          const rating = card.querySelector('[class*="star"]')?.textContent?.replace(/[^0-9.]/g, '') || '0';
          return { title, price: parseFloat(price), imageUrl: img, productUrl: link, orders: parseInt(orders), rating: parseFloat(rating) };
        }).filter(p => p.title && p.price > 0);
      });
      return items;
    }`,
    proxyConfiguration: { useApifyProxy: true },
    maxRequestRetries: 2,
  };

  return startApifyActor('apify~playwright-scraper', input, 120);
}

/** Map raw playwright-scraped item to ApifyProduct */
export function mapToApifyProduct(item: Record<string, unknown>, category: string): ApifyProduct | null {
  const title = String(item.title || item.name || '');
  const priceUsd = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, ''));
  if (!title || priceUsd <= 0) return null;

  return {
    productId: String(item.productId || item.id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`),
    title: title.slice(0, 255),
    priceUsd,
    imageUrl: String(item.imageUrl || item.image || ''),
    productUrl: String(item.productUrl || item.url || ''),
    orders: parseInt(String(item.orders || item.sold || '0').replace(/[^0-9]/g, ''), 10),
    rating: parseFloat(String(item.rating || item.starRating || '0')),
    reviewCount: parseInt(String(item.reviewCount || item.reviews || '0'), 10),
    category,
    supplier: String(item.storeName || item.seller || 'AliExpress'),
    source: 'aliexpress',
  };
}
