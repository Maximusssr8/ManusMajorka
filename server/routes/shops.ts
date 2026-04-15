import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireSubscription } from '../middleware/requireSubscription';
import { createClient } from '@supabase/supabase-js';
import { callClaude } from '../lib/claudeWrap';
import { claudeRateLimit } from '../middleware/claudeRateLimit';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function requireAdmin(req: Request, res: Response, next: Function) {
  const email = (req as any).user?.email || (req as any).subscription?.email || '';
  if (email !== 'maximusmajorka@gmail.com') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// GET /api/shops — list shops with filters
router.get('/', requireAuth, requireSubscription, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { niche, sortBy = 'est_revenue_aud', minRevenue, maxRevenue, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from('shop_intelligence').select('*', { count: 'exact' });

    if (niche && niche !== 'all') query = query.eq('niche', niche);
    if (search) query = query.ilike('shop_name', `%${search}%`);
    if (minRevenue) query = query.gte('est_revenue_aud', parseFloat(minRevenue));
    if (maxRevenue) query = query.lte('est_revenue_aud', parseFloat(maxRevenue));

    const validSorts = ['est_revenue_aud', 'growth_rate_pct', 'items_sold_est', 'avg_unit_price_aud'];
    const sortCol = validSorts.includes(sortBy) ? sortBy : 'est_revenue_aud';
    query = query.order(sortCol, { ascending: false });
    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      shops: data || [],
      total: count || 0,
      page: pageNum,
      pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err: any) {
    console.error('[shops] GET / error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shops/:id — single shop detail
router.get('/:id', requireAuth, requireSubscription, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('shop_intelligence')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    // Get similar shops in same niche
    const { data: similar } = await supabase
      .from('shop_intelligence')
      .select('id, shop_name, niche, est_revenue_aud, growth_rate_pct, shop_type')
      .eq('niche', data.niche)
      .neq('id', data.id)
      .order('est_revenue_aud', { ascending: false })
      .limit(3);

    res.json({ ...data, similar_shops: similar || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shops/seed — seed 50 AU shops via Haiku
router.post('/seed', requireAuth, requireSubscription, requireAdmin, claudeRateLimit, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!hasAnthropicKey()) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
      return;
    }

    // Check if already seeded
    const { count } = await supabase.from('shop_intelligence').select('id', { count: 'exact', head: true });
    if ((count || 0) >= 30) {
      res.json({ message: `Already seeded (${count} shops)`, count });
      return;
    }

    const niches = [
      'Activewear & Gym', 'Beauty & Skincare', 'Health & Wellness', 'Tech Accessories',
      'Home Decor', 'Pets & Animals', 'Fashion & Apparel', 'Jewellery & Accessories',
      'Outdoor & Camping', 'Baby & Kids', 'Coffee & Beverages', 'Supplements & Nutrition',
      'Electronics', 'Office & Stationery', 'Garden & Plants', 'Sports Equipment',
      'Travel Accessories', 'Food & Gourmet', 'Automotive', 'Home & Kitchen',
    ];

    const prompt = `Generate 50 realistic Australian Shopify store profiles for a dropshipper research tool.
Return ONLY a valid JSON array with exactly 50 objects. No markdown, no explanation.

Each object must have these exact fields:
{
  "shop_name": string (realistic Australian brand name, e.g. "SunCoast Active", "BarrelHouse Coffee"),
  "shop_domain": string (shopname.com.au format),
  "niche": string (must be one of: ${niches.join(', ')}),
  "shop_type": string ("dropship" | "brand" | "print-on-demand"),
  "est_revenue_aud": number (monthly revenue, RANGE: 3000-600000, most 5000-80000, 5 stores over 200k),
  "revenue_trend": array of 7 numbers (weekly revenue, realistic fluctuation ±15% around est_revenue_aud/4),
  "growth_rate_pct": number (between -35 and 180, most 0-40, a few negative, few over 100),
  "items_sold_est": number (monthly units, proportional to revenue/avg_unit_price),
  "avg_unit_price_aud": number (15-250, must match niche),
  "best_selling_products": [{"name": string, "imageQuery": string}] (exactly 3 items, imageQuery = Unsplash search term),
  "affiliate_revenue_aud": number (5-20% of est_revenue_aud),
  "ad_spend_est_aud": number (15-35% of est_revenue_aud),
  "founded_year": number (2017-2024)
}

Spread across all ${niches.length} niches (2-3 per niche). Mix shop_types. Make data feel real.`;

    const message = await callClaude({
      feature: 'shops_seed',
      userId: (req as any).user?.userId,
      maxTokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error('No JSON array found in Haiku response');

    const shops = JSON.parse(arrayMatch[0]) as Record<string, unknown>[];
    if (!Array.isArray(shops) || shops.length === 0) throw new Error('Invalid shops array');

    // Add Unsplash image URLs to best_selling_products
    const NICHE_PHOTOS: Record<string, string[]> = {
      'Activewear & Gym': ['1571019614242-c5c5dee9f50b','1544367567-0f2fcb009e0b'],
      'Beauty & Skincare': ['1556228578-8c89e6adf883','1614806687397-71b4f8f07b24'],
      'Health & Wellness': ['1498837167922-ddd27525d352','1506126613408-eca07ce68773'],
      'Tech Accessories': ['1518770660439-4636190af475','1526374965328-7f61d4dc18c5'],
      'Home Decor': ['1555041469-db61b0f11e79','1616046229478-9901369df64b'],
      'Pets & Animals': ['1543466835-00a7907e9de1','1548199973-03cce0bbc87b'],
      'Fashion & Apparel': ['1445205170230-053b83016050','1490481651871-ab68de25d43d'],
      'Jewellery & Accessories': ['1535632066927-ab7c9ab60908','1611591437281-460bfbe1220a'],
      'Outdoor & Camping': ['1506905925346-21bda4d32df4','1504851149312-7a075b496cc7'],
      'Baby & Kids': ['1515488042361-ee00e0ddd4e4','1622290291468-a28f7a7dc6a8'],
      'Coffee & Beverages': ['1495474472287-4d71bcdd2085','1509042239860-f550ce710b93'],
      'Supplements & Nutrition': ['1490645935967-10de6ba17061','1571019614242-c5c5dee9f50b'],
      'Electronics': ['1518770660439-4636190af475','1550009158-9ebf69173e03'],
      'Office & Stationery': ['1497032628192-86f99bcd76bc','1486312338219-ce68d2c6f44d'],
      'Garden & Plants': ['1416879595882-3373a0480b5b','1466692476868-adc745f3e0b8'],
      'Sports Equipment': ['1461896836878-5bd68e4a6eb6','1517836357463-d25dfeac3438'],
      'Travel Accessories': ['1476514525535-07fb3b4ae5f1','1528360983277-13d401cdc186'],
      'Food & Gourmet': ['1495474472287-4d71bcdd2085','1447933601403-0c6688de566e'],
      'Automotive': ['1492144534655-ae79c964c9d7','1486262715619-67b85e0b08d3'],
      'Home & Kitchen': ['1556909114-f6e7ad7d3136','1565183928294-7063f23ce0f8'],
    };

    const enriched = shops.map((shop: Record<string, unknown>) => {
      const photoIds = NICHE_PHOTOS[shop.niche as string] || ['1441986300917-64674bd600d8','1560472354-b33ff0ad5a3b'];
      const products = ((shop.best_selling_products as { name: string; imageQuery: string }[]) || []).map((p: { name: string; imageQuery: string }, i: number) => ({
        name: p.name,
        imageUrl: `https://images.unsplash.com/photo-${photoIds[i % photoIds.length]}?w=120&h=120&fit=crop&q=80&auto=format`,
      }));
      return { ...shop, best_selling_products: products, refreshed_at: new Date().toISOString() };
    });

    // Upsert in batches of 10
    let inserted = 0;
    for (let i = 0; i < enriched.length; i += 10) {
      const batch = enriched.slice(i, i + 10);
      const { error: insertErr } = await supabase.from('shop_intelligence').insert(batch);
      if (insertErr) console.warn('[shops] Insert batch error:', insertErr.message);
      else inserted += batch.length;
    }

    res.json({ success: true, seeded: inserted, total: enriched.length });
  } catch (err: any) {
    console.error('[shops] Seed error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shops/analyse/:id — AI analysis of a single shop
router.post('/analyse/:id', requireAuth, requireSubscription, claudeRateLimit, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: shop } = await supabase.from('shop_intelligence').select('*').eq('id', req.params.id).single();
    if (!shop) { res.status(404).json({ error: 'Shop not found' }); return; }
    if (!hasAnthropicKey()) { res.status(500).json({ error: 'AI not configured' }); return; }

    const prompt = `You are a dropshipping and ecommerce strategist. Analyse this Australian Shopify store:

Shop: ${shop.shop_name} (${shop.shop_domain})
Niche: ${shop.niche}
Type: ${shop.shop_type}
Est. Monthly Revenue: $${shop.est_revenue_aud?.toLocaleString()} AUD
Growth Rate: ${shop.growth_rate_pct}%
Items Sold/Month: ${shop.items_sold_est}
Avg Unit Price: $${shop.avg_unit_price_aud} AUD
Ad Spend Est: $${shop.ad_spend_est_aud?.toLocaleString()} AUD/month
Founded: ${shop.founded_year}
Best Sellers: ${JSON.stringify(shop.best_selling_products)}

Return JSON only (no markdown):
{
  "why_succeeding": ["point 1", "point 2", "point 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "competing_angle": "specific niche angle to compete with",
  "ad_spend_range": "estimated monthly range e.g. $2k-$5k AUD",
  "copy_strategy_score": number (1-10, how much to emulate their strategy),
  "recommended_products": ["product 1", "product 2", "product 3"],
  "summary": "2 sentence summary of opportunity"
}`;

    const message = await callClaude({
      feature: 'shops_analyse',
      userId: (req as any).user?.userId,
      maxTokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const jsonStr = raw.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(jsonStr);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
