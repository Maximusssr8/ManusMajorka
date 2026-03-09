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
export const BASE_SYSTEM_PROMPT =
  "You are an expert ecommerce strategist. Always respond in valid JSON format matching the schema provided. Never include markdown code blocks in your response.";
