/**
 * AliExpress Affiliate API — Hot Products client (Advanced API approved).
 *
 * Wraps `aliexpress.affiliate.hotproduct.query` with multi-market support.
 * Reuses the signing primitive from server/lib/aliexpress-affiliate.ts for
 * consistency. Returns normalised AEHotProduct rows ready to upsert into
 * winning_products.
 *
 * Env required:
 *   AE_APP_KEY          (or ALIEXPRESS_APP_KEY)
 *   AE_APP_SECRET       (or ALIEXPRESS_APP_SECRET)
 *   AE_TRACKING_ID      (optional — defaults to 'majorka_au')
 *
 * AE_ACCESS_TOKEN is NOT required for the hotproduct endpoint — it's a
 * public affiliate query signed with app_key + app_secret only.
 */

import { aliAffiliateRequest } from './aliexpress-affiliate';

export interface AEHotProduct {
  product_id: string;
  product_title: string;
  product_main_image_url: string;
  product_detail_url: string;
  lastest_volume: number;
  sale_price: string;
  sale_price_currency?: string;
  original_price: string;
  original_price_currency?: string;
  commission_rate: string;
  hot_product_commission_rate?: string;
  evaluate_rate?: string;
  second_level_category_name?: string;
  category_id?: string;
  market: string;
}

export interface FetchHotProductsOptions {
  /** ISO market code: AU, US, GB, CA, NZ, DE, SG */
  country?: string;
  categoryId?: string;
  pageNo?: number;
  pageSize?: number;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AU: 'AUD', US: 'USD', GB: 'GBP', CA: 'CAD', NZ: 'NZD', DE: 'EUR', SG: 'SGD',
};
const COUNTRY_TO_LANG: Record<string, string> = {
  AU: 'EN', US: 'EN', GB: 'EN', CA: 'EN', NZ: 'EN', DE: 'DE', SG: 'EN',
};

const FIELDS = [
  'product_id',
  'product_title',
  'product_main_image_url',
  'lastest_volume',
  'commission_rate',
  'sale_price',
  'sale_price_currency',
  'original_price',
  'original_price_currency',
  'second_level_category_name',
  'second_level_category_id',
  'evaluate_rate',
  'product_detail_url',
  'hot_product_commission_rate',
].join(',');

interface RawHotProduct {
  product_id?: string | number;
  product_title?: string;
  product_main_image_url?: string;
  product_detail_url?: string;
  lastest_volume?: string | number;
  sale_price?: string | number;
  sale_price_currency?: string;
  original_price?: string | number;
  original_price_currency?: string;
  commission_rate?: string;
  hot_product_commission_rate?: string;
  evaluate_rate?: string;
  second_level_category_name?: string;
  second_level_category_id?: string | number;
}

interface HotProductResponse {
  aliexpress_affiliate_hotproduct_query_response?: {
    resp_result?: {
      result?: {
        current_record_count?: number;
        total_record_count?: number;
        products?: { product?: RawHotProduct[] };
      };
    };
  };
}

function asString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value);
}

function asNumber(value: unknown): number {
  if (value == null) return 0;
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetch hot products for a single market.
 *
 * Note: AliExpress hotproduct.query accepts target_currency / target_language
 * to localise prices but does not filter by destination country at the API
 * level — country is passed through to the upserted row for downstream
 * filtering.
 */
export async function fetchHotProducts(
  options: FetchHotProductsOptions = {}
): Promise<AEHotProduct[]> {
  const country = (options.country || 'US').toUpperCase();
  const targetCurrency = COUNTRY_TO_CURRENCY[country] ?? 'USD';
  const targetLanguage = COUNTRY_TO_LANG[country] ?? 'EN';

  const params: Record<string, string> = {
    fields: FIELDS,
    page_no: String(options.pageNo ?? 1),
    page_size: String(options.pageSize ?? 50),
    target_currency: targetCurrency,
    target_language: targetLanguage,
    tracking_id: process.env.AE_TRACKING_ID || process.env.ALIEXPRESS_TRACKING_ID || 'majorka_au',
  };
  if (options.categoryId) params.category_ids = options.categoryId;

  const raw = (await aliAffiliateRequest(
    'aliexpress.affiliate.hotproduct.query',
    params,
  )) as HotProductResponse | null;

  const list =
    raw?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product ?? [];

  return list
    .filter((p): p is RawHotProduct => Boolean(p && p.product_id && p.product_main_image_url))
    .map<AEHotProduct>((p) => ({
      product_id: asString(p.product_id),
      product_title: asString(p.product_title).slice(0, 255),
      product_main_image_url: asString(p.product_main_image_url),
      product_detail_url: asString(p.product_detail_url),
      lastest_volume: asNumber(p.lastest_volume),
      sale_price: asString(p.sale_price),
      sale_price_currency: p.sale_price_currency,
      original_price: asString(p.original_price),
      original_price_currency: p.original_price_currency,
      commission_rate: asString(p.commission_rate),
      hot_product_commission_rate: p.hot_product_commission_rate,
      evaluate_rate: p.evaluate_rate,
      second_level_category_name: p.second_level_category_name,
      category_id: p.second_level_category_id != null ? String(p.second_level_category_id) : undefined,
      market: country,
    }));
}

export const SUPPORTED_MARKETS = ['AU', 'US', 'GB', 'CA', 'NZ', 'DE', 'SG'] as const;
export type SupportedMarket = (typeof SUPPORTED_MARKETS)[number];

/**
 * Loop fetchHotProducts across all 7 supported markets sequentially.
 * Returns the union of products keyed by product_id (last-wins on dupes).
 */
export async function fetchHotProductsAllMarkets(
  pageSize = 50,
): Promise<{ market: SupportedMarket; products: AEHotProduct[] }[]> {
  const results: { market: SupportedMarket; products: AEHotProduct[] }[] = [];
  for (const market of SUPPORTED_MARKETS) {
    try {
      const products = await fetchHotProducts({ country: market, pageSize });
      results.push({ market, products });
    } catch (err) {
      console.error(`[ae-hot-products] ${market} failed:`, err instanceof Error ? err.message : err);
      results.push({ market, products: [] });
    }
  }
  return results;
}
