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
  const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
  if (!FIRECRAWL_KEY) throw new Error('FIRECRAWL_API_KEY is not configured.');

  // Scrape the actual product page with Firecrawl
  const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 20000,
    }),
  });

  const scrapeData = await scrapeRes.json();
  const pageContent: string = scrapeData.data?.markdown || scrapeData.markdown || '';

  // Use Claude Haiku to extract deep product intelligence
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a product intelligence expert. Extract all product data from this scraped page. Return ONLY valid JSON — no markdown, no explanation.

URL: ${url}
Page Content:
${pageContent.slice(0, 5000)}

Return this exact JSON structure:
{
  "product_title": "exact product name from the listing",
  "product_type": "e.g. gym leggings, crop top, sports bra, smartwatch, dog harness",
  "description": "2-3 sentence product description from the listing",
  "hero_image": "URL of best hero or lifestyle shot — look for ![alt](url) image markdown and pick the first/largest",
  "product_images": ["url1", "url2", "url3"],
  "color_variant_images": [{"color": "Black", "image_url": "https://..."}, {"color": "Navy", "image_url": "https://..."}],
  "size_chart_image": "URL of size guide/chart image, or null",
  "sizes": ["XS", "S", "M", "L", "XL"],
  "colors": ["Midnight Black", "Stone Grey", "Blush Pink"],
  "target_customer": "who this product is for, e.g. women who train 4-5x/week at the gym",
  "hero_benefit": "single most compelling selling point, e.g. squat-proof, 4-way stretch, moisture-wicking",
  "key_features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "material": "material composition if found, or null",
  "price_aud": 49.95,
  "original_price_aud": 79.95,
  "category": "one of: Fitness, Fashion, Health & Beauty, Pet, Tech, Home & Kitchen, Outdoor, Baby",
  "hero_headline": "compelling AU-market headline based on hero_benefit, max 10 words",
  "hero_subheading": "1-2 sentences targeting target_customer with the key outcome",
  "ad_angle": "best TikTok/Meta ad angle for AU audience",
  "score": 72,
  "supplier": "AliExpress|TikTok Shop|Shopify|Amazon|Other|Unknown",
  "au_suggested_title": "AU-optimised product title",
  "suggested_price_aud": 59.95
}

CRITICAL for product_images: scan the entire content for image URLs. Look for:
- Markdown image syntax: ![alt text](https://url.jpg)
- Any URLs ending in .jpg .jpeg .png .webp .gif
- CDN patterns: cdn.shopify.com, images.squarespace.com, i.imgur.com, ae01.alicdn.com
Include ALL product image URLs you find — this is the most important field.`,
      },
    ],
  });

  const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}';

  // Parse JSON
  let result: Record<string, unknown> = {};
  try {
    const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      result = JSON.parse(clean.slice(start, end + 1));
    } else {
      result = JSON.parse(clean);
    }
  } catch {
    result = { _parse_error: true, raw: rawText.slice(0, 300) };
  }

  // Ensure product_images is always an array and includes hero_image if set
  const productImages: string[] = Array.isArray(result.product_images) ? result.product_images as string[] : [];
  const heroImage = result.hero_image as string | undefined;
  if (heroImage && !productImages.includes(heroImage)) {
    productImages.unshift(heroImage);
  }
  result.product_images = productImages;
  if (!result.hero_image && productImages.length > 0) {
    result.hero_image = productImages[0];
  }

  // Add backward-compat fields so existing UI display still works
  result.product_name = result.product_title;
  result.overall_score = result.score ?? 70;
  result.image_quality = productImages.length > 0 ? 'good' : 'unknown';
  result.image_issues = productImages.length > 0 ? [] : ['No product images found'];
  result.title_quality = result.product_title ? 'good' : 'unknown';
  result.title_issues = [];
  result.description_quality = result.description ? 'good' : 'unknown';
  result.description_issues = [];
  result.price_found = result.price_aud ? `$${result.price_aud} AUD` : null;
  const score = (result.score as number) ?? 70;
  result.recommendation = score >= 70 ? 'Import and use as-is' : score >= 50 ? 'Import with fixes' : 'Find a better product';
  result.suggested_title = result.au_suggested_title;
  result.suggested_description = result.description;

  return result;
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
