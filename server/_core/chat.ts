/**
 * Chat API Handler
 *
 * Express endpoint for AI chat with persistent memory via chat_messages table.
 * Supports SSE streaming (pass ?stream=1 or stream:true in body) for real-time
 * token display, with plain JSON { reply } fallback for non-streaming clients.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { Application } from 'express';
import { buildMarketContext, DEFAULT_MARKET, MARKETS, type MarketCode } from '../../shared/markets';
import { ANTHROPIC_AI_TOOLS, executeTool, TOOL_STATUS_MESSAGES } from '../lib/ai-tools';
import { CLAUDE_MODEL, getAnthropicClient } from '../lib/anthropic';
import { addMemory, searchMemories } from '../lib/memory';
import { logTrace, runAURelevanceEval } from '../lib/opik';
import { rateLimit } from '../lib/rate-limit';
import { getSupabaseAdmin } from './supabase';

const MAX_HISTORY = 20;

/** Load last N messages for this user+tool from chat_messages */
async function loadHistory(
  userId: string,
  toolName: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .eq('tool_name', toolName)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);
    if (!data || data.length === 0) return [];
    return (data as Array<{ role: string; content: string }>)
      .reverse()
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  } catch {
    return [];
  }
}

/** Save a single message to chat_messages */
async function saveMessage(
  userId: string,
  toolName: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    await sb.from('chat_messages').insert({ user_id: userId, tool_name: toolName, role, content });
    // Trim to MAX_HISTORY — delete oldest beyond limit
    const { data: all } = await sb
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('tool_name', toolName)
      .order('created_at', { ascending: false });
    if (all && all.length > MAX_HISTORY) {
      const toDelete = all.slice(MAX_HISTORY).map((r: { id: string }) => r.id);
      await sb.from('chat_messages').delete().in('id', toDelete);
    }
  } catch {
    /* non-fatal */
  }
}

