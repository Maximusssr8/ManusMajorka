import { Router, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { isMissingSchema } from '../lib/dbErrors';

const router = Router();

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createRevenueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  revenue_aud: z.number().finite().nonnegative(),
  ad_spend_aud: z.number().finite().nonnegative().default(0),
  orders: z.number().int().nonnegative().default(0),
  note: z.string().max(500).nullable().optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

export interface RevenueEntryRow {
  id: string;
  user_id: string;
  date: string;
  revenue_aud: number;
  ad_spend_aud: number;
  orders: number;
  note: string | null;
  created_at: string;
}

// ─── GET /api/revenue — list current user's entries ──────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('revenue_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1000);
    if (error) {
      if (isMissingSchema(error)) {
        console.warn('[revenue] missing schema — returning empty state:', error.message);
        res.json({ success: true, entries: [], meta: { pending_migration: true } });
        return;
      }
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.json({ success: true, entries: (data ?? []) as RevenueEntryRow[] });
  } catch (err: unknown) {
    const pgErr = err as { code?: string; message?: string } | null;
    if (isMissingSchema(pgErr)) {
      res.json({ success: true, entries: [], meta: { pending_migration: true } });
      return;
    }
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

// ─── POST /api/revenue — create entry ────────────────────────────────────────

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const parsed = createRevenueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', issues: parsed.error.flatten() });
    return;
  }

  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('revenue_entries')
      .insert({
        user_id: userId,
        date: parsed.data.date,
        revenue_aud: parsed.data.revenue_aud,
        ad_spend_aud: parsed.data.ad_spend_aud,
        orders: parsed.data.orders,
        note: parsed.data.note ?? null,
      })
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.status(201).json({ success: true, entry: data as RevenueEntryRow });
  } catch (err: unknown) {
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

// ─── DELETE /api/revenue/:id ─────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from('revenue_entries')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', userId);
    if (error) {
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
