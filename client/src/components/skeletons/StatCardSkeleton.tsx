import React from 'react';
import { SHIMMER_CSS } from './PageSkeleton';

/**
 * StatCardSkeleton — dashboard KPI card placeholder used on Home.
 */
export function StatCardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        background: '#13151c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 112,
      }}
      role="status"
      aria-label="Loading stat"
    >
      <style>{SHIMMER_CSS}</style>
      <div className="mkr-shimmer" style={{ height: 12, width: '45%', borderRadius: 4 }} />
      <div className="mkr-shimmer" style={{ height: 28, width: '70%', borderRadius: 6 }} />
      <div className="mkr-shimmer" style={{ height: 10, width: '35%', borderRadius: 4 }} />
    </div>
  );
}

export default StatCardSkeleton;
