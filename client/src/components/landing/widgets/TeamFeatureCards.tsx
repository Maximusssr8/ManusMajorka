import { useEffect, useState, type ReactNode } from 'react';
import { TerminalHero } from './TerminalHero';

interface Card {
  icon: ReactNode;
  heading: string;
  body: string;
}

const CARDS: Card[] = [
  {
    icon: <TerminalHero text=">_ship" size={28} colour="#0D0D0D" />,
    heading: 'Ship better products, faster',
    body: 'Automate winning-product discovery and continuously scan AliExpress for breakout trends before your competitors.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    heading: 'Built for how your team works',
    body: 'Run Majorka locally, in the cloud, or plug into your existing Shopify store, Meta Ads, and Slack workflows.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    heading: 'Enterprise-ready',
    body: 'Advanced analytics, 100+ integrations, role-based access control, and full security compliance for scaling teams.',
  },
];

export function TeamFeatureCards() {
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
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: 16,
      width: '100%',
      maxWidth: 1152,
      margin: '40px auto 0',
      padding: '0 24px',
      boxSizing: 'border-box',
    }}>
      {CARDS.map((card, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: isMobile ? 16 : 24,
          padding: '28px 24px',
          minHeight: 312,
          display: 'flex',
          flexDirection: 'column',
          transition: 'background 200ms ease',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
            {card.icon}
          </div>
          <h3 style={{
            marginTop: 40,
            marginBottom: 0,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 30,
            lineHeight: '36px',
            fontWeight: 500,
            color: 'white',
            letterSpacing: '-0.02em',
          }}>{card.heading}</h3>
          <p style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            lineHeight: '28px',
            color: 'rgba(255,255,255,0.7)',
          }}>{card.body}</p>
        </div>
      ))}
    </div>
  );
}
