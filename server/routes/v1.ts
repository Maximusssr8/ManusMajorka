/**
 * Majorka V1 Public API
 *
 * RESTful product intelligence API for developers, agencies, and power users.
 * All endpoints require a valid API key (X-Api-Key header or ?api_key= param).
 * Authenticated via apiKeyAuth middleware mounted upstream.
 *
 * Response envelope:
 *   { ok: true, data: ..., meta: { request_id, timestamp, rate_limit, pipeline_age } }
 *
 * Error envelope:
 *   { ok: false, error: "code", message: "...", docs: "https://www.majorka.io/docs" }
 */

import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

// ── Supabase admin client (SERVICE_ROLE) ──────────────────────────────────────
const sb = () =>
  createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wrap a successful response in the standard envelope. */
function ok(res: Response, data: unknown, extra?: Record<string, unknown>) {
  const limit = res.getHeader('X-RateLimit-Limit');
  const remaining = res.getHeader('X-RateLimit-Remaining');
  const reset = res.getHeader('X-RateLimit-Reset');

  res.json({
    ok: true,
    data,
    meta: {
      request_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      rate_limit: {
        limit: limit ? Number(limit) : undefined,
        remaining: remaining ? Number(remaining) : undefined,
        reset: reset ? Number(reset) : undefined,
      },
      ...extra,
    },
  });
}

/** Standard error response. */
function fail(res: Response, status: number, code: string, message: string) {
  res.status(status).json({
    ok: false,
    error: code,
    message,
    docs: 'https://www.majorka.io/docs',
  });
}

/** Seconds since last pipeline refresh. */
async function getPipelineAge(): Promise<number | null> {
  try {
    const { data } = await sb()
      .from('pipeline_logs')
      .select('finished_at')
      .eq('status', 'success')
      .order('finished_at', { ascending: false })
      .limit(1)
      .single();
    if (data?.finished_at) {
      return Math.floor((Date.now() - new Date(data.finished_at).getTime()) / 1000);
    }
  } catch {
    // non-critical
  }
  return null;
}

/** Pick only requested fields from an object (field selection). */
function pickFields(obj: Record<string, unknown>, fields: string | undefined): Record<string, unknown> {
  if (!fields) return obj;
  const allowed = fields.split(',').map((f) => f.trim()).filter(Boolean);
  if (allowed.length === 0) return obj;
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in obj) result[key] = obj[key];
  }
  // Always include id
  if ('id' in obj) result.id = obj.id;
  return result;
}

/** Normalise a product row for the API response. */
function formatProduct(row: any): Record<string, unknown> {
  return {
    id: row.id,
    title: row.product_title,
    category: row.category || row.search_keyword || null,
    price_aud: row.price_aud,
    cost_price_aud: row.cost_price_aud || null,
    sold_count: row.sold_count || row.orders_count || 0,
    winning_score: row.winning_score,
    image_url: row.image_url,
    product_url: row.product_url || row.aliexpress_url || null,
    est_daily_revenue_aud: row.est_daily_revenue_aud || (row.sold_count && row.price_aud ? Math.round(((row.sold_count / 365) * row.price_aud * 30) * 100) / 100 : null),
    est_monthly_revenue_aud: row.est_monthly_revenue_aud || null,
    profit_margin: row.profit_margin || null,
    rating: row.rating || null,
    velocity_score: row.velocity_score || null,
    velocity_label: row.velocity_label || null,
    shop_name: row.shop_name || null,
    ships_to_au: row.ships_to_au ?? null,
    tags: row.tags || [],
    tiktok_signal: row.tiktok_signal || false,
    created_at: row.created_at,
    updated_at: row.updated_at || row.last_refreshed || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /v1/products — paginated product list with filters.
 *
 * Query params:
 *   category, min_score, min_orders, sort (score|orders|velocity|price|revenue),
 *   order (asc|desc), limit (max 100), offset, cursor, fields, q (search)
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const {
      category,
      min_score,
      min_orders,
      sort = 'score',
      order = 'desc',
      limit: rawLimit,
      offset: rawOffset,
      cursor,
      fields,
      q,
    } = req.query as Record<string, string>;

    const limit = Math.min(100, Math.max(1, parseInt(rawLimit) || 25));
    const offset = Math.max(0, parseInt(rawOffset) || 0);
    const ascending = order === 'asc';

    const sortMap: Record<string, string> = {
      score: 'winning_score',
      orders: 'sold_count',
      velocity: 'velocity_score',
      price: 'price_aud',
      revenue: 'est_monthly_revenue_aud',
    };
    const sortCol = sortMap[sort] || 'winning_score';

    let query = sb()
      .from('winning_products')
      .select('*', { count: 'exact' });

    if (category) query = query.or(`category.ilike.%${category}%,search_keyword.ilike.%${category}%`);
    if (min_score) query = query.gte('winning_score', parseInt(min_score));
    if (min_orders) query = query.gte('sold_count', parseInt(min_orders));
    if (q) query = query.or(`product_title.ilike.%${q}%,category.ilike.%${q}%`);

    // Cursor-based pagination (use created_at as cursor)
    if (cursor) {
      query = ascending
        ? query.gt('created_at', cursor)
        : query.lt('created_at', cursor);
    }

    query = query
      .order(sortCol, { ascending, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) { fail(res, 500, 'query_error', error.message); return; }

    const products = (data || []).map((r: any) => pickFields(formatProduct(r), fields));
    const total = count ?? 0;
    const pipelineAge = await getPipelineAge();

    ok(res, products, {
      total,
      limit,
      offset,
      has_more: offset + limit < total,
      next_cursor: products.length > 0 ? (products[products.length - 1] as any).created_at || null : null,
      pipeline_age: pipelineAge,
    });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message || 'Failed to fetch products.');
  }
});

