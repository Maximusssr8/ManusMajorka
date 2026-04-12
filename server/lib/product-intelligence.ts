/**
 * AI Brain — Product Intelligence Engine
 * Analyzes a scraped product and returns deep intelligence used by every tool.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

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

export async function analyzeProduct(product: {
  cleanTitle: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  brand: string;
  variants: { colors: string[]; sizes: string[]; flavors: string[]; volumes: string[] };
  sourcePlatform: string;
}): Promise<ProductIntelligence> {
  const systemPrompt = `You are a world-class ecommerce strategist and consumer psychologist with deep expertise in dropshipping, DTC brands, Facebook/TikTok advertising, Shopify CRO, and buyer psychology.

Analyze the given product and produce a comprehensive intelligence report. Your analysis must be:
- SPECIFIC to this exact product, not generic ecommerce advice
- Based on REAL buyer psychology for this product category
- Actionable — every field gives a tool something concrete to work with

Return ONLY valid JSON matching the exact schema requested. No markdown, no preamble, no explanation.`;

  const userPrompt = `Analyze this product and return the full ProductIntelligence JSON:

Product: ${product.cleanTitle}
Description: ${(product.description || '').slice(0, 800)}
Price: ${product.price} ${product.currency}
Colors available: ${product.variants.colors.join(', ') || 'not specified'}
Sizes available: ${product.variants.sizes.join(', ') || 'not specified'}
Category: ${product.category}
Brand: ${product.brand || 'unknown'}
Platform: ${product.sourcePlatform}

Return this exact JSON (all fields required, arrays must have 3+ items):
{
  "category": "",
  "subcategory": "",
  "productType": "",
  "niche": "",
  "primaryAudience": "",
  "audiencePainPoints": ["", "", ""],
  "audienceDesires": ["", "", ""],
  "buyerPersona": "",
  "emotionalTriggers": ["", "", ""],
  "purchaseMotivation": "",
  "marketTrend": "",
  "competition": "",
  "pricePositioning": "",
  "seasonality": "",
  "heroAngle": "",
  "secondaryAngles": ["", "", ""],
  "uniqueHook": "",
  "adHook": "",
  "adBodyConcept": "",
  "videoConceptIdea": "",
  "websiteTone": "",
  "brandVoice": "",
  "websiteHeadline": "",
  "websiteSubheadline": "",
  "topObjections": ["", "", ""],
  "objectionHandlers": ["", "", ""],
  "emailSubjectLines": ["", "", "", "", ""],
  "primaryKeyword": "",
  "secondaryKeywords": ["", "", "", ""]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const clean = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean) as ProductIntelligence;
}
