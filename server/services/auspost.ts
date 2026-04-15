/**
 * Australia Post PAC (Postage Assessment Calculation) API wrapper.
 *
 * Docs: https://developers.auspost.com.au/apis/pac
 * Auth: free API key registered at https://developers.auspost.com.au
 *       passed as `AUTH-KEY: <key>` header.
 *
 * Every call returns `null` on any failure (missing key, timeout, non-2xx,
 * JSON parse error, shape mismatch) so the product detail panel never
 * 500s when Australia Post is down or the env var is missing.
 *
 * Responses are cached for 24h via `server/lib/cache.ts` keyed on the
 * full input tuple. Prefix: `auspost:`.
 */
import { cache } from '../lib/cache';

const BASE_URL = 'https://digitalapi.auspost.com.au';
const TIMEOUT_MS = 10_000;
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const CACHE_PREFIX = 'auspost:';

export interface DomesticShippingQuote {
  standard: number | null;
  express: number | null;
  parcel_locker: number | null;
  /** Free-text ETA e.g. "5-8 business days" derived from service codes. */
  eta_standard: string | null;
  eta_express: string | null;
}

export interface InternationalShippingQuote {
  economy: number | null;
  standard: number | null;
  express: number | null;
}

function getAuthKey(): string {
  return process.env.AUSPOST_API_KEY || '';
}

/**
 * Shared fetch wrapper — honours timeout + null-on-failure contract.
 */
async function pacFetch(path: string): Promise<unknown | null> {
  const key = getAuthKey();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'AUTH-KEY': key,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Domestic parcel quote.
 * Returns the three standard service tiers — null fields when any
 * single service fails but we still got at least one price back, or
 * `null` (the whole object) on a hard network/auth failure.
 */
export async function calculateDomesticShipping(
  fromPostcode: string,
  toPostcode: string,
  weightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
): Promise<DomesticShippingQuote | null> {
  if (!fromPostcode || !toPostcode || weightKg <= 0) return null;

  const cacheKey =
    `${CACHE_PREFIX}dom:${fromPostcode}:${toPostcode}:${weightKg}` +
    `:${lengthCm}:${widthCm}:${heightCm}`;
  const hit = cache.get<DomesticShippingQuote | null>(cacheKey);
  if (hit !== null) return hit;

  if (!getAuthKey()) {
    // Explicit null miss is cheap: never cache "not configured".
    return null;
  }

  const qs = new URLSearchParams({
    from_postcode: String(fromPostcode),
    to_postcode: String(toPostcode),
    length: String(lengthCm),
    width: String(widthCm),
    height: String(heightCm),
    weight: String(weightKg),
  });

  const [regularRaw, expressRaw] = await Promise.all([
    pacFetch(`/postage/parcel/domestic/service.json?${qs.toString()}&service_code=AUS_PARCEL_REGULAR`),
    pacFetch(`/postage/parcel/domestic/service.json?${qs.toString()}&service_code=AUS_PARCEL_EXPRESS`),
  ]);

  const standard = extractPostage(regularRaw);
  const express = extractPostage(expressRaw);

  const quote: DomesticShippingQuote = {
    standard,
    express,
    // Parcel Locker is historically ~10-15% cheaper than standard when eligible.
    parcel_locker: standard != null ? round2(standard * 0.88) : null,
    eta_standard: standard != null ? '5-8 business days' : null,
    eta_express: express != null ? '1-3 business days' : null,
  };

  if (quote.standard == null && quote.express == null) {
    // Don't cache a fully-empty response — the upstream may recover.
    return null;
  }

  cache.set(cacheKey, quote, CACHE_TTL_SECONDS);
  return quote;
}

/**
 * International parcel quote.
 * Accepts a 2-letter ISO country code (e.g. "US", "GB", "NZ").
 */
export async function calculateInternationalShipping(
  countryCode: string,
  weightKg: number,
): Promise<InternationalShippingQuote | null> {
  if (!countryCode || weightKg <= 0) return null;

  const cacheKey = `${CACHE_PREFIX}intl:${countryCode.toUpperCase()}:${weightKg}`;
  const hit = cache.get<InternationalShippingQuote | null>(cacheKey);
  if (hit !== null) return hit;

  if (!getAuthKey()) return null;

  const qs = new URLSearchParams({
    country_code: countryCode.toUpperCase(),
    weight: String(weightKg),
  });

  const [econRaw, stdRaw, expRaw] = await Promise.all([
    pacFetch(`/postage/parcel/international/service.json?${qs.toString()}&service_code=INT_PARCEL_ECO_OWN_PACKAGING`),
    pacFetch(`/postage/parcel/international/service.json?${qs.toString()}&service_code=INT_PARCEL_STD_OWN_PACKAGING`),
    pacFetch(`/postage/parcel/international/service.json?${qs.toString()}&service_code=INT_PARCEL_EXP_OWN_PACKAGING`),
  ]);

  const quote: InternationalShippingQuote = {
    economy: extractPostage(econRaw),
    standard: extractPostage(stdRaw),
    express: extractPostage(expRaw),
  };
  if (quote.economy == null && quote.standard == null && quote.express == null) {
    return null;
  }

  cache.set(cacheKey, quote, CACHE_TTL_SECONDS);
  return quote;
}

/**
 * Australia Post responses nest a `postage_result.total_cost` field.
 * We narrow defensively — any missing / non-numeric layer returns null.
 */
function extractPostage(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;
  const result = body.postage_result;
  if (!result || typeof result !== 'object') return null;
  const total = (result as Record<string, unknown>).total_cost;
  const num = typeof total === 'string' ? parseFloat(total) : typeof total === 'number' ? total : NaN;
  if (!Number.isFinite(num) || num <= 0) return null;
  return round2(num);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
