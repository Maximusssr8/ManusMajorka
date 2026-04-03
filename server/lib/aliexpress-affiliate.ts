import crypto from 'crypto';

const API_URL = 'https://api-sg.aliexpress.com/sync';

const getKeys = () => ({
  appKey: process.env.AE_APP_KEY || process.env.ALIEXPRESS_APP_KEY || '',
  appSecret: process.env.AE_APP_SECRET || process.env.ALIEXPRESS_APP_SECRET || '',
  trackingId: process.env.AE_TRACKING_ID || process.env.ALIEXPRESS_TRACKING_ID || 'majorka_au',
});

// HMAC-SHA256 signing — AliExpress Affiliate API spec:
// key=appSecret, message=sortedParams (NO secret wrapping)
const signRequest = (params: Record<string, string>, appSecret: string): string => {
  const sorted = Object.keys(params).sort();
  const baseString = sorted.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', appSecret).update(baseString).digest('hex').toUpperCase();
};

export const aliAffiliateRequest = async (method: string, extra: Record<string, string>) => {
  const { appKey, appSecret } = getKeys();
  if (!appKey || !appSecret) {
    console.warn('[aliexpress-affiliate] API keys not configured, returning empty');
    return null;
  }
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const params: Record<string, string> = {
    method,
    app_key: appKey,
    timestamp,
    format: 'json',
    v: '2.0',
    sign_method: 'sha256',
    ...extra,
  };
  params.sign = signRequest(params, appSecret);
  const body = new URLSearchParams(params);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
    return await res.json();
  } catch (err) {
    console.error('[aliexpress-affiliate] request failed:', err);
    return null;
  }
};

export interface AliAffiliateProduct {
  id: string;
  title: string;
  image: string | null;
  images: string[];
  price_aud: number;
  original_price_aud: number;
  sold_count: number;
  rating: number;
  product_url: string;
  affiliate_url: string;
  commission_rate: string;
  source: 'aliexpress_affiliate';
}

const REGION_TO_ALI: Record<string, { currency: string; country: string; ship_to: string }> = {
  AU: { currency: 'AUD', country: 'AU', ship_to: 'AU' },
  US: { currency: 'USD', country: 'US', ship_to: 'US' },
  UK: { currency: 'GBP', country: 'UK', ship_to: 'GB' },
  CA: { currency: 'CAD', country: 'CA', ship_to: 'CA' },
  NZ: { currency: 'NZD', country: 'NZ', ship_to: 'NZ' },
  DE: { currency: 'EUR', country: 'DE', ship_to: 'DE' },
  SG: { currency: 'SGD', country: 'SG', ship_to: 'SG' },
};

export const searchAliAffiliateProducts = async (
  keyword: string,
  pageSize = 20,
  regionCode = 'AU'
): Promise<AliAffiliateProduct[]> => {
  const { trackingId } = getKeys();
  const ali = REGION_TO_ALI[regionCode] || REGION_TO_ALI.AU;
  const data = await aliAffiliateRequest('aliexpress.affiliate.product.query', {
    keywords: keyword,
    page_no: '1',
    page_size: String(pageSize),
    tracking_id: trackingId,
    target_currency: ali.currency,
    target_language: 'EN',
    country: ali.country,
    ship_to_country: ali.ship_to,
    sort: 'SALE_PRICE_ASC',
  });

  const products =
    data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];

  return products.map((p: any) => ({
    id: String(p.product_id),
    title: p.product_title || '',
    image: p.product_main_image_url || null,
    images: p.product_small_image_urls?.string || [],
    price_aud: parseFloat(p.target_sale_price || p.sale_price || '0'),
    original_price_aud: parseFloat(p.original_price || '0'),
    sold_count: parseInt(p.lastest_volume || '0'),
    rating: parseFloat(p.evaluate_rate || '0') / 20,
    product_url: p.product_detail_url || '',
    affiliate_url: p.promotion_link || p.product_detail_url || '',
    commission_rate: p.commission_rate || '0%',
    source: 'aliexpress_affiliate' as const,
  }));
};

// ── New Affiliate API methods (approved 2026-04-03) ────────────────────────

