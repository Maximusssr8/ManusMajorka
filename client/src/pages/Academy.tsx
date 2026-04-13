import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { BookOpen, Lock, CheckCircle2, Clock, Play, X, Check } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type PlanTier = 'free' | 'trial' | 'builder' | 'scale';

interface QuizQuestion {
  question: string;
  options: [string, string, string];
  correctIndex: number;
  hint: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  content: string;
  videoUrl?: string;
  videoNote?: string;
  actionLink?: { label: string; href: string };
  quiz: [QuizQuestion, QuizQuestion];
}

interface Track {
  number: string;
  id: string;
  title: string;
  requiredPlan: PlanTier;
  lessons: Lesson[];
}

interface LessonProgress {
  read: boolean;
  quizPassed?: boolean;
}

type ProgressMap = Record<string, LessonProgress>;

// ── Quiz data per lesson ──────────────────────────────────────────────────
const QUIZZES: Record<string, [QuizQuestion, QuizQuestion]> = {
  'trend-velocity': [
    {
      question: 'A product with 400 orders growing 25%/week scores _____ than one with 10K flat orders',
      options: ['Higher', 'Lower', 'Same'],
      correctIndex: 0,
      hint: 'Trend Velocity rewards acceleration, not total volume.',
    },
    {
      question: 'What score range should AU operators use as a conviction list?',
      options: ['Above 60', 'Above 80', 'Above 90'],
      correctIndex: 2,
      hint: 'The lesson mentions above 80 as a strong shortlist and above 90 as conviction.',
    },
  ],
  'market-split': [
    {
      question: 'Which market rewards premium positioning?',
      options: ['US', 'AU', 'UK'],
      correctIndex: 1,
      hint: 'Australia is smaller with slower shipping tolerance and rewards premium positioning.',
    },
    {
      question: 'A product doing 80% US volume but 5% AU is...',
      options: ['A risk', 'An opportunity', 'Irrelevant'],
      correctIndex: 1,
      hint: 'Imbalance signals opportunity if the product fits AU logistics and audience.',
    },
  ],
  'opportunity-score': [
    {
      question: 'Opportunity Score penalises products that are...',
      options: ['Low priced', 'Already running many Meta ads', 'New to market'],
      correctIndex: 1,
      hint: 'Unlike raw velocity, Opportunity Score penalises high competition saturation.',
    },
    {
      question: 'What is the recommended minimum Opportunity Score filter?',
      options: ['Above 50', 'Above 75', 'Above 95'],
      correctIndex: 1,
      hint: 'The lesson suggests setting Opportunity Score above 75 as your top filter.',
    },
  ],
  'first-pipeline': [
    {
      question: 'How many candidates should a product pipeline hold?',
      options: ['1 to 3', '5 to 10', '20 to 30'],
      correctIndex: 1,
      hint: 'A standing shortlist of 5 to 10 candidates rotated weekly.',
    },
    {
      question: 'What is the recommended test budget per candidate?',
      options: ['$20 AUD total', '$60 AUD over 3 days', '$200 AUD over a week'],
      correctIndex: 1,
      hint: 'Run one $20 AUD test per candidate across 3 days for a clear signal.',
    },
  ],
  'ai-store-generator': [
    {
      question: 'How long does the AI Store Generator take to produce a draft?',
      options: ['Under 2 minutes', 'About 15 minutes', 'Over an hour'],
      correctIndex: 0,
      hint: 'The generator produces a full Shopify-ready draft in under two minutes.',
    },
    {
      question: 'What should you treat the AI output as?',
      options: ['A finished product', 'A starting draft', 'A competitor analysis'],
      correctIndex: 1,
      hint: 'AI gets 90% right but always check claims, warranty text, and shipping times.',
    },
  ],
  'shopify-sync': [
    {
      question: 'Where do you generate a custom app for Shopify sync?',
      options: ['Shopify App Store', 'Settings > Apps and sales channels > Develop apps', 'Majorka dashboard'],
      correctIndex: 1,
      hint: 'Generate under Settings > Apps and sales channels > Develop apps in Shopify admin.',
    },
    {
      question: 'What should AU stores set before the first sync?',
      options: ['Theme to dark mode', 'Base currency to AUD', 'Language to en-AU'],
      correctIndex: 1,
      hint: 'Set base currency to AUD to avoid conversion display issues at checkout.',
    },
  ],
  'descriptions-convert': [
    {
      question: 'A converting description answers how many questions in the first 50 words?',
      options: ['One', 'Three', 'Five'],
      correctIndex: 1,
      hint: 'What is it, why should I care, and why now — three questions.',
    },
    {
      question: 'What format works best for mobile AU traffic?',
      options: ['Long paragraphs', 'Bullet points', 'Full-width images'],
      correctIndex: 1,
      hint: 'Bullet points beat paragraphs on mobile, where 70%+ of AU traffic lives.',
    },
  ],
  'au-pricing': [
    {
      question: 'A $49 product with free shipping outperforms...',
      options: ['$39 + $10 shipping', '$49 + free shipping', 'Neither'],
      correctIndex: 0,
      hint: 'AU shoppers anchor on round numbers and free shipping over raw price.',
    },
    {
      question: 'For products above $80 AUD, what should you add?',
      options: ['Express shipping only', 'Afterpay or Zip badges', 'Volume discounts'],
      correctIndex: 1,
      hint: 'Afterpay or Zip as visible badges near the price can lift conversion 10-20%.',
    },
  ],
  'meta-setup': [
    {
      question: 'What campaign type should dropshippers default to?',
      options: ['Manual CBO campaigns', 'Advantage+ Shopping campaigns', 'Reach campaigns'],
      correctIndex: 1,
      hint: 'Use Advantage+ Shopping campaigns — Meta auto-optimises well since late 2024.',
    },
    {
      question: 'How long should you wait before touching a new ad set?',
      options: ['24 hours', '3 days minimum', '2 weeks'],
      correctIndex: 1,
      hint: 'Let the algorithm learn for 3 days minimum — impatience kills more accounts.',
    },
  ],
  'ai-copy': [
    {
      question: 'What part of AI copy should you always edit manually?',
      options: ['The CTA', 'The first line (hook)', 'The hashtags'],
      correctIndex: 1,
      hint: 'The first line is the hook — AI tends to open with soft questions that scroll past.',
    },
    {
      question: 'How many AI copy variations should you generate?',
      options: ['1 to 2', '5 to 10', '20+'],
      correctIndex: 1,
      hint: 'Generate 5 to 10 variations and pick the one closest to human-written.',
    },
  ],
  'tiktok-vs-meta': [
    {
      question: 'For new AU operators in 2026, which platform should you start with?',
      options: ['TikTok', 'Meta', 'Both simultaneously'],
      correctIndex: 1,
      hint: 'Start with Meta — deeper audience data, more mature tooling, Advantage+ scales AU.',
    },
    {
      question: 'TikTok wins for impulse categories under...',
      options: ['$20 AUD', '$40 AUD', '$80 AUD'],
      correctIndex: 1,
      hint: 'TikTok wins under $40 AUD, Meta wins for considered purchases above $60 AUD.',
    },
  ],
  'reading-metrics': [
    {
      question: 'What is a good CPM benchmark for AU?',
      options: ['Under $10 AUD', 'Under $25 AUD', 'Under $50 AUD'],
      correctIndex: 1,
      hint: 'Under $25 AUD CPM is good for AU — it means creative and targeting are healthy.',
    },
    {
      question: 'How should you scale a winning ad set?',
      options: ['Edit the original budget', 'Duplicate with 50% budget increase', 'Triple the budget overnight'],
      correctIndex: 1,
      hint: 'Duplicate the ad set with a 50% increase — editing resets learning.',
    },
  ],
  // ── Track 4: Getting Started in Ecommerce ──
  'what-is-dropshipping': [
    {
      question: 'What is the main advantage of dropshipping for new operators?',
      options: ['High upfront inventory investment', 'No inventory required — supplier ships direct', 'Guaranteed profits from day one'],
      correctIndex: 1,
      hint: 'Dropshipping means you never hold stock — the supplier ships directly to your customer.',
    },
    {
      question: 'Why is AU a strong market for dropshippers?',
      options: ['Lowest shipping costs globally', 'High AUD purchasing power and strong consumer protection', 'No tax obligations'],
      correctIndex: 1,
      hint: 'Australia has high purchasing power, strong consumer law, and an Afterpay culture that boosts AOV.',
    },
  ],
  'picking-niche': [
    {
      question: 'What framework does the lesson recommend for niche selection?',
      options: ['Price + colour + trend', 'Volume + competition + passion', 'Brand + logo + domain'],
      correctIndex: 1,
      hint: 'Use volume, competition, and passion as your three niche selection criteria.',
    },
    {
      question: 'Which Majorka tabs help you find a niche quickly?',
      options: ['Settings and API Keys', 'Hot Now and High Profit smart tabs', 'Revenue and Alerts'],
      correctIndex: 1,
      hint: 'The Hot Now and High Profit smart tabs on the Products page are your starting filters.',
    },
  ],
  'shopify-setup': [
    {
      question: 'What payment method should AU stores integrate for higher conversion?',
      options: ['Bank transfer only', 'Afterpay', 'Cryptocurrency'],
      correctIndex: 1,
      hint: 'Afterpay is essential for AU stores — it splits payments and lifts conversion significantly.',
    },
    {
      question: 'What must you configure for correct AU tax handling?',
      options: ['VAT settings', 'GST settings', 'Sales tax nexus'],
      correctIndex: 1,
      hint: 'Australian stores need GST configured correctly in Shopify tax settings.',
    },
  ],
  'first-hundred': [
    {
      question: 'On Day 1 of the 7-day plan, what should you do?',
      options: ['Launch Meta ads immediately', 'Find a product using Majorka Products', 'Register a trademark'],
      correctIndex: 1,
      hint: 'Day 1 is product research — use the Majorka Products tab to find your first winner.',
    },
    {
      question: 'What daily ad budget does the plan recommend?',
      options: ['A$5/day', 'A$20/day', 'A$100/day'],
      correctIndex: 1,
      hint: 'The plan suggests launching Meta ads at A$20/day — enough for signal without burning capital.',
    },
  ],
  // ── Track 5: Scaling from $100 to $10K/month ──
  'when-to-scale': [
    {
      question: 'What ROAS threshold indicates break-even for most AU products?',
      options: ['1.0x', '1.5x', '3.0x'],
      correctIndex: 1,
      hint: '1.5x ROAS is the typical break-even point once you factor in product cost, shipping, and fees.',
    },
    {
      question: 'When should you kill an ad set?',
      options: ['After 24 hours with no sales', 'After spending 3x product price with ROAS below 1.3', 'After 1 week regardless of results'],
      correctIndex: 1,
      hint: 'Kill anything below 1.3 ROAS after spending at least 3x your product price.',
    },
  ],
  'supplier-management': [
    {
      question: 'When should you switch from AliExpress to CJ Dropshipping?',
      options: ['Immediately on your first order', 'When you need faster shipping and better packaging', 'Only when selling above $10K/month'],
      correctIndex: 1,
      hint: 'CJ offers faster shipping, custom packaging, and AU warehouse options — switch when speed matters.',
    },
    {
      question: 'What is a 3PL?',
      options: ['A third-party logistics provider that stores and ships your stock', 'A type of Meta ad placement', 'A Shopify pricing plan'],
      correctIndex: 0,
      hint: 'Third-party logistics providers handle warehousing and fulfillment so you can focus on marketing.',
    },
  ],
  'customer-service': [
    {
      question: 'What is a key obligation under AU consumer law for online sellers?',
      options: ['Free returns on all items', 'Products must match their description and be fit for purpose', 'Unlimited warranty on everything'],
      correctIndex: 1,
      hint: 'Australian Consumer Law requires products to match descriptions and be of acceptable quality.',
    },
    {
      question: 'How can you handle customer service without it eating your margin?',
      options: ['Ignore all complaints', 'Use AI-drafted templates for common issues', 'Outsource to an overseas call center immediately'],
      correctIndex: 1,
      hint: 'Template responses for common issues save time — use Maya AI to draft them.',
    },
  ],
  'multi-vs-single': [
    {
      question: 'When does a single-product store make more sense than a general store?',
      options: ['Always — general stores never work', 'When you have a proven winner and want to build a brand around it', 'Only for products under $20'],
      correctIndex: 1,
      hint: 'Single-product stores excel when you have a validated winner and want maximum conversion.',
    },
    {
      question: 'What is the main risk of a general store?',
      options: ['Higher Shopify fees', 'Diluted brand identity and lower conversion rate', 'Cannot use Afterpay'],
      correctIndex: 1,
      hint: 'General stores spread trust signals thin — visitors are less likely to buy from an unfocused brand.',
    },
  ],
  // ── Track 6: Advanced Operations ──
  'developer-api': [
    {
      question: 'What can you build with the Majorka Developer API?',
      options: ['Only read product data', 'Automated workflows like alerts when a product scores above 90', 'Nothing — it is read-only documentation'],
      correctIndex: 1,
      hint: 'The API enables automations — e.g., n8n webhooks that alert you on high-scoring products.',
    },
    {
      question: 'Where do you get your API key?',
      options: ['/app/settings', '/app/api-keys', '/app/products'],
      correctIndex: 1,
      hint: 'Navigate to /app/api-keys to generate and manage your API credentials.',
    },
  ],
  'tiktok-vs-meta-budget': [
    {
      question: 'What is TikTok Shop best suited for in the AU market?',
      options: ['High-ticket luxury items', 'Impulse purchases under $40 AUD', 'B2B sales'],
      correctIndex: 1,
      hint: 'TikTok Shop excels at low-cost impulse buys — the content format drives spontaneous purchases.',
    },
    {
      question: 'What advantage does Meta have over TikTok for AU advertisers in 2026?',
      options: ['Lower CPMs', 'Deeper audience targeting data and more mature tooling', 'Free ad credits'],
      correctIndex: 1,
      hint: 'Meta has years of AU audience data and Advantage+ Shopping campaigns that scale reliably.',
    },
  ],
  'competitor-intelligence': [
    {
      question: 'What is the primary tool for researching competitor ads?',
      options: ['Google Search', 'Meta Ad Library and Majorka Competitor Spy', 'Asking on Reddit'],
      correctIndex: 1,
      hint: 'Meta Ad Library shows all active ads, and Competitor Spy analyses any Shopify store.',
    },
    {
      question: 'What should you look for when analysing a competitor store?',
      options: ['Their exact product photos to copy', 'Pricing strategy, trust signals, and ad creative angles', 'Their supplier contact information'],
      correctIndex: 1,
      hint: 'Study their pricing, trust signals, and creative angles — not to copy, but to differentiate.',
    },
  ],
  'building-brand': [
    {
      question: 'What is the first step in moving from dropshipping to a branded DTC business?',
      options: ['Buy a warehouse immediately', 'Private label your winning product and register a trademark', 'Stop all advertising'],
      correctIndex: 1,
      hint: 'Private labeling your proven winner and trademarking the brand is the natural next step.',
    },
    {
      question: 'Why is building an email list important for brand longevity?',
      options: ['Email is free to send', 'You own the audience — no algorithm changes can take it away', 'Emails have 100% open rates'],
      correctIndex: 1,
      hint: 'Unlike social followers, your email list is an owned asset that no platform can throttle.',
    },
  ],
};

