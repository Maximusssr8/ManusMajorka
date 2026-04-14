import React, { useState } from 'react';
import { toast } from 'sonner';

interface Product {
  id: string;
  title?: string;
  product_title?: string;
  image_url?: string;
  orders?: number;
  real_orders_count?: number;
  price?: number;
  real_price_aud?: number;
  original_price?: number;
  rating?: number;
  real_rating?: number;
  review_count?: number;
  real_review_count?: number;
  winning_score?: number;
  hot_product_flag?: boolean;
  is_bestseller?: boolean;
  category?: string;
  source?: string;
  product_url?: string;
  source_url?: string;
  trend_direction?: string;
  updated_at?: string;
}

interface ProductRowProps {
  product: Product;
  rank: number;
  onClick: () => void;
}

type TrendKey = 'rising' | 'peaked' | 'stable' | 'declining';

const trendPoints: Record<TrendKey, string> = {
  rising: '0,22 15,17 30,13 45,9 60,5 75,3 90,2',
  peaked: '0,14 15,9 30,5 45,7 60,12 75,17 90,20',
  stable: '0,13 15,12 30,14 45,12 60,13 75,12 90,13',
  declining: '0,5 15,8 30,11 45,14 60,17 75,19 90,22',
};

const trendColor: Record<TrendKey, string> = {
  rising: '#34d399', peaked: '#fbbf24', stable: '#64748b', declining: '#f87171',
};

const formatOrders = (n?: number): string => {
  if (!n) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

export function ProductRow({ product, rank, onClick }: ProductRowProps) {
  const [imgError, setImgError] = useState(false);

  const title = product.title || product.product_title || 'Untitled Product';
  const imageUrl = product.image_url;
  const orders = product.orders || product.real_orders_count || 0;
  const price = product.price || product.real_price_aud || 0;
  const originalPrice = product.original_price || 0;
  const rating = product.rating || product.real_rating;
  const reviewCount = product.review_count || product.real_review_count;
  const score = product.winning_score ?? null;
  const productUrl = product.product_url || product.source_url || '#';
  const rawTrend = product.trend_direction || 'stable';
  const trend: TrendKey = (rawTrend in trendPoints) ? rawTrend as TrendKey : 'stable';

  const margin = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  const isNew = product.updated_at
    ? new Date(product.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : false;

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success('Saved to watchlist');
  };

  const rowStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.04)', height: 44 };

  return (
    <tr onClick={onClick} className="group cursor-pointer transition-colors mkr-table-row" style={rowStyle}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

      {/* Rank */}
      <td className="px-4 py-3.5 text-center">
        <span className="text-[11px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.2)' }}>{rank}</span>
      </td>

      {/* Product */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {!imgError && imageUrl ? (
              <img src={imageUrl} alt={title} className="w-12 h-12 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.08)' }} onError={() => setImgError(true)} loading="lazy" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            )}
            {product.is_bestseller && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[8px]">🏆</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-slate-200 group-hover:text-white transition-colors leading-snug truncate">{title}</div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {product.hot_product_flag && <span className="text-[13px]" title="Hot product" style={{ lineHeight: 1 }}>🔥</span>}
              {isNew && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-[#e5c158]" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>New</span>}
              {product.category && <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{product.category}</span>}
            </div>
          </div>
        </div>
      </td>

      {/* Orders */}
      <td className="px-4 py-3.5">
        <div className="text-[13px] font-semibold text-emerald-400 tabular-nums">{formatOrders(orders)}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>sold</div>
      </td>

      {/* Price */}
      <td className="px-4 py-3.5">
        <div className="text-[13px] font-semibold text-slate-100 tabular-nums">{price ? `$${price.toFixed(2)}` : '—'}</div>
        {originalPrice > price && <div className="text-[11px] mt-0.5 line-through tabular-nums" style={{ color: 'rgba(255,255,255,0.2)' }}>${originalPrice.toFixed(2)}</div>}
      </td>

      {/* Margin */}
      <td className="px-4 py-3.5">
        {margin !== null ? (
          <div className={`text-[13px] font-semibold tabular-nums ${margin >= 60 ? 'text-emerald-400' : margin >= 40 ? 'text-amber-400' : margin >= 20 ? 'text-orange-400' : 'text-red-400'}`}>{margin}%</div>
        ) : <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
      </td>

      {/* Rating */}
      <td className="px-4 py-3.5">
        {rating ? (
          <>
            <div className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span className="text-[13px] font-medium text-slate-100 tabular-nums">{rating.toFixed(1)}</span>
            </div>
            {reviewCount && reviewCount > 0 && <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'rgba(255,255,255,0.2)' }}>{formatOrders(reviewCount)} reviews</div>}
          </>
        ) : <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
      </td>

      {/* Sparkline */}
      <td className="px-4 py-3.5">
        <svg width="72" height="28" viewBox="0 0 90 28" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${product.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor[trend]} stopOpacity="0.15" />
              <stop offset="100%" stopColor={trendColor[trend]} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${trendPoints[trend]} 90,28 0,28`} fill={`url(#grad-${product.id})`} />
          <polyline points={trendPoints[trend]} fill="none" stroke={trendColor[trend]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </td>

      {/* Score */}
      <td className="px-4 py-3.5">
        <div
          className={`rounded-full border-2 flex items-center justify-center text-[12px] font-bold tabular-nums ${score !== null && score >= 70 ? 'text-emerald-400' : score !== null && score >= 55 ? 'text-amber-400' : 'text-slate-500'}`}
          style={{
            width: 34, height: 34, flexShrink: 0,
            borderColor: score !== null && score >= 70 ? 'rgba(52,211,153,0.25)' : score !== null && score >= 55 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.1)',
            background: score !== null && score >= 70 ? 'rgba(52,211,153,0.08)' : score !== null && score >= 55 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
          }}
        >
          {score !== null ? score : '—'}
        </div>
      </td>

      {/* Source */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${product.source === 'aliexpress' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{product.source === 'aliexpress' ? 'AE' : 'CJ'}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
            className="text-[12px] font-medium transition-colors whitespace-nowrap bg-none border-none cursor-pointer"
            style={{ color: '#818CF8', textDecoration: 'none', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A5B4FC')}
            onMouseLeave={e => (e.currentTarget.style.color = '#818CF8')}
          >
            View ↗
          </button>
          <button
            onClick={handleSave}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center' }}
            title="Save to watchlist"
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
