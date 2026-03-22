/**
 * SocialProofTicker — Fixed bottom-left real-time activity notifications.
 * Rotates through 20 AU sellers doing cool things.
 * Desktop only (hidden < 768px).
 * Dismissible (localStorage, 24h).
 */

import { useEffect, useState } from 'react';

// ── Notification list ─────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  { name: 'Jake', city: 'Brisbane QLD', action: 'found a $12,400/day product', icon: '🔥' },
  { name: 'Sarah', city: 'Sydney NSW', action: 'exported 3 products to Shopify', icon: '📦' },
  { name: 'Marcus', city: 'Melbourne VIC', action: 'discovered a winning niche', icon: '💡' },
  { name: 'Priya', city: 'Gold Coast QLD', action: 'spied on a $50k/month store', icon: '🔍' },
  { name: 'Tom', city: 'Perth WA', action: 'generated 5 Facebook ad sets', icon: '📱' },
  { name: 'Emma', city: 'Adelaide SA', action: 'found a supplier at 72% margin', icon: '💰' },
  { name: 'Liam', city: 'Sunshine Coast QLD', action: 'just went Pro', icon: '⭐' },
  { name: 'Olivia', city: 'Hobart TAS', action: 'built a store in 8 minutes', icon: '🏗️' },
  { name: 'Noah', city: 'Darwin NT', action: 'identified a $18,500/day trend', icon: '📈' },
  { name: 'Ava', city: 'Canberra ACT', action: 'found a product with 91% AU relevance', icon: '🇦🇺' },
  { name: 'Jack', city: 'Newcastle NSW', action: 'exported to Shopify successfully', icon: '✅' },
  { name: 'Isla', city: 'Wollongong NSW', action: 'found 3 trending pet products', icon: '🐾' },
  { name: 'William', city: 'Geelong VIC', action: 'hit $4,200 in first month sales', icon: '💎' },
  { name: 'Mia', city: 'Cairns QLD', action: 'discovered a viral beauty trend', icon: '💄' },
  { name: 'Henry', city: 'Townsville QLD', action: 'saved a supplier at $8 cost price', icon: '🏭' },
  { name: 'Charlotte', city: 'Ballarat VIC', action: 'generated 12 ad creatives with AI', icon: '🤖' },
  { name: 'James', city: 'Launceston TAS', action: 'found a product scoring 97/100', icon: '🏆' },
  { name: 'Amelia', city: 'Mackay QLD', action: 'just cancelled their Minea subscription', icon: '👋' },
  { name: 'Oliver', city: 'Bendigo VIC', action: 'hit their first $1,000 day', icon: '🚀' },
  { name: 'Grace', city: 'Toowoomba QLD', action: 'found a supplier with 4-day AU shipping', icon: '📬' },
];

const DISMISS_KEY = 'majorka_social_ticker_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Date.now() - ts < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SocialProofTicker() {
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [index, setIndex] = useState(() => Math.floor(Math.random() * NOTIFICATIONS.length));
  const [visible, setVisible] = useState(true); // animation phase

  // Cycle through notifications every 6 seconds
  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % NOTIFICATIONS.length);
        setVisible(true);
      }, 400); // brief off gap matches animation
    }, 6000);
    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const notif = NOTIFICATIONS[index];

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setDismissed(true);
  };

  return (
    <>
      <style>{`
        @keyframes ticker-slide {
          0%   { transform: translateY(20px); opacity: 0; }
          10%, 80% { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes green-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        @media (max-width: 767px) {
          .social-proof-ticker { display: none !important; }
        }
      `}</style>

      <div
        className="social-proof-ticker"
        style={{
          position: 'fixed',
          bottom: 28,
          left: 24,
          zIndex: 800,
          maxWidth: 280,
          width: '100%',
        }}
      >
        <div
          key={index}
          style={{
            background: 'rgba(12,14,20,0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderLeft: '3px solid #4ade80',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            animation: visible ? 'ticker-slide 6s ease-in-out forwards' : 'none',
            opacity: visible ? undefined : 0,
          }}
        >
          {/* Green pulsing dot */}
          <div style={{ flexShrink: 0, paddingTop: 3 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#4ade80',
                animation: 'green-dot-pulse 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, lineHeight: 1.45, color: '#f5f5f5' }}>
              <strong style={{ color: '#f5f5f5' }}>{notif.name}</strong>{' '}
              <span style={{ color: 'rgba(240,237,232,0.45)', fontSize: 11 }}>from {notif.city}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.75)', lineHeight: 1.45, marginTop: 2 }}>
              {notif.icon} {notif.action}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'rgba(240,237,232,0.25)',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
}
