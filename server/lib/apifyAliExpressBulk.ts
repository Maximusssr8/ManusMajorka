/**
 * AliExpress Bulk Category Scraper
 * Fire-and-forget pattern: launches Apify run, returns immediately.
 * Results harvested by server/pipeline/harvest.ts
 */
import { startApifyRun } from './apifyFireForget';

export interface AEBulkProduct {
  title: string;
  price_usd: number;
  original_price_usd?: number;
  orders_count: number;
  rating: number;
  review_count: number;
  image_url: string;
  product_url: string;
  aliexpress_product_id: string;
  seller_name: string;
  free_shipping: boolean;
  aliexpress_choice: boolean;
  ships_from: string;
  category: string;
  source_url: string;
  scraped_at: string;
}

export interface EnrichedProduct extends AEBulkProduct {
  niche: string;
  opportunity_score: number;
  trend_velocity: string;
  target_market: string[];
  estimated_sell_price_aud: number;
  estimated_cost_aud: number;
  estimated_margin_percent: number;
  why_trending: string;
  ad_angle: string;
}

// The page function that runs in Apify's browser context
const PAGE_FUNCTION = `
async function pageFunction(context) {
  const { page, request, log } = context;

  await page.waitForTimeout(3000);

  const products = await page.evaluate(() => {
    const results = [];

    const cardSelectors = [
      '[class*="multi--container"]',
      '[class*="product-item"]',
      '[class*="JIIxO"]',
      'a[href*="/item/"]',
    ];

    let cards = [];
    for (const sel of cardSelectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 2) {
        cards = Array.from(found);
        break;
      }
    }

    if (cards.length > 0 && cards[0].tagName === 'A') {
      cards = cards.map(a => a.closest('[class*="multi"]') || a.closest('[class*="product"]') || a).filter(Boolean);
    }

    const seen = new Set();
    cards = cards.filter(card => {
      const link = card.querySelector('a[href*="/item/"]');
      const href = link?.href || '';
      if (!href || seen.has(href)) return false;
      seen.add(href);
      return true;
    });

    for (const card of cards.slice(0, 50)) {
      try {
        const link = card.querySelector('a[href*="/item/"]');
        const href = link?.href || '';
        if (!href) continue;

        const idMatch = href.match(/\\/item\\/(\\d+)/);
        const productId = idMatch ? idMatch[1] : '';
        if (!productId) continue;

        const titleEl = card.querySelector('[class*="multi--title"]') ||
                        card.querySelector('[class*="title"]') ||
                        card.querySelector('h1,h2,h3');
        const title = titleEl?.textContent?.trim() || '';

        const priceEl = card.querySelector('[class*="multi--price-sale"]') ||
                        card.querySelector('[class*="price"]') ||
                        card.querySelector('[class*="Price"]');
        const priceText = priceEl?.textContent?.trim() || '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

        const ordersEl = card.querySelector('[class*="multi--trade"]') ||
                         card.querySelector('[class*="trade"]') ||
                         card.querySelector('[class*="sold"]');
        const ordersText = ordersEl?.textContent?.trim() || '0';
        const ordersMatch = ordersText.match(/([\\d,]+)\\+?/);
        const orders = ordersMatch ? parseInt(ordersMatch[1].replace(/,/g, '')) : 0;

        const ratingEl = card.querySelector('[class*="multi--evaluation"]') ||
                         card.querySelector('[class*="star"]') ||
                         card.querySelector('[class*="rating"]');
        const ratingText = ratingEl?.textContent?.trim() || '0';
        const rating = parseFloat(ratingText.match(/[0-9.]+/)?.[0] || '0') || 0;

        const imgEl = card.querySelector('[class*="multi--image"] img') ||
                      card.querySelector('img[src*="alicdn"]') ||
                      card.querySelector('img');
        let imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || '';
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;

        const sellerEl = card.querySelector('[class*="store"]') ||
                         card.querySelector('[class*="seller"]');
        const seller = sellerEl?.textContent?.trim() || 'AliExpress Seller';

        const choiceBadge = card.querySelector('[class*="choice"]') ||
                            card.querySelector('[class*="Choice"]');
        const isChoice = !!choiceBadge;

        const shippingEl = card.querySelector('[class*="ship"]') ||
                           card.querySelector('[class*="delivery"]');
        const shippingText = shippingEl?.textContent?.toLowerCase() || '';
        const freeShipping = shippingText.includes('free') || shippingText.includes('0.00');

        if (title && price > 0) {
          results.push({
            title,
            price,
            orders,
            rating,
            image_url: imageUrl,
            product_url: href,
            product_id: productId,
            seller,
            is_choice: isChoice,
            free_shipping: freeShipping,
          });
        }
      } catch (e) {
        // Skip malformed cards
      }
    }

    return results;
  });

  log.info(\\\`Extracted \\\${products.length} products from \\\${request.url}\\\`);

  return products.map(p => ({
    ...p,
    source_url: request.url,
    scraped_at: new Date().toISOString(),
  }));
}
`.trim();

/**
 * Fire-and-forget: launches Apify run, saves run_id to queue, returns immediately.
 */
export async function launchAliExpressScrape(
  categoryUrl: string,
  categoryName: string
): Promise<string | null> {
  const result = await startApifyRun(
    'apify~playwright-scraper',
    `aliexpress_web_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
    {
      startUrls: [{ url: categoryUrl }],
      pageFunction: PAGE_FUNCTION,
      maxRequestsPerCrawl: 3,
      maxConcurrency: 1,
      navigationTimeout: 60,
      pageLoadTimeoutSecs: 30,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    },
    1024
  );
  return result?.runId || null;
}

/**
 * Maps raw Apify dataset items to AEBulkProduct shape.
 * Used by harvest pipeline after dataset is fetched.
 */
export function extractAEItemsFromDataset(items: any[], categoryName: string): AEBulkProduct[] {
  // Items may be nested arrays (one per page) — flatten
  const flat: any[] = Array.isArray(items)
    ? items.flatMap(item => Array.isArray(item) ? item : [item])
    : [];

  return flat
    .filter(item => item.title && (item.price > 0 || item.price_usd > 0))
    .map(item => ({
      title: String(item.title || ''),
      price_usd: parseFloat(item.price || item.price_usd) || 0,
      original_price_usd: parseFloat(item.original_price) || undefined,
      orders_count: parseInt(item.orders || item.orders_count) || 0,
      rating: parseFloat(item.rating) || 0,
      review_count: parseInt(item.review_count) || 0,
      image_url: String(item.image_url || ''),
      product_url: String(item.product_url || ''),
      aliexpress_product_id: String(item.product_id || item.aliexpress_product_id || ''),
      seller_name: String(item.seller || item.seller_name || 'AliExpress Seller'),
      free_shipping: Boolean(item.free_shipping),
      aliexpress_choice: Boolean(item.is_choice || item.aliexpress_choice),
      ships_from: 'CN',
      category: categoryName,
      source_url: String(item.source_url || ''),
      scraped_at: new Date().toISOString(),
    }));
}
