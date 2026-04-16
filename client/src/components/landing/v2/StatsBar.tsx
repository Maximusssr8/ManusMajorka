// Stats Bar v2 — edge-to-edge row of 4 metrics.
import { LT, F } from '@/lib/landingTokens';

const STATS: Array<{ value: string; label: string }> = [
  { value: '50M+', label: 'Products Sourced' },
  { value: 'Live', label: 'AliExpress Data' },
  { value: '6hr', label: 'Data Refresh' },
  { value: 'AU · US · UK', label: 'Markets' },
];

export function StatsBar() {
  return (
    <section
      aria-label="Platform stats"
      style={{
        background: LT.bgCard,
        borderTop: `1px solid ${LT.border}`,
        borderBottom: `1px solid ${LT.border}`,
        width: '100%',
      }}
    >
      <div
        className="mj-stats-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          minHeight: 60,
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            className="mj-stats-cell"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '18px 16px',
              borderRight: i < STATS.length - 1 ? `1px solid ${LT.border}` : 'none',
              fontFamily: F.body,
              fontSize: 15,
              color: LT.textMute,
              textAlign: 'center',
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 15, color: LT.text, whiteSpace: 'nowrap' }}>
              {s.value}
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
