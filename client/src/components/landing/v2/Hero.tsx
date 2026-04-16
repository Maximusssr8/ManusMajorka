// Hero v2 — centred Codex/Linear-grade hero with live 3-product browser mockup.
import { useEffect, useState } from 'react';
import { LT, F, R, SHADOW, MAX } from '@/lib/landingTokens';
import { EyebrowPill, CtaPrimary, CtaGhost } from './shared';

interface DemoProduct {
  id: string;
  title: string;
  image: string | null;
  orders: number;
  score: number;
  category: string;
}

const HERO_CATEGORIES = ['Pet', 'Kitchen', 'Home'] as const;

async function fetchDemoProduct(category: string): Promise<DemoProduct | null> {
  try {
    const res = await fetch(`/api/demo/quick-score?category=${category}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.ok || !json.product) return null;
    return {
      id: json.product.id,
      title: json.product.title,
      image: json.product.image,
      orders: json.product.orders ?? 0,
      score: json.product.score ?? 0,
      category: json.product.category ?? category,
    };
  } catch {
    return null;
  }
}

function proxyImage(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function ProductCard({ p, loading }: { p: DemoProduct | null; loading: boolean }) {
  if (loading || !p) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${LT.border}`,
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 140,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '90%' }} />
            <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '60%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 56, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ width: 80, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
    );
  }
  const title = p.title.length > 40 ? p.title.slice(0, 39).trimEnd() + '…' : p.title;
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${LT.border}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
            flexShrink: 0,
          }}
        >
          {p.image ? (
            <img
              src={proxyImage(p.image)}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 15,
              fontWeight: 600,
              color: LT.text,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: F.mono,
              fontSize: 13,
              color: LT.textMute,
            }}
          >
            {p.orders.toLocaleString('en-AU')} orders
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            fontWeight: 600,
            color: LT.cobalt,
            background: LT.cobaltTint,
            borderRadius: 999,
            padding: '2px 10px',
            letterSpacing: '0.04em',
          }}
        >
          {p.score} SCORE
        </span>
        <span
          style={{
            fontFamily: F.body,
            fontSize: 10,
            fontWeight: 500,
            color: LT.textMute,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 999,
            padding: '3px 10px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {p.category}
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  const [products, setProducts] = useState<(DemoProduct | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(HERO_CATEGORIES.map((c) => fetchDemoProduct(c)));
      if (cancelled) return;
      const withFallback = results.map((r, i) => r ?? {
        id: `fallback-${i}`,
        title: `${HERO_CATEGORIES[i]} — loading product data`,
        image: null,
        orders: 0,
        score: 0,
        category: HERO_CATEGORIES[i],
      });
      setProducts(withFallback);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 120,
        paddingBottom: 96,
        paddingLeft: 24,
        paddingRight: 24,
        background: LT.bg,
        overflow: 'hidden',
      }}
    >
      {/* Single radial glow — the only gradient on the page */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(800px circle at 50% 40%, ${LT.cobaltGlow}, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ maxWidth: MAX, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <EyebrowPill>AI Product Intelligence — AU / US / UK</EyebrowPill>
        </div>

        <h1
          className="mj-hero-h1"
          style={{
            fontFamily: F.display,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: LT.text,
            margin: '0 auto',
            maxWidth: 900,
          }}
        >
          Find your next{' '}
          <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
            winning product
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -6,
                height: 2,
                background: LT.cobalt,
                borderRadius: 2,
              }}
            />
          </span>{' '}
          before anyone else.
        </h1>

        <p
          style={{
            fontFamily: F.body,
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1.6,
            color: LT.textMute,
            margin: '24px auto 0',
            maxWidth: 640,
          }}
        >
          Majorka tracks 4,155+ products across AliExpress and CJ, scoring each one for demand, margin, and AU market fit.
        </p>

        <div
          className="mj-hero-ctas"
          style={{
            marginTop: 40,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <CtaPrimary href="/sign-up">Start Free Trial</CtaPrimary>
          <CtaGhost href="#features">See How It Works</CtaGhost>
        </div>

        {/* Browser-frame mockup */}
        <div
          className="mj-hero-mockup-wrap"
          style={{
            marginTop: 64,
            maxWidth: 1120,
            marginLeft: 'auto',
            marginRight: 'auto',
            perspective: '1200px',
          }}
        >
          <div
            className="mj-hero-mockup"
            style={{
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.card,
              boxShadow: SHADOW.hero,
              overflow: 'hidden',
              transformOrigin: 'top center',
              transform: 'rotateX(6deg)',
            }}
          >
            {/* Chrome bar */}
            <div
              style={{
                height: 36,
                borderBottom: `1px solid ${LT.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 8,
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
              <span
                style={{
                  marginLeft: 16,
                  fontFamily: F.mono,
                  fontSize: 11,
                  color: '#52525b',
                }}
              >
                majorka.io/app/products
              </span>
            </div>
            {/* Canvas: 3-up product grid */}
            <div
              className="mj-hero-grid"
              style={{
                padding: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 16,
                background: LT.bgCard,
              }}
            >
              {products.map((p, i) => (
                <ProductCard key={i} p={p} loading={loading} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
