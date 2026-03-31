/**
 * CJ Dropshipping — Real Data Pipeline
 * Pulls 100 real products per category with full details.
 * Upserts directly to winning_products (no staging table needed).
 *
 * Uses CJ API v2:
 *  POST /v1/product/list  (list by category, sorted by sales)
 *  GET  /v1/product/query (full product detail including shipping/weight)
 */

import { getSupabaseAdmin } from '../_core/supabase';

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const USD_TO_AUD = 1.55;

let _token: string | null = null;
let _tokenExpiry = 0;

// ── Auth ─────────────────────────────────────────────────────────────────────

async function getCJToken(): Promise<string | null> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) { console.warn('[CJ-Real] CJ_API_KEY not set'); return null; }
  if (_token && Date.now() < _tokenExpiry) return _token;
  try {
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await res.json();
    if (!data.success || !data.data?.accessToken) {
      console.error('[CJ-Real] Auth failed:', data.message);
      return null;
    }
    _token = data.data.accessToken;
    _tokenExpiry = Date.now() + 14 * 24 * 3600 * 1000;
    console.log('[CJ-Real] Token obtained');
    return _token;
  } catch (err: any) {
    console.error('[CJ-Real] Auth error:', err.message);
    return null;
  }
}

// ── 12 target categories ─────────────────────────────────────────────────────

const CJ_CATEGORIES = [
  { name: 'Pet Supplies',                 slug: 'pet' },
  { name: 'Beauty & Personal Care',       slug: 'beauty' },
  { name: 'Home & Garden',                slug: 'home' },
  { name: 'Sports & Outdoors',            slug: 'fitness' },
  { name: 'Electronics Accessories',      slug: 'electronics' },
  { name: 'Baby & Maternity',             slug: 'baby' },
  { name: 'Kitchen',                      slug: 'kitchen' },
  { name: 'Health & Beauty',              slug: 'health' },
  { name: "Women's Accessories",          slug: 'fashion' },
  { name: "Men's Accessories",            slug: 'accessories' },
  { name: 'Toys & Games',                 slug: 'toys' },
  { name: 'Tools & DIY',                  slug: 'tools' },
];

// ── Product list ──────────────────────────────────────────────────────────────

async function fetchCategoryList(token: string, categoryName: string, page = 1, pageSize = 50): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      categoryName,
      pageNum: String(page),
      pageSize: String(pageSize),
      sortField: 'sells',
      sortOrder: 'DESC',
    });
    const res = await fetch(`${CJ_BASE}/product/list?${params}`, {
      headers: { 'CJ-Access-Token': token },
      signal: AbortSignal.timeout(20000),
    });
    const data: any = await res.json();
    if (!data.success) {
      console.warn('[CJ-Real] List failed:', categoryName, data.message);
      return [];
    }
    return data.data?.list || [];
  } catch (err: any) {
    console.warn('[CJ-Real] List error:', categoryName, err.message);
    return [];
  }
}

// ── Full product detail ───────────────────────────────────────────────────────

