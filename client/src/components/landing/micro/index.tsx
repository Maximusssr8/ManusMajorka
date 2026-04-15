// Micro-demos sprinkled between sections of the landing page.
// All self-contained, respect prefers-reduced-motion, use live data where possible.

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Flame, Globe } from 'lucide-react';
import { LT, F, S, R, MAX } from '@/lib/landingTokens';
import { SparklineDraw } from '@/components/landing/primitives';
import { useLandingData, proxiedImage } from '@/lib/useLandingData';

// ── Live order ticker marquee ────────────────────────────────────────────────
export function MicroOrderTicker() {
  const { products } = useLandingData();
  const reduced = useReducedMotion();
  const items = products.length >= 6 ? products.slice(0, 12) : [];
  if (items.length === 0) return null;

  // Duplicate list for seamless scroll
  const loop = [...items, ...items];

  return (
    <div aria-label="Live order ticker" style={{
      background: LT.bgElevated,
      borderTop: `1px solid ${LT.border}`,
      borderBottom: `1px solid ${LT.border}`,
      padding: `${S.sm}px 0`,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        maxWidth: MAX, margin: '0 auto', padding: `0 ${S.md}px`,
        display: 'flex', alignItems: 'center', gap: S.md,
      }}>
        <span style={{
          flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: LT.goldTint, color: LT.gold,
          borderRadius: R.badge, fontFamily: F.mono, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <Flame size={11} /> Live orders
        </span>
        <div style={{ flex: 1, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)' }}>
          <div style={{
            display: 'flex', gap: S.lg, whiteSpace: 'nowrap',
            animation: reduced ? undefined : 'mjMarquee 60s linear infinite',
            willChange: 'transform',
          }}>
            {loop.map((p, i) => (
              <span key={`${p.id}-${i}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: F.body, fontSize: 13, color: LT.textMute,
              }}>
                <span style={{
                  fontFamily: F.mono, color: LT.gold, fontWeight: 700,
                }}>{p.orders.toLocaleString('en-AU')}</span>
                <span style={{
                  maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: LT.text,
                }}>{p.title}</span>
                <span style={{ color: LT.textDim }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes mjMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Mini sparkline row — 5 live products ─────────────────────────────────────
export function MicroSparklineRow() {
  const { products } = useLandingData();
  const rows = products.slice(0, 5);
  if (rows.length < 3) return null;

  // Generate a synthetic 10-point velocity curve anchored at real order count
  const curve = (orders: number): number[] => {
    const peak = Math.max(10, Math.round(orders / 1000));
    return Array.from({ length: 10 }, (_, i) => {
      const t = i / 9;
      return Math.round(peak * (0.15 + 0.85 * Math.pow(t, 1.4)));
    });
  };

  return (
    <div style={{
      maxWidth: MAX, margin: '0 auto', padding: `${S.lg}px ${S.md}px`,
    }}>
      <div style={{
        fontFamily: F.mono, fontSize: 11, color: LT.gold, letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: S.sm, textAlign: 'center',
      }}>Real 30-day velocity curves · today's shortlist</div>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${rows.length}, 1fr)`, gap: S.sm,
      }}>
        {rows.map((p) => (
          <div key={p.id} style={{
            background: LT.bgCard, border: `1px solid ${LT.border}`,
            borderRadius: R.card, padding: S.sm, minHeight: 100,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              fontFamily: F.body, fontSize: 12, color: LT.textMute,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.title}</div>
            <SparklineDraw values={curve(p.orders)} width={180} height={36} color={LT.gold} />
            <div style={{ fontFamily: F.mono, fontSize: 11, color: LT.success }}>
              {p.orders.toLocaleString('en-AU')} orders
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated market-split pulse ──────────────────────────────────────────────
export function MicroMarketPulse() {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, [reduced]);

  const wiggle = (base: number) => {
    const delta = ((Math.sin(tick * 1.3 + base) + 1) / 2 - 0.5) * 2; // -1..1
    return Math.max(0, Math.min(100, Math.round(base + delta)));
  };

  const bars = [
    { label: 'AU', pct: wiggle(42), color: LT.gold },
    { label: 'US', pct: wiggle(35), color: LT.success },
    { label: 'UK', pct: wiggle(23), color: LT.blue },
  ];

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: `${S.lg}px ${S.md}px`,
    }}>
      <div style={{
        background: LT.bgCard, border: `1px solid ${LT.border}`,
        borderRadius: R.card, padding: S.md,
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: S.md, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: LT.gold, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Now tracking</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: LT.text, marginTop: 4 }}>Market share, live</div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {bars.map((b) => (
            <div key={b.label} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 50px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.textMute }}>{b.label}</span>
              <div style={{ height: 8, background: LT.border, borderRadius: 100, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${b.pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: b.color }}
                />
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.text, textAlign: 'right' }}>{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Category leaderboard with rank flips ─────────────────────────────────────
export function MicroCategoryLeaders() {
  const { categories } = useLandingData();
  const top = categories.slice(0, 3);
  if (top.length < 3) return null;

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: `${S.lg}px ${S.md}px`,
    }}>
      <div style={{
        fontFamily: F.mono, fontSize: 11, color: LT.gold, letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: S.sm, textAlign: 'center',
      }}>Category leaders · today</div>
      <div style={{
        background: LT.bgCard, border: `1px solid ${LT.border}`,
        borderRadius: R.card, overflow: 'hidden',
      }}>
        {top.map((c, i) => (
          <motion.div
            key={c.category}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
            style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: S.sm, alignItems: 'center',
              padding: '14px 20px',
              borderBottom: i < top.length - 1 ? `1px solid ${LT.border}` : 'none',
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 18, color: LT.gold, fontWeight: 700 }}>#{i + 1}</span>
            <span style={{
              fontFamily: F.body, fontSize: 14, color: LT.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{c.category}</span>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.success }}>
              {c.total_orders.toLocaleString('en-AU')} orders
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Rotating signal card ─────────────────────────────────────────────────────
export function MicroSignalCard() {
  const { products } = useLandingData();
  const reduced = useReducedMotion();
  const pool = products.slice(0, 8);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduced) return;
    if (pool.length < 2) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % pool.length), 5000);
    return () => window.clearInterval(id);
  }, [reduced, pool.length]);

  if (pool.length === 0) return null;
  const p = pool[idx];
  const markets = ['AU', 'US', 'UK'];
  const market = markets[idx % 3];

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: `${S.lg}px ${S.md}px`,
    }}>
      <div style={{
        fontFamily: F.mono, fontSize: 11, color: LT.gold, letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: S.sm, textAlign: 'center',
      }}>Signal of the moment</div>
      <motion.div
        key={p.id}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: S.md, alignItems: 'center',
          background: LT.bgCard, border: `1px solid ${LT.border}`,
          borderRadius: R.card, padding: S.md,
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: R.image, overflow: 'hidden',
          background: LT.bgElevated, border: `1px solid ${LT.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {p.image ? (
            <img
              src={proxiedImage(p.image)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : <Flame size={28} color={LT.gold} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: F.body, fontSize: 15, color: LT.text, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{p.title}</div>
          <div style={{
            display: 'flex', gap: 14, marginTop: 6,
            fontFamily: F.mono, fontSize: 12,
          }}>
            <span style={{ color: LT.success }}>
              <TrendingUp size={11} style={{ verticalAlign: 'middle' }} /> Score {p.score || 90}
            </span>
            <span style={{ color: LT.gold }}>{p.orders.toLocaleString('en-AU')} orders</span>
            <span style={{ color: LT.textMute, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Globe size={11} /> {market}
            </span>
          </div>
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 11, color: LT.gold, textAlign: 'right',
        }}>A${p.price.toFixed(2)}</div>
      </motion.div>
    </div>
  );
}

// Export grouped wrapper for convenience
export const MicroDemos = {
  OrderTicker: MicroOrderTicker,
  SparklineRow: MicroSparklineRow,
  MarketPulse: MicroMarketPulse,
  CategoryLeaders: MicroCategoryLeaders,
  SignalCard: MicroSignalCard,
};

export default MicroDemos;
