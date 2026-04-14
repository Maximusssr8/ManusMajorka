import { forwardRef } from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Primary CTA button. Gold (#d4af37) fill, high contrast, lift on hover.
 * Renders as <a> when `href` is provided so link semantics are preserved.
 */
export const GoldButton = forwardRef<HTMLButtonElement, GoldButtonProps>(function GoldButton(
  { href, children, size = 'md', className, ...rest },
  ref,
) {
  const sizeClasses = size === 'lg' ? 'px-7 py-4 text-[15px]' : 'px-5 py-3 text-sm';
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all tracking-tight';
  const visuals =
    'bg-[#d4af37] hover:bg-[#e5c158] text-black hover:scale-[1.02] active:scale-[0.99] shadow-[0_10px_40px_-8px_rgba(212,175,55,0.55)]';
  const classes = `${base} ${visuals} ${sizeClasses} ${className ?? ''}`;
  if (href) {
    return (
      <a href={href} className={classes} onClick={rest.onClick as undefined}>
        {children}
      </a>
    );
  }
  return (
    <button ref={ref} {...rest} className={classes}>
      {children}
    </button>
  );
});