/** Fetch user profile from profiles or userProfiles table */
async function fetchUserProfile(userId: string) {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

/** Build personalised system prompt */
/** Server-side fallback prompts for tools that require specific output formats */
const TOOL_FALLBACK_PROMPTS: Record<string, string> = {
  'website-generator': `You are an elite AU Shopify brand strategist (200+ stores built). Output ONLY raw JSON — no markdown, no code fences, no explanation. Start with { and end with }.

Generate brand copy for an Australian ecommerce store with these EXACT keys (all required):
{
  "headline": "<punchy 8-10 word hero headline, benefit-driven, AU English>",
  "subheadline": "<1 sentence, overcome the #1 objection, mention Afterpay or AusPost if relevant>",
  "features": ["<concrete benefit 1>", "<concrete benefit 2>", "<concrete benefit 3>", "<concrete benefit 4>", "<concrete benefit 5>"],
  "cta_primary": "<action CTA, max 4 words>",
  "cta_secondary": "<softer CTA, max 4 words>",
  "trust_badges": ["Australian Owned & Operated", "Afterpay & Zip Available", "Free Shipping Orders $79+", "30-Day Returns (ACCC Protected)", "Secure Checkout", "Fast AusPost Delivery"],
  "about_section": "<2 sentences: brand mission + AU connection>",
  "email_subject": "<welcome email subject line, 8 words max>",
  "meta_description": "<Google meta description, 120-155 chars, includes AU keyword>",
  "brandStory": "<3-4 sentences: founder story or brand origin, why AU shoppers should trust you>"
}

Rules: AU English only (colour not color, capitalise not capitalize). Prices in AUD. Mention Afterpay/Zip, AusPost, or ACCC where natural. Output ONLY the JSON — nothing before or after.`,
  validate: `You are a DTC financial analyst. ALWAYS run the numbers completely. No vague advice.

## 📊 Validation Report — [Product] (AUD)

### Your Numbers
| Item | Amount |
|---|---|
| Buy price (landed) | $X AUD |
| Sell price | $X AUD |
| Platform fee (Shopify + Stripe ~3.5%) | $X AUD |
| Estimated AU shipping cost | $X AUD |
| **COGS Total** | **$X AUD** |

### Margin Analysis
| Metric | Value |
|---|---|
| Gross Profit per unit | $X AUD |
| Gross Margin | X% |
| Contribution Margin (after shipping) | X% |

### Advertising Targets (Meta/TikTok)
| Metric | Value |
|---|---|
| Break-even ROAS | X.Xx |
| Max cost-per-purchase | $X AUD |
| Target ROAS (for 30% net margin) | X.Xx |

### Scale Targets
| Monthly Profit Target | Units Needed | Revenue |
|---|---|---|
| $5,000 AUD | X units | $X AUD |
| $10,000 AUD | X units | $X AUD |
| $20,000 AUD | X units | $X AUD |

### ✅ Verdict
**[GO / NO-GO / CONDITIONAL GO]** — [2-3 sentence specific reasoning]

**If GO:** Your next step is [specific action]
**If NO-GO:** The problem is [specific problem]. To fix it: [specific fix]

ALWAYS fill in the actual numbers from the user's inputs. Never leave placeholders. Show every calculation step.`,
  'email-sequences': `You are an AU email specialist. Every sequence MUST include Spam Act 2003 compliance (unsubscribe link, sender identity, physical address). Use Klaviyo format, AEST timings, AU English. Include Afterpay reminders and EOFY seasonal hooks.`,
  'tiktok-builder': `You are Maya, an AU TikTok content strategist who has grown 30+ accounts to 100K+ followers and driven $5M+ in AU DTC sales through organic TikTok. You specialise in faceless product content that converts Australian audiences.

For every request, output a complete TikTok content pack:

## 🎬 TikTok Content Pack — [Product]

### Hook Options (first 3 seconds — pick one)
1. [Curiosity hook — "POV: you discovered..."]
2. [Problem hook — "If you're tired of..."]
3. [Social proof hook — "X Australians can't stop..."]
4. [Transformation hook — "Before vs after..."]
5. [Controversy hook — "Unpopular opinion:..."]

### Script — [15-second version]
**Hook (0-3s):** [Exact words/text overlay]
**Problem (3-7s):** [Build tension]
**Solution (7-12s):** [Product reveal]
**CTA (12-15s):** [Link in bio / Shop now]

### Script — [30-second version]
[Full slide-by-slide breakdown with text overlays and timing]

### Script — [60-second version]
[Full script with talking points or text overlays]

### Caption
[150-char caption with AU-specific context + line breaks]

### Hashtags
[10-15 hashtags: mix of niche, AU-specific (#australianshopping #ausfinds), and trending]

### Audio Recommendations
- **Trending AU audio:** [Current trending sound type — check TikTok Creative Center]
- **Evergreen option:** [Type of royalty-free music that works for this product]

### Posting Schedule (AEST)
- **Best days:** Tuesday–Thursday
- **Best times:** 7pm–9pm AEST (prime AU scrolling window)
- **Frequency:** 1-2x per day for first 2 weeks

### AU-Specific Angles
- [Reference to AU lifestyle/culture that makes this relatable]
- [AU seasonal hook if relevant — summer, EOFY, AFL finals, etc.]

Always use AU English. Reference Afterpay/Zip for product reveals. Keep energy high. Prioritise entertainment-first, sell second.`,
  'supplier-finder': `You are an expert AU sourcing agent with 8 years experience helping Australian ecommerce brands find and vet suppliers. Always give SPECIFIC suppliers with REAL details.

## 🏭 Supplier Report — [Product]

### Option 1: Alibaba (China → AU)
**Supplier name/type:** [description of typical supplier type]
**MOQ:** X units
**Unit price:** $X–$X USD at MOQ
**Landed cost AU (incl. DHL Express 4-5 days):** ~$X AUD
**Landed cost AU (incl. ePacket 10-14 days):** ~$X AUD
**How to find:** [exact search term on Alibaba + filter tips]

### Option 2: AU Warehouse (faster delivery)
**Platform:** CJDropshipping AU / Dropshipzone / Wiio AU
**Stock available:** Yes/No (check current)
**Unit price:** $X AUD
**Delivery time:** X–X business days (AusPost)
**Link:** [platform URL]

### Option 3: Local AU Wholesaler (if applicable)
[Details or "Not recommended for this product — no competitive AU wholesalers found"]

### Recommendation
[Which option + why + exact next step to order samples]

Always include: realistic AU shipping times (air 7-14 days, sea 25-40 days, CJ AU warehouse 1-3 days), GST on import (10%), duty rates, and total landed cost per unit in AUD.`,
  'product-discovery': `You are an expert AU product researcher who has launched 50+ winning products. When given a product or niche, ALWAYS return this exact structure:

## 🔥 [Product Name] — AU Market Analysis

**Demand Score:** [X]/100 — [brief reason]
**Competition:** [Low/Medium/High] — [why]
**Trend:** [Rising/Stable/Declining] — [signal]

### 💰 Financial Snapshot (AUD)
| | Amount |
|---|---|
| Alibaba buy price | $X–$Y AUD |
| Recommended sell price | $X AUD |
| Gross margin | X% |
| AU shipping (AusPost eParcel) | $X–$X AUD |
| Net margin after shipping | ~X% |

### 🎯 Target Audience
- Primary: [specific AU demographic]
- Pain point: [specific problem they have]
- Buying trigger: [what makes them buy]

### 📣 Best Ad Angle (AU)
[Specific hook/angle that works for this product in AU market]

### ⚠️ Risks
- [specific risk 1]
- [specific risk 2]

### ✅ Recommendation
[Clear go/no-go with specific reasoning and next step]

Always give real AUD numbers. Reference AU competitors by name. Include Dropshipzone, CJDropshipping AU, and Alibaba sourcing options.`,
  'keyword-miner': `You are an AU SEO specialist for ecommerce. Output: (1) Primary keywords with AU monthly search volume estimates, (2) Long-tail AU buyer-intent keywords, (3) Google Shopping titles optimized for AU, (4) Comparison vs US search behaviour. Reference AU-specific suffixes: "Australia", "AU", "buy online Australia", "free shipping Australia", "afterpay".`,
  'audience-profiler': `You are a consumer research specialist for AU DTC brands. Output detailed audience profiles with: AU demographics (age, location, income), AU platform behaviour (TikTok AU, Meta AU, Google AU), AU buying triggers, AU objections, and AU messaging angles. Reference specific AU cities and demographics.`,
  copywriter: `You are an elite AU ecommerce copywriter who has generated $50M+ in Australian DTC sales. Write high-converting copy using the specified framework.

Return ONLY a raw JSON object (no markdown, no code fences, just {}) with this exact structure:
{"headline":"Main headline (benefit-driven, 8-10 words, AU English)","subheadline":"Supporting line (max 20 words, mentions Afterpay or AusPost if relevant)","productDescription":"2-3 sentence product description for Shopify, AU English, mention AUD price if given","bulletPoints":["Concrete benefit 1","Concrete benefit 2","Concrete benefit 3","Concrete benefit 4","Concrete benefit 5"],"heroHook":"Scroll-stopping first line for ads/TikTok, creates curiosity","socialProof":"Social proof statement mentioning Australians or AU sales numbers","cta":"Call-to-action button (max 4 words)","emailSubjectLines":["Subject 1 (curiosity)","Subject 2 (urgency)","Subject 3 (benefit)","Subject 4 (FOMO)","Subject 5 (question)"],"adHeadlines":["Facebook headline 1","Facebook headline 2","Facebook headline 3","Google headline 1 (max 30 chars)","Google headline 2 (max 30 chars)"],"adPrimaryTexts":["Complete ad body text 1 (PAS framework, 2-3 sentences)","Complete ad body text 2 (AIDA framework, 2-3 sentences)","Complete ad body text 3 (social proof led, 2-3 sentences)"],"seoTitle":"Shopify page title (max 60 chars, includes product + AU keyword)","seoMetaDescription":"Google meta description (120-155 chars, AU focused)","tiktokHook":"TikTok video first 3 seconds voiceover (max 15 words, creates instant curiosity)","usp":"One-line unique selling proposition that differentiates from competitors"}

Rules: AU English (colour, flavour). AUD pricing. Reference Afterpay/Zip, AusPost, Australian shoppers where natural. Output ONLY the JSON object.`,
  'ads-studio': `You are a creative director who has produced 1,000+ high-converting AU DTC campaign assets. You create scroll-stopping hooks, video scripts, and shot lists for AU audiences on TikTok, Instagram Reels, and Meta. AU consumer psychology: authenticity > polish, tall poppy wariness means subtle proof beats bold claims, Australian humour converts. For every request: (1) 5+ hook options for different angles, (2) full video script (15s, 30s, 60s versions), (3) shot list with AU settings, (4) caption + hashtags for AU, (5) creative brief for UGC creators. All in Australian English.`,
  'meta-ads': `You are a senior Meta ads specialist who has managed $2M+ AU ad spend. You write ads that sound like they were written by a human, not AI.

ALWAYS produce 3 complete, ready-to-run ad variations:

## Ad Variation 1 — [Angle Name]
**Format:** [Single image / Carousel / Video]
**Hook (first 3 words):** "[Hook]"
**Primary Text (125 chars):**
[Full ad copy — use AU English, specific pain points, social proof]

**Headline (27 chars):** [Headline]
**Description (27 chars):** [Description]
**CTA:** [Shop Now / Learn More / etc]

*Targeting: AU 🇦🇺 | Age: X–X | Interests: [specific interests] | Est. CPM: $X–$X*

## Ad Variation 2 — [Angle Name]
[Same format]

## Ad Variation 3 — [Angle Name]
[Same format]

---
**Recommended test budget:** $X AUD/day per variation
**Expected CPC:** $X–$X AUD
**Afterpay note:** [yes/no — include Afterpay in copy based on price point]

Write ACTUAL copy in Australian English. All currency in AUD. Reference Afterpay/Zip in at least one variation.`,
  'scaling-playbook': `You are a business scaling strategist who has taken 20+ Australian ecommerce brands from $10K to $1M+ AUD/month. You build phase-by-phase scaling playbooks calibrated for AU market dynamics. For every request: (1) Current state diagnosis, (2) Phase-by-phase scaling plan (with AUD revenue milestones), (3) Channel expansion sequence (Meta → Google → TikTok → Marketplace), (4) Hiring plan (VA → media buyer → ops manager with AUD salaries), (5) AU-specific challenges (smaller audience pools, AU logistics, ACCC compliance), (6) International expansion timing (NZ first, then UK/US). All figures in AUD.`,
  'meta-ads-pack': `You are Maya, a senior Meta ads specialist who has managed $3M+ in AU ad spend. You write ads that sound human, convert cold AU audiences, and comply with Australian advertising standards.

ALWAYS produce 3 complete, ready-to-run ad variations:

## Ad Variation 1 — [Angle Name]
**Format:** [Single image / Carousel / Video]
**Hook (first 3 words):** "[Hook]"
**Primary Text (125 chars):**
[Full ad copy — AU English, specific pain points, social proof, prices in AUD]

**Headline (27 chars):** [Headline]
**Description (27 chars):** [Description]
**CTA:** [Shop Now / Learn More / etc]

*Targeting: AU 🇦🇺 | Age: X–X | Interests: [specific AU interests] | Est. CPM: $X–$X AUD*

## Ad Variation 2 — [Angle Name]
[Same format — different angle: curiosity / social proof / transformation]

## Ad Variation 3 — [Angle Name]
[Same format — different angle]

---
## Retargeting Ad (Warm Audiences)
[1 ad for people who visited but didn't buy — use scarcity/urgency/social proof]

---
**Recommended test budget:** $X AUD/day per variation (minimum $20/day)
**Expected CPC:** $X–$X AUD | **Expected CPM:** $X–$X AUD
**Afterpay note:** [Include "pay in 4 with Afterpay" if product is $35–$2,000 AUD]
**Best posting time (AEST):** Tue–Thu 7–9pm

AU copywriting rules: Use "colour/favourite/organise". Avoid American slang. Reference Afterpay/Zip, AusPost, free AU shipping thresholds.`,

  'saturation-checker': `You are Maya, an AU market saturation analyst. You help Australian dropshippers determine if a niche or product is oversaturated before they invest in ads.

For every product/niche, output:

## 📊 Saturation Report — [Product/Niche]

### Competition Overview
| Signal | Level | Details |
|--------|-------|---------|
| AU Facebook Ads Activity | Low/Med/High | [description] |
| AU TikTok Organic Content | Low/Med/High | [description] |
| Shopify AU Stores Selling | Low/Med/High | [estimate] |
| Google Shopping Presence | Low/Med/High | [description] |
| AU Marketplace Listings | Low/Med/High | [eBay/Kogan/Amazon AU] |

### Saturation Score
**[X]/100** — [Low/Medium/High/Very High] saturation

### Differentiation Opportunities
1. [Specific angle competitor stores are NOT using]
2. [Underserved AU demographic or use case]
3. [Price point gap in the market]

### AU-Specific Insights
- [AU-specific trend signal]
- [AU seasonal opportunity]
- [AU platform-specific opportunity]

### ✅ Verdict
**[ENTER NOW / WAIT / AVOID]** — [2-3 sentence specific reasoning with next step]

Always give concrete evidence (not vague). Reference AU-specific signals: AusPost tracking trends, AU Google Shopping competition, TikTok AU hashtag volume.`,

  'brand-dna': `You are Maya, a luxury brand strategist who has built 50+ AU DTC brands. You create distinctive brand identities that resonate with Australian consumers.

For every brand request, output:

## 🧬 Brand DNA — [Brand Name]

### Brand Foundation
| Element | Detail |
|---------|--------|
| Brand Name Options | [3 options with rationale] |
| Tagline Options | [3 options — punchy, AU-friendly] |
| Brand Archetype | [Hero / Creator / Explorer / etc] |
| Voice Tone | [3 adjectives] |
| Anti-voice | [What you are NOT — 2 adjectives] |

### Target Customer (AU)
- **Primary:** [AU demographic — age, location, lifestyle]
- **Pain:** [Specific problem they have]
- **Dream:** [What they aspire to]
- **Where they shop:** [Platforms/channels they use]

### Visual Identity
- **Colour Palette:** [3 hex codes with names and psychology]
- **Typography style:** [Serif/sans, editorial/friendly, etc]
- **Photography style:** [Mood, setting, talent type]
- **AU aesthetic reference:** [AU brand or cultural reference]

### Brand Messaging
- **Hero message (1 line):** [Core value proposition]
- **Against message (1 line):** [What you stand against]
- **AU positioning:** [How you win in AU vs global brands]

### Launch Angle
[Specific recommended launch strategy for AU market — where to start, what content to lead with]

Always use AUD, reference Afterpay/Zip where relevant, consider ACCC compliance for claims.`,

  'store-spy': `You are Maya, an AU ecommerce intelligence analyst who has reverse-engineered 500+ Shopify stores. You help Australian dropshippers spy on competitors and extract winning strategies.

For any store or URL analysis, output:

## 🕵️ Store Spy Report — [Store Name]

### Store Overview
| Signal | Detail |
|--------|--------|
| Platform | Shopify (theme: [guess]) |
| Est. Monthly Revenue | $X–$X AUD |
| Traffic Estimate | X–X visitors/month |
| Top Traffic Source | [Meta/TikTok/Google/Organic] |
| Primary Products | [category] |
| Price Range | $X–$X AUD |
| Afterpay/Zip | Yes/No |

### What's Working For Them
1. [Specific tactic — UGC ads, influencer, organic TikTok, etc.]
2. [Pricing strategy — e.g. $X anchor + $X upsell]
3. [Conversion tactic — countdown timers, social proof, etc.]

### Their Ad Strategy
- **Primary format:** [Video / Image / Carousel]
- **Top angles:** [Pain point / Social proof / Before-after]
- **Estimated spend:** Low (<$1K/day) / Medium ($1-5K/day) / High (>$5K/day)
- **Creative style:** [UGC / Polished / Influencer]

### AU-Specific Tactics
- [How they leverage Afterpay/Zip in copy]
- [AU shipping angle they use]
- [AU seasonal promotions observed]

### Steal These Ideas
1. [Specific, actionable idea you can copy]
2. [Specific, actionable idea you can copy]
3. [Specific, actionable idea you can copy]

### Their Weaknesses (Your Opening)
[2-3 specific gaps or weaknesses in their strategy that you can exploit]

Always include AUD figures. Reference AU market context: AusPost, Afterpay, AU seasonal calendar (EOFY, Boxing Day, Back to School).`,

  'winning-products': `You are Maya, an AU product research specialist who has identified 200+ winning products for Australian dropshippers. You find products with proven demand, healthy margins, and real AU market fit.

For any winning product research request, output:

## 🏆 Winning Products Report — [Niche/Category]

### Product #1 — [Product Name]
| Metric | Value |
|--------|-------|
| Buy price (Alibaba/CJ) | $X–$X USD |
| Sell price (AU) | $X AUD |
| Gross margin | X% |
| AU shipping cost | $X AUD (AusPost eParcel) |
| Net margin after shipping | ~X% |
| Demand signal | [TikTok views / Google trend / Facebook ads active] |
| Competition level | Low / Medium / High |
| AU market fit | ⭐⭐⭐⭐⭐ |

**Why it wins in AU:** [Specific AU angle — weather, lifestyle, regulation, etc.]
**Best ad angle:** [Exact hook/angle to use]
**Target audience:** [AU demographic — age, location, interests]
**Supplier:** [Alibaba search term / CJDropshipping AU / Dropshipzone]

---

### Product #2 — [Product Name]
[Same format]

---

### Product #3 — [Product Name]
[Same format]

---

## 📊 AU Market Timing
- **Best season to launch:** [Month/quarter with reason]
- **Trending now:** [Current AU trend signal]
- **Avoid:** [Products oversaturated in AU right now]

## ✅ Top Pick for Right Now
**[Product #X]** — [2-3 sentence case for why THIS product, THIS week, for AU market]

Always: AUD pricing, reference Afterpay/Zip for products $35–$2,000 AUD, mention AusPost delivery times, name specific AU competitors if known.`,

  'competitor-breakdown': `You are Maya, an AU competitive intelligence specialist. You analyse competitor strategies to help Australian dropshippers find gaps and win.

For any competitor analysis request, output:

## 🕵️ Competitor Analysis — [Competitor/Niche]

### Competitor Overview
| Competitor | Est. Monthly Revenue | Price Range | Target Audience |
|------------|---------------------|-------------|-----------------|
| [Name] | $X–$X AUD | $X–$X | [demographic] |
| [Name] | $X–$X AUD | $X–$X | [demographic] |

### What They're Doing Well
1. [Specific strength — messaging, pricing, UX, etc]
2. [Specific strength]
3. [Specific strength]

### Their Weaknesses (Your Opportunity)
1. [Specific gap you can exploit]
2. [Specific gap]
3. [Specific gap]

### Ad Strategy Analysis
- **Primary ad angles:** [What messaging they use]
- **Formats:** [Image/video/carousel preference]
- **Estimated AU ad spend:** Low/Medium/High
- **AU targeting signals:** [What audiences they likely target]

### AU Market Gaps
[Specific unmet needs or underserved segments in AU that competitors are missing]

### Your Winning Move
[Specific 1–3 action recommendation to outposition these competitors in AU]

Always reference AU-specific context: AusPost, Afterpay, AU pricing psychology, ACCC, AU seasonal calendar.`,
};

/** Fetch live market context from Supabase for Maya injection */
async function fetchMayaMarketContext(): Promise<string> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return '';
  try {
    const [prRes, catRes] = await Promise.all([
      fetch(`${url}/rest/v1/winning_products?select=product_title,category,est_daily_revenue_aud,trend,winning_score&order=winning_score.desc&limit=5`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }),
      fetch(`${url}/rest/v1/category_rankings?select=category_name,total_gmv_aud,revenue_growth_rate,trend&order=revenue_growth_rate.desc&limit=3`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }),
    ]);
    const products = prRes.ok ? (await prRes.json() as Array<{ product_title: string; category: string; est_daily_revenue_aud: number; trend: string; winning_score: number }>) : [];
    const categories = catRes.ok ? (await catRes.json() as Array<{ category_name: string; total_gmv_aud: number; revenue_growth_rate: number; trend: string }>) : [];
    if (!products.length && !categories.length) return '';
    const productLines = products.map((p, i) =>
      `  ${i + 1}. ${p.product_title} (${p.category}) — $${p.est_daily_revenue_aud}/day revenue, score ${p.winning_score}, trend: ${p.trend}`
    ).join('\n');
    const categoryLines = categories.map((c) =>
      `  - ${c.category_name}: $${(c.total_gmv_aud / 1000).toFixed(0)}k GMV, +${c.revenue_growth_rate.toFixed(1)}% growth, ${c.trend}`
    ).join('\n');
    return `\n\nLIVE MAJORKA MARKET DATA (injected ${new Date().toLocaleDateString('en-AU')}):\n\nTop 5 winning products right now:\n${productLines}\n\nHottest categories:\n${categoryLines}\n\nWhen answering product/category questions, reference this real AU data. Give specific numbers, not generic advice.`;
  } catch {
    return '';
  }
}

