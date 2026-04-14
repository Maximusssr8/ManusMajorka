/**
 * Phase 2: AliExpress Product Detail Scraper (full-field)
 *
 * Launches the `clockworks~aliexpress-scraper` Apify actor to harvest every
 * field the actor exposes for a given product URL, then maps the raw response
 * into our `winning_products` schema.
 *
 * Fields captured (in addition to link_status/verification):
 *   price (USD + AUD using live fx-rates)
 *   orders / sold_count
 *   rating (stars) + review_count
 *   description_text
 *   hi_res_image_url + additional gallery images
 *   shipping_cost_aud + shipping_to_au flag
 *   seller_name, seller_rating, seller_followers
 *   variants JSON + variant_count
 *   source_currency, fx_rate_at_scrape
 *   last_apify_run_id, apify_raw (for debugging missing fields)
 *
 * Fire-and-forget pattern — the run is launched here, then harvested later
 * by the scheduled cron which calls `processAEDetailResults` with the run id.
 */
import { getSupabaseAdmin } from '../_core/supabase';
import { startApifyRun, fetchDatasetItems } from '../lib/apifyFireForget';
import { getFxRates, FALLBACK_RATES } from '../lib/fx-rates';

const ACTOR_ID = 'clockworks~aliexpress-scraper';
const MAX_PER_RUN = 50;

// ── parseOrders ──────────────────────────────────────────────────────────

export function parseOrders(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return Math.round(raw);

  const s = String(raw).trim().toLowerCase().replace(/[+,\s]/g, '');

  // Handle "2.6k sold" or "2.6k"
  const kMatch = s.match(/^([\d.]+)k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const mMatch = s.match(/^([\d.]+)m/);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1_000_000);

  // Strip trailing non-numeric like "sold"
  const numStr = s.replace(/[^\d.]/g, '');
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// ── parsePrice ───────────────────────────────────────────────────────────
// Apify actors sometimes return price as "US $12.99" or "€8,50" — strip
// everything but digits + decimal separator and parse cleanly.

export function parsePrice(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return raw;
  const s = String(raw).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

// ── detectCurrency ───────────────────────────────────────────────────────
// Best-effort detection of the source currency from actor fields.
// Most AliExpress actor responses default to USD but expose a currency or
// symbol in either `currency`, `currencyCode`, or embedded in the price str.

export function detectCurrency(item: Record<string, unknown>): string {
  const raw =
    (item.currency as string | undefined) ||
    (item.currencyCode as string | undefined) ||
    (item.priceCurrency as string | undefined);
  if (typeof raw === 'string' && raw.length === 3) return raw.toUpperCase();

  const priceStr = String(item.price ?? item.salePrice ?? '');
  if (priceStr.includes('€')) return 'EUR';
  if (priceStr.includes('£')) return 'GBP';
  if (priceStr.includes('A$') || priceStr.toUpperCase().includes('AUD')) return 'AUD';
  return 'USD';
}

// ── Launch scrape ────────────────────────────────────────────────────────

interface LaunchOptions {
  urls?: string[];          // direct URLs take precedence
  productIds?: string[];    // numeric item ids
}

export async function launchAEDetailScrape(
  arg?: string[] | LaunchOptions
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  let urls: string[] | undefined;
  let ids: string[] | undefined;
  if (Array.isArray(arg)) {
    ids = arg;
  } else if (arg && typeof arg === 'object') {
    urls = arg.urls;
    ids = arg.productIds;
  }

  // Fall back to DB query for unverified products if caller provided neither.
  if ((!ids || ids.length === 0) && (!urls || urls.length === 0)) {
    const { data, error } = await supabase
      .from('winning_products')
      .select('aliexpress_id, aliexpress_url')
      .not('aliexpress_id', 'is', null)
      .or('link_status.is.null,link_status.neq.verified')
      .limit(MAX_PER_RUN);

    if (error) {
      console.error('[ae-detail] Query error:', error.message);
      return null;
    }
    ids = (data || [])
      .map((r: { aliexpress_id: string | null }) => r.aliexpress_id)
      .filter((id): id is string => !!id);
  }

  const runInput: Record<string, unknown> = {
    maxItems: MAX_PER_RUN,
    includeDescription: true,           // ensure description_text comes back
    includeShipping: true,              // and shipping info
    includeSellerInfo: true,            // seller rating + followers
    includeReviews: false,              // reviews are heavy; summary only
    shippingCountry: 'AU',              // quote AU shipping when actor supports it
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL'],
    },
  };

  if (urls && urls.length > 0) {
    const batch = urls.slice(0, MAX_PER_RUN);
    runInput.startUrls = batch.map((url) => ({ url }));
    console.log(`[ae-detail] Launching scrape for ${batch.length} urls`);
  } else if (ids && ids.length > 0) {
    const batch = ids.slice(0, MAX_PER_RUN);
    runInput.productIds = batch;
    // Many actor builds prefer startUrls — set both for compatibility.
    runInput.startUrls = batch.map((id) => ({
      url: `https://www.aliexpress.com/item/${id}.html`,
    }));
    console.log(`[ae-detail] Launching scrape for ${batch.length} product ids`);
  } else {
    console.log('[ae-detail] No unverified products to scrape');
    return null;
  }

  const result = await startApifyRun(ACTOR_ID, 'ae_product_detail', runInput);
  return result?.runId || null;
}

// ── Process results ──────────────────────────────────────────────────────

function extractAliexpressId(item: Record<string, unknown>): string | null {
  // Try direct field
  if (item.itemId) return String(item.itemId);
  if (item.productId) return String(item.productId);
  if (item.id) return String(item.id);

  // Extract from URL
  const url = String(item.url || item.link || '');
  const match = url.match(/\/(\d{8,15})\.html/) || url.match(/item\/(\d{8,15})/);
  return match ? match[1] : null;
}

// Normalises image urls (adds https: to protocol-relative, prefers hi-res).
function cleanImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  let url = raw.trim();
  if (url.startsWith('//')) url = `https:${url}`;
  if (!url.startsWith('http')) return null;
  // Upgrade AliCDN thumbnails to hi-res where we can.
  // e.g. .../_200x200q75.jpg_.webp → .../.jpg
  url = url.replace(/_\d+x\d+q?\d*\.jpg_?\.?webp?$/i, '').replace(/_\d+x\d+\.\w+$/i, '');
  return url;
}

