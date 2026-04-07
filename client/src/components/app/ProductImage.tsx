import { useState, useEffect } from 'react';
import { proxyImage } from '@/lib/imageProxy';

interface ProductImageProps {
  src: string | null | undefined;
  title: string | null | undefined;
  size?: number;
  borderRadius?: number;
}

export function ProductImage({ src, title, size = 40, borderRadius = 6 }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  // Reset failure state if src changes
  useEffect(() => { setFailed(false); }, [src]);

  const initial = (title?.trim() || 'P').charAt(0).toUpperCase();

  if (!src || failed) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius,
        background: '#141417',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        color: '#52525b',
        flexShrink: 0,
      }}>
        {initial}
      </div>
    );
  }

  const proxied = proxyImage(src) ?? src;
  return (
    <img
      src={proxied}
      alt={title ?? 'Product'}
      loading="lazy"
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        border: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        display: 'block',
        background: '#0d0d10',
      }}
      onError={() => setFailed(true)}
    />
  );
}
