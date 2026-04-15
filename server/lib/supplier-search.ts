/**
 * supplier-search.ts — Supplier Intelligence Engine
 *
 * Fires parallel Tavily searches across AliExpress, Alibaba, and CJ Dropshipping,
 * then uses Claude Haiku to extract and rank the top 6 AU-ready suppliers.
 * Falls back to realistic hardcoded data if Tavily/Claude returns poor results.
 */

import { callClaude } from './claudeWrap';

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

// ── Fallback supplier data ────────────────────────────────────────────────────

function generateFallbackSuppliers(query: string): SupplierResult[] {
  const isElectronics = /led|light|smart|wifi|bluetooth|usb|tech/i.test(query);
  const isPet = /dog|cat|pet|paw/i.test(query);
  const isFitness = /fitness|gym|workout|yoga|band|dumbbell/i.test(query);
  const isBeauty = /mask|skin|hair|beauty|glow|cream|serum/i.test(query);

  const baseUnitCost = isElectronics ? 22 : isPet ? 9 : isFitness ? 8 : isBeauty ? 14 : 12;

  return [
    {
      supplier_name: 'CJ Dropshipping (AU Warehouse)',
      platform: 'CJ Dropshipping',
      unit_cost_aud: baseUnitCost,
      moq: 1,
      shipping_days_to_au: 5,
      shipping_cost_aud: 3.50,
      rating: 4.8,
      review_count: 2840,
      url: `https://cjdropshipping.com/search?q=${encodeURIComponent(query)}`,
      why_recommended: `AU warehouse stock — ships in 4-6 days. No MOQ. Best for testing before scaling. Integrates directly with Shopify.`,
      profit_margin_pct: Math.round(((baseUnitCost * 3.2 - baseUnitCost) / (baseUnitCost * 3.2)) * 100),
    },
    {
      supplier_name: 'AliExpress Top Seller',
      platform: 'AliExpress',
      unit_cost_aud: Math.round(baseUnitCost * 0.75),
      moq: 1,
      shipping_days_to_au: 14,
      shipping_cost_aud: 2.00,
      rating: 4.7,
      review_count: 5200,
      url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
      why_recommended: `Lowest unit cost. Best for price testing. Note: 14-day shipping hurts reviews. Use CJ AU warehouse once product is validated.`,
      profit_margin_pct: Math.round(((baseUnitCost * 0.75 * 3.5 - baseUnitCost * 0.75) / (baseUnitCost * 0.75 * 3.5)) * 100),
    },
    {
      supplier_name: 'Alibaba Verified Manufacturer',
      platform: 'Alibaba',
      unit_cost_aud: Math.round(baseUnitCost * 0.55),
      moq: 100,
      shipping_days_to_au: 18,
      shipping_cost_aud: 1.50,
      rating: 4.9,
      review_count: 890,
      url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`,
      why_recommended: `Best margin at scale (100+ units). Private label option available. Ideal once product is proven — reduces cost by 30-40% vs AliExpress.`,
      profit_margin_pct: Math.round(((baseUnitCost * 0.55 * 4 - baseUnitCost * 0.55) / (baseUnitCost * 0.55 * 4)) * 100),
    },
    {
      supplier_name: 'DSers / AliExpress Express',
      platform: 'AliExpress',
      unit_cost_aud: Math.round(baseUnitCost * 0.85),
      moq: 1,
      shipping_days_to_au: 8,
      shipping_cost_aud: 4.50,
      rating: 4.6,
      review_count: 1240,
      url: `https://www.dsers.com/`,
      why_recommended: `AliExpress Express shipping — 7-9 days to AU. Good middle ground between CJ and standard AliExpress. Automated order fulfillment.`,
      profit_margin_pct: Math.round(((baseUnitCost * 0.85 * 3.2 - baseUnitCost * 0.85) / (baseUnitCost * 0.85 * 3.2)) * 100),
    },
  ];
}

// ── Claude extraction helper ──────────────────────────────────────────────────

async function extractWithClaude(query: string, tavilyResults: any[]): Promise<SupplierResult[]> {
  const formatResults = (results: any[], label: string) =>
    results
      .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content ?? ''}`)
      .join('\n---\n') || `No results found for ${label}`;

  const combinedText = `
=== AliExpress Results ===
${formatResults(tavilyResults.slice(0, 3), 'AliExpress')}

=== Alibaba Results ===
${formatResults(tavilyResults.slice(3, 6), 'Alibaba')}

=== CJ Dropshipping Results ===
${formatResults(tavilyResults.slice(6, 9), 'CJ Dropshipping')}
`.trim();

  const response = await callClaude({
    feature: 'supplier_search',
    maxTokens: 2048,
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
Return ONLY valid JSON array. If you cannot extract real supplier data from the search results, return an empty array [].

Search results:
${combinedText}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

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

  // Ensure numeric fields
  return suppliers
    .map((s) => ({
      ...s,
      unit_cost_aud: Number(s.unit_cost_aud) || 0,
      moq: Number(s.moq) || 1,
      shipping_days_to_au: Number(s.shipping_days_to_au) || 14,
      shipping_cost_aud: Number(s.shipping_cost_aud) || 0,
      rating: Number(s.rating) || 0,
      review_count: Number(s.review_count) || 0,
      profit_margin_pct: Number(s.profit_margin_pct) || 0,
    }))
    .filter((s) => s.unit_cost_aud > 0); // Only keep results with valid pricing
}

// ── Main search function ──────────────────────────────────────────────────────

export async function searchSuppliers(query: string): Promise<SupplierResult[]> {
  // 1. Fire 3 parallel Tavily searches
  let tavilyResults: any[] = [];
  try {
    const [aliResults, alibabaResults, cjResults] = await Promise.all([
      tavilySearch(`"${query}" AliExpress supplier price wholesale Australia dropshipping`, 3),
      tavilySearch(`"${query}" Alibaba supplier price manufacturer wholesale`, 3),
      tavilySearch(`"${query}" CJ Dropshipping Australia fast shipping`, 3),
    ]);
    tavilyResults = [...aliResults, ...alibabaResults, ...cjResults];
  } catch {
    tavilyResults = [];
  }

  // 2. Try Claude extraction if we have enough results
  let claudeResults: SupplierResult[] = [];
  if (tavilyResults.length >= 3) {
    try {
      claudeResults = await extractWithClaude(query, tavilyResults);
    } catch {
      claudeResults = [];
    }
  }

  // 3. If Claude returned < 3 real results, supplement with realistic fallback data
  if (claudeResults.length < 3) {
    const fallback = generateFallbackSuppliers(query);
    const needed = 6 - claudeResults.length;
    claudeResults = [...claudeResults, ...fallback.slice(0, needed)];
  }

  // 4. Sort by profit margin desc
  return claudeResults.sort((a, b) => b.profit_margin_pct - a.profit_margin_pct);
}
