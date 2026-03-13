/**
 * supplier-search.ts — Supplier Intelligence Engine
 *
 * Fires parallel Tavily searches across AliExpress, Alibaba, and CJ Dropshipping,
 * then uses Claude Haiku to extract and rank the top 6 AU-ready suppliers.
 */

import { getAnthropicClient } from './anthropic';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SupplierResult {
  supplier_name: string;
  platform: 'AliExpress' | 'Alibaba' | 'CJ Dropshipping' | 'DHgate';
  unit_cost_aud: number;
  moq: number;
  shipping_days_to_au: number;
  shipping_cost_aud: number;
  rating: number;
  review_count: number;
  url: string;
  why_recommended: string;
  profit_margin_pct: number;
}

// ── Tavily search helper ──────────────────────────────────────────────────────

async function tavilySearch(query: string, maxResults = 5): Promise<any[]> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) throw new Error('TAVILY_API_KEY is not configured.');
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
    }),
  });
  const data = await res.json();
  return data.results ?? [];
}

// ── Main search function ──────────────────────────────────────────────────────

export async function searchSuppliers(query: string): Promise<SupplierResult[]> {
  // 1. Fire 3 parallel Tavily searches
  const [aliResults, alibabaResults, cjResults] = await Promise.all([
    tavilySearch(`"${query}" AliExpress supplier price wholesale Australia dropshipping 2025`, 5),
    tavilySearch(`"${query}" Alibaba supplier MOQ wholesale price manufacturer`, 5),
    tavilySearch(`"${query}" CJ Dropshipping supplier Australia fast shipping price`, 5),
  ]);

  // 2. Combine all results into text
  const formatResults = (results: any[], label: string) =>
    results
      .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content ?? ''}`)
      .join('\n---\n')
      || `No results found for ${label}`;

  const combinedText = `
=== AliExpress Results ===
${formatResults(aliResults, 'AliExpress')}

=== Alibaba Results ===
${formatResults(alibabaResults, 'Alibaba')}

=== CJ Dropshipping Results ===
${formatResults(cjResults, 'CJ Dropshipping')}
`.trim();

  // 3. Send to Claude Haiku
  const claude = getAnthropicClient();
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Based on these search results, extract the top 6 suppliers for "${query}".
Return JSON array:
[{
  "supplier_name": "store/company name",
  "platform": "AliExpress | Alibaba | CJ Dropshipping | DHgate",
  "unit_cost_aud": <estimated AUD cost>,
  "moq": <minimum order quantity, usually 1 for dropshipping>,
  "shipping_days_to_au": <estimated days to Australia>,
  "shipping_cost_aud": <estimated shipping to AU>,
  "rating": <0-5>,
  "review_count": <number>,
  "url": <direct link if found, else platform search URL>,
  "why_recommended": "1 sentence — why good for AU dropshipping",
  "profit_margin_pct": <estimated margin if selling at 3x cost>
}]
Return ONLY valid JSON array.

Search results:
${combinedText}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

  // 4. Parse and sort by profit_margin_pct desc
  let suppliers: SupplierResult[] = [];
  try {
    const parsed = JSON.parse(text);
    suppliers = Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try to extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        suppliers = JSON.parse(match[0]);
      } catch {
        suppliers = [];
      }
    }
  }

  // Ensure numeric fields and sort
  suppliers = suppliers.map((s) => ({
    ...s,
    unit_cost_aud: Number(s.unit_cost_aud) || 0,
    moq: Number(s.moq) || 1,
    shipping_days_to_au: Number(s.shipping_days_to_au) || 14,
    shipping_cost_aud: Number(s.shipping_cost_aud) || 0,
    rating: Number(s.rating) || 0,
    review_count: Number(s.review_count) || 0,
    profit_margin_pct: Number(s.profit_margin_pct) || 0,
  }));

  return suppliers.sort((a, b) => b.profit_margin_pct - a.profit_margin_pct);
}
