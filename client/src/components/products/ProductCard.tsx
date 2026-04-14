/**
 * ProductCard — dense dropshipper-grade card for the Products page grid.
 *
 * Renders image, title, price, orders (mono), score chip, market flags,
 * and a trend badge. Clicking opens the detail drawer via `onOpen`.
 * Memoised — re-renders only when the row data reference changes.
 */
import { memo, useState } from 'react';
import type { Product } from '@/hooks/useProducts';
import { ProductImage } from '@/components/ProductImage';
import { MarketFlags } from './MarketFlags';
import { TrendBadge } from './TrendBadge';
import { proxyImage } from '@/lib/imageProxy';

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
}

function fmtOrders(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v <= 0) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

function fmtPriceAUD(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v <= 0) return '—';
  return `$${v.toFixed(2)}`;
}

function velocityPercent(p: Product): number | null {
  const now = Number(p.sold_count ?? 0);
  const prev = Number(p.sold_count_7d_ago ?? 0);
  if (prev <= 0 || now <= 0) return null;
  return ((now - prev) / prev) * 100;
}

function scoreColor(score: number): { fg: string; bg: string; border: string } {
  if (score >= 90) return { fg: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' };
  if (score >= 75) return { fg: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
  if (score >= 60) return { fg: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)' };
  return { fg: '#a3a3a3', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' };
}

function ProductCardImpl({ product, onOpen }: ProductCardProps) {
  const [hover, setHover] = useState(false);
  const score = Math.round(Number(product.winning_score ?? 0));
  const sc = scoreColor(score);
  const pct = velocityPercent(product);
  const proxied = proxyImage(product.image_url) ?? product.image_url ?? undefined;

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        background: '#111111',
        border: `1px solid ${hover ? 'rgba(212,175,55,0.35)' : '#1a1a1a'}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        color: 'inherit',
        transition: 'border 160ms ease, box-shadow 220ms cubic-bezier(0.16,1,0.3,1), transform 160ms ease',
        boxShadow: hover
          ? '0 0 0 1px rgba(212,175,55,0.12), 0 14px 40px -12px rgba(212,175,55,0.35)'
          : '0 1px 0 rgba(255,255,255,0.02) inset',
        transform: hover ? 'translateY(-1px)' : 'none',
        minHeight: 280,
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#080808',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <ProductImage
          src={proxied}
          alt={product.product_title}
          size={0}
          borderRadius={0}
          style={{ width: '100%', height: '100%' }}
        />
        {/* Score chip top-left */}
        <div
          className="mj-num"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: sc.fg,
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: 6,
            backdropFilter: 'blur(6px)',
          }}
        >
          {score > 0 ? score : '—'}
        </div>
        {/* Market flags top-right */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <MarketFlags />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3
          title={product.product_title}
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: '#e5e5e5',
            lineHeight: 1.35,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 38,
          }}
        >
          {product.product_title}
        </h3>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            className="mj-num"
            style={{ fontSize: 15, fontWeight: 700, color: '#f5f5f5' }}
            title="Landed cost (AUD)"
          >
            {fmtPriceAUD(product.price_aud)}
          </span>
          <span
            className="mj-num"
            style={{ fontSize: 12, color: '#a3a3a3' }}
            title="Total lifetime orders"
          >
            {fmtOrders(product.sold_count)} sold
          </span>
        </div>

        {/* Trend row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
          <TrendBadge percent={pct} />
          {product.category ? (
            <span
              style={{
                fontSize: 10,
                color: '#737373',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 110,
              }}
            >
              {product.category}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export const ProductCard = memo(ProductCardImpl);
export default ProductCard;
