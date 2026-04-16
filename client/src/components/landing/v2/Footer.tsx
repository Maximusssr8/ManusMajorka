// Footer v2 — Academy-style: monospace column heads, Syne brand, DM Sans links,
// restrained cobalt accents.
import { Link } from 'wouter';
import { GradientM } from '@/components/MajorkaLogo';
import { F } from '@/lib/landingTokens';

const FOOTER_CSS = `
.mj-footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 48px;
}
.mj-footer-link { color: #6B7280; text-decoration: none; transition: color 150ms ease; }
.mj-footer-link:hover { color: #E0E0E0; }
.mj-footer-social { color: #6B7280; transition: color 150ms ease; display: inline-flex; align-items: center; }
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
function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
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
        fontFamily: F.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
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
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '64px 20px',
      }}
    >
      <style>{FOOTER_CSS}</style>
      <div className="mj-footer-grid" style={{ maxWidth: 1152, margin: '0 auto' }}>
        {/* Brand */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <GradientM size={28} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#E0E0E0',
              letterSpacing: '-0.02em',
            }}>
              Majorka
            </span>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.6, color: '#9CA3AF', margin: '0 0 20px' }}>
            Product intelligence for AU/US/UK dropshippers.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { href: '#', Icon: TikTokIcon },
              { href: 'https://www.instagram.com/majorkaaustralia/', Icon: InstagramIcon },
              { href: 'https://discord.gg/njVjqrG8', Icon: DiscordIcon },
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
          maxWidth: 1152,
          margin: '48px auto 0',
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          fontFamily: F.mono,
          fontSize: 11,
          color: '#6B7280',
          letterSpacing: '0.04em',
        }}
      >
        <span>&copy; 2026 Majorka Pty Ltd</span>
        <span>Built in Australia</span>
      </div>
    </footer>
  );
}
