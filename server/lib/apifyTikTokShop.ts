/**
 * TikTok Shop trending product scraper.
 * Fire-and-forget pattern: launches Apify run, returns immediately.
 * Results harvested by server/pipeline/harvest.ts
 */
import { startApifyRun } from './apifyFireForget';

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

/**
 * Fire-and-forget: launches Apify run for a single hashtag, returns immediately.
 */
export async function launchTikTokScrape(hashtag: string): Promise<string | null> {
  const result = await startApifyRun(
    'clockworks~tiktok-scraper',
    `tiktok_shop_${hashtag.replace(/^#/, '').toLowerCase()}`,
    {
      hashtags: [hashtag.replace(/^#/, '')],
      resultsPerPage: 30,
      maxProfilesPerQuery: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    },
    512
  );
  return result?.runId || null;
}

/**
 * Maps raw Apify dataset items to TikTokShopProduct shape.
 * Used by harvest pipeline after dataset is fetched.
 */
export function extractTikTokItemsFromDataset(items: any[], hashtag: string): TikTokShopProduct[] {
  const products: TikTokShopProduct[] = [];

  for (const item of (Array.isArray(items) ? items : [])) {
    const title = item.text?.match(/[\w\s]+ (kit|set|tool|device|gadget|cream|serum|spray|pad|mat|organiser|bag|holder)/i)?.[0]
      || item.text?.slice(0, 80)
      || '';

    if (!title || title.length < 5) continue;

    const priceMatch = item.text?.match(/\$([0-9.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

    products.push({
      title: title.trim(),
      price_usd: price,
      image_url: item.coverUrl || item.thumbnailUrl || '',
      product_url: item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name}/video/${item.id}`,
      seller: item.authorMeta?.name || 'TikTok Creator',
      category: hashtag,
      views: item.playCount || 0,
      likes: item.diggCount || 0,
      source: 'tiktok_shop',
    });
  }

  return products;
}
