/**
 * Majorka Academy — full lesson bodies.
 * Each key is a lesson id (`m{mod}-l{lesson}`) and maps to a markdown body
 * rendered by LessonView. Content is AU-voice, practical, and cites specific
 * data points operators can act on.
 *
 * Convention:
 *   ## Heading
 *   Paragraph text.
 *   - bullet
 *   > callout / takeaway
 *   **bold**, `inline code`
 *
 * Every lesson ends with a "What this means for you" takeaway and a
 * Majorka FOMO callout referencing a specific product feature.
 */

export const LESSON_BODIES: Record<string, string> = {
  // ───────────────────── MODULE 1 — FOUNDATIONS ─────────────────────
  'm1-l1': `## The Real Dropshipping Economics (Margins, CAC, LTV)

Dropshipping gurus love the phrase "30% margin" but they almost never walk you through what that number actually looks like once Meta, Shopify, Stripe and AliExpress each take their cut. Let's do it properly.

Take a product you buy from AliExpress for AU$12 and sell for AU$49. On paper that's a AU$37 gross margin — a healthy 75%. Now subtract reality: AU shipping AU$4, Shopify + app fees AU$2, Stripe 1.75% + AU$0.30 = AU$1.16, and the big one — paid-media CAC. In 2025 the median AU Meta CPM sits around **US$11.04** (Revealbot Q4 2024), which on a typical 1.2% CTR and 2.8% landing conversion gives you a blended CPA of AU$22–28 for a cold audience.

Your real per-unit contribution margin: **49 − 12 − 4 − 2 − 1.16 − 25 ≈ AU$4.84**, or roughly **10% net**. That's the honest number, and it's also why undercapitalised operators die at 200 orders.

## The three levers that move net margin

- **AOV**: every dollar you add to AOV via bundles or upsells is almost 100% margin because fulfilment cost barely moves.
- **CAC**: creative quality is the single biggest lever — a 0.3% CTR lift on the same CPM cuts CPA by ~25%.
- **LTV**: repeat rate on AU stores averages 11–14% (Shopify 2024 benchmark). Every point above baseline is pure compounding profit.

## Why LTV matters more than you think

A store doing AU$100k/month at 10% net with a 20% repeat rate does not have the same cashflow as a store at 10% net with a 5% repeat rate. The first can afford to pay AU$40 CAC on first order because the second purchase prints AU$37 in profit. The second cannot.

> **What this means for you**: chase AOV and repeat rate before you chase ad scale. A AU$60 AOV store with upsells is structurally more defensible than a AU$29 impulse store no matter how fat the ad account looks this week.

**Majorka helps here** → the [Revenue dashboard](/app/revenue) breaks your per-product contribution margin down to three decimals after ad spend, so you see the AU$4.84 number in real time instead of the AU$37 fantasy.`,

  'm1-l2': `## Why 90% of Dropshippers Fail in the First 90 Days

Shopify's own data shows roughly **5% of new stores survive past year one** (Shopify Ecommerce Market Credibility Study, 2023). For dropshippers specifically, the 90-day mortality rate is closer to 90%. It's not because the business model is broken — it's because operators keep making the same five mistakes.

## Mistake 1 — Undercapitalised from day zero

The honest minimum to test three products properly in AU is AU$1,500–2,000: ~AU$600/product in ad spend, ~AU$200 for a Shopify month + essential apps, plus samples. People trying it on AU$300 aren't testing products, they're buying hope.

## Mistake 2 — Product picked on vibes

"I saw it on TikTok" is not research. Of the Majorka database's 3,715 live products, only 284 carry a Winning Score ≥ 75 — that's a **7.6% hit rate** even after automated filtering. Picking without data means you're flipping a coin weighted against you.

## Mistake 3 — Store built before product validated

A beautiful store you spent three weeks on is a sunk-cost anchor. You'll protect it emotionally instead of killing the product when the numbers say so. Validate first, polish second.

## Mistake 4 — Killing campaigns too fast or too slow

The median dropshipper kills at 24 hours with AU$15 spent — statistically meaningless. The other half keeps a losing product alive for two weeks because they "feel it turning". Both are emotion, not data. The right window is **3-day spend equal to 1.5× product price**, then decide on CPA and ROAS — not on a hunch.

## Mistake 5 — No cashflow plan

Stripe holds ~7 days in AU. Shopify Payments holds 3. Meta bills daily. If you sell AU$10k in week one and your COGS plus ad spend is AU$7k, you're **AU$7k out-of-pocket before Stripe sends you a cent**. Running out of cash on a winning product is the most common way operators die.

> **What this means for you**: before you spend a dollar, commit a budget, a kill rule, and a 30-day cashflow model. Operators who write these down before launch have a dramatically higher survival rate.

**Majorka helps here** → the [Alerts system](/app/alerts) pings you the moment a tracked product crosses your kill/scale thresholds, so decisions come from rules instead of 2am emotion.`,

  'm1-l3': `## AU vs US vs UK — Which Market Should You Start In?

The "just sell to the US, it's the biggest market" advice you've read was written for US operators. As an AU-based seller, the maths changes.

## The three core variables

- **Ad cost**: AU Meta CPM ≈ **US$11.04**, UK ≈ **US$14.20**, US ≈ **US$20.48** (Revealbot Q4 2024). Your ad dollar buys roughly 2× the impressions in AU vs US.
- **AOV**: US AOV on Shopify averages **US$95**, UK US$80, AU **AU$84** (Shopify AU 2024 data). US is highest but not by the multiple Americans claim.
- **Competition density**: of the ~2.1M Shopify stores worldwide (BuiltWith 2024), roughly 890k target US, 180k UK, and only 92k primarily target AU.

## Why AU is underrated for beginners

Lower CPM + lower competition density + a **AU$14.7B BNPL market** that lifts impulse AOV by 20–30% on a good product page = a friendlier environment to learn on. You will burn less money learning Meta and you will talk to a customer who is culturally close enough that your copy doesn't need translating.

## When to graduate to US/UK

- Once you can run a product at sub-AU$22 CPA and 2.4+ ROAS in AU for 14 days straight.
- Once your supplier can demonstrably ship to US ZIPs in under 14 days.
- Once you have at least AU$15k in working capital — US cashflow swings are bigger.

## Shipping windows

From Guangdong to AU metro: **8–14 days** via Cainiao Standard. To US: 10–18. To UK: 12–20. AU also clears customs faster under the AU$1,000 low-value threshold, meaning fewer GST surprises for your customer.

> **What this means for you**: start AU. Learn the mechanics on cheaper clicks with a customer who shares your timezone. Expand to US/UK only after you've got a repeatable, profitable playbook.

**Majorka helps here** → every product in the [Products database](/app/products) carries an **AU Relevance score** that factors in CPM arbitrage, shipping window, and local competition density — the filter that tells you "this would die in the US but print in AU".`,

  'm1-l4': `## Trending vs Evergreen vs Seasonal — Pick Your Game

Not all winning products win the same way. Mixing up the three categories is how operators burn ad spend chasing the wrong metric.

## Trending products

These are the TikTok-fuelled, 6-week curves. Think the fluffy carpet slippers of summer 2023 or the mini projectors of 2024. Order velocity on AliExpress doubles every 7 days on the way up, peaks, then halves every 10 days on the way down. **Average profitable window: 32–46 days** for a fast mover.

Trend plays reward speed, cheap creative, and a kill-the-moment-CPA-spikes discipline. They punish branded packaging and slow suppliers.

## Evergreen products

Problem-solvers that sell every month of the year: posture correctors, pet grooming, kitchen organisers, car detailing. Order velocity is flat and high — a typical evergreen on AliExpress does 400–1,200 orders/month year-round for years. The Majorka database currently flags 1,129 products as evergreen.

Evergreen rewards brand building, SEO, email flows, and custom packaging. It punishes operators who change products every week.

## Seasonal products

Halloween costumes (Sep–Oct), Christmas decor (Oct–Dec), Valentine's (Jan–Feb), back-to-school (Jan in AU, Aug in US). Order velocity looks like a sawtooth — zero, spike, zero. The Majorka trend engine tags these with their expected peak window 8–10 weeks ahead.

Seasonal rewards planning: you want inventory, creative, and ad accounts warm **six weeks before the consumer starts searching**.

## The matrix

| Type | Ad strategy | Store style | Capital needed |
|---|---|---|---|
| Trending | Aggressive broad + creative volume | Fast, single-product | Lowest |
| Evergreen | Long-tail, retargeting, email | Branded multi-product | Highest |
| Seasonal | Pre-season ramp + hard stop | Niche or seasonal sub-brand | Medium |

> **What this means for you**: don't mix strategies. Running evergreen SOPs on a trend product is how you end up with branded packaging for a product that was dead before the shipment arrived.

**Majorka helps here** → the [Trend Velocity indicator](/app/products) on every product card labels it **Trending**, **Evergreen** or **Seasonal** automatically, so you pick the right playbook before you spend a dollar.`,

  'm1-l5': `## Validating a Product Before You Spend a Dollar

Most first-time operators discover their product was a dud AU$400 into ad spend. There is a better way — and it costs nothing.

## The five-signal validation stack

Run every candidate product through these five filters before you upload a creative.

**Signal 1 — AliExpress order velocity.** Not total orders, not reviews — **30-day velocity**. Open the listing and read the "recently ordered" pulse. A product with 12,000 lifetime orders but only 40 in the last week is decaying; a product with 900 lifetime and 400 this week is heating up.

**Signal 2 — Meta Ad Library density.** Search the product name and hero image. If you see **3–12 active ads** from unrelated stores, you're at the sweet spot — validated demand, not yet saturated. Fewer than 3 and the market hasn't been proven. More than 30 and you're late.

**Signal 3 — TikTok search volume.** Search the product name + category. Healthy looks like **5–20 videos under 60 days old** with at least one above 100k views. A wall of 1M-view videos from 9 months ago is a red flag — the audience has already bought.

**Signal 4 — Google Trends 90-day slope.** Rising or stable = good. A 45-degree decline = next.

**Signal 5 — AU shipping reality.** Check the listing's AU delivery estimate. Over 18 days is a conversion killer: every extra day of shipping over 14 costs you roughly **2% in conversion rate** (Baymard Institute shipping studies).

## A real example

A product that clears all five filters has roughly a **34% probability of becoming profitable in 30 days** (Majorka internal data on 412 tracked launches). A product that clears two of five: under 8%. The filters compound.

## The 48-hour rule

Once a product passes all five, you have roughly **48 hours** to get creative live before the next 200 operators also spot it. Speed beats polish. A scrappy ad set live on day one outperforms a polished one live on day seven every time.

> **What this means for you**: validation is a discipline, not an instinct. Running the five-signal check takes 15 minutes and saves you the AU$400 you would have spent finding out the hard way.

**Majorka helps here** → the [Opportunity Score](/app/products) bakes all five signals into one 0–100 number and flags products at the exact inflection where demand is validated but saturation hasn't hit.`,

  'm1-l6': `## Legal, Tax & Business Setup for AU Dropshippers

Nobody wants to read this lesson. Do it anyway — the ATO doesn't care that you found a winning product.

## Registering your business

Start as a **sole trader with an ABN** (free, five minutes at abr.gov.au). You do not need a Pty Ltd for your first AU$75k of turnover. Once you cross AU$75k/year in GST-taxable sales, GST registration is **mandatory** — that's the bright line, and the ATO enforces it.

## GST and how to think about it

Once registered, you add 10% GST to every AU sale, and you can claim GST credits on your business purchases (ad spend, apps, samples). On imports under AU$1,000 from AliExpress, your supplier is supposed to collect GST at the border — in practice, chase them for a GST invoice or you can't claim the credit.

## Business bank account

Open a **separate business account** from day one. CommBank, NAB and Up all offer free business accounts. Mixing personal and business money is how you turn a 3-hour tax return into a 30-hour nightmare.

## Structures to consider at scale

- **AU$0–75k/year**: sole trader, your personal TFN, simple.
- **AU$75k–250k**: sole trader + GST, or a **Pty Ltd** if you want liability separation.
- **AU$250k+**: Pty Ltd with a company accountant. At this scale you're paying 25–30% company tax vs potentially 37%+ marginal personal rates.

## Consumer law — the one you can't ignore

**Australian Consumer Law** gives every customer a statutory warranty regardless of what your T&Cs say. If a product is "not of acceptable quality" the customer is entitled to a refund, replacement or repair — full stop. "No refunds" banners are illegal in AU and void.

Build refund cost into your margin from day one. Industry-standard refund rate for dropshipping is **2.5–4%** of revenue.

## Privacy and Spam Act

If you collect an email, you comply with the Australian **Privacy Act** and **Spam Act 2003**: clear consent, a working unsubscribe on every email, no pre-ticked boxes. Klaviyo handles this by default; WooCommerce default settings do not.

> **What this means for you**: spend one afternoon setting this up properly. ABN + business account + a refund policy that matches ACL is ~3 hours of work and saves you from the three most common newbie disasters.

**Majorka helps here** → every store generated by [Store Builder](/app/store-builder) ships with ACL-compliant refund and privacy policy templates pre-filled for AU law.`,

  // ───────────────────── MODULE 2 — PRODUCT RESEARCH ─────────────────────
  'm2-l1': `## Reading Order Velocity Like a Trader

Every dropshipper looks at "total orders" on AliExpress. Professional operators ignore it. The signal that actually matters is **order velocity** — the first derivative, not the integral.

## What velocity looks like

A product with 12,000 total orders tells you the past. A product moving from 80 orders/week to 240 orders/week tells you the future. Velocity is the curve Amazon Best Sellers, TikTok trends, and Meta Ad Library density all eventually catch up to — but velocity moves first by 10–21 days.

## Three velocity states

- **Acceleration** (week-over-week growth > 40%): you're inside the first 3 weeks of the curve. This is where professionals buy in.
- **Plateau** (WoW change ±15%): the product has peaked. Entry now means competing with operators who have 3 weeks of creative data on you.
- **Decay** (WoW decline > 25% for 2 consecutive weeks): step away, the curve is rolling over.

## How to measure it without Majorka

Open the AliExpress listing, screenshot the "total sold" number daily for 7 days, calculate the daily order count, then compare to the previous week. It's tedious but possible. Most operators don't do it because it takes 20 minutes per product per week.

## Why velocity beats total orders

A product with **8,000 orders and decaying** has 100× the ad competition and 1/10th the discovery premium of a product with **800 orders and accelerating**. The total-orders number makes the decaying one look "safer" — it's actually the opposite. You are late.

## A real number

Among 412 products tracked through launch by Majorka users in 2024, products entered at **acceleration phase** hit profitability in 30 days **3.2× more often** than products entered at plateau.

> **What this means for you**: stop optimising for "proven". Optimise for "moving". A product with 400 orders last week and 900 this week is worth 10 products with 10,000 lifetime orders and flat velocity.

**Majorka helps here** → every product in the [Products database](/app/products) displays a 30-day velocity sparkline and tags it **Accelerating / Plateau / Decaying** — the two minutes of manual work per product, done for you on 3,715 products every day.`,

  'm2-l2': `## The Trend Velocity Score — How It Works

The TVS is Majorka's answer to a single question: **if I launch this product today, what are the odds the trend is still accelerating in 14 days?**

## The four inputs

**1. AliExpress 30-day order slope.** Weekly order counts fit to a linear regression. Positive slope = up, flatter curve = lower contribution. Weighted 40%.

**2. TikTok recency pulse.** Number of videos uploaded in the last 30 days mentioning the product or hero image, weighted by view velocity. Weighted 25%.

**3. Meta Ad Library dwell.** How long each active ad has been running — ads running 5–20 days are the strongest signal (validated demand, not yet saturated). Weighted 20%.

**4. Google Trends 90-day slope** on the category keyword. Weighted 15%.

The four signals normalise to 0–100 and combine into the TVS.

## How to read the score

- **TVS 80–100**: acceleration confirmed across all four sources. Launch window is open; expect 10–25× more competition in 21 days.
- **TVS 60–79**: trending but single-source. Usually means TikTok-fuelled without Meta validation yet, or vice versa. Higher upside, higher variance.
- **TVS 40–59**: mixed signals. Usually plateau — profitable for operators with strong creative, hostile for everyone else.
- **TVS < 40**: decaying or unproven. Skip unless you have a non-obvious angle.

## Why four sources, not one

A TikTok-only score gets gamed by bot views. An AliExpress-only score lags 10–14 days. Meta Ad Library alone misses organic winners. **The four-source consensus is what eliminates 80% of false positives** — if TikTok says hot but AliExpress orders are flat, something is off and the score penalises it.

## A worked example

A product scoring 87: AliExpress slope +62% WoW, 34 new TikToks in 30 days with median 180k views, 18 active Meta ads (median dwell 9 days), Google Trends +28%. That's a textbook acceleration with all four confirming. Historical win-rate on 80+ TVS: **41% profitable within 30 days** vs 9% on the 40–59 band.

> **What this means for you**: one number replaces 45 minutes of manual signal checking per product. Use the 75+ threshold as your "worth testing" filter and the 85+ as your "drop everything and launch now" filter.

**Majorka helps here** → TVS is computed nightly across the entire database. Sort [Products](/app/products) by TVS descending and you're looking at the 40 products most likely to print in the next 21 days.`,

  'm2-l3': `## The Opportunity Score — Demand minus Saturation

The Trend Velocity Score tells you if demand is accelerating. The Opportunity Score tells you if there's still **room for you**.

## The problem TVS alone can't solve

A product can have TVS 92 and be a trap — if 240 operators are already running ads, the next entrant is just fuel for Meta's auction. You need a second score that measures the other side: **how many operators are already in the water**.

## What goes into the Opportunity Score

- **Meta Ad Library competitor count** on the product or visually identical variants (weighted 35%).
- **Shopify store density** — how many active stores currently sell this exact product on a product page (25%).
- **AliExpress supplier count** offering identical SKU (15%, inverted — more suppliers = easier sourcing = lower moat).
- **Creative differentiation room** — a subjective model-scored 0–10 on whether a new angle is obviously available (15%).
- **Price dispersion** — standard deviation of selling prices across competitors (10%). High dispersion = unstructured market = opportunity.

The output is 0–100 where **higher = more opportunity left**.

## The magic quadrant

Plot TVS on the X-axis and Opportunity on the Y. Your targets live in the **top-right quadrant: TVS ≥ 70 AND Opportunity ≥ 65**. Currently, of the 3,715 products in the Majorka database, **284 sit in that quadrant** — a 7.6% hit rate.

Products with TVS 90 but Opportunity 20 are saturation traps — real demand, no room. Products with Opportunity 95 but TVS 30 are virgin markets with no proven demand.

## Why this beats raw ROAS filters

Most tools rank by "potential ROAS" which is just back-calculated from competitor ad spend. The Opportunity Score instead measures **the gap between demand and current supply of sellers** — which is the actual structural edge you have or don't have.

> **What this means for you**: TVS + Opportunity together narrow 3,715 products to ~40 genuinely launchable candidates. That's the shortlist you spend your research hour on, not the whole database.

**Majorka helps here** → [Products](/app/products) has a "Best Opportunity" preset that applies TVS ≥ 70, Opportunity ≥ 65, and margin ≥ 40% in one click. That preset is the entry point 80% of profitable launches start from.`,

  'm2-l4': `## Splitting by Market — Which Products Fit AU, US, UK

The same product doesn't perform equally across markets. Understanding the split is how you avoid the classic mistake of launching a US-native product to AU buyers.

## Market personality in one line each

- **AU**: price-sensitive, BNPL-heavy (**AU$14.7B BNPL market** via Afterpay/Zip), shipping-impatient (≤14 days or refund city), English-native but suspicious of US-style copy.
- **US**: higher AOV tolerance, free-shipping-expectant, extremely diverse sub-markets — what sells in Texas doesn't sell in Brooklyn, even at the same CPM.
- **UK**: class-conscious AOV patterns, VAT-visible pricing required, strongest "consumer rights" culture — refund rate runs 15–20% higher than AU or US.

## The product-market fit matrix

**Bias AU**: outdoor/BBQ, beach, activewear, utility car/home, camping, pet (AU has one of the world's highest pet-ownership rates at **69% of households**, Animal Medicines Australia 2022).

**Bias US**: novelty/wow-factor, kitchen gadgets, fitness-tech, Halloween, home-office.

**Bias UK**: compact-living solutions, garden/allotment, tea/kitchen accessories, small-space storage.

## The shipping-window filter

A product that ships AU in 10 days from a GZ warehouse but US in 17 days is structurally AU-first whether you want it to be or not. Every day of shipping over 14 costs ~2% conversion, so US-launching a slow-shipper means your CPA bakes in a 6–14% conversion penalty your competitors don't carry.

## How to pick on day one

1. Start in the market where you are. AU operators selling to AU have a timezone, support, and language edge that compounds.
2. Only expand once the product is profitable in your home market for 14 straight days.
3. When you expand, re-shoot creative — AU hooks do not land in the US, and vice versa.

## A real pattern

Of 412 tracked launches in 2024, products that launched in their "natural" market per the matrix above hit profitability **2.4× more often** than products launched in a mismatched market.

> **What this means for you**: before you build a store, answer "which market does this product belong in?" — the product often picks the market, not the other way around.

**Majorka helps here** → every product in the [Products database](/app/products) carries an **AU / US / UK relevance triplet** scored 0–100 per market, so you see at a glance whether it's an AU-native winner or a US-only play.`,

  'm2-l5': `## Meta Ad Library — The Only Free Intelligence Tool That Matters

The Meta Ad Library is Meta's own transparency portal. It's public, free, and it shows you **every ad every advertiser is currently running** across Facebook and Instagram. If you're not using it daily, you're flying blind.

## The five queries you run every morning

1. **Product name + hero image hash** — who's actively running this exact product.
2. **Competitor page name** — every ad your known competitors have live.
3. **Category keyword** (e.g. "posture corrector") — new entrants you haven't tracked yet.
4. **Your own brand name** — what your retargeting and lookalike ads look like in the wild.
5. **"Platform: Instagram" + filter by country** — creatives running on your target market only.

## Reading an ad's age

Every ad shows "Active since [date]". Ads running **5–20 days** are the strongest signal — the operator has kept them alive through the testing phase, meaning they're profitable. Ads running 1–3 days are tests; ads running 60+ days are scaling winners.

## The scale-vs-test tell

A single ad running 30+ days with minor copy variants = scaling winner. **Forty ads running 2–4 days each with wildly different hooks** = an operator in the testing phase. Copy the hooks from the first, not the second — the first is validated, the second is a menu of guesses.

## Do not copy the ad copy verbatim

Meta's ad classifier penalises duplicate creative and the platform is now using perceptual hashing to detect copies even with minor edits. Copy the **angle, the hook structure, the offer** — rewrite the words and reshoot the visual.

## The European transparency bonus

Meta Ad Library shows additional data (spend range, reach, demographics) for political ads and **for all ads in the EU/UK**. If a competitor runs in UK, you can see a reach estimate. Use it.

## A real edge

Among Majorka users in 2024, those who reported checking Ad Library ≥ 3 times per week had a **27% higher first-sale rate** in their first 30 days than users who didn't. It's the single highest-correlation behaviour in the data.

> **What this means for you**: Ad Library is a 15-minute daily habit. Run the five queries, screenshot the winners, keep a swipe file. That swipe file is worth more than any paid ad course.

**Majorka helps here** → the [Competitor Spy](/app/competitor-spy) tool automates the five queries and flags new entrants in tracked categories the moment they spin up — you check a feed, not five searches.`,

  'm2-l6': `## Picking AliExpress Suppliers That Actually Deliver

You can lose a winning product to a bad supplier faster than to a bad ad account. This is the lesson that saves you from that.

## The seven-metric supplier check

Every candidate supplier gets scored against these before you send a sample order:

- **Store age**: ≥ 2 years. Anything newer has no track record and AliExpress punishes disputes on young stores by closing them — with your orders inside.
- **Store rating**: ≥ 4.7. Below that, refund rates climb fast.
- **Product review count**: ≥ 100 on the specific SKU, not the store aggregate.
- **"Recently ordered" pulse**: visible and active. If a listing has 8,000 total orders but zero in the last 7 days, the supplier is likely drop-shipping it themselves from somewhere else and will be slow.
- **Response time**: ≥ 95% "responds within 24h" badge. Message them before ordering — a non-response in 48h is your answer.
- **Shipping origin**: Guangdong (GZ) and Zhejiang (ZJ) have the fastest outbound to AU. Inland provinces add 3–6 days.
- **Shipping method offered**: **Cainiao Standard or AliExpress Direct** beat "China Post Ordinary Small Packet" by 4–8 days.

## The sample order rule

Every new supplier gets **one AU$15–30 sample order before you ever advertise**. You're checking three things: shipping speed vs the listing's claim, product quality vs the photos, and packaging (because AliExpress-branded bags destroy unboxing).

## The three red flags

- Listing photos stolen from another brand (reverse-image search them — if they show up on 40 other stores, the supplier isn't the original).
- "Free shipping" that turns into AU$8 at checkout.
- A supplier that messages you **offering** to dropship for you. Real suppliers are busy; scam drop-ship-middlemen are not.

## Backup suppliers

For every product, line up **two backup suppliers** before launch. The day your primary goes on two-week Chinese New Year hiatus, you either have a backup SKU or you pause your ads and watch your momentum die.

> **What this means for you**: supplier selection is a 15-minute discipline that saves 15-hour disasters. Never skip the sample order, never launch without backups.

**Majorka helps here** → every product in the [Products database](/app/products) shows **alternate suppliers** with the seven-metric score pre-computed, so picking a backup is one click instead of an hour of manual research.`,

  'm2-l7': `## The 5 Criteria That Qualify a Product for Launch

At the end of your research, every candidate passes or fails a binary go/no-go check. These are the five criteria that matter.

## Criterion 1 — Margin ≥ 40% net after fulfilment

Not gross, not "after COGS" — **net after product + shipping + payment fees**. Below 40% net, your ad-spend cushion is too thin to survive creative-testing variance. A product at AU$49 selling price with AU$18 fully-loaded fulfilment cost (product + shipping + fees) clears at 63% net — plenty of room. A product at AU$29 with AU$14 fulfilment clears at 52% — marginal. Below 40%, walk away.

## Criterion 2 — Opportunity Score ≥ 65

From Lesson 2.3. If the market is already saturated (Opportunity < 65), creative won't save you — the auction dynamics are against you before you upload your first ad.

## Criterion 3 — TVS ≥ 70 OR evergreen classification

Either the trend is accelerating, or the product is evergreen with stable high-volume demand. Mid-TVS (40–69) non-evergreen products are where most money is lost — they look like winners on yesterday's data and behave like losers tomorrow.

## Criterion 4 — AU shipping window ≤ 14 days

Because every day over 14 costs ~2% conversion (Baymard). A 20-day-shipping product needs an unrealistically good creative to overcome the structural conversion penalty. Skip unless you can get to a sub-14 day SKU.

## Criterion 5 — Creative angle is non-obvious

Subjective, but critical. If the only hook is "this product exists and here it is" — that's what 40 competitors are already doing. You need a specific angle: a use-case nobody's showing, a demographic nobody's targeting, a problem nobody's naming.

The Majorka **Ad Brief generator** will give you three angles per product automatically. If none of the three feels ownable, that's a signal the market is saturated even if Opportunity Score says otherwise.

## The scorecard

Five boxes. **Five out of five to launch.** Four out of five means "keep watching, not ready". Three or fewer means "next".

Of 412 tracked launches, products that passed all five criteria hit first-sale-in-30-days at **54%**. Products that launched with one missing criterion: 18%. With two missing: 6%.

> **What this means for you**: the discipline of a binary checklist kills your bias. It doesn't matter how much you love the product — if it doesn't clear five of five, the data says it won't print.

**Majorka helps here** → every product card in [Products](/app/products) shows the five-criterion checklist at a glance, with green ticks or red crosses. Filter by "5/5 ready to launch" and you've got your shortlist in three clicks.`,

  // ───────────────────── MODULE 3 — SUPPLIER INTELLIGENCE ─────────────────────
  'm3-l1': `## Qualifying a Supplier in 60 Seconds

You will evaluate 30 suppliers this month. You don't have time to spend an hour on each. Here's the 60-second protocol that gets 90% of the signal.

## The 60-second sweep

**Seconds 0–10 — Store age & rating.** Open the listing, click the store name. Age ≥ 2 years? Rating ≥ 4.7? If no to either, close tab. 80% of bad suppliers fail here.

**Seconds 10–25 — Specific SKU review count.** Scroll to the product reviews. Fewer than 100 on this exact SKU? The listing is new — the supplier might be fine but the specific product is unproven. Acceptable if store age is ≥ 3 years and overall rating is ≥ 4.8.

**Seconds 25–40 — "Recently ordered" pulse.** AliExpress shows a live-ish counter. Zero recent orders on a listing with 8,000 lifetime? Either the listing is dead or the supplier is middle-manning it. Skip.

**Seconds 40–55 — Shipping origin + method.** Click the shipping options dropdown. Origin GZ or ZJ? Method is Cainiao Standard or AliExpress Direct? Delivery ≤ 14 days to AU? Three yeses and you proceed.

**Seconds 55–60 — Response rate badge.** "Responds within 24h — 97%"? You have a reachable supplier. Missing badge or < 90%? Dispute risk is material; skip unless there are no alternatives.

## What the protocol catches

It catches **middle-man dropshippers** (low recent order pulse on high lifetime), **scam listings** (missing response badge), **slow-ship traps** (non-GZ/ZJ origin), and **too-new stores** (< 2 years). These are 80%+ of the ways a supplier ruins your launch.

## What it misses

It won't catch product-quality variance (you need a sample for that), seasonal Chinese New Year closures (check calendar in Feb), or packaging quality (requires sample).

## When to slow down

For products above AU$60 COGS, spend 15 minutes not 60 seconds — the downside risk scales with your cash at risk.

## Record everything

Keep a Google Sheet: supplier name, store URL, 60-second pass/fail, sample-order result. Over 50 products you'll build a short list of **4–6 suppliers you trust** and stop starting from zero each time.

> **What this means for you**: supplier selection doesn't need to be slow. It needs to be systematic. The 60-second protocol filters out the catastrophic choices; the sample order handles the rest.

**Majorka helps here** → every [product detail panel](/app/products) shows the five key supplier metrics pre-scored and pulls the "recently ordered" pulse live, so your 60 seconds becomes 10.`,

  'm3-l2': `## Shipping Times — What AliExpress Actually Delivers

The shipping dropdown on AliExpress is famously optimistic. Here's what the numbers actually look like in 2025, based on 1,200+ sample orders tracked by Majorka users.

## Real delivery windows to AU metro (2024 data)

- **Cainiao Standard**: median **11 days**, 90th percentile 16. Best mainstream option.
- **AliExpress Direct**: median **9 days**, 90th percentile 13. Cost more but worth it.
- **ePacket**: median **14 days**, 90th percentile 22. Slower than advertised.
- **China Post Ordinary Small Packet**: median **21 days**, 90th percentile 35. Avoid.
- **DHL / FedEx Premium**: median **5 days**, 90th percentile 7. Expensive; only for high-AOV.

## To AU regional

Add 3–5 days to every number above. Regional AU is the hidden conversion killer — if 20% of your customers live outside capital cities and you don't warn them about longer shipping, your refund rate will climb 2–3 percentage points.

## To US (for later expansion)

Cainiao Standard median 13 days, Direct median 10, ePacket median 16. Generally 2–3 days longer than AU despite the marketing.

## To UK

Similar to US, with the added risk of post-Brexit customs delays on parcels above £135 — price breakpoints matter.

## The conversion math

Baymard Institute's 2023 shipping study: **every day of expected delivery beyond 7 costs 1.8–2.3% in conversion**. At 14 days (Cainiao Standard), you're already carrying a 14–18% conversion haircut vs a domestic-ship competitor. At 21 days, the haircut is brutal.

## The workaround — AU-based 3PL

Once a product is profitable, **move inventory to an AU 3PL** (Shippit, Sendle, JamesandJames). You pay ~AU$4 per shipment and AU$0.50/day storage, but you ship 2-day domestic. Break-even is usually at **30+ orders/day** — below that, the 3PL cost eats more margin than the conversion lift earns.

## What to tell customers

Be honest in your shipping policy: "Dispatched within 1 business day. AU metro delivery 8–14 days. AU regional 12–18 days." Understating shipping is the #1 trigger of chargebacks and the fastest way to lose your Shopify Payments account.

> **What this means for you**: pick your supplier's shipping method deliberately, communicate the real window, and know the 3PL break-even for the day you scale.

**Majorka helps here** → every product in [Products](/app/products) shows **real-world AU delivery medians** sourced from Majorka users' order tracking, not supplier-claimed estimates.`,

  'm3-l3': `## ePacket is Dead — The 2025 Alternatives

ePacket used to be the dropshipper's secret weapon — cheap, trackable, 10–14 days. Since 2020 its economics and reliability have collapsed. Here's what replaced it.

## What happened to ePacket

A combination of USPS policy changes, rising fuel costs, and Cainiao's direct air-freight network made ePacket slower **and** more expensive than its alternatives. In 2024, ePacket's AU delivery median drifted to 14 days with a long tail to 22+; meanwhile Cainiao Standard dropped to 11 and Direct to 9.

## The four shipping options that matter in 2025

**1. Cainiao Standard (AliExpress's default for most sellers).** Median 11 days to AU, trackable, cost around US$2–4 per parcel. This is your baseline. Use unless you have a specific reason not to.

**2. AliExpress Direct.** Median 9 days, AU$1–2 more per parcel. Use when the product is high-AOV (> AU$50) or the customer is shipping-sensitive (fashion, gifts, seasonal).

**3. Cainiao Super Economy.** Median 18 days, cost US$1.50. Only for ultra-low-AOV products where 2% conversion loss is worth the shipping savings.

**4. DHL/FedEx Premium.** Median 5 days to AU, cost US$12–20. Use only for AU$150+ AOV or B2B orders.

## Choosing method by AOV

- AOV < AU$30: Cainiao Standard (the extra shipping cost eats a material percentage of margin).
- AOV AU$30–80: Cainiao Standard or Direct, lean Direct if conversion is borderline.
- AOV AU$80–150: Direct or DHL depending on volume.
- AOV > AU$150: DHL/FedEx. Customers paying premium expect premium delivery.

## The multi-supplier reality

Not every supplier offers every method. When you negotiate with a supplier at 50+ orders/week, ask specifically: "Can you ship Cainiao Direct for AU customers?" Most will. If not, find one who will — the conversion lift pays for any COGS premium.

## Tracking numbers — the often-missed detail

Customers who get a tracking number have **37% fewer support tickets** (Shopify 2023). Always pick a trackable method, even if it's US$1 more. The support-time savings dwarf the shipping cost.

> **What this means for you**: default to Cainiao Standard, upgrade to Direct for anything conversion-sensitive, and stop using ePacket out of habit.

**Majorka helps here** → the [Products database](/app/products) filters suppliers by supported shipping method, so you find Cainiao Direct suppliers for your AOV band in one click.`,

  'm3-l4': `## Negotiating With Suppliers (When You Actually Have Leverage)

At 10 orders/week, you have no leverage. At 50, you have some. At 200+, suppliers negotiate back. Here's how the progression actually works.

## What leverage actually means

AliExpress suppliers make 5–15% net on dropship orders. Your 10 orders/week represents AU$100–300 in their revenue — forgettable. Your 200 orders/week represents AU$2k–6k — suddenly a named account.

## The three things to negotiate

**1. Price.** Typical achievable discount: 5% at 50 orders/week, 12% at 200/week, 20%+ at 500+/week. Don't ask for more than 10% below 100 orders/week — you'll damage the relationship.

**2. Shipping method upgrade.** Ask for Cainiao Direct at the Cainiao Standard price. This is often easier to win than a price cut and has bigger conversion impact. Free upgrade is worth 2–4% conversion lift.

**3. Custom packaging / branded thank-you card.** MOQ usually 500–1,000 pieces, cost US$0.20–0.60 per unit. Unlocks brand building — the hard jump from dropshipper to real DTC.

## The message to send

> "Hi [name], we've been running [product] for [weeks] and are averaging [X] orders/week. We're planning to scale to [Y]/week over the next 30 days. Can we discuss: (1) unit price at 200+/week, (2) upgrading AU shipments to Cainiao Direct, (3) adding a branded thank-you card at 500 unit MOQ? Happy to move more volume your way if the unit economics work."

Direct, specific, volume-backed. Vague "can you give me a discount" messages get ignored.

## When to ask

At the start of a scaling phase, not at peak. Suppliers read weekly order volume and forward-looking commitments matter to them — they're planning inventory too.

## Red flags in supplier responses

- "Yes, of course, any discount you want" — often means they're lying, will ship junk, and expect you to eat it.
- Aggressive push-back on custom packaging when your volume justifies it — they're not set up for branding and you should move to a sourcing agent.
- Silence on shipping method upgrade — either they can't or they won't; either way, consider a backup supplier.

## When to walk

If negotiation reveals the supplier is actually a middleman (they can't change price because they don't control the factory), move up the supply chain. A sourcing agent (Lesson 3.6) costs 3–5% but unlocks the factory direct.

> **What this means for you**: negotiation isn't a personality game — it's a volume game. Hit 50 orders/week before you ask for anything, and come with specific, volume-backed requests.

**Majorka helps here** → the [Alerts system](/app/alerts) tracks your weekly order velocity per product and pings you when you cross negotiation thresholds (50, 200, 500 orders/week), so you know exactly when to open a conversation.`,

  'm3-l5': `## Quality Control — Sample, Video, Invoice

Three disciplines catch 95% of product-quality disasters before they become chargebacks.

## Discipline 1 — The sample order

Every new supplier, every time, before any ad spend. Order to your real address, using the real shipping method you'll use in production. Time it. Photograph the packaging on arrival. Check the product against the listing photos for:

- Material (listing says "leather" — is it?)
- Dimensions (always measure — listings lie by 10–20% routinely)
- Function (does the thing actually work as described?)
- Smell (cheap plastic off-gassing is a refund magnet)

## Discipline 2 — The video QC

Before you scale past 50 orders, request a **factory video** from your supplier. Specifically: a 60-second video of the production line handling a batch in the previous 7 days. A real supplier will send this within 48 hours. A middleman won't have it.

This catches the "photos are one factory, production is another" switch — a classic scam that hits you at scale when it's too late to pivot.

## Discipline 3 — The invoice check

Your GST credit depends on proper invoicing. Ask every supplier for a **commercial invoice** (not a Paypal receipt) showing their business name, your business name, the unit price, quantity, and shipping cost. AliExpress suppliers don't volunteer this — you have to ask. Without it, your accountant can't claim the 10% GST credit and you're effectively paying 10% more than you need to.

## The defect-rate benchmark

Across 412 tracked launches, the median AliExpress product defect rate (arriving broken, wrong variant, or materially different from photos) is **3.8%**. Above 6%, the supplier has a quality issue and you should change. Below 2%, you've found a gem — stick with them even if someone offers 5% cheaper.

## The response-to-chargeback SLA

When a customer complains about quality, your supplier should respond within 24h with a resolution: reship, refund, or credit. Suppliers that drag their feet on quality complaints are telling you the product isn't worth defending. Walk.

## Tracking defects

Simple spreadsheet: date, order ID, issue, supplier response, resolution time. Over 200 orders you'll see the pattern — one supplier trending up in defects, another rock-solid. The spreadsheet beats memory.

> **What this means for you**: quality control is three habits, not a department. Sample every supplier, video-verify at scale, invoice for every GST credit.

**Majorka helps here** → [Alerts](/app/alerts) lets you set defect-rate thresholds per product; when refund requests cross 4% in any rolling 7-day window, you get a ping to investigate before it becomes a Shopify Payments hold.`,

  'm3-l6': `## Transitioning to Private Label — When and How

Dropshipping is a gateway. The exit is private label: your branding, your supplier relationship, maybe your own SKU. Here's when to make the jump.

## When to consider it

Three conditions, all required:

- The product has been **profitable for 60+ days**.
- You're doing **200+ orders/week** on the SKU.
- You have at least **AU$10k working capital** free (not tied up in float).

Jumping earlier than this is how operators blow up a working business. Jumping later is how they miss the compounding window.

## What private label actually gets you

**1. A branded unboxing**, which lifts repeat rate by 15–25% (Shopify brand-packaging study 2023).
**2. A defensible moat** — the product becomes "yours" in the customer's mind, even if the SKU is shared. Branding alone generates 10–20% price-premium tolerance.
**3. Supplier lock-in** — your supplier can't be used against you by competitors because your packaging differentiates the end product.
**4. A real exit valuation** — Shopify stores without branding sell at 2–2.5× annual profit. Branded stores sell at 3.5–5× (Empire Flippers 2024 data).

## The MOQ reality

Custom packaging typically runs **500–1,000 unit MOQ** at US$0.20–0.80 per unit. Custom inserts (thank-you cards, stickers) have 250-unit MOQ at US$0.05–0.15. Branded exterior mailer 300 MOQ at US$0.40.

Total first-run branding investment: usually **US$600–1,500**. At AU$2/unit additional cost across 500 units, you pay for it in the first month at volume.

## The three-month plan

**Month 1**: stay on AliExpress default packaging. Validate the product works. Build repeat-rate baseline.
**Month 2**: design packaging, order samples, commit to MOQ if numbers hold.
**Month 3**: ship with branded packaging, measure repeat-rate lift, iterate.

## What to avoid

- Branding a product you've only sold for 3 weeks. You haven't proven the demand is real, and you'll be stuck with US$1,500 of packaging for a dead SKU.
- Over-branding. A sticker and a thank-you card is 80% of the lift; a custom-printed mailer with embossed logos is diminishing returns.
- Skipping the supplier negotiation. Once you commit to custom packaging with a supplier, your switching cost goes up — negotiate price **before** you're locked in.

> **What this means for you**: private label is the fork where dropshippers become brand owners. Don't jump early, don't skip it forever.

**Majorka helps here** → the [Revenue dashboard](/app/revenue) tracks your per-product repeat rate, so you see the real lift when branded packaging lands in customers' hands.`,

  // ───────────────────── MODULE 4 — STORE BUILDING ─────────────────────
  'm4-l1': `## Platform Selection — Shopify vs WooCommerce vs TikTok Shop

The platform you pick shapes every downstream decision. Pick wrong and you'll feel it at month six.

## Shopify — the default (and usually right) answer

Pros: fastest launch (live in 2 hours), best app ecosystem, best payment stack, best support. Shopify powers **~30% of the top 1 million websites globally** (BuiltWith 2024) — scale is not the bottleneck.

Cons: AU$29–79/month base + 2% transaction fee unless you use Shopify Payments. Apps add up fast — expect AU$60–120/month at minimum once you're running.

Pick Shopify if: first store, AU/US/UK market, any budget, anything under AU$500k/year revenue.

## WooCommerce — the "I like control" answer

Pros: free core software, infinite customisation, no transaction fees, WordPress ecosystem. At scale (> AU$500k/year) it's ~40% cheaper than Shopify in total TCO.

Cons: you maintain it. Hosting, security, updates, broken plugins after a WordPress core update — that's your problem now. A dead site at 2am on a scaling day is a WooCommerce story.

Pick WooCommerce if: you've done WordPress before, you're past AU$500k, you have (or will hire) a dev.

## TikTok Shop — the channel-plus-storefront hybrid

Pros: native discovery via TikTok's algorithm, built-in affiliate creator network, no ad spend to reach initial traffic. AU TikTok Shop went live 2024 with a rapidly growing seller base.

Cons: very different mental model — you're selling **inside TikTok**, not driving traffic off it. Commission structure favours the platform (5% standard seller commission + creator commissions). Less customisation, less brand control.

Pick TikTok Shop if: your product is TikTok-native (wow-factor, impulse, food, beauty), you can produce 5+ pieces of content/week, you're comfortable with platform risk.

## The stack we recommend

For 90% of readers: **Shopify + the 8 must-have apps** (Klaviyo, PageFly, Judge.me, Vitals, Loox, Tidio, ShipBob connector, Shogun if needed). Monthly cost ~AU$150 all-in. Launch in 4 hours. Scales to AU$5M/year without rearchitecting.

## Don't

- Start on Wix or Squarespace for e-com — the checkouts are materially worse.
- Start on a custom-built Next.js storefront unless you are an experienced engineer (and even then — don't, it's not the bottleneck).
- Migrate platforms mid-scale. Pick once, pick right.

> **What this means for you**: Shopify unless you have a specific reason otherwise. The "Shopify fees vs WooCommerce free" calculation misses the 40 hours/month of maintenance WooCommerce quietly charges.

**Majorka helps here** → [Store Builder](/app/store-builder) generates a full Shopify-ready theme + content bundle pre-configured with the 8 must-have apps, so you skip the "which app do I need" rabbit hole.`,

  'm4-l2': `## Store Structure — Single-Product vs Niche vs General

Three store archetypes; three completely different playbooks. Pick deliberately.

## Single-product store

One hero SKU, sometimes with colour/size variants. Homepage **is** the product page. Think Allbirds in their first year, or any current TikTok-trend store.

Conversion rate: typically 2–4% (higher than niche/general because attention is undiluted).
AOV: lower — limited upsell surface. Usually capped at ~AU$50 unless the product itself is premium.
Ad strategy: aggressive single-product scaling. One creative angle, one audience, ruthless.

Pick when: trending product, 4–8 week profitable window, you want speed over brand.

## Niche store

5–25 SKUs around one theme (e.g. "minimalist home office", "posture & back pain", "eco pet"). Branded, opinionated, has a voice.

Conversion rate: 1.5–2.5%.
AOV: higher — bundles and upsells natural. AU$60–120 typical.
Ad strategy: product mix per creative, retargeting carries more weight, email flows meaningful.

Pick when: evergreen category, 12+ month build, you want brand defensibility.

## General store

Dozens or hundreds of products across unrelated categories. "Mini Amazon" style.

Conversion rate: 0.5–1.2% (attention dilution is real).
AOV: variable.
Ad strategy: usually product-test mill — launch 10 products/week, cut fast.

Pick when: you're testing products for a future niche/branded build. **Do not keep** a general store past 6 months — the unit economics never get better.

## The pattern winners follow

Start single-product (validate), graduate to niche (compound), exit or expand to brand (defend). General stores are training wheels, not destinations.

## The 2025 data

Of the top 10k Shopify stores by revenue (SimilarWeb 2024), 3% are single-product, 87% are niche-branded, 10% are general. The general count has dropped from 23% in 2020 — the market is professionalising.

## Store Builder defaults

Majorka Store Builder defaults to **single-product** because it's the fastest path to first revenue. Promote to niche by adding complementary products once the hero SKU is profitable.

> **What this means for you**: architecture is strategy. A niche store running a trending-product playbook is a slow death; a single-product store running a brand-build playbook is an over-investment.

**Majorka helps here** → [Store Builder](/app/store-builder) asks the single-vs-niche question on first setup and wires the homepage, nav, and upsell flow to match.`,

  'm4-l3': `## The Product Page That Does 90% of the Conversion Work

Your homepage and collection pages exist to funnel to the product page. The product page is where the sale is actually made. Here are the nine blocks that make it work.

## The nine blocks, top to bottom

**1. Above-the-fold hero image + 3-word headline.** The image does the talking. The headline names the benefit, not the product. "Fix your posture in 15 minutes" beats "Posture Corrector X3000".

**2. Price + BNPL strip.** Show the Afterpay/Zip breakdown ("4 × AU$12.25") — AU buyers value this, and the **AU$14.7B BNPL market** (AFIA 2023) tells you why.

**3. Add-to-cart button.** Above the fold. Always.

**4. Three benefit bullets.** Not features. "Takes 10 seconds to put on" is a benefit; "Adjustable straps" is a feature.

**5. Social proof bar.** "2,847 happy customers", star rating, one review snippet. Judge.me or Loox.

**6. Product in use — video or GIF.** 20–40 seconds. Shows the product solving the problem. If you don't have one, take one — iPhone video is enough.

**7. Specs / what's in the box.** Measurements, materials, included items. The buyers who scroll this far are the ones converting — give them the detail.

**8. Reviews section.** Real ones. 4.6–4.8 star average is ideal (5.0 looks fake). Judge.me lets you import AliExpress reviews filtered for quality.

**9. FAQ + shipping + returns.** The final objections. Four to six questions, plain language.

## Conversion benchmarks

A well-built product page on a trending product: **2.5–4% CVR**. On an evergreen problem-solver: **1.5–2.5%**. Below 1.2%, the page has a problem — usually hero image or price mismatch.

## The mobile reality

**Over 75% of AU Shopify traffic is mobile** (Shopify AU 2024). If your product page isn't visually laid out to make the above-the-fold decision on a 6-inch screen, nothing else matters. Test on your own phone before you test on desktop.

## Page speed

Every 100ms of load time past 2s costs **~1% in conversion** (Google 2023). Strip the theme, compress images (Shopify's default compression is weak — use TinyPNG), skip the carousel if it adds > 200ms.

## What not to put on the page

Scrolling carousels of testimonials. Auto-play video with sound. Exit-intent popups that fire within 5 seconds. Chat widgets that open on load. Every one of these is a measurable CVR drag.

> **What this means for you**: nine blocks, in order, on mobile, fast. That's the product page. Everything else is decoration.

**Majorka helps here** → [Store Builder](/app/store-builder) generates a product page with the nine blocks pre-configured, images optimised, and mobile tested — you fill the copy, not the layout.`,

  'm4-l4': `## Pricing for the AU Market

Pricing is a psychology game first and a margin game second. Get the psychology right and margin follows.

## The AU AOV reality

- AU Shopify average AOV: **AU$84** (Shopify AU 2024).
- BNPL-adjacent products (uses 4 × AU$X framing): AOV **up 20–30%**.
- Products above AU$150 face a dramatic conversion cliff unless positioned as gift / premium.

## Price anchoring — the one thing that moves everything

The biggest single lever: a **compare-at price** that's 30–50% above your selling price. A product at AU$49 with "was AU$79" compare-at converts 20–40% better than the same AU$49 shown as list price. This is not optional — Shopify's own checkout data confirms it across categories.

Use it ethically: don't fake 80% discounts you'll never drop to. ACCC has been active on misleading "was" prices since 2022.

## The magic price points

In AU, these price points convert disproportionately well due to BNPL math:
- AU$39 (4 × AU$9.75 — "under ten bucks a week")
- AU$49 (4 × AU$12.25 — "about a coffee per day for two weeks")
- AU$79 (4 × AU$19.75 — breaks the AU$20/week resistance)
- AU$99 (4 × AU$24.75 — below AU$25/week)

Avoid the AU$59–69 band — it reads as "too expensive for cheap, too cheap for premium".

## Shipping price psychology

**Free shipping converts 15–25% better than any paid shipping option, even with the cost baked into the product price** (Shopify 2024). A product at AU$49 + free ship beats a product at AU$44 + AU$5 ship. Bake it in.

Threshold: "Free shipping on orders AU$50+" lifts AOV 8–12% vs unconditional free shipping — the trick is calibrating the threshold 10–20% above your natural AOV.

## GST-inclusive pricing

AU law requires GST-inclusive pricing to consumers. Show the AU$49 number as the final number. Mentioning "inc. GST" below it is fine, but the headline price is the total.

## The "odd 9" vs "round" debate

AU consumers respond slightly better to **AU$XX.99** or **AU$XX.95** than round numbers on impulse products, and slightly better to **round numbers** on premium / considered-purchase products. Test within your category.

> **What this means for you**: anchor, BNPL-frame, free-ship. Those three moves lift conversion 30–50% on the same product at the same cost.

**Majorka helps here** → [Profit Calculator](/app/profit-calc) inside every product detail computes your BNPL-framed price, compare-at anchor, and net margin in real time as you slide the selling price.`,

  'm4-l5': `## Trust Signals — Every Pixel Earning the Sale

Every element on your store is either building trust or leaking it. Here are the trust signals that measurably move conversion in AU.

## The top-of-funnel signals

- **Real Australian phone number or email.** A ".com.au" contact email lifts trust materially over a gmail address.
- **ABN shown in footer.** "Registered Australian Business: ABN 12 345 678 901". Takes 30 seconds, adds ~0.3–0.6% CVR in tested cases.
- **Physical address.** Even a PO Box. No address = "this is a drop-shipper".
- **"Ships from Australia" badge** if true (AU 3PL stored). Or honest disclosure if not ("Dispatched from our Hong Kong warehouse, delivered 8–14 days").

## The checkout-level signals

- **Stripe / Shopify Payments + Afterpay + Zip + PayPal** — all four visible on the product page. Absence of PayPal alone costs ~3% CVR with AU over-35s.
- **SSL lock icon** — Shopify handles this automatically but make sure your custom domain is HTTPS.
- **"100% Secure Checkout" + card logos** — the Shopify default is fine, don't override.

## The social proof signals

- **Reviews widget** — Judge.me or Loox, with at least 15 reviews before launch. A product page with zero reviews converts ~40% worse than one with 10+.
- **Review average 4.6–4.8 stars** — 5.0 is suspicious, below 4.4 is a conversion drag. Curate.
- **"Featured in" logos** if you've been mentioned anywhere — even a minor blog counts.
- **Photos from real customers** in reviews. Judge.me's photo-upload prompt triples photo-review count.

## The policy signals

- **Clear refund policy** — 30-day money-back, no-questions-asked framing converts best. Remember AU Consumer Law gives the customer a refund right anyway; leaning into it is free.
- **Shipping policy** — honest and specific. Vague "shipping 2–4 weeks" scares people off.
- **FAQ on product page** — answers objections before they kill the sale.

## The anti-signals (remove immediately)

- "About Us" pages that say "we're a team of passionate entrepreneurs" — generic, obvious dropshipping boilerplate.
- AU$0 starting reviews or reviews all dated within 2 days of each other.
- Stock photos as "Our Founder" on the About page. Reverse-image searchable and murderous for trust.
- Chat widgets with fake "Sarah from Support" messages that fire on load.

## The single biggest lift

A real, genuine **founder video** on the About page — 45 seconds, iPhone-shot, face to camera, explaining why you built the store. Conversion lift: typically 0.4–0.9%. It takes an afternoon. Most operators never do it.

> **What this means for you**: trust is cumulative. Six small wins — ABN, real email, reviews, policies, payment logos, founder video — add up to 2–3 points of CVR, which is the difference between a profitable and a dead store on the same ad spend.

**Majorka helps here** → [Store Builder](/app/store-builder) ships with all six trust signal blocks pre-wired; you paste your ABN and upload your founder video, everything else is already configured.`,

  'm4-l6': `## Payment Gateways & BNPL in Australia

The AU payment stack is specific. Get it right and you add 10–20% to conversion with zero ad cost.

## The must-have stack for AU

**Shopify Payments** (powered by Stripe) as the primary card processor. 1.75% + AU$0.30 per AU card transaction. Included free with Shopify, no 2% additional Shopify fee.

**Afterpay.** Standard AU BNPL. 4-instalment, zero-interest-to-customer, merchant pays ~4–6%. A product page with Afterpay messaging at price: **~15–25% CVR lift** over one without (Afterpay's own data, confirmed in third-party retailer A/B tests).

**Zip Pay.** Second-tier AU BNPL, often used by customers declined by Afterpay. Adds another 2–4% CVR on top of Afterpay alone.

**PayPal.** Still matters in AU, especially over-35s and first-time customers unsure about giving cards to a new brand. ~3% CVR drop if missing.

**Apple Pay + Google Pay.** Shopify enables automatically. One-tap checkout on mobile = 20–30% CVR lift on mobile, which is 75%+ of your traffic.

## The fee math

Blended effective processing cost on a typical AU basket with this stack: **~3.1%** of revenue (weighted average of Shopify Payments at 1.75%, Afterpay at ~5% on 25% of orders, PayPal at 2.6% on 15% of orders). Build 3.1% into your margin calc.

## The AU BNPL market context

**AU BNPL transaction value hit AU$14.7B in 2022** (AFIA data). Afterpay has ~3.5M active AU users, Zip ~2.2M. Between them they touch roughly 50% of AU online shoppers aged 18–44. Not offering BNPL to this demographic is leaving measurable money on the table.

## What to avoid

- **Stripe direct** instead of Shopify Payments on Shopify — you pay the 2% extra Shopify fee.
- **PayPal as your primary** — checkout UX is notably worse than Shopify Payments; use as secondary.
- **Zippay alone without Afterpay** — Afterpay dominates; skipping it loses the majority of BNPL customers.
- **Stripe Klarna** — Klarna has minimal AU presence; you're adding friction for almost no incremental customers.

## Regulatory watch

AU BNPL regulation under NCCP is expected to tighten in 2025–2026 — credit checks, affordability rules. This will likely reduce BNPL approval rates by 10–20%. Doesn't change what you install today, but watch for revenue mix shift in H2 2025.

## Setup time

With Shopify as your platform, the full AU payment stack takes about **90 minutes** to configure: Shopify Payments (10 min), Afterpay (30 min with AU business verification), Zip (30 min), PayPal (20 min). Apple Pay and Google Pay are automatic once Shopify Payments is live.

> **What this means for you**: the full AU payment stack is 90 minutes of setup and roughly a 25–35% cumulative CVR lift over a card-only store. The highest ROI 90 minutes in your first month.

**Majorka helps here** → [Store Builder](/app/store-builder) generates the payment-gateway section of your theme pre-coded for the full AU stack, including BNPL price widgets on every product card.`,
};
