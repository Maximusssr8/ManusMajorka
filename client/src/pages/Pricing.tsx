import { useIsMobile } from '@/hooks/useIsMobile';
import { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';

// ── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#FAFAFA',
  card: 'white',
  elevated: '#F9FAFB',
  border: '#E5E7EB',
  borderHover: 'rgba(99,102,241,0.3)',
  text: '#374151',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  gold: '#6366F1',
  goldDim: 'rgba(99,102,241,0.1)',
  goldBorder: 'rgba(99,102,241,0.25)',
};

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Locked tool overlay ─────────────────────────────────────────────────────
function LockedToolOverlay({ toolName }: { toolName: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(4px)',
        background: 'rgba(0,0,0,0.65)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        gap: 6,
      }}
    >
      <span style={{ fontSize: 24 }}>🔒</span>
      <p style={{ fontFamily: syne, fontWeight: 700, color: '#FAFAFA', fontSize: 14 }}>
        {toolName}
      </p>
      <p style={{ color: '#E5E7EB', fontSize: 12, marginBottom: 8 }}>Builder plan required</p>
      <Link
        href="/pricing"
        style={{
          padding: '6px 14px',
          background: '#6366F1',
          color: '#FAFAFA',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: syne,
          textDecoration: 'none',
        }}
      >
        Upgrade to Builder →
      </Link>
    </div>
  );
}

// ── Emotional comparison table ──────────────────────────────────────────────
const COMPETITOR_TOOLS = [
  { name: 'NicheScraper (Product Research)', cost: 79 },
  { name: 'Minea (Ad Spy)', cost: 69 },
  { name: 'Durable (Website Builder)', cost: 59 },
  { name: 'Copy.ai (Copywriter)', cost: 49 },
  { name: 'Klaviyo Lite (Email)', cost: 20 },
  { name: 'SaleHoo (Suppliers)', cost: 27 },
];
const TOTAL_COMPETITOR = COMPETITOR_TOOLS.reduce((s, t) => s + t.cost, 0);
const MAJORKA_PRICE = 99;
const SAVINGS_MO = TOTAL_COMPETITOR - MAJORKA_PRICE;
const SAVINGS_YR = SAVINGS_MO * 12;

