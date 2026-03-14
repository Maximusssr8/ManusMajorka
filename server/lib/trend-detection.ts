/**
 * trend-detection.ts
 *
 * Detects emerging AU ecommerce trends using Tavily + Claude Haiku.
 * Runs every 6h via cron. Results upserted into trend_signals table.
 */

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface TrendSignal {
  trend_name: string;
  category: string;
  signal_strength: number;
  stage: 'emerging' | 'rising' | 'peak' | 'declining';
  why_now: string;
  opportunity_window: string;
  est_monthly_revenue_aud: number;
  sample_products: string[];
  target_audience: string;
  entry_difficulty: 'Easy' | 'Medium' | 'Hard';
  au_seasonal_relevance: string;
  action: string;
}

const SEARCH_QUERIES = [
  'viral products TikTok Australia trending this week 2025',
  'fastest growing niches ecommerce Australia 2025',
  'TikTok Shop AU trending categories sales growth 2025',
  'Google Trends Australia top searches ecommerce products 2025',
  'seasonal products Australia upcoming months 2025 demand',
  'new product launches TikTok viral Australia this month',
];

async function tavilySearch(query: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: 'basic',
      max_results: 5,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  const data = await res.json() as { results?: Array<{ title: string; content: string; url: string }> };
  return (data.results || [])
    .map((r) => `[${r.title}]\n${r.content}`)
    .join('\n\n');
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error: ${res.status} — ${err.slice(0, 200)}`);
  }
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content?.[0]?.text ?? '';
}

async function upsertTrends(trends: TrendSignal[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[trends] Supabase env vars missing — skipping upsert');
    return;
  }

  const payload = trends.map((t) => ({
    ...t,
    updated_at: new Date().toISOString(),
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/trend_signals`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[trends] Upsert failed:', err.slice(0, 200));
  }
}

export async function detectTrends(): Promise<TrendSignal[]> {
  if (!TAVILY_KEY || !ANTHROPIC_KEY) {
    throw new Error('Missing TAVILY_API_KEY or ANTHROPIC_API_KEY');
  }

  // Fire all searches in parallel
  const searchResults = await Promise.allSettled(
    SEARCH_QUERIES.map((q) => tavilySearch(q))
  );

  const combinedContent = searchResults
    .map((r, i) => {
      if (r.status === 'fulfilled') return `=== Query: ${SEARCH_QUERIES[i]} ===\n${r.value}`;
      console.warn(`[trends] Search ${i + 1} failed:`, r.reason?.message);
      return `=== Query: ${SEARCH_QUERIES[i]} ===\n[No results]`;
    })
    .join('\n\n');

  const prompt = `Analyse these search results for emerging product/niche trends in Australia.
Return JSON array of 10 trends:
[{
  "trend_name": "short catchy name",
  "category": "product category",
  "signal_strength": <1-10, how strong the trend signal is>,
  "stage": "emerging | rising | peak | declining",
  "why_now": "1-2 sentences — why trending in AU right now",
  "opportunity_window": "how long this trend likely lasts",
  "est_monthly_revenue_aud": <realistic estimate for a new seller>,
  "sample_products": ["product1", "product2", "product3"],
  "target_audience": "who's buying this in AU",
  "entry_difficulty": "Easy | Medium | Hard",
  "au_seasonal_relevance": "relevant month/season if applicable",
  "action": "what to do right now to capitalise"
}]
Only return trends with signal_strength >= 6. Return ONLY JSON array.

Search results:
${combinedContent}`;

  const raw = await callClaude(prompt);

  // Extract JSON array from response
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error('Claude did not return a valid JSON array');
  }

  let trends: TrendSignal[] = JSON.parse(match[0]);

  // Filter and validate
  trends = trends.filter(
    (t) =>
      t.trend_name &&
      typeof t.signal_strength === 'number' &&
      t.signal_strength >= 6 &&
      ['emerging', 'rising', 'peak', 'declining'].includes(t.stage)
  );

  // Upsert to Supabase
  await upsertTrends(trends);

  return trends;
}
