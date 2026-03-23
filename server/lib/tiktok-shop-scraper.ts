// server/lib/tiktok-shop-scraper.ts
// TikTok Shop public endpoint scraper
// Returns [] on any failure — never throws

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface TikTokProduct {
  id: string;
  title: string;
  image: string | null;
  price_aud: number;
  sold_count: number;
  product_url: string;
  seller_name?: string;
  source: 'tiktok_shop';
}

// Parse price from various TikTok price formats
const parsePrice = (priceData: any): number => {
  if (!priceData) return 0;
  if (typeof priceData === 'number') return priceData / 100; // often in cents
  if (typeof priceData === 'string') {
    const num = parseFloat(priceData.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  // Handle objects like { currency: 'AUD', amount: '1999' }
  const amount = priceData.amount || priceData.price || priceData.value || 0;
  const num = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
  // If amount looks like cents (>100 for a typical product), divide by 100
  const result = isNaN(num) ? 0 : num;
  return result > 10000 ? result / 100 : result;
};

// Parse sold count
const parseSold = (soldData: any): number => {
  if (!soldData) return 0;
  const str = String(soldData).replace(/[^0-9kKmM.]/g, '');
  if (str.toLowerCase().includes('k')) return Math.round(parseFloat(str) * 1000);
  if (str.toLowerCase().includes('m')) return Math.round(parseFloat(str) * 1000000);
  const num = parseInt(str);
  return isNaN(num) ? 0 : num;
};

// Extract products from TikTok search response (handles multiple response formats)
const extractProducts = (data: any, keyword: string): TikTokProduct[] => {
  const results: TikTokProduct[] = [];

  // Format 1: data.data.item_list (common search format)
  const itemList =
    data?.data?.item_list ||
    data?.item_list ||
    data?.data?.products ||
    data?.products ||
    data?.data?.items ||
    data?.items ||
    data?.result?.item_list ||
    [];

  if (!Array.isArray(itemList) || itemList.length === 0) {
    console.log('[tiktok] response keys:', Object.keys(data || {}).join(', '));
    return [];
  }

  for (const item of itemList.slice(0, 20)) {
    try {
      const id = String(item.id || item.item_id || item.product_id || Math.random());
      const title = item.title || item.desc || item.description || item.name || item.product_title || '';

      // Extract image
      const image =
        item.cover ||
        item.image_url ||
        item.thumbnail?.url_list?.[0] ||
        item.video?.cover?.url_list?.[0] ||
        item.images?.[0]?.url_list?.[0] ||
        item.product_image ||
        null;

      // Extract price
      const priceRaw =
        item.price ||
        item.min_price ||
        item.sale_price ||
        item.sku_price_list?.[0]?.price ||
        item.price_info?.price ||
        0;
      const price_aud = parsePrice(priceRaw);

      // Extract sold count
      const soldRaw =
        item.stats?.commentCount ||
        item.sell_point ||
        item.sales ||
        item.sold_count ||
        item.real_sold_count ||
        item.statistics?.sold_count ||
        0;
      const sold_count = parseSold(soldRaw);

      // Build product URL
      const product_url = item.share_url ||
        item.product_url ||
        `https://www.tiktok.com/search?q=${encodeURIComponent(title || keyword)}`;

      if (title) {
        results.push({
          id,
          title: title.slice(0, 200),
          image: image || null,
          price_aud: price_aud || 0,
          sold_count,
          product_url,
          seller_name: item.author?.nickname || item.seller?.name || undefined,
          source: 'tiktok_shop',
        });
      }
    } catch {
      // skip malformed items
    }
  }

  return results;
};

// ENDPOINT ATTEMPTS — ordered by most likely to work
const ENDPOINTS = [
  // TikTok main site search API (undocumented)
  (kw: string) => ({
    url: `https://www.tiktok.com/api/search/item/full/?keyword=${encodeURIComponent(kw)}&offset=0&count=20`,
    label: 'tiktok-search-item',
  }),
  // TikTok shop search
  (kw: string) => ({
    url: `https://shop.tiktok.com/api/v1/product/search?keyword=${encodeURIComponent(kw)}&page=1&page_size=20`,
    label: 'tiktok-shop-search',
  }),
  // TikTok general item search
  (kw: string) => ({
    url: `https://www.tiktok.com/api/item/search/?keyword=${encodeURIComponent(kw)}&count=20`,
    label: 'tiktok-item-search',
  }),
  // TikTok discover feed (trending)
  (kw: string) => ({
    url: `https://www.tiktok.com/api/recommend/item_list/?count=20&keyword=${encodeURIComponent(kw)}`,
    label: 'tiktok-discover',
  }),
];

export const searchTikTokShop = async (
  keyword: string,
  limit = 20
): Promise<TikTokProduct[]> => {
  const ua = randomUA();
  const headers = {
    'User-Agent': ua,
    'Referer': 'https://www.tiktok.com/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-AU,en;q=0.9',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  for (const endpointFn of ENDPOINTS) {
    const { url, label } = endpointFn(keyword);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      console.log(`[tiktok] ${label} → HTTP ${res.status}`);

      if (res.status === 200) {
        const text = await res.text();

        // Log first 500 chars for debugging
        console.log(`[tiktok] ${label} raw (first 500):`, text.slice(0, 500));

        let data: any;
        try { data = JSON.parse(text); } catch {
          console.log(`[tiktok] ${label} — not JSON`);
          await sleep(800);
          continue;
        }

        const products = extractProducts(data, keyword);
        if (products.length > 0) {
          console.log(`[tiktok] ${label} ✓ extracted ${products.length} products`);
          return products.slice(0, limit);
        }

        console.log(`[tiktok] ${label} — 0 products extracted, trying next endpoint`);
      } else if (res.status === 403 || res.status === 429) {
        console.log(`[tiktok] ${label} blocked (${res.status}), trying next endpoint`);
      }

      await sleep(800);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`[tiktok] ${label} timed out`);
      } else {
        console.log(`[tiktok] ${label} error:`, err.message);
      }
      await sleep(400);
    }
  }

  console.log(`[tiktok] all endpoints failed for "${keyword}" — returning []`);
  return [];
};

// Raw debug fetch — logs full response for a keyword
export const debugTikTokEndpoint = async (keyword: string): Promise<{
  endpoint: string;
  status: number;
  raw: string;
  parsed: TikTokProduct[];
}[]> => {
  const ua = randomUA();
  const headers = {
    'User-Agent': ua,
    'Referer': 'https://www.tiktok.com/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-AU,en;q=0.9',
  };

  const results = [];
  for (const endpointFn of ENDPOINTS) {
    const { url, label } = endpointFn(keyword);
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      let parsed: TikTokProduct[] = [];
      try {
        const data = JSON.parse(text);
        parsed = extractProducts(data, keyword);
      } catch {}
      results.push({ endpoint: label, status: res.status, raw: text.slice(0, 2000), parsed });
    } catch (err: any) {
      results.push({ endpoint: label, status: 0, raw: err.message, parsed: [] });
    }
    await sleep(600);
  }
  return results;
};
