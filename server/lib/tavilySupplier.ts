/**
 * tavilySupplier.ts — Find real supplier links + social buzz scores via Tavily
 */

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';

export interface SupplierResult {
  url: string;
  title: string;
  snippet: string;
  score: number;
}

export async function findSupplierLinks(productName: string): Promise<SupplierResult[]> {
  if (!TAVILY_KEY) { console.warn('[tavilySupplier] TAVILY_API_KEY not set'); return []; }

  const query = `${productName} wholesale dropship site:aliexpress.com OR site:banggood.com`;
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: 10, search_depth: 'advanced' }),
    });
    if (!resp.ok) { console.error('[tavilySupplier] HTTP', resp.status); return []; }
    const data = await resp.json();
    return (data.results || [])
      .filter((r: any) => /\/item\/\d+\.html|\/product\/\d+/i.test(r.url))
      .map((r: any) => ({ url: r.url, title: r.title || '', snippet: r.snippet || '', score: r.score || 0 }));
  } catch (err: any) {
    console.error('[tavilySupplier] findSupplierLinks error:', err.message);
    return [];
  }
}

export async function findTrendingBuzz(productName: string): Promise<number> {
  if (!TAVILY_KEY) return 0;

  const query = `${productName} tiktok trending australia 2026`;
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: 10, search_depth: 'advanced' }),
    });
    if (!resp.ok) return 0;
    const data = await resp.json();
    const results: any[] = data.results || [];
    if (!results.length) return 0;
    return results.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / results.length;
  } catch (err: any) {
    console.error('[tavilySupplier] findTrendingBuzz error:', err.message);
    return 0;
  }
}
