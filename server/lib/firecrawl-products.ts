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

// ── PRODUCT STRATEGY ─────────────────────────────────────────────────────────
// Sources: AliExpress (dropship #1), Amazon AU (demand validation), Alibaba (wholesale)
// TikTok Shop AU blocks Firecrawl — use Tavily for TikTok trend signals separately
// All AliExpress URLs sorted by most orders (total_tranHiScore_desc) + AU shipping filter
const SOURCES = [
  // AliExpress — sorted by most orders, AU shipping, TikTok-friendly categories
  {
    url: 'https://www.aliexpress.com/category/200003482/beauty-health.html?SortType=total_tranHiScore_desc&shipCountry=AU',
    platform: 'AliExpress',
    label: 'AliExpress Health & Beauty',
  },
  {
    url: 'https://www.aliexpress.com/category/66/sports-entertainment.html?SortType=total_tranHiScore_desc&shipCountry=AU',
    platform: 'AliExpress',
    label: 'AliExpress Sports & Fitness',
  },
  {
    url: 'https://www.aliexpress.com/category/200003484/home-improvement.html?SortType=total_tranHiScore_desc&shipCountry=AU',
    platform: 'AliExpress',
    label: 'AliExpress Home & Kitchen',
  },
  {
    url: 'https://www.aliexpress.com/category/200003483/pets-pet-supplies.html?SortType=total_tranHiScore_desc&shipCountry=AU',
    platform: 'AliExpress',
    label: 'AliExpress Pet',
  },
  {
    url: 'https://www.aliexpress.com/category/100003070/mother-kids.html?SortType=total_tranHiScore_desc&shipCountry=AU',
    platform: 'AliExpress',
    label: 'AliExpress Baby & Kids',
  },
  // Amazon AU — demand validation (high reviews = proven AU demand)
  {
    url: 'https://www.amazon.com.au/s?k=beauty+skincare+tools&s=review-rank',
    platform: 'Amazon AU',
    label: 'Amazon AU Beauty & Skincare',
  },
  {
    url: 'https://www.amazon.com.au/s?k=pet+accessories+dog+cat&s=review-rank',
    platform: 'Amazon AU',
    label: 'Amazon AU Pet',
  },
  {
    url: 'https://www.amazon.com.au/s?k=fitness+home+gym+accessories&s=review-rank',
    platform: 'Amazon AU',
    label: 'Amazon AU Fitness',
  },
  {
    url: 'https://www.amazon.com.au/s?k=kitchen+gadgets+home+organiser&s=review-rank',
    platform: 'Amazon AU',
    label: 'Amazon AU Home Gadgets',
  },
  // Alibaba — wholesale/manufacturer data for margin validation
  {
    url: 'https://www.alibaba.com/trade/search?SearchText=dropshipping+trending+australia&SortType=total_tranHiScore_desc',
    platform: 'Alibaba',
    label: 'Alibaba Dropship Trending',
  },
];

// ── ABSOLUTE BLACKLIST — never show these product types ──────────────────────
const BLACKLISTED_KEYWORDS = [
  'tv', 'television', 'smart tv', 'oled', 'qled', '4k tv', '8k tv',
  'laptop', 'notebook', 'macbook', 'computer', 'desktop pc',
  'tablet', 'ipad', 'surface pro',
  'refrigerator', 'fridge', 'washing machine', 'dishwasher', 'dryer',
  'air conditioner', 'air con', 'split system', 'heat pump',
  'vacuum cleaner', 'robot vacuum', 'dyson',
  'microwave', 'oven', 'stove', 'cooktop',
  'gaming console', 'playstation', 'xbox', 'nintendo switch',
  'monitor', 'computer screen',
  'printer', 'scanner',
  'electric scooter', 'e-scooter', 'electric bike', 'e-bike',
  'lawnmower', 'pressure washer',
  'solar panel', 'generator',
  'phone case', 'smartphone', 'iphone',
  'earbuds', 'headphones', 'airpods', // too competitive
  'coffee machine', 'espresso machine', // too heavy/complex
];

