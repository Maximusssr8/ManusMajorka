/**
 * Product URL Scraping API
 * Uses Firecrawl to scrape product pages, with Tavily + Pexels fallbacks.
 */
import type { Express } from "express";
import FirecrawlApp from "@mendable/firecrawl-js";
import { tavilyExtract, tavilySearch } from "../tavily";
import { sdk } from "../_core/sdk";

interface ScrapeResult {
  productTitle: string;
  description: string;
  bulletPoints: string[];
  price: string;
  imageUrls: string[];
}

async function searchPexelsImages(query: string): Promise<string[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map((p: any) => p.src?.medium || p.src?.original).filter(Boolean);
  } catch {
    return [];
  }
}

export function registerScrapeRoutes(app: Express) {
  app.post("/api/scrape-product", async (req, res) => {
    try {
      // Require authentication
      try {
        await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { url } = req.body;
      if (!url || typeof url !== "string") {
        res.status(400).json({ error: "url is required" });
        return;
      }

      // Validate URL to prevent SSRF
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        res.status(400).json({ error: "Invalid URL format" });
        return;
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: "Only HTTP/HTTPS URLs are allowed" });
        return;
      }
      const hostname = parsedUrl.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.startsWith("10.") || hostname.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
        res.status(400).json({ error: "Internal URLs are not allowed" });
        return;
      }

      let result: ScrapeResult = {
        productTitle: "",
        description: "",
        bulletPoints: [],
        price: "",
        imageUrls: [],
      };

      // Try Firecrawl first
      const firecrawlKey = process.env.FIRECRAWL_API_KEY;
      if (firecrawlKey) {
        try {
          const fc = new FirecrawlApp({ apiKey: firecrawlKey });
          const scrapeResult = await (fc as any).scrapeUrl(url, {
            formats: ["markdown", "html"],
          }) as any;

          if (scrapeResult.success && scrapeResult.markdown) {
            const md = scrapeResult.markdown;
            const meta = (scrapeResult as any).metadata || {};

            // Extract title
            result.productTitle =
              meta.title ||
              meta.ogTitle ||
              md.match(/^#\s+(.+)/m)?.[1] ||
              "";

            // Extract price
            const priceMatch = md.match(
              /(?:Price|Sale|Now|USD|AUD|US\s*\$|A\$|\$)\s*[:\s]*\$?([\d,]+(?:\.\d{2})?)/i
            );
            if (priceMatch) result.price = `$${priceMatch[1]}`;

            // Extract description
            result.description =
              meta.ogDescription ||
              meta.description ||
              md
                .split("\n")
                .find(
                  (l: string) =>
                    l.trim().length > 60 &&
                    l.trim().length < 500 &&
                    !l.startsWith("#") &&
                    !l.startsWith("[") &&
                    !l.includes("cookie")
                ) ||
              "";

            // Extract bullet points
            const bullets = md
              .split("\n")
              .filter(
                (l: string) =>
                  /^[-•*✓✔]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim())
              )
              .map((l: string) => l.replace(/^[-•*✓✔\d.]+\s*/, "").trim())
              .filter(
                (l: string) =>
                  l.length > 10 &&
                  l.length < 150 &&
                  !l.toLowerCase().includes("cookie") &&
                  !l.toLowerCase().includes("javascript")
              )
              .slice(0, 8);
            result.bulletPoints = bullets;

            // Extract images from HTML
            const html = (scrapeResult as any).html || "";
            const imgMatches = html.match(
              /<img[^>]+src=["']([^"']+)["']/gi
            );
            if (imgMatches) {
              result.imageUrls = imgMatches
                .map((m: string) => m.match(/src=["']([^"']+)["']/)?.[1])
                .filter(
                  (u: string | undefined) =>
                    u &&
                    (u.startsWith("http") || u.startsWith("//")) &&
                    !u.includes("icon") &&
                    !u.includes("logo") &&
                    !u.includes("svg") &&
                    !u.includes("pixel") &&
                    !u.includes("1x1") &&
                    !u.includes("tracking")
                )
                .map((u: string) => (u.startsWith("//") ? `https:${u}` : u))
                .slice(0, 8) as string[];
            }
          }
        } catch (err) {
          console.warn("[scrape-product] Firecrawl failed, falling back:", err);
        }
      }

      // Fallback to Tavily Extract if Firecrawl didn't produce results
      if (!result.productTitle) {
        try {
          const extracted = await tavilyExtract(url);
          const raw = extracted.rawContent || "";
          result.productTitle =
            extracted.title ||
            raw.match(/(?:Product:|Title:)\s*(.+)/i)?.[1] ||
            "";
          result.price =
            raw.match(/\$([\d,]+(?:\.\d{2})?)/)?.[0] || "";
          result.description =
            raw
              .split("\n")
              .find(
                (l: string) =>
                  l.trim().length > 60 &&
                  l.trim().length < 500 &&
                  !l.includes("cookie")
              ) || "";
          result.bulletPoints = raw
            .split("\n")
            .map((l: string) => l.replace(/^[-•*✓✔]\s*/, "").trim())
            .filter(
              (l: string) =>
                l.length > 10 &&
                l.length < 120 &&
                !l.startsWith("http") &&
                !l.includes("cookie")
            )
            .slice(0, 8);
          result.imageUrls = extracted.images || [];
        } catch {
          // Tavily also failed — try search
          try {
            const hostname = new URL(url).hostname.replace("www.", "");
            const sr = await tavilySearch(
              `site:${hostname} ${url.split("/").pop()?.replace(/[^a-zA-Z0-9]/g, " ").trim() || "product"}`,
              { maxResults: 3, includeImages: true }
            );
            const top = sr.results[0];
            if (top) {
              result.productTitle = top.title || "";
              result.description = top.content || "";
              result.price =
                top.content.match(/\$([\d,]+(?:\.\d{2})?)/)?.[0] || "";
            }
            result.imageUrls = sr.images || [];
          } catch {
            /* all methods failed */
          }
        }
      }

      // If no images found, search Pexels
      if (result.imageUrls.length === 0 && result.productTitle) {
        const pexelsImages = await searchPexelsImages(
          `${result.productTitle} product lifestyle`
        );
        result.imageUrls = pexelsImages;
      }

      // Final fallback for title
      if (!result.productTitle) {
        try {
          const hostname = new URL(url).hostname.replace("www.", "");
          result.productTitle = `Product from ${hostname}`;
        } catch {
          result.productTitle = "Imported Product";
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("[/api/scrape-product] Error:", error);
      res.status(500).json({ error: error.message || "Scraping failed" });
    }
  });
}
