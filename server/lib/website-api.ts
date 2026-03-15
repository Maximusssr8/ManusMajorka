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

// ─── Design Directions ────────────────────────────────────────────────────────
export const DESIGN_DIRECTIONS = {
  luxury: {
    label: 'Luxury',
    emoji: '✦',
    googleFonts: 'Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500',
    headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    defaultBg: '#0a0806',
    defaultSurface: '#120f0a',
    defaultText: '#f5f0e8',
    defaultMuted: 'rgba(245,240,232,0.5)',
    h1Size: 'clamp(48px,6vw,84px)',
    headingWeight: '300',
    letterSpacing: '-0.02em',
    cardBorder: '1px solid rgba(201,168,76,0.18)',
    cardRadius: '2px',
    btnRadius: '2px',
    btnStyle: 'border:1px solid currentColor; background:transparent; letter-spacing:0.12em; text-transform:uppercase; font-size:13px;',
    promptNote: 'Editorial luxury aesthetic. Ultra-thin letterforms, generous whitespace, understated gold accents. Every section should feel like a luxury fashion brand (think Bottega Veneta, Aesop). No loud gradients — subtle, refined, sophisticated.',
  },
  brutalist: {
    label: 'Brutalist',
    emoji: '⬛',
    googleFonts: 'Space+Grotesk:wght@500;700;900&family=IBM+Plex+Mono:wght@400;700',
    headingFont: "'Space Grotesk', monospace",
    bodyFont: "'IBM Plex Mono', monospace",
    defaultBg: '#0a0a0a',
    defaultSurface: '#111111',
    defaultText: '#f0f0f0',
    defaultMuted: 'rgba(240,240,240,0.5)',
    h1Size: 'clamp(52px,9vw,100px)',
    headingWeight: '900',
    letterSpacing: '-0.04em',
    cardBorder: '3px solid rgba(240,240,240,0.8)',
    cardRadius: '0px',
    btnRadius: '0px',
    btnStyle: 'border:3px solid currentColor; background:transparent; text-transform:uppercase; font-weight:900; letter-spacing:0.08em;',
    promptNote: 'Raw brutalist aesthetic. No decoration — everything is structure. Thick borders, massive type, grid-based layout. Think Balenciaga website, Diesel. Deliberately harsh but striking.',
  },
  editorial: {
    label: 'Editorial',
    emoji: '📰',
    googleFonts: 'Playfair+Display:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:wght@300;400;600',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Source Serif 4', Georgia, serif",
    defaultBg: '#fafaf8',
    defaultSurface: '#f4f4f0',
    defaultText: '#1a1a1a',
    defaultMuted: 'rgba(26,26,26,0.5)',
    h1Size: 'clamp(44px,6vw,76px)',
    headingWeight: '700',
    letterSpacing: '-0.01em',
    cardBorder: '1px solid rgba(26,26,26,0.1)',
    cardRadius: '4px',
    btnRadius: '4px',
    btnStyle: 'border:1.5px solid #1a1a1a; background:transparent; color:#1a1a1a; font-weight:700; letter-spacing:0.06em;',
    promptNote: 'Editorial magazine aesthetic. Light background, Playfair Display for headings with italic flourishes, strong typographic rhythm. Think Kinfolk magazine, Monocle. Clean, confident, cultured.',
  },
  saas: {
    label: 'SaaS',
    emoji: '⚡',
    googleFonts: 'Syne:wght@600;700;800&family=Inter:wght@400;500;600',
    headingFont: "'Syne', sans-serif",
    bodyFont: "'Inter', sans-serif",
    defaultBg: '#0d1117',
    defaultSurface: '#161b22',
    defaultText: '#e6edf3',
    defaultMuted: 'rgba(230,237,243,0.5)',
    h1Size: 'clamp(40px,5.5vw,68px)',
    headingWeight: '800',
    letterSpacing: '-0.03em',
    cardBorder: '1px solid rgba(48,54,61,0.8)',
    cardRadius: '12px',
    btnRadius: '8px',
    btnStyle: 'background:var(--accent); color:#fff; font-weight:700;',
    promptNote: 'Modern SaaS/tech aesthetic. Think Linear, Vercel, Resend. Clean dark surfaces, electric accent, data-dense cards with subtle gradients. Professional and functional.',
  },
  minimal: {
    label: 'Minimal',
    emoji: '○',
    googleFonts: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700',
    headingFont: "'Libre Baskerville', Georgia, serif",
    bodyFont: "'Lato', sans-serif",
    defaultBg: '#ffffff',
    defaultSurface: '#fafafa',
    defaultText: '#111111',
    defaultMuted: 'rgba(17,17,17,0.45)',
    h1Size: 'clamp(42px,5.5vw,72px)',
    headingWeight: '400',
    letterSpacing: '0',
    cardBorder: '1px solid rgba(17,17,17,0.07)',
    cardRadius: '16px',
    btnRadius: '100px',
    btnStyle: 'background:var(--accent); color:#fff; font-weight:500;',
    promptNote: 'Extreme minimalism. Massive whitespace, one focal point per section, whisper-weight type. Think Apple.com, Muji. Nothing unnecessary — every element earns its place.',
  },
} as const;

