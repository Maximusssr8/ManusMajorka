import { useEffect, useState } from 'react';

const STORAGE_KEY = 'majorka-announcement-dismissed-v1';

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      setVisible(dismissed !== '1');
    } catch {
      setVisible(true);
    }
  }, []);

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
      background: '#1F1D48',
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
        <span style={{ color: 'rgb(166,164,255)', fontSize: 14, lineHeight: 1 }}>✦</span>
        <span style={{
          color: 'white',
          fontSize: 14,
          fontWeight: 400,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Majorka is now in public beta — start building for free today.
        </span>
        <a
          href="/signup"
          style={{
            color: 'rgb(166,164,255)',
            fontWeight: 500,
            textDecoration: 'none',
            fontSize: 14,
            pointerEvents: 'auto',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
        >Get Started →</a>
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
            color: 'rgba(255,255,255,0.6)',
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
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}
        >×</button>
      </div>
    </div>
  );
}
