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

export function TickerBar({ onSelect }: { onSelect?: (url: string) => void }) {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const i = await fetchPicks();
      if (alive) setItems(i);
    };
    run();
    const id = window.setInterval(run, 15000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const doubled = useMemo(() => [...items, ...items], [items]);

  if (items.length === 0) {
    return (
      <div style={tickerWrap}>
        <div style={{ ...inner, color: LT.textMute, fontFamily: F.mono, fontSize: 11 }}>Loading live product ticker…</div>
      </div>
    );
  }

  if (reduced) {
    return (
      <div style={tickerWrap}>
        <div style={{ ...inner, display: 'grid', gridAutoFlow: 'column', gap: 24, overflow: 'hidden' }}>
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
      aria-label="Live product ticker"
    >
      <div style={inner}>
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
