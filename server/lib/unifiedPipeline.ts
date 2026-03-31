import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '../_core/supabase';
import { calculateSignalScore, getQualityTier, buildDataSourcesArray, passesQualityFilter } from './signalScoring';

const AUD_RATE = 1.58;

export interface UnifiedProduct {
  title: string;
  price_usd: number;
  image_url: string;
  product_url?: string;
  rating?: number;
  review_count?: number;
  orders_count?: number;
  category: string;
  source: string;
  // Signal flags
  is_tiktok_shop?: boolean;
  is_tiktok_viral?: boolean;
  is_amazon_bestseller?: boolean;
  amazon_bsr?: number;
  is_aliexpress_choice?: boolean;
  aliexpress_id?: string;
  platform_specific?: Record<string, any>;
}

export interface UnifiedPipelineResult {
  source: string;
  scraped: number;
  passed_filter: number;
  added: number;
  updated: number;
  errors: string[];
  duration_ms: number;
}

async function enrichWithHaiku(product: UnifiedProduct, sources: string[]): Promise<Record<string, any>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are an ecommerce analyst. Analyse this product for AU/US/UK dropshipping potential.

Title: ${product.title}
Price: $${product.price_usd} USD
Category: ${product.category}
Platforms found on: ${sources.join(', ')}
${product.orders_count ? `Orders: ${product.orders_count}+` : ''}
${product.rating ? `Rating: ${product.rating}/5` : ''}
${product.amazon_bsr ? `Amazon BSR: #${product.amazon_bsr}` : ''}

