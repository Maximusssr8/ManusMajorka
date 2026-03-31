/**
 * Amazon AU Bestsellers scraper.
 * Amazon BSR < 1000 = strong proven demand signal.
 */

export interface AmazonProduct {
  title: string;
  price_aud: number;
  rating: number;
  review_count: number;
  bsr: number; // bestseller rank
  asin: string;
  image_url: string;
  product_url: string;
  category: string;
  is_amazons_choice: boolean;
  is_best_seller: boolean;
  source: 'amazon_au';
}

const ACTOR = 'apify~amazon-product-scraper';
const POLL_MS = 6000;
const MAX_POLLS = 40;

export const AMAZON_AU_CATEGORIES = [
  { url: 'https://www.amazon.com.au/gp/bestsellers/pet-supplies', name: 'Pet Products' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/beauty', name: 'Beauty & Health' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/home-garden', name: 'Home & Garden' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/sporting-goods', name: 'Sports & Fitness' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/electronics', name: 'Electronics' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/baby', name: 'Baby & Kids' },
];

export async function scrapeAmazonBestsellers(
  categoryUrl: string,
  categoryName: string,
  maxItems = 50
): Promise<AmazonProduct[]> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) { console.error('[amazon] No Apify token'); return []; }

  console.log(`[amazon] Scraping bestsellers: ${categoryName}`);

  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}&memory=512`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: categoryUrl }],
          maxItems,
          useCaptchaSolver: false,
          scrapeProductDetails: false,
          proxyConfiguration: { useApifyProxy: true },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!startRes.ok) {
      console.error('[amazon] Start failed:', startRes.status, await startRes.text().catch(() => ''));
      return [];
    }

    const startData = await startRes.json() as { data?: { id: string } };
    const runId = startData?.data?.id;
    if (!runId) return [];

    // Poll
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, POLL_MS));

      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const statusData = await statusRes.json() as { data?: { status: string; defaultDatasetId?: string } };
      const status = statusData?.data?.status;
      const datasetId = statusData?.data?.defaultDatasetId;

      console.log(`[amazon] Poll ${i + 1}: ${status}`);

      if (status === 'SUCCEEDED' && datasetId) {
        const itemsRes = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`,
          { signal: AbortSignal.timeout(15000) }
        );
        const items = await itemsRes.json() as any[];

        return (Array.isArray(items) ? items : [])
          .filter(item => item.title && item.asin)
          .map(item => ({
            title: String(item.title || ''),
            price_aud: parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 0,
            rating: parseFloat(item.stars || item.rating || '0') || 0,
            review_count: parseInt(item.reviewsCount || item.reviews || '0') || 0,
            bsr: parseInt(item.bestsellersRank?.[0]?.rank || item.rank || '9999') || 9999,
            asin: String(item.asin || ''),
            image_url: String(item.thumbnailImage || item.image || ''),
            product_url: `https://www.amazon.com.au/dp/${item.asin}`,
            category: categoryName,
            is_amazons_choice: Boolean(item.amazonChoice),
            is_best_seller: Boolean(item.bestSeller),
            source: 'amazon_au' as const,
          }));
      }

      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status || '')) {
        console.error(`[amazon] Run ${status}`);
        return [];
      }
    }

    return [];
  } catch (err: any) {
    console.error('[amazon] Error:', err.message);
    return [];
  }
}
