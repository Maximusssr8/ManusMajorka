// Pricing v2 — Academy-style: monospace eyebrow, Syne headings,
// dark cards with cobalt borders, GoldButton-style CTA.
import { useState } from 'react';
import { Check } from 'lucide-react';
import { F } from '@/lib/landingTokens';
import { Link } from 'wouter';
import { Eyebrow, H2, Sub } from './shared';

const PRICING_CSS = `
.mj-pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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
        padding: '80px 20px',
        maxWidth: 1152,
        margin: '0 auto',
      }}
    >
      {/* Header -- Academy-style */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Eyebrow center>Pricing</Eyebrow>
        <H2 style={{ margin: '0 auto 12px' }}>
          One plan. Product intel, AI ads,
          <br />
          <span style={{ color: '#9CA3AF' }}>and store builder included.</span>
        </H2>

        {/* Value anchor */}
        <Sub style={{ margin: '0 auto 24px' }}>
          One winning product = <span style={{ fontFamily: F.mono, color: '#E0E0E0' }}>$3,000-15,000 AUD/month</span>.
          Scale costs <span style={{ fontFamily: F.mono, color: '#E0E0E0' }}>$166/mo</span>.
        </Sub>

        {/* Toggle -- Academy-style pill */}
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            background: '#0d1117',
            border: '1px solid rgba(79,142,247,0.08)',
            borderRadius: 12,
          }}
        >
          {[
            { label: 'Monthly', val: false },
            { label: 'Annual \u2014 save 20%', val: true },
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
                color: annual === t.val ? '#000' : '#9CA3AF',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.02em',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROI Math Card -- Academy card style */}
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto 48px',
          background: '#0d1117',
          border: '1px solid rgba(79,142,247,0.08)',
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: '#E0E0E0',
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
                fontSize: 14,
                color: '#9CA3AF',
              }}
            >
              <span>{left}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: '#6B7280' }}>&rarr;</span>
                <span>{right}</span>
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: '#E0E0E0',
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
            padding: 28,
            background: '#0d1117',
            border: '1px solid rgba(79,142,247,0.08)',
            borderRadius: 16,
          }}
        >
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#E0E0E0', marginBottom: 4 }}>Builder</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>For dropshippers starting out</div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: F.mono, fontSize: 44, fontWeight: 700, color: '#E0E0E0' }}>${builderPrice}</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, color: '#6B7280', marginLeft: 4 }}>/mo {annual ? '(billed annually)' : ''}</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>
            {BUILDER_FEATURES.map((feat) => (
              <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: F.body, fontSize: 14, color: '#E0E0E0' }}>
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
              minHeight: 48,
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.04)',
              color: '#E0E0E0',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
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
            padding: 28,
            background: '#0d1117',
            border: '1px solid rgba(79,142,247,0.25)',
            borderRadius: 16,
            boxShadow: '0 20px 60px -20px rgba(79,142,247,0.18)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: 20,
              padding: '4px 12px',
              background: '#4f8ef7',
              color: '#000',
              borderRadius: 999,
              fontFamily: F.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Most Popular
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#E0E0E0', marginBottom: 4 }}>Scale</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>For dropshippers scaling to 6 figures</div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: F.mono, fontSize: 44, fontWeight: 700, color: '#E0E0E0' }}>${scalePrice}</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, color: '#6B7280', marginLeft: 4 }}>/mo {annual ? '(billed annually)' : ''}</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>
            {SCALE_FEATURES.map((feat) => (
              <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: F.body, fontSize: 14, color: '#E0E0E0' }}>
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
              minHeight: 48,
              padding: '12px 24px',
              background: '#4f8ef7',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'filter 150ms ease',
              boxShadow: '0 10px 40px -8px rgba(79,142,247,0.55)',
            }}
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Guarantees -- monospace */}
      <div style={{
        textAlign: 'center',
        marginTop: 32,
        fontFamily: F.mono,
        fontSize: 12,
        color: '#6B7280',
        letterSpacing: '0.04em',
      }}>
        Cancel anytime &nbsp;&middot;&nbsp; 30-day guarantee
      </div>

      {/* Lock-in line */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          fontFamily: F.mono,
          fontSize: 12,
          color: '#6B7280',
          letterSpacing: '0.04em',
        }}
      >
        Lock in early access pricing &mdash; rates increase as we grow.
      </div>
    </section>
  );
}
