/**
 * AliExpress Bulk Category Scraper
 * Uses Apify Playwright Scraper to extract product listings from category pages.
 * Returns array of raw product data without any enrichment.
 */
import Anthropic from '@anthropic-ai/sdk';

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

const ACTOR = 'apify~playwright-scraper';
const POLL_INTERVAL_MS = 8000;
const MAX_POLLS = 45; // 6 minutes max

// The page function that runs in Apify's browser context
// Extracts product listings from AliExpress category/listing pages
const PAGE_FUNCTION = `
async function pageFunction(context) {
  const { page, request, log } = context;

  await page.waitForTimeout(3000);

  // Try to extract product data from the page
  const products = await page.evaluate(() => {
    const results = [];

    // AliExpress uses various product card selectors — try multiple patterns
    const cardSelectors = [
      '[class*="multi--container"]',
      '[class*="product-item"]',
      '[class*="JIIxO"]', // dynamic class
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

    // If link-based selection, get parent containers
    if (cards.length > 0 && cards[0].tagName === 'A') {
      cards = cards.map(a => a.closest('[class*="multi"]') || a.closest('[class*="product"]') || a).filter(Boolean);
    }

    // Deduplicate by href
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
        // Product URL
        const link = card.querySelector('a[href*="/item/"]');
        const href = link?.href || '';
        if (!href) continue;

        // Product ID from URL
        const idMatch = href.match(/\\/item\\/(\\d+)/);
        const productId = idMatch ? idMatch[1] : '';
        if (!productId) continue;

        // Title — try multiple selectors
        const titleEl = card.querySelector('[class*="multi--title"]') ||
                        card.querySelector('[class*="title"]') ||
                        card.querySelector('h1,h2,h3');
        const title = titleEl?.textContent?.trim() || '';

        // Price — try multiple patterns
        const priceEl = card.querySelector('[class*="multi--price-sale"]') ||
                        card.querySelector('[class*="price"]') ||
                        card.querySelector('[class*="Price"]');
        const priceText = priceEl?.textContent?.trim() || '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

        // Orders
        const ordersEl = card.querySelector('[class*="multi--trade"]') ||
                         card.querySelector('[class*="trade"]') ||
                         card.querySelector('[class*="sold"]');
        const ordersText = ordersEl?.textContent?.trim() || '0';
        const ordersMatch = ordersText.match(/([\\d,]+)\\+?/);
        const orders = ordersMatch ? parseInt(ordersMatch[1].replace(/,/g, '')) : 0;

        // Rating
        const ratingEl = card.querySelector('[class*="multi--evaluation"]') ||
                         card.querySelector('[class*="star"]') ||
                         card.querySelector('[class*="rating"]');
        const ratingText = ratingEl?.textContent?.trim() || '0';
        const rating = parseFloat(ratingText.match(/[0-9.]+/)?.[0] || '0') || 0;

        // Image
        const imgEl = card.querySelector('[class*="multi--image"] img') ||
                      card.querySelector('img[src*="alicdn"]') ||
                      card.querySelector('img');
        let imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || '';
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;

        // Seller
        const sellerEl = card.querySelector('[class*="store"]') ||
                         card.querySelector('[class*="seller"]');
        const seller = sellerEl?.textContent?.trim() || 'AliExpress Seller';

        // AliExpress Choice badge
        const choiceBadge = card.querySelector('[class*="choice"]') ||
                            card.querySelector('[class*="Choice"]');
        const isChoice = !!choiceBadge;

        // Free shipping
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

export async function scrapeAliExpressCategoryPage(
  categoryUrl: string,
  categoryName: string
): Promise<AEBulkProduct[]> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error('[ae-bulk] No APIFY token');
    return [];
  }

  console.log(`[ae-bulk] Scraping: ${categoryUrl.slice(0, 70)}`);

  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}&memory=1024`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: categoryUrl }],
          pageFunction: PAGE_FUNCTION,
          maxRequestsPerCrawl: 2,
          maxConcurrency: 1,
          navigationTimeout: 60,
          pageLoadTimeoutSecs: 30,
          proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
          launchContext: {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!startRes.ok) {
      const errText = await startRes.text().catch(() => '');
      console.error('[ae-bulk] Start failed:', startRes.status, errText.slice(0, 200));
      return [];
    }

    const startData = await startRes.json() as { data?: { id: string } };
    const runId = startData?.data?.id;
    if (!runId) {
      console.error('[ae-bulk] No run ID returned');
      return [];
    }

    console.log(`[ae-bulk] Run started: ${runId}`);

    // Poll for completion
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const statusData = await statusRes.json() as { data?: { status: string; datasetId?: string } };
      const status = statusData?.data?.status;
      const datasetId = statusData?.data?.datasetId;

      console.log(`[ae-bulk] Poll ${i + 1}: ${status}`);

      if (status === 'SUCCEEDED' && datasetId) {
        const itemsRes = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`,
          { signal: AbortSignal.timeout(15000) }
        );
        const rawItems = await itemsRes.json() as any[];

        // Items may be nested arrays (one per page) — flatten
        const items: any[] = Array.isArray(rawItems)
          ? rawItems.flatMap(item => Array.isArray(item) ? item : [item])
          : [];

        return items
          .filter(item => item.title && item.price > 0)
          .map(item => ({
            title: String(item.title || ''),
            price_usd: parseFloat(item.price) || 0,
            original_price_usd: parseFloat(item.original_price) || undefined,
            orders_count: parseInt(item.orders) || 0,
            rating: parseFloat(item.rating) || 0,
            review_count: parseInt(item.review_count) || 0,
            image_url: String(item.image_url || ''),
            product_url: String(item.product_url || ''),
            aliexpress_product_id: String(item.product_id || ''),
            seller_name: String(item.seller || 'AliExpress Seller'),
            free_shipping: Boolean(item.free_shipping),
            aliexpress_choice: Boolean(item.is_choice),
            ships_from: 'CN',
            category: categoryName,
            source_url: categoryUrl,
            scraped_at: new Date().toISOString(),
          }));
      }

      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status || '')) {
        console.error(`[ae-bulk] Run ${status}`);
        return [];
      }
    }

    console.error('[ae-bulk] Polling timed out');
    return [];
  } catch (err: any) {
    console.error('[ae-bulk] Error:', err.message);
    return [];
  }
}
