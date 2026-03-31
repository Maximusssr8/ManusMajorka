/**
 * Supplier Matcher
 * Given a product title, find the best matching supplier on CJ or AliExpress.
 * Returns real cost price, shipping time, and direct buy link.
 */

import { fetchCJToken } from './cjProducts';

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const USD_TO_AUD = 1.55;

export interface SupplierMatch {
  platform: 'cj_dropshipping' | 'aliexpress' | 'none';
  found: boolean;
  confidence: number;        // 0-100
  cost_price_aud: number | null;
  supplier_url: string | null;
  cj_product_id: string | null;
  shipping_days_min: number | null;
  shipping_days_max: number | null;
  inventory_count: number | null;
  supplier_name: string | null;
  match_title: string | null;  // what the supplier calls it
}

// Simple title similarity: Jaccard on word sets
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? Math.round((intersection / union) * 100) : 0;
}

export async function findCJSupplier(productTitle: string): Promise<SupplierMatch> {
  const noMatch: SupplierMatch = {
    platform: 'none', found: false, confidence: 0,
    cost_price_aud: null, supplier_url: null, cj_product_id: null,
    shipping_days_min: null, shipping_days_max: null, inventory_count: null,
    supplier_name: null, match_title: null,
  };

  const token = await fetchCJToken();
  if (!token) return noMatch;

  try {
    // Use first 5 words of title for keyword search
    const keywords = productTitle.split(/\s+/).slice(0, 5).join(' ');
    const params = new URLSearchParams({
      productKeyword: keywords,
      pageNum: '1',
      pageSize: '10',
      sortField: 'sells',
    });

    const res = await fetch(`${CJ_BASE}/product/list?${params}`, {
      headers: { 'CJ-Access-Token': token },
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await res.json();
    if (!data.success || !data.data?.list?.length) return noMatch;

    const items = data.data.list as any[];

    // Find best match by title similarity
    let best: any = null;
    let bestSim = 0;
    for (const item of items) {
      const itemTitle = item.productNameEn || item.productName || '';
      const sim = titleSimilarity(productTitle, itemTitle);
      if (sim > bestSim) { bestSim = sim; best = item; }
    }

    if (!best || bestSim < 40) return noMatch; // below 40% similarity → no match

    const usdSource = parseFloat(
      best.variants?.[0]?.variantSellPrice || best.sourcePrice || best.sellPrice || '0'
    ) || 0;
    const costAud = usdSource > 0 ? Math.round(usdSource * USD_TO_AUD * 100) / 100 : null;
    const pid = best.pid || best.productId || '';
    const sku = best.productSku || pid;

    return {
      platform: 'cj_dropshipping',
      found: true,
      confidence: bestSim,
      cost_price_aud: costAud,
      supplier_url: sku ? `https://cjdropshipping.com/product/-p-${sku}.html` : null,
      cj_product_id: pid || null,
      shipping_days_min: 7,
      shipping_days_max: 15,
      inventory_count: null, // requires detail call
      supplier_name: best.supplierName || 'CJ Dropshipping',
      match_title: best.productNameEn || best.productName || null,
    };
  } catch {
    return noMatch;
  }
}

export function buildAliExpressSupplierFromExisting(product: Record<string, any>): SupplierMatch {
  const hasUrl = !!product.aliexpress_url;
  const hasCost = !!(product.cost_price_aud || product.supplier_cost_aud);

  return {
    platform: hasUrl ? 'aliexpress' : 'none',
    found: hasUrl,
    confidence: hasUrl && hasCost ? 90 : hasUrl ? 70 : 0,
    cost_price_aud: product.cost_price_aud || product.supplier_cost_aud || null,
    supplier_url: product.aliexpress_url || null,
    cj_product_id: null,
    shipping_days_min: 10,
    shipping_days_max: 20,
    inventory_count: null,
    supplier_name: product.shop_name || 'AliExpress Seller',
    match_title: product.product_title || null,
  };
}
