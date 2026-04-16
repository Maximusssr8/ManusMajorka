import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'wouter';
import { X, Zap } from 'lucide-react';

const STORAGE_KEY = 'majorka_sticky_dismissed';
const DISMISS_MS = 24 * 60 * 60 * 1000;

const MESSAGES: string[] = [
  'AU operators who found a winner in their first week: 73%',
  '7-day free trial \u00b7 no card required \u00b7 cancel anytime',
  'New trending products land every 6 hours from AliExpress',
];

const CSS = `
@keyframes mkr-sticky-rotate {
  0%, 28%   { opacity: 1; transform: translateY(0); }
  33%, 61%  { opacity: 0; transform: translateY(-6px); }
  66%, 94%  { opacity: 0; transform: translateY(-6px); }
  100%      { opacity: 1; transform: translateY(0); }
}
.mkr-sticky-msg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 13px;
  color: #f5f5f5;
  letter-spacing: 0.01em;
  animation: mkr-sticky-rotate 18s linear infinite;
  opacity: 0;
  pointer-events: none;
  padding: 0 12px;
  text-align: center;
}
.mkr-sticky-msg:nth-child(1) { animation-delay: 0s; }
.mkr-sticky-msg:nth-child(2) { animation-delay: 6s; }
.mkr-sticky-msg:nth-child(3) { animation-delay: 12s; }
@media (max-width: 640px) {
  .mkr-sticky-msg { font-size: 11px; }
  .mkr-sticky-cta-label { display: none; }
}
`;

interface StickyTrialBarProps {
  /** Hide on signup/auth pages to avoid double CTAs. */
  hideOnRoutes?: string[];
}

export function StickyTrialBar({ hideOnRoutes = ['/sign-up', '/signup', '/sign-in', '/login'] }: StickyTrialBarProps): ReactElement | null {
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

  if (!mounted) return null;
  if (dismissed) return null;

  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (hideOnRoutes.some((r) => path.startsWith(r))) return null;
  }

  const onDismiss = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <>
      <style>{CSS}</style>
      <div
        role="region"
        aria-label="Free trial promotion"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          width: '100%',
          minHeight: 40,
          background: '#0d1117',
          borderBottom: '1px solid #4f8ef7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          boxShadow: '0 1px 0 rgba(79,142,247,0.25), 0 0 24px -12px rgba(79,142,247,0.35)',
        }}
      >
        <div style={{ width: 32, flexShrink: 0 }} aria-hidden="true" />
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: 36,
            minWidth: 0,
          }}
        >
          {MESSAGES.map((msg) => (
            <div key={msg} className="mkr-sticky-msg">
              {msg}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Link
            href="/sign-up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 28,
              padding: '0 12px',
              background: 'linear-gradient(135deg, #4f8ef7 0%, #f4d77a 50%, #4f8ef7 100%)',
              color: '#0d1117',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.01em',
              borderRadius: 999,
              textDecoration: 'none',
              border: '1px solid rgba(79,142,247,0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={12} strokeWidth={2.5} />
            <span className="mkr-sticky-cta-label">Start free trial</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss trial bar"
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              borderRadius: 6,
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
}
