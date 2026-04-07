import { Link } from 'wouter';
import { Store, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { SkeletonRow, Skeleton } from '@/components/app/SkeletonRow';
import { EmptyState } from '@/components/app/EmptyState';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

export default function AppRevenue() {
  const stats = useProductStats();
  const { products, loading } = useProducts({ limit: 5, orderBy: 'sold_count' });

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: display, fontWeight: 600, fontSize: 28, color: '#ededed', letterSpacing: '-0.025em', margin: '0 0 6px' }}>Revenue</h1>
        <p style={{ fontFamily: sans, fontSize: 14, color: '#71717a', margin: 0 }}>
          Connect your store to track real revenue. Until then, browse the highest-volume opportunities below.
        </p>
      </div>

      {/* Connect store CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #111114 0%, #14111c 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 12,
        padding: 32,
        marginBottom: 24,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Store size={16} style={{ color: '#6366F1' }} />
            <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#6366F1', textTransform: 'uppercase' }}>Connect Your Store</span>
          </div>
          <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: 22, color: '#ededed', letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.2 }}>
            Track real revenue from your Shopify store
          </h2>
          <p style={{ fontFamily: sans, fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
            One-click Shopify OAuth. We pull live order data and surface your top performers, margin trends, and ad ROAS — alongside Majorka&apos;s product intelligence.
          </p>
        </div>
        <Link href="/app/store-builder" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          background: '#6366F1',
          color: '#fff',
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>Connect Shopify <ArrowUpRight size={14} /></Link>
      </div>

      {/* Stat row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <StatCard label="PRODUCTS TRACKED"  value={stats.loading ? null : stats.total.toLocaleString()} sub="across all markets" />
        <StatCard label="HIGHEST ORDERS/MO" value={stats.loading ? null : stats.maxOrders.toLocaleString()} sub="top product, all-time" />
        <StatCard label="AVG SCORE"          value={stats.loading ? null : `${stats.avgScore}/100`} sub="across active products" />
        <StatCard label="HOT PRODUCTS"       value={stats.loading ? null : stats.hotCount.toLocaleString()} sub="score ≥ 65" />
      </div>

      {/* Top opportunities */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={16} style={{ color: '#6366F1' }} />
          <h2 style={{ fontFamily: display, fontWeight: 600, fontSize: 18, color: '#ededed', letterSpacing: '-0.015em', margin: 0 }}>Top Revenue Opportunities</h2>
        </div>
        <div style={{
          background: '#111114',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 130px 110px 110px',
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
            <span style={{ textAlign: 'right' }}>Orders/mo</span>
            <span style={{ textAlign: 'right' }}>Price</span>
          </div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            <div style={{ padding: 24 }}><EmptyState /></div>
          ) : (
            products.map((p, i) => (
              <div key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 130px 110px 110px',
                gap: 14,
                padding: '14px 16px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontFamily: sans, fontSize: 14, color: '#ededed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_title}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#a1a1aa' }}>{p.category ?? '—'}</span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#22c55e', textAlign: 'right' }}>{p.sold_count?.toLocaleString() ?? '—'}</span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#ededed', textAlign: 'right' }}>{p.price_aud != null ? `$${p.price_aud.toFixed(2)}` : '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | null; sub: string }) {
  return (
    <div style={{
      background: '#111114',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '20px 22px',
    }}>
      <div style={{ fontFamily: mono, fontSize: 11, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 28, fontWeight: 700, color: '#ededed', letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 8 }}>
        {value ?? <Skeleton width={70} height={24} />}
      </div>
      <div style={{ fontSize: 12, color: '#71717a' }}>{sub}</div>
    </div>
  );
}
