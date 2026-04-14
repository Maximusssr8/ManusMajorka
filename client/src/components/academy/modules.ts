/**
 * Academy curriculum. Eight modules, progressive difficulty, each mapped
 * to a concrete Majorka feature so the education loops back to the product.
 */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ModuleSpec {
  id: string;
  num: string;
  title: string;
  blurb: string;
  duration: string;
  difficulty: Difficulty;
  accent: string;      // hex
  product?: {
    label: string;
    path: string;
  };
  keyPoints: string[];
  body: string[];
  demo?: 'winner' | 'store' | 'adcopy';
}

export const ACADEMY_MODULES: ModuleSpec[] = [
  {
    id: 'dropshipping-101',
    num: '01',
    title: 'What dropshipping actually is',
    blurb: 'The business model in five minutes — no fluff, no gurus, no "passive income" myths.',
    duration: '5 min',
    difficulty: 'Beginner',
    accent: '#6366f1',
    keyPoints: [
      'You list products. Customers buy. You order from AliExpress. The supplier ships direct.',
      'You never touch inventory. You never pre-pay stock. Capital risk is close to zero.',
      'You pay for ads to drive traffic. Your margin = (your price − supplier price − ad cost).',
      'The winners find one product doing $10k+/mo and scale ad spend on that single SKU.',
    ],
    body: [
      'Dropshipping is the simplest e-commerce model in existence: you run the storefront and marketing, someone else runs the warehouse and shipping. When a customer pays you $47 for a cat water fountain, you turn around and pay AliExpress $13 to ship it straight to them.',
      'The entire game comes down to three variables: can you find a product people want, can you describe and sell it better than the next store, and can you buy traffic cheaper than your margin. That\'s it. Everything else — Shopify themes, branding, email flows — is just optimization on top.',
      'What separates operators who make $10k/mo from people who lose $500 on Facebook ads is product selection. 80% of your outcome is decided before you\'ve written a single ad.',
    ],
  },
  {
    id: 'aliexpress-sourcing',
    num: '02',
    title: 'How AliExpress sourcing works',
    blurb: 'The supply chain that makes this business possible — and the supplier red flags that kill stores.',
    duration: '7 min',
    difficulty: 'Beginner',
    accent: '#818cf8',
    keyPoints: [
      'AliExpress Standard Shipping → AU = 10–20 days. Set expectations on the product page.',
      'Look for suppliers with >95% positive ratings and >500 orders — anything less is a coin flip.',
      'Never use the lowest price. The $0.50 difference will cost you in returns and chargebacks.',
      'Always order a sample before scaling ad spend. Hold the product. Ship it to yourself.',
    ],
    body: [
      'AliExpress is a wholesale marketplace, not a retailer. Most "sellers" are factories or middlemen with direct access to Guangdong-area manufacturing. When you place a dropship order, the factory puts your customer\'s name on the box and ships it via ePacket, YunExpress, or Cainiao.',
      'The single most expensive mistake new operators make is picking a supplier based on the lowest price. A 50¢ cost saving looks like a margin win until your customers start filing PayPal disputes because their product arrived broken.',
      'The fix: filter for suppliers with 1,000+ orders, 4.7+ star rating, and a responsive store chat. Message them before you list. Ask about processing times and packaging. The ones who reply in English within 24 hours are the ones you want.',
    ],
  },
  {
    id: 'finding-winners',
    num: '03',
    title: 'Finding winning products',
    blurb: 'Why product research is 80% of the game — and how Majorka does 40 hours of it every 6 hours.',
    duration: '10 min',
    difficulty: 'Intermediate',
    accent: '#10b981',
    product: { label: 'Open Products tab', path: '/app/products' },
    demo: 'winner',
    keyPoints: [
      'A winner solves a visible, emotional problem — it\'s demo-able in a 10-second video.',
      'Target price: $25–$75 AUD. Below = low margin. Above = high friction, high return rate.',
      'Sold count > 500 with rising 7-day velocity = proof the market is still heating up.',
      'Winning score 90+ means: high demand + fresh momentum + competition-friendly margins.',
    ],
    body: [
      'The old way: scroll TikTok for 6 hours, find a "viral" product, list it, lose money because it peaked two weeks ago. The new way: use a signal engine that sees the whole market at once.',
      'Majorka imports fresh AliExpress data every 6 hours across 7 markets. The winning_score blends sold count, 7-day velocity, price band, margin potential, and seasonality into a single 0–100 number. Anything 85+ is worth a serious look. Anything 90+ is a launch candidate.',
      'Your job as the operator is not to find every winner — it\'s to find one, validate it, and scale ad spend on it. This is how Australian operators are going from zero to $10k/mo in under 90 days right now.',
    ],
  },
  {
    id: 'validating-demand',
    num: '04',
    title: 'Validating demand before you spend',
    blurb: 'How to know a product will sell before you burn $200 on creatives and ads.',
    duration: '8 min',
    difficulty: 'Intermediate',
    accent: '#f59e0b',
    product: { label: 'See Velocity Leaders', path: '/app/products' },
    keyPoints: [
      'Velocity > volume. A product at 1k sales/mo growing 30% weekly beats a 10k/mo flat one.',
      'Cross-check TikTok: search the product name + "tiktok". If 2+ creators post in 30 days → demand is alive.',
      'Check the Meta Ad Library for active ads. 5+ active ads = money is being spent = market is hot.',
      'Avoid seasonality traps: a "winner" in November for Christmas items is dead by January 2.',
    ],
    body: [
      'Validation is the firewall between your bank account and a $500 learning experience. Never list a product before you\'ve answered three questions: Is demand growing, or peaking? Are real buyers talking about it outside AliExpress? Can I price it high enough to afford paid traffic?',
      'Majorka\'s Velocity Leaders surface the products whose sold counts are accelerating in the last 7 days — not just the highest absolute sellers. Acceleration is the signal. Volume without velocity is a sunset.',
    ],
  },
  {
    id: 'store-in-ten',
    num: '05',
    title: 'Building a store in 10 minutes',
    blurb: 'How Store Builder takes one AliExpress URL and returns a conversion-ready Shopify store.',
    duration: '12 min',
    difficulty: 'Intermediate',
    accent: '#6366f1',
    product: { label: 'Open Store Builder', path: '/app/store-builder' },
    demo: 'store',
    keyPoints: [
      'Paste the AliExpress URL. Scraper pulls images, variants, specs, reviews.',
      'Claude rewrites the description — AU spelling, benefit-led copy, scannable bullets.',
      'Generates hero banner, trust bar, FAQ section, shipping note, full product page.',
      'Ships to Shopify as a Dawn-based theme. Hit publish. You\'re live.',
    ],
    body: [
      'Ten years ago, building a Shopify store meant 2 weeks of Liquid templates, a theme designer, and a copywriter. Store Builder collapses that into one paste-and-generate flow.',
      'What you get is not a generic "AI slop" store. The engine writes AU-native copy, keeps the supplier\'s real photos, adds realistic shipping promises (no "1-day delivery" lies), and structures the page around the conversion patterns that move Australian shoppers.',
    ],
  },
  {
    id: 'ads-that-convert',
    num: '06',
    title: 'Launching ads that actually convert',
    blurb: 'The creative framework that turns a $47 product into a $20 CAC — not a $60 one.',
    duration: '14 min',
    difficulty: 'Advanced',
    accent: '#f97316',
    product: { label: 'Open Ads Studio', path: '/app/ads-studio' },
    demo: 'adcopy',
    keyPoints: [
      'Hook in the first 3 seconds. If they don\'t scroll, you\'ve paid to be ignored.',
      'Show the problem, show the product solving it, show a face reacting. In that order.',
      'Test 3 creatives × 1 audience, not 1 creative × 3 audiences. Creative is 80% of performance.',
      'Budget: $20/day per ad set for 3 days minimum. Kill below 1% CTR, scale above 3%.',
    ],
    body: [
      'Bad ads waste your money in very loud ways. Good ads are quiet — they just work, and the dashboard fills up with sales overnight. The difference is not budget, it\'s creative.',
      'Ads Studio writes ad copy trained on what actually converts for AU dropship products. Hook lines. Pain-point intros. Social proof weavers. UGC scripts. Then it ships creatives you can run on Meta and TikTok directly.',
    ],
  },
  {
    id: 'scale-with-data',
    num: '07',
    title: 'Scaling with alerts and data',
    blurb: 'Once one product works, you stop being a marketer and start being a systems operator.',
    duration: '11 min',
    difficulty: 'Advanced',
    accent: '#10b981',
    product: { label: 'See Alerts', path: '/app/alerts' },
    keyPoints: [
      'Track 5–10 products you\'re considering. Alerts fire when velocity crosses a threshold.',
      'Use Revenue tab to watch margin by SKU — kill the losers, double-down on the winners.',
      'Competitor Spy shows when a rival launches the same product — react inside 48 hours.',
      'Rule of thumb: 1 winner at $10k/mo > 10 mediocre SKUs at $1k/mo each.',
    ],
    body: [
      'The operators who make real money treat dropshipping like a portfolio, not a lottery. You\'re not "trying to find a winner" — you\'re running a system that surfaces winners on a schedule, validates them on a budget, and scales the ones that pass.',
      'Alerts are the nerve system. They wake you up when a product you\'re tracking has a velocity spike, a price drop, or a new ad creative in the wild. Revenue gives you the kill/keep signal per SKU. Together they turn a single-person store into a small intelligence desk.',
    ],
  },
  {
    id: 'first-sale-checklist',
    num: '08',
    title: 'The first-sale checklist',
    blurb: 'Twelve boxes to tick before you hit "Launch ads". Miss one and you\'ll know why.',
    duration: '6 min',
    difficulty: 'Beginner',
    accent: '#818cf8',
    keyPoints: [
      'Domain + brand email set up (Google Workspace, $8.40/mo, worth it for trust).',
      'Shopify payment processor live + test order completed end-to-end.',
      'Legal pages: Terms, Privacy, Refund, Shipping. Every store needs them. Every one.',
      'Pixel installed, purchase event tested, tracking confirmed in Meta Events Manager.',
    ],
    body: [
      'The checklist below is what separates the stores that break $100 in revenue from the ones that break $10,000. None of it is glamorous. All of it is non-negotiable.',
    ],
  },
];
