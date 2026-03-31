import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '../_core/supabase';
import type { AEBulkProduct, EnrichedProduct } from './apifyAliExpressBulk';

const AUD_RATE = 1.58; // USD to AUD

// Quality filter — product must pass ALL checks
export function passesQualityFilter(p: AEBulkProduct): boolean {
  if (!p.title || p.title.length < 5) return false;
  if (!p.image_url || !p.image_url.includes('http')) return false;
  if (!p.aliexpress_product_id) return false;
  if (p.orders_count < 100) return false;
  if (p.rating < 4.0 && p.rating > 0) return false; // 0 = unrated, allow through
  if (p.price_usd < 1 || p.price_usd > 80) return false;

  // Block categories
  const blocked = ['adult', 'weapon', 'pharma', 'drug', 'tobacco', 'gambling'];
  const titleLower = p.title.toLowerCase();
  if (blocked.some(b => titleLower.includes(b))) return false;

  return true;
}

// Enrich a single product with Claude Haiku
export async function enrichProduct(p: AEBulkProduct): Promise<EnrichedProduct> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are an ecommerce intelligence analyst. Analyse this AliExpress product for dropshipping potential.

Product: ${p.title}
Price: $${p.price_usd} USD
Orders: ${p.orders_count}+
Rating: ${p.rating}/5
Category: ${p.category}
AliExpress Choice: ${p.aliexpress_choice}

Return ONLY valid JSON (no markdown, no explanation):
{"niche":"pet|beauty|home|fashion|electronics|fitness|baby|general","opportunity_score":0-100,"trend_velocity":"exploding|rising|steady|declining","target_market":["AU","US","UK"],"estimated_sell_price_aud":0,"estimated_cost_aud":0,"estimated_margin_percent":0,"why_trending":"one sentence","ad_angle":"best TikTok/Meta angle"}

