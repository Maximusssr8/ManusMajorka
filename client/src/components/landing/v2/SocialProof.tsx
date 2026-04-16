// Social Proof v2 — auto-scrolling 2-row testimonial ticker.
import { LT, F } from '@/lib/landingTokens';

const TICKER_CSS = `
@keyframes mjTickerL {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes mjTickerR {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
.mj-ticker-row:hover .mj-ticker-track { animation-play-state: paused; }
@media (max-width: 768px) {
  .mj-ticker-track-l { animation-duration: 80s !important; }
  .mj-ticker-track-r { animation-duration: 70s !important; }
}
@media (prefers-reduced-motion: reduce) {
  .mj-ticker-track { animation: none !important; }
}
`;

const AVATAR_COLORS = [
  'rgba(79,142,247,0.12)',
  'rgba(124,58,237,0.12)',
  'rgba(5,158,96,0.12)',
];

// TODO: Replace placeholder testimonials before launch
const TESTIMONIALS = [
  { quote: 'Went from 0 to $31k/mo in 60 days. Majorka found the product.', name: 'Jake M.', city: 'Brisbane', revenue: '$31k/mo' },
  { quote: 'Every tool I tried gave me saturated products. Majorka gives me velocity data. Different game.', name: 'Sarah L.', city: 'Sydney', revenue: '$18k/mo' },
  { quote: 'Cancelled three other research tools. One subscription now.', name: 'Ravi T.', city: 'Melbourne', revenue: '$24k/mo' },
  { quote: 'The AU warehouse filter is genuinely our edge vs US competitors.', name: 'Connor R.', city: 'Brisbane', revenue: '$9k/mo' },
  { quote: 'Price alert at 3am caught a supplier drop. Ordered 200 units before it restocked.', name: 'Aisha B.', city: 'New York', revenue: '$52k/mo' },
  { quote: 'Ad brief generator cut my copywriting time from 3 hours to 15 minutes.', name: 'Jordan T.', city: 'London', revenue: '$14k/mo' },
  { quote: "I don't look at AliExpress anymore. Majorka does that for me.", name: 'Marcus W.', city: 'Auckland', revenue: '$7k/mo' },
  { quote: 'Store builder gave me a Shopify concept I actually launched. First sale in 48h.', name: 'Priya M.', city: 'Perth', revenue: '$5k/mo' },
  { quote: "Data refreshes every 6 hours. By the time competitors see a trend, I'm already running ads.", name: 'Tom K.', city: 'Gold Coast', revenue: '$38k/mo' },
  { quote: "Maya AI answered a supplier question better than any forum I've tried.", name: 'Lena S.', city: 'Manchester', revenue: '$11k/mo' },
];

const ROW1 = TESTIMONIALS.slice(0, 5);
const ROW2 = TESTIMONIALS.slice(5, 10);

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
  index: number;
}

function TestimonialCard({ quote, name, city, revenue, index }: TestimonialCardProps) {
  const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className="mj-testimonial-card"
      style={{
        width: 320,
        flexShrink: 0,
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        transition: 'border-color 200ms ease',
      }}
    >
      {/* Top: avatar + stars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.body,
            fontSize: 14,
            fontWeight: 700,
            color: LT.cobalt,
            flexShrink: 0,
          }}
        >
          {getInitials(name)}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ color: LT.cobalt, fontSize: 14 }}>&#9733;</span>
          ))}
        </div>
      </div>
      {/* Quote */}
      <p style={{
        fontFamily: F.body,
        fontSize: 15,
        fontWeight: 400,
        color: LT.text,
        lineHeight: 1.6,
        margin: '0 0 12px',
      }}>
        {quote}
      </p>
      {/* Attribution */}
      <div style={{
        fontFamily: F.body,
        fontSize: 13,
        color: '#6b7280',
      }}>
        {name} &middot; {city} &middot; Revenue: {revenue}
      </div>
    </div>
  );
}

function TickerRow({
  items,
  direction,
  duration,
}: {
  items: typeof ROW1;
  direction: 'left' | 'right';
  duration: number;
}) {
  const animClass = direction === 'left' ? 'mj-ticker-track-l' : 'mj-ticker-track-r';
  const animName = direction === 'left' ? 'mjTickerL' : 'mjTickerR';
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className="mj-ticker-row"
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, #04060f, transparent 8%, transparent 92%, #04060f)',
        WebkitMaskImage: 'linear-gradient(to right, #04060f, transparent 8%, transparent 92%, #04060f)',
      }}
    >
      <div
        className={`mj-ticker-track ${animClass}`}
        style={{
          display: 'flex',
          gap: 20,
          width: 'max-content',
          animation: `${animName} ${duration}s linear infinite`,
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard
            key={`${t.name}-${i}`}
            quote={t.quote}
            name={t.name}
            city={t.city}
            revenue={t.revenue}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

export function SocialProof() {
  return (
    <section
      id="social-proof"
      style={{
        padding: '96px 0',
        overflow: 'hidden',
      }}
    >
      <style>{TICKER_CSS}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto', padding: '0 24px', marginBottom: 48 }}>
        <div style={{
          fontFamily: F.body,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: LT.cobalt,
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
          color: LT.textMute,
          margin: 0,
        }}>
          287 early access members &middot; $0 &rarr; $52k/mo stories &middot; 3 countries
        </p>
      </div>

      {/* Ticker rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <TickerRow items={ROW1} direction="left" duration={40} />
        <TickerRow items={ROW2} direction="right" duration={35} />
      </div>
    </section>
  );
}