async function fetchProductDetail(token: string, pid: string): Promise<any | null> {
  try {
    const res = await fetch(`${CJ_BASE}/product/query?pid=${pid}`, {
      headers: { 'CJ-Access-Token': token },
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await res.json();
    if (!data.success) return null;
    return data.data || null;
  } catch {
    return null;
  }
}

// ── Build winning_products row from CJ data ───────────────────────────────────

function buildProductRow(item: any, detail: any | null, category: string, slug: string) {
  const pid = item.pid || item.productId || '';
  const name = item.productNameEn || item.productName || '';
  if (!pid || !name || name.length < 5) return null;

  const usdSell = parseFloat(item.sellPrice || item.listingPrice || '0');
  const usdSource = parseFloat(
    detail?.variants?.[0]?.variantSellPrice ||
    item.sourcePrice ||
    item.variants?.[0]?.variantSellPrice ||
    '0'
  ) || usdSell * 0.35;

  const priceAud = Math.round(usdSell * USD_TO_AUD * 100) / 100;
  const costAud  = Math.round(usdSource * USD_TO_AUD * 100) / 100;
  const margin   = priceAud > 0 ? Math.round((priceAud - costAud) / priceAud * 100) : 0;
  const sells    = parseInt(item.sells || item.salesCount || '0', 10);

  // Skip products with no real data
  if (priceAud <= 0 || costAud <= 0) return null;
  if (margin < 20 || margin > 90) return null; // unrealistic margins

  // Shipping info
  const shippingDays = detail?.shippingTime ? parseInt(detail.shippingTime, 10) : null;
  const weight = detail?.productWeight ? parseFloat(detail.productWeight) / 1000 : null; // g → kg

  // CJ product URL
  const sku  = detail?.productSku || item.productSku || '';
  const cjUrl = sku
    ? `https://cjdropshipping.com/product/-p-${sku}.html`
    : pid ? `https://cjdropshipping.com/product/-p-${pid}.html` : '';

  // Score based on sales rank
  const score = Math.min(85, Math.max(45, Math.round(40 + Math.log10(Math.max(1, sells)) * 10)));

  // Product images
  const images: string[] = [];
  if (item.productImage) images.push(item.productImage);
  if (detail?.productImage && !images.includes(detail.productImage)) images.push(detail.productImage);
  const imageUrl = images[0] || '';
  if (!imageUrl) return null;

  return {
    product_title: name.slice(0, 255),
    image_url: imageUrl,
    category: category,
    platform: 'cj_dropshipping',
    price_aud: priceAud,
    cost_price_aud: costAud,
    supplier_cost_aud: costAud,
    profit_margin: margin,
    orders_count: sells,
    units_per_day: Math.max(1, Math.round(sells / 90)),
    shop_name: detail?.sellerName || item.supplierName || 'CJ Dropshipping',
    aliexpress_url: cjUrl, // re-use supplier URL field
    source_url: cjUrl,
    data_source: 'cj_api',
    cj_product_id: pid,
    source_product_id: pid,
    weight_kg: weight,
    shipping_time_days_min: shippingDays ? Math.max(5, shippingDays - 3) : 7,
    shipping_time_days_max: shippingDays ? shippingDays + 5 : 15,
    winning_score: score,
    tiktok_signal: false,
    trend: sells > 500 ? 'rising' : 'stable',
    competition_level: margin > 50 ? 'Low' : margin > 35 ? 'Medium' : 'High',
    au_relevance: 75,
    tags: [slug.charAt(0).toUpperCase() + slug.slice(1)],
    updated_at: new Date().toISOString(),
  };
}

// ── Main: collect real CJ products → upsert to winning_products ──────────────

export async function collectRealCJProducts(): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const token = await getCJToken();
  if (!token) return { inserted: 0, updated: 0, errors: ['No CJ token'] };

  const supabase = getSupabaseAdmin();
  let inserted = 0;
  let updated  = 0;
  const errors: string[] = [];

  for (const { name: catName, slug } of CJ_CATEGORIES) {
    console.log(`[CJ-Real] Category: ${catName}`);
    const rawItems: any[] = [];

    // Fetch up to 2 pages (100 products per category)
    for (let page = 1; page <= 2; page++) {
      const items = await fetchCategoryList(token, catName, page, 50);
      if (!items.length) break;
      rawItems.push(...items);
      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[CJ-Real]   ${rawItems.length} raw items in ${catName}`);

    // Fetch detail for each product (rate limited: 1 per 300ms)
    for (const item of rawItems) {
      const pid = item.pid || item.productId;
      if (!pid) continue;

      const detail = await fetchProductDetail(token, pid);
      await new Promise(r => setTimeout(r, 350));

      const row = buildProductRow(item, detail, catName, slug);
      if (!row) continue;

      // Upsert by cj_product_id if column exists, else by product_title
      try {
        // Try upsert by cj_product_id first
        const { data: existing } = await supabase
          .from('winning_products')
          .select('id')
          .eq('cj_product_id', pid)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await supabase
            .from('winning_products')
            .update({ ...row, last_refreshed: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) errors.push(`Update ${pid}: ${error.message}`);
          else updated++;
        } else {
          const { error } = await supabase
            .from('winning_products')
            .insert({ ...row, created_at: new Date().toISOString() });
          if (error) errors.push(`Insert ${pid}: ${error.message}`);
          else inserted++;
        }
      } catch (err: any) {
        errors.push(`Upsert error ${pid}: ${err.message}`);
      }
    }

    console.log(`[CJ-Real] Category done — inserted:${inserted} updated:${updated} errors:${errors.length}`);
    // Pause between categories to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  return { inserted, updated, errors: errors.slice(0, 20) };
}
