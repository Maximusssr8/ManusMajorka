/**
 * MarketFlags — compact AU/US/UK ships-to indicator strip.
 *
 * Pure presentation. Consumers pass the current `active` market(s) as an
 * array; unlisted flags render in a muted disabled state. Uses emoji flags
 * for zero-asset rendering, with a 44px parent tap target on the row.
 */
import { memo } from 'react';

export type MarketCode = 'AU' | 'US' | 'UK';

const ALL_MARKETS: ReadonlyArray<{ code: MarketCode; flag: string; label: string }> = [
  { code: 'AU', flag: 'AU', label: 'Australia' },
  { code: 'US', flag: 'US', label: 'United States' },
  { code: 'UK', flag: 'UK', label: 'United Kingdom' },
];

interface MarketFlagsProps {
  active?: ReadonlyArray<MarketCode>;
  size?: 'sm' | 'md';
}

function MarketFlagsImpl({ active, size = 'sm' }: MarketFlagsProps) {
  const activeSet = new Set<MarketCode>(active && active.length > 0 ? active : ['AU', 'US', 'UK']);
  const fs = size === 'md' ? 11 : 10;

  return (
    <div style={{ display: 'inline-flex', gap: 4 }} aria-label="Ships to markets">
      {ALL_MARKETS.map((m) => {
        const isActive = activeSet.has(m.code);
        return (
          <span
            key={m.code}
            title={`${m.label}${isActive ? ' — ships' : ' — unavailable'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 22,
              height: 18,
              padding: '0 5px',
              fontSize: fs,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: isActive ? '#e5e5e5' : '#525252',
              background: isActive ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isActive ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 4,
            }}
          >
            {m.flag}
          </span>
        );
      })}
    </div>
  );
}

export const MarketFlags = memo(MarketFlagsImpl);
export default MarketFlags;
