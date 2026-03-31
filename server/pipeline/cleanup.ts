/**
 * Cleanup Pipeline
 * Runs daily. Removes old staging data, deactivates stale products.
 */
import { getSupabaseAdmin } from '../_core/supabase';

export async function runCleanup(): Promise<{ removed: number; archived: number; deduplicated: number }> {
  const supabase = getSupabaseAdmin();
  let removed = 0, archived = 0;
  const deduplicated = 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Remove processed raw scrape results older than 7 days
  const rawResult = await supabase.from('raw_scrape_results')
    .delete({ count: 'exact' })
    .lt('scraped_at', sevenDaysAgo)
    .eq('processed', true);
  removed += (rawResult.count as number) || 0;

  // Remove old Apify queue entries older than 7 days
  const queueResult = await supabase.from('apify_run_queue')
    .delete({ count: 'exact' })
    .lt('started_at', sevenDaysAgo)
    .in('status', ['harvested', 'failed']);
  removed += (queueResult.count as number) || 0;

  // Remove pipeline logs older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('pipeline_logs').delete().lt('started_at', thirtyDaysAgo).catch(() => {});

  // Soft-deactivate stale winning_products (score < 25, not seen in 30 days)
  const deactivateResult = await supabase.from('winning_products')
    .update({ is_active: false })
    .lt('winning_score', 25)
    .lt('last_seen_in_scrape_at', thirtyDaysAgo)
    .eq('is_active', true);
  archived += (deactivateResult.count as number) || 0;

  console.log(`[cleanup] removed=${removed}, archived/deactivated=${archived}`);
  return { removed, archived, deduplicated };
}
