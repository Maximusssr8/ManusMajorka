/**
 * Product URL Scraping API
 * Uses Firecrawl AI extraction to pull structured product data.
 * Falls back to Tavily extract + Pexels images if Firecrawl is unavailable.
 */
import type { Application } from "express";
import Firecrawl from "@mendable/firecrawl-js";
import { tavilyExtract, tavilySearch } from "../tavily";

export interface ScrapeResult {
  productTitle: string;
  cleanTitle: string;
  description: string;
  bulletPoints: string[];
  price: string;
  currency: string;
  imageUrls: string[];
  variants: {
    colors: string[];
    sizes: string[];
    flavors: string[];
    volumes: string[];
  };
  category: string;
  brand: string;
  sourcePlatform: string;
  sourceUrl: string;
}

function cleanProductTitle(raw: string): string {
  return (raw || "")
    .replace(/[-|–—]\s*(aliexpress|amazon|shopify|ebay|etsy|walmart|temu|dhgate|alibaba|wish).*/gi, "")
    .replace(/\b[A-Z0-9]{8,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 65);
}

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (/shirt|pants|shorts|dress|jacket|leggings|top|hoodie|jeans|skirt|blouse|coat|sweater|yoga|swimwear|bra|bikini|tshirt|apparel|clothing|wear/.test(t)) return "clothing";
  if (/cream|serum|moisturiser|moisturizer|spf|toner|cleanser|mask|skincare|beauty|lotion|retinol|vitamin c|face wash/.test(t)) return "skincare";
  if (/protein|vitamin|capsule|powder|collagen|omega|supplement|probiotic|whey|bcaa/.test(t)) return "supplements";
  if (/phone|cable|charger|earbuds|speaker|led|usb|laptop|tablet|electronic|gadget|bluetooth|wireless/.test(t)) return "electronics";
  if (/necklace|ring|earring|bracelet|watch|bag|jewel|accessory|purse|wallet|pendant/.test(t)) return "jewellery";
  if (/pot|pan|organiser|organizer|storage|pillow|lamp|cushion|home|kitchen|bedroom|furniture|candle/.test(t)) return "home";
  return "general";
}

