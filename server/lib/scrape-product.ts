/**
 * Product URL Scraping API
 * Uses Firecrawl AI extraction → Tavily fallback → Claude AI cleaning step.
 * Claude validates, translates, and cleans ALL scraped data before returning.
 */
import type { Application } from "express";
import Firecrawl from "@mendable/firecrawl-js";
import { tavilyExtract, tavilySearch } from "../tavily";
import { getAnthropicClient, CLAUDE_MODEL } from "./anthropic";

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
  confidence: "high" | "medium" | "low";
  extractionError?: string;
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

/**
 * Uses Claude to clean, validate, and translate raw scraped product data into
 * structured English product information. This is the critical quality gate that
 * prevents garbage data (wrong language, junk titles, raw HTML) from reaching users.
 */
async function cleanProductDataWithAI(rawData: {
  title: string;
  description: string;
  bulletPoints: string[];
  brand: string;
  price: string;
  imageUrls: string[];
  rawText: string;
  url: string;
}): Promise<{
  product_title: string;
  brand: string;
  description: string;
  price_supplier: number | null;
  images: string[];
  key_features: string[];
  variants: { colors: string[]; sizes: string[] };
  category: string;
  confidence: "high" | "medium" | "low";
  error?: string;
}> {
  try {
    const client = getAnthropicClient();
    const prompt = `Extract product data from this scraped ecommerce page content. Return ONLY valid JSON, no markdown, no explanation.

URL: ${rawData.url}
Raw title: ${rawData.title}
Raw description: ${rawData.description}
Raw bullet points: ${rawData.bulletPoints.join(" | ")}
Raw brand: ${rawData.brand}
Raw price: ${rawData.price}
Available image URLs: ${rawData.imageUrls.slice(0, 10).join(", ")}
Additional page text snippet: ${rawData.rawText.slice(0, 800)}

Return this exact JSON structure:
{
  "product_title": "Clean product name in Australian English, max 70 chars. Must be a real product name NOT a page title, URL slug, sentence, question, or navigation text. Use AU English spelling (colour, organise, centre).",
  "brand": "Brand/manufacturer name if clearly visible, else empty string",
  "description": "Clear product description in Australian English, 40-120 words. Benefits-focused for AU consumers. If original is non-English, translate it. Use AU spelling throughout.",
  "price_supplier": null or numeric price if found,
  "images": ["only include image URLs that look like actual product photos — URLs containing /product/, /item/, cdn, or image hosting. Exclude icon.png, logo, banner, sprite, pixel, 1x1, svg. Max 6 URLs from the provided list"],
  "key_features": ["3-5 specific product features in English. Real features, not generic marketing fluff"],
  "variants": { "colors": ["colour options if found"], "sizes": ["size options if found"] },
  "category": "one of: fitness/beauty/home/tech/fashion/pets/jewellery/supplements/other",
  "confidence": "high if you found a clear product with title+description, medium if partial data, low if page seems irrelevant or no product found",
  "au_retail_price_suggestion": "Suggested AUD retail price based on typical AU markup (2.5-4x for dropship, 1.8-2.5x for wholesale). Factor in AU shipping ($8-15), GST (10%), Afterpay fees (4-6%). Return as number or null.",
  "au_compliance_flags": ["Any TGA concerns for health/beauty/therapeutic products", "ACCC product safety issues", "Electrical certification needs (SAA/RCM mark)", "AANZ food standards if applicable. Empty array if no concerns."]
}

Critical rules:
- If the title looks like a question, sentence, menu item, or non-product text → set confidence to low
- If the page appears to be in Portuguese, Spanish, Chinese, etc. → translate everything to Australian English
- If product_title would be something like "Quanto custa" or "How much does" → it's wrong, confidence low
- If you cannot determine a real product, set confidence to "low" and add "error": "Could not extract valid product data from this URL"
- Use Australian English spelling in all output: colour (not color), organise (not organize), centre (not center), favourite (not favorite)
- For health, beauty, supplement, or therapeutic products: ALWAYS flag potential TGA compliance requirements in au_compliance_flags`;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[scrape] Claude cleaning failed:", err);
    // Return passthrough — don't block if AI cleaning fails
    return {
      product_title: rawData.title,
      brand: rawData.brand,
      description: rawData.description,
      price_supplier: rawData.price ? parseFloat(rawData.price.replace(/[^\d.]/g, "")) || null : null,
      images: rawData.imageUrls.slice(0, 5),
      key_features: rawData.bulletPoints.slice(0, 5),
      variants: { colors: [], sizes: [] },
      category: detectCategory(rawData.title + " " + rawData.description),
      confidence: "medium",
    };
  }
}

