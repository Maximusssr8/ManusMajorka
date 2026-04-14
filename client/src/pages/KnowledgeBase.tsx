/**
 * KnowledgeBase — 9-section docs page with sidebar nav and "Ask AI" CTA per section.
 */

import { BookOpen, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';

interface KBSection {
  id: string;
  title: string;
  content: string;
  aiQuery: string;
}

const sections: KBSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    aiQuery: 'How do I get started with Majorka to find my first winning product?',
    content: `## What is Majorka?

Majorka is an AI-powered ecommerce operating system built specifically for Australian dropshippers and online store owners. It combines 20+ specialised AI tools across five business stages — Research, Validate, Build, Launch, and Optimise — into a single platform so you can move from product idea to profitable store faster than ever.

Think of Majorka as your full-time ecommerce team: product researcher, ad copywriter, brand strategist, financial modeller, and business advisor — all in one.

## Setting Up Your Account

After signing up, you'll be guided through a short onboarding flow. You'll be asked about your niche, target market, monthly revenue goal, and experience level. This personalises every AI response you receive — so when you ask for product ideas, Majorka already knows you're targeting Australian consumers and uses AUD figures by default.

Head to **Settings → Profile** to update your business context at any time. The more detail you provide, the sharper the AI outputs will be.

## Choosing Your Market

Majorka supports all major markets: US, UK, AU, CA, EU, and more. Set your target market during onboarding — all pricing, trends, and recommendations update accordingly. Default market is Global.

## Your First Product Research Session

Start in **Product Discovery**. Type a niche or a broad category — for example, "eco-friendly kitchen products" or "pet accessories under $40". Majorka will return five product opportunities with estimated margins, AU competitor analysis, demand signals, and a recommended first ad channel.

From there, use the **Validate** tool to score the opportunity, then **Supplier Finder** to source it. Your full workflow is just a few clicks away from idea to launch.

## Tips for New Users

- Use the **Maya AI (AI Chat)** for open-ended strategy questions.
- Save your best tool outputs using the bookmark icon — they're stored in your dashboard.
- Beginner Mode (toggle in the sidebar) simplifies tool labels and adds helpful tooltips.`,
  },
  {
    id: 'product-research',
    title: 'Product Research',
    aiQuery: 'How do I use Majorka to find high-demand, low-competition products for Australia?',
    content: `## Understanding Demand Signals

Successful product research isn't guesswork — it's reading signals. Majorka's AI analyses multiple live data sources to surface winning products:

- **Google Trends AU** — Is search interest rising, peaking, or declining in Australia?
- **Amazon AU Best Sellers** — What's already selling well in the AU market?
- **TikTok AU** — What products are going viral and driving impulse purchases?
- **Catch and eBay AU** — What categories are trending on local marketplaces?
- **Meta Ad Library AU** — Are competitors spending on ads for this product? Sustained spend = proven demand.

A product with rising Google Trends, active Meta ads from 3+ competitors, and an Amazon AU Best Seller rank under 5,000 is a strong signal.

## Running a Discovery Session

Open **Product Discovery** and describe the type of product or niche you're interested in. Be specific: instead of "fitness products", try "recovery tools for home gym users aged 25–40 in Australia". Majorka will return a shortlist with:

- Estimated COGS landed in AU (product cost + air freight + GST)
- AU retail price range and net margin
- Target audience and best AU ad channel
- Competition level and opportunity score

## Reading the Data

Pay attention to these fields in the output:

- **Opportunity Score /100** — a composite rating based on demand, margin, competition, and trend trajectory. 70+ is worth pursuing.
- **Competition Level** — Low means few AU sellers. High means you'll need a strong angle to win.
- **Trend Direction** — "Rising" means you're early. "Declining" means the window is closing.
- **Red Flags** — These are important. A cheap product with TGA compliance requirements or high return rates may not be worth pursuing.

## Validating Before You Commit

Never order inventory before validating demand. Use the **48-Hour Validation Plan** tool to design a lean test: a simple Shopify landing page + $100–200 AUD Meta ad spend targeting your core AU audience. A 1.5%+ CTR and any add-to-carts signal real demand worth pursuing.

## Researching at Scale

Run multiple Product Discovery sessions across different niches and compare opportunity scores. Build a shortlist of 5–10 candidates, then score them with **Niche Scorer** to rank by risk-adjusted profit potential. The best businesses are built on one winning product — take the time to find the right one.`,
  },
  {
    id: 'market-selection',
    title: 'Market Selection',
    aiQuery:
      'How do the different markets (AU, US, EU, UK) work in Majorka and which should I choose?',
    content: `## How Markets Work in Majorka

The Market Selector (sidebar bottom) tells Majorka which geographic market to optimise for. Every AI output adapts to the selected market: currency, shipping costs, compliance rules, consumer psychology, seasonal calendar, and advertising benchmarks all change based on your market selection.

You can switch markets at any time without losing your data — it's a session-level setting.

## AU (Australia) — Default

**Population:** ~27M | **Ecommerce market:** ~$63B AUD/year

Majorka covers all major dropshipping markets. Select your target market to see region-specific products, pricing, shipping, and compliance guidance. Australian consumers are price-savvy but brand-loyal once trust is established. Key platforms: Shopify AU, Amazon AU, eBay AU, Catch, THE ICONIC.

Best for: dropshippers based in Australia, brands wanting to build a loyal AU customer base, products in health, pet, home, and outdoor niches.

## US (United States)

**Population:** ~340M | **Ecommerce market:** ~$1.1T USD/year

The world's largest English-language ecommerce market. Higher competition but vastly larger audience pools. Meta CPMs run $15–45 USD. Shopify US is the dominant platform. No equivalent of Afterpay (though it exists), but PayPal and Shop Pay are standard.

Best for: high-volume dropshippers comfortable with aggressive ad spend, brands testing scalability before expanding internationally.

## EU (European Union)

Key markets: Germany, France, Netherlands, Spain, Italy. GDPR compliance is mandatory — Majorka will flag this in all EU outputs. VAT rates vary by country (20% UK equivalent in France, 19% in Germany). Language localisation is important for conversion.

## UK (United Kingdom)

Post-Brexit market with its own customs considerations. Strong ecommerce culture similar to AU. ASA (Advertising Standards Authority) governs ad compliance. Payment: Klarna and Clearpay popular alongside standard cards.

## ASIA

Primarily covers Singapore, Hong Kong, and emerging Southeast Asian markets. Lower CPMs, mobile-first consumers, and strong social commerce (WhatsApp, LINE, TikTok Shop).

## GLOBAL

Use GLOBAL when you're selling internationally and want market-agnostic advice. Majorka will provide general guidance without market-specific assumptions.

## Which Market Should You Choose?

If you're based in Australia and shipping to Australian customers — use AU. It's the most specific, most refined, and most useful setting. If you're testing international expansion, switch to the relevant market before running research or ad copy tools.`,
  },
  {
    id: 'building-your-store',
    title: 'Building Your Store',
    aiQuery: 'How do I use the Website Generator to build a high-converting Shopify store?',
    content: `## The Website Generator

The **Website Generator** tool builds complete, production-ready Shopify theme files for your store. Give it your product, target audience, and brand tone — and it generates:

- **Hero section** with headline, subheadline, and CTA
- **Product page template** with Afterpay widget, trust badges, and AU shipping copy
- **Email templates** — welcome and abandoned cart
- **Footer** with ABN field, ACCC-compliant returns policy, and Privacy Act notice
- **Trust badge snippets** and theme settings configured for AU defaults

The output is written in Australian English with GST-inclusive pricing, Afterpay/Zip messaging, and ACCC-compliant returns copy built in.

## How to Use It

Open **Website Generator** and describe your product and brand. The more context you provide, the better. For example:

> "Build a Shopify store for premium bamboo towels targeting Australian eco-conscious consumers aged 28–45. Brand tone: clean, minimal, confident. Price: $89 AUD."

Majorka will return a full JSON object with all theme files ready to drop into your Shopify theme editor.

## Exporting to Shopify

1. Copy the Liquid file contents from the output
2. In Shopify Admin, go to **Online Store → Themes → Edit Code**
3. Paste each file into the corresponding section (sections/, templates/, snippets/, etc.)
4. Update placeholders (ABN, brand name, product-specific copy)
5. Configure Afterpay via the Afterpay Shopify app — the widget code is already in the theme

## Key AU Requirements Built Into Every Theme

- **GST-inclusive pricing** — Required by Australian Consumer Law. Never show ex-GST prices.
- **Afterpay/Zip messaging** — "Pay in 4 interest-free payments with Afterpay" shown below Add to Cart for products >$50 AUD.
- **ACCC returns copy** — "30-day returns under Australian Consumer Law" — mandatory.
- **ABN display** — Footer includes an ABN field. Showing your ABN builds trust with Australian buyers.
- **Australian English** — All copy uses AU spelling and idioms.

## Shopify Theme Export

If you want to use Majorka's generated theme as a base and export it as a proper Shopify theme package, the generated \`config/settings_data.json\` and layout files are compatible with Shopify's standard theme structure. You can also use Shopify CLI to push the theme directly from your local machine.`,
  },
  {
    id: 'running-ads',
    title: 'Running Ads',
    aiQuery: "How do I create high-converting Meta and TikTok ads using Majorka's tools?",
    content: `## Meta Ads (Facebook & Instagram)

Majorka's **Meta Ads Pack** generates a complete campaign package: audience strategy, five ad copy variations (with actual copy — not templates), ACCC compliance check, 48-hour launch plan, and scaling triggers.

**AU Meta Benchmarks:**
- CPM: $12–28 AUD (lower in regional, higher in Sydney/Melbourne)
- CPC: $0.80–$3.50 AUD
- Target ROAS: 2.5–4x at scale
- Test budget: $50–200 AUD for meaningful signal

When you use the Meta Ads Pack, Majorka writes copy in Australian English, includes Afterpay messaging ("Or 4 payments of $X with Afterpay"), references AU shipping speeds, and checks every claim against ACCC standards.

**Starting your first campaign:**
1. Run **Meta Ads Pack** with your product details
2. Copy the winning ad angle into Meta Ads Manager
3. Set targeting to Australia → your specific demographic
4. Start at $30–50 AUD/day — enough for signal without burning budget
5. Run for 3–5 days before making decisions

## TikTok Ads

Use **TikTok Ads** or **Ads Studio** for TikTok-native content. AU TikTok benchmarks:
- CPM: $8–18 AUD (cheaper than Meta)
- Best for: 18–34 demographic, impulse products, visual demonstrations
- TikTok Shop AU is now active — Majorka includes it in recommendations

Majorka generates authentic AU-sounding hooks, full 15/30/60-second video scripts, UGC creator briefs, and shot lists. All scripts are written how Australians actually talk — not US marketing speak.

## Google Ads

The **Google Ads** tool sets up Shopping and Search campaigns for the AU market. Google Shopping is essential for discovery, especially for products with clear purchase intent keywords. AU CPCs run $0.80–$4 AUD. Majorka optimises your Shopping feed title formula for Google AU (include "Australia" or "AU" where natural, GST-inclusive AUD pricing, AU shipping zones).

## Optimising Running Campaigns

Use **Ad Optimizer** when your ROAS drops or you want to scale. Paste in your key metrics and Majorka will diagnose issues (creative fatigue, audience saturation, bidding problems) and give specific fixes — calibrated for AU market dynamics where audience pools fatigue faster than US.`,
  },
  {
    id: 'supplier-sourcing',
    title: 'Supplier Sourcing',
    aiQuery: 'How do I find and vet reliable suppliers for my Australian dropshipping store?',
    content: `## Finding Suppliers

Majorka's **Supplier Finder** tool searches across multiple sourcing channels and returns a shortlist of vetted options with AU-specific data: landed cost per unit (product + freight + duty + GST), lead time to AU, reliability rating, and red flags.

**Primary sourcing channels:**
- **AliExpress** — Fast testing, no MOQ, 7–14 day air freight to AU (~$3–6 per unit)
- **1688** — Lower prices than AliExpress, requires Chinese agent or freight forwarder, ideal for scale
- **Alibaba** — Best for bulk orders with MOQ, negotiate directly with factories
- **Dropshipzone** — AU-based dropshipper, 1–3 day delivery within Australia, higher unit cost but no international freight
- **AliExpress AU** — AU warehouse stock, fast local delivery, competitive pricing

## Vetting a Supplier

Before committing to a supplier, check:

1. **Trading history** — On AliExpress, 2+ years and 500+ orders is the minimum. On Alibaba, look for Gold Supplier status.
2. **Communication responsiveness** — How fast do they reply to your product queries? Slow response = red flag.
3. **Sample quality** — Always order a sample to AU before selling. Budget $30–80 AUD for this step.
4. **Packaging and branding** — Can they do custom packaging? White label? What's the MOQ for branded products?
5. **AU compliance** — Do they have safety certifications? Electrical products need RCM/SAA mark. Health products may need TGA approval.

## Estimating Shipping to AU

For AliExpress air freight to Australia:
- Small, light items (<500g): $3–6 per unit, 7–12 days
- Medium items (500g–2kg): $5–10 per unit, 10–14 days
- Large/heavy items: Consider sea freight (25–40 days) or local AU warehouse stock

## Import Costs to Factor In

- **Customs duty:** 0–10% depending on product category (most consumer goods 5%)
- **GST on import:** 10% on total landed value (product + freight + insurance + duty)
- **Freight forwarding fee:** $30–80 AUD per shipment if using an agent

Majorka's Supplier Finder automatically calculates landed cost per unit in AUD so you can build accurate margins from the start.

## Red Flags to Avoid

Suppliers who: can't provide product samples, don't communicate in English adequately, have no experience shipping to Australia, offer prices too good to be true, or have no certifications for regulated product categories.`,
  },
  {
    id: 'pricing-margins',
    title: 'Pricing & Margins',
    aiQuery: 'How do I calculate healthy profit margins for my Australian dropshipping store?',
    content: `## Understanding Your Unit Economics

Healthy margins are the foundation of a sustainable business. Use Majorka's **Unit Economics Calculator** or **Financial Modeler** to build your numbers before touching an ad account.

**Key cost components for AU dropshipping:**

| Cost | Typical Range |
|------|--------------|
| Product COGS (AliExpress, landed AU) | $5–25 AUD |
| Air freight to AU per unit | $3–8 AUD |
| AU customs duty | 0–10% of COGS |
| GST on import | 10% of landed value |
| Shopify fees | $39–399 AUD/mo |
| Stripe processing | 1.75% + $0.30 AUD |
| Afterpay merchant fee | 4–6% of order value |
| Australia Post eParcel | $8–15 AUD (metro) |
| Return rate provision | 5–15% depending on category |

## Target Margin Benchmarks

- **Gross margin** (revenue - COGS - shipping): aim for 50%+ for AU DTC
- **Net margin** (after all costs including ads): 15–25% is healthy; 30%+ is great
- **Contribution margin** (after COGS + shipping + ad cost): must be positive per unit

## The Break-Even ROAS Formula

Break-even ROAS = 1 / (Gross Margin %)

Example: if your gross margin is 60%, your break-even ROAS is 1.67x. You need to generate $1.67 in revenue for every $1 of ad spend just to cover the product cost and shipping. Target ROAS should be 2.5–4x to generate actual profit.

## Using the Profit Calculator

Open **Profit Calculator** and enter: selling price (AUD, GST-inclusive), COGS landed in AU, AU shipping cost, Afterpay fee %, and ad spend. The tool returns gross margin, net margin per unit, break-even ROAS, and a 12-month P&L projection.

## Pricing for the AU Market

Australians are price-conscious but will pay a premium for trusted, local-feeling brands. Key pricing signals:
- **Afterpay sweet spot:** $50–200 AUD — Afterpay drives the highest conversion lift at this range
- **Free shipping threshold:** $79–99 AUD — set this as your AOV target
- **Psychological pricing:** $39 and $49 outperform $35 and $45 in AU tests
- **GST display:** Always show GST-inclusive prices — it's a legal requirement for AU consumer-facing pricing

## ROAS, CAC, and LTV

Track these three metrics religiously:
- **CAC (Customer Acquisition Cost):** Total ad spend ÷ number of new customers. AU target: <$30 for cold traffic.
- **LTV (Lifetime Value):** Average order value × purchase frequency × lifespan. AU consumers have higher LTV than US once trust is built.
- **LTV:CAC ratio:** Target 3:1 or higher for a healthy scaling business.`,
  },
  {
    id: 'compliance-legal',
    title: 'Compliance & Legal',
    aiQuery:
      'What legal and compliance requirements do I need to know for selling online in Australia?',
    content: `## Australian Consumer Law (ACCC)

The Australian Competition and Consumer Commission (ACCC) enforces the Australian Consumer Law (ACL), which provides mandatory consumer guarantees that cannot be excluded by contract. As an AU seller, you must:

- **Honour mandatory guarantees:** Products must be of acceptable quality, fit for purpose, and match their description. Customers are entitled to repair, replacement, or refund for major failures.
- **Accurate advertising:** You cannot make misleading claims about your products. "Best", "fastest", and "cheapest" claims must be verifiable. Testimonials must reflect genuine customer experiences.
- **Clear pricing:** GST must be included in all consumer-facing prices. You cannot advertise ex-GST pricing to Australian consumers.
- **Returns policy:** You must have a compliant returns page that references Australian Consumer Law rights. Majorka's Website Generator includes ACCC-compliant returns copy by default.

Majorka's ad copy tools automatically run an ACCC compliance check on every piece of copy they generate.

## GST (Goods and Services Tax)

10% GST applies to all goods and services sold in Australia. Key points:
- If your annual turnover exceeds $75,000 AUD, you must register for GST and lodge quarterly BAS (Business Activity Statements)
- GST must be included in displayed prices
- You collect GST from customers and remit it to the ATO
- International goods imported with a customs value >$1,000 AUD attract GST on import

## TGA (Therapeutic Goods Administration)

Products making health or therapeutic claims in Australia must comply with TGA regulations. This includes supplements, skincare with therapeutic claims, medical devices, and anything described as treating a health condition. Selling TGA-regulated products without compliance is a serious offence.

Always run health products through the **Supplier Finder** tool — Majorka flags TGA concerns in the Red Flags section.

## FTC Compliance (US Market)

If you're selling to US customers, the Federal Trade Commission (FTC) requires:
- Clear disclosure of paid partnerships and sponsored content ("#ad" or "Sponsored")
- Substantiated claims — "scientifically proven" requires actual studies
- Honest pricing — no fake original prices or manufactured urgency

## GDPR (EU Market)

Selling to EU customers requires GDPR compliance:
- Cookie consent banner
- Privacy Policy detailing data collection and processing
- Right to erasure ("right to be forgotten") on request
- Data processing agreements with any third-party processors

## ASA (UK Advertising Standards Authority)

UK ads must comply with ASA codes — similar to ACCC but with UK-specific nuances around pricing, comparative advertising, and social media disclosure.

## Privacy Act 1988 (Australia)

If you collect personal information from Australian customers (which any ecommerce store does), you must have a Privacy Policy that complies with the Privacy Act 1988 and the Australian Privacy Principles (APPs). Majorka's Website Generator includes a Privacy Policy page template by default.`,
  },
  {
    id: 'scaling',
    title: 'Scaling to $10K/mo',
    aiQuery:
      "What's the roadmap to scale my Majorka dropshipping store from $0 to $10,000 per month?",
    content: `## The $0 to $10K/Month Roadmap

Scaling an Australian dropshipping store to $10K/month is achievable in 3–6 months with the right product, tight unit economics, and a systematic approach. Here's how Majorka supports each phase.

## Phase 1: Foundation ($0 → $1K/mo) — Weeks 1–4

**Focus:** Find one winning product and validate demand.

1. **Product Research:** Run 3–5 Product Discovery sessions. Score the best candidates with Niche Scorer. Target an opportunity score of 70+.
2. **Validate:** Use the 48-Hour Validation Plan tool. Spend $100–200 AUD testing demand with a simple landing page and Meta ad.
3. **Build:** Generate your Shopify store with Website Generator. Set up Afterpay and Zip. Configure Australia Post eParcel.
4. **Unit Economics:** Run the Profit Calculator. Make sure your gross margin is 55%+.
5. **Launch:** Use Meta Ads Pack to build your first campaign. Start at $30/day.

**KPI to hit before advancing:** First 5 sales. Positive ROAS (any ROAS above 1.0 at this stage is a green light).

## Phase 2: Product-Market Fit ($1K → $5K/mo) — Weeks 5–10

**Focus:** Find your best-performing ad angle and audience.

1. **Test creatives:** Run 3–5 ad variations from Ads Studio simultaneously. Kill losers at $30 spend. Scale winners.
2. **Optimise:** Use CRO Advisor to improve your product page. Target 2%+ conversion rate.
3. **Email flows:** Build welcome, abandoned cart, and post-purchase sequences using Email Sequences tool.
4. **Audience profiling:** Use Audience Profiler to identify your highest-LTV customer segment.
5. **Scaling triggers:** Scale winning ad sets by 20% every 3 days when ROAS stays above 2.5x.

**KPI to hit before advancing:** Consistent ROAS 2.5x+ over 14 days. Email driving 20%+ of revenue.

## Phase 3: Scaling ($5K → $10K/mo) — Weeks 11–16

**Focus:** Add channels and systems.

1. **Add Google Shopping:** Run Google Ads tool to build your Shopping campaign. Google typically delivers ROAS 3–6x at lower volume.
2. **TikTok:** Test TikTok Ads with your best-performing creative angle from Meta.
3. **Retention:** Implement loyalty and referral programs using Retention Engine.
4. **Operations:** At $5K/month, consider moving from self-fulfilment to a 3PL (ShipBob AU, Shippit, eStore Logistics).
5. **Scaling Playbook:** Run the Scaling Playbook tool with your current numbers for a personalised next-phase plan.

**KPI to hit:** $10K/month revenue, 20%+ net margin, 25%+ repeat purchase rate.

## Common Mistakes That Kill Scale

- Scaling before fixing unit economics (negative margin at scale = accelerated losses)
- Moving to a new product too quickly — one winning product done well beats five mediocre ones
- Ignoring email — 30%+ of revenue should come from email by month 4
- Not tracking CAC and LTV — make decisions on data, not gut feel

Use Majorka's **Maya AI (AI Chat)** as your ongoing strategic advisor throughout every phase. Ask it anything: "Should I expand to Google now?", "My ROAS dropped — what do I check?", "Is it time to hire a VA?"`,
  },
];

