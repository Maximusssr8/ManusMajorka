import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import {
  ShoppingBag, Shield, RotateCcw, Truck, Star, Check, ChevronDown, ChevronUp,
  Mail, ExternalLink,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
 * Public Storefront — renders at /store/:slug
 * Fetches store data from API, applies the chosen template style,
 * supports Stripe Checkout for payment.
 * ──────────────────────────────────────────────────────────────── */

interface StoreProduct {
  id: string;
  productId: string;
  price: string;
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
  image_url?: string | null;
  stripePriceId?: string | null;
  product?: {
    name: string;
    description?: string;
    image_url?: string | null;
  };
}

interface GeneratedCopy {
  tagline?: string;
  hero_headline?: string;
  hero_subheading?: string;
  hero_cta?: string;
  about_text?: string;
  trust_badges?: string[];
  faq?: Array<{ question: string; answer: string }>;
}

interface StoreData {
  store: {
    id: string;
    storeName: string;
    storeSlug: string;
    brandColorPrimary?: string;
    stripePublishableKey?: string | null;
    generatedCopy?: GeneratedCopy;
    template?: string;
    niche?: string;
  };
  products: StoreProduct[];
}

function MetaPixel({ pixelId }: { pixelId: string }) {
  useEffect(() => {
    if (!pixelId || (window as Record<string, unknown>).fbq) return;
    const safePixelId = pixelId.replace(/[^0-9]/g, '');
    if (!safePixelId) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    script.onload = () => {
      const fbq = (window as Record<string, unknown>).fbq as ((...args: unknown[]) => void) | undefined;
      if (fbq) {
        fbq('init', safePixelId);
        fbq('track', 'PageView');
      }
    };
  }, [pixelId]);
  return null;
}

// Proxy images through Majorka's image proxy to avoid CORS
function proxyImage(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/api/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number[]>([]);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/store/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject('Store not found')))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Check for Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccessMessage(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleBuyNow = useCallback(async (product: StoreProduct) => {
    const stripeKey = data?.store.stripePublishableKey;
    const priceId = product.stripePriceId;

    if (stripeKey && priceId) {
      // Stripe Checkout — use the store OWNER's Stripe key
      try {
        const stripe = await loadStripe(stripeKey);
        if (!stripe) return;
        // @ts-expect-error — redirectToCheckout exists at runtime but was removed from @stripe/stripe-js types in v4+
        const { error } = await stripe.redirectToCheckout({
          lineItems: [{ price: priceId, quantity: 1 }],
          mode: 'payment',
          successUrl: `${window.location.origin}/store/${slug}?success=true`,
          cancelUrl: `${window.location.origin}/store/${slug}`,
        });
        if (error) {
          // Fallback to contact
          window.location.href = `mailto:?subject=Order%20inquiry%20-%20${encodeURIComponent(product.product?.name || 'Product')}`;
        }
      } catch {
        window.location.href = `mailto:?subject=Order%20inquiry%20-%20${encodeURIComponent(product.product?.name || 'Product')}`;
      }
    } else {
      // No Stripe — mailto fallback
      window.location.href = `mailto:?subject=I%27d%20like%20to%20order%20${encodeURIComponent(product.product?.name || 'Product')}&body=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(product.product?.name || 'this product')}%20(%24${product.price}%20AUD).%20Please%20send%20me%20payment%20details.`;
    }
  }, [data, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <ShoppingBag className="w-12 h-12 text-neutral-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Store not found</h1>
        <p className="text-neutral-400">This store doesn't exist or has been deactivated.</p>
      </div>
    );
  }

  const { store, products } = data;
  const accent = store.brandColorPrimary || '#4f8ef7';
  const copy = store.generatedCopy || {};
  const template = store.template || 'bold';
  const hasStripe = Boolean(store.stripePublishableKey);

  // Template-driven colour choices
  const isLight = ['minimal', 'clean', 'warm', 'high-energy', 'magazine'].includes(template);
  const bg = isLight ? '#faf9f7' : '#09090b';
  const textPrimary = isLight ? '#0c0a09' : '#fafafa';
  const textSecondary = isLight ? '#78716c' : 'rgba(255,255,255,0.5)';
  const textMuted = isLight ? '#a8a29e' : 'rgba(255,255,255,0.3)';
  const borderColor = isLight ? '#e7e5e4' : 'rgba(255,255,255,0.08)';
  const surfaceColor = isLight ? '#ffffff' : 'rgba(255,255,255,0.04)';
  const cardBg = isLight ? '#fff' : 'rgba(255,255,255,0.03)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textPrimary, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Success banner */}
      {successMessage && (
        <div
          style={{
            background: '#10b981',
            color: '#fff',
            textAlign: 'center',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Check size={16} /> Order placed successfully! Thank you for your purchase.
        </div>
      )}

      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${borderColor}`,
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>
          {store.storeName}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <nav style={{ display: 'flex', gap: 20, fontSize: 13, color: textSecondary }}>
            <a href="#products" style={{ textDecoration: 'none', color: 'inherit' }}>Shop</a>
            {copy.about_text && <a href="#about" style={{ textDecoration: 'none', color: 'inherit' }}>About</a>}
            {copy.faq && copy.faq.length > 0 && <a href="#faq" style={{ textDecoration: 'none', color: 'inherit' }}>FAQ</a>}
          </nav>
          <ShoppingBag size={18} color={textMuted} />
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: '80px 24px',
          textAlign: 'center',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {copy.tagline && (
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: accent,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            {copy.tagline}
          </p>
        )}
        <h2
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          {copy.hero_headline || `Welcome to ${store.storeName}`}
        </h2>
        <p style={{ fontSize: 17, color: textSecondary, lineHeight: 1.6, marginBottom: 32, maxWidth: 540, margin: '0 auto 32px' }}>
          {copy.hero_subheading || 'Premium products curated for quality and value.'}
        </p>
        <a
          href="#products"
          style={{
            display: 'inline-block',
            background: accent,
            color: '#fff',
            padding: '14px 40px',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: `0 8px 30px -8px ${accent}60`,
          }}
        >
          {copy.hero_cta || 'Shop Now'}
        </a>
      </section>

      {/* Trust badges */}
      {copy.trust_badges && copy.trust_badges.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 28,
            padding: '14px 16px',
            borderTop: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            flexWrap: 'wrap',
          }}
        >
          {copy.trust_badges.map((badge, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: textSecondary }}>
              {i === 0 && <Shield size={13} />}
              {i === 1 && <Truck size={13} />}
              {i === 2 && <RotateCcw size={13} />}
              {i === 3 && <Star size={13} />}
              {badge}
            </div>
          ))}
        </div>
      )}

      {/* Products */}
      <section id="products" style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px' }}>
        <h3 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 36, letterSpacing: '-0.02em' }}>
          Featured Products
        </h3>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: textMuted, fontSize: 15 }}>
            No products published yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {products.map((p) => {
              const imageUrl = p.image_url || p.product?.image_url;
              return (
                <div
                  key={p.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color 200ms, transform 200ms',
                  }}
                >
                  {/* Product image */}
                  <div
                    style={{
                      aspectRatio: '1',
                      background: surfaceColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={proxyImage(imageUrl)}
                        alt={p.product?.name || 'Product'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ShoppingBag size={40} color={textMuted} />
                    )}
                  </div>

                  <div style={{ padding: 18 }}>
                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} size={12} fill={accent} color={accent} />
                      ))}
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
                      {p.seoTitle || p.product?.name || 'Product'}
                    </h4>

                    {(p.seoDescription || p.product?.description) && (
                      <p style={{ fontSize: 13, color: textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
                        {(p.seoDescription || p.product?.description || '').slice(0, 100)}
                        {(p.seoDescription || p.product?.description || '').length > 100 ? '...' : ''}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 800 }}>
                        ${parseFloat(p.price || '0').toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleBuyNow(p)}
                        style={{
                          background: accent,
                          color: '#fff',
                          border: 'none',
                          padding: '10px 22px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {hasStripe ? 'Buy Now' : (
                          <>
                            <Mail size={13} /> Contact Seller
                          </>
                        )}
                      </button>
                    </div>

                    {hasStripe && !p.stripePriceId && (
                      <div style={{ marginTop: 8, fontSize: 11, color: textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={10} /> Payment link — contact seller
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* About */}
      {copy.about_text && (
        <section
          id="about"
          style={{
            borderTop: `1px solid ${borderColor}`,
            background: surfaceColor,
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>About {store.storeName}</h3>
            <p style={{ fontSize: 15, color: textSecondary, lineHeight: 1.75 }}>{copy.about_text}</p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {copy.faq && copy.faq.length > 0 && (
        <section id="faq" style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px' }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>
            Frequently Asked Questions
          </h3>
          {copy.faq.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom: `1px solid ${borderColor}`,
                padding: '16px 0',
              }}
            >
              <button
                onClick={() =>
                  setExpandedFaq((prev) =>
                    prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                  )
                }
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: textPrimary,
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {item.question}
                {expandedFaq.includes(i) ? (
                  <ChevronUp size={16} color={textMuted} />
                ) : (
                  <ChevronDown size={16} color={textMuted} />
                )}
              </button>
              {expandedFaq.includes(i) && (
                <p style={{ fontSize: 13, color: textSecondary, marginTop: 10, lineHeight: 1.65 }}>
                  {item.answer}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Trust footer */}
      <div
        style={{
          borderTop: `1px solid ${borderColor}`,
          padding: '28px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            textAlign: 'center',
          }}
        >
          {[
            { icon: Shield, label: 'Secure Checkout' },
            { icon: RotateCcw, label: 'Easy Returns' },
            { icon: Truck, label: 'Fast Shipping' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Icon size={18} color={textMuted} />
              <span style={{ color: textMuted, fontSize: 12 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '20px 16px',
          borderTop: `1px solid ${borderColor}`,
          fontSize: 11,
          color: textMuted,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          &copy; 2026 {store.storeName}. All rights reserved.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 10 }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <a
            href="https://majorka.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            Powered by Majorka <ExternalLink size={8} />
          </a>
        </div>
      </footer>
    </div>
  );
}