export async function scrapeProductData(url: string): Promise<ScrapeResult> {
  let rawTitle = "";
  let rawDescription = "";
  let rawBulletPoints: string[] = [];
  let rawPrice = "";
  let rawBrand = "";
  let rawImageUrls: string[] = [];
  let rawColors: string[] = [];
  let rawSizes: string[] = [];
  let rawText = "";

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
        rawTitle = extracted.title;
        rawDescription = extracted.description || "";
        rawPrice = extracted.price ? String(extracted.price) : "";
        rawBrand = extracted.brand || "";
        rawBulletPoints = extracted.bulletPoints || [];
        rawColors = extracted.colors || [];
        rawSizes = extracted.sizes || [];
        rawImageUrls = (extracted.images || [])
          .map((img: string) => img.startsWith("//") ? `https:${img}` : img)
          .filter((img: string) => /^https?:\/\//.test(img) && img.length > 20)
          .slice(0, 10);
      } else {
        // Fallback: markdown/html scrape
        const scrapeResult = await (fc as any).scrapeUrl(url, {
          formats: ["markdown", "html"],
        }) as any;

        if (scrapeResult?.markdown || scrapeResult?.content) {
          const md = scrapeResult.markdown || scrapeResult.content || "";
          const meta = scrapeResult.metadata || {};
          rawText = md.slice(0, 2000);

          rawTitle = meta.title || meta.ogTitle || md.match(/^#\s+(.+)/m)?.[1] || "";
          rawDescription = meta.ogDescription || meta.description ||
            md.split("\n").find((l: string) => l.trim().length > 60 && l.trim().length < 500 && !l.startsWith("#") && !l.includes("cookie")) || "";

          const priceMatch = md.match(/(?:price|sale|now|usd|aud|\$)\s*[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
          if (priceMatch) rawPrice = priceMatch[1].replace(",", "");

          rawBulletPoints = md.split("\n")
            .filter((l: string) => /^[-•*✓✔]\s/.test(l.trim()))
            .map((l: string) => l.replace(/^[-•*✓✔\d.]+\s*/, "").trim())
            .filter((l: string) => l.length > 10 && l.length < 150 && !l.toLowerCase().includes("cookie"))
            .slice(0, 6);

          const html = scrapeResult.html || "";
          const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
          if (imgMatches) {
            rawImageUrls = imgMatches
              .map((m: string) => m.match(/src=["']([^"']+)["']/)?.[1])
              .filter((u?: string) => u && (u.startsWith("http") || u.startsWith("//")) && !u.includes("icon") && !u.includes("logo") && !u.includes("svg") && !u.includes("pixel") && !u.includes("1x1"))
              .map((u: string) => u.startsWith("//") ? `https:${u}` : u)
              .slice(0, 10) as string[];
          }
        }
      }
    } catch {
      // Firecrawl failed — continue to Tavily fallback
    }
  }

  // ── Tavily fallback ─────────────────────────────────────────────────────
  if (!rawTitle) {
    try {
      const extracted = await tavilyExtract(url);
      const raw = extracted.rawContent || "";
      rawText = raw.slice(0, 2000);
      rawTitle = extracted.title || raw.match(/(?:Product:|Title:)\s*(.+)/i)?.[1] || "";
      rawPrice = raw.match(/\$([\d,]+(?:\.\d{2})?)/)?.[1] || "";
      rawDescription = raw.split("\n").find((l: string) => l.trim().length > 60 && l.trim().length < 500 && !l.includes("cookie")) || "";
      rawBulletPoints = raw.split("\n")
        .map((l: string) => l.replace(/^[-•*✓✔]\s*/, "").trim())
        .filter((l: string) => l.length > 10 && l.length < 120 && !l.startsWith("http") && !l.includes("cookie"))
        .slice(0, 6);
      rawImageUrls = extracted.images || [];
    } catch {
      try {
        const hostname = new URL(url).hostname.replace("www.", "");
        const sr = await tavilySearch(
          `site:${hostname} ${url.split("/").pop()?.replace(/[^a-zA-Z0-9]/g, " ").trim() || "product"}`,
          { maxResults: 3, includeImages: true }
        );
        const top = sr.results[0];
        if (top) {
          rawTitle = top.title || "";
          rawDescription = top.content || "";
          rawPrice = top.content.match(/\$([\d,]+(?:\.\d{2})?)/)?.[1] || "";
          rawText = top.content.slice(0, 2000);
        }
        rawImageUrls = sr.images || [];
      } catch { /* all methods failed */ }
    }
  }

  // ── Claude AI cleaning step — ALWAYS run to validate and translate ───────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  let cleaned: Awaited<ReturnType<typeof cleanProductDataWithAI>> | null = null;

  if (anthropicKey && (rawTitle || rawDescription || rawText)) {
    cleaned = await cleanProductDataWithAI({
      title: rawTitle,
      description: rawDescription,
      bulletPoints: rawBulletPoints,
      brand: rawBrand,
      price: rawPrice,
      imageUrls: rawImageUrls,
      rawText,
      url,
    });
    console.log(`[Scrape] Claude cleaning done | confidence=${cleaned.confidence} | title="${cleaned.product_title.slice(0, 50)}"`);
  }

  // ── Pexels image fallback if no product images found ────────────────────
  const finalImages = cleaned?.images?.length
    ? cleaned.images
    : rawImageUrls.length
    ? rawImageUrls.slice(0, 5)
    : [];

  const finalTitle = cleaned?.product_title || rawTitle;

  if (finalImages.length === 0 && finalTitle) {
    const pexels = await searchPexelsImages(`${finalTitle} product`);
    if (pexels.length > 0) finalImages.push(...pexels.slice(0, 4));
  }

  // ── Build final result ──────────────────────────────────────────────────
  const confidence = cleaned?.confidence || (rawTitle ? "medium" : "low");

  // If confidence is low and Claude says there's an error — return extraction error
  if (confidence === "low" && cleaned?.error) {
    return {
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
      confidence: "low",
      extractionError: cleaned.error || "We couldn't extract product info from this URL. Try a different link or enter details manually.",
    };
  }

  const productTitle = cleaned?.product_title || rawTitle || `Product from ${new URL(url).hostname.replace("www.", "")}`;
  const description = cleaned?.description || rawDescription || "";
  const bulletPoints = cleaned?.key_features?.length ? cleaned.key_features : rawBulletPoints;
  const brand = cleaned?.brand || rawBrand || "";
  const priceNum = cleaned?.price_supplier;
  const price = priceNum ? String(priceNum) : rawPrice;
  const colors = cleaned?.variants?.colors?.length ? cleaned.variants.colors : rawColors;
  const sizes = cleaned?.variants?.sizes?.length ? cleaned.variants.sizes : rawSizes;
  const category = cleaned?.category
    ? cleaned.category
    : detectCategory(productTitle + " " + description);

  return {
    productTitle,
    cleanTitle: cleanProductTitle(productTitle),
    description,
    bulletPoints,
    price,
    currency: "AUD",
    imageUrls: finalImages,
    variants: { colors, sizes, flavors: [], volumes: [] },
    category,
    brand,
    sourcePlatform: detectPlatform(url),
    sourceUrl: url,
    confidence,
  };
}

export function registerScrapeRoutes(app: Application) {
  app.post("/api/import-product", async (req, res) => {
    const { url } = req.body ?? {};
    if (!url) return res.status(400).json({ error: "url is required" });
    try {
      const result = await scrapeProductData(url);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Scrape failed" });
    }
  });

  app.post("/api/scrape-product", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        res.status(400).json({ error: "url is required" });
        return;
      }
      const result = await scrapeProductData(url);

      // If extraction failed completely, return a user-friendly error
      if (result.extractionError) {
        res.status(422).json({
          error: result.extractionError,
          confidence: "low",
        });
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Scraping failed" });
    }
  });
}