Score 0-100 based on: demand (orders), margins, uniqueness, trend direction. AU market relevance matters most.`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (msg.content[0] as any).text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const enrichment = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      ...p,
      niche: enrichment.niche || 'general',
      opportunity_score: Math.min(100, Math.max(0, parseInt(enrichment.opportunity_score) || 50)),
      trend_velocity: enrichment.trend_velocity || 'steady',
      target_market: enrichment.target_market || ['AU', 'US'],
      estimated_sell_price_aud: enrichment.estimated_sell_price_aud || Math.round(p.price_usd * AUD_RATE * 2.5),
      estimated_cost_aud: enrichment.estimated_cost_aud || Math.round(p.price_usd * AUD_RATE * 1.1),
      estimated_margin_percent: enrichment.estimated_margin_percent || 55,
      why_trending: enrichment.why_trending || 'High order volume on AliExpress',
      ad_angle: enrichment.ad_angle || 'Problem/solution angle for social media',
    };
  } catch (err: any) {
    console.error('[pipeline] Haiku enrichment failed:', err.message);
    // Return with defaults
    const sellPrice = Math.round(p.price_usd * AUD_RATE * 2.5);
    const costPrice = Math.round(p.price_usd * AUD_RATE * 1.1);
    return {
      ...p,
      niche: p.category.toLowerCase().includes('pet') ? 'pet' :
             p.category.toLowerCase().includes('beauty') ? 'beauty' :
             p.category.toLowerCase().includes('home') ? 'home' :
             p.category.toLowerCase().includes('fashion') ? 'fashion' : 'general',
      opportunity_score: Math.min(80, 40 + Math.floor(Math.log10(Math.max(100, p.orders_count)) * 10)),
      trend_velocity: p.orders_count > 10000 ? 'exploding' : p.orders_count > 1000 ? 'rising' : 'steady',
      target_market: ['AU', 'US', 'UK'],
      estimated_sell_price_aud: sellPrice,
      estimated_cost_aud: costPrice,
      estimated_margin_percent: Math.round(((sellPrice - costPrice) / sellPrice) * 100),
      why_trending: `${p.orders_count.toLocaleString()}+ orders on AliExpress — proven demand`,
      ad_angle: 'Demonstrate the product solving a real problem — works well on TikTok',
    };
  }
}

export interface PipelineResult {
  scraped: number;
  passed_filter: number;
  added: number;
  updated: number;
  errors: string[];
}

// Run full pipeline for a batch of raw products
export async function runPipeline(
  rawProducts: AEBulkProduct[],
  sourceLabel: string
): Promise<PipelineResult> {
  const supabase = getSupabaseAdmin();
  const result: PipelineResult = { scraped: rawProducts.length, passed_filter: 0, added: 0, updated: 0, errors: [] };

  // Step 1: Quality filter
  const passed = rawProducts.filter(passesQualityFilter);
  result.passed_filter = passed.length;
  console.log(`[pipeline] ${sourceLabel}: ${rawProducts.length} scraped → ${passed.length} passed filter`);

  // Step 2: Check for existing products (deduplication)
  const existingIds = new Set<string>();
  if (passed.length > 0) {
    const ids = passed.map(p => p.aliexpress_product_id).filter(Boolean);
    const { data: existing } = await supabase
      .from('winning_products')
      .select('aliexpress_id')
      .in('aliexpress_id', ids);
    (existing || []).forEach((row: any) => existingIds.add(row.aliexpress_id));
  }

  // Process in batches of 5 (to avoid rate limiting Haiku)
  const BATCH_SIZE = 5;
  for (let i = 0; i < passed.length; i += BATCH_SIZE) {
    const batch = passed.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (product) => {
      try {
        const enriched = await enrichProduct(product);

        const sellPrice = enriched.estimated_sell_price_aud;
        const costPrice = enriched.estimated_cost_aud;
        const unitsPerDay = Math.max(1, Math.round(enriched.orders_count / 365));

        const dbRecord = {
          product_title: enriched.title.slice(0, 500),
          image_url: enriched.image_url,
          category: enriched.niche,
          platform: 'aliexpress',
          price_aud: sellPrice,
          cost_price_aud: costPrice,
          supplier_cost_aud: costPrice,
          sold_count: enriched.orders_count,
          orders_count: enriched.orders_count,
          rating: enriched.rating || null,
          review_count: enriched.review_count || 0,
          shop_name: enriched.seller_name,
          winning_score: enriched.opportunity_score,
          trend: enriched.trend_velocity === 'exploding' ? 'hot' : enriched.trend_velocity === 'rising' ? 'trending' : 'stable',
          competition_level: enriched.opportunity_score > 70 ? 'Low' : enriched.opportunity_score > 40 ? 'Medium' : 'High',
          au_relevance: enriched.target_market.includes('AU') ? 'High' : 'Medium',
          units_per_day: unitsPerDay,
          est_daily_revenue_aud: sellPrice * unitsPerDay,
          est_monthly_revenue_aud: sellPrice * unitsPerDay * 30,
          profit_margin: enriched.estimated_margin_percent,
          why_winning: enriched.why_trending,
          ad_angle: enriched.ad_angle,
          aliexpress_url: enriched.product_url,
          aliexpress_id: enriched.aliexpress_product_id,
          tiktok_signal: false,
          tags: [enriched.niche, enriched.trend_velocity, ...(enriched.aliexpress_choice ? ['aliexpress_choice'] : [])],
          score_breakdown: {
            opportunity: enriched.opportunity_score,
            demand: Math.min(100, Math.round(Math.log10(Math.max(10, enriched.orders_count)) * 20)),
            margin: Math.min(100, enriched.estimated_margin_percent),
          },
          search_keyword: enriched.category,
          scraped_at: new Date().toISOString(),
          last_refreshed: new Date().toISOString(),
        };

        if (existingIds.has(enriched.aliexpress_product_id)) {
          // Update existing — just refresh price, orders, rating
          const { error } = await supabase
            .from('winning_products')
            .update({
              price_aud: sellPrice,
              orders_count: enriched.orders_count,
              sold_count: enriched.orders_count,
              rating: enriched.rating || null,
              winning_score: enriched.opportunity_score,
              last_refreshed: new Date().toISOString(),
            })
            .eq('aliexpress_id', enriched.aliexpress_product_id);

          if (!error) result.updated++;
          else result.errors.push(`Update ${enriched.aliexpress_product_id}: ${error.message}`);
        } else {
          // Insert new
          const { error } = await supabase
            .from('winning_products')
            .insert(dbRecord);

          if (!error) {
            result.added++;
            existingIds.add(enriched.aliexpress_product_id); // prevent double-insert in same batch
          } else {
            result.errors.push(`Insert ${enriched.aliexpress_product_id}: ${error.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`Product ${product.aliexpress_product_id}: ${err.message}`);
      }
    }));

    // Small delay between batches
    if (i + BATCH_SIZE < passed.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`[pipeline] ${sourceLabel}: added=${result.added}, updated=${result.updated}, errors=${result.errors.length}`);
  return result;
}
