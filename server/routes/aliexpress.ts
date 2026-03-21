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

const REDIRECT_URI = `${process.env.VITE_APP_URL || 'https://www.majorka.io'}/api/aliexpress/callback`;

// ── GET /api/aliexpress/auth — start OAuth flow ────────────────────────────────
router.get('/auth', async (_req: Request, res: Response) => {
  const { getAuthUrl } = await import('../lib/aliexpress');
  const url = getAuthUrl(REDIRECT_URI);
  res.redirect(url);
});

// ── GET /api/aliexpress/callback — exchange code for token ─────────────────────
router.get('/callback', async (req: Request, res: Response) => {
  const code = String(req.query.code || '');
  if (!code) { res.status(400).send('Missing code parameter'); return; }

  try {
    const { exchangeCodeForToken } = await import('../lib/aliexpress');
    const token = await exchangeCodeForToken(code, REDIRECT_URI);

    // Store tokens — in production update Vercel env vars via API
    // For now store in memory + log for manual Vercel update
    process.env.ALIEXPRESS_ACCESS_TOKEN = token.access_token;
    process.env.ALIEXPRESS_REFRESH_TOKEN = token.refresh_token;

    const expiresAt = new Date(token.expire_time).toISOString();
    console.log('[aliexpress-oauth] ✅ Access token obtained');
    console.log('[aliexpress-oauth] Expires:', expiresAt);
    console.log('[aliexpress-oauth] Access token:', token.access_token.slice(0, 20) + '...');
    console.log('[aliexpress-oauth] Refresh token:', token.refresh_token.slice(0, 20) + '...');
    console.log('[aliexpress-oauth] User ID:', token.user_id);
    console.log('[aliexpress-oauth] ACTION REQUIRED: Add to Vercel:');
    console.log(`  ALIEXPRESS_ACCESS_TOKEN=${token.access_token}`);
    console.log(`  ALIEXPRESS_REFRESH_TOKEN=${token.refresh_token}`);

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

// ── GET /api/aliexpress/status — check auth status ─────────────────────────────
router.get('/status', async (_req: Request, res: Response) => {
  const { isAuthorized } = await import('../lib/aliexpress');
  const authorized = isAuthorized();
  res.json({
    authorized,
    appKey: process.env.ALIEXPRESS_APP_KEY ? 'set' : 'missing',
    appSecret: process.env.ALIEXPRESS_APP_SECRET ? 'set' : 'missing',
    accessToken: process.env.ALIEXPRESS_ACCESS_TOKEN ? 'set' : 'missing',
    authUrl: `${process.env.VITE_APP_URL || 'https://www.majorka.io'}/api/aliexpress/auth`,
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
