/**
 * product-search.ts
 *
 * POST /api/products/search
 * Body: { query: string }
 * Returns: { products: ScoredProduct[], cached: boolean, sources: string[] }
 *
 * Logic:
 * 1. Check Supabase search_cache for this query within 6 hours
 * 2. Fire 4 parallel Tavily searches (TikTok Shop, AliExpress, Alibaba, Amazon AU)
 * 3. Feed results to Claude Haiku for product extraction
 * 4. Cache results & upsert into winning_products
 */

import { callClaude } from './claudeWrap';
import { getSupabaseAdmin } from '../_core/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScoredProduct {
  id?: string;
  product_title: string;
  category: string;
  platform: string;
  price_aud: number;
  sold_count: number;
  winning_score: number;
  trend: 'exploding' | 'growing' | 'stable';
  competition_level: 'low' | 'medium' | 'high';
  au_relevance: number;
  est_monthly_revenue_aud: number;
  est_daily_revenue_aud: number;
  units_per_day: number;
  why_winning: string;
  ad_angle: string;
  revenue_growth_pct: number;
  platforms: string[];
  image_url: string;
}

interface SearchCacheRow {
  id: string;
  query: string;
  results: ScoredProduct[];
  searched_at: string;
}

// ── Tavily helper ─────────────────────────────────────────────────────────────

async function tavilySearch(query: string): Promise<{ url: string; title: string; content: string }[]> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) throw new Error('TAVILY_API_KEY not configured');

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'basic',
      max_results: 5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { results?: { url: string; title: string; content: string }[] };
  return data.results ?? [];
}

// ── Claude Haiku extraction ───────────────────────────────────────────────────

async function extractProductsWithClaude(
  query: string,
  searchResults: { source: string; results: { url: string; title: string; content: string }[] }[],
): Promise<ScoredProduct[]> {
  const combinedText = searchResults
    .map(({ source, results }) => {
      const items = results
        .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
        .join('\n\n');
      return `=== ${source} ===\n${items}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a product intelligence analyst. Based on search results from TikTok Shop, AliExpress, Alibaba, and Amazon AU, extract the top 8 genuinely trending products with high sales volume.

For each product return JSON:
{
  "product_title": "exact product name",
  "category": "Health & Beauty | Pet | Fitness | Home & Kitchen | Tech | Fashion | Baby & Kids | Food | Sports | Auto",
  "platform": "TikTok Shop",
  "price_aud": <retail price>,
  "sold_count": <monthly units>,
  "winning_score": <60-95>,
  "trend": "exploding | growing | stable",
  "competition_level": "low | medium | high",
  "au_relevance": <75-99>,
  "est_monthly_revenue_aud": <realistic AUD, top products $50k-$500k>,
  "est_daily_revenue_aud": <monthly/30>,
  "units_per_day": <number>,
  "why_winning": "1 sentence from search signals",
  "ad_angle": "compelling hook for AU",
  "revenue_growth_pct": <percent>,
  "platforms": ["TikTok Shop","AliExpress"],
  "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop"
}
Only include products with est_monthly_revenue_aud > 30000. Return ONLY valid JSON array.`;

  const message = await callClaude({
    feature: 'product_search',
    maxTokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Query: "${query}"\n\nSearch results:\n\n${combinedText}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('[product-search] No JSON array found in Claude response');
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ScoredProduct[];
    return parsed.filter(
      (p) => p.est_monthly_revenue_aud > 30000,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[product-search] JSON parse error:', msg);
    return [];
  }
}

// ── Main search function ──────────────────────────────────────────────────────

export async function productSearch(
  query: string,
  userId?: string,
): Promise<{ products: ScoredProduct[]; cached: boolean; sources: string[] }> {
  const sb = getSupabaseAdmin();
  const sources = ['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU'];

  // 1. Check cache (within 6 hours)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await sb
    .from('search_cache')
    .select('*')
    .eq('query', query.toLowerCase().trim())
    .gte('searched_at', sixHoursAgo)
    .limit(1)
    .maybeSingle();

  if (cached) {
    // Log to user history if userId provided
    if (userId) {
      void sb.from('user_search_history').insert({
        user_id: userId,
        query: query.toLowerCase().trim(),
        searched_at: new Date().toISOString(),
      });
    }
    return {
      products: (cached as SearchCacheRow).results,
      cached: true,
      sources,
    };
  }

  // 2. Fire 4 parallel Tavily searches
  const queries = [
    `${query} TikTok Shop best seller 2025 revenue sales Australia`,
    `${query} AliExpress best seller orders reviews 2025`,
    `${query} Alibaba hot selling wholesale trending 2025`,
    `${query} Amazon Australia best seller ranking 2025`,
  ];

  const searchResults = await Promise.allSettled(
    queries.map((q, i) =>
      tavilySearch(q).then((results) => ({ source: sources[i], results })),
    ),
  );

  const validResults = searchResults
    .filter((r): r is PromiseFulfilledResult<{ source: string; results: { url: string; title: string; content: string }[] }> => r.status === 'fulfilled')
    .map((r) => r.value);

  if (validResults.length === 0) {
    console.warn('[product-search] All Tavily searches failed');
    return { products: [], cached: false, sources };
  }

  // 3. Extract products with Claude Haiku
  const products = await extractProductsWithClaude(query, validResults);

  if (products.length === 0) {
    return { products: [], cached: false, sources };
  }

  // 4. Cache results
  await sb
    .from('search_cache')
    .upsert(
      {
        query: query.toLowerCase().trim(),
        results: products,
        searched_at: new Date().toISOString(),
      },
      { onConflict: 'query' },
    );

  // 5. Upsert products into winning_products
  const productsToUpsert = products.map((p) => ({
    product_title: p.product_title,
    category: p.category,
    platform: p.platforms?.[0] ?? p.platform,
    price_aud: p.price_aud,
    sold_count: p.sold_count,
    winning_score: p.winning_score,
    trend: p.trend,
    competition_level: p.competition_level,
    au_relevance: p.au_relevance,
    est_daily_revenue_aud: p.est_daily_revenue_aud,
    units_per_day: p.units_per_day,
    why_winning: p.why_winning,
    ad_angle: p.ad_angle,
    image_url: p.image_url,
    source: 'search',
    updated_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
  }));

  void sb
    .from('winning_products')
    .upsert(productsToUpsert, { onConflict: 'product_title,platform' })
    .then(({ error }) => {
      if (error) console.warn('[product-search] Upsert warning:', error.message);
    });

  // 6. Log to user search history
  if (userId) {
    void sb.from('user_search_history').insert({
      user_id: userId,
      query: query.toLowerCase().trim(),
      searched_at: new Date().toISOString(),
    });
  }

  return { products, cached: false, sources };
}