function extractImages(item: Record<string, unknown>): { hi: string | null; all: string[] } {
  const rawList: unknown[] =
    (item.images as unknown[]) ||
    (item.imageUrls as unknown[]) ||
    (item.productImages as unknown[]) ||
    (item.gallery as unknown[]) ||
    [];
  const cleaned = rawList
    .map(cleanImageUrl)
    .filter((u): u is string => typeof u === 'string');
  const hi = cleaned[0] ?? cleanImageUrl(item.image) ?? cleanImageUrl(item.imageUrl) ?? null;
  return { hi, all: cleaned };
}

interface ShippingQuote {
  costAud: number | null;
  shipsToAu: boolean;
}

function extractShipping(item: Record<string, unknown>, fxRates: Record<string, number>): ShippingQuote {
  // Actor returns either `shipping` (object/array) or `shippingOptions` (array).
  const list: unknown[] = Array.isArray(item.shippingOptions)
    ? (item.shippingOptions as unknown[])
    : Array.isArray(item.shipping)
      ? (item.shipping as unknown[])
      : item.shipping && typeof item.shipping === 'object'
        ? [item.shipping]
        : [];

  if (list.length === 0) return { costAud: null, shipsToAu: true };

  let cheapestAud: number | null = null;
  let shipsToAu = false;
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const country = String(e.country || e.toCountry || e.shipTo || '').toUpperCase();
    // If actor provided per-country quotes, only accept AU-relevant ones.
    if (country && country !== 'AU' && country !== 'AUSTRALIA') continue;
    shipsToAu = true;
    const costRaw = e.cost ?? e.price ?? e.amount ?? e.fee;
    const currency = String(e.currency || e.currencyCode || 'USD').toUpperCase();
    const costNum = parsePrice(costRaw);
    if (costNum <= 0) continue;
    const rate = fxRates[currency === 'USD' ? 'AUD' : 'AUD'] || fxRates.AUD || FALLBACK_RATES.AUD;
    const usdAmount = currency === 'USD' ? costNum : costNum / (fxRates[currency] || 1);
    const audAmount = usdAmount * rate;
    if (cheapestAud == null || audAmount < cheapestAud) cheapestAud = audAmount;
  }

  if (!shipsToAu && list.length > 0) {
    // Actor returned shipping options, but none to AU — treat as non-shippable.
    return { costAud: null, shipsToAu: false };
  }
  return {
    costAud: cheapestAud != null ? parseFloat(cheapestAud.toFixed(2)) : null,
    shipsToAu,
  };
}

interface MappedProduct {
  aliexpressId: string;
  linkStatus: 'verified' | 'dead';
  update: Record<string, unknown>;
  missingFields: string[];
}

