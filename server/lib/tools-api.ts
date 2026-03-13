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

// ── In-memory rate limiter for /api/products/refresh (1/hr per user) ────────
const refreshLimiter = new Map<string, number>(); // userId → last triggered ms
const REFRESH_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

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
  // 1. POST /api/tools/winning-products
  // -----------------------------------------------------------------------
  app.post('/api/tools/winning-products', async (req, res) => {
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

      const firecrawl = new Firecrawl({ apiKey: firecrawlKey });
      const scrapeResult = await (firecrawl as any).scrapeUrl(url, {
        formats: ['markdown'],
      });

      const scrapedContent =
        (scrapeResult as any)?.markdown ??
        (scrapeResult as any)?.content ??
        JSON.stringify(scrapeResult);

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
    try {
      const { product } = req.body ?? {};
      if (!product || typeof product !== 'string') {
        res.status(400).json({ error: 'A product name is required.' });
        return;
      }

      // Run three parallel Tavily searches for saturation signals
      const [shopifyResults, dropshipResults, adsResults] = await Promise.all([
        tavilySearch(`buy ${product} Australia site:*.myshopify.com`, 5),
        tavilySearch(`${product} Australia dropshipping`, 5),
        tavilySearch(`${product} facebook ads Australia`, 5),
      ]);

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
}
