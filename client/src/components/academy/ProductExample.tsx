import { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp } from 'lucide-react';

interface ProductData {
  id: string;
  title: string;
  image: string | null;
  price_aud: number;
  orders: number;
  score: number;
  category: string;
  brief: string;
}

interface ProductExampleProps {
  category: string;
  caption?: string;
  seed?: number;
}

/**
 * Fetches a real product from the demo API and renders a dark card
 * with image, score badge, orders, and an educational caption.
 */
export function ProductExample({ category, caption, seed }: ProductExampleProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const seedParam = seed != null ? `&seed=${seed}` : '';
    fetch(`/api/demo/quick-score?category=${encodeURIComponent(category)}${seedParam}`)
      .then((r) => r.json())
      .then((body: { ok: boolean; product?: ProductData }) => {
        if (!cancelled && body.ok && body.product) {
          setProduct(body.product);
        }
      })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, [category, seed]);

  if (!product) return null;

  const imageUrl = product.image
    ? (product.image.includes('alicdn.com') || product.image.includes('aliexpress-media.com'))
      ? `/api/proxy/image?url=${encodeURIComponent(product.image)}`
      : product.image
    : null;

  return (
    <div
      className="my-6 overflow-hidden rounded-2xl border"
      style={{
        borderColor: 'rgba(79,142,247,0.12)',
        background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
      }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-48">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
            >
              <ShoppingBag size={32} className="text-[#4f8ef7]/30" />
            </div>
          )}
          {/* Score badge */}
          <div
            className="absolute right-3 top-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono font-bold"
            style={{
              background: product.score >= 90 ? 'rgba(16,185,129,0.9)' : product.score >= 75 ? 'rgba(245,158,11,0.9)' : 'rgba(249,115,22,0.9)',
              color: '#000',
            }}
          >
            <TrendingUp size={12} />
            {product.score}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
              Real product example
            </div>
            <h4
              className="mb-2 text-sm font-semibold leading-snug text-[#E0E0E0]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {product.title}
            </h4>
            <div className="flex flex-wrap gap-3 text-xs font-mono text-[#9CA3AF]">
              <span>${product.price_aud.toFixed(2)} AUD</span>
              <span>{product.orders.toLocaleString('en-AU')} orders</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
                {product.category}
              </span>
            </div>
          </div>
          {caption ? (
            <p className="mt-3 text-xs leading-relaxed text-[#6B7280] italic">
              {caption}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[#6B7280] italic">
              This product scored {product.score} — here's why Majorka flagged it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
