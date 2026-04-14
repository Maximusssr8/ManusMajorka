/**
 * MajorkaLogo — canonical logomark + wordmark component.
 * Uses the official Majorka gradient-M mark.
 *
 * Two exports:
 *  - default (image-based, lockup with wordmark)  → marketing pages
 *  - { GradientM } pure CSS gradient mark         → app shell, dark UIs
 */

/**
 * GradientM — pure CSS gradient logomark. Uses no image asset so it
 * never 404s and renders consistently on dark backgrounds. Square,
 * sized to its parent's `size` prop, with the bold M centred.
 */
export function GradientM({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center font-display font-black text-white shrink-0 ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        background: 'linear-gradient(135deg, #d4af37 0%, #d4af37 100%)',
        fontSize: Math.round(size * 0.45),
        boxShadow: '0 4px 16px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
      aria-label="Majorka"
    >
      M
    </div>
  );
}


interface MajorkaLogoProps {
  /** Icon size in px (default 32) */
  size?: number;
  /** Wordmark font size in px (default 18) */
  wordmarkSize?: number;
  /** Wordmark colour — default dark for light bg, pass 'white' for dark bg */
  wordmarkColor?: string;
  /** Hide the text wordmark — icon only */
  iconOnly?: boolean;
  /** Gap between icon and wordmark */
  gap?: number;
  /** Wrap in an <a> link */
  href?: string;
}

export default function MajorkaLogo({
  size = 32,
  wordmarkSize = 18,
  wordmarkColor = '#0F172A',
  iconOnly = false,
  gap = 10,
  href,
}: MajorkaLogoProps) {
  const inner = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* Gradient-M logomark */}
      <img
        src="/majorka-logo.jpg"
        alt="Majorka"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          // White bg on the image — clip with border-radius so it's circular/square
          borderRadius: Math.round(size * 0.28),
        }}
        draggable={false}
      />

      {!iconOnly && (
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: wordmarkSize,
            color: wordmarkColor,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Majorka
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    );
  }

  return inner;
}