function EmotionalComparisonTable() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} style={{ padding: '0 24px 100px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p
            style={{
              fontFamily: syne,
              fontWeight: 700,
              fontSize: 18,
              color: '#94A3B8',
              marginBottom: 8,
            }}
          >
            While your competitors pay{' '}
            <span style={{ color: '#ef4444' }}>${TOTAL_COMPETITOR}/mo</span> for{' '}
            {COMPETITOR_TOOLS.length} tools...
          </p>
          <div
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}
          >
            <span
              style={{
                fontFamily: syne,
                fontWeight: 800,
                fontSize: 'clamp(48px, 8vw, 80px)',
                color: '#6366F1',
                lineHeight: 1,
              }}
            >
              {inView ? (
                <CountUp start={TOTAL_COMPETITOR} end={MAJORKA_PRICE} duration={1.4} prefix="$" />
              ) : (
                `$${MAJORKA_PRICE}`
              )}
            </span>
            <span style={{ fontFamily: syne, fontWeight: 600, fontSize: 18, color: '#9CA3AF' }}>
              AUD/mo
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: 15, marginTop: 8 }}>
            You pay for everything. On one platform.
          </p>
        </div>

        {/* Table */}
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 130px',
              background: 'rgba(255,255,255,0.03)',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: syne,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Tool
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: syne,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'center',
              }}
            >
              Competitor Cost
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: syne,
                color: '#6366F1',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'center',
              }}
            >
              Majorka
            </span>
          </div>

          {COMPETITOR_TOOLS.map((tool, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 130px',
                padding: '13px 20px',
                borderBottom: '1px solid #F9FAFB',
                background: i % 2 === 0 ? 'transparent' : '#FAFAFA',
              }}
            >
              <span style={{ fontSize: 13, color: '#94A3B8' }}>{tool.name}</span>
              <span style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
                ${tool.cost}/mo
              </span>
              <span
                style={{ textAlign: 'center', fontSize: 14, color: '#6366F1', fontWeight: 700 }}
              >
                ✓ Included
              </span>
            </div>
          ))}

          {/* Totals row */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderTop: '1px solid rgba(99,102,241,0.2)',
              padding: '16px 20px',
            }}
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 130px', marginBottom: 10 }}
            >
              <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: '#94A3B8' }}>
                Total if bought separately
              </span>
              <span style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontFamily: syne,
                    fontWeight: 800,
                    fontSize: 16,
                    color: '#ef4444',
                    textDecoration: 'line-through',
                  }}
                >
                  {inView ? (
                    <CountUp
                      start={0}
                      end={TOTAL_COMPETITOR}
                      duration={1.8}
                      prefix="$"
                      suffix="/mo"
                    />
                  ) : (
                    `$${TOTAL_COMPETITOR}/mo`
                  )}
                </span>
              </span>
              <span
                style={{
                  textAlign: 'center',
                  fontFamily: syne,
                  fontWeight: 800,
                  fontSize: 16,
                  color: '#6366F1',
                }}
              >
                ${MAJORKA_PRICE}/mo
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#6366F1',
                  borderRadius: 100,
                  padding: '4px 14px',
                  fontFamily: syne,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                You save: ${SAVINGS_MO}/mo · ${SAVINGS_YR.toLocaleString()}/yr
              </span>
            </div>
          </div>
        </div>

        {/* Social proof + urgency */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#6366F1',
                boxShadow: '0 0 6px #6366F1',
              }}
            />
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
              2,847 sellers already made the switch
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 100,
              padding: '5px 14px',
            }}
          >
            <span style={{ fontSize: 12 }}>⚡</span>
            <span style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Plan data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Builder',
    price: '$99',
    period: 'AUD/mo',
    description: 'Everything you need to run a winning ecommerce business.',
    features: [
      '50 product searches/month',
      '50 video searches/month',
      '50 ad intelligence searches/month',
      '50 creator searches/month',
      '5 competitor shop spy/month',
      '3 stores in Store Builder',
      '5 alerts max',
      '20 Ads Studio generations/month',
    ],
    notIncluded: ['Niche Signal Tracking', 'API access', 'Priority support'],
    cta: 'Get Started',
    ctaHref: null, // handled via Stripe
    highlight: true,
    badge: 'Most Popular',
    afterpay: true,
    plan: 'builder',
  },
  {
    name: 'Scale',
    price: '$199',
    period: 'AUD/mo',
    description: 'For serious operators who need full control and unlimited access.',
    features: [
      'Everything in Builder',
      'Unlimited searches (all tools)',
      'Unlimited Competitor Shop Spy',
      'Unlimited Store Builder',
      'Niche Signal Tracking',
      'API access',
      'Priority support',
    ],
    notIncluded: [],
    cta: 'Subscribe',
    ctaHref: null, // handled via Stripe
    highlight: false,
    badge: null,
    afterpay: true,
    plan: 'scale',
  },
];

// ── Savings Calculator ──────────────────────────────────────────────────────

function SavingsCalculator() {
  const [adSpend, setAdSpend] = useState(2000);
  const wastedSpend = Math.round(adSpend * 0.35);
  const savings = Math.round(wastedSpend * 0.9);
  const paybackDays = Math.round(99 / (savings / 30));
  const fmt = (n: number) => `$${n.toLocaleString('en-AU')}`;

  return (
    <section style={{ padding: '0 24px 60px' }}>
      <div style={{
        maxWidth: 860,
        margin: '0 auto',
        background: '#0C1120',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20,
        padding: '40px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #6366F1, transparent)' }} />
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💸</div>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: '#CBD5E1', letterSpacing: '-0.02em', marginBottom: 6 }}>
            HOW MUCH IS ONE BAD PRODUCT DECISION COSTING YOU?
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Drag the slider to see your real numbers</p>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>Your monthly ad spend:</span>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, color: '#6366F1' }}>{fmt(adSpend)}/month</span>
          </div>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={adSpend}
            onChange={(e) => setAdSpend(Number(e.target.value))}
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(to right, #6366F1 ${((adSpend - 500) / (50000 - 500)) * 100}%, #F0F0F0 ${((adSpend - 500) / (50000 - 500)) * 100}%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>$500</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>$50,000</span>
          </div>
        </div>

        {/* Comparison columns */}
        <div className="pricing-calc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '20px 18px' }}>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: '#ef4444', marginBottom: 14 }}>Without Majorka</div>
            {[
              `❌ 35% wasted on bad products`,
              `❌ ${fmt(wastedSpend)} lost/month`,
              `❌ 15h researching manually`,
            ].map((item) => (
              <div key={item} style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10, transition: 'all 0.3s' }}>{item}</div>
            ))}
          </div>
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '20px 18px' }}>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: '#6366F1', marginBottom: 14 }}>With Majorka Pro</div>
            {[
              `✅ Data-backed choices`,
              `✅ Save ~${fmt(savings)}/month`,
              `✅ 15min automated`,
            ].map((item) => (
              <div key={item} style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10, transition: 'all 0.3s' }}>{item}</div>
            ))}
          </div>
        </div>

        {/* Payback box */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '20px 24px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.7rem)', color: '#6366F1', marginBottom: 4, transition: 'all 0.3s' }}>
            💰 Majorka Pro pays for itself in {paybackDays} day{paybackDays !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>
            ($99/mo vs {fmt(wastedSpend)} in wasted ad spend)
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FAFAFA', borderRadius: 12, padding: '14px 36px', fontFamily: syne, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            Start Saving Now →
          </a>
        </div>
      </div>
    </section>
  );
}

