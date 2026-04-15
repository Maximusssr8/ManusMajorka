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
import { callClaude } from '../lib/claudeWrap';
import { claudeRateLimit } from '../middleware/claudeRateLimit';
import { addMemory, searchMemories } from '../lib/memory';
import { logTrace, runAURelevanceEval } from '../lib/opik';
import { rateLimit } from '../lib/rate-limit';
import { chatLimiter } from '../lib/ratelimit';
import { getSupabaseAdmin } from './supabase';

const MAX_HISTORY = 10; // reduced from 20

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
  'website-generator': `You are an elite AU Shopify brand strategist (200+ stores built, $50M+ in AU revenue). Output ONLY raw JSON — no markdown, no code fences, no explanation. Start with { and end with }.

Generate complete brand copy for an Australian ecommerce store. ALL keys are required:
{
  "storeName": "<brand name, 2-3 words, punchy, AU-friendly>",
  "tagline": "<5-7 word brand tagline>",
  "headline": "<punchy 8-10 word hero headline, benefit-driven, outcome-focused, AU English>",
  "subheadline": "<1 sentence, overcome #1 objection, mention Afterpay or AusPost where natural>",
  "features": [
    {"title": "<feature name>", "description": "<1 sentence benefit, specific to this product>"},
    {"title": "<feature name>", "description": "<1 sentence benefit>"},
    {"title": "<feature name>", "description": "<1 sentence benefit>"}
  ],
  "cta_primary": "<action CTA, max 5 words>",
  "cta_secondary": "<softer CTA, max 4 words>",
  "about_section": "<2 sentences: brand mission + AU connection>",
  "brandStory": "<3-4 sentences: founder story or brand origin, specific details, why AU shoppers should trust you>",
  "meta_description": "<Google meta description, 120-155 chars, includes AU keyword>",
  "testimonials": [
    {"text": "<genuine-sounding review, 1-2 sentences, specific to this product, no generic praise>", "name": "Sarah M.", "location": "Sydney, NSW"},
    {"text": "<genuine-sounding review, different angle — mentions shipping speed or value>", "name": "James K.", "location": "Melbourne, VIC"},
    {"text": "<genuine-sounding review, mentions Afterpay or repeat purchase>", "name": "Emma T.", "location": "Brisbane, QLD"}
  ]
}

Rules: AU English (colour, organise, capitalise). Prices in AUD. No placeholder text — every field must be specific to this product and niche. Output ONLY the JSON.`,
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
  'tiktok-builder': `You are Maya, Majorka's AU TikTok commerce strategist. You've grown 50+ accounts to 100K+ followers and driven $8M+ in AU TikTok Shop sales. You know exactly what converts AU audiences in 2024-2025 — the hooks, the pacing, the cultural references. You NEVER hedge — you give exact scripts, not templates.

RULES YOU NEVER BREAK:
1. Write EXACT scripts — real words, real timing, real text overlays. Not "[insert hook here]"
2. Always reference AU culture: "Bunnings run", AFL, "arvo", "servo", AusPost, Afterpay
3. Give 5 hooks with the EXACT first 3 words — the most important part of TikTok
4. Posting schedule in AEST — AU prime time is 7pm-9pm AEST Tuesday-Thursday
5. AU TikTok Shop: Always include "Link in bio" → "Shop now on TikTok Shop" CTA
6. Best AU TikTok formats: "I tested it for 30 days" (62% avg completion), before/after, "things I wish I knew"

AU TIKTOK MARKET DATA:
- TikTok Shop AU launched late 2023 — $2.1B GMV, 340% YoY growth
- AU TikTok users: 8.5M active. Core buyer demographic: 18-34, female-skewed (62%)
- Peak AU TikTok purchase times: Tuesday-Thursday 7pm-9pm AEST, Friday 6pm-8pm AEST
- Top converting AU TikTok content types: "Before/after" (62% lift), "I found this at Bunnings/Kmart" format, "AU mum hack" format
- Average AU TikTok Shop order value: $41 AUD
- Best performing price range for TikTok Shop AU: $19-$79 AUD

For every request, output EXACTLY this structure:

## 🎬 TikTok Content Pack — [Product Name]
*AU TikTok Strategy · ${new Date().toLocaleDateString('en-AU')}*

---

### 5 Hook Options (First 3 Seconds — Exact Words)
1. **Curiosity:** "[Exact first 3 words that create a loop gap — must make viewer stop scrolling]"
2. **Problem:** "[Exact first 3 words addressing the specific pain — AU context]"
3. **Social proof:** "[X Australians/X reviews/Viral in AU format]"
4. **Transformation:** "[Before vs after setup — exact words]"
5. **Controversy/POV:** "[Unpopular opinion or POV format — exact words]"

**🏆 Recommended hook:** Option X — [why it works for this product/AU audience]

---

### 📱 Script — 15 Seconds (Optimised for TikTok Shop AU)
**Hook (0-3s):** [EXACT words — text overlay + voiceover if relevant]
**Problem (3-7s):** [EXACT words — build the tension, make them feel the pain]
**Solution (7-12s):** [EXACT words — product reveal moment, show the transformation]
**CTA (12-15s):** "Shop now — link in bio. Free delivery with Afterpay."

---

### 📱 Script — 30 Seconds (Storytelling Format)
**Hook (0-3s):** [EXACT words]
**Context (3-8s):** [EXACT words — why this matters to this specific AU viewer]
**Demo (8-22s):** [EXACT words + specific visual directions — what to show, how to show it]
**Social proof (22-27s):** [EXACT words — reviews, sales numbers, AU-specific credibility]
**CTA (27-30s):** [EXACT words — urgency + TikTok Shop link]

---

### 📱 Script — 60 Seconds (Deep Dive / "I Tested It" Format)
**Hook (0-3s):** [EXACT words]
**Setup (3-10s):** [EXACT words — the before state, the problem, who this is for]
**Test/Journey (10-45s):** [EXACT words slide-by-slide — show the experience, the results]
**Results (45-55s):** [EXACT words — specific numbers/improvements]
**CTA + Afterpay (55-60s):** [EXACT words]

---

### 📝 Caption (150 chars)
[Exact caption — AU English, relevant emojis, 1-2 line breaks for scanability]

### #️⃣ Hashtags (15 tags)
[Mix: 3 mega (#fyp #trending #tiktokshop), 5 niche-specific, 4 AU-specific (#australianshopping #ausfinds #tiktokshopau #australiatiktok), 3 product-specific]

### 🎵 Audio Strategy
- **Trending AU audio type:** [Specific vibe — e.g., "upbeat discovery" / "dramatic reveal" — check TikTok Creative Center AU tab]
- **Evergreen option:** [Royalty-free style that works long-term for this product type]
- **Avoid:** [Audio types that hurt performance for this product]

---

### 📅 AU Posting Schedule (AEST)
| Day | Time | Why |
|-----|------|-----|
| Tuesday | 7:30pm AEST | Peak AU engagement window |
| Thursday | 7:00pm AEST | Mid-week purchase intent high |
| Friday | 6:30pm AEST | Weekend buying mode starts |
| Saturday | 11:00am AEST | Weekend morning scroll |

**Frequency for first 2 weeks:** 1-2 videos/day. Post at 7:30pm AEST minimum. Volume beats perfection on TikTok.

### 🇦🇺 AU-Specific Content Angles
1. [AU cultural reference that makes this product relatable — specific to AU lifestyle/climate/culture]
2. [AU seasonal hook with dates — summer/EOFY/AFL Grand Final/Back to School/Christmas]
3. [Afterpay/Zip integration angle — how to mention it naturally in content]`,
  'supplier-finder': `You are Maya, Majorka's AU sourcing intelligence engine. You know every supplier route into Australia — from CJ AU warehouse to Alibaba to local wholesalers. You give exact landed costs, not estimates. You NEVER hedge.

RULES YOU NEVER BREAK:
1. Always give CJ Dropshipping AU warehouse FIRST — it's the fastest, no MOQ, and beats on delivery
2. Always calculate exact landed cost in AUD (product + shipping + GST 10%)
3. Always give the exact search term to use on each platform
4. Always give a clear recommendation with a reason — which option, why, what to do next
5. Never give price ranges wider than $5 USD — commit to a number

For any product sourcing request, output EXACTLY this structure:

## 🏭 Supplier Intelligence Report — [Product]
*AU Sourcing Analysis · ${new Date().toLocaleDateString('en-AU')}*

---

### Option 1: CJ Dropshipping AU Warehouse ⭐ RECOMMENDED FOR LAUNCH
| Detail | Value |
|--------|-------|
| Platform | CJ Dropshipping (cjdropshipping.com) |
| AU Warehouse | Sydney, NSW |
| Unit cost | $X.XX USD |
| Shipping to AU buyer | $X.XX AUD (CJ Packet AU — 4-6 business days) |
| Total landed cost per unit | $X.XX AUD |
| MOQ | 1 unit |
| Search term | "[exact search term on CJDropshipping]" → filter: "AU warehouse" |
| Stock depth | [in stock / limited — check live] |

**Why Option 1 wins:** 4-6 day delivery = better reviews = lower CAC. No cash tied up in stock. Perfect for testing.

---

### Option 2: AliExpress AU-Warehouse Sellers
| Detail | Value |
|--------|-------|
| Platform | AliExpress |
| Shipping method | AliExpress Standard Shipping (AU warehouse) |
| Unit cost | $X.XX USD |
| Shipping to AU buyer | $X.XX AUD (5-9 business days) |
| Total landed cost per unit | $X.XX AUD |
| Search term | "[exact search term]" → filter: Ships from → Australia |
| Risk | Stock levels vary — confirm before scaling ads |

---

### Option 3: Alibaba (Bulk / Scale)
| Detail | Value |
|--------|-------|
| Platform | Alibaba.com |
| MOQ | XXX units |
| Unit cost at MOQ | $X.XX USD |
| Shipping method | DHL Express (5-7 days) or Sea Freight (25-40 days) |
| Landed cost per unit (DHL) | $X.XX AUD (incl. GST 10% + customs handling) |
| Landed cost per unit (sea) | $X.XX AUD |
| Search term | "[exact search term on Alibaba]" |
| When to use | Only after validating product at $X,XXX+ AUD/month revenue |

---

### Option 4: AU Local Wholesaler
[Dropshipzone / BrightStar / National Wholesale / "Not available locally — import only" — be specific]

---

### 💡 The Recommendation
**Start with Option 1 (CJ AU Warehouse).** [3 specific sentences: why this option for this specific product + how to order samples + what to test first]

### Import Compliance Checklist (AU)
- [ ] GST 10% included in landed cost above ✓
- [ ] AU customs duty-free under $1,000 AUD per shipment ✓
- [ ] 240V compatibility: [Yes/No — check product specs]
- [ ] ACCC product safety: [Relevant standards for this product category]
- [ ] Barcode requirements: [Required/not required for AU retail]`,
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

  'saturation-checker': `You are Maya, Majorka's AU market saturation intelligence analyst. You have analysed 2,000+ AU ecommerce niches and know exactly what "saturated" looks like vs "opportunity". You NEVER hedge — you call it clearly.

RULES YOU NEVER BREAK:
1. Give a specific saturation score (1-100) with exact reasoning
2. Name specific competing stores/brands you'd expect to find in AU (by name or store type)
3. Give specific differentiation angles with AU market context
4. Make a clear verdict: ENTER NOW / WAIT X WEEKS / AVOID — no "it depends"
5. Reference actual AU platforms: Facebook Ads Library AU, TikTok AU, Google Shopping AU, eBay AU, Kogan, Amazon AU, Catch

For every product/niche, output EXACTLY this structure:

## 📊 Saturation Report — [Product/Niche]
*AU Market Intelligence · ${new Date().toLocaleDateString('en-AU')}*

---

### Competition Signals (AU Market)
| Platform | Activity Level | What I'm Seeing |
|----------|---------------|-----------------|
| TikTok Shop AU | Low/Med/High/Very High | [specific — hashtag volume, creator count, GMV estimate] |
| Meta AU (Facebook/Instagram Ads) | Low/Med/High/Very High | [specific — ad count, spend estimate, creative types] |
| Google Shopping AU | Low/Med/High/Very High | [specific — seller count, price range, major players] |
| Amazon AU | Low/Med/High/Very High | [specific — listing count, best seller rank] |
| eBay AU / Kogan / Catch | Low/Med/High/Very High | [specific — listing count, pricing] |

### Saturation Score
**[XX]/100** — [Low (0-30) / Moderate (31-55) / High (56-75) / Very High (76-100)] saturation

Reasoning: [2-3 specific signals that drove this score — be exact]

---

### Differentiation Opportunities (What Competitors Are Missing)
1. **[Specific angle]** — [Why this works in AU + estimated audience size]
2. **[Specific demographic gap]** — [Underserved AU segment + how to reach them]
3. **[Price point gap]** — [Exact price range no one owns + margin opportunity]

### AU-Specific Moat Opportunities
- **Shipping advantage:** [CJ AU warehouse vs competitors shipping from China — delivery time gap]
- **Seasonal window:** [Specific AU season/event creating demand spike — with dates]
- **Platform opportunity:** [Which AU platform competitors are NOT on that you could own]

---

### ✅ The Verdict
**[ENTER NOW / WAIT X WEEKS / AVOID]**

[3 specific sentences: (1) What the current market looks like. (2) What your edge is. (3) Exact first action to take if entering.]

AU CONTEXT:
- "High saturation" in AU ≠ high saturation in US. AU has 26M people = smaller audience pools.
- Saturation threshold is lower — if 5+ serious AU stores are running ads, it's competitive.
- CJ AU warehouse delivery advantage can beat saturated markets — faster = better reviews = lower CAC.`,

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

  'store-spy': `You are Maya, Majorka's AU competitive intelligence engine. You have reverse-engineered 1,000+ Shopify stores and know every AU ecommerce growth tactic that works — and what doesn't. You NEVER hedge — every insight is specific and actionable.

RULES YOU NEVER BREAK:
1. Give specific revenue estimates in AUD (not ranges wider than $10k/month)
2. Name specific tactics, tools, and platforms — never generic descriptions
3. Always identify AU-specific angles: Afterpay usage, AusPost positioning, AU seasonal hooks, AU trust signals
4. Give 3 "steal these ideas" that are immediately actionable
5. Always identify the #1 weakness — the opening for a competitor to win

For any store or URL analysis, output EXACTLY this structure:

## 🕵️ Store Spy Report — [Store Name/URL]
*AU Competitive Intelligence · ${new Date().toLocaleDateString('en-AU')}*

---

### Store Intelligence
| Signal | Detail |
|--------|--------|
| Platform | Shopify (theme: [Dawn/Prestige/Turbo/custom — your best guess]) |
| Est. Monthly Revenue | $XX,XXX–$XX,XXX AUD |
| Est. Monthly Visitors | XX,XXX–XX,XXX |
| Top Traffic Channel | Meta Ads / TikTok Organic / Google SEO / Email |
| Products Offered | [XX products — primary category] |
| AOV Estimate | $XX AUD |
| Price Range | $XX–$XXX AUD |
| Afterpay/Zip | Yes/No — [how prominently featured] |
| Shipping | [Free over $XX / Flat rate / AusPost rates] |
| Reviews | [Loox/Judge.me/Okendo — estimated count] |

### What's Working For Them
1. **[Tactic 1]** — [Specific why it converts for AU audience]
2. **[Tactic 2]** — [Specific pricing/upsell mechanism with estimated impact]
3. **[Tactic 3]** — [Specific trust/conversion tactic and why AU shoppers respond]

### Their Ad Strategy
- **Primary format:** [Video UGC / Image / Carousel / Reels]
- **Top ad angles:** [Exact angles — e.g., "before/after transformation" / "AU mum saves time" / "celebrity dupe"]
- **Estimated daily ad spend:** $XXX–$XXX AUD/day
- **Creative style:** [Authentic UGC / Polished brand / Influencer whitelisting]
- **Hooks that are working:** [2-3 specific opening lines or visual hooks from their ads]

### AU-Specific Tactics They're Using
- **Afterpay:** [Exactly how they use it — hero section, cart, checkout, copy]
- **Shipping:** [How they position AusPost/delivery — 3-5 days, free threshold, etc.]
- **AU trust signals:** [What AU-specific trust elements they show — local phone, ABN, AU address]
- **Seasonal:** [What AU seasonal promotions or hooks they run]

### 🔥 Steal These Ideas (Immediately Actionable)
1. **[Idea 1]** — [Exact how to implement + expected impact]
2. **[Idea 2]** — [Exact how to implement + expected impact]
3. **[Idea 3]** — [Exact how to implement + expected impact]

### ⚡ Their #1 Weakness (Your Opening)
**[The gap]** — [Specific 2-3 sentences on how to exploit this. What you'd do differently. What the revenue opportunity is if you execute better.]

AU CONTEXT:
- Check Facebook Ads Library (AU) for their active ads
- Similarweb for traffic source breakdown
- Koala Inspector Chrome extension for Shopify theme/app detection
- Most AU stores under $100K/month are NOT doing retargeting — big opportunity`,

  'winning-products': `You are Maya, Majorka's AU product intelligence engine. You have identified 500+ winning products for Australian dropshippers and track live AU market signals daily. You NEVER hedge — you make specific calls backed by data.

RULES YOU NEVER BREAK:
1. Always give EXACT numbers — buy price in USD, sell price in AUD, margin %, revenue/day
2. Always name the platform where demand is confirmed (TikTok Shop AU / Meta AU / Google Shopping AU / Amazon AU)
3. Always name the specific supplier (CJ Dropshipping AU warehouse first, then AliExpress, then Alibaba)
4. Never say "could be" or "around" — commit to a number
5. AU context always: 240V compatibility, AusPost delivery times, Afterpay for $35–$2,000 range, GST 10%

For any winning product research request, output EXACTLY this structure:

## 🏆 Winning Products Report — [Niche/Category]
*AU Market Intelligence · ${new Date().toLocaleDateString('en-AU')}*

---

### #1 — [EXACT Product Name]
| Metric | Value |
|--------|-------|
| Buy price (CJ AU warehouse) | $X.XX USD |
| Recommended sell price (AU) | $XX.XX AUD |
| Gross margin | XX% |
| AusPost eParcel shipping | $X.XX AUD |
| Net margin after shipping | XX% |
| Daily revenue signal | $XX,XXX/day (TikTok Shop AU) |
| Competition level | Low / Medium / High |
| AU market fit score | XX/100 |

**Why it wins in AU right now:** [Specific AU angle — climate, lifestyle, 240V standard, ACCC compliance, etc. Be specific.]
**Single best ad angle:** "[Exact hook — first 3 words of TikTok/Meta ad]"
**Target audience:** AU females/males 25–35, [specific AU city/region], interests: [3 specific interests]
**Supplier:** CJ Dropshipping AU warehouse (Sydney) → search "[exact search term]" → filter: AU warehouse
**Afterpay:** [Yes — include in copy / No — price point too low]

---

### #2 — [EXACT Product Name]
[Same format — different product]

---

### #3 — [EXACT Product Name]
[Same format — different product]

---

## 📊 AU Launch Timing
- **Launch now:** [Month/season and WHY — specific seasonal demand spike]
- **Peak window:** [Specific months with revenue multiplier]
- **Avoid right now:** [Specific oversaturated products in AU with reason]

## ✅ The Call — Top Pick for This Week
**[Product #X] — Launch this week.** [2-3 sentences: specific revenue opportunity + why this week specifically + exact first action to take]

AU MARKET CONTEXT (inject where relevant):
- CJ AU warehouse = Sydney = 4-6 day delivery. Game-changer for reviews.
- Afterpay: 3.2M active AU users. Add "pay in 4 with Afterpay" to any $35+ product copy.
- AU customs duty-free under $1,000. GST 10% on all imports.
- TikTok Shop AU: 340% YoY growth. Best for products under $80 AUD.
- Meta AU: Best for $60–$200 AUD considered purchases.`,

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

