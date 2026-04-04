interface NoImageProps {
  size?: number;
  className?: string;
}

export function NoImage({ size = 48, className }: NoImageProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <svg
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}
