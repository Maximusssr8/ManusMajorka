/**
 * Scrapes real AliExpress product data using Apify's aliexpress-scraper actor.
 * Apify handles JS rendering + proxy rotation natively — bypasses AliExpress bot protection.
 */

export interface ApifyProductData {
  title: string | null;
  images: string[];
  price: number | null;
  rating: number | null;
  orders: number | null;
}

const ACTOR = 'apify~aliexpress-scraper';
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 18; // 90s max

export async function scrapeAliExpressWithApify(productUrl: string): Promise<ApifyProductData | null> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) { console.error('[apify] No APIFY_API_KEY/TOKEN'); return null; }

  try {
    console.log('[apify] Starting run for:', productUrl.slice(0, 70));

    // Start actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: productUrl }],
          maxItems: 1,
          proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!startRes.ok) {
      console.error('[apify] Start failed:', startRes.status, await startRes.text().catch(() => ''));
      return null;
    }
    const startData = await startRes.json() as { data?: { id: string } };
    const runId = startData?.data?.id;
    if (!runId) { console.error('[apify] No run ID'); return null; }
    console.log('[apify] Run started:', runId);

    // Poll for completion
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const statusData = await statusRes.json() as { data?: { status: string } };
      const status = statusData?.data?.status;
      console.log(`[apify] Poll ${i + 1}: ${status}`);

      if (status === 'SUCCEEDED') {
        const itemsRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}/dataset/items?token=${token}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const items = await itemsRes.json() as any[];
        const item = Array.isArray(items) ? items[0] : null;
        if (!item) { console.log('[apify] No items returned'); return null; }

        console.log('[apify] Got item keys:', Object.keys(item).slice(0, 15).join(', '));

        // Normalise fields — different Apify actor versions use different keys
        const title: string | null = item.name || item.title || item.productTitle || null;
        const rawImages: string[] = item.images || item.imageUrls || item.productImages || [];
        const images: string[] = rawImages
          .filter((i: any) => typeof i === 'string' && i.includes('alicdn'))
          .map((i: string) => i.startsWith('//') ? `https:${i}` : i)
          .slice(0, 5);
        const price: number | null =
          item.price ?? item.salePrice ?? item.discountPrice ?? item.originalPrice ?? null;
        const rating: number | null =
          item.starRating ?? item.rating ?? item.averageStarRate ?? null;
        const orders: number | null =
          item.tradeCount ?? item.orders ?? item.soldCount ?? null;

        return { title, images, price, rating, orders };
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error('[apify] Run', status);
        return null;
      }
    }

    console.error('[apify] Timed out waiting for run');
    return null;
  } catch (err: any) {
    console.error('[apify] Error:', err.message);
    return null;
  }
}
