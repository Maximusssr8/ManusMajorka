import { ShoppingBag } from 'lucide-react';
import type { StoreTemplateProps } from './types';

export default function CleanTemplate({
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
        background: '#ffffff',
        color: '#1a1a2e',
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
          padding: `${px(18)} ${px(32)}`,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: px(20), color: colorPrimary }}>
          {storeName}
        </div>
        {!isPreview && (
          <div style={{ display: 'flex', gap: px(24), fontSize: px(14), color: '#666' }}>
            <span>Shop</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        )}
        <ShoppingBag size={18 * scale} color="#999" />
      </nav>

      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          padding: `${px(80)} ${px(24)}`,
          maxWidth: px(640),
          margin: '0 auto',
        }}
      >
        <p style={{ fontSize: px(12), textTransform: 'uppercase', letterSpacing: '0.15em', color: colorPrimary, marginBottom: px(12), fontWeight: 600 }}>
          {tagline}
        </p>
        <h1 style={{ fontSize: px(42), fontWeight: 700, lineHeight: 1.15, marginBottom: px(16), color: '#0a0a0a' }}>
          {heroHeadline}
        </h1>
        <p style={{ fontSize: px(16), color: '#666', lineHeight: 1.6, marginBottom: px(28) }}>
          {heroSubheadline}
        </p>
        <button
          style={{
            background: colorPrimary,
            color: '#fff',
            border: 'none',
            padding: `${px(14)} ${px(36)}`,
            borderRadius: px(8),
            fontSize: px(14),
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Shop Now
        </button>
      </div>

      {/* Products */}
      {products.length > 0 && (
        <div style={{ maxWidth: px(960), margin: '0 auto', padding: `${px(40)} ${px(24)}` }}>
          <h2 style={{ textAlign: 'center', fontSize: px(24), fontWeight: 700, marginBottom: px(32), color: '#0a0a0a' }}>
            Our Products
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isPreview ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: px(24),
            }}
          >
            {products.map((product, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: px(12),
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    height: px(200),
                    background: '#f8f8f8',
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
                    <ShoppingBag size={40 * scale} color="#ddd" />
                  )}
                </div>
                <div style={{ padding: px(16) }}>
                  <h3 style={{ fontSize: px(14), fontWeight: 600, marginBottom: px(6), color: '#0a0a0a' }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: px(12), color: '#888', marginBottom: px(10), lineHeight: 1.5 }}>
                    {product.description.slice(0, 80)}{product.description.length > 80 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: px(18), fontWeight: 700, color: '#0a0a0a' }}>
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onBuyNow?.(product)}
                      style={{
                        background: '#0a0a0a',
                        color: '#fff',
                        border: 'none',
                        padding: `${px(8)} ${px(18)}`,
                        borderRadius: px(6),
                        fontSize: px(12),
                        fontWeight: 600,
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
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <h2 style={{ fontSize: px(22), fontWeight: 700, marginBottom: px(14), color: '#0a0a0a' }}>About Us</h2>
          <p style={{ fontSize: px(14), color: '#666', lineHeight: 1.7 }}>{aboutText}</p>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: `${px(24)} ${px(16)}`,
          borderTop: '1px solid #f0f0f0',
          fontSize: px(11),
          color: '#999',
        }}
      >
        &copy; 2026 {storeName}. All rights reserved.
      </footer>
    </div>
  );
}
