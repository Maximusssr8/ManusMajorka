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

async function callAPI(method: string, extra: Record<string, string> = {}, requiresAuth = true): Promise<any> {
  const session = requiresAuth ? (process.env.ALIEXPRESS_ACCESS_TOKEN || '') : undefined;
  if (requiresAuth && !session) {
    throw new Error('ALIEXPRESS_ACCESS_TOKEN not set. Visit /api/aliexpress/auth to authorize.');
  }

  const params = buildParams(method, extra, session || undefined);
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
  const appKey = process.env.ALIEXPRESS_APP_KEY || '530110';
  console.log('[ae-auth] app_key:', appKey);
  console.log('[ae-auth] redirect_uri:', redirectUri);
  const url = `${OAUTH_URL}/authorize?response_type=code&force_auth=true&client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log('[ae-auth] OAuth URL:', url);
  return url;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expire_time: number;
  refresh_token_valid_time: number;
  user_id: string;
}> {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '530110';
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || '8aHJr5hI76XIqvtKDKc5b1h6FfTytp75';

  console.log('[ae-token] exchanging code, app_key:', appKey);

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
  console.log('[ae-token] response status:', res.status);
  console.log('[ae-token] response body:', raw.slice(0, 300));

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
    page_no: String(options.pageNo || 1),
    page_size: String(Math.min(50, options.pageSize || 20)),
    sort: options.sortBy || 'LAST_VOLUME_DESC',
    locale: 'en_US',
    local_currency: options.currency || 'AUD',
    ship_to_country: options.shipToCountry || 'AU',
  };
  if (options.minPrice) extra.min_sale_price = String(Math.round(options.minPrice * 100));
  if (options.maxPrice) extra.max_sale_price = String(Math.round(options.maxPrice * 100));

  const data = await callAPI('aliexpress.affiliate.product.query', extra);
  const result = data?.aliexpress_affiliate_product_query_response?.resp_result;
  if (result?.resp_code !== 200) {
    console.error('[aliexpress] searchProducts non-200:', result);
    return [];
  }
  return result?.result?.products?.product || [];
}

// ── Product Detail ──────────────────────────────────────────────────────────────

export async function getProductDetail(productId: string | number): Promise<any | null> {
  try {
    const data = await callAPI('aliexpress.affiliate.productdetail.get', {
      product_ids: String(productId),
      fields: 'product_id,subject,image_urls,sku_price_list,average_star,evaluate_cnt,total_transaction_cnt',
      local_currency: 'AUD',
    });
    const result = data?.aliexpress_affiliate_productdetail_get_response?.resp_result;
    if (result?.resp_code !== 200) return null;
    return result?.result?.products?.product?.[0] || null;
  } catch (err: any) {
    console.error('[aliexpress] getProductDetail:', err.message);
    return null;
  }
}

// ── Shipping Info ───────────────────────────────────────────────────────────────

export async function getShippingInfo(productId: string | number, quantity = 1): Promise<any | null> {
  try {
    const data = await callAPI('aliexpress.logistics.buyer.freight.get', {
      product_id: String(productId),
      product_num: String(quantity),
      country_code: 'AU',
    });
    return data?.aliexpress_logistics_buyer_freight_get_response?.result || null;
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

export function isAuthorized(): boolean {
  return !!(process.env.ALIEXPRESS_ACCESS_TOKEN);
}
