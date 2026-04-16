// Pricing v2 — Vercel/Linear style: two cards, annual toggle, value anchor.
import { useState } from 'react';
import { Check } from 'lucide-react';
import { LT, F, R, MAX } from '@/lib/landingTokens';
import { Link } from 'wouter';

const PRICING_CSS = `
.mj-pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 880px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .mj-pricing-grid { grid-template-columns: 1fr; }
}
`;

const BUILDER_FEATURES = [
  'Full product database',
  'Live AU / US / UK data',
  '50 AI briefs / month',
  '20 ad generations / month',
  '1 Shopify store',
  'Email support',
];

const SCALE_FEATURES = [
  'Everything in Builder, plus:',
  'Unlimited AI briefs',
  'Unlimited ad generations',
  '5 Shopify stores',
  'Priority chat support',
  'Early access to new features',
  'Locked launch pricing',
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  const builderPrice = annual ? 82 : 99;
  const scalePrice = annual ? 166 : 199;

  return (
    <section
      id="pricing"
      style={{
        padding: '96px 24px',
        maxWidth: MAX,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          fontFamily: F.body,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4f8ef7',
          marginBottom: 16,
        }}>
          PRICING
        </div>
        <h2
          className="mj-h2"
          style={{
            fontFamily: F.display,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: '0 0 12px',
          }}
        >
          One subscription. Everything you need.
        </h2>

        {/* Value anchor */}
        <p style={{
          fontFamily: F.body,
          fontSize: 15,
          lineHeight: 1.6,
          color: '#8b949e',
          margin: '0 0 24px',
          maxWidth: 640,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          One winning product = <span style={{ fontFamily: F.mono, color: '#ffffff' }}>$3,000–15,000 AUD/month</span>.
          Scale costs <span style={{ fontFamily: F.mono, color: '#ffffff' }}>$166/mo</span>.
        </p>

        {/* Toggle */}
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            background: '#0d1117',
            border: '1px solid #161b22',
            borderRadius: R.button,
          }}
        >
          {[
            { label: 'Monthly', val: false },
            { label: 'Annual — save 20%', val: true },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setAnnual(t.val)}
              style={{
                minHeight: 40,
                padding: '10px 16px',
                border: 'none',
                background: annual === t.val ? '#4f8ef7' : 'transparent',
                color: annual === t.val ? '#ffffff' : '#8b949e',
                fontFamily: F.body,
                fontSize: 13,
                fontWeight: 600,
                borderRadius: R.button,
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROI Math Card */}
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto 48px',
          background: '#0d1117',
          border: '1px solid #161b22',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontSize: 20,
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: 20,
          }}
        >
          The maths:
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['Average winning product', '$3,000\u201315,000 AUD/month net profit'],
            ['Majorka Scale (annual)', '$166/month'],
            ['Time to find first winner', 'Average 2 weeks'],
          ].map(([left, right]) => (
            <div
              key={left}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: 8,
                fontFamily: F.body,
                fontSize: 16,
                color: '#8b949e',
              }}
            >
              <span>{left}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: '#8b949e' }}>&rarr;</span>
                <span>{right}</span>
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: F.body,
            fontSize: 17,
            fontWeight: 700,
            color: '#ffffff',
            marginTop: 24,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          One product pays for 12 months of Scale
          <br />
          in its first week of sales.
        </p>
      </div>

      <style>{PRICING_CSS}</style>

      {/* Cards */}
      <div className="mj-pricing-grid">
        {/* Builder */}
        <div
          style={{
            padding: 32,
            background: '#0d1117',
            border: '1px solid #161b22',
            borderRadius: R.card,
          }}
        >
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Builder</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#8b949e', marginBottom: 16 }}>For dropshippers starting out</div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: F.mono, fontSize: 48, fontWeight: 700, color: '#ffffff' }}>${builderPrice}</span>
            <span style={{ fontFamily: F.body, fontSize: 14, color: '#8b949e', marginLeft: 4 }}>/mo {annual ? '(billed annually)' : ''}</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>
            {BUILDER_FEATURES.map((feat) => (
              <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: F.body, fontSize: 14, color: '#ffffff' }}>
                <Check size={16} color="#4f8ef7" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 44,
              padding: '12px 24px',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid #161b22',
              borderRadius: R.button,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Scale */}
        <div
          style={{
            position: 'relative',
            padding: 32,
            background: '#0d1117',
            border: '1px solid rgba(79,142,247,0.35)',
            borderRadius: R.card,
            boxShadow: '0 0 40px rgba(79,142,247,0.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: 20,
              padding: '4px 12px',
              background: '#4f8ef7',
              color: '#ffffff',
              borderRadius: R.badge,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Most Popular
          </div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Scale</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#8b949e', marginBottom: 16 }}>For dropshippers scaling to 6 figures</div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: F.mono, fontSize: 48, fontWeight: 700, color: '#ffffff' }}>${scalePrice}</span>
            <span style={{ fontFamily: F.body, fontSize: 14, color: '#8b949e', marginLeft: 4 }}>/mo {annual ? '(billed annually)' : ''}</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>
            {SCALE_FEATURES.map((feat) => (
              <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: F.body, fontSize: 14, color: '#ffffff' }}>
                <Check size={16} color="#4f8ef7" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 44,
              padding: '12px 24px',
              background: '#4f8ef7',
              color: '#ffffff',
              border: 'none',
              borderRadius: R.button,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'filter 150ms ease',
            }}
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Guarantees */}
      <div style={{
        textAlign: 'center',
        marginTop: 32,
        fontFamily: F.body,
        fontSize: 14,
        color: '#8b949e',
      }}>
        ✓ Cancel anytime &nbsp;&middot;&nbsp; ✓ 30-day guarantee
      </div>

      {/* Lock-in line */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          fontFamily: F.body,
          fontSize: 14,
          color: '#8b949e',
        }}
      >
        &#128274; Lock in early access pricing &mdash; rates increase as we grow.
      </div>
    </section>
  );
}
