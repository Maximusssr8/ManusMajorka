import { Router } from 'express';
import type { Request, Response } from 'express';
import { callClaude } from '../lib/claudeWrap';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../_core/supabase';
import { cronLimiter } from '../lib/ratelimit';
// Fire-and-forget launchers
import { launchAliExpressScrape } from '../lib/apifyAliExpressBulk';
import { launchAmazonScrape, AMAZON_AU_CATEGORIES } from '../lib/apifyAmazon';
import { launchTikTokScrape } from '../lib/apifyTikTokShop';
// Pipeline modules
import { harvestCompletedRuns } from '../pipeline/harvest';
import { runProcessor } from '../pipeline/processor';
import { runCleanup } from '../pipeline/cleanup';
import { runScoreRefresh } from '../pipeline/refresh-scores';
// New scrapers
import { launchTikTokCCScrape } from '../scrapers/tiktok-creative-center';
import { fetchGoogleTrends, saveTrends } from '../scrapers/google-trends';
import { launchAEDetailScrape } from '../scrapers/aliexpress-product-detail';
import { runTrendFirstPipeline } from '../pipeline/trendFirst';
import { launchAEBestsellerScrapes } from '../scrapers/ae-bestseller-urls';

const router = Router();

function getSupabaseAdminLegacy() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let lastCronRunTime: string | null = null;
export function getLastCronRunTime() { return lastCronRunTime; }

function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.authorization || '';
  const secret = process.env.CRON_SECRET || '';
  let ok = false;
  if (!secret) {
    const userAgent = req.headers['user-agent'] || '';
    const isVercelCron = userAgent.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
    const isLocal = (req.headers.host || '').includes('localhost');
    ok = isVercelCron || isLocal;
  } else {
    ok = auth === `Bearer ${secret}`;
  }
  if (ok) lastCronRunTime = new Date().toISOString();
  return ok;
}

// Pipeline log helper
async function logPipelineStart(pipelineType: string, source?: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('pipeline_logs').insert({
      pipeline_type: pipelineType,
      source: source || pipelineType,
      status: 'running',
      started_at: new Date().toISOString(),
    }).select('id').single();
    return data?.id || null;
  } catch {
    return null;
  }
}

async function logPipelineEnd(logId: string | null, stats: Record<string, any>, status: 'success' | 'failed', errorMsg?: string): Promise<void> {
  if (!logId) return;
  try {
    const supabase = getSupabaseAdmin();
    const startedAt = stats.startedAt || new Date().toISOString();
    const durationSeconds = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
    await supabase.from('pipeline_logs').update({
      status,
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      raw_collected: stats.raw_collected || 0,
      passed_filter: stats.passed_filter || 0,
      inserted: stats.inserted || 0,
      updated: stats.updated || 0,
      failed: stats.failed || 0,
      skipped: stats.skipped || 0,
      error_message: errorMsg || null,
    }).eq('id', logId);
  } catch { /* fail silently */ }
}

// ── Legacy helpers ──────────────────────────────────────────────────────────

function generateFallbackTrend(monthlyRevenue: number): number[] {
  const weekly = monthlyRevenue / 4;
  return Array.from({ length: 7 }, () => Math.round(weekly * (0.85 + Math.random() * 0.3)));
}

function generateCreatorHandles(niche: string): string[] {
  const niches: Record<string, string[][]> = {
    'Tech Accessories': [['@techbydan_au','@gadgetking_syd','@austech_drops'],['@sydneytech_finds','@ozgadgets','@techsavvy_melb']],
    'Beauty & Skincare': [['@beautybyem_syd','@glowgirl_au','@skintok_australia'],['@sydneyglow','@beautyfinds_au','@makeupmelb']],
    'Health & Wellness': [['@fitwithjess_au','@wellness_oz','@healthyau_life'],['@ozwellness','@fitnessjordan_au','@healthstuff_au']],
    'Home Decor': [['@homedecor_au','@interior_syd','@ozhomefinds'],['@livingroom_au','@decorgirl_melb','@aussie_interiors']],
    'Activewear & Gym': [['@gymgirl_au','@fitfam_syd','@aussie_gains'],['@activewear_oz','@gymstuff_au','@fitnesssyd']],
    'Pets & Animals': [['@dogmum_au','@paws_syd','@aussie_pets'],['@petfinds_au','@catlady_melb','@petlovers_oz']],
    'Fashion & Apparel': [['@fashion_syd','@oztrendy','@stylemelb_au'],['@ootd_australia','@fashionfind_au','@styletok_oz']],
    'Outdoor & Camping': [['@camping_au','@outdooroz','@hikingaustralia'],['@ausadventures','@camplife_syd','@outdoorfinds_au']],
    'Baby & Kids': [['@mumlife_au','@babytok_syd','@ozmums'],['@parentingau','@kidsfinds_oz','@babygear_au']],
    'Jewellery & Accessories': [['@jewels_syd','@accessories_au','@styleacc_oz'],['@bling_australia','@jewelfinds_melb','@accgirl_au']],
  };
  const options = niches[niche] || [['@ausdrops','@shopfinds_au','@trendingau']];
  return options[Math.floor(Math.random() * options.length)];
}

