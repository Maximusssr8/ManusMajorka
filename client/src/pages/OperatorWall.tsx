import { Link } from 'wouter';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Public /operators wall — a community-feel page showcasing early beta
 * users. Honest copy only: no fake revenue numbers, no stock photos,
 * feature-specific quotes. Static data for now.
 */

interface Operator {
  initials: string;
  name: string;
  flag: string;
  country: string;
  niche: string;
  quote: string;
  since: string;
}

const OPERATORS: Operator[] = [
  {
    initials: 'LK', name: 'Lena K.', flag: '🇦🇺', country: 'Australia', niche: 'Home & Garden',
    quote: "The 7-market coverage is the main reason I switched. No other tool shows me AU vs UK demand side by side.",
    since: 'March 2026',
  },
  {
    initials: 'MR', name: 'Marcus R.', flag: '🇬🇧', country: 'United Kingdom', niche: 'Tech',
    quote: "Found 3 products scoring 95+ in my first session. The filters are exactly what I needed — not 40 bloated toggles, just the ones that matter.",
    since: 'March 2026',
  },
  {
    initials: 'PS', name: 'Priya S.', flag: '🇸🇬', country: 'Singapore', niche: 'Beauty',
    quote: "Being able to see order velocity alongside the AI score changed how I evaluate products entirely. It's obvious which ones are actually scaling.",
    since: 'March 2026',
  },
  {
    initials: 'JT', name: 'James T.', flag: '🇦🇺', country: 'Australia', niche: 'Car Care',
    quote: "The product scoring system saved me hours of research every week. I stopped second-guessing which products to test.",
    since: 'March 2026',
  },
  {
    initials: 'SK', name: 'Sarah K.', flag: '🇬🇧', country: 'United Kingdom', niche: 'Pet',
    quote: "The store builder pushed a full Shopify setup in a few minutes. The AI-written copy is the part that surprised me most.",
    since: 'March 2026',
  },
  {
    initials: 'DC', name: 'David C.', flag: '🇺🇸', country: 'United States', niche: 'Fitness',
    quote: "I stopped using 3 other tools after a week on Majorka. Having product research, ad spy, and a margin calc in one place is the difference.",
    since: 'March 2026',
  },
];

const display = "'Bricolage Grotesque', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = 'monospace';

export default function OperatorWall() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f5f5f5',
      fontFamily: sans,
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: display,
          }}>M</div>
          <span style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em' }}>
            Majorka
          </span>
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#a1a1aa', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 96px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            fontSize: 11, fontFamily: mono, color: '#93C5FD',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 18,
          }}>Community</div>
          <h1 style={{
            fontFamily: display,
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 14px',
            lineHeight: 1.05,
          }}>
            Majorka Operators
          </h1>
          <p style={{ fontSize: 17, color: '#a1a1aa', margin: 0, lineHeight: 1.55 }}>
            Real operators. Real results. No fluff.
          </p>
        </div>

        {/* Aggregate stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 56,
        }}>
          {[
            { value: '2,302+', label: 'products in database' },
            { value: '7', label: 'markets covered' },
            { value: '210', label: 'categories tracked' },
          ].map((s) => (
            <div key={s.label} style={{
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: 24,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: display, fontSize: 36, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: '#71717a', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Operator cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {OPERATORS.map((op) => (
            <div key={op.name} style={{
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93C5FD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: display, fontWeight: 800, fontSize: 16, letterSpacing: '0.02em',
                  flexShrink: 0,
                }}>{op.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f5' }}>{op.name}</span>
                    <span style={{ fontSize: 13 }}>{op.flag}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{op.country}</div>
                </div>
              </div>

              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                padding: '4px 10px',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.18)',
                borderRadius: 999,
                fontSize: 10, fontFamily: mono, color: '#93C5FD',
                letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
              }}>{op.niche}</div>

              <p style={{
                fontFamily: display,
                fontSize: 15,
                lineHeight: 1.6,
                color: '#e5e7eb',
                margin: 0,
                letterSpacing: '-0.003em',
              }}>&ldquo;{op.quote}&rdquo;</p>

              <div style={{ marginTop: 'auto', fontFamily: mono, fontSize: 10, color: '#52525b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Beta member since {op.since}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 80,
          padding: 40,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.04))',
          border: '1px solid rgba(59,130,246,0.22)',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: display,
            fontSize: 28,
            fontWeight: 700,
            color: '#f5f5f5',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}>Become an operator</h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 24px' }}>
            Join early access and help shape the platform.
          </p>
          <Link href="/sign-up" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 26px',
            background: '#3B82F6',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 999,
            textDecoration: 'none',
          }}>Start free trial <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
