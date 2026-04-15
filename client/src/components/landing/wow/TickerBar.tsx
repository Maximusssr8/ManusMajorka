// Directive 4 — Bloomberg-style live ticker bar.
// - 32px tall, black bg, gold border-bottom
// - Marquee of live product name + price + 24h orders
// - Data from /api/products/todays-picks (polled every 15s)
// - Hover pauses; clicks open the public quick-score with that item preselected
// - prefers-reduced-motion: static grid of first 6 items

import { useEffect, useMemo, useRef, useState } from 'react';
import { LT, F } from '@/lib/landingTokens';
import { usePrefersReducedMotion } from '../primitives';

interface TickerItem {
  id: string;
  title: string;
  price: number;
  orders: number;
  url: string | null;
}

async function fetchPicks(): Promise<TickerItem[]> {
  try {
    const r = await fetch('/api/products/todays-picks?limit=20', { credentials: 'omit' });
    if (!r.ok) return [];
    const j = await r.json();
    const picks = Array.isArray(j.picks) ? j.picks : [];
    return picks.map((p: Record<string, unknown>) => ({
      id: String(p.id ?? ''),
      title: String(p.product_title ?? '').slice(0, 64),
      price: Number(p.price_aud ?? 0),
      orders: Number(p.sold_count ?? 0),
      url: typeof p.aliexpress_url === 'string' ? p.aliexpress_url : null,
    })).filter((x: TickerItem) => x.title);
  } catch {
    return [];
  }
}

function formatOrders(n: number): string {
  if (n > 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n > 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatAge(seconds: number): string {
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function TickerBar({ onSelect }: { onSelect?: (url: string) => void }) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const i = await fetchPicks();
      if (alive) {
        setItems(i);
        if (i.length > 0) setLastUpdated(Date.now());
      }
    };
    run();
    const id = window.setInterval(run, 15000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  // 1Hz tick to keep "updated Xs ago" fresh.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ageLabel = lastUpdated
    ? formatAge(Math.floor((Date.now() - lastUpdated) / 1000))
    : null;
  void tick; // tick triggers re-render so ageLabel recomputes

  const doubled = useMemo(() => [...items, ...items], [items]);

  const liveBadge = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 10px',
        height: 22,
        background: 'rgba(212,175,55,0.18)',
        border: `1px solid ${LT.gold}`,
        borderRadius: 4,
        fontFamily: F.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: LT.gold,
        textTransform: 'uppercase',
        flex: '0 0 auto',
        marginRight: 12,
      }}
      title={ageLabel ? `Live ticker — updated ${ageLabel}` : 'Live ticker'}
    >
      <span style={{
        width: 6, height: 6, borderRadius: 100, background: LT.gold,
        animation: reduced ? undefined : 'mjTickerDot 1.4s ease-in-out infinite',
      }} />
      LIVE
      {ageLabel && (
        <span style={{
          marginLeft: 4, color: LT.textMute, fontWeight: 500, letterSpacing: '0.04em',
        }}>· {ageLabel}</span>
      )}
    </div>
  );

  if (items.length === 0) {
    return (
      <div style={tickerWrap}>
        <div style={inner}>
          {liveBadge}
          <div style={{ color: LT.textMute, fontFamily: F.mono, fontSize: 11 }}>
            Connecting to live product feed…
          </div>
        </div>
        <style>{`
          @keyframes mjTickerDot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  if (reduced) {
    return (
      <div style={tickerWrap}>
        <div style={{ ...inner, display: 'flex', gap: 24, overflow: 'hidden' }}>
          {liveBadge}
          {items.slice(0, 6).map((it) => (
            <Pill key={it.id} item={it} onSelect={onSelect} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={tickerWrap}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={`Live product ticker, updated ${ageLabel ?? 'just now'}`}
    >
      <div style={inner}>
        {liveBadge}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              gap: 40,
              whiteSpace: 'nowrap',
              animation: `mjTickerMarquee 90s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
              willChange: 'transform',
            }}
          >
            {doubled.map((it, i) => (
              <Pill key={`${it.id}-${i}`} item={it} onSelect={onSelect} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes mjTickerMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes mjTickerDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function Pill({ item, onSelect }: { item: TickerItem; onSelect?: (url: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => { if (item.url && onSelect) onSelect(item.url); }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'transparent',
        border: 'none',
        color: LT.text,
        fontFamily: F.mono,
        fontSize: 11,
        letterSpacing: '0.04em',
        cursor: item.url ? 'pointer' : 'default',
        padding: 0,
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: 100, background: LT.gold,
        animation: 'mjTickerDot 2s ease-in-out infinite',
        flex: '0 0 auto',
      }} />
      <span style={{ color: LT.text }}>{item.title}</span>
      <span style={{ color: LT.gold }}>AUD ${item.price.toFixed(2)}</span>
      <span style={{ color: LT.textMute }}>+{formatOrders(item.orders)} orders</span>
    </button>
  );
}

const tickerWrap: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 60,
  height: 32,
  background: '#0a0a0a',
  borderBottom: `1px solid ${LT.gold}`,
  overflow: 'hidden',
  width: '100%',
};

const inner: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  overflow: 'hidden',
};

export default TickerBar;
