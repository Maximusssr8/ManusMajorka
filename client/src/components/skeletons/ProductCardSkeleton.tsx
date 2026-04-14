import React from 'react';
import { SHIMMER_CSS } from './PageSkeleton';

/**
 * ProductCardSkeleton — matches product card layout used on Products page.
 * Image on top, title, price row, stats row.
 */
export function ProductCardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        background: '#13151c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      role="status"
      aria-label="Loading product"
    >
      <style>{SHIMMER_CSS}</style>
      <div className="mkr-shimmer" style={{ aspectRatio: '1 / 1', borderRadius: 12, width: '100%' }} />
      <div className="mkr-shimmer" style={{ height: 14, width: '90%', borderRadius: 4 }} />
      <div className="mkr-shimmer" style={{ height: 14, width: '60%', borderRadius: 4 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div className="mkr-shimmer" style={{ height: 20, flex: 1, borderRadius: 6 }} />
        <div className="mkr-shimmer" style={{ height: 20, flex: 1, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
