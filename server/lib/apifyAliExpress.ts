/**
 * Scrapes real AliExpress product data using Apify's aliexpress-scraper actor.
 * Apify handles JS rendering + proxy rotation natively — bypasses AliExpress
 * bot protection.
 *
 * This returns the full payload we care about downstream (images, shipping,
 * seller info, variants, description) so the product detail sheet never has
 * to show "—". Fields are best-effort: if the actor doesn't expose one, the
 * value is `null` and the missing field is logged for diagnosis.
 */

import { getFxRates, FALLBACK_RATES } from './fx-rates';

export interface ApifyProductData {
  title: string | null;
  images: string[];
  hiResImage: string | null;
  price: number | null;       // USD (legacy field name, kept for back-compat)
  priceUsd: number | null;    // USD (preferred)
  priceAud: number | null;
  sourceCurrency: string;
  rating: number | null;
  reviewCount: number | null;
  orders: number | null;
  description: string | null;
  sellerName: string | null;
  sellerRating: number | null;
  sellerFollowers: number | null;
  shippingCostAud: number | null;
  shipsToAu: boolean;
  variants: unknown;
  variantCount: number | null;
  missingFields: string[];
}

const ACTOR = 'clockworks~aliexpress-scraper';
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 18; // 90s max

function parsePriceNum(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const parsed = parseFloat(s);
  return isNaN(parsed) ? null : parsed;
}

function cleanImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  let url = raw.trim();
  if (url.startsWith('//')) url = `https:${url}`;
  if (!url.startsWith('http')) return null;
  if (!url.includes('alicdn')) return url;
  // Strip low-res suffixes like _200x200q75.jpg_.webp so we get the full-size image.
  return url.replace(/_\d+x\d+q?\d*\.jpg_?\.?webp?$/i, '').replace(/_\d+x\d+\.\w+$/i, '');
}

