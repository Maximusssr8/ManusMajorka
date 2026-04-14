/**
 * Majorka Academy
 * Static-content learning experience. Four modules, 21 lessons, inline
 * expansion, localStorage-backed progress tracking, no API calls.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ChevronDown, ChevronRight, CheckCircle2, Lock, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

const display = "'Syne', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

const surface = '#161618';
const border = '1px solid rgba(255,255,255,0.06)';

const PROGRESS_KEY = 'academy_progress';

interface Lesson {
  id: string;
  title: string;
  tier: 'FREE' | 'SCALE';
  body: string[];
}
interface Module {
  id: string;
  title: string;
  color: string;
  summary: string;
  lessons: Lesson[];
}

const MODULES: Module[] = [
  {
    id: 'fundamentals',
    title: 'Dropshipping Fundamentals',
    color: '#7c6aff',
    summary: 'The model, the numbers, and the Australian realities you need to know before you ship product one.',
    lessons: [
      {
        id: 'f1',
        title: 'How Australian dropshipping actually works',
        tier: 'FREE',
        body: [
          "The model in one sentence: you list AliExpress products on a Shopify store, a customer buys at your markup, you order the item from AliExpress and have it shipped directly to them. You never touch inventory.",
          "AU specifics: shipping runs 10-20 days from China via AliExpress Standard Shipping. After the COVID era, Australians are used to longer delivery windows from overseas stores, but they expect tracking numbers and proactive updates. Set up automated shipping emails on day one.",
          "The AusPost mindset is 'I can track this from the warehouse to my door'. Mirror that. Use a tracking widget on your Shopify store, and put a shipping ETA directly on the product page.",
          "The biggest mistake beginners make: competing on price. There is always someone cheaper in China. Instead, compete on brand, copy, and product curation. Your job is to find products Australians want that they cannot easily find on Amazon AU.",
        ],
      },
      {
        id: 'f2',
        title: 'Reading AliExpress data — what the numbers mean',
        tier: 'FREE',
        body: [
          "sold_count is total lifetime orders for a listing. It is the single most important proxy for demand. In Majorka, anything with 10K+ orders has proven demand. 100K+ is mass-market — you are competing with everyone, but the TAM is huge. 1M+ usually means a saturated evergreen.",
          "The Majorka winning_score is a blended metric: 0.4 × normalised orders + 0.3 × price-band viability + 0.2 × review quality + 0.1 × shipping rating. Scores above 80 are strong. Above 90 is your shortlist.",
          "Shipping ratings under 4.5/5 usually mean slow or lost parcels — avoid. Store ratings under 4.7 are a warning sign.",
          "Avoid brand-name knockoffs (Apple, Gucci, Nike logos). They get seized at Australian customs and you will refund every order. Look for generic, well-photographed, solution-oriented products.",
        ],
      },
      {
        id: 'f3',
        title: 'Picking your first niche',
        tier: 'FREE',
        body: [
          "Three winning niche frameworks for the Australian market. 1) Passion niches — pet accessories, home gym, camping, gardening. The buyer already has a reason to want the product, you just need to find the right one. 2) Problem-solvers — home organisation, car care, back/posture, sleep aids. These sell on outcomes, not features. 3) Seasonal — Christmas gifts (Nov-Dec), summer beach/pool (Oct-Feb), winter heated gear (Jun-Aug). Time your ad launch 3 weeks before peak.",
          "What to avoid: consumer electronics (high return rate, voltage issues, warranty expectations), apparel (AU sizing is not AliExpress sizing — you will drown in returns), anything individually worth more than $1000 AUD (customs duty kicks in).",
          "Rule of thumb: your first product should cost you less than $15 AUD landed, and you should be able to sell it for $40-60 AUD on a dedicated product page. That 3-4× markup is what gives you room for ad spend.",
        ],
      },
      {
        id: 'f4',
        title: 'Setting up GST and your ABN',
        tier: 'SCALE',
        body: [
          "You need to register for an ABN once you start selling. You are only required to register for GST once your turnover hits $75K AUD/year, but many operators register earlier so they can claim GST credits on business expenses.",
          "GST is 10% on top of every AU sale. Add it to your prices — do not absorb it. If you are GST-registered, your checkout should show 'GST included'.",
          "Keep every AliExpress receipt. They are a legitimate cost of goods sold and fully deductible. Xero or QuickBooks will import them from your Gmail automatically.",
          "Imports under $1000 AUD per consignment are duty-free at the border but still attract GST if you are registered. Nothing your customer sees or pays — handled in your BAS.",
          "Talk to an accountant before you cross $75K. An hour of their time now saves a month of pain at tax time.",
        ],
      },
      {
        id: 'f5',
        title: 'Writing your Shopify product pages',
        tier: 'SCALE',
        body: [
          "Formula for AU buyers: 1) Headline sells a benefit, not a feature. 2) Hero image shows the product in use, not on a white background. 3) Social proof — orders count, review count, photo reviews if possible. 4) Urgency — 'only 14 left in the AU warehouse'. 5) Clear shipping ETA ('2-5 business days AU-wide'). 6) Refund and returns policy above the fold.",
          "Never say 'ships from China'. Say 'international warehouse' or 'dispatched from our fulfilment partner'. It is legally accurate and removes friction.",
          "Before → After example. Bad: 'LED strip lights 5m USB powered with remote control.' Good: 'Turn your bedroom into a cinema — 5m smart LED strip with 16 million colours, app + remote control, plugs into any USB.' Same product. Second one sells.",
          "Include at least one 30-second product video. You can use the AliExpress demo video as a starting point — crop it, add captions in CapCut, done.",
        ],
      },
      {
        id: 'f6',
        title: 'Scaling from $1K to $10K/month',
        tier: 'SCALE',
        body: [
          "Three levers: horizontal (more products), vertical (better ads for existing products), and AOV (get each customer to spend more).",
          "The $1K/month month needs one winning product and one profitable ad set. That is it. Do not try to run three products at once when you are learning — you will dilute your attention.",
          "The $10K/month month usually needs 3-5 products, a retargeting sequence, and a post-purchase upsell flow. Retargeting catches the 90% of visitors who did not buy first time.",
          "Warning: do NOT scale ad spend before you have a 2.5× ROAS on cold traffic. You will burn through your margin. Validate the offer first, then pour fuel on the fire.",
        ],
      },
    ],
  },
  {
    id: 'winning',
    title: 'Finding Winning Products',
    color: '#10b981',
    summary: 'The product is 80% of the game. These lessons are how you stop guessing and start shortlisting.',
    lessons: [
      {
        id: 'w1',
        title: 'Using the Majorka winning score',
        tier: 'FREE',
        body: [
          "The winning_score is a composite — it is not the truth, it is a shortlist filter. Use it to reduce 2,000 products to 50 candidates, then apply your own judgement on top.",
          "Set your minimum filter at 65 to cut noise. Set it at 80 when you want a tight shortlist. 90+ is your 'investigate today' list.",
          "A score alone never sells the product. A 95-score wall stand with bad photos loses to a 75-score wall stand with a great lifestyle video every time. Score gets you in the door; creative wins the sale.",
        ],
      },
      {
        id: 'w2',
        title: 'Orders velocity vs viral one-hit-wonders',
        tier: 'FREE',
        body: [
          "Two kinds of winning products. 1) Velocity products — 500-2000 orders every single month for 12+ months. Boring, reliable, your bread and butter. 2) Viral products — a sudden spike to 50K orders in 30 days, usually from a TikTok moment. High risk, high reward, shorter shelf life.",
          "For your first winning product, pick velocity. Viral products look incredible in the data but by the time you list them, the trend is half over and competition is everywhere.",
          "How to spot viral decay: check the 30-day order trend in Majorka. If the slope is flattening or reversing, you are late.",
        ],
      },
      {
        id: 'w3',
        title: 'Seasonality in the AU market',
        tier: 'SCALE',
        body: [
          "Australia's seasons are flipped from the northern hemisphere. Your Christmas campaign runs in 30°C weather. Summer beach gear peaks October to February. Heated jackets, gloves, and blankets sell June to August.",
          "Launch 3 weeks before the season peaks. By the time the peak arrives, your ad accounts will have learned the audience and you will have organic reviews.",
          "AFL and NRL merchandise has regional sub-peaks — finals in September, grand finals in October. Never compete on licensed merch (IP risk). Sell the accessory category that benefits from the hype — BBQ tools during grand final weekend, for example.",
        ],
      },
      {
        id: 'w4',
        title: 'Competitor research',
        tier: 'SCALE',
        body: [
          "Three competitors to study for every product. 1) The AliExpress top seller (price, shipping rating, photos). 2) The Shopify store selling the same product to AU (branding, upsells, price). 3) The TikTok account running ads on it (hook, copy, creative format).",
          "Use the Facebook Ad Library to find every active ad running for a product. Filter by country = Australia. Copy the structure, never the creative itself.",
          "If three well-established stores already run ads on a product, that is validation, not a closed door — it means there is money in the niche. Find an angle they are missing.",
        ],
      },
      {
        id: 'w5',
        title: 'Bundle strategy for AOV',
        tier: 'SCALE',
        body: [
          "The simplest AOV boost is a 'frequently bought together' bundle. If your hero product is $39.99, offer a $24.99 complementary add-on at 'Buy both and save 15%' — the customer pays $54.99 and you have added $15 margin per order with zero new acquisition cost.",
          "Volume bundles work for consumable or gift-giving products. 'Buy 2 get 15% off, buy 3 get 25% off' converts shockingly well on accessories and novelty items.",
          "Post-purchase upsells (via ReConvert or similar) are free money. One-click add-to-order after checkout converts at 10-18% with almost no friction.",
        ],
      },
    ],
  },
  {
    id: 'ads',
    title: 'Running Ads in Australia',
    color: '#f59e0b',
    summary: 'How to buy traffic without setting your budget on fire.',
    lessons: [
      {
        id: 'a1',
        title: 'Facebook vs TikTok for AU in 2026',
        tier: 'FREE',
        body: [
          "Facebook/Instagram ads still win for 35+ audiences, especially for home, garden, pet, and health products. Targeting is precise, ad manager is mature, reporting is honest.",
          "TikTok ads dominate for 18-34, impulse buys, novelty products, and anything demo-friendly. CPMs are lower than FB, creative fatigues faster (7-10 days), and the native look matters more than the targeting.",
          "Split by product: beauty, gadgets, fashion accessories → TikTok. Home, wellness, pet, outdoor → Facebook. Run both if you can afford to split the budget.",
        ],
      },
      {
        id: 'a2',
        title: 'Minimum cold-traffic budget',
        tier: 'FREE',
        body: [
          "Below $20/day per ad set, the Meta algorithm cannot exit the learning phase. You will spend $10 a day for 4 days and get nothing.",
          "Realistic minimum to validate a product: $30-50/day for 3 days. That is $90-150 to get a statistically meaningful signal. If you cannot afford that, wait until you can.",
          "Start with one Advantage+ Shopping Campaign and 3 creatives. Let Meta's algorithm decide the winner. Only split-test manually once you have conversion data.",
        ],
      },
      {
        id: 'a3',
        title: 'Reading ROAS properly',
        tier: 'SCALE',
        body: [
          "ROAS = revenue / ad spend. A 2× ROAS means you got $2 back for every $1 spent. That sounds profitable but remember: $2 of revenue is not $2 of profit. After COGS, shipping, and fees, a 2× ROAS is usually break-even.",
          "Breakeven ROAS formula: selling_price / (selling_price − COGS − shipping − fees). For most dropship products that is 2.2-2.8×. Anything above is profit. Anything below is loss.",
          "A 3× ROAS is healthy. 4× is great. 5× is your scale signal — add budget aggressively.",
        ],
      },
      {
        id: 'a4',
        title: 'Retargeting sequences that convert',
        tier: 'SCALE',
        body: [
          "Three retargeting audiences in priority order: 1) Add-to-cart, no purchase in the last 7 days. 2) Page visitors, no add-to-cart in the last 14 days. 3) Post/video engagers in the last 30 days.",
          "Budget split: 70% cold traffic, 20% retargeting, 10% lookalikes. Do not invert this until your cold audience is truly saturated.",
          "Use a different creative for retargeting than for cold. Retargeting is 'you looked at this, here is why you should buy it now' with urgency (stock, limited offer). Cold is 'do you know this product exists?' with discovery-mode creative.",
        ],
      },
      {
        id: 'a5',
        title: 'Scaling winners without killing them',
        tier: 'SCALE',
        body: [
          "When an ad set hits 3×+ ROAS consistently over 5 days, duplicate it at 2× the budget instead of editing the original. Editing triggers the learning phase all over again.",
          "Horizontal scaling (more audiences) is safer than vertical scaling (higher budget per audience). You dilute less, and you find incremental audience pockets.",
          "Once an ad set is running at $200/day+, check frequency. Above 3.0 means fatigue — rotate the creative, not the targeting.",
        ],
      },
    ],
  },
  {
    id: 'brand',
    title: 'Building Your Brand',
    color: '#a78bfa',
    summary: 'The difference between a one-hit-wonder store and a brand that compounds over years.',
    lessons: [
      {
        id: 'b1',
        title: 'Naming your store',
        tier: 'FREE',
        body: [
          "Good names are short (1-3 syllables), memorable, and give you room to expand. 'AussieGripSocks' locks you into one product category forever. 'Kindred & Co' gives you any lifestyle vertical.",
          "Check domain availability on Porkbun or Namecheap. .com.au is the gold standard for AU-targeted stores; it signals local to Australian customers and earns trust immediately.",
          "Check the name on Instagram, TikTok, and the Australian Trademark Register (IP Australia) before you commit. Nothing hurts more than rebranding at month six.",
        ],
      },
      {
        id: 'b2',
        title: 'Building trust on day one',
        tier: 'FREE',
        body: [
          "A new store with zero reviews looks like a scam. Pre-seed reviews ethically: ask 5 friends to buy at cost, ship it for real, ask them to leave an honest review on the product page.",
          "Trust elements to have on every page: phone/email contact, street address (PO box is fine), clear returns policy link in the footer, 'Afterpay accepted' badge if you are on Afterpay, trust seals only if they are real (Shopify secure checkout badge is free).",
          "Add an 'About' page with a real photo of the founder (you). Customers buy from humans, not logos.",
        ],
      },
      {
        id: 'b3',
        title: 'Product photography on a budget',
        tier: 'SCALE',
        body: [
          "You do not need a studio. An iPhone 12+, a $30 softbox from Bunnings, and a white paper backdrop is enough for e-commerce quality shots.",
          "Shoot three types per product: 1) Clean pack shot on white. 2) Lifestyle shot (the product in use in an Australian home or outdoor setting). 3) Scale shot (the product in a hand or next to a known-size object). The lifestyle shot sells; the pack shot converts.",
          "Never use only the AliExpress supplier photos. Every other dropshipper is using them. Your own photos become your moat.",
        ],
      },
      {
        id: 'b4',
        title: 'Email flows that recover revenue',
        tier: 'SCALE',
        body: [
          "Four flows to set up in Klaviyo or Omnisend before you spend another dollar on ads. 1) Abandoned cart (3 emails over 48 hours, first at 1hr). 2) Welcome series (3 emails over 7 days, offer 10% off on email 1). 3) Post-purchase (thank-you, then review request 10 days later, then cross-sell at day 30). 4) Win-back (customers inactive for 60 days).",
          "These four flows alone recover 15-25% of email-eligible revenue with zero ongoing work once set up. The best ROI you will get in e-commerce.",
          "Write them in your brand voice. Never copy template emails word-for-word — they are obvious and kill the relationship before it starts.",
        ],
      },
      {
        id: 'b5',
        title: 'Supplier relationships that save you',
        tier: 'SCALE',
        body: [
          "Once you are doing 20+ orders/day of a product, message the AliExpress seller directly and ask for a private rate. 'Hi, I am importing this to Australia for a dropship brand. At volume, can we discuss per-unit pricing and faster dispatch?' You will get a better price, priority packing, and sometimes a contact at the factory.",
          "Ask for an 'AE Standard Shipping' upgrade at your cost — often 2-3 days faster than the default.",
          "Move to CJDropshipping or Zendrop as soon as you can afford the 5-10% premium. Faster shipping, better QC, real support. Your customers will never know — your refund rate will plummet.",
        ],
      },
    ],
  },
];

const TOTAL_LESSONS = MODULES.reduce((a, m) => a + m.lessons.length, 0);

function readProgress(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeProgress(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore quota errors */
  }
}

