/**
 * API Key management endpoints (authenticated users only).
 *
 * POST /api/settings/api-keys          — generate a new key
 * GET  /api/settings/api-keys          — list user's keys (no raw key)
 * DELETE /api/settings/api-keys/:id    — revoke a key
 */

import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const sb = () =>
  createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

/** Generate a new API key. Returns the raw key ONCE — it is never stored. */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const label = typeof req.body?.label === 'string' ? req.body.label.slice(0, 64) : 'Default';

  // Limit to 5 active keys per user
  const { count } = await sb()
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if ((count ?? 0) >= 5) {
    res.status(400).json({
      ok: false,
      error: 'key_limit',
      message: 'Maximum 5 active API keys per account.',
    });
    return;
  }

  // Generate a random 32-byte key prefixed with mk_ for easy identification
  const rawKey = `mk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Look up user's plan
  let plan = 'builder';
  try {
    const { data: sub } = await sb()
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();
    if (sub?.plan) plan = sub.plan.toLowerCase();
  } catch {
    // default to builder
  }

  const rateLimitByPlan: Record<string, number> = {
    builder: 100,
    scale: 500,
  };

  const { data, error } = await sb()
    .from('api_keys')
    .insert({
      user_id: userId,
      key_hash: keyHash,
      plan,
      rate_limit: rateLimitByPlan[plan] || 100,
      is_active: true,
      label,
    })
    .select('id, label, plan, rate_limit, created_at')
    .single();

  if (error) {
    res.status(500).json({ ok: false, error: 'create_failed', message: error.message });
    return;
  }

  res.json({
    ok: true,
    data: {
      ...data,
      key: rawKey, // Only returned once — never stored in plaintext
    },
  });
});

/** List user's API keys (without raw key). */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const { data, error } = await sb()
    .from('api_keys')
    .select('id, label, plan, rate_limit, is_active, last_used_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ ok: false, error: 'fetch_failed' });
    return;
  }

  res.json({ ok: true, data: data || [] });
});

/** Revoke (soft-delete) an API key. */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;
  if (!userId) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const { error } = await sb()
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    res.status(500).json({ ok: false, error: 'revoke_failed' });
    return;
  }

  res.json({ ok: true, message: 'API key revoked.' });
});

export default router;
