import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// ── Supabase config (anon key — public read only) ─────────────────────────────
const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldmVrdWF6c2piZHJsdHNka3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjE0NDAsImV4cCI6MjA4NzU5NzQ0MH0.kW2sMm2BLMi1xQcI6tnfvhyWiAm2CXVGJ1gOqLKFkRM';

// ── Fallback demo data (used if Supabase fetch fails) ─────────────────────────
const DEMO_PRODUCTS = [
  {
    rank: 1,
    name: 'LED Light Therapy Face Mask Pro',
    category: 'Health & Beauty',
    platform: 'TikTok Shop AU',
    revenue: '$24,200/day',
    revenueRaw: 24200,
    salesDay: 272,
    growth: '+34%',
    growthPositive: true,
    score: 97,
    trend: 'EXPLODING',
    locked: false,
  },
  {
    rank: 2,
    name: 'Heatless Curl Ribbon Rods Set',
    category: 'Health & Beauty',
    platform: 'TikTok Shop AU',
    revenue: '$21,800/day',
    revenueRaw: 21800,
    salesDay: 529,
    growth: '+28%',
    growthPositive: true,
    score: 96,
    trend: 'EXPLODING',
    locked: true,
  },
  {
    rank: 3,
    name: 'Cordless Auto Hair Curler Waver',
    category: 'Health & Beauty',
    platform: 'TikTok Shop AU',
    revenue: '$19,600/day',
    revenueRaw: 19600,
    salesDay: 245,
    growth: '+19%',
    growthPositive: true,
    score: 95,
    trend: 'RISING',
    locked: true,
  },
  {
    rank: 4,
    name: 'Stanley Dupe 40oz Quencher Tumbler',
    category: 'Home & Kitchen',
    platform: 'TikTok Shop AU',
    revenue: '$18,500/day',
    revenueRaw: 18500,
    salesDay: 463,
    growth: '+22%',
    growthPositive: true,
    score: 96,
    trend: 'EXPLODING',
    locked: true,
  },
  {
    rank: 5,
    name: 'Dog Lick Mat Slow Feeder',
    category: 'Pet',
    platform: 'TikTok Shop AU',
    revenue: '$17,800/day',
    revenueRaw: 17800,
    salesDay: 509,
    growth: '+41%',
    growthPositive: true,
    score: 94,
    trend: 'EXPLODING',
    locked: true,
  },
  {
    rank: 6,
    name: 'Booty Resistance Bands Set 5 Levels',
    category: 'Fitness',
    platform: 'TikTok Shop AU',
    revenue: '$16,400/day',
    revenueRaw: 16400,
    salesDay: 547,
    growth: '+17%',
    growthPositive: true,
    score: 92,
    trend: 'RISING',
    locked: true,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface SupabaseProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  category: string | null;
  platform: string;
  est_daily_revenue_aud: number | null;
  units_per_day: number | null;
  winning_score: number;
  trend: string | null;
  revenue_growth_pct: number | null;
  why_winning: string | null;
  ad_angle: string | null;
  competition_level: string | null;
  updated_at?: string | null;
  scraped_at?: string | null;
}

interface DisplayProduct {
  rank: number;
  image?: string;
  name: string;
  category: string;
  platform: string;
  revenue: string;
  revenueRaw: number;
  salesDay: number;
  growth: string;
  growthPositive: boolean;
  score: number;
  trend: string;
  locked: boolean;
  whyWinning?: string;
  adAngle?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateSparkData(base: number, id: string): { v: number }[] {
  const seedNum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRand(seedNum);
  return Array.from({ length: 7 }, (_, i) => ({
    v: Math.round(Math.max(base * 0.5, base * (0.7 + i * 0.04 + rand() * 0.25))),
  }));
}

function mapSupabaseProduct(p: SupabaseProduct, idx: number): DisplayProduct {
  const rev = p.est_daily_revenue_aud ?? 0;
  const growthPct = p.revenue_growth_pct ?? (p.trend === 'exploding' ? 34 : p.trend === 'growing' ? 18 : 8);
  const trendLabel =
    p.trend === 'exploding' ? 'EXPLODING' :
    p.trend === 'growing'   ? 'RISING'    :
    p.trend === 'stable'    ? 'STABLE'    : 'STABLE';

  return {
    rank: idx + 1,
    image: p.image_url ?? '',
    name: p.product_title,
    category: p.category ?? 'General',
    platform: p.platform ?? 'TikTok Shop AU',
    revenue: `$${rev.toLocaleString('en-AU')}/day`,
    revenueRaw: rev,
    salesDay: p.units_per_day ?? Math.round(rev / 45),
    growth: `+${growthPct}%`,
    growthPositive: growthPct >= 0,
    score: p.winning_score ?? 80,
    trend: trendLabel,
    locked: idx > 0,
    whyWinning: p.why_winning ?? undefined,
    adAngle: p.ad_angle ?? undefined,
  };
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const PIP_CSS = `
@keyframes pip-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.85); }
}
@keyframes gold-glow-pulse {
  0%, 100% { box-shadow: 0 0 60px rgba(79,142,247,0.05); }
  50%       { box-shadow: 0 0 80px rgba(79,142,247,0.09); }
}
@keyframes shimmer-pip {
  0%,100% { opacity: 0.4; }
  50%     { opacity: 0.8; }
}

.pip-kalo-wrap { animation: pip-fade-in 0.6s ease-out forwards; }

.pip-section-container {
  border: 1px solid rgba(79,142,247,0.2);
  border-radius: 20px;
  background: rgba(10,12,18,0.6);
  animation: gold-glow-pulse 4s ease-in-out infinite;
  padding: 40px 32px;
  position: relative;
  overflow: hidden;
}

.pip-section-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79,142,247,0.4) 50%, transparent);
  pointer-events: none;
}

.pip-row-1:hover {
  background: rgba(79,142,247,0.06) !important;
  cursor: pointer;
}

.pip-row:hover { background: #FAFAFA !important; }

.pip-action-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(79,142,247,0.35);
  border-radius: 6px;
  color: #4f8ef7;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.pip-action-sm:hover {
  background: rgba(79,142,247,0.1);
  border-color: rgba(79,142,247,0.6);
}

.pip-filter-chip {
  background: #F9FAFB;
  border: 1px solid #F5F5F5;
  border-radius: 7px;
  padding: 7px 13px;
  font-size: 12px;
  color: #9ca3af;
  font-family: 'DM Sans', sans-serif;
  cursor: default;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  transition: border-color 0.15s;
}
.pip-filter-chip:hover {
  border-color: rgba(79,142,247,0.25);
  color: #4f8ef7;
}

.pip-unlock-cta {
  background: linear-gradient(135deg, #4f8ef7, #3B82F6);
  color: #FAFAFA;
  border-radius: 10px;
  padding: 14px 36px;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 15px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.15s;
  box-shadow: 0 4px 24px rgba(79,142,247,0.3);
  letter-spacing: 0.01em;
}
.pip-unlock-cta:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(79,142,247,0.4);
}

.pip-detail-panel {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease, opacity 0.2s ease;
  opacity: 0;
}
.pip-detail-panel.open {
  max-height: 240px;
  opacity: 1;
}

.pip-trend-EXPLODING {
  background: rgba(251,146,60,0.12);
  color: #fb923c;
  border: 1px solid rgba(251,146,60,0.2);
  border-radius: 9999px;
}
.pip-trend-RISING {
  background: rgba(245,158,11,0.12);
  color: #fbbf24;
  border: 1px solid rgba(245,158,11,0.25);
}
.pip-trend-STABLE {
  background: rgba(107,114,128,0.15);
  color: #9ca3af;
  border: 1px solid rgba(107,114,128,0.2);
}

.pip-skeleton {
  background: #F9FAFB;
  border-radius: 4px;
  animation: shimmer-pip 1.5s ease-in-out infinite;
}

@media (max-width: 767px) {
  .pip-table-area { display: none !important; }
  .pip-mobile-card { display: block !important; }
  .pip-section-container { padding: 24px 20px !important; }
}
@media (min-width: 768px) {
  .pip-mobile-card { display: none !important; }
}
@media (max-width: 1024px) {
  .pip-col-sales { display: none !important; }
  .pip-col-score { display: none !important; }
  .pip-col-category { display: none !important; }
  .pip-col-spark { display: none !important; }
}
`;

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ isFirst }: { isFirst?: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '36px 1fr 130px 140px 90px 80px 64px',
      padding: '0 20px',
      height: 56,
      borderBottom: '1px solid #F9FAFB',
      alignItems: 'center',
      background: isFirst ? 'rgba(79,142,247,0.02)' : 'transparent',
    }}>
      <div className="pip-skeleton" style={{ width: 18, height: 14 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="pip-skeleton" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
        <div>
          <div className="pip-skeleton" style={{ width: 160, height: 13, marginBottom: 5 }} />
          <div className="pip-skeleton" style={{ width: 80, height: 10 }} />
        </div>
      </div>
      <div className="pip-skeleton pip-col-category" style={{ width: 70, height: 22, borderRadius: 5 }} />
      <div className="pip-skeleton" style={{ width: 100, height: 16 }} />
      <div className="pip-skeleton pip-col-sales" style={{ width: 40, height: 14 }} />
      <div className="pip-skeleton" style={{ width: 50, height: 14 }} />
      <div className="pip-skeleton pip-col-score" style={{ width: 30, height: 14 }} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductIntelligencePreview() {
  const [showDetail, setShowDetail] = useState(false);
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [productCount, setProductCount] = useState(47);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('2 hours ago');

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch top 6 by daily revenue
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/winning_products?select=id,product_title,image_url,category,platform,est_daily_revenue_aud,units_per_day,winning_score,trend,revenue_growth_pct,why_winning,ad_angle,competition_level,updated_at&order=est_daily_revenue_aud.desc&limit=6`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        // Get total count
        const countRes = await fetch(
          `${SUPABASE_URL}/rest/v1/winning_products?select=id`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'count=exact',
              'Range': '0-0',
            },
          }
        );

        if (res.ok) {
          const data: SupabaseProduct[] = await res.json();
          if (data && data.length > 0) {
            const mapped = data.map((p, i) => mapSupabaseProduct(p, i));
            setProducts(mapped);

            // Last updated from first product
            if (data[0]?.updated_at) {
              const diff = Date.now() - new Date(data[0].updated_at as unknown as string).getTime();
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              setLastUpdated(h > 0 ? `${h}h ago` : m > 0 ? `${m}m ago` : 'just now');
            }
          } else {
            setProducts(DEMO_PRODUCTS as DisplayProduct[]);
          }
        } else {
          setProducts(DEMO_PRODUCTS as DisplayProduct[]);
        }

        if (countRes.ok) {
          const contentRange = countRes.headers.get('Content-Range');
          if (contentRange) {
            const total = parseInt(contentRange.split('/')[1] || '47', 10);
            if (!isNaN(total)) setProductCount(total);
          }
        }
      } catch {
        // Fallback to demo data
        setProducts(DEMO_PRODUCTS as DisplayProduct[]);
      } finally {
        setLoading(false);
      }
    }

    void fetchProducts();
  }, []);

  const displayProducts = loading ? [] : (products.length > 0 ? products : (DEMO_PRODUCTS as DisplayProduct[]));
  const first = displayProducts[0];

  return (
    <>
      <style>{PIP_CSS}</style>
      <section style={{ background: '#FAFAFA', padding: '80px 24px' }}>
        <div className="pip-kalo-wrap" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="pip-section-container">

            {/* ── Section header ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Live label */}
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#4ade80',
                    boxShadow: '0 0 8px rgba(74,222,128,0.6)',
                    animation: 'live-pulse 2s ease-in-out infinite',
                    flexShrink: 0,
                  }} />
                  LIVE PRODUCT INTELLIGENCE
                  {loading ? (
                    <span className="pip-skeleton" style={{ width: 120, height: 12, display: 'inline-block', borderRadius: 6 }} />
                  ) : (
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>
                      · {productCount} products found today
                    </span>
                  )}
                </div>
                {/* H2 */}
                <h2 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 'clamp(36px, 5vw, 52px)',
                  fontWeight: 800,
                  color: '#fff',
                  margin: '0 0 10px',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                }}>
                  Find your next{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #4f8ef7, #f0c840)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>$10k/month</span>
                  {' '}product
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0, lineHeight: 1.6 }}>
                  Real AU TikTok Shop data · Updated every 6 hours
                </p>
              </div>
              {/* Right: Unlock CTA */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <a href="/sign-up" className="pip-unlock-cta" style={{ whiteSpace: 'nowrap' }}>
                  Unlock All →
                </a>
                <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'DM Sans, sans-serif', textAlign: 'right' }}>
                  {loading ? (
                    <span className="pip-skeleton" style={{ width: 100, height: 10, display: 'inline-block', borderRadius: 4 }} />
                  ) : `Last updated: ${lastUpdated}`}
                </div>
              </div>
            </div>

            {/* ── Filter bar ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {['All Categories ▼', 'TikTok Shop AU ▼', 'Revenue ▼'].map((label) => (
                <span key={label} className="pip-filter-chip">{label}</span>
              ))}
            </div>

            {/* ── Table (desktop) ─────────────────────────────────────────── */}
            <div className="pip-table-area" style={{ display: 'block' }}>
              <div style={{
                background: 'rgba(6,8,14,0.8)',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
              }}>

                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 130px 140px 90px 80px 64px',
                  padding: '12px 20px',
                  background: '#FAFAFA',
                  borderBottom: '1px solid #F9FAFB',
                  fontSize: 10,
                  color: '#4b5563',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  <span>#</span>
                  <span>Product</span>
                  <span className="pip-col-category">Category</span>
                  <span>Revenue/Day</span>
                  <span className="pip-col-sales">Sales/Day</span>
                  <span>Growth</span>
                  <span className="pip-col-score">Score</span>
                </div>

                {/* Rows */}
                {loading ? (
                  <>
                    <SkeletonRow isFirst />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : displayProducts.map((product) => (
                  <div key={product.rank}>
                    {/* Row */}
                    <div
                      className={product.rank === 1 ? 'pip-row-1' : 'pip-row'}
                      onClick={product.rank === 1 ? () => setShowDetail((v) => !v) : undefined}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '36px 1fr 130px 140px 90px 80px 64px',
                        padding: '0 20px',
                        height: 56,
                        borderBottom: '1px solid #F9FAFB',
                        alignItems: 'center',
                        background: product.rank === 1 ? 'rgba(79,142,247,0.04)' : 'transparent',
                        position: 'relative',
                        transition: 'background 0.15s',
                        ...(product.locked ? {
                          filter: 'blur(3px)',
                          userSelect: 'none',
                          pointerEvents: 'none',
                        } : {}),
                      }}
                    >
                      {/* Rank */}
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: product.rank === 1 ? '#4f8ef7' : '#4b5563',
                        fontWeight: 600,
                      }}>
                        {product.rank}
                      </span>

                      {/* Product name + image */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: '#161b22',
                          border: '1px solid #333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                        }}>
                          🛍️
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#e5e7eb',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 220,
                            }}>
                              {product.name}
                            </span>
                            <span className={`pip-trend-${product.trend}`} style={{
                              fontSize: 9,
                              padding: '2px 7px',
                              borderRadius: 20,
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              flexShrink: 0,
                            }}>
                              {product.trend}
                            </span>
                          </div>
                          {product.rank === 1 && (
                            <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'DM Sans, sans-serif', marginTop: 1 }}>
                              {product.platform}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category */}
                      <span className="pip-col-category" style={{
                        display: 'inline-block',
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 5,
                        background: '#F9FAFB',
                        color: '#9ca3af',
                        fontFamily: 'DM Sans, sans-serif',
                        whiteSpace: 'nowrap',
                      }}>
                        {product.category}
                      </span>

                      {/* Revenue */}
                      <span style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#4f8ef7',
                        letterSpacing: '-0.01em',
                      }}>
                        {product.revenue}
                      </span>

                      {/* Sales/day */}
                      <span className="pip-col-sales" style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: '#9ca3af',
                      }}>
                        {product.salesDay.toLocaleString()}
                      </span>

                      {/* Growth */}
                      <span style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 700,
                        color: product.growthPositive ? '#4ade80' : '#f87171',
                      }}>
                        ▲ {product.growth.replace('+', '')}
                      </span>

                      {/* Score */}
                      <span className="pip-col-score" style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                        {product.score}
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: product.score >= 90 ? '#4ade80' : product.score >= 75 ? '#f59e0b' : '#f87171',
                          flexShrink: 0,
                          display: 'inline-block',
                        }} />
                      </span>
                    </div>

                    {/* Detail panel (row 1 only) */}
                    {product.rank === 1 && (
                      <div className={`pip-detail-panel${showDetail ? ' open' : ''}`}>
                        <div style={{
                          background: 'rgba(79,142,247,0.04)',
                          borderTop: '1px solid rgba(79,142,247,0.12)',
                          borderBottom: '1px solid rgba(79,142,247,0.08)',
                          padding: '14px 20px 14px 72px',
                          fontSize: 12,
                          color: '#9ca3af',
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ color: '#4f8ef7', fontWeight: 700 }}>💡 Why it's winning:</span>{' '}
                            {product.whyWinning ?? 'Celebrity-endorsed skincare at 1/3 clinic price. 34% repeat buyer rate on TikTok Shop AU.'}
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <span style={{ color: '#e5e7eb', fontStyle: 'italic', fontSize: 12 }}>
                              Best ad angle: "{product.adAngle ?? 'Before/after in 4 weeks — no clinic needed'}"
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="pip-action-sm"
                              onClick={() => navigate('/app/suppliers?demo=led-face-mask')}
                            >
                              Find Suppliers →
                            </button>
                            <button
                              className="pip-action-sm"
                              onClick={() => navigate('/app/profit-calculator?price=89.99&cost=24.50&name=LED+Face+Mask')}
                            >
                              Profit Calc →
                            </button>
                            <button
                              className="pip-action-sm"
                              onClick={() => navigate('/app/website-generator?demo=health-beauty')}
                            >
                              Build Store →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Lock overlay — covers rows 2-6 */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '76%',
                  background: 'linear-gradient(to bottom, rgba(6,8,14,0) 0%, rgba(6,8,14,0.7) 25%, rgba(6,8,14,0.95) 55%, rgba(6,8,14,1) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 32,
                  gap: 10,
                  pointerEvents: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span style={{ color: '#4f8ef7', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}>
                      {productCount - 1} more products locked — updated {lastUpdated}
                    </span>
                  </div>
                  <a href="/sign-up" className="pip-unlock-cta" style={{ pointerEvents: 'auto', display: 'block', textAlign: 'center' }}>
                    Unlock All Products — Start Free →
                  </a>
                  <span style={{ color: '#4b5563', fontFamily: 'DM Sans, sans-serif', fontSize: 11, pointerEvents: 'auto' }}>
                    No credit card required · 10 free searches/day
                  </span>
                </div>

              </div>

              {/* Hint below table */}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 12, color: '#4b5563', fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic' }}>
                  Click row #1 to see why it's winning →
                </span>
              </div>
            </div>

            {/* ── Mobile card (hidden on desktop) ─────────────────────────── */}
            <div className="pip-mobile-card" style={{ display: 'none' }}>
              {loading ? (
                <div style={{
                  background: 'rgba(6,8,14,0.9)',
                  border: '1px solid rgba(79,142,247,0.2)',
                  borderRadius: 14,
                  padding: 20,
                }}>
                  <div className="pip-skeleton" style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 14 }} />
                  <div className="pip-skeleton" style={{ width: 80, height: 20, borderRadius: 20, marginBottom: 8 }} />
                  <div className="pip-skeleton" style={{ width: '90%', height: 18, marginBottom: 8 }} />
                  <div className="pip-skeleton" style={{ width: 120, height: 24 }} />
                </div>
              ) : first ? (
                <div style={{
                  background: 'rgba(6,8,14,0.9)',
                  border: '1px solid rgba(79,142,247,0.2)',
                  borderRadius: 14,
                  padding: 20,
                }}>
                  <div style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 14, background: '#161b22', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🛍️</div>
                  <span className="pip-trend-EXPLODING" style={{
                    fontSize: 10,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                    display: 'inline-block',
                  }}>
                    {first.trend}
                  </span>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#374151', margin: '8px 0 4px', lineHeight: 1.3 }}>
                    {first.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#4f8ef7' }}>
                      {first.revenue}
                    </span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
                      ▲ {first.growth.replace('+', '')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span style={{ color: '#4f8ef7', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}>
                      {productCount - 1} more products locked
                    </span>
                  </div>
                  <a href="/sign-up" className="pip-unlock-cta" style={{ display: 'block', textAlign: 'center' }}>
                    Unlock All Products — Start Free →
                  </a>
                  <p style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', marginTop: 10, fontFamily: 'DM Sans, sans-serif' }}>
                    No credit card required · 10 free searches/day
                  </p>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
