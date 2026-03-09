/**
 * SkeletonLoader — animated shimmer placeholder for loading states.
 */
export function SkeletonLine({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="rounded-md animate-pulse"
      style={{
        width,
        height,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease infinite",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" height={12} />
          <SkeletonLine width="40%" height={10} />
        </div>
      </div>
      <SkeletonLine width="100%" height={10} />
      <SkeletonLine width="85%" height={10} />
      <SkeletonLine width="70%" height={10} />
    </div>
  );
}

export function SkeletonOutput({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      {/* Summary skeleton */}
      <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <SkeletonLine width="30%" height={10} />
        <SkeletonLine width="100%" height={12} />
        <SkeletonLine width="90%" height={12} />
      </div>
      {/* Card skeletons */}
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
