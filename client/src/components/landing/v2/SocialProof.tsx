// Social Proof v2 — static 3-column grid, no ticker/animation.
import { LT, F } from '@/lib/landingTokens';

// TODO: Replace placeholder testimonials before launch
const TESTIMONIALS = [
  { quote: 'Went from $0 to $31k/mo in 60 days.', name: 'Jake M.', city: 'Brisbane AU', revenue: '$31k/mo' },
  { quote: 'Every other tool gave me saturated products. This gives me velocity.', name: 'Sarah L.', city: 'Sydney AU', revenue: '$18k/mo' },
  { quote: 'Cancelled three other research tools. One subscription.', name: 'Ravi T.', city: 'Melbourne AU', revenue: '$24k/mo' },
  { quote: 'AU market data is deeper than anything else I\u2019ve tried.', name: 'Connor R.', city: 'Brisbane AU', revenue: '$9k/mo' },
  { quote: 'Price alert caught a supplier drop at 3am. Ordered 200 units.', name: 'Aisha B.', city: 'New York US', revenue: '$52k/mo' },
  { quote: 'Ad brief generator cut my copywriting from 3 hours to 15 minutes.', name: 'Jordan T.', city: 'London UK', revenue: '$14k/mo' },
  { quote: 'I don\u2019t check AliExpress anymore. This does it for me.', name: 'Marcus W.', city: 'Auckland NZ', revenue: '$7k/mo' },
  { quote: 'Store builder gave me a Shopify concept I actually launched.', name: 'Priya M.', city: 'Perth AU', revenue: '$5k/mo' },
  { quote: 'Data refreshes every 6 hours. I\u2019m always ahead.', name: 'Tom K.', city: 'Gold Coast AU', revenue: '$38k/mo' },
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface TestimonialCardProps {
  quote: string;
  name: string;
  city: string;
  revenue: string;
}

function TestimonialCard({ quote, name, city, revenue }: TestimonialCardProps) {
  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderLeft: '3px solid #4f8ef7',
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Avatar + stars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(79,142,247,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.body,
            fontSize: 14,
            fontWeight: 700,
            color: '#4f8ef7',
            flexShrink: 0,
          }}
        >
          {getInitials(name)}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ color: '#4f8ef7', fontSize: 14 }}>&#9733;</span>
          ))}
        </div>
      </div>
      {/* Quote */}
      <p style={{
        fontFamily: F.body,
        fontSize: 15,
        fontWeight: 400,
        color: '#ffffff',
        lineHeight: 1.6,
        margin: '0 0 12px',
      }}>
        {quote}
      </p>
      {/* Attribution */}
      <div style={{
        fontFamily: F.body,
        fontSize: 13,
        color: '#8b949e',
      }}>
        {name} &middot; {city} &middot; {revenue}
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

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto', marginBottom: 48 }}>
        <div style={{
          fontFamily: F.body,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4f8ef7',
          marginBottom: 16,
        }}>
          TESTIMONIALS
        </div>
        <h2
          className="mj-h2"
          style={{
            fontFamily: F.display,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: LT.text,
            margin: '0 0 12px',
          }}
        >
          Trusted by dropshippers across AU, US &amp; UK
        </h2>
        <p style={{
          fontFamily: F.body,
          fontSize: 15,
          lineHeight: 1.6,
          color: '#8b949e',
          margin: 0,
        }}>
          287 early access members &middot; $0 &rarr; $52k/mo stories &middot; 3 countries
        </p>
      </div>

      {/* 3-column grid */}
      <div className="mj-testimonial-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {TESTIMONIALS.map((t) => (
          <TestimonialCard
            key={t.name}
            quote={t.quote}
            name={t.name}
            city={t.city}
            revenue={t.revenue}
          />
        ))}
      </div>
    </section>
  );
}
