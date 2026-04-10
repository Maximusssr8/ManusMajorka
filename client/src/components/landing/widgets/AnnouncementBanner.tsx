import { useEffect, useState } from 'react';

const STORAGE_KEY = 'majorka-announcement-dismissed-v1';

const MESSAGES = [
  '🔥 Founding member pricing — Builder locked at $99/mo for the life of your subscription. See plans →',
  '🇦🇺 7 markets · live AliExpress data · AI scoring on 3,000+ products. Try free →',
  '⚡ Find your first winning product in under 18 minutes — Start free →',
];

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      setVisible(dismissed !== '1');
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed',
      insetInline: 0,
      top: 0,
      zIndex: 50,
      background: 'linear-gradient(90deg, #4338ca, #6366f1)',
      width: '100%',
      pointerEvents: 'none',
    }}>
      <div style={{
        padding: '8px 16px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        maxWidth: 1152,
        margin: '0 auto',
        position: 'relative',
      }}>
        <a
          href="/sign-up"
          key={index}
          style={{
            color: 'white',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: 'none',
            pointerEvents: 'auto',
            animation: 'mj-banner-fade 400ms ease',
          }}
        >{MESSAGES[index]}</a>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: 16,
            pointerEvents: 'auto',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'white';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}
        >×</button>
      </div>
      <style>{`@keyframes mj-banner-fade { from { opacity: 0; transform: translateY(-2px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  );
}
