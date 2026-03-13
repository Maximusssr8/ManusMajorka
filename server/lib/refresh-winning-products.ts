/**
 * refresh-winning-products.ts
 * 
 * Tavily-powered product intelligence refresh.
 * Called by: POST /api/products/refresh (authenticated)
 * Also called by n8n webhook every 6h.
 * 
 * Strategy:
 * 1. Tavily searches for trending AU products
 * 2. Claude Haiku scores + structures each product
 * 3. Upsert into winning_products table
 */

import postgres from 'postgres';

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DB_URL = process.env.DATABASE_URL || '';

interface ScoredProduct {
  product_title: string;
  category: string;
  platform: string;
  price_aud: number;
  winning_score: number;
  trend: string;
  competition_level: string;
  au_relevance: number;
  est_daily_revenue_aud: number;
  units_per_day: number;
  why_winning: string;
  ad_angle: string;
  image_url: string;
  tiktok_product_url: string;
  sold_count: number;
}

const SEARCH_QUERIES = [
  'trending TikTok Shop Australia products 2024 best seller dropshipping',
  'viral products Australia TikTok bestsellers health beauty fitness',
  'winning dropshipping products Australia high margin low competition',
  'TikTok made me buy it Australia trending gadgets home kitchen pet',
  'top selling products Australians buying online 2024 trending',
];

export async function refreshWinningProducts(): Promise<{ count: number; products: string[] }> {
  if (!TAVILY_KEY || !ANTHROPIC_KEY) {
    throw new Error('Missing TAVILY_API_KEY or ANTHROPIC_API_KEY');
  }

  // 1. Gather product signals from Tavily
  const allContent: string[] = [];
  for (const query of SEARCH_QUERIES.slice(0, 3)) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_KEY,
          query,
          search_depth: 'basic',
          max_results: 8,
        }),
      });
      const data = await res.json() as { results?: Array<{ title: string; content: string; url: string }> };
      if (data.results) {
        allContent.push(...data.results.map((r) => `TITLE: ${r.title}\nCONTENT: ${r.content?.slice(0, 300)}\nURL: ${r.url}`));
      }
    } catch { /* continue */ }
  }

  if (!allContent.length) throw new Error('No Tavily results');

  // 2. Claude Haiku extracts + scores up to 20 products
  const prompt = `You are an Australian ecommerce product analyst. Based on these search results about trending products in Australia, extract up to 20 distinct winning products and score each one.

SEARCH RESULTS:
${allContent.slice(0, 15).join('\n---\n')}

Return ONLY a valid JSON array (no markdown, no fences) of product objects:
[
  {
    "product_title": "exact product name",
    "category": "one of: Health & Beauty | Pet | Fitness | Home & Kitchen | Tech | Fashion | Baby & Kids",
    "platform": "TikTok Shop",
    "price_aud": <number between 8-150>,
    "winning_score": <integer 50-99 — how likely to sell well in AU>,
    "trend": "one of: exploding | growing | stable | declining",
    "competition_level": "one of: low | medium | high",
    "au_relevance": <integer 60-99>,
    "est_daily_revenue_aud": <number>,
    "units_per_day": <number>,
    "why_winning": "1 sentence explanation",
    "ad_angle": "compelling hook for AU audience",
    "image_url": "https://images.unsplash.com/photo-{relevant-id}?w=400&h=400&fit=crop",
    "tiktok_product_url": "",
    "sold_count": <integer>
  }
]

Return 15-20 products. Focus on products with AU relevance (Afterpay-friendly price points, suits AU climate/lifestyle). Winning score 80+ = must stock.`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const claudeData = await claudeRes.json() as { content?: Array<{ text: string }> };
  const raw = claudeData.content?.[0]?.text || '';

  // Parse the JSON
  let products: ScoredProduct[] = [];
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenceMatch ? fenceMatch[1].trim() : raw.trim();
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1) {
    try {
      products = JSON.parse(text.slice(arrStart, arrEnd + 1));
    } catch { /* failed to parse */ }
  }

  if (!products.length) throw new Error('Claude returned no products');

  // 3. Upsert into Supabase
  if (!DB_URL) {
    // Fallback: use Supabase REST API
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('No DB or Supabase credentials');

    for (const p of products) {
      await fetch(`${SUPABASE_URL}/rest/v1/winning_products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ ...p, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      });
    }
  } else {
    const sql = postgres(DB_URL, { ssl: 'require', max: 2, connect_timeout: 10 });
    try {
      for (const p of products) {
        await sql`
          INSERT INTO public.winning_products 
            (product_title, category, platform, price_aud, winning_score, trend, competition_level, 
             au_relevance, est_daily_revenue_aud, units_per_day, why_winning, ad_angle, 
             image_url, tiktok_product_url, sold_count, scraped_at, updated_at)
          VALUES (
            ${p.product_title}, ${p.category}, ${p.platform}, ${p.price_aud}, ${p.winning_score},
            ${p.trend}, ${p.competition_level}, ${p.au_relevance}, ${p.est_daily_revenue_aud},
            ${p.units_per_day}, ${p.why_winning}, ${p.ad_angle}, ${p.image_url},
            ${p.tiktok_product_url || ''}, ${p.sold_count || 0}, NOW(), NOW()
          )
          ON CONFLICT (product_title, platform) DO UPDATE SET
            winning_score = EXCLUDED.winning_score,
            trend = EXCLUDED.trend,
            est_daily_revenue_aud = EXCLUDED.est_daily_revenue_aud,
            why_winning = EXCLUDED.why_winning,
            updated_at = NOW()
        `;
      }
    } finally {
      await sql.end();
    }
  }

  return {
    count: products.length,
    products: products.map((p) => p.product_title),
  };
}