export type DesignDirection = keyof typeof DESIGN_DIRECTIONS | 'default';

// ─── Favicon + OG SVG Generator ──────────────────────────────────────────────
function buildFaviconAndOgTags(storeName: string, color: string, niche: string, productTitle?: string, price?: string): string {
  const letter = (storeName || 'S').charAt(0).toUpperCase();
  const safe = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const bg = color.replace('#', '%23');

  // Favicon SVG — letter on colored rounded square
  const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='${bg}'/><text x='50' y='70' font-family='sans-serif' font-size='58' font-weight='900' fill='%23ffffff' text-anchor='middle'>${letter}</text></svg>`;
  const faviconDataUri = 'data:image/svg+xml,' + faviconSvg;

  // OG image SVG — 1200×630 branded card
  const ogColor = bg;
  const ogSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630' width='1200' height='630'><rect width='1200' height='630' fill='%230a0a12'/><rect x='0' y='0' width='6' height='630' fill='${ogColor}'/><text x='80' y='240' font-family='sans-serif' font-size='32' font-weight='900' fill='${ogColor}'>${safe(storeName)}</text><text x='80' y='310' font-family='sans-serif' font-size='64' font-weight='900' fill='%23f2efe9' style='letter-spacing:-2px'>${safe(storeName)}</text><text x='80' y='370' font-family='sans-serif' font-size='24' fill='rgba(242,239,233,0.6)'>${safe(niche || 'Premium Australian Store')}</text><text x='80' y='560' font-family='sans-serif' font-size='18' fill='rgba(242,239,233,0.3)'>🇦🇺 Ships Australia-wide · Afterpay available · 30-day returns</text></svg>`;
  const ogDataUri = 'data:image/svg+xml,' + ogSvg;

  const titleTag = productTitle ? `${safe(productTitle)} | ${safe(storeName)}` : `${safe(storeName)} — Premium ${safe(niche)} for Australians`;
  const metaDesc = productTitle
    ? `Shop ${safe(productTitle)} from ${safe(storeName)}. Free AU shipping on orders $79+. Afterpay available.`
    : `Premium ${safe(niche)} for Australians. Free shipping on orders $79+. Pay with Afterpay. 30-day returns.`;
  const ogTitle = safe(productTitle || storeName);
  const ogDesc = `Shop ${safe(storeName)} — Premium ${safe(niche)} for Australians. Free AU shipping. Afterpay available.`;

  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productTitle || storeName,
    "description": `Premium ${niche} available in Australia. Free shipping on orders over $79.`,
    "brand": { "@type": "Brand", "name": storeName },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "AUD",
      "price": price || "49.95",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": storeName }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "247"
    }
  });

  return `
  <title>${titleTag}</title>
  <meta name="description" content="${metaDesc}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <link rel="icon" type="image/svg+xml" href="${faviconDataUri}">
  <link rel="apple-touch-icon" href="${faviconDataUri}">
  <meta property="og:image" content="${ogDataUri}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${safe(storeName)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${ogDataUri}">
  <link rel="canonical" href="https://your-store-url.com">
  <link rel="manifest" href="manifest.json">
  <script type="application/ld+json">${schemaJson}</script>`;
}

// ─── Manifest Generator ───────────────────────────────────────────────────────
export function buildManifest(storeName: string, color: string, tagline: string): string {
  return JSON.stringify({
    name: storeName,
    short_name: storeName.split(' ')[0],
    description: tagline || `${storeName} — Premium Australian Store`,
    start_url: '/',
    display: 'standalone',
    background_color: color,
    theme_color: color,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }, null, 2);
}

