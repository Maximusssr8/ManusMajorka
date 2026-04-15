import { Router, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { getEmailProvider } from '../lib/email';
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

const alertTypeSchema = z.enum(['price_drop', 'score_change', 'sold_count_spike']);
const frequencySchema = z.enum(['instant', 'daily', 'weekly']);

const createAlertSchema = z.object({
  type: alertTypeSchema,
  threshold: z.number().finite(),
  frequency: frequencySchema,
  email: z.string().email(),
  product_id: z.string().uuid().nullable().optional(),
  category: z.string().max(120).nullable().optional(),
});

type AlertRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  type: z.infer<typeof alertTypeSchema>;
  threshold: number;
  frequency: z.infer<typeof frequencySchema>;
  email: string;
  category: string | null;
  last_fired_at: string | null;
  created_at: string;
};

// ─── Health: surfaces honest email provider state to the UI ──────────────────

router.get('/health/email', (_req: Request, res: Response) => {
  const provider = getEmailProvider();
  res.json({
    ok: provider !== 'none',
    provider,
    reason: provider === 'none' ? 'no_provider' : undefined,
  });
});

// ─── GET /api/alerts — list current user's alerts ────────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      if (isMissingSchema(error)) {
        console.warn('[alerts] missing schema — returning empty state:', error.message);
        res.json({ success: true, alerts: [], meta: { pending_migration: true } });
        return;
      }
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.json({ success: true, alerts: (data ?? []) as AlertRow[] });
  } catch (err: unknown) {
    const pgErr = err as { code?: string; message?: string } | null;
    if (isMissingSchema(pgErr)) {
      res.json({ success: true, alerts: [], meta: { pending_migration: true } });
      return;
    }
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

// ─── POST /api/alerts — create alert ─────────────────────────────────────────

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const parsed = createAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', issues: parsed.error.flatten() });
    return;
  }

  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('alerts')
      .insert({
        user_id: userId,
        type: parsed.data.type,
        threshold: parsed.data.threshold,
        frequency: parsed.data.frequency,
        email: parsed.data.email,
        product_id: parsed.data.product_id ?? null,
        category: parsed.data.category ?? null,
      })
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.status(201).json({ success: true, alert: data as AlertRow });
  } catch (err: unknown) {
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

// ─── DELETE /api/alerts/:id ──────────────────────────────────────────────────

const idParamSchema = z.object({ id: z.string().uuid() });

// ─── Price drop alerts (price_alerts table) ──────────────────────────────────
// Distinct from the generic alerts above. Tracks an original-price snapshot
// per (user, product) and fires via /api/cron/price-check when the live
// `winning_products.price_aud` drops below the configured threshold.
//
// Endpoints:
//   GET    /api/alerts/price          — list current user's price alerts
//   POST   /api/alerts/price          — create a new price alert
//   DELETE /api/alerts/price/:id      — cancel a price alert (status='cancelled')

const createPriceAlertSchema = z.object({
  product_id: z.string().min(1).max(120),
  product_name: z.string().min(1).max(500),
  product_image: z.string().url().nullable().optional(),
  original_price: z.number().positive().finite(),
  alert_type: z.enum(['any_drop', 'percentage', 'target_price']).default('any_drop'),
  target_price: z.number().positive().finite().nullable().optional(),
  threshold_percent: z.number().positive().finite().max(100).nullable().optional(),
});

interface PriceAlertRow {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  original_price: number;
  target_price: number | null;
  alert_type: 'any_drop' | 'percentage' | 'target_price';
  threshold_percent: number | null;
  status: 'active' | 'triggered' | 'cancelled';
  triggered_at: string | null;
  created_at: string;
}

router.get('/price', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.json({ success: true, alerts: (data ?? []) as PriceAlertRow[] });
  } catch (err: unknown) {
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/price', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const parsed = createPriceAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', issues: parsed.error.flatten() });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('price_alerts')
      .insert({
        user_id: userId,
        product_id: parsed.data.product_id,
        product_name: parsed.data.product_name,
        product_image: parsed.data.product_image ?? null,
        original_price: parsed.data.original_price,
        target_price: parsed.data.target_price ?? null,
        alert_type: parsed.data.alert_type,
        threshold_percent: parsed.data.threshold_percent ?? null,
        status: 'active',
      })
      .select('*')
      .single();
    if (error) {
      res.status(500).json({ error: 'db_error', message: error.message });
      return;
    }
    res.status(201).json({ success: true, alert: data as PriceAlertRow });
  } catch (err: unknown) {
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
});

const priceIdParamSchema = z.object({ id: z.string().uuid() });

router.delete('/price/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const parsed = priceIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_id' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from('price_alerts')
      .update({ status: 'cancelled' })
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
      .from('alerts')
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
