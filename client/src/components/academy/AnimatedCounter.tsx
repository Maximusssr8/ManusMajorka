import { useEffect, useRef } from 'react';
import { animate, useInView, useMotionValue, useTransform } from 'framer-motion';
import { motion } from 'framer-motion';

interface AnimatedCounterProps {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatThousands?: boolean;
}

/**
 * Counter that animates from `from` to `to` when scrolled into view.
 * Respects prefers-reduced-motion (no animation — shows final value).
 */
export function AnimatedCounter({
  to,
  from = 0,
  duration = 1.8,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  formatThousands = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const mv = useMotionValue(from);
  const rounded = useTransform(mv, (v) => {
    const fixed = Number(v).toFixed(decimals);
    if (!formatThousands) return `${prefix}${fixed}${suffix}`;
    const [whole, frac] = fixed.split('.');
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${prefix}${frac ? `${withCommas}.${frac}` : withCommas}${suffix}`;
  });
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
