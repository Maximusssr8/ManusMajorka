import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'gold' | 'emerald' | 'blue' | 'amber' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  gold: 'border-[#4f8ef7]/30 bg-[#4f8ef7]/10 text-[#6ba3ff]',
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  blue: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  neutral: 'border-white/10 bg-white/[0.04] text-[#9CA3AF]',
};

export function Badge({ children, tone = 'neutral', icon, className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest ${TONES[tone]} ${className ?? ''}`}
    >
      {icon}
      {children}
    </span>
  );
}
