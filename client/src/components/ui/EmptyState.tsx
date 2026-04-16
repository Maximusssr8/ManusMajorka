/**
 * EmptyState (ui/) — Shopify-grade empty state primitive.
 *
 * Used on every blank list / empty feature surface. Dark #111111 card,
 * gold circular icon (64px), Syne title (24px), DM Sans body (15px, #9CA3AF,
 * max-w-[380px]). Primary CTA is gold-filled min-h-44 rounded-xl; secondary
 * is a ghost text link. Fades up on mount (opacity 0→1, y:8→0, 200ms).
 *
 * Respects `prefers-reduced-motion` — mount animation short-circuits to instant.
 *
 * NOTE: a legacy variant lives at `@/components/EmptyState` with an older API.
 * Prefer this one for new work.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { MOTION, reducedMotion, cubicBezier } from '@/lib/motionTokens';

interface CtaWithHref {
  label: string;
  href: string;
  onClick?: never;
}

interface CtaWithOnClick {
  label: string;
  href?: never;
  onClick: () => void;
}

type Cta = CtaWithHref | CtaWithOnClick;

interface EmptyStateProps {
  icon: ReactNode; // lucide icon node (sized 40px inside a 64px gold circle)
  title: string;
  body: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
}

export function EmptyState({ icon, title, body, primaryCta, secondaryCta }: EmptyStateProps) {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(reducedMotion());

  useEffect(() => {
    if (reducedMotion()) {
      setMounted(true);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleCta = (cta: Cta) => () => {
    if ('href' in cta && cta.href) {
      setLocation(cta.href);
      return;
    }
    if ('onClick' in cta && typeof cta.onClick === 'function') {
      cta.onClick();
    }
  };

  const fadeStyle: React.CSSProperties = {
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(8px)',
    transition: reducedMotion()
      ? 'none'
      : `opacity ${MOTION.duration.normal}ms ${cubicBezier(MOTION.ease.out)}, transform ${MOTION.duration.normal}ms ${cubicBezier(MOTION.ease.out)}`,
  };

  return (
    <div
      role="status"
      style={{
        ...fadeStyle,
        background: '#111111',
        border: '1px solid #1a1a1a',
        borderRadius: 16,
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 20,
        maxWidth: '100%',
      }}
    >
      {/* Gold circle, 64x64 with icon at 40px */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4f8ef7',
        }}
        aria-hidden
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 24,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: '#f5f5f5',
          margin: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 15,
          lineHeight: 1.5,
          color: '#9CA3AF',
          margin: 0,
          maxWidth: 380,
        }}
      >
        {body}
      </p>

      {(primaryCta || secondaryCta) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 4,
          }}
        >
          {primaryCta && (
            <button
              type="button"
              onClick={handleCta(primaryCta)}
              style={{
                minHeight: 44,
                padding: '0 20px',
                borderRadius: 12,
                background: '#4f8ef7',
                color: '#080808',
                border: 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: reducedMotion()
                  ? 'none'
                  : `transform ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}, filter ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`,
              }}
              onMouseEnter={(e) => {
                if (reducedMotion()) return;
                e.currentTarget.style.transform = `translateY(${MOTION.lift.y}px)`;
                e.currentTarget.style.filter = `brightness(${MOTION.lift.brightness})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = `translateY(${MOTION.press.y}px)`;
                e.currentTarget.style.filter = `brightness(${MOTION.press.brightness})`;
              }}
            >
              {primaryCta.label}
            </button>
          )}
          {secondaryCta && (
            <button
              type="button"
              onClick={handleCta(secondaryCta)}
              style={{
                minHeight: 44,
                padding: '0 12px',
                background: 'transparent',
                color: '#9CA3AF',
                border: 'none',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(156,163,175,0.3)',
                textUnderlineOffset: 4,
                transition: reducedMotion()
                  ? 'none'
                  : `color ${MOTION.duration.fast}ms ${cubicBezier(MOTION.ease.out)}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9CA3AF';
              }}
            >
              {secondaryCta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
