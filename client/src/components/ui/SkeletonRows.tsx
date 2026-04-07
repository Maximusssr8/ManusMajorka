import React from 'react';

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="mkr-skeleton-row">
          <div className="mkr-skeleton mkr-skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="mkr-skeleton mkr-skeleton-text-lg" style={{ width: `${140 + (i % 3) * 40}px` }} />
            <div className="mkr-skeleton mkr-skeleton-text-sm" style={{ marginTop: 6 }} />
          </div>
          <div className="mkr-skeleton mkr-skeleton-num" />
          <div className="mkr-skeleton mkr-skeleton-badge" />
        </div>
      ))}
    </div>
  );
}
