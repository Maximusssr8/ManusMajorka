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
import { requireSubscription } from '../middleware/requireSubscription';

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
// ─── Curated niche fallback images (always-on Pexels URLs) ──────────────────
const NICHE_FALLBACKS: Record<string, { hero: string; product: string; lifestyle1: string; lifestyle2: string }> = {
  skincare:     { hero: 'https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg', product: 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg', lifestyle1: 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg', lifestyle2: 'https://images.pexels.com/photos/3373739/pexels-photo-3373739.jpeg' },
  beauty:       { hero: 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg', product: 'https://images.pexels.com/photos/2253833/pexels-photo-2253833.jpeg', lifestyle1: 'https://images.pexels.com/photos/3373746/pexels-photo-3373746.jpeg', lifestyle2: 'https://images.pexels.com/photos/3373739/pexels-photo-3373739.jpeg' },
  fitness:      { hero: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg',   product: 'https://images.pexels.com/photos/4162486/pexels-photo-4162486.jpeg', lifestyle1: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg', lifestyle2: 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg' },
  supplements:  { hero: 'https://images.pexels.com/photos/3621168/pexels-photo-3621168.jpeg', product: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg', lifestyle1: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', lifestyle2: 'https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg' },
  pet:          { hero: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg', product: 'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg',   lifestyle1: 'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg', lifestyle2: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg' },
  home:         { hero: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', product: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg', lifestyle1: 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg', lifestyle2: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg' },
  tech:         { hero: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',   product: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg', lifestyle1: 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg', lifestyle2: 'https://images.pexels.com/photos/2182973/pexels-photo-2182973.jpeg' },
  fashion:      { hero: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg', product: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg',   lifestyle1: 'https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg', lifestyle2: 'https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg' },
  outdoor:      { hero: 'https://images.pexels.com/photos/1526713/pexels-photo-1526713.jpeg', product: 'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg', lifestyle1: 'https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg', lifestyle2: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg' },
  baby:         { hero: 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg', product: 'https://images.pexels.com/photos/459947/pexels-photo-459947.jpeg', lifestyle1: 'https://images.pexels.com/photos/1912868/pexels-photo-1912868.jpeg', lifestyle2: 'https://images.pexels.com/photos/265987/pexels-photo-265987.jpeg' },
  coffee:       { hero: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',   product: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg',   lifestyle1: 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg', lifestyle2: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg' },
  jewellery:    { hero: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg', product: 'https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg', lifestyle1: 'https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg', lifestyle2: 'https://images.pexels.com/photos/1689731/pexels-photo-1689731.jpeg' },
  default:      { hero: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg', product: 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg', lifestyle1: 'https://images.pexels.com/photos/3965548/pexels-photo-3965548.jpeg', lifestyle2: 'https://images.pexels.com/photos/3965549/pexels-photo-3965549.jpeg' },
};

function getNicheFallback(niche: string) {
  const n = niche.toLowerCase();
  if (/skin|glow|serum|face|led|light|mask|acne|anti.ag/.test(n)) return NICHE_FALLBACKS.skincare;
  if (/beauty|makeup|cosmetic|lash|brow/.test(n)) return NICHE_FALLBACKS.beauty;
  if (/fit|gym|workout|exercise|yoga|sport|protein/.test(n)) return NICHE_FALLBACKS.fitness;
  if (/supplement|vitamin|health|wellness|nutrition/.test(n)) return NICHE_FALLBACKS.supplements;
  if (/pet|dog|cat|paw|collar|treat/.test(n)) return NICHE_FALLBACKS.pet;
  if (/home|kitchen|cook|decor|clean|organi/.test(n)) return NICHE_FALLBACKS.home;
  if (/tech|gadget|electronic|phone|device|charger/.test(n)) return NICHE_FALLBACKS.tech;
  if (/fashion|cloth|wear|shirt|dress|shoe|bag/.test(n)) return NICHE_FALLBACKS.fashion;
  if (/outdoor|hike|camp|adventure|trail/.test(n)) return NICHE_FALLBACKS.outdoor;
  if (/baby|kid|child|infant|toy/.test(n)) return NICHE_FALLBACKS.baby;
  if (/coffee|tea|brew|caf/.test(n)) return NICHE_FALLBACKS.coffee;
  if (/jewel|ring|necklace|bracelet|watch/.test(n)) return NICHE_FALLBACKS.jewellery;
  return NICHE_FALLBACKS.default;
}

async function pexelsSearch(query: string, count: number, orientation: 'landscape' | 'portrait' | 'square' = 'landscape'): Promise<any[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}`,
    { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return [];
  const data = await res.json() as any;
  return data.photos || [];
}

function bestUrl(photo: any): string {
  return photo?.src?.large2x || photo?.src?.large || photo?.src?.medium || '';
}

// Multi-query Pexels fetcher: tries specific → simplified → category fallback
function sanitizeProductTitle(raw: string, niche: string): string {
  if (!raw) return niche;
  // Strip titles that are just "Product from aliexpress.com" etc.
  if (/product from (aliexpress|amazon|shopify|ebay|temu|dhgate|alibaba|walmart|wish|taobao)/i.test(raw)) return niche;
  // Strip trailing domain suffixes: "Great Leggings | AliExpress" or "Leggings - AliExpress.com"
  let clean = raw
    .replace(/\s*[|–\-—]+\s*(aliexpress|amazon|ebay|temu|dhgate|shopify|alibaba|taobao)\.?(com)?\s*$/gi, '')
    .replace(/\s*(aliexpress|amazon|ebay|temu|dhgate)\.com.*/gi, '')
    .trim();
  if (!clean || clean.length < 3) return niche;
  return clean;
}

async function fetchImagesForStore(productTitle: string, niche: string): Promise<{
  hero: string; product: string; lifestyle1: string; lifestyle2: string; shopImages: string[];
}> {
  const fallback = getNicheFallback(niche);

  // Build query variants from most specific to broadest
  const specificQuery = productTitle
    .replace(/\b(device|machine|tool|kit|set|pack|system|pro|plus|max|ultra|v\d)\b/gi, '')
    .trim();
  // Lifestyle query: niche + context word (no product hardware terms)
  const nicheWords = niche.replace(/\b(device|machine|tool|kit|set)\b/gi, '').trim();
  const heroQuery = `${nicheWords} lifestyle australian woman`;
  const productQuery = `${specificQuery} product white background`;
  const lifestyleQuery = `${nicheWords} before after result`;

  try {
    // Parallel: hero + lifestyle (landscape), product (portrait/square)
    const [heroPhotos, productPhotos, lifestylePhotos] = await Promise.all([
      pexelsSearch(heroQuery, 4, 'landscape').catch(() => []),
      pexelsSearch(productQuery, 3, 'portrait').catch(() => []),
      pexelsSearch(lifestyleQuery, 3, 'landscape').catch(() => []),
    ]);

    // If specific query yields < 2 results, fall back to broader niche
    const nichePhotos = (heroPhotos.length < 2 || productPhotos.length < 1)
      ? await pexelsSearch(nicheWords, 5, 'landscape').catch(() => [])
      : [];

    const pool = [...heroPhotos, ...nichePhotos];

    // Also fetch 6 shop product images (portrait/square, varied queries)
    const shopVariants = [
      nicheWords,
      `${nicheWords} product`,
      `${nicheWords} lifestyle`,
    ];
    const shopResults = await Promise.all(
      shopVariants.map(q => pexelsSearch(q, 3, 'square').catch(() => []))
    );
    const shopPool = shopResults.flat();
    const shopImages = shopPool
      .map(p => bestUrl(p))
      .filter(Boolean)
      .slice(0, 6);

    const hero      = bestUrl(pool[0])       || fallback.hero;
    const product   = bestUrl(productPhotos[0] || pool[1]) || fallback.product;
    const lifestyle1 = bestUrl(lifestylePhotos[0] || pool[2]) || fallback.lifestyle1;
    const lifestyle2 = bestUrl(lifestylePhotos[1] || pool[3]) || fallback.lifestyle2;

    // Deduplicate
    return {
      hero,
      product:    product    === hero ? fallback.product    : product,
      lifestyle1: lifestyle1 === hero ? fallback.lifestyle1 : lifestyle1,
      lifestyle2: lifestyle2 === hero || lifestyle2 === lifestyle1 ? fallback.lifestyle2 : lifestyle2,
      shopImages: shopImages.length >= 3 ? shopImages : [fallback.product, fallback.lifestyle1, fallback.lifestyle2, fallback.hero, fallback.lifestyle1, fallback.lifestyle2],
    };
  } catch {
    return { ...fallback, shopImages: [fallback.product, fallback.lifestyle1, fallback.lifestyle2, fallback.hero, fallback.lifestyle1, fallback.lifestyle2] };
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
      "price": (price || "49.95").replace(/[$,AUD\s]/g, ''),
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
(function() {

// ── 0. Ensure page is visible (safety net for any render blockers) ───────────
setTimeout(function() { document.documentElement.style.opacity = '1'; document.documentElement.style.animation = 'none'; }, 2000);

// ── 1. Hash Router ──────────────────────────────────────────────────────────
function route() {
  var hash = (location.hash || '#home').replace('#','');
  document.querySelectorAll('[data-page]').forEach(function(p) {
    p.style.display = (p.dataset.page === hash) ? 'block' : 'none';
  });
  document.querySelectorAll('a[data-nav]').forEach(function(a) {
    var active = a.dataset.nav === hash;
    a.style.color = active ? 'var(--accent,#d4af37)' : '';
    a.style.fontWeight = active ? '700' : '';
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
  // Re-wire cart buttons for newly visible page
  document.dispatchEvent(new CustomEvent('clawPageChange'));
}
window.addEventListener('hashchange', route);
route();

// ── 2. Sticky Nav ────────────────────────────────────────────────────────────
var nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', function() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, { passive: true });
}

// ── 3. Mobile Hamburger ───────────────────────────────────────────────────────
var hamburger = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.onclick = function() { mobileMenu.classList.toggle('mobile-open'); };
  mobileMenu.querySelectorAll('a').forEach(function(a) {
    a.onclick = function() { mobileMenu.classList.remove('mobile-open'); };
  });
}

// ── 4. FAQ Accordion ─────────────────────────────────────────────────────────
document.querySelectorAll('.faq-question').forEach(function(q) {
  q.onclick = function() {
    var item = q.closest('.faq-item');
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(o) { o.classList.remove('open'); var t = o.querySelector('.faq-toggle'); if(t) t.textContent='+'; });
    if (!isOpen) { item.classList.add('open'); var t = item.querySelector('.faq-toggle'); if(t) t.textContent='\\u2212'; }
  };
});

// ── 5. Countdown Timer ───────────────────────────────────────────────────────
var cdEl = document.getElementById('countdown');
if (cdEl) {
  var t = 23*3600 + 59*60 + 59;
  setInterval(function() {
    t--;
    if (t < 0) t = 86399;
    var h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = t%60;
    cdEl.textContent = (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }, 1000);
}

// ── 6. Cart System ────────────────────────────────────────────────────────────
var cartCount = 0;
var cartItems = [];

var cartSidebar = document.createElement('div');
cartSidebar.id = 'cart-sidebar';
cartSidebar.style.cssText = 'position:fixed;top:0;right:0;width:380px;max-width:95vw;height:100vh;z-index:10000;background:var(--surface,#0f1018);border-left:1px solid rgba(255,255,255,0.08);transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.22,1,0.36,1);display:flex;flex-direction:column;';
cartSidebar.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);"><span style="font-family:var(--font-heading,Syne);font-size:18px;font-weight:800;color:var(--text,#f2efe9)">Your Cart</span><button id="cart-close" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:24px;line-height:1;padding:0;">&times;</button></div><div id="cart-items" style="flex:1;overflow-y:auto;padding:16px 24px;"></div><div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.08);"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="color:var(--text,#f2efe9);font-weight:600">Total</span><span id="cart-total" style="color:var(--accent,#d4af37);font-family:var(--font-heading,Syne);font-weight:800;font-size:20px">AUD $0.00</span></div><div style="font-size:12px;color:var(--muted);margin-bottom:12px;text-align:center">Pay in 4 with Afterpay \\u00b7 Free AU shipping over $79</div><button onclick="alert(\\x27Checkout coming soon!\\x27)" style="width:100%;padding:16px;background:var(--accent,#d4af37);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:800;cursor:pointer;font-family:var(--font-heading,Syne);">Checkout \\u2192</button></div>';
document.body.appendChild(cartSidebar);

var cartOverlay = document.createElement('div');
cartOverlay.id = 'cart-overlay';
cartOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:none;backdrop-filter:blur(4px);';
document.body.appendChild(cartOverlay);

function openCart() { cartSidebar.style.transform='translateX(0)'; cartOverlay.style.display='block'; }
function closeCart() { cartSidebar.style.transform='translateX(100%)'; cartOverlay.style.display='none'; }
window.openCart = openCart;

document.getElementById('cart-close').onclick = closeCart;
cartOverlay.onclick = closeCart;

function renderCart() {
  var el = document.getElementById('cart-items');
  var totalEl = document.getElementById('cart-total');
  if (!el || !totalEl) return;
  if (cartItems.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--muted,rgba(242,239,233,0.4))"><div style="font-size:40px;margin-bottom:12px">\\ud83d\\uded2</div><div>Your cart is empty</div></div>';
    totalEl.textContent = 'AUD $0.00';
    return;
  }
  var total = 0;
  el.innerHTML = cartItems.map(function(item,i) {
    total += item.price * item.qty;
    return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><img src="' + item.img + '" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.style.background=\\x27rgba(255,255,255,0.06)\\x27"><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:var(--text,#f2efe9);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + item.name + '</div><div style="font-size:12px;color:var(--muted)">Qty: ' + item.qty + '</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;"><span style="color:var(--accent,#d4af37);font-weight:800;font-size:14px">$' + (item.price*item.qty).toFixed(2) + '</span><button onclick="removeFromCart(' + i + ')" style="background:none;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:var(--muted);cursor:pointer;font-size:11px;padding:2px 6px;">\\u2715</button></div></div>';
  }).join('');
  totalEl.textContent = 'AUD $' + total.toFixed(2);
  updateCartBadge();
}

window.removeFromCart = function(i) { cartItems.splice(i,1); cartCount=cartItems.reduce(function(s,it){return s+it.qty;},0); renderCart(); };

function updateCartBadge() {
  var badges = document.querySelectorAll('.cart-badge');
  badges.forEach(function(b) { b.textContent = cartCount; b.style.display = cartCount > 0 ? 'flex' : 'none'; });
}

window.addToCart = function(name, price, img) {
  cartCount++;
  var existing = cartItems.find(function(it) { return it.name === name; });
  if (existing) existing.qty++;
  else cartItems.push({ name: name, price: parseFloat(price) || 49.95, img: img || '', qty: 1 });
  renderCart();
  openCart();
};

// Wire ALL .btn-cart buttons — runs on DOMContentLoaded AND after page navigation
function wireCartButtons() {
  document.querySelectorAll('.btn-cart:not([data-wired])').forEach(function(btn) {
    btn.setAttribute('data-wired','1');
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var section = btn.closest('section,[data-page]') || btn.parentElement;
      var nameEl = section && section.querySelector('h1,h2,h3,[class*="product-info"] h1');
      var name = nameEl ? nameEl.textContent.trim().slice(0,50) : 'Product';
      var priceEl = section && (section.querySelector('.product-price') || section.querySelector('[class*="price"]'));
      var price = priceEl ? priceEl.textContent.replace(/[^0-9.]/g,'') : '49.95';
      var imgEl = section && section.querySelector('img');
      var img = imgEl ? imgEl.src : '';
      window.addToCart(name, price, img);
    });
  });
}
wireCartButtons();
// Re-wire after hash navigation (shop page buttons start hidden)
document.addEventListener('clawPageChange', wireCartButtons);

// ── 7. Mobile Sticky Bar ─────────────────────────────────────────────────────
(function() {
  var bar = document.createElement('div');
  bar.id = 'sticky-bar';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;background:var(--surface,#0f1018);padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,0.08);transform:translateY(100%);transition:transform 0.3s ease;';
  bar.innerHTML = '<div style="font-size:13px;color:var(--muted,rgba(255,255,255,0.5))">\\u26a1 Only 8 left in stock</div><button class="btn-cart" style="background:var(--accent,#d4af37);color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;">Add to Cart</button>';
  document.body.appendChild(bar);
  setTimeout(function() {
    if (window.innerWidth <= 768) bar.style.transform = 'translateY(0)';
  }, 3000);
  window.addEventListener('resize', function() {
    bar.style.transform = window.innerWidth > 768 ? 'translateY(100%)' : 'translateY(0)';
  });
  bar.querySelector('.btn-cart').onclick = function() {
    var firstH = document.querySelector('[data-page="home"] h1,h2');
    window.addToCart(firstH ? firstH.textContent.slice(0,40) : 'Product', '49.95', '');
  };
})();

// ── 8. Scroll Animations ─────────────────────────────────────────────────────
var io = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.anim').forEach(function(el) { io.observe(el); });

})();
</script>`;
}

// ─── Hard-coded Base CSS Template ────────────────────────────────────────────
function buildBaseCSS(params: {
  color: string; colorRgb: string; bgColor: string; surfColor: string;
  textColor: string; mutedColor: string; cardBorder: string; cardRadius: string;
  btnRadius: string; headingFont: string; bodyFont: string; googleFontUrl: string;
  h1Size: string; headingWeight: string; isLight: boolean;
}): string {
  const { color, colorRgb, bgColor, surfColor, textColor, mutedColor, cardBorder, cardRadius, btnRadius, headingFont, bodyFont, googleFontUrl, h1Size, headingWeight, isLight } = params;
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${googleFontUrl}&display=swap" rel="stylesheet">
<style>
/* Font fade-in — pure CSS, no JS dependency */
html { animation: clawFadeIn 0.3s 0.3s both; }
@keyframes clawFadeIn { from { opacity: 0; } to { opacity: 1; } }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: '${bodyFont}', sans-serif; background: ${bgColor}; color: ${textColor}; line-height: 1.6; overflow-x: hidden; }
:root { --bg:${bgColor}; --surface:${surfColor}; --text:${textColor}; --accent:${color}; --muted:${mutedColor}; --border:${cardBorder}; --font-heading:'${headingFont}'; --font-body:'${bodyFont}'; --radius:${cardRadius}; }
a { text-decoration: none; color: inherit; }
img { max-width: 100%; display: block; }
button { cursor: pointer; font-family: inherit; }

/* Announcement bar */
.announcement-bar { background: ${color}; color: ${isLight ? '#fff' : '#08080f'}; font-weight: 700; font-size: 13px; overflow: hidden; padding: 10px 0; position: relative; }
.marquee-inner { display: flex; white-space: nowrap; animation: marquee 28s linear infinite; }
.marquee-text { padding: 0 40px; flex-shrink: 0; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Nav */
nav { height: 68px; position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; justify-content: space-between; padding: 0 5%; backdrop-filter: blur(20px); background: ${isLight ? 'rgba(250,250,250,0.9)' : 'rgba(8,8,15,0.85)'}; border-bottom: 1px solid ${cardBorder}; transition: background 0.3s ease, border-color 0.3s ease; }
nav.scrolled { background: ${isLight ? 'rgba(250,250,250,0.98)' : 'rgba(8,8,15,0.97)'}; border-color: ${color}40; }
.nav-logo { font-family: '${headingFont}', sans-serif; font-weight: 900; color: ${color}; font-size: 22px; letter-spacing: -0.02em; }
.nav-center { display: flex; gap: 36px; align-items: center; }
.nav-center a { font-size: 14px; font-weight: 500; color: ${mutedColor}; transition: color 0.2s; }
.nav-center a:hover, .nav-center a.active { color: ${textColor}; }
.nav-right { display: flex; align-items: center; gap: 16px; }
.nav-cta { background: ${color}; color: ${isLight ? '#fff' : '#08080f'}; padding: 10px 24px; border-radius: ${btnRadius}; font-weight: 700; font-size: 14px; border: none; transition: opacity 0.2s; }
.nav-cta:hover { opacity: 0.88; }
.cart-icon-btn { position: relative; background: none; border: none; font-size: 22px; color: ${textColor}; padding: 8px; }
.cart-badge { display: none; position: absolute; top: 0; right: 0; background: ${color}; color: ${isLight ? '#fff' : '#08080f'}; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-weight: 800; align-items: center; justify-content: center; }

/* Hamburger */
#hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; padding: 8px; cursor: pointer; }
#hamburger span { display: block; width: 24px; height: 2px; background: ${textColor}; border-radius: 2px; transition: all 0.3s; }
#mobile-menu { display: none; position: fixed; inset: 0; z-index: 9999; background: ${isLight ? 'rgba(250,250,250,0.98)' : 'rgba(8,8,15,0.98)'}; flex-direction: column; align-items: center; justify-content: center; gap: 36px; font-size: 22px; font-family: '${headingFont}', sans-serif; font-weight: 700; }
#mobile-menu.mobile-open { display: flex; }
#mobile-menu a { color: ${textColor}; }

/* Hero */
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; background-size: cover; background-position: center; padding: 120px 5% 100px; }
.hero::before { content: ''; position: absolute; inset: 0; background: ${isLight ? 'rgba(255,255,255,0.4)' : 'rgba(8,8,15,0.62)'}; }
.hero-content { position: relative; z-index: 1; max-width: 760px; text-align: center; }
.hero-badge { display: inline-block; background: ${color}20; border: 1px solid ${color}55; color: ${color}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 16px; border-radius: 99px; margin-bottom: 24px; }
.hero h1 { font-family: '${headingFont}', sans-serif; font-size: ${h1Size}; font-weight: ${headingWeight}; line-height: 1.08; letter-spacing: -0.03em; color: ${isLight ? '#111' : '#fff'}; margin-bottom: 24px; }
.hero-sub { font-size: 19px; color: ${isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.72)'}; margin-bottom: 40px; line-height: 1.6; max-width: 560px; margin-left: auto; margin-right: auto; }
.hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }
.btn-primary { background: ${color}; color: ${isLight ? '#fff' : '#08080f'}; padding: 16px 40px; border-radius: ${btnRadius}; font-size: 16px; font-weight: 800; border: none; transition: opacity 0.2s, transform 0.2s; font-family: '${headingFont}', sans-serif; }
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-secondary { background: transparent; color: ${isLight ? '#111' : '#fff'}; padding: 16px 40px; border-radius: ${btnRadius}; font-size: 16px; font-weight: 600; border: 2px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)'}; transition: border-color 0.2s; }
.btn-secondary:hover { border-color: ${color}; color: ${color}; }
.trust-strip { display: flex; gap: 28px; justify-content: center; flex-wrap: wrap; font-size: 13px; color: ${isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'}; }
.trust-strip span::before { content: '✓ '; color: ${color}; font-weight: 700; }

/* Social proof bar */
.social-proof { background: ${isLight ? '#f5f3ef' : '#0d0d14'}; border-top: 1px solid ${cardBorder}; border-bottom: 1px solid ${cardBorder}; padding: 20px 5%; display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; }
.social-proof span { font-size: 13px; font-weight: 600; color: ${mutedColor}; }

/* Product section */
.product-section { padding: 100px 5%; background: ${surfColor}; }
.product-section > div { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
.product-image-wrap { position: relative; border-radius: ${cardRadius}; border: ${cardBorder}; overflow: hidden; }
.product-image-wrap img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.product-badge { position: absolute; top: 16px; left: 16px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.product-info h1 { font-family: '${headingFont}', sans-serif; font-size: 28px; font-weight: 800; color: ${textColor}; margin-bottom: 12px; }
.product-stars { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 14px; color: ${mutedColor}; }
.product-stars .stars { color: ${color}; font-size: 18px; }
.product-price { font-family: '${headingFont}', sans-serif; font-size: 40px; font-weight: 900; color: ${color}; margin-bottom: 6px; }
.product-price-orig { font-size: 18px; color: ${mutedColor}; text-decoration: line-through; margin-bottom: 20px; }
.afterpay-row { background: rgba(${colorRgb},0.08); border: 1px solid ${color}30; border-radius: 8px; padding: 12px 16px; font-size: 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: ${textColor}; }
.stock-warning { font-size: 13px; color: #f59e0b; margin-bottom: 24px; font-weight: 600; }
.btn-cart { background: ${color}; color: ${isLight ? '#fff' : '#08080f'}; width: 100%; padding: 18px; border: none; border-radius: ${btnRadius}; font-size: 16px; font-weight: 800; font-family: '${headingFont}', sans-serif; transition: opacity 0.2s; margin-bottom: 12px; }
.btn-cart:hover { opacity: 0.88; }
.btn-buy-now { background: ${isLight ? '#1a1a1a' : '#1a1a2a'}; color: #fff; width: 100%; padding: 16px; border: 1px solid ${cardBorder}; border-radius: ${btnRadius}; font-size: 15px; font-weight: 700; transition: opacity 0.2s; margin-bottom: 24px; }
.product-benefits { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.product-benefits li { font-size: 14px; color: ${mutedColor}; padding-left: 22px; position: relative; }
.product-benefits li::before { content: '✓'; position: absolute; left: 0; color: ${color}; font-weight: 700; }

/* Features */
.features-section { padding: 100px 5%; background: ${bgColor}; }
.section-header { text-align: center; margin-bottom: 64px; }
.section-header h2 { font-family: '${headingFont}', sans-serif; font-size: clamp(28px,4vw,44px); font-weight: 800; color: ${textColor}; margin-bottom: 16px; }
.section-header p { font-size: 17px; color: ${mutedColor}; max-width: 520px; margin: 0 auto; }
.features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; max-width: 1100px; margin: 0 auto; }
.feature-card { background: ${surfColor}; border: ${cardBorder}; border-radius: ${cardRadius}; padding: 36px 28px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
.feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(${colorRgb},0.12); }
.feature-icon { font-size: 40px; margin-bottom: 20px; }
.feature-card h3 { font-family: '${headingFont}', sans-serif; font-size: 18px; font-weight: 700; color: ${textColor}; margin-bottom: 12px; }
.feature-card p { font-size: 14px; color: ${mutedColor}; line-height: 1.7; }

/* Lifestyle gallery */
.lifestyle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1000px; margin: 0 auto; padding: 80px 5%; background: ${surfColor}; }
.lifestyle-grid img { border-radius: ${cardRadius}; width: 100%; aspect-ratio: 16/10; object-fit: cover; }

/* Testimonials */
.reviews-section { padding: 100px 5%; background: ${bgColor}; }
.testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; max-width: 1100px; margin: 0 auto; }
.testimonial-card { background: ${surfColor}; border: ${cardBorder}; border-top: 3px solid ${color}; border-radius: ${cardRadius}; padding: 28px; }
.testimonial-stars { color: ${color}; font-size: 16px; margin-bottom: 14px; }
.testimonial-quote { font-size: 15px; color: ${mutedColor}; font-style: italic; line-height: 1.75; margin-bottom: 20px; }
.testimonial-author { font-weight: 700; color: ${textColor}; font-size: 14px; }
.testimonial-city { font-size: 13px; color: ${mutedColor}; margin-top: 2px; }
.verified { color: ${color}; font-size: 12px; font-weight: 700; margin-top: 8px; display: block; }

/* FAQ */
.faq-section { padding: 80px 5%; background: ${surfColor}; }
.faq-section > div { max-width: 760px; margin: 0 auto; }
.faq-item { background: ${bgColor}; border: ${cardBorder}; border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
.faq-question { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; font-size: 15px; color: ${textColor}; }
.faq-toggle { color: ${color}; font-size: 22px; font-weight: 400; flex-shrink: 0; margin-left: 16px; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
.faq-item.open .faq-answer { max-height: 300px; }
.faq-answer p { padding: 0 24px 20px; font-size: 14px; color: ${mutedColor}; line-height: 1.75; }

/* CTA section */
.cta-section { padding: 100px 5%; text-align: center; background: linear-gradient(135deg, ${surfColor}, rgba(${colorRgb},0.12)); }
.cta-section h2 { font-family: '${headingFont}', sans-serif; font-size: clamp(28px,4vw,44px); font-weight: 800; color: ${textColor}; margin-bottom: 16px; }
.cta-section p { font-size: 17px; color: ${mutedColor}; margin-bottom: 40px; }
.countdown-wrap { font-size: 20px; color: ${color}; margin-top: 24px; font-family: '${headingFont}', sans-serif; }

/* Footer */
footer { padding: 64px 5% 28px; background: ${isLight ? '#f0f0ec' : '#050508'}; border-top: ${cardBorder}; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
.footer-brand { max-width: 280px; }
.footer-logo { font-family: '${headingFont}', sans-serif; font-weight: 900; color: ${color}; font-size: 22px; margin-bottom: 12px; }
.footer-tagline { font-size: 14px; color: ${mutedColor}; line-height: 1.6; margin-bottom: 20px; }
.footer-col h4 { font-family: '${headingFont}', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${textColor}; margin-bottom: 16px; }
.footer-col a { display: block; font-size: 14px; color: ${mutedColor}; margin-bottom: 10px; transition: color 0.2s; }
.footer-col a:hover { color: ${color}; }
.footer-bottom { border-top: ${cardBorder}; padding-top: 24px; font-size: 13px; color: ${mutedColor}; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

/* Animations */
@keyframes fadeInUp { from { opacity:0; transform:translateY(28px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes glowPulse { 0%,100% { box-shadow:0 0 0 0 rgba(${colorRgb},0); } 50% { box-shadow:0 0 20px 4px rgba(${colorRgb},0.3); } }
.hero-content { animation: fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
.hero h1 { animation: fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
.hero-sub { animation: fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
.hero-buttons { animation: fadeInUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.34s both; }
.btn-primary { animation: glowPulse 2.8s ease 1.2s infinite; }
.anim { opacity:0; transform:translateY(24px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
.anim.visible { opacity:1; transform:translateY(0); }
.anim-delay-1 { transition-delay: 0.08s; }
.anim-delay-2 { transition-delay: 0.18s; }
.anim-delay-3 { transition-delay: 0.28s; }
@media (prefers-reduced-motion: reduce) { .anim, .hero-content, .hero h1, .hero-sub, .hero-buttons { animation: none !important; opacity: 1 !important; transform: none !important; transition: none !important; } }

/* Mobile */
@media (max-width: 768px) {
  nav .nav-center, nav .nav-cta { display: none; }
  #hamburger { display: flex; }
  .product-section > div { grid-template-columns: 1fr; gap: 32px; }
  .features-grid { grid-template-columns: 1fr; }
  .testimonials-grid { grid-template-columns: 1fr; }
  .lifestyle-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .hero h1 { font-size: clamp(36px,8vw,52px); }
  .hero-sub { font-size: 16px; }
  .social-proof { gap: 20px; justify-content: flex-start; }
}
@media (max-width: 480px) {
  .footer-grid { grid-template-columns: 1fr; }
  .hero-buttons { flex-direction: column; align-items: center; }
  .trust-strip { flex-direction: column; align-items: center; gap: 12px; }
}
</style>`;
}

// ─── HTML Post-Processing ─────────────────────────────────────────────────────
function postProcessHtml(html: string, storeName: string, niche: string, color: string, colorRgb: string, surfColor: string, bgColor: string, cardRadius: string): string {
  // 1. Add loading="lazy" to all images (except first hero image)
  let imgCount = 0;
  html = html.replace(/<img\s/gi, (match) => {
    imgCount++;
    if (imgCount <= 1) return match;
    return '<img loading="lazy" ';
  });

  // 2. Add width/height to pexels images
  html = html.replace(/<img([^>]*src="[^"]*pexels[^"]*")([^>]*)>/gi, (match, before: string, after: string) => {
    if (/width=/i.test(match)) return match;
    return `<img${before} width="800" height="600"${after}>`;
  });

  // 3. Fix nav logo href (# → #home)
  html = html.replace(/(<a[^>]*class="nav-logo"[^>]*)href="#"([^>]*>)/gi, '$1href="#home"$2');
  html = html.replace(/(<a[^>]*href="#"[^>]*class="nav-logo"[^>]*>)/gi, (m) => m.replace('href="#"', 'href="#home"'));

  // 4. INJECT data-page="home" wrapper programmatically
  // IMPORTANT: check for the HTML element specifically — NOT just the string, which appears in JS code
  // e.g. querySelector('[data-page="home"]') would wrongly match a string-only check
  if (!html.includes('<div data-page="home"')) {
    // Find injection point: prefer end of </style>, else first <section, else after announcement-bar div
    let homeStart = -1;
    const styleEnd = html.lastIndexOf('</style>');
    const firstSection = html.search(/<section[\s>]/i);
    const announcementDiv = html.search(/<div[^>]*announcement/i);

    if (styleEnd !== -1) homeStart = styleEnd + 8; // right after </style>
    else if (firstSection !== -1) homeStart = firstSection;
    else if (announcementDiv !== -1) homeStart = announcementDiv;

    if (homeStart !== -1) {
      html = html.slice(0, homeStart) + '\n<div data-page="home" style="display:block">' + html.slice(homeStart);
    }
  }

  // ALWAYS close home div before shop — whether Claude opened it or we did.
  // Without this, shop/about/contact/toolbar all end up inside the home div
  // and disappear when router switches away from home.
  {
    const shopIdx = html.indexOf('<div data-page="shop"');
    const bodyEnd = html.lastIndexOf('</body>');
    const closeBefore = shopIdx !== -1 ? shopIdx : bodyEnd;
    if (closeBefore !== -1 && html.includes('<div data-page="home"')) {
      // Replace the __home-end__ sentinel (inserted by generateFullStore) with a proper </div>
      // Using a data-attribute sentinel because HTML comment stripper runs later in this function
      if (html.includes('id="__home-end__"')) {
        html = html.replace(/<div id="__home-end__"[^>]*><\/div>/g, '</div>');
      } else if (!html.slice(Math.max(0, closeBefore - 10), closeBefore + 1).includes('</div>')) {
        // Safety net: insert close if not already there
        html = html.slice(0, closeBefore) + '</div>\n' + html.slice(closeBefore);
      }
    }
  }

  // 5. Fix unclosed <style> tag — browser treats everything after as CSS (page goes blank)
  if (html.includes('<style>') && !html.includes('</style>')) {
    // Find first body-content landmark: <section, <div class="announcement, or <nav
    const bodyStart = Math.min(
      ...[
        html.search(/<section[\s>]/i),
        html.search(/<div[^>]*class="announcement/i),
        html.search(/\n<nav[\s>]/i),
      ].filter(n => n > 0)
    );
    if (isFinite(bodyStart) && bodyStart > 0) {
      html = html.slice(0, bodyStart) + '\n</style>\n</head>\n<body>\n' + html.slice(bodyStart);
    }
  }
  // Ensure HTML closes properly
  if (!html.includes('</body>')) html = html + '\n</body>';
  if (!html.includes('</html>')) html = html + '\n</html>';

  // 6. Inject shipping page if missing
  if (!html.includes('data-page="shipping"')) {
    const shippingPage = `
<div data-page="shipping" style="display:none;padding-top:100px;min-height:100vh;background:var(--bg,${bgColor})">
  <div style="max-width:800px;margin:0 auto;padding:0 5% 80px">
    <h1 style="font-family:var(--font-heading,Syne,sans-serif);font-size:clamp(32px,5vw,48px);font-weight:900;color:var(--text,#f2efe9);margin-bottom:16px">Shipping & Returns</h1>
    <p style="color:var(--muted,rgba(242,239,233,0.55));margin-bottom:48px;font-size:15px">🇦🇺 Proudly shipping Australia-wide. All orders dispatched same business day when placed before 2pm AEST.</p>

    <h2 style="font-family:var(--font-heading,Syne,sans-serif);font-size:22px;font-weight:800;color:var(--text,#f2efe9);margin-bottom:20px">Delivery Options</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:14px">
      <thead><tr style="background:rgba(${colorRgb},0.1)">
        <th style="padding:12px 16px;text-align:left;color:var(--accent,${color});font-weight:700;border-bottom:1px solid rgba(255,255,255,0.08)">Method</th>
        <th style="padding:12px 16px;text-align:left;color:var(--accent,${color});font-weight:700;border-bottom:1px solid rgba(255,255,255,0.08)">Timeframe</th>
        <th style="padding:12px 16px;text-align:left;color:var(--accent,${color});font-weight:700;border-bottom:1px solid rgba(255,255,255,0.08)">Cost</th>
      </tr></thead>
      <tbody>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05)"><td style="padding:12px 16px;color:var(--text,#f2efe9)">Standard (AusPost)</td><td style="padding:12px 16px;color:var(--muted)">3–7 business days</td><td style="padding:12px 16px;color:var(--accent,${color});font-weight:700">Free over $79 · $7.95 under</td></tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05)"><td style="padding:12px 16px;color:var(--text,#f2efe9)">Express (AusPost)</td><td style="padding:12px 16px;color:var(--muted)">1–3 business days</td><td style="padding:12px 16px;color:var(--accent,${color});font-weight:700">$12.95</td></tr>
        <tr><td style="padding:12px 16px;color:var(--text,#f2efe9)">New Zealand</td><td style="padding:12px 16px;color:var(--muted)">7–14 business days</td><td style="padding:12px 16px;color:var(--accent,${color});font-weight:700">$19.95</td></tr>
      </tbody>
    </table>

    <h2 style="font-family:var(--font-heading,Syne,sans-serif);font-size:22px;font-weight:800;color:var(--text,#f2efe9);margin-bottom:16px">30-Day Returns</h2>
    <p style="color:var(--muted,rgba(242,239,233,0.55));line-height:1.8;margin-bottom:16px">Not happy? No problem. Return any item within 30 days of delivery for a full refund or exchange — no questions asked. Our policy is backed by Australian Consumer Law.</p>
    <div style="background:rgba(${colorRgb},0.08);border:1px solid rgba(${colorRgb},0.2);border-radius:${cardRadius};padding:20px 24px;margin-bottom:32px">
      <div style="font-weight:700;color:var(--text,#f2efe9);margin-bottom:8px">How to Return</div>
      <ol style="color:var(--muted,rgba(242,239,233,0.55));padding-left:20px;line-height:2;font-size:14px">
        <li>Email us at returns@${storeName.toLowerCase().replace(/\s+/g,'')}.com.au with your order number</li>
        <li>We'll send a prepaid return label within 24 hours</li>
        <li>Pack item securely and drop at any AusPost outlet</li>
        <li>Refund processed within 2–3 business days of receipt</li>
      </ol>
    </div>

    <h2 style="font-family:var(--font-heading,Syne,sans-serif);font-size:22px;font-weight:800;color:var(--text,#f2efe9);margin-bottom:16px">Afterpay</h2>
    <p style="color:var(--muted,rgba(242,239,233,0.55));line-height:1.8">Pay in 4 interest-free fortnightly instalments with Afterpay. Available on all orders $35–$2,000 AUD. No interest, ever. Instant approval at checkout.</p>
  </div>
</div>`;
    const bodyEnd2 = html.lastIndexOf('</body>');
    if (bodyEnd2 !== -1) {
      html = html.slice(0, bodyEnd2) + shippingPage + '\n' + html.slice(bodyEnd2);
    }
  }

  // 6. Ensure #about link exists in nav (add if only missing)
  if (!html.includes('href="#about"') && html.includes('href="#shop"')) {
    html = html.replace('href="#shop"', 'href="#about" data-nav="about">About</a>&nbsp;&nbsp;<a href="#shop"');
  }

  // 7. Proxy alicdn image URLs through our server (alicdn.com 403s without correct Referer)
  html = html.replace(/https?:\/\/[a-z0-9-]*\.alicdn\.com[^"'\s)\]>]*/g, (imgUrl) => {
    return `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
  });

  // 8. Add onerror fallback to all product images so broken ones degrade gracefully
  const fallbackImg = 'https://images.pexels.com/photos/3735641/pexels-photo-3735641.jpeg?auto=compress&cs=tinysrgb&w=600';
  html = html.replace(/<img([^>]*)>/gi, (match, attrs) => {
    if (match.includes('onerror')) return match;
    if (match.includes('data:image')) return match; // skip inline SVGs/data URIs
    return `<img${attrs} onerror="this.onerror=null;this.src='${fallbackImg}'">`;
  });

  // 9. Light minify
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n');

  // 10. Remove HTML comments
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/gi, '');

  return html;
}

// ─── Expand Store Brief (fast Haiku pass) ─────────────────────────────────────
export async function expandStoreBrief(params: {
  niche: string;
  storeName: string;
  accentColor: string;
  designDirection?: string;
  productData?: Record<string, any>;
}): Promise<Record<string, any>> {
  const client = getAnthropicClient();
  const productSummary = params.productData
    ? `Title: ${params.productData.product_title || params.productData.title || 'N/A'}, Price: ${params.productData.price_aud || params.productData.price || 'N/A'}, Desc: ${String(params.productData.description || '').slice(0, 200)}`
    : 'none provided';
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      temperature: 0.8,
      system: `You are a DTC brand strategist for Australian Shopify stores. Return valid JSON only — no markdown, no backticks.`,
      messages: [{ role: 'user', content: `Store: ${params.storeName}\nNiche: ${params.niche}\nAccent: ${params.accentColor}\nProduct: ${productSummary}\n\nReturn JSON:\n{"brandName":"...","tagline":"...(6-10 words)","uniqueValueProp":"...(1 sentence)","heroHeadline":"...(8-12 words, specific)","heroSubheadline":"...(15-20 words, benefit-focused)","fontPairing":{"heading":"Syne","body":"DM Sans"},"colourPalette":{"primary":"${params.accentColor}","secondary":"#1a1a2e","accent":"#ffffff"},"testimonials":[{"name":"...","location":"AU city","text":"...(2 sentences)"},{"name":"...","location":"AU city","text":"..."},{"name":"...","location":"AU city","text":"..."}],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}],"stats":[{"value":"12,400+","label":"Happy Customers"},{"value":"4.8★","label":"Avg Rating"},{"value":"98%","label":"Would Recommend"}]}` }],
    });
    const raw = ((msg.content[0] as any)?.text || '').trim()
      .replace(/^```[\w]*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    return JSON.parse(raw);
  } catch {
    return {
      brandName: params.storeName,
      tagline: `Quality ${params.niche} for Australians`,
      uniqueValueProp: `We source and test every product specifically for Australian conditions.`,
      heroHeadline: `The ${params.niche} brand built for Australia`,
      heroSubheadline: `Premium quality, fast AU shipping, results you can feel from day one.`,
      fontPairing: { heading: 'Syne', body: 'DM Sans' },
      colourPalette: { primary: params.accentColor, secondary: '#1a1a2e', accent: '#ffffff' },
      testimonials: [
        { name: 'Sarah M.', location: 'Sydney', text: `Finally found ${params.niche} that delivers. Arrived in 2 days and the quality is outstanding.` },
        { name: 'Jake T.', location: 'Brisbane', text: `Tried heaps of brands. This one is genuinely different.` },
        { name: 'Emma K.', location: 'Melbourne', text: `Super fast delivery and amazing customer service.` },
      ],
      faq: [
        { q: 'How fast is shipping?', a: 'Same-day dispatch before 2pm AEST. 2-5 business days Australia-wide.' },
        { q: 'Do you offer Afterpay?', a: 'Yes! Pay in 4 interest-free instalments on orders over $35.' },
        { q: "What's your return policy?", a: '30-day no-questions-asked returns.' },
      ],
      stats: [{ value: '12,400+', label: 'Happy Customers' }, { value: '4.8★', label: 'Avg Rating' }, { value: '98%', label: 'Would Recommend' }],
    };
  }
}

// ─── Full AI HTML Generator (legacy — kept as fallback) ───────────────────────
async function generateFullStore_legacy(params: {
  niche: string;
  storeName: string;
  targetAudience?: string;
  vibe?: string;
  accentColor?: string;
  price?: string;
  productData?: Record<string, unknown>;
  designDirection?: DesignDirection;
  onProgress?: (pct: number, msg: string) => void;
}): Promise<{ html: string; manifest: string }> {
  const { niche, storeName, targetAudience, vibe, accentColor, price, productData, designDirection = 'default' } = params;
  const progress = params.onProgress || (() => {});

  // Helper: run a blocking promise while sending progress ticks every 3s
  async function withHeartbeat<T>(
    startPct: number, endPct: number, msg: string, fn: () => Promise<T>
  ): Promise<T> {
    progress(startPct, msg);
    let cur = startPct;
    const timer = setInterval(() => {
      cur = Math.min(cur + Math.round((endPct - startPct) / 12), endPct - 2);
      progress(cur, msg);
    }, 3000);
    try {
      const result = await fn();
      clearInterval(timer);
      return result;
    } catch (e) {
      clearInterval(timer);
      throw e;
    }
  }

  const dir = designDirection !== 'default' ? DESIGN_DIRECTIONS[designDirection as keyof typeof DESIGN_DIRECTIONS] : null;
  const color = accentColor || '#d4af37';
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

  const colorRgb = (function(hex: string) {
    const c = hex.replace('#', '');
    return parseInt(c.substring(0,2),16)+','+parseInt(c.substring(2,4),16)+','+parseInt(c.substring(4,6),16);
  })(color);
  const storeName_ = storeName || niche;
  const isLight = ['editorial', 'minimal'].includes(designDirection as string);

  // ── 1. Fetch images ────────────────────────────────────────────────────────
  progress(5, '🔍 Fetching images...');
  const pd = productData || {};
  const productTitle = sanitizeProductTitle((pd.product_title as string) || '', niche);
  const scrapedProductImgs: string[] = Array.isArray(pd.product_images) ? (pd.product_images as string[]) : [];
  const scrapedHeroImg    = (pd.hero_image as string | undefined) || scrapedProductImgs[0];
  const scrapedProductImg = scrapedProductImgs[1] || scrapedHeroImg;

  const imgs = await fetchImagesForStore(productTitle, niche);
  const heroImg      = scrapedHeroImg    || imgs.hero;
  const productImg   = scrapedProductImg || imgs.product;
  const lifestyleImg1 = imgs.lifestyle1;
  const lifestyleImg2 = imgs.lifestyle2;
  const shopImages   = imgs.shopImages;
  console.log('[website-api] Images →', { hero: heroImg.slice(-30), product: productImg.slice(-30), l1: lifestyleImg1.slice(-30), l2: lifestyleImg2.slice(-30) });

  // ── 2. Expand brand brief (fast Haiku) ─────────────────────────────────────
  progress(10, '📝 Building your brand brief...');
  const brief = await expandStoreBrief({
    niche,
    storeName: storeName_,
    accentColor: color,
    designDirection: dir?.label || 'modern',
    productData: pd,
  });
  console.log('[website-api] Brief →', JSON.stringify(brief).slice(0, 200));

  // ── 3. Build head + CSS ────────────────────────────────────────────────────
  progress(15, '🎨 Crafting your store...');
  const pdTitle = pd.product_title as string | undefined;
  const pdPrice = price || (pd.price_aud ? String(pd.price_aud) : (pd.suggested_price_aud ? String(pd.suggested_price_aud) : undefined));
  const faviconOgHtml = buildFaviconAndOgTags(storeName_, color, niche, pdTitle, pdPrice);
  const manifestJson = buildManifest(storeName_, color, (brief.tagline as string) || vibe || ('Premium ' + niche + ' for Australians'));

  let baseCss = buildBaseCSS({ color, colorRgb, bgColor, surfColor, textColor, mutedColor, cardBorder, cardRadius, btnRadius, headingFont, bodyFont, googleFontUrl, h1Size, headingWeight, isLight });

  // Inject brief font pairing into CSS if available
  const fontPairing = (brief.fontPairing as string) || '';
  if (fontPairing.includes(' + ')) {
    const [briefHeading, briefBody] = fontPairing.split(' + ').map(f => f.trim());
    if (briefHeading && briefBody) {
      baseCss = baseCss.replace(`--font-heading:'${headingFont}'`, `--font-heading:'${briefHeading}'`);
      baseCss = baseCss.replace(`--font-body:'${bodyFont}'`, `--font-body:'${briefBody}'`);
    }
  }

  const fullHead = `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${faviconOgHtml}
${baseCss}
</head>
<body>`;

  // ── 4. Single Sonnet pass (streaming) ──────────────────────────────────────
  progress(20, '✍️ Generating your store...');
  const client = getAnthropicClient();

  const productContext = pd.product_title ? `
Product: ${sanitizeProductTitle(pd.product_title as string, niche)}
Category: ${pd.category || pd.product_type || niche}
Description: ${pd.description || ''}
Price: ${price || `$${pd.price_aud || pd.suggested_price_aud || '49.95'}`} AUD` : `
Product: ${niche}
Price: ${price || '$49.95'} AUD`;

  const singlePassSystem = `You are an expert Shopify theme developer and conversion-focused designer.
Generate a complete, production-ready single-file HTML store.

CRITICAL RULES:
1. Output ONLY HTML body content — no <!DOCTYPE>, no <html>, no <head>, no <style>, no <script> tags
2. Use only the CSS classes and variables already defined (--accent, --bg, --surface, --text, --muted, --card-radius, --btn-radius)
3. Every section must use semantic HTML5 (section, article, nav, footer, header, main)
4. Include ALL of these sections in order:
   - Announcement bar (free shipping threshold)
   - Navigation (logo left, links center, cart icon right)
   - Hero section (headline, subheadline, CTA buttons, hero image)
   - Social proof stats bar (3 numbers from brief)
   - Features/benefits section (3 cards from brief.keyBenefits)
   - Product highlight section (product name, description, price, Add to Cart)
   - Testimonials (3 from brief, AU cities, specific quotes)
   - FAQ accordion (4 items, use class="faq-item", "faq-question", "faq-toggle", "faq-answer")
   - Footer (logo, links, ABN, AUD pricing, Afterpay badge)
5. Nav links must use data-nav="home", data-nav="shop", data-nav="about", data-nav="contact"
6. Cart button must use class="btn-cart"
7. All prices in AUD format: $X.XX AUD
8. Include Afterpay copy where relevant
9. Image tags must use the exact URLs provided — no placeholder.com
10. DO NOT close the <div data-page="home"> wrapper — it will be closed automatically`;

  const singlePassUser = `BRAND BRIEF:
${JSON.stringify(brief, null, 2)}

IMAGES:
- Hero: ${heroImg}
- Product: ${productImg}
- Lifestyle 1: ${lifestyleImg1}
- Lifestyle 2: ${lifestyleImg2}

STORE DETAILS:
- Store name: ${storeName_}
- Niche: ${niche}
- Accent colour: ${color}
- Design direction: ${dir?.label || 'Modern Dark DTC'} — ${dirNote}
${productContext}

Start your output with EXACTLY:
<div data-page="home" style="display:block">

Before data-page="home", output the nav and mobile menu:
<nav id="main-nav">
  <a href="#home" class="nav-logo">${storeName_}</a>
  <div class="nav-center">
    <a href="#home" data-nav="home">Home</a>
    <a href="#shop" data-nav="shop">Shop</a>
    <a href="#about" data-nav="about">About</a>
    <a href="#contact" data-nav="contact">Contact</a>
  </div>
  <div class="nav-right">
    <button onclick="typeof openCart!=='undefined'&&openCart()" class="cart-icon-btn">\ud83d\uded2<span class="cart-badge">0</span></button>
    <a href="#shop" class="nav-cta">Shop Now</a>
    <button id="hamburger"><span></span><span></span><span></span></button>
  </div>
</nav>
<div id="mobile-menu">
  <a href="#home" data-nav="home">Home</a>
  <a href="#shop" data-nav="shop">Shop</a>
  <a href="#about" data-nav="about">About</a>
  <a href="#contact" data-nav="contact">Contact</a>
  <a href="#shipping" data-nav="shipping">Shipping</a>
</div>

Then open: <div data-page="home" style="display:block">

Use the brief JSON for all copy: heroHeadline, heroSubheadline, keyBenefits, testimonials, faqItems, socialProofStats, ctaPrimary, ctaSecondary.
Use CSS classes: .hero, .hero-content, .hero-badge, .hero-sub, .hero-buttons, .btn-primary, .btn-secondary, .trust-strip, .social-proof, .product-section, .product-image-wrap, .product-info, .product-stars, .product-price, .afterpay-row, .stock-warning, .btn-cart, .btn-buy-now, .product-benefits, .features-section, .section-header, .features-grid, .feature-card, .feature-icon, .lifestyle-grid, .reviews-section, .testimonials-grid, .testimonial-card, .testimonial-stars, .testimonial-quote, .testimonial-author, .testimonial-city, .verified, .faq-section, .faq-item, .faq-question, .faq-toggle, .faq-answer, .cta-section, .countdown-wrap, footer, .footer-grid, .footer-brand, .footer-logo, .footer-tagline, .footer-col, .footer-bottom, .announcement-bar, .marquee-inner, .marquee-text
Add class="anim" to section headings and class="anim anim-delay-1/2/3" to cards.
DO NOT close the data-page="home" div — it will be closed automatically.
End output after </footer>.`;

  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 7000,
    temperature: 0.7,
    system: singlePassSystem,
    messages: [{ role: 'user', content: singlePassUser }],
  });

  let fullText = '';
  let lastProgressEmit = 20;

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text;
      const approxProgress = Math.min(90, 20 + Math.floor((fullText.length / 42000) * 70));
      if (approxProgress > lastProgressEmit + 2) {
        lastProgressEmit = approxProgress;
        progress(approxProgress, '✍️ Writing your store...');
      }
    }
  }

  const part1 = fullText.trim();
  if (!part1 || part1.length < 200) throw new Error('AI generation returned insufficient content — please try again.');

  // Strip any rogue head/style/script tags Claude might add despite instructions
  const part1Clean = part1
    .replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/body>\s*<\/html>\s*$/i, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^```\w*\n?/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim();

  // ── 5. Build hard-coded shop page ──────────────────────────────────────────
  progress(92, '🛒 Building shop page...');
  // (V2 replaces old pass1/pass2 — shop page below)

  const rawProductImgs: string[] = scrapedProductImgs;
  // Build a pool: product images first (up to 6), then Pexels shop images to fill gaps
  const shopImagePool: string[] = [...rawProductImgs, ...shopImages]
    .filter(Boolean)
    .filter((u, i, arr) => arr.indexOf(u) === i) // deduplicate
    .slice(0, 6);
  // Always have 6 slots
  while (shopImagePool.length < 6) shopImagePool.push(shopImages[shopImagePool.length % shopImages.length] || productImg);

  const shopProductNames = (() => {
    if (pd.product_title) {
      const t = sanitizeProductTitle(pd.product_title as string, niche);
      const colors = (pd.colors as string[] | undefined) || [];
      const sizes  = (pd.sizes  as string[] | undefined) || [];
      // Generate meaningful variants from real product data
      const variants = [
        t,
        colors[0] ? `${t} — ${colors[0]}` : `${t} (2-Pack)`,
        colors[1] ? `${t} — ${colors[1]}` : `${t} Bundle`,
        sizes.length ? `${t} Gift Set (All Sizes)` : `${t} Deluxe Edition`,
        `${niche} Starter Kit`,
        `${niche} Essential Pack`,
      ];
      return variants;
    }
    return [`${niche} Essential`, `${niche} Pro`, `${niche} Bundle`, `${niche} Deluxe Set`, `${niche} Starter Kit`, `${niche} Gift Pack`];
  })();

  const basePrice  = parseFloat(String(pd.suggested_price_aud || pd.price_aud || '49.95')) || 49.95;
  const shopPrices = [
    `$${basePrice.toFixed(2)}`,
    `$${(basePrice * 1.3).toFixed(2)}`,
    `$${(basePrice * 0.85).toFixed(2)}`,
    `$${(basePrice * 2.1).toFixed(2)}`,
    `$${(basePrice * 1.6).toFixed(2)}`,
    `$${(basePrice * 0.7).toFixed(2)}`,
  ];
  const shopDescs  = ['Bestseller','Most popular','Great value','Bundle & save','Limited edition','Starter pick'];

  const shopCards = shopImagePool.map((imgUrl, i) => `
    <div style="background:${surfColor};border-radius:${cardRadius};border:${cardBorder};overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 16px 40px rgba(${colorRgb},0.15)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="aspect-ratio:1;overflow:hidden;background:#111">
        <img loading="lazy" src="${imgUrl}" alt="${shopProductNames[i] || niche}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.4s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">
      </div>
      <div style="padding:16px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${color};margin-bottom:6px">${shopDescs[i] || 'Popular'}</div>
        <h3 style="font-family:var(--font-heading,Syne,sans-serif);font-size:15px;font-weight:700;color:${textColor};margin-bottom:6px;line-height:1.3">${shopProductNames[i] || niche}</h3>
        <div style="font-size:13px;color:${mutedColor};margin-bottom:14px">Free AU shipping over $79 · Afterpay</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-family:var(--font-heading,Syne,sans-serif);font-size:19px;font-weight:900;color:${color}">${shopPrices[i] || '$49.95'} AUD</span>
          <button class="btn-cart" onclick="typeof window.addToCart==='function'&&window.addToCart('${shopProductNames[i]?.replace(/'/g,"\\'")||niche}','${shopPrices[i]?.replace('$','')||'49.95'}','${imgUrl}')" style="background:${color};color:${isLight ? '#fff' : '#08080f'};border:none;padding:10px 18px;border-radius:${btnRadius};font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;font-family:var(--font-heading,Syne,sans-serif)">Add to Cart</button>
        </div>
      </div>
    </div>`).join('\n');

  const hardCodedShop = `
<div data-page="shop" style="display:none">
  <section style="padding:100px 5% 80px;min-height:100vh;background:${bgColor}">
    <div style="max-width:1200px;margin:0 auto">
      <h1 style="font-family:var(--font-heading,Syne,sans-serif);font-size:clamp(32px,5vw,52px);font-weight:900;color:${textColor};margin-bottom:8px">Shop All</h1>
      <p style="color:${mutedColor};margin-bottom:48px;font-size:15px">🇦🇺 Free AU shipping on orders over $79 · Afterpay available · 30-day returns</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px">
        ${shopCards}
      </div>
    </div>
  </section>
</div>`;

  // ── 6. Pass 3: About + Contact pages (Haiku, with brief content) ───────────
  const storeSlug = storeName_.toLowerCase().replace(/[^a-z0-9]/g, '');
  const briefBrandName = (brief.brandName as string) || storeName_;
  const briefTagline = (brief.tagline as string) || '';
  const briefProblem = (brief.problemStatement as string) || '';
  const briefUvp = (brief.uniqueValueProp as string) || '';

  const pass3 = `Generate 2 detailed page sections for ${storeName_} (${niche} store, AU). Output ONLY raw HTML with inline styles. No DOCTYPE, no head, no style tags, no script tags.

BRAND CONTEXT (use this for on-brand copy):
- Brand: ${briefBrandName}
- Tagline: ${briefTagline}
- Problem solved: ${briefProblem}
- Unique value: ${briefUvp}

=== ABOUT PAGE ===
<div data-page="about" style="display:none">
  <section style="padding:100px 5% 80px;min-height:100vh;background:${bgColor}">
    <div style="max-width:900px;margin:0 auto">
      <h1 style="font-family:var(--font-heading,Syne,sans-serif);font-size:clamp(36px,5vw,56px);font-weight:900;color:${textColor};margin-bottom:32px;letter-spacing:-0.03em">About ${storeName_}</h1>

      [WRITE TWO paragraphs (80-100 words each). Style each with: style="font-size:16px;color:${mutedColor};line-height:1.75;margin-bottom:20px;max-width:720px"
      Para 1: How and why ${storeName_} was founded — passionate Australian founders, specific problem in ${niche} they wanted to solve, Gold Coast based
      Para 2: What makes ${storeName_} different — quality commitment, customer results, community built around ${niche}]

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:44px 0">
        [3 VALUE CARDS — each: <div style="background:${surfColor};border-radius:14px;padding:28px 24px;border:1px solid rgba(255,255,255,0.07)">
          <div style="font-size:40px;margin-bottom:16px">EMOJI</div>
          <h3 style="font-family:var(--font-heading,Syne,sans-serif);font-size:17px;font-weight:700;color:${textColor};margin-bottom:10px">VALUE TITLE</h3>
          <p style="font-size:14px;color:${mutedColor};line-height:1.65">2-sentence specific to ${niche} — not generic buzzwords</p>
        </div>]
      </div>

      <div style="background:${surfColor};border-left:4px solid ${color};border-radius:0 12px 12px 0;padding:24px 28px;margin-top:16px">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${color};margin-bottom:10px">🇦🇺 Australian Owned & Operated</div>
        <p style="font-size:14px;color:${mutedColor};line-height:1.65">ABN registered · ACCC compliant · 30-day returns under Australian Consumer Law · Ships from our Australian warehouse within 24 hours</p>
      </div>
    </div>
  </section>
</div>

=== CONTACT PAGE ===
<div data-page="contact" style="display:none">
  <section style="padding:100px 5% 80px;min-height:100vh;background:${bgColor}">
    <div style="max-width:820px;margin:0 auto">
      <h1 style="font-family:var(--font-heading,Syne,sans-serif);font-size:clamp(36px,5vw,56px);font-weight:900;color:${textColor};margin-bottom:12px;letter-spacing:-0.03em">Get in Touch</h1>
      <p style="color:${mutedColor};font-size:17px;margin-bottom:52px">We reply within 24 hours · Mon–Fri 9am–5pm AEST</p>

      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:48px">
        <form onsubmit="var b=this.querySelector('button');b.textContent='✅ Message sent!';b.style.background='#22c55e';return false;" style="display:flex;flex-direction:column;gap:14px">
          <input type="text" placeholder="Your name" required style="padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:${surfColor};color:${textColor};font-size:15px;font-family:inherit;outline:none" onfocus="this.style.borderColor='${color}'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
          <input type="email" placeholder="your@email.com.au" required style="padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:${surfColor};color:${textColor};font-size:15px;font-family:inherit;outline:none" onfocus="this.style.borderColor='${color}'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
          <textarea placeholder="How can we help? Tell us about your order or question..." rows="5" required style="padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:${surfColor};color:${textColor};font-size:15px;font-family:inherit;resize:vertical;outline:none" onfocus="this.style.borderColor='${color}'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'"></textarea>
          <button type="submit" style="background:${color};color:${isLight ? '#fff' : '#08080f'};border:none;padding:16px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;font-family:var(--font-heading,Syne,sans-serif);transition:opacity 0.2s" onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">Send Message →</button>
        </form>

        <div>
          <div style="margin-bottom:24px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${color};margin-bottom:8px">📧 Email Us</div>
            <div style="color:${mutedColor};font-size:15px">support@${storeSlug}.com.au</div>
          </div>
          <div style="margin-bottom:24px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${color};margin-bottom:8px">📱 Call Us</div>
            <div style="color:${mutedColor};font-size:15px">0400 000 000</div>
            <div style="font-size:12px;color:${mutedColor};margin-top:4px">Mon–Fri 9am–5pm AEST</div>
          </div>
          <div style="margin-bottom:28px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${color};margin-bottom:8px">⏱ Response Time</div>
            <div style="color:${mutedColor};font-size:15px">Within 24 hours guaranteed</div>
          </div>

          <div style="background:${surfColor};border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.07)">
            <div style="font-size:13px;font-weight:700;color:${textColor};margin-bottom:16px">Quick Answers</div>
            [WRITE 3 Q&As specific to ${niche} — different from homepage FAQ. Use:
            <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.05)">
              <div style="font-size:13px;font-weight:600;color:${textColor};margin-bottom:5px">Q: [specific question]?</div>
              <div style="font-size:13px;color:${mutedColor};line-height:1.55">A: [direct answer]</div>
            </div>]
            Last Q&A: no border-bottom
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

Write all content specific to ${niche} and ${storeName_}. AU English. No placeholder text allowed.`;

  const msg3 = await withHeartbeat(93, 98, '📄 Building subpages...', () =>
    client.messages.create({ model: 'claude-haiku-4-5', max_tokens: 2500, messages: [{ role: 'user', content: pass3 }] })
  );
  const part3Text = ((msg3.content[0] as unknown as { text?: string })?.text ?? '').trim()
    .replace(/```[\s\S]*?```/g, '')   // strip full fenced code blocks
    .replace(/^```\w*\n?/gm, '')      // strip opening ``` at line start
    .replace(/^```\s*$/gm, '');       // strip closing ``` at line start
  progress(98, '\u26a1 Wiring interactivity...');

  const jsWithAnim = buildHardCodedJs().replace('</script>', buildAnimationJs() + '\n</script>');

  // V2 Assembly: fullHead + single pass content + home-end sentinel + shop + subpages + JS
  const merged = fullHead + '\n' + part1Clean + '\n<div id="__home-end__" style="display:none"></div>\n' + hardCodedShop + '\n' + part3Text + '\n' + jsWithAnim;
  const finalHtml = postProcessHtml(merged, storeName_, niche, color, colorRgb, surfColor, bgColor, cardRadius);

  const sizeKb = Math.round(Buffer.byteLength(finalHtml, 'utf8') / 1024);
  console.log(`[website-api] Generated HTML size: ${sizeKb}kb`);
  if (sizeKb > 120) console.warn(`[website-api] HTML exceeds 120kb target (${sizeKb}kb) — consider trimming prompts`);

  return { html: finalHtml, manifest: manifestJson };
}

// ─── Full AI HTML Generator V2 (wrapper with legacy fallback) ─────────────────
export async function generateFullStore(params: Parameters<typeof generateFullStore_legacy>[0]): Promise<ReturnType<typeof generateFullStore_legacy>> {
  try {
    return await generateFullStore_legacy(params);
  } catch (err: any) {
    console.warn('[website-gen] V2 failed, falling back to legacy:', err?.message);
    console.error('[website-gen] V2 stack:', err?.stack);
    return generateFullStore_legacy(params);
  }
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
  app.post('/api/website/deploy-vercel', requireSubscription, async (req, res) => {
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
  app.post('/api/website/generate', requireSubscription, async (req, res) => {
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

  // POST /api/website/improve-text — AI rewrite for inline editor (used from new tab)
  app.post('/api/website/improve-text', requireSubscription, async (req, res) => {
    try {
      const { text, instruction } = req.body as { text?: string; instruction?: string };
      if (!text || text.length < 2) return res.status(400).json({ error: 'No text provided' });
      const client = getAnthropicClient();
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: instruction || `Rewrite this ecommerce text to be more compelling for Australian shoppers. Return ONLY the rewritten text, nothing else: ${text}` }],
      });
      const result = ((msg.content[0] as { type: 'text'; text: string }).text).trim()
        .replace(/^["']|["']$/g, ''); // strip surrounding quotes
      res.json({ result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Text improvement failed.';
      console.error('[website/improve-text]', message);
      res.status(500).json({ error: message });
    }
  });

  // GET /api/proxy-image — proxies alicdn/shopify CDN images (adds correct Referer)
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const url = decodeURIComponent((req.query.url as string) || '');
      if (!url.startsWith('http')) return res.status(400).send('Bad URL');
      const allowed = ['alicdn.com', 'ae01.alicdn.com', 'ae02.alicdn.com', 'ae03.alicdn.com', 'ae04.alicdn.com', 'ae05.alicdn.com', 'cdn.shopify.com', 'img.alicdn.com'];
      if (!allowed.some((d) => url.includes(d))) return res.status(403).send('Domain not allowed');
      const response = await fetch(url, {
        headers: {
          'Referer': 'https://www.aliexpress.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return res.status(response.status).send('Upstream error');
      const ct = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const buf = await response.arrayBuffer();
      res.send(Buffer.from(buf));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'proxy error';
      console.error('[proxy-image]', msg);
      res.status(500).send('Proxy error');
    }
  });
}