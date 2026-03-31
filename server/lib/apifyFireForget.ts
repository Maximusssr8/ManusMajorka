/**
 * Fire-and-forget Apify wrapper.
 * Starts a run immediately, saves run_id to DB, returns in < 5s.
 * Results are harvested by the harvest cron later.
 */
import { getSupabaseAdmin } from '../_core/supabase';

const APIFY_BASE = 'https://api.apify.com/v2';

export async function startApifyRun(
  actor: string,
  source: string,
  input: Record<string, any>,
  memoryMbytes = 512
): Promise<{ runId: string } | null> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) { console.error('[apify-ff] No token'); return null; }

  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/${actor}/runs?token=${token}&memory=${memoryMbytes}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error(`[apify-ff] Start failed ${res.status}: ${err.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as { data?: { id: string; defaultDatasetId?: string } };
    const runId = data?.data?.id;
    if (!runId) { console.error('[apify-ff] No runId in response'); return null; }

    const supabase = getSupabaseAdmin();
    await supabase.from('apify_run_queue').insert({
      run_id: runId,
      actor,
      source,
      dataset_id: data?.data?.defaultDatasetId || null,
      status: 'running',
      started_at: new Date().toISOString(),
    }).catch((err: any) => console.error('[apify-ff] Queue insert:', err.message));

    console.log(`[apify-ff] Started ${actor} for ${source}: run=${runId}`);
    return { runId };
  } catch (err: any) {
    console.error('[apify-ff] Start error:', err.message);
    return null;
  }
}

export async function checkRunStatus(runId: string, actor: string): Promise<{
  status: string;
  datasetId?: string;
  itemCount?: number;
}> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/${actor}/runs/${runId}?token=${token}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json() as { data?: { status: string; defaultDatasetId?: string; stats?: { itemCount?: number } } };
    return {
      status: data?.data?.status || 'UNKNOWN',
      datasetId: data?.data?.defaultDatasetId,
      itemCount: data?.data?.stats?.itemCount,
    };
  } catch {
    return { status: 'UNKNOWN' };
  }
}

export async function fetchDatasetItems(datasetId: string, limit = 200): Promise<any[]> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  try {
    const res = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&clean=true&limit=${limit}`,
      { signal: AbortSignal.timeout(20000) }
    );
    const items = await res.json();
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}
