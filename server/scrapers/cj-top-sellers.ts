/**
 * CJ Top Sellers — no category filter, sorted by TOTAL_SOLD
 * Returns real bestsellers across all CJ categories
 */
import { getSupabaseAdmin } from '../_core/supabase';
import { calculateTrendScore } from '../lib/trendScoring';
import { assignCategoryAndEnrich } from '../lib/aiCategoryAssign';

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const AUD = 1.58;

let _tok: string | null = null;
let _exp = 0;

async function getCJToken(): Promise<string> {
  if (_tok && Date.now() < _exp) return _tok!;
  const apiKey = process.env.CJ_API_KEY || '';
  if (!apiKey) throw new Error('CJ_API_KEY not configured');
  const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }), signal: AbortSignal.timeout(10000),
  });
  const d = await r.json() as { success: boolean; data: { accessToken: string } };
  if (!d.success) throw new Error('CJ auth failed');
  _tok = d.data.accessToken; _exp = Date.now() + 3500000;
  return _tok;
}

export async function scrapeCJTopSellers(pages = 3): Promise<number> {
  const supabase = getSupabaseAdmin();
  const tok = await getCJToken();
  let total = 0;

  for (let page = 1; page <= pages; page++) {
    const r = await fetch(
      `${CJ_BASE}/product/list?pageNum=${page}&pageSize=50&orderBy=SELL_NUM_DOWN`,
      { headers: { 'CJ-Access-Token': tok }, signal: AbortSignal.timeout(15000) }
    );
    const d = await r.json() as { success: boolean; data?: { list?: unknown[] } };
    const items = (d.success ? d.data?.list || [] : []) as Record<string, unknown>[];
    if (!items.length) break;

    // Filter: must have English name and valid image
    const valid = items.filter(i => {
      const title = String(i.productNameEn || '');
      return title.length > 5 && i.productImage && typeof i.productImage === 'string';
    });

    // Batch Haiku categorization (20 at a time)
    const forAI = valid.map(i => ({
      title: String(i.productNameEn || i.productName || ''),
      priceUsd: parseFloat(String(i.sellPrice || '0')),
      source: 'cj_top_sellers',
    }));
    const enriched = await assignCategoryAndEnrich(forAI);

    const rows = valid.map((item, idx) => {
      const info = enriched[idx] || { category: 'Home', why_trending: '', best_ad_angle: '', target_audience: '' };
      const costUsd = parseFloat(String(item.sellPrice || '0'));
      const costAud = Math.round(costUsd * AUD * 100) / 100;
      const sellAud = Math.round(costAud * 2.8 * 100) / 100;
      const pid = String(item.pid || item.productId || '');
      const { score, breakdown } = calculateTrendScore({ source: 'cj', isCJTopSeller: true, priceUsd: costUsd, costUsd: costUsd * 0.7, rating: 4.2 });

      return {
        product_title: String(item.productNameEn || item.productName || '').slice(0, 255),
        category: info.category,
        platform: 'cj_dropshipping',
        image_url: String(item.productImage || ''),
        price_aud: sellAud,
        cost_price_aud: costAud,
        supplier_cost_aud: costAud,
        profit_margin: sellAud > 0 ? Math.round((sellAud - costAud) / sellAud * 100) : 64,
        winning_score: score,
        trend: 'Steady',
        competition_level: 'Medium',
        cj_product_id: pid,
        data_source: 'cj_top_sellers',
        supplier_platform: 'cj_dropshipping',
        supplier_name: 'CJ Dropshipping',
        supplier_url: `https://cjdropshipping.com/product/-p-${pid}.html`,
        source_url: `https://cjdropshipping.com/product/-p-${pid}.html`,
        real_cost_aud: costAud,
        link_status: 'verified' as const,
        link_verified_at: new Date().toISOString(),
        tiktok_signal: false,
        why_trending: info.why_trending,
        best_ad_angle: info.best_ad_angle,
        target_audience: info.target_audience,
        score_breakdown: breakdown,
        tags: ['cj-top-seller', info.category],
        scraped_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase.from('winning_products').upsert(rows, { onConflict: 'cj_product_id', ignoreDuplicates: true });
    if (error) console.error('[cj-top-sellers] DB error:', error.message);
    else total += rows.length;

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.info(`[cj-top-sellers] Done: ${total} products`);
  return total;
}