// ── PRICE CEILING — dropship-friendly items only ─────────────────────────────
const MAX_PRICE_AUD = 180; // above this → likely major appliance/electronics
const MIN_PRICE_AUD = 12;  // below this → too cheap to be viable

function isDropshipFriendly(title: string, price: number): boolean {
  const lower = title.toLowerCase();
  if (price > MAX_PRICE_AUD || price < MIN_PRICE_AUD) return false;
  return !BLACKLISTED_KEYWORDS.some(kw => lower.includes(kw));
}

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

  const prompt = `You are a TikTok dropshipping product analyst for the Australian market. Extract ONLY dropship-friendly products from the content below.

STRICT RULES — NEVER include:
❌ TVs, televisions, monitors, screens of any size
❌ Laptops, computers, tablets, iPads
❌ Major appliances: fridges, washing machines, dishwashers, dryers, ovens, microwaves, air conditioners
❌ Vacuum cleaners, robot vacuums
❌ Gaming consoles (PlayStation, Xbox, Nintendo Switch)
❌ Electric scooters, e-bikes, electric vehicles
❌ Smartphones, phones
❌ Anything over $180 AUD (too expensive for TikTok impulse buying)
❌ Anything under $12 AUD (too cheap, no margin)
❌ Services, subscriptions, warranties, accessories for major electronics

ONLY include dropship-friendly items:
✅ Skincare, beauty tools, hair care, wellness devices
✅ Fitness accessories (resistance bands, yoga mats, massage guns under $100, jump ropes)
✅ Pet accessories (toys, feeders, grooming tools, beds under $150)
✅ Home accessories (organisers, kitchen gadgets, LED strips, small decorative items)
✅ Baby & kids accessories (toys, feeding, bath time items)
✅ Fashion accessories (jewellery, bags, sunglasses)
✅ Sports accessories (water bottles, gym bags, compression gear)
✅ Impulse-buy gadgets under $80 that solve a real problem

For each QUALIFYING product, return a JSON array item:
{
  "product_title": "exact product name",
  "category": "one of: Health & Beauty | Pet | Home & Kitchen | Fitness | Fashion | Baby & Kids | Sports & Outdoors",
  "price_aud": <number — actual price in AUD>,
  "est_daily_revenue_aud": <number — price × estimated daily AU units for TikTok sellers>,
  "winning_score": <integer 1-100 — viral potential + demand signals + AU fit>,
  "trend": "one of: exploding | growing | stable | declining",
  "au_relevance": <integer 1-100 — how well this fits AU market specifically>,
  "competition_level": "one of: Low | Medium | High",
  "why_winning": "1-2 sentences: specific AU angle — climate, lifestyle, seasonal demand, AU problem it solves",
  "ad_angle": "exact TikTok hook: first 5 words of the video that stops the scroll",
  "image_url": "full https:// image URL if in content, else empty string",
  "platform": "TikTok Shop AU"
}

Platform-specific extraction notes:
- AliExpress: products shown as "Product Name ... US $X.XX ... X sold" — use sold count as demand signal
- Amazon AU: products shown with star ratings (4.5 out of 5, X,XXX ratings) — high ratings = proven AU demand
- Alibaba: products shown with MOQ and price ranges — use for wholesale cost estimation only, set platform to "Alibaba"
- For AliExpress/Amazon products, label platform as "TikTok Shop AU" if the product is trending/impulse-buy style
- Always convert USD prices to AUD (multiply by 1.55)

- Return ONLY raw JSON array, no markdown, no explanation
- If fewer than 3 qualifying products exist in this content, return empty array []

CONTENT (from ${platform}):
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

  // 3. Hard filter — remove blacklisted/non-dropship items BEFORE dedup
  const filtered = allProducts.filter((p) => {
    if (!p.product_title) return false;
    return isDropshipFriendly(p.product_title, Number(p.price_aud) || 0);
  });

  if (filtered.length === 0) {
    console.warn('[firecrawl] All products filtered out — blacklist too aggressive or wrong sources');
  }

  // 4. Deduplicate by product_title (case-insensitive)
  const seen = new Set<string>();
  const deduped = filtered.filter((p) => {
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
