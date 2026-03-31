/**
 * TikTok Shop trending product scraper.
 * Uses clockworks~tiktok-scraper to find products being sold via TikTok Shop.
 */

export interface TikTokShopProduct {
  title: string;
  price_usd: number;
  image_url: string;
  product_url: string;
  seller: string;
  category: string;
  views: number;
  likes: number;
  source: 'tiktok_shop';
}

const ACTOR = 'clockworks~tiktok-scraper';
const POLL_MS = 6000;
const MAX_POLLS = 30;

// Search TikTok for product content (Shop + organic)
export async function scrapeTikTokShopProducts(
  searchTerms: string[]
): Promise<TikTokShopProduct[]> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) { console.error('[tt-shop] No Apify token'); return []; }

  const products: TikTokShopProduct[] = [];

  // Process one search term at a time
  for (const term of searchTerms.slice(0, 3)) { // max 3 per run
    try {
      console.log(`[tt-shop] Searching: ${term}`);

      const startRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}&memory=512`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hashtags: [term.replace(/^#/, '')],
            resultsPerPage: 30,
            maxProfilesPerQuery: 1,
            shouldDownloadVideos: false,
            shouldDownloadCovers: false,
          }),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (!startRes.ok) {
        console.error('[tt-shop] Start failed:', startRes.status);
        continue;
      }

      const startData = await startRes.json() as { data?: { id: string } };
      const runId = startData?.data?.id;
      if (!runId) continue;

      // Poll
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, POLL_MS));

        const statusRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${token}`,
          { signal: AbortSignal.timeout(15000) }
        );
        const statusData = await statusRes.json() as { data?: { status: string; defaultDatasetId?: string } };
        const status = statusData?.data?.status;

        if (status === 'SUCCEEDED') {
          const datasetId = statusData?.data?.defaultDatasetId;
          if (!datasetId) break;

          const itemsRes = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&limit=30`,
            { signal: AbortSignal.timeout(15000) }
          );
          const items = await itemsRes.json() as any[];

          for (const item of (Array.isArray(items) ? items : [])) {
            // Extract product mentions from TikTok posts
            const title = item.text?.match(/[\w\s]+ (kit|set|tool|device|gadget|cream|serum|spray|pad|mat|organiser|bag|holder)/i)?.[0]
              || item.text?.slice(0, 80)
              || '';

            if (!title || title.length < 5) continue;

            // Try to extract price from caption
            const priceMatch = item.text?.match(/\$([0-9.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

            products.push({
              title: title.trim(),
              price_usd: price,
              image_url: item.coverUrl || item.thumbnailUrl || '',
              product_url: item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name}/video/${item.id}`,
              seller: item.authorMeta?.name || 'TikTok Creator',
              category: term,
              views: item.playCount || 0,
              likes: item.diggCount || 0,
              source: 'tiktok_shop',
            });
          }
          break;
        }

        if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status || '')) {
          console.error(`[tt-shop] Run ${status} for term: ${term}`);
          break;
        }
      }

      // Delay between search terms
      await new Promise(r => setTimeout(r, 3000));
    } catch (err: any) {
      console.error('[tt-shop] Error:', err.message);
    }
  }

  return products;
}

// Hashtag scrape for viral products
export async function scrapeTikTokHashtags(): Promise<TikTokShopProduct[]> {
  const VIRAL_TAGS = ['TikTokMadeMeBuyIt', 'TikTokShop', 'ProductReview'];
  return scrapeTikTokShopProducts(VIRAL_TAGS);
}
