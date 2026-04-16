// Landing Nav v2 — Linear/Resend style: transparent → blur on scroll.
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Menu, X } from 'lucide-react';
import { LT, F, MAX } from '@/lib/landingTokens';

const NAV_CSS = `
.mj-nav-links { display: flex; }
.mj-nav-cta-desk { display: inline-flex; }
.mj-nav-mobile { display: none !important; }
@media (max-width: 768px) {
  .mj-nav-links { display: none !important; }
  .mj-nav-cta-desk { display: none !important; }
  .mj-nav-mobile { display: flex !important; }
}
`;

const NAV_ITEMS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Academy', href: '/academy' },
];

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
      <style>{NAV_CSS}</style>
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
          borderBottom: scrolled ? '1px solid #161b22' : '1px solid transparent',
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
          {/* Wordmark */}
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              fontFamily: F.display,
              fontSize: 20,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Majorka
          </Link>

          {/* Center links (desktop) */}
          <div
            className="mj-nav-links"
            style={{
              alignItems: 'center',
              gap: 32,
            }}
          >
            {NAV_ITEMS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  fontFamily: F.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#8b949e',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; }}
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
              alignItems: 'center',
              padding: '10px 20px',
              background: '#4f8ef7',
              color: '#ffffff',
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'filter 150ms ease',
            }}
          >
            Get Started
          </Link>

          {/* Mobile: CTA + hamburger */}
          <div className="mj-nav-mobile" style={{ alignItems: 'center', gap: 12 }}>
            <Link
              href="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 16px',
                background: '#4f8ef7',
                color: '#ffffff',
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Get Started
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                minWidth: 44,
                minHeight: 44,
                background: 'transparent',
                border: '1px solid #161b22',
                borderRadius: 10,
                color: '#ffffff',
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

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: topOffset + 64,
            zIndex: 999,
            background: '#04060f',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {NAV_ITEMS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: F.display,
                fontSize: 24,
                fontWeight: 600,
                color: '#ffffff',
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
