/**
 * TrendBadge — small pill showing a percent change (velocity_7d or a
 * computed orders-delta). Positive values render green, negative red,
 * zero/unknown muted. Number uses mono font class `mj-num`.
 */
import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  /** Percent change, e.g. 12.4 for +12.4%. null = unknown. */
  percent: number | null;
  /** Optional raw delta (orders/day). Shown after percent when provided. */
  suffix?: string;
  size?: 'sm' | 'md';
}

function TrendBadgeImpl({ percent, suffix, size = 'sm' }: TrendBadgeProps) {
  const unknown = percent === null || !Number.isFinite(percent);
  const up = !unknown && (percent as number) > 0;
  const down = !unknown && (percent as number) < 0;

  const color = unknown ? '#737373' : up ? '#10b981' : down ? '#ef4444' : '#a3a3a3';
  const bg = unknown
    ? 'rgba(255,255,255,0.03)'
    : up
      ? 'rgba(16,185,129,0.10)'
      : down
        ? 'rgba(239,68,68,0.10)'
        : 'rgba(255,255,255,0.04)';
  const border = unknown
    ? 'rgba(255,255,255,0.08)'
    : up
      ? 'rgba(16,185,129,0.25)'
      : down
        ? 'rgba(239,68,68,0.25)'
        : 'rgba(255,255,255,0.08)';

  const Icon = unknown ? Minus : up ? TrendingUp : down ? TrendingDown : Minus;
  const pct = unknown ? '—' : `${up ? '+' : ''}${(percent as number).toFixed(1)}%`;

  const fs = size === 'md' ? 12 : 11;
  const pad = size === 'md' ? '3px 8px' : '2px 6px';

  return (
    <span
      className="mj-num"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        whiteSpace: 'nowrap',
      }}
      title={unknown ? 'No velocity data yet' : `7-day velocity ${pct}`}
    >
      <Icon size={fs + 1} strokeWidth={2} />
      {pct}
      {suffix ? <span style={{ opacity: 0.7, marginLeft: 2 }}>{suffix}</span> : null}
    </span>
  );
}

export const TrendBadge = memo(TrendBadgeImpl);
export default TrendBadge;
