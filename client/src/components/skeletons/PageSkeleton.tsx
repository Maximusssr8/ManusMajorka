import React from 'react';

/**
 * PageSkeleton — generic centred skeleton fallback for lazy route Suspense.
 * Shimmer uses the gold glow tint at 0.05 opacity. Respects prefers-reduced-motion.
 */
export function PageSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      role="status"
      aria-label="Loading page"
    >
      <style>{SHIMMER_CSS}</style>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="mkr-shimmer" style={{ height: 28, width: '40%', borderRadius: 8 }} />
        <div className="mkr-shimmer" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="mkr-shimmer" style={{ height: 14, width: '55%', borderRadius: 6 }} />
        <div style={{ height: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div className="mkr-shimmer" style={{ height: 88, borderRadius: 12 }} />
          <div className="mkr-shimmer" style={{ height: 88, borderRadius: 12 }} />
          <div className="mkr-shimmer" style={{ height: 88, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

export const SHIMMER_CSS = `
@keyframes mkrShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.mkr-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(212, 175, 55, 0.05) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  background-size: 800px 100%;
  animation: mkrShimmer 1.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .mkr-shimmer { animation: none; }
}
`;

export default PageSkeleton;
