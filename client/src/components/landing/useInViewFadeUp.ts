// useInViewFadeUp — native IntersectionObserver hook for landing sections.
// One-shot fade-in-up: opacity 0 + translateY(16px) -> opacity 1 + translateY(0).
// Returns a ref + styles to spread on the target element.
import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface UseInViewFadeUpResult {
  ref: (el: HTMLElement | null) => void;
  style: CSSProperties;
}

export function useInViewFadeUp(options: {
  threshold?: number;
  delay?: number;
  rootMargin?: string;
} = {}): UseInViewFadeUpResult {
  const { threshold = 0.12, delay = 0, rootMargin = '0px 0px -60px 0px' } = options;
  const [visible, setVisible] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);

  const setRef = (el: HTMLElement | null) => {
    nodeRef.current = el;
  };

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    // Respect reduced motion — show immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return {
    ref: setRef,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`,
      willChange: 'opacity, transform',
    },
  };
}
