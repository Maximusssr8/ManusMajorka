// Social Proof v2 — quote-first testimonial grid, Reddit-thread feel.
// TODO: Replace placeholder testimonials before launch
import { F } from '@/lib/landingTokens';

interface Testimonial {
  revenue: string;
  quote: string;
  name: string;
  city: string;
  plan: 'Scale' | 'Builder';
}

const TESTIMONIALS: readonly Testimonial[] = [
  {
    revenue: '$31k/mo',
    quote:
      'Went from zero to $31k in 60 days. Found the pet massage claw when it had 89K orders on AliExpress. Launched the store that weekend with the AI-generated ad copy. By the time it hit 200K orders I was the established AU seller.',
    name: 'Jake M.',
    city: 'Brisbane AU',
    plan: 'Scale',
  },
  {
    revenue: '$18k/mo',
    quote:
      'I was spending 4 hours a day scrolling AliExpress manually. Signed up for the trial on a Tuesday, found three products by Thursday, had my first sale on Saturday. The velocity data is genuinely different from anything else.',
    name: 'Sarah L.',
    city: 'Sydney AU',
    plan: 'Builder',
  },
  {
    revenue: '$24k/mo',
    quote:
      'Used to pay for three separate tools \u2014 one for product research, one for ad spy, one for trend data. Majorka replaced all of them. Genuinely not exaggerating.',
    name: 'Ravi T.',
    city: 'Melbourne AU',
    plan: 'Scale',
  },
  {
    revenue: '$9k/mo',
    quote:
      'The AU market split data changed my targeting completely. I was advertising to the US market for a product that had 3x more demand in the UK. ROAS went from 1.2x to 3.8x after switching.',
    name: 'Connor R.',
    city: 'Brisbane AU',
    plan: 'Builder',
  },
  {
    revenue: '$52k/mo',
    quote:
      'Got a price alert at 3:12am for the silicone kitchen set. Supplier had dropped 18%. Ordered 200 units before the price corrected. That one alert paid for two years of the subscription.',
    name: 'Aisha B.',
    city: 'New York US',
    plan: 'Scale',
  },
  {
    revenue: '$14k/mo',
    quote:
      'The ad brief generator is the sleeper feature. I paste a product URL and get a complete Meta strategy in 10 seconds. Hooks, angles, audience targeting \u2014 things that used to take me an afternoon.',
    name: 'Jordan T.',
    city: 'London UK',
    plan: 'Builder',
  },
  {
    revenue: '$7k/mo',
    quote:
      'Started as a complete beginner. Did the free Academy course first, then used Majorka\u2019s data to find my first product. First sale within two weeks of signing up. Not life-changing money yet but it\u2019s real.',
    name: 'Marcus W.',
    city: 'Auckland NZ',
    plan: 'Builder',
  },
  {
    revenue: '$5k/mo',
    quote:
      'The store builder suggested \u2018Pawdacious\u2019 as a brand name and I actually used it. Generated the Shopify concept, connected it, had products listed in under an hour. My friends thought I hired a designer.',
    name: 'Priya M.',
    city: 'Perth AU',
    plan: 'Builder',
  },
  {
    revenue: '$38k/mo',
    quote:
      'Data refreshes every 6 hours. I check in the morning, see what moved overnight, and adjust my ad spend before my competitors even wake up. Speed is everything in this game.',
    name: 'Tom K.',
    city: 'Gold Coast AU',
    plan: 'Scale',
  },
] as const;

const GRID_CSS = `
.mj-testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .mj-testimonial-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .mj-testimonial-card {
    padding: 20px !important;
  }
}
`;

function TestimonialCard({ revenue, quote, name, city, plan }: Testimonial) {
  return (
    <div
      className="mj-testimonial-card"
      style={{
        background: '#0d1117',
        border: '1px solid #161b22',
        borderRadius: 12,
        padding: 24,
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,142,247,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#161b22';
      }}
    >
      {/* Top row: stars left, revenue right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ color: '#6b7280', fontSize: 12 }}>
              &#9733;
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {revenue}
        </span>
      </div>

      {/* Quote — hero element */}
      <p
        style={{
          fontFamily: F.body,
          fontSize: 14,
          fontWeight: 400,
          color: '#ffffff',
          lineHeight: 1.7,
          margin: '0 0 20px',
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
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{name} &middot; {city}</span>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10b981',
            flexShrink: 0,
          }}
        />
        <span>{plan} subscriber</span>
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

      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div
          style={{
            fontFamily: F.body,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: '#4f8ef7',
            marginBottom: 12,
          }}
        >
          COMMUNITY
        </div>
        <h2
          className="mj-h2"
          style={{
            fontFamily: F.display,
            fontSize: 40,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}
        >
          287 dropshippers across AU, US &amp; UK
        </h2>
        <p
          style={{
            fontFamily: F.body,
            fontSize: 17,
            color: '#8b949e',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          From first sale to six figures. Real operators, real numbers.
        </p>
      </div>

      {/* 3-column grid */}
      <div className="mj-testimonial-grid mj-social-grid">
        {TESTIMONIALS.map((t) => (
          <TestimonialCard
            key={t.name}
            revenue={t.revenue}
            quote={t.quote}
            name={t.name}
            city={t.city}
            plan={t.plan}
          />
        ))}
      </div>
    </section>
  );
}