Return ONLY valid JSON (no markdown):
{"niche":"pet|beauty|home|fashion|electronics|fitness|baby|general","opportunity_score":0-100,"trend_velocity":"exploding|rising|steady|declining","why_trending":"1 sentence","target_audience":"who buys this","best_ad_angle":"TikTok/Meta angle","estimated_sell_price_aud":0,"estimated_cost_aud":0,"estimated_margin_pct":0,"saturation_risk":"low|medium|high","seasonal":false,"season_peak":null}`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = (msg.content[0] as any).text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    const sellPrice = Math.round(product.price_usd * AUD_RATE * 2.8);
    const costPrice = Math.round(product.price_usd * AUD_RATE * 1.1);
    return {
      niche: 'general',
      opportunity_score: 50,
      trend_velocity: 'steady',
      why_trending: `Found on ${sources.join(' + ')}`,
      target_audience: 'Broad consumer audience',
      best_ad_angle: 'Problem/solution for social media',
      estimated_sell_price_aud: sellPrice,
      estimated_cost_aud: costPrice,
      estimated_margin_pct: Math.round(((sellPrice - costPrice) / sellPrice) * 100),
      saturation_risk: 'medium',
      seasonal: false,
      season_peak: null,
    };
  }
}

export async function runUnifiedPipeline(
  products: UnifiedProduct[],
  sourceLabel: string
): Promise<UnifiedPipelineResult> {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();
  const result: UnifiedPipelineResult = { source: sourceLabel, scraped: products.length, passed_filter: 0, added: 0, updated: 0, errors: [], duration_ms: 0 };

  // Quality filter
  const passed = products.filter(p => passesQualityFilter({
    rating: p.rating,
    price_usd: p.price_usd,
    title: p.title,
    image_url: p.image_url,
  }));
  result.passed_filter = passed.length;

  if (passed.length === 0) {
    result.duration_ms = Date.now() - startTime;
    return result;
  }

  // Check existing products by aliexpress_id
  const aeIds = passed.map(p => p.aliexpress_id).filter(Boolean) as string[];
  const { data: existing } = aeIds.length > 0
    ? await supabase
        .from('winning_products')
        .select('id, aliexpress_id, product_title, data_sources, signal_score')
        .in('aliexpress_id', aeIds)
    : { data: [] };

  const existingByAeId = new Map((existing || []).map((r: any) => [r.aliexpress_id, r]));

  // Process in batches of 5
  const BATCH = 5;
  for (let i = 0; i < passed.length; i += BATCH) {
    const batch = passed.slice(i, i + BATCH);

    await Promise.all(batch.map(async (product) => {
      try {
        // Build signals
        const signals = {
          tiktok_shop_bestseller: product.is_tiktok_shop || false,
          tiktok_hashtag_viral: product.is_tiktok_viral || false,
          amazon_bsr_under_1000: Boolean(product.is_amazon_bestseller && (product.amazon_bsr || 9999) < 1000),
          aliexpress_choice: product.is_aliexpress_choice || false,
          aliexpress_orders_over_1000: (product.orders_count || 0) > 1000,
          tiktok_ad_top_performing: false,
          meta_ad_30_days: false,
          multi_source: false,
        };

        const signalScore = calculateSignalScore(signals);
        const qualityTier = getQualityTier(signalScore);
        const dataSources = buildDataSourcesArray(signals);

        // Skip if score too low (unless it's AliExpress with high orders)
        const minScore = 15;
        if (signalScore < minScore && (product.orders_count || 0) < 500) return;

        const enriched = await enrichWithHaiku(product, dataSources.length > 0 ? dataSources : [product.source]);

        const sellPrice = enriched.estimated_sell_price_aud || Math.round(product.price_usd * AUD_RATE * 2.8);
        const costPrice = enriched.estimated_cost_aud || Math.round(product.price_usd * AUD_RATE * 1.1);
        const unitsPerDay = Math.max(1, Math.round((product.orders_count || 100) / 365));

        const dbRecord: Record<string, any> = {
          product_title: product.title.slice(0, 500),
          image_url: product.image_url,
          category: enriched.niche || product.category,
          platform: product.source.includes('amazon') ? 'amazon' :
                    product.source.includes('tiktok') ? 'TikTok Shop' : 'aliexpress',
          price_aud: sellPrice,
          cost_price_aud: costPrice,
          supplier_cost_aud: costPrice,
          sold_count: product.orders_count || 0,
          orders_count: product.orders_count || 0,
          rating: product.rating || null,
          review_count: product.review_count || 0,
          shop_name: product.source.includes('amazon') ? 'Amazon AU' :
                     product.source.includes('tiktok') ? 'TikTok Shop' : 'AliExpress',
          winning_score: enriched.opportunity_score || signalScore,
          signal_score: signalScore,
          quality_tier: qualityTier,
          data_sources: dataSources,
          trend: enriched.trend_velocity === 'exploding' ? 'hot' :
                 enriched.trend_velocity === 'rising' ? 'trending' : 'stable',
          competition_level: (enriched.saturation_risk === 'low' ? 'Low' :
                              enriched.saturation_risk === 'high' ? 'High' : 'Medium'),
          au_relevance: 'High',
          units_per_day: unitsPerDay,
          est_daily_revenue_aud: sellPrice * unitsPerDay,
          est_monthly_revenue_aud: sellPrice * unitsPerDay * 30,
          profit_margin: enriched.estimated_margin_pct || 55,
          why_winning: enriched.why_trending || `Found on ${dataSources.join(' + ')}`,
          ad_angle: enriched.best_ad_angle || 'Problem/solution format',
          aliexpress_url: product.product_url || null,
          aliexpress_id: product.aliexpress_id || null,
          tiktok_signal: product.is_tiktok_shop === true || product.is_tiktok_viral === true,
          tiktok_shop_signal: product.is_tiktok_shop || false,
          amazon_signal: product.is_amazon_bestseller || false,
          tags: [
            enriched.niche,
            qualityTier,
            ...dataSources,
            ...(product.is_aliexpress_choice ? ['aliexpress_choice'] : []),
            ...(product.is_amazon_bestseller ? ['amazon_bestseller'] : []),
          ].filter(Boolean),
          score_breakdown: {
            signal_score: signalScore,
            opportunity: enriched.opportunity_score,
            sources: dataSources,
          },
          scraped_at: new Date().toISOString(),
          last_refreshed: new Date().toISOString(),
          cross_validated_at: dataSources.length >= 2 ? new Date().toISOString() : null,
        };

        const existingRecord = product.aliexpress_id ? existingByAeId.get(product.aliexpress_id) : null;

        if (existingRecord) {
          // Update — merge data sources and recalculate score
          const mergedSources = [...new Set([...(existingRecord.data_sources || []), ...dataSources])];
          const newScore = Math.max(existingRecord.signal_score || 0, signalScore);

          const { error } = await supabase
            .from('winning_products')
            .update({
              signal_score: newScore,
              quality_tier: getQualityTier(newScore),
              data_sources: mergedSources,
              orders_count: Math.max(product.orders_count || 0, existingRecord.orders_count || 0),
              last_refreshed: new Date().toISOString(),
              cross_validated_at: mergedSources.length >= 2 ? new Date().toISOString() : null,
            })
            .eq('id', existingRecord.id);

          if (!error) result.updated++;
          else result.errors.push(`Update: ${error.message}`);
        } else {
          const { error } = await supabase.from('winning_products').insert(dbRecord);
          if (!error) result.added++;
          else if (!error.message?.includes('duplicate')) result.errors.push(`Insert: ${error.message}`);
        }
      } catch (err: any) {
        result.errors.push(err.message?.slice(0, 100));
      }
    }));

    if (i + BATCH < passed.length) await new Promise(r => setTimeout(r, 1500));
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}
