// server/lib/tavilyTrends.ts
// Fetches real AU trend signals for product keywords via Tavily

const TAVILY_KEY = process.env.TAVILY_API_KEY || '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';

export interface TrendSignal {
  mentions: number;          // 0-5 scale
  hasTikTok: boolean;        // mentioned on TikTok/social
  hasAuContext: boolean;     // AU-specific mention
  isRecent: boolean;         // published within 30 days
  trendBoost: number;        // 0-20 points to add to score
  snippets: string[];        // raw text snippets for UI
}

export async function fetchTrendSignal(keyword: string): Promise<TrendSignal> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `${keyword} trending Australia 2026`,
        search_depth: 'basic',
        max_results: 5,
        include_domains: ['tiktok.com', 'au.yahoo.com', 'smh.com.au', 'news.com.au', 'reddit.com', 'ebay.com.au', 'amazon.com.au'],
        include_answer: false,
      }),
    });

    if (!res.ok) {
      console.log(`[Tavily] ${res.status} for "${keyword}"`);
      return defaultSignal();
    }

    const data: any = await res.json();
    const results = data.results || [];

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    let mentions = Math.min(5, results.length);
    let hasTikTok = results.some((r: any) =>
      (r.url || '').includes('tiktok.com') ||
      (r.content || '').toLowerCase().includes('tiktok') ||
      (r.title || '').toLowerCase().includes('tiktok')
    );
    let hasAuContext = results.some((r: any) =>
      (r.url || '').includes('.au') ||
      (r.content || '').toLowerCase().includes('australia') ||
      (r.content || '').toLowerCase().includes('australian') ||
      (r.content || '').toLowerCase().includes('sydney') ||
      (r.content || '').toLowerCase().includes('melbourne')
    );
    let isRecent = results.some((r: any) => {
      if (!r.published_date) return false;
      return new Date(r.published_date).getTime() > thirtyDaysAgo;
    });

    // Calculate trend boost (0-20 points)
    let trendBoost = 0;
    if (mentions >= 3) trendBoost += 8;
    else if (mentions >= 1) trendBoost += 4;
    if (hasTikTok) trendBoost += 6;
    if (hasAuContext) trendBoost += 4;
    if (isRecent) trendBoost += 2;
    trendBoost = Math.min(20, trendBoost);

    const snippets = results.slice(0, 2).map((r: any) =>
      (r.content || '').substring(0, 120).trim()
    ).filter(Boolean);

    return { mentions, hasTikTok, hasAuContext, isRecent, trendBoost, snippets };
  } catch (err) {
    console.log(`[Tavily] Error for "${keyword}": ${(err as Error).message?.substring(0, 50)}`);
    return defaultSignal();
  }
}

function defaultSignal(): TrendSignal {
  return { mentions: 0, hasTikTok: false, hasAuContext: false, isRecent: false, trendBoost: 5, snippets: [] };
}

// Batch fetch with rate limiting (Tavily free tier: ~20 req/min)
export async function fetchTrendSignals(keywords: string[]): Promise<Record<string, TrendSignal>> {
  const results: Record<string, TrendSignal> = {};

  for (let i = 0; i < keywords.length; i++) {
    results[keywords[i]] = await fetchTrendSignal(keywords[i]);
    if (i < keywords.length - 1) await new Promise(r => setTimeout(r, 2000)); // 2s between calls
  }

  return results;
}
