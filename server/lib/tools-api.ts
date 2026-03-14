/**
 * Tools API — Server-side endpoints for Majorka research & intelligence tools.
 *
 * Registers Express routes for:
 *   POST /api/tools/winning-products   — Tavily-powered AU product research (legacy)
 *   POST /api/tools/store-spy
 *   POST /api/tools/saturation-check
 *   POST /api/tools/daily-products-subscribe
 *   POST /api/products/refresh          — Manual trigger for product data refresh (auth, 1/hr)
 */

import Firecrawl from '@mendable/firecrawl-js';
import type { Application } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';
import { CLAUDE_MODEL, getAnthropicClient } from './anthropic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tavilySearch(query: string, maxResults = 5): Promise<any> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) throw new Error('TAVILY_API_KEY is not configured.');
  const sr = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
    }),
  }).then((r) => r.json());
  return sr;
}

async function authenticateRequest(req: any): Promise<{ userId: string; email: string } | null> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const {
    data: { user },
  } = await getSupabaseAdmin().auth.getUser(token);
  if (!user) return null;
  return { userId: user.id, email: user.email ?? '' };
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

// ── In-memory rate limiters ──────────────────────────────────────────────────
const refreshLimiter = new Map<string, number>(); // userId → last triggered ms
const trendsRefreshLimiter = new Map<string, number>(); // userId → last triggered ms
const REFRESH_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// ── Free tier usage tracking (10 AI calls/day) ───────────────────────────────
const FREE_TIER_DAILY_LIMIT = 10;

async function getUserPlan(userId: string): Promise<string> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('user_subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();
    if (data?.plan === 'pro' && data?.status === 'active') return 'pro';
  } catch { /* table might not exist yet */ }
  return 'free';
}

