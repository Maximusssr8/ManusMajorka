import crypto from 'crypto';

const API_URL = 'https://api-sg.aliexpress.com/sync';

const getKeys = () => ({
  appKey: process.env.ALIEXPRESS_APP_KEY || '',
  appSecret: process.env.ALIEXPRESS_APP_SECRET || '',
  trackingId: process.env.ALIEXPRESS_TRACKING_ID || 'majorka_au',
});

const signRequest = (params: Record<string, string>, appSecret: string): string => {
  const sorted = Object.keys(params).sort();
  const str = appSecret + sorted.map(k => `${k}${params[k]}`).join('') + appSecret;
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
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
    sign_method: 'md5',
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

export const searchAliAffiliateProducts = async (
  keyword: string,
  pageSize = 20
): Promise<AliAffiliateProduct[]> => {
  const { trackingId } = getKeys();
  const data = await aliAffiliateRequest('aliexpress.affiliate.product.query', {
    keywords: keyword,
    page_no: '1',
    page_size: String(pageSize),
    tracking_id: trackingId,
    target_currency: 'AUD',
    target_language: 'EN',
    country: 'AU',
    ship_to_country: 'AU',
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

export const getAliAffiliateProductDetail = async (productId: string): Promise<AliAffiliateProduct | null> => {
  const { trackingId } = getKeys();
  const data = await aliAffiliateRequest('aliexpress.affiliate.product.detail.get', {
    product_ids: productId,
    tracking_id: trackingId,
    target_currency: 'AUD',
    target_language: 'EN',
    country: 'AU',
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
