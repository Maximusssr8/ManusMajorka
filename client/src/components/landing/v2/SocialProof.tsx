// Social Proof v2 — 3-column testimonial grid.
import { Star } from 'lucide-react';
import { LT, F, R } from '@/lib/landingTokens';
import { EyebrowPill, H2, Sub, Section, CtaGhost } from './shared';
import { useInViewFadeUp } from '@/components/landing/useInViewFadeUp';

// TODO: Replace placeholder testimonials before launch
const TESTIMONIALS = [
  { quote: 'Found a $47k/month product in week one.', name: 'Liam K.', location: 'Sydney' },
  { quote: 'Cancelled 3 tools after signing up.', name: 'Priya M.', location: 'Melbourne' },
  { quote: 'The ad brief alone saves me 4 hours a week.', name: 'Jordan T.', location: 'London' },
  { quote: 'AU market data is way deeper than the big players.', name: 'Connor R.', location: 'Brisbane' },
  { quote: 'Price alert caught a supplier drop at 3am.', name: 'Aisha B.', location: 'New York' },
  { quote: 'Finally built for Aussie dropshippers.', name: 'Ben W.', location: 'Gold Coast' },
] as const;

function Stars5() {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={15} fill={LT.cobalt} color={LT.cobalt} />
      ))}
    </div>
  );
}

function TestimonialCard({ quote, name, location }: { quote: string; name: string; location: string }) {
  return (
    <div
      className="mj-testimonial-card"
      style={{
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderLeft: `3px solid ${LT.cobalt}`,
        borderRadius: 14,
        padding: 32,
        transition: 'border-color 200ms ease',
      }}
    >
      <Stars5 />
      <p style={{
        fontFamily: F.body,
        fontSize: 17,
        fontWeight: 400,
        color: LT.text,
        lineHeight: 1.6,
        margin: '16px 0 20px',
      }}>
        {quote}
      </p>
      <div style={{
        fontFamily: F.body,
        fontSize: 13,
        fontWeight: 500,
        color: LT.textMute,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {name}, {location}
      </div>
    </div>
  );
}

export function SocialProof() {
  const fadeUp = useInViewFadeUp();

  return (
    <Section id="social-proof">
      <div ref={fadeUp.ref} style={{ ...fadeUp.style }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <EyebrowPill>Testimonials</EyebrowPill>
          </div>
          <H2 style={{ margin: '0 auto' }}>Trusted by dropshippers across AU, US, UK.</H2>
          <Sub style={{ margin: '12px auto 0' }}>287 early access members. 4.9 ★ average rating.</Sub>
        </div>

        <div style={{
          fontFamily: F.body,
          fontSize: 14,
          color: LT.textMute,
          textAlign: 'center',
          marginBottom: 32,
        }}>
          4.9 ★ average rating · 287 early access members · 3 countries
        </div>

        <div
          className="mj-social-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 24,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} quote={t.quote} name={t.name} location={t.location} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <CtaGhost href="/pricing">Join them →</CtaGhost>
        </div>
      </div>
    </Section>
  );
}
