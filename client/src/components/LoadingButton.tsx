import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { MOTION, reducedMotion, cubicBezier } from '@/lib/motionTokens';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

export function LoadingButton({ loading, disabled, children, style, ...props }: LoadingButtonProps) {
  const transition = reducedMotion()
    ? 'none'
    : `transform ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}, filter ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}, opacity ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 44,
        opacity: loading || disabled ? 0.7 : 1,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        transition,
        ...style,
      }}
    >
      {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}
