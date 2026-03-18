import { Router } from 'express';
import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const NICHE_IMAGE_QUERIES: Record<string, string> = {
  'Tech Accessories': 'technology,gadgets',
  'Health & Wellness': 'wellness,health',
  'Beauty & Skincare': 'skincare,beauty',
  'Activewear & Gym': 'fitness,gym',
  'Home Decor': 'interior,homedecor',
  'Home & Kitchen': 'kitchen,home',
  'Pets & Animals': 'pets,dog',
  'Fashion & Apparel': 'fashion,clothing',
  'Outdoor & Camping': 'outdoor,nature',
  'Baby & Kids': 'baby,children',
  'Jewellery & Accessories': 'jewelry,accessories',
  'Coffee & Beverages': 'coffee,cafe',
  'Supplements & Nutrition': 'supplements,nutrition',
  'Electronics': 'electronics,technology',
  'Sports Equipment': 'sports,equipment',
  'Travel Accessories': 'travel,luggage',
  'Garden & Plants': 'garden,plants',
  'Art & Craft': 'art,craft',
  'Office & Stationery': 'office,desk',
  'Food & Gourmet': 'food,gourmet',
  'Cleaning & Organisation': 'cleaning,minimal',
  'Automotive': 'car,automotive',
  'Photography': 'photography,camera',
  'Music & Audio': 'music,headphones',
};

function getUnsplashUrl(niche: string): string {
  const query = NICHE_IMAGE_QUERIES[niche] || niche.toLowerCase().replace(/\s*&\s*/g, ',').replace(/\s+/g, ',');
  return `https://source.unsplash.com/200x200/?${encodeURIComponent(query)}`;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

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

function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.authorization || '';
  const secret = process.env.CRON_SECRET || '';
  if (!secret) {
    // No secret configured — only allow from Vercel cron (checks user-agent) or localhost
    const userAgent = req.headers['user-agent'] || '';
    const isVercelCron = userAgent.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
    const isLocal = (req.headers.host || '').includes('localhost');
    return isVercelCron || isLocal;
  }
  return auth === `Bearer ${secret}`;
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

router.get('/refresh-trends', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

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

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 5000,
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
    // Extract JSON array — handles markdown fences and truncated responses
    let products: any[] = [];
    try {
      // Try full array match first
      const arrayMatch = rawText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        products = JSON.parse(arrayMatch[0]);
      } else {
        // Truncated — extract complete objects via regex
        const objMatches = rawText.matchAll(/\{[^{}]*"name"[^{}]*\}/g);
        for (const m of objMatches) {
          try { products.push(JSON.parse(m[0])); } catch { /* skip malformed */ }
        }
        if (products.length === 0) throw new Error('No JSON found');
      }
    } catch {
      return res.status(500).json({ error: 'Claude parse failed', raw: rawText.slice(0, 200) });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(500).json({ error: 'No valid products returned' });
    }

    const supabase = getSupabaseAdmin();

    // Fetch images for all products in parallel (Pexels free API, ~50 reqs/hr limit)
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
      // New rich fields
      est_monthly_revenue_aud: p.est_monthly_revenue_aud || Math.round(p.estimated_retail_aud * (p.items_sold_monthly || 200) * 0.5),
      revenue_trend: Array.isArray(p.revenue_trend) && p.revenue_trend.length === 7 ? p.revenue_trend : generateFallbackTrend(p.est_monthly_revenue_aud || 20000),
      items_sold_monthly: p.items_sold_monthly || Math.round((p.est_monthly_revenue_aud || 20000) / (p.estimated_retail_aud || 49)),
      growth_rate_pct: p.growth_rate_pct ?? Math.floor(Math.random() * 60 + 5),
      creator_handles: Array.isArray(p.creator_handles) ? p.creator_handles : generateCreatorHandles(p.niche),
      avg_unit_price_aud: p.avg_unit_price_aud || p.estimated_retail_aud,
      saturation_score: p.saturation_score || Math.floor(Math.random() * 5 + 4),
      winning_score: p.winning_score || Math.floor(p.trend_score * 0.8 + p.dropship_viability_score * 2),
      ad_count_est: p.ad_count_est || Math.floor(Math.random() * 200 + 20),
      image_url: (imageUrls[i].status === 'fulfilled' && imageUrls[i].value) ? imageUrls[i].value : getUnsplashUrl(p.niche || ''),
      refreshed_at: new Date().toISOString(),
      source: 'cron',
    }));

    // Try full upsert first (with new columns)
    let { error: upsertError } = await supabase
      .from('trend_signals')
      .upsert(rows, { onConflict: 'name' });

    // If new columns don't exist yet, fall back to base columns only
    if (upsertError && (upsertError.message?.includes('column') || upsertError.message?.includes('schema'))) {
      console.warn('[cron] New columns not yet in table — falling back to base columns:', upsertError.message);
      const baseRows = rows.map(({ est_monthly_revenue_aud, revenue_trend, items_sold_monthly, growth_rate_pct, creator_handles, avg_unit_price_aud, saturation_score, winning_score, ad_count_est, ...base }) => base);
      const { error: fallbackError } = await supabase
        .from('trend_signals')
        .upsert(baseRows, { onConflict: 'name' });
      upsertError = fallbackError;
    }

    if (upsertError) {
      console.error('[cron/refresh-trends] upsert error:', upsertError.message);
      return res.json({ ok: true, count: products.length, saved: false, error: upsertError.message });
    }

    return res.json({ ok: true, count: products.length, saved: true, refreshed_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('[cron/refresh-trends]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/refresh-shops — weekly Sunday regeneration
router.get('/refresh-shops', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('shop_intelligence').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    res.json({ success: true, message: 'Shop data cleared — re-seed via /api/shops/seed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
