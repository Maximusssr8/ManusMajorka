import { Router } from 'express';
import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
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
      messages: [{
        role: 'user',
        content: `You are a product research expert for Australian dropshippers.

Analyse this search data and extract EXACTLY 25 trending products suitable for Australian dropshipping.

STRICT FILTERS — only include products that:
- Retail price: $15-150 AUD
- Lightweight, shippable from China to AU in 7-14 days
- High perceived value relative to cost
- NOT: TVs, large appliances, food, alcohol, medicine, branded/trademarked goods, items needing AU electrical certification

Search data:
${allContent.slice(0, 8000)}

Return a JSON array of exactly 25 products:
[{
  "name": "Product Name",
  "niche": "Beauty & Skincare | Health & Wellness | Home Decor | Tech Accessories | Fashion | Pets | Fitness | Other",
  "estimated_retail_aud": 49,
  "estimated_margin_pct": 55,
  "trend_score": 82,
  "dropship_viability_score": 8,
  "trend_reason": "One sentence why this is trending in Australia right now",
  "image_search_term": "product photo search term for stock image"
}]

trend_score: 1-100 (how hot right now)
dropship_viability_score: 1-10 (ONLY include score 6+)
Only output the JSON array. No markdown.`
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
      image_url: imageUrls[i].status === 'fulfilled' ? imageUrls[i].value : null,
      refreshed_at: new Date().toISOString(),
      source: 'cron',
    }));

    const { error: upsertError } = await supabase
      .from('trend_signals')
      .upsert(rows, { onConflict: 'name' });

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

export default router;
