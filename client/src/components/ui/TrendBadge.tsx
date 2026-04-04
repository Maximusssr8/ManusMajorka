import { tokens } from '@/lib/tokens';
import React from 'react';

type TrendBadgeVariant = 'rising' | 'peaked' | 'declining' | 'exploding' | 'new' | 'bestseller' | 'hot';

interface TrendBadgeProps {
  variant: TrendBadgeVariant;
  label?: string;
  className?: string;
}

const VARIANT_LABELS: Record<TrendBadgeVariant, string> = {
  rising: '📈 Rising',
  peaked: '📊 Peaked',
  declining: '📉 Declining',
  exploding: '🔥 Exploding',
  new: '✨ New',
  bestseller: '🏆 Bestseller',
  hot: '🔥 Hot',
};

export function TrendBadge({ variant, label, className = '' }: TrendBadgeProps) {
  const t = tokens.badge[variant];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${className}`}
      style={{
        background: t.bg,
        color: t.text,
        border: `1px solid ${t.border}`,
        letterSpacing: '0.02em',
      }}
    >
      {label ?? VARIANT_LABELS[variant]}
    </span>
  );
}

// Convenience exports
export const RisingBadge = (p: Omit<TrendBadgeProps, 'variant'>) => <TrendBadge {...p} variant="rising" />;
export const HotBadge = (p: Omit<TrendBadgeProps, 'variant'>) => <TrendBadge {...p} variant="hot" />;
export const NewBadge = (p: Omit<TrendBadgeProps, 'variant'>) => <TrendBadge {...p} variant="new" />;
export const DecliningBadge = (p: Omit<TrendBadgeProps, 'variant'>) => <TrendBadge {...p} variant="declining" />;
export const ExplodingBadge = (p: Omit<TrendBadgeProps, 'variant'>) => <TrendBadge {...p} variant="exploding" />;
export const BestsellerBadge = (p: Omit<TrendBadgeProps, 'variant'>) => <TrendBadge {...p} variant="bestseller" />;