async function fetchPexelsImage(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.photos?.[0]?.src?.medium ?? null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY HANDLERS (kept as-is)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/refresh-trends', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const sb = getSupabaseAdminLegacy();
    const { data: latest } = await sb
      .from('winning_products')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (latest?.updated_at) {
      const ageHours = (Date.now() - new Date(latest.updated_at).getTime()) / 3_600_000;
      if (ageHours < 20) {
        return res.json({ skipped: true, ageHours: Math.round(ageHours), reason: 'data is fresh' });
      }
    }
  } catch { /* proceed */ }

  const tavily_key = process.env.TAVILY_API_KEY;
  if (!tavily_key) {
    return res.status(503).json({ error: 'TAVILY_API_KEY not configured' });
  }

  const queries = [
    'trending dropshipping products Australia 2026',
    'best selling AliExpress products this week Australia',
    'viral products TikTok Australia March 2026',
    'winning shopify products 2026 lightweight fast shipping',
    'fast shipping products Australia dropship accessories beauty home',
  ];

  try {
    const results = await Promise.allSettled(
      queries.map(q =>
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tavily_key}` },
          body: JSON.stringify({ query: q, max_results: 8, search_depth: 'basic' }),
        }).then(r => r.json())
      )
    );

    const allContent = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value?.results || [])
      .flat()
      .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content?.slice(0, 200)}`)
      .join('\n---\n');

    if (!allContent) {
      return res.status(200).json({ ok: true, count: 0, message: 'No Tavily results' });
    }

    const msg = await callClaude({
      feature: 'cron_product_intel',
      maxTokens: 2500,
      system: `You are an Australian ecommerce data analyst specialising in dropshipping intelligence. Generate realistic, data-driven product intelligence for AU dropshippers. Always return valid JSON only — no markdown, no backticks, no explanation.`,
      messages: [{
        role: 'user',
        content: `Analyse this search data and generate 25 trending dropshipping products for the Australian market in 2026.

Each product must be:
- Price range $15-$150 AUD
- Shippable from China to AU in 7-14 days
- High perceived value relative to cost
- NOT: large appliances, food, alcohol, medicine, branded/trademarked goods, items needing AU electrical certification

Search data context:
${allContent.slice(0, 8000)}

Return ONLY a JSON array of exactly 25 products. No markdown. Each object:
{
  "name": "Specific product name (not generic)",
  "niche": "Tech Accessories | Beauty & Skincare | Health & Wellness | Home Decor | Activewear & Gym | Pets & Animals | Fashion & Apparel | Outdoor & Camping | Baby & Kids | Jewellery & Accessories",
  "estimated_retail_aud": number (15-150),
  "estimated_margin_pct": number (35-75),
  "trend_score": number (60-99),
  "dropship_viability_score": number (6-10),
  "trend_reason": "One specific sentence why this is trending in AU right now",
  "est_monthly_revenue_aud": number (5000-150000, realistic for top AU sellers),
  "revenue_trend": [number, number, number, number, number, number, number] (7 weekly values, realistic ±15% fluctuation around est_monthly_revenue_aud/4),
  "items_sold_monthly": number (50-3000, proportional to revenue/price),
  "growth_rate_pct": number (-15 to 150, most 5-60),
  "creator_handles": ["@handle1_au", "@handle2_au", "@handle3_au"] (3 realistic AU TikTok handles matching niche),
  "avg_unit_price_aud": number (same as or near estimated_retail_aud),
  "saturation_score": number (1-10, 1=very saturated, 10=blue ocean opportunity),
  "winning_score": number (60-99, overall opportunity score),
  "ad_count_est": number (10-500, how many ads running on Meta/TikTok),
  "image_search_term": "product photo search term for stock image"
}`
      }]
    });

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
    let products: any[] = [];
    try {
      const arrayMatch = rawText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        products = JSON.parse(arrayMatch[0]);
      } else {
        const objMatches = rawText.matchAll(/\{[^{}]*"name"[^{}]*\}/g);
        for (const m of objMatches) {
          try { products.push(JSON.parse(m[0])); } catch { /* skip */ }
        }
        if (products.length === 0) throw new Error('No JSON found');
      }
    } catch {
      return res.status(500).json({ error: 'Claude parse failed', raw: rawText.slice(0, 200) });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(500).json({ error: 'No valid products returned' });
    }

    const supabase = getSupabaseAdminLegacy();
    const imageUrls = await Promise.allSettled(
      products.map(p => fetchPexelsImage(p.image_search_term || p.name))
    );

    const rows = products.map((p, i) => ({
      name: p.name,
      niche: p.niche,
      estimated_retail_aud: p.estimated_retail_aud,
      estimated_margin_pct: p.estimated_margin_pct,
      trend_score: p.trend_score,
      dropship_viability_score: p.dropship_viability_score,
      trend_reason: p.trend_reason,
      est_monthly_revenue_aud: p.est_monthly_revenue_aud || Math.round(p.estimated_retail_aud * (p.items_sold_monthly || 200) * 0.5),
      revenue_trend: Array.isArray(p.revenue_trend) && p.revenue_trend.length === 7 ? p.revenue_trend : generateFallbackTrend(p.est_monthly_revenue_aud || 20000),
      items_sold_monthly: p.items_sold_monthly || Math.round((p.est_monthly_revenue_aud || 20000) / (p.estimated_retail_aud || 49)),
      growth_rate_pct: p.growth_rate_pct ?? Math.floor(Math.random() * 60 + 5),
      creator_handles: Array.isArray(p.creator_handles) ? p.creator_handles : generateCreatorHandles(p.niche),
      avg_unit_price_aud: p.avg_unit_price_aud || p.estimated_retail_aud,
      saturation_score: p.saturation_score || Math.floor(Math.random() * 5 + 4),
      winning_score: p.winning_score || Math.floor(p.trend_score * 0.8 + p.dropship_viability_score * 2),
      ad_count_est: p.ad_count_est || Math.floor(Math.random() * 200 + 20),
      image_url: (imageUrls[i].status === 'fulfilled' && imageUrls[i].value) ? imageUrls[i].value : null,
      refreshed_at: new Date().toISOString(),
      source: 'cron',
    }));

    let { error: upsertError } = await supabase.from('trend_signals').upsert(rows, { onConflict: 'name' });
    if (upsertError && (upsertError.message?.includes('column') || upsertError.message?.includes('schema'))) {
      const baseRows = rows.map(({ est_monthly_revenue_aud, revenue_trend, items_sold_monthly, growth_rate_pct, creator_handles, avg_unit_price_aud, saturation_score, winning_score, ad_count_est, ...base }) => base);
      const { error: fallbackError } = await supabase.from('trend_signals').upsert(baseRows, { onConflict: 'name' });
      upsertError = fallbackError;
    }

    if (upsertError) {
      return res.json({ ok: true, count: products.length, saved: false, error: upsertError.message });
    }
    return res.json({ ok: true, count: products.length, saved: true, refreshed_at: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/refresh-shops', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const supabase = getSupabaseAdminLegacy();
    await supabase.from('shop_intelligence').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    res.json({ success: true, message: 'Shop data cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/refresh-products', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sb = getSupabaseAdminLegacy();
    const { data: latest } = await sb
      .from('winning_products')
      .select('last_refreshed')
      .not('last_refreshed', 'is', null)
      .order('last_refreshed', { ascending: false })
      .limit(1)
      .single();
    if (latest?.last_refreshed) {
      const ageHours = (Date.now() - new Date(latest.last_refreshed).getTime()) / 3_600_000;
      if (ageHours < 20) {
        return res.json({ skipped: true, ageHours: Math.round(ageHours), reason: 'products are fresh' });
      }
    }
  } catch { /* proceed */ }

  res.json({ status: 'started', message: 'Product refresh pipeline running' });
  setImmediate(async () => {
    try {
      const { runProductPipeline } = await import('../lib/productPipeline');
      await runProductPipeline();
    } catch (err: any) {
      console.error('[cron] refresh-products failed:', err.message);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FIRE-AND-FORGET SCRAPER LAUNCHERS (< 5s each)
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_SOURCES = [
  { url: 'https://www.aliexpress.com/category/200000343/pet-products.html?SortType=total_tranpro_desc', name: 'Pet Products' },
  { url: 'https://www.aliexpress.com/category/200003655/beauty-health.html?SortType=total_tranpro_desc', name: 'Beauty & Health' },
  { url: 'https://www.aliexpress.com/category/200000783/home-improvement.html?SortType=total_tranpro_desc', name: 'Home & Garden' },
  { url: 'https://www.aliexpress.com/category/200000506/sports-entertainment.html?SortType=total_tranpro_desc', name: 'Sports & Fitness' },
  { url: 'https://www.aliexpress.com/category/200000340/consumer-electronics.html?SortType=total_tranpro_desc', name: 'Electronics' },
  { url: 'https://www.aliexpress.com/category/200000345/mother-kids.html?SortType=total_tranpro_desc', name: 'Baby & Kids' },
  { url: 'https://www.aliexpress.com/category/200000344/apparel-accessories.html?SortType=total_tranpro_desc', name: 'Fashion' },
];

const TRENDING_SOURCES = [
  { url: 'https://www.aliexpress.com/gcp/300000604/best-sellers.html', name: 'AE Best Sellers' },
  { url: 'https://www.aliexpress.com/p/aliexpress-choice/index.html', name: 'AliExpress Choice' },
];

router.get('/scrape-aliexpress-categories', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('scrape', 'aliexpress_categories');
  const startedAt = new Date().toISOString();

  try {
    const dayOfWeek = new Date().getDay();
    const toScrape = CATEGORY_SOURCES.slice(dayOfWeek % 3, (dayOfWeek % 3) + 2);
    const runIds: string[] = [];

    for (const source of toScrape) {
      const runId = await launchAliExpressScrape(source.url, source.name);
      if (runId) runIds.push(runId);
    }

    await logPipelineEnd(logId, { startedAt, raw_collected: runIds.length }, 'success');
    res.json({ success: true, launched: runIds.length, runIds, message: 'Fire-and-forget: results harvested by /harvest-apify-runs' });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/scrape-aliexpress-trending', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('scrape', 'aliexpress_trending');
  const startedAt = new Date().toISOString();

  try {
    const hour = new Date().getHours();
    const source = TRENDING_SOURCES[hour % TRENDING_SOURCES.length];
    const runId = await launchAliExpressScrape(source.url, source.name);

    await logPipelineEnd(logId, { startedAt, raw_collected: runId ? 1 : 0 }, runId ? 'success' : 'failed');
    res.json({ success: !!runId, source: source.name, runId, message: 'Fire-and-forget' });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/scrape-amazon', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('scrape', 'amazon_au');
  const startedAt = new Date().toISOString();

  try {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const startIdx = (dayOfYear * 2) % AMAZON_AU_CATEGORIES.length;
    const toScrape = AMAZON_AU_CATEGORIES.slice(startIdx, startIdx + 2);
    const runIds: string[] = [];

    for (const cat of toScrape) {
      const runId = await launchAmazonScrape(cat.url, cat.name, 50);
      if (runId) runIds.push(runId);
    }

    await logPipelineEnd(logId, { startedAt, raw_collected: runIds.length }, 'success');
    res.json({ success: true, launched: runIds.length, runIds, message: 'Fire-and-forget' });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/scrape-tiktok-shop', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('scrape', 'tiktok_shop');
  const startedAt = new Date().toISOString();

  try {
    const HASHTAGS = ['TikTokMadeMeBuyIt', 'TikTokShop', 'ProductReview', 'DropshippingAustralia', 'AUFinds', 'ViralProducts'];
    const dayOfWeek = new Date().getDay();
    const tags = HASHTAGS.slice((dayOfWeek * 2) % HASHTAGS.length, ((dayOfWeek * 2) % HASHTAGS.length) + 3);
    const runIds: string[] = [];

    for (const tag of tags) {
      const runId = await launchTikTokScrape(tag);
      if (runId) runIds.push(runId);
    }

    await logPipelineEnd(logId, { startedAt, raw_collected: runIds.length }, 'success');
    res.json({ success: true, launched: runIds.length, runIds, message: 'Fire-and-forget' });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// NEW PIPELINE CRON HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/harvest-apify-runs', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('harvest', 'apify_runs');
  const startedAt = new Date().toISOString();

  try {
    const result = await harvestCompletedRuns();
    await logPipelineEnd(logId, { startedAt, inserted: result.harvested, skipped: result.stillRunning, failed: result.failed }, 'success');
    res.json({ success: true, ...result });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/process-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('process', 'pipeline');
  const startedAt = new Date().toISOString();

  try {
    const result = await runProcessor();
    await logPipelineEnd(logId, {
      startedAt,
      raw_collected: result.processed,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
    }, 'success');
    res.json({ success: true, ...result });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/cleanup-database', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('cleanup', 'database');
  const startedAt = new Date().toISOString();

  try {
    const result = await runCleanup();
    await logPipelineEnd(logId, { startedAt, inserted: result.removed }, 'success');
    res.json({ success: true, ...result });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/refresh-scores', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('refresh', 'scores');
  const startedAt = new Date().toISOString();

  try {
    const result = await runScoreRefresh();
    await logPipelineEnd(logId, { startedAt, updated: result.updated }, 'success');
    res.json({ success: true, ...result });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/collect-tiktok-cc', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('scrape', 'tiktok_cc');
  const startedAt = new Date().toISOString();

  try {
    const runId = await launchTikTokCCScrape();
    await logPipelineEnd(logId, { startedAt, raw_collected: runId ? 1 : 0 }, runId ? 'success' : 'failed');
    res.json({ success: !!runId, runId, message: 'Fire-and-forget' });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

// /collect-cj removed — CJ pipeline purged. Use /api/cron/apify-pipeline.

router.get('/collect-trends', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('collect', 'google_trends');
  const startedAt = new Date().toISOString();

  try {
    const items = await fetchGoogleTrends();
    await saveTrends(items);
    await logPipelineEnd(logId, { startedAt, inserted: items.length }, 'success');
    res.json({ success: true, keywords: items.length });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: AliExpress Product Detail Verification
// ═══════════════════════════════════════════════════════════════════════════

router.get('/ae-detail-scrape', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('scrape', 'ae_product_detail');
  const startedAt = new Date().toISOString();

  try {
    const runId = await launchAEDetailScrape();
    await logPipelineEnd(logId, { startedAt, raw_collected: runId ? 1 : 0 }, runId ? 'success' : 'failed');
    res.json({ success: !!runId, runId, message: 'Fire-and-forget: AE detail scrape launched' });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

// /collect-cj-real removed — CJ pipeline purged. Use /api/cron/apify-pipeline.

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8: AUTOMATED QUALITY PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

const OVERSATURATED_KEYWORDS = [
  'phone case', 'phone mount', 'water bottle', 'posture corrector',
  'compression socks', 'cable organizer', 'cable organiser',
  'phone charger', 'eyebrow stamp', 'hair tie', 'basic sunglass',
];

/**
 * Quality gate for new products.
 * Returns {valid: true} or {valid: false, reason: "..."}.
 */
export function validateNewProduct(product: Record<string, any>): { valid: boolean; reason?: string } {
  if (!product.source_url) return { valid: false, reason: 'missing source_url' };
  const title = product.product_title || product.name || '';
  if (title.length <= 10) return { valid: false, reason: 'title too short (≤10 chars)' };
  if (!product.image_url) return { valid: false, reason: 'missing image_url' };
  const hasCost = (product.real_cost_aud && product.real_cost_aud > 0) || (product.cost_price_aud && product.cost_price_aud > 0);
  if (!hasCost) return { valid: false, reason: 'no cost data (real_cost_aud or cost_price_aud)' };
  const titleLower = title.toLowerCase();
  const isSlop = OVERSATURATED_KEYWORDS.some(kw => titleLower.includes(kw));
  if (isSlop) return { valid: false, reason: `oversaturated keyword: ${OVERSATURATED_KEYWORDS.find(kw => titleLower.includes(kw))}` };
  return { valid: true };
}

// GET /api/cron/check-dead-links
router.get('/check-dead-links', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('quality', 'check_dead_links');
  const startedAt = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();

    // Fetch 20 random products with link_status != 'dead' that have a source_url
    const { data: products, error: fetchErr } = await supabase
      .from('winning_products')
      .select('id, source_url, aliexpress_url, link_status')
      .neq('link_status', 'dead')
      .not('source_url', 'is', null)
      .limit(20);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!products || products.length === 0) {
      await logPipelineEnd(logId, { startedAt }, 'success');
      return res.json({ checked: 0, dead: 0, verified: 0 });
    }

    let dead = 0;
    let verified = 0;

    for (const p of products) {
      const url = p.source_url || p.aliexpress_url;
      if (!url) continue;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.status === 404 || response.status === 410) {
          await supabase.from('winning_products').update({ link_status: 'dead' }).eq('id', p.id);
          dead++;
        } else if (response.ok) {
          await supabase.from('winning_products').update({
            link_status: 'verified',
            link_verified_at: new Date().toISOString(),
          }).eq('id', p.id);
          verified++;
        }
      } catch {
        // Connection error = dead link
        await supabase.from('winning_products').update({ link_status: 'dead' }).eq('id', p.id);
        dead++;
      }
    }

    await logPipelineEnd(logId, { startedAt, raw_collected: products.length, updated: verified, failed: dead }, 'success');
    res.json({ checked: products.length, dead, verified });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/purge-dead-products
router.get('/purge-dead-products', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  const logId = await logPipelineStart('quality', 'purge_dead_products');
  const startedAt = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();
    let deleted = 0;

    // Delete dead links
    const { data: deadProducts } = await supabase
      .from('winning_products')
      .select('id')
      .eq('link_status', 'dead');
    if (deadProducts && deadProducts.length > 0) {
      const ids = deadProducts.map((p: any) => p.id);
      await supabase.from('winning_products').delete().in('id', ids);
      deleted += deadProducts.length;
    }

    // Delete low-score products
    const { data: lowScoreProducts } = await supabase
      .from('winning_products')
      .select('id')
      .lt('winning_score', 35);
    if (lowScoreProducts && lowScoreProducts.length > 0) {
      const ids = lowScoreProducts.map((p: any) => p.id);
      await supabase.from('winning_products').delete().in('id', ids);
      deleted += lowScoreProducts.length;
    }

    console.log(`[cron/purge] Deleted ${deleted} products (dead links + low scores)`);
    await logPipelineEnd(logId, { startedAt, inserted: deleted }, 'success');
    res.json({ deleted });
  } catch (err: any) {
    await logPipelineEnd(logId, { startedAt }, 'failed', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TREND-FIRST PIPELINE (replaces keyword-based scraping)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/cron/trend-pipeline — runs every 6h
router.post('/trend-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ ok: true, started: true });

  runTrendFirstPipeline('full').then(result => {
    console.info('[cron/trend-pipeline] Complete:', result);
  }).catch(e => {
    console.error('[cron/trend-pipeline] Error:', e instanceof Error ? e.message : e);
  });
});

// Also support GET for Vercel cron (Vercel crons send GET requests)
router.get('/trend-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ ok: true, started: true });

  runTrendFirstPipeline('full').then(result => {
    console.info('[cron/trend-pipeline] Complete:', result);
  }).catch(e => {
    console.error('[cron/trend-pipeline] Error:', e instanceof Error ? e.message : e);
  });
});

// /cj-refresh removed — CJ pipeline purged. Use /api/cron/apify-pipeline.

// POST /api/cron/ae-hot-products — every 6h via Vercel cron
// Fetches hot products from AliExpress Affiliate API → upserts into winning_products
router.post('/ae-hot-products', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    console.info('[cron/ae-hot-products] Starting hot products sync...');
    const sb = getSupabaseAdmin();

    const { getHotProducts } = await import('../lib/aliexpress-affiliate');
    const result = await getHotProducts({ pageSize: 50, pageNo: 1 });
    const products = result?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product || [];

    if (!products.length) {
      console.info('[cron/ae-hot-products] No products returned');
      res.json({ synced: 0 }); return;
    }

    const AUD_RATE = 1.55;
    const rejects = { no_image: 0, bad_image: 0, zero_price: 0, short_title: 0, zero_orders: 0 };
    const rows = products.map((p: Record<string, unknown>) => {
      const priceUsd = parseFloat(String(p.sale_price || '0').replace(/[^\d.]/g, ''));
      const priceAud = Math.round(priceUsd * AUD_RATE * 100) / 100;
      const costAud = Math.round(priceAud * 0.4 * 100) / 100;
      const orders = parseInt(String((p as Record<string, unknown>)['30day_orders_count'] || '0')) || 0;
      const pid = String(p.product_id || '');
      return {
        product_title: String(p.product_title || '').slice(0, 255),
        image_url: String(p.product_main_image_url || ''),
        price_aud: priceAud,
        real_price_aud: priceAud,
        cost_price_aud: costAud,
        supplier_cost_aud: costAud,
        profit_margin: priceAud > 0 ? Math.round((priceAud - costAud) / priceAud * 100) : 60,
        // Score derived from volume + margin. Velocity isn't available here
        // (this handler doesn't snapshot) — refresh-hotproducts overwrites
        // with the full velocity-weighted formula on the next 6h tick.
        winning_score: Math.min(95, Math.round(
          Math.min(40, Math.log10(Math.max(1, orders)) * 8) +
          Math.min(30, Math.max(0, (priceAud > 0 ? ((priceAud - costAud) / priceAud) * 100 : 40) - 30) * 1.0) +
          20,
        )),
        trend: orders > 5000 ? 'Exploding' : orders > 1000 ? 'Rising' : 'Steady',
        orders_count: orders,
        real_orders_count: orders,
        sold_count: orders,
        source_url: String(p.product_detail_url || ''),
        aliexpress_url: String(p.product_detail_url || ''),
        aliexpress_id: pid,
        data_source: 'aliexpress_affiliate',
        link_status: 'verified',
        link_verified_at: new Date().toISOString(),
        tiktok_signal: orders > 5000,
        tags: ['ae-hot', 'affiliate', p.hot_product_flag === 'true' ? 'hot' : null].filter(Boolean) as string[],
        is_active: true,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        last_seen_in_scrape_at: new Date().toISOString(),
      };
    }).filter((r: Record<string, unknown>) => {
      const title = String(r.product_title ?? '');
      const img = String(r.image_url ?? '');
      const price = (r.price_aud as number) ?? 0;
      const orders = (r.sold_count as number) ?? 0;
      if (!img) { rejects.no_image++; return false; }
      if (!img.startsWith('http')) { rejects.bad_image++; return false; }
      if (price <= 0) { rejects.zero_price++; return false; }
      if (title.length < 5) { rejects.short_title++; return false; }
      if (orders <= 0) { rejects.zero_orders++; return false; }
      return true;
    });

    if (rows.length > 0) {
      const { error } = await sb.from('winning_products')
        .upsert(rows, { onConflict: 'aliexpress_id', ignoreDuplicates: false });
      if (error) console.error('[cron/ae-hot-products] upsert error:', error.message);
    }

    const fetched = products.length;
    const totalRejected = Object.values(rejects).reduce((a, b) => a + b, 0);
    const rejectPct = fetched > 0 ? Math.round((totalRejected / fetched) * 100) : 0;
    console.info(
      `[ingest] fetched ${fetched}, filtered ${totalRejected} (${rejectPct}% — reasons: ${JSON.stringify(rejects)}), upserted ${rows.length}`,
    );
    res.json({ synced: rows.length, total_fetched: fetched, rejects, reject_pct: rejectPct });
  } catch (err: unknown) {
    console.error('[cron/ae-hot-products] Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/ae-hot-products', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }
  // Mirror POST handler for Vercel cron (uses GET)
  try {
    const sb = getSupabaseAdmin();
    void sb;
    const { getHotProducts } = await import('../lib/aliexpress-affiliate');
    const result = await getHotProducts({ pageSize: 50, pageNo: 1 });
    const products = result?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product || [];
    res.json({ ok: true, products_found: products.length });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── /api/cron/refresh-hotproducts — multi-market AliExpress Affiliate API refresh ──
// Loops 7 markets (AU/US/GB/CA/NZ/DE/SG), fetches up to 50 hot products per market,
// upserts into winning_products with real CDN images and real lastest_volume order counts.
async function runRefreshHotProducts(req: Request, res: Response) {
  if (!verifyCronSecret(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    console.info('[cron/refresh-hotproducts] Starting multi-market hot products refresh…');
    const sb = getSupabaseAdmin();
    const { fetchHotProducts, fetchHotProductsAllMarkets, SUPPORTED_MARKETS } = await import('../lib/aliexpressHotProducts');

    // Niche coverage — AliExpress first-level category IDs. Looping these
    // multiplies results per tick and stops us from only pulling whatever
    // the default (unsegmented) endpoint returns.
    // 200000343 Pet · 66 Beauty/Health · 15 Home/Garden · 18 Sports
    // 44 Consumer Electronics · 1501 Mother & Kids · 3 Apparel & Accessories
    // 1511 Home Appliances (kitchen) · 34 Automobiles & Motorcycles · 13 Tools (garden)
    const NICHE_CATEGORIES: Array<{ id: string; niche: string }> = [
      { id: '66',  niche: 'Beauty' },
      { id: '200000343', niche: 'Pets' },
      { id: '15',  niche: 'Home' },
      { id: '18',  niche: 'Fitness' },
      { id: '44',  niche: 'Tech' },
      { id: '3',   niche: 'Fashion' },
      { id: '1501', niche: 'Kids' },
      { id: '1511', niche: 'Kitchen' },
      { id: '34',  niche: 'Auto' },
      { id: '13',  niche: 'Garden' },
    ];

    // Per-tick budget: 7 markets × 50 (broad) + 10 niches × 2 pages × 50 (AU)
    // = 350 broad + 1000 niche-targeted = up to ~1350 raw rows before dedupe.
    const broadBuckets = await fetchHotProductsAllMarkets(50);
    const nicheBuckets: Array<{ market: string; products: Awaited<ReturnType<typeof fetchHotProducts>> }> = [];
    for (const cat of NICHE_CATEGORIES) {
      for (const pageNo of [1, 2]) {
        try {
          const products = await fetchHotProducts({
            country: 'AU',
            categoryId: cat.id,
            pageNo,
            pageSize: 50,
          });
          nicheBuckets.push({ market: `AU:${cat.niche}:p${pageNo}`, products });
        } catch (err) {
          console.error(`[cron/refresh-hotproducts] niche ${cat.niche} p${pageNo} failed:`, err instanceof Error ? err.message : err);
        }
      }
    }
    const buckets = [...broadBuckets, ...nicheBuckets];
    void SUPPORTED_MARKETS;

    const FX_TO_AUD: Record<string, number> = {
      USD: 1.55, GBP: 1.95, CAD: 1.13, NZD: 0.93, EUR: 1.65, SGD: 1.15, AUD: 1.0,
    };

    type Row = Record<string, unknown>;
    const seen = new Set<string>();
    const stagedInputs: Array<{
      market: string;
      product_id: string;
      product_title: string;
      image_url: string;
      priceAud: number;
      costAud: number;
      orders: number;
      category: string | null;
      product_detail_url: string;
    }> = [];
    let totalFetched = 0;
    const rejects = { no_id: 0, no_image: 0, bad_image_url: 0, duplicate: 0, zero_price: 0, short_title: 0, zero_orders: 0 };

    for (const { market, products } of buckets) {
      totalFetched += products.length;
      for (const p of products) {
        if (!p.product_id) { rejects.no_id++; continue; }
        if (!p.product_main_image_url) { rejects.no_image++; continue; }
        if (!p.product_main_image_url.startsWith('http')) { rejects.bad_image_url++; continue; }
        if (seen.has(p.product_id)) { rejects.duplicate++; continue; }
        if (!p.product_title || p.product_title.length < 5) { rejects.short_title++; continue; }
        seen.add(p.product_id);

        const currency = (p.sale_price_currency || 'USD').toUpperCase();
        const fx = FX_TO_AUD[currency] ?? 1.55;
        const salePriceLocal = parseFloat(p.sale_price.replace(/[^0-9.]/g, '')) || 0;
        const priceAud = Math.round(salePriceLocal * fx * 100) / 100;
        const costAud = Math.round(priceAud * 0.4 * 100) / 100;
        const orders = p.lastest_volume || 0;

        if (priceAud <= 0) { rejects.zero_price++; seen.delete(p.product_id); continue; }
        if (orders <= 0) { rejects.zero_orders++; seen.delete(p.product_id); continue; }

        stagedInputs.push({
          market,
          product_id: p.product_id,
          product_title: p.product_title,
          image_url: p.product_main_image_url,
          priceAud,
          costAud,
          orders,
          category: p.second_level_category_name ?? null,
          product_detail_url: p.product_detail_url,
        });
      }
    }

    // ── Velocity snapshots: fetch existing rows so we can compute 7d delta ──
    // We shift the snapshot forward only when it's >=7 days old so each row
    // carries a true weekly delta rather than whatever noise arrived between
    // cron ticks. First-seen rows have no prior snapshot → velocity_7d = 0
    // until we roll one in ~7 days.
    const existingByAeId = new Map<string, {
      sold_count: number | null;
      sold_count_7d_ago: number | null;
      sold_count_snapshot_at: string | null;
      first_seen_at: string | null;
      times_seen_in_scrapes: number | null;
      created_at: string | null;
    }>();
    const ids = stagedInputs.map((s) => s.product_id);
    if (ids.length > 0) {
      // Supabase .in() caps at ~1000 values — we have at most 350 (7*50) so one call is fine.
      const { data: existing } = await sb
        .from('winning_products')
        .select('aliexpress_id, sold_count, sold_count_7d_ago, sold_count_snapshot_at, first_seen_at, times_seen_in_scrapes, created_at')
        .in('aliexpress_id', ids);
      for (const e of (existing ?? []) as Array<Record<string, unknown>>) {
        existingByAeId.set(String(e.aliexpress_id), {
          sold_count: (e.sold_count as number | null) ?? null,
          sold_count_7d_ago: (e.sold_count_7d_ago as number | null) ?? null,
          sold_count_snapshot_at: (e.sold_count_snapshot_at as string | null) ?? null,
          first_seen_at: (e.first_seen_at as string | null) ?? null,
          times_seen_in_scrapes: (e.times_seen_in_scrapes as number | null) ?? null,
          created_at: (e.created_at as string | null) ?? null,
        });
      }
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const rows: Row[] = stagedInputs.map((s) => {
      const prior = existingByAeId.get(s.product_id);
      const priorSnapshotMs = prior?.sold_count_snapshot_at ? Date.parse(prior.sold_count_snapshot_at) : NaN;
      const snapshotAgeMs = Number.isFinite(priorSnapshotMs) ? (nowMs - priorSnapshotMs) : Infinity;

      // Roll the snapshot forward only if it's 7+ days old. Otherwise hold the
      // old baseline so velocity_7d stays a true weekly delta.
      let soldCount7dAgo: number;
      let snapshotAtIso: string;
      if (!prior || prior.sold_count_7d_ago == null || !Number.isFinite(priorSnapshotMs)) {
        soldCount7dAgo = s.orders;
        snapshotAtIso = nowIso;
      } else if (snapshotAgeMs >= SEVEN_DAYS_MS) {
        soldCount7dAgo = prior.sold_count ?? s.orders;
        snapshotAtIso = nowIso;
      } else {
        soldCount7dAgo = prior.sold_count_7d_ago;
        snapshotAtIso = prior.sold_count_snapshot_at ?? nowIso;
      }
      const velocity7d = Math.max(0, s.orders - soldCount7dAgo);

      // Composite winning_score (0-100). Velocity dominates — a product that
      // sold 5k units in 7 days is a stronger signal than a 6-month-old listing
      // with high cumulative orders but no movement. Margin tiebreaks.
      const marginPct = s.priceAud > 0 ? ((s.priceAud - s.costAud) / s.priceAud) * 100 : 40;
      const velocityScore = Math.min(60, Math.log10(Math.max(1, velocity7d)) * 15); // 0→60
      const volumeScore = Math.min(25, Math.log10(Math.max(1, s.orders)) * 5);        // 0→25
      const marginScore = Math.min(15, Math.max(0, (marginPct - 30) * 0.5));          // 0→15
      const winningScore = Math.round(Math.max(5, velocityScore + volumeScore + marginScore));

      const timesSeen = (prior?.times_seen_in_scrapes ?? 0) + 1;

      return {
        product_title: s.product_title,
        image_url: s.image_url,
        price_aud: s.priceAud,
        real_price_aud: s.priceAud,
        cost_price_aud: s.costAud,
        supplier_cost_aud: s.costAud,
        profit_margin: s.priceAud > 0 ? Math.round(marginPct) : 60,
        winning_score: winningScore,
        trend: velocity7d >= 2000 ? 'Exploding' : velocity7d >= 500 ? 'Rising' : s.orders >= 5000 ? 'Steady' : 'New',
        orders_count: s.orders,
        real_orders_count: s.orders,
        sold_count: s.orders,
        sold_count_7d_ago: soldCount7dAgo,
        velocity_7d: velocity7d,
        sold_count_snapshot_at: snapshotAtIso,
        source_url: s.product_detail_url,
        aliexpress_url: s.product_detail_url,
        aliexpress_id: s.product_id,
        category: s.category,
        platform: 'aliexpress',
        data_source: 'aliexpress_hotproduct_api',
        link_status: 'verified',
        link_verified_at: nowIso,
        tiktok_signal: velocity7d >= 1000 || s.orders >= 5000,
        tags: ['ae-hot', 'affiliate', `market-${s.market.toLowerCase()}`],
        is_active: true,
        scraped_at: nowIso,
        updated_at: nowIso,
        // Do NOT set created_at — preserves original insertion date on re-upsert.
        // last_seen_at tracks freshness; created_at stays immutable.
        last_seen_at: nowIso,
        last_seen_in_scrape_at: nowIso,
        times_seen_in_scrapes: timesSeen,
      };
    });

    let upserted = 0;
    if (rows.length > 0) {
      const { error, count } = await sb
        .from('winning_products')
        .upsert(rows, { onConflict: 'aliexpress_id', ignoreDuplicates: false, count: 'exact' });
      if (error) {
        console.error('[cron/refresh-hotproducts] upsert error:', error.message);
      } else {
        upserted = count ?? rows.length;
      }
    }

    // Diagnostic: total rows in table after this run so we can watch growth.
    let totalRowsAfter: number | null = null;
    try {
      const { count: totalCount } = await sb
        .from('winning_products')
        .select('id', { count: 'exact', head: true });
      totalRowsAfter = totalCount ?? null;
    } catch {
      totalRowsAfter = null;
    }

    const totalRejected = Object.values(rejects).reduce((a, b) => a + b, 0);
    const rejectPct = totalFetched > 0 ? Math.round((totalRejected / totalFetched) * 100) : 0;
    console.info(
      `[ingest] fetched ${totalFetched}, filtered ${totalRejected} (${rejectPct}% — reasons: ${JSON.stringify(rejects)}), staged ${stagedInputs.length} unique, upserted ${upserted}, table_total=${totalRowsAfter ?? 'unknown'}`,
    );

    const { LAST_RAW_RESPONSE } = await import('../lib/aliexpress-affiliate');
    const summary = {
      success: true,
      markets: buckets.map((b) => ({ market: b.market, fetched: b.products.length })),
      total_fetched: totalFetched,
      unique_products: rows.length,
      upserted,
      rejects,
      reject_pct: rejectPct,
      table_total_after: totalRowsAfter,
      raw_sample: LAST_RAW_RESPONSE,
      timestamp: new Date().toISOString(),
    };
    console.info('[cron/refresh-hotproducts]', summary);
    res.json(summary);
  } catch (err: unknown) {
    console.error('[cron/refresh-hotproducts] Error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}

router.get('/refresh-hotproducts', cronLimiter, runRefreshHotProducts);
router.post('/refresh-hotproducts', cronLimiter, runRefreshHotProducts);

// ── /api/cron/backfill-images — extracts og:image from AliExpress pages ──
async function runBackfillImages(req: Request, res: Response) {
  if (!verifyCronSecret(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('winning_products')
      .select('id, aliexpress_url, source_url, product_title')
      .is('image_url', null)
      .or('aliexpress_url.not.is.null,source_url.not.is.null')
      .limit(50);
    if (error) { res.status(500).json({ error: error.message }); return; }
    const rows = (data ?? []) as Array<{ id: string; aliexpress_url: string | null; source_url: string | null; product_title: string | null }>;

    let updated = 0;
    let failed = 0;
    for (const p of rows) {
      const url = p.aliexpress_url ?? p.source_url ?? '';
      const m = url.match(/item\/(\d+)\.html/);
      if (!m) { failed++; continue; }
      try {
        const r = await fetch(`https://www.aliexpress.com/item/${m[1]}.html`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        });
        const html = await r.text();
        const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
        const imageUrl = og?.[1];
        if (imageUrl && imageUrl.startsWith('http')) {
          await sb.from('winning_products')
            .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
            .eq('id', p.id);
          updated++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    res.json({ success: true, updated, failed, processed: rows.length });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
router.get('/backfill-images', runBackfillImages);
router.post('/backfill-images', runBackfillImages);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cron/check-alerts — hourly
// Queries the `alerts` table, compares each row to the current `winning_products`
// state, sends an email through the configured provider, and updates
// `last_fired_at`. Dedup is enforced by `last_fired_at` + frequency window.
// ─────────────────────────────────────────────────────────────────────────────

interface CheckAlertsAlertRow {
  id: string;
  user_id: string;
  product_id: string | null;
  type: 'price_drop' | 'score_change' | 'sold_count_spike';
  threshold: number;
  frequency: 'instant' | 'daily' | 'weekly';
  email: string;
  category: string | null;
  last_fired_at: string | null;
}

interface CheckAlertsProductRow {
  id: string;
  product_title: string | null;
  price_aud: number | null;
  winning_score: number | null;
  sold_count: number | null;
  image_url: string | null;
  product_url: string | null;
}

function frequencyWindowMs(freq: 'instant' | 'daily' | 'weekly'): number {
  switch (freq) {
    case 'instant': return 0;
    case 'daily': return 24 * 60 * 60 * 1000;
    case 'weekly': return 7 * 24 * 60 * 60 * 1000;
  }
}

function shouldFire(alert: CheckAlertsAlertRow, product: CheckAlertsProductRow): boolean {
  const thr = Number(alert.threshold);
  if (alert.type === 'price_drop') {
    return product.price_aud != null && product.price_aud <= thr;
  }
  if (alert.type === 'score_change') {
    return product.winning_score != null && product.winning_score >= thr;
  }
  if (alert.type === 'sold_count_spike') {
    return product.sold_count != null && product.sold_count >= thr;
  }
  return false;
}

function renderAlertHtml(alert: CheckAlertsAlertRow, product: CheckAlertsProductRow): { subject: string; html: string } {
  const title = product.product_title ?? 'Untitled product';
  const label = alert.type === 'price_drop' ? 'Price drop'
    : alert.type === 'score_change' ? 'Score threshold'
    : 'Orders spike';
  const subject = `Majorka alert: ${label} — ${title}`;
  const imgHtml = product.image_url
    ? `<img src="${product.image_url}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:12px;border:1px solid #1f2937"/>`
    : '';
  const linkHtml = product.product_url
    ? `<a href="${product.product_url}" style="color:#a78bfa">View on AliExpress →</a>`
    : '';
  const html = `<!doctype html><html><body style="margin:0;background:#0d0f14;font-family:-apple-system,sans-serif;color:#f0f4ff">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <h1 style="font-size:22px;margin:0 0 6px;color:#a78bfa">${label}</h1>
      <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Threshold ${alert.threshold} · ${alert.frequency}</p>
      <div style="background:#13151c;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;display:flex;gap:16px;align-items:flex-start">
        ${imgHtml}
        <div>
          <div style="font-weight:700;margin-bottom:6px">${title}</div>
          <div style="color:#a1a1aa;font-size:13px;margin-bottom:4px">Price: $${product.price_aud ?? '—'} AUD</div>
          <div style="color:#a1a1aa;font-size:13px;margin-bottom:4px">Score: ${product.winning_score ?? '—'}</div>
          <div style="color:#a1a1aa;font-size:13px;margin-bottom:10px">Orders: ${product.sold_count ?? '—'}</div>
          ${linkHtml}
        </div>
      </div>
      <p style="color:#52525b;font-size:11px;margin-top:32px">Majorka · <a href="https://www.majorka.io/app/alerts" style="color:#52525b">Manage alerts</a></p>
    </div>
  </body></html>`;
  return { subject, html };
}

async function runCheckAlerts(req: Request, res: Response): Promise<void> {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data: alertsData, error: alertsErr } = await supabase
      .from('alerts')
      .select('*');
    if (alertsErr) {
      res.status(500).json({ error: 'db_error', message: alertsErr.message });
      return;
    }
    const alerts = (alertsData ?? []) as CheckAlertsAlertRow[];
    if (alerts.length === 0) {
      res.json({ ok: true, checked: 0, fired: 0 });
      return;
    }

    const { sendAlertEmail, getEmailProvider } = await import('../lib/email');
    const provider = getEmailProvider();
    if (provider === 'none') {
      res.json({
        ok: false,
        reason: 'no_provider',
        checked: alerts.length,
        fired: 0,
        message: 'No email provider configured (set RESEND_API_KEY or POSTMARK_API_KEY).',
      });
      return;
    }

    const productIds = Array.from(new Set(alerts.map(a => a.product_id).filter((x): x is string => !!x)));
    const productMap = new Map<string, CheckAlertsProductRow>();
    if (productIds.length > 0) {
      const { data: products, error: prodErr } = await supabase
        .from('winning_products')
        .select('id, product_title, price_aud, winning_score, sold_count, image_url, product_url')
        .in('id', productIds);
      if (prodErr) {
        res.status(500).json({ error: 'db_error', message: prodErr.message });
        return;
      }
      for (const p of (products ?? []) as CheckAlertsProductRow[]) productMap.set(p.id, p);
    }

    const now = Date.now();
    let fired = 0;
    let skipped = 0;

    for (const alert of alerts) {
      // Dedup: honour frequency window
      if (alert.last_fired_at) {
        const lastMs = new Date(alert.last_fired_at).getTime();
        if (now - lastMs < frequencyWindowMs(alert.frequency)) {
          skipped++;
          continue;
        }
      }

      if (!alert.product_id) { skipped++; continue; }
      const product = productMap.get(alert.product_id);
      if (!product) { skipped++; continue; }
      if (!shouldFire(alert, product)) { skipped++; continue; }

      const { subject, html } = renderAlertHtml(alert, product);
      const result = await sendAlertEmail(alert.email, subject, html);
      if (result.ok) {
        fired++;
        await supabase
          .from('alerts')
          .update({ last_fired_at: new Date().toISOString() })
          .eq('id', alert.id);
      } else {
        console.warn('[cron/check-alerts] send failed for', alert.id, result.error);
      }
    }

    res.json({ ok: true, checked: alerts.length, fired, skipped, provider });
  } catch (err: unknown) {
    res.status(500).json({ error: 'internal', message: err instanceof Error ? err.message : String(err) });
  }
}

router.get('/check-alerts', runCheckAlerts);
router.post('/check-alerts', runCheckAlerts);

// ─────────────────────────────────────────────────────────────────────────────
// GET/POST /api/cron/check-trials — runs daily 09:00 UTC via vercel cron.
// Sends day-5 trial reminder and day-7 trial expired emails.
// Dedup via email_sends (UNIQUE user_id, template). Rate-limited to 100/run
// to stay under Resend free tier.
// ─────────────────────────────────────────────────────────────────────────────

interface TrialRow {
  user_id: string;
  trial_ends_at: string;
}

async function runCheckTrials(req: Request, res: Response): Promise<void> {
  if (!verifyCronSecret(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const MAX_SENDS = 100;
  const supabase = getSupabaseAdmin();

  try {
    // Import lazily to keep cron.ts cold-start light.
    const { sendTransactional } = await import('../lib/email');

    const now = Date.now();
    // Day-5 reminder window: trial ends 1.5 – 2.5 days from now (2-day warning).
    const reminderLo = new Date(now + 1.5 * 24 * 3600 * 1000).toISOString();
    const reminderHi = new Date(now + 2.5 * 24 * 3600 * 1000).toISOString();
    // Expired window: trial ended within last 24h.
    const expiredLo = new Date(now - 24 * 3600 * 1000).toISOString();
    const expiredHi = new Date(now).toISOString();

    const { data: reminderRows, error: remErr } = await supabase
      .from('user_subscriptions')
      .select('user_id, trial_ends_at')
      .gte('trial_ends_at', reminderLo)
      .lte('trial_ends_at', reminderHi)
      .limit(MAX_SENDS);

    const { data: expiredRows, error: expErr } = await supabase
      .from('user_subscriptions')
      .select('user_id, trial_ends_at')
      .gte('trial_ends_at', expiredLo)
      .lte('trial_ends_at', expiredHi)
      .limit(MAX_SENDS);

    if (remErr) console.warn('[cron/check-trials] reminder query error:', remErr.message);
    if (expErr) console.warn('[cron/check-trials] expired query error:', expErr.message);

    const reminderCandidates: TrialRow[] = (reminderRows ?? []) as TrialRow[];
    const expiredCandidates: TrialRow[] = (expiredRows ?? []) as TrialRow[];

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    async function alreadySent(userId: string, template: string): Promise<boolean> {
      const { data } = await supabase
        .from('email_sends')
        .select('id')
        .eq('user_id', userId)
        .eq('template', template)
        .maybeSingle();
      return !!data;
    }

    async function recordSend(
      userId: string,
      email: string,
      template: string,
      provider: string,
      providerId: string | undefined,
    ): Promise<void> {
      await supabase.from('email_sends').insert({
        user_id: userId,
        email,
        template,
        provider,
        provider_id: providerId ?? null,
      });
    }

    async function resolveUser(userId: string): Promise<{ email: string; firstName?: string } | null> {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);
        const email = data?.user?.email;
        if (!email) return null;
        const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
        const rawName = (meta.full_name ?? meta.name ?? meta.first_name ?? '') as string;
        const firstName = typeof rawName === 'string' ? rawName.trim().split(' ')[0] : undefined;
        return { email, firstName };
      } catch {
        return null;
      }
    }

    type Job = { row: TrialRow; template: 'trial_reminder' | 'trial_expired' };
    const jobs: Job[] = [
      ...reminderCandidates.map((r): Job => ({ row: r, template: 'trial_reminder' })),
      ...expiredCandidates.map((r): Job => ({ row: r, template: 'trial_expired' })),
    ].slice(0, MAX_SENDS);

    for (const { row, template } of jobs) {
      if (sent >= MAX_SENDS) break;
      if (await alreadySent(row.user_id, template)) { skipped++; continue; }

      const user = await resolveUser(row.user_id);
      if (!user) { skipped++; continue; }

      const spec = template === 'trial_reminder'
        ? { template: 'trial_reminder' as const, data: { firstName: user.firstName } }
        : { template: 'trial_expired' as const, data: { firstName: user.firstName } };

      const result = await sendTransactional(user.email, spec);
      if (result.ok) {
        await recordSend(row.user_id, user.email, template, result.provider, result.id);
        sent++;
      } else {
        failed++;
        console.warn(`[cron/check-trials] send failed user=${row.user_id} template=${template}: ${result.error ?? result.reason}`);
      }
    }

    res.json({
      ok: true,
      candidates: {
        reminder: reminderCandidates.length,
        expired: expiredCandidates.length,
      },
      sent,
      skipped,
      failed,
    });
  } catch (err: unknown) {
    res.status(500).json({
      error: 'internal',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

router.get('/check-trials', runCheckTrials);
router.post('/check-trials', runCheckTrials);

export default router;

// POST /api/cron/ae-bestsellers — runs every 6h via Vercel cron (0 */6 * * *)
// 25 broad category queries sorted by ORDERS — AliExpress picks the bestsellers.
// Fire-and-forget: starts up to 2 concurrent pintostudio runs, returns immediately.
// Harvest cron (/api/cron/harvest-apify) collects completed datasets.
// New products inserted with is_active=true; deduped by aliexpress_id.
router.post('/ae-bestsellers', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ ok: true, started: true, message: 'AE bestseller scrape started — 25 broad queries sortBy ORDERS' });
  launchAEBestsellerScrapes().then(ids => {
    console.info(`[cron/ae-bestsellers] ${ids.length} runs started`);
  }).catch(e => console.error('[cron/ae-bestsellers] Error:', e instanceof Error ? e.message : e));
});

router.get('/ae-bestsellers', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ ok: true, started: true });
  launchAEBestsellerScrapes().catch(e => console.error('[cron/ae-bestsellers]', e instanceof Error ? e.message : e));
});

// ── GET/POST /api/cron/snapshot-history ──────────────────────────────────
// Daily 02:00 UTC snapshot of the winning_products table into
// product_history so the Products detail drawer sparkline has real data.
// Idempotent: skips rows that already have a snapshot for today via a
// unique index on (product_id, date_trunc('day', snapshot_at)). Bulk
// inserts in pages of 1000 to stay well under Vercel's 60s function cap.
interface SnapshotRow {
  product_id: string;
  sold_count: number | null;
  winning_score: number | null;
  velocity_7d: number | null;
}

async function runSnapshotHistory(req: Request, res: Response): Promise<void> {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const supabase = getSupabaseAdmin();
  const PAGE = 1000;
  let from = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const startedAt = Date.now();
  try {
    while (from < 50_000) {
      const { data, error } = await supabase
        .from('winning_products')
        .select('id,sold_count,winning_score,velocity_7d')
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const batch = (data ?? []) as Array<{
        id: string | number;
        sold_count: number | null;
        winning_score: number | null;
        velocity_7d: number | null;
      }>;
      if (batch.length === 0) break;

      const rows: SnapshotRow[] = batch.map((r) => ({
        product_id: String(r.id),
        sold_count: r.sold_count,
        winning_score: r.winning_score,
        velocity_7d: r.velocity_7d,
      }));

      // onConflict on the (product_id, day) unique index — if a row for
      // today already exists we skip silently. ignoreDuplicates keeps the
      // earlier snapshot so the first-of-day value is the canonical one.
      const { error: insErr, count } = await supabase
        .from('product_history')
        .upsert(rows, {
          onConflict: 'product_id,snapshot_date',
          ignoreDuplicates: true,
          count: 'exact',
        });

      if (insErr) {
        // Fallback: insert without onConflict hint (unique index will
        // still raise 23505 per-row which we translate to a skip count).
        if (/no unique|on conflict|constraint/i.test(insErr.message)) {
          const { error: plainErr } = await supabase
            .from('product_history')
            .insert(rows);
          if (plainErr && !/duplicate key|23505/i.test(plainErr.message)) {
            throw plainErr;
          }
          totalInserted += plainErr ? 0 : rows.length;
          totalSkipped += plainErr ? rows.length : 0;
        } else if (/does not exist|relation .* does not exist/i.test(insErr.message)) {
          res.json({ ok: false, skipped: true, reason: 'table_missing' });
          return;
        } else {
          throw insErr;
        }
      } else {
        const inserted = count ?? 0;
        totalInserted += inserted;
        totalSkipped += rows.length - inserted;
      }

      if (batch.length < PAGE) break;
      from += PAGE;
    }
    res.json({
      ok: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err: unknown) {
    console.error('[cron/snapshot-history]', err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

router.get('/snapshot-history', runSnapshotHistory);
router.post('/snapshot-history', runSnapshotHistory);
