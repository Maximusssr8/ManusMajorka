import { useEffect, useState } from 'react';

interface ToastMessage {
  flag: string;
  name: string;
  location: string;
  action: string;
  ago: string;
}

const MESSAGES: ToastMessage[] = [
  { flag: '🇦🇺', name: 'Jake T.',    location: 'Sydney',    action: 'found a $12,400/mo product',          ago: '2 min ago' },
  { flag: '🇺🇸', name: 'Marcus R.',  location: 'Austin',    action: 'launched a store via Store Builder', ago: '4 min ago' },
  { flag: '🇬🇧', name: 'Priya S.',   location: 'London',    action: 'ran a competitor spy scan',          ago: '7 min ago' },
  { flag: '🇨🇦', name: 'Lena M.',    location: 'Toronto',   action: 'hit 51% margin on a new product',    ago: '9 min ago' },
  { flag: '🇩🇪', name: 'Hannes B.',  location: 'Berlin',    action: 'generated 5 ad creatives',           ago: '12 min ago' },
  { flag: '🇸🇬', name: 'Wei C.',     location: 'Singapore', action: 'found a 99/100 scored product',      ago: '14 min ago' },
];

export function SocialProofToasts() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [state, setState] = useState<'entering' | 'showing' | 'leaving' | 'hidden'>('hidden');

  useEffect(() => {
    let index = Math.floor(Math.random() * MESSAGES.length);
    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let firstShown = false;

    const showNext = () => {
      const next = MESSAGES[index % MESSAGES.length];
      index++;
      setToast(next);
      setState('entering');
      // Let the DOM paint the entering state, then flip to showing
      window.setTimeout(() => setState('showing'), 40);
      hideTimer = window.setTimeout(() => {
        setState('leaving');
        window.setTimeout(() => setState('hidden'), 300);
      }, 5000);
    };

    const schedule = () => {
      const delay = firstShown ? 28000 + Math.random() * 7000 : 8000;
      firstShown = true;
      showTimer = window.setTimeout(() => {
        showNext();
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (state === 'hidden' || !toast) return null;

  const transform = state === 'entering'
    ? 'translateY(20px) scale(0.96)'
    : state === 'leaving'
      ? 'translateY(8px) scale(0.98)'
      : 'translateY(0) scale(1)';
  const opacity = state === 'entering' ? 0 : state === 'leaving' ? 0 : 1;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        maxWidth: 300,
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: "'DM Sans', sans-serif",
        // Spring-like ease — emil-design-eng skill recommends cubic-bezier for motion polish
        transition: 'opacity 320ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity,
        transform,
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{toast.flag}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', lineHeight: 1.3 }}>
          {toast.name} from {toast.location}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.3 }}>
          {toast.action}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
          {toast.ago}
        </div>
      </div>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#22c55e',
        boxShadow: '0 0 8px rgba(34,197,94,0.6)',
        flexShrink: 0,
        animation: 'mj-toast-pulse 1.5s ease-in-out infinite',
      }} />
      <style>{`@keyframes mj-toast-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  );
}
