// StickyLaunchBar v2 — one line of text, one CTA, no counter, dismissible.
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { X } from 'lucide-react';
import { LT, F } from '@/lib/landingTokens';

const DISMISS_KEY = 'majorka_launch_bar_dismissed_v4';
export const LAUNCH_BAR_HEIGHT = 40;

export function LaunchBar() {
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }
    setDismissed(false);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  if (dismissed) return null;
  return (
    <div
      role="region"
      aria-label="Launch pricing banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        height: LAUNCH_BAR_HEIGHT,
        background: LT.cobaltSubtle,
        borderBottom: `1px solid ${LT.border}`,
        color: LT.text,
        fontFamily: F.body,
        fontSize: 13,
        fontWeight: 500,
        padding: '0 44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <span style={{ lineHeight: 1.2 }}>
        🔥 Early access pricing — Builder from $99 AUD/mo
      </span>
      <Link
        href="/sign-up"
        style={{
          color: LT.cobalt,
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Claim →
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss launch pricing bar"
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 32,
          height: 32,
          minWidth: 32,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: LT.textMute,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
