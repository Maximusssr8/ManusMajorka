/**
 * Pipeline routes — cron + admin triggers for the Apify pintostudio pipeline.
 *
 * Endpoints:
 *   POST/GET /api/cron/apify-pipeline   gated by CRON_SECRET (Bearer) or Vercel
 *   POST     /api/admin/trigger-pipeline  gated by X-Admin-Token = ADMIN_TOKEN
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { runApifyPintostudioPipeline } from '../lib/apifyPintostudio';

const router = Router();

function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.authorization ?? '';
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) {
    const ua = String(req.headers['user-agent'] ?? '');
    const isVercelCron = ua.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
    const isLocal = String(req.headers.host ?? '').includes('localhost');
    return isVercelCron || isLocal;
  }
  return auth === `Bearer ${secret}`;
}

function verifyAdminToken(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN ?? '';
  if (!token) return false;
  const provided = String(req.headers['x-admin-token'] ?? '');
  return provided.length > 0 && provided === token;
}

const resultSchema = z.object({
  status: z.enum(['success', 'partial', 'error']),
  productsAdded: z.number().int(),
  productsUpdated: z.number().int(),
  productsRejected: z.number().int(),
  durationMs: z.number().int(),
  logId: z.string().nullable(),
  sourceBreakdown: z.record(z.string(), z.number()),
  errors: z.array(z.string()),
});

async function handleRun(res: Response): Promise<void> {
  try {
    const result = await runApifyPintostudioPipeline();
    const parsed = resultSchema.parse(result);
    res.json({ success: true, ...parsed });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    res.status(500).json({ success: false, error: msg });
  }
}

router.post('/cron/apify-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await handleRun(res);
});

router.get('/cron/apify-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await handleRun(res);
});

router.post('/admin/trigger-pipeline', async (req: Request, res: Response) => {
  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await handleRun(res);
});

/**
 * GET /api/admin/test-apify
 *
 * Diagnostic endpoint. Calls the pintostudio actor ONCE with a tiny query
 * (`home gadgets`, maxItems=5) and returns the raw Apify run + dataset so
 * we can see exactly what the actor is doing. Admin-token gated.
 *
 * Returns:
 *   {
 *     env: { apifyKeyPresent, apifyKeyPrefix, nodeEnv },
 *     start: { url, status, body },        // actor run start
 *     poll:  { status, datasetId },         // final poll status
 *     dataset: { url, status, itemCount, sample } // first 3 items
 *   }
 */
router.get('/admin/test-apify', async (req: Request, res: Response) => {
  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const apifyKey = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || '';
  const ACTOR = 'pintostudio~aliexpress-product-search';
  const APIFY_BASE = 'https://api.apify.com/v2';

  const report: Record<string, unknown> = {
    env: {
      apifyKeyPresent: apifyKey.length > 0,
      apifyKeyPrefix: apifyKey ? `${apifyKey.slice(0, 8)}…` : '(missing)',
      nodeEnv: process.env.NODE_ENV ?? '(unset)',
      adminTokenPresent: Boolean(process.env.ADMIN_TOKEN),
      supabaseUrlPresent: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      supabaseServiceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  };

  if (!apifyKey) {
    res.status(200).json({ ...report, error: 'APIFY_API_KEY not set in Vercel env' });
    return;
  }

  const body = {
    query: 'home gadgets',
    keyword: 'home gadgets',
    searchQuery: 'home gadgets',
    searchText: 'home gadgets',
    text: 'home gadgets',
    q: 'home gadgets',
    maxItems: 5,
    maxResults: 5,
    resultsLimit: 5,
    sortBy: 'ORDERS',
    sort: 'ORDERS',
    shipTo: 'AU',
    country: 'AU',
  };

  try {
    // 1) Start run
    const startUrl = `${APIFY_BASE}/acts/${ACTOR}/runs?token=${apifyKey}&timeout=120`;
    const startRes = await fetch(startUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const startText = await startRes.text();
    report.start = {
      url: startUrl.replace(apifyKey, `${apifyKey.slice(0, 6)}…`),
      status: startRes.status,
      bodySent: body,
      responseBody: startText.slice(0, 1500),
    };
    if (!startRes.ok) {
      res.status(200).json(report);
      return;
    }

    const startJson = JSON.parse(startText) as { data?: { id?: string; defaultDatasetId?: string } };
    const runId = startJson.data?.id;
    let datasetId = startJson.data?.defaultDatasetId;
    if (!runId) {
      res.status(200).json(report);
      return;
    }

    // 2) Poll up to 60s (20 × 3s) — short enough to stay within the
    //    serverless response budget on Vercel.
    let status = 'RUNNING';
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apifyKey}`);
      if (!pollRes.ok) continue;
      const pollJson = (await pollRes.json()) as { data?: { status?: string; defaultDatasetId?: string } };
      status = pollJson.data?.status ?? 'RUNNING';
      datasetId = pollJson.data?.defaultDatasetId ?? datasetId;
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') break;
    }
    report.poll = { status, datasetId };

    // 3) Dataset items
    if (datasetId) {
      const dsUrl = `${APIFY_BASE}/datasets/${datasetId}/items?token=${apifyKey}&clean=true&limit=3`;
      const dsRes = await fetch(dsUrl);
      const dsText = await dsRes.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(dsText); } catch { parsed = dsText.slice(0, 500); }
      const items = Array.isArray(parsed) ? parsed : [];
      report.dataset = {
        url: dsUrl.replace(apifyKey, `${apifyKey.slice(0, 6)}…`),
        status: dsRes.status,
        itemCount: items.length,
        sample: items.slice(0, 3),
      };
    }

    res.status(200).json(report);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    res.status(200).json({ ...report, fatal: msg });
  }
});

/**
 * GET /api/admin/db-info
 *
 * Diagnostic endpoint — returns row counts for every table the pipeline
 * touches, plus the 3 most recent pipeline_logs rows. Admin-token gated.
 * Lets operators verify the pipeline is actually inserting without having
 * to open the Supabase dashboard.
 */
router.get('/admin/db-info', async (req: Request, res: Response) => {
  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const { getSupabaseAdmin } = await import('../_core/supabase');
    const sb = getSupabaseAdmin();
    const tables = ['winning_products', 'trend_signals', 'raw_scrape_results', 'product_history', 'alerts', 'academy_progress', 'revenue_entries'];
    const counts: Record<string, number | string> = {};
    for (const t of tables) {
      const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
      counts[t] = error ? `ERROR: ${error.message}` : (count ?? 0);
    }
    const { data: recentLogs, error: logsErr } = await sb
      .from('pipeline_logs')
      .select('id,pipeline_type,status,started_at,finished_at,duration_ms,products_added,products_updated,products_rejected,inserted,updated,raw_collected,source_breakdown,error_message')
      .order('started_at', { ascending: false })
      .limit(5);
    res.json({
      ok: true,
      canonical_products_table: 'winning_products',
      counts,
      recent_pipeline_runs: logsErr ? `ERROR: ${logsErr.message}` : (recentLogs ?? []),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    res.status(500).json({ error: msg });
  }
});

export default router;
