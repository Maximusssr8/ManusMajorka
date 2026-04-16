// Landing Nav v2 — transparent at top, cobalt-tinted + blur after scroll.
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Menu, X } from 'lucide-react';
import { LT, F, MAX } from '@/lib/landingTokens';

export function Nav({ topOffset = 0 }: { topOffset?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: topOffset,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(4,6,15,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? `1px solid ${LT.border}` : '1px solid transparent',
          transition: 'background 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease',
          height: 64,
        }}
      >
        <div
          style={{
            maxWidth: MAX,
            margin: '0 auto',
            height: '100%',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              fontFamily: F.display,
              fontSize: 20,
              fontWeight: 800,
              color: LT.text,
              letterSpacing: '-0.02em',
            }}
          >
            Majorka
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: LT.cobalt,
              display: 'inline-block',
              marginLeft: 2,
            }} />
          </Link>

          {/* Desktop links */}
          <div
            className="mj-nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 32,
            }}
          >
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Academy', href: '/academy' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  fontFamily: F.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: LT.textMute,
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = LT.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = LT.textMute; }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <Link
            href="/sign-up"
            className="mj-nav-cta-desk"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              background: LT.cobalt,
              color: LT.text,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '0.02em',
              transition: 'filter 150ms ease',
            }}
          >
            Start Free
          </Link>

          {/* Mobile CTA + Hamburger */}
          <div className="mj-nav-mobile" style={{ display: 'none', alignItems: 'center', gap: 12 }}>
            <Link
              href="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 16px',
                background: LT.cobalt,
                color: LT.text,
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Start Free
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                minWidth: 44,
                minHeight: 44,
                background: 'transparent',
                border: `1px solid ${LT.border}`,
                borderRadius: 10,
                color: LT.text,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: topOffset + 64,
            zIndex: 999,
            background: LT.bg,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Academy', href: '/academy' },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: F.display,
                fontSize: 24,
                fontWeight: 600,
                color: LT.text,
                textDecoration: 'none',
                padding: '12px 0',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
