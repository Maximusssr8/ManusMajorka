// Social Proof v2 — revenue-first testimonial grid.
// TODO: Replace placeholder testimonials before launch
import { LT, F } from '@/lib/landingTokens';

const TESTIMONIALS = [
  { revenue: '$31k/mo', quote: 'Went from $0 to $31k/mo in 60 days.', name: 'Jake M.', city: 'Brisbane AU' },
  { revenue: '$18k/mo', quote: 'Every other tool gave me saturated products.', name: 'Sarah L.', city: 'Sydney AU' },
  { revenue: '$24k/mo', quote: 'Cancelled three other research tools.', name: 'Ravi T.', city: 'Melbourne AU' },
  { revenue: '$9k/mo', quote: 'AU market data is deeper than anything else.', name: 'Connor R.', city: 'Brisbane AU' },
  { revenue: '$52k/mo', quote: 'Price alert caught a supplier drop at 3am.', name: 'Aisha B.', city: 'New York US' },
  { revenue: '$14k/mo', quote: 'Ad brief generator cut copywriting from 3 hours to 15 minutes.', name: 'Jordan T.', city: 'London UK' },
  { revenue: '$7k/mo', quote: "I don\u2019t check AliExpress anymore.", name: 'Marcus W.', city: 'Auckland NZ' },
  { revenue: '$5k/mo', quote: 'Store builder gave me a concept I actually launched.', name: 'Priya M.', city: 'Perth AU' },
  { revenue: '$38k/mo', quote: 'Data refreshes every 6 hours. I\u2019m always ahead.', name: 'Tom K.', city: 'Gold Coast AU' },
];

const GRID_CSS = `
.mj-testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 768px) {
  .mj-testimonial-grid {
    grid-template-columns: 1fr;
  }
}
`;

interface TestimonialCardProps {
  revenue: string;
  quote: string;
  name: string;
  city: string;
}

function TestimonialCard({ revenue, quote, name, city }: TestimonialCardProps) {
  return (
    <div
      className="mj-testimonial-card"
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderLeft: '3px solid #4f8ef7',
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Revenue — hero number */}
      <div
        style={{
          fontFamily: F.display,
          fontSize: 32,
          fontWeight: 700,
          color: '#4f8ef7',
          lineHeight: 1.1,
          marginBottom: 8,
        }}
      >
        {revenue}
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ color: '#4f8ef7', fontSize: 14 }}>&#9733;</span>
        ))}
      </div>

      {/* Quote */}
      <p
        style={{
          fontFamily: F.body,
          fontSize: 15,
          fontWeight: 400,
          color: '#ffffff',
          lineHeight: 1.6,
          margin: '0 0 16px',
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Attribution */}
      <div
        style={{
          fontFamily: F.body,
          fontSize: 13,
          color: '#6b7280',
        }}
      >
        {name} &middot; {city}
      </div>
    </div>
  );
}

export function SocialProof() {
  return (
    <section
      id="social-proof"
      style={{
        padding: '96px 24px',
      }}
    >
      <style>{GRID_CSS}</style>

      {/* Running total hero stat */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 48,
            fontWeight: 800,
            color: '#4f8ef7',
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          $2.4M+
        </div>
        <p
          style={{
            fontFamily: F.body,
            fontSize: 16,
            color: '#8b949e',
            margin: 0,
          }}
        >
          tracked monthly revenue across our community
        </p>
      </div>

      {/* 3-column grid */}
      <div className="mj-testimonial-grid mj-social-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {TESTIMONIALS.map((t) => (
          <TestimonialCard
            key={t.name}
            revenue={t.revenue}
            quote={t.quote}
            name={t.name}
            city={t.city}
          />
        ))}
      </div>
    </section>
  );
}
