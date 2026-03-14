/**
 * firecrawl-products.ts
 *
 * Firecrawl-powered real AU product intelligence.
 * Scrapes live AU ecommerce sources → Claude Haiku extracts structured product data.
 * Replaces Tavily hallucination engine with real scraped data.
 */

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

// ── Fallback images by category (Unsplash) ──────────────────────────────────
const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  'Health & Beauty':
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=300&h=300&fit=crop&q=80',
  Pet: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop&q=80',
  'Home & Kitchen':
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop&q=80',
  Fitness:
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=300&fit=crop&q=80',
  Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=300&fit=crop&q=80',
  Fashion:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&q=80',
  'Baby & Kids':
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=300&fit=crop&q=80',
  'Sports & Outdoors':
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=300&fit=crop&q=80',
};
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&q=80';

// ── Sources to scrape (confirmed working as of 2026-03) ──────────────────────
const SOURCES = [
  {
    url: 'https://www.kogan.com/au/c/hot-deals/',
    platform: 'Kogan AU',
    label: 'Kogan Hot Deals',
  },
  {
    url: 'https://www.kogan.com/au/buy/?sort=popular',
    platform: 'Kogan AU',
    label: 'Kogan Popular',
  },
  {
    url: 'https://www.kogan.com/au/c/health-beauty/',
    platform: 'Kogan AU',
    label: 'Kogan Health & Beauty',
  },
];

export interface WinningProduct {
  product_title: string;
  category: string;
  platform: string;
  price_aud: number;
  winning_score: number;
  trend: string;
  competition_level: string;
  au_relevance: number;
  est_daily_revenue_aud: number;
  units_per_day: number;
  why_winning: string;
  ad_angle: string;
  image_url: string;
  tiktok_product_url: string;
  sold_count: number;
}

// ── Firecrawl scrape helper ──────────────────────────────────────────────────
async function scrapeUrl(url: string): Promise<string> {
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 20000,
      }),
    });
    const data = (await res.json()) as { success: boolean; data?: { markdown?: string } };
    if (data.success) return data.data?.markdown || '';
  } catch (err: any) {
    console.warn(`[firecrawl] scrape failed for ${url}:`, err.message);
  }
  return '';
}

// ── Strip page navigation/header — find where product listings begin ─────────
function trimToProductSection(content: string): string {
  const lines = content.split('\n');
  // Find the first line that contains a price pattern ($N) and is NOT in a nav/header
  // We look for the pattern after at least 30 lines (skip nav)
  for (let i = 30; i < lines.length; i++) {
    if (lines[i].includes('\\$') || (lines[i].match(/\$\d+/) && !lines[i].includes('WIN'))) {
      // Return from 10 lines before first price (catch the product name above it)
      const start = Math.max(0, i - 10);
      return lines.slice(start).join('\n');
    }
  }
  return content;
}

