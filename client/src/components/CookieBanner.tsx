// CookieBanner — GDPR/ACCC compliant consent bar
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem('cookie_consent', 'all');
    setVisible(false);
  }
  function decline() {
    localStorage.setItem('cookie_consent', 'essential');
    setVisible(false);
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#18181B', borderTop: '1px solid #3F3F46',
      padding: '14px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: '#D4D4D8', maxWidth: 680, lineHeight: 1.5 }}>
        We use cookies to improve your experience and analyse usage. By continuing you agree to our{' '}
        <a href="/privacy" style={{ color: '#60A5FA', textDecoration: 'underline' }}>Privacy Policy</a> and{' '}
        <a href="/cookies" style={{ color: '#60A5FA', textDecoration: 'underline' }}>Cookie Policy</a>.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{
          padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
          background: 'transparent', border: '1px solid #52525B', color: '#A1A1AA',
        }}>Essential only</button>
        <button onClick={accept} style={{
          padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
          background: '#3B82F6', border: 'none', color: '#fff', fontWeight: 600,
        }}>Accept all</button>
      </div>
    </div>
  );
}
