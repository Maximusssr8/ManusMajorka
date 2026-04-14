/**
 * Majorka Academy curriculum — the full 48-lesson, 8-module data model.
 *
 * Shape is stable: lesson ids are content-addressable (`m{moduleNum}-l{lessonNum}`)
 * so server-side `academy_progress (user_id, lesson_id)` rows remain valid even
 * if a lesson title changes. Every lesson is labelled with a type, duration,
 * free/locked, and a flag for whether it renders an interactive Majorka demo.
 */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type LessonType = 'video' | 'text' | 'interactive';

export interface AcademyLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: LessonType;
  durationMinutes: number;
  isFree: boolean;
  hasMajorkaDemo: boolean;
}

export interface AcademyModule {
  id: string;
  num: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  lessons: AcademyLesson[];
  fomoTrigger?: {
    headline: string;
    cta: string;
    href: string;
  };
}

const m = (
  moduleNum: number,
  lessonNum: number,
  title: string,
  description: string,
  type: LessonType,
  durationMinutes: number,
  isFree: boolean,
  hasMajorkaDemo: boolean,
  moduleId: string,
): AcademyLesson => ({
  id: `m${moduleNum}-l${lessonNum}`,
  moduleId,
  title,
  description,
  type,
  durationMinutes,
  isFree,
  hasMajorkaDemo,
});

