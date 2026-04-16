import { ShoppingBag, ArrowRight } from 'lucide-react';
import type { StoreTemplateProps } from './types';

export default function MagazineTemplate({
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
        background: '#faf9f7',
        color: '#1c1917',
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
          padding: `${px(20)} ${px(32)}`,
          borderBottom: '1px solid #e7e5e4',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: px(18), color: '#1c1917', fontStyle: 'italic', letterSpacing: '-0.01em' }}>
          {storeName}
        </div>
        {!isPreview && (
          <div style={{ display: 'flex', gap: px(22), fontSize: px(13), color: '#78716c', fontWeight: 500 }}>
            <span>Collection</span>
            <span>Story</span>
            <span>Contact</span>
          </div>
        )}
        <ShoppingBag size={18 * scale} color="#a8a29e" />
      </nav>

      {/* Hero — editorial, asymmetric */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isPreview ? '1fr' : '1fr 1fr',
          minHeight: isPreview ? px(250) : px(500),
        }}
      >
        <div style={{ padding: `${px(60)} ${px(32)}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: px(11), textTransform: 'uppercase', letterSpacing: '0.2em', color: colorPrimary, fontWeight: 600, marginBottom: px(14) }}>
            {tagline}
          </p>
          <h1 style={{ fontSize: px(38), fontWeight: 800, lineHeight: 1.12, marginBottom: px(16), letterSpacing: '-0.02em', color: '#0c0a09' }}>
            {heroHeadline}
          </h1>
          <p style={{ fontSize: px(15), color: '#78716c', lineHeight: 1.65, marginBottom: px(28), maxWidth: px(400) }}>
            {heroSubheadline}
          </p>
          <button
            style={{
              background: 'transparent',
              color: colorPrimary,
              border: `2px solid ${colorPrimary}`,
              padding: `${px(12)} ${px(28)}`,
              borderRadius: px(6),
              fontSize: px(13),
              fontWeight: 700,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: px(6),
            }}
          >
            Explore Collection <ArrowRight size={14 * scale} />
          </button>
        </div>
        {!isPreview && products[0]?.image && (
          <div style={{ background: '#e7e5e4', overflow: 'hidden' }}>
            <img
              src={products[0].image}
              alt={products[0].name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      {/* Products — magazine layout: alternating large/small */}
      {products.length > 0 && (
        <div style={{ maxWidth: px(960), margin: '0 auto', padding: `${px(48)} ${px(24)}` }}>
          <div style={{ textAlign: 'center', marginBottom: px(36) }}>
            <p style={{ fontSize: px(11), textTransform: 'uppercase', letterSpacing: '0.2em', color: colorPrimary, fontWeight: 600, marginBottom: px(8) }}>
              The Collection
            </p>
            <h2 style={{ fontSize: px(26), fontWeight: 800, letterSpacing: '-0.02em', color: '#0c0a09' }}>
              Curated for You
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isPreview ? '1fr' : 'repeat(2, 1fr)',
              gap: px(20),
            }}
          >
            {products.map((product, i) => {
              const isLarge = i === 0 && !isPreview;
              return (
                <div
                  key={i}
                  style={{
                    gridColumn: isLarge ? 'span 2' : 'span 1',
                    display: 'grid',
                    gridTemplateColumns: isLarge ? '1.2fr 1fr' : '1fr',
                    background: '#fff',
                    border: '1px solid #e7e5e4',
                    borderRadius: px(10),
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: isLarge ? px(360) : px(220),
                      background: '#f5f5f4',
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
                      <ShoppingBag size={40 * scale} color="#d6d3d1" />
                    )}
                  </div>
                  <div style={{ padding: px(isLarge ? 28 : 16), display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: px(isLarge ? 20 : 14), fontWeight: 700, marginBottom: px(8), color: '#0c0a09' }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: px(12), color: '#78716c', lineHeight: 1.6, marginBottom: px(14) }}>
                      {product.description.slice(0, isLarge ? 160 : 80)}
                      {product.description.length > (isLarge ? 160 : 80) ? '...' : ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: px(18), fontWeight: 800, color: '#0c0a09' }}>
                        ${product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onBuyNow?.(product)}
                        style={{
                          background: colorPrimary,
                          color: '#fff',
                          border: 'none',
                          padding: `${px(8)} ${px(18)}`,
                          borderRadius: px(6),
                          fontSize: px(11),
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: px(4),
                        }}
                      >
                        Buy Now <ArrowRight size={10 * scale} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* About — editorial block */}
      {aboutText && (
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #e7e5e4',
            borderBottom: '1px solid #e7e5e4',
          }}
        >
          <div
            style={{
              maxWidth: px(640),
              margin: '0 auto',
              padding: `${px(56)} ${px(24)}`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: px(11), textTransform: 'uppercase', letterSpacing: '0.2em', color: colorPrimary, fontWeight: 600, marginBottom: px(12) }}>
              Our Story
            </p>
            <h2 style={{ fontSize: px(22), fontWeight: 800, marginBottom: px(14), color: '#0c0a09' }}>
              About {storeName}
            </h2>
            <p style={{ fontSize: px(14), color: '#78716c', lineHeight: 1.75 }}>{aboutText}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: `${px(28)} ${px(16)}`,
          fontSize: px(11),
          color: '#a8a29e',
        }}
      >
        &copy; 2026 {storeName}. All rights reserved.
      </footer>
    </div>
  );
}
