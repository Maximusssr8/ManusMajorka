/**
 * AI Tools — Tavily-powered tools for Majorka AI Chat
 *
 * Uses Anthropic SDK native tool calling format (not Vercel AI SDK).
 * Tools provide live web search, product research, competitor analysis,
 * supplier finding, trend scouting, and ad angle generation.
 */

import { tavily } from '@tavily/core';

// Lazy initialise the Tavily client
let _tv: ReturnType<typeof tavily> | null = null;
function getTavily() {
  if (!_tv) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error('TAVILY_API_KEY not configured');
    _tv = tavily({ apiKey });
  }
  return _tv;
}

// ── Anthropic-format tool definitions ────────────────────────────────────────

export const ANTHROPIC_AI_TOOLS: Anthropic.Tool[] = [
  {
    name: 'web_search',
    description:
      "Search the web for current information about products, trends, suppliers, competitors, and market data. Use this for ANY question requiring recent data, current prices, or live market conditions. Always prefer this over saying you don't have data.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Search query — be specific and include "Australia" or "AU" for market-specific results',
        },
        type: {
          type: 'string',
          enum: ['general', 'news', 'product'],
          description: 'Search type',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'product_research',
    description:
      'Research trending products for Australian dropshippers. Returns demand signals, competition level, and margin opportunities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        niche: {
          type: 'string',
          description: 'Product niche or category to research',
        },
        market: {
          type: 'string',
          description: 'Target market (default: AU)',
        },
      },
      required: ['niche'],
    },
  },
  {
    name: 'competitor_analysis',
    description:
      'Analyse a competitor store or website. Returns their strategy, top products, pricing patterns, and weaknesses to exploit.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'Store or website URL to analyse',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'supplier_finder',
    description:
      'Find suppliers for any product. Returns Alibaba options, AU warehouse options, MOQ, and estimated shipping costs to Australia.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product: {
          type: 'string',
          description: 'Product name or description',
        },
        budget: {
          type: 'string',
          description: 'Target cost price in USD (optional)',
        },
      },
      required: ['product'],
    },
  },
  {
    name: 'trend_scout',
    description:
      'Scout emerging ecommerce trends from TikTok, Reddit, and Google Trends for AU market opportunities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Category to scout: health, beauty, home, tech, pets, fitness, etc.',
        },
      },
      required: [],
    },
  },
  {
    name: 'ad_angle_generator',
    description:
      'Generate Meta and TikTok ad angles, scroll-stopping hooks, and creative concepts for any product.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product: {
          type: 'string',
          description: 'Product name and brief description',
        },
        audience: {
          type: 'string',
          description: 'Target audience description (optional)',
        },
        platform: {
          type: 'string',
          enum: ['meta', 'tiktok', 'both'],
          description: 'Ad platform (default: both)',
        },
      },
      required: ['product'],
    },
  },
];

// Import the Anthropic type for tool definitions
import type Anthropic from '@anthropic-ai/sdk';

// ── Tool status display labels (for SSE events) ───────────────────────────────

export const TOOL_STATUS_MESSAGES: Record<string, string> = {
  web_search: '🔍 Searching the web...',
  product_research: '📊 Researching products...',
  competitor_analysis: '🕵️ Analysing competitor...',
  supplier_finder: '🏭 Finding suppliers...',
  trend_scout: '🔥 Scouting trends...',
  ad_angle_generator: '🎯 Generating ad angles...',
};

// ── Tool executors ────────────────────────────────────────────────────────────

export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const tv = getTavily();

  switch (name) {
    case 'web_search': {
      const query = input.query as string;
      const results = await tv.search(query, {
        maxResults: 5,
        includeAnswer: true,
      });
      return JSON.stringify({
        answer: results.answer || null,
        sources: results.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 250),
        })),
      });
    }

    case 'product_research': {
      const niche = input.niche as string;
      const market = (input.market as string) || 'AU';
      const results = await tv.search(
        `trending ${niche} products dropshipping ${market} 2025 high demand low competition`,
        { maxResults: 5, includeAnswer: true }
      );
      return JSON.stringify({
        niche,
        market,
        answer: results.answer || null,
        insights: results.results.map((r) => ({
          title: r.title,
          snippet: r.content.slice(0, 300),
          url: r.url,
        })),
      });
    }

    case 'competitor_analysis': {
      const url = input.url as string;
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      const results = await tv.search(
        `${domain} store products pricing reviews strategy analysis`,
        { maxResults: 5, includeAnswer: true }
      );
      return JSON.stringify({
        domain,
        analysis: results.answer || null,
        sources: results.results.slice(0, 3).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 250),
        })),
      });
    }

    case 'supplier_finder': {
      const product = input.product as string;
      const budget = input.budget as string | undefined;
      const query = `${product} supplier wholesale Alibaba Australia dropship ${budget ? `under ${budget}` : ''} 2025`;
      const results = await tv.search(query, {
        maxResults: 5,
        includeAnswer: true,
      });
      return JSON.stringify({
        product,
        budget: budget || 'not specified',
        suppliers: results.answer || null,
        sources: results.results.slice(0, 3).map((r) => ({
          title: r.title,
          url: r.url,
        })),
      });
    }

    case 'trend_scout': {
      const category = (input.category as string) || 'ecommerce';
      const results = await tv.search(
        `trending products TikTok viral Australia 2025 ${category} dropshipping opportunity`,
        { maxResults: 6, includeAnswer: true }
      );
      return JSON.stringify({
        category,
        trends: results.answer || null,
        sources: results.results.slice(0, 4).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 200),
        })),
      });
    }

    case 'ad_angle_generator': {
      const product = input.product as string;
      const audience = (input.audience as string) || 'AU audience';
      const platform = (input.platform as string) || 'both';
      const results = await tv.search(
        `best ${platform} ad angles hooks ${product} ${audience} 2025 high converting`,
        { maxResults: 4, includeAnswer: true }
      );
      return JSON.stringify({
        product,
        audience,
        platform,
        insights: results.answer || null,
        sources: results.results.slice(0, 3).map((r) => ({
          title: r.title,
          url: r.url,
        })),
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
