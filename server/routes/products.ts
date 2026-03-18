import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

interface ProductResult {
  id: string;
  title: string;
  image: string;
  price_aud: number;
  sold_count: string;
  rating: number;
  source: 'tiktok_shop' | 'aliexpress' | 'cached';
  product_url: string;
  platform_badge: string;
}

// GET /api/products/search?q=QUERY
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Query required (min 2 chars)' });
    return;
  }

  const supabase = getSupabase();
  const cacheKey = query.toLowerCase().slice(0, 100);

  // Check cache first (1 hour TTL)
  try {
    const { data: cached } = await supabase
      .from('product_search_cache')
      .select('results, cached_at')
      .eq('query', cacheKey)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at).getTime();
      if (age < 60 * 60 * 1000) {
        res.json({
          results: cached.results,
          total: (cached.results as any[]).length,
          query,
          source: 'cache',
        });
        return;
      }
    }
  } catch {
    // Cache miss or table doesn't exist yet — continue to live search
  }

  const results: ProductResult[] = [];
  const sociavaultKey = process.env.SOCIAVAULT_API_KEY || '';

  // Step 1: TikTok Shop via SociaVault
  if (sociavaultKey) {
    try {
      const apiRes = await fetch(
        `https://api.sociavault.com/v1/scrape/tiktok-shop/search?query=${encodeURIComponent(query)}&limit=20`,
        { headers: { 'X-Api-Key': sociavaultKey } }
      );
      const data: any = await apiRes.json();
      const productsObj: Record<string, any> = data?.data?.products ?? {};

      for (const p of Object.values(productsObj)) {
        const urlList: Record<string, string> = p?.image?.url_list ?? {};
        const image = urlList['0'] ?? (Object.values(urlList)[0] as string) ?? '';
        const priceUsd = parseFloat(p?.product_price_info?.sale_price_decimal ?? '0');
        const soldCount = p?.sold_info?.sold_count ?? 0;

        if (!p.title || !image) continue;

        results.push({
          id: p.product_id ?? `tiktok-${Math.random()}`,
          title: p.title,
          image,
          price_aud: priceUsd ? Math.round(priceUsd * 1.55 * 100) / 100 : 0,
          sold_count: soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k sold` : `${soldCount} sold`,
          rating: 4.5,
          source: 'tiktok_shop',
          product_url: p?.seo_url?.canonical_url ?? `https://www.tiktok.com/shop`,
          platform_badge: 'TikTok Shop',
        });
      }
    } catch (err: any) {
      console.error('[products/search] TikTok error:', err.message);
    }
  }

  // Step 2: AliExpress via ZenRows fallback (only if TikTok returned < 5)
  if (results.length < 5) {
    const zenRowsKey = process.env.ZENROWS_API_KEY || '';
    if (zenRowsKey) {
      try {
        const zenUrl = `https://api.zenrows.com/v1/?apikey=${zenRowsKey}&url=${encodeURIComponent(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`)}&js_render=true&premium_proxy=true`;
        const zenRes = await fetch(zenUrl, { signal: AbortSignal.timeout(20000) });
        const html = await zenRes.text();

        const ogItems = html.match(/"title":"([^"]+)","imageUrl":"([^"]+)","price":(\d+\.?\d*)/g) || [];
        ogItems.slice(0, 10).forEach((match, idx) => {
          const m = match.match(/"title":"([^"]+)","imageUrl":"([^"]+)","price":(\d+\.?\d*)/);
          if (m) {
            results.push({
              id: `ali-${idx}`,
              title: m[1],
              image: m[2],
              price_aud: Math.round(parseFloat(m[3]) * 1.55 * 100) / 100,
              sold_count: '',
              rating: 4.3,
              source: 'aliexpress',
              product_url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
              platform_badge: 'AliExpress',
            });
          }
        });
      } catch (err: any) {
        console.error('[products/search] ZenRows error:', err.message);
      }
    }
  }

  // Cache results in Supabase
  if (results.length > 0) {
    try {
      await supabase
        .from('product_search_cache')
        .upsert({ query: cacheKey, results, cached_at: new Date().toISOString() }, { onConflict: 'query' });
    } catch {
      // Cache write failure is non-fatal
    }
  }

  res.json({ results, total: results.length, query, source: results[0]?.source ?? 'none' });
});

export default router;
