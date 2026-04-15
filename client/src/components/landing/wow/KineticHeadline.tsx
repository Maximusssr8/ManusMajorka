// Delta 1 — clean H1 with word-stagger fade-up and a gold underline
// drawn under the FINAL line via Framer Motion pathLength.
//
// Usage:
//   <KineticHeadline
//     lines={['Find winning products', 'before anyone else.']}
//     // lineToUnderline defaults to the last line index
//   />
//
// - Words fade in y:30→0, opacity 0→1, 120ms stagger, starting 200ms after mount.
// - Underline under the final line only, starts 500ms after mount, draws 800ms.
// - After draw: subtle opacity pulse 0.6→0.95→0.6 on a 4.5s loop.
// - prefers-reduced-motion: skip stagger + draw, render final state instantly.

import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LT, F } from '@/lib/landingTokens';

interface Props {
  lines?: string[];
  fontSize?: number;
  fontSizeMobile?: number;
  lineHeight?: number;
  // Which line gets the gold underline. Defaults to last line.
  lineToUnderline?: number;
}

const DEFAULT_LINES = ['Find winning products', 'before anyone else.'];

export function KineticHeadline({
  lines = DEFAULT_LINES,
  fontSize = 72,
  fontSizeMobile = 44,
  lineHeight = 1.0,
  lineToUnderline,
}: Props) {
  const reduced = useReducedMotion();
  const underlineLine = typeof lineToUnderline === 'number' ? lineToUnderline : lines.length - 1;
  const finalLineRef = useRef<HTMLSpanElement | null>(null);
  const [uWidth, setUWidth] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const measure = () => {
      setIsMobile(window.innerWidth < 768);
      const el = finalLineRef.current;
      if (el) setUWidth(el.getBoundingClientRect().width);
    };
    measure();
    // Remeasure on resize + fonts ready (web fonts load async).
    window.addEventListener('resize', measure);
    if (typeof document !== 'undefined' && 'fonts' in document) {
      const fontFaceSet = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
      fontFaceSet?.ready?.then(measure).catch(() => { /* ignore */ });
    }
    return () => window.removeEventListener('resize', measure);
  }, [lines.join('|')]);

  const resolvedFontSize = isMobile ? fontSizeMobile : fontSize;

  // Build a gentle two-tone hand-drawn underline path.
  // We use a slightly wavy stroke for character — not a perfectly straight line.
  // Underline SVG: 2 control points for a smooth arc hint.
  const UNDERLINE_H = 10;
  const uPath = (w: number) =>
    `M 2 ${UNDERLINE_H / 2} Q ${w / 2} ${UNDERLINE_H / 2 + 2.5}, ${w - 2} ${UNDERLINE_H / 2}`;

  return (
    <h1
      className="mj-hero-h1"
      style={{
        fontFamily: F.display,
        fontSize: resolvedFontSize,
        fontWeight: 800,
        lineHeight,
        letterSpacing: '-0.02em',
        color: LT.text,
        margin: 0,
        display: 'block',
      }}
    >
      {lines.map((line, li) => {
        const words = line.split(/\s+/);
        const isFinal = li === underlineLine;
        return (
          <span
            key={li}
            style={{ display: 'block', position: 'relative' }}
          >
            <span
              ref={isFinal ? finalLineRef : undefined}
              style={{ display: 'inline-block' }}
            >
              {words.map((w, wi) => {
                // Compute flat index for stagger across lines.
                const flatIdx =
                  lines.slice(0, li).reduce((n, l) => n + l.split(/\s+/).length, 0) + wi;
                return (
                  <motion.span
                    key={`${li}-${wi}`}
                    initial={reduced ? undefined : { y: 30, opacity: 0 }}
                    animate={reduced ? undefined : { y: 0, opacity: 1 }}
                    transition={
                      reduced
                        ? undefined
                        : {
                            delay: 0.2 + flatIdx * 0.12,
                            duration: 0.55,
                            ease: [0.2, 0.8, 0.2, 1],
                          }
                    }
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'pre',
                      willChange: 'transform, opacity',
                    }}
                  >
                    {w}
                    {wi < words.length - 1 ? ' ' : ''}
                  </motion.span>
                );
              })}
            </span>

            {isFinal && uWidth > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  // ~6px below baseline; since lineHeight=1 and fontSize drives baseline,
                  // placing at 100% + 6 approximates baseline+6 well enough for display type.
                  top: `calc(100% + 6px)`,
                  width: uWidth,
                  height: UNDERLINE_H,
                  pointerEvents: 'none',
                }}
              >
                <motion.svg
                  width={uWidth}
                  height={UNDERLINE_H}
                  viewBox={`0 0 ${uWidth} ${UNDERLINE_H}`}
                  preserveAspectRatio="none"
                  style={{
                    display: 'block',
                    overflow: 'visible',
                    animation:
                      reduced ? undefined : 'mjUnderlinePulse 4.5s ease-in-out 1.4s infinite',
                  }}
                >
                  <motion.path
                    d={uPath(uWidth)}
                    fill="none"
                    stroke={LT.gold}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    initial={reduced ? undefined : { pathLength: 0, opacity: 0.9 }}
                    animate={reduced ? { pathLength: 1, opacity: 0.9 } : { pathLength: 1, opacity: 0.9 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : {
                            pathLength: {
                              delay: 0.5,
                              duration: 0.8,
                              ease: [0.2, 0.8, 0.2, 1],
                            },
                          }
                    }
                  />
                </motion.svg>
              </span>
            )}
          </span>
        );
      })}

      <style>{`
        @keyframes mjUnderlinePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </h1>
  );
}

export default KineticHeadline;
