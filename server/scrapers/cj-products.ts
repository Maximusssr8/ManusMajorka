/**
 * CJ Dropshipping collector.
 * Wraps existing cjProducts.ts to deposit raw results to raw_scrape_results staging table.
 */
import { getSupabaseAdmin } from '../_core/supabase';
import { fetchCJProducts } from '../lib/cjProducts';

export async function collectCJProducts(): Promise<{ collected: number; errors: string[] }> {
  const supabase = getSupabaseAdmin();
  let collected = 0;
  const errors: string[] = [];

  try {
    const products = await fetchCJProducts().catch(() => []);
    if (!products.length) {
      errors.push('No CJ products returned');
      return { collected: 0, errors };
    }

    const rows = products.map((p) => ({
      source: 'cj_api',
      title: p.name || '',
      price_usd: Math.round((p.sourcePriceAud || 0) / 1.55 * 100) / 100,
      price_aud: p.sourcePriceAud || 0,
      orders_count: p.sellsCount || 0,
      rating: null,
      review_count: 0,
      image_url: p.image || '',
      product_url: p.url || '',
      source_product_id: p.id || '',
      category: p.category || 'General',
      extra_data: { margin: p.marginPct, trend: p.trend, score: p.score },
      processed: false,
    })).filter((r) => r.title && r.title.length > 5);

    if (rows.length) {
      const { error: insertErr } = await supabase.from('raw_scrape_results').insert(rows);
      if (insertErr) {
        errors.push(`CJ insert: ${insertErr.message}`);
      } else {
        collected = rows.length;
      }
    }
  } catch (err: any) {
    errors.push(`CJ error: ${err.message}`);
  }

  return { collected, errors };
}
