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

// ─── Shared JS block (always appended — never AI-generated to avoid truncation) ──
function buildHardCodedJs(): string {
  return `
<script>
window.addEventListener('scroll', function() {
  var nav = document.querySelector('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});
var ham = document.getElementById('hamburger');
var mob = document.getElementById('mobile-menu');
if (ham && mob) {
  ham.addEventListener('click', function() { mob.classList.toggle('mobile-open'); });
  mob.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', function() { mob.classList.remove('mobile-open'); }); });
}
document.querySelectorAll('.faq-item').forEach(function(item) {
  var q = item.querySelector('.faq-question');
  if (!q) return;
  q.addEventListener('click', function() {
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); var t = i.querySelector('.faq-toggle'); if (t) t.textContent = '+'; });
    if (!isOpen) { item.classList.add('open'); var t = item.querySelector('.faq-toggle'); if (t) t.textContent = '−'; }
  });
});
document.querySelectorAll('.btn-cart, .add-to-cart, [data-cart]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var orig = this.textContent; this.textContent = '✓ Added to Cart!'; this.disabled = true;
    var self = this; setTimeout(function() { self.textContent = orig; self.disabled = false; }, 2000);
  });
});
(function() {
  var t = 23 * 3600 + 59 * 59;
  var el = document.getElementById('countdown');
  if (!el) return;
  setInterval(function() {
    if (t <= 0) t = 86399;
    el.textContent = String(Math.floor(t/3600)).padStart(2,'0') + ':' + String(Math.floor((t%3600)/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0');
    t--;
  }, 1000);
})();
</script>
</body>
</html>`;
}

