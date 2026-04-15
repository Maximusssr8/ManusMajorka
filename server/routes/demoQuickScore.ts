// Delta 2 — public demo scorer backed by real winning_products rows.
// Mounted under /api/demo. The Live Scorer on the landing page fetches
// /api/demo/quick-score?category=<CategoryKey> to populate its chips.
//
// Design choices
//   - Tolerant category matching: ILIKE '%pet%' OR '%pets%' OR '%pet accessories%' etc.
//   - Order by real_orders_count desc nullsLast, limit 1.
//   - Deterministic market split per-product (hash of id) — AU-skewed 35-50%.
//   - 30-point sparkline interpolated from sold_count_7d_ago → sold_count when
//     present, else a gentle rising walk seeded from the row id.
//   - Light IP rate limiter: 30 calls / minute / IP. In-memory Map.

import { Router, type Request, type Response, type NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// ── Category → Supabase ILIKE patterns ──────────────────────────────────────
type CategoryKey = 'Pet' | 'Kitchen' | 'Home' | 'Beauty' | 'Fitness';

// Supabase JS `.or()` uses `*` as the wildcard token inside ilike patterns —
// `%` gets URL-escaped and doesn't behave as a wildcard in that context.
const CATEGORY_FILTER: Record<CategoryKey, string[]> = {
  Pet: ['*pet*', '*pets*', '*pet accessories*'],
  Kitchen: ['*kitchen*', '*bar*', '*cookware*'],
  Home: ['*home storage*', '*home*', '*organiser*', '*organizer*'],
  Beauty: ['*beauty*', '*skincare*', '*cosmetics*'],
  Fitness: ['*fitness*', '*wellness*', '*gym*'],
};

const ALLOWED_KEYS = Object.keys(CATEGORY_FILTER) as CategoryKey[];

// ── Supabase client ─────────────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

// ── Lightweight IP rate limiter ─────────────────────────────────────────────
// 30 / minute / IP — sliding window, in-memory.
interface RateEntry {
  ts: number[];
}
const rateTable = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;

function ipOf(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  const first = Array.isArray(xf) ? xf[0] : typeof xf === 'string' ? xf.split(',')[0] : undefined;
  return (first || req.ip || req.socket?.remoteAddress || 'anon').toString().trim();
}

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = ipOf(req);
  const now = Date.now();
  const bucket = rateTable.get(key) ?? { ts: [] };
  bucket.ts = bucket.ts.filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.ts.length >= RATE_MAX) {
    res.status(429).json({ ok: false, reason: 'rate_limited' });
    return;
  }
  bucket.ts.push(now);
  rateTable.set(key, bucket);
  next();
}

// ── Deterministic helpers ───────────────────────────────────────────────────
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRand(h: number): () => number {
  let state = h || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

// AU-skewed split, deterministic per id, always sums to 100.
function marketSplitFromId(id: string): { au: number; us: number; uk: number } {
  const h = hash32(id);
  const rand = seededRand(h);
  // AU skewed 35–50
  const au = 35 + Math.floor(rand() * 16);
  const remaining = 100 - au;
  // US takes 55–75% of remaining, UK the rest.
  const us = Math.floor(remaining * (0.55 + rand() * 0.2));
  const uk = Math.max(1, remaining - us);
  const sum = au + us + uk;
  // Nudge UK to make it total exactly 100.
  return { au, us, uk: uk + (100 - sum) };
}

// 30-point sparkline from sold_count_7d_ago → sold_count (monotone-cubic-ish).
function buildSparkline(
  id: string,
  startOrders: number | null,
  endOrders: number | null,
): number[] {
  const POINTS = 30;
  const rand = seededRand(hash32(id));
  let lo = Math.max(0, startOrders ?? 0);
  let hi = Math.max(lo, endOrders ?? lo);
  if (hi <= 0) {
    // Fall back to a gentle upward walk seeded from id.
    const base = 30 + rand() * 30;
    let v = base;
    const out: number[] = [];
    for (let i = 0; i < POINTS; i++) {
      v += (rand() - 0.35) * 6 + (i / POINTS) * 1.2;
      out.push(Math.max(5, Math.min(100, Math.round(v))));
    }
    return out;
  }
  if (hi === lo) hi = lo * 1.05 + 1;
  // Monotone-cubic-ish curve with small jitter — normalise to 0–100.
  const out: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    // Smoothstep easing + tiny jitter.
    const eased = t * t * (3 - 2 * t);
    const raw = lo + (hi - lo) * eased;
    const jitter = (rand() - 0.5) * (hi - lo) * 0.04;
    const clamped = Math.max(0, raw + jitter);
    out.push(clamped);
  }
  // Normalise 0..100 for a visually clean spark.
  const max = Math.max(...out, 1);
  return out.map((v) => Math.max(4, Math.round((v / max) * 100)));
}

