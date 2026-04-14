/**
 * Academy v2 — three structured tracks built for retention.
 * Each track has 4 lessons with real body copy (200–400 words), key points,
 * and optional deep-links to the relevant app surface.
 *
 * Lesson progress is persisted server-side via /api/academy routes.
 * Lesson IDs are stable (never renumber) — they are the primary key in
 * public.academy_progress.
 */

export type TrackTier = 'builder+scale' | 'scale';

export interface LessonSpec {
  id: string;              // stable — used as DB key
  num: string;             // display "1.1"
  title: string;
  body: string[];          // paragraphs, 200–400 words total
  keyPoints: string[];     // 4 bullets
  demoCta?: {
    label: string;
    path: string;
  };
}

export interface TrackSpec {
  id: string;
  num: number;
  title: string;
  blurb: string;
  accent: string;
  tier: TrackTier;
  lessons: LessonSpec[];
}

export const ACADEMY_TRACKS: TrackSpec[] = [
  {
    id: 'track-finding-winners',
    num: 1,
    title: 'Finding Winners',
    blurb:
      'The data work that decides 80% of the outcome — before you write a single ad.',
    accent: '#10b981',
    tier: 'builder+scale',
    lessons: [
      {
        id: 'lesson-1-1-velocity',
        num: '1.1',
        title: 'Reading the Trend Velocity Score',
        body: [
          'Velocity_7d is the single most important number on a Majorka product card. It measures the 7-day change in sold_count, expressed as a percentage — so a velocity of +42% means the SKU sold 42% more units in the last 7 days than in the 7 days before that. Volume tells you a product has sold. Velocity tells you it is selling right now.',
          'Trust velocity when you see three conditions together: the product has a baseline sold_count above 500 (so the percentage isn\'t statistical noise), the 7-day number is between +15% and +150% (above +150% usually means a single viral creator, not real demand), and the winning_score is 85+. That combination is the closest thing to a leading indicator this industry has.',
          'When velocity lies: products with fewer than 500 lifetime orders, listings that were just reindexed (artificial spike), and SKUs with a single huge order driving the delta. Always cross-check against the Hot Today tab — if a product is climbing velocity AND appears in Hot Today, it is the real thing.',
          'The AU operator playbook: open the Products tab, sort by Velocity 7d desc, filter to winning_score >= 85, AU availability = yes, price_aud between 25 and 75. You have just narrowed 3,000+ products to the 20 that matter this week.',
        ],
        keyPoints: [
          'Velocity_7d = (sold this week − sold last week) / sold last week × 100.',
          'Trust it only when baseline sold_count > 500 AND velocity is +15% to +150%.',
          'Combine with winning_score 85+ for the tightest signal in the DB.',
          'If velocity + Hot Today agree on a product, launch it this week.',
        ],
        demoCta: { label: 'Open Velocity Leaders', path: '/app/products' },
      },
      {
        id: 'lesson-1-2-sourcing',
        num: '1.2',
        title: 'Sourcing on AliExpress — what filters actually find winners',
        body: [
          'AliExpress\'s default sort order is designed to sell you their promotions, not to find you winners. The filters that actually matter are buried three clicks deep. Here is the exact sequence to use when sourcing a SKU you found on Majorka or anywhere else.',
          'First, set "Orders" as the sort. Not "Best Match" — that ranks by ad spend. Orders ranks by actual demand. Second, add the minimum rating filter set to 4.7 stars. Below 4.7 is a coin flip on product quality. Third, scroll to the Seller filter and toggle "Top Brand" or filter for stores with 1,000+ followers and 2+ years on the platform. A factory direct seller with 6 months on AliExpress is not battle-tested.',
          'Fourth, and this is the one most operators skip: click through to the listing and check the "Specifications" tab. Real suppliers list origin, materials, dimensions, and weight. Scam listings leave 60% of those fields blank. Fifth, message the seller with a simple "Do you ship to Australia? Typical delivery time?" — if they reply in English within 24 hours, they are a legitimate operation. If they ghost you or reply in broken English with no specifics, move on.',
          'Never pick the lowest price supplier. The 50-cent saving evaporates the moment you get a single chargeback. Pick the supplier in the middle 60% of the price band who has the cleanest listing and the fastest response time.',
        ],
        keyPoints: [
          'Sort by Orders, not "Best Match" — Best Match is paid placement.',
          'Filter to 4.7+ stars AND 1,000+ follower stores AND 2+ year tenure.',
          'Real suppliers complete the Specifications tab. Scams leave it blank.',
          'Message the seller before ordering — 24h English reply = green light.',
        ],
      },
      {
        id: 'lesson-1-3-fake-reviews',
        num: '1.3',
        title: 'Spotting fake reviews + low-quality suppliers',
        body: [
          'AliExpress reviews are the most manipulated review surface in e-commerce, worse than Amazon. Factories buy verified-purchase reviews in bulk at $0.30 each. The good news: fake reviews follow patterns that are easy to spot once you know the tells.',
          'Tell one: the review count is high but the number of reviews with photos is under 5%. Real customers upload photos. Paid reviewers almost never do. A SKU with 3,000 reviews and 40 photos is 10x more trustworthy than one with 8,000 reviews and 90 photos.',
          'Tell two: the star distribution is too clean. Real products have a long tail of 1- and 2-star reviews — shipping damage, size issues, wrong color. If a listing has 96%+ 5-star reviews with almost no 1- or 2-star, it has been scrubbed. Click "1 star" and read them. If there are fewer than 3 and they are all "wrong item" (a known refund-bait pattern), move on.',
          'Tell three: the review language is too generic. "Good product, fast shipping, seller is nice" across 200 reviews is the fingerprint of a review farm. Real customers mention specifics — the color was slightly off, the cable was shorter than expected, their cat loved it.',
          'Low-quality supplier red flags: shop opened in the last 6 months, all listings use the same three product photos with different watermarks, and product titles packed with 15+ keywords. That is an arbitrage drop-shipper, not a manufacturer. Avoid.',
        ],
        keyPoints: [
          'Photo-review ratio under 5% = likely manipulated. Real ratio is 10–20%.',
          'No 1- or 2-star reviews = scrubbed. Always read the 1-star tab first.',
          'Generic review language (no specifics) = review farm.',
          'Shop under 6 months old + keyword-stuffed titles = arbitrage reseller.',
        ],
      },
      {
        id: 'lesson-1-4-au-vs-us-vs-uk',
        num: '1.4',
        title: 'AU vs US vs UK pricing + shipping reality',
        body: [
          'Same AliExpress SKU, three wildly different economics. A $14 product with $8 ePacket to AU lands at $22 and takes 12–18 days. The same product to the US lands at $19 and takes 10–14 days (better logistics routes). To the UK it is $20 and 14–20 days (customs lag).',
          'The pricing rule that keeps AU operators profitable: 3–4x markup on cost + shipping, minimum $19 final AU price. Below $19 the Meta CPMs eat your margin. A $14 product lands at $22 and should retail at $49–$69 AUD. That 2.2–3.1x price-to-land ratio is the floor, not the ceiling.',
          'US pricing is more competitive but the market is also more saturated — you are fighting against 50,000 Shopify stores, not 5,000. US operators typically run 2.5–3x markup because the volume compensates for the thinner margin. UK sits in the middle: lower saturation than the US, higher CPMs than AU.',
          'Shipping reality: AliExpress Standard to AU is 10–20 business days. Set a 14-day expectation on the product page, a 21-day "contact us" rule in your FAQ, and auto-email at day 10 with a tracking nudge. 80% of the "where is my order" tickets come from the 10–14 day window. Eliminate them with proactive comms and your support volume drops by a third.',
          'AU also has GST on goods under $1,000 AUD sold by overseas merchants — Shopify handles this automatically if you set GST-inclusive pricing. Do this on day one.',
        ],
        keyPoints: [
          'AU minimum retail: 3x land cost, $19 floor. Under $19 CPMs eat margin.',
          'US markup is tighter (2.5–3x) but volume is 10x — different game.',
          'AU shipping is 10–20 days. Tell customers 14 days, email them at day 10.',
          'AU GST applies under $1k AUD sold from overseas — set GST-inclusive prices.',
        ],
      },
    ],
  },
  {
    id: 'track-building-store',
    num: 2,
    title: 'Building the Store',
    blurb:
      'Niche, creatives, copy, conversion — the full launch-day stack, without the guru fluff.',
    accent: '#6366f1',
    tier: 'scale',
    lessons: [
      {
        id: 'lesson-2-1-niche-name',
        num: '2.1',
        title: 'Picking a niche name + domain that converts',
        body: [
          'Your store name does more marketing work than any single ad creative. A good name passes three tests: it hints at what you sell, it is pronounceable the first time, and it carries a vibe that matches your target customer. "PawPlush" for premium pet beds works. "StoreOfThings2024" does not.',
          'The naming formula that converts for AU dropshippers: a short emotion word + a category hint. "Oslo & Otter" (pet). "Softer Skin Co." (beauty). "The Gear Nook" (tools). All three follow: 2–3 syllables, no numbers, no hyphens, suggests the category without locking you into one product. Avoid "global", "world", "hub" — they scream generic dropshipper.',
          'Domain: always .com first, .com.au second, .co third. Do not buy .xyz, .shop, or .store — they triple your bounce rate on first visit. Australian customers specifically trust .com.au more than .com for shipping-sensitive categories. If the .com is taken, prepend "get" or "shop" ("getoslo.com") before settling for a weird TLD.',
          'Brand safety: check the name on IP Australia trademark search and on Meta Ad Library. If a larger brand owns the name in your category, Meta will reject your ads on day one. Costs nothing to check, saves weeks of rework.',
          'The Store Builder generates a name + domain + logo automatically, but always override the name if the AI picks something generic. You live with this name for two years or two weeks — choose accordingly.',
        ],
        keyPoints: [
          'Formula: 2–3 syllable emotion word + category hint. Pronounceable first time.',
          '.com > .com.au > .co. Never .xyz/.shop/.store — they kill trust.',
          'Always check IP Australia + Meta Ad Library before committing.',
          'Override Store Builder naming if it feels generic — it usually is on try 1.',
        ],
        demoCta: { label: 'Open Store Builder', path: '/app/store-builder' },
      },
      {
        id: 'lesson-2-2-meta-ads',
        num: '2.2',
        title: 'Meta ads — audience stack, creative tests, launch day checklist',
        body: [
          'The Meta ads launch stack for AU dropshipping in 2026: one campaign, three ad sets, four creatives per ad set. That is 12 creatives running on day one. Any less and you are gambling on a single hook. Any more and your budget per creative is too low to exit the learning phase.',
          'Audience one: Advantage+ Shopping (Meta\'s auto-targeting). This has become the default because Meta\'s signal is now better than any interest you can pick. Set a $50/day budget and let it run. Audience two: broad AU 25–55 with no interests, $30/day. Audience three: interest stack of 3–5 adjacent interests (for pet: "cats", "pet accessories", "petsmart", "chewy"), $30/day. Total day-one spend $110.',
          'Creative tests: your four creatives per ad set should test four distinct hooks — problem/agitate, demo-first, founder UGC, testimonial UGC. Do not test colour variations or font tweaks. Test actual different opening lines. The first 3 seconds decide whether Meta shows the ad to more people.',
          'Launch day checklist: pixel verified in Events Manager (use the Pixel Helper browser extension), Conversions API hooked up via Shopify\'s native Meta app, Purchase event firing correctly on a $0 test order, all creatives approved (check at 8am AEST — Meta review queues are fastest overnight US time), and at least $100 in the account ready to spend. Launch at 6pm AEST to catch the AU evening scroll.',
          'Kill rule: any ad set under 1.0 ROAS after $80 spend gets paused. Move that budget into whichever ad set is above 2.0 ROAS. The 3-day patience window is a myth for dropshipping — the signal is clear by day 2 if you have enough creatives running.',
        ],
        keyPoints: [
          'Launch stack: 1 campaign × 3 ad sets × 4 creatives = 12 creatives day one.',
          'Audiences: Advantage+, broad AU 25–55, and a 3–5 interest stack.',
          'Test different hooks, not different fonts. First 3 seconds = the whole ad.',
          'Kill rule: pause any ad set under 1.0 ROAS after $80 spent. Move budget.',
        ],
        demoCta: { label: 'Open Ads Studio', path: '/app/ads-studio' },
      },
      {
        id: 'lesson-2-3-ad-copy',
        num: '2.3',
        title: 'Ad copy frameworks — problem/agitate/solve vs demo-first',
        body: [
          'There are two ad copy frameworks worth learning in 2026. Every other framework is either a variation of these two or a guru repackaging. Learn both, use the right one for the right product.',
          'Problem / Agitate / Solve (PAS) is the framework for products that solve a problem the customer already knows about but has resigned themselves to living with. "Your cat is chronically dehydrated and you probably don\'t even know it" is a PAS hook. You name the problem, you make it feel bigger than the reader assumed, you reveal the solution. Works for: pet health, pain relief, posture, sleep, pet grooming. If your product is fixing something the customer has Googled in the last 12 months, use PAS.',
          'Demo-first is the framework for products that are visually satisfying or unfamiliar. The first 3 seconds show the product doing its thing — the spinning pet hair remover pulling off a ball of fur, the magnetic eyelashes snapping on, the portable blender turning a whole apple into juice. No voiceover, no text. Just the moment. Works for: gadgets, beauty tools, kitchen, cleaning. If the product looks interesting in motion, demo-first outperforms PAS by 2–3x.',
          'The hybrid that wins for most products: demo-first for the first 3 seconds, then a single spoken sentence that names the problem, then price + CTA in the last 5 seconds. 15 seconds total. 99% of AU dropship winners are this exact structure.',
          'Words that convert in AU: "finally", "no more", "stop", "the reason", "turns out", "everyone\'s buying". Words that don\'t: "amazing", "incredible", "revolutionary", "game-changing". AU audiences are allergic to American ad voice.',
        ],
        keyPoints: [
          'PAS for known-problem categories (health, pet, pain, posture, sleep).',
          'Demo-first for visually-satisfying categories (gadgets, beauty, kitchen).',
          'Winning structure: 3s demo → 1 problem sentence → price + CTA in 15s total.',
          'AU voice: "finally", "no more", "turns out". Never "amazing" or "game-changing".',
        ],
      },
      {
        id: 'lesson-2-4-conversion',
        num: '2.4',
        title: 'Conversion essentials — product page, cart abandonment, first-sale emails',
        body: [
          'Product page structure that converts in AU, top to bottom: hero image that matches the ad creative (zero visual disconnect on arrival), price + "Free AU shipping" badge in 48pt, stock counter ("Only 23 left — selling fast" with real inventory logic, never fake), trust row (ASIC-registered, 30-day returns, AU-based support), 3 benefit bullets not features, scroll-to-reviews anchor, and then the long-form pitch.',
          'The single biggest conversion killer on dropship stores is the review section looking fake. Use Loox or Judge.me, import AliExpress photo reviews selectively (never the glowing-but-generic ones), and aim for 40–120 reviews with a 4.6–4.8 average. Above 4.9 looks suspicious. Below 4.4 kills conversion.',
          'Cart abandonment: set up the 3-email sequence the day you launch. Email one at 1 hour ("forgot something?"), email two at 24 hours ("10% off — code CART10"), email three at 72 hours ("last chance — this ship date is expiring"). Expect 8–12% recovery rate. If you see below 5%, your send-from address is going to spam — warm it with Google Postmaster and DMARC.',
          'First-sale email (the one the customer gets after buying) is where you build a repeat customer, not where you cross-sell. Thank them, confirm the ship date, give them one piece of care instruction ("here is how to clean it"). The customers who read that email buy again 3x more often than the ones who get a generic confirmation.',
          'One more thing: Afterpay on the cart page is worth 15–25% conversion uplift for any AU product between $40 and $200. Enable it on day one.',
        ],
        keyPoints: [
          'Product page: hero → price → stock → trust row → benefits → reviews → pitch.',
          'Reviews: 40–120 reviews at 4.6–4.8 avg. Above 4.9 looks fake. Below 4.4 tanks.',
          'Cart abandon: 3 emails at 1h / 24h / 72h. Expect 8–12% recovery.',
          'Afterpay on cart for $40–$200 AU products = 15–25% conversion uplift.',
        ],
      },
    ],
  },
  {
    id: 'track-scaling-retention',
    num: 3,
    title: 'Scaling + Retention',
    blurb:
      'The post-launch operator playbook — cut losers fast, read the right metrics, build a brand.',
    accent: '#f59e0b',
    tier: 'scale',
    lessons: [
      {
        id: 'lesson-3-1-cut-losers',
        num: '3.1',
        title: 'When to cut losing SKUs fast',
        body: [
          'The single most expensive mistake post-launch operators make is letting losing SKUs run "one more day". The data is already there on day 3. You just don\'t want to read it.',
          'The cut rule for AU dropshipping: if a SKU has spent $150+ on ads and has a blended ROAS below 1.2, it is dead. Kill it. The math: at ROAS 1.2 you are losing money after COGS, payment fees, and app subscriptions. Below 1.5 for a $40 product is unprofitable. Below 2.0 for a $25 product is unprofitable. Know your break-even ROAS before you launch — it is different for every SKU.',
          'Do not confuse "needs more time" with "needs to die". A SKU that scales from 1.5 ROAS at $50 spend to 2.3 at $200 spend is warming up — keep it. A SKU that is at 0.9 ROAS across $150 and $300 spend is a loser — the algorithm has spoken. You are not going to out-creative the signal.',
          'The emotional trap: you spent $80 on UGC, you built a custom product page, you are invested. Sunk cost. Kill it and move the budget. You will find three more winners in the time it would have taken you to rescue this one.',
          'What to do with the carcass: save the Shopify product (do not delete), archive the Meta ads (do not delete the account), and move on. Some products come back 6 months later when the market rotates — you want the pixel data intact.',
          'The pros cut SKUs at 72 hours. The amateurs cut at 3 weeks and wonder where the budget went.',
        ],
        keyPoints: [
          'Cut rule: $150 spend, ROAS below 1.2 = dead. No exceptions.',
          'Know your break-even ROAS per SKU before launch — it varies.',
          'Warming up = rising ROAS with more spend. Dying = flat low across spend.',
          'Archive, don\'t delete. Markets rotate. Pixel data is gold.',
        ],
      },
      {
        id: 'lesson-3-2-ugc-tiktok',
        num: '3.2',
        title: 'UGC + TikTok Shop mechanics for the AU market',
        body: [
          'TikTok Shop launched in AU in 2024 and by 2026 it is the single fastest-growing sales channel for dropshippers under $100 AOV. The mechanics are different from Meta in three critical ways.',
          'One: creator-driven, not brand-driven. Your product page lives on TikTok Shop, but 80% of the sales come from creators posting about your product with an embedded shop link. You do not buy ads in the traditional sense — you seed 20–40 creators with free product + 15–25% affiliate commission, let them post, and boost the winners.',
          'Two: AU-native creators only. Do not use US or UK creators for AU shop. The algorithm reads location and shipping, and cross-border creator content converts at a third of the rate. Find AU creators through TikTok Creator Marketplace filter for AU > your category > 10k–200k followers (micro-influencers convert better than mega).',
          'Three: the content format that sells on TikTok Shop is the "problem → unbox → in-use → price reveal" loop, 15–22 seconds. The product has to be in-frame by the 2-second mark. Price reveal at the end, not the start. The creators who do this well hit 4–8% conversion on their shop link clicks, 3–4x Meta benchmarks.',
          'UGC outside TikTok Shop: for Meta ads, pay AU creators $120–$300 for a batch of 3 vertical 9:16 videos. This is the highest-ROI spend in the entire ad stack — a single winning UGC creative will run for 6 months before fatiguing.',
          'The integration play: same creators, same product, Meta ads + TikTok Shop + Instagram Reels. Cross-pollinate. One shoot, three channels, six months of runway.',
        ],
        keyPoints: [
          'TikTok Shop is creator-led: seed 20–40 AU creators, pay 15–25% commission.',
          'AU creators only for AU shop — cross-border converts at 1/3 the rate.',
          'Winning format: problem → unbox → in-use → price reveal. 15–22 seconds.',
          'Pay $120–$300 per UGC batch — a winner runs 6 months before fatigue.',
        ],
        demoCta: { label: 'Browse AU Creators', path: '/app/creators' },
      },
      {
        id: 'lesson-3-3-roas-mer-cm',
        num: '3.3',
        title: 'Reading ROAS vs MER vs contribution margin',
        body: [
          'Three acronyms, three very different stories about the same business. Knowing which one to look at when is the difference between a $10k/mo store and a $100k/mo store.',
          'ROAS (Return on Ad Spend) = revenue from an ad / spend on that ad. Granular, per-campaign. Use it to decide which ad sets to keep running and which to cut. Do not use it to decide if the business is profitable — it ignores COGS, shipping, fees, and returns.',
          'MER (Marketing Efficiency Ratio) = total store revenue / total marketing spend across all channels. This is the honest number. If your MER is 3.0, for every dollar of ad spend across Meta, TikTok, Google, and email, you get $3 of revenue. MER above 3.0 is healthy for dropshipping. Below 2.5 means you are working for Meta, not yourself. Look at MER weekly, not daily.',
          'Contribution margin = (revenue − COGS − shipping − payment fees − ad spend) / revenue. This is the only number that tells you if you are actually making money. For AU dropshipping, aim for 15–25% contribution margin. Below 10% and you cannot scale without breaking. Above 30% and you are either underspending on ads (leaving growth on the table) or selling a genuinely differentiated product (rare).',
          'The daily dashboard an operator should check: contribution margin (is the business healthy?), MER (is marketing efficient?), and the worst-performing ad set by ROAS (what do I cut today?). That is the whole dashboard. Everything else is noise.',
          'Common trap: celebrating a 4.0 ROAS on a single ad while the store MER is 2.0 because returns and fees are eating the overall number. Always reconcile the two.',
        ],
        keyPoints: [
          'ROAS = ad-level decisions (keep/cut). MER = business-level health check.',
          'MER above 3.0 = healthy dropshipping. Below 2.5 = working for Meta.',
          'Contribution margin is the only profit truth — aim for 15–25%.',
          'Daily dashboard: CM + MER + worst-ROAS ad set. That is the whole thing.',
        ],
        demoCta: { label: 'Open Revenue Analytics', path: '/app/revenue' },
      },
      {
        id: 'lesson-3-4-supplier-relationships',
        num: '3.4',
        title: 'Supplier relationships — private-label, branded packaging, 3PL',
        body: [
          'The moment you hit $30k/month on a single SKU, the AliExpress drop-ship model becomes your bottleneck, not your engine. 10–20 day shipping starts eroding reviews, "generic" packaging kills repeat purchase, and you have no leverage on cost because you are buying one unit at a time at retail wholesale price.',
          'The transition: first, negotiate a bulk rate directly with your existing AliExpress supplier via their store chat. At 500+ units/month, most will drop 15–25% off the list price and give you a private SKU number. Same product, better margin, same shipping times.',
          'Second, move to private label. Find the same factory on Alibaba (not AliExpress) — sometimes literally the same shop. Minimum order quantity is typically 300–1,000 units, but you get your logo on the product, custom colours, and packaging inserts. Cost drops another 30–40% vs AliExpress. This is where dropshippers become actual brands.',
          'Third, 3PL in Australia. Once you have 500+ units of inventory, ship them via sea freight (4–6 weeks) to a Sydney or Melbourne 3PL like Shippit, Sendle-partnered warehouses, or ShipBob AU. Your customers now get 2–4 day shipping. Conversion rate jumps 15–30%. Return rate drops by half.',
          'Fourth, branded packaging. A $0.60 custom box + insert card + "made for [your brand]" label turns an AliExpress commodity into a brand experience. Repeat purchase rate doubles. LTV doubles. This is the step that converts a dropshipping store into a $500k/year business.',
          'The honest timeline: 90 days AliExpress dropship → 90 days private label + direct supplier → 90 days 3PL + branded. Nine months from launch to actual brand.',
        ],
        keyPoints: [
          '500+ units/mo: negotiate direct with AliExpress supplier, save 15–25%.',
          'Alibaba private label: 300–1,000 MOQ, save another 30–40%, own the brand.',
          'AU 3PL at 500+ stock: 2–4 day shipping → 15–30% conversion lift.',
          '$0.60 branded packaging → repeat purchase rate doubles. LTV doubles.',
        ],
      },
    ],
  },
];

/**
 * Flat map of lesson_id -> { trackId, trackTitle, lessonTitle }.
 * Used by the Home deltas and weekly digest to resolve a user's
 * current track and next uncompleted lesson.
 */
export const LESSON_INDEX: Record<
  string,
  { trackId: string; trackTitle: string; lessonTitle: string; num: string }
> = ACADEMY_TRACKS.reduce(
  (acc, t) => {
    for (const l of t.lessons) {
      acc[l.id] = {
        trackId: t.id,
        trackTitle: t.title,
        lessonTitle: l.title,
        num: l.num,
      };
    }
    return acc;
  },
  {} as Record<string, { trackId: string; trackTitle: string; lessonTitle: string; num: string }>,
);
