/**
 * /api/analytics — per-user activity stats.
 * Returns counts for the current calendar month. Each source is wrapped in
 * try/catch so a missing table degrades to 0 rather than 500.
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

function sb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function safeCount(promise: Promise<{ count: number | null; error: unknown }>): Promise<number> {
  try {
    const { count, error } = await promise;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

router.get('/my-activity', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const monthStart = startOfMonthISO();
  const db = sb();

  // 1) AI Briefs — try usage_counters first, then api_cost_log.
  const briefs = await (async () => {
    const usage = await safeCount(
      db.from('usage_counters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('feature', ['ai_brief', 'why_trending_brief'])
        .gte('created_at', monthStart) as any,
    );
    if (usage > 0) return usage;
    return safeCount(
      db.from('api_cost_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('feature', ['ai_brief', 'why_trending_brief'])
        .gte('created_at', monthStart) as any,
    );
  })();

  // 2) Ads generated — same dual lookup.
  const ads = await (async () => {
    const usage = await safeCount(
      db.from('usage_counters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', 'ads_generation')
        .gte('created_at', monthStart) as any,
    );
    if (usage > 0) return usage;
    return safeCount(
      db.from('api_cost_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', 'ads_generation')
        .gte('created_at', monthStart) as any,
    );
  })();

  // 3) Products saved — count product_list_items belonging to this user's lists.
  const saves = await (async () => {
    try {
      const { data: lists } = await db
        .from('product_lists')
        .select('id')
        .eq('user_id', userId);
      if (!lists || lists.length === 0) return 0;
      const listIds = lists.map((l: { id: string }) => l.id);
      const { count } = await db
        .from('product_list_items')
        .select('*', { count: 'exact', head: true })
        .in('list_id', listIds)
        .gte('created_at', monthStart);
      return count ?? 0;
    } catch {
      return 0;
    }
  })();

  // 4) Top viewed category — best-effort from product_views table if it exists.
  const topCategory = await (async () => {
    try {
      const { data } = await db
        .from('product_views')
        .select('category')
        .eq('user_id', userId)
        .gte('created_at', monthStart)
        .limit(500);
      if (!data || data.length === 0) return null;
      const counts: Record<string, number> = {};
      for (const r of data as Array<{ category?: string | null }>) {
        const c = (r.category || '').trim();
        if (!c) continue;
        counts[c] = (counts[c] ?? 0) + 1;
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0] ?? null;
    } catch {
      return null;
    }
  })();

  return res.json({ briefs, ads, saves, topCategory });
});

export default router;
