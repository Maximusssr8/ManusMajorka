/**
 * Logo marquee strip — desktop shows a centred flex row, mobile converts to
 * a CSS marquee animation with duplicated logos for seamless loop.
 *
 * Text-based logos used as placeholders since Majorka has no partner asset
 * files yet. Swap `LOGOS` array with real <img> entries when available.
 */
import { useEffect, useState } from 'react';

interface Logo {
  name: string;
  text: string;
  /** If set, renders an <img> instead of text. */
  src?: string;
  width?: number;
}

const LOGOS: Logo[] = [
  { name: 'Shopify',       text: 'SHOPIFY' },
  { name: 'AliExpress',    text: 'AliExpress' },
  { name: 'Meta Ads',      text: 'Meta' },
  { name: 'TikTok',        text: 'TikTok' },
  { name: 'Google Ads',    text: 'Google Ads' },
  { name: 'Supabase',      text: 'Supabase' },
];

const MARQUEE_STYLES = `
@keyframes mj-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.mj-logo-marquee {
  display: flex;
  gap: 40px;
  align-items: center;
  animation: mj-marquee 20s linear infinite;
  width: max-content;
}
`;

function LogoItem({ logo }: { logo: Logo }) {
  const [hover, setHover] = useState(false);
  const style: React.CSSProperties = {
    height: 44,
    display: 'flex',
    alignItems: 'center',
    opacity: hover ? 1 : 0.6,
    transition: 'opacity 200ms ease',
    flexShrink: 0,
  };
  return (
    <div
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={logo.name}
    >
      {logo.src ? (
        <img
          src={logo.src}
          alt={logo.name}
          style={{
            height: 44,
            width: logo.width ?? 'auto',
            filter: 'brightness(0) invert(1)',
          }}
        />
      ) : (
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}>{logo.text}</span>
      )}
    </div>
  );
}

export function LogoStrip() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{
      width: '100%',
      padding: '24px 24px 40px',
      maxWidth: 1152,
      margin: '0 auto',
    }}>
      <style>{MARQUEE_STYLES}</style>
      {isMobile ? (
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="mj-logo-marquee">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <LogoItem key={`${logo.name}-${i}`} logo={logo} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
          flexWrap: 'wrap',
        }}>
          {LOGOS.map((logo) => <LogoItem key={logo.name} logo={logo} />)}
        </div>
      )}
    </div>
  );
}
