/**
 * Trend-First Pipeline Orchestrator
 * Replaces keyword-based scraping with real trending data.
 *
 * Runs on schedule:
 *   Every 6h: TikTok Shop, TikTok Creative Center, Google Trends
 *   Every 12h: AliExpress categories, CJ top sellers
 *   Every 24h: AliExpress Choice/Hot + full CJ refresh
 */

import { launchAECategoryBestsellerScrapes } from '../scrapers/ae-category-bestsellers';

export type PipelineMode = 'fast' | 'full' | 'ae_only';

export async function runTrendFirstPipeline(mode: PipelineMode = 'full'): Promise<{
  cjInserted: number;
  aeRunsStarted: number;
  error?: string;
}> {
  // cjInserted retained in return shape for back-compat with cron callers; always 0.
  let aeRunsStarted = 0;

  try {
    if (mode === 'full' || mode === 'ae_only') {
      console.info('[trend-pipeline] Launching AE category scrapes...');
      const runIds = await launchAECategoryBestsellerScrapes();
      aeRunsStarted = runIds.length;
    }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('[trend-pipeline] Error:', error);
    return { cjInserted: 0, aeRunsStarted, error };
  }

  console.info(`[trend-pipeline] Done: AE runs=${aeRunsStarted}`);
  return { cjInserted: 0, aeRunsStarted };
}
