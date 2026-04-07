import { Link } from 'wouter';
import { Database, TrendingUp, Percent, Flame, ArrowUpRight } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { ProductImage } from '@/components/app/ProductImage';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

const SHIMMER = `
@keyframes mj-app-shim {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.mj-shim {
  background: linear-gradient(90deg, #111114 0%, #1a1a1f 50%, #111114 100%);
  background-size: 300px 100%;
  animation: mj-app-shim 1.4s linear infinite;
  border-radius: 4px;
  display: inline-block;
}
`;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, ';
  if (h < 18) return 'Good afternoon, ';
  return 'Good evening, ';
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  loading: boolean;
}
function KpiCard({ label, value, sub, icon: Icon, loading }: KpiCardProps) {
  return (
    <div style={{
      background: '#111114',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#52525b',
        }}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(99,102,241,0.12)',
          color: '#6366F1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon size={14} /></div>
      </div>
      <div style={{
        marginTop: 10,
        fontFamily: display,
        fontWeight: 700,
        fontSize: 34,
        color: '#ededed',
        letterSpacing: '-0.025em',
        lineHeight: 1,
      }}>
        {loading ? <span className="mj-shim" style={{ height: 28, width: 90 }} /> : value}
      </div>
      <div style={{ marginTop: 4, fontFamily: sans, fontSize: 12, color: '#71717a' }}>{sub}</div>
    </div>
  );
}

function ProductThumb({ title, image }: { title: string; image: string | null }) {
  return <ProductImage src={image} title={title} size={32} borderRadius={5} />;
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.6fr 140px 130px 110px 80px',
      gap: 14,
      padding: '14px 16px',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span className="mj-shim" style={{ height: 12, width: 24 }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="mj-shim" style={{ height: 32, width: 32, borderRadius: 5 }} />
        <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      </span>
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 12, width: '70%' }} />
      <span className="mj-shim" style={{ height: 24, width: 36, borderRadius: 5 }} />
    </div>
  );
}

export default function AppHome() {
  const { user, isPro } = useAuth();
  const stats = useProductStats();
  const { products, loading: prodLoading } = useProducts({ limit: 8, orderBy: 'sold_count' });
  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const planLabel = isPro ? 'Scale Plan' : 'Builder Plan';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <style>{SHIMMER}</style>

      {/* Page header */}
      <div style={{
        padding: '28px 32px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div>
            <span style={{ fontFamily: sans, fontSize: 22, color: '#71717a', fontWeight: 500 }}>{getGreeting()}</span>
            <span style={{ fontFamily: display, fontSize: 22, color: '#6366F1', fontWeight: 700, letterSpacing: '-0.02em' }}>{firstName}</span>
          </div>
          <div style={{ marginTop: 4, fontFamily: sans, fontSize: 13, color: '#52525b' }}>{today} · {planLabel}</div>
        </div>
        <Link href="/app/products" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#6366F1',
          color: '#fff',
          padding: '9px 18px',
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'background 150ms',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7c83f4')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
        >Find Products →</Link>
      </div>

      {/* Today's signal */}
      <div style={{
        margin: '24px 32px 0',
        background: '#111114',
        borderLeft: '3px solid #6366F1',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeftWidth: 3,
        padding: '16px 20px',
        borderRadius: 8,
      }}>
        <div style={{
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#6366F1',
          marginBottom: 8,
        }}>Today&apos;s Signal</div>
        <p style={{
          fontFamily: sans,
          fontSize: 14,
          color: '#a1a1aa',
          lineHeight: 1.65,
          margin: 0,
        }}>
          Order velocity across the Majorka database peaks Tuesday–Thursday. Products with 5,000+ monthly orders and a net margin above 45% represent the highest-probability opportunities in AU and US markets this week.
        </p>
        <Link href="/app/products" style={{
          display: 'block',
          marginTop: 10,
          fontFamily: sans,
          fontSize: 13,
          color: '#6366F1',
          textDecoration: 'none',
        }}>View top products →</Link>
      </div>

      {/* KPI row */}
      <div style={{
        margin: '24px 32px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}>
        <KpiCard label="PRODUCTS IN DB"  value={fmtNum(stats.total)}     sub="Total tracked products" icon={Database}    loading={stats.loading} />
        <KpiCard label="TOP ORDERS/MO"   value={fmtNum(stats.maxOrders)} sub="Highest in database"   icon={TrendingUp}  loading={stats.loading} />
        <KpiCard label="AVG SCORE"       value={`${stats.avgScore}/100`} sub="Mean dropship score"   icon={Percent}     loading={stats.loading} />
        <KpiCard label="HOT PRODUCTS"    value={fmtNum(stats.hotCount)}  sub="Score 65+ products"    icon={Flame}       loading={stats.loading} />
      </div>

      {/* Product table */}
      <div style={{ margin: '24px 32px 32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <h2 style={{
            fontFamily: display,
            fontWeight: 600,
            fontSize: 16,
            color: '#ededed',
            margin: 0,
            letterSpacing: '-0.015em',
          }}>This Week&apos;s Leaders</h2>
          <Link href="/app/products" style={{
            fontFamily: sans,
            fontSize: 13,
            color: '#6366F1',
            textDecoration: 'none',
          }}>View all →</Link>
        </div>

        <div style={{
          background: '#111114',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1.6fr 140px 130px 110px 80px',
            gap: 14,
            padding: '10px 16px',
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#52525b',
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
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              fontFamily: sans,
              fontSize: 13,
              color: '#52525b',
            }}>No products in database yet</div>
          ) : (
            products.map((p, i) => {
              const score = p.winning_score ?? 0;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.6fr 140px 130px 110px 80px',
                    gap: 14,
                    padding: '14px 16px',
                    alignItems: 'center',
                    borderBottom: i === products.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontFamily: mono, fontSize: 13, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <ProductThumb title={p.product_title} image={p.image_url} />
                    <span style={{
                      fontFamily: sans,
                      fontSize: 13,
                      color: '#ededed',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{p.product_title}</span>
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 9px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 999,
                    fontFamily: sans,
                    fontSize: 12,
                    color: '#71717a',
                    width: 'fit-content',
                  }}>{p.category ?? '—'}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#6366F1' }}>{score || '—'}</span>
                    <span style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <span style={{
                        display: 'block',
                        height: '100%',
                        width: `${Math.min(100, score)}%`,
                        background: '#6366F1',
                        borderRadius: 2,
                      }} />
                    </span>
                  </span>
                  <span style={{
                    fontFamily: mono,
                    fontSize: 13,
                    color: p.sold_count != null ? '#22c55e' : '#71717a',
                    textAlign: 'right',
                  }}>{p.sold_count != null ? p.sold_count.toLocaleString() : '—'}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href="/app/products" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 5,
                      fontFamily: sans,
                      fontSize: 12,
                      color: '#71717a',
                      textDecoration: 'none',
                      transition: 'border-color 150ms, color 150ms',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#71717a'; }}
                    ><ArrowUpRight size={11} /></Link>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
