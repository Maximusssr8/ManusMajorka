/**
 * refresh-winning-products.ts
 *
 * Firecrawl-powered product intelligence refresh (Tavily as fallback).
 * Called by: POST /api/products/refresh (authenticated)
 * Also called by cron every 6h.
 *
 * Strategy:
 * 1. Firecrawl scrapes live AU ecommerce sources (Kogan, etc.)
 * 2. Claude Haiku extracts + scores real products with real images + prices
 * 3. Upsert into winning_products table
 * 4. Falls back to Tavily if Firecrawl returns 0 products
 */

import { fetchFirecrawlProducts, type WinningProduct } from './firecrawl-products';

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DB_URL = process.env.DATABASE_URL || '';

// ── Tavily fallback (legacy) ─────────────────────────────────────────────────
const SEARCH_QUERIES = [
  'trending TikTok Shop Australia products 2024 best seller dropshipping',
  'viral products Australia TikTok bestsellers health beauty fitness',
  'winning dropshipping products Australia high margin low competition',
];

async function fetchTavilyProducts(): Promise<WinningProduct[]> {
  if (!TAVILY_KEY) throw new Error('Missing TAVILY_API_KEY for fallback');

  const allContent: string[] = [];
  for (const query of SEARCH_QUERIES) {
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
      const data = (await res.json()) as {
        results?: Array<{ title: string; content: string; url: string }>;
      };
      if (data.results) {
        allContent.push(
          ...data.results.map(
            (r) => `TITLE: ${r.title}\nCONTENT: ${r.content?.slice(0, 300)}\nURL: ${r.url}`
          )
        );
      }
    } catch {
      /* continue */
    }
  }

  if (!allContent.length) throw new Error('No Tavily results');

  const prompt = `You are an Australian ecommerce product analyst. Based on these search results about trending products in Australia, extract up to 20 distinct winning products and score each one.

SEARCH RESULTS:
${allContent.slice(0, 15).join('\n---\n')}

Return ONLY a valid JSON array (no markdown, no fences) of product objects:
[
  {
    "product_title": "exact product name",
    "category": "one of: Health & Beauty | Pet | Fitness | Home & Kitchen | Tech | Fashion | Baby & Kids | Sports & Outdoors",
    "platform": "TikTok Shop",
    "price_aud": <number between 8-150>,
    "winning_score": <integer 50-99>,
    "trend": "one of: exploding | growing | stable | declining",
    "competition_level": "one of: Low | Medium | High",
    "au_relevance": <integer 60-99>,
    "est_daily_revenue_aud": <number>,
    "units_per_day": <number>,
    "why_winning": "1 sentence explanation",
    "ad_angle": "compelling hook for AU audience",
    "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&q=80",
    "tiktok_product_url": "",
    "sold_count": 0
  }
]`;

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

  const claudeData = (await claudeRes.json()) as { content?: Array<{ text: string }> };
  const raw = claudeData.content?.[0]?.text || '';

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenceMatch ? fenceMatch[1].trim() : raw.trim();
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1) {
    try {
      const products = JSON.parse(text.slice(arrStart, arrEnd + 1));
      return Array.isArray(products) ? products : [];
    } catch {
      /* failed to parse */
    }
  }
  return [];
}

// ── Supabase upsert ──────────────────────────────────────────────────────────
async function upsertProducts(products: WinningProduct[]): Promise<void> {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Try direct postgres if available (may fail on IPv6-only connections)
  if (DB_URL) {
    try {
      const { default: postgres } = await import('postgres');
      const sql = postgres(DB_URL, { ssl: 'require', max: 2, connect_timeout: 8 });
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
              price_aud = EXCLUDED.price_aud,
              image_url = EXCLUDED.image_url,
              est_daily_revenue_aud = EXCLUDED.est_daily_revenue_aud,
              why_winning = EXCLUDED.why_winning,
              ad_angle = EXCLUDED.ad_angle,
              updated_at = NOW()
          `;
        }
        return; // success via postgres
      } finally {
        await sql.end();
      }
    } catch (pgErr: any) {
      console.warn('[refresh] Direct postgres failed, falling back to REST API:', pgErr.message);
    }
  }

  // Fallback: Supabase REST API
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('No DB or Supabase credentials');

  for (const p of products) {
    await fetch(`${SUPABASE_URL}/rest/v1/winning_products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        ...p,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  }
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function refreshWinningProducts(): Promise<{ count: number; products: string[] }> {
  let products: WinningProduct[] = [];
  let source = 'firecrawl';

  // 1. Try Firecrawl first (real data)
  try {
    console.log('[refresh] Attempting Firecrawl product scrape...');
    products = await fetchFirecrawlProducts();
    console.log(`[refresh] Firecrawl returned ${products.length} products`);
  } catch (err: any) {
    console.warn('[refresh] Firecrawl failed:', err.message);
    products = [];
  }

  // 2. Fallback to Tavily if Firecrawl returned nothing
  if (!products.length) {
    console.warn('[refresh] Falling back to Tavily...');
    source = 'tavily';
    try {
      products = await fetchTavilyProducts();
      console.log(`[refresh] Tavily returned ${products.length} products`);
    } catch (err: any) {
      throw new Error(`Both Firecrawl and Tavily failed: ${err.message}`);
    }
  }

  if (!products.length) throw new Error('No products from any source');

  // 3. Upsert to Supabase
  console.log(`[refresh] Upserting ${products.length} products via ${source}...`);
  await upsertProducts(products);

  return {
    count: products.length,
    products: products.map((p) => p.product_title),
  };
}
