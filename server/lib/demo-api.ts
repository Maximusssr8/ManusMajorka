import type { Express, Request, Response } from "express";
import { getAnthropicClient, CLAUDE_MODEL } from "./anthropic";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, entry] of Array.from(rateLimitMap.entries())) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

export function registerDemoRoutes(app: Express): void {
  app.post("/api/demo/research", async (req: Request, res: Response) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const { allowed } = checkRateLimit(ip);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. You can make 3 requests per hour.",
      });
    }

    const { product, market } = req.body as { product?: unknown; market?: unknown };

    if (!product || typeof product !== "string" || product.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "product must be a non-empty string.",
      });
    }

    const productStr = product.trim();
    const marketStr = typeof market === "string" && market.trim() !== "" ? market.trim() : "global";

    try {
      const client = getAnthropicClient();

      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system:
          "You are an ecommerce product researcher. Given a product idea and target market, return exactly 3 product opportunities as a JSON array. Each item: { name: string, margin: string, demand: string, tip: string }. Only output valid JSON, no markdown.",
        messages: [
          {
            role: "user",
            content: `Find 3 product opportunities for "${productStr}" in the ${marketStr} market.`,
          },
        ],
      });

      const rawText =
        message.content[0]?.type === "text" ? message.content[0].text : "";

      let products: unknown;
      try {
        products = JSON.parse(rawText);
      } catch {
        return res.status(502).json({
          success: false,
          error: "Failed to parse AI response as JSON.",
        });
      }

      return res.json({ success: true, products });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error occurred.";
      return res.status(500).json({ success: false, error: message });
    }
  });
}