// ── Track content ──────────────────────────────────────────────────────────
const TRACKS: Track[] = [
  {
    number: '01',
    id: 'finding-winners',
    title: 'Finding Winners',
    requiredPlan: 'builder',
    lessons: [
      {
        id: 'trend-velocity',
        title: 'How Trend Velocity Score works',
        duration: '8 min read',
        difficulty: 'Beginner',
        content:
          'Trend Velocity Score measures how fast a product is gaining traction across the last 7, 14, and 30 days — not how many total orders it has. A product sitting at 10,000 lifetime orders with flat weekly growth scores lower than a product with 400 orders growing 25% week over week. The score rewards acceleration, which is when margins are still intact and ad costs have not been bid up by every other dropshipper. For AU operators, use scores above 80 as a strong shortlist and above 90 as a conviction list worth testing this week. Always cross-check the velocity against Meta ad library saturation before committing budget.',
        videoUrl: '',
        videoNote: 'Video walkthrough coming this month',
        actionLink: { label: 'Try it now — browse Products →', href: '/app/products?tab=trending' },
        quiz: QUIZZES['trend-velocity'],
      },
      {
        id: 'market-split',
        title: 'Reading the AU/US/UK market split',
        duration: '7 min read',
        difficulty: 'Beginner',
        content:
          'The same product rarely performs identically across AU, US, and UK. Australia is smaller, has slower shipping tolerance, and rewards premium positioning. The US is high volume but brutally competitive on ad cost. The UK sits in the middle with strong conversion on home and lifestyle categories. When you see the market split on a product card, look for imbalance: a product doing 80% of its volume in the US but only 5% in AU is an opportunity if the product is light, ships fast from local 3PLs, and has a hook that speaks to an Aussie audience. Local-market winners almost always win faster than global winners.',
        quiz: QUIZZES['market-split'],
      },
      {
        id: 'opportunity-score',
        title: 'Using Opportunity Score to filter',
        duration: '6 min read',
        difficulty: 'Intermediate',
        content:
          'Opportunity Score blends trend velocity, competition saturation, and margin potential into one number between 0 and 100. Unlike raw velocity, it penalises products already running on hundreds of Meta ads. Use it as your top filter when you have more than 50 candidates. A pragmatic workflow is to set Opportunity Score above 75, price between $29 and $79 AUD, and sold count above 300. That leaves you with roughly 15 to 25 candidates per week to review manually. Do not trust the score blindly — always open the ad library and check creative quality before testing.',
        quiz: QUIZZES['opportunity-score'],
      },
      {
        id: 'first-pipeline',
        title: 'Setting up your first product pipeline',
        duration: '9 min read',
        difficulty: 'Intermediate',
        content:
          'A product pipeline is a standing shortlist of 5 to 10 candidates you rotate through testing each week. Save products to a named list in Majorka, tag them by category, and set a rule: nothing enters the pipeline without a score above 75 and an existing Meta ad getting traction. Each week, kill the bottom two and add two fresh ones. Run one $20 AUD test per candidate across 3 days — that is $60 AUD per product for a clear kill or scale signal. A consistent pipeline beats hero shots every time because it converts product research from a guessing game into a repeatable process.',
        quiz: QUIZZES['first-pipeline'],
      },
    ],
  },
  {
    number: '02',
    id: 'building-store',
    title: 'Building Your Store',
    requiredPlan: 'scale',
    lessons: [
      {
        id: 'ai-store-generator',
        title: 'AI Store Generator walkthrough',
        duration: '10 min read',
        difficulty: 'Beginner',
        content:
          'The AI Store Generator takes a product URL and produces a full Shopify-ready store draft in under two minutes — hero copy, product page sections, FAQ, trust badges, and a checkout-optimised theme. Start by pasting the AliExpress or Majorka product link, then pick a tone (premium, playful, or clinical). Review every generated section before publishing — AI gets 90% right but always check claims, warranty text, and shipping times for accuracy. Treat the output as a starting draft, not a finished product. The real edge is speed: you go from idea to live store in the time it used to take to write one hero headline.',
        quiz: QUIZZES['ai-store-generator'],
      },
      {
        id: 'shopify-sync',
        title: 'Shopify sync setup',
        duration: '6 min read',
        difficulty: 'Beginner',
        content:
          'Syncing with Shopify means connecting your store via the admin API so Majorka can push products, update inventory, and pull order data automatically. Generate a custom app in your Shopify admin under Settings → Apps and sales channels → Develop apps, then grant read/write access to products, inventory, and orders. Paste the access token into Majorka settings. Once connected, pushing a product takes one click. For AU stores, set your base currency to AUD before the first sync to avoid conversion display issues at checkout.',
        quiz: QUIZZES['shopify-sync'],
      },
      {
        id: 'descriptions-convert',
        title: 'Writing product descriptions that convert',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content:
          'A converting description answers three questions in the first 50 words: what is it, why should I care, and why now. Skip the generic feature dump. Lead with the outcome — "stop dog hair destroying your car interior" — then follow with two or three specific proof points. Bullet points beat paragraphs on mobile, which is where 70%+ of AU traffic lives. Always include a size, weight, or capacity number to anchor credibility. End with a soft urgency line like "ships from Sydney in 2-5 days" to close the decision loop. Read your own copy out loud — if it sounds like a brochure, rewrite it.',
        quiz: QUIZZES['descriptions-convert'],
      },
      {
        id: 'au-pricing',
        title: 'Pricing strategy for AU market',
        duration: '7 min read',
        difficulty: 'Advanced',
        content:
          'Australian shoppers anchor on round numbers and free shipping over raw price. A $49 AUD product with free shipping routinely outperforms the same product at $39 AUD + $10 shipping, even though the total is identical. Build your price on a 3x to 4x markup from landed cost (product + shipping + payment fees + packaging). Include a compare-at strikethrough at roughly 30% above the sale price — not 60%, which reads as a scam. For products above $80 AUD, add Afterpay or Zip as visible badges near the price. These two details alone can lift AU conversion by 10 to 20%.',
        quiz: QUIZZES['au-pricing'],
      },
    ],
  },
  {
    number: '03',
    id: 'running-ads',
    title: 'Running Ads',
    requiredPlan: 'scale',
    lessons: [
      {
        id: 'meta-setup',
        title: 'Meta Ads setup for dropshippers',
        duration: '12 min read',
        difficulty: 'Intermediate',
        content:
          'Before a single dollar spends, verify your domain in Business Manager, set up the Meta Pixel with Conversions API, and configure 8 priority events (Purchase at the top). For dropshippers, use Advantage+ Shopping campaigns as your default — Meta has gotten significantly better at auto-optimising since late 2024. Start with a $30 AUD daily budget per ad set, three creatives minimum, and broad targeting (age 22-55, AU only). Avoid interest stacking unless you are past $500/day in spend. Let the algorithm learn for 3 days minimum before you touch anything — impatience kills more accounts than bad creative.',
        quiz: QUIZZES['meta-setup'],
      },
      {
        id: 'ai-copy',
        title: 'Using AI-generated copy effectively',
        duration: '6 min read',
        difficulty: 'Beginner',
        content:
          'AI-generated ad copy works best when you feed it specifics: who the product is for, the exact pain point, and the proof. Generic prompts produce generic copy. Always generate 5 to 10 variations and pick the one that feels closest to a human wrote it. Edit the first line manually — that is the hook, and AI tends to open with soft questions that scroll past easily. Keep the body under 80 words for Reels and Stories, longer for static feed placements. Test AI copy against your own writing head-to-head for the first month to calibrate what works for your niche.',
        quiz: QUIZZES['ai-copy'],
      },
      {
        id: 'tiktok-vs-meta',
        title: 'TikTok Shop vs Meta: which to start with',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content:
          'For new AU operators in 2026, start with Meta. TikTok Shop AU is still maturing, ad pixel reporting is less reliable, and organic reach is harder to convert than the feed suggests. Meta has deeper audience data, more mature creative tooling, and Advantage+ Shopping reliably scales AU campaigns. Once you have one profitable product running on Meta, add TikTok as a second channel — do not run both from day one. TikTok wins for impulse categories under $40 AUD, Meta wins for considered purchases above $60 AUD. Match the platform to the price point, not to the hype.',
        quiz: QUIZZES['tiktok-vs-meta'],
      },
      {
        id: 'reading-metrics',
        title: 'Reading your ad metrics',
        duration: '9 min read',
        difficulty: 'Advanced',
        content:
          'The three numbers that actually matter are CPM, CTR, and ROAS — in that order. CPM tells you if your creative and targeting are healthy (under $25 AUD is good for AU). CTR tells you if the hook works (aim for 1.5%+ on feed, 2%+ on Reels). ROAS is the final scoreboard, but only look at it after spending at least 3x your product price per ad set. Kill anything below 1.3 ROAS after $60 AUD spend. Scale winners by duplicating the ad set with a 50% budget increase, not by editing the original — editing resets learning. Report on blended ROAS across the account weekly, not daily.',
        quiz: QUIZZES['reading-metrics'],
      },
    ],
  },
  {
    number: '04',
    id: 'getting-started',
    title: 'Getting Started in Ecommerce',
    requiredPlan: 'trial',
    lessons: [
      {
        id: 'what-is-dropshipping',
        title: 'What is dropshipping and why AU operators use it',
        duration: '6 min read',
        difficulty: 'Beginner',
        content:
          'Dropshipping is a retail model where you sell products without holding inventory. When a customer orders from your store, the supplier ships directly to them. You never touch the product. This means near-zero upfront cost — no warehouse, no bulk purchasing, no unsold stock risk. For Australian operators specifically, the model is powerful: the high AUD purchasing power lets you source globally at competitive rates, strong AU consumer protection builds buyer confidence, and the Afterpay culture means customers happily spend more per order when they can split payments. The trade-off is lower margins than traditional retail, but the speed to market is unmatched. You can go from idea to live store in a single weekend. Use Majorka\'s Products tab to skip months of manual research — the intelligence layer surfaces winning products so you can focus on selling, not searching.',
        actionLink: { label: 'Browse winning products →', href: '/app/products' },
        quiz: QUIZZES['what-is-dropshipping'],
      },
      {
        id: 'picking-niche',
        title: 'How to pick your first niche (with data, not guessing)',
        duration: '8 min read',
        difficulty: 'Beginner',
        content:
          'Most beginners pick a niche based on gut feeling and fail within weeks. Data-driven niche selection uses three criteria: volume (is there enough demand?), competition (how saturated is it?), and passion (can you create content about it without burning out?). Proven AU niches include pet accessories, beauty tools, kitchen gadgets, and fitness gear — categories where Australian consumers consistently spend and where shipping weight stays low. Do not chase trending niches you know nothing about. Instead, find the intersection of market demand and personal interest. Use the Smart Tabs on the Products page — "Hot Now" shows what is trending this week, and "High Profit" filters for margin-friendly products. Cross-reference with the market split data to confirm AU demand specifically. A niche with strong US numbers but weak AU traction might still work if shipping logistics are favourable.',
        actionLink: { label: 'Explore Hot Now products →', href: '/app/products?tab=hot' },
        quiz: QUIZZES['picking-niche'],
      },
      {
        id: 'shopify-setup',
        title: 'Setting up Shopify in under 30 minutes',
        duration: '10 min read',
        difficulty: 'Beginner',
        content:
          'Step 1: Sign up at shopify.com — use the free trial to start without payment. Step 2: Pick a clean, fast theme. Dawn or Refresh work well for dropshipping. Avoid heavy themes with animations. Step 3: Add your payment provider. Shopify Payments is the default for AU, but you must also add Afterpay — it is non-negotiable for AU conversion. Step 4: Configure shipping. Set up Australia Post rates or flat-rate shipping. Free shipping above a threshold (e.g., $59 AUD) is the proven AU strategy. Step 5: GST settings. Go to Settings > Taxes and duties, enable Australian GST at 10%, and include it in your prices. Step 6: Add essential pages — About, Contact, Shipping Policy, Refund Policy. Australian Consumer Law requires clear refund information. Step 7: Connect your domain. Use Majorka\'s Store Builder to generate your brand identity, push products to Shopify, and go live with professional copy and imagery in minutes instead of days.',
        actionLink: { label: 'Try Store Builder →', href: '/app/store-builder' },
        quiz: QUIZZES['shopify-setup'],
      },
      {
        id: 'first-hundred',
        title: 'Your first $0 to $100 — the 7-day launch plan',
        duration: '12 min read',
        difficulty: 'Beginner',
        content:
          'This is the exact 7-day playbook to go from zero to your first sale. Day 1: Find your product. Open Majorka Products, filter by Opportunity Score above 75, price $29-$69 AUD, and pick one product with clear AU demand. Day 2: Build your store. Use Store Builder to generate a brand name, logo, colour palette, and Shopify-ready product pages. Push to Shopify in one click. Day 3: Write your ads. Open Ads Studio, paste your product link, and generate 5 ad copy variations plus creative briefs. Pick the strongest three. Day 4-5: Launch Meta ads. Set up an Advantage+ Shopping campaign at A$20/day with your three creatives, broad targeting AU 22-55. Do not touch it for 48 hours. Day 6-7: Analyse results. Check CPM, CTR, and add-to-cart rate. If CTR is above 1.5% and you have add-to-carts, increase budget by 50%. If not, swap creative and test again. Follow this exact plan using only Majorka — every step is built in. Most operators who follow this sequence see their first sale within the first week.',
        actionLink: { label: 'Start with Products →', href: '/app/products?tab=opportunity' },
        quiz: QUIZZES['first-hundred'],
      },
    ],
  },
  {
    number: '05',
    id: 'scaling-revenue',
    title: 'Scaling from $100 to $10K/month',
    requiredPlan: 'builder',
    lessons: [
      {
        id: 'when-to-scale',
        title: 'When to scale: reading your ad metrics correctly',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content:
          'Scaling too early kills more stores than bad products. Before you increase spend, understand your numbers. ROAS (Return on Ad Spend) is the north star: 1.5x is break-even for most AU products once you factor in product cost, shipping, payment fees, and returns. Below 1.5x you are losing money. Above 2x you have a genuine winner. CPA (Cost Per Acquisition) should be under 40% of your product price — if your product is $59 AUD, your CPA must stay under $24. The kill rule: after spending 3x your product price on an ad set with ROAS below 1.3, turn it off. No exceptions. The scale rule: when an ad set holds above 2x ROAS for 3+ days, duplicate it with a 50% budget increase. Never edit the original — it resets Meta\'s learning. Track all of this in Majorka\'s Revenue page, where blended ROAS, CPA, and daily revenue are calculated automatically across all your connected stores.',
        actionLink: { label: 'View your Revenue dashboard →', href: '/app/revenue' },
        quiz: QUIZZES['when-to-scale'],
      },
      {
        id: 'supplier-management',
        title: 'Supplier management — AliExpress vs CJ vs local AU 3PLs',
        duration: '9 min read',
        difficulty: 'Intermediate',
        content:
          'Your supplier choice directly impacts customer satisfaction and refund rates. AliExpress is fine for testing — low minimums, wide selection, but shipping takes 15-30 days to AU. Once you have a validated winner doing 5+ orders per day, switch to CJ Dropshipping. CJ offers faster shipping (7-15 days), custom packaging, quality inspection, and AU warehouse options for select products. For products doing 20+ orders per day, consider a local AU 3PL like ShipBob AU or Sendle. You bulk-order inventory to their warehouse and they fulfill same-day — customers get 2-5 day delivery. The cost per unit is higher, but your refund rate drops and repeat purchases increase. Quality control matters at every level: order samples before listing, check packaging condition on arrival, and monitor customer feedback weekly. Compare supplier costs in the product detail panel on Majorka — landed cost including shipping is calculated for each supplier option.',
        quiz: QUIZZES['supplier-management'],
      },
      {
        id: 'customer-service',
        title: 'Customer service that does not kill your margin',
        duration: '7 min read',
        difficulty: 'Intermediate',
        content:
          'Customer service is where most dropshippers bleed money — not from refunds, but from time spent on repetitive inquiries. The fix is systematisation. First, know your obligations: Australian Consumer Law requires that products match their description, are of acceptable quality, and are fit for purpose. You must offer a remedy (repair, replacement, or refund) for faulty goods — "no refunds" policies are illegal for AU consumers. Second, build templates for the five most common issues: where is my order, I want a refund, the product is damaged, it does not match the description, and Afterpay disputes. Use Maya AI to draft these templates — give it your shipping times, refund policy, and tone of voice, and it generates professional responses in seconds. Third, set expectations upfront: shipping timeframes on the product page, order confirmation emails with tracking, and proactive delay notifications. Eighty percent of support tickets disappear when customers know what to expect before they ask.',
        actionLink: { label: 'Draft templates with Maya AI →', href: '/app/ai-chat' },
        quiz: QUIZZES['customer-service'],
      },
      {
        id: 'multi-vs-single',
        title: 'Multi-product stores vs single-product — when to pivot',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content:
          'There are three store models: general store (many products, many categories), niche store (one category, multiple products), and single-product store (one hero product). General stores are great for testing — you can rotate products quickly without rebuilding. But conversion rates are typically 1-2% because trust is diluted. Niche stores hit 2-4% conversion by building category authority. Single-product stores can reach 4-8% because every element is optimised for one offer. The pivot framework: start general to find winners, then extract your best performer into a niche or single-product store once it proves itself (above 2x ROAS for 2+ weeks). Do not build a single-product store around an unvalidated product — that is the most common expensive mistake. Use Store Builder\'s Marketplace tab to manage multiple stores from one dashboard. You can run a general testing store and two or three branded niche stores simultaneously without losing track of inventory or orders.',
        actionLink: { label: 'Manage stores in Store Builder →', href: '/app/store-builder' },
        quiz: QUIZZES['multi-vs-single'],
      },
    ],
  },
  {
    number: '06',
    id: 'advanced-operations',
    title: 'Advanced Operations',
    requiredPlan: 'scale',
    lessons: [
      {
        id: 'developer-api',
        title: 'Using the Majorka Developer API to automate your workflow',
        duration: '10 min read',
        difficulty: 'Advanced',
        content:
          'The Majorka API lets you programmatically access product intelligence, store data, and analytics. This is for operators who want to build custom automations beyond what the dashboard offers. Common use cases: an n8n or Make webhook that alerts your Slack channel when a product scores above 90, a Google Sheet that auto-populates with your top 20 products daily, or a custom dashboard that blends Majorka data with your Shopify and Meta analytics. To get started: navigate to /app/api-keys to generate your key. The API uses standard REST with JSON responses. Authentication is via Bearer token in the Authorization header. Rate limits are generous for Scale plan users — 1,000 requests per hour. Read the full documentation at /app/api-docs, which includes example requests for every endpoint, response schemas, and code snippets in JavaScript, Python, and cURL. Start with the /products endpoint to pull your filtered product list, then explore /analytics for revenue data.',
        actionLink: { label: 'Get your API key →', href: '/app/api-keys' },
        quiz: QUIZZES['developer-api'],
      },
      {
        id: 'tiktok-vs-meta-budget',
        title: 'TikTok Shop vs Meta Ads — where to put your budget in 2026',
        duration: '9 min read',
        difficulty: 'Advanced',
        content:
          'The AU advertising landscape in 2026 has two dominant channels: Meta (Facebook and Instagram) and TikTok. Meta remains the workhorse — Advantage+ Shopping campaigns scale reliably, audience data is the deepest, and ROAS tracking is mature. TikTok Shop is the growth story — organic reach is still achievable, CPMs are 20-40% lower than Meta in AU, and the in-app checkout removes friction. The budget framework: if you are spending under $3K/month, go all-in on Meta. Between $3K-$10K, allocate 70% Meta and 30% TikTok. Above $10K, test a 50/50 split and let ROAS data guide rebalancing. TikTok wins for impulse products under $40 AUD — beauty tools, gadgets, novelty items. Meta wins for considered purchases above $60 AUD — home improvement, fitness equipment, premium pet products. Check the TikTok Leaderboard in Majorka to see which products are trending on TikTok specifically, then cross-reference with your Meta performance data to find products that work on both platforms.',
        actionLink: { label: 'View TikTok Leaderboard →', href: '/app/tiktok-leaderboard' },
        quiz: QUIZZES['tiktok-vs-meta-budget'],
      },
      {
        id: 'competitor-intelligence',
        title: 'Competitor intelligence — spy without getting caught',
        duration: '8 min read',
        difficulty: 'Advanced',
        content:
          'Understanding your competitors is not optional at scale — it is how you find angles, avoid saturated products, and price intelligently. Start with the Meta Ad Library (facebook.com/ads/library): search by keyword or competitor page name to see every active ad, when it launched, and which platforms it runs on. Ads running for 30+ days are likely profitable — study their hooks, offers, and creative formats. Next, analyse their stores: use Majorka\'s Competitor Spy to input any Shopify store URL and get a breakdown of their product range, pricing strategy, estimated traffic, and tech stack. Look for gaps — products they sell but do not advertise aggressively, price points they avoid, and trust signals they miss. Third, monitor their pricing weekly. If a competitor drops price on a shared product, do not race to the bottom — differentiate on bundle value, faster shipping, or better creative instead. The goal is intelligence, not imitation. Operators who research competitors weekly consistently outperform those who guess.',
        actionLink: { label: 'Try Competitor Spy →', href: '/app/competitor-spy' },
        quiz: QUIZZES['competitor-intelligence'],
      },
      {
        id: 'building-brand',
        title: 'Building a brand that outlasts the product',
        duration: '10 min read',
        difficulty: 'Advanced',
        content:
          'Dropshipping is a starting strategy, not a destination. The operators who build real wealth transition from reselling generic products to owning a brand. Step 1: Private label your winner. Once a product sustains 20+ orders per day for a month, contact the manufacturer about custom branding — your logo on the product, custom packaging, and a unique colourway. Minimum order quantities are typically 200-500 units. Step 2: Register your trademark. In Australia, apply through IP Australia (ipaustralia.gov.au). A standard trademark costs about $250 AUD per class and protects your brand name and logo for 10 years. Step 3: Build an email list from day one. Use Klaviyo or Mailchimp, offer a 10% discount popup, and send a weekly email. Your email list is the only audience you truly own — no algorithm changes can take it away. Step 4: Create content that builds authority in your niche. Use Store Builder\'s AI to generate your brand identity — name, visual language, tone of voice — and carry it consistently across your store, ads, emails, and social channels. The brand becomes more valuable than any single product.',
        actionLink: { label: 'Build your brand with Store Builder →', href: '/app/store-builder' },
        quiz: QUIZZES['building-brand'],
      },
    ],
  },
];

