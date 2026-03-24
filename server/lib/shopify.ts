import crypto from 'crypto';

export function getShopifyConfig() {
  return {
    apiKey: (process.env.SHOPIFY_API_KEY || '').trim(),
    apiSecret: (process.env.SHOPIFY_API_SECRET || '').trim(),
    scopes: (process.env.SHOPIFY_SCOPES || 'write_products,write_content,read_themes,write_themes').trim().split(',').map(s => s.trim()),
    redirectUri: (process.env.SHOPIFY_REDIRECT_URI || 'https://www.majorka.io/api/shopify/callback').trim(),
  };
}

export function buildAuthUrl(shop: string, state: string): string {
  const cfg = getShopifyConfig();
  const params = new URLSearchParams({
    client_id: cfg.apiKey,
    scope: cfg.scopes.join(','),
    redirect_uri: cfg.redirectUri,
    state,
    'grant_options[]': 'per-user',
  });
  return `https://${shop}/admin/oauth/authorize?${params}`;
}

export async function exchangeCode(shop: string, code: string): Promise<string> {
  const cfg = getShopifyConfig();
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: cfg.apiKey, client_secret: cfg.apiSecret, code }),
  });
  if (!res.ok) throw new Error(`OAuth exchange failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export function verifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;
  const cfg = getShopifyConfig();
  const message = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('&');
  const digest = crypto.createHmac('sha256', cfg.apiSecret).update(message).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(hmac, 'hex'));
  } catch {
    return false;
  }
}