function detectCurrency(item: Record<string, unknown>): string {
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

export async function scrapeAliExpressWithApify(productUrl: string): Promise<ApifyProductData | null> {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN;
  if (!token) { console.error('[apify] No APIFY_API_KEY/TOKEN'); return null; }

  try {
    console.log('[apify] Starting run for:', productUrl.slice(0, 70));

    // Start actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: productUrl }],
          maxItems: 1,
          includeDescription: true,
          includeShipping: true,
          includeSellerInfo: true,
          shippingCountry: 'AU',
          proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!startRes.ok) {
      console.error('[apify] Start failed:', startRes.status, await startRes.text().catch(() => ''));
      return null;
    }
    const startData = await startRes.json() as { data?: { id: string } };
    const runId = startData?.data?.id;
    if (!runId) { console.error('[apify] No run ID'); return null; }
    console.log('[apify] Run started:', runId);

    // Poll for completion
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const statusData = await statusRes.json() as { data?: { status: string } };
      const status = statusData?.data?.status;
      console.log(`[apify] Poll ${i + 1}: ${status}`);

      if (status === 'SUCCEEDED') {
        const itemsRes = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}/dataset/items?token=${token}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const items = await itemsRes.json() as unknown[];
        const item = Array.isArray(items) ? (items[0] as Record<string, unknown> | undefined) : undefined;
        if (!item) { console.log('[apify] No items returned'); return null; }

        console.log('[apify] Got item keys:', Object.keys(item).slice(0, 20).join(', '));

        const missing: string[] = [];
        const fxRates = await getFxRates();
        const fxUsdToAud = fxRates.AUD || FALLBACK_RATES.AUD;

        // Title
        const title: string | null =
          (item.name as string) ||
          (item.title as string) ||
          (item.productTitle as string) ||
          null;
        if (!title) missing.push('title');

        // Images (hi-res primary + gallery)
        const rawImages: unknown[] =
          (item.images as unknown[]) ||
          (item.imageUrls as unknown[]) ||
          (item.productImages as unknown[]) ||
          (item.gallery as unknown[]) ||
          [];
        const images: string[] = rawImages
          .map(cleanImageUrl)
          .filter((u): u is string => typeof u === 'string')
          .slice(0, 10);
        const hiResImage = images[0] ?? cleanImageUrl(item.image) ?? cleanImageUrl(item.imageUrl) ?? null;
        if (!hiResImage) missing.push('image');

        // Price + currency conversion
        const sourceCurrency = detectCurrency(item);
        const rawPrice = parsePriceNum(
          item.price ?? item.salePrice ?? item.discountPrice ?? item.originalPrice
        );
        const priceUsd = rawPrice != null
          ? (sourceCurrency === 'USD' ? rawPrice : rawPrice / (fxRates[sourceCurrency] || 1))
          : null;
        const priceAud = priceUsd != null ? parseFloat((priceUsd * fxUsdToAud).toFixed(2)) : null;
        if (rawPrice == null) missing.push('price');

        // Rating + reviews
        const ratingNum = parsePriceNum(item.starRating ?? item.rating ?? item.averageStarRate);
        const rating = ratingNum != null && ratingNum > 0 ? ratingNum : null;
        const reviewCount = parsePriceNum(item.reviewCount ?? item.totalEvalNum ?? item.totalReviews);
        if (!rating) missing.push('rating');

        // Orders
        const ordersNum = parsePriceNum(item.tradeCount ?? item.orders ?? item.soldCount);
        const orders = ordersNum != null && ordersNum > 0 ? Math.round(ordersNum) : null;
        if (!orders) missing.push('orders');

        // Description
        const description =
          (item.description as string) ||
          (item.productDescription as string) ||
          (item.descriptionText as string) ||
          null;
        if (!description) missing.push('description');

        // Seller info
        const sellerName =
          (item.storeName as string) ||
          (item.sellerName as string) ||
          (item.shopName as string) ||
          null;
        const sellerRating = parsePriceNum(item.storeRating ?? item.sellerRating ?? item.storePositiveRating);
        const sellerFollowers = parsePriceNum(item.storeFollowers ?? item.sellerFollowers);
        if (!sellerName) missing.push('seller_name');

        // Shipping
        let shippingCostAud: number | null = null;
        let shipsToAu = true;
        const shippingList: unknown[] = Array.isArray(item.shippingOptions)
          ? (item.shippingOptions as unknown[])
          : Array.isArray(item.shipping)
            ? (item.shipping as unknown[])
            : [];
        if (shippingList.length > 0) {
          let anyAu = false;
          let cheapest: number | null = null;
          for (const entry of shippingList) {
            if (!entry || typeof entry !== 'object') continue;
            const e = entry as Record<string, unknown>;
            const country = String(e.country || e.toCountry || e.shipTo || '').toUpperCase();
            if (country && country !== 'AU' && country !== 'AUSTRALIA') continue;
            anyAu = true;
            const cost = parsePriceNum(e.cost ?? e.price ?? e.amount ?? e.fee);
            if (cost == null || cost <= 0) continue;
            const currency = String(e.currency || e.currencyCode || 'USD').toUpperCase();
            const usdAmount = currency === 'USD' ? cost : cost / (fxRates[currency] || 1);
            const audAmount = usdAmount * fxUsdToAud;
            if (cheapest == null || audAmount < cheapest) cheapest = audAmount;
          }
          shipsToAu = anyAu;
          shippingCostAud = cheapest != null ? parseFloat(cheapest.toFixed(2)) : null;
        }
        if (shippingCostAud == null) missing.push('shipping_cost');

        // Variants
        const variants = (item.skuProps ?? item.variants ?? item.skus) ?? null;
        const variantCount = Array.isArray(variants)
          ? variants.length
          : Array.isArray(item.skus) ? (item.skus as unknown[]).length
          : null;

        if (missing.length > 0) {
          console.warn('[apify] Missing fields for', productUrl.slice(-40), ':', missing.join(', '));
        }

        return {
          title,
          images,
          hiResImage,
          price: priceUsd != null ? parseFloat(priceUsd.toFixed(2)) : null,
          priceUsd: priceUsd != null ? parseFloat(priceUsd.toFixed(2)) : null,
          priceAud,
          sourceCurrency,
          rating,
          reviewCount: reviewCount != null ? Math.round(reviewCount) : null,
          orders,
          description,
          sellerName,
          sellerRating,
          sellerFollowers: sellerFollowers != null ? Math.round(sellerFollowers) : null,
          shippingCostAud,
          shipsToAu,
          variants,
          variantCount,
          missingFields: missing,
        };
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error('[apify] Run', status);
        return null;
      }
    }

    console.error('[apify] Timed out waiting for run');
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[apify] Error:', msg);
    return null;
  }
}
