// Pricing v2 — cobalt accents, Stripe logic preserved (href-based, no client-side checkout).
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Check, Flame } from 'lucide-react';
import { LT, F, S, R, SHADOW, MAX } from '@/lib/landingTokens';
import { EyebrowPill, H2, Sub, Section, CtaPrimary, CtaGhost } from './shared';
import { useInViewFadeUp } from '@/components/landing/useInViewFadeUp';

const LAUNCH_END_TS = new Date('2026-04-29T00:00:00+10:00').getTime();

function useCountdown(targetTs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, targetTs - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
  };
}

const TIERS = [
  {
    name: 'Builder',
    tagline: 'For dropshippers starting out',
    priceMonthly: 99,
    priceAnnual: 79,
    highlight: false,
    ctaLabel: 'Get Started',
    features: [
      'Full product database',
      'Live AU / US / UK data',
      '50 AI briefs / month',
      '20 ad generations / month',
      '1 Shopify store',
      'Email support',
    ],
  },
  {
    name: 'Scale',
    tagline: 'For dropshippers scaling to 6 figures',
    priceMonthly: 199,
    priceAnnual: 159,
    highlight: true,
    ctaLabel: 'Get Started →',
    features: [
      'Everything in Builder',
      'Unlimited AI briefs',
      'Unlimited ad generations',
      '5 Shopify stores',
      'Priority chat support',
      'Early access to new features',
      'Locked launch pricing',
    ],
  },
] as const;

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { days, hours } = useCountdown(LAUNCH_END_TS);
  const fadeUp = useInViewFadeUp();

  return (
    <Section id="pricing">
      <div ref={fadeUp.ref} style={{ ...fadeUp.style }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}>
            <EyebrowPill>Pricing</EyebrowPill>
          </div>
          <H2>One subscription. Everything you need.</H2>
          <Sub style={{ marginTop: 12 }}>No card required. Cancel anytime. 30-day guarantee.</Sub>

          {/* Value anchoring */}
          <div
            style={{
              marginTop: 24,
              padding: 24,
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              display: 'grid',
              gap: 6,
              fontFamily: F.body,
              fontSize: 14,
              color: LT.textMute,
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            <div style={{ color: LT.text, fontWeight: 600 }}>The maths are simple:</div>
            <div>Average successful product: <span style={{ fontFamily: F.mono, color: LT.text }}>$3,000–15,000 AUD/month</span> net profit.</div>
            <div>Majorka Scale plan: <span style={{ fontFamily: F.mono, color: LT.text }}>$159/mo</span> (annual).</div>
            <div>ROI from first winning product: <span style={{ fontFamily: F.mono, color: LT.success }}>10–100×</span> your subscription cost.</div>
          </div>

          {/* Launch countdown */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontFamily: F.body, fontSize: 14, color: LT.textMute }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: LT.cobaltTint,
                color: LT.cobalt,
                borderRadius: R.badge,
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Flame size={12} /> Launch pricing ends in: {days}d {hours}h
            </span>
          </div>

          {/* Toggle */}
          <div
            style={{
              marginTop: 16,
              display: 'inline-flex',
              padding: 4,
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
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
                  background: annual === t.val ? LT.cobalt : 'transparent',
                  color: annual === t.val ? LT.text : LT.textMute,
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

        {/* Tier cards */}
        <div
          className="mj-pricing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {TIERS.map((t) => {
            const price = annual ? t.priceAnnual : t.priceMonthly;
            return (
              <div
                key={t.name}
                style={{
                  position: 'relative',
                  padding: 32,
                  background: LT.bgCard,
                  border: t.highlight
                    ? '1px solid rgba(79,142,247,0.35)'
                    : `1px solid ${LT.border}`,
                  borderRadius: R.card,
                  boxShadow: t.highlight ? '0 0 40px rgba(79,142,247,0.08)' : undefined,
                }}
              >
                {t.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      padding: '4px 12px',
                      background: LT.cobalt,
                      color: LT.text,
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
                )}
                <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: LT.text, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, marginBottom: 16 }}>{t.tagline}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 48, fontWeight: 700, color: LT.text }}>${price}</span>
                  <span style={{ fontFamily: F.body, fontSize: 14, color: LT.textMute, marginLeft: 4 }}>/mo {annual ? '(billed annually)' : ''}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 10 }}>
                  {t.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: F.body, fontSize: 14, color: LT.text }}>
                      <Check size={16} color={LT.cobalt} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {t.highlight ? (
                  <CtaPrimary href="/sign-up" style={{ width: '100%' }}>{t.ctaLabel}</CtaPrimary>
                ) : (
                  <CtaGhost href="/sign-up" style={{ width: '100%' }}>{t.ctaLabel}</CtaGhost>
                )}
              </div>
            );
          })}
        </div>

        {/* Guarantees */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: LT.bgCard,
            border: `1px solid ${LT.border}`,
            borderRadius: R.card,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            justifyContent: 'space-around',
            fontFamily: F.body,
            fontSize: 13,
            color: LT.textMute,
          }}
        >
          <a
            href="/guarantee"
            style={{ color: LT.textMute, textDecoration: 'none', transition: 'color 150ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = LT.cobalt; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = LT.textMute; }}
          >
            30-day money-back guarantee →
          </a>
          <span>Cancel anytime from your settings</span>
          <span>Prices locked for existing subscribers</span>
        </div>
      </div>
    </Section>
  );
}
