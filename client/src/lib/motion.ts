import type { Transition } from 'framer-motion';

const ease: Transition = { duration: 0.18, ease: [0.16, 1, 0.3, 1] };

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: ease,
};

export const fadeInFast = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.12 } satisfies Transition,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
};
