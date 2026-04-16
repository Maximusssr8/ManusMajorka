import React, { Suspense, lazy } from 'react';

const FullDatabase = lazy(() => import('../../../pages/intelligence/FullDatabase'));

export function TrendingTodayTab() {
  return (
    <div style={{ background: '#04060f' }}>
      <Suspense fallback={
        <div className="flex items-center justify-center py-24" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Loading trending products...
        </div>
      }>
        <FullDatabase presetFilter="trending" />
      </Suspense>
    </div>
  );
}