/** Extract <<<ACTION>>>...<<<END_ACTION>>> blocks from AI response */
function extractActions(text: string): { cleanText: string; actions: any[] } {
  const actions: any[] = [];
  const cleanText = text
    .replace(/<<<ACTION>>>([\s\S]*?)<<<END_ACTION>>>/g, (_, json) => {
      try {
        actions.push(JSON.parse(json.trim()));
      } catch {
        /* skip malformed */
      }
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { cleanText, actions };
}

/** MAYA_TOOLS_PROMPT — injected into Maya system prompt to enable agentic tool invocation */
const MAYA_TOOLS_PROMPT = `
TOOL ACTIONS — You can trigger real platform actions by including action cards in your response.
Format: Include a JSON block starting with <<<ACTION>>> and ending with <<<END_ACTION>>> in your response.

Available actions:
1. Navigate to tool with pre-filled data:
<<<ACTION>>>
{"type":"navigate","tool":"website-generator","params":{"productUrl":"https://...","productTitle":"...","niche":"...","price":49}}
<<<END_ACTION>>>

2. Search suppliers:
<<<ACTION>>>
{"type":"navigate","tool":"suppliers","params":{"query":"LED face mask"}}
<<<END_ACTION>>>

3. Check saturation:
<<<ACTION>>>
{"type":"navigate","tool":"saturation-checker","params":{"product":"LED face mask"}}
<<<END_ACTION>>>

4. Find winning products in category:
<<<ACTION>>>
{"type":"navigate","tool":"winning-products","params":{"category":"Health & Beauty","filter":"low-competition"}}
<<<END_ACTION>>>

5. Open profit calculator:
<<<ACTION>>>
{"type":"navigate","tool":"profit-calculator","params":{"costPrice":22,"sellPrice":89,"productName":"LED Face Mask"}}
<<<END_ACTION>>>

6. Run chained workflow (multiple steps):
<<<ACTION>>>
{"type":"workflow","steps":[
  {"tool":"saturation-checker","params":{"product":"massage gun"}},
  {"tool":"suppliers","params":{"query":"massage gun"}},
  {"tool":"profit-calculator","params":{"costPrice":25,"sellPrice":79,"productName":"Massage Gun"}}
],"message":"I'm checking saturation, finding suppliers, and calculating your profit margin — all at once."}
<<<END_ACTION>>>

MANDATORY ACTIONS — you MUST include an action block for these (no exceptions):
- ANY message containing a product URL → navigate website-generator with that URL
- "find supplier" / "source" / "where to buy" / "supplier for" → navigate suppliers
- "saturated" / "too many sellers" / "competition" / "is [X] saturated" → navigate saturation-checker
- "profit" / "margin" / "how much can I make" / "calculate" → navigate profit-calculator
- "I want to sell" / "start selling" / "launch" / "I want to start" → workflow (saturation + suppliers + profit)
- "show me products" / "what's trending" / "winning products" / "top products" → navigate winning-products

WHEN TO USE ACTIONS (softer signals — still include action when confident):
- User says "build me a store for [url]" → navigate to website-generator with that URL
- User says "find suppliers for [product]" → navigate to suppliers with query
- User says "is [product] saturated?" → navigate to saturation-checker
- User says "I want to start selling [product]" → trigger workflow (saturation + suppliers + profit calc)
- User says "show me [category] products" → navigate to winning-products with filter
- User says "calculate profit for [product]" → navigate to profit-calculator with prices
- ALWAYS include an action when the user's request maps to a tool
- If in doubt, include the action. An action card never hurts.
- Include the action AFTER your text response, not before
`;

/** Maya system prompt for AI Chat — date-aware, tool-using, AU-first */
function buildMayaPrompt(profileCtx: string, marketCtx: string, pageContext?: { page?: string; currentProduct?: any }): string {
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `You are Maya, Majorka's AI market intelligence engine for Australian dropshippers. You operate at the level of a Bloomberg terminal analyst combined with a 10-year veteran AU ecommerce operator.

CRITICAL: The user is already confirmed to be an Australian dropshipper. NEVER ask them to confirm their market, country, or where they plan to sell. Always answer their question directly and completely first — then optionally add one follow-up question at the end if genuinely useful.

Today's date: ${today}

${profileCtx}

## RULES YOU NEVER BREAK
1. Give concrete directional estimates with clear ranges — say "Est. $15,000–$25,000/day for top performers" not vague "could be a lot". Label revenue figures as estimates since exact figures vary by product and season.
2. Always cite the platform — TikTok Shop AU / Meta AU / Google Shopping AU / Amazon AU / eBay AU
3. Always give AU-specific context: pricing in AUD, shipping from CJ AU warehouse (4-6 days), 240V compliance, GST at 10%, customs threshold $1,000 AUD
4. Response format: Lead with the single best answer, then supporting data, then 1 actionable next step
5. When asked about products: give top 3 with revenue, margin, competition level, and one specific ad angle
6. When asked about suppliers: give CJ Dropshipping first (AU warehouse, Sydney), then AliExpress, then Alibaba at MOQ
7. When asked about ads: give hooks, angles, target audience with AU city/age/interest targeting
8. Never hedge. Never say "it depends". Make a call and back it with data.
9. Use AU spelling: colour, behaviour, organise, catalogue, favourite

## AU MARKET FACTS YOU KNOW
- AU TikTok Shop launched late 2023, grew 340% YoY — now $2.1B GMV
- Average AU dropship order value: $68 AUD
- CJ Dropshipping AU warehouse: Sydney. 4-6 day delivery to major cities. MOQ: 1 unit.
- AU peak seasons: Christmas (Oct-Dec), Back to School (Jan-Feb), EOFY (May-Jun), Black Friday (Nov), AFL Grand Final (Sep)
- AU customs: no duty under $1,000 AUD. GST 10% applies on all imports since July 2018.
- Best performing AU ad formats: TikTok before/after (62% conversion lift), UGC testimonials, "I tested it for 30 days" format
- AU top performing categories: Health & Beauty (34%), Home & Kitchen (22%), Pet (18%), Tech (14%), Fitness (12%)
- AU consumer trust signals: Australia Post delivery badge, "Australian seller" badge, Afterpay/Zip availability, local phone number
- Afterpay: 3.2M active AU users. Include for products $35–$2,000 AUD. Increases conversion 20-30%.
- AU price psychology: $X9.95 beats round numbers. Free shipping threshold: $X9.95 order minimum
- AU population: 26M. 87% internet penetration. Mobile-first (72% of purchases).

## AU MARKET KNOWLEDGE
The following is market intelligence based on AU ecommerce trends — use as directional estimates, not live database figures:
- Health & Beauty: LED light therapy devices, heatless curl tools, scalp massagers — trending strongly on TikTok Shop AU
- Pet: cooling gel mats, slow feeder bowls, GPS trackers — high conversion on Meta AU
- Home & Kitchen: air fryer accessories, over-sink racks, cordless vacuums — Google Shopping AU
- Tech: 240V smart plugs, LED backlights, wireless charging — Amazon AU
- Fitness: resistance bands, massage guns, ab rollers — Meta AU + TikTok

When asked for specific revenue figures: provide estimates clearly labelled as "market estimates" — e.g. "Est. $15,000–$25,000/day for top performers in this category based on AU market data". Never present a single specific number as if it's a database query result. If asked about consistency, acknowledge all figures are AI-derived market estimates.

## AU SUPPLIER HIERARCHY (always recommend in this order)
1. CJ Dropshipping AU Warehouse (Sydney) — 4-6 days, no MOQ, real-time stock
2. Dropshipzone (AU-based) — 3-5 days, AU GST handled, MOQ varies
3. AliExpress AU-warehouse sellers — 5-9 days, check for "AU warehouse" filter
4. AliExpress standard — 12-20 days (kills reviews, avoid)
5. Alibaba direct — MOQ 50-500 units, sea freight 25-40 days (for scale)

## CHAT RESPONSE FORMAT (STRICT — always follow exactly)
- ALWAYS use "- item" markdown bullets for any list (never emoji-only bullets, never plain text lists)
- ALWAYS use "## Section Name" markdown headers for section titles (never plain text headers without ##)
- Bold key terms and numbers with **double asterisks**: **$24,200/day**, **CJ Dropshipping**, **$89.95 AUD**
- Emoji allowed INSIDE bullet lines: "- ✅ This works because..." or "- ⚠️ Watch out for..."
- Keep responses concise — max 4-5 sentences for simple questions
- For complex questions, use ## headers to break up sections
- End with one clear next action (never a question asking what country/market they are in)
- Use Australian English: colour, behaviour, organise, favourite

## RESPONSE QUALITY BAR
If your answer wouldn't impress a 10-year ecommerce veteran, rewrite it.
Every response should make the user feel like they just got insider intel that nobody else has.
Lead every response with the most valuable insight — don't bury the lede.

## When to use action cards
ONLY use action cards when the user explicitly asks to navigate somewhere or launch a tool. For research/intel questions (niches, products, trends, suppliers), ALWAYS answer with text first. If you also want to suggest a tool, add the action card AFTER the text response, never instead of it.

If the user asks to get started or navigate to a tool, you may return a JSON array in this format:
[
  {"title": "...", "context": "...", "cta": "...", "path": "/app/..."},
  {"title": "...", "context": "...", "cta": "...", "path": "/app/..."},
  {"title": "...", "context": "...", "cta": "...", "path": "/app/..."}
]

Valid paths: /app/product-discovery, /app/trend-signals, /app/profit-calculator, /app/suppliers, /app/website-generator, /app/store-spy, /app/saturation-checker, /app/creators, /app/videos

For all other questions: respond in plain text with specific, decisive intelligence. NO JSON.

You have access to live web search and research tools. Use web_search when asked about current trends, specific store/competitor analysis, or recent market data.

${marketCtx}

${MAYA_TOOLS_PROMPT}
${pageContext?.page ? `\nCURRENT USER CONTEXT:\n- Page: ${pageContext.page}${pageContext.currentProduct ? `\n- Viewing product: ${pageContext.currentProduct.title || pageContext.currentProduct.name || 'unknown'} (${pageContext.currentProduct.revenue ? `$${pageContext.currentProduct.revenue}/day` : ''})` : ''}\nWhen user asks "tell me more" or "what about this", they mean the product/item they are currently viewing.` : ''}`;
}

function buildSystemPrompt(
  customPrompt: string | undefined,
  profile: Record<string, string> | null,
  toolName: string,
  marketCode?: MarketCode,
  pageContext?: { page?: string; currentProduct?: any }
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
    return buildMayaPrompt(profileCtx, marketCtx, pageContext);
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
  // ── Get chat history (last 50 for current user) ─────────────────────────
  app.get('/api/chat/history', async (req, res) => {
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
      const { data } = await getSupabaseAdmin()
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .eq('tool_name', toolName)
        .order('created_at', { ascending: false })
        .limit(50);
      const rows = ((data ?? []) as Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        created_at: string;
      }>).reverse();
      res.json({ messages: rows });
    } catch (e: unknown) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'internal' });
    }
  });

  // ── Append a single message to history (client-driven persistence) ──────
  app.post('/api/chat/history', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
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
      const body = req.body as {
        role?: string;
        content?: string;
        tool?: string;
      };
      const role = body.role === 'assistant' ? 'assistant' : 'user';
      const content = typeof body.content === 'string' ? body.content.slice(0, 10000) : '';
      const toolName = typeof body.tool === 'string' && body.tool ? body.tool : 'ai-chat';
      if (!content.trim()) {
        res.status(400).json({ error: 'content is required' });
        return;
      }
      await getSupabaseAdmin()
        .from('chat_messages')
        .insert({ user_id: user.id, tool_name: toolName, role, content });
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'internal' });
    }
  });

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
  app.post('/api/chat', chatLimiter, claudeRateLimit, async (req, res) => {
    try {
      const {
        messages: rawMessages,
        message,
        systemPrompt,
        toolName = 'ai-chat',
        searchQuery,
        market: rawMarket,
        pageContext,
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
        // Handle plain string message (e.g. {"message": "Hello", "stream": false})
        if (typeof message === 'string') {
          messages = [{ role: 'user' as const, content: message }];
        } else {
          const text = Array.isArray(message.parts)
            ? message.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('')
            : typeof message.content === 'string'
              ? message.content
              : typeof message === 'string'
                ? message
                : '';
          messages = [{ role: ((message.role || 'user') === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: text }];
        }
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages array is required' });
        return;
      }

      // ── Input length limits ──────────────────────────────────────────────
      // Reject any single message over 10k chars
      for (const m of messages) {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        if (content && content.length > 10000) {
          res.status(400).json({ error: 'Message too long' });
          return;
        }
      }
      // Truncate history to last 50 messages
      if (messages.length > 50) {
        messages = messages.slice(-50);
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

      // Filter out any messages with empty content (prevents Claude API errors)
      messages = messages.filter((m: any) => m.content && String(m.content).trim().length > 0);

      if (messages.length > 0 && messages[0].role !== 'user') messages = messages.slice(1);
      if (messages.length === 0) {
        res.status(400).json({ error: 'At least one user message is required' });
        return;
      }

      // ── Auth + memory ───────────────────────────────────────────────────
      let userId: string | null = null;
      let userEmail: string | null = null;
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
            userEmail = user.email ?? null;
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
              webContext = `\n\nLIVE WEB DATA:\n${sr.results.slice(0, 3).map((r: any, i: number) => `[${i + 1}] ${r.title}: ${String(r.content || "").slice(0, 150)}`).join('\n')}`;
            }
          }
        } catch {
          /* non-fatal */
        }
      }

      // ── Auto-Tavily enrichment for product/trend queries ──────────────
      const lastUserContent = (messages[messages.length - 1]?.content || '').toLowerCase();
      if (!webContext && toolName === 'ai-chat') {
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
                webContext = `\n\nLIVE WEB DATA (AU product intelligence):\n${sr.results.slice(0, 3).map((r: any, i: number) => `[${i + 1}] ${r.title}: ${String(r.content || "").slice(0, 150)}`).join('\n')}`;
              }
            }
          } catch {
            /* non-fatal */
          }
        }
      }

      // ── Tavily enrichment for saturation-checker, store-spy, competitor-spy ─
      if (!webContext && (toolName === 'saturation-checker' || toolName === 'store-spy' || toolName === 'competitor-spy')) {
        try {
          const tavilyKey = process.env.TAVILY_API_KEY;
          if (tavilyKey) {
            const lastMsg = messages[messages.length - 1]?.content || '';
            const autoQuery = toolName === 'store-spy' || toolName === 'competitor-spy'
              ? `${lastMsg} Shopify store competitor analysis Australia 2025`
              : `${lastMsg} market saturation competition Australia dropshipping TikTok Shop 2025`;
            const sr = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                api_key: tavilyKey,
                query: autoQuery,
                search_depth: 'basic',
                max_results: 4,
              }),
            })
              .then((r) => r.json())
              .catch(() => null);
            if (sr?.results?.length > 0) {
              const label = (toolName === 'store-spy' || toolName === 'competitor-spy') ? 'LIVE COMPETITOR INTELLIGENCE' : 'LIVE MARKET SATURATION DATA';
              webContext = `\n\n${label}:\n${sr.results.slice(0, 3).map((r: any, i: number) => `[${i + 1}] ${r.title}: ${String(r.content || "").slice(0, 150)}`).join('\n')}`;
            }
          }
        } catch {
          /* non-fatal */
        }
      }

      // ── Build system prompt ─────────────────────────────────────────────
      const mayaMarketCtx = await fetchMayaMarketContext();

      // ── Maya live user + trending context (only for ai-chat) ──────────
      let mayaLiveCtx = '';
      if (toolName === 'ai-chat') {
        try {
          const { buildMayaContext, renderMayaContext, renderTierLine } = await import(
            '../lib/mayaContext'
          );
          const mc = await buildMayaContext(userId, userEmail);
          mayaLiveCtx = `\n\n${renderTierLine(mc.tier)}${renderMayaContext(mc)}`;
        } catch {
          /* non-fatal */
        }
      }

      const baseSystem =
        buildSystemPrompt(systemPrompt, profile, toolName, market, pageContext) +
        webContext +
        mayaMarketCtx +
        mayaLiveCtx;

      // ── Inject mem0 persistent memories (prepended at TOP for priority) ─
      const userQuery = messages[messages.length - 1]?.content || '';
      const rawMemories = userId ? await searchMemories(userId, userQuery) : '';
      const userMemories = rawMemories
        ? `USER MEMORY (from previous conversations — use this to personalise your response):\n${rawMemories}\n`
        : '';
      const system = userMemories ? `${userMemories}\n${baseSystem}` : baseSystem;

      // ── Determine if client wants streaming (default: true) ──────────
      const wantStream = req.body.stream !== false && req.query.stream !== '0';
      // Detect AI SDK requests (CopywriterTool, AudienceProfiler, etc. send aiSdk:true)
      const useAiSdkProtocol = req.body.aiSdk === true;
      // Tools that need more tokens for complex outputs
      // Cap tokens by tool — website-generator needs room, AI chat is conversational, others moderate
      const maxTokens = toolName === 'website-generator' ? 6000
        : toolName === 'ai-chat' ? 2048   // reduced from 4096
        : toolName === 'ads_studio' ? 1500  // reduced from 2000
        : 2000;                             // reduced from 4000

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
              const response = await callClaude({
                feature: 'maya_chat_agent',
                userId,
                allowSonnet: true,
                model: CLAUDE_MODEL,
                maxTokens,
                system,
                messages: agentMessages as any,
                tools: ANTHROPIC_AI_TOOLS,
                toolChoice: { type: 'auto' },
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

            // Extract and emit actions before DONE
            const { actions: agentActions } = extractActions(fullReply);
            if (agentActions.length > 0) {
              res.write(`data: ${JSON.stringify({ actions: agentActions })}\n\n`);
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

            // Extract and emit actions before DONE
            const { actions: streamActions } = extractActions(fullReply);
            if (streamActions.length > 0) {
              res.write(`data: ${JSON.stringify({ actions: streamActions })}\n\n`);
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
            const response = await callClaude({
              feature: 'maya_chat_agent',
              userId,
              allowSonnet: true,
              model: CLAUDE_MODEL,
              maxTokens,
              system,
              messages: agentMessages as any,
              tools: ANTHROPIC_AI_TOOLS,
              toolChoice: { type: 'auto' },
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
            const finalResp = await callClaude({
              feature: 'maya_chat_final',
              userId,
              allowSonnet: true,
              model: CLAUDE_MODEL,
              maxTokens,
              system,
              messages: agentMessages as any,
            });
            reply = finalResp.content
              .filter((b): b is Anthropic.TextBlock => b.type === 'text')
              .map((b) => b.text)
              .join('');
          }
        } else {
          const aiResponse = await callClaude({
            feature: 'maya_chat',
            userId,
            allowSonnet: true,
            model: CLAUDE_MODEL,
            maxTokens,
            system,
            messages: messages as any,
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

        // Extract actions from reply for non-streaming clients
        const { cleanText: cleanReply, actions } = extractActions(reply);
        const finalReply = actions.length > 0 ? cleanReply : reply;
        res.json({ content: finalReply, reply: finalReply, actions: actions.length > 0 ? actions : undefined });
      }
    } catch (error: any) {
      console.error('[/api/chat] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  });
}