const TOTAL_LESSONS = TRACKS.reduce((sum, t) => sum + t.lessons.length, 0);
const PROGRESS_KEY = 'majorka_academy_progress_v1';

// ── Confetti CSS keyframes (injected once) ────────────────────────────────
const CONFETTI_STYLE_ID = 'majorka-confetti-style';

function ensureConfettiStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(CONFETTI_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = CONFETTI_STYLE_ID;
  style.textContent = `
    @keyframes majorka-confetti-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
    }
    @keyframes majorka-confetti-drift {
      0% { transform: translateX(0); }
      50% { transform: translateX(15px); }
      100% { transform: translateX(-15px); }
    }
    .majorka-confetti-piece {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 1px;
      animation: majorka-confetti-fall 3s ease-out forwards, majorka-confetti-drift 1.5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ── Difficulty pill colours ────────────────────────────────────────────────
function difficultyStyle(d: Difficulty): { bg: string; color: string; border: string } {
  if (d === 'Beginner') return { bg: 'rgba(16,185,129,0.10)', color: '#10b981', border: 'rgba(16,185,129,0.30)' };
  if (d === 'Intermediate') return { bg: 'rgba(212,175,55,0.10)', color: '#d4af37', border: 'rgba(212,175,55,0.35)' };
  return { bg: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'rgba(239,68,68,0.30)' };
}

// ── localStorage helpers ───────────────────────────────────────────────────
function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const result: ProgressMap = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (value === true) {
          result[key] = { read: true };
        } else if (value && typeof value === 'object' && 'read' in (value as Record<string, unknown>)) {
          result[key] = value as LessonProgress;
        }
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Quota exceeded or unavailable
  }
}

function planTier(isBuilder: boolean, isScale: boolean): PlanTier {
  if (isScale) return 'scale';
  if (isBuilder) return 'builder';
  return 'free';
}

function isTrackUnlocked(track: Track, userPlan: PlanTier): boolean {
  if (track.requiredPlan === 'trial') return true; // Free for all users including trial
  if (track.requiredPlan === 'builder') return userPlan === 'builder' || userPlan === 'scale';
  if (track.requiredPlan === 'scale') return userPlan === 'scale';
  return true;
}

// ── Video Placeholder ─────────────────────────────────────────────────────
function VideoFrame({ videoUrl }: { videoUrl?: string }) {
  if (videoUrl !== undefined && videoUrl.length > 0) {
    return (
      <div className="mt-4 w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={videoUrl}
          title="Lesson video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="mt-4 w-full rounded-lg flex flex-col items-center justify-center"
      style={{
        aspectRatio: '16/9',
        background: '#050505',
        border: '1px solid #1a1a1a',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          border: '2px solid #d4af37',
        }}
      >
        <Play size={22} style={{ color: '#d4af37', marginLeft: 2 }} fill="#d4af37" />
      </div>
      <span
        className="mt-3 text-xs text-[#555]"
        style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}
      >
        Video walkthrough coming soon
      </span>
    </div>
  );
}

// ── Quiz Component ────────────────────────────────────────────────────────
function LessonQuiz({
  quiz,
  lessonId,
  quizPassed,
  onPass,
}: {
  quiz: [QuizQuestion, QuizQuestion];
  lessonId: string;
  quizPassed: boolean;
  onPass: (lessonId: string) => void;
}) {
  const [answers, setAnswers] = useState<[number | null, number | null]>([null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<[boolean | null, boolean | null]>([null, null]);

  const handleSelect = useCallback((qIndex: 0 | 1, optionIndex: number) => {
    setAnswers(prev => {
      const next: [number | null, number | null] = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
    if (submitted) {
      setSubmitted(false);
      setResults([null, null]);
    }
  }, [submitted]);

  const handleCheck = useCallback(() => {
    const r0 = answers[0] === quiz[0].correctIndex;
    const r1 = answers[1] === quiz[1].correctIndex;
    setResults([r0, r1]);
    setSubmitted(true);
    if (r0 && r1) {
      onPass(lessonId);
    }
  }, [answers, quiz, lessonId, onPass]);

  if (quizPassed) {
    return (
      <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Quiz passed</span>
        </div>
      </div>
    );
  }

  const allAnswered = answers[0] !== null && answers[1] !== null;

  return (
    <div className="mt-5 p-4 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
      <h4
        className="text-xs uppercase tracking-wider text-[#888] mb-4"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Knowledge check
      </h4>

      {quiz.map((q, qIdx) => {
        const qKey = qIdx as 0 | 1;
        const result = results[qIdx];
        return (
          <div key={`${lessonId}-q${qIdx}`} className="mb-4 last:mb-0">
            <p className="text-sm text-[#ededed] mb-2 font-medium">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[qIdx] === oIdx;
                const showCorrectHighlight = submitted && result === true && isSelected;
                const showWrongHighlight = submitted && result === false && isSelected;

                return (
                  <label
                    key={oIdx}
                    className="flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-md cursor-pointer transition-colors"
                    style={{
                      background: showCorrectHighlight
                        ? 'rgba(16,185,129,0.08)'
                        : showWrongHighlight
                          ? 'rgba(239,68,68,0.08)'
                          : isSelected
                            ? 'rgba(212,175,55,0.08)'
                            : 'transparent',
                      border: `1px solid ${
                        showCorrectHighlight
                          ? 'rgba(16,185,129,0.3)'
                          : showWrongHighlight
                            ? 'rgba(239,68,68,0.3)'
                            : isSelected
                              ? 'rgba(212,175,55,0.35)'
                              : '#1a1a1a'
                      }`,
                    }}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${isSelected ? '#d4af37' : '#333'}`,
                        background: isSelected ? '#d4af37' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#080808',
                            display: 'block',
                          }}
                        />
                      )}
                    </span>
                    <input
                      type="radio"
                      name={`${lessonId}-q${qIdx}`}
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => handleSelect(qKey, oIdx)}
                    />
                    <span className="text-sm text-[#a1a1aa]">{opt}</span>
                  </label>
                );
              })}
            </div>

            {submitted && result === false && (
              <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-md" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <X size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                <span className="text-xs text-[#ef4444]">Try again. Hint: {q.hint}</span>
              </div>
            )}
            {submitted && result === true && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Check size={14} style={{ color: '#10b981' }} />
                <span className="text-xs" style={{ color: '#10b981' }}>Correct!</span>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleCheck}
        disabled={!allAnswered}
        className="mt-3 px-4 py-2 rounded-md text-xs font-semibold transition-opacity"
        style={{
          background: allAnswered ? '#3B82F6' : '#1a1a1a',
          color: allAnswered ? '#ffffff' : '#555',
          cursor: allAnswered ? 'pointer' : 'not-allowed',
        }}
      >
        Check answers
      </button>
    </div>
  );
}

