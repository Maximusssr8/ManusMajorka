/**
 * Amazon AU Bestsellers scraper.
 * Fire-and-forget pattern: launches Apify run, returns immediately.
 * Results harvested by server/pipeline/harvest.ts
 */
import { startApifyRun } from './apifyFireForget';

export interface AmazonProduct {
  title: string;
  price_aud: number;
  rating: number;
  review_count: number;
  bsr: number;
  asin: string;
  image_url: string;
  product_url: string;
  category: string;
  is_amazons_choice: boolean;
  is_best_seller: boolean;
  source: 'amazon_au';
}

export const AMAZON_AU_CATEGORIES = [
  { url: 'https://www.amazon.com.au/gp/bestsellers/pet-supplies', name: 'Pet Products' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/beauty', name: 'Beauty & Health' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/home-garden', name: 'Home & Garden' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/sporting-goods', name: 'Sports & Fitness' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/electronics', name: 'Electronics' },
  { url: 'https://www.amazon.com.au/gp/bestsellers/baby', name: 'Baby & Kids' },
];

/**
 * Fire-and-forget: launches Apify run, saves run_id to queue, returns immediately.
 */
export async function launchAmazonScrape(
  categoryUrl: string,
  categoryName: string,
  maxItems = 50
): Promise<string | null> {
  const result = await startApifyRun(
    'apify~amazon-product-scraper',
    `amazon_au_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
    {
      startUrls: [{ url: categoryUrl }],
      maxItems,
      useCaptchaSolver: false,
      scrapeProductDetails: false,
      proxyConfiguration: { useApifyProxy: true },
    },
    512
  );
  return result?.runId || null;
}

/**
 * Maps raw Apify dataset items to AmazonProduct shape.
 * Used by harvest pipeline after dataset is fetched.
 */
export function extractAmazonItemsFromDataset(
  items: any[],
  categoryName: string,
  categoryUrl: string
): AmazonProduct[] {
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
