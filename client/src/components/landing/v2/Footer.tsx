// Footer v2 — 4-column, cobalt accents, no animations.
import { Link } from 'wouter';
import { LT, F, MAX } from '@/lib/landingTokens';

const YEAR = new Date().getFullYear();

const COLS = [
  {
    heading: null,
    isBrand: true,
    links: [],
  },
  {
    heading: 'Product',
    isBrand: false,
    links: [
      { label: 'Dashboard', href: '/app' },
      { label: 'Products', href: '/app/products' },
      { label: 'Ad Copy', href: '/app/ads-studio' },
      { label: 'Store Builder', href: '/app/store-builder' },
      { label: 'Academy', href: '/academy' },
    ],
  },
  {
    heading: 'Company',
    isBrand: false,
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Affiliate', href: '/affiliates' },
      { label: 'Contact', href: 'mailto:support@majorka.io' },
    ],
  },
  {
    heading: 'Legal',
    isBrand: false,
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Refund', href: '/guarantee' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
] as const;

// Simple SVG social icons.
function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: LT.bg,
        borderTop: `1px solid ${LT.border}`,
        padding: '64px 24px 32px',
      }}
    >
      <div
        className="mj-footer-grid"
        style={{
          maxWidth: MAX,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 48,
        }}
      >
        {/* Brand column */}
        <div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 24,
              fontWeight: 800,
              color: LT.text,
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            Majorka<span style={{ color: LT.cobalt }}>.</span>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.6, color: LT.textMute, margin: '0 0 20px' }}>
            Product intelligence for AU / US / UK dropshippers.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { href: 'https://tiktok.com/@majorkaio', Icon: TikTokIcon },
              { href: 'https://instagram.com/majorkaio', Icon: InstagramIcon },
            ].map(({ href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mj-footer-social"
                style={{
                  color: LT.textMute,
                  transition: 'color 150ms ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {COLS.filter((c) => !c.isBrand).map((col) => (
          <div key={col.heading}>
            <div
              style={{
                fontFamily: F.body,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: LT.cobalt,
                marginBottom: 16,
              }}
            >
              {col.heading}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith('mailto:') ? (
                    <a
                      href={l.href}
                      className="mj-footer-link"
                      style={{
                        fontFamily: F.body,
                        fontSize: 14,
                        color: LT.textMute,
                        textDecoration: 'none',
                        transition: 'color 150ms ease',
                      }}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="mj-footer-link"
                      style={{
                        fontFamily: F.body,
                        fontSize: 14,
                        color: LT.textMute,
                        textDecoration: 'none',
                        transition: 'color 150ms ease',
                      }}
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: MAX,
          margin: '48px auto 0',
          paddingTop: 20,
          borderTop: `1px solid ${LT.border}`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontFamily: F.body,
          fontSize: 13,
          color: LT.textMute,
        }}
      >
        <span>&copy; {YEAR} Majorka Pty Ltd. All rights reserved.</span>
        <span>Built in Australia 🇦🇺</span>
      </div>
    </footer>
  );
}
