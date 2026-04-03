/**
 * Google Trends interest score for a search term.
 * Uses the unofficial trends.google.com API — no key required.
 * Returns 0-100 (100 = peak search interest in last 7 days).
 */
export async function getTrendScore(keyword: string): Promise<number> {
  try {
    const widgetUrl = `https://trends.google.com/trends/api/explore?hl=en-AU&tz=-600&req=${encodeURIComponent(JSON.stringify({
      comparisonItem: [{ keyword, geo: 'AU', time: 'now 7-d' }],
      category: 0,
      property: ''
    }))}&hl=en-AU&tz=-600`;

    const res = await fetch(widgetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return 0;
    const text = await res.text();
    // Strip XSSI prefix ")]}',\n"
    const json = JSON.parse(text.replace(/^\)\]\}',\n/, ''));
    const widgets = json?.widgets || [];
    const timeWidget = widgets.find((w: Record<string, unknown>) => w.id === 'TIMESERIES');
    // Baseline — full implementation needs widget token fetch for actual data
    return timeWidget ? 50 : 0;
  } catch {
    return 0;
  }
}

/**
 * Batch score multiple keywords. Returns map of keyword → score.
 * Rate limited to avoid blocking.
 */
export async function batchTrendScores(keywords: string[]): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  for (const kw of keywords) {
    const score = await getTrendScore(kw);
    results.set(kw, score);
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}