function detectPlatform(url: string): string {
  if (url.includes("aliexpress")) return "AliExpress";
  if (url.includes("amazon")) return "Amazon";
  if (url.includes("shopify") || url.includes("myshopify")) return "Shopify";
  if (url.includes("etsy")) return "Etsy";
  if (url.includes("temu")) return "Temu";
  if (url.includes("ebay")) return "eBay";
  return "Other";
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

export async function scrapeProductData(url: string): Promise<ScrapeResult> {
  let result: ScrapeResult = {
    productTitle: "",
    cleanTitle: "",
    description: "",
    bulletPoints: [],
    price: "",
    currency: "AUD",
    imageUrls: [],
    variants: { colors: [], sizes: [], flavors: [], volumes: [] },
    category: "general",
    brand: "",
    sourcePlatform: detectPlatform(url),
    sourceUrl: url,
  };

  // ── Firecrawl AI extraction (primary) ───────────────────────────────────
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (firecrawlKey) {
    try {
      const fc = new Firecrawl({ apiKey: firecrawlKey });

      // Try AI extraction first
      let extracted: any = null;
      try {
        const extractResult = await (fc as any).scrapeUrl(url, {
          formats: ["extract"],
          extract: {
            prompt: `Extract the following from this product page and return as JSON:
title: the full product title (string)
price: numeric price only, no currency symbol (number)
currency: currency code (string, e.g. AUD, USD, EUR)
description: main product description, max 400 chars (string)
images: array of ALL product image URLs found on the page — must be full absolute URLs starting with https:// or http:// (array of strings, minimum 1)
colors: array of available colour variant names e.g. ["Black","White","Red"] — empty array if none (array of strings)
sizes: array of available size options e.g. ["XS","S","M","L","XL"] or ["30ml","50ml","100ml"] — empty array if none (array of strings)
brand: brand or store name if visible (string)
bulletPoints: array of 3-6 key product features or selling points (array of strings)`,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
                description: { type: "string" },
                images: { type: "array", items: { type: "string" } },
                colors: { type: "array", items: { type: "string" } },
                sizes: { type: "array", items: { type: "string" } },
                brand: { type: "string" },
                bulletPoints: { type: "array", items: { type: "string" } },
              },
              required: ["title"],
            },
          },
        });

        if (extractResult?.extract || extractResult?.data?.extract) {
          extracted = extractResult.extract || extractResult.data?.extract;
        }
      } catch {
        // AI extract not available — fall back to markdown/html scrape
      }

      if (extracted?.title) {
        result.productTitle = extracted.title;
        result.description = extracted.description || "";
        result.price = extracted.price ? String(extracted.price) : "";
        result.currency = extracted.currency || "AUD";
        result.brand = extracted.brand || "";
        result.bulletPoints = extracted.bulletPoints || [];
        result.variants.colors = extracted.colors || [];
        result.variants.sizes = extracted.sizes || [];

        // Fix image URLs
        result.imageUrls = (extracted.images || [])
          .map((img: string) => img.startsWith("//") ? `https:${img}` : img)
          .filter((img: string) => /^https?:\/\//.test(img) && img.length > 20)
          .slice(0, 8);
      } else {
        // Fallback: markdown/html scrape
        const scrapeResult = await (fc as any).scrapeUrl(url, {
          formats: ["markdown", "html"],
        }) as any;

        if (scrapeResult?.markdown || scrapeResult?.content) {
          const md = scrapeResult.markdown || scrapeResult.content || "";
          const meta = scrapeResult.metadata || {};

          result.productTitle = meta.title || meta.ogTitle || md.match(/^#\s+(.+)/m)?.[1] || "";
          result.description = meta.ogDescription || meta.description ||
            md.split("\n").find((l: string) => l.trim().length > 60 && l.trim().length < 500 && !l.startsWith("#") && !l.includes("cookie")) || "";

          const priceMatch = md.match(/(?:price|sale|now|usd|aud|\$)\s*[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
          if (priceMatch) result.price = priceMatch[1].replace(",", "");

          result.bulletPoints = md.split("\n")
            .filter((l: string) => /^[-•*✓✔]\s/.test(l.trim()))
            .map((l: string) => l.replace(/^[-•*✓✔\d.]+\s*/, "").trim())
            .filter((l: string) => l.length > 10 && l.length < 150 && !l.toLowerCase().includes("cookie"))
            .slice(0, 6);

          // Extract images from HTML
          const html = scrapeResult.html || "";
          const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
          if (imgMatches) {
            result.imageUrls = imgMatches
              .map((m: string) => m.match(/src=["']([^"']+)["']/)?.[1])
              .filter((u?: string) => u && (u.startsWith("http") || u.startsWith("//")) && !u.includes("icon") && !u.includes("logo") && !u.includes("svg") && !u.includes("pixel") && !u.includes("1x1"))
              .map((u: string) => u.startsWith("//") ? `https:${u}` : u)
              .slice(0, 8) as string[];
          }
        }
      }
    } catch (err) {
      // Firecrawl failed — continue to Tavily fallback
    }
  }

  // ── Tavily fallback ─────────────────────────────────────────────────────
  if (!result.productTitle) {
    try {
      const extracted = await tavilyExtract(url);
      const raw = extracted.rawContent || "";
      result.productTitle = extracted.title || raw.match(/(?:Product:|Title:)\s*(.+)/i)?.[1] || "";
      result.price = raw.match(/\$([\d,]+(?:\.\d{2})?)/)?.[1] || "";
      result.description = raw.split("\n").find((l: string) => l.trim().length > 60 && l.trim().length < 500 && !l.includes("cookie")) || "";
      result.bulletPoints = raw.split("\n")
        .map((l: string) => l.replace(/^[-•*✓✔]\s*/, "").trim())
        .filter((l: string) => l.length > 10 && l.length < 120 && !l.startsWith("http") && !l.includes("cookie"))
        .slice(0, 6);
      result.imageUrls = extracted.images || [];
    } catch {
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
          result.price = top.content.match(/\$([\d,]+(?:\.\d{2})?)/)?.[1] || "";
        }
        result.imageUrls = sr.images || [];
      } catch { /* all methods failed */ }
    }
  }

  // ── Pexels image fallback ───────────────────────────────────────────────
  if (result.imageUrls.length === 0 && result.productTitle) {
    result.imageUrls = await searchPexelsImages(`${result.productTitle} product`);
  }

  // ── Final fallbacks ─────────────────────────────────────────────────────
  if (!result.productTitle) {
    try {
      result.productTitle = `Product from ${new URL(url).hostname.replace("www.", "")}`;
    } catch {
      result.productTitle = "Imported Product";
    }
  }

  result.cleanTitle = cleanProductTitle(result.productTitle);
  result.category = detectCategory(result.productTitle + " " + result.description);

  return result;
}

export function registerScrapeRoutes(app: Application) {
  app.post("/api/scrape-product", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        res.status(400).json({ error: "url is required" });
        return;
      }
      const result = await scrapeProductData(url);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Scraping failed" });
    }
  });
}
