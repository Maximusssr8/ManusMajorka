/**
 * AliExpress Dropshipping API client
 * Requires OAuth access token — see GET /api/aliexpress/auth to authorize
 */

import crypto from 'crypto';

const API_URL = 'https://api-sg.aliexpress.com/sync';
const OAUTH_URL = 'https://oauth.aliexpress.com';

function getCredentials() {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  if (!appKey || !appSecret) throw new Error('ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET not set');
  return { appKey, appSecret };
}

function signRequest(params: Record<string, string>, appSecret: string): string {
  // AliExpress: ALL params (including session) sorted by key, concat key+value, wrapped with secret
  const sorted = Object.keys(params).sort();
  const str = sorted.map(k => `${k}${params[k]}`).join('');
  return crypto.createHash('md5').update(appSecret + str + appSecret).digest('hex').toUpperCase();
}

function buildParams(method: string, extra: Record<string, string>, session?: string): Record<string, string> {
  const { appKey, appSecret } = getCredentials();
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const params: Record<string, string> = {
    method,
    app_key: appKey,
    timestamp: ts,
    sign_method: 'md5',
    v: '2.0',
    ...extra,
  };
  if (session) params.session = session;
  params.sign = signRequest(params, appSecret);
  return params;
}

async function callAPI(method: string, extra: Record<string, string> = {}): Promise<any> {
  // DS API uses AppKey+AppSecret signed requests — no OAuth token needed for product search
  const params = buildParams(method, extra);
  const body = new URLSearchParams(params).toString();

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`AliExpress API HTTP ${res.status}`);
  const data = await res.json();

  const errResp = data?.error_response;
  if (errResp) {
    console.error('[aliexpress] API error:', JSON.stringify(errResp));
    throw new Error(`AliExpress API: ${errResp.msg} (${errResp.code})`);
  }
  return data;
}

// ── OAuth Helpers ──────────────────────────────────────────────────────────────

export function getAuthUrl(redirectUri: string): string {
  // Hardcoded fallback so OAuth works even if env var isn't loaded at module init time
  const appKey = process.env.ALIEXPRESS_APP_KEY || '';
  if (!appKey) throw new Error('ALIEXPRESS_APP_KEY not configured');
  const url = `${OAUTH_URL}/authorize?response_type=code&force_auth=true&client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return url;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expire_time: number;
  refresh_token_valid_time: number;
  user_id: string;
}> {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '';
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || '';
  if (!appKey || !appSecret) throw new Error('AliExpress API keys not configured');

  // AliExpress token endpoint — POST to oauth.aliexpress.com/token
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: appKey,
    client_secret: appSecret,
    redirect_uri: redirectUri,
  }).toString();

  const res = await fetch(`${OAUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  });

  const raw = await res.text();

  let data: any;
  try { data = JSON.parse(raw); } catch { throw new Error('Non-JSON token response: ' + raw.slice(0, 200)); }

  // Handle both OAuth2 standard format and AliExpress TOP format
  if (data.access_token) return data;
  if (data?.aliexpress_system_oauth_token_get_response) return data.aliexpress_system_oauth_token_get_response;
  if (data?.error || data?.error_response) {
    const msg = data.error_description || data.error || data?.error_response?.msg || JSON.stringify(data);
    throw new Error(msg);
  }
  throw new Error('Unexpected token response: ' + JSON.stringify(data).slice(0, 300));
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expire_time: number }> {
  const params = buildParams('aliexpress.system.oauth.token.refresh', {
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const body = new URLSearchParams(params).toString();
  const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(15000) });
  const data = await res.json();
  if (data?.error_response) throw new Error(data.error_response.msg);
  return data?.aliexpress_system_oauth_token_refresh_response;
}

// ── Product Search ─────────────────────────────────────────────────────────────

export interface AliExpressProduct {
  product_id: string;
  product_title: string;
  product_main_image_url: string;
  product_detail_url: string;
  target_sale_price: string;
  target_sale_price_currency: string;
  target_original_price: string;
  evaluate_rate: string;
  lastest_volume: number;
}

export async function searchProducts(
  keyword: string,
  options: {
    pageSize?: number;
    pageNo?: number;
    sortBy?: string;
    currency?: string;
    shipToCountry?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<AliExpressProduct[]> {
  const extra: Record<string, string> = {
    search_key: keyword,
    product_cnt: String(Math.min(50, options.pageSize || 20)),
    page_no: String(options.pageNo || 1),
    sort: options.sortBy || 'SALE_PRICE_DESC',
    local_currency: options.currency || 'AUD',
    ship_to_country: options.shipToCountry || 'AU',
  };
  if (options.minPrice) extra.min_sale_price = String(Math.round(options.minPrice * 100));
  if (options.maxPrice) extra.max_sale_price = String(Math.round(options.maxPrice * 100));

  const data = await callAPI('aliexpress.ds.product.search', extra);
  const products = data?.aliexpress_ds_product_search_response?.search_result?.products?.product || [];
  console.log(`[aliexpress] searchProducts "${keyword}": ${products.length} results`);
  return products;
}

// ── Product Detail ──────────────────────────────────────────────────────────────

export async function getProductDetail(productId: string | number): Promise<any | null> {
  try {
    const data = await callAPI('aliexpress.ds.product.get', {
      product_id: String(productId),
      local_currency: 'AUD',
      ship_to_country: 'AU',
    });
    const result = data?.aliexpress_ds_product_get_response?.result;
    console.log(`[aliexpress] getProductDetail ${productId}:`, result ? 'found' : 'not found');
    return result || null;
  } catch (err: any) {
    console.error('[aliexpress] getProductDetail:', err.message);
    return null;
  }
}

// ── Shipping Info ───────────────────────────────────────────────────────────────

export async function getShippingInfo(productId: string | number, quantity = 1): Promise<any | null> {
  try {
    const data = await callAPI('aliexpress.ds.freight.query', {
      product_id: String(productId),
      product_num: String(quantity),
      country_code: 'AU',
    });
    return data?.aliexpress_ds_freight_query_response?.result || null;
  } catch (err: any) {
    console.error('[aliexpress] getShippingInfo:', err.message);
    return null;
  }
}

// ── Trending by Niche ──────────────────────────────────────────────────────────

const NICHE_KEYWORDS: Record<string, string> = {
  fitness:   'gym fitness equipment resistance bands',
  beauty:    'skincare face serum beauty',
  tech:      'wireless gadgets electronics accessories',
  home:      'home decor organisation storage',
  pets:      'pet accessories dog cat',
  fashion:   'fashion jewellery accessories',
  outdoor:   'outdoor camping hiking',
  kitchen:   'kitchen gadgets cooking tools',
  baby:      'baby products toddler',
  wellness:  'massage health wellness',
  gaming:    'gaming accessories keyboard mouse',
  car:       'car accessories phone mount',
  sleep:     'sleep pillow comfort eye mask',
  yoga:      'yoga mat pilates fitness',
  jewellery: 'jewellery rings necklace',
};

export async function getTrendingProducts(niche: string, limit = 20): Promise<AliExpressProduct[]> {
  const keyword = NICHE_KEYWORDS[niche.toLowerCase()] || niche;
  return searchProducts(keyword, { pageSize: limit, sortBy: 'LAST_VOLUME_DESC', shipToCountry: 'AU' });
}

// ── Check if API is authorized ─────────────────────────────────────────────────

// DS API only needs app key + secret — no OAuth token required for product search
export function isAuthorized(): boolean {
  return !!(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
}
