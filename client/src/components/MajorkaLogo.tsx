/**
 * MajorkaLogo — canonical logomark + wordmark component.
 * Uses the official Majorka gradient-M mark.
 */

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
            fontFamily: "'Bricolage Grotesque', sans-serif",
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
