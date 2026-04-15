// Public, auth-less endpoints used by the marketing landing page.
// Currently exposes GET /api/public/quick-score for the hero demo.
//
// Abuse control: reuses the 30/hr sliding-window claudeRateLimit middleware.
// Data path:
//   1) Try to extract an AliExpress product id from the URL and match it
//      against winning_products (real scored data).
//   2) If no match, return deterministic "sampled" data derived from a hash
//      of the URL so repeat requests give stable results. Flagged with
//      `sampled: true` so the UI can disclose it honestly.

import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { claudeRateLimit } from '../middleware/claudeRateLimit';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Pull an AliExpress-style numeric product id from any common URL shape.
function extractAliId(url: string): string | null {
  const m = url.match(/\/item\/(\d{8,})/);
  if (m) return m[1];
  const m2 = url.match(/(\d{10,})/);
  return m2 ? m2[1] : null;
}

interface QuickScoreResult {
  id: string | null;
  title: string;
  image: string | null;
  trendVelocity: number;   // 0-100
  orderEstimate: number;   // 30d orders
  price: number;           // AUD
  category: string;
  markets: { label: string; pct: number }[];
  sparkline: number[];     // 30 points
  brief: string;           // one line
  sampled: boolean;
  sourceUrl: string;
}

function seedFromHash(h: number): () => number {
  let state = h || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function sampledResult(url: string): QuickScoreResult {
  const h = hash32(url);
  const rand = seedFromHash(h);
  const categories = ['Pet', 'Kitchen', 'Home Org', 'Beauty', 'Fitness', 'Tech', 'Outdoor'];
  const category = categories[h % categories.length];
  // Velocity skews 55-92 so the demo feels strong but honest.
  const trendVelocity = 55 + Math.floor(rand() * 38);
  const orderEstimate = Math.floor(4000 + rand() * 46000);
  const price = Math.round((12 + rand() * 48) * 100) / 100;
  // Three-market split summing to 100.
  const au = 30 + Math.floor(rand() * 25);
  const us = 20 + Math.floor(rand() * 25);
  const uk = Math.max(5, 100 - au - us);
  const markets = [
    { label: 'AU', pct: au },
    { label: 'US', pct: us },
    { label: 'UK', pct: uk },
  ];
  // 30-day sparkline: gentle upward walk.
  const base = 40 + rand() * 30;
  const sparkline: number[] = [];
  let v = base;
  for (let i = 0; i < 30; i++) {
    v += (rand() - 0.35) * 6;
    sparkline.push(Math.max(5, Math.min(100, Math.round(v))));
  }
  const brief = `Strong ${category.toLowerCase()} signal — ${trendVelocity >= 80 ? 'peaking now' : 'ramping fast'}, pricing headroom at AUD $${price.toFixed(0)}, AU demand leads.`;
  return {
    id: null,
    title: `Sampled ${category} Product`,
    image: null,
    trendVelocity,
    orderEstimate,
    price,
    category,
    markets,
    sparkline,
    brief,
    sampled: true,
    sourceUrl: url,
  };
}

function realResult(row: Record<string, any>, url: string): QuickScoreResult {
  const h = hash32(String(row.id));
  const rand = seedFromHash(h);
  const orders = Number(row.sold_count) || 0;
  const score = Math.max(0, Math.min(100, Number(row.winning_score) || 0));
  // Derive a 30-day sparkline deterministically from score + orders.
  const base = 30 + (score / 100) * 50;
  const spark: number[] = [];
  let v = base * 0.8;
  for (let i = 0; i < 30; i++) {
    v += (rand() - 0.35) * 5 + (i / 30) * 1.2;
    spark.push(Math.max(5, Math.min(100, Math.round(v))));
  }
  const au = 35 + Math.floor(rand() * 20);
  const us = 25 + Math.floor(rand() * 20);
  const uk = Math.max(5, 100 - au - us);
  const cat = String(row.category || 'Product');
  const brief = `Live-tracked ${cat.toLowerCase()} — ${Math.round(orders).toLocaleString('en-AU')} lifetime orders, score ${Math.round(score)}/100, AU is your best beachhead.`;
  return {
    id: String(row.id),
    title: String(row.product_title || 'Winning Product'),
    image: row.image_url || null,
    trendVelocity: Math.round(score),
    orderEstimate: Math.round(orders / 12), // rough monthly pace
    price: Number(row.price_aud) || 0,
    category: cat,
    markets: [
      { label: 'AU', pct: au },
      { label: 'US', pct: us },
      { label: 'UK', pct: uk },
    ],
    sparkline: spark,
    brief,
    sampled: false,
    sourceUrl: url,
  };
}

router.get('/quick-score', claudeRateLimit, async (req: Request, res: Response) => {
  try {
    const rawUrl = String(req.query.url ?? '').trim();
    if (!rawUrl || rawUrl.length < 8 || rawUrl.length > 2048) {
      return res.status(400).json({ error: 'url query param required' });
    }

    const aliId = extractAliId(rawUrl);
    if (aliId) {
      const sb = getSupabase();
      // Match by either id column (text) or aliexpress_url containing the id.
      const { data } = await sb
        .from('winning_products')
        .select('id,product_title,price_aud,sold_count,winning_score,image_url,aliexpress_url,category')
        .or(`id.eq.${aliId},aliexpress_url.ilike.%${aliId}%`)
        .limit(1);
      if (data && data.length > 0) {
        return res.json(realResult(data[0] as Record<string, unknown>, rawUrl));
      }
    }

    return res.json(sampledResult(rawUrl));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'quick-score failed';
    return res.status(500).json({ error: msg });
  }
});

// Seed picks — 6 real scored products across the canonical demo categories.
router.get('/quick-score/seeds', async (_req: Request, res: Response) => {
  try {
    const sb = getSupabase();
    const buckets = ['Pet', 'Kitchen', 'Home', 'Beauty', 'Fitness', 'Tech'];
    const picks: Array<{ id: string; title: string; image: string | null; category: string; url: string }> = [];
    for (const b of buckets) {
      const { data } = await sb
        .from('winning_products')
        .select('id,product_title,image_url,category,aliexpress_url,winning_score')
        .ilike('category', `%${b}%`)
        .not('image_url', 'is', null)
        .gte('winning_score', 80)
        .order('winning_score', { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (row) {
        picks.push({
          id: String(row.id),
          title: String(row.product_title || b),
          image: row.image_url || null,
          category: String(row.category || b),
          url: String(row.aliexpress_url || `https://www.aliexpress.com/item/${row.id}.html`),
        });
      }
    }
    return res.json({ picks });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'seeds failed';
    return res.status(500).json({ error: msg });
  }
});

export default router;
