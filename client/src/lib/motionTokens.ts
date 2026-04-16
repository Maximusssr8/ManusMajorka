/**
 * Motion tokens — single source of truth for all animation timings and easings.
 *
 * Consumed by buttons, modals, toasts, cards, skeletons, and empty-state mounts.
 * Always respect `prefers-reduced-motion` — use `reducedMotion()` to short-circuit
 * entrance animations to instant.
 */

export const MOTION = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 200,
    slow: 300,
    reveal: 400,
  },
  ease: {
    out: [0.0, 0.0, 0.2, 1] as const, // cubic-bezier ease-out
    in: [0.4, 0.0, 1.0, 1] as const, // cubic-bezier ease-in
    inOut: [0.4, 0.0, 0.2, 1] as const, // cubic-bezier standard
    spring: { type: 'spring' as const, stiffness: 200, damping: 22 },
  },
  lift: { y: -2, brightness: 1.05 }, // card/btn hover token
  press: { y: 0, brightness: 0.95 }, // active state
} as const;

/**
 * Returns true when the user has requested reduced motion.
 * Safe on SSR — returns false if `window` isn't available.
 */
export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Helper to format a MOTION.ease tuple as a CSS cubic-bezier() value.
 */
export const cubicBezier = (ease: readonly [number, number, number, number]): string =>
  `cubic-bezier(${ease[0]}, ${ease[1]}, ${ease[2]}, ${ease[3]})`;

/**
 * Convenience CSS transition strings.
 */
export const TRANSITION = {
  fast: `${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`,
  normal: `${MOTION.duration.normal}ms ${cubicBezier(MOTION.ease.out)}`,
  slow: `${MOTION.duration.slow}ms ${cubicBezier(MOTION.ease.out)}`,
} as const;
