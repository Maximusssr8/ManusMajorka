/**
 * Tavily Web Search & Extract Helper
 * Provides real-time web search and URL content extraction for Majorka tools.
 */
import { tavily } from "@tavily/core";

function getClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not configured");
  return tavily({ apiKey });
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface ExtractResult {
  url: string;
  title: string | null;
  rawContent: string;
  images: string[];
}

/**
 * Search the web for a query and return structured results.
 */
export async function tavilySearch(
  query: string,
  options: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeImages?: boolean;
    topic?: "general" | "news";
  } = {}
): Promise<{ results: SearchResult[]; images: string[] }> {
  try {
    const client = getClient();
    const response = await client.search(query, {
      maxResults: options.maxResults ?? 5,
      searchDepth: options.searchDepth ?? "basic",
      includeImages: options.includeImages ?? false,
      topic: options.topic ?? "general",
    });
    return {
      results: (response.results ?? []).map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        content: r.content ?? "",
        score: r.score,
      })),
      images: (response.images ?? []).map((img) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
    };
  } catch (error) {
    console.error("[Tavily] Search failed:", error);
    throw new Error("Web search failed. Please try again.");
  }
}

/**
 * Extract structured content from a URL (product page scraping).
 */
export async function tavilyExtract(url: string): Promise<ExtractResult> {
  try {
    const client = getClient();
    const response = await client.extract([url], { includeImages: true });
    const result = (response.results ?? [])[0];
    if (!result) throw new Error(`Could not extract content from: ${url}`);
    return {
      url: result.url ?? url,
      title: result.title ?? null,
      rawContent: result.rawContent ?? "",
      images: result.images ?? [],
    };
  } catch (error) {
    console.error("[Tavily] Extract failed:", error);
    throw new Error("Content extraction failed. Please try again.");
  }
}

/**
 * Search for product images using Tavily image search.
 */
export async function tavilyImageSearch(query: string, maxImages = 6): Promise<string[]> {
  const client = getClient();
  const response = await client.search(query, {
    maxResults: 3,
    includeImages: true,
    searchDepth: "basic",
  });
  return (response.images ?? [])
    .map((img) => (typeof img === "string" ? img : (img as { url: string }).url))
    .slice(0, maxImages);
}