// ─── CSS-only Stagger Animations ─────────────────────────────────────────────
function buildAnimationCss(): string {
  return `
    /* ── Entrance animations ── */
    @keyframes fadeInUp   { from { opacity:0; transform:translateY(32px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
    @keyframes glowPulse  { 0%,100% { box-shadow:0 0 0 0 rgba(var(--accent-rgb,212,175,55),0); } 50% { box-shadow:0 0 20px 4px rgba(var(--accent-rgb,212,175,55),0.35); } }

    /* Hero sequence */
    .hero-content           { opacity:0; animation: fadeInUp 1s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay:0ms; }
    .hero-content h1        { opacity:0; animation: fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay:120ms; }
    .hero-content .hero-sub,
    .hero-content p         { opacity:0; animation: fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay:240ms; }
    .hero-content .hero-buttons,
    .hero-content .btn-primary { opacity:0; animation: fadeInUp 0.8s cubic-bezier(0.22,1,0.36,1) forwards, glowPulse 2.5s ease 1.2s infinite; animation-delay:360ms,1200ms; }
    .hero-content .trust-strip { opacity:0; animation: fadeIn 0.8s ease forwards; animation-delay:600ms; }

    /* Scroll-triggered elements */
    .anim { opacity:0; transform:translateY(28px); transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1); }
    .anim.visible { opacity:1; transform:translateY(0); }
    .anim-delay-1 { transition-delay:0.08s; }
    .anim-delay-2 { transition-delay:0.18s; }
    .anim-delay-3 { transition-delay:0.28s; }

    /* Sticky nav transition */
    nav { transition: background 0.3s ease, border-color 0.3s ease, padding 0.3s ease; }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .anim, .hero-content, .hero-content h1, .hero-content p,
      .hero-content .hero-buttons, .hero-content .trust-strip {
        animation: none !important; opacity:1 !important; transform:none !important; transition:none !important;
      }
    }`;
}

// ─── Stagger observer JS (tiny — not a library) ───────────────────────────────
function buildAnimationJs(): string {
  return `
// Stagger scroll animations
(function() {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.anim').forEach(function(el) { io.observe(el); });
})();`;
}