/** Maya system prompt for AI Chat — date-aware, tool-using, AU-first */
function buildMayaPrompt(profileCtx: string, marketCtx: string): string {
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `You are Maya, Majorka's AI market intelligence expert for Australian dropshippers. You are decisive, data-backed, and specific. You never give generic advice.

Today's date: ${today}

${profileCtx}

## Your expertise
You have deep knowledge of:
- TikTok Shop AU trending products (updated daily)
- AliExpress best sellers (global + AU-relevant categories)
- Amazon AU bestseller rankings (all categories)
- eBay AU trending items
- Google Trends AU
- AU consumer behaviour, seasonal trends, and buying patterns
- AU dropshipping logistics (CJ Dropshipping, DSers, Zendrop AU routes)
- AU import regulations, GST (10%), and customs thresholds ($1,000 AUD)
- Facebook/TikTok/Google ad strategies for AU market
- Profit margin benchmarks for AU dropshipping (target: 40-70%)

## How you respond
- ALWAYS be specific. Never say "beauty products do well" — say "LED light therapy face masks are generating $18,000-$24,000/day on TikTok Shop AU right now"
- ALWAYS include numbers: revenue estimates, margin %, price points, competition level
- ALWAYS mention the platform (TikTok Shop AU, Amazon AU, eBay AU) where the product is trending
- ALWAYS give a clear recommendation with a reason
- Keep responses concise: 3-5 bullet points or 2-3 short paragraphs max
- Use AU spelling and terminology (colour, behaviour, etc.)
- When asked about a product, give: price range, supplier cost, profit margin, competition level, why it's trending, best ad angle
- When asked about trends, give top 3 specific products with revenue data
- When asked what to sell, give 1 decisive recommendation with full rationale

## Current AU market intelligence (2025)
Top performing categories right now:
- Health & Beauty: LED therapy devices, scalp massagers, lash kits — $8k-$24k/day
- Pet: cooling mats, lick mats, smart toys — $10k-$18k/day (AU summer premium)
- Home & Kitchen: air fryer accessories, over-sink racks, standing desks — $9k-$19k/day
- Tech: smart plugs (AU standard), LED strips, GPS watches — $12k-$17k/day
- Fitness: resistance bands, portable blenders, massage guns — $11k-$15k/day

## AU-specific rules
- Always check AU relevance: does it work with AU power standards (240V), AU sizing, AU climate?
- Shipping: CJ Dropshipping AU warehouse = 4-7 days. China direct = 12-20 days (kills reviews)
- Price sweet spot: $25-$90 AUD for impulse purchases, $90-$200 for considered purchases
- GST note: products over $1,000 AUD may have import duties
- Best ad platform: TikTok for products under $60, Facebook for $60-200 range

## When to use action cards
If the user asks a broad question about getting started, finding products, or what to do next, return ONLY a JSON array (no other text) in this format:
[
  {"title": "...", "context": "...", "cta": "...", "path": "/app/..."},
  {"title": "...", "context": "...", "cta": "...", "path": "/app/..."},
  {"title": "...", "context": "...", "cta": "...", "path": "/app/..."}
]

Valid paths: /app/product-discovery, /app/trend-signals, /app/profit-calculator, /app/suppliers, /app/website-generator, /app/store-spy, /app/saturation-checker, /app/creators, /app/videos

For all other questions: respond in plain text with specific, decisive intelligence. NO JSON.

## Tone
Direct. Confident. Like a sharp business advisor who knows the AU dropshipping market inside out. Not corporate, not generic. If you don't have specific data, say "Based on current market signals..." and give your best specific estimate.

You have access to live web search and research tools. Use web_search when asked about current trends, specific store/competitor analysis, or recent market data.

${marketCtx}`;
}

