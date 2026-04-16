import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow,background] duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        // Default — gold (brand)
        default:
          'border-[rgba(79,142,247,0.3)] bg-[rgba(79,142,247,0.10)] text-[#4f8ef7]',
        // Gold alias
        gold:
          'border-[rgba(79,142,247,0.3)] bg-[rgba(79,142,247,0.10)] text-[#4f8ef7]',
        // Blue CTA badge
        blue:
          'border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.10)] text-[#3B82F6]',
        // Muted
        muted:
          'border-[#161b22] bg-[#141414] text-[#a3a3a3]',
        // Success emerald
        success:
          'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.10)] text-[#10b981]',
        // Secondary — legacy
        secondary:
          'border-[#161b22] bg-[#141414] text-[#a3a3a3]',
        // Destructive
        destructive:
          'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.10)] text-[#ef4444]',
        // Outline
        outline:
          'border-[#161b22] bg-transparent text-[#e5e5e5]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
