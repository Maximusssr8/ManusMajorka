// Directive 6 — Kinetic H1 with sparkline mask clipped inside each word.
// The text itself acts as a clip region; a gold sparkline <path> draws via
// stroke-dasharray inside the letter shapes and then pulses in opacity.
// Reduced motion: static gold sparkline baked in, no draw animation.

import { useEffect, useId, useRef } from 'react';
import { LT, F } from '@/lib/landingTokens';
import { usePrefersReducedMotion } from '../primitives';

interface Props {
  text: string;
  // Controls SVG font-size in px. The surrounding article scales responsively.
  fontSize?: number;
  lineHeight?: number;
  // Sparkline values (0..100). Default = natural rising ramp with 2 dips.
  values?: number[];
  gold?: boolean;
}

const DEFAULT_VALUES = [
  42, 48, 46, 52, 58, 56, 64, 62, 70, 72, 68, 76, 82, 78, 85, 90, 88, 94, 91, 96,
];

export function KineticHeadline({
  text,
  fontSize = 64,
  lineHeight = 1.05,
  values = DEFAULT_VALUES,
  gold = true,
}: Props) {
  const ref = useRef<SVGPathElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const uid = useId().replace(/:/g, '_');

  // Build sparkline path sized to a wide viewbox.
  const W = 1200, H = 140;
  const step = W / (values.length - 1);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    if (reduced) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      path.style.opacity = '1';
      return;
    }
    const L = path.getTotalLength();
    path.style.strokeDasharray = `${L}`;
    path.style.strokeDashoffset = `${L}`;
    path.style.opacity = '1';
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(0.2,0.8,0.2,1)';
    path.style.strokeDashoffset = '0';
  }, [reduced, d]);

  const clipId = `kh-clip-${uid}`;

  return (
    <h1
      className="mj-hero-h1"
      style={{
        fontFamily: F.display,
        fontSize,
        fontWeight: 800,
        lineHeight,
        letterSpacing: '-0.02em',
        color: LT.text,
        margin: 0,
        position: 'relative',
      }}
    >
      {/* Base text (accessible) */}
      <span style={{ color: LT.text }}>{text}</span>
      {/* Decorative overlay with sparkline clipped inside the glyphs */}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <clipPath id={clipId}>
            {/* The text shapes form the clip region. We tile it across so
                the sparkline visually appears inside every glyph. */}
            <text
              x="0"
              y={H * 0.75}
              fontFamily={F.display as string}
              fontWeight={800}
              fontSize={H * 0.95}
              letterSpacing="-2"
              // Hide from a11y; the outer <h1> already carries the text.
            >
              {text}
            </text>
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path
            ref={ref}
            d={d}
            fill="none"
            stroke={gold ? LT.gold : LT.success}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: reduced ? undefined : 'mjKineticPulse 4.5s ease-in-out 1.6s infinite',
              opacity: 0.55,
            }}
          />
        </g>
      </svg>
      <style>{`
        @keyframes mjKineticPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.28; }
        }
      `}</style>
    </h1>
  );
}

export default KineticHeadline;