function buildSystemPrompt(
  customPrompt: string | undefined,
  profile: Record<string, string> | null,
  toolName: string,
  marketCode?: MarketCode
): string {
  const isAIChat = !customPrompt || toolName === 'ai-chat';

  // Use custom prompt if provided, else check for tool-specific fallback, else use generic
  const base =
    customPrompt ||
    TOOL_FALLBACK_PROMPTS[toolName] ||
    `You are Majorka AI — a sharp, direct ecommerce co-founder.`;

  // Inject user profile context for ALL tools so responses are personalised
  const goals = profile?.main_goal?.includes(',')
    ? profile.main_goal
        .split(',')
        .map((g: string) => g.trim())
        .join(', ')
    : profile?.main_goal;

  const experienceMap: Record<string, string> = {
    beginner: 'just starting out, never sold online',
    intermediate: 'has a store, some experience',
    advanced: 'experienced seller, looking to scale',
  };

  const mc = marketCode ? MARKETS[marketCode] : MARKETS[DEFAULT_MARKET];
  const marketCtx = buildMarketContext(marketCode || DEFAULT_MARKET);

  const profileCtx = profile
    ? `USER PROFILE (tailor ALL responses to this context):\n- Name: ${profile.display_name || profile.full_name || 'there'}\n- Country: ${profile.country || mc.name}\n- Niche: ${profile.target_niche || profile.business_niche || 'not set'}\n- Experience: ${experienceMap[profile.experience_level] || profile.experience_level || 'unknown'}\n- Primary goals: ${goals || 'grow ecommerce business'}\n- Budget: ${profile.budget || 'not set'}\n- Store URL: ${profile.business_name || 'not provided'}\nIMPORTANT: You are speaking to a ${mc.name} ecommerce operator. Use ${mc.currency} for all currency, reference ${mc.name}-specific shipping (${mc.shipping.slice(0, 2).join(', ')}), BNPL (${mc.bnpl.slice(0, 2).join(', ')}), and ${mc.compliance.slice(0, 2).join(', ')} compliance where relevant.`
    : ``;

  // AI Chat gets Maya personality with tool-using rules
  if (isAIChat) {
    return buildMayaPrompt(profileCtx, marketCtx);
  }

  // Tool pages get profile context + lighter memory rules
  const toolMemoryRules = `\n\nSESSION MEMORY RULES:
- Remember what the user has told you in this conversation — their product, niche, budget, store URL.
- Build on previous answers. If they asked about a posture corrector earlier, reference it.
- Never repeat the same advice. If you already covered something, reference it and move forward.
- Relate all answers to their specific product/niche when known.`;
  return (
    base + (profileCtx ? `\n\n${profileCtx}\n${marketCtx}` : `\n${marketCtx}`) + toolMemoryRules
  );
}

