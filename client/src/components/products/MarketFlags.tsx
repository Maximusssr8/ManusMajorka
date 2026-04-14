/**
 * MarketFlags — compact AU/US/UK ships-to indicator strip.
 *
 * Pure presentation. Reads three boolean columns off the product row
 * (ships_to_au / ships_to_us / ships_to_uk) when a `product` prop is
 * passed; otherwise accepts an explicit `active` list (used by legacy
 * call-sites). Only renders flags that are true. If the caller supplies
 * neither (all three columns absent) we show all three — matches the
 * DB default where columns default to true until the pipeline computes
 * real values.
 */
import { memo } from 'react';

export type MarketCode = 'AU' | 'US' | 'UK';

interface MarketSource {
  ships_to_au?: boolean | null;
  ships_to_us?: boolean | null;
  ships_to_uk?: boolean | null;
}

const ALL_MARKETS: ReadonlyArray<{ code: MarketCode; flag: string; label: string }> = [
  { code: 'AU', flag: 'AU', label: 'Australia' },
  { code: 'US', flag: 'US', label: 'United States' },
  { code: 'UK', flag: 'UK', label: 'United Kingdom' },
];

interface MarketFlagsProps {
  /** Explicit active list — takes precedence over `product`. */
  active?: ReadonlyArray<MarketCode>;
  /** Source row with boolean ships_to_* columns. */
  product?: MarketSource | null;
  size?: 'sm' | 'md';
}

function resolveActive(props: MarketFlagsProps): ReadonlyArray<MarketCode> {
  if (props.active && props.active.length > 0) return props.active;
  const p = props.product;
  if (p) {
    const au = p.ships_to_au;
    const us = p.ships_to_us;
    const uk = p.ships_to_uk;
    // If every column is null/undefined treat it as "unknown — show all"
    // so pre-migration rows don't render as an empty strip.
    const anyKnown =
      (au !== null && au !== undefined) ||
      (us !== null && us !== undefined) ||
      (uk !== null && uk !== undefined);
    if (!anyKnown) return ['AU', 'US', 'UK'];
    const out: MarketCode[] = [];
    if (au === true) out.push('AU');
    if (us === true) out.push('US');
    if (uk === true) out.push('UK');
    return out;
  }
  return ['AU', 'US', 'UK'];
}

function MarketFlagsImpl(props: MarketFlagsProps) {
  const { size = 'sm' } = props;
  const active = resolveActive(props);
  if (active.length === 0) return null;
  const activeSet = new Set<MarketCode>(active);
  const fs = size === 'md' ? 11 : 10;

  return (
    <div style={{ display: 'inline-flex', gap: 4 }} aria-label="Ships to markets">
      {ALL_MARKETS.filter((m) => activeSet.has(m.code)).map((m) => (
        <span
          key={m.code}
          title={`${m.label} — ships`}
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
            color: '#e5e5e5',
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 4,
          }}
        >
          {m.flag}
        </span>
      ))}
    </div>
  );
}

export const MarketFlags = memo(MarketFlagsImpl);
export default MarketFlags;
