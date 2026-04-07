import { CSSProperties } from 'react';

const SHIMMER = `
@keyframes mj-shimmer-bg {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
`;

const baseStyle: CSSProperties = {
  background: 'linear-gradient(90deg, #111114 25%, #1a1a1f 50%, #111114 75%)',
  backgroundSize: '600px 100%',
  animation: 'mj-shimmer-bg 1.5s linear infinite',
  borderRadius: 6,
};

interface SkeletonProps { width?: number | string; height?: number | string; style?: CSSProperties }

export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  return (
    <>
      <style>{SHIMMER}</style>
      <span style={{ ...baseStyle, display: 'inline-block', width, height, ...style }} />
    </>
  );
}

export function SkeletonRow() {
  return (
    <>
      <style>{SHIMMER}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 120px 80px 100px 100px',
        gap: 14,
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        alignItems: 'center',
      }}>
        <span style={{ ...baseStyle, height: 14, width: 24 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...baseStyle, height: 36, width: 36, borderRadius: 6 }} />
          <span style={{ ...baseStyle, height: 14, width: '70%' }} />
        </span>
        <span style={{ ...baseStyle, height: 14 }} />
        <span style={{ ...baseStyle, height: 14 }} />
        <span style={{ ...baseStyle, height: 14 }} />
        <span style={{ ...baseStyle, height: 28, borderRadius: 6 }} />
      </div>
    </>
  );
}

export function SkeletonCard() {
  return (
    <>
      <style>{SHIMMER}</style>
      <div style={{
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <div style={{ ...baseStyle, height: 110, borderRadius: 0 }} />
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ ...baseStyle, height: 12, width: '40%' }} />
          <span style={{ ...baseStyle, height: 14, width: '90%' }} />
          <span style={{ ...baseStyle, height: 14, width: '70%' }} />
          <span style={{ ...baseStyle, height: 28, marginTop: 6 }} />
        </div>
      </div>
    </>
  );
}