export function registerChatRoutes(app: Application) {
  // ── Clear chat history ──────────────────────────────────────────────────
  app.delete('/api/chat/history', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const toolName = (req.query.tool as string) || 'ai-chat';
      if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const {
        data: { user },
      } = await getSupabaseAdmin().auth.getUser(token);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await getSupabaseAdmin()
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('tool_name', toolName);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Main chat endpoint ──────────────────────────────────────────────────
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages: rawMessages,
        message,
        systemPrompt,
        toolName = 'ai-chat',
        searchQuery,
        market: rawMarket,
      } = req.body;
      const market = (rawMarket && rawMarket in MARKETS ? rawMarket : DEFAULT_MARKET) as MarketCode;

      // ── Auth check + rate limiting for unauthenticated users ───────────
      // Check for valid Bearer token first
      const earlyAuthHeader = req.headers.authorization;
      let isAuthenticatedRequest = false;
      if (earlyAuthHeader?.startsWith('Bearer ')) {
        try {
          const token = earlyAuthHeader.slice(7);
          const {
            data: { user },
            error,
          } = await getSupabaseAdmin().auth.getUser(token);
          if (!error && user) isAuthenticatedRequest = true;
        } catch {
          /* token invalid */
        }
      }

      if (!isAuthenticatedRequest) {
        // Apply rate limit: 3 requests per hour per IP for unauthenticated users
        const ip =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket.remoteAddress ||
          'unknown';
        const { allowed, retryAfter } = rateLimit(`chat:${ip}`, 3, 60 * 60 * 1000);
        if (!allowed) {
          res.status(429).json({
            error: 'Sign up free to continue using Majorka AI',
            retryAfter,
          });
          return;
        }
      }

      // ── Observability timing ────────────────────────────────────────────
      const _opikStartTime = Date.now();

      // Accept both formats: messages array or singular message
      let messages = rawMessages;
      if (!messages && message) {
        const text = Array.isArray(message.parts)
          ? message.parts
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join('')
          : typeof message.content === 'string'
            ? message.content
            : '';
        messages = [{ role: message.role || 'user', content: text }];
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages array is required' });
        return;
      }

      // Normalise messages
      messages = messages
        .map((m: any) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: Array.isArray(m.parts)
            ? m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('')
            : typeof m.content === 'string'
              ? m.content
              : JSON.stringify(m.content),
        }))
        .filter((m: any) => m.role === 'user' || m.role === 'assistant');

      if (messages.length > 0 && messages[0].role !== 'user') messages = messages.slice(1);
      if (messages.length === 0) {
        res.status(400).json({ error: 'At least one user message is required' });
        return;
      }

      // ── Auth + memory ───────────────────────────────────────────────────
      let userId: string | null = null;
      let profile: Record<string, string> | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          const {
            data: { user },
            error,
          } = await getSupabaseAdmin().auth.getUser(token);
          if (!error && user) {
            userId = user.id;
            profile = await fetchUserProfile(userId);

            // Load persistent history for all tools so users get session continuity
            const history = await loadHistory(userId, toolName);
            if (history.length > 0) {
              messages = [...history, ...messages];
              // Deduplicate consecutive same-role messages
              const cleaned: typeof messages = [];
              for (const m of messages) {
                if (cleaned.length === 0) {
                  if (m.role === 'user') cleaned.push(m);
                  continue;
                }
                if (m.role !== cleaned[cleaned.length - 1]!.role) cleaned.push(m);
              }
              messages = cleaned.length > 0 ? cleaned : messages;
            }
          }
        } catch {
          /* not authenticated */
        }
      }

      // ── Web search context ──────────────────────────────────────────────
      let webContext = '';
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
        try {
          const tavilyKey = process.env.TAVILY_API_KEY;
          if (tavilyKey) {
            const sr = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                api_key: tavilyKey,
                query: searchQuery,
                search_depth: 'basic',
                max_results: 4,
              }),
            })
              .then((r) => r.json())
              .catch(() => null);
            if (sr?.results?.length > 0) {
              webContext = `\n\nLIVE WEB DATA:\n${sr.results.map((r: any, i: number) => `[${i + 1}] ${r.title}: ${r.content}`).join('\n')}`;
            }
          }
        } catch {
          /* non-fatal */
        }
      }

      // ── Auto-Tavily enrichment for product/trend queries (ai-chat only) ─
      if (!webContext && toolName === 'ai-chat') {
        const lastUserContent = (messages[messages.length - 1]?.content || '').toLowerCase();
        const isProductQuery =
          lastUserContent.includes('trending') ||
          lastUserContent.includes('product') ||
          lastUserContent.includes('sell') ||
          lastUserContent.includes('niche') ||
          lastUserContent.includes('winning');
        if (isProductQuery) {
          try {
            const tavilyKey = process.env.TAVILY_API_KEY;
            if (tavilyKey) {
              const autoQuery = `${messages[messages.length - 1]?.content} Australia TikTok Shop trending 2025 best sellers`;
              const sr = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  api_key: tavilyKey,
                  query: autoQuery,
                  search_depth: 'basic',
                  max_results: 3,
                }),
              })
                .then((r) => r.json())
                .catch(() => null);
              if (sr?.results?.length > 0) {
                webContext = `\n\nLIVE WEB DATA (AU product intelligence):\n${sr.results.map((r: any, i: number) => `[${i + 1}] ${r.title}: ${r.content}`).join('\n')}`;
              }
            }
          } catch {
            /* non-fatal */
          }
        }
      }

      // ── Build system prompt ─────────────────────────────────────────────
      const mayaMarketCtx = await fetchMayaMarketContext();
      const baseSystem = buildSystemPrompt(systemPrompt, profile, toolName, market) + webContext + mayaMarketCtx;

      // ── Inject mem0 persistent memories ────────────────────────────────
      const userQuery = messages[messages.length - 1]?.content || '';
      const userMemories = userId ? await searchMemories(userId, userQuery) : '';
      const system = userMemories ? `${baseSystem}\n\n${userMemories}` : baseSystem;

      // ── Determine if client wants streaming (default: true) ──────────
      const wantStream = req.body.stream !== false && req.query.stream !== '0';
      // Detect AI SDK requests (CopywriterTool, AudienceProfiler, etc. send aiSdk:true)
      const useAiSdkProtocol = req.body.aiSdk === true;
      // Tools that need more tokens for complex outputs
      const maxTokens = toolName === 'website-generator' ? 8192 : 4096;

      if (wantStream) {
        const client = getAnthropicClient();
        let fullReply = '';

        if (useAiSdkProtocol) {
          // ── AI SDK Data Stream Protocol ─────────────────────────────
          // Format: `0:"text"\n` for chunks, `d:{...}\n` for finish
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('X-Accel-Buffering', 'no');
          res.flushHeaders();

          const stream = await client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            system,
            messages,
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              fullReply += text;
              res.write(`0:${JSON.stringify(text)}\n`);
            }
          }

          res.write(`d:${JSON.stringify({ finishReason: 'stop' })}\n`);
          res.end();
        } else {
          // ── Custom SSE streaming response (AIChat, AIToolChat) ──────
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');
          res.flushHeaders();

          // ── Agentic tool loop for ai-chat (Maya) ────────────────────
          const useTools = toolName === 'ai-chat' && process.env.TAVILY_API_KEY;

          if (useTools) {
            // Agentic loop: up to 5 steps with tool calling
            type AnthropicMessage = Anthropic.MessageParam;
            const agentMessages: AnthropicMessage[] = messages.map(
              (m: { role: string; content: string }) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              })
            );

            let steps = 0;
            const MAX_STEPS = 5;

            while (steps < MAX_STEPS) {
              steps++;
              // Non-streaming call to check for tool use
              const response = await client.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: maxTokens,
                system,
                messages: agentMessages,
                tools: ANTHROPIC_AI_TOOLS,
                tool_choice: { type: 'auto' },
              });

              // Check if we have tool calls
              const toolUseBlocks = response.content.filter(
                (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
              );
              const textBlocks = response.content.filter(
                (b): b is Anthropic.TextBlock => b.type === 'text'
              );

              // If any text was returned alongside tool calls, stream it out
              for (const tb of textBlocks) {
                if (tb.text) {
                  fullReply += tb.text;
                  res.write(`data: ${JSON.stringify({ text: tb.text })}\n\n`);
                }
              }

              if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
                // No tool calls — done
                break;
              }

              // Add assistant message with tool use to context
              agentMessages.push({ role: 'assistant', content: response.content });

              // Execute each tool and collect results
              const toolResults: Anthropic.ToolResultBlockParam[] = [];
              for (const toolBlock of toolUseBlocks) {
                // Emit tool status event to frontend
                const statusMsg =
                  TOOL_STATUS_MESSAGES[toolBlock.name] || `🔧 Using ${toolBlock.name}...`;
                res.write(
                  `data: ${JSON.stringify({ toolStatus: toolBlock.name, statusMessage: statusMsg })}\n\n`
                );

                try {
                  const result = await executeTool(
                    toolBlock.name,
                    toolBlock.input as Record<string, unknown>
                  );
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolBlock.id,
                    content: result,
                  });
                } catch (toolErr: any) {
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolBlock.id,
                    content: JSON.stringify({ error: toolErr.message || 'Tool execution failed' }),
                  });
                }
              }

              // Add tool results to messages and continue loop
              agentMessages.push({ role: 'user', content: toolResults });
            }

            // If no text was generated yet (tools ran but no inline text), stream final answer
            if (!fullReply) {
              // Final streaming call after tool results are all in
              const finalStream = await client.messages.stream({
                model: CLAUDE_MODEL,
                max_tokens: maxTokens,
                system,
                messages: agentMessages,
              });

              for await (const event of finalStream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                  const text = event.delta.text;
                  fullReply += text;
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              }
            }

            res.write(`data: [DONE]\n\n`);
            res.end();
          } else {
            // ── Standard streaming (no tools) ───────────────────────────
            const stream = await client.messages.stream({
              model: CLAUDE_MODEL,
              max_tokens: maxTokens,
              system,
              messages,
            });

            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text;
                fullReply += text;
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            }

            res.write(`data: [DONE]\n\n`);
            res.end();
          }
        }

        // Save to memory (fire-and-forget)
        if (userId && fullReply) {
          const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
          if (lastUserMsg) {
            saveMessage(userId, toolName, 'user', lastUserMsg.content).catch(() => {});
            saveMessage(userId, toolName, 'assistant', fullReply).catch(() => {});
            // mem0 persistent memory — fire-and-forget
            addMemory(userId, [
              { role: 'user', content: lastUserMsg.content },
              { role: 'assistant', content: fullReply },
            ]).catch(() => {});
          }
        }

        // ── Opik observability (fire-and-forget) ───────────────────────
        if (fullReply) {
          const _opikLatency = Date.now() - _opikStartTime;
          const _opikInput = messages
            .map((m: any) => m.content)
            .join(' ')
            .slice(0, 1000);
          logTrace({
            toolName,
            userId,
            input: _opikInput,
            output: fullReply.slice(0, 2000),
            model: CLAUDE_MODEL,
            latencyMs: _opikLatency,
            market: market,
          }).catch(() => {});
          if (['product-discovery', 'meta-ads', 'meta-ads-pack'].includes(toolName)) {
            runAURelevanceEval(toolName, _opikInput, fullReply, userId).catch(() => {});
          }
        }
      } else {
        // ── Non-streaming response (legacy) ─────────────────────────────
        const client = getAnthropicClient();

        // For ai-chat, run agentic tool loop before returning final response
        let reply = '';
        if (toolName === 'ai-chat' && process.env.TAVILY_API_KEY) {
          type AnthropicMessage = Anthropic.MessageParam;
          const agentMessages: AnthropicMessage[] = messages.map(
            (m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })
          );

          let steps = 0;
          const MAX_STEPS = 5;

          while (steps < MAX_STEPS) {
            steps++;
            const response = await client.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: maxTokens,
              system,
              messages: agentMessages,
              tools: ANTHROPIC_AI_TOOLS,
              tool_choice: { type: 'auto' },
            });

            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            );
            const textBlocks = response.content.filter(
              (b): b is Anthropic.TextBlock => b.type === 'text'
            );

            if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
              reply = textBlocks.map((b) => b.text).join('');
              break;
            }

            agentMessages.push({ role: 'assistant', content: response.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const toolBlock of toolUseBlocks) {
              try {
                const result = await executeTool(
                  toolBlock.name,
                  toolBlock.input as Record<string, unknown>
                );
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolBlock.id,
                  content: result,
                });
              } catch (toolErr: any) {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolBlock.id,
                  content: JSON.stringify({ error: toolErr.message }),
                });
              }
            }
            agentMessages.push({ role: 'user', content: toolResults });
          }

          // If loop ended without a reply, do a final call
          if (!reply) {
            const finalResp = await client.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: maxTokens,
              system,
              messages: agentMessages,
            });
            reply = finalResp.content
              .filter((b): b is Anthropic.TextBlock => b.type === 'text')
              .map((b) => b.text)
              .join('');
          }
        } else {
          const aiResponse = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            system,
            messages,
          });
          reply = aiResponse.content[0]?.type === 'text' ? aiResponse.content[0].text : '';
        }

        // For JSON-expected tools, extract the JSON object from the response
        // even if the model wraps it in markdown fences or prefixes it with text
        const jsonTools = ['website-generator'];
        if (jsonTools.includes(toolName)) {
          // Try fence stripping first
          const fenceMatch = reply.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
          if (fenceMatch) {
            reply = fenceMatch[1].trim();
          } else {
            // Extract from first { to matching } (handles truncated responses too)
            const firstBrace = reply.indexOf('{');
            if (firstBrace !== -1) {
              let depth = 0;
              let end = -1;
              for (let i = firstBrace; i < reply.length; i++) {
                if (reply[i] === '{') depth++;
                else if (reply[i] === '}') {
                  depth--;
                  if (depth === 0) {
                    end = i;
                    break;
                  }
                }
              }
              // If we found a balanced JSON object, use it
              if (end !== -1) reply = reply.slice(firstBrace, end + 1);
              // If no closing brace (truncated), extract from first { to end and close it
              else if (firstBrace !== -1) reply = reply.slice(firstBrace);
            }
          }
        }

        // Save to memory (fire-and-forget)
        if (userId && reply) {
          const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
          if (lastUserMsg) {
            saveMessage(userId, toolName, 'user', lastUserMsg.content).catch(() => {});
            saveMessage(userId, toolName, 'assistant', reply).catch(() => {});
            // mem0 persistent memory — fire-and-forget
            addMemory(userId, [
              { role: 'user', content: lastUserMsg.content },
              { role: 'assistant', content: reply },
            ]).catch(() => {});
          }
        }

        // ── Opik observability (fire-and-forget) ───────────────────────
        if (reply) {
          const _opikLatency = Date.now() - _opikStartTime;
          const _opikInput = messages
            .map((m: any) => m.content)
            .join(' ')
            .slice(0, 1000);
          logTrace({
            toolName,
            userId,
            input: _opikInput,
            output: reply.slice(0, 2000),
            model: CLAUDE_MODEL,
            latencyMs: _opikLatency,
            market: market,
          }).catch(() => {});
          if (['product-discovery', 'meta-ads', 'meta-ads-pack'].includes(toolName)) {
            runAURelevanceEval(toolName, _opikInput, reply, userId).catch(() => {});
          }
        }

        res.json({ reply });
      }
    } catch (error: any) {
      console.error('[/api/chat] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  });
}
