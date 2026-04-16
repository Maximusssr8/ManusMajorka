import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "mj-tap inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04060f] focus-visible:ring-[#4f8ef7] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive will-change-transform",
  {
    variants: {
      variant: {
        // Neutral dark — default chrome button
        default:
          'bg-[#141414] text-[#e5e5e5] border border-[#262626] hover:bg-[#161b22] hover:border-[rgba(79,142,247,0.25)]',
        // Destructive
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Outline
        outline:
          'border border-[#161b22] bg-transparent text-[#e5e5e5] hover:bg-[#0d1117] hover:border-[rgba(79,142,247,0.25)]',
        // Secondary
        secondary:
          'bg-[#161b22] text-[#e5e5e5] hover:bg-[#262626]',
        // Ghost
        ghost:
          'bg-transparent text-[#a3a3a3] hover:bg-[rgba(79,142,247,0.06)] hover:text-[#e5e5e5]',
        // Link
        link: 'text-[#4f8ef7] underline-offset-4 hover:underline',
        // GOLD — primary brand CTA (dark text on gold)
        gold:
          'mj-glow-gold bg-[#4f8ef7] text-[#04060f] font-bold border border-[rgba(79,142,247,0.4)] hover:bg-[#6ba3ff] hover:-translate-y-[1px]',
        // CTA — action blue (white on blue)
        cta:
          'mj-glow-blue bg-[#3B82F6] text-white font-semibold border border-[rgba(59,130,246,0.4)] hover:bg-[#60a5fa] hover:-translate-y-[1px]',
        // Legacy alias — kept so existing `variant="accent"` call sites keep working.
        accent:
          'mj-glow-gold bg-[#4f8ef7] text-[#04060f] font-bold border border-[rgba(79,142,247,0.4)] hover:bg-[#6ba3ff] hover:-translate-y-[1px]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingLabel?: string;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  disabled,
  loading = false,
  loadingLabel = 'Loading',
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const isDisabled = disabled || loading;

  // Default type="button" on native buttons to avoid accidental form submits.
  // Slot composition forwards props onto the child element as-is.
  const resolvedType = asChild ? type : (type ?? 'button');

  return (
    <Comp
      data-slot="button"
      type={resolvedType}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingLabel}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
