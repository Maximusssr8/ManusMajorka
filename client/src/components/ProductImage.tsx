import { useState } from 'react';
import { NoImage } from './NoImage';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  size?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function ProductImage({ src, alt = 'Product', size = 44, borderRadius = 8, style }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  const isValidUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (url.trim() === '') return false;
    // Block placeholder/fake sources
    if (url.includes('picsum.photos')) return false;
    if (url.includes('placeholder.com')) return false;
    if (url.includes('via.placeholder')) return false;
    // Allow pexels as fallback for now (until affiliate API is live)
    return url.startsWith('http');
  };

  if (!isValidUrl(src) || errored) {
    return <NoImage size={size} />;
  }

  return (
    <img
      src={src!}
      alt={alt}
      onError={() => setErrored(true)}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        flexShrink: 0,
        border: '1px solid #F3F4F6',
        background: '#F9FAFB',
        display: 'block',
        ...style,
      }}
    />
  );
}
