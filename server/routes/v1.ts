/**
 * Developer API — public v1 surface.
 *
 * Every route here is protected by `requireApiKey` middleware (API key
 * in `Authorization: Bearer mk_live_...`). No Supabase JWTs — this is
 * the external integration surface, distinct from the web app's /api/*.
 *
 * Shape contract: every response is either
 *   { ok: true, data, meta? }
 * or
 *   { ok: false, error: string, message: string, ... }
 *
 * This matches standard REST + Stripe conventions so integrations are
 * predictable. Pagination is cursor-free for v1 (offset/limit only).
 */

import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { requireApiKey } from '../middleware/apiKey';

const router = Router();

function sb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const PRODUCT_FIELDS =
  'id,product_title,category,platform,image_url,price_aud,sold_count,winning_score,trend,est_daily_revenue_aud,aliexpress_url,shop_name,created_at';

function okResponse(data: unknown, meta?: Record<string, unknown>) {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

function errResponse(status: number, error: string, message: string, extra?: Record<string, unknown>) {
  return { status, body: { ok: false, error, message, ...extra } };
}

// Apply the API key middleware to every /v1 route in one shot.
router.use(requireApiKey);

// ── GET /v1/stats/overview ────────────────────────────────────────────────
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const supa = sb();
    const { count, error } = await supa
      .from('winning_products')
      .select('*', { count: 'exact', head: true });
    if (error) return res.status(500).json({ ok: false, error: 'db_error', message: error.message });
    const { count: hot } = await supa
      .from('winning_products')
      .select('*', { count: 'exact', head: true })
      .gte('winning_score', 65);
    return res.json(okResponse({ total: count ?? 0, hot: hot ?? 0, updatedAt: new Date().toISOString() }));
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err) });
  }
});

// ── GET /v1/products ──────────────────────────────────────────────────────
// Query params: category, min_score, market, platform, limit (default 20, max 100), offset, sort
router.get('/products', async (req: Request, res: Response) => {
  try {
    const supa = sb();
    const category = typeof req.query.category === 'string' ? req.query.category : null;
    const platform = typeof req.query.platform === 'string' ? req.query.platform : null;
    const market = typeof req.query.market === 'string' ? req.query.market.toUpperCase() : null;
    const minScore = req.query.min_score ? Math.max(0, Math.min(100, parseInt(String(req.query.min_score), 10) || 0)) : 0;
    const limit = req.query.limit ? Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10) || 20)) : 20;
    const offset = req.query.offset ? Math.max(0, parseInt(String(req.query.offset), 10) || 0) : 0;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'winning_score';

    const VALID_SORTS = new Set(['winning_score', 'sold_count', 'price_aud', 'created_at', 'est_daily_revenue_aud']);
    const sortCol = VALID_SORTS.has(sort) ? sort : 'winning_score';

    let q = supa
      .from('winning_products')
      .select(PRODUCT_FIELDS, { count: 'exact' })
      .gte('winning_score', minScore)
      .order(sortCol, { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) q = q.ilike('category', `%${category}%`);
    if (platform) q = q.eq('platform', platform);
    if (market) q = q.ilike('au_relevance', `%${market}%`);

    const { data, count, error } = await q;
    if (error) return res.status(500).json({ ok: false, error: 'db_error', message: error.message });

    return res.json(
      okResponse(data || [], {
        count: data?.length || 0,
        total: count ?? null,
        limit,
        offset,
        sort: sortCol,
      }),
    );
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err) });
  }
});

// ── GET /v1/products/search?q= ─────────────────────────────────────────────
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      return res.status(400).json({ ok: false, error: 'bad_request', message: 'Missing required query parameter `q`' });
    }
    const limit = req.query.limit ? Math.max(1, Math.min(50, parseInt(String(req.query.limit), 10) || 20)) : 20;

    const supa = sb();
    const { data, error } = await supa
      .from('winning_products')
      .select(PRODUCT_FIELDS)
      .ilike('product_title', `%${q}%`)
      .order('winning_score', { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ ok: false, error: 'db_error', message: error.message });
    return res.json(okResponse(data || [], { query: q, count: data?.length || 0 }));
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err) });
  }
});

// ── GET /v1/products/tiktok-leaderboard ────────────────────────────────────
router.get('/products/tiktok-leaderboard', async (req: Request, res: Response) => {
  try {
    const supa = sb();
    const niche = typeof req.query.niche === 'string' ? req.query.niche : null;
    let q = supa
      .from('winning_products')
      .select(PRODUCT_FIELDS)
      .eq('platform', 'tiktok_shop')
      .gt('sold_count', 0)
      .not('image_url', 'is', null)
      .order('sold_count', { ascending: false })
      .limit(250);
    if (niche) q = q.ilike('category', `%${niche}%`);
    const { data, error } = await q;
    if (error) return res.status(500).json({ ok: false, error: 'db_error', message: error.message });

    const now = Date.now();
    const ranked = (data || [])
      .map((r: any) => {
        const created = r.created_at ? Date.parse(r.created_at) : now;
        const daysActive = Math.max(1, Math.floor((now - created) / 86400000));
        const velocity = (r.sold_count ?? 0) / daysActive;
        const score = r.winning_score ?? 0;
        const rank = score * 0.4 + Math.min(100, Math.log10(Math.max(1, velocity) + 1) * 25) * 0.6;
        return { ...r, velocity: Math.round(velocity), daysActive, rank: Math.round(rank) };
      })
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 100);

    return res.json(okResponse(ranked, { count: ranked.length, updatedAt: new Date().toISOString() }));
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err) });
  }
});