function scoreFromRow(row: Record<string, unknown>): number {
  const winning = Number(row.winning_score);
  if (Number.isFinite(winning) && winning > 0) return Math.round(winning);
  // Derive gently from orders if winning_score missing.
  const orders = Number(row.real_orders_count ?? row.sold_count ?? 0);
  return Math.round(60 + Math.min(35, Math.log10(Math.max(orders, 1)) * 7));
}

function synthBrief(category: CategoryKey, orders: number, auPct: number): string {
  return `${category} staple · ${orders.toLocaleString('en-AU')}+ orders · AU demand ${auPct}%`;
}

function clampBrief(s: string, max = 120): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

// ── Route ───────────────────────────────────────────────────────────────────
router.get('/quick-score', rateLimit, async (req: Request, res: Response) => {
  try {
    const raw = String(req.query.category ?? '').trim();
    const norm = raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : '';
    if (!ALLOWED_KEYS.includes(norm as CategoryKey)) {
      return res.status(400).json({ ok: false, reason: 'invalid_category' });
    }
    const category = norm as CategoryKey;

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({ ok: false, reason: 'db_unavailable' });
    }
    const sb = getSupabase();

    const patterns = CATEGORY_FILTER[category];
    // Build an OR expression for all ILIKE patterns.
    const orExpr = patterns.map((p) => `category.ilike.${p}`).join(',');

    const { data, error } = await sb
      .from('winning_products')
      .select(
        'id,product_title,category,image_url,real_price_aud,price_aud,real_orders_count,sold_count,sold_count_7d_ago,winning_score,why_winning,aliexpress_url',
      )
      .or(orExpr)
      .not('image_url', 'is', null)
      .order('real_orders_count', { ascending: false, nullsFirst: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.status(404).json({ ok: false, reason: 'no_match' });
    }

    const row = data[0] as Record<string, unknown>;
    const id = String(row.id);
    const title = String(row.product_title || `${category} Product`);
    const image = (row.image_url as string) || null;
    const price = Number(row.real_price_aud ?? row.price_aud ?? 0) || 0;
    const orders = Math.round(
      Number(row.real_orders_count ?? row.sold_count ?? 0) || 0,
    );
    const ordersStart = row.sold_count_7d_ago != null ? Number(row.sold_count_7d_ago) : null;
    const ordersEnd = row.sold_count != null ? Number(row.sold_count) : orders;
    const score = scoreFromRow(row);
    const { au, us, uk } = marketSplitFromId(id);
    const sparkline = buildSparkline(id, ordersStart, ordersEnd);

    const whyWinning = typeof row.why_winning === 'string' ? row.why_winning.trim() : '';
    const brief = whyWinning
      ? clampBrief(whyWinning, 120)
      : synthBrief(category, orders, au);

    return res.json({
      ok: true,
      product: {
        id,
        title,
        image,
        price_aud: price,
        orders,
        score,
        market_split: { au, us, uk },
        sparkline,
        brief,
        category,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'demo-quick-score failed';
    return res.status(500).json({ ok: false, reason: 'error', error: msg });
  }
});

export default router;