// ── FAQ data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. Australian Consumer Law applies, and you retain access to paid features until the end of your current billing period.',
  },
  {
    q: 'Is there a money-back guarantee?',
    a: "Yes. Both plans include a 14-day money-back guarantee. If you're not happy within 14 days of your first payment, we'll refund you in full — no questions asked.",
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your data is never deleted. If you cancel, your saved outputs, products, and conversation history remain intact \u2014 you just lose access until you re-subscribe.',
  },
  {
    q: 'Do you offer refunds?',
    a: "Yes. If you're not satisfied within the first 14 days, contact us for a full refund \u2014 no questions asked. Australian Consumer Law applies to all purchases.",
  },
  {
    q: 'Can I pay with Afterpay or Zip?',
    a: 'Yes. Afterpay and Zip are available on both Builder and Scale plans, letting you spread payments over interest-free instalments.',
  },
];

export default function Pricing() {
  const isMobile = useIsMobile();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(true);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const { session } = useAuth();

  // Check Stripe config + current subscription status
  useEffect(() => {
    const token = session?.access_token;
    if (!token) {
      // For logged-out users, just check if Stripe is configured via a quick probe
      fetch('/api/stripe/subscription-status', {
        headers: { Authorization: 'Bearer anonymous' },
      })
        .then((r) => r.json())
        .then((d) => setStripeConfigured(d.stripeConfigured ?? false))
        .catch(() => setStripeConfigured(false));
      return;
    }
    fetch('/api/stripe/subscription-status', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((r) => r.json())
      .then((d) => {
        setStripeConfigured(d.stripeConfigured ?? false);
        setCurrentPlan(d.plan ?? '');
      })
      .catch(() => setStripeConfigured(false));
  }, [session]);

  // Compute display price based on toggle
  const getDisplayPrice = (plan: (typeof PLANS)[number]) => {
    if (plan.price === '$0') return '$0';
    const base = parseInt(plan.price.replace('$', ''));
    if (annual) {
      const monthlyEquiv = Math.round(base * 0.8); // Save 20%
      return `$${monthlyEquiv}`;
    }
    return plan.price;
  };
  const getAnnualTotal = (plan: (typeof PLANS)[number]) => {
    if (plan.price === '$0') return null;
    const base = parseInt(plan.price.replace('$', ''));
    return base * 10; // 2 months savings
  };

  const handleProCheckout = async (plan?: string) => {
    // If Stripe not configured, show friendly message
    if (stripeConfigured === false) {
      toast.info('Payment processing launching soon — join the waitlist to be first in line!');
      return;
    }

    const token = session?.access_token;
    if (!token) {
      toast.error('Please sign in to upgrade.');
      window.location.href = '/sign-in?redirect=/pricing';
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ plan: plan ?? 'builder' }),
      });
      const data = (await res.json()) as { url?: string; error?: string; configured?: boolean };
      if (data.url) {
        window.location.href = data.url;
      } else if (data.configured === false) {
        toast.info('Payment processing launching soon');
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      toast.error(err.message || 'Payment error \u2014 please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: dm,
        overflowX: 'hidden',
        minHeight: '100vh',
      }}
    >
      <SEO
        title="Pricing — Majorka AI Ecommerce OS"
        description="Builder $99/mo AUD. Scale $199/mo AUD. No lock-in. 14-day money-back guarantee."
        path="/pricing"
      />

      <style>{`
        @media (max-width: 640px) {
          .pricing-hero-title { font-size: 28px !important; line-height: 1.2 !important; }
          .pricing-hero-sub { font-size: 15px !important; }
          .pricing-cards-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pricing-section { padding: 48px 16px !important; }
          .pricing-cta-btn { width: 100% !important; }
          .pricing-testimonials { grid-template-columns: 1fr !important; gap: 12px !important; }
          .pricing-trust-badges { flex-wrap: wrap !important; gap: 12px !important; justify-content: center !important; }
          .pricing-comparison { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .pricing-faq { padding: 0 16px !important; }
          .pricing-toggle { flex-direction: column !important; gap: 8px !important; }
          .pricing-calc-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .pricing-bottom-cta { padding: 48px 16px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: C.secondary,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {'\u2190'} Back to Home
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: syne,
                fontWeight: 800,
                fontSize: 16,
                color: '#FAFAFA',
              }}
            >
              M
            </div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: '#F8FAFC' }}>MAJORKA</span>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pricing-section" style={{ padding: '80px 24px 56px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            background: C.goldDim,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: C.gold,
            marginBottom: 24,
            letterSpacing: '0.05em',
          }}
        >
          Simple Pricing &middot; Prices in AUD &middot; Global access included
        </div>
        <h1
          className="pricing-hero-title"
          style={{
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 'clamp(32px, 6vw, 56px)',
            letterSpacing: '-1.5px',
            marginBottom: 16,
          }}
        >
          Plans that scale with you.
        </h1>
        <p
          className="pricing-hero-sub"
          style={{
            color: C.secondary,
            fontSize: 18,
            maxWidth: 520,
            margin: '0 auto',
            marginBottom: 32,
          }}
        >
          Simple pricing. No hidden fees. 14-day money-back guarantee.
        </p>

        {/* Monthly / Annual toggle */}
        <div
          className="pricing-toggle"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 100,
            padding: '6px 8px',
          }}
        >
          <button
            onClick={() => setAnnual(false)}
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: syne,
              background: !annual ? `linear-gradient(135deg, ${C.gold}, #4F46E5)` : 'transparent',
              color: !annual ? '#FAFAFA' : C.secondary,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: syne,
              background: annual ? `linear-gradient(135deg, ${C.gold}, #4F46E5)` : 'transparent',
              color: annual ? '#FAFAFA' : C.secondary,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Annual
            <span
              style={{
                background: 'rgba(99,102,241,0.15)',
                color: '#6366F1',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 100,
              }}
            >
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ── */}
      <SavingsCalculator />

      {/* ── PLAN CARDS ── */}
      <section className="pricing-section" style={{ padding: '0 24px 100px' }}>
        {/* Social proof strip */}
        <div style={{ marginBottom: 48, textAlign: 'center', maxWidth: 1050, margin: '0 auto', paddingBottom: 48 }}>
          {/* Metrics-based social proof — no fake names */}
          <div className="pricing-testimonials" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, maxWidth: 760, margin: '0 auto 0' }}>
            {[
              { stat: '131', label: 'trending products tracked', icon: '📦', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
              { stat: '7',   label: 'global markets covered',   icon: '🌏', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
              { stat: '14',  label: 'day money-back guarantee', icon: '✅', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
              { stat: '500+', label: 'sellers on the platform', icon: '🚀', color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE' },
            ].map(m => (
              <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 14, padding: '18px 16px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 28, color: m.color, lineHeight: 1, marginBottom: 6 }}>{m.stat}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div className="pricing-trust-badges" style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
            {['Secure checkout', '14-day money-back guarantee', 'Australian Consumer Law', 'Cancel anytime'].map(badge => (
              <span key={badge} style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>{badge}</span>
            ))}
          </div>
        </div>

        <div
          className="pricing-cards-grid"
          style={{
            maxWidth: 740,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: isMobile ? 12 : 24,
            alignItems: 'start',
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? C.elevated : C.card,
                border: `1px solid ${plan.highlight ? C.gold : C.border}`,
                borderRadius: 20,
                padding: 36,
                position: 'relative',
                boxShadow: plan.highlight ? '0 0 48px rgba(99,102,241,0.18)' : 'none',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
                    color: '#FAFAFA',
                    borderRadius: 100,
                    padding: '5px 18px',
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: syne,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div
                style={{
                  fontFamily: syne,
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 4,
                  color: plan.highlight ? C.gold : C.text,
                }}
              >
                {plan.name}
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{plan.description}</p>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: syne, fontWeight: 800, fontSize: isMobile ? 30 : 48, color: C.text }}>
                  {getDisplayPrice(plan)}
                </span>
                <span style={{ color: C.muted, fontSize: 15 }}>
                  {annual && plan.price !== '$0' ? 'AUD/mo' : plan.period}
                </span>
              </div>
              {annual && plan.price !== '$0' && (
                <div style={{ fontSize: 12, color: C.secondary, marginBottom: 20 }}>
                  <span style={{ textDecoration: 'line-through', color: C.muted }}>
                    ${parseInt(plan.price.replace('$', '')) * 12}/yr
                  </span>{' '}
                  <span style={{ color: '#6366F1', fontWeight: 700 }}>
                    ${getAnnualTotal(plan)}/yr — save ${Math.round(parseInt(plan.price.replace('$', '')) * 12 * 0.2)}
                  </span>
                </div>
              )}
              {(!annual || plan.price === '$0') && <div style={{ marginBottom: 20 }} />}

              {/* CTA button */}
              {plan.ctaHref !== null ? (
                <Link
                  href={plan.ctaHref}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: plan.highlight
                      ? `linear-gradient(135deg, ${C.gold}, #4F46E5)`
                      : 'transparent',
                    color: plan.highlight ? '#FAFAFA' : C.text,
                    border: plan.highlight ? 'none' : `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: '13px 20px',
                    fontFamily: syne,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                    marginBottom: 16,
                  }}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleProCheckout((plan as any).plan)}
                  disabled={checkoutLoading}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
                    color: '#FAFAFA',
                    border: 'none',
                    borderRadius: 10,
                    padding: '13px 20px',
                    fontFamily: syne,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                    marginBottom: 16,
                    boxShadow: '0 0 24px rgba(99,102,241,0.3)',
                    opacity: checkoutLoading ? 0.7 : 1,
                  }}
                >
                  {checkoutLoading ? 'Redirecting...' : stripeConfigured === false ? 'Get Started' : plan.cta}
                </button>
              )}

              {/* Payment info */}
              {plan.afterpay && annual && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 0',
                    marginBottom: 16,
                    fontSize: 11,
                    color: C.secondary,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      background: '#b2fce4',
                      color: '#F8FAFC',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    Afterpay
                  </span>
                  <span>&</span>
                  <span
                    style={{
                      background: '#7b61ff',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    Zip
                  </span>
                  <span>available on annual</span>
                </div>
              )}
              {plan.afterpay && !annual && (
                <div style={{ padding: '6px 0', marginBottom: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    Or save 20% with annual billing
                  </span>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />

              {/* Included features */}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: 14,
                      color: C.secondary,
                    }}
                  >
                    <span
                      style={{ color: '#6366F1', fontWeight: 700, flexShrink: 0, marginTop: 1 }}
                    >
                      {'\u2713'}
                    </span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: 14,
                      color: C.muted,
                    }}
                  >
                    <span style={{ color: C.muted, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                      {'\u2013'}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON SUMMARY ── */}
      <section
        style={{
          padding: '0 24px 100px',
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 80 }}>
          <h2
            style={{
              fontFamily: syne,
              fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 36px)',
              letterSpacing: '-0.8px',
              textAlign: 'center',
              marginBottom: 48,
            }}
          >
            What's included in each plan?
          </h2>
          <div className="pricing-comparison" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', minWidth: 500 }}>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 140px',
                background: C.elevated,
                padding: '14px 24px',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: syne,
                  color: C.muted,
                  textTransform: 'uppercase',
                }}
              >
                Feature
              </span>
              {PLANS.map((p) => (
                <span
                  key={p.name}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: syne,
                    color: p.highlight ? C.gold : C.muted,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                  }}
                >
                  {p.name}
                </span>
              ))}
            </div>
            {[
              { label: 'AI Credits/day', builder: 'Unlimited', scale: 'Unlimited' },
              { label: 'All 50+ Tools', builder: '\u2713', scale: '\u2713' },
              { label: 'Full Launch Kit', builder: '\u2713', scale: '\u2713' },
              { label: 'Meta + TikTok Ads', builder: '\u2713', scale: '\u2713' },
              { label: 'Financial Modeler', builder: '\u2713', scale: '\u2713' },
              { label: 'Priority AI', builder: '\u2717', scale: '\u2713' },
              { label: 'White-label Export', builder: '\u2717', scale: '\u2713' },
              { label: 'API Access', builder: '\u2717', scale: '\u2713' },
              { label: 'Support', builder: 'Priority', scale: 'Dedicated' },
              { label: 'Afterpay / Zip', builder: '\u2713', scale: '\u2713' },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 140px',
                  padding: '14px 24px',
                  borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? 'transparent' : '#FAFAFA',
                }}
              >
                <span style={{ fontSize: 14, color: C.secondary }}>{row.label}</span>
                <span
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    color:
                      row.builder === '\u2713'
                        ? '#6366F1'
                        : row.builder === '\u2717'
                          ? C.muted
                          : C.gold,
                    fontWeight: 600,
                  }}
                >
                  {row.builder}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    color:
                      row.scale === '\u2713'
                        ? '#6366F1'
                        : row.scale === '\u2717'
                          ? C.muted
                          : C.gold,
                    fontWeight: 600,
                  }}
                >
                  {row.scale}
                </span>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── EMOTIONAL COMPARISON ── */}
      <EmotionalComparisonTable />

      {/* ── FAQ ── */}
      <section className="pricing-faq" style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: syne,
              fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 36px)',
              letterSpacing: '-0.8px',
              textAlign: 'center',
              marginBottom: 48,
            }}
          >
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  border: `1px solid ${openFaq === i ? C.goldBorder : C.border}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: openFaq === i ? 'rgba(99,102,241,0.04)' : C.card,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 22px',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    color: C.text,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 15 }}>{faq.q}</span>
                  <span
                    style={{
                      color: C.gold,
                      fontSize: 18,
                      transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 20px' }}>
                    <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section
        className="pricing-bottom-cta"
        style={{
          padding: isMobile ? '40px 16px' : '80px 24px',
          background: `linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.03) 60%, ${C.bg} 100%)`,
          borderTop: `1px solid ${C.goldBorder}`,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 'clamp(24px, 4vw, 36px)',
            letterSpacing: '-0.8px',
            marginBottom: 16,
          }}
        >
          Ready to scale your business?
        </h2>
        <p style={{ color: C.secondary, fontSize: 16, marginBottom: 36 }}>
          14-day money-back guarantee. Afterpay available.
        </p>
        <Link
          href="/sign-up?plan=builder"
          style={{
            display: 'inline-block',
            background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
            color: '#FAFAFA',
            borderRadius: 10,
            padding: '14px 36px',
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 16,
            textDecoration: 'none',
            boxShadow: '0 0 36px rgba(99,102,241,0.35)',
            marginBottom: 24,
          }}
        >
          Get Started {'\u2192'}
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>{'\uD83D\uDEE1\uFE0F'}</span>
          <span style={{ fontSize: 13, color: C.secondary, fontWeight: 500 }}>
            14-day money-back guarantee &middot; Australian Consumer Law applies
          </span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: syne,
              fontWeight: 800,
              fontSize: 14,
              color: '#FAFAFA',
            }}
          >
            M
          </div>
          <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15 }}>MAJORKA</span>
        </div>
        <p style={{ color: C.muted, fontSize: 13 }}>
          &copy; {new Date().getFullYear()} Majorka. The AI Ecommerce Operating System. Made in
          Australia {'\uD83C\uDDE6\uD83C\uDDFA'}
        </p>
        <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
          Australian Consumer Law applies · Gold Coast, QLD
        </p>
      </footer>
    </div>
  );
}
