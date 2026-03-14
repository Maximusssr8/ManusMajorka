/**
 * Website API — Deploy and Analyze endpoints for the Website Generator
 *
 * Routes:
 *   POST /api/website/deploy-vercel   — 1-click Vercel deploy
 *   POST /api/website/analyze-product — Smart product quality analyzer
 */

import type { Application } from 'express';
import { CLAUDE_MODEL, getAnthropicClient } from './anthropic';
import { getSupabaseAdmin } from '../_core/supabase';

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function authenticateRequest(req: any): Promise<{ userId: string; email: string } | null> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const {
    data: { user },
  } = await getSupabaseAdmin().auth.getUser(token);
  if (!user) return null;
  return { userId: user.id, email: user.email ?? '' };
}

// ─── Vercel Deploy ────────────────────────────────────────────────────────────
export async function deployToVercel(
  html: string,
  storeName: string
): Promise<{ url: string; deployId: string }> {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  if (!VERCEL_TOKEN) throw new Error('VERCEL_TOKEN is not configured.');

  const projectName =
    storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) +
    '-' +
    Date.now().toString(36);

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files: [
        {
          file: 'index.html',
          data: html,
          encoding: 'utf8',
        },
        {
          file: 'package.json',
          data: JSON.stringify({ name: projectName, version: '1.0.0' }),
          encoding: 'utf8',
        },
      ],
      projectSettings: {
        framework: null,
        buildCommand: null,
        outputDirectory: null,
      },
      target: 'production',
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.url) {
    const errMsg =
      data?.error?.message ||
      (data?.errors && data.errors[0]?.message) ||
      'Deployment failed — check VERCEL_TOKEN and Vercel account limits.';
    throw new Error(errMsg);
  }

  return {
    url: `https://${data.url}`,
    deployId: data.id,
  };
}

// ─── Product Analyzer ─────────────────────────────────────────────────────────
export async function analyzeProductUrl(url: string): Promise<Record<string, unknown>> {
  const TAVILY_KEY = process.env.TAVILY_API_KEY;
  if (!TAVILY_KEY) throw new Error('TAVILY_API_KEY is not configured.');

  // Scrape the product page via Tavily
  const searchResult = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query: url,
      search_depth: 'advanced',
      include_raw_content: true,
      max_results: 1,
    }),
  }).then((r) => r.json());

  const pageContent: string = searchResult.results?.[0]?.content || '';
  const pageUrl: string = searchResult.results?.[0]?.url || url;

  // Use Claude to analyze quality
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this product listing for dropshipping quality. Return ONLY valid JSON — no markdown, no explanation.

URL: ${pageUrl}
Content: ${pageContent.slice(0, 2500)}

Return this exact JSON structure:
{
  "product_name": "extracted product name or null",
  "image_quality": "good|bad|unknown",
  "image_issues": ["list of issues if bad: blurry, watermark, bad lighting, no product focus"],
  "title_quality": "good|bad|unknown",
  "title_issues": ["too generic", "keyword stuffing", "wrong language"],
  "description_quality": "good|bad|unknown",
  "description_issues": ["list of issues"],
  "price_found": "price string or null",
  "supplier": "AliExpress|TikTok Shop|Amazon|Other|Unknown",
  "overall_score": 72,
  "recommendation": "Import and use as-is|Import with fixes|Find a better product",
  "suggested_title": "better AU-optimised title for Australian dropshipping",
  "suggested_description": "2-3 sentence AU-optimised description for this product"
}`,
      },
    ],
  });

  const rawText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // Parse JSON
  try {
    const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
  } catch {
    // fall through
  }

  // Fallback
  return {
    product_name: null,
    image_quality: 'unknown',
    image_issues: [],
    title_quality: 'unknown',
    title_issues: [],
    description_quality: 'unknown',
    description_issues: [],
    price_found: null,
    supplier: 'Unknown',
    overall_score: 50,
    recommendation: 'Import with fixes',
    suggested_title: '',
    suggested_description: '',
    _error: 'Could not parse AI response',
  };
}

// ─── Route Registration ───────────────────────────────────────────────────────
export function registerWebsiteRoutes(app: Application): void {
  // POST /api/website/deploy-vercel
  app.post('/api/website/deploy-vercel', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { html, storeName } = req.body as {
        html?: string;
        storeName?: string;
      };

      if (!html || typeof html !== 'string' || html.length < 100) {
        res.status(400).json({ error: 'html is required and must be a valid HTML document.' });
        return;
      }

      const result = await deployToVercel(html, storeName || 'my-store');
      res.json(result);
    } catch (err: any) {
      console.error('[website/deploy-vercel]', err.message);
      res.status(500).json({ error: err.message || 'Deployment failed.' });
    }
  });

  // POST /api/website/analyze-product
  app.post('/api/website/analyze-product', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { url } = req.body as { url?: string };
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'url is required.' });
        return;
      }

      const analysis = await analyzeProductUrl(url);
      res.json(analysis);
    } catch (err: any) {
      console.error('[website/analyze-product]', err.message);
      res.status(500).json({ error: err.message || 'Analysis failed.' });
    }
  });
}
