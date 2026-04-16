import { ReactNode } from 'react';

interface ShimmerButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ShimmerButton({ children, onClick, className = '', disabled }: ShimmerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: '#4f8ef7',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
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