// ── Claude Haiku extraction ──────────────────────────────────────────────────
async function extractProductsFromContent(
  content: string,
  platform: string
): Promise<WinningProduct[]> {
  if (!content.trim()) return [];

  // Trim navigation header, then take up to 25KB of product content
  // (larger content causes Claude to hit token limits mid-JSON)
  const productContent = trimToProductSection(content);
  const truncated = productContent.slice(0, 25000);

  const prompt = `You are an AU ecommerce product analyst. Extract ALL individual products mentioned in the content below.

For each product, return a JSON array item with these exact fields:
{
  "product_title": "exact product name as shown",
  "category": "one of: Health & Beauty | Pet | Home & Kitchen | Fitness | Tech | Fashion | Baby & Kids | Sports & Outdoors",
  "price_aud": <number — price in AUD, parse from $ amounts shown>,
  "est_daily_revenue_aud": <number — estimate: price × estimated daily AU units sold>,
  "winning_score": <integer 1-100 — demand signals, reviews, ratings, trending>,
  "trend": "one of: exploding | growing | stable | declining",
  "au_relevance": <integer 1-100>,
  "competition_level": "one of: Low | Medium | High",
  "why_winning": "1-2 sentences why this wins in the AU market",
  "ad_angle": "specific TikTok/Meta hook angle for AU shoppers",
  "image_url": "full image URL if present in content starting with https://, else empty string",
  "platform": "${platform}"
}

Rules:
- Extract real physical products with ACTUAL prices shown (skip items without a $ price, skip nav links, skip mobile plans, skip presale items with no price)
- Kogan markdown format: product name is in **bold**, price follows as $XX or $XX.XX
- image_url: look for markdown image pattern [![name](https://assets.kogan.com/...)](link) — use that CDN URL. If not found, use empty string
- Prioritise products with ratings like 4.5(123) — they are proven sellers with real reviews
- Return ONLY the raw JSON array, no markdown fences, no explanation

CONTENT:
${truncated}`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const claudeData = (await claudeRes.json()) as {
      content?: Array<{ text: string }>;
      stop_reason?: string;
    };
    const raw = claudeData.content?.[0]?.text || '';

    // Strip markdown fences if present (Claude sometimes wraps in ```json```)
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/s);
    const text = fenceMatch ? fenceMatch[1].trim() : raw.trim();
    const arrStart = text.indexOf('[');
    if (arrStart === -1) return [];

    const jsonStr = text.slice(arrStart);
    const arrEnd = jsonStr.lastIndexOf(']');

    if (arrEnd !== -1) {
      // Complete array — parse normally
      try {
        const parsed = JSON.parse(jsonStr.slice(0, arrEnd + 1));
        return Array.isArray(parsed) ? parsed : [];
      } catch { /* fall through to recovery */ }
    }

    // Truncated JSON recovery — find last complete object
    const lastClose = jsonStr.lastIndexOf('},');
    if (lastClose > 0) {
      try {
        const recovered = JSON.parse(jsonStr.slice(0, lastClose + 1) + ']');
        return Array.isArray(recovered) ? recovered : [];
      } catch { /* give up */ }
    }
  } catch (err: any) {
    console.warn(`[firecrawl] Claude extraction failed for ${platform}:`, err.message);
  }
  return [];
}

// ── Image fallback assignment ────────────────────────────────────────────────
function ensureImageUrl(product: WinningProduct): WinningProduct {
  const url = product.image_url?.trim() || '';
  if (!url.startsWith('https://')) {
    product.image_url = UNSPLASH_BY_CATEGORY[product.category] ?? FALLBACK_IMAGE;
  }
  return product;
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function fetchFirecrawlProducts(): Promise<WinningProduct[]> {
  if (!FIRECRAWL_KEY) throw new Error('Missing FIRECRAWL_API_KEY');
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY');

  console.log(`[firecrawl] Scraping ${SOURCES.length} AU sources in parallel...`);

  // 1. Scrape all sources in parallel
  const scrapeResults = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const content = await scrapeUrl(source.url);
      const chars = content.length;
      console.log(
        `[firecrawl] ${source.label}: ${chars > 0 ? `${chars} chars` : 'BLOCKED/EMPTY'}`
      );
      return { content, platform: source.platform, label: source.label };
    })
  );

  // 2. Extract products via Claude Haiku from each successful scrape
  const allProducts: WinningProduct[] = [];

  for (const result of scrapeResults) {
    if (result.status !== 'fulfilled') continue;
    const { content, platform, label } = result.value;
    if (!content || content.length < 500) {
      console.warn(`[firecrawl] Skipping ${label} — insufficient content`);
      continue;
    }

    console.log(`[firecrawl] Extracting products from ${label}...`);
    const products = await extractProductsFromContent(content, platform);
    console.log(`[firecrawl] ${label}: extracted ${products.length} products`);
    allProducts.push(...products);
  }

  if (!allProducts.length) {
    throw new Error('Firecrawl returned 0 products — all sources may be blocked');
  }

  // 3. Deduplicate by product_title (case-insensitive)
  const seen = new Set<string>();
  const deduped = allProducts.filter((p) => {
    if (!p.product_title) return false;
    const key = p.product_title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 4. Ensure valid images + derived fields
  const final = deduped.map((p) => ({
    ...ensureImageUrl(p),
    price_aud: Number(p.price_aud) || 29.99,
    winning_score: Math.min(100, Math.max(1, Number(p.winning_score) || 70)),
    au_relevance: Math.min(100, Math.max(1, Number(p.au_relevance) || 70)),
    est_daily_revenue_aud: Number(p.est_daily_revenue_aud) || 0,
    units_per_day: Math.round(
      (Number(p.est_daily_revenue_aud) || 0) / Math.max(Number(p.price_aud) || 1, 1)
    ),
    tiktok_product_url: '',
    sold_count: 0,
  }));

  console.log(`[firecrawl] Final: ${final.length} unique products ready for upsert`);
  return final;
}
