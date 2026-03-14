/**
 * IndexNow — instant indexing submission for Bing + Google
 * Submits new/updated URLs to IndexNow API on deployment/startup
 */

const INDEXNOW_KEY = 'majorka-indexnow-key-2025';

export async function submitToIndexNow(urls: string[]): Promise<number> {
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'www.majorka.io',
        key: INDEXNOW_KEY,
        keyLocation: `https://www.majorka.io/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    return response.status;
  } catch (err) {
    console.error('[IndexNow] Submission failed:', err);
    return 0;
  }
}

// Submit all key pages
export const ALL_MAJORKA_URLS = [
  'https://www.majorka.io',
  'https://www.majorka.io/dropshipping-australia',
  'https://www.majorka.io/tiktok-shop-australia',
  'https://www.majorka.io/winning-products-australia',
  'https://www.majorka.io/pricing',
  'https://www.majorka.io/store-health',
  'https://www.majorka.io/tools/profit-calculator',
];
