/**
 * SocialProofTicker — Fixed bottom-left real-time activity notifications.
 * Rotates through 20 global users taking actions on the platform.
 * Desktop only (hidden < 768px).
 * Dismissible (localStorage, 24h).
 */

import { useEffect, useState } from 'react';

// ── Notification list ─────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  { name: 'Jake', city: 'Brisbane, AU', action: 'just found a trending product in Health', icon: '🔥' },
  { name: 'Sarah', city: 'London, UK', action: 'exported 3 products to their Shopify store', icon: '📦' },
  { name: 'Marcus', city: 'Melbourne, AU', action: 'discovered a high-margin niche', icon: '💡' },
  { name: 'Priya', city: 'Toronto, CA', action: 'ran a competitor spy on their niche', icon: '🔍' },
  { name: 'Tom', city: 'Perth, AU', action: 'generated an ad pack with AI', icon: '📱' },
  { name: 'Emma', city: 'Auckland, NZ', action: 'found a supplier at high margin', icon: '💰' },
  { name: 'Liam', city: 'Sydney, AU', action: 'just upgraded to Scale', icon: '⭐' },
  { name: 'Olivia', city: 'New York, US', action: 'launched a store in under 10 minutes', icon: '🏗️' },
  { name: 'Noah', city: 'Singapore, SG', action: 'identified a trending product in Tech', icon: '📈' },
  { name: 'Ava', city: 'Gold Coast, AU', action: 'filtered 200 products down to 5 winners', icon: '🎯' },
  { name: 'Jack', city: 'Chicago, US', action: 'connected their Shopify store', icon: '✅' },
  { name: 'Isla', city: 'Edinburgh, UK', action: 'found 3 trending pet products', icon: '🐾' },
  { name: 'William', city: 'Berlin, DE', action: 'ran an AI score on their product list', icon: '🤖' },
  { name: 'Mia', city: 'Brisbane, AU', action: 'discovered a viral beauty trend', icon: '💄' },
  { name: 'Henry', city: 'Auckland, NZ', action: 'saved a low-cost supplier for later', icon: '🏭' },
  { name: 'Charlotte', city: 'Vancouver, CA', action: 'generated ad creatives with AI', icon: '🎨' },
  { name: 'James', city: 'Melbourne, AU', action: 'found a product scoring 97/100', icon: '🏆' },
  { name: 'Amelia', city: 'Los Angeles, US', action: 'switched from a competitor to Majorka', icon: '👋' },
  { name: 'Oliver', city: 'Adelaide, AU', action: 'hit their first successful test campaign', icon: '🚀' },
  { name: 'Grace', city: 'Dublin, IE', action: 'found a fast-shipping supplier', icon: '📬' },
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
            background: '#0d0d10',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: '3px solid #d4af37',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
                background: '#d4af37',
                animation: 'green-dot-pulse 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, lineHeight: 1.45, color: '#F8FAFC' }}>
              <strong style={{ color: '#F8FAFC' }}>{notif.name}</strong>{' '}
              <span style={{ color: '#94A3B8', fontSize: 11 }}>from {notif.city}</span>
            </div>
            <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.45, marginTop: 2 }}>
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
              color: '#9CA3AF',
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
