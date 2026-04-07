import { Link } from 'wouter';
import { Package, TrendingUp, Flame, BarChart3, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { SkeletonRow, Skeleton } from '@/components/app/SkeletonRow';
import { EmptyState } from '@/components/app/EmptyState';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

export default function AppDashboard() {
  const { user, isPro } = useAuth();
  const stats = useProductStats();
  const { products, loading: prodLoading } = useProducts({ limit: 8, orderBy: 'sold_count' });
  const planLabel = isPro ? 'SCALE' : 'BUILDER';
  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const kpiCards = [
    { label: 'PRODUCTS IN DB',     valueNode: stats.loading ? <Skeleton width={80} height={28} /> : formatNumber(stats.total),     sub: 'Live AliExpress data',     icon: Package },
    { label: 'HIGHEST ORDERS/MO',  valueNode: stats.loading ? <Skeleton width={80} height={28} /> : formatNumber(stats.maxOrders),  sub: 'Top product, all-time',    icon: TrendingUp },
    { label: 'AVG DROPSHIP SCORE', valueNode: stats.loading ? <Skeleton width={80} height={28} /> : `${stats.avgScore}/100`,        sub: 'Across active products',   icon: BarChart3 },
    { label: 'HOT PRODUCTS',       valueNode: stats.loading ? <Skeleton width={80} height={28} /> : formatNumber(stats.hotCount),   sub: 'Score ≥ 65 right now',    icon: Flame },
  ];

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: sans, fontSize: 26, fontWeight: 500, color: '#a1a1aa', letterSpacing: '-0.01em' }}>{getGreeting()}, </span>
            <span style={{ fontFamily: display, fontSize: 26, fontWeight: 700, color: '#6366F1', letterSpacing: '-0.025em' }}>{firstName}</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{today} · <span style={{ color: '#6366F1' }}>{planLabel}</span></div>
        </div>
        <Link href="/app/products" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 40,
          padding: '0 18px',
          background: '#6366F1',
          color: '#fff',
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'background 150ms',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7c83f4')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
        ><Package size={15} /> Discover Products →</Link>
      </div>

      {/* Today's Signal */}
      <div style={{
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: '3px solid #6366F1',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: '#6366F1', marginBottom: 8, textTransform: 'uppercase' }}>Today&apos;s Signal</div>
        <p style={{ fontFamily: sans, fontSize: 14, color: '#a1a1aa', lineHeight: 1.65, margin: 0 }}>
          AliExpress order velocity is highest on Tuesdays and Wednesdays across Health &amp; Fitness and Home categories. Products with 5,000+ monthly orders and a margin above 50% historically outperform in AU and US markets. <Link href="/app/products" style={{ color: '#6366F1', textDecoration: 'none' }}>Find these products →</Link>
        </p>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '20px 22px',
              transition: 'border-color 200ms, background 200ms',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = '#0e0e10'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = '#111114'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: '#52525b',
                  textTransform: 'uppercase',
                }}>{card.label}</span>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(99,102,241,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6366F1',
                }}><Icon size={15} /></div>
              </div>
              <div style={{
                fontFamily: display,
                fontSize: 32,
                fontWeight: 700,
                color: '#ededed',
                letterSpacing: '-0.025em',
                lineHeight: 1,
                marginBottom: 8,
              }}>{card.valueNode}</div>
              <div style={{ fontFamily: sans, fontSize: 13, color: '#71717a' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Leaders table */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: display, fontWeight: 600, fontSize: 20, color: '#ededed', letterSpacing: '-0.015em', margin: 0 }}>This Week&apos;s Leaders</h2>
          <Link href="/app/products" style={{ fontFamily: mono, fontSize: 12, color: '#6366F1', textDecoration: 'none' }}>View all →</Link>
        </div>
        <div style={{
          background: '#111114',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 130px 110px 90px',
            gap: 14,
            padding: '14px 16px',
            fontFamily: mono,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: '#52525b',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span>#</span>
            <span>Product</span>
            <span>Category</span>
            <span>Score</span>
            <span style={{ textAlign: 'right' }}>Orders/mo</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>
          {prodLoading ? (
            <>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</>
          ) : products.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState />
            </div>
          ) : (
            products.map((p, i) => {
              const score = p.winning_score ?? 0;
              return (
                <div key={p.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 120px 130px 110px 90px',
                  gap: 14,
                  padding: '14px 16px',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 120ms',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <ProductThumb product={p} />
                    <span style={{ fontFamily: sans, fontSize: 14, color: '#ededed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_title}</span>
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    fontSize: 12,
                    color: '#a1a1aa',
                    width: 'fit-content',
                  }}>{p.category ?? '—'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ height: 4, flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', maxWidth: 80 }}>
                      <span style={{
                        display: 'block',
                        height: '100%',
                        width: `${Math.min(100, score)}%`,
                        background: score >= 80 ? '#22c55e' : '#6366F1',
                      }} />
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#6366F1', minWidth: 24, textAlign: 'right' }}>{score || '—'}</span>
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: '#22c55e', textAlign: 'right' }}>{p.sold_count?.toLocaleString() ?? '—'}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href="/app/products" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 6,
                      color: '#6366F1',
                      fontSize: 11,
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontFamily: sans,
                    }}>View <ArrowUpRight size={11} /></Link>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={{
          background: '#111114',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '20px 22px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: '#52525b', textTransform: 'uppercase', marginBottom: 16 }}>Database Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Stat label="Total products"  value={stats.loading ? null : formatNumber(stats.total)} />
            <Stat label="Hot (score ≥ 65)" value={stats.loading ? null : formatNumber(stats.hotCount)} />
            <Stat label="Average score"   value={stats.loading ? null : `${stats.avgScore}/100`} />
            {!stats.loading && Object.entries(stats.bySource).slice(0, 4).map(([src, count]) => (
              <Stat key={src} label={src} value={String(count)} />
            ))}
          </div>
        </div>

        <div style={{
          background: '#111114',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: '#52525b', textTransform: 'uppercase' }}>Getting Started</div>
            <span style={{
              padding: '3px 9px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#6366F1',
              fontFamily: mono,
              fontSize: 11,
              borderRadius: 999,
            }}>0/5 complete</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Pick your market',
              'Discover your first winning product',
              'Run the profit calculator',
              'Generate your first ad creative',
              'Connect or build your store',
            ].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#a1a1aa' }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: mono, fontSize: 10, color: '#52525b',
                }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#71717a' }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#ededed', fontWeight: 600 }}>
        {value ?? <Skeleton width={48} height={12} />}
      </span>
    </div>
  );
}

function ProductThumb({ product }: { product: { product_title: string; image_url: string | null } }) {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.product_title}
        style={{
          width: 36, height: 36, borderRadius: 6,
          objectFit: 'cover',
          border: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          background: '#0d0d10',
        }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 6,
      background: '#0d0d10',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontFamily: "'Bricolage Grotesque', sans-serif",
      fontSize: 14,
      fontWeight: 700,
      color: '#6366F1',
    }}>{product.product_title.charAt(0).toUpperCase()}</div>
  );
}
