import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

const META_API_VERSION = 'v19.0';
const REDIRECT_URI = 'https://www.majorka.io/api/meta/callback';

function getMetaConfig() {
  return {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    clientToken: process.env.FACEBOOK_APP_CLIENT_TOKEN || '',
  };
}

function isMetaConfigured(): boolean {
  const cfg = getMetaConfig();
  return !!(cfg.appId && cfg.appSecret);
}

// ── POST /api/meta/connect — generate OAuth URL ────────────────────────────
router.post('/connect', requireAuth, (req, res) => {
  if (!isMetaConfigured()) {
    return res.json({
      error: 'meta_not_configured',
      message: 'Meta integration is not yet configured. Contact support.',
    });
  }

  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });

  const stateToken = crypto.randomBytes(16).toString('hex');
  const state = `${userId}_${stateToken}`;

  const cfg = getMetaConfig();
  const params = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: REDIRECT_URI,
    scope: 'ads_management,ads_read,business_management,pages_read_engagement,instagram_basic',
    state,
    response_type: 'code',
  });

  const url = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
  return res.json({ url, state });
});

// ── GET /api/meta/callback — OAuth callback ─────────────────────────────────
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query as Record<string, string>;
    if (!code || !state) return res.redirect('/app/ads-manager?error=missing_params');

    const parts = state.split('_');
    if (parts.length < 2) return res.redirect('/app/ads-manager?error=invalid_state');
    const userId = parts[0];

    if (!isMetaConfigured()) {
      return res.redirect('/app/ads-manager?error=meta_not_configured');
    }

    const cfg = getMetaConfig();

    // Exchange code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?${tokenParams.toString()}`
    );
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[meta/callback] Token exchange failed:', err);
      return res.redirect('/app/ads-manager?error=token_exchange');
    }
    const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string; expires_in?: number };

    // Exchange for long-lived token (60 days)
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      fb_exchange_token: tokenData.access_token,
    });

    const longRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?${longLivedParams.toString()}`
    );
    let accessToken = tokenData.access_token;
    let expiresAt: Date | null = null;

    if (longRes.ok) {
      const longData = (await longRes.json()) as { access_token: string; expires_in?: number };
      accessToken = longData.access_token;
      if (longData.expires_in) {
        expiresAt = new Date(Date.now() + longData.expires_in * 1000);
      }
    }

    // Store in DB
    const supabase = getSupabaseAdmin();
    await supabase.from('meta_connections').upsert(
      {
        user_id: userId,
        access_token: accessToken,
        token_expires_at: expiresAt?.toISOString() || null,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return res.redirect('/app/ads-manager?meta_connected=true');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[meta/callback]', message);
    return res.redirect('/app/ads-manager?error=oauth_failed');
  }
});

// ── GET /api/meta/status — connection status ────────────────────────────────
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.json({ connected: false });

    if (!isMetaConfigured()) {
      return res.json({ connected: false, meta_not_configured: true });
    }

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('meta_connections')
      .select('ad_account_id, ad_account_name, pixel_id, business_id, token_expires_at, connected_at, webhook_id')
      .eq('user_id', userId)
      .single();

    if (!data) return res.json({ connected: false });

    return res.json({
      connected: true,
      accountName: data.ad_account_name || null,
      adAccountId: data.ad_account_id || null,
      pixelId: data.pixel_id || null,
      businessId: data.business_id || null,
      tokenExpiresAt: data.token_expires_at || null,
      connectedAt: data.connected_at || null,
      capiEnabled: !!data.webhook_id,
    });
  } catch {
    return res.json({ connected: false });
  }
});

// ── POST /api/meta/disconnect — remove connection ───────────────────────────
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const supabase = getSupabaseAdmin();
    await supabase.from('meta_connections').delete().eq('user_id', userId);
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ── GET /api/meta/ad-accounts — list user's ad accounts ─────────────────────
router.get('/ad-accounts', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const supabase = getSupabaseAdmin();
    const { data: conn } = await supabase
      .from('meta_connections')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (!conn?.access_token) {
      return res.status(400).json({ error: 'Meta not connected' });
    }

    const adAccountsRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/me/adaccounts?fields=id,name,account_status,currency,business&access_token=${conn.access_token}`
    );

    if (!adAccountsRes.ok) {
      const err = await adAccountsRes.text();
      console.error('[meta/ad-accounts]', err);
      return res.status(400).json({ error: 'Failed to fetch ad accounts' });
    }

    const adData = (await adAccountsRes.json()) as { data: Array<{ id: string; name: string; account_status: number; currency: string; business?: { id: string; name: string } }> };

    return res.json({
      accounts: (adData.data || []).map((a) => ({
        id: a.id,
        name: a.name,
        status: a.account_status,
        currency: a.currency,
        businessId: a.business?.id || null,
        businessName: a.business?.name || null,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ── POST /api/meta/select-account — save selected ad account + pixel ────────
router.post('/select-account', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { adAccountId, adAccountName, pixelId, businessId } = req.body as {
      adAccountId?: string;
      adAccountName?: string;
      pixelId?: string;
      businessId?: string;
    };

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('meta_connections')
      .update({
        ad_account_id: adAccountId || null,
        ad_account_name: adAccountName || null,
        pixel_id: pixelId || null,
        business_id: businessId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ── POST /api/meta/install-pixel — install Meta Pixel on Shopify ────────────
router.post('/install-pixel', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const supabase = getSupabaseAdmin();

    // Get Meta pixel
    const { data: meta } = await supabase
      .from('meta_connections')
      .select('pixel_id')
      .eq('user_id', userId)
      .single();

    if (!meta?.pixel_id) {
      return res.status(400).json({ error: 'No Meta Pixel configured. Select an ad account with a pixel first.' });
    }

    // Get Shopify connection
    const { data: shopify } = await supabase
      .from('shopify_connections')
      .select('shop_domain, access_token')
      .eq('user_id', userId)
      .single();

    if (!shopify?.access_token) {
      return res.status(400).json({ error: 'Shopify not connected' });
    }

    // Create ScriptTag on Shopify
    const scriptRes = await fetch(
      `https://${shopify.shop_domain}/admin/api/2024-01/script_tags.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': shopify.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_tag: {
            event: 'onload',
            src: 'https://connect.facebook.net/en_US/fbevents.js',
            display_scope: 'all',
          },
        }),
      }
    );

    if (!scriptRes.ok) {
      const err = await scriptRes.text();
      console.error('[meta/install-pixel]', err);
      return res.status(400).json({ error: 'Failed to install pixel on Shopify' });
    }

    return res.json({ success: true, pixelId: meta.pixel_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ── POST /api/meta/setup-capi — enable Conversions API ──────────────────────
router.post('/setup-capi', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const supabase = getSupabaseAdmin();

    // Verify Meta connected
    const { data: meta } = await supabase
      .from('meta_connections')
      .select('pixel_id, access_token')
      .eq('user_id', userId)
      .single();

    if (!meta?.access_token || !meta?.pixel_id) {
      return res.status(400).json({ error: 'Meta not fully connected. Connect and select an ad account first.' });
    }

    // Verify Shopify connected
    const { data: shopify } = await supabase
      .from('shopify_connections')
      .select('shop_domain, access_token')
      .eq('user_id', userId)
      .single();

    if (!shopify?.access_token) {
      return res.status(400).json({ error: 'Shopify not connected' });
    }

    // Register Shopify webhook for orders/create
    const webhookRes = await fetch(
      `https://${shopify.shop_domain}/admin/api/2024-01/webhooks.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': shopify.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic: 'orders/create',
            address: 'https://www.majorka.io/api/meta/events/purchase',
            format: 'json',
          },
        }),
      }
    );

    if (!webhookRes.ok) {
      const err = await webhookRes.text();
      console.error('[meta/setup-capi]', err);
      return res.status(400).json({ error: 'Failed to create Shopify webhook' });
    }

    const webhookData = (await webhookRes.json()) as { webhook?: { id: number } };
    const webhookId = webhookData.webhook?.id;

    // Store webhook ID
    await supabase
      .from('meta_connections')
      .update({ webhook_id: String(webhookId), updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return res.json({ success: true, webhookId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ── POST /api/meta/events/purchase — public Shopify webhook endpoint ────────
router.post('/events/purchase', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify Shopify HMAC
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    const shopifySecret = process.env.SHOPIFY_API_SECRET || '';

    if (hmacHeader && shopifySecret) {
      const rawBody = typeof req.body === 'string' ? req.body : req.body.toString();
      const computed = crypto
        .createHmac('sha256', shopifySecret)
        .update(rawBody)
        .digest('base64');

      if (computed !== hmacHeader) {
        return res.status(401).json({ error: 'HMAC verification failed' });
      }
    }

    const order = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = order.email || order.customer?.email || '';
    const totalPrice = parseFloat(order.total_price || '0');
    const currency = order.currency || 'AUD';
    const orderId = order.id || order.order_number || '';

    // Hash email for Meta
    const emailHash = email
      ? crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
      : '';

    const eventId = `purchase_${orderId}_${Date.now()}`;

    // Find the user's Meta connection to get pixel_id and access_token
    // We need to identify the user from the Shopify shop domain
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    if (!shopDomain) {
      // Still respond 200 to avoid Shopify retries
      return res.status(200).json({ received: true, forwarded: false, reason: 'no_shop_domain' });
    }

    const supabase = getSupabaseAdmin();
    const { data: shopConn } = await supabase
      .from('shopify_connections')
      .select('user_id')
      .eq('shop_domain', shopDomain)
      .single();

    if (!shopConn) {
      return res.status(200).json({ received: true, forwarded: false, reason: 'no_connection' });
    }

    const { data: metaConn } = await supabase
      .from('meta_connections')
      .select('pixel_id, access_token')
      .eq('user_id', shopConn.user_id)
      .single();

    if (!metaConn?.pixel_id || !metaConn?.access_token) {
      return res.status(200).json({ received: true, forwarded: false, reason: 'no_meta' });
    }

    // Forward to Meta Conversions API
    const eventPayload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          user_data: {
            em: emailHash ? [emailHash] : [],
          },
          custom_data: {
            value: totalPrice,
            currency,
            order_id: String(orderId),
            content_type: 'product',
          },
        },
      ],
    };

    const capiRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${metaConn.pixel_id}/events?access_token=${metaConn.access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
      }
    );

    const capiResult = await capiRes.json();
    return res.status(200).json({ received: true, forwarded: true, result: capiResult });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[meta/events/purchase]', message);
    // Always return 200 for webhooks to prevent retries
    return res.status(200).json({ received: true, forwarded: false, error: message });
  }
});

// ── POST /api/meta/campaigns — create campaign ──────────────────────────────
router.post('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { name, objective, dailyBudget, productIds, targeting } = req.body as {
      name: string;
      objective?: string;
      dailyBudget?: number;
      productIds?: string[];
      targeting?: Record<string, unknown>;
    };

    if (!name) return res.status(400).json({ error: 'Campaign name required' });

    const supabase = getSupabaseAdmin();

    // Save campaign to DB
    const { data: campaign, error: insertError } = await supabase
      .from('ad_campaigns')
      .insert({
        user_id: userId,
        name,
        objective: objective || 'OUTCOME_SALES',
        status: 'draft',
        daily_budget_aud: dailyBudget || null,
        product_ids: productIds || [],
        targeting: targeting || {},
      })
      .select()
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });

    // Check if Meta is connected — if so, try to publish
    const { data: meta } = await supabase
      .from('meta_connections')
      .select('access_token, ad_account_id')
      .eq('user_id', userId)
      .single();

    if (meta?.access_token && meta?.ad_account_id) {
      try {
        // Create campaign on Meta
        const metaCampaignRes = await fetch(
          `https://graph.facebook.com/${META_API_VERSION}/${meta.ad_account_id}/campaigns`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              objective: objective || 'OUTCOME_SALES',
              status: 'PAUSED',
              special_ad_categories: [],
              access_token: meta.access_token,
            }),
          }
        );

        if (metaCampaignRes.ok) {
          const metaResult = (await metaCampaignRes.json()) as { id?: string };
          if (metaResult.id) {
            await supabase
              .from('ad_campaigns')
              .update({ meta_campaign_id: metaResult.id, status: 'paused', updated_at: new Date().toISOString() })
              .eq('id', campaign.id);

            return res.json({ ...campaign, meta_campaign_id: metaResult.id, status: 'paused', published: true });
          }
        }
      } catch (metaErr: unknown) {
        console.error('[meta/campaigns] Meta publish failed:', metaErr instanceof Error ? metaErr.message : metaErr);
        // Continue — campaign saved as draft
      }
    }

    return res.json({ ...campaign, published: false, message: meta ? 'Saved as draft — Meta publish failed' : 'Saved as draft — connect Meta to publish' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// ── GET /api/meta/campaigns — list campaigns ────────────────────────────────
router.get('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ campaigns: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// Need express import for raw body parsing on webhook
import express from 'express';

export default router;
