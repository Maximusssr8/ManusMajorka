import { Router, Request } from 'express';
import { buildAuthUrl, exchangeCode, verifyHmac } from '../lib/shopify';
import crypto from 'crypto';

const router = Router();

// Lazy Supabase admin client — reads env vars at call time, not module load time
// Uses VITE_SUPABASE_URL as fallback since that's what's set in Vercel env
function getSupabaseAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  return createClient(url, key);
}

function getToken(req: Request): string {
  return (req.headers.authorization || '').replace('Bearer ', '').trim();
}

// GET /api/shopify/auth — start OAuth
router.get('/auth', async (req, res) => {
  // Rate limit: 20 auth attempts per hour per IP
  const { rateLimit } = await import('../lib/rate-limit');
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
  const rl = rateLimit(`shopify-auth:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'rate_limit_exceeded', message: 'Too many requests. Try again later.' });
  }

  const shop = req.query.shop as string;
  if (!shop || !shop.endsWith('.myshopify.com')) {
    return res.status(400).json({ error: 'Invalid shop domain — must end in .myshopify.com' });
  }
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('shopify_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600_000, // 10 min
  });
  return res.redirect(buildAuthUrl(shop, state));
});

// GET /api/shopify/callback — OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { shop, code, state, hmac, ...rest } = req.query as Record<string, string>;
    const cookieState = (req as any).cookies?.shopify_state;

    if (!state || state !== cookieState) {
      return res.status(403).send('State mismatch — possible CSRF');
    }
    if (!verifyHmac({ shop, code, state, hmac, ...rest })) {
      return res.status(403).send('HMAC verification failed');
    }

    const accessToken = await exchangeCode(shop, code);

    const jwt = getToken(req);
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);

    if (userErr || !user) {
      return res.redirect('/store-builder?error=auth_required');
    }

    await supabase.from('shopify_connections').upsert(
      { user_id: user.id, shop_domain: shop, access_token: accessToken },
      { onConflict: 'user_id' }
    );

    res.clearCookie('shopify_state');
    return res.redirect(`/store-builder?connected=true&shop=${encodeURIComponent(shop)}`);
  } catch (err: any) {
    console.error('[shopify/callback]', err);
    return res.redirect('/store-builder?error=oauth_failed');
  }
});

// GET /api/shopify/status
router.get('/status', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(getToken(req));
    if (!user) return res.json({ connected: false });
    const { data } = await supabase
      .from('shopify_connections')
      .select('shop_domain')
      .eq('user_id', user.id)
      .single();
    return res.json({ connected: !!data, shop: data?.shop_domain || null });
  } catch {
    return res.json({ connected: false });
  }
});

// DELETE /api/shopify/disconnect
router.delete('/disconnect', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user } } = await supabase.auth.getUser(getToken(req));
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await supabase.from('shopify_connections').delete().eq('user_id', user.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/shopify/products — push a Majorka product to Shopify
router.post('/products', async (req, res) => {
  try {
    const { productId, shop } = req.body;
    if (!productId || !shop) return res.status(400).json({ error: 'productId and shop required' });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server not configured' });

    const tokenRes = await fetch(`${supabaseUrl}/rest/v1/shopify_connections?shop_domain=eq.${encodeURIComponent(shop)}&select=access_token&limit=1`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const tokens = await tokenRes.json();
    if (!Array.isArray(tokens) || !tokens[0]?.access_token) {
      return res.status(401).json({ error: 'Shopify not connected. Please reconnect your store.' });
    }
    const accessToken = tokens[0].access_token;

    const prodRes = await fetch(`${supabaseUrl}/rest/v1/winning_products?id=eq.${encodeURIComponent(productId)}&limit=1`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const products = await prodRes.json();
    if (!Array.isArray(products) || !products[0]) return res.status(404).json({ error: 'Product not found' });
    const p = products[0];

    const title = p.product_title || 'New Product';
    const price = (p.price_aud || 49.99).toFixed(2);
    const image = p.image_url || null;

    const shopifyRes = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: {
          title,
          body_html: `<p>${title}</p><p>Source: AliExpress | AU dropship ready</p>`,
          vendor: 'Majorka',
          product_type: p.category || 'General',
          status: 'draft',
          variants: [{ price, inventory_management: null, fulfillment_service: 'manual' }],
          images: image ? [{ src: image }] : [],
        },
      }),
    });

    if (!shopifyRes.ok) {
      const err = await shopifyRes.json();
      return res.status(shopifyRes.status).json({ error: 'Shopify API error', details: err });
    }

    const result: any = await shopifyRes.json();
    res.json({
      success: true,
      shopify_product_id: result.product?.id,
      shopify_product_url: `https://${shop}/admin/products/${result.product?.id}`,
      title: result.product?.title,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
