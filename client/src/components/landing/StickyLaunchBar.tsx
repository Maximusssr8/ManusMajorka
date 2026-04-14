import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'wouter';
import { X } from 'lucide-react';

const STORAGE_KEY = 'majorka_launch_bar_dismissed_v2';
const DISMISS_MS = 24 * 60 * 60 * 1000;

export function StickyLaunchBar(): ReactElement | null {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const at = Number.parseInt(raw, 10);
        if (!Number.isNaN(at) && Date.now() - at < DISMISS_MS) {
          setDismissed(true);
        }
      }
    } catch {
      /* private mode */
    }
  }, []);

  if (!mounted || dismissed) return null;

  const onDismiss = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Launch pricing promotion"
      style={{
        position: 'relative',
        top: 0,
        zIndex: 90,
        width: '100%',
        background: 'linear-gradient(90deg,#d4af37 0%,#f4d77a 50%,#d4af37 100%)',
        color: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 40px 8px 16px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      <Link
        href="/pricing"
        style={{ color: '#111', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Launch pricing — Builder from $99 AUD/mo. Prices increase after first 200 users.
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss launch bar"
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#111',
          cursor: 'pointer',
          borderRadius: 6,
        }}
      >
        <X size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}
