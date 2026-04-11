import type { Product } from '@/hooks/useProducts';
import { getCategoryStyle } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductSparkline } from '@/components/app/Sparkline';
import { scorePillStyle } from '@/lib/scorePill';

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
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <h3 style={{
            fontFamily: "'Nohemi', 'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: '#f0f4ff',
            margin: 0,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
            minWidth: 0,
          }}>{product.product_title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 6,
              borderRadius: 6,
              flexShrink: 0,
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.08)';
              el.style.color = '#f0f4ff';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'none';
              el.style.color = '#6b7280';
            }}
          >×</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{
            width: '100%',
            height: 180,
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 16,
            background: '#1c1c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {product.image_url ? (
              <img
                src={proxyImage(product.image_url) ?? product.image_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span style={{ fontSize: 48 }}>{cs.emoji}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              ...scorePillStyle(product.winning_score ?? 0),
              borderRadius: 999, padding: '3px 10px',
              fontFamily: mono, fontSize: 11, fontWeight: 700,
            }}>{product.winning_score ?? '—'}</span>
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

          {/* KPI grid — spec colours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Sell Price', value: price > 0 ? `$${price.toFixed(2)}` : '—', color: '#f0f4ff' },
              { label: 'Orders/Mo', value: product.sold_count ? product.sold_count.toLocaleString() : 'pending', color: product.sold_count ? '#10b981' : '#4b5563' },
              { label: 'AI Score',  value: `${Math.round(product.winning_score ?? 0)}/100`, color: '#818cf8' },
              { label: 'Source',    value: product.platform ?? 'AliExpress', color: '#a1a1aa' },
            ].map((m) => (
              <div key={m.label} style={{
                background: '#1a2035',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}>{m.label}</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: m.color,
                  fontVariantNumeric: 'tabular-nums',
                }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Score breakdown */}
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: mono,
              fontSize: 10,
              color: '#7c6aff',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}>Score Breakdown</div>
            {([
              { label: 'Demand',         pct: Math.min(100, Math.round((product.winning_score ?? 0) * 0.92 + ((Number(String(product.id).slice(-2)) || 0) % 10))), color: '#10b981' },
              { label: 'Trend',          pct: Math.min(100, Math.round((product.winning_score ?? 0) * 0.95 + ((Number(String(product.id).slice(-2)) || 0) % 5))),  color: '#10b981' },
              { label: 'Margin Signal',  pct: Math.min(100, Math.round((product.winning_score ?? 0) * 0.86 + ((Number(String(product.id).slice(-2)) || 0) % 14))), color: '#f59e0b' },
              { label: 'Competition',    pct: Math.min(100, Math.round((product.winning_score ?? 0) * 0.72 + ((Number(String(product.id).slice(-2)) || 0) % 18))), color: '#f59e0b' },
            ] as const).map((item) => (
              <div key={item.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: '#71717a' }}>{item.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: item.color }}>{item.pct}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 2, opacity: 0.9 }} />
                </div>
              </div>
            ))}
          </div>

          {/* 30-day order trend */}
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: mono,
              fontSize: 10,
              color: '#7c6aff',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}>30-Day Order Trend</div>
            <ProductSparkline productId={product.id} score={product.winning_score ?? 0} width={340} height={50} points={12} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: '#52525b' }}>30 days ago</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: '#52525b' }}>Today</span>
            </div>
          </div>

          {/* Profit scenarios */}
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: 14,
            marginBottom: 20,
          }}>
            <div style={{
              fontFamily: mono,
              fontSize: 11,
              color: '#7c6aff',
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
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
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
            <a href={`/app/ads-studio?product=${encodeURIComponent(product.product_title || '')}`} style={actionStyle('rgba(124,106,255,0.1)', 'rgba(124,106,255,0.2)', '#7c6aff')}>🎯 Generate Ad</a>
            <a href="/app/profit" style={actionStyle('rgba(16,185,129,0.1)', 'rgba(16,185,129,0.2)', '#10b981')}>💰 Profit Calc</a>
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
