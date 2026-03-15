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

// ─── Pexels Image Fetcher ─────────────────────────────────────────────────────
async function fetchPexelsImages(query: string, count = 6): Promise<string[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    const data = await res.json() as any;
    return (data.photos || []).map((p: any) => p.src?.large || p.src?.medium || '').filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchPexelsPortrait(query: string): Promise<string> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return '';
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`,
      { headers: { Authorization: key } }
    );
    const data = await res.json() as any;
    return data.photos?.[0]?.src?.large || '';
  } catch {
    return '';
  }
}

// ─── Full AI HTML Generator ────────────────────────────────────────────────────
export async function generateFullStore(params: {
  niche: string;
  storeName: string;
  targetAudience?: string;
  vibe?: string;
  accentColor?: string;
  price?: string;
  productData?: Record<string, any>;
}): Promise<string> {
  const { niche, storeName, targetAudience, vibe, accentColor, price, productData } = params;
  const color = accentColor || '#d4af37';

  // ── 1. Fetch real images from Pexels ───────────────────────────────────────
  const searchQuery = productData?.product_title || niche;
  const [heroImages, productPortrait] = await Promise.all([
    fetchPexelsImages(searchQuery, 5),
    fetchPexelsPortrait(searchQuery),
  ]);

  const heroImg = heroImages[0] || `https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg`;
  const heroImg2 = heroImages[1] || heroImg;
  const productImg = productPortrait || heroImages[2] || heroImg;
  const lifestyleImg1 = heroImages[2] || heroImg;
  const lifestyleImg2 = heroImages[3] || heroImg;

  // ── 2. Build product context ──────────────────────────────────────────────
  const pd = productData || {};
  const productContext = pd.product_title ? `
PRODUCT DETAILS (use these exactly — do not invent):
- Name: ${pd.product_title}
- Category: ${pd.category || pd.product_type || niche}
- Description: ${pd.description || ''}
- Key features: ${(pd.key_features as string[] || []).join(', ')}
- Target customer: ${pd.target_customer || targetAudience || 'Australian shoppers'}
- Hero benefit: ${pd.hero_benefit || ''}
- Suggested headline: ${pd.hero_headline || ''}
- Suggested subheadline: ${pd.hero_subheading || ''}
- Price: ${price || `$${pd.price_aud || pd.suggested_price_aud || '49.95'}`} AUD
- Sizes available: ${(pd.sizes as string[] || []).join(', ') || 'One size'}
- Colors available: ${(pd.colors as string[] || []).join(', ') || ''}` : `
PRODUCT: ${niche}
Target: ${targetAudience || 'Australian shoppers aged 25-45'}
Price range: ${price || '$49.95'} AUD`;

  // ── 3. Call Claude to generate the full HTML ───────────────────────────────
  const client = getAnthropicClient();

  const systemPrompt = `You are a senior frontend developer who builds high-converting Australian ecommerce stores. Output ONLY the complete HTML document — start with <!DOCTYPE html> and end with </html>. No explanation, no markdown.

RULES:
1. All CSS in <style> in <head>. All JS in <script> at bottom of <body>. No external CSS frameworks.
2. Google Fonts allowed via <link>
3. Mobile responsive
4. Use the EXACT Pexels image URLs provided — never use placeholder images
5. AU English (colour, Afterpay, AusPost, AUD)
6. Include: sticky nav with blur, FAQ accordion JS, countdown timer JS, add-to-cart button feedback
7. Dark theme: bg #08080f, surface #0f1018. Premium feel.`;

  const userPrompt = `Build a complete, high-converting Australian ecommerce store for the following product/niche.

${productContext}

STORE CONFIG:
- Store name: ${storeName}
- Brand color (use throughout): ${color}
- Style/vibe: ${vibe || 'modern premium DTC brand'}
- Font: Use "Syne" (headings, 700/900) + "DM Sans" (body, 400/500) from Google Fonts

REAL IMAGES TO USE (embed these exact URLs):
- Hero background: ${heroImg}
- Hero secondary: ${heroImg2}
- Product shot: ${productImg}
- Lifestyle image 1: ${lifestyleImg1}
- Lifestyle image 2: ${lifestyleImg2}

SECTIONS TO BUILD:
1. Announcement bar — scrolling marquee, brand color bg, "Free AU shipping $79+ | Afterpay | Ships AU warehouse"
2. Sticky nav — logo left, links center (Product/Features/Reviews/FAQ), Shop Now button right, blur on scroll
3. Hero — full-height, hero bg image + dark overlay, AU badge, bold H1, subheadline, 2 CTA buttons, 3 trust badges
4. Product section — 2-col (image left, info right): product image, name, stars, price in brand color, Afterpay row, Add to Cart (full width), benefits list
5. Features — 3-col dark cards, emoji icon + title + description, specific to this product
6. Testimonials — 3-col, 5 stars, specific quote, name + AU city + verified
7. FAQ accordion — 5 questions specific to this niche, expand/collapse JS
8. CTA strip — gradient bg, headline, button, countdown timer
9. Footer — brand story, links, copyright with ABN, "All prices AUD incl. GST"

DESIGN: Syne font (headings 800/900) + DM Sans (body). H1: 52-64px. Cards: border-radius 14px, 1px border rgba(255,255,255,0.08). Buttons: brand color, 10px radius. Generous padding (80px sections).

Output the full HTML document only.`;

  // Use claude-haiku for speed (5x faster than Sonnet — stays within Vercel 60s limit)
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 8000,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  const html = (message.content[0] as any).text as string;
  const start = html.indexOf('<!DOCTYPE');
  return start >= 0 ? html.slice(start) : html;
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

  // POST /api/website/generate — Full AI HTML generation with Pexels images (streaming SSE)
  app.post('/api/website/generate', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

      const { niche, storeName, targetAudience, vibe, accentColor, price, productData } = req.body as {
        niche?: string; storeName?: string; targetAudience?: string;
        vibe?: string; accentColor?: string; price?: string;
        productData?: Record<string, any>;
      };
      if (!niche) { res.status(400).json({ error: 'niche is required.' }); return; }

      const color = accentColor || '#d4af37';
      const searchQuery = (productData as any)?.product_title || niche;

      // ── Set up SSE streaming ──────────────────────────────────────────────
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const send = (event: string, data: any) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      // ── 1. Fetch Pexels images ────────────────────────────────────────────
      send('progress', { pct: 10, msg: '🔍 Finding product images...' });
      const [heroImages, productPortrait] = await Promise.all([
        fetchPexelsImages(searchQuery, 5),
        fetchPexelsPortrait(searchQuery),
      ]);
      const heroImg = heroImages[0] || 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg';
      const heroImg2 = heroImages[1] || heroImg;
      const productImg = productPortrait || heroImages[2] || heroImg;
      const lifestyleImg1 = heroImages[2] || heroImg;
      const lifestyleImg2 = heroImages[3] || heroImg;

      send('progress', { pct: 25, msg: '✍️ Writing your store...' });

      // ── 2. Build prompt ───────────────────────────────────────────────────
      const pd = productData || {};
      const productContext = (pd as any).product_title ? `
PRODUCT DETAILS:
- Name: ${(pd as any).product_title}
- Category: ${(pd as any).category || (pd as any).product_type || niche}
- Description: ${(pd as any).description || ''}
- Key features: ${((pd as any).key_features as string[] || []).join(', ')}
- Target customer: ${(pd as any).target_customer || targetAudience || 'Australian shoppers'}
- Hero benefit: ${(pd as any).hero_benefit || ''}
- Suggested headline: ${(pd as any).hero_headline || ''}
- Price: ${price || `$${(pd as any).price_aud || '49.95'}`} AUD` : `
PRODUCT: ${niche}
Target: ${targetAudience || 'Australian shoppers 25-45'}
Price: ${price || '$49.95'} AUD`;

      const systemPrompt = `You are a senior frontend developer who builds high-converting Australian ecommerce stores. Output ONLY the complete HTML document — start with <!DOCTYPE html> and end with </html>. No explanation, no markdown.

RULES:
1. All CSS in <style> in <head>. All JS in <script> at bottom of <body>. No external CSS frameworks.
2. Google Fonts allowed via <link>
3. Mobile responsive
4. Use the EXACT Pexels image URLs provided — never use placeholder images
5. AU English (colour, Afterpay, AusPost, AUD)
6. Include: sticky nav with blur, FAQ accordion JS, countdown timer JS, add-to-cart button feedback
7. Dark theme: bg #08080f, surface #0f1018. Premium feel.`;

      const userPrompt = `Build a complete high-converting Australian ecommerce store.

${productContext}

STORE: ${storeName || niche} | Brand color: ${color} | Style: ${vibe || 'modern premium DTC'}
Fonts: Syne (headings 800/900) + DM Sans (body) from Google Fonts

REAL IMAGES (use these exact URLs):
- Hero bg: ${heroImg}
- Hero secondary: ${heroImg2}
- Product: ${productImg}
- Lifestyle 1: ${lifestyleImg1}
- Lifestyle 2: ${lifestyleImg2}

SECTIONS:
1. Announcement bar — scrolling marquee, brand color bg, "Free AU shipping $79+ | Afterpay | Ships AU warehouse"
2. Sticky nav — logo left, links center (Product/Features/Reviews/FAQ), Shop Now button right, blur on scroll
3. Hero — full-height, hero bg image + dark overlay, AU badge, bold H1, subheadline, 2 CTA buttons, 3 trust badges
4. Product section — 2-col: product image left, info right (name, stars, price, Afterpay row, Add to Cart, benefits list)
5. Features — 3-col dark cards, emoji + title + description specific to this product
6. Testimonials — 3-col, 5 stars, specific quotes, AU city + verified badge
7. FAQ accordion — 5 product-specific questions, expand/collapse JS
8. CTA strip — gradient, headline, button, countdown timer
9. Footer — brand story, links, ABN placeholder, "All prices AUD incl. GST"

Design: H1 52-64px, cards border-radius 14px, 1px border rgba(255,255,255,0.08), 80px section padding.
Output full HTML only.`;

      // ── 3. Stream from Claude ─────────────────────────────────────────────
      send('progress', { pct: 40, msg: '🎨 Building layout & styles...' });

      const client = getAnthropicClient();
      const stream = await client.messages.stream({
        model: 'claude-haiku-4-5',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let html = '';
      let lastProgressPct = 40;
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && (chunk.delta as any).type === 'text_delta') {
          html += (chunk.delta as any).text;
          // Send incremental progress based on output size
          const pct = Math.min(90, 40 + Math.floor((html.length / 7000) * 50));
          if (pct > lastProgressPct + 5) {
            lastProgressPct = pct;
            send('progress', { pct, msg: '⚡ Generating HTML...' });
          }
        }
      }

      // ── 4. Done ───────────────────────────────────────────────────────────
      const start = html.indexOf('<!DOCTYPE');
      const finalHtml = start >= 0 ? html.slice(start) : html;
      send('progress', { pct: 100, msg: '✅ Store ready!' });
      send('done', { html: finalHtml });
      res.end();
    } catch (err: any) {
      console.error('[website/generate]', err.message);
      try { res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Generation failed.' })}\n\n`); res.end(); } catch {}
    }
  });
}
