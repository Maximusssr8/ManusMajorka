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
router.get('/auth', (req, res) => {
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

export default router;
