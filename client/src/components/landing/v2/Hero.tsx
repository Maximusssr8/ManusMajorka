import { useState, useEffect } from 'react';

export function Hero() {
  const [products, setProducts] = useState<any[]>([]);
  const [frameHover, setFrameHover] = useState(false);
  const [cta1Hover, setCta1Hover] = useState(false);
  const [cta2Hover, setCta2Hover] = useState(false);

  useEffect(() => {
    const cats = ['Pet', 'Kitchen', 'Home', 'Beauty'];
    Promise.all(
      cats.map((c, i) =>
        fetch(`/api/demo/quick-score?category=${c}&seed=${i}`)
          .then((r) => r.json())
          .then((d) => d.product)
          .catch(() => null)
      )
    ).then((ps) => setProducts(ps.filter(Boolean)));
  }, []);

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
@keyframes mjPulse {
  0% { box-shadow: 0 0 0 0 rgba(79,142,247,0.4) }
  70% { box-shadow: 0 0 0 8px rgba(79,142,247,0) }
  100% { box-shadow: 0 0 0 0 rgba(79,142,247,0) }
}
@keyframes mjDrawLine {
  to { transform: scaleX(1) }
}
@keyframes mjFadeSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(8px) }
  to { opacity: 1; transform: scale(1) translateY(0) }
}
@media (max-width: 768px) {
  .mj-hero-badges { display: none !important; }
  .mj-hero-frame { transform: none !important; }
  .mj-hero-frame:hover { transform: none !important; }
  .mj-hero-grid { grid-template-columns: 1fr !important; }
  .mj-hero-sidebar { display: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  .mj-hero-underline { transform: scaleX(1) !important; animation: none !important; }
  .mj-hero-badges > div { opacity: 1 !important; animation: none !important; }
}
      `}</style>

      {/* Background Layer 1 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: '#04060f' }} />
      {/* Background Layer 2 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 900px 500px at 50% -100px, rgba(79,142,247,0.10) 0%, transparent 70%)' }} />
      {/* Background Layer 3 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Background Layer 4 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(to bottom, transparent 60%, #04060f 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>

        {/* ROW 1 — Eyebrow pill */}
        <span
          style={{
            border: '1px solid rgba(79,142,247,0.3)',
            borderRadius: 9999,
            padding: '6px 16px',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: '#4f8ef7',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 32,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f8ef7', animation: 'mjPulse 2s infinite' }} />
          AI Product Intelligence · AU / US / UK
        </span>

        {/* ROW 2 — H1 */}
        <h1
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 'clamp(52px,8vw,96px)',
            fontWeight: 900,
            lineHeight: 1.0,
            color: '#fff',
            marginBottom: 24,
            letterSpacing: '-0.03em',
          }}
        >
          The{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            unfair
            <span
              className="mj-hero-underline"
              style={{
                position: 'absolute',
                bottom: -4,
                left: 0,
                height: 3,
                width: '100%',
                background: '#4f8ef7',
                transform: 'scaleX(0)',
                transformOrigin: 'left',
                animation: 'mjDrawLine 0.8s 0.5s cubic-bezier(0.65,0,0.35,1) forwards',
              }}
            />
          </span>{' '}
          advantage
          <br />
          for dropshippers.
        </h1>

        {/* ROW 3 — Sub */}
        <p
          style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 19,
            color: '#8b949e',
            lineHeight: 1.65,
            maxWidth: 560,
            margin: '0 auto 40px',
          }}
        >
          Majorka analyses millions of AliExpress listings and surfaces the ones worth selling — ranked by real order velocity before you spend a dollar on ads.
        </p>

        {/* ROW 4 — CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <a
            href="/sign-up"
            onMouseEnter={() => setCta1Hover(true)}
            onMouseLeave={() => setCta1Hover(false)}
            style={{
              background: cta1Hover ? '#3a7de0' : '#4f8ef7',
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textDecoration: 'none',
              transform: cta1Hover ? 'scale(1.02)' : 'scale(1)',
              boxShadow: cta1Hover ? '0 0 40px rgba(79,142,247,0.35)' : 'none',
            }}
          >
            Get Started →
          </a>
          <a
            href="#demo"
            onMouseEnter={() => setCta2Hover(true)}
            onMouseLeave={() => setCta2Hover(false)}
            style={{
              background: 'transparent',
              color: cta2Hover ? '#fff' : '#9ca3af',
              border: cta2Hover ? '1px solid #4f8ef7' : '1px solid rgba(255,255,255,0.12)',
              padding: '16px 32px',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textDecoration: 'none',
            }}
          >
            Watch Demo
          </a>
        </div>

        {/* ROW 5 — Trust */}
        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 72 }}>
          ✓ No credit card  ·  ✓ Cancel anytime  ·  ✓ 30-day guarantee
        </p>

        {/* ROW 6 — HERO VISUAL */}
        <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

          {/* Browser chrome frame */}
          <div
            className="mj-hero-frame"
            onMouseEnter={() => setFrameHover(true)}
            onMouseLeave={() => setFrameHover(false)}
            style={{
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 0 0 1px #161b22, 0 32px 64px -16px rgba(0,0,0,0.7), 0 0 80px -20px rgba(79,142,247,0.15)',
              transform: frameHover ? 'perspective(1200px) rotateX(0deg)' : 'perspective(1200px) rotateX(3deg)',
              transition: 'transform 0.6s ease',
            }}
          >
            {/* Chrome bar */}
            <div
              style={{
                height: 36,
                background: '#080c14',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 8,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <div
                style={{
                  background: '#0d1117',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  color: '#6b7280',
                  width: 220,
                  margin: '0 auto',
                }}
              >
                majorka.io/app/products
              </div>
            </div>

            {/* Inner dashboard */}
            <div
              className="mj-hero-grid"
              style={{
                padding: 20,
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: 16,
                minHeight: 280,
              }}
            >
              {/* LEFT sidebar */}
              <div
                className="mj-hero-sidebar"
                style={{
                  background: '#080c14',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                {['Home', 'Products', 'Analytics', 'Maya AI', 'Ad Copy'].map((item) => {
                  const isActive = item === 'Products';
                  return (
                    <div
                      key={item}
                      style={{
                        fontSize: 13,
                        fontFamily: "'DM Sans',sans-serif",
                        marginBottom: 8,
                        color: isActive ? '#4f8ef7' : '#6b7280',
                        borderLeft: isActive ? '2px solid #4f8ef7' : '2px solid transparent',
                        paddingLeft: isActive ? 8 : 8,
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>

              {/* RIGHT main */}
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 4 }}>
                  Products
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                  Ranked by real order velocity
                </div>

                {/* Product rows */}
                {products.map((p, i) => (
                  <div
                    key={p?.id ?? i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: '1px solid #161b22',
                    }}
                  >
                    <img
                      src={'/api/image-proxy?url=' + encodeURIComponent(p.image || '')}
                      style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: '#161b22' }}
                      onError={(e) => { e.currentTarget.style.background = '#161b22'; }}
                      alt=""
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f9fafb', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title && p.title.length > 38 ? p.title.slice(0, 38) + '...' : p.title}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 11 }}>
                        {p.orders?.toLocaleString() + ' orders'}
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#1e3a5f',
                        color: '#4f8ef7',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {p.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FLOATING BADGES */}
          <div className="mj-hero-badges" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#4f8ef7',
                whiteSpace: 'nowrap',
                animation: 'mjFadeSlideIn 0.5s 1s both',
                transform: 'rotate(3deg)',
              }}
            >
              ↑ 48,210 orders today
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -16,
                left: -16,
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#10b981',
                whiteSpace: 'nowrap',
                animation: 'mjFadeSlideIn 0.5s 1.2s both',
                transform: 'rotate(-2deg)',
              }}
            >
              Score: 97 · AU demand 49%
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -16,
                right: -16,
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#f59e0b',
                whiteSpace: 'nowrap',
                animation: 'mjFadeSlideIn 0.5s 1.4s both',
                transform: 'rotate(2deg)',
              }}
            >
              🔔 Price dropped 12%
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
