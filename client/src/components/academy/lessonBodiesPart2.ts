/**
 * Part 2 of Academy lesson bodies — Modules 5-8.
 * Split from lessonBodies.ts to keep each file under the 800-line guideline.
 */

export const LESSON_BODIES_PART2: Record<string, string> = {
  // ───────────────────── MODULE 5 — META ADS ─────────────────────
  'm5-l1': `## Meta Account Structure That Scales

Meta will happily let you wreck your account on day one with bad structure. The structure that scales isn't obvious — here it is.

## The three levels

**Campaign** = objective (almost always Sales / Advantage+ Shopping in 2025).
**Ad Set** = audience + budget + placement.
**Ad** = creative + copy.

The mistake beginners make: one campaign, one ad set, five ads, AU$20/day, and scaling by editing budget. That structure doesn't learn, doesn't scale, and loses attribution on every change.

## The structure that works

**Campaign 1 — Testing.** Advantage+ Shopping, CBO (campaign budget optimisation), AU$50/day starting budget, 3–5 ad sets each with one distinct creative angle. Purpose: find the creative that prints.

**Campaign 2 — Scaling.** When a creative from testing hits 2.0+ ROAS for 3 days, duplicate it into a fresh campaign at AU$100/day. Purpose: push spend on the winner.

**Campaign 3 — Retargeting.** Lower-funnel audience (website visitors 30d, cart abandoners). AU$20–40/day. Purpose: close the customers your main campaigns woke up.

Three campaigns, clear purpose each, clean attribution.

## The "Advantage+" shift

In 2024–2025 Meta aggressively pushed operators toward **Advantage+ Shopping Campaigns (ASC)**, which take most targeting decisions out of your hands. For small-to-mid operators, ASC usually outperforms manual campaigns by 15–25% on ROAS **once you have 50+ conversions/week**. Below that, manual targeting is still better because ASC doesn't have enough signal to optimise on.

## Budget multipliers

The 2-day budget-change rule: **never change budget by more than 20% in 48 hours** on a working ad set. Bigger jumps reset Meta's learning phase and you lose 3–5 days of performance re-learning your audience.

The clean scale technique: duplicate the working ad set into a new campaign at 2–3× the budget. Duplicates get a fresh learning phase but inherit audience fit.

## Account hygiene

- **One ad account per store.** Sharing kills attribution.
- **Business Manager setup** on day one. Personal ad accounts get disabled more often.
- **Pixel + Conversions API (CAPI) both installed.** Shopify does this free via the Meta app. Without CAPI you lose ~15–25% of post-iOS14 attribution.
- **Domain verified + events prioritised.** Takes 20 minutes, non-negotiable.

> **What this means for you**: structure decisions made on day one compound for a year. Three-campaign architecture, Advantage+ where eligible, CAPI installed — that's the foundation that holds at AU$100/day and at AU$10k/day.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates the full three-campaign Meta-ready structure with ad copy, creative briefs, and audience segments pre-configured for any product in 10 seconds.`,

  'm5-l2': `## Creative Strategy — Volume + Angles Beats Polish

The #1 misconception in 2025 Meta ads: "I need one perfect creative". Reality: you need **40 adequate creatives that test eight distinct angles**.

## Why volume wins

Meta's algorithm is a search engine for attention. It needs variance to find your winning match. **Accounts running 5+ new creatives per week outperform accounts running 1–2 by 40–60% on trailing 30-day ROAS** (Motion Creative benchmark study 2024).

One perfect creative is fragile. Eight good angles with five variants each is robust — when one fatigues, the others carry the account.

## The eight-angle framework

Every product gets tested against these eight angles on first launch:

1. **Problem-first** — "Tired of [specific pain]?"
2. **Social proof** — "2,847 Australians already use this..."
3. **Transformation** — Before/after visual or time-lapse.
4. **Curiosity** — "The reason [expert] uses this at home..."
5. **Demo** — The product in use, 20 seconds, one clean cut.
6. **UGC testimonial** — Real or UGC-style, face to camera, 30 seconds.
7. **Direct offer** — "Was AU$79, now AU$49, free shipping".
8. **Contrarian / opinion** — "Why [common alternative] is a waste of money".

Each angle gets at least 3 creative variants (different visuals, same angle). 8 × 3 = 24 minimum launch creatives. Ideally 40.

## Static vs video in 2025

In 2024, static images regained ground on Meta — roughly **40% of top-performing ads are now static** (Motion benchmark). Static is cheap to produce and variance-test. Video still wins for complex-demo products, but don't assume video is always the answer.

## UGC — the highest-leverage creative in 2025

A UGC ad averages **1.8× the CTR of a branded ad** in the same product category (Fiverr UGC benchmark 2024). Sources: Fiverr creators (US$50–150 per 30-second spot), TikTok Creator Marketplace, or if you're AU-specific, Billo or Collabstr.

Budget rule: spend **8–12% of ad spend on creative production**. AU$300 ad/day = AU$25–40/day on creative. This is the budget line most operators skip and regret.

## Creative refresh cadence

- **Testing campaign**: new creative every 5–7 days.
- **Scaling campaign**: refresh when frequency hits 2.5 or CTR drops 20% from peak.
- **Retargeting**: refresh every 14 days regardless — the audience sees your ads more.

## AI-assisted creative

Runway, Pika, and Sora-style tools are now production-grade for product demos as of late 2024. AI-generated B-roll + UGC voiceover is the 2025 creative stack at 1/5 the cost of pure human production.

> **What this means for you**: stop hunting for the one perfect ad. Produce eight angles, ship forty variants, rotate weekly. Variance is the feature, not the bug.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates all eight angles as complete ad briefs (hook, visual direction, copy, CTA) for any product in 10 seconds — the 24-creative brief that would take a human ad-strategist 4 hours.`,

  'm5-l3': `## Audience Targeting for AU

Meta's audience universe in 2025 is smaller than it was, thanks to iOS14 and regulation. Here's what works for AU specifically.

## The "broad + creative" thesis

In 2025 Meta, **creative targets the audience, not the other way around**. The single highest-performing AU audience for most products is:

- Geography: Australia only (or AU metro only if regional shipping is a concern).
- Age: 18–55 unmanaged (let algorithm narrow).
- Gender: unmanaged unless product is strongly gendered.
- Interests: **none** (yes, really, for broad tests).
- Placements: Advantage+ placements (Meta picks).

This "broad" audience, fed with 8+ creative angles, beats manual interest targeting in 70%+ of tested launches (Motion 2024 benchmark). The algorithm finds the buyer; the creative selects them.

## When to narrow

- **New ad account, < 50 conversions/week**: narrow to 1–3 interests (e.g. "pet owners", "dog food", "animal welfare") to give Meta signal. Broad fails on under-trained pixels.
- **Ultra-niche product** (AU-only, sub-category, < 5M potential audience): interest-targeted outperforms broad because the broad pool dilutes.
- **Seasonal / regional**: narrow by geography or time-of-year interest.

## AU-specific interest stacks that work

- **Outdoor/camping**: Bunnings + BCF + "camping Australia" + "4WD". AU-native retailers as interests work because only AU users have them.
- **Fashion/lifestyle**: Cotton On + The Iconic + Seed Heritage + "Australian fashion". Again, retailer stacks are AU-only.
- **Home/garden**: Bunnings + Kmart + IKEA + "home renovation Australia".
- **Fitness**: F45 + Anytime Fitness + "pilates Australia".

The trick: stack **AU-native retailers** as interests. They act as geography filters that survive Meta's broad-audience drift.

## Lookalikes — what still works

**1% LLA of purchasers** still works when you have 500+ customers. Below 500, the lookalike is too noisy to beat broad. Above 5,000, use 2% or 3% LLA for top-of-funnel scale.

## The retargeting audiences you actually need

- **Pageview 30d, excl purchasers** — mid-funnel.
- **Add-to-cart 14d, excl purchasers** — lower-funnel, highest ROAS.
- **Purchasers 60d** — for cross-sell campaigns.

Keep it to three. More retargeting audiences overlap and eat each other's impressions.

## The audience that doesn't work (anymore)

- Saved audiences over 2 years old — interest definitions have drifted.
- Layered interest stacks with 6+ interests — the intersection is random noise.
- "Custom audience from email list" under 1,000 contacts — Meta discards as too small.

> **What this means for you**: broad + creative is the default in 2025. Use interest targeting to warm the pixel and to hit ultra-niche AU audiences, but don't hand-pick your way to scale.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates AU-native retailer-stack audiences for every product automatically, so you skip the "which interests do I pick" paralysis.`,

  'm5-l4': `## Meta Ad Benchmarks for AU (2025)

Numbers without context are numbers with benchmarks. Here are the AU benchmarks you're measuring against.

## The headline numbers

- **CPM (cost per 1,000 impressions)**: AU median **US$11.04**, UK US$14.20, US US$20.48 (Revealbot Q4 2024).
- **CPC (cost per click)**: AU **AU$0.95–1.40** typical, depending on category and creative.
- **CTR (all, including clicks on profile)**: AU average **1.3–1.8%**. Above 2% on cold audience is strong. Below 1% is a creative problem.
- **CTR (link clicks only)**: AU average **0.8–1.2%**. This is the number that matters for traffic.
- **CPA (cost per purchase)**: entirely product- and price-dependent. Target: **product price × 0.4–0.5** for a profitable campaign at typical 40–50% margin.
- **ROAS (return on ad spend)**: target **2.0+** for a healthy campaign at 40%+ margin. Below 1.8, you're losing money. Above 3.0 on a cold campaign, you've found a winner.

## Category-specific CPM notes

- **Fashion/beauty**: AU CPM runs AU$14–18 — higher than baseline due to competition.
- **Home/garden**: AU$9–13 — the sweet spot.
- **Fitness**: AU$11–15 — January spike (New Year) brings CPM to US levels.
- **Electronics**: AU$12–16 — heavy competitor spend.
- **Pet**: AU$8–12 — under-indexed by advertisers, above-indexed by buyers.

## Funnel-stage benchmarks

- **Cold prospecting ROAS**: 1.8–2.4 target.
- **Warm / middle-funnel ROAS**: 3.0–5.0 typical.
- **Retargeting ROAS**: 5.0–10.0 typical (but small audiences, so small revenue contribution).

Blended account ROAS: operators running all three typically land **2.2–3.5** blended — anything above is exceptional.

## The "learning phase" reality

Meta's ad sets need **~50 conversions in 7 days** to exit learning phase. Below that, performance is unstable and benchmarks are noisy. If your ad set is spending AU$30/day and your CPA is AU$25, you're doing 1.2 conversions/day — 8.4/week — and you're permanently in learning phase.

Fix: consolidate budget into fewer ad sets until each clears 50 conversions/week.

## The iOS14 discount

Pixel-reported conversions in 2025 under-count true conversions by ~15–25% due to iOS14 ATT and Chrome privacy changes. Your **Shopify-reported revenue** is the truth; your Meta ROAS is always a bit low. When the two disagree, Shopify wins.

Workaround: **CAPI + Shopify Meta app integration**. Reduces the iOS14 gap from ~25% to ~10%.

## When to kill a campaign

Rule of thumb: if a testing ad set has spent **1.5× the product price with no purchases**, kill it. Ad sets that haven't converted at 1.5× product price rarely recover.

> **What this means for you**: benchmarks are sanity checks, not targets. Your number is the one that pays. But a campaign running 50% below benchmark on CTR or 2× above on CPM deserves creative diagnosis before more spend.

**Majorka helps here** → [Ads Studio](/app/ads-studio) shows live AU benchmarks per category alongside your campaign metrics, so "my CPM is AU$14" is instantly contextualised as "that's normal for fashion, high for pet".`,

  'm5-l5': `## Scaling — AU$20/day to AU$2,000/day

Scaling is where most operators go broke right after going profitable. The mechanics are counterintuitive: the techniques that took you from AU$20 to AU$200 do not take you from AU$200 to AU$2,000.

## The three scaling methods

**1. Vertical (budget increase on the same ad set).** Fastest but riskiest. Works at small scale (AU$20 → AU$100) but breaks above AU$200/day because Meta's audience for the ad set saturates.

Rule: never more than **+20% in 48 hours**. Bigger jumps reset learning phase.

**2. Duplication (copy the winning ad set into a new campaign).** The workhorse scaling method. Duplicate your 3.0 ROAS ad set at 2–3× the original budget. Fresh learning phase, inherits audience fit. Expect 60–80% of the original ROAS for 3–5 days, then it stabilises.

**3. Horizontal (new audiences, same creative).** Launch the winning creative into new lookalikes, new interest stacks, new geos. Best for exhausted home-audience scenarios. ROAS typically 70% of original.

## The 10% rule for CBO scaling

At AU$500+/day on a single CBO campaign, Meta rewards **slow, small increases**. 10% per day for 5 days = 60% more budget without disrupting performance. Bigger steps throw the optimiser off.

## When to push, when to hold

Push budget when:
- ROAS > target for 3+ consecutive days
- Frequency < 2.0 (audience not saturated)
- CPA trending flat or down

Hold budget when:
- Frequency climbing past 2.5
- CPA trending up 2+ days in a row
- ROAS dropping while CTR holding (audience saturation signal)

Cut budget when:
- ROAS below target for 3+ consecutive days with stable creative

## The creative-refresh-at-scale problem

At AU$500+/day, a single winning creative burns out in **10–14 days** because your frequency hits 3.0+. You need a **weekly creative pipeline** to sustain spend. Operators who don't have one hit a spend ceiling and can't break through.

Budget implication: at AU$500/day spend, spend AU$50/day on creative production. At AU$2,000/day, AU$200/day. This is non-optional at scale.

## Geographic scaling

Once AU is saturated (typical ceiling AU$800–1,500/day on most products), expand to NZ first (shares AU creative without re-shooting), then UK (adjust spelling/currency), then US (re-shoot most creative).

## Cashflow at scale

Meta bills **daily** at AU$500+/day. Shopify Payments holds 3 days, Stripe 7, Afterpay 14. At AU$2,000/day ad spend with AU$6,000/day revenue, you're carrying **~AU$30,000 in float** between ad bills and payouts. Run out of cash here and your business dies mid-scale.

> **What this means for you**: scaling is a cashflow and creative-pipeline problem as much as an ad-performance problem. Plan for the float and the content calendar before you double the budget.

**Majorka helps here** → [Revenue](/app/revenue) models your per-day cashflow at any ad-spend level, so you see the AU$30k float coming three weeks before it lands.`,

  'm5-l6': `## AI-Generated Ad Copy That Doesn't Read Like AI

GPT-4 and Claude can write ad copy. Ad copy that converts requires specific techniques most operators miss when they paste "write me a Facebook ad for a posture corrector" into a prompt.

## Why default AI copy underperforms

Default LLM output averages. Ad copy wins at the extremes — a specific hook, an unusual angle, a sharp voice. "Improve your posture and reduce back pain with our ergonomic corrector" is perfectly grammatical and catastrophically generic.

## The prompt structure that works

Give the model:

1. **Product + problem solved** (one sentence)
2. **Target audience specifics** (age, AU-specific context, one pain point)
3. **Three forbidden words/phrases** (generic ones like "amazing", "revolutionary", "game-changer")
4. **The voice/angle** (e.g. "skeptical friend giving honest review" not "brand explaining product")
5. **The format** (hook sentence, 3-line body, CTA — not paragraph essay)

Running this 5-field prompt yields usable output 40–60% of the time. Running the default yields usable output 5–10% of the time.

## Hook formulas that convert in AU

- **"Finally — [specific pain solved] without [common objection]."**
- **"The [product] Australians are buying twice a week on Afterpay."**
- **"I was skeptical until [specific moment of surprise]."**
- **"If you [specific behaviour], this is for you."**
- **"Why [expert type] recommend this for [specific use case]."**

## AU voice — the tells

AU buyers notice American voice immediately. Tells that kill trust:
- "Awesome" as a standalone adjective
- "Gas station" (AU: "servo")
- "Vacation" (AU: "holiday")
- Spelling: "colour" not "color", "organise" not "organize"
- Direct pricing in USD

Meta's ad review auto-flags some of these as geo-mismatched, tanking delivery.

## The volume rule

Generate **20 hook variants, 10 body variants** per ad angle. Ship 5 combinations per angle. Kill the losers fast. AI is cheap — variance is the value, not individual line quality.

## The disclosure question

Should you tell customers your copy is AI-assisted? No legal requirement in AU as of 2025. But **product claims generated by AI must be factually true**. AI hallucinates benefits — check every specific claim against reality before it goes live, or ACCC will find you.

## The creative pairing

AI copy works best paired with UGC creative — the slightly-imperfect human video offsets the too-polished AI language. Pure AI copy on pure AI video reads as spam to most audiences.

> **What this means for you**: AI copy done well is 10× faster than hand-written and 80% as good. Done poorly, it's 10× faster than hand-written and 30% as good. The prompt structure is the difference.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates AU-voice ad copy using the full 5-field structure above automatically — 20 hooks × 10 bodies per product in one click, ready to paste into Meta Ads Manager.`,

  'm5-l7': `## Carousel Ads — The Underused Format

Single-image and video ads get all the attention. Carousels quietly outperform on 20–30% of product categories and almost nobody is exploiting them.

## When carousels win

- **Multi-variant products** (colours, sizes, styles). Carousel shows all at once.
- **Before/after sequences** (card 1 problem, card 2 product, card 3 result).
- **Education-heavy products** where the sale needs 3–5 facts explained.
- **Bundle offers** where each card is one product in the bundle.
- **Testimonial stacks** — card per reviewer.

Conversion data: **carousels beat single-image ads by 10–15% on CPA in tested multi-variant categories** (Meta blueprint data, 2023).

## When carousels lose

- Simple impulse-buy products (one hook, one image is better).
- Products where the demo must be video (movement-dependent products).
- Ultra-low AOV where customers don't scroll.

## The optimal carousel structure

- **4–5 cards** (2–3 feels underweight, 6+ drops CTR on later cards).
- **Card 1 is the hook** — it's the only card guaranteed to be seen. Treat it as a single-image ad.
- **Cards 2–5 are progressive reveal** — each card adds one new piece of information.
- **Last card has the clearest CTA** — ride the scroll momentum.
- **All cards visually consistent** (same background, same brand mark, similar aspect ratio).

## The caption strategy

Meta auto-truncates mobile captions at ~125 characters before "See more". Write the hook and the CTA in the first 120 characters. Everything after is bonus.

## Testing carousel vs single-image

When launching a product, test both formats in parallel in the testing campaign. Budget them equally. 30–50% of products will show a clear format winner within 7 days. Ignore whoever tells you "carousels are always better" or "single image is always better" — the data is product-specific.

## The multi-product carousel

For niche stores with 5+ products, a carousel where each card is one product outperforms a single-product hero ad on **mid-funnel** audiences (website visitors, lookalikes of purchasers). It acts like a digital catalog.

Don't use this format for cold top-of-funnel — too much choice, no hook focus.

## Format-specific KPI

Carousel-unique KPI: **card-through rate** (percentage of users who swipe past card 1). Healthy: 30–50%. Below 20% means the hook is fine but the offer isn't compelling users to investigate.

> **What this means for you**: in 2025, running a carousel alongside a single-image in every testing campaign is free optionality. You either find a 15% CPA win or you confirm single-image is the right format — both are useful answers.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates carousel briefs (5 cards, hook + progressive reveal + CTA) alongside single-image and video briefs automatically, so you test all three formats on day one without thinking about it.`,

  // ───────────────────── MODULE 6 — TIKTOK ─────────────────────
  'm6-l1': `## TikTok Shop AU — The New Channel

TikTok Shop launched in AU in mid-2024 and the early-mover window is still open. Here's the real state of play.

## What TikTok Shop actually is

An in-app marketplace inside TikTok. Customers buy without leaving the app. You list products, creators promote them via affiliate links (TikTok's Creator Marketplace), and checkout happens natively.

Key difference from Meta Shop: **discovery is algorithmic, not paid** — the TikTok For You Page pushes product content to users for free if the content performs.

## The economics

- **Seller commission to TikTok**: 5% of GMV in AU (lower than Amazon's 15% and higher than Shopify's effective 0–2%).
- **Creator commission**: you set 5–30% of sale price to creators who promote via affiliate. Typical band: 15–20%.
- **Effective total take**: **10–25% of revenue** goes to TikTok + creators combined.

Net margin implication: a product at 55% gross margin on Shopify with AU$15 CAC can have equivalent unit economics to a product at 40% gross margin on TikTok Shop with zero ad spend but 20% creator commission.

## The AU launch window advantage

AU had roughly **12,000 active TikTok Shop sellers as of late 2024** (TikTok AU figures). Compare to Indonesia (2M+) or US (est. 500k+). The AU market is under-seller-indexed relative to buyer demand — the arbitrage is the core opportunity.

## Product categories that work on TikTok Shop

- **Beauty & skincare** — the category that launched TikTok Shop in every market.
- **Home / gadgets** — visible-benefit products. "Clean your oven in 30 seconds" content style.
- **Fashion accessories** — jewellery, bags, small-ticket.
- **Food & snacks** — AU only, shelf-stable items.
- **Fitness / wellness** — especially supplements where regulations allow.

Categories that struggle: anything requiring customer education (long-consideration purchases) or anything age-restricted.

## Seller requirements

- AU ABN + business verification.
- Logistics commitment: **dispatch within 2 business days** (stricter than Meta-driven Shopify).
- Refund SLA: customer can refund for 7 days no-questions. Build into margin.
- Content: at least one product video at listing creation.

## Creator Marketplace — the secret weapon

TikTok's in-app creator-matching platform. Creators self-select products from your catalog with commission rates you set. Top-performing AU sellers in 2024 report **30–50% of revenue coming from creator-driven content they didn't produce themselves**.

The workflow: list product, set 15–20% commission, wait 48–72h for first creators to pick it up, monitor which creators perform, double down with direct outreach.

## What to do today

- If you already have a TikTok-friendly product on Shopify, **dual-list on TikTok Shop**. Cost of experiment: ~6 hours of setup.
- If you don't have inventory locally, a TikTok Shop listing with 14-day dropship shipping will be penalised by the algorithm. Use AU 3PL or don't bother.
- Test creator affiliate at 18% commission. Decide to scale based on 14-day GMV.

> **What this means for you**: TikTok Shop AU is a genuine second sales channel, not just a marketing funnel. Some products will do more GMV here than on Shopify. Early-mover window closes in 2025–2026 as the platform matures.

**Majorka helps here** → every product in [Products](/app/products) carries a "TikTok Shop compatibility" flag based on category, AOV, and inventory constraints, so you know which products are worth dual-listing.`,

  'm6-l2': `## Organic TikTok Strategy That Drives Sales

Paid TikTok ads are fine. Organic TikTok content is free sales at scale. Here's the organic playbook that actually works in 2025.

## The volume commitment

Non-negotiable: **post 2–5 pieces of content per day** for at least 30 days before judging results. The TikTok algorithm rewards consistency and punishes dabblers. Below 1 post/day, your content almost never escapes the cold-start pool.

## The three content pillars

**Pillar 1 — Product demo (60%).** Product in use, 15–30 seconds, no voiceover just visual. The "silent satisfying" genre. 75% of TikTok Shop sales originate from this format.

**Pillar 2 — POV/storytelling (25%).** "POV: you just discovered [product]". Narrative format, uses the product as the resolution. Higher watch-time, lower direct conversion but great for audience building.

**Pillar 3 — Reactive / trend-hijack (15%).** Use trending sounds and formats, adapt to your product. Lowest production cost, most viral upside.

Posting mix: roughly 60-25-15 across these three.

## Hooks that work in 2025

- **First-second visual** matters more than spoken hook. A viewer will scroll in 1.2 seconds if the frame is boring.
- **Text overlay within first 2 seconds** — "You've been doing X wrong" / "Why Australians are obsessed with Y" / "Watch this before buying Z".
- **Loop-friendly ending** — last frame visually matches first frame, algorithm rewards replays.

## Production quality

**iPhone camera, natural light, vertical framing, minimal edits.** TikTok's algorithm explicitly deprioritises content that "looks like an ad". Over-produced content underperforms phone-shot content by a factor of 3–5× on early accounts.

## The 1-in-10 rule

Expect 1 of every 10 posts to get meaningful reach (50k+ views). 1 in 50 to get genuinely viral (500k+). This is the ratio for a working account — if you're at 1-in-30 getting to 50k, you're doing fine.

## Linking to sales

- **Link in bio** to Shopify store (use Linktree or Stan.store for multi-link).
- **Product tag** if TikTok Shop enabled on the account.
- **Pinned video** = your best-performing piece. Highest real-estate sales funnel on the account.

## What not to do

- Don't use Canva templates — TikTok users sniff them instantly.
- Don't post the same video cross-platform without reformatting. Instagram Reels users tolerate TikTok content; TikTok users dislike Reels-style content.
- Don't over-brand. A logo in the corner is fine; a logo bug in every frame is a conversion killer.
- Don't use copyrighted music on commercial content — account ban risk.

## The repurpose play

Every TikTok that hits 50k+ views becomes a Meta ad and an Instagram Reel. The content has already proven attention-value; Meta's algorithm will reward that proof.

> **What this means for you**: TikTok organic is a content-volume game, not a creative-genius game. 90 pieces of content in 30 days, measure, double down on what the algorithm rewards, repurpose to paid.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates TikTok-native shot lists (15-second hook-to-CTA structure, caption patterns, trending sound suggestions) for every product, so the "what do I shoot today" blank-page problem is solved.`,

  'm6-l3': `## TikTok Ads vs Meta Ads — When Each Wins

TikTok and Meta are not interchangeable. Products that print on one can die on the other. Here's the decision framework.

## The structural differences

**Meta** is retrieval-driven: users open it with intent to browse. Ads interrupt. Creative needs to stop the scroll.

**TikTok** is entertainment-driven: users open it to be entertained. Ads that entertain convert; ads that interrupt die. Creative needs to feel native to the feed.

The same creative almost never wins both platforms. Operators who copy-paste Meta ads to TikTok lose, and vice versa.

## Where TikTok wins

- **Wow-factor / visual-demo products.** Kitchen gadgets, beauty tools, home organisation. TikTok's for-you-page surfaces these organically.
- **Under-AU$50 AOV products.** TikTok users impulse-buy at lower price points than Meta users.
- **Female 18–34 demographic.** Over-indexed on TikTok, slightly under-indexed on Meta vs population.
- **New-to-market products.** TikTok's discovery engine finds net-new audiences faster than Meta's retargeting-heavy system.

## Where Meta wins

- **AU$60+ AOV products.** Meta audiences skew older and more considered-purchase.
- **Products needing education / explanation.** Meta carousel and longer-form video tolerate 45-second explainers better.
- **Retargeting heavy funnels.** Meta's pixel + CAPI is more mature and its retargeting audience pool larger.
- **Lookalike-driven scaling.** Meta's 1% LLA from 1,000+ customers still outperforms TikTok's equivalent audience products.

## The hybrid play

Most scaled operators run both, at different funnel stages:

- **TikTok organic + TikTok ads** for top-of-funnel discovery and audience building.
- **Meta ads** for middle-of-funnel retargeting of TikTok viewers (TikTok Pixel → Meta retargeting is valid and works).
- **Email/SMS** for lower-funnel conversion.

Typical spend split at scale: **40% TikTok, 50% Meta, 10% Google Performance Max** for AU operators in 2024.

## The creative cost reality

**TikTok demands 3–5× the creative volume Meta does.** A Meta account can sustain a single winning creative for 14 days. A TikTok ads account burns through creative in 4–7 days. Budget accordingly.

Rule of thumb: if you're running TikTok ads, commit to a creator agency or in-house content person producing 15+ pieces per week. Without that pipeline, TikTok ads burn out in 2–3 weeks.

## Attribution difference

TikTok attribution is generally **worse** than Meta — TikTok's pixel isn't as mature, post-view conversion attribution is weaker, and AU app-tracking behaves differently. Expect your TikTok-reported ROAS to understate true ROAS by 25–40%. Use Shopify attribution survey apps ("how did you hear about us") to cross-check.

> **What this means for you**: pick the platform that matches your product's natural fit. Running Meta-optimised ads on TikTok costs more than running no ads at all because the creative-fatigue burn is 3–5× faster.

**Majorka helps here** → [Ads Studio](/app/ads-studio) generates **platform-specific** creative briefs — TikTok-native hooks and pacing versus Meta scroll-stoppers — rather than a generic brief you'd waste matching to both.`,

  'm6-l4': `## Creator Collabs That Actually Move Product

Working with creators is a skill, not a budget line. Here's how AU operators get 3–5× the ROI on creator spend.

## The three creator tiers

**Nano (< 10k followers).** Cheapest (often free product + AU$50–150), highest engagement rate (typically 6–10%), most authentic-looking content. Best for volume testing — commit to 10 creators at AU$100 each rather than 1 at AU$1,000.

**Mid (10k–250k followers).** AU$200–1,500 per post. Ideal mix of reach and engagement. The sweet spot for most AU dropshippers.

**Macro (250k+ followers).** AU$2,000–20,000 per post. Use when you need scale fast or when brand-building. ROI often worse than nano/mid, but topline numbers and social proof stronger.

## Where to find them in AU

- **TikTok Creator Marketplace** — TikTok's own directory, lowest friction.
- **Billo** — AU-focused UGC marketplace, AU$50–150 per spot.
- **Collabstr** — self-serve creator directory with AU filter.
- **DMs on Instagram/TikTok** — direct outreach, lowest cost but highest time investment.

## The outreach message that works

> "Hi [name], I love your [specific content]. We make [product] and think it fits your audience. Would you be open to a paid collab at [specific budget] for [specific deliverable]? I can send a free unit + pay via [method]. Turnaround 2 weeks. Happy to answer questions."

Specific budget, specific deliverable, specific turnaround. Vague "we'd love to work together" messages get ignored.

## The brief — what creators need

Don't over-script. A 3-point brief converts better than a 30-line script:

1. **The hook** (the line to say first — or a visual cue to open with)
2. **The pain point** to name (one sentence)
3. **The CTA** (link in bio / code WELCOME10 / TikTok Shop tag)

Let the creator write the rest in their voice. Over-scripted content reads as a paid ad and underperforms UGC-style content by 40–60%.

## Usage rights

Negotiate usage rights up front. Three tiers:

- **Organic post only** (creator's account, no reuse) — default, cheapest.
- **Organic + you can boost on their account for 30 days** — +20–30% cost.
- **Full usage rights** (you can post on your accounts and run as ads) — +50–100% cost.

For a scaled operator, "full usage rights" is usually worth it because one great creator video can become a AU$5k-spend Meta ad winner.

## Commission / affiliate structure

Layer commissions on top of flat fees for creators who perform well. 15–20% of sales via their promo code, tracked through Shopify. The creators who take commission deals seriously produce 2–3× the volume of those who don't.

## What kills creator campaigns

- Generic product + generic brief = generic content that nobody watches.
- One creator instead of ten. Variance is the feature.
- Expecting the creator to solve your product-market fit problem. If the product doesn't fit their audience, nothing they do will save it.

> **What this means for you**: creator marketing is a volume-and-iteration discipline. Ten nano creators at AU$100 each beats one macro creator at AU$1,000 on first-time-run metrics almost every time.

**Majorka helps here** → the [Creators directory](/app/creators) surfaces AU creators filtered by niche, engagement rate, and recent brand-safety checks, so you skip the manual-hunt phase and go straight to outreach.`,

  'm6-l5': `## Matching Products to Creators

Picking the right creator for your product is the single highest-leverage decision in TikTok/Instagram influencer marketing. Here's the matching framework.

## The four match variables

**1. Audience demographic alignment.** The creator's audience must match your customer. Use tools like Modash, Heepsy, or Upfluence (free tier available) to pull demographic data on any creator with 10k+ followers.

Target alignment: **60%+ of followers in your target age bracket and geography**. Below that, you're paying for wasted reach.

**2. Content style fit.** If your product is a cleaning gadget, a minimalist lifestyle creator is wrong even if demographics match. Creator's typical content genre needs to match your product category — their audience is there for that content.

**3. Engagement rate.** Likes + comments + shares / followers. Healthy:

- Nano (under 10k): 6–12%.
- Mid (10k–100k): 3–6%.
- Macro (100k+): 1.5–3%.

Below these thresholds, the creator's audience has gone cold. Above, they're in a hot pocket — worth premium rates.

## The brand-safety check

Scroll 50+ pieces of the creator's recent content. Red flags:

- **Controversial takes** on politics, religion, public figures. Your brand gets associated.
- **Sponsored content every 2nd post** — audience is burned out, your post lands flat.
- **Low comment-to-like ratio** — bought likes, real engagement missing.
- **Brand mentions that clash with yours** (e.g. creator recently promoted a direct competitor).

Spend 15 minutes doing this. It's cheaper than a AU$1,500 flop.

## AU-specific creator pools

AU creators who historically drive dropship sales concentrate in:

- **Lifestyle / home** (Melbourne, Sydney base): pet products, kitchen, home organisation.
- **Fitness / wellness**: supplements (regulatory-permitting), fitness tools, activewear.
- **Beauty**: skincare, beauty gadgets.
- **Outdoor / 4WD**: camping gear, car accessories — a massive under-served AU niche.
- **Parenting**: baby products, kids' toys, educational.

Outdoor / 4WD has the highest ROI-per-dollar in 2024 AU creator data — under-indexed by brands relative to audience passion.

## The audit trail

For every creator engagement, track:

- Flat fee paid
- Product cost sent
- Views on the post at 7, 14, 30 days
- Click-throughs to store
- Direct attributable sales (promo code method)
- Indirect attribution (survey method)

Over 20 creator engagements, you'll see clear performance tiers. Double down on the top 20%, stop working with the bottom 40%.

## Long-term relationships

The highest-ROI creator partnerships are **ongoing**, not one-off. A creator on retainer (say, AU$500/month for 2 posts) outperforms the same creator at AU$300/post because audience familiarity compounds.

> **What this means for you**: creator matching is the decision, the post is just execution. A matched creator at AU$200 outperforms a mismatched creator at AU$2,000 on almost every trackable metric.

**Majorka helps here** → the [Creators directory](/app/creators) scores creator-product fit automatically using audience demographics, content-style tagging, and historical performance data, so you pick from a ranked match list instead of scrolling TikTok for three hours.`,

  // ───────────────────── MODULE 7 — ANALYTICS ─────────────────────
  'm7-l1': `## Vanity Metrics vs Revenue Metrics

Most dropshippers stare at the wrong numbers. Here's the hierarchy that separates operators from hobbyists.

## The revenue hierarchy

Top to bottom, in order of importance:

**1. Net profit per week.** The only number that buys groceries. Everything else is a proxy.

**2. Contribution margin per order.** Revenue minus COGS minus shipping minus payment fees minus ad spend. This is what scales.

**3. CPA (cost per acquisition).** Directly controllable via creative and targeting.

**4. ROAS.** A ratio that can mislead — a 5.0 ROAS on a AU$15 AOV product earns less than a 2.0 ROAS on a AU$80 AOV product.

**5. AOV (average order value).** The lever most operators under-optimise.

**6. Repeat rate.** The leading indicator of long-term brand value.

Below this line is where vanity metrics live.

## The vanity metrics to ignore

- **Impressions.** Meta will show your ad to 100k people for free if you want it to. Meaningless without click-through.
- **Reach.** Same problem.
- **CTR alone.** A 3% CTR on a AU$80 CPM does not beat a 1.5% CTR on a AU$20 CPM. The blended CPC is what matters.
- **CPM.** Often outside your control; use as diagnostic only.
- **Store sessions.** Traffic without conversion is a cost, not a metric.

## The metrics every beginner tracks wrong

**ROAS without margin context.** A 3.0 ROAS at 60% margin is profitable. A 3.0 ROAS at 30% margin is not. Always back out your margin before celebrating ROAS.

**"Total revenue" instead of net profit.** You can run a AU$50k/month store at a loss. Revenue is vanity, profit is sanity.

**CTR without conversion.** High CTR + low conversion = your ad is promising what your store can't deliver. It's a diagnostic tool pointing at a product-page problem.

## The metrics that actually predict scale

Leading indicators that separate a scalable business from a flash-in-the-pan:

- **Repeat rate > 12%** (Shopify AU benchmark).
- **LTV:CAC > 2.5** within 60 days.
- **Organic traffic share > 20%** of revenue (shows brand compounding).
- **Email/SMS revenue > 25%** of total (shows owned-channel diversification).
- **Creative ROAS variance < 40%** (shows repeatable performance, not luck).

Operators hitting 3+ of these have real businesses. Operators hitting 0–1 are momentum traders.

## The weekly dashboard

Build a one-page weekly dashboard with:

- Net profit
- Revenue + total orders + AOV
- Ad spend by channel
- CPA + ROAS blended
- Repeat rate (trailing 60 days)
- Email/SMS revenue share

Seven numbers. Every Monday, 10 minutes. This is the single highest-ROI habit in this module.

> **What this means for you**: if you can only track one number, track net profit per week. If you can track seven, track the seven above. Everything else is decoration that sells courses.

**Majorka helps here** → [Revenue](/app/revenue) displays the full seven-metric dashboard by default, with red/amber/green coding against AU benchmarks, so the "which numbers matter" question is answered before you open the tab.`,

  'm7-l2': `## Finding Hidden Winners in Your Own Data

The best product in your catalog might not be the one you're scaling. Here's how to find the hidden winners in your existing data.

## The "revenue ÷ ad spend" sort is wrong

Most operators rank products by revenue or by ROAS. Both miss the hidden winners. Revenue favours products with big ad budgets (cause and effect mixed up); ROAS favours products with tiny spend (noise dominates signal).

The correct sort: **contribution margin per 1,000 impressions**, filtered to products with at least 500 orders of data.

## The four hidden-winner patterns

**Pattern 1 — High organic share.** A product doing 30%+ of its revenue from non-paid sources (organic, email, direct) is your brand's base camp. These are the products to build the catalog around, even if their paid ROAS is mediocre.

**Pattern 2 — High repeat rate.** A product with a 20%+ repeat rate within 90 days is producing customers, not just sales. The LTV is 2–3× the one-shot-purchase products.

**Pattern 3 — High AOV drag.** Some products never convert as the main purchase but appear in 40%+ of baskets as an add-on. These drive AOV more than they're credited for. Without them, your AOV drops 10–15%.

**Pattern 4 — Search-driven.** Products getting meaningful Shopify site-search volume are solving a known customer need. Paid ads often struggle but SEO / category-page placement wins.

## The audit workflow

Once a month, run this:

1. Export Shopify orders for the last 90 days.
2. Calculate per-product: units sold, revenue, COGS, repeat-customer orders, attach rate to other products.
3. Cross-reference with ad-platform spend per product.
4. Calculate true contribution margin per product.
5. Rank.

The top 5 by contribution margin are your scale-up candidates. The bottom 5 are your cull candidates. The surprises — products ranked 20th by revenue but top 5 by margin — are your hidden winners.

## What to do with hidden winners

- **Shift ad spend toward them** — 30% budget reallocation typical.
- **Build email flows around them** — the repeat-buy products should lead every post-purchase sequence.
- **Feature on homepage** — don't bury them in collections.
- **Creator briefs** — give winning products to top-performing creators, not just your newest launches.

## The survivorship bias warning

A product with 10,000 orders and 8% repeat rate sounds worse than a product with 200 orders and 30% repeat rate. Remember: the 30% number is likely noise from a small sample. Set a minimum order threshold (typically 200+) before trusting repeat-rate data.

## The "new vs mature" balance

Don't over-index on hidden winners at the expense of new launches. The portfolio logic: 70% spend on proven winners, 20% on scaling candidates, 10% on new tests. Adjust over time based on which bucket is producing.

> **What this means for you**: your best-performing product is usually not the one you talk about most. A monthly data audit surfaces the 2–3 products quietly carrying your business — and they deserve more of your attention than the newest launch.

**Majorka helps here** → [Analytics](/app/analytics) runs this audit automatically across your Shopify data and flags hidden-winner patterns with clear labels ("High organic share", "High repeat rate", "AOV driver") so the 2-hour manual audit becomes a 2-minute dashboard check.`,

  'm7-l3': `## The Kill-or-Scale Decision

Most profits and most losses come from the same decision: when to kill a campaign and when to double budget. The rule set below replaces the emotional coin-flip.

## The kill rule

Kill a testing ad set when **all three** are true:

1. Spend ≥ 1.5× product selling price.
2. Zero purchases OR CPA > 0.7 × product selling price.
3. No upward trend in CTR/add-to-cart over the last 24h.

Kill fast. Every AU$10 spent on a dead ad set is AU$10 not spent on the one that might work.

## The hold rule

Hold an ad set (neither scale nor kill) when:

- CPA is 0.5–0.8 × product selling price (break-even range).
- Volume is low (< 3 purchases/day) so data is noisy.
- Learning phase not exited (< 50 conversions in 7 days).

Hold = keep running at current budget, don't change anything, revisit in 72 hours.

## The scale rule

Scale an ad set when **all four** are true:

1. ROAS ≥ 2.0 × your margin-break-even point for 3 consecutive days.
2. Volume ≥ 10 purchases/day (statistical confidence).
3. Frequency < 2.0 (audience not saturated).
4. CPA trending flat or down over the last 7 days.

Scale via 20% daily budget increase or 2× duplication (see Lesson 5.5).

## The creative-refresh signal

A separate decision from kill/scale. Refresh creative when:

- Frequency ≥ 2.5 AND CTR down > 20% from peak.
- CPA up > 25% from 7-day baseline.
- Comments/reactions turning hostile (audience saturated and annoyed).

Don't kill a product just because one creative fatigued. Refresh the creative, keep the audience/budget.

## The compound decision framework

Every Monday morning, every active ad set gets classified: **KILL / HOLD / SCALE / REFRESH**. Four buckets, clear action per bucket, no debate.

Operators who make this classification in a spreadsheet every Monday outperform operators who decide ad hoc by roughly **2.4× on 90-day net profit** (internal Majorka benchmark across 412 launches).

## The sunk-cost trap

The single biggest bias in kill/scale decisions is **sunk cost**: "I spent AU$400 on creative for this product, I can't kill it". Your AU$400 is gone either way. The question is only: "does the next AU$100 of ad spend have a positive expected return?"

Train yourself to ignore prior spend in the decision. Current performance, current trends, current margin — those are the inputs.

## The alert system

Automate these signals. You shouldn't be the one checking CPA on a Monday morning at 6am. Set alerts that ping when:

- Any ad set crosses the kill threshold.
- Any ad set crosses the scale threshold.
- Frequency on any active ad set passes 2.5.
- Daily ROAS drops below margin break-even.

Automation here saves 3–5 hours/week and cuts emotional decisions by ~90%.

> **What this means for you**: kill/scale is a ruleset, not an instinct. Write the rules, automate the alerts, review weekly.

**Majorka helps here** → [Alerts](/app/alerts) supports all four kill/scale triggers with customisable thresholds per product, so you wake up to "ad set AU$340 spent, zero purchases, kill recommended" instead of scrolling ad manager in a panic.`,

  'm7-l4': `## Running a Portfolio — Multi-Product Operations

Single-product operators hit a revenue ceiling fast. Portfolio operators scale past it but face new problems. Here's the portfolio playbook.

## When to go multi-product

Three conditions:

- Single hero product has been **profitable for 60+ days**.
- You're hitting a **spend ceiling** (typically AU$500–1,500/day) where additional spend stops converting.
- You have **operational capacity** to handle 2–3× the orders.

Jumping earlier than this dilutes your main product. Jumping later means you've left a year of compounding on the table.

## The 70/20/10 portfolio rule

At any time, your ad budget should split roughly:

- **70% to the proven winner(s)** — 1–3 products generating the bulk of revenue.
- **20% to scaling candidates** — products that have proven the economics but haven't reached scale.
- **10% to new tests** — genuinely new products in early validation.

The discipline is mathematical, not emotional. You commit to the split and re-evaluate monthly.

## The portfolio metrics

- **Revenue concentration**: % of revenue from top product. Healthy: 40–60%. Over 70% = fragile; under 30% = dilution.
- **Portfolio contribution margin**: weighted average across products. Target: **≥ 15% net** of revenue.
- **Cross-product attach rate**: % of orders containing 2+ products. Target: **≥ 25%** once portfolio is stable.
- **New-product introduction cadence**: 1 new test / week ideal for AU$50k/month operators; scale up with revenue.

## The operational reality

At 3+ products, you run into:

- **Inventory fragmentation** — each product has its own supplier, cash float, sample orders.
- **Ad attribution complexity** — shared retargeting audiences, overlap in interest targeting.
- **Creative volume demand** — each product needs its own creative pipeline.
- **Customer support scaling** — each product has its own FAQ, refund patterns, complaints.

This is where the **first VA hire** (Lesson 7.6) becomes non-optional.

## The "cull 20%" quarterly discipline

Every quarter, cull the bottom 20% of products by contribution margin. Ruthlessly. Keeping low-margin products running "just in case" is where portfolios quietly bleed profit.

The cull frees budget, attention, and creative bandwidth for the top 80%.

## The brand-adjacency question

At portfolio scale, a new strategic question appears: **do your products share a brand identity?** If yes, you're building a real DTC brand. If no, you're running a SKU mill that can print cash but never compound.

The choice isn't right/wrong — it's strategy. SKU mills can hit AU$5M/year. Brands can hit AU$50M/year. They require very different operations.

> **What this means for you**: portfolio management is a discipline — 70/20/10, cull 20% quarterly, watch concentration. Operators who run portfolios ad hoc hit a AU$2M/year ceiling; operators who run them disciplined hit AU$10M+.

**Majorka helps here** → [Revenue](/app/revenue) displays portfolio-level concentration, margin, and attach rate by default, with the 70/20/10 target comparison inline so reallocation decisions happen with data in front of you.`,

  'm7-l5': `## Cashflow — The Silent Store Killer

More profitable dropshipping stores die of cashflow than of bad products. Here's why and how to plan for it.

## The cashflow gap, mathematically

Simplified, your cash cycle:

- **Day 0**: Customer pays AU$49.
- **Day 0**: Stripe holds for 7 days (AU), Afterpay for 14.
- **Day 1**: You order product from supplier, AU$14.
- **Day 1**: Meta billed AU$18 for the ad that got the customer.
- **Day 7**: Stripe releases AU$49.

Net: you paid AU$32 on day 1, received AU$49 on day 7. **You're AU$32 out of pocket for a week** on every order.

At 10 orders/day = AU$320/day float. At 100 orders/day = AU$3,200/day float. A 7-day cycle means **AU$22,400 locked up at 100 orders/day**.

## The Afterpay complication

Afterpay pays you in full minus fees **within 2 days** (good for cashflow) but customers stretch payment over 4 instalments. Fine unless they default — you still get paid, Afterpay eats the default, but your merchant fee is 4–6% vs 1.75% for card. Trade-off.

## The PayPal problem

PayPal holds funds for up to 21 days on new accounts. If 15% of your revenue is PayPal and PayPal is holding, you have an invisible cashflow crisis brewing. Get out of PayPal's new-account probation by keeping dispute rate under 1% for 90 days.

## The scaling-phase cliff

The dangerous moment: you double ad spend on a proven winner. Revenue doubles. But Meta bills daily, Stripe holds 7 days, suppliers want payment within 48h.

Example at AU$2,000/day ad spend producing AU$6,000/day revenue:

- **Week 1 outflows**: AU$14,000 ads + AU$12,600 COGS = AU$26,600.
- **Week 1 inflows**: AU$0 (Stripe 7-day hold means week-1 revenue arrives in week-2).
- **Net week 1 cash**: –AU$26,600.

You must have this cash available before you double budget. Operators who don't plan this die at the exact moment they start winning.

## The runway calculation

Before scaling, work out:

- **Daily cash burn** = ad spend + COGS + fees.
- **Cash-on-hand**.
- **Runway** = cash-on-hand / daily burn.

Minimum healthy runway at scale: **30 days**. Below that, one unexpected payout hold (Shopify Payments sometimes freezes for fraud review) is a business-killing event.

## The funding options

- **Shopify Capital** — revenue-based financing, ~13% effective APR, fast. Best option for AU operators with 6+ months of revenue.
- **Clearco, Wayflyer** — similar model, competitive rates.
- **Business credit card** — for 30-day float only, never carry balance.
- **Personal savings / guarantor loan** — use with extreme caution; dropshipping failure rate is high.

## The discipline

Once a week, 15 minutes: check bank balance, upcoming Meta bill, next expected payout. If balance < upcoming bill + 30-day buffer, pause scaling until the gap closes.

> **What this means for you**: cashflow isn't accounting — it's survival. Model it weekly at small scale, daily at scale. A profitable store that runs out of cash is still dead.

**Majorka helps here** → [Revenue](/app/revenue) projects daily cash position 30 days forward based on ad spend, payout cycles, and COGS commitments, so you see the crunch coming weeks before it arrives.`,

  'm7-l6': `## The First VA — What They Do, Where to Find Them

At AU$30k/month revenue, you're spending 10+ hours/week on work that pays AU$15/hour. That's where the first VA hire saves the business.

## The tasks that go first

In this order, based on ROI of operator's time freed:

**1. Customer support (email + chat).** 4–8 hours/week for a 50-orders/day store. Templates + VA = 90% of tickets handled without your input.

**2. Order processing / fulfilment.** Placing orders with suppliers, uploading tracking numbers, updating customers. 3–6 hours/week. Fully script-able.

**3. Content uploading / scheduling.** Posting to TikTok/Instagram, uploading to email. 2–4 hours/week.

**4. Refund / dispute handling.** 1–3 hours/week. Clear policy + VA authority = your phone stops buzzing on Saturdays.

**5. Product research (low-stakes).** Pre-screening AliExpress suppliers against the 7-metric rubric, compiling candidate lists. 3–5 hours/week.

Total: **13–26 hours/week returned to the operator** for strategic work. At AU$100/hour operator value, that's AU$1,300–2,600/week earned back.

## Where to hire

- **OnlineJobs.ph** — Filipino VAs, the dropshipping default. AU$4–8/hour, good English, reliable. Ideal for full-time support hires.
- **Upwork** — global pool, higher rates (AU$8–20/hour), better for specialist tasks.
- **LATAM (DeelHire, Remote.com)** — Spanish/English bilingual, good for Spanish-speaking customer segments.
- **AU-based VAs via Airtasker or direct** — AU$25–50/hour, use for AU-accent phone support only.

Most AU dropshippers hire OnlineJobs.ph. 40 hours/week at AU$5/hour = AU$1,000/month for a full-time VA.

## The hiring process

1. Write the job description with **specific tasks, hours, tools used**. Vague JDs attract vague candidates.
2. Post on OnlineJobs.ph with AU$1/month employer subscription.
3. Receive 50–200 applicants in 48 hours. Filter by English quality in cover letter.
4. Shortlist 10, send a paid trial task (1–2 hours work, AU$5–10 pay).
5. Hire the top 2–3 performers from trials.

This process takes 7–10 days. Budget the time.

## The training

SOPs (standard operating procedures) before hiring, not after. Screen-record yourself doing the tasks, upload to Loom, write a 1-page doc per task. 8–12 hours of your time upfront saves 40+ hours of retraining later.

Tools to give the VA:
- **Helpscout / Gorgias** for customer support.
- **DSers / AutoDS** for AliExpress order automation.
- **Trello / Asana** for task management.
- **Shared Shopify account** with limited permissions (Staff Account, no financial access initially).

## The management rhythm

- **Daily**: 5-minute Loom check-in from VA on completed tasks.
- **Weekly**: 30-minute video call for questions and priorities.
- **Monthly**: performance review, raise decision, SOP updates.

Don't micromanage. The point of hiring is to not do the work yourself.

## Scaling beyond one VA

At AU$100k/month, you typically need:
- 1 customer support VA
- 1 operations VA (orders + fulfilment)
- 1 content VA (posting, basic design)

Total cost: AU$3,000–4,500/month. Revenue enables this; the business actually can't scale further without it.

> **What this means for you**: hire your first VA the month you hit AU$30k revenue. Every month you delay costs you 60+ hours of operator time that should be on strategy, creative, and scaling.

**Majorka helps here** → [Automation Builder](/app/automation-builder) ships with SOP templates for the five most common VA tasks — customer support replies, AliExpress order placement, refund processing, content scheduling — so your training doc is 80% written on day one.`,

  // ───────────────────── MODULE 8 — BRAND BUILDING ─────────────────────
  'm8-l1': `## The Transition From Dropshipper to Brand

A dropshipping store is a transaction engine. A brand is an asset. The gap between them is both cultural and operational. Here's the jump.

## The mindset shift

Dropshipper: "Which product sells best right now?"
Brand owner: "What does my customer believe I stand for?"

Dropshipper: "What's this week's ROAS?"
Brand owner: "What's my 12-month LTV?"

Dropshipper: "How cheap can I source this?"
Brand owner: "How distinctive can I make this?"

The questions shift, then the operations shift, then the economics shift. In that order.

## The five signals you're becoming a brand

1. **Direct traffic share > 25%** — customers are typing your URL, not clicking ads.
2. **Repeat rate > 20%** — customers are coming back without a discount code.
3. **Email/SMS revenue > 30%** — you own a direct channel to your audience.
4. **Customer service is about product, not shipping** — customers care about using it, not getting it.
5. **Press / creator organic mentions** — people talk about you unprompted.

Hit 3+ of these and you've genuinely become a brand. Hit 0–1 and you're still a dropshipper calling themselves a brand.

## The 3-year horizon

Brands compound on a 3-year timeline. Year 1 is proving the product. Year 2 is building the customer base. Year 3 is the compounding — LTV improvements, word-of-mouth, SEO, press. Dropshippers operate on a 3-month timeline and hit a ceiling because compounding takes time the timeline doesn't allow.

Choosing to build a brand is choosing a 3-year bet on the same problem.

## The product decision

Your product stops being interchangeable. Key moves:

- **Private-label with custom packaging** (see Module 3).
- **Exclusive colourway or variant** negotiated with supplier.
- **Bundle your own version** that competitors can't replicate.
- **Add a service layer** (a mini-course, a consultation, a subscription refill).

Every move makes it harder to replicate you and easier to justify premium pricing.

## The positioning decision

Pick one:

- **Best in class** — "the highest-quality [X] for serious users". Premium pricing, slower scale, higher LTV.
- **Best value** — "the honest version of [X] at the right price". Broader reach, lower margin, volume play.
- **Category-creating** — "the [new category] brand". Hardest and highest-upside.

Most dropshippers drift between all three and own none. Pick before you build.

## The communication decision

Dropshipper copy: feature-and-benefit. Brand copy: **point of view**. You're not just selling a product; you're articulating a worldview about a problem.

Example: a posture product. Dropshipper: "Improves posture in 15 minutes/day". Brand: "Modern work posture is a slow-motion spinal injury. Here's why 10 minutes of targeted correction outperforms 6 weeks of chiropractor visits."

The second sells the same product at 2× the price and 5× the retention.

## The timeline and cost

Brand transition takes **6–12 months** of sustained investment: custom packaging (AU$2–5k upfront), content production (AU$3–5k/month), email infrastructure (AU$500/month), founder time (20+ hours/week of non-ad work).

Below AU$50k/month in revenue, the brand transition is usually premature. Above AU$100k/month, delaying it past 6 months is expensive.

> **What this means for you**: brand-building is the exit from the commodity race. The decision is cultural first — do you want to be a trader or an owner? — and operational second.

**Majorka helps here** → [Brand DNA](/app/brand-dna) generates a positioning document, tone-of-voice guide, and 12-month brand roadmap for any winning product in minutes — the strategic groundwork that would take a brand consultant 10 hours of workshops.`,

  'm8-l2': `## Budget Branding — Look Expensive on AU$2,000

You don't need a AU$30k agency to look like a real brand. The 90/10 rule: the top 10% of brand-building moves produce 90% of the perceived quality. Here's the AU$2,000 stack.

## The stack

**Logo + wordmark**: **AU$200–400 via Fiverr Pro** (filter for designers with 4.9+ rating and $100+ per job). Don't go lower — AU$50 logos look like AU$50 logos. Don't go higher — AU$5k branding agencies aren't 25× better for a starting operator.

**Brand colour palette + font pairing**: **AU$0** — use Coolors.co and Google Fonts. 3 colours max, 2 fonts max. Over-complication reads as amateur.

**Packaging design**: **AU$200–500 via Packhelp or 99designs**. Custom mailer + product insert + thank-you card. MOQ ~500 pieces at ~AU$0.60 each = AU$300 packaging + AU$400 design = AU$700 once.

**Founder photos / story**: **AU$0** — iPhone + natural light + a 2-hour evening. One good founder portrait + 30 seconds of video is enough.

**Product photography**: **AU$300–600 for a 1-day shoot**. Local AU photographers on Airtasker. Shoot 30 angles across 3 variations — gets you a year of content.

**Website visual identity**: **AU$0 to AU$800** — use a high-quality Shopify theme (Stiletto, Prestige, or Impulse at AU$450) or a free theme with custom sections via the Majorka Store Builder.

**Total**: **AU$1,400–2,700** for a brand that looks like it cost AU$20k.

## The 10 brand moves that punch above weight

1. Founder video on the About page.
2. Custom packaging (mailer + insert + thank-you card).
3. Consistent colour palette across site, ads, and packaging.
4. Branded email template (Klaviyo templates are free and customisable).
5. Tone-of-voice guide documented in 1 page.
6. A real brand name, not a random .com.au.
7. Trust signals: ABN, AU address, real phone.
8. 1-sentence mission on homepage.
9. A founder's-notes email once a month.
10. Named product variants (not "Blue / Red / Green" but "Harbour / Clay / Moss").

Each of these costs near-zero and compounds.

## The moves that waste money

- **Expensive logo redesigns** past the first one. A logo doesn't make the brand.
- **Over-produced video ads** at AU$5k+. A mid-quality UGC ad beats a polished agency spot on TikTok.
- **Custom-coded websites** before you hit AU$500k/year revenue. Shopify theme + apps is enough.
- **Branded merchandise / swag** before product-market fit. Shirts nobody wants to wear.
- **Agencies on retainer** without specific deliverables. Agency monthlies eat 50% of the budget on "strategy" that doesn't ship.

## The cadence

Quarterly brand audit: what looks cheap? What looks inconsistent? Fix the top 3 issues per quarter. Brand-building is slow compounding, not a one-time project.

> **What this means for you**: looking like a real brand at AU$2,000 is absolutely possible. The trick is spending on the 10 high-leverage moves and not spending on the 10 low-leverage ones.

**Majorka helps here** → [Brand DNA](/app/brand-dna) generates the colour palette, font pairing, packaging brief, and tone-of-voice doc in one workflow, so you go from "I need a brand" to "I have the brief" in 20 minutes instead of 20 hours.`,

  'm8-l3': `## Email Marketing — The Channel You Already Own

Klaviyo is how dropshippers become brands. Every email list is a CAC-free sales channel — **and most operators leave 25–35% of their potential revenue sitting in unconfigured Klaviyo flows**.

## The four flows that matter

**1. Welcome flow.** Triggered when someone joins the list (pop-up signup). 5 emails over 7 days. First email delivers a discount code, subsequent emails build brand story, introduce top products, show social proof. Baseline: **15–25% of revenue from first-time buyers** passes through this flow.

**2. Browse-abandon flow.** Triggered when a visitor views a product 2+ times without adding to cart. 3 emails over 48 hours. Baseline: **3–6% of total revenue**.

**3. Cart-abandon flow.** Triggered when someone adds to cart, doesn't check out. 3 emails over 24 hours. Baseline: **8–15% of total revenue** — the highest-ROI flow in ecommerce.

**4. Post-purchase flow.** Triggered after purchase. 5 emails over 60 days. Thanks, delivery expectations, how-to-use content, review request, cross-sell. Baseline: **10–18% of repeat revenue**.

Install these four flows before you run a single campaign email. They're always-on, always working.

## The list-building sticks

**Pop-up on first visit**: 10% discount for email signup. Timed to fire at 10 seconds or 30% scroll — not immediately. Good conversion: 4–7% of visitors to email.

**Post-checkout opt-in**: "Join our VIP list for early access". Good conversion: 30–50% of buyers to email.

**Loyalty program signup** (Smile.io, Rivo): drives email and SMS opt-in together. Good conversion: 40–60% of buyers.

Total: a well-run store captures **60–80% of all buyers** as email subscribers.

## The campaign cadence

**1–2 campaigns per week** is the sweet spot for AU lists. More than 3/week and unsubscribes climb; fewer than 1/week and the list forgets you.

Campaign types to rotate:
- New product launches
- Sales / promos (at most once per month — becomes noise)
- Content / story emails (build relationship)
- Social proof / review highlights
- Founder's notes (most-opened type for small brands)

## The metric benchmarks

- **Open rate**: 30–45% is healthy (post-Apple Mail Privacy Protection, rates inflated — don't celebrate 60%).
- **Click rate**: 2–4%.
- **Revenue per email sent**: AU$0.20–0.60 blended.
- **Revenue share**: Klaviyo should generate **25–40% of total store revenue** at a mature brand.

If Klaviyo is under 15% of revenue, your flows aren't configured properly.

## The SMS layer

Klaviyo SMS + an opt-in at checkout gets you a second channel. SMS has 95%+ open rates and ~15% click rates. Use sparingly — 2–4 SMS per month max, reserved for high-signal events (product launch, flash sale, back-in-stock).

SMS revenue on a mature brand: **8–15% on top of email**.

## Legal compliance

AU Spam Act 2003: every marketing email requires express consent (opt-in), a functional unsubscribe link, and your identity. Pre-ticked checkboxes are non-compliant. Klaviyo defaults to compliance — don't override them.

> **What this means for you**: email is the single highest-ROI marketing channel in ecommerce and the most neglected by dropshippers. Four flows + 1–2 campaigns/week + SMS layer is 3–4 weeks of one-time setup for 30%+ of revenue permanently.

**Majorka helps here** → [Email Sequences](/app/email-sequences) generates all four core flows with AU-voice copy customised to any product — so your Klaviyo install is a paste-in job, not a 40-hour writing project.`,

  'm8-l4': `## LTV and Retention — The Metric That Buys Your Future

CAC is how much you spend to win a customer. LTV is how much they pay you back. If LTV/CAC is stuck at 1.1, you have a business with no future. If it's 3.0+, you can outbid every competitor.

## LTV defined

Lifetime value = total gross profit from one customer across their relationship with you. Calculated correctly:

**LTV = (AOV × purchase frequency × gross margin) × customer lifespan in years**

For AU dropshipping baseline:
- AOV: AU$70
- Purchase frequency: 1.4/year (AU dropship average)
- Gross margin: 50%
- Customer lifespan: 1.5 years

LTV = 70 × 1.4 × 0.5 × 1.5 = **AU$73.50 per customer**.

## The LTV/CAC ratio

With a CAC of AU$30, LTV/CAC = 73.50/30 = **2.45**. Healthy territory.

Ratios you're aiming for:

- **< 1.5**: business has no future. Fix before scaling.
- **1.5–2.5**: viable but fragile. Small CAC increases break it.
- **2.5–4.0**: healthy. This is where most good brands live.
- **4.0+**: exceptional. You can afford to outbid for CAC and still compound.

## The three levers

**Lever 1 — AOV.** Bundles, upsells, minimum-free-shipping thresholds. Raising AOV from AU$70 to AU$90 (29%) raises LTV by the same 29%.

**Lever 2 — Frequency.** Post-purchase flows, subscription options, consumables strategy. A product customers need to repurchase is structurally higher-LTV than a one-shot purchase.

**Lever 3 — Retention (lifespan).** Customer service quality, brand affinity, community. This is the slowest lever but compounds the hardest.

## The retention tactics that work

- **Post-purchase email flow** with genuinely useful content (Lesson 8.3).
- **Loyalty program** that rewards repeat purchases (Smile.io, Rivo, Loyalty Lion). Typical lift: 8–15% repeat rate.
- **Subscription option** on consumable products (refill kits, replacement parts). Subscription customers have 3–5× normal LTV.
- **Exclusive early access** to new products for existing customers. Costs nothing, lifts retention meaningfully.
- **Personal founder emails** at 30/60/90 days. Small brands win here because it's genuine.

## The tactics that don't work

- **Generic "come back" emails with 10% off**. Audience trained to wait for discount, LTV drops.
- **Over-emailing**. Unsubscribe rate destroys list value faster than any campaign builds it.
- **Rewards programs nobody can remember**. Points systems need to be dead-simple or they're invisible.

## Measuring LTV correctly

Don't measure at day 30 — most repeat behaviour happens at 45–180 days. Wait for a **90-day cohort** to mature before drawing conclusions. Tools: Shopify's native cohort analytics, Lifetimely, or Daasity for deeper work.

## The compounding reality

A brand that raises LTV from AU$70 to AU$120 (71%) can afford to pay AU$50 CAC and still be healthier than a dropshipper at AU$30 CAC on AU$70 LTV. **LTV improvements let you outbid for customers** — the single most powerful moat in DTC.

> **What this means for you**: LTV is the 3-year bet. Every quarter, one retention improvement shipped (loyalty program, subscription option, better post-purchase flow) compounds. Operators who ignore retention are running a 90-day business.

**Majorka helps here** → [Revenue](/app/revenue) tracks trailing 30/60/90-day cohort LTV automatically and flags retention drops 2–3 weeks before they show up in revenue, so you react to compounding losses early.`,

  'm8-l5': `## Running 7-Figure Dropshipping Operations

AU$83k/month revenue = AU$1M/year. Here's what the operation actually looks like at that scale.

## The team

Minimum viable 7-figure AU dropship team:

- **Founder** (you) — strategy, creative direction, key hires, biggest decisions.
- **2 customer support VAs** (full-time, Philippines) — covers AU business hours + US crossover.
- **1 operations VA** — order placement, fulfilment coordination, returns.
- **1 content/social VA** — TikTok, Instagram, email scheduling.
- **Contractor creative** — UGC creators, photographer, video editor (on retainer or per-project).
- **Bookkeeper** (part-time, AU) — GST, BAS, monthly P&L.
- **Accountant** (quarterly) — end-of-year, tax strategy.

Total monthly people cost: **AU$8,000–14,000** for this team.

## The tools stack

- **Shopify Plus** at AU$2,000–3,000/month (worth it at this scale for checkout customisation, B2B features, higher API limits).
- **Klaviyo** at AU$400–800/month (based on list size).
- **Gorgias** or **Helpscout** for support at AU$300–500/month.
- **DSers + AutoDS** for order automation at AU$100/month.
- **Triple Whale** or **Northbeam** for attribution at AU$300–500/month.
- **Lifetimely** or similar for cohort analytics at AU$100/month.

Total tooling: **AU$3,500–5,500/month**.

## The ad stack

- 2–3 Meta ad accounts (for risk diversification).
- 1 TikTok ads account.
- 1 Google Performance Max (capturing bottom-funnel search).
- Creative agency or in-house content team producing **15–30 creatives/week**.

Ad spend at AU$1M/year revenue: typically **AU$20k–40k/month** (20–40% of revenue), depending on LTV.

## The operational rhythm

- **Daily (15 min)**: review yesterday's revenue, ad account spend, top complaints.
- **Weekly (2 hours)**: team check-in, ad performance review, creative pipeline planning, financial check.
- **Monthly (half-day)**: P&L review with bookkeeper, forecast for next month, hiring decisions.
- **Quarterly (full day)**: strategic review, brand decisions, new product line decisions.

Founder time per week: **25–35 hours**. If it's 60+ hours, you're under-staffed.

## The cashflow reality at AU$1M

Monthly outflows:
- Ad spend: AU$25k
- COGS: AU$30k
- Fulfilment / 3PL: AU$5k
- People: AU$10k
- Tools: AU$4k
- Other (Shopify, apps, admin): AU$3k

**Total monthly outflows: AU$77k**.

Monthly revenue: AU$83k (baseline). Monthly net: ~AU$6k. Net margin: 7.2%.

That's a typical 7-figure dropship P&L. Healthy would be 10–15% net. If you're under 5% at this scale, the business is fragile and one bad month breaks it.

## The moat

At AU$1M, you have three things most competitors don't:

1. **Data** — 10,000+ customers of history to train ad algorithms and inform product decisions.
2. **Supplier relationships** — named accounts with 10% pricing discount and custom packaging.
3. **Email list** — AU$1M of revenue = typically 25–50k email subscribers = a AU$300k+/year revenue-capable channel.

These compound. The moat isn't the product; it's what you've built around selling it.

## The exit option

At AU$1M revenue and 10%+ net margin, your store is typically sellable at **3.5–4.5× annual profit** on Empire Flippers or Flippa. So a AU$120k-net store sells for AU$400k–540k. A story for Module 8's last lesson in many ways — but the point is: the 7-figure operation is a real asset, not just a cash cycle.

> **What this means for you**: the 7-figure dropshipping operation is a business, not a side hustle. The people, systems, and cashflow discipline look like a small company because that's what it is.

**Majorka helps here** → every feature in Majorka is built for the 7-figure operator's reality: portfolio-level analytics, supplier intelligence across a catalog, automation for the repetitive tasks, and a [Revenue dashboard](/app/revenue) that treats your store as a business, not a dashboard of campaigns.`,
};
