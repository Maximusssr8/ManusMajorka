// Landing page navigation — sticky, palette-locked.
// Transparent at scrollY 0, solid at scrollY > 80.
// Desktop: centre nav links + right-side auth CTAs.
// Mobile (<768px): hamburger → full-screen overlay.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { LT, F, S, R } from '@/lib/landingTokens';

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

const CENTRE_LINKS: readonly NavLink[] = [
  { label: 'Product', href: '#features' },
  { label: 'Academy', href: '/academy' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'API Docs', href: '/docs' },
] as const;

interface LandingNavProps {
  topOffset?: number;
}

export default function LandingNav({ topOffset = 0 }: LandingNavProps) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while mobile menu open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string): boolean => {
    if (href.startsWith('#')) return false;
    return location === href;
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="mj-landing-nav"
        style={{
          position: 'fixed',
          top: topOffset,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 64,
          background: scrolled ? 'rgba(8,8,8,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
          borderBottom: scrolled ? `1px solid ${LT.border}` : '1px solid transparent',
          transition: 'background 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease',
        }}
      >
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          height: '100%',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>
          {/* LEFT: wordmark + Early Access pill */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          }}>
            <span style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.03em',
              color: LT.text,
              lineHeight: 1,
            }}>Majorka</span>
            <span style={{
              fontFamily: F.mono,
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: LT.gold,
              border: `1px solid ${LT.gold}`,
              padding: '3px 8px',
              borderRadius: 999,
              lineHeight: 1,
            }}>Early Access</span>
          </Link>

          {/* CENTRE: nav links (desktop only) */}
          <div
            className="mj-landing-nav-centre"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 32,
            }}
          >
            {CENTRE_LINKS.map((l) => {
              const active = isActive(l.href);
              return l.href.startsWith('#') ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="mj-nav-link"
                  data-active={active ? 'true' : 'false'}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="mj-nav-link"
                  data-active={active ? 'true' : 'false'}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: auth CTAs (desktop) */}
          <div
            className="mj-landing-nav-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Link
              href="/sign-in"
              className="mj-nav-signin"
              style={{
                fontFamily: F.body,
                fontSize: 14,
                fontWeight: 500,
                color: LT.textMute,
                textDecoration: 'none',
                padding: '8px 12px',
                transition: 'color 150ms ease',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                background: LT.gold,
                color: LT.bg,
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 14,
                borderRadius: R.button,
                textDecoration: 'none',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                boxShadow: '0 0 0 rgba(212,175,55,0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,175,55,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 0 rgba(212,175,55,0)';
              }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* MOBILE: compact CTA + hamburger */}
          <div
            className="mj-landing-nav-mobile"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Link
              href="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 14px',
                background: LT.gold,
                color: LT.bg,
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 13,
                borderRadius: R.button,
                textDecoration: 'none',
                minHeight: 44,
              }}
            >
              Start Free
            </Link>
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              style={{
                width: 44,
                height: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: `1px solid ${LT.border}`,
                borderRadius: R.button,
                color: LT.text,
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
                <rect width="18" height="2" rx="1" fill="currentColor" />
                <rect y="6" width="18" height="2" rx="1" fill="currentColor" />
                <rect y="12" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        <style>{`
          .mj-nav-link {
            font-family: ${F.body};
            font-size: 14px;
            color: ${LT.textMute};
            text-decoration: none;
            position: relative;
            padding: 8px 2px;
            transition: color 200ms ease;
          }
          .mj-nav-link::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 2px;
            height: 2px;
            background: ${LT.gold};
            transform: scaleX(0);
            transform-origin: left center;
            transition: transform 200ms ease;
          }
          .mj-nav-link:hover {
            color: ${LT.text};
          }
          .mj-nav-link:hover::after {
            transform: scaleX(1);
          }
          .mj-nav-link[data-active="true"] {
            color: ${LT.text};
          }
          .mj-nav-link[data-active="true"]::after {
            transform: scaleX(1);
          }
          .mj-nav-signin:hover {
            color: ${LT.text} !important;
          }
          @media (max-width: 900px) {
            .mj-landing-nav-centre { display: none !important; }
            .mj-landing-nav-actions { display: none !important; }
            .mj-landing-nav-mobile { display: inline-flex !important; }
          }
        `}</style>
      </nav>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(8,8,8,0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: S.md,
          }}
        >
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              background: LT.bgCard,
              border: `1px solid ${LT.border}`,
              borderRadius: R.button,
              color: LT.text,
              fontSize: 22,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>

          {CENTRE_LINKS.map((l) => (
            l.href.startsWith('#') ? (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: F.body,
                  fontSize: 18,
                  fontWeight: 500,
                  color: LT.text,
                  textDecoration: 'none',
                  padding: '12px 24px',
                  minHeight: 44,
                }}
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: F.body,
                  fontSize: 18,
                  fontWeight: 500,
                  color: LT.text,
                  textDecoration: 'none',
                  padding: '12px 24px',
                  minHeight: 44,
                }}
              >
                {l.label}
              </Link>
            )
          ))}

          <div style={{
            marginTop: S.md,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: 280,
          }}>
            <Link
              href="/sign-in"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                border: `1px solid ${LT.border}`,
                borderRadius: R.button,
                color: LT.text,
                textDecoration: 'none',
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                background: LT.gold,
                borderRadius: R.button,
                color: LT.bg,
                textDecoration: 'none',
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
