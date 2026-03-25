/**
 * CJ Dropshipping API integration for real product data.
 * Free tier: https://developers.cjdropshipping.com
 * Env vars: CJ_API_EMAIL, CJ_API_KEY
 *
 * Used by Market Intel to show real supplier products with accurate pricing.
 */

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const USD_TO_AUD = 1.55;

// Token cache (per Lambda instance, 24hr TTL)
let _token: string | null = null;
let _tokenExpiry = 0;

export interface CJProduct {
  id: string;
  name: string;
  image: string;
  category: string;
  priceAud: number;       // sell price in AUD
  sourcePriceAud: number; // CJ cost price in AUD
  marginPct: number;
  sellsCount: number;
  monthlyRevenueEst: number;
  trend: 'Exploding' | 'Growing' | 'Steady';
  score: number;
  url: string;
  weight: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────

async function getCJToken(): Promise<string | null> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    console.warn('[CJ] CJ_API_KEY not set');
    return null;
  }

  // Return cached token if still valid
  if (_token && Date.now() < _tokenExpiry) return _token;

  try {
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
      signal: AbortSignal.timeout(10000),
    });
    const data: any = await res.json();
    if (!data.success || !data.data?.accessToken) {
      console.error('[CJ] Auth failed:', data.message);
      return null;
    }
    _token = data.data.accessToken;
    _tokenExpiry = Date.now() + 14 * 24 * 3600 * 1000; // 14 days (avoid auth QPS limit of 1/300s)
    console.log('[CJ] Token obtained');
    return _token;
  } catch (err: any) {
    console.error('[CJ] Auth error:', err.message);
    return null;
  }
}

// ── Product fetch ─────────────────────────────────────────────────────────

const AU_CATEGORIES = [
  'Health & Beauty',
  'Sports & Outdoors',
  'Home & Garden',
  'Pet Supplies',
  'Kitchen',
  'Electronics Accessories',
];

function calcTrend(createTime: string | null): CJProduct['trend'] {
  if (!createTime) return 'Steady';
  const days = (Date.now() - new Date(createTime).getTime()) / (1000 * 86400);
  if (days <= 30) return 'Exploding';
  if (days <= 90) return 'Growing';
  return 'Steady';
}

function calcScore(sells: number, maxSells: number): number {
  if (maxSells === 0) return 50;
  return Math.round(Math.min(100, (sells / maxSells) * 100));
}

function mapProduct(item: any, maxSells: number): CJProduct {
  const usdSell = parseFloat(item.sellPrice || item.listingPrice || '0');
  const usdSource = parseFloat(
    item.variants?.[0]?.variantSellPrice || item.sourcePrice || '0'
  ) || usdSell * 0.35; // estimate 35% cost if not provided

  const priceAud = parseFloat((usdSell * USD_TO_AUD).toFixed(2));
  const sourcePriceAud = parseFloat((usdSource * USD_TO_AUD).toFixed(2));
  const marginPct = priceAud > 0
    ? parseFloat(((priceAud - sourcePriceAud) / priceAud * 100).toFixed(1))
    : 0;
  const sells = parseInt(item.sells || item.salesCount || '0', 10);
  const monthlyRevenueEst = Math.round(sells * priceAud * 0.1); // rough est

  return {
    id: item.pid || item.productId || item.productNameEn?.slice(0, 8) || String(Date.now()),
    name: item.productNameEn || item.productName || 'Unknown Product',
    image: item.productImage || item.productImageUrl || '',
    category: item.categoryName || 'General',
    priceAud,
    sourcePriceAud,
    marginPct,
    sellsCount: sells,
    monthlyRevenueEst,
    trend: calcTrend(item.createTime || null),
    score: calcScore(sells, maxSells),
    url: item.productSku
      ? `https://cjdropshipping.com/product/-p-${item.productSku}.html`
      : 'https://cjdropshipping.com',
    weight: item.productWeight ? `${item.productWeight}g` : '—',
  };
}

async function fetchCategoryProducts(token: string, category: string, pageSize = 10): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      categoryName: category,
      pageNum: '1',
      pageSize: String(pageSize),
      sortField: 'sells',
    });
    const res = await fetch(`${CJ_BASE}/product/list?${params}`, {
      headers: { 'CJ-Access-Token': token },
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await res.json();
    if (!data.success) {
      console.warn('[CJ] Category fetch failed:', category, data.message);
      return [];
    }
    return data.data?.list || [];
  } catch (err: any) {
    console.warn('[CJ] Fetch error for', category, err.message);
    return [];
  }
}

// ── Main export ──────────────────────────────────────────────────────────

export async function fetchCJProducts(): Promise<CJProduct[]> {
  const token = await getCJToken();
  if (!token) return [];

  console.log('[CJ] Fetching products for', AU_CATEGORIES.length, 'categories...');
  const allRaw: any[] = [];

  for (const cat of AU_CATEGORIES) {
    const items = await fetchCategoryProducts(token, cat, 10);
    allRaw.push(...items);
    // Brief pause between requests
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('[CJ] Raw items fetched:', allRaw.length);
  if (!allRaw.length) return [];

  const maxSells = Math.max(...allRaw.map(i => parseInt(i.sells || i.salesCount || '0', 10)), 1);
  const mapped = allRaw.map(item => mapProduct(item, maxSells));

  // Sort by score desc
  mapped.sort((a, b) => b.score - a.score);
  return mapped;
}

export async function fetchCJToken(): Promise<string | null> {
  return getCJToken();
}
