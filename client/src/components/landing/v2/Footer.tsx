// Footer v2 — Resend/Linear style, 4-column, cobalt accents.
import { Link } from 'wouter';
import { LT, F, MAX } from '@/lib/landingTokens';

const FOOTER_CSS = `
.mj-footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 48px;
}
.mj-footer-link { color: #6b7280; text-decoration: none; transition: color 150ms ease; }
.mj-footer-link:hover { color: #ffffff; }
.mj-footer-social { color: #6b7280; transition: color 150ms ease; display: inline-flex; align-items: center; }
.mj-footer-social:hover { color: #4f8ef7; }
@media (max-width: 1024px) {
  .mj-footer-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; }
}
@media (max-width: 640px) {
  .mj-footer-grid { grid-template-columns: 1fr; gap: 32px; }
}
`;

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
function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16h-4.267z" />
      <path d="M4 20l6.768 -6.768" />
      <path d="M13.232 10.768l6.768 -6.768" />
    </svg>
  );
}

const PRODUCT_LINKS = [
  { label: 'Dashboard', href: '/app' },
  { label: 'Products', href: '/app/products' },
  { label: 'Ad Copy', href: '/app/ads-studio' },
  { label: 'Store Builder', href: '/app/store-builder' },
  { label: 'Academy', href: '/academy' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Affiliate', href: '/affiliates' },
  { label: 'Contact', href: 'mailto:support@majorka.io' },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refund Policy', href: '/guarantee' },
  { label: 'Cookies', href: '/cookies' },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  if (href.startsWith('mailto:')) {
    return (
      <a href={href} className="mj-footer-link" style={{ fontFamily: F.body, fontSize: 14 }}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className="mj-footer-link" style={{ fontFamily: F.body, fontSize: 14 }}>
      {label}
    </Link>
  );
}

function LinkColumn({ heading, links }: { heading: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <div style={{
        fontFamily: F.body,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#4f8ef7',
        marginBottom: 16,
      }}>
        {heading}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {links.map((l) => (
          <li key={l.label}>
            <FooterLink label={l.label} href={l.href} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: '#04060f',
        borderTop: '1px solid #161b22',
        padding: '64px 24px',
      }}
    >
      <style>{FOOTER_CSS}</style>
      <div className="mj-footer-grid" style={{ maxWidth: MAX, margin: '0 auto' }}>
        {/* Brand */}
        <div>
          <div style={{
            fontFamily: F.display,
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}>
            Majorka
          </div>
          <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.6, color: '#8b949e', margin: '0 0 20px' }}>
            Product intelligence for AU/US/UK dropshippers.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { href: 'https://tiktok.com/@majorkaio', Icon: TikTokIcon },
              { href: 'https://instagram.com/majorkaio', Icon: InstagramIcon },
              { href: 'https://x.com/majorkaio', Icon: TwitterIcon },
            ].map(({ href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mj-footer-social"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <LinkColumn heading="Product" links={PRODUCT_LINKS} />
        <LinkColumn heading="Company" links={COMPANY_LINKS} />
        <LinkColumn heading="Legal" links={LEGAL_LINKS} />
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: MAX,
          margin: '48px auto 0',
          paddingTop: 20,
          borderTop: '1px solid #161b22',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontFamily: F.body,
          fontSize: 13,
          color: '#8b949e',
        }}
      >
        <span>&copy; 2026 Majorka Pty Ltd</span>
        <span>Built in Australia 🇦🇺</span>
      </div>
    </footer>
  );
}
