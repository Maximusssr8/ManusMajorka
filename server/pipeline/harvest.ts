/**
 * Harvest Pipeline
 * Runs every 15 minutes. Checks pending Apify runs, fetches completed datasets,
 * deposits results to raw_scrape_results staging table.
 */
import { getSupabaseAdmin } from '../_core/supabase';
import { checkRunStatus, fetchDatasetItems } from '../lib/apifyFireForget';
import { extractAEItemsFromDataset } from '../lib/apifyAliExpressBulk';
import { extractAmazonItemsFromDataset, AMAZON_AU_CATEGORIES } from '../lib/apifyAmazon';
import { extractTikTokItemsFromDataset } from '../lib/apifyTikTokShop';
import { extractCCItems } from '../scrapers/tiktok-creative-center';

const AUD_RATE = 1.58;

function sourceToExtractor(source: string): string {
  if (source.startsWith('aliexpress')) return 'aliexpress';
  if (source.startsWith('amazon')) return 'amazon';
  if (source.startsWith('tiktok')) return 'tiktok';
  return 'generic';
}

export async function harvestCompletedRuns(): Promise<{ harvested: number; stillRunning: number; failed: number }> {
  const supabase = getSupabaseAdmin();
  let harvested = 0, stillRunning = 0, failed = 0;

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: pendingRuns } = await supabase
    .from('apify_run_queue')
    .select('*')
    .eq('status', 'running')
    .gte('started_at', twoHoursAgo)
    .order('started_at', { ascending: true });

  if (!pendingRuns?.length) return { harvested: 0, stillRunning: 0, failed: 0 };

  console.log(`[harvest] Checking ${pendingRuns.length} pending runs`);

  for (const run of pendingRuns) {
    try {
      const { status, datasetId } = await checkRunStatus(run.run_id, run.actor);

      if (status === 'RUNNING' || status === 'READY') {
        stillRunning++;
        continue;
      }

      if (status === 'SUCCEEDED' && datasetId) {
        const items = await fetchDatasetItems(datasetId, 200);

        if (items.length > 0) {
          const rows: any[] = [];
          const ext = sourceToExtractor(run.source);

          if (ext === 'aliexpress') {
            const catName = run.source.replace('aliexpress_web_', '').replace(/_/g, ' ') || 'general';
            const aeItems = extractAEItemsFromDataset(items, catName);
            rows.push(...aeItems.map(p => ({
              source: 'aliexpress_web',
              title: p.title,
              price_usd: p.price_usd,
              price_aud: Math.round(p.price_usd * AUD_RATE * 100) / 100,
              orders_count: p.orders_count,
              rating: p.rating || null,
              review_count: p.review_count,
              image_url: p.image_url,
              product_url: p.product_url,
              source_product_id: p.aliexpress_product_id,
              category: p.category,
              extra_data: { is_choice: p.aliexpress_choice, free_shipping: p.free_shipping },
              processed: false,
            })));
          } else if (ext === 'amazon') {
            const catEntry = AMAZON_AU_CATEGORIES.find(c =>
              run.source.includes(c.name.toLowerCase().replace(/[\s&]/g, '_'))
            ) || { url: '', name: 'General' };
            const amzItems = extractAmazonItemsFromDataset(items, catEntry.name, catEntry.url);
            rows.push(...amzItems.map(p => ({
              source: 'amazon_au',
              title: p.title,
              price_usd: p.price_aud / AUD_RATE,
              price_aud: p.price_aud,
              orders_count: 0,
              rating: p.rating || null,
              review_count: p.review_count,
              image_url: p.image_url,
              product_url: p.product_url,
              source_product_id: p.asin,
              category: p.category,
              extra_data: { bsr: p.bsr, is_choice: p.is_amazons_choice, is_best_seller: p.is_best_seller },
              processed: false,
            })));
          } else if (ext === 'tiktok') {
            if (run.source === 'tiktok_cc') {
              const ccItems = extractCCItems(items);
              rows.push(...ccItems.map(p => ({
                source: 'tiktok_cc',
                title: p.title,
                price_usd: 0,
                price_aud: 0,
                orders_count: 0,
                image_url: p.thumbnail,
                category: 'general',
                processed: false,
              })));
            } else {
              const hashtag = run.source.replace('tiktok_shop_', '');
              const ttItems = extractTikTokItemsFromDataset(items, hashtag);
              rows.push(...ttItems.map(p => ({
                source: 'tiktok_shop',
                title: p.title,
                price_usd: p.price_usd,
                price_aud: Math.round(p.price_usd * AUD_RATE * 100) / 100,
                orders_count: 0,
                image_url: p.image_url,
                product_url: p.product_url,
                category: p.category,
                processed: false,
              })));
            }
          }

          if (rows.length > 0) {
            await supabase.from('raw_scrape_results').insert(rows).then(null, (err: any) =>
              console.error('[harvest] Insert error:', err.message)
            );
            harvested += rows.length;
          }
        }

        await supabase.from('apify_run_queue').update({
          status: 'harvested',
          completed_at: new Date().toISOString(),
          items_collected: items.length,
        }).eq('run_id', run.run_id);

      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        failed++;
        const retryCount = (run.retry_count || 0) + 1;
        await supabase.from('apify_run_queue').update({
          status: retryCount >= 2 ? 'failed' : 'running',
          retry_count: retryCount,
          error_message: `Run status: ${status}`,
        }).eq('run_id', run.run_id);
      }
    } catch (err: any) {
      console.error('[harvest] Error for run', run.run_id, ':', err.message);
    }
  }

  console.log(`[harvest] Done: harvested=${harvested}, running=${stillRunning}, failed=${failed}`);
  return { harvested, stillRunning, failed };
}
