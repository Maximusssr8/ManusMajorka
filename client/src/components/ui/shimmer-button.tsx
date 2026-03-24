import { cn } from '@/lib/utils';

interface ShimmerButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ShimmerButton({ children, onClick, className, disabled }: ShimmerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-lg px-6 py-3 font-semibold',
        'bg-[#6366F1] text-black',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer-sweep_2s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
    >
      {children}
    </button>
  );
}
