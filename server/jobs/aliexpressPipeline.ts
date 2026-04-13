/**
 * AliExpress DataHub Bulk Pipeline
 * Pulls 1,000+ products/day across 20 categories with dual-cron scheduling.
 * Each run processes 10 categories (day-of-week rotation); full coverage every 24h.
 */

import { searchAliExpressProducts } from '../lib/aliexpressDataHub';
import { runPipeline } from '../lib/aeProductPipeline';
import { getSupabaseAdmin } from '../_core/supabase';
import type { AEBulkProduct } from '../lib/apifyAliExpressBulk';
import type { PipelineResult } from '../lib/aeProductPipeline';

// ── 20 category keyword groups ─────────────────────────────────────────────

const CATEGORY_KEYWORDS: ReadonlyArray<{ name: string; keywords: string }> = [
  { name: 'Home & Garden', keywords: 'home garden decor organisation storage' },
  { name: 'Consumer Electronics', keywords: 'wireless gadgets electronics accessories' },
  { name: 'Phone Accessories', keywords: 'phone case charger accessories holder' },
  { name: 'Beauty & Health', keywords: 'beauty health skincare face serum' },
  { name: 'Sports & Outdoors', keywords: 'sports outdoor fitness running gear' },
  { name: 'Toys & Games', keywords: 'toys games kids educational puzzle' },
  { name: 'Pet Supplies', keywords: 'pet supplies dog cat accessories toys' },
  { name: 'Kitchen & Dining', keywords: 'kitchen gadgets cooking dining utensils' },
  { name: 'Car Accessories', keywords: 'car accessories phone mount organiser' },
  { name: 'Fashion Accessories', keywords: 'fashion accessories bags scarves hats' },
  { name: 'Office Products', keywords: 'office supplies desk organiser stationery' },
  { name: 'Baby Products', keywords: 'baby products toddler safety feeding' },
  { name: 'Tools & Hardware', keywords: 'tools hardware drill bits multitool' },
  { name: 'Outdoor & Camping', keywords: 'outdoor camping hiking tent gear' },
  { name: 'Fitness Equipment', keywords: 'fitness equipment resistance bands weights' },
  { name: 'Hair Care', keywords: 'hair care styling tools dryer brush' },
  { name: 'Skincare', keywords: 'skincare moisturiser serum mask cleanser' },
  { name: 'Watches', keywords: 'watches smart watch digital wristwatch' },
  { name: 'Jewelry', keywords: 'jewelry rings necklace earrings bracelet' },
  { name: 'Cleaning Supplies', keywords: 'cleaning supplies vacuum mop organiser' },
];

// ── Types ──────────────────────────────────────────────────────────────────

export interface PipelineRunResult {
  categories_hit: number;
  raw_collected: number;
  passed_filter: number;
  inserted: number;
  updated: number;
  errors: number;
  duration_ms: number;
  category_results: Array<{ name: string; raw: number; status: 'ok' | 'error'; error?: string }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Return ALL 20 categories every run. With 4 runs/day (every 6h),
 * each category is hit 4 times for maximum coverage.
 */
function getCategoriesForThisRun(): ReadonlyArray<{ name: string; keywords: string }> {
  return CATEGORY_KEYWORDS;
}

/**
 * Map a DataHub search result to the AEBulkProduct shape expected by runPipeline.
 */
function mapToAEBulkProduct(
  item: {
    id: string;
    name: string;
    image_url: string;
    price_usd: number;
    orders_count: number;
    rating: number;
    reviews_count: number;
    aliexpress_url: string;
    supplier_name: string;
  },
  categoryName: string,
): AEBulkProduct {
  return {
    title: item.name,
    price_usd: item.price_usd,
    orders_count: item.orders_count,
    rating: item.rating,
    review_count: item.reviews_count,
    image_url: item.image_url,
    product_url: item.aliexpress_url,
    aliexpress_product_id: item.id,
    seller_name: item.supplier_name,
    free_shipping: false,
    aliexpress_choice: false,
    ships_from: 'CN',
    category: categoryName,
    source_url: '',
    scraped_at: new Date().toISOString(),
  };
}

// ── Pipeline logging ───────────────────────────────────────────────────────

async function logPipelineRun(
  status: 'success' | 'failed',
  stats: PipelineRunResult,
  startedAt: string,
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('pipeline_logs').insert({
      pipeline_type: 'bulk_aliexpress',
      source: 'datahub_20cat',
      status,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      duration_seconds: Math.round(stats.duration_ms / 1000),
      raw_collected: stats.raw_collected,
      passed_filter: stats.passed_filter,
      inserted: stats.inserted,
      updated: stats.updated,
      failed: stats.errors,
    });
  } catch {
    // Logging failure should never crash the pipeline
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────

const MAX_CONCURRENT = 3;
const BATCH_DELAY_MS = 2000;

export async function runBulkAliExpressPipeline(): Promise<PipelineRunResult> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const categories = getCategoriesForThisRun();
  const result: PipelineRunResult = {
    categories_hit: 0,
    raw_collected: 0,
    passed_filter: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
    duration_ms: 0,
    category_results: [],
  };

  console.info(`[bulk-ae-pipeline] Starting run with ${categories.length} categories`);

  // Process in batches of MAX_CONCURRENT
  for (let i = 0; i < categories.length; i += MAX_CONCURRENT) {
    const batch = categories.slice(i, i + MAX_CONCURRENT);

    const batchResults = await Promise.allSettled(
      batch.map(async (cat) => {
        try {
          const items = await searchAliExpressProducts(cat.keywords, {
            limit: 100,
            sort: 'orders',
            shipTo: 'AU',
          });

          const mapped: AEBulkProduct[] = items.map((item: any) =>
            mapToAEBulkProduct(item, cat.name),
          );

          const pipelineResult: PipelineResult = await runPipeline(mapped, `datahub_${cat.name}`);

          return {
            name: cat.name,
            raw: items.length,
            status: 'ok' as const,
            pipelineResult,
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.info(`[bulk-ae-pipeline] Category "${cat.name}" failed: ${message}`);
          return {
            name: cat.name,
            raw: 0,
            status: 'error' as const,
            error: message,
            pipelineResult: null,
          };
        }
      }),
    );

    for (const settled of batchResults) {
      if (settled.status === 'fulfilled') {
        const r = settled.value;
        result.categories_hit++;
        result.raw_collected += r.raw;
        result.category_results.push({
          name: r.name,
          raw: r.raw,
          status: r.status,
          error: r.status === 'error' ? r.error : undefined,
        });
        if (r.pipelineResult) {
          result.passed_filter += r.pipelineResult.passed_filter;
          result.inserted += r.pipelineResult.added;
          result.updated += r.pipelineResult.updated;
          result.errors += r.pipelineResult.errors.length;
        }
      } else {
        result.errors++;
        result.category_results.push({
          name: 'unknown',
          raw: 0,
          status: 'error',
          error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason),
        });
      }
    }

    // Delay between batches to respect RapidAPI rate limits
    if (i + MAX_CONCURRENT < categories.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  result.duration_ms = Date.now() - startMs;

  const status = result.errors > result.categories_hit ? 'failed' : 'success';
  await logPipelineRun(status, result, startedAt);

  console.info(
    `[bulk-ae-pipeline] Done: ${result.categories_hit} cats, ` +
    `${result.raw_collected} raw, ${result.passed_filter} filtered, ` +
    `${result.inserted} new, ${result.updated} updated, ` +
    `${result.errors} errors, ${result.duration_ms}ms`,
  );

  return result;
}