export function mapApifyItem(
  item: Record<string, unknown>,
  fxRates: Record<string, number>,
  runId: string | null,
): MappedProduct | null {
  const aliexpressId = extractAliexpressId(item);
  if (!aliexpressId) return null;

  const isAvailable = item.isAvailable !== false && item.status !== 'unavailable';
  const now = new Date().toISOString();
  const missing: string[] = [];

  if (!isAvailable) {
    return {
      aliexpressId,
      linkStatus: 'dead',
      update: { link_status: 'dead', link_verified_at: now, last_apify_run_id: runId },
      missingFields: [],
    };
  }

  const sourceCurrency = detectCurrency(item);
  const rawPrice = parsePrice(item.price ?? item.salePrice ?? item.discountPrice ?? item.originalPrice);
  const fxUsdToAud = fxRates.AUD || FALLBACK_RATES.AUD;
  // Convert source → USD → AUD (our rates table is USD-based).
  const priceUsd = sourceCurrency === 'USD'
    ? rawPrice
    : rawPrice / (fxRates[sourceCurrency] || 1);
  const priceAud = priceUsd * fxUsdToAud;

  if (rawPrice <= 0) missing.push('price');

  const orders = parseOrders(item.tradeCount ?? item.soldCount ?? item.orders);
  if (orders <= 0) missing.push('orders');

  const rating = parseFloat(String(item.starRating ?? item.rating ?? item.averageStarRate ?? 0));
  const reviewCount = parseInt(String(item.reviewCount ?? item.totalEvalNum ?? item.totalReviews ?? 0), 10) || 0;

  const { hi: hiResImage, all: galleryImages } = extractImages(item);
  if (!hiResImage) missing.push('image');

  const shipping = extractShipping(item, fxRates);

  const sellerName =
    (item.storeName as string) ||
    (item.sellerName as string) ||
    (item.shopName as string) ||
    null;
  const sellerRating = parseFloat(String(item.storeRating ?? item.sellerRating ?? item.storePositiveRating ?? 0)) || null;
  const sellerFollowers = parseInt(String(item.storeFollowers ?? item.sellerFollowers ?? 0), 10) || null;

  const variantsRaw = item.skuProps ?? item.variants ?? item.skus ?? null;
  const variantCount = Array.isArray(variantsRaw)
    ? variantsRaw.length
    : Array.isArray(item.skus) ? (item.skus as unknown[]).length
    : null;

  const description =
    (item.description as string) ||
    (item.productDescription as string) ||
    (item.descriptionText as string) ||
    null;

  // Only include fields with meaningful values so we never clobber good data.
  const update: Record<string, unknown> = {
    link_status: 'verified',
    link_verified_at: now,
    last_apify_run_id: runId,
    source_currency: sourceCurrency,
    fx_rate_at_scrape: fxUsdToAud,
    apify_raw: item,
  };

  if (rawPrice > 0) {
    update.real_price_usd = parseFloat(priceUsd.toFixed(2));
    update.real_price_aud = parseFloat(priceAud.toFixed(2));
    update.price_aud = parseFloat(priceAud.toFixed(2));
  }
  if (orders > 0) {
    update.real_orders_count = orders;
    update.sold_count = orders;
    update.orders_count = orders;
  }
  if (rating > 0) {
    update.real_rating = rating;
    update.rating = rating;
  }
  if (reviewCount > 0) {
    update.real_review_count = reviewCount;
    update.review_count = reviewCount;
  }
  if (hiResImage) {
    update.hi_res_image_url = hiResImage;
    update.additional_image_urls = galleryImages.slice(1, 10);
  }
  if (shipping.costAud != null) update.shipping_cost_aud = shipping.costAud;
  update.shipping_to_au = shipping.shipsToAu;
  if (sellerName) update.seller_name = sellerName;
  if (sellerRating) update.seller_rating = sellerRating;
  if (sellerFollowers) update.seller_followers = sellerFollowers;
  if (variantsRaw) update.variants = variantsRaw;
  if (variantCount != null) update.variant_count = variantCount;
  if (description) update.description = description.slice(0, 4000);

  if (!sellerName) missing.push('seller_name');
  if (!description) missing.push('description');
  if (!rating) missing.push('rating');

  return { aliexpressId, linkStatus: 'verified', update, missingFields: missing };
}

export async function processAEDetailResults(
  runId: string,
  datasetId: string,
): Promise<{ updated: number; dead: number; missingFieldsSummary: Record<string, number> }> {
  const items = await fetchDatasetItems(datasetId, 200);
  if (items.length === 0) {
    console.log('[ae-detail] No items in dataset');
    return { updated: 0, dead: 0, missingFieldsSummary: {} };
  }

  const fxRates = await getFxRates();
  const supabase = getSupabaseAdmin();
  let updated = 0;
  let dead = 0;
  const missingFieldsSummary: Record<string, number> = {};

  for (const item of items) {
    const mapped = mapApifyItem(item as Record<string, unknown>, fxRates, runId);
    if (!mapped) continue;

    for (const f of mapped.missingFields) {
      missingFieldsSummary[f] = (missingFieldsSummary[f] ?? 0) + 1;
    }

    const { error } = await supabase
      .from('winning_products')
      .update(mapped.update)
      .eq('aliexpress_id', mapped.aliexpressId);

    if (error) {
      console.error(`[ae-detail] Update failed for ${mapped.aliexpressId}:`, error.message);
      continue;
    }

    if (mapped.linkStatus === 'dead') dead++; else updated++;
  }

  const missingReport = Object.entries(missingFieldsSummary)
    .map(([k, n]) => `${k}=${n}`)
    .join(', ') || 'none';
  console.log(`[ae-detail] Processed run ${runId}: ${updated} updated, ${dead} dead; missing: ${missingReport}`);
  return { updated, dead, missingFieldsSummary };
}
