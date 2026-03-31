/**
 * Score Refresh Pipeline
 * Runs daily. Decays stale products, boosts frequently-seen products.
 */
import { getSupabaseAdmin } from '../_core/supabase';
import { getQualityTier } from '../lib/signalScoring';

export async function runScoreRefresh(): Promise<{ updated: number; boosted: number; decayed: number }> {
  const supabase = getSupabaseAdmin();
  let updated = 0, boosted = 0, decayed = 0;

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Decay: products not seen in scrapes for 14+ days
  const { data: stale } = await supabase.from('winning_products')
    .select('id, signal_score, winning_score')
    .lt('last_seen_in_scrape_at', fourteenDaysAgo)
    .eq('is_active', true)
    .gt('signal_score', 10);

  for (const p of (stale || [])) {
    const newScore = Math.max(5, (p.signal_score || 50) - 5);
    const newWinScore = Math.max(5, (p.winning_score || 50) - 3);
    await supabase.from('winning_products').update({
      signal_score: newScore,
      winning_score: newWinScore,
      quality_tier: getQualityTier(newScore),
    }).eq('id', p.id).catch(() => {});
    decayed++;
  }

  // Boost: products seen multiple times in last 7 days
  const { data: active } = await supabase.from('winning_products')
    .select('id, signal_score, winning_score, times_seen_in_scrapes')
    .gte('last_seen_in_scrape_at', sevenDaysAgo)
    .gt('times_seen_in_scrapes', 2)
    .lt('signal_score', 140);

  for (const p of (active || []).slice(0, 100)) {
    const boost = Math.min(10, (p.times_seen_in_scrapes || 1) * 2);
    const newScore = Math.min(150, (p.signal_score || 40) + boost);
    await supabase.from('winning_products').update({
      signal_score: newScore,
      quality_tier: getQualityTier(newScore),
    }).eq('id', p.id).catch(() => {});
    boosted++;
  }

  updated = decayed + boosted;
  console.log(`[refresh-scores] updated=${updated}, boosted=${boosted}, decayed=${decayed}`);
  return { updated, boosted, decayed };
}
