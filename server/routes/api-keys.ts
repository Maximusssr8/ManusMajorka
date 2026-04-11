/**
 * /api/api-keys — CRUD for managing developer API keys.
 *
 * This is the SESSION-authenticated surface the web app uses.
 * It is NOT part of /v1/* (which is key-authenticated).
 */

import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/requireAuth';
import { generateApiKey } from '../middleware/apiKey';

const router = Router();

function sb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// All routes require the user to be signed in.
router.use(requireAuth);

// Returns true if a Postgres error means the table doesn't exist yet —
// i.e. the migration hasn't been run in this environment. We want to
// surface this as a distinct, friendly error code so the UI can render
// a "run the migration" message instead of a scary 500.
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  // Supabase/PostgREST returns 42P01 for undefined_table.
  if (error.code === '42P01') return true;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('relation') && msg.includes('does not exist');
}

// ── GET /api/api-keys ───────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const supa = sb();
    const { data, error } = await supa
      .from('api_keys')
      .select('id,name,prefix,created_at,last_used_at,revoked_at,request_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({
          error: 'migration_pending',
          message:
            'The api_keys table has not been created yet. ' +
            'Run supabase/migrations/20260411_api_keys.sql on your Supabase instance to enable this feature.',
          keys: [],
        });
      }
      console.error('[api-keys GET] db error:', error.message);
      return res.status(500).json({ error: 'db_error', message: error.message });
    }

    const keys = (data || []).map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      createdAt: k.created_at,
      lastUsedAt: k.last_used_at,
      revoked: !!k.revoked_at,
      requestCount: k.request_count || 0,
    }));
    return res.json({ keys });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: String(err) });
  }
});

// ── POST /api/api-keys ──────────────────────────────────────────────────────
// Body: { name: string }
// Returns: { id, name, key, prefix, createdAt } — key is the FULL raw key,
// shown to the user exactly once on creation.
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length < 1 || name.length > 64) {
      return res.status(400).json({ error: 'bad_request', message: 'name is required (1-64 chars)' });
    }

    // Enforce a soft cap of 10 active keys per user to discourage sprawl.
    const supa = sb();
    const { count: activeCount } = await supa
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('revoked_at', null);

    if ((activeCount ?? 0) >= 10) {
      return res.status(429).json({
        error: 'too_many_keys',
        message: 'Maximum 10 active API keys per account. Revoke unused keys before creating more.',
      });
    }

    const { raw, hash, prefix } = generateApiKey();

    const { data, error } = await supa
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        prefix,
        key_hash: hash,
      })
      .select('id,name,prefix,created_at')
      .single();

    if (error || !data) {
      if (isMissingTableError(error)) {
        return res.status(503).json({
          error: 'migration_pending',
          message:
            'The api_keys table has not been created yet. ' +
            'Run supabase/migrations/20260411_api_keys.sql on your Supabase instance.',
        });
      }
      console.error('[api-keys POST] insert error:', error?.message);
      return res.status(500).json({ error: 'db_error', message: error?.message || 'insert failed' });
    }

    return res.status(201).json({
      id: data.id,
      name: data.name,
      prefix: data.prefix,
      createdAt: data.created_at,
      key: raw,
      warning: 'Store this key securely — it will NOT be shown again.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: String(err) });
  }
});

// ── DELETE /api/api-keys/:id ────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { id } = req.params;
    const supa = sb();

    const { data: existing, error: fetchErr } = await supa
      .from('api_keys')
      .select('id,user_id,revoked_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'not_found', message: 'API key not found' });
    }
    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'forbidden', message: 'You do not own this key' });
    }

    const { error } = await supa
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[api-keys DELETE] error:', error.message);
      return res.status(500).json({ error: 'db_error', message: error.message });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: String(err) });
  }
});

// ── GET /api/api-keys/usage ─────────────────────────────────────────────────
// Returns aggregate usage for the current calendar month across all the
// user's keys, plus the applicable daily limit for their plan.
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const email = (req as any).user?.email || '';
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const supa = sb();
    const month = new Date().toISOString().slice(0, 7);

    const { data: usage, error: usageError } = await supa
      .from('api_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('month', month);

    if (usageError && isMissingTableError(usageError)) {
      return res.status(503).json({
        error: 'migration_pending',
        message: 'The api_usage table has not been created yet.',
        requestsThisMonth: 0,
        dailyLimit: 0,
        plan: 'unknown',
        month,
      });
    }

    const requestsThisMonth = (usage || []).reduce((sum: number, row: any) => sum + (row.count || 0), 0);

    // Resolve plan cheaply — same logic as apiKey middleware but inline so
    // we don't import it and accidentally require a valid key.
    let plan: 'free' | 'builder' | 'scale' = 'free';
    if (email === 'maximusmajorka@gmail.com') {
      plan = 'scale';
    } else {
      const { data: sub } = await supa
        .from('user_subscriptions')
        .select('plan,status')
        .eq('user_id', userId)
        .maybeSingle();
      if (sub?.status?.toLowerCase() === 'active') {
        const p = (sub.plan || '').toLowerCase();
        if (p === 'scale') plan = 'scale';
        else if (p === 'builder' || p === 'pro') plan = 'builder';
      }
    }

    const limits: Record<typeof plan, number> = { free: 0, builder: 1_000, scale: 10_000 };
    return res.json({
      requestsThisMonth,
      dailyLimit: limits[plan],
      monthlyEstimate: limits[plan] * 30,
      plan,
      month,
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: String(err) });
  }
});

export default router;
