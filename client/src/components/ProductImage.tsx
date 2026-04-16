import { useState } from 'react';
import { NoImage } from './NoImage';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  size?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

const BLOCKED = ['picsum.photos', 'placeholder.com', 'via.placeholder', 'pexels.com', 'unsplash.com', 'images.unsplash', 'loremflickr'];
const ALI_DOMAINS = ['alicdn.com', 'aliexpress-media.com'];

function isValidUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  if (BLOCKED.some(d => url.includes(d))) return false;
  return url.startsWith('http');
}

/** Route AliExpress CDN images through our proxy to fix AVIF/format 404s */
function resolveImgSrc(url: string): string {
  if (url.startsWith('/api/')) return url;
  if (ALI_DOMAINS.some(d => url.includes(d))) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function ProductImage({ src, alt = 'Product', size = 44, borderRadius = 8, style }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  if (!isValidUrl(src) || errored) {
    return <NoImage size={size} />;
  }

  return (
    <img
      src={resolveImgSrc(src!)}
      alt={alt}
      onError={() => setErrored(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius,
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