// ─── Full AI HTML Generator (2-pass) ──────────────────────────────────────────
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

  const colorRgb = (function(hex: string) {
    const c = hex.replace('#', '');
    return parseInt(c.substring(0,2),16)+','+parseInt(c.substring(2,4),16)+','+parseInt(c.substring(4,6),16);
  })(color);

  const client = getAnthropicClient();

  // ── PASS 1: DOCTYPE + CSS + above-the-fold ───────────────────────────────
  const systemPrompt = `You are a world-class frontend developer. Output ONLY raw HTML — no markdown, no explanation. Start with <!DOCTYPE html>.

RULES: All CSS in one <style> block in <head>. No external CSS frameworks. Google Fonts via <link> only. Use exact image URLs given. AU English.`;

  const pass1 = `Build the first half of an Australian ecommerce store for: ${niche}

Store: ${storeName} | Brand color: ${color} | Style: ${vibe || 'modern premium dark DTC'}
Fonts: Syne (headings 800/900) + DM Sans (body) from Google Fonts
${productContext}

IMAGES:
- Hero bg: ${heroImg}
- Product: ${productImg}

OUTPUT: <!DOCTYPE html> → complete <head> with ALL CSS (dark theme bg:#08080f, all sections styled) → <body> → these sections:

① ANNOUNCEMENT BAR — bg:${color}, color:#08080f, font-weight:700, 13px
  Marquee: duplicate text 4x for seamless loop. Text: "🔥 Free AU shipping $79+ &nbsp;|&nbsp; ⚡ Afterpay &nbsp;|&nbsp; 🇦🇺 Ships AU warehouse &nbsp;|&nbsp; ✓ 30-day returns"
  @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} } animation:marquee 25s linear infinite

② STICKY NAV — height:68px, sticky top:0, z-index:1000, bg:rgba(8,8,15,0.85), backdrop-filter:blur(20px), border-bottom:1px solid rgba(255,255,255,0.06)
  .scrolled class: bg:rgba(8,8,15,0.97), border-bottom:1px solid ${color}30
  Logo left (Syne 900, color:${color}) | center links (gap:40px, 14px, hover:${color}) | right: Shop Now btn (bg:${color}, color:#08080f, padding:10px 24px, border-radius:8px, font-weight:700)
  MOBILE: hamburger button id="hamburger" (3 lines, display:none above 768px) + full-screen overlay id="mobile-menu" (fixed inset-0, bg:rgba(8,8,15,0.98), z-index:9999, flex-col, gap:32px, centered, font-size:24px, hidden by default, .mobile-open shows it)

③ HERO — min-height:100vh, bg:url(${heroImg}) center/cover, overlay rgba(8,8,15,0.6)
  Content centered z-index:1. AU badge (${color} bg, 11px uppercase, border-radius:99px). H1 Syne 900 clamp(44px,7vw,72px) white. Subheadline 18px rgba(255,255,255,0.75). Two buttons (primary bg:${color} color:#08080f + secondary transparent border:2px solid rgba(255,255,255,0.3)). Trust strip 3 items.
  Write headline/subheadline specific to: ${niche}

④ PRODUCT SECTION — padding:100px 5%, bg:#0a0a12, max-width:1100px margin:0 auto
  2-col grid (1fr 1fr, gap:64px). LEFT: product image card (border-radius:20px, border:1px solid rgba(255,255,255,0.08), overflow:hidden, <img src="${productImg}" width:100%>) + "BEST SELLER" badge (absolute top:16px left:16px, bg:#ef4444, white, 12px 800).
  RIGHT: name (Syne 28px 900) | stars ★★★★★ in ${color} + "4.9 (247 reviews)" | price (Syne 40px 900 color:${color}) + original struck | Afterpay row (bg:rgba(${colorRgb},0.08), border:1px solid ${color}30, 12px 16px, "Pay 4x with Afterpay") | stock "⚡ Only 8 left" (#f59e0b) | Add to Cart btn (width:100%, bg:${color}, 18px, Syne 800, class="btn-cart") | Buy Now (#1a1a2a, width:100%) | 6 benefits list (✓ in ${color}, 14px each, specific to ${niche})

Include ALL CSS for ALL sections (features, testimonials, FAQ, CTA, footer, gallery, mobile) in the <style> block now so pass 2 only needs to write HTML.

End output at </section> after product section. Do NOT write features/testimonials/FAQ/footer yet.`;

  const msg1 = await client.messages.create({ model: CLAUDE_MODEL, max_tokens: 6000, system: systemPrompt, messages: [{ role: 'user', content: pass1 }] });
  const part1Raw = ((msg1.content[0] as any).text as string).trim();
  const part1Clean = part1Raw.replace(/<!--\s*PASS1_END\s*-->/gi, '').replace(/<\/body>\s*<\/html>\s*$/i, '').trim();

  // ── PASS 2: Remaining sections (features → footer) ───────────────────────
  const pass2 = `Continue the Australian ecommerce store HTML. Output ONLY raw HTML sections, no explanation. Start immediately with <section id="features">.

Product: ${niche} | Store: ${storeName} | Color: ${color} | colorRgb: ${colorRgb}
${productContext}
Lifestyle images: ${lifestyleImg1} | ${lifestyleImg2}

BUILD (CSS already written in pass 1 — HTML only):

⑤ <section id="features" ...> — padding:100px 5%, bg:#08080f
  H2 centered Syne 800. 3-col grid class="features-grid". 3 cards class="feature-card" specific to ${niche}: <div class="feature-icon">EMOJI</div><h3>TITLE</h3><p>DESC</p>

⑥ <section id="gallery" ...> — padding:80px 5%, bg:#0a0a12
  2-col grid, max-width:1000px, margin:0 auto
  <img src="${lifestyleImg1}" style="border-radius:16px;width:100%;aspect-ratio:16/10;object-fit:cover;display:block">
  <img src="${lifestyleImg2}" style="border-radius:16px;width:100%;aspect-ratio:16/10;object-fit:cover;display:block">

⑦ <section id="reviews" ...> — padding:100px 5%, bg:#08080f
  H2 + p "⭐ 4.9/5 · 200+ verified AU reviews". 3-col grid class="testimonials-grid".
  Each card class="testimonial-card": stars ★★★★★, quote specific to ${niche} (mention result/benefit/shipping/Afterpay), name + AU city + <span class="verified">✓ Verified</span>

⑧ <section id="faq" ...> — padding:80px 5%, bg:#0a0a12, max-width:760px, margin:0 auto
  H2. 5x <div class="faq-item"><div class="faq-question"><span>Q</span><span class="faq-toggle">+</span></div><div class="faq-answer"><p>A</p></div></div>
  Questions specific to ${niche}.

⑨ <section id="offer" ...> — padding:100px 5%, background:linear-gradient(135deg,#0f1018,rgba(${colorRgb},0.15)), text-align:center
  H2 Syne 800, p subtext, <button class="btn-primary btn-cart">Shop ${storeName} Now</button>
  <p ...>⏰ Offer ends in: <span id="countdown">23:59:59</span></p>

⑩ <footer> — padding:64px 5% 28px, bg:#050508, border-top:1px solid rgba(255,255,255,0.06)
  4-col grid: brand (logo Syne ${color} + tagline + social) | Shop | Support | Legal
  <div class="footer-bottom">© 2025 ${storeName}. ABN: [Your ABN] 🇦🇺 | All prices AUD incl. GST · Australian Consumer Law applies</div>

End with </footer>. No script tags. No </body> or </html>.`;

  const msg2 = await client.messages.create({ model: CLAUDE_MODEL, max_tokens: 6000, system: 'Output only raw HTML sections starting from <section id="features">. No explanation.', messages: [{ role: 'user', content: pass2 }] });
  const part2Raw = ((msg2.content[0] as any).text as string).trim().replace(/<\/body>\s*<\/html>\s*$/i, '').replace(/<script[\s\S]*?<\/script>/gi, '');

  // ── Merge + guaranteed JS ─────────────────────────────────────────────────
  const merged = part1Clean + '\n' + part2Raw + '\n' + buildHardCodedJs();
  const startIdx = merged.indexOf('<!DOCTYPE');
  return startIdx >= 0 ? merged.slice(startIdx) : merged;
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
      const send = (evt: string, data: any) => res.write('event: ' + evt + '\ndata: ' + JSON.stringify(data) + '\n\n');

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
      // Pre-compute RGB from hex for use in rgba() values
      const hexToRgb = (hex: string): string => {
        const c = hex.replace('#', '');
        const r = parseInt(c.substring(0,2), 16);
        const g = parseInt(c.substring(2,4), 16);
        const b = parseInt(c.substring(4,6), 16);
        return `${r},${g},${b}`;
      };
      const colorRgb = hexToRgb(color);

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

      const systemPrompt = `You are a world-class frontend developer who builds $10,000 ecommerce stores. You've built for Gymshark, Allbirds, and Frank Body. You write flawless, premium HTML/CSS/JS in a single file.

ABSOLUTE RULES — break any of these and the output is rejected:
1. Output ONLY the HTML document. Start with <!DOCTYPE html>. End with </html>. Zero text outside those tags.
2. All CSS inside one <style> block in <head>. All JS inside one <script> block before </body>.
3. NO external CSS frameworks. NO Bootstrap. NO Tailwind. Pure hand-crafted CSS only.
4. Google Fonts via <link> only.
5. USE the exact Pexels image URLs given — never generate placeholder URLs.
6. ALL copy must be specific to the product — NO generic "quality product" filler.
7. AU English: colour, organise, capitalise, favour. Prices in AUD. Afterpay, AusPost.
8. Every interactive element must work: hamburger menu, FAQ accordion, countdown timer, add-to-cart feedback, nav scroll behaviour.`;

      const userPrompt = `Build a complete, premium, high-converting Australian ecommerce store.

${productContext}

STORE CONFIG:
- Name: ${storeName || niche}
- Brand color (PRIMARY): ${color}
- Style: ${vibe || 'modern premium dark DTC'}
- Fonts: "Syne" (headings, weight 800/900) + "DM Sans" (body, weight 400/500) — load from Google Fonts

REAL PEXELS IMAGES — use ALL of them:
- Hero background (full-bleed): ${heroImg}
- Hero secondary (lifestyle): ${heroImg2}  
- Product hero image: ${productImg}
- Lifestyle photo 1: ${lifestyleImg1}
- Lifestyle photo 2: ${lifestyleImg2}

━━━ BUILD EACH SECTION EXACTLY AS DESCRIBED ━━━

① ANNOUNCEMENT BAR
- bg: ${color}, text: #08080f, font-weight: 700, font-size: 13px, padding: 10px 0
- Duplicate text 4x so marquee loops seamlessly: "🔥 Free AU shipping on orders $79+ &nbsp;&nbsp;|&nbsp;&nbsp; ⚡ Afterpay available &nbsp;&nbsp;|&nbsp;&nbsp; 🇦🇺 Ships from AU warehouse &nbsp;&nbsp;|&nbsp;&nbsp; ✓ 30-day returns"
- @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } } — animation: marquee 25s linear infinite

② STICKY NAV
- height: 68px, position: sticky, top: 0, z-index: 1000
- Default: background: rgba(8,8,15,0.85), backdrop-filter: blur(20px), border-bottom: 1px solid rgba(255,255,255,0.06)
- On scroll (.scrolled class via JS): background: rgba(8,8,15,0.97), border-bottom: 1px solid ${color}30
- Layout: Logo (Syne 900, color: ${color}) | Center links (gap: 40px, font-size: 14px, color: rgba(255,255,255,0.7), hover: ${color}) | Right: "Shop Now" button (bg: ${color}, color: #08080f, padding: 10px 24px, border-radius: 8px, font-weight: 700)
- MOBILE HAMBURGER (display:none above 768px): 3-line icon, clicking opens full-screen overlay nav

③ HERO SECTION
- min-height: 100vh, background: url(${heroImg}) center/cover, position: relative
- Overlay: position:absolute, inset:0, background: linear-gradient(to bottom, rgba(8,8,15,0.55) 0%, rgba(8,8,15,0.75) 100%)
- Content centered, z-index:1, max-width: 740px, margin: 0 auto, text-align: center, padding: 0 24px
- AU badge: display:inline-block, background: ${color}22, border: 1px solid ${color}60, color: ${color}, padding: 6px 18px, border-radius: 99px, font-size: 11px, font-weight: 700, letter-spacing: 2px, text-transform: uppercase, margin-bottom: 28px
- H1: font-family Syne, font-size: clamp(44px,7vw,72px), font-weight: 900, color: #ffffff, line-height: 1.05, letter-spacing: -2px, margin-bottom: 20px — write a punchy benefit-driven headline specific to the product
- Subheadline: font-size: 18px, color: rgba(255,255,255,0.75), max-width: 540px, margin: 0 auto 36px, line-height: 1.7
- Two buttons side by side: Primary (bg: ${color}, color: #08080f, padding: 16px 40px, border-radius: 10px, font-size: 16px, font-weight: 800, box-shadow: 0 8px 32px ${color}50) | Secondary (bg: transparent, border: 2px solid rgba(255,255,255,0.3), color: #fff, padding: 14px 32px, border-radius: 10px)
- Trust strip below buttons: flex row, 3 items, each: icon (✓) + text, font-size: 13px, color: rgba(255,255,255,0.55), gap: 32px

④ PRODUCT SECTION  
- padding: 100px 5%, background: #0a0a12, max-width: 1100px, margin: 0 auto
- 2-column grid (1fr 1fr, gap: 64px, align-items: start)
- LEFT — Product image card: border-radius: 20px, overflow: hidden, border: 1px solid rgba(255,255,255,0.08), box-shadow: 0 24px 80px rgba(0,0,0,0.5), position: relative
  - img width: 100%, display: block
  - Sale badge (position:absolute, top:16px, left:16px, bg: #ef4444, color:#fff, padding: 6px 14px, border-radius: 6px, font-size: 12px, font-weight: 800): "BEST SELLER"
- RIGHT — Product info:
  - Product name: Syne, 28px, 900, color: #f2efe9, margin-bottom: 12px
  - Star rating row: ★★★★★ in ${color}, "4.9 (247 reviews)", font-size: 14px, margin-bottom: 20px
  - Price: font-size: 40px, font-weight: 900, color: ${color}, font-family: Syne + strikethrough original price in grey
  - Afterpay row: bg: rgba(${colorRgb},0.08), border: 1px solid ${color}30, border-radius: 8px, padding: 12px 16px, font-size: 14px, display:flex, align-items:center, gap:8px, margin-bottom: 24px — "Pay in 4 interest-free instalments with Afterpay"
  - Stock warning: font-size: 13px, color: #f59e0b, margin-bottom: 16px — "⚡ Only 8 left in stock"  
  - Add to Cart button: width: 100%, padding: 18px, bg: ${color}, color: #08080f, border-radius: 12px, font-size: 17px, font-weight: 800, border: none, cursor: pointer, margin-bottom: 12px — JS: on click change text to "✓ Added to Cart!" for 2s then reset
  - Buy Now (dark): width: 100%, padding: 16px, bg: #1a1a2a, color: #f2efe9, border: 1px solid rgba(255,255,255,0.1), border-radius: 12px, font-size: 15px, font-weight: 700
  - Benefits list: list-style none, each item: display:flex, gap:10px, padding: 10px 0, border-bottom: 1px solid rgba(255,255,255,0.05), font-size: 14px, color: rgba(242,239,233,0.7) — checkmark in ${color} — write 6 SPECIFIC benefits for this product

⑤ FEATURES SECTION
- padding: 100px 5%, background: #08080f
- H2 centered, Syne 800, font-size: clamp(28px,4vw,44px), margin-bottom: 64px
- 3-column grid, gap: 20px
- Each card: background: #0f1018, border: 1px solid rgba(255,255,255,0.06), border-radius: 16px, padding: 32px 28px, transition: all 0.3s — on hover: border-color: ${color}40, transform: translateY(-4px), box-shadow: 0 16px 48px rgba(0,0,0,0.3)
- Card: emoji icon (font-size: 32px, margin-bottom: 16px) | feature title (Syne, 17px, 700, color: #f2efe9, margin-bottom: 8px) | description (14px, color: rgba(242,239,233,0.55), line-height: 1.7)
- Write 3 features SPECIFIC to this product — not generic

⑥ LIFESTYLE GALLERY
- padding: 80px 5%, background: #0a0a12  
- 2-column image grid, gap: 16px, max-width: 1000px, margin: 0 auto
- Image 1 (${lifestyleImg1}): border-radius: 16px, aspect-ratio: 16/10, object-fit: cover, width: 100%
- Image 2 (${lifestyleImg2}): border-radius: 16px, aspect-ratio: 16/10, object-fit: cover, width: 100%

⑦ TESTIMONIALS
- padding: 100px 5%, background: #08080f
- H2 centered + star rating summary (⭐ 4.9/5 from 200+ verified AU reviews)
- 3-column grid, gap: 20px
- Each card: background: #0f1018, border: 1px solid rgba(255,255,255,0.07), border-radius: 16px, padding: 28px, border-top: 3px solid ${color}
- Stars row: ${color}, font-size: 14px, margin-bottom: 14px
- Quote: font-size: 15px, color: rgba(242,239,233,0.7), line-height: 1.75, font-style: italic, margin-bottom: 18px — make quotes SPECIFIC to this product, mention results
- Name (Syne, 14px, 700) + City (13px, muted) + "Verified Purchase" badge (tiny, ${color}, bg ${color}15)
- Write 3 different specific reviews: reviewer 1 mentions the product benefit, reviewer 2 mentions fast AU shipping, reviewer 3 mentions Afterpay

⑧ FAQ ACCORDION
- padding: 80px 5%, background: #0a0a12, max-width: 760px, margin: 0 auto
- H2 centered, Syne 800
- Each item: background: #0f1018, border: 1px solid rgba(255,255,255,0.07), border-radius: 12px, margin-bottom: 10px, overflow: hidden
- Question row: padding: 20px 24px, display:flex, justify-content:space-between, align-items:center, cursor:pointer, font-weight: 700, font-size: 15px — + / − icon in ${color}
- Answer: max-height: 0, overflow: hidden, transition: max-height 0.35s ease — when .open: max-height: 200px — padding: 0 24px 20px, font-size: 14px, color: rgba(242,239,233,0.6), line-height: 1.75
- JS: toggle .open class on click, change icon + → −
- Write 5 questions SPECIFIC to this niche

⑨ CTA STRIP
- padding: 100px 5%, background: linear-gradient(135deg, #0f1018 0%, rgba(${colorRgb},0.15) 100%), text-align: center
- H2: Syne 800, clamp(28px,4vw,44px), margin-bottom: 12px
- Subtext: 17px, rgba(242,239,233,0.6), margin-bottom: 36px
- Big CTA button: same style as primary
- Countdown timer below button: "⏰ Offer ends in: HH:MM:SS" — font-family: Syne, font-size: 20px, color: ${color}, margin-top: 24px — JS: countdown from 23:59:59, decrement every second

⑩ FOOTER  
- padding: 64px 5% 28px, background: #050508, border-top: 1px solid rgba(255,255,255,0.06)
- 4-column grid: Brand (logo + tagline + social icons) | Shop links | Support links | Legal links
- Bottom bar: flex space-between, font-size: 12px, color: rgba(255,255,255,0.2) — "© 2025 ${storeName || niche}. ABN: [Enter your ABN] · 🇦🇺 Proudly Australian" | "All prices AUD incl. GST · Australian Consumer Law applies"

━━━ MOBILE RESPONSIVE (max-width: 768px) ━━━
- Nav: hide .nav-center and .btn-nav, show hamburger button (3 lines, 26px wide)
- Mobile menu: position:fixed, inset:0, bg: rgba(8,8,15,0.98), z-index:9999, flex-column, gap:32px, align-items:center, justify-content:center, font-size: 24px — hidden by default, .mobile-open shows it
- Product section: grid-template-columns: 1fr
- Features grid: grid-template-columns: 1fr
- Testimonials grid: grid-template-columns: 1fr
- Lifestyle gallery: grid-template-columns: 1fr
- Footer: grid-template-columns: 1fr 1fr

Output the complete HTML document. Every section. Full CSS. Working JS. Nothing omitted.`;

      const client = getAnthropicClient();

      // ── PASS 1: Structure + CSS + Above the fold ──────────────────────────
      send('progress', { pct: 30, msg: '🎨 Building layout & styles...' });

      const pass1Prompt = userPrompt + `

IMPORTANT — OUTPUT ONLY THESE SECTIONS NOW (stop after the product section):
<!DOCTYPE html> → <head> (with ALL CSS in one <style> block) → <body> → announcement bar → nav → hero → product section

End your output with a comment: <!-- PASS1_END -->
Do NOT include features, testimonials, FAQ, CTA strip, footer or <script> tags yet.`;

      const pass2SystemPrompt = `You are continuing to build an Australian ecommerce store HTML file. You will receive the first half of the HTML (above-the-fold sections) and must append the remaining sections to complete the page.

Output ONLY the continuation HTML — starting from the features section and ending with </body></html>. No explanation.
Include ALL remaining JS in a single <script> block before </body>.`;

      let part1 = '';
      const stream1 = await client.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{ role: 'user', content: pass1Prompt }],
      });

      for await (const chunk of stream1) {
        if (chunk.type === 'content_block_delta' && (chunk.delta as any).type === 'text_delta') {
          part1 += (chunk.delta as any).text;
          const pct = Math.min(58, 30 + Math.floor((part1.length / 4000) * 28));
          send('progress', { pct, msg: '⚡ Building above the fold...' });
        }
      }

      // ── PASS 2: Features, testimonials, FAQ, footer, all JS ──────────────
      send('progress', { pct: 60, msg: '🏗️ Adding features, reviews & footer...' });

      // Strip the PASS1_END marker and any closing tags from part1
      const part1Clean = part1.replace(/<!--\s*PASS1_END\s*-->/gi, '').replace(/<\/body>\s*<\/html>\s*$/i, '').trim();

      const pass2Prompt = `Continue building an Australian ecommerce store. Output ONLY these sections as raw HTML (no preamble, no explanation, start immediately with <section):

Product/niche: ${niche} | Store: ${storeName || niche} | Brand color: ${color}
${productContext}

Images available:
- Lifestyle 1: ${lifestyleImg1}
- Lifestyle 2: ${lifestyleImg2}

BUILD IN ORDER — stop at </footer>, do NOT include <script> tags:

1. FEATURES SECTION <section id="features"> — padding:100px 5%, bg:#08080f
   H2 centered (Syne 800, "Why ${storeName || niche}"). 3-col card grid (gap:20px).
   Each card: bg:#0f1018, border:1px solid rgba(255,255,255,0.06), border-radius:16px, padding:32px 28px, hover border-color:${color}40
   3 features SPECIFIC to ${niche}: emoji icon (font-size:32px) + title (Syne 700 17px) + description (14px, rgba(242,239,233,0.55), line-height:1.7)

2. LIFESTYLE GALLERY <section id="gallery"> — padding:80px 5%, bg:#0a0a12
   2-col grid, max-width:1000px, margin:0 auto
   <img src="${lifestyleImg1}" style="border-radius:16px;width:100%;aspect-ratio:16/10;object-fit:cover;display:block">
   <img src="${lifestyleImg2}" style="border-radius:16px;width:100%;aspect-ratio:16/10;object-fit:cover;display:block">

3. TESTIMONIALS <section id="reviews"> — padding:100px 5%, bg:#08080f
   H2 "Loved by Australians" + p "⭐ 4.9/5 from 200+ verified AU reviews"
   3-col grid. Each card: bg:#0f1018, border:1px solid rgba(255,255,255,0.07), border-radius:16px, padding:28px, border-top:3px solid ${color}
   Stars: ★★★★★ in ${color}. Quote in italic (specific to ${niche}, 1-2 sentences). Name + AU city + <span class="verified">✓ Verified</span>
   Review 1: mentions product result. Review 2: mentions fast AU delivery. Review 3: mentions Afterpay.

4. FAQ <section id="faq"> — padding:80px 5%, bg:#0a0a12, max-width:760px, margin:0 auto
   H2 "Frequently Asked Questions"
   5 divs class="faq-item". Each: bg:#0f1018, border:1px solid rgba(255,255,255,0.07), border-radius:12px, mb:10px
   Inside each: <div class="faq-question"><span>QUESTION</span><span class="faq-toggle">+</span></div>
   <div class="faq-answer"><p>ANSWER</p></div>
   Questions specific to ${niche}.

5. CTA STRIP <section id="offer"> — padding:100px 5%, background:linear-gradient(135deg,#0f1018,rgba(${colorRgb},0.15)), text-align:center
   H2 (Syne 800, clamp(28px,4vw,42px)), p subtext (17px muted), button class="btn-primary btn-cart" "Shop ${storeName || niche} Now"
   <p style="font-family:Syne;font-size:20px;color:${color};margin-top:24px">⏰ Offer ends in: <span id="countdown">23:59:59</span></p>

6. FOOTER <footer> — padding:64px 5% 28px, bg:#050508, border-top:1px solid rgba(255,255,255,0.06)
   4-col grid (1.5fr 1fr 1fr 1fr): brand col (logo in ${color}, Syne 900 + tagline + social links) | Shop col | Support col | Legal col
   <div class="footer-bottom">© 2025 ${storeName || niche}. ABN: [Enter your ABN] · 🇦🇺 Proudly Australian &nbsp;|&nbsp; All prices AUD incl. GST · Australian Consumer Law applies</div>

End your output with </footer> only. No script tags. No </body> or </html>.`;

      let part2 = '';
      const stream2 = await client.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        system: pass2SystemPrompt,
        messages: [{ role: 'user', content: pass2Prompt }],
      });

      for await (const chunk of stream2) {
        if (chunk.type === 'content_block_delta' && (chunk.delta as any).type === 'text_delta') {
          part2 += (chunk.delta as any).text;
          const pct = Math.min(92, 60 + Math.floor((part2.length / 4000) * 32));
          send('progress', { pct, msg: '⚡ Adding reviews, FAQ & finishing...' });
        }
      }

      // ── Pass 3: always inject hard-coded JS + close (no AI needed) ─────
      send('progress', { pct: 93, msg: '⚡ Wiring up interactivity...' });
      const part2Final = part2.trim().replace(/<\/body>\s*<\/html>\s*$/i, '').replace(/<script[\s\S]*?<\/script>/gi, '');

      const hardCodedJs = `
<script>
// Sticky nav
window.addEventListener('scroll', function() {
  var nav = document.querySelector('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});
// Mobile menu
var ham = document.getElementById('hamburger');
var mob = document.getElementById('mobile-menu');
if (ham && mob) { ham.addEventListener('click', function() { mob.classList.toggle('mobile-open'); }); }
// Close mobile menu on link click
if (mob) { mob.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', function() { mob.classList.remove('mobile-open'); }); }); }
// FAQ accordion
document.querySelectorAll('.faq-item').forEach(function(item) {
  var q = item.querySelector('.faq-question');
  if (!q) return;
  q.addEventListener('click', function() {
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); var t = i.querySelector('.faq-toggle'); if (t) t.textContent = '+'; });
    if (!isOpen) { item.classList.add('open'); var t = item.querySelector('.faq-toggle'); if (t) t.textContent = '−'; }
  });
});
// Add to cart feedback
document.querySelectorAll('.btn-cart, .add-to-cart, [data-cart]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var orig = this.textContent;
    this.textContent = '✓ Added to Cart!';
    this.disabled = true;
    var self = this;
    setTimeout(function() { self.textContent = orig; self.disabled = false; }, 2000);
  });
});
// Countdown timer
(function() {
  var t = 23 * 3600 + 59 * 59;
  var el = document.getElementById('countdown');
  if (!el) return;
  setInterval(function() {
    if (t <= 0) t = 86399;
    var h = String(Math.floor(t / 3600)).padStart(2, '0');
    var m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    var s = String(t % 60).padStart(2, '0');
    el.textContent = h + ':' + m + ':' + s;
    t--;
  }, 1000);
})();
</script>
</body>
</html>`;

      // ── Merge all 3 parts ─────────────────────────────────────────────────
      const merged = part1Clean + '\n' + part2Final + hardCodedJs;
      const startIdx = merged.indexOf('<!DOCTYPE');
      const finalHtml = startIdx >= 0 ? merged.slice(startIdx) : merged;

      // ── 4. Done ───────────────────────────────────────────────────────────
      send('progress', { pct: 100, msg: '✅ Store ready!' });
      send('done', { html: finalHtml });
      res.end();
    } catch (err: any) {
      console.error('[website/generate]', err.message);
      try { const errPayload = 'event: error\ndata: ' + JSON.stringify({ error: err.message || 'Generation failed.' }) + '\n\n'; res.write(errPayload); res.end(); } catch {}
    }
  });
}
