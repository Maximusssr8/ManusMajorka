import { forwardRef } from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(function GhostButton(
  { href, children, size = 'md', className, ...rest },
  ref,
) {
  const sizeClasses = size === 'lg' ? 'px-7 py-4 text-[15px]' : 'px-5 py-3 text-sm';
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors tracking-tight';
  const visuals =
    'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#E0E0E0] backdrop-blur-xl';
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
