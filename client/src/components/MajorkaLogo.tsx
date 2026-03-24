/**
 * MajorkaLogo — canonical logomark + wordmark component.
 * Use wherever you need the Majorka brand identity.
 */

interface MajorkaLogoProps {
  /** Icon size in px (default 32) */
  size?: number;
  /** Wordmark font size in px (default 18) */
  wordmarkSize?: number;
  /** Wordmark colour (default #0F172A for light bg, pass 'white' for dark bg) */
  wordmarkColor?: string;
  /** Hide the text wordmark — icon only */
  iconOnly?: boolean;
  /** Gap between icon and wordmark */
  gap?: number;
  /** href to wrap the logo in a link (optional) */
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
  // Unique gradient id per instance to avoid SVG gradient conflicts
  const gradId = `lg-${size}-${wordmarkColor.replace(/[^a-z0-9]/gi, '')}`;

  const logo = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        textDecoration: 'none',
        userSelect: 'none',
        cursor: href ? 'pointer' : 'default',
      }}
    >
      {/* SVG Logomark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        {/* Rounded square background */}
        <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
        {/* Stylised M — mountain / waveform peaks */}
        <path
          d="M7 22V10L13.5 18L16 14L18.5 18L25 10V22"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
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
        {logo}
      </a>
    );
  }

  return logo;
}