async function trackAndCheckUsage(userId: string, toolName: string): Promise<{ allowed: boolean; used: number }> {
  try {
    const sb = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Count today's usage
    const { count } = await sb
      .from('usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('date', today);

    const used = count ?? 0;
    if (used >= FREE_TIER_DAILY_LIMIT) {
      return { allowed: false, used };
    }

    // Track this call
    await sb.from('usage_tracking').insert({
      user_id: userId,
      tool_name: toolName,
      date: today,
    });

    return { allowed: true, used: used + 1 };
  } catch (err: any) {
    console.warn('[usage-tracking] DB error, allowing request:', err.message);
    return { allowed: true, used: 0 }; // fail open — don't block if DB is down
  }
}

/**
 * Check if a user has exceeded their free tier limit.
 * Returns 402 response if limit hit, otherwise null (proceed).
 */
export async function checkFreeTierLimit(
  req: any,
  res: any,
  toolName: string
): Promise<boolean> {
  const authUser = await authenticateRequest(req);
  if (!authUser) return true; // unauthenticated handled elsewhere

  const plan = await getUserPlan(authUser.userId);
  if (plan === 'pro') return true; // unlimited

  const { allowed, used } = await trackAndCheckUsage(authUser.userId, toolName);
  if (!allowed) {
    res.status(402).json({
      error: 'limit_reached',
      message: `You've used all ${FREE_TIER_DAILY_LIMIT} free searches today. Upgrade to Pro for unlimited access.`,
      upgrade_url: '/pricing',
      used,
      limit: FREE_TIER_DAILY_LIMIT,
    });
    return false;
  }
  return true;
}

export function registerToolsApi(app: Application): void {

  // -----------------------------------------------------------------------
  // 0. POST /api/products/refresh  — manual refresh trigger
  // -----------------------------------------------------------------------
  app.post('/api/products/refresh', async (req, res) => {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized — Bearer token required' });
      return;
    }

    const now = Date.now();
    const lastRun = refreshLimiter.get(authUser.userId) ?? 0;
    const nextAllowedAt = new Date(lastRun + REFRESH_COOLDOWN_MS).toISOString();

    if (now - lastRun < REFRESH_COOLDOWN_MS) {
      res.status(429).json({ error: 'Rate limited — 1 refresh per hour', nextAllowedAt });
      return;
    }

    refreshLimiter.set(authUser.userId, now);

    // Run Tavily-based refresh directly (no webhook needed)
    const nextAt = new Date(now + REFRESH_COOLDOWN_MS).toISOString();
    try {
      const { refreshWinningProducts } = await import('./refresh-winning-products.js');
      // Run in background — don't block the response
      refreshWinningProducts()
        .then((result) => {
          console.log(`[products/refresh] ✅ ${result.count} products upserted`);
        })
        .catch((err) => {
          console.error('[products/refresh] ❌ refresh error:', err.message);
        });
      res.json({ triggered: true, message: 'Product refresh started — new products will appear shortly', nextAllowedAt: nextAt });
    } catch (err: any) {
      res.json({ triggered: false, message: `Refresh error: ${err.message}`, nextAllowedAt: nextAt });
    }
  });
  // -----------------------------------------------------------------------
  // POST /api/trends/refresh — manual trigger for trend detection (auth, 1/hr)
  // -----------------------------------------------------------------------
  app.post('/api/trends/refresh', async (req, res) => {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized — Bearer token required' });
      return;
    }

    const now = Date.now();
    const lastRun = trendsRefreshLimiter.get(authUser.userId) ?? 0;
    const nextAllowedAt = new Date(lastRun + REFRESH_COOLDOWN_MS).toISOString();

    if (now - lastRun < REFRESH_COOLDOWN_MS) {
      res.status(429).json({ error: 'Rate limited — 1 refresh per hour', nextAllowedAt });
      return;
    }

    trendsRefreshLimiter.set(authUser.userId, now);

    const nextAt = new Date(now + REFRESH_COOLDOWN_MS).toISOString();
    try {
      const { detectTrends } = await import('./trend-detection.js');
      detectTrends()
        .then((trends) => {
          console.log(`[trends/refresh] ✅ ${trends.length} trend signals refreshed`);
        })
        .catch((err: Error) => {
          console.error('[trends/refresh] ❌ error:', err.message);
        });
      res.json({ triggered: true, message: 'Trend detection started — new trends will appear shortly', nextAllowedAt: nextAt });
    } catch (err: any) {
      res.json({ triggered: false, message: `Trend refresh error: ${err.message}`, nextAllowedAt: nextAt });
    }
  });

  // -----------------------------------------------------------------------
  // 1. POST /api/tools/winning-products
  // -----------------------------------------------------------------------
  app.post('/api/tools/winning-products', async (req, res) => {
    // Free tier check — 10 AI calls/day for free users
    const allowed = await checkFreeTierLimit(req, res, 'winning-products');
    if (!allowed) return;

    try {
      const { category, priceRange, platform } = req.body ?? {};

      // Build search query
      let searchQuery = 'trending dropshipping products Australia 2025';
      if (category) searchQuery += ` ${category}`;
      if (platform) searchQuery += ` ${platform}`;

      const searchResults = await tavilySearch(searchQuery, 8);

      const resultsText = (searchResults.results ?? [])
        .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content ?? ''}`)
        .join('\n\n---\n\n');

      const priceContext = priceRange
        ? `The user is looking for products in the ${priceRange} AUD price range.`
        : '';
      const platformContext = platform ? `Preferred platform: ${platform}.` : '';

      const claude = getAnthropicClient();
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are an expert Australian dropshipping product researcher. Analyse the following search results about trending products and return a JSON array of winning product opportunities for the Australian market.

${priceContext}
${platformContext}

Search results:
${resultsText}

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "products": [
    {
      "name": "Product Name",
      "description": "Short description of the product and why it's trending",
      "estimatedPriceAUD": "$XX.XX",
      "trendReason": "Why this product is trending in AU right now",
      "platform": "Best platform to sell on (Shopify AU, eBay AU, Amazon AU, etc.)",
      "marginEstimate": "Estimated margin percentage e.g. 40-60%",
      "competitionLevel": "Low | Medium | High",
      "trendScore": 85,
      "imageQuery": "search query to find product images"
    }
  ]
}

Rules:
- All prices in AUD
- Include 5-8 products
- trendScore is 1-100, based on your assessment of trend strength in AU
- competitionLevel should reflect the AU market specifically
- Be specific and opinionated — no vague descriptions
- Reference AU-specific platforms and consumer behaviour`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { products: [] };
      }

      res.json(parsed);
    } catch (err: any) {
      console.error('[winning-products] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 2. POST /api/tools/store-spy
  // -----------------------------------------------------------------------
  app.post('/api/tools/store-spy', async (req, res) => {
    const allowed = await checkFreeTierLimit(req, res, 'store-spy');
    if (!allowed) return;

    try {
      const { url } = req.body ?? {};
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'A valid store URL is required.' });
        return;
      }

      const firecrawlKey = process.env.FIRECRAWL_API_KEY;
      if (!firecrawlKey) {
        res.status(500).json({ error: 'FIRECRAWL_API_KEY is not configured.' });
        return;
      }

      // Use Firecrawl REST API directly (SDK v4 broke scrapeUrl)
      const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 20000 }),
      });
      const fcData = await fcRes.json();
      const scrapeResult = fcData;

      const scrapedContent =
        fcData?.data?.markdown ??
        fcData?.markdown ??
        fcData?.content ??
        JSON.stringify(fcData).slice(0, 5000);

      const claude = getAnthropicClient();
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are an elite ecommerce intelligence analyst specialising in the Australian market. Analyse this scraped Shopify store data and produce a comprehensive competitive intelligence report.

