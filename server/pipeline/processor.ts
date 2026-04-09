/**
 * Processor Pipeline
 * Runs every 30 minutes. Processes raw_scrape_results staging table →
 * enriches with Claude Haiku → upserts to winning_products.
 */
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '../_core/supabase';
import { calculateSignalScore, getQualityTier, buildDataSourcesArray } from '../lib/signalScoring';

const AUD_RATE = 1.58;
const BATCH_SIZE = 10; // reduced from 20
const MAX_BATCHES_PER_RUN = 5;

interface RawProduct {
  id: string;
  source: string;
  title: string;
  price_usd: number;
  price_aud: number;
  orders_count: number;
  rating: number | null;
  review_count: number;
  image_url: string;
  product_url: string;
  source_product_id: string;
  category: string;
  extra_data: Record<string, any>;
}

/**
 * Strip stray parentheses, brackets, and double-spaces from raw category
 * strings before they reach winning_products. AliExpress occasionally
 * returns mangled categories like "Human Wigs( For Black)" — these get
 * normalised to "Human Wigs" so the dropdown stays clean.
 */
function cleanCategory(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/[()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+for\s+\w+\s*$/i, '')
    .trim();
}

function hardFilter(p: RawProduct): boolean {
  // Strict quality gate — nothing with null/zero sold_count, null/zero price,
  // missing image, or a junk title ever reaches winning_products. Prevents
  // the "AI slop" that showed up in early test runs.
  if (!p.title || p.title.length < 10) return false;
  if (!p.image_url || !/^https?:\/\//.test(p.image_url)) return false;
  if (!p.price_usd || p.price_usd <= 0) return false;
  if (p.price_usd < 2 || p.price_usd > 200) return false;
  if (!Number.isFinite(p.orders_count) || p.orders_count <= 0) return false;
  if (p.rating != null && p.rating > 0 && p.rating < 3.7) return false;

  const blocked = ['lot of', 'bulk', ' pcs', 'pack of', 'wholesale', 'sample', 'test product',
    'adult', 'weapon', 'drug', 'alcohol', 'tobacco', 'replica', 'knockoff', 'fidget spinner',
    'phone case', 'generic charger'];
  const t = p.title.toLowerCase();
  return !blocked.some(b => t.includes(b));
}

async function getCrossSourceBonus(title: string, source: string, supabase: any): Promise<{ bonus: number; sources: string[] }> {
  const normalised = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').slice(0, 40);
  try {
    const { data } = await supabase
      .from('raw_scrape_results')
      .select('source')
      .ilike('title', `%${normalised.slice(0, 25)}%`)
      .neq('source', source)
      .limit(10);

    const otherSources = [...new Set((data || []).map((r: any) => r.source))] as string[];
    let bonus = 0;
    if (otherSources.length >= 2) bonus = 35;
    else if (otherSources.length === 1) {
      const combo = [source, otherSources[0]].sort().join('+');
      if (combo.includes('tiktok') && combo.includes('amazon')) bonus = 25;
      else if (combo.includes('tiktok') && combo.includes('aliexpress')) bonus = 20;
      else bonus = 15;
    }
    return { bonus, sources: [source, ...otherSources] };
  } catch {
    return { bonus: 0, sources: [source] };
  }
}

async function batchEnrich(products: RawProduct[]): Promise<any[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Analyse these products for AU/US/UK dropshipping. Return ONLY a JSON array, no other text.

Products:
${products.map((p, i) => `${i}: title="${p.title}" price=$${p.price_usd} orders=${p.orders_count} category=${p.category} source=${p.source}`).join('\n')}

Return array of ${products.length} objects:
[{"index":0,"niche":"pet|beauty|home|fashion|electronics|fitness|baby|kitchen|general","opportunity_score":0-100,"trend_velocity":"exploding|rising|steady|declining","why_trending":"max 12 words","best_ad_angle":"max 12 words","target_audience":"max 10 words","estimated_sell_price_aud":0,"estimated_cost_aud":0,"margin_pct":0,"saturation_risk":"low|medium|high","tiktok_potential":"low|medium|high|viral","skip":false}]`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000, // reduced from 4000
      messages: [{ role: 'user', content: prompt }],
    });
    const text = (msg.content[0] as any).text || '';
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (err: any) {
    console.error('[processor] Haiku batch error:', err.message);
    return products.map((p, i) => ({
      index: i,
      niche: 'general',
      opportunity_score: 45,
      trend_velocity: 'steady',
      why_trending: `Popular on ${p.source}`,
      best_ad_angle: 'Show the product solving a problem',
      target_audience: 'General consumer',
      estimated_sell_price_aud: Math.round(p.price_usd * AUD_RATE * 2.5),
      estimated_cost_aud: Math.round(p.price_usd * AUD_RATE * 1.1),
      margin_pct: 56,
      saturation_risk: 'medium',
      tiktok_potential: 'medium',
      skip: false,
    }));
  }
}

export interface ProcessorResult {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  duration_ms: number;
}

export async function runProcessor(): Promise<ProcessorResult> {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();
  const result: ProcessorResult = { processed: 0, inserted: 0, updated: 0, skipped: 0, failed: 0, duration_ms: 0 };

  const { data: rawRows, error } = await supabase
    .from('raw_scrape_results')
    .select('*')
    .eq('processed', false)
    .order('scraped_at', { ascending: true })
    .limit(BATCH_SIZE * MAX_BATCHES_PER_RUN);

  if (error || !rawRows?.length) {
    result.duration_ms = Date.now() - startTime;
    return result;
  }

  console.log(`[processor] Processing ${rawRows.length} raw products`);

  const passed = rawRows.filter(hardFilter);
  result.skipped += rawRows.length - passed.length;

  const sourceIds = passed.map(p => p.source_product_id).filter(Boolean);
  const { data: existingBySourceId } = await supabase
    .from('winning_products')
    .select('id, source_product_id, product_title, signal_score, data_sources, orders_count')
    .in('source_product_id', sourceIds.length > 0 ? sourceIds : ['__none__']);
  const existingSourceIdMap = new Map((existingBySourceId || []).map((r: any) => [r.source_product_id, r]));

  const processedIds = rawRows.map(r => r.id);

  for (let i = 0; i < passed.length; i += BATCH_SIZE) {
    const batch = passed.slice(i, i + BATCH_SIZE);
    const enrichments = await batchEnrich(batch);

    for (let j = 0; j < batch.length; j++) {
      const raw = batch[j];
      const enrich = enrichments.find((e: any) => e.index === j) || {};

      try {
        if (enrich.skip || (enrich.opportunity_score || 0) < 35) {
          result.skipped++;
          continue;
        }

        const { bonus, sources } = await getCrossSourceBonus(raw.title, raw.source, supabase);

        const signals = {
          tiktok_shop_bestseller: raw.source === 'tiktok_shop',
          tiktok_hashtag_viral: raw.source === 'tiktok_cc',
          amazon_bsr_under_1000: raw.source === 'amazon_au' && (raw.extra_data?.bsr || 9999) < 1000,
          aliexpress_choice: raw.extra_data?.is_choice || false,
          aliexpress_orders_over_1000: (raw.orders_count || 0) > 1000,
          tiktok_ad_top_performing: false,
          meta_ad_30_days: false,
          multi_source: sources.length >= 2,
        };

        const signalScore = Math.min(150, calculateSignalScore(signals) + bonus);
        const qualityTier = getQualityTier(signalScore);
        const dataSources = buildDataSourcesArray(signals);

        const sellPrice = enrich.estimated_sell_price_aud || Math.round((raw.price_usd || 10) * AUD_RATE * 2.5);
        const costPrice = enrich.estimated_cost_aud || Math.round((raw.price_usd || 10) * AUD_RATE * 1.1);
        const unitsPerDay = Math.max(1, Math.round((raw.orders_count || 50) / 365));
        const isFeatured = (enrich.opportunity_score || 0) >= 85;

        const record: Record<string, any> = {
          product_title: raw.title.slice(0, 500),
          image_url: raw.image_url,
          category: cleanCategory(enrich.niche || raw.category) || 'general',
          platform: raw.source.includes('amazon') ? 'amazon' : raw.source.includes('tiktok') ? 'TikTok Shop' : 'aliexpress',
          price_aud: sellPrice,
          cost_price_aud: costPrice,
          supplier_cost_aud: costPrice,
          sold_count: raw.orders_count || 0,
          orders_count: raw.orders_count || 0,
          rating: raw.rating || null,
          review_count: raw.review_count || 0,
          shop_name: 'AliExpress',
          winning_score: enrich.opportunity_score || signalScore,
          signal_score: signalScore,
          quality_tier: qualityTier,
          data_sources: dataSources,
          trend: enrich.trend_velocity === 'exploding' ? 'hot' : enrich.trend_velocity === 'rising' ? 'trending' : 'stable',
          competition_level: enrich.saturation_risk === 'low' ? 'Low' : enrich.saturation_risk === 'high' ? 'High' : 'Medium',
          au_relevance: 'High',
          units_per_day: unitsPerDay,
          est_daily_revenue_aud: sellPrice * unitsPerDay,
          est_monthly_revenue_aud: sellPrice * unitsPerDay * 30,
          profit_margin: enrich.margin_pct || 55,
          why_winning: enrich.why_trending || 'Popular on multiple platforms',
          why_trending: enrich.why_trending,
          ad_angle: enrich.best_ad_angle,
          best_ad_angle: enrich.best_ad_angle,
          target_audience: enrich.target_audience,
          aliexpress_url: raw.product_url || null,
          aliexpress_id: raw.source_product_id || null,
          source_product_id: raw.source_product_id,
          source_url: raw.product_url,
          data_source: raw.source,
          tiktok_signal: raw.source.includes('tiktok') || false,
          tiktok_shop_signal: raw.source === 'tiktok_shop' || false,
          amazon_signal: raw.source === 'amazon_au' || false,
          amazon_bsr: raw.extra_data?.bsr || 0,
          is_aliexpress_choice: raw.extra_data?.is_choice || false,
          is_featured: isFeatured,
          is_active: true,
          saturation_risk: enrich.saturation_risk || 'medium',
          tiktok_potential: enrich.tiktok_potential || 'medium',
          cross_source_count: sources.length,
          tags: [enrich.niche, qualityTier, ...dataSources, ...(raw.extra_data?.is_choice ? ['aliexpress_choice'] : []), ...(isFeatured ? ['featured'] : [])].filter(Boolean),
          score_breakdown: { signal_score: signalScore, opportunity: enrich.opportunity_score, sources: dataSources },
          scraped_at: new Date().toISOString(),
          last_refreshed: new Date().toISOString(),
          last_seen_in_scrape_at: new Date().toISOString(),
          first_seen_at: new Date().toISOString(),
          times_seen_in_scrapes: sources.length,
        };

        const existing = raw.source_product_id ? existingSourceIdMap.get(raw.source_product_id) : null;

        if (existing) {
          const newScore = Math.max(existing.signal_score || 0, signalScore);
          const mergedSources = [...new Set([...(existing.data_sources || []), ...dataSources])];
          await supabase.from('winning_products').update({
            signal_score: newScore,
            quality_tier: getQualityTier(newScore),
            data_sources: mergedSources,
            orders_count: Math.max(existing.orders_count || 0, raw.orders_count || 0),
            last_seen_in_scrape_at: new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
          }).eq('id', existing.id);
          result.updated++;
        } else {
          const { error: insertErr } = await supabase.from('winning_products').insert(record);
          if (!insertErr) result.inserted++;
          else if (!insertErr.message?.includes('duplicate')) result.failed++;
        }

        result.processed++;
      } catch (err: any) {
        console.error('[processor] Item error:', err.message);
        result.failed++;
      }
    }

    if (i + BATCH_SIZE < passed.length) await new Promise(r => setTimeout(r, 1000));
  }

  await supabase.from('raw_scrape_results').update({ processed: true, processing_result: 'done' })
    .in('id', processedIds).then(null, () => {});

  result.duration_ms = Date.now() - startTime;
  console.log(`[processor] Done: processed=${result.processed}, inserted=${result.inserted}, updated=${result.updated}`);
  return result;
}