export async function getHotProducts(options: {
  categoryId?: string;
  pageNo?: number;
  pageSize?: number;
  trackingId?: string;
}) {
  const { appKey, trackingId } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.hotproduct.query', {
    app_key: appKey,
    category_ids: options.categoryId || '',
    page_no: String(options.pageNo || 1),
    page_size: String(Math.min(options.pageSize || 50, 50)),
    tracking_id: options.trackingId || trackingId,
    fields: 'product_id,product_title,product_main_image_url,product_detail_url,sale_price,original_price,discount,commission_rate,hot_product_flag,category_id,second_level_category_id,lastupdated_time',
  });
}

export async function searchAffiliateProducts(options: {
  keywords: string;
  categoryId?: string;
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  trackingId?: string;
}) {
  const { appKey, trackingId } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.product.query', {
    app_key: appKey,
    keywords: options.keywords,
    category_ids: options.categoryId || '',
    page_no: String(options.pageNo || 1),
    page_size: String(Math.min(options.pageSize || 50, 50)),
    sort: options.sortBy || 'LAST_VOLUME_DESC',
    tracking_id: options.trackingId || trackingId,
    fields: 'product_id,product_title,product_main_image_url,product_detail_url,sale_price,original_price,discount,commission_rate,hot_product_flag,category_id,evaluate_rate,lastupdated_time',
  });
}

export async function getProductDetail(productId: string, trackingId?: string) {
  const { appKey, trackingId: defaultTracking } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.productdetail.get', {
    app_key: appKey,
    product_ids: productId,
    tracking_id: trackingId || defaultTracking,
    fields: 'product_id,product_title,product_main_image_url,product_video_url,product_detail_url,sale_price,original_price,discount,commission_rate,hot_product_flag,category_id,second_level_category_id,evaluate_rate,30day_orders_count,last_hot_product_flag',
  });
}

export async function generateAffiliateLink(sourceUrl: string, trackingId?: string) {
  const { appKey, trackingId: defaultTracking } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.link.generate', {
    app_key: appKey,
    source_values: sourceUrl,
    tracking_id: trackingId || defaultTracking,
    promotion_link_type: '0',
  });
}

export async function getAffiliateCategories() {
  const { appKey } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.category.get', {
    app_key: appKey,
  });
}

export async function getFeaturedPromos() {
  const { appKey, trackingId } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.featuredpromo.get', {
    app_key: appKey,
    tracking_id: trackingId,
  });
}

export async function smartMatchProducts(options: { pageNo?: number; pageSize?: number } = {}) {
  const { appKey, trackingId } = getKeys();
  return aliAffiliateRequest('aliexpress.affiliate.product.smartmatch', {
    app_key: appKey,
    page_no: String(options.pageNo || 1),
    page_size: String(Math.min(options.pageSize || 50, 50)),
    tracking_id: trackingId,
  });
}

export const getAliAffiliateProductDetail = async (productId: string, regionCode = 'AU'): Promise<AliAffiliateProduct | null> => {
  const { trackingId } = getKeys();
  const ali = REGION_TO_ALI[regionCode] || REGION_TO_ALI.AU;
  const data = await aliAffiliateRequest('aliexpress.affiliate.product.detail.get', {
    product_ids: productId,
    tracking_id: trackingId,
    target_currency: ali.currency,
    target_language: 'EN',
    country: ali.country,
  });

  const product =
    data?.aliexpress_affiliate_product_detail_get_response?.resp_result?.result?.products?.product?.[0];
  if (!product) return null;

  return {
    id: String(product.product_id),
    title: product.product_title || '',
    image: product.product_main_image_url || null,
    images: product.product_small_image_urls?.string || [],
    price_aud: parseFloat(product.target_sale_price || product.sale_price || '0'),
    original_price_aud: parseFloat(product.original_price || '0'),
    sold_count: parseInt(product.lastest_volume || '0'),
    rating: parseFloat(product.evaluate_rate || '0') / 20,
    product_url: product.product_detail_url || '',
    affiliate_url: product.promotion_link || product.product_detail_url || '',
    commission_rate: product.commission_rate || '0%',
    source: 'aliexpress_affiliate' as const,
  };
};
