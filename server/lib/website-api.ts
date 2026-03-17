/**
 * Website API — Deploy and Analyze endpoints for the Website Generator
 *
 * Routes:
 *   POST /api/website/deploy-vercel   — 1-click Vercel deploy
 *   POST /api/website/analyze-product — Smart product quality analyzer
 */

import type { Application } from 'express';
import { getAnthropicClient } from './anthropic';
import { getSupabaseAdmin } from '../_core/supabase';
import { requireSubscription } from '../middleware/requireSubscription';
import { rateLimit } from './rate-limit';

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

// ─── Deterministic Store Template ──────────────────────────────────────────────
interface StoreTemplateParams {
  brandName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  uvp: string;
  ctaPrimary: string;
  ctaSecondary: string;
  testimonials: Array<{ name: string; location: string; text: string }>;
  faqItems: Array<{ q: string; a: string }>;
  stats: Array<{ value: string; label: string }>;
  keyBenefits: Array<{ icon: string; title: string; description: string }>;
  productName: string;
  displayPrice: string;
  productDesc: string;
  heroImg: string;
  productImg: string;
  color: string;
  colorRgb: string;
  headingFont: string;
  bodyFont: string;
  niche: string;
  storeName_: string;
}

function buildStoreTemplate(p: StoreTemplateParams): string {
  const { brandName, tagline, heroHeadline, heroSubheadline, uvp, ctaPrimary, ctaSecondary,
    testimonials, faqItems, stats, keyBenefits, productName, displayPrice, productDesc,
    heroImg, productImg, color, colorRgb, headingFont, bodyFont, niche } = p;

  const sectionStyle = `padding:80px 24px;max-width:1100px;margin:0 auto;`;
  const cardStyle = `background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:32px;`;

  // Compute Afterpay price
  const priceNum = parseFloat(displayPrice.replace(/[^0-9.]/g, '')) || 49.95;
  const afterpayPrice = (priceNum / 4).toFixed(2);

  return `
<nav id="main-nav" style="position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:68px;background:rgba(8,8,15,0.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.06);">
  <a href="#" style="font-family:${headingFont};font-size:20px;font-weight:900;color:${color};text-decoration:none;letter-spacing:-0.03em;">${brandName}</a>
  <div style="display:flex;gap:32px;" class="nav-links">
    <a href="#" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;font-weight:500;font-family:${bodyFont};">Home</a>
    <a href="#shop" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;font-weight:500;font-family:${bodyFont};">Shop</a>
    <a href="#about" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;font-weight:500;font-family:${bodyFont};">About</a>
    <a href="#contact" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;font-weight:500;font-family:${bodyFont};">Contact</a>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <button onclick="typeof openCart!=='undefined'&&openCart()" style="background:none;border:none;color:rgba(255,255,255,0.8);font-size:20px;cursor:pointer;position:relative;padding:8px;">\ud83d\uded2<span class="cart-badge" style="position:absolute;top:0;right:0;background:${color};color:#000;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">0</span></button>
    <a href="#shop" style="background:${color};color:#080808;font-family:${headingFont};font-size:13px;font-weight:800;padding:10px 22px;border-radius:8px;text-decoration:none;white-space:nowrap;">Shop Now</a>
    <button id="hamburger" onclick="document.getElementById('mobile-menu').style.display=document.getElementById('mobile-menu').style.display==='flex'?'none':'flex'" style="display:none;background:none;border:none;cursor:pointer;flex-direction:column;gap:5px;padding:8px;"><span style="display:block;width:22px;height:2px;background:#fff;"></span><span style="display:block;width:22px;height:2px;background:#fff;"></span><span style="display:block;width:22px;height:2px;background:#fff;"></span></button>
  </div>
</nav>

<div id="mobile-menu" style="display:none;position:fixed;top:68px;left:0;right:0;z-index:999;background:rgba(8,8,15,0.98);flex-direction:column;padding:24px;gap:16px;border-bottom:1px solid rgba(255,255,255,0.08);">
  <a href="#" onclick="document.getElementById('mobile-menu').style.display='none'" style="color:#fff;text-decoration:none;font-size:16px;font-family:${bodyFont};">Home</a>
  <a href="#shop" onclick="document.getElementById('mobile-menu').style.display='none'" style="color:#fff;text-decoration:none;font-size:16px;font-family:${bodyFont};">Shop</a>
  <a href="#about" onclick="document.getElementById('mobile-menu').style.display='none'" style="color:#fff;text-decoration:none;font-size:16px;font-family:${bodyFont};">About</a>
  <a href="#contact" onclick="document.getElementById('mobile-menu').style.display='none'" style="color:#fff;text-decoration:none;font-size:16px;font-family:${bodyFont};">Contact</a>
</div>

<div data-page="home" style="display:block">

<!-- SECTION 1: ANNOUNCEMENT BAR -->
<div style="background:${color};color:#080808;text-align:center;padding:11px 16px;font-size:13px;font-weight:700;font-family:${bodyFont};margin-top:68px;">
  \ud83d\ude9a Free Shipping on AU Orders Over $75 &nbsp;|&nbsp; 30-Day Returns &nbsp;|&nbsp; Afterpay Available
</div>

<!-- SECTION 2: HERO -->
<section id="home" style="min-height:100vh;background:linear-gradient(135deg,#080808 0%,#0f0f1a 60%,#14141f 100%);display:flex;align-items:center;padding:0 24px;">
  <div style="max-width:1100px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;">
    <div>
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(${colorRgb},0.1);border:1px solid rgba(${colorRgb},0.25);border-radius:100px;padding:6px 16px;margin-bottom:24px;">
        <span style="font-size:12px;">\ud83c\udde6\ud83c\uddfa</span>
        <span style="color:${color};font-size:12px;font-weight:700;font-family:${headingFont};text-transform:uppercase;letter-spacing:0.08em;">Australian Owned</span>
      </div>
      <h1 style="font-family:${headingFont};font-size:clamp(36px,5vw,68px);font-weight:900;color:#ffffff;line-height:1.08;margin:0 0 20px;letter-spacing:-0.03em;">${heroHeadline}</h1>
      <p style="font-family:${bodyFont};font-size:18px;color:rgba(255,255,255,0.72);line-height:1.6;margin:0 0 32px;">${heroSubheadline}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <a href="#shop" style="display:inline-block;background:${color};color:#080808;font-family:${headingFont};font-size:15px;font-weight:800;padding:16px 36px;border-radius:10px;text-decoration:none;white-space:nowrap;">${ctaPrimary} \u2192</a>
        <a href="#about" style="display:inline-block;background:transparent;color:#fff;font-family:${headingFont};font-size:15px;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;border:1.5px solid rgba(255,255,255,0.25);white-space:nowrap;">${ctaSecondary}</a>
      </div>
      <div style="display:flex;gap:24px;margin-top:36px;flex-wrap:wrap;">
        ${stats.map(s => `<div><div style="font-family:${headingFont};font-size:22px;font-weight:900;color:${color};">${s.value}</div><div style="font-family:${bodyFont};font-size:12px;color:rgba(255,255,255,0.5);">${s.label}</div></div>`).join('')}
      </div>
    </div>
    <div style="position:relative;">
      <div style="width:100%;min-height:480px;border-radius:24px;background:linear-gradient(135deg,rgba(${colorRgb},0.25) 0%,rgba(${colorRgb},0.08) 50%,#1a1a2e 100%);border:1px solid rgba(${colorRgb},0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;overflow:hidden;position:relative;">
        ${heroImg && !heroImg.includes('placeholder') ? `<img src="${heroImg}" alt="${productName}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;position:absolute;inset:0;opacity:0.85;" onerror="this.style.display='none'">` : ''}
        <div style="position:relative;z-index:1;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">\u2728</div>
          <div style="font-family:${headingFont};font-size:28px;font-weight:900;color:#fff;margin-bottom:8px;">${productName}</div>
          <div style="font-family:${bodyFont};font-size:16px;color:${color};font-weight:700;">${displayPrice} AUD</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 3: TRUST BADGES -->
<section style="background:#fff;padding:40px 24px;">
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0;">
    ${[
      { icon: '\ud83d\ude9a', title: 'Free AU Shipping', sub: 'On all orders over $75' },
      { icon: '\u2b50', title: '4.9/5 Stars', sub: 'Over 3,200 verified reviews' },
      { icon: '\ud83d\udd04', title: '30-Day Returns', sub: 'No questions asked' },
      { icon: '\u2705', title: 'Secure Checkout', sub: 'Afterpay & all major cards' },
    ].map((b, i) => `<div style="text-align:center;padding:24px 16px;${i < 3 ? 'border-right:1px solid #eee;' : ''}">
      <div style="font-size:32px;margin-bottom:10px;">${b.icon}</div>
      <div style="font-family:${headingFont};font-size:14px;font-weight:800;color:#080808;margin-bottom:4px;">${b.title}</div>
      <div style="font-family:${bodyFont};font-size:12px;color:#71717a;">${b.sub}</div>
    </div>`).join('')}
  </div>
</section>

<!-- SECTION 4: PRODUCT SPOTLIGHT -->
<section id="shop" style="background:#080808;padding:80px 24px;">
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;">
    <div style="border-radius:20px;overflow:hidden;background:linear-gradient(135deg,rgba(${colorRgb},0.15),#111);min-height:420px;display:flex;align-items:center;justify-content:center;position:relative;">
      ${productImg && !productImg.includes('placeholder') ? `<img src="${productImg}" alt="${productName}" style="width:100%;height:420px;object-fit:cover;" onerror="this.style.display='none'">` : ''}
      <div style="text-align:center;padding:40px;position:relative;z-index:1;">
        <div style="font-size:56px;margin-bottom:16px;">\ud83d\udecd\ufe0f</div>
        <div style="font-family:${headingFont};color:#fff;font-size:20px;font-weight:700;">${productName}</div>
      </div>
    </div>
    <div>
      <div style="display:inline-block;background:rgba(${colorRgb},0.12);color:${color};font-family:${headingFont};font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Featured Product</div>
      <h2 style="font-family:${headingFont};font-size:36px;font-weight:900;color:#fff;margin:0 0 12px;line-height:1.15;">${productName}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="color:#fbbf24;font-size:16px;">\u2605\u2605\u2605\u2605\u2605</span>
        <span style="font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.5);">4.9 \u00b7 3,200+ reviews</span>
      </div>
      <p style="font-family:${bodyFont};font-size:15px;color:rgba(255,255,255,0.7);line-height:1.65;margin:0 0 24px;">${productDesc}</p>
      <div style="font-family:${headingFont};font-size:36px;font-weight:900;color:#fff;margin-bottom:6px;">${displayPrice} <span style="font-size:16px;color:rgba(255,255,255,0.4);font-weight:400;">AUD</span></div>
      <div style="font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.45);margin-bottom:24px;">or 4 payments of $${afterpayPrice} with <span style="color:#b2fce4;">Afterpay</span></div>
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <button onclick="typeof window.addToCart!=='undefined'&&window.addToCart('${productName.replace(/'/g, "\\'")}','${displayPrice}','')" style="flex:1;min-width:140px;background:${color};color:#080808;font-family:${headingFont};font-size:15px;font-weight:800;padding:16px 24px;border:none;border-radius:10px;cursor:pointer;">Add to Cart</button>
        <button style="flex:1;min-width:140px;background:rgba(255,255,255,0.08);color:#fff;font-family:${headingFont};font-size:15px;font-weight:700;padding:16px 24px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;cursor:pointer;">Buy Now</button>
      </div>
      <div style="font-family:${bodyFont};font-size:12px;color:rgba(255,255,255,0.4);display:flex;gap:16px;flex-wrap:wrap;">
        <span>\u2713 Free AU shipping over $75</span>
        <span>\u2713 30-day returns</span>
        <span>\u2713 In stock</span>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 5: BENEFITS/FEATURES -->
<section id="about" style="background:#0a0a12;padding:80px 24px;">
  <div style="${sectionStyle}">
    <div style="text-align:center;margin-bottom:56px;">
      <div style="display:inline-block;background:rgba(${colorRgb},0.1);color:${color};font-family:${headingFont};font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Why Choose Us</div>
      <h2 style="font-family:${headingFont};font-size:40px;font-weight:900;color:#fff;margin:0 0 16px;">Built different. Built for Australia.</h2>
      <p style="font-family:${bodyFont};font-size:16px;color:rgba(255,255,255,0.6);max-width:560px;margin:0 auto;">${uvp}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      ${keyBenefits.map(b => `<div style="${cardStyle}">
        <div style="font-size:36px;margin-bottom:16px;">${b.icon}</div>
        <h3 style="font-family:${headingFont};font-size:18px;font-weight:800;color:#fff;margin:0 0 10px;">${b.title}</h3>
        <p style="font-family:${bodyFont};font-size:14px;color:rgba(255,255,255,0.6);margin:0;line-height:1.6;">${b.description}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- SECTION 6: SOCIAL PROOF MARQUEE -->
<div style="background:${color};overflow:hidden;padding:14px 0;">
  <div style="display:flex;gap:48px;animation:marquee 20s linear infinite;white-space:nowrap;">
    ${['\u2605\u2605\u2605\u2605\u2605 4.9 Rating', '\ud83d\ude9a Free AU Shipping', '30-Day Returns', '\u2705 Afterpay Available', '\ud83c\udde6\ud83c\uddfa Australian Owned', '12,400+ Happy Customers', '\u2605\u2605\u2605\u2605\u2605 4.9 Rating', '\ud83d\ude9a Free AU Shipping', '30-Day Returns', '\u2705 Afterpay Available'].map(t => `<span style="font-family:${headingFont};font-size:13px;font-weight:800;color:#080808;">${t}</span>`).join('')}
  </div>
</div>
<style>@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>

<!-- SECTION 7: TESTIMONIALS -->
<section style="background:#080808;padding:80px 24px;">
  <div style="${sectionStyle}">
    <div style="text-align:center;margin-bottom:56px;">
      <div style="display:inline-block;background:rgba(${colorRgb},0.1);color:${color};font-family:${headingFont};font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Customer Love</div>
      <h2 style="font-family:${headingFont};font-size:40px;font-weight:900;color:#fff;margin:0;">What Australians are saying</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      ${testimonials.slice(0, 3).map(t => `<div style="${cardStyle}">
        <div style="color:#fbbf24;font-size:16px;margin-bottom:14px;">\u2605\u2605\u2605\u2605\u2605</div>
        <p style="font-family:${bodyFont};font-size:15px;color:rgba(255,255,255,0.82);line-height:1.65;margin:0 0 20px;">"${t.text}"</p>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${color},#b8941f);display:flex;align-items:center;justify-content:center;font-family:${headingFont};font-size:14px;font-weight:800;color:#080808;">${(t.name || 'A').charAt(0)}</div>
          <div>
            <div style="font-family:${headingFont};font-size:13px;font-weight:700;color:#fff;">${t.name}</div>
            <div style="font-family:${bodyFont};font-size:12px;color:rgba(255,255,255,0.4);">\ud83d\udccd ${t.location}</div>
          </div>
          <div style="margin-left:auto;font-family:${bodyFont};font-size:11px;color:rgba(255,255,255,0.3);">\u2713 Verified</div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- SECTION 8: FAQ -->
<section id="contact" style="background:#0a0a12;padding:80px 24px;">
  <div style="max-width:720px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;">
      <div style="display:inline-block;background:rgba(${colorRgb},0.1);color:${color};font-family:${headingFont};font-size:11px;font-weight:800;padding:5px 14px;border-radius:100px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">FAQ</div>
      <h2 style="font-family:${headingFont};font-size:36px;font-weight:900;color:#fff;margin:0;">Frequently asked questions</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${faqItems.map(f => `<div class="faq-item" style="${cardStyle}cursor:pointer;" onclick="var a=this.querySelector('.faq-answer');var t=this.querySelector('.faq-toggle');if(a.style.display==='none'||!a.style.display){a.style.display='block';t.textContent='\u2212'}else{a.style.display='none';t.textContent='+'}">
        <div class="faq-question" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <span style="font-family:${headingFont};font-size:15px;font-weight:700;color:#fff;">${f.q}</span>
          <span class="faq-toggle" style="color:${color};font-size:20px;font-weight:300;flex-shrink:0;width:24px;text-align:center;">+</span>
        </div>
        <div class="faq-answer" style="display:none;margin-top:14px;font-family:${bodyFont};font-size:14px;color:rgba(255,255,255,0.65);line-height:1.65;">${f.a}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- SECTION 9: CTA BANNER -->
<section style="background:linear-gradient(135deg,rgba(${colorRgb},0.18) 0%,rgba(${colorRgb},0.06) 100%);padding:80px 24px;border-top:1px solid rgba(${colorRgb},0.15);border-bottom:1px solid rgba(${colorRgb},0.15);">
  <div style="max-width:640px;margin:0 auto;text-align:center;">
    <div style="font-size:48px;margin-bottom:20px;">\ud83d\udecd\ufe0f</div>
    <h2 style="font-family:${headingFont};font-size:40px;font-weight:900;color:#fff;margin:0 0 16px;">${tagline}</h2>
    <p style="font-family:${bodyFont};font-size:16px;color:rgba(255,255,255,0.65);margin:0 0 32px;">${uvp}</p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
      <a href="#shop" style="display:inline-block;background:${color};color:#080808;font-family:${headingFont};font-size:16px;font-weight:800;padding:18px 40px;border-radius:10px;text-decoration:none;">Shop Now \u2192</a>
      <a href="#contact" style="display:inline-block;background:transparent;color:#fff;font-family:${headingFont};font-size:16px;font-weight:700;padding:18px 40px;border-radius:10px;text-decoration:none;border:1.5px solid rgba(255,255,255,0.2);">Learn More</a>
    </div>
    <div style="margin-top:24px;font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.4);">Free shipping over $75 \u00b7 Afterpay available \u00b7 30-day returns</div>
  </div>
</section>

<!-- SECTION 10: FOOTER -->
<footer style="background:#060606;padding:56px 24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px;">
      <div>
        <div style="font-family:${headingFont};font-size:22px;font-weight:900;color:${color};margin-bottom:14px;">${brandName}</div>
        <p style="font-family:${bodyFont};font-size:14px;color:rgba(255,255,255,0.5);line-height:1.65;margin:0 0 20px;">${tagline}</p>
        <div style="font-family:${bodyFont};font-size:12px;color:rgba(255,255,255,0.3);">\ud83c\udde6\ud83c\uddfa All prices in AUD \u00b7 Afterpay available</div>
      </div>
      <div>
        <div style="font-family:${headingFont};font-size:13px;font-weight:800;color:#fff;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Shop</div>
        ${['All Products', 'New Arrivals', 'Best Sellers', 'Sale'].map(l => `<div style="margin-bottom:10px;"><a href="#" style="font-family:${bodyFont};font-size:14px;color:rgba(255,255,255,0.5);text-decoration:none;">${l}</a></div>`).join('')}
      </div>
      <div>
        <div style="font-family:${headingFont};font-size:13px;font-weight:800;color:#fff;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Info</div>
        ${['About Us', 'Shipping', 'Returns', 'Contact'].map(l => `<div style="margin-bottom:10px;"><a href="#" style="font-family:${bodyFont};font-size:14px;color:rgba(255,255,255,0.5);text-decoration:none;">${l}</a></div>`).join('')}
      </div>
      <div>
        <div style="font-family:${headingFont};font-size:13px;font-weight:800;color:#fff;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Support</div>
        ${['FAQ', 'Track Order', 'Size Guide', 'Wholesale'].map(l => `<div style="margin-bottom:10px;"><a href="#" style="font-family:${bodyFont};font-size:14px;color:rgba(255,255,255,0.5);text-decoration:none;">${l}</a></div>`).join('')}
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div style="font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.3);">\u00a9 ${new Date().getFullYear()} ${brandName}. All rights reserved. ABN XX XXX XXX XXX</div>
      <div style="display:flex;gap:20px;">
        <a href="#" style="font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.35);text-decoration:none;">Privacy</a>
        <a href="#" style="font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.35);text-decoration:none;">Terms</a>
        <a href="#" style="font-family:${bodyFont};font-size:13px;color:rgba(255,255,255,0.35);text-decoration:none;">Shipping</a>
      </div>
    </div>
  </div>
</footer>

</div>

<style>
  @media(max-width:768px){
    nav .nav-links{display:none!important}
    #hamburger{display:flex!important}
    section>div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}
    section>div[style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important}
    section>div[style*="grid-template-columns:repeat(4"]{grid-template-columns:1fr 1fr!important}
    section>div[style*="grid-template-columns:2fr 1fr 1fr 1fr"]{grid-template-columns:1fr 1fr!important}
    .faq-item{padding:16px!important}
    section{padding:48px 16px!important}
  }
  @media(max-width:480px){
    section>div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}
    section>div[style*="grid-template-columns:2fr 1fr 1fr 1fr"]{grid-template-columns:1fr!important}
  }
  html{scroll-behavior:smooth}
  *{box-sizing:border-box}
  img{max-width:100%}
</style>
`;
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

  const colorRgb = (function(hex: string) {
    const c = hex.replace('#', '');
    return parseInt(c.substring(0,2),16)+','+parseInt(c.substring(2,4),16)+','+parseInt(c.substring(4,6),16);
  })(color);
  const storeName_ = storeName || niche;
  const isLight = ['editorial', 'minimal'].includes(designDirection as string);

  // ── 1. Images removed — using CSS gradient boxes instead ───────────────────
  progress(5, '🔍 Finding the perfect images...');
  const pd = productData || {};
  const productTitle = sanitizeProductTitle((pd.product_title as string) || '', niche);
  const heroImg = '';
  const productImg = '';
  const lifestyleImg1 = '';
  const lifestyleImg2 = '';
  const shopImages: string[] = [];

  // ── 2. Expand brand brief (fast Haiku) ─────────────────────────────────────
  progress(10, '📝 Building your brand brief...');
  const brief = await expandStoreBrief({
    niche,
    storeName: storeName_,
    accentColor: color,
    designDirection: dir?.label || 'modern',
    productData: pd,
  });
  console.log('[website-api] BRIEF OUTPUT:', JSON.stringify({
    brandName: brief.brandName,
    tagline: brief.tagline,
    heroHeadline: brief.heroHeadline,
    storeName: storeName_,
    niche,
    price,
  }, null, 2));

  // ── 3. Build manifest ────────────────────────────────────────────────────
  progress(15, '🎨 Crafting your store...');
  const manifestJson = buildManifest(storeName_, color, (brief.tagline as string) || vibe || ('Premium ' + niche + ' for Australians'));

  // ── 4. Extract typed values from brief ─────────────────────────────────────
  const briefBrandName = (brief.brandName as string) || storeName_ || niche;
  const briefTagline = (brief.tagline as string) || `Premium ${niche} for Australians`;
  const briefHeroHeadline = (brief.heroHeadline as string) || `The ${niche} brand built for Australia`;
  const briefHeroSub = (brief.heroSubheadline as string) || `Premium quality, fast AU shipping, results from day one.`;
  const briefUvp = (brief.uniqueValueProp as string) || `We source and test every product for Australian conditions.`;

  const briefTestimonials = Array.isArray(brief.testimonials) ? brief.testimonials as Array<{name:string;location:string;text:string}> : [
    { name: 'Sarah M.', location: 'Sydney NSW', text: `Finally found ${niche} that actually works. Arrived in 2 days and the quality blew me away.` },
    { name: 'Jake T.', location: 'Brisbane QLD', text: `Tried heaps of brands. This one is genuinely different. Highly recommend to any Aussie.` },
    { name: 'Emma K.', location: 'Melbourne VIC', text: `Super fast delivery and the customer service was brilliant. Will definitely order again.` },
  ];

  const briefFaq = Array.isArray(brief.faq) ? brief.faq as Array<{q:string;a:string}> : [
    { q: 'How long does shipping take to Australia?', a: 'We ship from our AU warehouse — most orders arrive in 3-5 business days.' },
    { q: 'What is your return policy?', a: '30-day no questions asked returns. Just contact us and we\'ll sort it.' },
    { q: 'Is this product authentic?', a: '100% authentic. We quality-check every item before dispatch.' },
    { q: 'Do you offer Afterpay?', a: 'Yes — split any order into 4 interest-free payments at checkout.' },
  ];

  const productName = (pd.product_title as string) || (pd.title as string) || storeName_ || niche;
  const displayPrice = price || (pd.price_aud ? String(pd.price_aud) : '49.95');
  const priceNum = parseFloat(displayPrice) || 49.95;
  const afterpayAmount = (priceNum / 4).toFixed(2);
  const supportEmail = `support@${briefBrandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.au`;

  const t1 = briefTestimonials[0] || { name: 'Sarah M.', location: 'Sydney NSW', text: 'Amazing product, fast delivery.' };
  const t2 = briefTestimonials[1] || { name: 'Jake T.', location: 'Brisbane QLD', text: 'Highly recommend!' };
  const t3 = briefTestimonials[2] || { name: 'Emma K.', location: 'Melbourne VIC', text: 'Will order again.' };

  const faq1 = briefFaq[0] || { q: 'How fast is shipping?', a: '3-5 business days Australia-wide.' };
  const faq2 = briefFaq[1] || { q: 'What is your return policy?', a: '30-day returns, no questions asked.' };
  const faq3 = briefFaq[2] || { q: 'Is this authentic?', a: '100% authentic, quality-checked before dispatch.' };
  const faq4 = briefFaq[3] || { q: 'Do you offer Afterpay?', a: 'Yes, 4 interest-free payments at checkout.' };

  // Bullet points for product section — niche-aware
  const nicheLower = niche.toLowerCase();
  let productBullets: string[];
  if (nicheLower.includes('gym') || nicheLower.includes('active') || nicheLower.includes('fitness')) {
    productBullets = ['4-way stretch performance fabric', 'Moisture-wicking — stays dry through any workout', 'High-waist compression design for support', 'Squat-proof material tested to AU standards', 'Available in sizes XS–3XL with Afterpay'];
  } else if (nicheLower.includes('skin') || nicheLower.includes('beauty') || nicheLower.includes('glow')) {
    productBullets = ['Dermatologist tested and approved', 'Cruelty-free and vegan formula', 'Results visible within 14 days', 'Suited to Australia\'s harsh UV climate', 'Free of parabens, sulphates, and artificial fragrance'];
  } else if (nicheLower.includes('kitchen') || nicheLower.includes('home') || nicheLower.includes('cook')) {
    productBullets = ['Food-grade materials, BPA-free', 'Dishwasher safe for easy cleaning', 'Compact storage design for AU kitchens', '2-year Australian warranty included', 'Ships same day — arrives in 3-5 days'];
  } else if (nicheLower.includes('pet') || nicheLower.includes('dog') || nicheLower.includes('cat')) {
    productBullets = ['Vet-approved materials, 100% pet-safe', 'Designed for Australian breeds and climate', 'Durable — built to withstand Aussie conditions', 'Easy to clean, odour-resistant', 'Loved by 12,000+ Australian pet owners'];
  } else {
    productBullets = ['Premium quality materials built for Australian conditions', 'Free express shipping on orders over $75', '30-day hassle-free returns — no questions asked', 'Afterpay available — 4 interest-free payments', 'Trusted by 12,400+ happy Australian customers'];
  }

  // ── 5. Generate complete HTML template (no LLM streaming needed) ───────────
  progress(20, '✍️ Generating your store...');
  progress(50, '🎨 Styling sections...');

  const singlePassSystem = `You are an expert HTML/CSS developer. Output ONLY valid HTML — no markdown, no backticks, no explanation. Start with <!DOCTYPE html>.`;

  const singlePassUser = `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${briefBrandName} — ${niche}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a1a;overflow-x:hidden}
.heading-font{font-family:'Syne',sans-serif}
:root{--accent:${color};--accent-rgb:${colorRgb};--bg:#0a0a0f;--surface:#141420;--radius:12px}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(10,10,15,0.96);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:68px}
.nav-logo{font-family:'Syne',sans-serif;font-weight:900;font-size:22px;color:#fff;text-decoration:none;letter-spacing:-0.5px}
.nav-logo span{color:${color}}
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{color:rgba(255,255,255,0.75);text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s}
.nav-links a:hover{color:#fff}
.nav-cta{background:${color};color:#fff;padding:10px 22px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;font-family:'Syne',sans-serif;transition:opacity 0.2s}
.nav-cta:hover{opacity:0.85}

/* ANNOUNCEMENT */
.announcement{background:${color};color:#fff;text-align:center;padding:11px 16px;font-size:13px;font-weight:600;letter-spacing:0.01em}

/* HERO */
.hero{min-height:100vh;background:linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 100%);display:flex;align-items:center;padding:120px 32px 80px;gap:60px}
.hero-left{flex:1;max-width:580px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(${colorRgb},0.12);border:1px solid rgba(${colorRgb},0.3);border-radius:100px;padding:7px 18px;font-size:13px;font-weight:700;color:${color};margin-bottom:28px;font-family:'Syne',sans-serif}
.hero h1{font-family:'Syne',sans-serif;font-size:clamp(38px,5.5vw,72px);font-weight:900;color:#fff;line-height:1.08;letter-spacing:-1.5px;margin-bottom:22px}
.hero h1 span{color:${color}}
.hero-sub{font-size:18px;color:rgba(255,255,255,0.72);line-height:1.65;margin-bottom:36px;max-width:480px}
.hero-buttons{display:flex;gap:14px;flex-wrap:wrap}
.btn-primary{background:${color};color:#fff;padding:16px 34px;border-radius:10px;font-weight:800;font-size:16px;text-decoration:none;font-family:'Syne',sans-serif;display:inline-block;transition:opacity 0.2s;border:none;cursor:pointer}
.btn-primary:hover{opacity:0.88}
.btn-secondary{background:transparent;color:#fff;padding:16px 34px;border-radius:10px;font-weight:700;font-size:16px;text-decoration:none;font-family:'Syne',sans-serif;display:inline-block;border:2px solid rgba(255,255,255,0.35);transition:border-color 0.2s}
.btn-secondary:hover{border-color:rgba(255,255,255,0.7)}
.hero-right{flex:1;display:flex;justify-content:center;align-items:center}
.hero-visual{width:100%;max-width:480px;height:500px;border-radius:20px;background:linear-gradient(135deg,rgba(${colorRgb},0.25) 0%,rgba(${colorRgb},0.05) 100%);border:1px solid rgba(${colorRgb},0.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;position:relative;overflow:hidden}
.hero-visual::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent 40%,rgba(${colorRgb},0.08));pointer-events:none}
.hero-visual-label{font-family:'Syne',sans-serif;font-size:26px;font-weight:900;color:#fff;text-align:center;padding:0 24px;line-height:1.2}
.hero-visual-sub{font-size:14px;color:rgba(255,255,255,0.5);text-align:center}
.hero-visual-price{background:${color};color:#fff;font-family:'Syne',sans-serif;font-weight:900;font-size:22px;padding:12px 28px;border-radius:8px;margin-top:8px}

/* TRUST BAR */
.trust-bar{background:#fff;border-top:none;border-bottom:1px solid #f0f0f0;padding:28px 32px;display:flex;justify-content:center;gap:0}
.trust-item{flex:1;max-width:220px;text-align:center;padding:0 24px;border-right:1px solid #e8e8e8}
.trust-item:last-child{border-right:none}
.trust-icon{font-size:28px;margin-bottom:8px}
.trust-title{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:#1a1a1a;margin-bottom:3px}
.trust-sub{font-size:12px;color:#888}

/* PRODUCT */
.product-section{background:#f7f7f9;padding:100px 32px}
.product-inner{max-width:1080px;margin:0 auto;display:flex;gap:60px;align-items:flex-start}
.product-img-wrap{flex:1;min-height:500px;border-radius:16px;background:linear-gradient(135deg,rgba(${colorRgb},0.18) 0%,rgba(${colorRgb},0.06) 100%);border:1px solid rgba(${colorRgb},0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.product-img-label{font-family:'Syne',sans-serif;font-size:24px;font-weight:900;color:${color};text-align:center;padding:0 32px}
.product-img-sub{font-size:13px;color:#666;text-align:center}
.product-info{flex:1}
.product-info h2{font-family:'Syne',sans-serif;font-size:34px;font-weight:900;color:#1a1a1a;margin-bottom:12px;line-height:1.15}
.product-stars{color:#d4af37;font-size:18px;margin-bottom:4px}
.product-reviews{font-size:13px;color:#666;margin-bottom:20px}
.product-price-main{font-family:'Syne',sans-serif;font-size:48px;font-weight:900;color:${color};line-height:1;margin-bottom:8px}
.product-afterpay{font-size:14px;color:#555;margin-bottom:24px;background:rgba(0,0,0,0.04);border-radius:6px;padding:8px 12px;display:inline-block}
.product-bullets{list-style:none;margin-bottom:28px}
.product-bullets li{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #eee;font-size:15px;color:#333}
.product-bullets li::before{content:'✓';color:${color};font-weight:900;font-size:16px;flex-shrink:0}
.btn-cart{width:100%;background:${color};color:#fff;border:none;border-radius:10px;padding:18px;font-family:'Syne',sans-serif;font-weight:800;font-size:17px;cursor:pointer;margin-bottom:12px;transition:opacity 0.2s}
.btn-cart:hover{opacity:0.88}
.btn-buy{width:100%;background:#1a1a1a;color:#fff;border:none;border-radius:10px;padding:18px;font-family:'Syne',sans-serif;font-weight:800;font-size:17px;cursor:pointer;transition:opacity 0.2s}
.btn-buy:hover{opacity:0.82}

/* TESTIMONIALS */
.reviews-section{background:#0a0a0f;padding:100px 32px}
.section-title{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,46px);font-weight:900;text-align:center;margin-bottom:12px}
.section-sub{text-align:center;font-size:16px;margin-bottom:56px}
.reviews-grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.review-card{background:#141420;border-radius:16px;padding:28px;border-left:4px solid ${color}}
.review-stars{color:#d4af37;font-size:18px;margin-bottom:14px}
.review-text{color:rgba(255,255,255,0.82);font-size:15px;line-height:1.65;margin-bottom:20px;font-style:italic}
.review-author{font-weight:700;color:#fff;font-size:14px}
.review-location{color:rgba(255,255,255,0.4);font-size:13px;margin-top:2px}

/* HOW IT WORKS */
.how-section{background:#fff;padding:100px 32px}
.steps-grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.step-card{text-align:center;padding:32px 24px}
.step-num{font-family:'Syne',sans-serif;font-size:56px;font-weight:900;color:${color};opacity:0.25;line-height:1;margin-bottom:16px}
.step-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#1a1a1a;margin-bottom:12px}
.step-desc{font-size:15px;color:#555;line-height:1.6}

/* FAQ */
.faq-section{background:#f7f7f9;padding:100px 32px}
.faq-wrap{max-width:760px;margin:0 auto}
.faq-item{border-bottom:1px solid #e0e0e0;padding:24px 0}
.faq-q{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#1a1a1a;margin-bottom:10px}
.faq-a{font-size:15px;color:#555;line-height:1.65}

/* FOOTER */
footer{background:#0a0a0f;color:#fff;padding:70px 32px 28px}
.footer-grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px;margin-bottom:48px}
.footer-brand-name{font-family:'Syne',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:10px}
.footer-brand-name span{color:${color}}
.footer-tagline{color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin-bottom:20px}
.social-icons{display:flex;gap:10px}
.social-icon{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.7);font-size:13px;font-weight:700;text-decoration:none;transition:background 0.2s}
.social-icon:hover{background:rgba(${colorRgb},0.3);color:#fff}
.footer-heading{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:18px}
.footer-links{list-style:none;display:flex;flex-direction:column;gap:10px}
.footer-links a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;transition:color 0.2s}
.footer-links a:hover{color:#fff}
.footer-bottom{max-width:1080px;margin:0 auto;padding-top:28px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:13px;color:rgba(255,255,255,0.35)}

/* MOBILE */
@media(max-width:768px){
  nav{padding:0 16px}
  .nav-links{display:none}
  .hero{flex-direction:column;padding:100px 16px 60px;gap:40px}
  .hero-right{width:100%}
  .hero-visual{max-width:100%;height:280px}
  .trust-bar{flex-wrap:wrap;gap:0;padding:20px 16px}
  .trust-item{flex:1 1 45%;border-right:none;border-bottom:1px solid #eee;padding:16px 8px}
  .trust-item:nth-child(odd){border-right:1px solid #eee}
  .product-inner{flex-direction:column;gap:32px}
  .product-img-wrap{min-height:260px}
  .reviews-grid{grid-template-columns:1fr}
  .steps-grid{grid-template-columns:1fr;gap:24px}
  .footer-grid{grid-template-columns:1fr}
  .footer-bottom{flex-direction:column;text-align:center}
  .product-section,.reviews-section,.how-section,.faq-section{padding:60px 16px}
}
</style>
</head>
<body>

<!-- ANNOUNCEMENT BAR -->
<div class="announcement">\u{1F69A} Free Shipping on AU Orders Over $75 &nbsp;\u00B7&nbsp; 30-Day Returns &nbsp;\u00B7&nbsp; Afterpay Available</div>

<!-- NAV -->
<nav>
  <a href="#" class="nav-logo">${briefBrandName.split(' ').map((w: string, i: number) => i === 0 ? '<span>' + w + '</span>' : ' ' + w).join('')}</a>
  <ul class="nav-links">
    <li><a href="#">Home</a></li>
    <li><a href="#">Shop</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
  <a href="#" class="nav-cta">Shop Now</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-left">
    <div class="hero-badge">\u{1F1E6}\u{1F1FA} AUSTRALIAN OWNED &amp; OPERATED</div>
    <h1 class="heading-font">${briefHeroHeadline}</h1>
    <p class="hero-sub">${briefHeroSub}</p>
    <div class="hero-buttons">
      <a href="#" class="btn-primary">Shop Now \u2192</a>
      <a href="#" class="btn-secondary">Learn More</a>
    </div>
  </div>
  <div class="hero-right">
    <div class="hero-visual">
      <div class="hero-visual-label">${productName}</div>
      <div class="hero-visual-sub">${niche}</div>
      <div class="hero-visual-price">$${displayPrice} AUD</div>
    </div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="trust-item">
    <div class="trust-icon">\u{1F69A}</div>
    <div class="trust-title">Free AU Shipping</div>
    <div class="trust-sub">Orders over $75</div>
  </div>
  <div class="trust-item">
    <div class="trust-icon">\u2B50</div>
    <div class="trust-title">4.9/5 Stars</div>
    <div class="trust-sub">12,400+ reviews</div>
  </div>
  <div class="trust-item">
    <div class="trust-icon">\u{1F504}</div>
    <div class="trust-title">30-Day Returns</div>
    <div class="trust-sub">No questions asked</div>
  </div>
  <div class="trust-item">
    <div class="trust-icon">\u2705</div>
    <div class="trust-title">Secure Checkout</div>
    <div class="trust-sub">Afterpay &amp; Zip available</div>
  </div>
</div>

<!-- PRODUCT SECTION -->
<section class="product-section">
  <div class="product-inner">
    <div class="product-img-wrap">
      <div class="product-img-label">${productName}</div>
      <div class="product-img-sub">Premium ${niche}</div>
    </div>
    <div class="product-info">
      <h2 class="heading-font">${productName}</h2>
      <div class="product-stars">\u2605\u2605\u2605\u2605\u2605</div>
      <div class="product-reviews">487 verified Australian reviews</div>
      <div class="product-price-main">$${displayPrice} AUD</div>
      <div class="product-afterpay">or 4 payments of $${afterpayAmount} with <strong>Afterpay</strong> \u24D8</div>
      <ul class="product-bullets">
        ${productBullets.map((b: string) => '<li>' + b + '</li>').join('\n        ')}
      </ul>
      <button class="btn-cart">Add to Cart \u2014 $${displayPrice} AUD</button>
      <button class="btn-buy">Buy Now with Afterpay</button>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="reviews-section">
  <h2 class="section-title heading-font" style="color:#fff">What Australians Are Saying</h2>
  <p class="section-sub" style="color:rgba(255,255,255,0.5)">Real reviews from verified Australian customers</p>
  <div class="reviews-grid">
    <div class="review-card">
      <div class="review-stars">\u2605\u2605\u2605\u2605\u2605</div>
      <p class="review-text">"${t1.text}"</p>
      <div class="review-author">${t1.name}</div>
      <div class="review-location">\u{1F4CD} ${t1.location}</div>
    </div>
    <div class="review-card">
      <div class="review-stars">\u2605\u2605\u2605\u2605\u2605</div>
      <p class="review-text">"${t2.text}"</p>
      <div class="review-author">${t2.name}</div>
      <div class="review-location">\u{1F4CD} ${t2.location}</div>
    </div>
    <div class="review-card">
      <div class="review-stars">\u2605\u2605\u2605\u2605\u2605</div>
      <p class="review-text">"${t3.text}"</p>
      <div class="review-author">${t3.name}</div>
      <div class="review-location">\u{1F4CD} ${t3.location}</div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how-section">
  <h2 class="section-title heading-font" style="color:#1a1a1a">How It Works</h2>
  <p class="section-sub" style="color:#666">Getting started is simple</p>
  <div class="steps-grid">
    <div class="step-card">
      <div class="step-num">01</div>
      <div class="step-title heading-font">Choose Your ${niche}</div>
      <p class="step-desc">Browse our curated range of premium ${niche.toLowerCase()} products, all sourced and tested for Australian conditions and lifestyles.</p>
    </div>
    <div class="step-card">
      <div class="step-num">02</div>
      <div class="step-title heading-font">Order with Confidence</div>
      <p class="step-desc">Pay securely with Afterpay, Zip, or any major card. Every order is backed by our 30-day no-questions-asked return guarantee.</p>
    </div>
    <div class="step-card">
      <div class="step-num">03</div>
      <div class="step-title heading-font">Fast AU Delivery</div>
      <p class="step-desc">We ship from our Australian warehouse. Most orders arrive within 3\u20135 business days. Track your order in real time via email.</p>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="faq-section">
  <div class="faq-wrap">
    <h2 class="section-title heading-font" style="color:#1a1a1a;margin-bottom:48px">Frequently Asked Questions</h2>
    <div class="faq-item">
      <div class="faq-q">${faq1.q}</div>
      <div class="faq-a">${faq1.a}</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">${faq2.q}</div>
      <div class="faq-a">${faq2.a}</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">${faq3.q}</div>
      <div class="faq-a">${faq3.a}</div>
    </div>
    <div class="faq-item">
      <div class="faq-q">${faq4.q}</div>
      <div class="faq-a">${faq4.a}</div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-grid">
    <div>
      <div class="footer-brand-name heading-font">${briefBrandName.split(' ').map((w: string, i: number) => i === 0 ? '<span>' + w + '</span>' : ' ' + w).join('')}</div>
      <p class="footer-tagline">${briefTagline}<br>\u{1F1E6}\u{1F1FA} Proudly Australian</p>
      <div class="social-icons">
        <a href="#" class="social-icon">f</a>
        <a href="#" class="social-icon">ig</a>
        <a href="#" class="social-icon">tt</a>
      </div>
    </div>
    <div>
      <div class="footer-heading">Quick Links</div>
      <ul class="footer-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">Shop</a></li>
        <li><a href="#">About Us</a></li>
        <li><a href="#">Contact</a></li>
        <li><a href="#">FAQ</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-heading">Contact Us</div>
      <ul class="footer-links">
        <li><a href="mailto:${supportEmail}">${supportEmail}</a></li>
        <li><a href="#">Mon\u2013Fri, 9am\u20135pm AEST</a></li>
        <li><a href="#">ABN: 12 345 678 901</a></li>
        <li><a href="#">Afterpay &amp; Zip accepted</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">\u00A9 2026 ${briefBrandName}. All rights reserved. \u{1F1E6}\u{1F1FA} Made in Australia</div>
    <div class="footer-copy">Prices in AUD. GST included.</div>
  </div>
</footer>

</body>
</html>`;

  // Template generates complete HTML — no LLM streaming needed
  const fullText = singlePassUser;
  progress(85, '🏗️ Finalising your store...');

  // Skip postProcessHtml — template already has all values filled
  const finalHtml = fullText;
  console.log(`[website-api] Generated HTML size: ${(finalHtml.length / 1024).toFixed(1)}kb`);

  progress(100, '✅ Your store is ready!');
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

      // Rate limit: 10 generates per hour per user
      const rl = rateLimit(`website-gen:${user.userId}`, 10, 60 * 60 * 1000);
      if (!rl.allowed) {
        res.status(429).json({ error: 'rate_limit_exceeded', message: 'Too many generations. Try again in 1 hour.', remaining: 0 });
        return;
      }

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