// ── Confetti Burst ────────────────────────────────────────────────────────
function ConfettiBurst() {
  useEffect(() => {
    ensureConfettiStyles();
  }, []);

  const pieces = useMemo(() => {
    const colors = ['#d4af37', '#f5d76e', '#3B82F6', '#10b981', '#ededed'];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.floor(Math.random() * 100)}%`,
      delay: `${(Math.random() * 2).toFixed(2)}s`,
      color: colors[i % colors.length],
      size: Math.floor(Math.random() * 4) + 4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          className="majorka-confetti-piece"
          style={{
            left: p.left,
            top: '-10px',
            animationDelay: p.delay,
            background: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Academy() {
  const { isBuilder, isScale } = useAuth();
  const userPlan: PlanTier = planTier(!!isBuilder, !!isScale);

  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Mark lesson as read after 5 seconds of expansion
  useEffect(() => {
    if (!expandedLesson) return;
    if (progress[expandedLesson]?.read) return;
    const t = setTimeout(() => {
      setProgress(prev => {
        const existing = prev[expandedLesson] ?? { read: false };
        const next = { ...prev, [expandedLesson]: { ...existing, read: true } };
        saveProgress(next);
        return next;
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [expandedLesson, progress]);

  const handleQuizPass = useCallback((lessonId: string) => {
    setProgress(prev => {
      const existing = prev[lessonId] ?? { read: false };
      const next = { ...prev, [lessonId]: { ...existing, read: true, quizPassed: true } };
      saveProgress(next);
      return next;
    });
  }, []);

  const readCount = useMemo(
    () => Object.values(progress).filter(p => p.read).length,
    [progress],
  );
  const quizCount = useMemo(
    () => Object.values(progress).filter(p => p.quizPassed).length,
    [progress],
  );
  const readPct = Math.min(100, Math.round((readCount / TOTAL_LESSONS) * 100));
  const quizPct = Math.min(100, Math.round((quizCount / TOTAL_LESSONS) * 100));
  const allComplete = readCount >= TOTAL_LESSONS && quizCount >= TOTAL_LESSONS;

  return (
    <div className="min-h-screen bg-[#080808] text-[#ededed]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <SEO
        title="Majorka Academy — Master dropshipping with AI"
        description="Six tracks. Twenty-four lessons. Master ecommerce from scratch — product research, store building, ads, scaling, and brand building for the AU market."
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
        <Link
          to="/"
          className="text-lg font-bold text-[#ededed] no-underline"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Majorka
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-sm text-[#888] no-underline">
            Pricing
          </Link>
          <Link
            to="/sign-in"
            className="text-sm font-semibold no-underline px-4 py-1.5 rounded-md"
            style={{ background: '#d4af37', color: '#080808' }}
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#1a1a1a] mb-6 text-xs text-[#888]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <BookOpen size={12} /> 6 tracks · 24 lessons
        </div>
        <h1
          className="font-bold mb-3 tracking-tight"
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(36px, 6vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          Majorka Academy
        </h1>
        <p className="text-base text-[#888] max-w-md mx-auto">Master dropshipping with AI</p>
      </div>

      {/* Completion Certificate */}
      {allComplete && (
        <div className="max-w-3xl mx-auto px-6 pb-6">
          <div
            className="relative rounded-lg p-6 text-center overflow-hidden"
            style={{ background: '#0f0f0f', border: '1px solid rgba(212,175,55,0.35)' }}
          >
            <ConfettiBurst />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div
                className="inline-flex items-center justify-center rounded-full mb-3"
                style={{ width: 48, height: 48, background: 'rgba(212,175,55,0.12)', border: '2px solid #d4af37' }}
              >
                <CheckCircle2 size={24} style={{ color: '#d4af37' }} />
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'Syne, sans-serif', color: '#d4af37' }}
              >
                Majorka Academy — Complete
              </h2>
              <p className="text-sm text-[#888] max-w-md mx-auto">
                You have completed all 6 tracks. You are ready to find, launch, scale, and build a brand.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs uppercase tracking-wider text-[#888]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Progress
            </span>
            <span
              className="text-sm font-semibold text-[#ededed] tabular-nums"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {readCount} of {TOTAL_LESSONS} read · {quizCount} of {TOTAL_LESSONS} quizzes passed
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#555]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Lessons read
                </span>
                <span className="text-[10px] text-[#555] tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {readPct}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1a] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${readPct}%`,
                    background: 'linear-gradient(90deg, #d4af37, #f5d76e)',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#555]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Quizzes passed
                </span>
                <span className="text-[10px] text-[#555] tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {quizPct}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1a] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${quizPct}%`,
                    background: 'linear-gradient(90deg, #3B82F6, #60a5fa)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
        {TRACKS.map(track => {
          const unlocked = isTrackUnlocked(track, userPlan);
          return (
            <section
              key={track.id}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-6 md:p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="text-4xl font-bold tabular-nums"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#d4af37',
                    lineHeight: 1,
                  }}
                >
                  {track.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2
                      className="text-2xl font-bold tracking-tight"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {track.title}
                    </h2>
                    {!unlocked && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider"
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          background: 'rgba(212,175,55,0.08)',
                          color: '#d4af37',
                          borderColor: 'rgba(212,175,55,0.35)',
                        }}
                      >
                        <Lock size={10} />
                        {track.requiredPlan === 'scale' ? 'Scale plan' : track.requiredPlan === 'builder' ? 'Builder plan' : 'Free'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#555] mt-1">{track.lessons.length} lessons</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {track.lessons.map(lesson => {
                  const lessonProgress = progress[lesson.id];
                  const isRead = !!lessonProgress?.read;
                  const isQuizPassed = !!lessonProgress?.quizPassed;
                  const isExpanded = expandedLesson === lesson.id;
                  const dStyle = difficultyStyle(lesson.difficulty);
                  return (
                    <div
                      key={lesson.id}
                      className="bg-[#080808] border rounded-md transition-colors"
                      style={{
                        borderColor: isExpanded ? '#d4af37' : '#1a1a1a',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!unlocked) return;
                          setExpandedLesson(isExpanded ? null : lesson.id);
                        }}
                        disabled={!unlocked}
                        className="w-full text-left p-5 disabled:cursor-not-allowed"
                        style={{ opacity: unlocked ? 1 : 0.55 }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-[#ededed] leading-snug flex-1">
                            {lesson.title}
                          </h3>
                          {!unlocked ? (
                            <Lock size={14} className="text-[#d4af37] flex-shrink-0 mt-0.5" />
                          ) : isRead && isQuizPassed ? (
                            <CheckCircle2
                              size={14}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: '#10b981' }}
                            />
                          ) : isRead ? (
                            <CheckCircle2
                              size={14}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: '#d4af37' }}
                            />
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-[#555]"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            <Clock size={10} />
                            {lesson.duration}
                          </span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold"
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              background: dStyle.bg,
                              color: dStyle.color,
                              borderColor: dStyle.border,
                            }}
                          >
                            {lesson.difficulty}
                          </span>
                          {isRead && !isQuizPassed && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px]"
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                background: 'rgba(212,175,55,0.08)',
                                color: '#d4af37',
                                borderColor: 'rgba(212,175,55,0.25)',
                              }}
                            >
                              Quiz pending
                            </span>
                          )}
                        </div>
                      </button>

                      {isExpanded && unlocked && (
                        <div className="px-5 pb-5 pt-1 border-t border-[#1a1a1a] mt-1">
                          <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-line">
                            {lesson.content}
                          </p>

                          {/* Video frame */}
                          <VideoFrame videoUrl={lesson.videoUrl} />

                          {lesson.actionLink && (
                            <a
                              href={lesson.actionLink.href}
                              className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-md no-underline"
                              style={{ background: '#3B82F6', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}
                            >
                              {lesson.actionLink.label}
                            </a>
                          )}

                          {isRead && (
                            <div
                              className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider"
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                color: '#10b981',
                              }}
                            >
                              <CheckCircle2 size={10} /> Marked as read
                            </div>
                          )}

                          {/* Quiz */}
                          <LessonQuiz
                            quiz={lesson.quiz}
                            lessonId={lesson.id}
                            quizPassed={isQuizPassed}
                            onPass={handleQuizPass}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!unlocked && (
                <div className="mt-6 flex items-center justify-between gap-4 p-4 rounded-md border border-[#1a1a1a] bg-[#080808]">
                  <div className="text-xs text-[#888]">
                    Unlock this track with the{' '}
                    <span className="text-[#d4af37] font-semibold">
                      {track.requiredPlan === 'scale' ? 'Scale' : 'Builder'}
                    </span>{' '}
                    plan.
                  </div>
                  <Link
                    to="/pricing"
                    className="text-xs font-semibold no-underline px-3 py-1.5 rounded-md"
                    style={{
                      background: '#3B82F6',
                      color: '#ffffff',
                      boxShadow: '0 0 20px rgba(59,130,246,0.35)',
                    }}
                  >
                    View plans
                  </Link>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-[#1a1a1a] py-16 px-6 text-center bg-[#0f0f0f]">
        <p className="text-sm text-[#888] mb-4 max-w-md mx-auto">
          Ready to put this into practice? Majorka tracks 2,400+ winning products across AU, US, and
          UK markets.
        </p>
        <Link
          to="/pricing"
          className="inline-block px-6 py-2.5 rounded-md font-semibold text-sm no-underline"
          style={{
            background: '#3B82F6',
            color: '#ffffff',
            boxShadow: '0 0 24px rgba(59,130,246,0.35)',
          }}
        >
          Start with Builder — $99 $AUD/mo
        </Link>
      </div>
    </div>
  );
}
