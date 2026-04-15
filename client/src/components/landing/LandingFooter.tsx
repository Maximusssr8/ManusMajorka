// Landing page footer — 4 columns desktop, 2 columns tablet, 1 column mobile.
// Palette-locked. No emoji except flag and payment badges (text-only).

import { Link } from 'wouter';
import { LT, F, S } from '@/lib/landingTokens';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  heading: string;
  links: readonly FooterLink[];
}

const COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Dashboard', href: '/app' },
      { label: 'Products', href: '/app/products' },
      { label: 'Ads Studio', href: '/app/ads-studio' },
      { label: 'Store Builder', href: '/app/store-builder' },
      { label: 'Maya AI', href: '/app/ai-chat' },
      { label: 'Academy', href: '/academy' },
      { label: 'API Docs', href: '/docs' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Affiliate Program', href: '/affiliates' },
      { label: 'Contact', href: 'mailto:support@majorka.io', external: true },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/guarantee' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
] as const;

const SOCIAL_LINKS: readonly { label: string; href: string }[] = [
  { label: 'TikTok', href: 'https://tiktok.com/@majorkaio' },
  { label: 'Instagram', href: 'https://instagram.com/majorkaio' },
] as const;

function FooterLinkItem({ link, onHover }: { link: FooterLink; onHover: (el: HTMLElement, color: string) => void }) {
  const baseStyle: React.CSSProperties = {
    fontFamily: F.body,
    fontSize: 14,
    color: LT.textDim,
    textDecoration: 'none',
    lineHeight: 1.6,
    transition: 'color 150ms ease',
    display: 'inline-block',
    padding: '4px 0',
  };
  if (link.external) {
    return (
      <a
        href={link.href}
        target={link.href.startsWith('mailto:') ? undefined : '_blank'}
        rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        style={baseStyle}
        onMouseEnter={(e) => onHover(e.currentTarget, LT.textMute)}
        onMouseLeave={(e) => onHover(e.currentTarget, LT.textDim)}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      style={baseStyle}
      onMouseEnter={(e) => onHover(e.currentTarget, LT.textMute)}
      onMouseLeave={(e) => onHover(e.currentTarget, LT.textDim)}
    >
      {link.label}
    </Link>
  );
}

export default function LandingFooter() {
  const year = new Date().getFullYear();
  const setColor = (el: HTMLElement, c: string) => { el.style.color = c; };

  return (
    <footer
      style={{
        background: '#040404',
        borderTop: `1px solid ${LT.border}`,
        padding: `${S.xxl}px ${S.md}px ${S.md}px`,
      }}
    >
      <div
        className="mj-footer-grid"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: S.lg,
        }}
      >
        {/* BRAND COLUMN */}
        <div>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            marginBottom: S.sm,
          }}>
            <span style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '-0.03em',
              color: LT.text,
              lineHeight: 1,
            }}>Majorka</span>
          </Link>
          <p style={{
            fontFamily: F.body,
            fontSize: 14,
            color: LT.textDim,
            lineHeight: 1.6,
            margin: `0 0 ${S.md}px`,
            maxWidth: 300,
          }}>
            AI product intelligence for AU, US and UK dropshippers.
          </p>
          <div style={{
            display: 'flex',
            gap: 16,
            marginBottom: S.md,
          }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: F.body,
                  fontSize: 13,
                  color: LT.textDim,
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                  padding: '6px 0',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = LT.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = LT.textDim; }}
              >
                {s.label}
              </a>
            ))}
          </div>
          <div style={{
            fontFamily: F.body,
            fontSize: 12,
            color: LT.textDim,
          }}>
            Built in Australia <span aria-hidden="true">🇦🇺</span>
          </div>
        </div>

        {/* LINK COLUMNS */}
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <div style={{
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: LT.gold,
              marginBottom: S.sm,
            }}>
              {col.heading}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              {col.links.map((l) => (
                <FooterLinkItem key={l.label} link={l} onHover={setColor} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM BAR */}
      <div
        className="mj-footer-bottom"
        style={{
          maxWidth: 1200,
          margin: `${S.lg}px auto 0`,
          paddingTop: S.md,
          borderTop: `1px solid ${LT.border}`,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: S.md,
          fontFamily: F.body,
          fontSize: 12,
          color: '#4B5563',
        }}
      >
        <span>© {year} Majorka Pty Ltd. All rights reserved.</span>
        <span style={{ color: '#4B5563', textAlign: 'center' }}>ABN coming</span>
        <div
          className="mj-footer-payments"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
            color: '#4B5563',
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: '0.04em',
          }}
        >
          <span aria-hidden="true">VISA</span>
          <span aria-hidden="true">•</span>
          <span aria-hidden="true">Mastercard</span>
          <span aria-hidden="true">•</span>
          <span aria-hidden="true">Afterpay</span>
          <span aria-hidden="true">•</span>
          <span aria-hidden="true">PayPal</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mj-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
          .mj-footer-bottom {
            grid-template-columns: 1fr !important;
            text-align: center !important;
          }
          .mj-footer-payments {
            justify-content: center !important;
          }
        }
        @media (max-width: 520px) {
          .mj-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
