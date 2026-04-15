/**
 * /api/account — current-user account operations.
 * DELETE /api/account permanently deletes the user and cascades through all
 * tables that reference user_id. Each cascade-delete is wrapped so a missing
 * table does not abort the rest of the cleanup.
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

function admin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Tables with a user_id column owned by the deleting user.
const USER_OWNED_TABLES = [
  'user_onboarding',
  'user_preferences',
  'user_watchlist',
  'product_lists',
  'product_list_items', // joined via product_lists.id but also try user_id directly
  'price_alerts',
  'alerts',
  'revenue_entries',
  'generated_stores',
  'saved_stores',
  'saved_ad_sets',
  'usage_counters',
  'api_cost_log',
  'product_views',
] as const;

router.delete('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const sb = admin();
  const cascade: Record<string, { ok: boolean; error?: string }> = {};

  // Special-case product_list_items: clean items first via the user's own lists.
  try {
    const { data: lists } = await sb
      .from('product_lists')
      .select('id')
      .eq('user_id', userId);
    const listIds = (lists ?? []).map((l: { id: string }) => l.id);
    if (listIds.length > 0) {
      const r = await sb.from('product_list_items').delete().in('list_id', listIds);
      cascade['product_list_items_via_lists'] = { ok: !r.error, error: r.error?.message };
    } else {
      cascade['product_list_items_via_lists'] = { ok: true };
    }
  } catch (e) {
    cascade['product_list_items_via_lists'] = { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }

  // Generic cascade by user_id.
  for (const table of USER_OWNED_TABLES) {
    try {
      const r = await sb.from(table).delete().eq('user_id', userId);
      cascade[table] = { ok: !r.error, error: r.error?.message };
    } catch (e) {
      cascade[table] = { ok: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  }

  // Finally delete the auth user (Supabase admin).
  try {
    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) {
      return res.status(500).json({ error: error.message, cascade });
    }
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'auth_admin_delete_failed',
      cascade,
    });
  }

  return res.json({ ok: true, cascade });
});

export default router;
