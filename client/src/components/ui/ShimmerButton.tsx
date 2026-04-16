import { ReactNode } from 'react';
import { MOTION, reducedMotion, cubicBezier } from '@/lib/motionTokens';

interface ShimmerButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ShimmerButton({ children, onClick, className = '', disabled }: ShimmerButtonProps) {
  const transition = reducedMotion()
    ? 'none'
    : `transform ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}, filter ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: '#d4af37',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition,
      }}
      onMouseEnter={(e) => {
        if (reducedMotion() || disabled) return;
        e.currentTarget.style.transform = `translateY(${MOTION.lift.y}px)`;
        e.currentTarget.style.filter = `brightness(${MOTION.lift.brightness})`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '200% 0',
          animation: 'shimmer-sweep 2.5s ease-in-out infinite',
        }}
      />
    </button>
  );
}