Store URL: ${url}

Scraped content:
${scrapedContent.slice(0, 12000)}

Produce a detailed markdown report covering:

## Store Overview
- Brand name, niche, positioning, estimated monthly revenue range (AUD)
- Theme/design quality assessment (1-10)

## Trust Signals
- Reviews, testimonials, social proof, trust badges
- Payment methods (especially Afterpay/Zip presence)
- Shipping & returns policy quality

## Ad Spend Signals
- Evidence of paid traffic (Facebook pixel, TikTok pixel, Google tags)
- Estimated ad spend range (AUD) based on product range and positioning
- Likely ad channels

## Top Products
- Identify their likely best sellers
- Pricing strategy analysis (in AUD)
- Product page quality assessment

## Gaps & Opportunities
- Weaknesses you can exploit
- Missing features or trust signals
- Underserved customer segments

## AU-Specific Analysis
- How well they serve the Australian market
- Shipping speed & cost competitiveness for AU
- Local payment method adoption
- ACCC compliance observations

Be specific, opinionated, and include estimated AUD figures wherever possible.`,
          },
        ],
      });

      const report = response.content[0].type === 'text' ? response.content[0].text : '';
      res.json({ report });
    } catch (err: any) {
      console.error('[store-spy] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 3. POST /api/tools/saturation-check
  // -----------------------------------------------------------------------
  app.post('/api/tools/saturation-check', async (req, res) => {
    const allowed = await checkFreeTierLimit(req, res, 'saturation-check');
    if (!allowed) return;

    try {
      const { product } = req.body ?? {};
      if (!product || typeof product !== 'string') {
        res.status(400).json({ error: 'A product name is required.' });
        return;
      }

      // Run two parallel Tavily searches (reduced from 3 to avoid timeouts)
      const [shopifyResults, dropshipResults] = await Promise.all([
        tavilySearch(`${product} Australia dropshipping competition sellers`, 4),
        tavilySearch(`${product} Australia buy online reviews market`, 4),
      ]);
      const adsResults = { results: [] };

      const combinedResults = [
        '=== Shopify Store Results ===',
        ...(shopifyResults.results ?? []).map(
          (r: any) => `- ${r.title}: ${r.url}\n  ${r.content ?? ''}`
        ),
        '\n=== Dropshipping Discussion Results ===',
        ...(dropshipResults.results ?? []).map(
          (r: any) => `- ${r.title}: ${r.url}\n  ${r.content ?? ''}`
        ),
        '\n=== Facebook Ads Results ===',
        ...(adsResults.results ?? []).map(
          (r: any) => `- ${r.title}: ${r.url}\n  ${r.content ?? ''}`
        ),
      ].join('\n');

      const claude = getAnthropicClient();
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are an Australian ecommerce market analyst. Analyse the following search results to determine the market saturation level for "${product}" in Australia.

Search data:
${combinedResults}

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "level": "LOW" | "MEDIUM" | "HIGH" | "OVERSATURATED",
  "score": 65,
  "report": "Detailed markdown report here"
}

The "score" is a saturation score from 0-100 where:
- 0-25 = LOW (blue ocean, few competitors)
- 26-50 = MEDIUM (some competition, still viable)
- 51-75 = HIGH (crowded, need strong differentiation)
- 76-100 = OVERSATURATED (avoid unless you have a unique angle)

The "report" should be a detailed markdown string covering:
- Number of competing Shopify stores found
- Presence of dropshipping discussions (indicates known product)
- Facebook ad activity level
- AU-specific competition assessment
- Verdict with actionable advice
- Suggested differentiation strategies if entering this market

All analysis should be AU-focused. Reference AUD pricing, AU platforms, AU consumer behaviour.`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { level: 'MEDIUM', score: 50, report: text };
      }

      res.json({
        report: parsed.report,
        level: parsed.level,
        score: parsed.score,
      });
    } catch (err: any) {
      console.error('[saturation-check] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 4. POST /api/tools/daily-products-subscribe
  // -----------------------------------------------------------------------
  app.post('/api/tools/daily-products-subscribe', async (req, res) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { email, niche } = req.body ?? {};
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'A valid email is required.' });
        return;
      }
      if (!niche || typeof niche !== 'string') {
        res.status(400).json({ error: 'A niche is required.' });
        return;
      }

      const sb = getSupabaseAdmin();
      const { error: insertError } = await sb.from('daily_product_subs').insert({
        user_id: authUser.userId,
        email,
        niche,
        subscribed_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('[daily-products-subscribe] Insert error:', insertError.message);
        res.status(500).json({ error: insertError.message });
        return;
      }

      // Optionally trigger n8n webhook
      const webhookUrl = process.env.VITE_N8N_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              email,
              niche,
              user_id: authUser.userId,
            }),
          });
        } catch (webhookErr: any) {
          // Non-fatal — log but don't fail the request
          console.error('[daily-products-subscribe] Webhook error:', webhookErr.message);
        }
      }

      res.json({ ok: true });
    } catch (err: any) {
      console.error('[daily-products-subscribe] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // 5. POST /api/suppliers/search  — Supplier Intelligence Engine
  // -----------------------------------------------------------------------
  const supplierLimiter = new Map<string, number[]>(); // userId → timestamps
  const SUPPLIER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const SUPPLIER_MAX_PER_HOUR = 5;

  app.post('/api/suppliers/search', async (req, res) => {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized — Bearer token required' });
      return;
    }

    // Rate limit: 5 searches per hour per user
    const nowS = Date.now();
    const supTimestamps = (supplierLimiter.get(authUser.userId) ?? []).filter(
      (t) => nowS - t < SUPPLIER_WINDOW_MS,
    );
    if (supTimestamps.length >= SUPPLIER_MAX_PER_HOUR) {
      res.status(429).json({
        error: `Rate limited — max ${SUPPLIER_MAX_PER_HOUR} supplier searches per hour`,
        resetAt: new Date(supTimestamps[0] + SUPPLIER_WINDOW_MS).toISOString(),
      });
      return;
    }
    supTimestamps.push(nowS);
    supplierLimiter.set(authUser.userId, supTimestamps);

    const { query } = (req.body ?? {}) as { query?: string };
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({ error: 'query must be at least 2 characters' });
      return;
    }

    try {
      const { searchSuppliers } = await import('./supplier-search.js');
      const suppliers = await searchSuppliers(query.trim());
      res.json({ suppliers, query: query.trim() });
    } catch (err: any) {
      console.error('[suppliers/search] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Search failed' });
    }
  });

  // POST /api/suppliers/save  — Save supplier to au_suppliers table
  app.post('/api/suppliers/save', async (req, res) => {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { supplier, product_query } = (req.body ?? {}) as {
      supplier?: any;
      product_query?: string;
    };
    if (!supplier || !product_query) {
      res.status(400).json({ error: 'supplier and product_query are required' });
      return;
    }

    try {
      const sb = getSupabaseAdmin();
      // Upsert into au_suppliers
      const { data, error } = await sb
        .from('au_suppliers')
        .upsert(
          {
            product_query,
            supplier_name: supplier.supplier_name,
            platform: supplier.platform,
            unit_cost_aud: supplier.unit_cost_aud,
            moq: supplier.moq,
            shipping_days_to_au: supplier.shipping_days_to_au,
            shipping_cost_aud: supplier.shipping_cost_aud,
            rating: supplier.rating,
            url: supplier.url,
            why_recommended: supplier.why_recommended,
            profit_margin_pct: supplier.profit_margin_pct,
          },
          { onConflict: 'supplier_name,product_query' }
        )
        .select('id')
        .single();

      if (error) {
        // If the supplier was already saved, just return ok
        res.json({ ok: true, message: 'Supplier saved' });
        return;
      }

      res.json({ ok: true, id: data.id });
    } catch (err: any) {
      console.error('[suppliers/save] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Save failed' });
    }
  });

  // -----------------------------------------------------------------------
  // 6. POST /api/products/search  — 4-platform Tavily product search
  // -----------------------------------------------------------------------
  const searchLimiter = new Map<string, number[]>(); // userId → timestamps
  const SEARCH_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const SEARCH_MAX_PER_HOUR = 10;

  app.post('/api/products/search', async (req, res) => {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized — Bearer token required' });
      return;
    }

    // Rate limit: 10 searches per hour per user
    const now = Date.now();
    const userTimestamps = (searchLimiter.get(authUser.userId) ?? []).filter(
      (t) => now - t < SEARCH_WINDOW_MS,
    );
    if (userTimestamps.length >= SEARCH_MAX_PER_HOUR) {
      res.status(429).json({
        error: `Rate limited — max ${SEARCH_MAX_PER_HOUR} searches per hour`,
        resetAt: new Date(userTimestamps[0] + SEARCH_WINDOW_MS).toISOString(),
      });
      return;
    }
    userTimestamps.push(now);
    searchLimiter.set(authUser.userId, userTimestamps);

    const { query } = (req.body ?? {}) as { query?: string };
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({ error: 'query must be at least 2 characters' });
      return;
    }

    try {
      const { productSearch } = await import('./product-search.js');
      const result = await productSearch(query.trim(), authUser.userId);
      res.json(result);
    } catch (err: any) {
      console.error('[products/search] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Search failed' });
    }
  });

  // -----------------------------------------------------------------------
  // PUBLIC: POST /api/tools/store-health-score — lead-gen tool, no auth required
  // Rate limit: 3 per IP per day
  // -----------------------------------------------------------------------
  const healthScoreIpLimiter = new Map<string, { count: number; date: string }>();

  app.post('/api/tools/store-health-score', async (req, res) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown';
    const today = new Date().toISOString().split('T')[0];

    // Rate limit: 3/day per IP
    const ipEntry = healthScoreIpLimiter.get(ip);
    if (ipEntry && ipEntry.date === today && ipEntry.count >= 3) {
      res.status(429).json({
        error: 'rate_limited',
        message: 'You\'ve used your 3 free analyses today. Come back tomorrow or sign up for unlimited access.',
        upgrade_url: '/sign-in',
      });
      return;
    }

    const { storeUrl } = req.body ?? {};
    if (!storeUrl || typeof storeUrl !== 'string') {
      res.status(400).json({ error: 'storeUrl is required' });
      return;
    }

    // Update rate limit counter
    if (!ipEntry || ipEntry.date !== today) {
      healthScoreIpLimiter.set(ip, { count: 1, date: today });
    } else {
      healthScoreIpLimiter.set(ip, { count: ipEntry.count + 1, date: today });
    }

    try {
      const [searchResults, competitorResults] = await Promise.all([
        tavilySearch(`${storeUrl} shopify store products reviews`, 3),
        tavilySearch(`${storeUrl} competitors similar stores australia`, 3),
      ]);

      const claude = getAnthropicClient();
      const prompt = `Analyse this Shopify dropshipping store: ${storeUrl}

Search results: ${JSON.stringify((searchResults.results ?? []).slice(0, 3))}
Competitor context: ${JSON.stringify((competitorResults.results ?? []).slice(0, 2))}

Score this store 0-100 on these dimensions (be realistic but encouraging). Base your analysis on the search data — if limited data is available, make reasonable inferences based on the store URL and niche.

Return ONLY valid JSON (no markdown, no code fences):
{
  "overall_score": <0-100>,
  "niche_saturation": <0-100, higher=less saturated=better>,
  "product_mix": <0-100>,
  "pricing_competitiveness": <0-100>,
  "seo_strength": <0-100>,
  "social_proof": <0-100>,
  "market_position": <0-100>,
  "grade": "A" | "B" | "C" | "D" | "F",
  "biggest_opportunity": "one specific actionable insight for an AU dropshipper",
  "top_3_issues": ["issue1", "issue2", "issue3"],
  "estimated_monthly_revenue": <realistic AUD estimate as number>,
  "competitor_advantage": "what competitors are doing better",
  "summary": "2-sentence encouraging but honest store assessment"
}`;

      const response = await claude.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }

      if (!parsed) {
        res.status(500).json({ error: 'Failed to parse AI response' });
        return;
      }

      res.json(parsed);
    } catch (err: any) {
      console.error('[store-health-score] Error:', err.message);
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    }
  });

  // -----------------------------------------------------------------------
  // POST /api/shopify/import-product — generate Shopify-compatible CSV
  // -----------------------------------------------------------------------
  app.post('/api/shopify/import-product', async (req, res) => {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized — Bearer token required' });
      return;
    }

    const { product_title, price_aud, supplier_cost_aud, description, image_url, category } =
      (req.body ?? {}) as {
        product_title?: string;
        price_aud?: number;
        supplier_cost_aud?: number;
        description?: string;
        image_url?: string;
        category?: string;
      };

    if (!product_title) {
      res.status(400).json({ error: 'product_title is required' });
      return;
    }

    const csv = generateShopifyCSV({
      product_title,
      price_aud: price_aud ?? 0,
      supplier_cost_aud: supplier_cost_aud ?? (price_aud ? price_aud / 2.8 : 10),
      description,
      image_url,
      category: category ?? 'General',
    });

    const safeName = product_title.replace(/[^a-z0-9]/gi, '-');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.csv"`);
    res.send(csv);
  });
}

// ── Shopify CSV generator ─────────────────────────────────────────────────────
function generateShopifyCSV(product: {
  product_title: string;
  price_aud: number;
  supplier_cost_aud: number;
  description?: string;
  image_url?: string;
  category: string;
}): string {
  const markup = 2.8; // ~180% markup
  const price = (product.supplier_cost_aud * markup).toFixed(2);
  const compareAt = (parseFloat(price) * 1.3).toFixed(2);
  const handle = product.product_title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const body = product.description
    ? `<p>${product.description}</p>`
    : '<p>Premium quality product for Australian customers.</p>';
  const sku = `SKU-${Date.now()}`;

  return (
    `Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Qty,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Image Src,Image Position,Status\n` +
    `${handle},${product.product_title},"${body}",Majorka,${product.category},"trending,australia,dropship",true,Title,Default Title,${sku},200,shopify,50,${price},${compareAt},true,true,${product.image_url ?? ''},1,active`
  );
}
