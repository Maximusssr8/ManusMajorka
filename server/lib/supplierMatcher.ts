/**
 * Supplier Matcher
 * Given a product title, find the best matching supplier. The former
 * CJ-based implementation was purged along with the CJ pipeline; this file
 * retains the same public surface so callers don't break, but the CJ path
 * now always reports "no match" and only the AliExpress fallback is live.
 */

export interface SupplierMatch {
  platform: 'aliexpress' | 'none';
  found: boolean;
  confidence: number; // 0-100
  cost_price_aud: number | null;
  supplier_url: string | null;
  cj_product_id: string | null;
  shipping_days_min: number | null;
  shipping_days_max: number | null;
  inventory_count: number | null;
  supplier_name: string | null;
  match_title: string | null;
}

const NO_MATCH: SupplierMatch = {
  platform: 'none',
  found: false,
  confidence: 0,
  cost_price_aud: null,
  supplier_url: null,
  cj_product_id: null,
  shipping_days_min: null,
  shipping_days_max: null,
  inventory_count: null,
  supplier_name: null,
  match_title: null,
};

/**
 * Deprecated. CJ pipeline removed — always returns no match. Callers should
 * migrate to `buildAliExpressSupplierFromExisting`.
 */
export async function findCJSupplier(_productTitle: string): Promise<SupplierMatch> {
  return NO_MATCH;
}

export function buildAliExpressSupplierFromExisting(
  product: Record<string, unknown>,
): SupplierMatch {
  const aliexpressUrl = typeof product.aliexpress_url === 'string' ? product.aliexpress_url : null;
  const costAud =
    typeof product.cost_price_aud === 'number'
      ? product.cost_price_aud
      : typeof product.supplier_cost_aud === 'number'
        ? product.supplier_cost_aud
        : null;
  const shopName = typeof product.shop_name === 'string' ? product.shop_name : null;
  const title = typeof product.product_title === 'string' ? product.product_title : null;
  const hasUrl = !!aliexpressUrl;
  const hasCost = costAud != null;

  return {
    platform: hasUrl ? 'aliexpress' : 'none',
    found: hasUrl,
    confidence: hasUrl && hasCost ? 90 : hasUrl ? 70 : 0,
    cost_price_aud: costAud,
    supplier_url: aliexpressUrl,
    cj_product_id: null,
    shipping_days_min: 10,
    shipping_days_max: 20,
    inventory_count: null,
    supplier_name: shopName ?? (hasUrl ? 'AliExpress Seller' : null),
    match_title: title,
  };
}
