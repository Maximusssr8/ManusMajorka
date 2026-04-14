/**
 * Products/Sparkline — inline SVG sparkline tuned for the product detail
 * drawer. Renders a 7/30/90-day series with a gold fill + line. When data
 * is insufficient (<2 points) we render a flat line and expose an
 * `emptyLabel` so the parent can contextualise it.
 */
import { memo } from 'react';

interface SparklineProps {
  data: ReadonlyArray<number>;
  width?: number;
  height?: number;
  color?: string;
  /** Shown when data is empty or flat. */
  emptyLabel?: string;
}

function SparklineImpl({
  data,
  width = 320,
  height = 64,
  color = '#d4af37',
  emptyLabel = 'Insufficient historical data',
}: SparklineProps) {
  const safe = Array.isArray(data) ? data.filter((n) => Number.isFinite(n)) : [];
  const hasData = safe.length >= 2;

  if (!hasData) {
    const mid = height / 2;
    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <svg width={width} height={height} role="img" aria-label={emptyLabel}>
          <line
            x1={0}
            x2={width}
            y1={mid}
            y2={mid}
            stroke="rgba(212,175,55,0.25)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 11,
            color: '#737373',
            letterSpacing: '0.01em',
          }}
        >
          {emptyLabel}
        </div>
      </div>
    );
  }

  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const range = max - min || 1;
  const gradId = `mj-spark-${Math.abs((safe[0] + safe.length) | 0)}`;

  const points = safe
    .map((val, i) => {
      const x = (i / (safe.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const last = safe[safe.length - 1];
  const lastY = height - ((last - min) / range) * (height - 6) - 3;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={lastY} r={3} fill={color} />
    </svg>
  );
}

export const Sparkline = memo(SparklineImpl);
export default Sparkline;
