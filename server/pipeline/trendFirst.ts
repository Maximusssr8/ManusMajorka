/**
 * Trend-First Pipeline Orchestrator
 * Replaces keyword-based scraping with real trending data.
 *
 * Runs on schedule:
 *   Every 6h: TikTok Shop, TikTok Creative Center, Google Trends
 *   Every 12h: AliExpress categories, CJ top sellers
 *   Every 24h: AliExpress Choice/Hot + full CJ refresh
 */

import { scrapeCJTopSellers } from '../scrapers/cj-top-sellers';
import { launchAECategoryBestsellerScrapes } from '../scrapers/ae-category-bestsellers';

export type PipelineMode = 'fast' | 'full' | 'cj_only' | 'ae_only';

export async function runTrendFirstPipeline(mode: PipelineMode = 'full'): Promise<{
  cjInserted: number;
  aeRunsStarted: number;
  error?: string;
}> {
  let cjInserted = 0;
  let aeRunsStarted = 0;

  try {
    // Source 4: CJ Top Sellers — always reliable, run synchronously
    if (mode === 'full' || mode === 'cj_only') {
      console.info('[trend-pipeline] Running CJ top sellers...');
      const pages = mode === 'full' ? 5 : 3;
      cjInserted = await scrapeCJTopSellers(pages);
    }

    // Source 1: AliExpress Category Bestsellers — fire-and-forget
    if (mode === 'full' || mode === 'ae_only') {
      console.info('[trend-pipeline] Launching AE category scrapes...');
      const runIds = await launchAECategoryBestsellerScrapes();
      aeRunsStarted = runIds.length;
    }

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('[trend-pipeline] Error:', error);
    return { cjInserted, aeRunsStarted, error };
  }

  console.info(`[trend-pipeline] Done: CJ=${cjInserted}, AE runs=${aeRunsStarted}`);
  return { cjInserted, aeRunsStarted };
}
