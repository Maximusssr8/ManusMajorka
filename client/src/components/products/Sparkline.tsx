/**
 * Products/Sparkline — inline SVG sparkline tuned for the product detail
 * drawer. Renders a 7/30/90-day real series from /api/products/:id/history
 * when a productId is supplied, with a 5-minute in-memory cache so moving
 * between tabs within the drawer is instant. Falls back to the
 * interpolated `data` prop (two-point series) with a "First snapshot
 * pending" hint when the history table has <2 rows — keeps the chart
 * useful during the warmup period after the migration ships.
 */
import { memo, useEffect, useRef, useState } from 'react';

interface SparklineProps {
  /** Fallback series when history isn't loaded / has <2 points. */
  data: ReadonlyArray<number>;
  /** When set the component self-fetches /api/products/:id/history. */
  productId?: string | number;
  /** Range in days for the fetched history. */
  range?: 7 | 30 | 90;
  width?: number;
  height?: number;
  color?: string;
  /** Shown when data is empty or flat. */
  emptyLabel?: string;
}

interface HistoryPoint {
  ts: string;
  sold_count: number;
  score: number;
  velocity_7d: number;
}

interface HistoryResponse {
  series: HistoryPoint[];
  range: number;
  tableReady?: boolean;
}

interface CacheEntry {
  series: HistoryPoint[];
  ts: number;
}

const HISTORY_CACHE = new Map<string, CacheEntry>();
const HISTORY_TTL_MS = 5 * 60 * 1000;

function cacheKey(id: string, range: number): string {
  return `${id}:${range}`;
}

function SparklineImpl({
  data,
  productId,
  range = 30,
  width = 320,
  height = 64,
  color = '#d4af37',
  emptyLabel = 'Insufficient historical data',
}: SparklineProps) {
  const [remoteSeries, setRemoteSeries] = useState<number[] | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    if (productId === undefined || productId === null || productId === '') {
      setRemoteSeries(null);
      setPending(false);
      return;
    }
    const id = String(productId);
    const key = cacheKey(id, range);
    lastKeyRef.current = key;

    const hit = HISTORY_CACHE.get(key);
    if (hit && Date.now() - hit.ts < HISTORY_TTL_MS) {
      if (hit.series.length >= 2) {
        setRemoteSeries(hit.series.map((p) => Number(p.sold_count) || 0));
        setPending(false);
      } else {
        setRemoteSeries(null);
        setPending(true);
      }
      return;
    }

    let cancelled = false;
    setPending(true);
    (async () => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(id)}/history?range=${range}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as HistoryResponse;
        if (cancelled || lastKeyRef.current !== key) return;
        const series = Array.isArray(json.series) ? json.series : [];
        HISTORY_CACHE.set(key, { series, ts: Date.now() });
        if (series.length >= 2) {
          setRemoteSeries(series.map((p) => Number(p.sold_count) || 0));
          setPending(false);
        } else {
          setRemoteSeries(null);
          setPending(true);
        }
      } catch {
        if (cancelled) return;
        // Silent fallback — the `data` prop will render the 2-point line.
        setRemoteSeries(null);
        setPending(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, range]);

  const source = remoteSeries ?? data;
  const safe = Array.isArray(source) ? source.filter((n) => Number.isFinite(n)) : [];
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

  // When we have only the interpolated fallback (no remote series yet),
  // overlay a subtle "First snapshot pending" hint in the corner so
  // operators know the chart will sharpen up after the cron runs.
  const usingFallback = remoteSeries === null && pending && productId !== undefined;

  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const spread = max - min || 1;
  const gradId = `mj-spark-${Math.abs((safe[0] + safe.length) | 0)}`;

  const points = safe
    .map((val, i) => {
      const x = (i / (safe.length - 1)) * width;
      const y = height - ((val - min) / spread) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const last = safe[safe.length - 1];
  const lastY = height - ((last - min) / spread) * (height - 6) - 3;

  return (
    <div style={{ position: 'relative', width, height }}>
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
      {usingFallback ? (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 9,
            color: '#737373',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          First snapshot pending
        </span>
      ) : null}
    </div>
  );
}

export const Sparkline = memo(SparklineImpl);
export default Sparkline;
