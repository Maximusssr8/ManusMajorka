/**
 * shopifyValidate — lightweight Shopify Admin API ping.
 * Calls GET /admin/api/2024-01/shop.json with the provided Admin API access token.
 * Returns shop identity on success; typed error reason on failure.
 */

export interface ShopifyShopInfo {
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  plan_name: string;
  country_name?: string;
  currency?: string;
}

export type ShopifyValidationResult =
  | { ok: true; shop: ShopifyShopInfo }
  | { ok: false; reason: 'invalid_url' | 'unauthorized' | 'not_found' | 'network' | 'rate_limit' | 'unknown'; message: string; status?: number };

const SHOP_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,60}\.myshopify\.com$/i;

/** Normalise user input ("https://foo.myshopify.com/", "foo.myshopify.com", "foo")
 * to the canonical `{shop}.myshopify.com` host. Returns null when unparseable. */
export function normaliseShopDomain(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // Strip protocol + path
  const hostOnly = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\/$/, '');

  // Bare handle like "my-shop" → "my-shop.myshopify.com"
  if (!hostOnly.includes('.')) {
    const candidate = `${hostOnly}.myshopify.com`;
    return SHOP_DOMAIN_REGEX.test(candidate) ? candidate : null;
  }

  return SHOP_DOMAIN_REGEX.test(hostOnly) ? hostOnly : null;
}

export async function validateShopifyStore(
  shopInput: string,
  accessToken: string,
  opts: { timeoutMs?: number } = {},
): Promise<ShopifyValidationResult> {
  const domain = normaliseShopDomain(shopInput);
  if (!domain) {
    return {
      ok: false,
      reason: 'invalid_url',
      message: 'Enter a valid Shopify store URL (e.g. your-shop.myshopify.com).',
    };
  }
  if (!accessToken || accessToken.length < 20) {
    return {
      ok: false,
      reason: 'unauthorized',
      message: 'Admin API access token is missing or too short.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);

  try {
    const resp = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (resp.status === 401 || resp.status === 403) {
      return {
        ok: false,
        reason: 'unauthorized',
        status: resp.status,
        message: 'Access token was rejected. Make sure it has read_products + read_orders scopes.',
      };
    }
    if (resp.status === 404) {
      return {
        ok: false,
        reason: 'not_found',
        status: 404,
        message: `Shop ${domain} not found. Double-check the store URL.`,
      };
    }
    if (resp.status === 429) {
      return {
        ok: false,
        reason: 'rate_limit',
        status: 429,
        message: 'Shopify rate-limited the validation request. Try again in a few seconds.',
      };
    }
    if (!resp.ok) {
      return {
        ok: false,
        reason: 'unknown',
        status: resp.status,
        message: `Shopify returned ${resp.status}.`,
      };
    }

    const payload = (await resp.json()) as { shop?: Partial<ShopifyShopInfo> };
    const shop = payload.shop;
    if (!shop || typeof shop.name !== 'string') {
      return { ok: false, reason: 'unknown', message: 'Shopify response was malformed.' };
    }

    return {
      ok: true,
      shop: {
        name: shop.name,
        email: shop.email ?? '',
        domain: shop.domain ?? domain,
        myshopify_domain: shop.myshopify_domain ?? domain,
        plan_name: shop.plan_name ?? 'unknown',
        country_name: shop.country_name,
        currency: shop.currency,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown network error.';
    return {
      ok: false,
      reason: 'network',
      message: `Could not reach Shopify: ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
