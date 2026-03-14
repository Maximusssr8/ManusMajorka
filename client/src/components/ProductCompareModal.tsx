/**
 * ProductCompareModal — side-by-side product comparison (pure frontend).
 */
import { X } from 'lucide-react';

interface Product {
  id: string;
  product_title: string;
  image_url: string | null;
  category: string | null;
  winning_score: number;
  est_daily_revenue_aud: number | null;
  price_aud: number | null;
  competition_level: string | null;
  au_relevance: number;
}

interface Props {
  products: Product[];
  onClose: () => void;
}

const C = {
  bg: '#0d1017',
  gold: '#d4af37',
  goldBg: 'rgba(212,175,55,0.08)',
  goldBorder: 'rgba(212,175,55,0.2)',
  glass: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  sub: '#a1a1aa',
  muted: '#52525b',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
} as const;

function fmtAUD(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
}

function competitionFromScore(score: number): { label: string; color: string } {
  if (score > 85) return { label: 'Low', color: C.green };
  if (score > 70) return { label: 'Medium', color: C.amber };
  return { label: 'High', color: C.red };
}

export default function ProductCompareModal({ products, onClose }: Props) {
  if (!products.length) return null;

  const bestIdx = products.reduce(
    (best, p, i) =>
      (p.est_daily_revenue_aud ?? 0) > (products[best].est_daily_revenue_aud ?? 0) ? i : best,
    0,
  );

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: 'Est. Daily Revenue',
      render: (p) => (
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            color: C.gold,
          }}
        >
          {fmtAUD(p.est_daily_revenue_aud)}/day
        </span>
      ),
    },
    {
      label: 'Monthly Projection',
      render: (p) => (
        <span style={{ fontWeight: 700, color: C.green, fontSize: 15 }}>
          {p.est_daily_revenue_aud
            ? fmtAUD(p.est_daily_revenue_aud * 30) + '/mo'
            : '—'}
        </span>
      ),
    },
    {
      label: 'Winning Score',
      render: (p) => (
        <span
          style={{
            fontWeight: 800,
            fontSize: 18,
            color:
              p.winning_score >= 80 ? C.gold : p.winning_score >= 60 ? C.green : C.amber,
          }}
        >
          {p.winning_score}
        </span>
      ),
    },
    {
      label: 'Profit Margin (est.)',
      render: (p) => {
        const cost = p.price_aud ? p.price_aud / 2.8 : null;
        const margin =
          cost && p.price_aud
            ? (((p.price_aud - cost) / p.price_aud) * 100).toFixed(0)
            : null;
        return (
          <span style={{ fontWeight: 700, color: C.green }}>
            {margin ? `~${margin}%` : '—'}
          </span>
        );
      },
    },
    {
      label: 'Competition Level',
      render: (p) => {
        const comp = competitionFromScore(p.winning_score);
        return (
          <span
            style={{
              fontWeight: 700,
              color: comp.color,
              background: `${comp.color}15`,
              border: `1px solid ${comp.color}35`,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
            }}
          >
            {comp.label}
          </span>
        );
      },
    },
    {
      label: 'AU Relevance',
      render: (p) => (
        <span
          style={{
            fontWeight: 700,
            color:
              p.au_relevance >= 90 ? C.green : p.au_relevance >= 70 ? C.amber : C.sub,
            fontSize: 15,
          }}
        >
          🇦🇺 {p.au_relevance}%
        </span>
      ),
    },
    {
      label: 'Retail Price',
      render: (p) => (
        <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
          {fmtAUD(p.price_aud)}
        </span>
      ),
    },
    {
      label: 'Category',
      render: (p) => (
        <span style={{ fontSize: 13, color: C.sub }}>{p.category ?? '—'}</span>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          width: 'min(92vw, 900px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: C.bg,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 800,
                color: C.text,
                margin: 0,
              }}
            >
              Product Comparison
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.sub }}>
              {products.length} products side-by-side
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: C.glass,
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Product headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${products.length}, 1fr)`,
            gap: 0,
            padding: '20px 24px 0',
          }}
        >
          <div />
          {products.map((p, i) => (
            <div
              key={p.id}
              style={{
                padding: '16px 12px',
                textAlign: 'center',
                position: 'relative',
                background: i === bestIdx ? C.goldBg : 'transparent',
                border: i === bestIdx ? `1px solid ${C.goldBorder}` : '1px solid transparent',
                borderRadius: 14,
                margin: '0 4px',
              }}
            >
              {i === bestIdx && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: C.gold,
                    color: '#000',
                    borderRadius: 100,
                    padding: '2px 12px',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'Syne, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⭐ Best Choice
                </div>
              )}

              {/* Image */}
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt=""
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    objectFit: 'cover',
                    margin: '0 auto 10px',
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    background: C.glass,
                    border: '1px solid rgba(255,255,255,0.06)',
                    margin: '0 auto 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  📦
                </div>
              )}

              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  lineHeight: 1.3,
                }}
              >
                {p.product_title}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <div style={{ padding: '12px 24px 24px' }}>
          {rows.map((row, ri) => (
            <div
              key={ri}
              style={{
                display: 'grid',
                gridTemplateColumns: `160px repeat(${products.length}, 1fr)`,
                gap: 0,
                borderBottom: ri < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                padding: '12px 0',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  paddingRight: 12,
                }}
              >
                {row.label}
              </div>
              {products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    textAlign: 'center',
                    padding: '4px 12px',
                  }}
                >
                  {row.render(p)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
