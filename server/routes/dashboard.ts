/**
 * /api/dashboard — server-side composition of dashboard slices.
 *
 * Two slices that MUST be deduplicated against each other:
 *   - Hot Today: created in last 48h, ranked by real_orders_count
 *   - Top Opportunities: real_orders_count BETWEEN 5_000 AND 50_000,
 *     ranked by winning_score, EXCLUDING any Hot Today IDs.
 *
 * Both slices share a single computeDashboardSlice() helper so the
 * exclusion is enforced in one place. Combined result cached under
 * `dashboard:combined` (TTL 600s) so /hot-today and /opportunities
 * never disagree even under racey loads.
 */
import { Router, type Request, type Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cacheMiddleware } from '../lib/cache';

const router = Router();

const HOT_TODAY_HOURS = 48;
const HOT_TODAY_LIMIT = 20;
const OPP_MIN_ORDERS  = 5_000;
const OPP_MAX_ORDERS  = 50_000;
const OPP_LIMIT       = 20;

interface DashboardProduct {
  id: string | number;
  product_title: string | null;
  category: string | null;
  price_aud: number | null;
  sold_count: number | null;
  real_orders_count: number | null;
  winning_score: number | null;
  image_url: string | null;
  created_at: string | null;
}

interface DashboardSlice {
  hot: DashboardProduct[];
  opportunities: DashboardProduct[];
  generatedAt: string;
}

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

const SELECT_COLS =
  'id, product_title, category, price_aud, sold_count, real_orders_count, winning_score, image_url, created_at';

// In-memory combined cache so /hot-today and /opportunities agree even
// when called concurrently. cacheMiddleware caches at the response layer
// per-key; this caches at the slice layer so the dedup invariant holds.
let combinedCache: { ts: number; data: DashboardSlice } | null = null;
const COMBINED_TTL_MS = 600_000;

export async function computeDashboardSlice(): Promise<DashboardSlice> {
  if (combinedCache && Date.now() - combinedCache.ts < COMBINED_TTL_MS) {
    return combinedCache.data;
  }

  const sb = getSupabase();
  const cutoff = new Date(Date.now() - HOT_TODAY_HOURS * 3600_000).toISOString();

  // ── Hot Today ──────────────────────────────────────────────────────────────
  const hotRes = await sb
    .from('winning_products')
    .select(SELECT_COLS)
    .gte('created_at', cutoff)
    .not('image_url', 'is', null)
    .order('real_orders_count', { ascending: false, nullsFirst: false })
    .limit(HOT_TODAY_LIMIT);

  let hot: DashboardProduct[] = (hotRes.data ?? []) as DashboardProduct[];

  // Fallback: if we have <4 hot products, relax the 48h gate to 7d so the
  // section is never empty on a slow ingestion day.
  if (hot.length < 4) {
    const wkCutoff = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const fb = await sb
      .from('winning_products')
      .select(SELECT_COLS)
      .gte('created_at', wkCutoff)
      .not('image_url', 'is', null)
      .order('real_orders_count', { ascending: false, nullsFirst: false })
      .limit(HOT_TODAY_LIMIT);
    if ((fb.data?.length ?? 0) > hot.length) hot = (fb.data ?? []) as DashboardProduct[];
  }

  const hotIds = hot.map((p) => String(p.id));

  // ── Top Opportunities ──────────────────────────────────────────────────────
  // Build the IN-tuple for the .not('id', 'in', '(...)') exclusion. PostgREST
  // requires the parenthesised comma-separated form.
  let oppQuery = sb
    .from('winning_products')
    .select(SELECT_COLS)
    .gte('real_orders_count', OPP_MIN_ORDERS)
    .lte('real_orders_count', OPP_MAX_ORDERS)
    .not('image_url', 'is', null)
    .order('winning_score', { ascending: false, nullsFirst: false })
    .limit(OPP_LIMIT);

  if (hotIds.length > 0) {
    const tuple = `(${hotIds.join(',')})`;
    oppQuery = oppQuery.not('id', 'in', tuple);
  }

  const oppRes = await oppQuery;
  let opportunities: DashboardProduct[] = (oppRes.data ?? []) as DashboardProduct[];

  // Belt-and-braces client-side dedupe in case the .not() filter is bypassed
  // by a bad row or PostgREST quoting edge case.
  const hotSet = new Set(hotIds);
  opportunities = opportunities.filter((p) => !hotSet.has(String(p.id)));

  const slice: DashboardSlice = {
    hot,
    opportunities,
    generatedAt: new Date().toISOString(),
  };

  combinedCache = { ts: Date.now(), data: slice };
  return slice;
}

router.get('/hot-today', cacheMiddleware(() => 'dashboard:hot-today', 600), async (_req: Request, res: Response) => {
  try {
    const slice = await computeDashboardSlice();
    res.json({ products: slice.hot, generatedAt: slice.generatedAt });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'failed' });
  }
});

router.get('/opportunities', cacheMiddleware(() => 'dashboard:opportunities', 600), async (_req: Request, res: Response) => {
  try {
    const slice = await computeDashboardSlice();
    res.json({ products: slice.opportunities, generatedAt: slice.generatedAt });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'failed' });
  }
});

router.get('/combined', cacheMiddleware(() => 'dashboard:combined', 600), async (_req: Request, res: Response) => {
  try {
    const slice = await computeDashboardSlice();
    res.json(slice);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'failed' });
  }
});

export default router;