// ─── Shared JS block (always appended — never AI-generated to avoid truncation) ──
function buildHardCodedJs(): string {
  return `
<script>
// Mobile sticky buy bar
(function() {
  var bar = document.createElement('div');
  bar.id = 'sticky-bar';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#000;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,0.1);transform:translateY(100%);transition:transform 0.3s ease;';
  bar.innerHTML = '<div style="font-size:13px;color:rgba(255,255,255,0.7)">Limited stock available</div><button class="btn-cart" style="background:var(--accent,#d4af37);color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap">Buy Now \\u2192</button>';
  document.body.appendChild(bar);
  function showBar() {
    if (window.innerWidth <= 768) { bar.style.transform = 'translateY(0)'; }
  }
  setTimeout(showBar, 3000);
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) bar.style.transform = 'translateY(100%)';
    else showBar();
  });
})();
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

// ─── HTML Post-Processing ─────────────────────────────────────────────────────
function postProcessHtml(html: string): string {
  // 1. Add loading="lazy" to all images (except first 2 above-fold)
  let imgCount = 0;
  html = html.replace(/<img\s/gi, (match) => {
    imgCount++;
    if (imgCount <= 2) return match;
    return '<img loading="lazy" ';
  });

  // 2. Add explicit width/height to pexels images (intrinsic 800x600)
  html = html.replace(/<img([^>]*src="[^"]*pexels[^"]*")([^>]*)>/gi, (match, before: string, after: string) => {
    if (/width=/i.test(match)) return match;
    return `<img${before} width="800" height="600"${after}>`;
  });

  // 3. Light minify — collapse 3+ blank lines into 2
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n');

  // 4. Remove HTML comments (except IE conditionals)
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/gi, '');

  return html;
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
  designDirection?: DesignDirection;
  onProgress?: (pct: number, msg: string) => void;
}): Promise<{ html: string; manifest: string }> {
  const { niche, storeName, targetAudience, vibe, accentColor, price, productData, designDirection = 'default' } = params;
  const progress = params.onProgress || (() => {});
  const dir = designDirection !== 'default' ? DESIGN_DIRECTIONS[designDirection as keyof typeof DESIGN_DIRECTIONS] : null;
  const color = accentColor || (dir ? '#d4af37' : '#d4af37');
  const bgColor   = dir?.defaultBg      || '#08080f';
  const surfColor = dir?.defaultSurface || '#0f1018';
  const textColor = dir?.defaultText    || '#f2efe9';
  const mutedColor= dir?.defaultMuted   || 'rgba(242,239,233,0.55)';
  const headingFont = dir?.headingFont  || "'Syne', sans-serif";
  const bodyFont    = dir?.bodyFont     || "'DM Sans', sans-serif";
  const googleFontUrl = dir?.googleFonts || 'Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500';
  const h1Size      = dir?.h1Size       || 'clamp(44px,7vw,72px)';
  const headingWeight = dir?.headingWeight || '900';
  const cardBorder  = dir?.cardBorder   || '1px solid rgba(255,255,255,0.07)';
  const cardRadius  = dir?.cardRadius   || '16px';
  const btnRadius   = dir?.btnRadius    || '10px';
  const dirNote     = dir?.promptNote   || 'Modern dark DTC brand aesthetic.';

  // ── 1. Fetch real images from Pexels ───────────────────────────────────────
  const searchQuery = productData?.product_title || niche;
  let heroImg = 'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg';
  let productImg = 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg';
  let lifestyleImg1 = 'https://images.pexels.com/photos/3965548/pexels-photo-3965548.jpeg';
  let lifestyleImg2 = 'https://images.pexels.com/photos/3965549/pexels-photo-3965549.jpeg';
  let heroImg2 = heroImg;

  try {
    const [heroImages, productPortrait] = await Promise.all([
      fetchPexelsImages(searchQuery, 5),
      fetchPexelsPortrait(searchQuery),
    ]);

    if (heroImages.length >= 1) heroImg = heroImages[0];
    heroImg2 = heroImages[1] || heroImg;
    if (productPortrait) productImg = productPortrait;
    else if (heroImages.length >= 3) productImg = heroImages[2];
    if (heroImages.length >= 3) lifestyleImg1 = heroImages[2];
    if (heroImages.length >= 4) lifestyleImg2 = heroImages[3];
  } catch (err) {
    console.warn('[website-api] Pexels fetch failed, using fallbacks:', (err as Error).message);
  }

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
  const storeName_ = storeName || niche;
  const colorRgb2 = colorRgb; // alias

  progress(10, '\U0001f50d Finding product images...');

  const client = getAnthropicClient();
  const pdTitle = pd.product_title as string | undefined;
  const pdPrice = price || (pd.price_aud ? String(pd.price_aud) : (pd.suggested_price_aud ? String(pd.suggested_price_aud) : undefined));
  const faviconOgHtml = buildFaviconAndOgTags(storeName_, color, niche, pdTitle, pdPrice);
  const animCss = buildAnimationCss();
  const manifestJson = buildManifest(storeName_, color, vibe || ('Premium ' + niche + ' for Australians'));

  progress(25, '\U0001f3a8 Building layout & styles...');

  const isLight = ['editorial', 'minimal'].includes(designDirection as string);

  const systemPrompt = `You are a world-class frontend developer. Output ONLY raw HTML — no markdown, no explanation. Start with <!DOCTYPE html>.
RULES: All CSS in one <style> block in <head>. No external CSS frameworks. Google Fonts via <link> only. Use exact image URLs given. AU English (colour, Afterpay, AusPost, AUD).

AUSTRALIAN COPY RULES (enforce strictly):
- Currency: AUD $ only (never USD)
- Shipping: "Free AU Shipping on orders $79+" or "Ships from our Sydney warehouse"
- Trust: "Australian owned & operated" | "ABN registered" | "ACCC compliant"
- Afterpay: "Pay in 4 interest-free instalments with Afterpay — available on orders $35–$2000"
- Never mention: "Lower 48 states", "CONUS", "continental US", USD prices
- Product reviews: use Australian names and cities (Sarah M., Melbourne | Jake T., Brisbane | Emma K., Perth)
- Date format: DD/MM/YYYY if shown
- Phone: Australian mobile format if shown (04XX XXX XXX)`;

  const pass1 = `Build the first half of an Australian ecommerce store.

DESIGN DIRECTION: ${dir?.label || 'Default Dark DTC'}
${dirNote}

Store: ${storeName_} | Brand color: ${color} | Style: ${vibe || 'match design direction'}
${productContext}

TYPOGRAPHY:
- Heading font: ${headingFont} | Body: ${bodyFont}
- Google Fonts URL: ${googleFontUrl}
- H1: ${h1Size} weight:${headingWeight} letter-spacing:${dir?.letterSpacing || '-0.03em'}

COLORS: bg:${bgColor} | surface:${surfColor} | text:${textColor} | muted:${mutedColor} | accent:${color}

CRITICAL — inject this :root block at the TOP of the <style> tag:
:root { --bg: ${bgColor}; --surface: ${surfColor}; --text: ${textColor}; --accent: ${color}; --muted: ${mutedColor}; --border: ${cardBorder}; }
Reference these throughout: background: var(--bg); color: var(--text); etc.

INJECT in <head> verbatim:
` + faviconOgHtml + `

INJECT in <style> verbatim (animation system):
` + animCss + `

CRITICAL MOBILE CSS (@media max-width:768px) — include ALL of:
nav .nav-center, nav .nav-cta { display:none; }
#hamburger { display:flex; }
#mobile-menu { display:none; position:fixed; inset:0; z-index:9999; background:${isLight ? 'rgba(250,250,250,0.98)' : 'rgba(8,8,15,0.98)'}; flex-direction:column; align-items:center; justify-content:center; gap:36px; font-size:22px; }
#mobile-menu.mobile-open { display:flex; }
.product-grid,.features-grid,.testimonials-grid,.lifestyle-grid { grid-template-columns:1fr; }
.footer-grid { grid-template-columns:1fr 1fr; }
section { padding:64px 5%; }

WRITE CSS for every section class: .announcement-bar, nav, .hero, .product-grid, .product-info, .features-grid, .feature-card, .lifestyle-grid, .testimonials-grid, .testimonial-card, .faq-item, .faq-question, .faq-answer, .faq-toggle, footer, .footer-grid, .footer-bottom
Card style: border:${cardBorder}; border-radius:${cardRadius};
Button: border-radius:${btnRadius}; ${dir?.btnStyle || 'background:var(--accent); color:#fff;'}

SECTIONS TO BUILD:

1. ANNOUNCEMENT BAR — bg:${color}, color:${isLight ? '#fff' : '#08080f'}, font-weight:700, 13px
   .marquee-inner display:flex white-space:nowrap animation:marquee 28s linear infinite
   Duplicate text 4x: "\U0001f525 Free AU shipping $79+ &nbsp;|&nbsp; \u26a1 Afterpay &nbsp;|&nbsp; \U0001f1e6\U0001f1fa Ships AU warehouse &nbsp;|&nbsp; \u2713 30-day returns"

2. STICKY NAV — height:68px sticky top:0 z-index:1000 backdrop-filter:blur(20px)
   bg:${isLight ? 'rgba(250,250,250,0.9)' : 'rgba(8,8,15,0.85)'}; border-bottom:${cardBorder}
   .scrolled: bg:${isLight ? 'rgba(250,250,250,0.98)' : 'rgba(8,8,15,0.97)'}
   Logo (heading font 900 color:${color}) | .nav-center links | .nav-cta Shop Now btn
   id="hamburger" 3-line mobile button (3 spans 24px wide 2px high gap 5px)
   id="mobile-menu" overlay with same nav links

3. HERO — min-height:100vh bg:url(${heroImg}) center/cover
   overlay ${isLight ? 'rgba(0,0,0,0.45)' : 'rgba(8,8,15,0.62)'}
   .hero-content class="hero-content anim" centered z-index:1 max-width:720px text-align:center
   AU badge bg:${color}22 border:1px solid ${color}55 color:${color} uppercase 11px border-radius:99px
   H1 ${h1Size} weight:${headingWeight} font-family:${headingFont} color:#fff — specific to ${niche}
   Subheadline 18px rgba(255,255,255,0.75) — specific benefit
   Two buttons + trust strip (3 items with checkmarks)

SOCIAL PROOF BAR — immediately after hero, before product section
- bg: slightly lighter than main bg (${surfColor}), padding: 24px 5%, border-top/bottom: 1px solid ${cardBorder}
- Single row, centered, flex wrap, gap: 40px
- Content: "★ 4.9/5 from 2,400+ Australian customers" | "🏆 #1 AU Dropshipping Platform" | "🇦🇺 10,000+ stores built" | "⚡ Ships same day from AU warehouse"
- Font: 13px, ${mutedColor}, font-weight 600
- On mobile (@media max-width:768px): 2x2 grid, grid-template-columns: 1fr 1fr, gap: 16px, text-align: center

4. PRODUCT SECTION — padding:100px 5% bg:${surfColor} max-width:1100px margin:0 auto
   .product-grid 2-col gap:60px
   LEFT: img card border-radius:${cardRadius} border:${cardBorder} overflow:hidden <img src="${productImg}"> + BEST SELLER badge
   RIGHT: name (heading font 28px 700) | stars \u2605\u2605\u2605\u2605\u2605 color:${color} "4.9 (247 reviews)" | price (heading font 40px 900 color:${color}) + struck | Afterpay row bg:rgba(${colorRgb},0.08) | stock warning #f59e0b | Add to Cart btn class="btn-cart" (full-width ${color}) | Buy Now | 6 benefits specific to ${niche}

End output after product </section>. Do NOT write features/testimonials/FAQ yet.`;

  const msg1 = await client.messages.create({ model: CLAUDE_MODEL, max_tokens: 6000, system: systemPrompt, messages: [{ role: 'user', content: pass1 }] });
  const text1 = ((msg1.content[0] as any)?.text as string | undefined)?.trim() || '';
  if (!text1 || text1.length < 500) throw new Error('AI generation returned insufficient content — please try again.');
  const part1Clean = text1.replace(/<\/body>\s*<\/html>\s*$/i, '').trim();

  progress(60, '\U0001f3d7\ufe0f Adding features, reviews & footer...');

  const pass2 = `Continue this ${dir?.label || 'dark'} Australian ecommerce store. Output only raw HTML. Start with <section id="features"> immediately.

Niche: ${niche} | Color: ${color} | bg: ${bgColor} | surface: ${surfColor} | card-border: ${cardBorder} | card-radius: ${cardRadius}
${productContext}
Lifestyle images: ${lifestyleImg1} | ${lifestyleImg2}

NOTE: A social proof bar already exists between the hero and product section (from pass 1). Do not duplicate it.
Add class="anim" to first H2 of each section. Add class="anim anim-delay-1/2/3" to card elements.

5. <section id="features"> padding:100px 5% bg:${bgColor}
   H2 class="anim" centered heading-font 800. class="features-grid" 3-col.
   3x <div class="feature-card anim anim-delay-N"> EMOJI icon H3 P — specific to ${niche}

6. <section id="gallery"> padding:80px 5% bg:${surfColor}
   <div class="lifestyle-grid"> 2-col max-width:1000px margin:0 auto
   <img src="${lifestyleImg1}" style="border-radius:${cardRadius};width:100%;aspect-ratio:16/10;object-fit:cover">
   <img src="${lifestyleImg2}" style="border-radius:${cardRadius};width:100%;aspect-ratio:16/10;object-fit:cover">

7. <section id="reviews"> padding:100px 5% bg:${bgColor}
   H2 class="anim" + p "\u2b50 4.9/5 · 200+ verified AU reviews". class="testimonials-grid" 3-col.
   3 realistic AU reviews:
   - Card 1 (5★): Sarah M. from Melbourne — mentions specific product result
   - Card 2 (5★): Jake T. from Brisbane — mentions fast AU shipping + Afterpay
   - Card 3 (4★): Emma K. from Perth — mentions value for money, small critique (believable)
   Each card: <div class="testimonial-card anim anim-delay-N"> stars in accent colour | italic quote | name bold | city muted | "✓ Verified Purchase" badge in accent colour

8. <section id="faq"> padding:80px 5% bg:${surfColor} max-width:760px margin:0 auto
   H2 class="anim". 6x <div class="faq-item"><div class="faq-question"><span>Q</span><span class="faq-toggle">+</span></div><div class="faq-answer"><p>A</p></div></div>
   Q1: Shipping — "How long does delivery take?" (answer: 3-7 business days AU wide, same-day dispatch)
   Q2: Returns — "What's your return policy?" (answer: 30-day no-questions-asked, AU Consumer Law)
   Q3: Product quality — specific to ${niche}
   Q4: Payment — "Do you accept Afterpay?" (answer: yes, orders $35–$2000)
   Q5: Authenticity — specific to ${niche}
   Q6: Sizing/fit or product-specific question

9. <section id="offer"> padding:100px 5% text-align:center bg:linear-gradient(135deg,${surfColor},rgba(${colorRgb},0.12))
   H2 class="anim" | p subtext | <button class="btn-primary btn-cart">Shop ${storeName_} Now</button>
   <p style="font-size:20px;color:${color};margin-top:24px">\u23f0 Offer ends in: <span id="countdown">23:59:59</span></p>

10. <footer> padding:64px 5% 28px bg:${isLight ? '#f0f0ec' : '#050508'} border-top:${cardBorder}
    <div class="footer-grid"> 4 cols: brand(logo+tagline+social) | Shop | Support | Legal
    <div class="footer-bottom">\u00a9 2025 ${storeName_}. ABN: [Your ABN] \U0001f1e6\U0001f1fa | All prices AUD incl. GST</div>

End with </footer> only. No script tags.`;

  const msg2 = await client.messages.create({ model: CLAUDE_MODEL, max_tokens: 6000, system: 'Output only HTML starting from <section id="features">. No explanation. No script tags.', messages: [{ role: 'user', content: pass2 }] });
  const text2 = ((msg2.content[0] as any)?.text as string | undefined)?.trim() || '';
  if (!text2 || text2.length < 500) throw new Error('AI generation returned insufficient content — please try again.');
  const part2Raw = text2.replace(/<\/body>\s*<\/html>\s*$/i, '').replace(/<script[\s\S]*?<\/script>/gi, '');

  progress(92, '\u26a1 Wiring interactivity...');

  const jsWithAnim = buildHardCodedJs().replace('</script>', buildAnimationJs() + '\n</script>');
  const merged = part1Clean + '\n' + part2Raw + '\n' + jsWithAnim;
  const startIdx = merged.indexOf('<!DOCTYPE');
  const rawHtml = startIdx >= 0 ? merged.slice(startIdx) : merged;
  const finalHtml = postProcessHtml(rawHtml);

  const sizeKb = Math.round(Buffer.byteLength(finalHtml, 'utf8') / 1024);
  console.log(`[website-api] Generated HTML size: ${sizeKb}kb`);
  if (sizeKb > 120) console.warn(`[website-api] HTML exceeds 120kb target (${sizeKb}kb) — consider trimming prompts`);

  return { html: finalHtml, manifest: manifestJson };
}

// ─── Colour Palette Generator ─────────────────────────────────────────────────
interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  swatches: string[];
  rationale?: string;
}

export async function generateColorPalette(params: {
  niche: string;
  brandColor?: string;
  direction?: DesignDirection;
}): Promise<ColorPalette> {
  const { niche, brandColor, direction } = params;
  const dir = direction && direction !== 'default' ? DESIGN_DIRECTIONS[direction as keyof typeof DESIGN_DIRECTIONS] : null;

  const client = getAnthropicClient();
  const prompt = `Generate a cohesive 6-colour palette for an Australian ecommerce store in the "${niche}" niche.
Design direction: ${dir?.label || 'Modern dark DTC'}
${brandColor ? `Starting/accent colour: ${brandColor}` : ''}
${dir?.promptNote || ''}

Output ONLY valid JSON (no markdown):
{
  "primary": "#hex",
  "secondary": "#hex",
  "accent": "#hex",
  "background": "#hex",
  "surface": "#hex",
  "text": "#hex",
  "muted": "#hex (with 60-70% opacity as hex8 or rgba)",
  "swatches": ["#hex1","#hex2","#hex3","#hex4","#hex5","#hex6"],
  "rationale": "one sentence"
}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (msg.content[0] as { type: 'text'; text: string }).text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(raw) as ColorPalette;
  } catch {
    return {
      primary: brandColor || '#d4af37',
      secondary: '#1a1a2a',
      accent: brandColor || '#d4af37',
      background: dir?.defaultBg || '#08080f',
      surface: dir?.defaultSurface || '#0f1018',
      text: dir?.defaultText || '#f2efe9',
      muted: dir?.defaultMuted || 'rgba(242,239,233,0.55)',
      swatches: [brandColor || '#d4af37', '#1a1a2a', '#0f1018', '#08080f', '#f2efe9', '#52525b'],
    };
  }
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

  // POST /api/website/generate — delegates to generateFullStore with SSE progress
  app.post('/api/website/generate', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

      const { niche, storeName, targetAudience, vibe, accentColor, price, productData, designDirection } = req.body as {
        niche?: string; storeName?: string; targetAudience?: string;
        vibe?: string; accentColor?: string; price?: string;
        productData?: Record<string, any>; designDirection?: string;
      };
      if (!niche) { res.status(400).json({ error: 'niche is required.' }); return; }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const send = (evt: string, data: any) => res.write('event: ' + evt + '\ndata: ' + JSON.stringify(data) + '\n\n');

      req.on('close', () => {
        console.log('[website/generate] client disconnected');
      });

      const result = await generateFullStore({
        niche,
        storeName: storeName || niche,
        targetAudience,
        vibe,
        accentColor,
        price,
        productData,
        designDirection: (designDirection as any) || 'default',
        onProgress: (pct, msg) => send('progress', { pct, msg }),
      });

      send('done', { html: result.html, manifest: result.manifest });
      res.end();
    } catch (err: any) {
      console.error('[website/generate]', err.message);
      const safeMsg = (err.message && !err.message.includes('at ') && err.message.length < 200)
        ? err.message
        : 'Generation failed — please try again.';
      try { const ep = 'event: error\ndata: ' + JSON.stringify({ error: safeMsg }) + '\n\n'; res.write(ep); res.end(); } catch {}
    }
  });

  // POST /api/website/palette — AI colour palette generator
  app.post('/api/website/palette', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

      const { niche, brandColor, direction } = req.body as { niche?: string; brandColor?: string; direction?: string };
      if (!niche) { res.status(400).json({ error: 'niche is required.' }); return; }

      const palette = await generateColorPalette({
        niche,
        brandColor: brandColor || undefined,
        direction: (direction as DesignDirection) || undefined,
      });
      res.json(palette);
    } catch (err: any) {
      console.error('[website/palette]', err.message);
      res.status(500).json({ error: err.message || 'Palette generation failed.' });
    }
  });

  // POST /api/website/enhance-description — AI product description enhancer
  app.post('/api/website/enhance-description', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

      const { description, niche } = req.body as { description?: string; niche?: string };
      if (!description) { res.status(400).json({ error: 'description required' }); return; }

      const client = getAnthropicClient();
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: `Rewrite this product description for an Australian ecommerce store in 3 styles.
Product/niche: ${niche || 'general'}
Raw description: "${description}"

Output ONLY JSON:
{
  "benefit": "benefit-focused version (lead with the #1 outcome, AU English, max 2 sentences)",
  "story": "story-driven version (founder/brand narrative, emotional connection, max 2 sentences)",
  "urgency": "urgency/scarcity focused (FOMO, limited availability, AU English, max 2 sentences)"
}` }],
      });
      const raw = (msg.content[0] as { type: 'text'; text: string }).text.replace(/```json|```/g, '').trim();
      try { res.json(JSON.parse(raw)); } catch { res.status(500).json({ error: 'Parse failed' }); }
    } catch (err: any) {
      console.error('[website/enhance-description]', err.message);
      res.status(500).json({ error: err.message || 'Enhancement failed.' });
    }
  });

  // POST /api/website/headline-variants — generate 3 hero headline variants
  app.post('/api/website/headline-variants', async (req, res) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const { niche, storeName, productData } = req.body as { niche?: string; storeName?: string; productData?: Record<string, unknown> };
      const client = getAnthropicClient();
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: `Generate 3 hero headline variants for an Australian ecommerce store.
Niche: ${niche} | Store: ${storeName || niche}
${(productData as Record<string, unknown>)?.product_title ? 'Product: ' + (productData as Record<string, unknown>).product_title : ''}

Output ONLY JSON:
{
  "painPoint": "Tired of [specific problem]? [One-line solution]",
  "benefit": "The [product] that [specific quantified benefit] for Australians",
  "socialProof": "Join 12,000+ Australians who [specific outcome with product]"
}
All headlines AU English. No clichés. Be specific to the niche.` }],
      });
      const raw = ((msg.content[0] as { type: 'text'; text: string }).text).replace(/```json|```/g, '').trim();
      try { res.json(JSON.parse(raw)); } catch { res.status(500).json({ error: 'Parse failed' }); }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Headline generation failed.';
      console.error('[website/headline-variants]', message);
      res.status(500).json({ error: message });
    }
  });
}