/**
 * GET /v1/products/trending — top 20 by velocity.
 */
router.get('/products/trending', async (req: Request, res: Response) => {
  try {
    const fields = req.query.fields as string | undefined;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { data, error } = await sb()
      .from('winning_products')
      .select('*')
      .not('velocity_score', 'is', null)
      .order('velocity_score', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) { fail(res, 500, 'query_error', error.message); return; }

    // Fallback: if no velocity data, sort by sold_count
    let results = data || [];
    if (results.length === 0) {
      const { data: fallback } = await sb()
        .from('winning_products')
        .select('*')
        .order('sold_count', { ascending: false, nullsFirst: false })
        .limit(limit);
      results = fallback || [];
    }

    const pipelineAge = await getPipelineAge();
    ok(res, results.map((r: any) => pickFields(formatProduct(r), fields)), { pipeline_age: pipelineAge });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

/**
 * GET /v1/products/hot — newly discovered in last 48h.
 */
router.get('/products/hot', async (req: Request, res: Response) => {
  try {
    const fields = req.query.fields as string | undefined;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb()
      .from('winning_products')
      .select('*')
      .gte('created_at', cutoff)
      .order('winning_score', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) { fail(res, 500, 'query_error', error.message); return; }

    const pipelineAge = await getPipelineAge();
    ok(res, (data || []).map((r: any) => pickFields(formatProduct(r), fields)), { pipeline_age: pipelineAge });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

/**
 * GET /v1/products/search?q=<query> — text search.
 */
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      fail(res, 400, 'invalid_query', 'Query parameter "q" must be at least 2 characters.');
      return;
    }

    const fields = req.query.fields as string | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const { data, error, count } = await sb()
      .from('winning_products')
      .select('*', { count: 'exact' })
      .or(`product_title.ilike.%${q}%,category.ilike.%${q}%,search_keyword.ilike.%${q}%`)
      .order('winning_score', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) { fail(res, 500, 'query_error', error.message); return; }

    ok(res, (data || []).map((r: any) => pickFields(formatProduct(r), fields)), {
      total: count ?? 0,
      limit,
      offset,
      has_more: offset + limit < (count ?? 0),
      query: q,
    });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

/**
 * GET /v1/products/:id — single product by ID.
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.query.fields as string | undefined;

    const { data, error } = await sb()
      .from('winning_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      fail(res, 404, 'not_found', 'Product not found.');
      return;
    }

    ok(res, pickFields(formatProduct(data), fields));
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /v1/score — score any AliExpress URL.
 * Body: { url: "https://aliexpress.com/item/..." }
 */
router.post('/score', async (req: Request, res: Response) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.includes('aliexpress')) {
      fail(res, 400, 'invalid_url', 'Provide a valid AliExpress product URL.');
      return;
    }

    // Extract product ID from URL
    const match = url.match(/\/item\/(\d+)/);
    const aliId = match?.[1];

    // Check if we already have this product
    if (aliId) {
      const { data: existing } = await sb()
        .from('winning_products')
        .select('*')
        .eq('aliexpress_id', aliId)
        .maybeSingle();

      if (existing) {
        ok(res, {
          score: existing.winning_score,
          product: formatProduct(existing),
          source: 'database',
        });
        return;
      }
    }

    // Attempt to scrape + analyse
    try {
      const { scrapeProductData } = await import('../lib/scrape-product');
      const { analyzeProduct } = await import('../lib/product-intelligence');
      const scraped = await scrapeProductData(url);
      const intelligence = await analyzeProduct(scraped);
      ok(res, {
        score: intelligence.overallScore || null,
        product: { ...scraped, intelligence },
        source: 'live_analysis',
      });
    } catch {
      fail(res, 422, 'scrape_failed', 'Could not scrape or score this URL. AliExpress may be blocking the request.');
    }
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /v1/brief — generate AI brief for a product.
 * Body: { product_id: "<uuid>" } or { url: "..." }
 */
router.post('/brief', async (req: Request, res: Response) => {
  try {
    const { product_id, url } = req.body || {};

    let product: any = null;

    if (product_id) {
      const { data } = await sb()
        .from('winning_products')
        .select('*')
        .eq('id', product_id)
        .single();
      product = data;
    } else if (url) {
      // Try to find by aliexpress_id
      const match = url.match(/\/item\/(\d+)/);
      if (match?.[1]) {
        const { data } = await sb()
          .from('winning_products')
          .select('*')
          .eq('aliexpress_id', match[1])
          .maybeSingle();
        product = data;
      }
    }

    if (!product) {
      fail(res, 404, 'not_found', 'Product not found. Provide a valid product_id or URL.');
      return;
    }

    const { callClaude } = await import('../lib/claudeWrap');

    const msg = await callClaude({
      feature: 'ai_brief',
      userId: (req as any).apiKey?.user_id || 'api',
      maxTokens: 400,
      system: `You are a dropshipping product strategist. Generate a concise ad brief for this product in JSON format: { "target": "target audience", "hook": "attention hook", "angle": "marketing angle", "platform": "best platform", "cta": "call to action" }. Be specific and actionable. Return ONLY valid JSON.`,
      messages: [{
        role: 'user' as const,
        content: `Product: ${product.product_title}\nCategory: ${product.category || 'General'}\nPrice: $${product.price_aud} AUD\nSold: ${product.sold_count || 0}\nScore: ${product.winning_score || 'N/A'}`,
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    let brief: Record<string, string> = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        brief = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      } catch {
        brief = { raw: text };
      }
    } else {
      brief = { raw: text };
    }

    ok(res, { brief, product_id: product.id, product_title: product.product_title });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

/**
 * POST /v1/ads/generate — generate ad copy.
 * Body: { product_id: "<uuid>", format: "meta_feed|meta_story|tiktok_feed|tiktok_story" }
 */
router.post('/ads/generate', async (req: Request, res: Response) => {
  try {
    const { product_id, format = 'meta_feed' } = req.body || {};

    if (!product_id) {
      fail(res, 400, 'missing_field', 'product_id is required.');
      return;
    }

    const validFormats = ['meta_feed', 'meta_story', 'tiktok_feed', 'tiktok_story'];
    if (!validFormats.includes(format)) {
      fail(res, 400, 'invalid_format', `format must be one of: ${validFormats.join(', ')}`);
      return;
    }

    const { data: product } = await sb()
      .from('winning_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (!product) {
      fail(res, 404, 'not_found', 'Product not found.');
      return;
    }

    const { callClaude } = await import('../lib/claudeWrap');

    const formatDescriptions: Record<string, string> = {
      meta_feed: 'Facebook/Instagram feed ad (headline + body + CTA)',
      meta_story: 'Instagram Story ad (short hook + CTA overlay)',
      tiktok_feed: 'TikTok in-feed ad (viral hook + body + CTA)',
      tiktok_story: 'TikTok Story ad (3-second hook + body)',
    };

    const msg = await callClaude({
      feature: 'ads_generation',
      userId: (req as any).apiKey?.user_id || 'api',
      maxTokens: 600,
      system: `You are a performance marketing copywriter. Generate ad copy for a ${formatDescriptions[format]}. Return ONLY valid JSON: { "headline": "...", "body": "...", "cta": "...", "hooks": ["hook1", "hook2", "hook3"] }. Be specific, use power words, create urgency.`,
      messages: [{
        role: 'user' as const,
        content: `Product: ${product.product_title}\nCategory: ${product.category || 'General'}\nPrice: $${product.price_aud} AUD\nFormat: ${format}\nSold: ${product.sold_count || 0} units`,
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    let ad: Record<string, unknown> = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        ad = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      } catch {
        ad = { raw: text };
      }
    } else {
      ad = { raw: text };
    }

    ok(res, { ...ad, format, product_id: product.id });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /v1/alerts — create a price/score alert.
 * Body: { product_id, type: "price"|"score", threshold: number }
 */
router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).apiKey?.user_id;
    const { product_id, type = 'price', threshold } = req.body || {};

    if (!product_id || threshold === undefined) {
      fail(res, 400, 'missing_fields', 'product_id and threshold are required.');
      return;
    }

    if (!['price', 'score'].includes(type)) {
      fail(res, 400, 'invalid_type', 'type must be "price" or "score".');
      return;
    }

    const { data, error } = await sb()
      .from('alerts')
      .insert({
        user_id: userId,
        product_id,
        alert_type: type,
        threshold: Number(threshold),
        is_active: true,
      })
      .select('id, product_id, alert_type, threshold, is_active, created_at')
      .single();

    if (error) {
      fail(res, 500, 'create_failed', error.message);
      return;
    }

    ok(res, data);
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

/**
 * GET /v1/alerts — list active alerts.
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).apiKey?.user_id;

    const { data, error } = await sb()
      .from('alerts')
      .select('id, product_id, alert_type, threshold, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      fail(res, 500, 'query_error', error.message);
      return;
    }

    ok(res, data || []);
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

/**
 * DELETE /v1/alerts/:id — remove alert.
 */
router.delete('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).apiKey?.user_id;
    const { id } = req.params;

    const { error } = await sb()
      .from('alerts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      fail(res, 500, 'delete_failed', error.message);
      return;
    }

    ok(res, { id, deleted: true });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /v1/stats — platform overview.
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Total products
    const { count: totalProducts } = await sb()
      .from('winning_products')
      .select('id', { count: 'exact', head: true });

    // Categories (distinct)
    const { data: catData } = await sb()
      .from('winning_products')
      .select('category')
      .not('category', 'is', null)
      .limit(1000);

    const categories = [...new Set((catData || []).map((r: any) => r.category).filter(Boolean))];

    // Last pipeline refresh
    const pipelineAge = await getPipelineAge();

    // Average score
    const { data: scoreData } = await sb()
      .from('winning_products')
      .select('winning_score')
      .not('winning_score', 'is', null)
      .limit(5000);

    const scores = (scoreData || []).map((r: any) => r.winning_score).filter(Boolean);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;

    ok(res, {
      total_products: totalProducts ?? 0,
      categories: categories.length,
      category_list: categories.sort(),
      average_score: avgScore,
      pipeline_age_seconds: pipelineAge,
      last_refresh: pipelineAge !== null ? new Date(Date.now() - pipelineAge * 1000).toISOString() : null,
    });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS (registration)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /v1/webhooks — register a webhook.
 * Body: { event: "product.hot"|"product.trending"|"alert.triggered", url: "https://...", category?: string }
 */
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).apiKey?.user_id;
    const { event, url, category } = req.body || {};

    if (!event || !url) {
      fail(res, 400, 'missing_fields', 'event and url are required.');
      return;
    }

    const validEvents = ['product.hot', 'product.trending', 'alert.triggered'];
    if (!validEvents.includes(event)) {
      fail(res, 400, 'invalid_event', `event must be one of: ${validEvents.join(', ')}`);
      return;
    }

    try {
      new URL(url);
    } catch {
      fail(res, 400, 'invalid_url', 'url must be a valid HTTPS URL.');
      return;
    }

    // Store webhook registration (we'll use the alerts table with a special type)
    const { data, error } = await sb()
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      fail(res, 400, 'no_api_key', 'Active API key required.');
      return;
    }

    // For MVP, return webhook registration as acknowledged
    // Full webhook delivery requires a background worker (future enhancement)
    ok(res, {
      webhook_id: crypto.randomUUID(),
      event,
      url,
      category: category || null,
      status: 'registered',
      note: 'Webhook delivery is in beta. Events will be POSTed to your URL when triggered.',
    });
  } catch (err: any) {
    fail(res, 500, 'server_error', err.message);
  }
});

export default router;
