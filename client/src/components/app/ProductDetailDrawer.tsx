import type { Product } from '@/hooks/useProducts';
import { getCategoryStyle } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface ProductDetailDrawerProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailDrawer({ product, onClose }: ProductDetailDrawerProps) {
  if (!product) return null;
  const cs = getCategoryStyle(product.category);
  const price = product.price_aud != null ? Number(product.price_aud) : 0;

  const scenarios = [
    { label: 'Conservative', sales: 3,  icon: '🐢' },
    { label: 'Moderate',     sales: 8,  icon: '📈' },
    { label: 'Aggressive',   sales: 20, icon: '🚀' },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
      />
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: '#0d0d10',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100,
        overflowY: 'auto',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontFamily: mono,
            fontSize: 11,
            color: '#6366F1',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>Product Intelligence</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
          >×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{
            width: '100%',
            height: 180,
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 16,
            background: '#111114',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {product.image_url ? (
              <img
                src={proxyImage(product.image_url) ?? product.image_url}
                alt={product.product_title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span style={{ fontSize: 48 }}>{cs.emoji}</span>
            )}
          </div>

          <h3 style={{
            fontFamily: display,
            fontSize: 17,
            fontWeight: 700,
            color: '#ededed',
            margin: '0 0 8px',
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
          }}>{product.product_title}</h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(99,102,241,0.12)', color: '#6366F1',
              borderRadius: 999, padding: '3px 10px',
              fontFamily: mono, fontSize: 11, fontWeight: 600,
            }}>{product.winning_score ?? '—'}/100</span>
            <span style={{
              background: 'rgba(255,90,0,0.1)', color: 'rgba(255,120,0,0.9)',
              borderRadius: 999, padding: '3px 10px',
              fontFamily: mono, fontSize: 11,
            }}>AliExpress</span>
            {product.category && (
              <span style={{
                background: 'rgba(255,255,255,0.05)', color: '#6b7280',
                borderRadius: 999, padding: '3px 10px',
                fontFamily: mono, fontSize: 11,
              }}>{product.category}</span>
            )}
          </div>

          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Sell Price', value: price > 0 ? `$${price.toFixed(2)}` : '—', color: '#ededed' },
              { label: 'Orders/mo', value: product.sold_count ? product.sold_count.toLocaleString() : 'pending', color: product.sold_count ? '#22c55e' : '#4b5563' },
              { label: 'AI Score',  value: `${product.winning_score ?? 0}/100`, color: '#6366F1' },
              { label: 'Source',    value: product.platform ?? 'AliExpress', color: '#a1a1aa' },
            ].map((m) => (
              <div key={m.label} style={{
                background: '#111114',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{
                  fontFamily: mono,
                  fontSize: 10,
                  color: '#52525b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}>{m.label}</div>
                <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Profit scenarios */}
          <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: 14,
            marginBottom: 20,
          }}>
            <div style={{
              fontFamily: mono,
              fontSize: 11,
              color: '#6366F1',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}>Profit Scenario</div>
            {price > 0 ? scenarios.map((s, i) => {
              const margin = price * 0.45;
              const monthly = (margin * s.sales * 30).toFixed(0);
              return (
                <div key={s.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: i < scenarios.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: '#a1a1aa' }}>
                    {s.icon} {s.label} ({s.sales}/day)
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                    ${Number(monthly).toLocaleString()}/mo
                  </span>
                </div>
              );
            }) : (
              <div style={{ fontFamily: sans, fontSize: 12, color: '#52525b' }}>
                Price data unavailable for calculation
              </div>
            )}
            <div style={{
              marginTop: 8,
              fontFamily: sans,
              fontSize: 10,
              color: '#4b5563',
            }}>Based on ~45% net margin assumption</div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {product.product_url && (
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" style={actionStyle('rgba(255,90,0,0.1)', 'rgba(255,90,0,0.2)', 'rgba(255,120,0,0.9)')}>↗ View on AliExpress</a>
            )}
            <a href={`/app/ads-studio?product=${encodeURIComponent(product.product_title || '')}`} style={actionStyle('rgba(99,102,241,0.1)', 'rgba(99,102,241,0.2)', '#6366F1')}>🎯 Generate Ad</a>
            <a href="/app/profit" style={actionStyle('rgba(34,197,94,0.1)', 'rgba(34,197,94,0.2)', '#22c55e')}>💰 Profit Calc</a>
            <a href="/app/store-builder" style={actionStyle('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', '#a1a1aa')}>🏪 Build Store</a>
          </div>
        </div>
      </div>
    </>
  );
}

function actionStyle(bg: string, border: string, color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    color,
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
  };
}
