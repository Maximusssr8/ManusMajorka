/**
 * AliExpress Affiliate OAuth routes
 * Matches registered callback URL: https://majorka.io/api/auth/aliexpress/callback
 *
 * GET  /api/auth/aliexpress/start    → redirect to AliExpress OAuth login
 * GET  /api/auth/aliexpress/callback → exchange code for token, store in Supabase
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const OAUTH_URL = 'https://oauth.aliexpress.com/authorize';
const TOKEN_URL = 'https://api-sg.aliexpress.com/rest/auth/token/security/create';

interface AliExpressToken {
  access_token: string;
  refresh_token: string;
  expire_time?: string;
  user_id?: string;
  account_id?: string;
  [key: string]: unknown;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

function signParams(params: Record<string, string>, appSecret: string): string {
  const sorted = Object.keys(params).sort();
  const baseString = sorted.map(k => `${k}${params[k]}`).join('');
  const toSign = appSecret + baseString + appSecret;
  return crypto.createHmac('sha256', appSecret).update(toSign).digest('hex').toUpperCase();
}

async function exchangeCodeForToken(code: string): Promise<AliExpressToken | null> {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '531190';
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || '';

  const params: Record<string, string> = {
    app_key: appKey,
    code,
    sign_method: 'hmac',
    timestamp: String(Date.now()),
  };

  params.sign = signParams(params, appSecret);

  const body = new URLSearchParams(params);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json() as Record<string, unknown>;
  if (data.error_response) {
    console.error('[ae-auth] token exchange failed:', data.error_response);
    return null;
  }
  return data as unknown as AliExpressToken;
}

// GET /api/auth/aliexpress/start — redirect to AliExpress OAuth
router.get('/start', (_req: Request, res: Response) => {
  const appKey = process.env.ALIEXPRESS_APP_KEY || '531190';
  const callbackUrl = process.env.ALIEXPRESS_CALLBACK_URL || 'https://majorka.io/api/auth/aliexpress/callback';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appKey,
    redirect_uri: callbackUrl,
    sp: 'ae',
  });

  res.redirect(`${OAUTH_URL}?${params}`);
});

// GET /api/auth/aliexpress/callback — exchange code for token
router.get('/callback', async (req: Request, res: Response) => {
  const code = String(req.query.code || '');
  const error = String(req.query.error || '');

  if (error) {
    console.error('[ae-auth] OAuth error:', error, req.query.error_description);
    res.status(400).send(`OAuth error: ${error} — ${req.query.error_description || ''}`);
    return;
  }
  if (!code) {
    res.status(400).send('Missing code parameter');
    return;
  }

  try {
    const token = await exchangeCodeForToken(code);
    if (!token) {
      res.status(500).send('Token exchange failed — check server logs');
      return;
    }

    // Store tokens in process.env for current session
    process.env.ALIEXPRESS_ACCESS_TOKEN = token.access_token;
    process.env.ALIEXPRESS_REFRESH_TOKEN = token.refresh_token;

    // Store in Supabase for persistence
    const sb = getSupabaseAdmin();
    const appKey = process.env.ALIEXPRESS_APP_KEY || '531190';

    // Upsert into aliexpress_tokens (will fail gracefully if table doesn't exist yet)
    const { error: dbErr } = await sb.from('aliexpress_tokens').upsert({
      app_key: appKey,
      access_token: token.access_token,
      refresh_token: token.refresh_token || '',
      expires_at: token.expire_time ? new Date(Number(token.expire_time)).toISOString() : null,
      account_id: token.account_id || token.user_id || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'app_key' });

    if (dbErr) {
      console.warn('[ae-auth] DB upsert failed (table may not exist yet):', dbErr.message);
    }

    const expiresAt = token.expire_time ? new Date(Number(token.expire_time)).toISOString() : 'unknown';
    console.info('[ae-auth] Token obtained, account:', token.account_id || token.user_id, 'expires:', expiresAt);

    res.send(`
      <html><body style="font-family:sans-serif;background:#080a0e;color:#fff;padding:40px">
        <h2>AliExpress Affiliate API Connected</h2>
        <p>Access token obtained for account: <strong>${token.account_id || token.user_id || 'unknown'}</strong></p>
        <p>Expires: ${expiresAt}</p>
        <p><a href="/app/admin" style="color:#6366f1">Back to Admin</a></p>
      </body></html>
    `);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ae-auth] Error:', msg);
    res.status(500).send(`OAuth error: ${msg}`);
  }
});

export default router;
