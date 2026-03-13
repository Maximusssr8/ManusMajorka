import { motion } from 'framer-motion';

interface BlurFadeProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

const directionMap = {
  up: { y: 12 },
  down: { y: -12 },
  left: { x: 12 },
  right: { x: -12 },
};

export function BlurFade({ children, delay = 0, direction = 'up', className }: BlurFadeProps) {
  const offset = directionMap[direction];
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(6px)', ...offset }}
      animate={{ opacity: 1, filter: 'blur(0px)', x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