export const ACADEMY_CURRICULUM: AcademyModule[] = [
  {
    id: 'mod-1-what-works',
    num: '01',
    title: 'What Actually Works in Dropshipping in 2025',
    description:
      'Clear out the guru myths. Understand the business model, the margins, and what an AU/US/UK dropshipper actually competes on today.',
    difficulty: 'Beginner',
    lessons: [
      m(1, 1, 'The Real Dropshipping Economics (Margins, CAC, LTV)', 'Exact numbers: what a 30% margin actually looks like after Facebook tax.', 'video', 9, true, false, 'mod-1-what-works'),
      m(1, 2, 'Why 90% of Dropshippers Fail in the First 90 Days', 'The five patterns that kill new stores — and how to dodge every one.', 'video', 8, true, false, 'mod-1-what-works'),
      m(1, 3, 'AU vs US vs UK — Which Market Should You Start In?', 'Shipping windows, AOV, platform access, ad cost per region.', 'text', 7, true, true, 'mod-1-what-works'),
      m(1, 4, 'The 2025 Dropshipping Stack (Tools, Platforms, Costs)', 'Shopify vs WooCommerce vs TikTok Shop — and what you actually need month one.', 'video', 10, true, false, 'mod-1-what-works'),
      m(1, 5, 'Reading a Winning Product Like a Pro', 'The seven signals that separate a winner from a look-alike.', 'interactive', 12, true, true, 'mod-1-what-works'),
      m(1, 6, 'Your First 30 Days — a Realistic Roadmap', 'Week-by-week plan from store-less to first dollar.', 'text', 6, true, false, 'mod-1-what-works'),
    ],
  },
  {
    id: 'mod-2-product-research',
    num: '02',
    title: 'Product Research — Finding Winners Before Everyone Else',
    description:
      'The hardest skill in this business. Data-driven frameworks for spotting products at the beginning of their curve, not the end.',
    difficulty: 'Intermediate',
    lessons: [
      m(2, 1, 'The 4 Types of Winning Products (and which you should pick)', 'Problem-solvers, wow-factor, impulse, evergreen — the trade-offs of each.', 'video', 11, true, false, 'mod-2-product-research'),
      m(2, 2, 'Trend Velocity — Catching a Winner at Day 10, Not Day 60', 'How to read a velocity curve and when to pounce.', 'interactive', 13, true, true, 'mod-2-product-research'),
      m(2, 3, 'AliExpress Signals That Actually Matter', 'Ignore reviews. Watch orders, store age, and "recently ordered" pulse.', 'video', 9, true, true, 'mod-2-product-research'),
      m(2, 4, 'TikTok Search for Product Discovery (the right way)', 'The search strings that surface rising products, not viral replays.', 'video', 10, false, false, 'mod-2-product-research'),
      m(2, 5, 'Meta Ad Library — Reverse-Engineering Competitor Winners', 'How to tell a test from a scale, and steal the ad angle without the copy.', 'video', 12, false, false, 'mod-2-product-research'),
      m(2, 6, 'The Majorka Winning Score Explained', 'What goes into the score, why it beats raw order counts, how to use it.', 'interactive', 8, false, true, 'mod-2-product-research'),
      m(2, 7, 'Building a 20-Product Shortlist in Under an Hour', 'Live walkthrough: from dashboard to validated shortlist, fast.', 'interactive', 15, false, true, 'mod-2-product-research'),
    ],
    fomoTrigger: {
      headline:
        "You've mastered product research. Majorka's AI scores 3,715 products automatically. See live scores →",
      cta: 'See live scores',
      href: '/app/products',
    },
  },
  {
    id: 'mod-3-suppliers',
    num: '03',
    title: 'Supplier Intelligence & Logistics Mastery',
    description:
      'The part nobody teaches. How to pick suppliers who actually deliver, not just the ones with the shiniest photos.',
    difficulty: 'Intermediate',
    lessons: [
      m(3, 1, 'The 7 Metrics of a Reliable AliExpress Supplier', 'Rating, age, shipping SLA, dispute rate, refund rate, response time, order volume.', 'video', 10, true, true, 'mod-3-suppliers'),
      m(3, 2, 'Choosing Between 5 Suppliers of the Same Product', 'Decision framework when every listing looks identical.', 'interactive', 9, true, true, 'mod-3-suppliers'),
      m(3, 3, 'ePacket, Standard, AliExpress Direct — Shipping Options Decoded', 'Which carrier to request for which region, and the speed/cost trade-off.', 'video', 8, true, false, 'mod-3-suppliers'),
      m(3, 4, 'Sample-Ordering Like a Pro (and why it pays for itself)', 'A $20 sample saves $2,000 in chargebacks. Here is the playbook.', 'video', 7, false, false, 'mod-3-suppliers'),
      m(3, 5, 'Handling Delays, Refunds, and Angry Customers', 'Scripts, policies, and the customer-service stack that keeps NPS up.', 'text', 9, false, false, 'mod-3-suppliers'),
      m(3, 6, 'When to Graduate to an Agent (and who to pick)', 'The spend threshold where a sourcing agent beats AliExpress every time.', 'video', 10, false, false, 'mod-3-suppliers'),
    ],
    fomoTrigger: {
      headline:
        "Majorka's supplier intelligence rates every supplier on 7 reliability metrics in real-time. See it in action →",
      cta: 'Open supplier intelligence',
      href: '/app/products',
    },
  },
  {
    id: 'mod-4-store',
    num: '04',
    title: 'Store Building That Converts',
    description:
      'A beautiful store is a marketing asset. A converting store is a cashflow machine. These are not the same thing.',
    difficulty: 'Beginner',
    lessons: [
      m(4, 1, 'The 5 Elements of a Store That Converts at 3%+', 'What every above-average store has in common, distilled.', 'video', 10, true, false, 'mod-4-store'),
      m(4, 2, 'Writing Product Pages That Sell (Not Describe)', 'The AIDA structure translated for AliExpress dropshipping.', 'text', 12, true, false, 'mod-4-store'),
      m(4, 3, 'Imagery, Video, and Trust Signals', 'What to source from AliExpress, what to shoot yourself, what never to cut.', 'video', 9, true, false, 'mod-4-store'),
      m(4, 4, 'Mobile-First is Not a Suggestion', 'How to design for the 80% of traffic you can already predict.', 'video', 8, false, false, 'mod-4-store'),
      m(4, 5, 'Building a Store in 20 Minutes With Majorka Store Builder', 'From product pick to live storefront — real walkthrough.', 'interactive', 15, false, true, 'mod-4-store'),
      m(4, 6, 'Checkout Optimisation — the last-mile conversion gains', 'Express checkout, guest checkout, apple pay, trust badges, shipping bar.', 'text', 7, false, false, 'mod-4-store'),
    ],
  },
  {
    id: 'mod-5-meta-ads',
    num: '05',
    title: 'Facebook & Instagram Ads for Dropshippers',
    description:
      "Where most dropshippers burn their money. Run Meta like an operator, not a guru's cargo cult.",
    difficulty: 'Intermediate',
    lessons: [
      m(5, 1, 'Meta Ads in 2025 — What Actually Works Now', 'Advantage+ shopping, broad targeting, creative volume — the new rules.', 'video', 12, true, false, 'mod-5-meta-ads'),
      m(5, 2, 'Campaign Structures That Don\'t Blow Your Budget', 'CBO vs ABO, testing budgets, why 3 ad sets is almost always wrong.', 'video', 11, true, false, 'mod-5-meta-ads'),
      m(5, 3, 'Writing Ad Copy That Stops the Scroll', 'Hook-first copy frameworks, AU-native phrasing, seven headline templates.', 'text', 9, false, false, 'mod-5-meta-ads'),
      m(5, 4, 'Creative — UGC, Static, and AI-Generated Video', 'The creative stack for 2025 and how to produce 40 variants a week.', 'video', 13, false, false, 'mod-5-meta-ads'),
      m(5, 5, 'Reading the Data (CTR, CPC, CPM, CPA, ROAS)', 'The four metrics that matter, the ones to ignore, and when to kill.', 'interactive', 10, false, true, 'mod-5-meta-ads'),
      m(5, 6, 'Scaling From $20/day to $500/day', 'The incremental playbook — CBO duplication, horizontal/vertical, lookalikes.', 'video', 12, false, false, 'mod-5-meta-ads'),
      m(5, 7, 'Retargeting Without Wasting 40% of Your Spend', 'Exclusions, windows, creative refresh cadence.', 'text', 8, false, false, 'mod-5-meta-ads'),
    ],
    fomoTrigger: {
      headline:
        'You understand Meta ads. Majorka generates complete ad sets for any product in 10 seconds. Try it →',
      cta: 'Try Ads Studio',
      href: '/app/ads-studio',
    },
  },
  {
    id: 'mod-6-tiktok',
    num: '06',
    title: 'TikTok Shop & TikTok Ads',
    description:
      'The fastest-growing channel for AU/US/UK dropshippers. Organic + paid + shop — how they stack together.',
    difficulty: 'Intermediate',
    lessons: [
      m(6, 1, 'TikTok Shop vs TikTok Ads vs Organic — the playbook', 'When each channel wins and how to layer them.', 'video', 10, true, false, 'mod-6-tiktok'),
      m(6, 2, 'Producing Organic Content That Converts to Sales', 'Shoot lists, hooks, caption patterns — from zero to a pipeline of content.', 'video', 13, false, false, 'mod-6-tiktok'),
      m(6, 3, 'TikTok Shop Setup and Product Integration', 'Seller onboarding, GMV requirements, how commission actually hits.', 'text', 9, false, false, 'mod-6-tiktok'),
      m(6, 4, 'Spark Ads and Affiliate Creators', 'The two highest-leverage buttons in the TikTok Shop console.', 'video', 11, false, false, 'mod-6-tiktok'),
      m(6, 5, 'Scaling on TikTok Without Losing the Vibe', 'Scaling creative, not just spend — the creator rotation framework.', 'video', 12, false, false, 'mod-6-tiktok'),
    ],
  },
  {
    id: 'mod-7-analytics',
    num: '07',
    title: 'Analytics, Metrics & Scaling Decisions',
    description:
      'Once the ads are live, the entire game is reading numbers correctly. This module is the spreadsheet you wish you had on day one.',
    difficulty: 'Advanced',
    lessons: [
      m(7, 1, 'The Metrics That Actually Matter (and the ones to ignore)', 'A brutal hierarchy: profit > ROAS > CPA > CPC > CTR > everything else.', 'video', 10, true, false, 'mod-7-analytics'),
      m(7, 2, 'Building a P&L That Tells the Truth', 'COGS, ad spend, shipping, app fees, returns, chargebacks — the real number.', 'text', 12, false, false, 'mod-7-analytics'),
      m(7, 3, 'Attribution — What iOS14 Broke and How to Work Around It', 'UTMs, Shopify attribution, post-purchase surveys — what to actually trust.', 'video', 11, false, false, 'mod-7-analytics'),
      m(7, 4, 'The Kill/Scale Decision Tree', 'Exactly when to pause a product, when to push, when to rebuild creative.', 'interactive', 10, false, true, 'mod-7-analytics'),
      m(7, 5, 'Managing Cashflow When You Are Scaling Fast', 'Stripe reserves, Shopify payouts, float management, and avoiding margin traps.', 'text', 9, false, false, 'mod-7-analytics'),
      m(7, 6, 'Automating the Boring Parts With Majorka Alerts', 'Price alerts, velocity alerts, supplier alerts — how to stop staring at dashboards.', 'interactive', 11, false, true, 'mod-7-analytics'),
    ],
    fomoTrigger: {
      headline:
        'You have the analytics framework. Majorka surfaces these insights automatically. Upgrade →',
      cta: 'Upgrade',
      href: '/pricing',
    },
  },
  {
    id: 'mod-8-brand',
    num: '08',
    title: 'Building a Real Brand from Dropshipping',
    description:
      "The exit from the commodity race. How today's biggest DTC brands started as dropshippers and then stopped being dropshippers.",
    difficulty: 'Advanced',
    lessons: [
      m(8, 1, 'From SKU Salesman to Brand — the mindset shift', 'Why a brand compounds and a SKU decays.', 'video', 10, true, false, 'mod-8-brand'),
      m(8, 2, 'Private Labelling Your Winners', 'When to lock a supplier, what custom packaging costs, MOQ reality.', 'text', 11, false, false, 'mod-8-brand'),
      m(8, 3, 'Owning the Email Channel (Klaviyo 101)', 'Flows, campaigns, the 30% revenue most dropshippers leave on the table.', 'video', 12, false, false, 'mod-8-brand'),
      m(8, 4, 'Content, Community, and Earned Media', 'Building a brand that does not pay Meta for every single click.', 'video', 11, false, false, 'mod-8-brand'),
      m(8, 5, 'Selling Your Store — Exits, Multiples, and Acquirers', 'Empire Flippers vs Flippa vs direct — what stores actually sell for.', 'text', 9, false, false, 'mod-8-brand'),
    ],
  },
];

export const TOTAL_LESSONS = ACADEMY_CURRICULUM.reduce((sum, mod) => sum + mod.lessons.length, 0);
export const TOTAL_DURATION_MINUTES = ACADEMY_CURRICULUM.reduce(
  (sum, mod) => sum + mod.lessons.reduce((s, l) => s + l.durationMinutes, 0),
  0,
);

export function totalLessonsInModule(module: AcademyModule): number {
  return module.lessons.length;
}

export function totalDurationInModule(module: AcademyModule): number {
  return module.lessons.reduce((sum, l) => sum + l.durationMinutes, 0);
}
