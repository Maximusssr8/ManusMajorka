/**
 * AliExpress DataHub ingest agent.
 *
 * Pulls ~500 high-quality trending/high-volume/high-revenue items from the
 * RapidAPI AliExpress DataHub every 6 hours and feeds them through the
 * existing aeProductPipeline — quality filter, Haiku enrichment, scoring,
 * dedupe, insert/update on `winning_products`.
 *
 * Unlike the Apify-based scrape (`scrape-aliexpress-trending`), this is
 * deterministic: we control the keyword universe, request volume, and
 * filtering in-process.
 */

import { searchAliExpressProducts } from './aliexpressDataHub';
import { runPipeline, type PipelineResult } from './aeProductPipeline';
import type { AEBulkProduct } from './apifyAliExpressBulk';

// Curated high-intent keyword universe. Tuned for AU dropshipping — mixes
// evergreen winners (posture, skincare, pet) with velocity niches (TikTok
// viral, home organisation). Keep this list long so 6h ingest rotations
// don't collapse to the same rows every run.
const KEYWORDS: { q: string; niche: string; sort: string }[] = [
  // Fitness / wellness
  { q: 'posture corrector back', niche: 'fitness', sort: 'orders' },
  { q: 'resistance bands set', niche: 'fitness', sort: 'orders' },
  { q: 'massage gun percussion', niche: 'wellness', sort: 'orders' },
  { q: 'foam roller recovery', niche: 'fitness', sort: 'default' },
  // Beauty
  { q: 'vitamin c serum skincare', niche: 'beauty', sort: 'orders' },
  { q: 'led face mask therapy', niche: 'beauty', sort: 'orders' },
  { q: 'hair straightener brush', niche: 'beauty', sort: 'orders' },
  { q: 'eyelash curler heated', niche: 'beauty', sort: 'default' },
  // Home
  { q: 'kitchen organiser drawer', niche: 'home', sort: 'orders' },
  { q: 'led strip lights room', niche: 'home', sort: 'orders' },
  { q: 'robot vacuum cleaner mini', niche: 'home', sort: 'default' },
  { q: 'smart plug wifi', niche: 'home', sort: 'default' },
  // Pets
  { q: 'cat laser toy automatic', niche: 'pets', sort: 'orders' },
  { q: 'dog lick mat feeder', niche: 'pets', sort: 'orders' },
  { q: 'pet hair remover brush', niche: 'pets', sort: 'default' },
  // Tech / viral
  { q: 'phone holder car magnetic', niche: 'tech', sort: 'orders' },
  { q: 'wireless earbuds noise', niche: 'tech', sort: 'orders' },
  { q: 'mini projector portable', niche: 'tech', sort: 'default' },
  { q: 'ring light phone stand', niche: 'tech', sort: 'default' },
  // Kitchen
  { q: 'silicone kitchen utensils', niche: 'kitchen', sort: 'orders' },
  { q: 'electric milk frother', niche: 'kitchen', sort: 'default' },
  { q: 'vegetable chopper slicer', niche: 'kitchen', sort: 'orders' },
  // Fashion / jewellery
  { q: 'stainless steel jewellery', niche: 'fashion', sort: 'default' },
  { q: 'shapewear bodysuit seamless', niche: 'fashion', sort: 'orders' },
  // Outdoor
  { q: 'portable camping stove', niche: 'outdoor', sort: 'default' },
  { q: 'rechargeable headlamp led', niche: 'outdoor', sort: 'default' },
];

// Each search returns up to ~50 items. Use ALL keywords every run to
// maximise coverage: 25 × ~50 = ~1,250 candidate items per 6h window.
const KEYWORDS_PER_RUN = 25;

function hashWindow(): number[] {
  // Rotate by 4 keywords every 6 hours, so the full list is covered every
  // ~1.5 days and the newest items in every niche surface without hammering
  // the same queries back-to-back.
  const sixHourSlot = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const offset = (sixHourSlot * 4) % KEYWORDS.length;
  const window: number[] = [];
  for (let i = 0; i < KEYWORDS_PER_RUN; i += 1) {
    window.push((offset + i) % KEYWORDS.length);
  }
  return window;
}

