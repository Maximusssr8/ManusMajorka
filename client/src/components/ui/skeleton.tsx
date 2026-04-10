import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

/** Shimmer skeleton — uses the CSS shimmer keyframe from design-tokens.css */
function ShimmerBlock({ width = '100%', height = 16, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />;
}

/** KPI-shaped skeleton card */
function SkeletonCard() {
  return (
    <div style={{
      padding: 20,
      background: 'var(--bg-card, #1a2035)',
      border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      borderRadius: 16,
    }}>
      <ShimmerBlock height={12} width="60%" style={{ marginBottom: 12 }} />
      <ShimmerBlock height={32} width="40%" style={{ marginBottom: 8 }} />
      <ShimmerBlock height={10} width="80%" />
    </div>
  );
}

/** Table/list row skeleton */
function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
    }}>
      <ShimmerBlock width={48} height={48} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <ShimmerBlock height={14} width="70%" style={{ marginBottom: 8 }} />
        <ShimmerBlock height={10} width="40%" />
      </div>
      <ShimmerBlock height={14} width={60} />
    </div>
  );
}

export { Skeleton, ShimmerBlock, SkeletonCard, SkeletonRow };
