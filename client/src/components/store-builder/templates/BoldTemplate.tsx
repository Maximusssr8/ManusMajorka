import { ShoppingBag, Star, Shield, Truck, RotateCcw } from 'lucide-react';
import type { StoreTemplateProps } from './types';

export default function BoldTemplate({
  storeName,
  tagline,
  heroHeadline,
  heroSubheadline,
  aboutText,
  colorPrimary,
  products,
  isPreview = false,
  onBuyNow,
}: StoreTemplateProps) {
  const scale = isPreview ? 0.65 : 1;
  const px = (n: number) => `${n * scale}px`;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: '#09090b',
        color: '#fafafa',
        minHeight: isPreview ? 500 : '100vh',
        fontSize: px(16),
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${px(16)} ${px(28)}`,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: px(22), color: colorPrimary, letterSpacing: '-0.02em' }}>
          {storeName}
        </div>
        {!isPreview && (
          <div style={{ display: 'flex', gap: px(20), fontSize: px(13), color: 'rgba(255,255,255,0.5)' }}>
            <span>Home</span>
            <span>Shop</span>
            <span>About</span>
          </div>
        )}
        <ShoppingBag size={18 * scale} color="rgba(255,255,255,0.4)" />
      </nav>

      {/* Hero — full width, high impact */}
      <div
        style={{
          padding: `${px(80)} ${px(32)}`,
          textAlign: 'center',
          background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            fontSize: px(11),
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: colorPrimary,
            fontWeight: 700,
            marginBottom: px(14),
            padding: `${px(6)} ${px(16)}`,
            borderRadius: px(20),
            background: `${colorPrimary}15`,
            border: `1px solid ${colorPrimary}30`,
          }}
        >
          {tagline}
        </div>
        <h1 style={{ fontSize: px(48), fontWeight: 800, lineHeight: 1.1, marginBottom: px(16), letterSpacing: '-0.02em' }}>
          {heroHeadline}
        </h1>
        <p style={{ fontSize: px(16), color: 'rgba(255,255,255,0.5)', maxWidth: px(520), margin: `0 auto ${px(32)}`, lineHeight: 1.6 }}>
          {heroSubheadline}
        </p>
        <button
          style={{
            background: colorPrimary,
            color: '#fff',
            border: 'none',
            padding: `${px(16)} ${px(44)}`,
            borderRadius: px(10),
            fontSize: px(15),
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 8px 30px -8px ${colorPrimary}60`,
          }}
        >
          Shop Now
        </button>
      </div>

      {/* Trust strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: px(32),
          padding: `${px(16)} ${px(16)}`,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: Shield, text: 'Secure Checkout' },
          { icon: Truck, text: 'Fast Shipping' },
          { icon: RotateCcw, text: '30-Day Returns' },
          { icon: Star, text: '4.9 Rated' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: px(6), fontSize: px(11), color: 'rgba(255,255,255,0.4)' }}>
            <Icon size={12 * scale} /> {text}
          </div>
        ))}
      </div>

      {/* Products — full width grid */}
      {products.length > 0 && (
        <div style={{ padding: `${px(48)} ${px(24)}` }}>
          <h2 style={{ textAlign: 'center', fontSize: px(26), fontWeight: 800, marginBottom: px(32), letterSpacing: '-0.02em' }}>
            Featured Products
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isPreview ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: px(16),
              maxWidth: px(1000),
              margin: '0 auto',
            }}
          >
            {products.map((product, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: px(14),
                  overflow: 'hidden',
                  transition: 'border-color 200ms',
                }}
              >
                <div
                  style={{
                    height: px(220),
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <ShoppingBag size={40 * scale} color="rgba(255,255,255,0.1)" />
                  )}
                </div>
                <div style={{ padding: px(16) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: px(4), marginBottom: px(6) }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} size={10 * scale} fill={colorPrimary} color={colorPrimary} />
                    ))}
                    <span style={{ fontSize: px(10), color: 'rgba(255,255,255,0.3)', marginLeft: px(4) }}>
                      ({Math.floor(50 + i * 37) % 300 + 50})
                    </span>
                  </div>
                  <h3 style={{ fontSize: px(14), fontWeight: 700, marginBottom: px(8), color: '#fafafa' }}>
                    {product.name}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: px(20), fontWeight: 800, color: colorPrimary }}>
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onBuyNow?.(product)}
                      style={{
                        background: colorPrimary,
                        color: '#fff',
                        border: 'none',
                        padding: `${px(10)} ${px(20)}`,
                        borderRadius: px(8),
                        fontSize: px(12),
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      {aboutText && (
        <div
          style={{
            maxWidth: px(640),
            margin: '0 auto',
            padding: `${px(48)} ${px(24)}`,
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: px(22), fontWeight: 800, marginBottom: px(14) }}>Our Story</h2>
          <p style={{ fontSize: px(14), color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{aboutText}</p>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: `${px(24)} ${px(16)}`,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: px(11),
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        &copy; 2026 {storeName}. All rights reserved.
      </footer>
    </div>
  );
}
