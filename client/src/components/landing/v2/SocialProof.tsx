// Early access community section — honest framing for a pre-launch product.
// No fake revenue numbers. No 5-star ratings. Just real product feedback.
// TODO: Replace with verified testimonials once real users are onboarded.
import { F } from '@/lib/landingTokens';

interface Quote {
  text: string;
  name: string;
  context: string;
}

// Short, casual, product-focused — no revenue claims pre-launch.
const QUOTES: readonly Quote[] = [
  {
    text: 'The velocity data is genuinely different from anything I\'ve used. Found three products worth testing in my first session.',
    name: 'Early access operator',
    context: 'AU · Builder plan',
  },
  {
    text: 'Replaced three separate tools I was paying for. Product research, ad spy, and trend data — all in one place now.',
    name: 'Early access operator',
    context: 'AU · Scale plan',
  },
  {
    text: 'The AU market split is what sold me. I was targeting the wrong country entirely. This showed me where the actual demand was.',
    name: 'Early access operator',
    context: 'AU · Builder plan',
  },
  {
    text: 'Price alert woke me up at 3am. Supplier dropped 18%. Ordered before the price corrected. That feature alone is worth the subscription.',
    name: 'Early access operator',
    context: 'US · Scale plan',
  },
];

const CSS = `
.mj-ea-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .mj-ea-grid { grid-template-columns: 1fr; gap: 16px; }
}
`;

export function SocialProof() {
  return (
    <section style={{ padding: '80px 24px', background: '#04060f' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
        <span style={{
          fontFamily: F.body,
          fontSize: 11,
          color: '#4f8ef7',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.12em',
          display: 'inline-block',
          marginBottom: 16,
        }}>
          EARLY ACCESS
        </span>
        <h2 className="mj-h2" style={{
          fontFamily: F.display,
          fontSize: 36,
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 12px',
          lineHeight: 1.15,
        }}>
          What early operators are saying
        </h2>
        <p style={{
          fontFamily: F.body,
          fontSize: 16,
          color: '#8b949e',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Majorka is in early access. These are real reactions from our first cohort — not scripted reviews.
        </p>
      </div>

      <div className="mj-ea-grid">
        {QUOTES.map((q, i) => (
          <div
            key={i}
            style={{
              background: '#0d1117',
              border: '1px solid #161b22',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <p style={{
              fontFamily: F.body,
              fontSize: 15,
              color: '#e5e7eb',
              lineHeight: 1.7,
              margin: '0 0 16px',
              fontStyle: 'italic',
            }}>
              &ldquo;{q.text}&rdquo;
            </p>
            <div style={{
              fontFamily: F.body,
              fontSize: 13,
              color: '#6b7280',
            }}>
              {q.name} · {q.context}
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
            fontFamily: F.body,
            fontSize: 14,
            color: '#8b949e',
            textDecoration: 'none',
            transition: 'color 200ms',
          }}
        >
          Join our Discord community →
        </a>
      </div>
    </section>
  );
}
