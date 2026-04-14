import { useState, type ReactElement } from 'react';
import { Link } from 'wouter';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

interface Plan {
  readonly name: string;
  readonly monthly: number;
  readonly tagline: string;
  readonly features: readonly string[];
  readonly featured: boolean;
  readonly cta: string;
}

const PLANS: readonly Plan[] = [
  {
    name: 'Builder',
    monthly: 99,
    tagline: 'For new operators validating their first winner.',
    features: [
      'Full product intelligence (3,715 products)',
      'Maya AI briefs — 50 / month',
      'Store Builder — 5 stores',
      'Ads Studio — 25 creative sets',
      'AU, US, UK, CA & NZ market data',
    ],
    featured: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Scale',
    monthly: 199,
    tagline: 'For operators running multiple tests a week.',
    features: [
      'Everything in Builder',
      'Unlimited Maya AI briefs',
      'Unlimited stores & ad sets',
      'Creator Matrix + competitor spy',
      'Priority data refresh (hourly)',
      'Early access to new AI tools',
    ],
    featured: true,
    cta: 'Start Free Trial',
  },
];

export function Pricing(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  const [annual, setAnnual] = useState<boolean>(false);

  return (
    <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: '0.12em', marginBottom: 10 }}>
          PRICING
        </div>
        <h2
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 'clamp(28px,4.5vw,42px)',
            color: '#ededed',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Simple plans. Launch pricing.
        </h2>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            padding: 4,
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999,
          }}
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              padding: '8px 16px',
              background: !annual ? GOLD : 'transparent',
              color: !annual ? '#111' : '#a1a1aa',
              border: 'none',
              borderRadius: 999,
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            style={{
              padding: '8px 16px',
              background: annual ? GOLD : 'transparent',
              color: annual ? '#111' : '#a1a1aa',
              border: 'none',
              borderRadius: 999,
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annual · 20% off
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
          alignItems: 'stretch',
        }}
      >
        {PLANS.map((p, i) => {
          const price = annual ? Math.round(p.monthly * 0.8) : p.monthly;
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{
                position: 'relative',
                background: '#111',
                border: p.featured ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: p.featured ? '0 16px 48px -16px rgba(212,175,55,0.4)' : undefined,
              }}
            >
              {p.featured ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg,${GOLD} 0%,#f4d77a 50%,${GOLD} 100%)`,
                    color: '#111',
                    fontFamily: mono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    padding: '4px 12px',
                    borderRadius: 999,
                  }}
                >
                  MOST POPULAR
                </div>
              ) : null}

              <div>
                <div
                  style={{
                    fontFamily: display,
                    fontWeight: 700,
                    fontSize: 22,
                    color: '#ededed',
                    marginBottom: 4,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, color: '#a1a1aa' }}>{p.tagline}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: display, fontWeight: 800, fontSize: 44, color: '#ededed' }}>
                  ${price}
                </span>
                <span style={{ fontFamily: sans, fontSize: 13, color: '#8a8a8f' }}>AUD / month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: sans, fontSize: 14, color: '#ededed' }}>
                    <Check size={16} color={GOLD} strokeWidth={2.4} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                style={{
                  marginTop: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 20px',
                  background: p.featured
                    ? `linear-gradient(135deg,${GOLD} 0%,#f4d77a 50%,${GOLD} 100%)`
                    : 'transparent',
                  color: p.featured ? '#111' : '#ededed',
                  border: p.featured ? 'none' : '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 12,
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {p.cta}
              </Link>
            </motion.div>
          );
        })}
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontFamily: sans,
          fontSize: 13,
          color: '#8a8a8f',
        }}
      >
        30-day money-back guarantee · Cancel anytime.
      </p>
    </section>
  );
}
