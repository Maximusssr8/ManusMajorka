// Shared landing primitives (v2): pill, H2, Sub, Section wrapper, CTAs.
import { Link } from 'wouter';
import type { CSSProperties, ReactNode } from 'react';
import { LT, F, S, R, MAX } from '@/lib/landingTokens';

export function EyebrowPill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: F.body,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: LT.cobalt,
        border: `1px solid rgba(79,142,247,0.5)`,
        background: LT.cobaltSubtle,
        borderRadius: 9999,
        padding: '4px 12px',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function H2({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <h2
      className={`mj-h2 ${className ?? ''}`}
      style={{
        fontFamily: F.display,
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        color: LT.text,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function Sub({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p
      style={{
        fontFamily: F.body,
        fontSize: 17,
        lineHeight: 1.6,
        color: LT.textMute,
        margin: 0,
        maxWidth: '65ch',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Section({
  id, children, style, className, maxWidth = MAX,
}: { id?: string; children: ReactNode; style?: CSSProperties; className?: string; maxWidth?: number | string }) {
  return (
    <section
      id={id}
      className={`mj-section ${className ?? ''}`}
      style={{
        padding: `${S.xxxl}px ${S.md}px`,
        maxWidth,
        margin: '0 auto',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function CtaPrimary({
  href, children, style,
}: { href: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <Link
      href={href}
      className="mj-cta-primary"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
        padding: '0 32px',
        background: LT.cobalt,
        color: LT.text,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '0.02em',
        borderRadius: R.button,
        textDecoration: 'none',
        transition: 'transform 150ms ease, filter 150ms ease',
        ...style,
      }}
    >
      {children}
    </Link>
  );
}

export function CtaGhost({ href, children, style }: { href: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <Link
      href={href}
      className="mj-cta-ghost"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
        padding: '0 32px',
        background: 'transparent',
        color: LT.text,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '0.02em',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: R.button,
        textDecoration: 'none',
        transition: 'border-color 150ms ease',
        ...style,
      }}
    >
      {children}
    </Link>
  );
}
