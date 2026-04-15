// Scroll-to-top button — fixed bottom-right, appears after scrollY > 400.
// Gold circle, 44x44, lucide ArrowUp. Sits below toasts (z 9997 vs 9998).

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { LT } from '@/lib/landingTokens';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        width: 44,
        height: 44,
        zIndex: 9997,
        background: LT.gold,
        border: 'none',
        borderRadius: 999,
        color: LT.bg,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 200ms ease, transform 200ms ease, box-shadow 200ms ease',
        boxShadow: '0 4px 16px rgba(212,175,55,0.35)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,175,55,0.55)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,175,55,0.35)';
      }}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}
