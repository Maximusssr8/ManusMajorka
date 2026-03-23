// server/lib/productPipeline.ts
import { fetchTrendSignals } from './tavilyTrends';
import { searchAliAffiliateProducts } from './aliexpress-affiliate';
import { calculateTrendVelocity } from './trend-velocity';
// TikTok scraper intentionally excluded from pipeline (unreliable, blocks cron)
// import { searchTikTokShop } from './tiktok-shop-scraper';

const hasAffiliateKeys = (): boolean => {
  return !!(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
};

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '72000f9eeamsh375c31f96187909p1caf20jsn4494e614ec1b';
const PEXELS_KEY = process.env.PEXELS_API_KEY || 'EZjK9XGsizihc0Kr0mTGiQoglCY5kGQfOQ3QIKOLLODImTaxlg5ztpFB';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyMTQ0MCwiZXhwIjoyMDg3NTk3NDQwfQ.VTbTM5BCyAq843T1z1DRpkPI-0X7ZkAoD6K2q3sVX9Q';

const LIGHT_KEYWORDS = ['posture corrector','LED desk lamp','massage gun mini','dog harness','teeth whitening kit'];
const AU_HOT_KEYWORDS = ['posture','weighted blanket','massage gun','pet','teeth whitening','hair','smart home','LED'];
const AU_HIGH_DEMAND = ['dog','cat','pet','outdoor','garden','camping','fitness','wellness','coffee','skin','hair'];
const AU_LOW_DEMAND = ['snow','winter coat','fur lined','us plug','american'];

function parseOrders(text: string | undefined): number {
  if (!text) return 0;
  const m = String(text).replace(/,/g,'').match(/(\d+)\+?\s*(sold|orders)/i);
  return m ? parseInt(m[1]) : 0;
}

function scoreProduct(name: string, orders: number, rating: number, costAud: number, keyword: string) {
  const title = name.toLowerCase();
  let mult = costAud < 5 ? 5 : costAud < 15 ? 4 : costAud < 30 ? 3.5 : costAud < 60 ? 3 : 2.5;
  const retail = costAud * mult;
  const margin = Math.round(((retail - costAud) / retail) * 100);

  let orderScore = orders >= 5000 ? 25 : orders >= 1000 ? 20 : orders >= 500 ? 15 : orders >= 100 ? 10 : orders >= 50 ? 5 : 0;
  let marginScore = margin >= 65 ? 25 : margin >= 55 ? 20 : margin >= 45 ? 15 : margin >= 35 ? 8 : 0;
  let trendScore = AU_HOT_KEYWORDS.some(k => title.includes(k.toLowerCase()) || keyword.toLowerCase().includes(k.toLowerCase())) ? 15 : 8;
  let supplierScore = rating >= 4.8 ? 15 : rating >= 4.5 ? 12 : rating >= 4.0 ? 8 : rating >= 3.5 ? 3 : 0;
  const hasAuDemand = AU_HIGH_DEMAND.some(k => title.includes(k));
  const hasAuProblem = AU_LOW_DEMAND.some(k => title.includes(k));
  let auFitScore = hasAuProblem ? 0 : hasAuDemand ? 15 : 8;

  const total = orderScore + marginScore + trendScore + supplierScore + auFitScore;
  const passes = orders >= 50 && margin >= 30 && rating >= 3.5 && !hasAuProblem;

  return {
    winning_score: Math.min(95, Math.max(50, Math.round(total))),
    passes,
    margin: Math.min(75, Math.max(30, margin)),
    retail: Math.round(retail * 100) / 100,
    score_breakdown: { order_score: orderScore, margin_score: marginScore, trend_score: trendScore, supplier_score: supplierScore, au_fit_score: auFitScore },
  };
}

async function fetchKeyword(keyword: string): Promise<any[]> {
  try {
    const url = new URL('https://aliexpress-datahub.p.rapidapi.com/item_search_3');
    url.searchParams.set('q', keyword);
    url.searchParams.set('page', '1');
    const r = await fetch(url.toString(), {
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com' },
    });
    if (!r.ok) return [];
    const data: any = await r.json();
    const items = data?.result?.resultList || data?.result?.items || [];
    return items.slice(0, 6).map((item: any) => {
      const d = item.item || item;
      const costAud = parseFloat(String(d.sku?.def?.promotionPrice || d.price || '8').replace(/[^0-9.]/g, '')) * 1.55;
      return {
        name: (d.title || keyword).substring(0, 120),
        aliexpress_id: String(d.itemId || ''),
        image_raw: d.image || '',
        cost_aud: isNaN(costAud) || costAud < 1 ? 8 + Math.random() * 12 : costAud,
        orders_count: parseOrders(d.tradeDesc || ''),
        rating: parseFloat(String(d.starRating || '4.1')) || 4.1,
        keyword,
      };
    }).filter((p: any) => p.name.length > 8);
  } catch { return []; }
}

export async function runProductPipeline(light = false): Promise<{ inserted: number }> {
  const keywords = light ? LIGHT_KEYWORDS : LIGHT_KEYWORDS;
  const allRaw: any[] = [];
  for (let i = 0; i < keywords.length; i += 3) {
    const results = await Promise.all(keywords.slice(i, i + 3).map(fetchKeyword));
    for (const items of results) allRaw.push(...items);
    await new Promise(r => setTimeout(r, 500));
  }

  const seen = new Set<string>();
  const deduped = allRaw
    .filter(p => { const k = p.name.toLowerCase().substring(0, 35); if (seen.has(k)) return false; seen.add(k); return true; });

  // Fetch Tavily trend signals for unique keywords (limit to 10 for server-side)
  const kwList = [...new Set(deduped.map((p: any) => p.keyword as string))];
  const trendSignals = kwList.length > 0 ? await fetchTrendSignals(kwList.slice(0, 10)) : {};

  // Apply signals to products before scoring
  const withSignals = deduped.map((p: any) => ({
    ...p,
    tavily_boost: trendSignals[p.keyword]?.trendBoost || 5,
    tavily_mentions: trendSignals[p.keyword]?.mentions || 0,
    tiktok_signal: trendSignals[p.keyword]?.hasTikTok || false,
  }));

  const scored = withSignals
    .map(p => { const s = scoreProduct(p.name, p.orders_count, p.rating, p.cost_aud, p.keyword); return { ...p, ...s }; })
    .filter(p => p.passes && p.winning_score >= 55)
    .sort((a, b) => b.winning_score - a.winning_score)
    .slice(0, 50);

  if (!scored.length) return { inserted: 0 };

  // Build tags array for each product
  function buildTags(p: any): string[] {
    const tags: string[] = [];
    if (p.orders_count >= 5000) tags.push('VIRAL');
    if (p.margin >= 50) tags.push('HIGH MARGIN');
    if (p.tavily_mentions >= 2) tags.push('IN THE NEWS');
    if (p.tiktok_signal) tags.push('TIKTOK');
    if (AU_HIGH_DEMAND.some(k => p.name.toLowerCase().includes(k))) tags.push('AU DEMAND');
    if (p.orders_count >= 2000) tags.push('AU BEST SELLERS');
    if (tags.length === 0) tags.push('TRENDING');
    return tags;
  }

  // Fetch real affiliate images in batches with 400ms delay
  const enriched = [];
  for (const p of scored) {
    let realImage: string | null = null;
    let affiliateUrl: string | null = null;

    // Try affiliate API if keys are configured
    if (hasAffiliateKeys()) {
      try {
        const affResults = await searchAliAffiliateProducts(p.name.split(' ').slice(0, 4).join(' '), 1);
        if (affResults.length > 0) {
          realImage = affResults[0].image || null;
          affiliateUrl = affResults[0].affiliate_url || null;
        }
        await new Promise(r => setTimeout(r, 400)); // rate limit
      } catch (err) {
        console.warn('[pipeline] affiliate image fetch failed for', p.name, err instanceof Error ? err.message : '');
      }
    }

    // Calculate trend velocity (Tavily-powered)
    let velocity: { label: string; score: number; peak_in_days: number | null; curve: any[]; confidence: string } | null = null;
    try {
      await new Promise(r => setTimeout(r, 600));
      velocity = await calculateTrendVelocity(p.name);
    } catch {
      // silent fail
    }

    // Image priority: 1. AliExpress Affiliate API, 2. Pexels fallback, 3. NoImage (handled in frontend)
    const finalImage = realImage || p.image_raw || null;
    const finalUrl = affiliateUrl || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(p.name)}&shipCountry=au`;

    enriched.push({
      product_title: p.name,
      category: p.keyword,
      search_keyword: p.keyword,
      aliexpress_url: finalUrl,
      aliexpress_id: p.aliexpress_id,
      shop_name: 'AliExpress',
      image_url: finalImage,
      cost_price_aud: Math.round(p.cost_aud * 100) / 100,
      price_aud: p.retail,
      profit_margin: p.margin,
      est_monthly_revenue_aud: Math.round(p.orders_count * 30 * p.retail / 365 * 0.3),
      orders_count: p.orders_count,
      units_per_day: Math.max(1, Math.round(p.orders_count / 365)),
      winning_score: p.winning_score,
      rating: p.rating,
      tags: buildTags(p),
      score_breakdown: { ...p.score_breakdown, tavily_mentions: p.tavily_mentions || 0, tiktok_signal: p.tiktok_signal || false },
      tiktok_signal: p.tiktok_signal || false,
      velocity_label: velocity?.label || null,
      velocity_score: velocity?.score || null,
      peak_in_days: velocity?.peak_in_days || null,
      velocity_curve: velocity?.curve ? JSON.stringify(velocity.curve) : null,
      velocity_confidence: velocity?.confidence || null,
      source: 'rapidapi_datahub',
      updated_at: new Date().toISOString(),
    });
  }

  let inserted = 0;
  for (let i = 0; i < enriched.length; i += 25) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/winning_products`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(enriched.slice(i, i + 25)),
    });
    if (r.ok || r.status === 201) inserted += Math.min(25, enriched.length - i);
  }
  return { inserted };
}
