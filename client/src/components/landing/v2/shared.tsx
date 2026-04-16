// Shared landing primitives (v2) — Academy-inspired: monospace eyebrows,
// two-tone Syne headings, restrained cobalt, DM Sans body.
import { Link } from 'wouter';
import type { CSSProperties, ReactNode } from 'react';
import { LT, F, S, R, MAX } from '@/lib/landingTokens';

/**
 * Monospace eyebrow label — Academy pattern:
 * tiny, uppercase, tracked-wide, cobalt, optional middot-separated segments.
 */
export function Eyebrow({ children, center, style }: { children: ReactNode; center?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#4f8ef7',
        marginBottom: 12,
        ...(center ? { textAlign: 'center' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Backward-compat alias */
export function EyebrowPill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <Eyebrow style={style}>{children}</Eyebrow>;
}

/**
 * Academy-style H2 — Syne, bold, two-tone ready.
 * Wrap the muted second line in <span style={{ color: '#8b949e' }}>.
 */
export function H2({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <h2
      className={`mj-h2 ${className ?? ''}`}
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        color: '#E0E0E0',
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
        fontSize: 16,
        lineHeight: 1.65,
        color: '#9CA3AF',
        margin: 0,
        maxWidth: '60ch',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Section({
  id, children, style, className, maxWidth = 1152,
}: { id?: string; children: ReactNode; style?: CSSProperties; className?: string; maxWidth?: number | string }) {
  return (
    <section
      id={id}
      className={`mj-section ${className ?? ''}`}
      style={{
        padding: '80px 20px',
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
        padding: '16px 28px',
        background: '#4f8ef7',
        color: '#000',
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '-0.01em',
        borderRadius: 12,
        textDecoration: 'none',
        transition: 'transform 150ms ease, filter 150ms ease, box-shadow 150ms ease',
        boxShadow: '0 10px 40px -8px rgba(79,142,247,0.55)',
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
        padding: '16px 28px',
        background: 'rgba(255,255,255,0.04)',
        color: '#E0E0E0',
        fontFamily: F.body,
        fontWeight: 500,
        fontSize: 15,
        letterSpacing: '-0.01em',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12,
        textDecoration: 'none',
        backdropFilter: 'blur(20px)',
        transition: 'border-color 150ms ease, background 150ms ease',
        ...style,
      }}
    >
      {children}
    </Link>
  );
}
