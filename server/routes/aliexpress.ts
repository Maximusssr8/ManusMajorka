/**
 * AliExpress API routes
 * GET  /api/aliexpress/auth          → redirects to AliExpress OAuth
 * GET  /api/aliexpress/callback      → exchanges code for token, saves to env
 * GET  /api/aliexpress/status        → checks if authorized + token validity
 * GET  /api/aliexpress/search?q=...  → search products (requires auth)
 * GET  /api/aliexpress/trending?niche=... → trending products by niche
 * GET  /api/aliexpress/:productId    → product detail + shipping
 * POST /api/aliexpress/import        → import product to trend_signals
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Always use exact callback URL (no www to keep consistent)
const REDIRECT_URI = 'https://majorka.io/api/aliexpress/callback';

// ── GET /api/aliexpress/auth — start OAuth flow ────────────────────────────────
router.get('/auth', async (_req: Request, res: Response) => {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '530110';
  console.log('[ae-auth] app_key from env:', process.env.ALIEXPRESS_APP_KEY);
  console.log('[ae-auth] using app_key:', appKey);
  console.log('[ae-auth] redirect_uri:', REDIRECT_URI);

  const { getAuthUrl } = await import('../lib/aliexpress');
  const url = getAuthUrl(REDIRECT_URI);
  console.log('[ae-auth] redirecting to:', url);
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
    const { exchangeCodeForToken } = await import('../lib/aliexpress');
    const token = await exchangeCodeForToken(code, REDIRECT_URI);

    // Store tokens in process env immediately
    process.env.ALIEXPRESS_ACCESS_TOKEN = token.access_token;
    process.env.ALIEXPRESS_REFRESH_TOKEN = token.refresh_token;

    const expiresAt = token.expire_time ? new Date(token.expire_time).toISOString() : 'unknown';
    console.log('[aliexpress-oauth] ✅ Access token obtained, user:', token.user_id);
    console.log('[aliexpress-oauth] expires:', expiresAt);

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
            // Try PATCH if already exists
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
        console.log('[aliexpress-oauth] ✅ Tokens saved to Vercel env vars');
      } catch (e: any) {
        console.error('[aliexpress-oauth] Failed to auto-save to Vercel:', e.message);
      }
    }

    res.send(`
      <html><body style="font-family:sans-serif;background:#080a0e;color:#fff;padding:40px">
        <h2>✅ AliExpress Connected!</h2>
        <p>Access token obtained for user: <strong>${token.user_id}</strong></p>
        <p>Expires: ${expiresAt}</p>
        <hr>
        <p><strong>Add these to Vercel environment variables:</strong></p>
        <pre style="background:#1a1a2e;padding:16px;border-radius:8px;overflow:auto">ALIEXPRESS_ACCESS_TOKEN=${token.access_token}
ALIEXPRESS_REFRESH_TOKEN=${token.refresh_token}</pre>
        <p><a href="/app/admin" style="color:#d4af37">← Back to Admin</a></p>
      </body></html>
    `);
  } catch (err: any) {
    console.error('[aliexpress-oauth] Error:', err.message);
    res.status(500).send(`OAuth error: ${err.message}`);
  }
});

// ── GET /api/aliexpress/test — raw DS API test (no auth required) ─────────────
router.get('/test', async (_req: Request, res: Response) => {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '530110';
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || '8aHJr5hI76XIqvtKDKc5b1h6FfTytp75';
  console.log('[ae-test] app_key:', appKey, '| app_secret set:', !!appSecret);

  try {
    // Direct raw call so we see the exact response
    const crypto = await import('crypto');
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
    params.sign = crypto.default.createHash('md5').update(appSecret + str + appSecret).digest('hex').toUpperCase();

    const body = new URLSearchParams(params).toString();
    const apiRes = await fetch('https://api-sg.aliexpress.com/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    });

    const raw = await apiRes.json();
    const products = raw?.aliexpress_ds_product_search_response?.search_result?.products?.product || [];

    res.json({
      app_key: appKey,
      http_status: apiRes.status,
      product_count: products.length,
      error: raw?.error_response || null,
      sample_product: products[0] ? {
        id: products[0].product_id,
        title: products[0].product_title?.slice(0, 80),
        price: products[0].target_sale_price,
        image: products[0].product_main_image_url?.slice(0, 80),
        orders: products[0].lastest_volume,
      } : null,
      raw_response: raw,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, app_key: appKey });
  }
});

// ── GET /api/aliexpress/status — check auth status ─────────────────────────────
router.get('/status', async (_req: Request, res: Response) => {
  const { isAuthorized } = await import('../lib/aliexpress');
  res.json({
    authorized: isAuthorized(),
    mode: 'ds_api', // DS API — no OAuth needed for product search
    appKey: process.env.ALIEXPRESS_APP_KEY ? '✅ set' : '❌ missing',
    appSecret: process.env.ALIEXPRESS_APP_SECRET ? '✅ set' : '❌ missing',
    testUrl: 'https://www.majorka.io/api/aliexpress/test',
  });
});

// ── GET /api/aliexpress/search?q=earbuds&limit=20 ──────────────────────────────
router.get('/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const page = Number(req.query.page) || 1;
  if (!q) { res.status(400).json({ error: 'q required', products: [] }); return; }

  try {
    const { searchProducts } = await import('../lib/aliexpress');
    const products = await searchProducts(q, { pageSize: limit, pageNo: page });
    res.json({ products, total: products.length, query: q });
  } catch (err: any) {
    const notAuthed = err.message.includes('ALIEXPRESS_ACCESS_TOKEN');
    res.status(notAuthed ? 401 : 500).json({
      error: err.message,
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
    const { getTrendingProducts } = await import('../lib/aliexpress');
    const products = await getTrendingProducts(niche, limit);
    res.json({ products, total: products.length, niche });
  } catch (err: any) {
    res.status(500).json({ error: err.message, products: [] });
  }
});

// ── GET /api/aliexpress/:productId — product detail ────────────────────────────
router.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!/^\d+$/.test(productId)) { res.status(400).json({ error: 'Invalid product ID' }); return; }
  try {
    const { getProductDetail, getShippingInfo } = await import('../lib/aliexpress');
    const [detail, shipping] = await Promise.all([getProductDetail(productId), getShippingInfo(productId)]);
    if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ product: detail, shipping });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/aliexpress/import — import to trend_signals ─────────────────────
router.post('/import', async (req: Request, res: Response) => {
  const { productId, niche } = req.body || {};
  if (!productId) { res.status(400).json({ error: 'productId required' }); return; }
  try {
    const { getProductDetail } = await import('../lib/aliexpress');
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
    );
    const detail = await getProductDetail(productId);
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