export default function LearnHub() {
  useEffect(() => { document.title = 'Academy — Majorka'; }, []);
  const { isPro } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(readProgress());
  }, []);

  const pct = useMemo(() => Math.round((completed.size / TOTAL_LESSONS) * 100), [completed]);
  const remainingMins = (TOTAL_LESSONS - completed.size) * 6;

  // Motivational copy that adapts to progress so the page never feels static
  const progressMessage = useMemo(() => {
    const n = completed.size;
    if (n === 0) return 'Start with Lesson 1 — it takes 8 minutes';
    if (n < 6)   return 'Great start — keep the momentum';
    if (n < 16)  return "You're building real knowledge";
    if (n < 21)  return "Almost there — you're ahead of 90% of operators";
    return '🎉 Academy complete — you\'re ready to launch';
  }, [completed.size]);

  const toggleComplete = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      const wasDone = next.has(id);
      if (wasDone) {
        next.delete(id);
      } else {
        next.add(id);
        // Find the module this lesson belongs to so we can detect a
        // module-complete celebration on top of the per-lesson toast.
        const mod = MODULES.find((m) => m.lessons.some((l) => l.id === id));
        const modDoneCount = mod ? mod.lessons.filter((l) => next.has(l.id)).length : 0;
        const modTotal = mod ? mod.lessons.length : 0;
        toast.success(`Lesson complete — ${next.size}/${TOTAL_LESSONS} done`, { duration: 2500 });
        if (mod && modDoneCount === modTotal) {
          setTimeout(() => toast(`🏆 Module complete: ${mod.title}`, { duration: 4000 }), 400);
        }
      }
      writeProgress(next);
      return next;
    });
  };

  const toggleExpand = (id: string, lesson: Lesson) => {
    // Tier gate: SCALE lessons require an active Scale subscription.
    // Non-Scale users get an upgrade prompt instead of the lesson body.
    if (lesson.tier === 'SCALE' && !isPro) {
      toast.error('This is a Scale-tier lesson. Upgrade to unlock the full curriculum.', { duration: 4000 });
      return;
    }
    setExpanded((prev) => (prev === id ? null : id));
  };

  function copyShareLink() {
    try {
      navigator.clipboard.writeText('https://majorka.io/app/learn');
      toast.success('Academy link copied');
    } catch {
      toast.error('Could not copy — your browser blocked clipboard access');
    }
  }

  return (
    <div style={{
      padding: '40px 36px 80px',
      maxWidth: 960,
      margin: '0 auto',
      fontFamily: sans,
      color: '#e8e8f0',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: display,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          margin: '0 0 8px',
          background: 'linear-gradient(135deg,#f5f5f5 0%,#a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Majorka Academy</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px' }}>
          Everything you need to go from zero to your first $10K month.
        </p>

        {/* Progress tracker */}
        <div style={{
          background: surface,
          border,
          borderRadius: 12,
          padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)' }}>
              Your Progress
            </span>
            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
              {completed.size} of {TOTAL_LESSONS} lessons complete
            </span>
          </div>
          <div style={{
            height: 8,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 999,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg,#7c6aff,#a78bfa)',
              transition: 'width 320ms cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
          <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {progressMessage}
            </span>
            {completed.size < TOTAL_LESSONS && (
              <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                ~{remainingMins} min remaining
              </span>
            )}
          </div>
        </div>

        {/* Share banner — encourages organic distribution */}
        <div style={{
          marginTop: 16,
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>
              Know a dropshipper who&apos;d find this useful?
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Share the free Academy — direct link to start
            </div>
          </div>
          <button
            onClick={copyShareLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'rgba(212,175,55,0.18)',
              border: '1px solid rgba(212,175,55,0.32)',
              color: '#c7d2fe',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: sans,
            }}
          >
            <Share2 size={12} /> Copy link
          </button>
        </div>
      </div>

      {/* Modules */}
      {MODULES.map((mod) => {
        const moduleCompleted = mod.lessons.filter((l) => completed.has(l.id)).length;
        return (
          <section key={mod.id} style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 14,
              gap: 16,
            }}>
              <div>
                <div style={{
                  fontFamily: mono,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: mod.color,
                  marginBottom: 4,
                }}>Module</div>
                <h2 style={{
                  fontFamily: display,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: '0 0 4px',
                  color: '#f1f1f3',
                }}>{mod.title}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 600 }}>
                  {mod.summary}
                </p>
              </div>
              <span style={{
                fontFamily: mono,
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                whiteSpace: 'nowrap',
                marginTop: 18,
              }}>{moduleCompleted}/{mod.lessons.length} done</span>
            </div>

            {/* Lesson list */}
            <div style={{
              background: surface,
              border,
              borderRadius: 12,
              overflow: 'hidden',
              borderLeft: `2px solid ${mod.color}`,
            }}>
              {mod.lessons.map((lesson, idx) => {
                const isOpen = expanded === lesson.id;
                const isDone = completed.has(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    style={{
                      borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Row */}
                    <button
                      onClick={() => toggleExpand(lesson.id, lesson)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '16px 20px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: sans,
                        color: '#e8e8f0',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isDone ? '#10b981' : 'rgba(255,255,255,0.35)',
                      }}>
                        {isDone ? <CheckCircle2 size={14} /> : <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700 }}>{idx + 1}</span>}
                      </span>
                      <span style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: isDone ? 500 : 600,
                        color: isDone ? 'rgba(255,255,255,0.55)' : '#f1f1f3',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>{lesson.title}</span>

                      {lesson.tier === 'SCALE' ? (
                        <span style={{
                          fontFamily: mono,
                          fontSize: 9,
                          fontWeight: 700,
                          color: isPro ? '#a78bfa' : '#71717a',
                          background: isPro ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isPro ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 999,
                          padding: '2px 8px',
                          letterSpacing: '0.05em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>{isPro ? 'SCALE · UNLOCKED' : (<><Lock size={9} /> SCALE</>)}</span>
                      ) : (
                        <span style={{
                          fontFamily: mono,
                          fontSize: 9,
                          fontWeight: 700,
                          color: 'rgba(16,185,129,0.9)',
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.22)',
                          borderRadius: 999,
                          padding: '2px 8px',
                          letterSpacing: '0.05em',
                        }}>FREE</span>
                      )}

                      {isOpen
                        ? <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        : <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div style={{
                        padding: '4px 24px 22px 58px',
                        background: 'rgba(124,106,255,0.03)',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        {lesson.body.map((para, i) => (
                          <p key={i} style={{
                            fontSize: 13.5,
                            lineHeight: 1.7,
                            color: 'rgba(232,232,240,0.85)',
                            margin: '12px 0',
                          }}>{para}</p>
                        ))}
                        <button
                          onClick={() => toggleComplete(lesson.id)}
                          style={{
                            marginTop: 10,
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: `1px solid ${isDone ? 'rgba(16,185,129,0.35)' : 'rgba(124,106,255,0.35)'}`,
                            background: isDone ? 'rgba(16,185,129,0.12)' : 'rgba(124,106,255,0.1)',
                            color: isDone ? '#10b981' : '#a78bfa',
                            fontFamily: sans,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 120ms',
                          }}
                        >
                          {isDone ? <><CheckCircle2 size={13} /> Completed</> : <>Mark complete ✓</>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Footer note — tier-aware */}
      {isPro ? (
        <div style={{
          marginTop: 40,
          padding: '16px 20px',
          background: 'rgba(124,106,255,0.04)',
          border: '1px solid rgba(124,106,255,0.15)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
        }}>
          <CheckCircle2 size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
          <span>You&apos;re on Scale Plan — all lessons unlocked. Progress syncs to your account.</span>
        </div>
      ) : (
        <div style={{
          marginTop: 40,
          padding: '20px 22px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Lock size={14} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>
              Unlock all 21 lessons with Scale
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 14px' }}>
            The free lessons cover the fundamentals. Scale lessons go deep on ad scaling, profit
            engineering, retention, and the systems behind $10K+/month operators. Free lessons stay
            free forever — Scale lessons require a Scale subscription.
          </p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #d4af37, #d4af37)',
              color: '#fff',
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
            }}
          >
            See Scale plan →
          </Link>
        </div>
      )}
    </div>
  );
}
