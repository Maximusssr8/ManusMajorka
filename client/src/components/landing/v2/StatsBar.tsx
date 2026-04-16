// Stats Bar v2 — Academy-style: monospace labels, Syne values, cobalt accent cards.
import { F } from '@/lib/landingTokens';

const STATS: Array<{ value: string; label: string }> = [
  { value: '50M+', label: 'Products Sourced' },
  { value: 'Live', label: 'AliExpress Data' },
  { value: '6hr', label: 'Data Refresh' },
  { value: 'AU \u00B7 US \u00B7 UK', label: 'Markets' },
];

export function StatsBar() {
  return (
    <section
      aria-label="Platform stats"
      style={{
        background: '#0d1117',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        width: '100%',
      }}
    >
      <div
        className="mj-stats-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          maxWidth: 1152,
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            className="mj-stats-cell"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '20px 16px',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              textAlign: 'center',
            }}
          >
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: '#4f8ef7',
              whiteSpace: 'nowrap',
            }}>
              {s.value}
            </span>
            <span style={{
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#6B7280',
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
