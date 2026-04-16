// MomentumTicker — Academy-style horizontal strip with live-looking metrics.
import { useEffect, useRef, useState } from 'react';
import { F } from '@/lib/landingTokens';
import { useInViewFadeUp } from '../useInViewFadeUp';

const TICKER_CSS = `
.mj-ticker-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
}
@media (max-width: 768px) {
  .mj-ticker-row { gap: 16px; }
  .mj-ticker-label { display: none !important; }
}
`;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function formatDollars(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

function formatPlus(n: number): string {
  return '+' + n.toLocaleString('en-US');
}

export function MomentumTicker() {
  const reducedMotion = useReducedMotion();

  const [revenue, setRevenue] = useState(84200);
  const [orders, setOrders] = useState(2847);
  const [discovered, setDiscovered] = useState(12);

  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    if (reducedMotion) return;

    fetch('/api/products/stats-overview')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.totalRevenue === 'number' && data.totalRevenue > 0) {
          setRevenue(Math.floor(data.totalRevenue));
        } else if (data && typeof data.count === 'number' && typeof data.avgPrice === 'number') {
          setRevenue(Math.floor(data.count * data.avgPrice * 0.1));
        }
      })
      .catch(() => { /* keep fallback */ });

    const i1 = setInterval(() => {
      setRevenue((prev) => prev + Math.floor(Math.random() * 41) + 10);
    }, 3000);

    const i2 = setInterval(() => {
      setOrders((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2000);

    const i3 = setInterval(() => {
      setDiscovered((prev) => prev + 1);
    }, 8000);

    intervalsRef.current = [i1, i2, i3];
    return () => intervalsRef.current.forEach(clearInterval);
  }, [reducedMotion]);

  const fade = useInViewFadeUp();

  return (
    <div
      ref={fade.ref}
      style={{
        ...fade.style,
        background: '#0a0d14',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style>{TICKER_CSS}</style>
      <div className="mj-ticker-row">
        <Metric value={formatDollars(revenue)} label="est. daily revenue on trending products" color="#10b981" />
        <Metric value={formatPlus(orders)} label="orders in last 24 hours" color="#4f8ef7" />
        <Metric value={String(discovered)} label="products discovered this hour" color="#f59e0b" />
      </div>
    </div>
  );
}

interface MetricProps {
  value: string;
  label: string;
  color: string;
}

function Metric({ value, label, color }: MetricProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 14,
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
      <span
        className="mj-ticker-label"
        style={{
          fontFamily: F.mono,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: '#6B7280',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}