export default function KnowledgeBase() {
  const [activeId, setActiveId] = useState(sections[0].id);
  const [, setLocation] = useLocation();
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

  const handleAskAI = (query: string) => {
    const encoded = encodeURIComponent(query);
    setLocation(`/app/ai-chat?q=${encoded}`);
  };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: 'var(--surface-0, #FAFAFA)', color: '#F8FAFC' }}
    >
      {/* Left sidebar nav */}
      <aside
        className="flex-shrink-0 overflow-y-auto hidden md:flex flex-col"
        style={{
          width: 240,
          background: 'var(--surface-1, #FFFFFF)',
          borderRight: '1px solid var(--surface-border, rgba(212,175,55,0.12))',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-4"
          style={{ borderBottom: '1px solid var(--surface-border, rgba(212,175,55,0.12))' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.12)' }}
          >
            <BookOpen size={14} style={{ color: '#d4af37' }} />
          </div>
          <span
            className="font-bold text-sm uppercase tracking-widest"
            style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC', letterSpacing: '0.1em' }}
          >
            Knowledge Base
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2">
          <div
            className="px-2 pb-2 text-xs uppercase font-bold tracking-widest"
            style={{
              color: '#3f3f46',
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              letterSpacing: '0.12em',
            }}
          >
            Articles
          </div>
          {sections.map((section) => {
            const active = section.id === activeId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveId(section.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left mb-0.5 transition-all"
                style={{
                  borderRadius: 8,
                  background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: active ? '#0A0A0A' : '#6B7280',
                  border: 'none',
                  cursor: 'pointer',
                  borderLeft: active ? '2px solid #d4af37' : '2px solid transparent',
                  paddingLeft: active ? 10 : 12,
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      '#F9FAFB';
                    (e.currentTarget as HTMLButtonElement).style.color = '#0A0A0A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                  }
                }}
              >
                <ChevronRight
                  size={12}
                  style={{
                    flexShrink: 0,
                    color: active ? '#d4af37' : 'transparent',
                    transition: 'color 0.15s',
                  }}
                />
                <span className="truncate text-sm">{section.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right article area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Mobile section selector */}
          <div className="md:hidden mb-6">
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{
                background: 'var(--surface-1, #FFFFFF)',
                border: '1px solid var(--surface-border, rgba(212,175,55,0.12))',
                color: '#F8FAFC',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Article header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.12)' }}
              >
                <BookOpen size={12} style={{ color: '#d4af37' }} />
              </div>
              <span
                className="text-xs uppercase tracking-widest font-bold"
                style={{ color: '#d4af37', fontFamily: "'Syne', sans-serif", fontSize: 10 }}
              >
                Knowledge Base
              </span>
            </div>
            <h1
              className="text-2xl font-extrabold mb-2"
              style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC', lineHeight: 1.2 }}
            >
              {activeSection.title}
            </h1>
            <div
              className="w-12 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }}
            />
          </div>

          {/* Article body */}
          <div
            className="prose prose-invert max-w-none mb-10"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <ArticleContent content={activeSection.content} />
          </div>

          {/* Ask AI CTA */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.15)',
            }}
          >
            <div>
              <p
                className="text-sm font-bold mb-0.5"
                style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
              >
                Have questions about {activeSection.title.toLowerCase()}?
              </p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                Ask Majorka AI for personalised guidance on your specific situation.
              </p>
            </div>
            <button
              onClick={() => handleAskAI(activeSection.aiQuery)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold flex-shrink-0 sm:ml-4 transition-all w-full sm:w-auto justify-center"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #3B82F6)',
                color: '#FAFAFA',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Syne', sans-serif",
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              Ask AI about this →
            </button>
          </div>

          {/* Section navigation */}
          <div
            className="flex items-center justify-between mt-8 pt-6"
            style={{ borderTop: '1px solid #F9FAFB' }}
          >
            {(() => {
              const currentIndex = sections.findIndex((s) => s.id === activeId);
              const prev = sections[currentIndex - 1];
              const next = sections[currentIndex + 1];
              return (
                <>
                  <div>
                    {prev && (
                      <button
                        onClick={() => setActiveId(prev.id)}
                        className="flex flex-col items-start gap-1 text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          ← Previous
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#F8FAFC', fontFamily: "'Syne', sans-serif" }}
                        >
                          {prev.title}
                        </span>
                      </button>
                    )}
                  </div>
                  <div>
                    {next && (
                      <button
                        onClick={() => setActiveId(next.id)}
                        className="flex flex-col items-end gap-1 text-right"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          Next →
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#F8FAFC', fontFamily: "'Syne', sans-serif" }}
                        >
                          {next.title}
                        </span>
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Renders markdown-like article content with basic formatting.
 * Supports: ## headings, **bold**, tables (| col | col |), bullet lists, numbered lists, code, and paragraphs.
 */
function ArticleContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading 2
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={i}
          className="text-xl font-extrabold mt-8 mb-3"
          style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={i}
          className="text-base font-bold mt-5 mb-2"
          style={{ fontFamily: "'Syne', sans-serif", color: '#1E293B' }}
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Table detection
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={`table-${i}`} lines={tableLines} />);
      continue;
    }

    // Bullet list
    if (line.startsWith('- ')) {
      const listLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        listLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 mb-4 space-y-1">
          {listLines.map((l, li) => (
            <li key={li} className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              <InlineMarkdown text={l} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\./.test(line)) {
      const listLines: string[] = [];
      while (i < lines.length && /^\d+\./.test(lines[i])) {
        listLines.push(lines[i].replace(/^\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 mb-4 space-y-1">
          {listLines.map((l, li) => (
            <li key={li} className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              <InlineMarkdown text={l} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((l) => !l.match(/^\|\s*[-:]+\s*\|/)) // remove separator row
    .map((l) =>
      l
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((c) => c.trim())
    );

  if (rows.length === 0) return null;
  const [header, ...body] = rows;

  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {header.map((cell, ci) => (
              <th
                key={ci}
                className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wide"
                style={{
                  background: 'rgba(212,175,55,0.06)',
                  color: '#d4af37',
                  borderBottom: '1px solid rgba(212,175,55,0.15)',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr
              key={ri}
              style={{ borderBottom: '1px solid #F9FAFB' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLTableRowElement).style.background =
                  '#FAFAFA')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')
              }
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 text-sm"
                  style={{
                    color: ci === 0 ? '#e5e5e5' : '#6B7280',
                    fontWeight: ci === 0 ? 500 : 400,
                  }}
                >
                  <InlineMarkdown text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  // Process **bold** and `code` inline
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    let firstMatch: RegExpMatchArray | null = null;
    let type: 'bold' | 'code' | 'link' | null = null;

    const matches = [
      boldMatch && { m: boldMatch, t: 'bold' as const },
      codeMatch && { m: codeMatch, t: 'code' as const },
      linkMatch && { m: linkMatch, t: 'link' as const },
    ].filter(Boolean) as Array<{ m: RegExpMatchArray; t: 'bold' | 'code' | 'link' }>;

    if (matches.length > 0) {
      const earliest = matches.reduce((a, b) => (a.m.index! <= b.m.index! ? a : b));
      firstMatch = earliest.m;
      type = earliest.t;
    }

    if (!firstMatch || firstMatch.index === undefined) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (!firstMatch || firstMatch.index === undefined) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    // Text before match
    if (firstMatch.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
    }

    if (type === 'bold') {
      parts.push(
        <strong key={key++} style={{ color: '#0F172A', fontWeight: 700 }}>
          {firstMatch[1]}
        </strong>
      );
    } else if (type === 'link') {
      const linkText = firstMatch[1];
      const linkUrl = firstMatch[2];
      const isInternal = linkUrl.startsWith('/');
      parts.push(
        <a key={key++} href={linkUrl} style={{ color: '#d4af37', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          {...(!isInternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {linkText}
        </a>
      );
    } else {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            background: 'rgba(212,175,55,0.1)',
            color: '#d4af37',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          {firstMatch[1]}
        </code>
      );
    }

    remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
  }

  return <>{parts}</>;
}
