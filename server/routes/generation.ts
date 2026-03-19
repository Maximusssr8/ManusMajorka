/**
 * generation.ts — async store generation routes
 *
 * POST /api/enqueue-generation  → insert job, invoke edge fn, return { jobId }
 * GET  /api/job-status/:jobId   → SSE stream: queued → processing → plan_ready → done
 * POST /api/create-generation-table → one-time setup (admin only)
 */

import type { Application } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';
import { requireSubscription } from '../middleware/requireSubscription';
import { rateLimit } from '../lib/rate-limit';

// Supabase project URL for invoking edge functions
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function authenticateRequest(req: any): Promise<{ userId: string; email: string } | null> {
  try {
    const token = (req.headers?.authorization || '').replace('Bearer ', '').trim();
    if (!token) return null;
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id, email: user.email || '' };
  } catch { return null; }
}

async function invokeEdgeFunction(fnName: string, body: Record<string, unknown>): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const url = `${SUPABASE_URL}/functions/v1/${fnName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SRV}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Edge function ${fnName} returned ${res.status}: ${err.slice(0, 200)}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export function registerGenerationRoutes(app: Application): void {

  // ── POST /api/enqueue-generation ─────────────────────────────────────────────
  app.post('/api/enqueue-generation', requireSubscription, async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

      const rl = rateLimit(`gen-enqueue:${user.userId}`, 10, 3600_000);
      if (!rl.allowed) { res.status(429).json({ error: 'Rate limit exceeded' }); return; }

      const { storeName, productName, niche, price, imageUrl, template, productData } = req.body as {
        storeName?: string; productName?: string; niche?: string; price?: string;
        imageUrl?: string; template?: string; productData?: Record<string, unknown>;
      };
      if (!niche) { res.status(400).json({ error: 'niche is required' }); return; }

      const supabase = getSupabaseAdmin();

      // Insert job row
      const { data: job, error: insertErr } = await supabase
        .from('generation_jobs')
        .insert({
          user_id: user.userId,
          status: 'queued',
          store_name: storeName || niche,
          product_name: productName || (productData?.product_title as string) || niche,
          niche,
          price: price || '49.95',
          image_url: imageUrl || (productData?.image_url as string) || '',
          template: template || 'auto',
        })
        .select('id')
        .single();

      if (insertErr || !job) {
        console.error('[enqueue] Insert failed:', insertErr?.message);
        res.status(500).json({ error: 'Failed to create job' });
        return;
      }

      const jobId = job.id as string;
      console.log('[enqueue] Created job:', jobId);

      // Return immediately — invoke edge function in background
      res.json({ jobId, status: 'queued' });

      // Fire-and-forget: invoke Supabase edge function
      invokeEdgeFunction('run-generation', {
        jobId,
        storeName: storeName || niche,
        productName: productName || (productData?.product_title as string) || niche,
        niche,
        price: price || '49.95',
        imageUrl: imageUrl || (productData?.image_url as string) || '',
        template: template || '',
        productData: productData || {},
      }).then((result) => {
        if (!result.ok) {
          console.error('[enqueue] Edge function error:', result.error);
          // Update job status to error
          supabase.from('generation_jobs').update({ status: 'error', error_msg: result.error })
            .eq('id', jobId).then(() => {});
        } else {
          console.log('[enqueue] Edge function invoked OK for job:', jobId);
        }
      }).catch((err) => {
        console.error('[enqueue] Edge function invoke threw:', err.message);
        supabase.from('generation_jobs').update({ status: 'error', error_msg: err.message })
          .eq('id', jobId).then(() => {});
      });

    } catch (err: any) {
      console.error('[enqueue] Unexpected error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── GET /api/job-status/:jobId ────────────────────────────────────────────────
  // SSE stream — polls job row and renders HTML when plan_ready
  app.get('/api/job-status/:jobId', async (req, res) => {
    const { jobId } = req.params;
    if (!jobId) { res.status(400).json({ error: 'jobId required' }); return; }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (evt: string, data: unknown) =>
      res.write(`event: ${evt}\ndata: ${JSON.stringify(data)}\n\n`);

    send('progress', { pct: 5, msg: '⏳ Job queued...' });

    const supabase = getSupabaseAdmin();
    let done = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 × 2s = 120s max wait
    let lastStatus = 'queued';

    const poll = async () => {
      if (done) return;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        send('error', { error: 'Generation timed out — please try again' });
        res.end();
        return;
      }

      const { data: job, error } = await supabase
        .from('generation_jobs')
        .select('id, status, plan_json, result_html, error_msg')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        console.error('[job-status] Poll error:', error?.message);
        setTimeout(poll, 2000);
        return;
      }

      const status = job.status as string;

      if (status !== lastStatus) {
        lastStatus = status;
        console.log(`[job-status] ${jobId} → ${status}`);
        const pctMap: Record<string, number> = { queued: 5, processing: 20, plan_ready: 60, rendering: 80, done: 100, error: 0 };
        const msgMap: Record<string, string> = {
          queued: '⏳ Job queued...',
          processing: '🤖 Generating brand plan...',
          plan_ready: '🏗️ Building store structure...',
          rendering: '🎨 Applying design system...',
          done: '✅ Your store is ready!',
        };
        if (status !== 'error' && status !== 'done') {
          send('progress', { pct: pctMap[status] || 20, msg: msgMap[status] || 'Processing...' });
        }
      }

      if (status === 'error') {
        send('error', { error: job.error_msg || 'Generation failed' });
        res.end();
        done = true;
        return;
      }

      if (status === 'done' && job.result_html) {
        send('progress', { pct: 100, msg: '✅ Your store is ready!' });
        send('done', { html: job.result_html });
        res.end();
        done = true;
        return;
      }

      if (status === 'plan_ready' && job.plan_json) {
        // Render HTML in Vercel (fast, no timeout risk)
        send('progress', { pct: 70, msg: '🏗️ Building store structure...' });
        try {
          const { buildStoreHTML } = await import('../lib/storeTemplate');
          const html = buildStoreHTML(job.plan_json as Parameters<typeof buildStoreHTML>[0]);
          send('progress', { pct: 90, msg: '🎨 Applying design system...' });

          // Store result
          await supabase.from('generation_jobs')
            .update({ status: 'done', result_html: html, completed_at: new Date().toISOString() })
            .eq('id', jobId);

          // Also save to generated_stores for history
          await supabase.from('generated_stores').insert({
            user_id: (job.plan_json as any).userId || null,
            store_name: (job.plan_json as any).storeName || 'Store',
            niche: (job.plan_json as any).niche || '',
            html_content: html,
            plan_json: job.plan_json,
          }).then(() => {});

          send('progress', { pct: 100, msg: '✅ Your store is ready!' });
          send('done', { html });
          res.end();
          done = true;
        } catch (renderErr: any) {
          console.error('[job-status] Render failed:', renderErr.message);
          await supabase.from('generation_jobs')
            .update({ status: 'error', error_msg: `Render failed: ${renderErr.message}` })
            .eq('id', jobId);
          send('error', { error: 'Store rendering failed — please try again' });
          res.end();
          done = true;
        }
        return;
      }

      // Still in progress — poll again
      setTimeout(poll, 2000);
    };

    req.on('close', () => { done = true; });
    setTimeout(poll, 500); // first check after 500ms
  });

  // ── POST /api/admin/setup-generation-table ────────────────────────────────────
  // One-time table creation — admin only
  app.post('/api/admin/setup-generation-table', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user || user.email !== 'maximusmajorka@gmail.com') {
        res.status(403).json({ error: 'Admin only' }); return;
      }
      // We can't run DDL via REST — return the SQL for manual execution
      const sql = `
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  status       TEXT NOT NULL DEFAULT 'queued',
  store_name   TEXT,
  product_name TEXT,
  niche        TEXT,
  price        TEXT,
  image_url    TEXT,
  template     TEXT,
  plan_json    JSONB,
  result_html  TEXT,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS generation_jobs_user_idx ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS generation_jobs_status_idx ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS generation_jobs_created_idx ON generation_jobs(created_at DESC);
-- Row level security
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own jobs" ON generation_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON generation_jobs USING (true) WITH CHECK (true);
      `.trim();
      res.json({ sql, message: 'Run this SQL in the Supabase SQL editor to create the table' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
