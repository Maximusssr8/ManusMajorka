/**
 * Anthropic Claude API Client
 * Initialises the Anthropic SDK using environment variable ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured in environment variables.");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/** The default model to use across all Majorka tools */
export const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

/** Base system prompt prepended to every tool's custom system prompt */
export const BASE_SYSTEM_PROMPT = `You are an expert ecommerce operator and strategist with 10+ years scaling Shopify stores.
You give direct, actionable advice with specific numbers and examples.
Always structure your response as clean JSON matching the output schema when a schema is provided.
When no schema is provided, use clear markdown with ## headings, **bold** for key terms, numbered lists, and tables.
Never be vague — always include specific numbers, percentages, and dollar amounts.`;