interface DataHubItem {
  id: string;
  name: string;
  image_url: string;
  price_usd: number;
  price_aud: number;
  orders_count: number;
  rating: number;
  reviews_count: number;
  aliexpress_url: string;
  supplier_name: string;
  shop_url?: string;
  discount_pct?: number;
}

function mapToBulk(item: DataHubItem, niche: string): AEBulkProduct | null {
  if (!item.id || !item.name || !item.image_url) return null;
  const priceUsd = Number.isFinite(item.price_usd) ? item.price_usd : 0;
  if (priceUsd <= 0) return null;
  return {
    title: item.name,
    price_usd: priceUsd,
    orders_count: Number.isFinite(item.orders_count) ? item.orders_count : 0,
    rating: Number.isFinite(item.rating) ? item.rating : 0,
    review_count: Number.isFinite(item.reviews_count) ? item.reviews_count : 0,
    image_url: item.image_url,
    product_url: item.aliexpress_url,
    aliexpress_product_id: item.id,
    seller_name: item.supplier_name || 'AliExpress',
    free_shipping: false,
    aliexpress_choice: false,
    ships_from: 'CN',
    category: niche,
    source_url: `datahub:${niche}`,
    scraped_at: new Date().toISOString(),
  };
}

export interface IngestResult extends PipelineResult {
  keywords_hit: number;
  candidates_fetched: number;
  unique_candidates: number;
}

/**
 * Run one ingest pass. Returns a summary suitable for pipeline logs.
 * Keeps concurrency low (5 keywords in flight) to stay well under the
 * RapidAPI rate ceiling on the AliExpress DataHub plan.
 */
export async function runDataHubIngest(
  targetItems = 1000,
): Promise<IngestResult> {
  const windowIdx = hashWindow();
  const keywords = windowIdx.map((i) => KEYWORDS[i]);

  const CONCURRENCY = 5;
  const allCandidates: { product: AEBulkProduct; niche: string }[] = [];

  for (let i = 0; i < keywords.length; i += CONCURRENCY) {
    const batch = keywords.slice(i, i + CONCURRENCY);
    // eslint-disable-next-line no-await-in-loop
    const batches = await Promise.all(
      batch.map(async (kw) => {
        try {
          const items = await searchAliExpressProducts(kw.q, {
            limit: 50,
            sort: kw.sort,
            shipTo: 'AU',
            currency: 'AUD',
          });
          return (items as DataHubItem[])
            .map((it) => mapToBulk(it, kw.niche))
            .filter((p): p is AEBulkProduct => p !== null)
            .map((product) => ({ product, niche: kw.niche }));
        } catch (err) {
          console.error('[datahub-ingest] keyword failed', kw.q, err);
          return [];
        }
      }),
    );
    for (const group of batches) allCandidates.push(...group);
    if (i + CONCURRENCY < keywords.length) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Dedupe within this run by aliexpress_product_id, keeping the highest
  // orders_count variant (tie-breaks on better rating).
  const best = new Map<string, AEBulkProduct>();
  for (const { product } of allCandidates) {
    const existing = best.get(product.aliexpress_product_id);
    if (
      !existing ||
      product.orders_count > existing.orders_count ||
      (product.orders_count === existing.orders_count && product.rating > existing.rating)
    ) {
      best.set(product.aliexpress_product_id, product);
    }
  }

  // Sort by orders descending (highest-volume first) and cap at targetItems.
  const ranked = Array.from(best.values())
    .sort((a, b) => b.orders_count - a.orders_count)
    .slice(0, targetItems);

  const pipelineResult = await runPipeline(ranked, 'datahub_trending_6h');

  return {
    ...pipelineResult,
    keywords_hit: keywords.length,
    candidates_fetched: allCandidates.length,
    unique_candidates: best.size,
  };
}
