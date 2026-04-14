import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'wouter';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';

const GOLD = '#d4af37';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

interface DemoProduct {
  id: string;
  title: string;
  imageUrl?: string;
  orders: number;
  score: number;
  trendUp: boolean;
}

const FALLBACK: readonly DemoProduct[] = [
  { id: '1', title: 'Magnetic Posture Corrector', orders: 12847, score: 94, trendUp: true },
  { id: '2', title: 'Portable Neck Massager Pro', orders: 8921, score: 88, trendUp: true },
  { id: '3', title: 'LED Sunset Projector Lamp', orders: 7412, score: 82, trendUp: true },
  { id: '4', title: 'Smart Pet Water Fountain', orders: 5628, score: 79, trendUp: false },
  { id: '5', title: 'Collapsible Resistance Bands Kit', orders: 4205, score: 76, trendUp: true },
];

function scoreColor(s: number): string {
  if (s >= 90) return '#10b981';
  if (s >= 75) return '#f59e0b';
  return '#f97316';
}

export function LiveDemo(): ReactElement {
  const reduced = useReducedMotion() ?? false;
  const [products, setProducts] = useState<readonly DemoProduct[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/api/products?limit=5&orderBy=orders', {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json: unknown = await res.json();
        if (cancelled) return;

        const rows: unknown = (json as { data?: unknown; products?: unknown }).data ?? (json as { products?: unknown }).products ?? json;
        if (!Array.isArray(rows)) return;

        const mapped: DemoProduct[] = rows
          .slice(0, 5)
          .map((r: unknown, idx: number): DemoProduct | null => {
            if (typeof r !== 'object' || r === null) return null;
            const o = r as Record<string, unknown>;
            const title = typeof o.product_title === 'string' ? o.product_title : typeof o.title === 'string' ? o.title : '';
            if (!title) return null;
            const orders = typeof o.sold_count === 'number' ? o.sold_count : typeof o.orders === 'number' ? o.orders : 0;
            const score = typeof o.winning_score === 'number' ? Math.round(o.winning_score) : 80;
            const imageUrl = typeof o.image_url === 'string' ? o.image_url : undefined;
            return { id: String(o.id ?? idx), title, orders, score, trendUp: idx % 4 !== 3, imageUrl };
          })
          .filter((x): x is DemoProduct => x !== null);

        if (mapped.length >= 3) setProducts(mapped);
      } catch {
        /* silent — keep fallback */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: GOLD, letterSpacing: '0.12em', marginBottom: 10 }}>
          LIVE DEMO
        </div>
        <h2
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 'clamp(28px,4.5vw,42px)',
            color: '#ededed',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Top movers right now.
        </h2>
      </div>

      <motion.div
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '64px 1fr 100px 80px 72px',
            gap: 12,
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontFamily: mono,
            fontSize: 10,
            color: '#52525b',
            letterSpacing: '0.1em',
          }}
        >
          <span></span>
          <span>PRODUCT</span>
          <span style={{ textAlign: 'right' }}>ORDERS</span>
          <span style={{ textAlign: 'center' }}>TREND</span>
          <span style={{ textAlign: 'right' }}>SCORE</span>
        </div>

        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr 100px 80px 72px',
              gap: 12,
              padding: '14px 20px',
              alignItems: 'center',
              borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#1a1a1f,#2a2a30)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                fontSize: 9,
                color: '#52525b',
              }}
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt=""
                  loading="lazy"
                  width={48}
                  height={48}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                'IMG'
              )}
            </div>
            <div style={{ fontFamily: sans, fontSize: 14, color: '#ededed', minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, color: '#ededed', textAlign: 'right' }}>
              <NumberTicker end={p.orders} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {p.trendUp ? (
                <TrendingUp size={16} color="#22c55e" strokeWidth={2.2} />
              ) : (
                <TrendingDown size={16} color="#ef4444" strokeWidth={2.2} />
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: `${scoreColor(p.score)}22`,
                  color: scoreColor(p.score),
                }}
              >
                {p.score}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link
          href="/sign-up"
          style={{
            fontFamily: sans,
            fontSize: 14,
            color: GOLD,
            textDecoration: 'none',
            borderBottom: `1px solid ${GOLD}`,
            paddingBottom: 2,
          }}
        >
          See all 3,715 products →
        </Link>
      </div>
    </section>
  );
}
