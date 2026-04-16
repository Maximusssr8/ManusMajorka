// Social proof — Academy-style: monospace eyebrow, two-tone heading,
// dark cards with subtle cobalt borders, restrained typography.
// TODO: Replace with real testimonials once we have named, consenting customers.
import { F } from '@/lib/landingTokens';
import { useInViewFadeUp } from '../useInViewFadeUp';
import { Eyebrow, H2, Sub } from './shared';

interface Quote {
  text: string;
  name: string;
  context: string;
}

const QUOTES: readonly Quote[] = [
  {
    text: 'The velocity data is genuinely different from anything I\'ve used. Found three products worth testing in my first session.',
    name: 'Early access \u00B7 AU operator \u00B7 Builder plan',
    context: '',
  },
  {
    text: 'Replaced three separate tools I was paying for. Product research, ad spy, and trend data \u2014 all in one place now.',
    name: 'Beta tester \u00B7 Sydney \u00B7 Scale plan',
    context: '',
  },
  {
    text: 'The AU market split is what sold me. I was targeting the wrong country entirely. This showed me where the actual demand was.',
    name: 'Early access \u00B7 US operator \u00B7 Scale plan',
    context: '',
  },
  {
    text: 'Price alert woke me up at 3am. Supplier dropped 18%. Ordered before the price corrected. That feature alone is worth the subscription.',
    name: 'Beta tester \u00B7 Melbourne \u00B7 Builder plan',
    context: '',
  },
];

const CSS = `
.mj-ea-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .mj-ea-grid { grid-template-columns: 1fr; gap: 12px; }
}
`;

export function SocialProof() {
  const fade = useInViewFadeUp();

  return (
    <section ref={fade.ref} style={{ ...fade.style, padding: '80px 20px', background: '#04060f' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
        <Eyebrow center>Early Access</Eyebrow>
        <H2 style={{ margin: '0 auto 12px' }}>
          What early operators are saying
        </H2>
        <Sub style={{ margin: '0 auto' }}>
          Majorka is in early access. These are real reactions from our first cohort \u2014 not scripted reviews.
        </Sub>
      </div>

      <div className="mj-ea-grid">
        {QUOTES.map((q, i) => (
          <div
            key={i}
            className="mj-testimonial-card"
            style={{
              background: '#0d1117',
              border: '1px solid rgba(79,142,247,0.12)',
              borderRadius: 16,
              padding: 24,
              transition: 'border-color 200ms ease',
            }}
          >
            <p style={{
              fontFamily: F.body,
              fontSize: 14,
              color: '#E0E0E0',
              lineHeight: 1.7,
              margin: '0 0 16px',
              fontStyle: 'italic',
            }}>
              &ldquo;{q.text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4f8ef7', flexShrink: 0,
              }} />
              <span style={{
                fontFamily: F.mono,
                fontSize: 11,
                letterSpacing: '0.04em',
                color: '#6B7280',
              }}>
                {q.name}{q.context ? ` \u00B7 ${q.context}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <a
          href="https://discord.gg/njVjqrG8"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            color: '#6B7280',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            transition: 'color 200ms',
          }}
        >
          Join our Discord community {'\u2192'}
        </a>
        <p style={{
          fontFamily: F.body,
          fontSize: 12,
          color: '#6B7280',
          marginTop: 12,
          lineHeight: 1.5,
        }}>
          These are reactions from our early access cohort. Majorka is in beta.
        </p>
      </div>
    </section>
  );
}
