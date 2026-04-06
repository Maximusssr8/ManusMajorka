import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCountUp } from '@/hooks/useCountUp';

interface Product {
  id: string | number;
  product_title?: string;
  name?: string;
  image_url?: string;
  category?: string;
  real_price_aud?: number;
  real_orders_count?: number;
  real_rating?: number;
  winning_score?: number;
  signal_score?: number;
  aliexpress_url?: string;
  source_url?: string;
  data_source?: string;
}

interface ProductDeepDiveProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDeepDive({ product, onClose }: ProductDeepDiveProps) {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // All hooks at top
  const animatedOrders = useCountUp(product?.real_orders_count ?? 0, 1000, mounted ? 0 : 0);
  const animatedScore = useCountUp(product?.winning_score ?? product?.signal_score ?? 0, 800, mounted ? 200 : 0);

  if (!product) return null;

  const score = product.winning_score ?? product.signal_score ?? 0;
  const scoreColor = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#94A3B8';
  const orders = product.real_orders_count ?? 0;
  const estRevenue = orders && product.real_price_aud ? Math.round((orders * product.real_price_aud * 0.3) / 1000) : 0;
  const productUrl = product.aliexpress_url || product.source_url;

  const title = product.product_title || product.name || 'Unknown Product';

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: 480,
        background: '#0C1120',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-24px 0 64px rgba(0,0,0,0.4)',
        transform: product ? 'translateX(0)' : 'translateX(480px)',
        transition: 'transform 0.25s ease-out',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with image and close button */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        {/* Product image */}
        <div
          style={{
            width: '100%',
            maxHeight: 220,
            background: '#0A0F1C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: 10,
            margin: 16,
            marginBottom: 0,
          }}
        >
          <img
            src={product.image_url || ''}
            alt=""
            onError={e => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/220?text=📦';
            }}
            style={{
              maxWidth: '100%',
              maxHeight: 220,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}
        >
          ×
        </button>

        {/* Title */}
        <div
          style={{
            padding: '12px 16px',
            fontSize: 15,
            fontWeight: 600,
            color: '#F1F5F9',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {/* Score bar */}
        <div style={{ padding: '0 16px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Score</span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: scoreColor,
              }}
            >
              {Math.round(animatedScore)}/100
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(animatedScore / 100) * 100}%`,
                background: scoreColor,
                transition: 'width 0.3s ease-out',
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        {/* Metrics grid — 2 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '0 16px 16px',
          }}
        >
          {[
            { label: 'Price (AUD)', value: product.real_price_aud ? `$${product.real_price_aud.toFixed(0)}` : '—' },
            { label: 'Orders', value: animatedOrders.toLocaleString() || '—' },
            { label: 'Rating', value: product.real_rating ? `${product.real_rating.toFixed(1)} ⭐` : '—' },
            { label: 'Category', value: product.category || '—' },
            { label: 'Platform', value: 'AliExpress' },
            { label: 'Est. Revenue/mo', value: estRevenue ? `$${estRevenue}k` : '—' },
          ].map((metric, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: '12px 10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: 500 }}>
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#F1F5F9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 16px 16px',
            flexDirection: 'column',
          }}
        >
          {productUrl && (
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                background: '#6366F1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#4F46E5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#6366F1';
              }}
            >
              View on AliExpress →
            </a>
          )}
          <button
            onClick={() => {
              setLocation('/app/store-builder');
              onClose();
            }}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.08)',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 150ms',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
            }}
          >
            Build Store
          </button>
        </div>
      </div>
    </div>
  );
}
