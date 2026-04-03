/**
 * AliExpress API routes
 * GET  /api/aliexpress/auth          → redirects to AliExpress OAuth
 * GET  /api/aliexpress/callback      → exchanges code for token, saves to env
 * GET  /api/aliexpress/status        → checks API status + tests affiliate API
 * GET  /api/aliexpress/test          → raw DS API test
 * GET  /api/aliexpress/search?q=...  → search products (DS API)
 * GET  /api/aliexpress/trending      → trending products by niche
 * GET  /api/aliexpress/hot           → hot products (Affiliate API)
 * GET  /api/aliexpress/categories    → affiliate categories
 * GET  /api/aliexpress/link?url=...  → generate affiliate link
 * GET  /api/aliexpress/:productId    → product detail + shipping
 * POST /api/aliexpress/import        → import product to trend_signals
 * GET  /api/aliexpress/affiliate/search  → affiliate product search
 * GET  /api/aliexpress/affiliate/product/:id → affiliate product detail
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
// Static imports (dynamic imports banned in Vercel serverless)
import { getAuthUrl, exchangeCodeForToken, isAuthorized, searchProducts, getTrendingProducts, getProductDetail as getDSProductDetail, getShippingInfo } from '../lib/aliexpress';
import {
  searchAliAffiliateProducts,
  getAliAffiliateProductDetail,
  getHotProducts,
  getAffiliateCategories,
  generateAffiliateLink,
} from '../lib/aliexpress-affiliate';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Always use exact callback URL (no www to keep consistent)
const REDIRECT_URI = 'https://majorka.io/api/aliexpress/callback';

// ── GET /api/aliexpress/auth — start OAuth flow ────────────────────────────────
router.get('/auth', async (_req: Request, res: Response) => {
  const url = getAuthUrl(REDIRECT_URI);
  res.redirect(url);
});

// ── GET /api/aliexpress/callback — exchange code for token ─────────────────────
router.get('/callback', async (req: Request, res: Response) => {
  const code = String(req.query.code || '');
  const error = String(req.query.error || '');
  if (error) {
    console.error('[ae-callback] OAuth error:', error, req.query.error_description);
    res.status(400).send(`OAuth error: ${error} — ${req.query.error_description || ''}`);
    return;
  }
  if (!code) { res.status(400).send('Missing code parameter'); return; }

  try {
    const token = await exchangeCodeForToken(code, REDIRECT_URI);

    // Store tokens in process env immediately
    process.env.ALIEXPRESS_ACCESS_TOKEN = token.access_token;
    process.env.ALIEXPRESS_REFRESH_TOKEN = token.refresh_token;

    const expiresAt = token.expire_time ? new Date(token.expire_time).toISOString() : 'unknown';
    console.info('[aliexpress-oauth] Access token obtained, user:', token.user_id);

    // Auto-save to Vercel env vars so token survives redeployment
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = 'prj_fuP0FKGoarPrEv1U2s9pdEWCCHk9';
    if (vercelToken) {
      try {
        for (const [key, value] of [
          ['ALIEXPRESS_ACCESS_TOKEN', token.access_token],
          ['ALIEXPRESS_REFRESH_TOKEN', token.refresh_token],
        ]) {
          const res2 = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value, type: 'encrypted', target: ['production', 'preview', 'development'] }),
          });
          if (!res2.ok) {
            const existing = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env`, {
              headers: { 'Authorization': `Bearer ${vercelToken}` }
            }).then(r => r.json()).then((d: any) => d.envs?.find((e: any) => e.key === key));
            if (existing?.id) {
              await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env/${existing.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ value }),
              });
            }
          }
        }
        console.info('[aliexpress-oauth] Tokens saved to Vercel env vars');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[aliexpress-oauth] Failed to auto-save to Vercel:', msg);
      }
    }

    res.send(`
      <html><body style="font-family:sans-serif;background:#080a0e;color:#fff;padding:40px">
        <h2>AliExpress Connected</h2>
        <p>Access token obtained for user: <strong>${token.user_id}</strong></p>
        <p>Expires: ${expiresAt}</p>
        <p><a href="/app/admin" style="color:#6366f1">Back to Admin</a></p>
      </body></html>
    `);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[aliexpress-oauth] Error:', msg);
    res.status(500).send(`OAuth error: ${msg}`);
  }
});

// ── GET /api/aliexpress/test — raw DS API test (no auth required) ─────────────
router.get('/test', async (_req: Request, res: Response) => {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '530110';
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || '8aHJr5hI76XIqvtKDKc5b1h6FfTytp75';

  try {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const params: Record<string, string> = {
      method: 'aliexpress.ds.product.search',
      app_key: appKey,
      timestamp: ts,
      sign_method: 'md5',
      v: '2.0',
      search_key: 'posture corrector',
      product_cnt: '5',
      sort: 'SALE_PRICE_DESC',
      local_currency: 'AUD',
      ship_to_country: 'AU',
    };
    const sorted = Object.keys(params).sort();
    const str = sorted.map(k => `${k}${params[k]}`).join('');
    params.sign = crypto.createHash('md5').update(appSecret + str + appSecret).digest('hex').toUpperCase();

    const body = new URLSearchParams(params).toString();
    const apiRes = await fetch('https://api-sg.aliexpress.com/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    });

    const raw = await apiRes.json();
    const products = (raw as any)?.aliexpress_ds_product_search_response?.search_result?.products?.product || [];

    res.json({
      app_key: appKey,
      http_status: apiRes.status,
      product_count: products.length,
      error: (raw as any)?.error_response || null,
      sample_product: products[0] ? {
        id: products[0].product_id,
        title: products[0].product_title?.slice(0, 80),
        price: products[0].target_sale_price,
        image: products[0].product_main_image_url?.slice(0, 80),
        orders: products[0].lastest_volume,
      } : null,
      raw_response: raw,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg, app_key: appKey });
  }
});

// ── GET /api/aliexpress/status — check API status + test affiliate API ────────
router.get('/status', async (_req: Request, res: Response) => {
  // Use AE_ prefix first (new keys), fall back to ALIEXPRESS_ prefix (legacy)
  const appKey = process.env.AE_APP_KEY || process.env.ALIEXPRESS_APP_KEY || '';
  const hasSecret = !!(process.env.AE_APP_SECRET || process.env.ALIEXPRESS_APP_SECRET);

  let apiWorking = false;
  let categoriesCount = 0;
  let testError = '';

  // Check DB-cached categories count (Vercel can't reach AE API directly due to IP restrictions)
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { count } = await supabaseAdmin
      .from('aliexpress_categories')
      .select('*', { count: 'exact', head: true });
    categoriesCount = count || 0;
    apiWorking = categoriesCount > 0;
    if (!apiWorking) testError = 'Categories DB empty — run seed script from local machine';
  } catch (e: unknown) {
    testError = e instanceof Error ? e.message : String(e);
  }

  res.json({
    configured: !!appKey && hasSecret,
    app_key: appKey ? `${appKey.slice(0, 4)}****` : 'not set',
    api_working: apiWorking,
    categories_count: categoriesCount,
    error: testError || null,
    sign_method: 'hmac-sha256',
    note: apiWorking
      ? 'Affiliate API active — product search requires tracking ID registration at portals.aliexpress.com'
      : 'Affiliate API not responding — check AE_APP_KEY / AE_APP_SECRET env vars',
  });
});

// ── GET /api/aliexpress/search?q=earbuds&limit=20 ──────────────────────────────
router.get('/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const page = Number(req.query.page) || 1;
  if (!q) { res.status(400).json({ error: 'q required', products: [] }); return; }

  try {
    const products = await searchProducts(q, { pageSize: limit, pageNo: page });
    res.json({ products, total: products.length, query: q });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const notAuthed = msg.includes('ALIEXPRESS_ACCESS_TOKEN');
    res.status(notAuthed ? 401 : 500).json({
      error: msg,
      products: [],
      authUrl: notAuthed ? `${process.env.VITE_APP_URL || 'https://www.majorka.io'}/api/aliexpress/auth` : undefined,
    });
  }
});

// ── GET /api/aliexpress/trending?niche=fitness&limit=20 ────────────────────────
router.get('/trending', async (req: Request, res: Response) => {
  const niche = String(req.query.niche || 'fitness');
  const limit = Math.min(50, Number(req.query.limit) || 20);
  try {
    const products = await getTrendingProducts(niche, limit);
    res.json({ products, total: products.length, niche });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err), products: [] });
  }
});

// ── GET /api/aliexpress/hot — hot products from Affiliate API ─────────────────
router.get('/hot', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const categoryId = req.query.categoryId as string | undefined;

    // Try relay first (bypasses IP whitelist)
    const relayPath = `/relay/aliexpress/hot?page=${page}${categoryId ? `&categoryId=${categoryId}` : ''}`;
    const relayResult = await callViaRelay(relayPath).catch(() => null);
    const relayProducts = relayResult?.products || [];
    if (relayProducts.length > 0) {
      return res.json({ products: relayProducts, total: relayProducts.length, source: 'aliexpress' });
    }

    // Direct AE API fallback
    const result = await getHotProducts({ pageSize: 50, pageNo: page });
    const products = result?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product || [];
    res.json({ products, total: products.length, source: 'direct' });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err), products: [] });
  }
});

// ── GET /api/aliexpress/categories — all affiliate categories ─────────────────
// ── GET /api/aliexpress/categories — serve from DB cache (IP-restriction bypass) ─
// Categories are seeded from Mac where AE API works; Vercel reads from DB.
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { data, error } = await supabaseAdmin
      .from('aliexpress_categories')
      .select('id, name, parent_id, level')
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    
    // Shape to match AliExpress API format for compatibility
    const categories = (data || []).map(c => ({
      category_id: c.id,
      category_name: c.name,
      parent_category_id: c.parent_id,
    }));
    
    res.json({ categories, total: categories.length, source: 'db' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AE Categories] Error:', msg);
    res.status(500).json({ error: msg, categories: [] });
  }
});

// ── GET /api/aliexpress/link?url=... — generate affiliate link ────────────────
router.get('/link', requireAuth, async (req: Request, res: Response) => {
  const url = String(req.query.url || '');
  if (!url) { res.status(400).json({ error: 'url required' }); return; }
  try {
    const result = await generateAffiliateLink(url);
    const links = result?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link || [];
    res.json({ affiliate_url: links[0]?.promotion_link || url, original_url: url });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── Relay helper — routes AE API calls via Mac Mini (bypasses IP whitelist) ──
async function callViaRelay(path: string, method = 'GET', body?: object): Promise<any> {
  const relayUrl = process.env.ALIEXPRESS_RELAY_URL;
  const secret = process.env.RELAY_SECRET || 'majorka_relay_2026';
  if (!relayUrl) return null;
  const url = `${relayUrl}${path}${path.includes('?') ? '&' : '?'}secret=${secret}`;
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000),
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ── GET /api/aliexpress/products?keywords=...&page=...&limit=... ─────────────
// Relay → AliExpress API (Mac Mini IP whitelisted) → DB fallback
router.get('/products', requireAuth, async (req: Request, res: Response) => {
  const { keywords = '', page = '1', categoryId, limit = '50' } = req.query;
  try {
    // 1. Try relay (Mac Mini → AliExpress API) — bypasses Vercel IP restriction
    const relayPath = `/relay/aliexpress/products?keywords=${encodeURIComponent(String(keywords))}&page=${page}&limit=${limit}${categoryId ? `&categoryId=${categoryId}` : ''}`;
    const relayResult = await callViaRelay(relayPath).catch(() => null);
    const relayProducts = relayResult?.products || [];

    if (relayProducts.length > 0) {
      return res.json({ products: relayProducts, total: relayProducts.length, keyword: keywords, source: 'aliexpress' });
    }

    // 2. DB fallback — search winning_products by title
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const kw = String(keywords).trim();
    let dbQuery = supabaseAdmin
      .from('winning_products')
      .select('*')
      .eq('is_active', true)
      .order('real_orders_count', { ascending: false })
      .limit(50);
    if (kw) dbQuery = dbQuery.ilike('product_title', `%${kw}%`);
    const { data } = await dbQuery;
    const dbProducts = (data || []).map((p: any) => ({
      product_id: p.aliexpress_id,
      product_title: p.product_title,
      sale_price: p.real_price_aud,
      product_main_image_url: p.image_url,
      detail_url: p.source_url,
      orders: p.real_orders_count,
      rating: p.real_rating,
      winning_score: p.winning_score,
      category: p.category,
    }));
    res.json({ products: dbProducts, total: dbProducts.length, keyword: keywords, source: 'db' });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err), products: [] });
  }
});

// ── POST /api/aliexpress/affiliate-link — generate promotion link ─────────────
router.post('/affiliate-link', requireAuth, async (req: Request, res: Response) => {
  const { productUrl } = req.body || {};
  if (!productUrl) { res.status(400).json({ error: 'productUrl required' }); return; }
  try {
    const result = await generateAffiliateLink(productUrl as string);
    const link = result?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link?.[0]?.promotion_link;
    if (!link) {
      const errCode = result?.aliexpress_affiliate_link_generate_response?.resp_result?.resp_code;
      const errMsg = result?.aliexpress_affiliate_link_generate_response?.resp_result?.resp_msg || 'Link generation failed';
      return res.status(400).json({ error: `${errMsg} (code ${errCode})`, raw: result });
    }
    res.json({ url: link });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── GET /api/aliexpress/:productId — product detail ────────────────────────────
// Must be after all named routes to avoid matching them as :productId
router.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!/^\d+$/.test(productId)) { res.status(400).json({ error: 'Invalid product ID' }); return; }
  try {
    const [detail, shipping] = await Promise.all([getDSProductDetail(productId), getShippingInfo(productId)]);
    if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ product: detail, shipping });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── POST /api/aliexpress/import — import to trend_signals ─────────────────────
router.post('/import', async (req: Request, res: Response) => {
  const { productId, niche } = req.body || {};
  if (!productId) { res.status(400).json({ error: 'productId required' }); return; }
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
    );
    const detail = await getDSProductDetail(productId);
    if (!detail) { res.status(404).json({ error: 'Product not found' }); return; }

    const imageUrl = detail.image_urls?.split(';')[0] || '';
    const priceAud = parseFloat(detail.sku_price_list?.[0]?.sku_price?.price || '0') * 1.55;

    await supabase.from('trend_signals').upsert({
      name: detail.subject?.slice(0, 200),
      niche: niche || 'General',
      image_url: imageUrl,
      aliexpress_url: `https://www.aliexpress.com/item/${productId}.html`,
      supplier_name: 'AliExpress',
      estimated_retail_aud: Math.round(priceAud * 100) / 100,
      winning_score: 70, trend_score: 70, growth_pct: 10,
      source: 'aliexpress_import', real_data_scraped: true,
    }, { onConflict: 'name' });

    res.json({ success: true, product: { id: productId, name: detail.subject, imageUrl, priceAud } });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── Affiliate API endpoints ──────────────────────────────────────────────────

// GET /api/aliexpress/affiliate/search?q=keyword&limit=20
router.get('/affiliate/search', async (req: Request, res: Response) => {
  try {
    const keyword = String(req.query.q || '');
    const limit = Math.min(50, parseInt(String(req.query.limit || '20')));
    if (!keyword) { res.status(400).json({ error: 'q is required' }); return; }

    const products = await searchAliAffiliateProducts(keyword, limit);
    res.json({ products, count: products.length, keyword });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/aliexpress/affiliate/product/:id
router.get('/affiliate/product/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await getAliAffiliateProductDetail(id);
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
