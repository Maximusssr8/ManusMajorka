/**
 * Meta Ad Library Search — uses Tavily web search to find public Meta/Facebook
 * ad data without requiring any Meta API key or account signup.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { tavilySearch } from '../tavily';

const router = Router();

// ── Types ───────────────────────────────────────────────────────────────────
interface MetaAd {
  id: string;
  pageId: string;
  pageName: string;
  adText: string;
  startDate: string;
  platform: string;
  imageUrl?: string;
  category?: string;
  country: string;
}

interface TrendingResult {
  pageName: string;
  hook: string;
  url: string;
  snippet: string;
}

// ── Cache (in-memory, 12h TTL) ──────────────────────────────────────────────
const searchCache = new Map<string, { ts: number; data: unknown }>();
const SEARCH_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

const trendingCache = new Map<string, { ts: number; data: unknown }>();
const TRENDING_CACHE_TTL = 12 * 60 * 60 * 1000;

function getCached<T>(cache: Map<string, { ts: number; data: unknown }>, key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttl) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

// ── Rate limit: 10 searches per hour per user ───────────────────────────────
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(userId, timestamps);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT_MAX - timestamps.length };
}

function recordUsage(userId: string): void {
  const timestamps = rateLimitMap.get(userId) ?? [];
  timestamps.push(Date.now());
  rateLimitMap.set(userId, timestamps);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function extractAdsFromResults(
  results: { title: string; url: string; content: string }[],
  country: string,
): MetaAd[] {
  const ads: MetaAd[] = [];
  for (const r of results) {
    const pageName = extractPageName(r.title, r.content);
    const adText = r.content.slice(0, 300).trim();
    if (!adText || adText.length < 10) continue;

    ads.push({
      id: hashString(r.url),
      pageId: hashString(pageName),
      pageName,
      adText,
      startDate: extractDate(r.content) ?? new Date().toISOString().slice(0, 10),
      platform: detectPlatform(r.url, r.content),
      imageUrl: undefined,
      category: undefined,
      country,
    });
  }
  return ads;
}

function extractPageName(title: string, content: string): string {
  // Try to get page name from title like "Ad by PageName"
  const byMatch = title.match(/(?:ads?\s+by|from)\s+(.+?)(?:\s*[-|]|$)/i);
  if (byMatch) return byMatch[1].trim();

  // Facebook ad library often has "Page Name · Active" pattern
  const dotMatch = title.match(/^(.+?)(?:\s*[·|])/);
  if (dotMatch) return dotMatch[1].trim();

  // Fallback: use first segment of content
  const firstLine = content.split('\n')[0] ?? '';
  if (firstLine.length > 3 && firstLine.length < 80) return firstLine;

  return title.slice(0, 60);
}

function extractDate(text: string): string | null {
  const match = text.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
  if (match) return match[1].replace(/\//g, '-');
  const monthMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}/i);
  if (monthMatch) {
    try {
      const d = new Date(monthMatch[0]);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch { /* ignore */ }
  }
  return null;
}

function detectPlatform(url: string, content: string): string {
  if (url.includes('instagram.com') || content.toLowerCase().includes('instagram')) return 'Instagram';
  if (url.includes('tiktok.com') || content.toLowerCase().includes('tiktok')) return 'TikTok';
  return 'Facebook';
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ── GET /api/meta-ads/search ────────────────────────────────────────────────
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q as string ?? '').trim();
    const country = (req.query.country as string ?? 'AU').toUpperCase();

    if (!q || q.length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' });
      return;
    }

    const userId = req.user?.userId ?? 'anon';
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: 'rate_limit',
        message: 'Rate limit exceeded. Maximum 10 searches per hour.',
        remaining: 0,
      });
      return;
    }

    const cacheKey = `${q.toLowerCase()}-${country}`;
    const cached = getCached<{ ads: MetaAd[] }>(searchCache, cacheKey, SEARCH_CACHE_TTL);
    if (cached) {
      res.json({ ...cached, cached: true, remaining: rateCheck.remaining });
      return;
    }

    recordUsage(userId);

    const countryNames: Record<string, string> = {
      AU: 'Australia', US: 'United States', UK: 'United Kingdom',
      CA: 'Canada', NZ: 'New Zealand', DE: 'Germany', FR: 'France',
    };
    const countryName = countryNames[country] ?? country;

    const searchQuery = `facebook ads library "${q}" ${countryName} active ads`;
    const { results } = await tavilySearch(searchQuery, {
      maxResults: 10,
      searchDepth: 'advanced',
    });

    const ads = extractAdsFromResults(results, country);

    const responseData = { ads, query: q, country };
    searchCache.set(cacheKey, { ts: Date.now(), data: responseData });

    res.json({ ...responseData, cached: false, remaining: rateCheck.remaining - 1 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    res.status(500).json({ error: 'search_failed', message });
  }
});

// ── GET /api/meta-ads/trending ──────────────────────────────────────────────
router.get('/trending', requireAuth, async (req, res) => {
  try {
    const niche = (req.query.niche as string ?? '').trim();
    const country = (req.query.country as string ?? 'AU').toUpperCase();

    if (!niche || niche.length < 2) {
      res.status(400).json({ error: 'Niche parameter is required' });
      return;
    }

    const cacheKey = `trending-${niche.toLowerCase()}-${country}`;
    const cached = getCached<{ trending: TrendingResult[] }>(trendingCache, cacheKey, TRENDING_CACHE_TTL);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    const queries = [
      `${niche} dropshipping ads facebook 2026`,
      `${niche} viral ads australia`,
    ];

    const allResults: TrendingResult[] = [];
    for (const query of queries) {
      const { results } = await tavilySearch(query, {
        maxResults: 5,
        searchDepth: 'basic',
      });
      for (const r of results) {
        allResults.push({
          pageName: extractPageName(r.title, r.content),
          hook: r.title.slice(0, 100),
          url: r.url,
          snippet: r.content.slice(0, 200).trim(),
        });
      }
    }

    // Deduplicate by URL and take top 10
    const seen = new Set<string>();
    const trending = allResults.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    }).slice(0, 10);

    const responseData = { trending, niche, country };
    trendingCache.set(cacheKey, { ts: Date.now(), data: responseData });

    res.json({ ...responseData, cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Trending search failed';
    res.status(500).json({ error: 'trending_failed', message });
  }
});

export default router;