// ── GET /v1/products/:id ───────────────────────────────────────────────────
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supa = sb();
    const { data, error } = await supa
      .from('winning_products')
      .select(PRODUCT_FIELDS + ',cost_price_aud,orders_count,why_winning,ad_angle,aliexpress_id,tags')
      .eq('id', id)
      .maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: 'db_error', message: error.message });
    if (!data) return res.status(404).json({ ok: false, error: 'not_found', message: 'Product not found' });
    return res.json(okResponse(data));
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err) });
  }
});

// ── POST /v1/ads/brief ─────────────────────────────────────────────────────
// Generate an AI ad brief for a given product + format using Claude Haiku.
interface BriefRequest {
  productId?: string;
  format?: 'meta_feed' | 'meta_story' | 'tiktok_feed' | 'tiktok_story';
}
router.post('/ads/brief', async (req: Request, res: Response) => {
  try {
    const body = req.body as BriefRequest;
    if (!body?.productId || !body?.format) {
      return res.status(400).json({ ok: false, error: 'bad_request', message: 'Required: { productId, format }' });
    }
    const VALID_FORMATS = new Set(['meta_feed', 'meta_story', 'tiktok_feed', 'tiktok_story']);
    if (!VALID_FORMATS.has(body.format)) {
      return res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: `format must be one of: ${Array.from(VALID_FORMATS).join(', ')}`,
      });
    }

    const supa = sb();
    const { data: product, error } = await supa
      .from('winning_products')
      .select('id,product_title,category,price_aud,sold_count,winning_score,why_winning,ad_angle')
      .eq('id', body.productId)
      .maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: 'db_error', message: error.message });
    if (!product) return res.status(404).json({ ok: false, error: 'not_found', message: 'Product not found' });

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return res.status(503).json({
        ok: false,
        error: 'service_unavailable',
        message: 'AI brief generation is temporarily unavailable (ANTHROPIC_API_KEY not configured)',
      });
    }

    const anthropic = new Anthropic({ apiKey: key });
    const prompt = `You are a direct-response copywriter for AU dropshipping. Produce an ad brief for the product below in ${body.format} format.

Product: ${product.product_title}
Category: ${product.category}
Price: AUD $${product.price_aud}
Sold: ${(product.sold_count ?? 0).toLocaleString()}
Winning score: ${product.winning_score}
Why it wins: ${product.why_winning || 'High demand'}
Current angle: ${product.ad_angle || 'Problem/solution'}

Return ONLY valid JSON:
{
  "headlines": [h1, h2, h3],
  "bodies": [b1, b2, b3],
  "ctas": ["Shop now", "Get yours", "Try it free"],
  "hook": "one-line hook suitable for the chosen format",
  "audience": "one sentence describing the target",
  "keywords": [10 interest/behaviour keywords]
}`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = (msg.content[0] as { text?: string }).text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ ok: false, error: 'ai_parse_failed', message: 'AI returned non-JSON output' });
    }
    const brief = JSON.parse(jsonMatch[0]);
    return res.json(okResponse({ productId: product.id, format: body.format, brief }));
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: err instanceof Error ? err.message : String(err) });
  }
});

// ── GET /v1/creators/matrix?productId= ─────────────────────────────────────
// Deterministic v1 heuristic — see client/src/pages/app/Analytics.tsx.
// Real scoring will come from the server in phase 2.
router.get('/creators/matrix', (req: Request, res: Response) => {
  try {
    const productId = typeof req.query.productId === 'string' ? req.query.productId : '';
    if (!productId) {
      return res.status(400).json({ ok: false, error: 'bad_request', message: 'Missing required query parameter `productId`' });
    }
    const categories = ['Fashion', 'Tech', 'Home', 'Fitness', 'Beauty', 'Food'];
    const hash = (str: string): number => {
      let h = 0;
      for (let i = 0; i < str.length; i += 1) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
      }
      return Math.abs(h);
    };
    const scores = categories.map((c) => ({ category: c, score: hash(productId + c) % 101 }));
    return res.json(okResponse({ productId, matches: scores }, { algorithm: 'v1_hash_heuristic' }));
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err) });
  }
});

// ── POST /v1/webhooks (placeholder — phase 2) ──────────────────────────────
router.post('/webhooks', (_req: Request, res: Response) => {
  return res.status(501).json({
    ok: false,
    error: 'not_implemented',
    message: 'Webhook registration is coming in v2. Follow majorka.io/changelog for updates.',
  });
});

// ── GET /v1 — surface a self-describing index ───────────────────────────────
router.get('/', (req: Request, res: Response) => {
  return res.json({
    ok: true,
    data: {
      name: 'Majorka Developer API',
      version: 'v1',
      docs: 'https://majorka.io/app/api-docs',
      authenticatedAs: {
        plan: req.apiKey?.plan,
        keyName: req.apiKey?.name,
        requestsToday: req.apiKey?.requestsToday,
        dailyLimit: req.apiKey?.dailyLimit,
      },
      endpoints: [
        'GET /v1/stats/overview',
        'GET /v1/products',
        'GET /v1/products/search?q=',
        'GET /v1/products/tiktok-leaderboard',
        'GET /v1/products/:id',
        'POST /v1/ads/brief',
        'GET /v1/creators/matrix?productId=',
        'POST /v1/webhooks (coming soon)',
      ],
    },
  });
});

export default router;
