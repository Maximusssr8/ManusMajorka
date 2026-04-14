/**
 * Dashboard endpoints — per-section dedup at the API level.
 *
 * Four read-only aggregate endpoints feed the Home dashboard. Each endpoint
 * owns its SQL, cache header, and optional NOT-IN exclusion chain so the
 * client never has to build Supabase queries itself.
 *
 * Canonical table: winning_products. Reads use the service-role key — these
 * are public dashboard aggregates, not user-owned data.
 */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DashboardProduct {
  id: number | string;
  product_title: string;
  category: string | null;
  platform: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  trend: string | null;
  est_daily_revenue_aud: number | null;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string | null;
  velocity_7d?: number | null;
  sold_count_7d_ago?: number | null;
  last_seen_at?: string | null;
  ships_to_au?: boolean | null;
  ships_to_us?: boolean | null;
  ships_to_uk?: boolean | null;
}

interface DashboardResponse {
  products: DashboardProduct[];
  cached_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const excludeIdsSchema = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((raw) => {
    if (!raw) return [] as string[];
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0 && v.length <= 64);
  });

const querySchema = z.object({
  excludeIds: excludeIdsSchema,
});

function setCache(res: Response, maxAgeSec: number): void {
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${maxAgeSec}, stale-while-revalidate=3600`
  );
}

function applyExclusion<Q extends { not: (col: string, op: string, val: string) => Q }>(
  query: Q,
  excludeIds: string[]
): Q {
  if (excludeIds.length === 0) return query;
  const tuple = `(${excludeIds.join(',')})`;
  return query.not('id', 'in', tuple);
}

function sendProducts(
  res: Response,
  products: DashboardProduct[],
  maxAgeSec: number
): void {
  setCache(res, maxAgeSec);
  const payload: DashboardResponse = {
    products,
    cached_at: new Date().toISOString(),
  };
  res.json(payload);
}

function sendDbError(res: Response, message: string): void {
  res.status(500).json({ error: 'db_error', message });
}

// ─── GET /velocity-leaders ──────────────────────────────────────────────────
// Fastest growing in last 48 hours.
// Heuristic: most-recent rows with sold_count > 10k.

router.get('/velocity-leaders', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('winning_products')
      .select('*')
      .gt('sold_count', 10000)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(10);
    if (error) {
      sendDbError(res, error.message);
      return;
    }
    sendProducts(res, (data ?? []) as DashboardProduct[], 30 * 60);
  } catch (err: unknown) {
    sendDbError(res, err instanceof Error ? err.message : String(err));
  }
});

// ─── GET /top-products ──────────────────────────────────────────────────────
// All-time highest order count.

router.get('/top-products', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('winning_products')
      .select('*')
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(20);
    if (error) {
      sendDbError(res, error.message);
      return;
    }
    sendProducts(res, (data ?? []) as DashboardProduct[], 60 * 60);
  } catch (err: unknown) {
    sendDbError(res, err instanceof Error ? err.message : String(err));
  }
});

// ─── GET /hot-today ─────────────────────────────────────────────────────────
// Added to Majorka in last 48 hours.

router.get('/hot-today', async (req: Request, res: Response): Promise<void> => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query', issues: parsed.error.flatten() });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    let q = sb
      .from('winning_products')
      .select('*')
      .gte('created_at', cutoff)
      .order('sold_count', { ascending: false, nullsFirst: false })
      .limit(5);
    q = applyExclusion(q, parsed.data.excludeIds);
    const { data, error } = await q;
    if (error) {
      sendDbError(res, error.message);
      return;
    }
    sendProducts(res, (data ?? []) as DashboardProduct[], 15 * 60);
  } catch (err: unknown) {
    sendDbError(res, err instanceof Error ? err.message : String(err));
  }
});

// ─── GET /opportunities ─────────────────────────────────────────────────────
// High score, lower competition.

router.get('/opportunities', async (req: Request, res: Response): Promise<void> => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query', issues: parsed.error.flatten() });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    let q = sb
      .from('winning_products')
      .select('*')
      .gte('sold_count', 5000)
      .lte('sold_count', 50000)
      .order('winning_score', { ascending: false, nullsFirst: false })
      .limit(3);
    q = applyExclusion(q, parsed.data.excludeIds);
    const { data, error } = await q;
    if (error) {
      sendDbError(res, error.message);
      return;
    }
    sendProducts(res, (data ?? []) as DashboardProduct[], 30 * 60);
  } catch (err: unknown) {
    sendDbError(res, err instanceof Error ? err.message : String(err));
  }
});

export default router;
