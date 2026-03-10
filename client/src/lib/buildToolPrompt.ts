/**
 * Injects product intelligence into any tool's system prompt.
 * Use this in every tool that calls the AI chat endpoint.
 */

// ProductIntelligence is defined inline here (mirrors server/lib/product-intelligence.ts)
// to avoid importing server-side code into the client bundle.
export interface ProductIntelligence {
  category: string;
  subcategory: string;
  productType: string;
  niche: string;
  primaryAudience: string;
  audiencePainPoints: string[];
  audienceDesires: string[];
  buyerPersona: string;
  emotionalTriggers: string[];
  purchaseMotivation: string;
  marketTrend: string;
  competition: string;
  pricePositioning: string;
  seasonality: string;
  heroAngle: string;
  secondaryAngles: string[];
  uniqueHook: string;
  adHook: string;
  adBodyConcept: string;
  videoConceptIdea: string;
  websiteTone: string;
  brandVoice: string;
  websiteHeadline: string;
  websiteSubheadline: string;
  topObjections: string[];
  objectionHandlers: string[];
  emailSubjectLines: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
}

export interface ActiveProductWithIntelligence {
  cleanTitle?: string;
  title?: string;
  name?: string;
  price?: string;
  currency?: string;
  images?: string[];
  variants?: { colors?: string[]; sizes?: string[] } | Array<{ type: string; options: string[] }>;
  colors?: string[];
  sizes?: string[];
  intelligence?: ProductIntelligence;
}

export function injectProductIntelligence(
  baseSystemPrompt: string,
  product: ActiveProductWithIntelligence | null | undefined
): string {
  if (!product) return baseSystemPrompt;

  const name = product.cleanTitle || product.title || "this product";
  const price = product.price ? `${product.price} ${product.currency || ""}`.trim() : "";
  const intel = product.intelligence;

  if (!intel) {
    return (
      baseSystemPrompt +
      `\n\nProduct context: ${name}${price ? ` — ${price}` : ""}\n`
    );
  }

  // Handle both variant shapes: array of {type, options} or object {colors, sizes}
  const variantLines = Array.isArray(product.variants)
    ? product.variants.map((v) => `${v.type}: ${v.options.join(", ")}`).join(" | ")
    : product.variants
      ? [
          product.variants.colors?.length ? `Colors: ${product.variants.colors.join(", ")}` : "",
          product.variants.sizes?.length ? `Sizes: ${product.variants.sizes.join(", ")}` : "",
        ].filter(Boolean).join(" | ")
      : "";

  return (
    baseSystemPrompt +
    `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT INTELLIGENCE BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product: ${name}${price ? ` | Price: ${price}` : ""}
Category: ${intel.category} > ${intel.subcategory}${variantLines ? `\nVariants: ${variantLines}` : ""}

TARGET AUDIENCE
Who they are: ${intel.primaryAudience}
Buyer persona: ${intel.buyerPersona}
Pain points: ${intel.audiencePainPoints.join(" | ")}
Desires: ${intel.audienceDesires.join(" | ")}
Emotional triggers: ${intel.emotionalTriggers.join(", ")}

MARKET CONTEXT
Trend: ${intel.marketTrend}
Price position: ${intel.pricePositioning}
Seasonality: ${intel.seasonality}
Competition: ${intel.competition}

SELLING ANGLES
Hero angle: ${intel.heroAngle}
Supporting: ${intel.secondaryAngles.join(" | ")}
Unique hook: ${intel.uniqueHook}
Purchase motivation: ${intel.purchaseMotivation}

BRAND VOICE
Tone: ${intel.websiteTone}
Voice: ${intel.brandVoice}

HEADLINE & SUBHEADLINE
"${intel.websiteHeadline}"
"${intel.websiteSubheadline}"

AD CREATIVE
Hook: ${intel.adHook}
Body concept: ${intel.adBodyConcept}
Video idea: ${intel.videoConceptIdea}

OBJECTIONS TO OVERCOME
${intel.topObjections.map((o, i) => `• ${o} → ${intel.objectionHandlers[i] || ""}`).join("\n")}

EMAIL SUBJECT LINES (use as inspiration)
${intel.emailSubjectLines.map((s, i) => `${i + 1}. ${s}`).join("\n")}

SEO
Primary keyword: ${intel.primaryKeyword}
Secondary: ${intel.secondaryKeywords.join(", ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use this intelligence to produce output SPECIFIC to this product and buyer.
Never produce generic copy. Speak directly to the buyer persona above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  );
}
