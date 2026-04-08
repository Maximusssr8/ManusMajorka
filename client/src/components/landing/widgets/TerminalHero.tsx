/**
 * Decorative monospace text block with a blinking cursor.
 * Used as the icon/symbol inside the first TeamFeatureCard
 * or optionally as a large hero accent.
 */

const BLINK_STYLE = `
@keyframes mj-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.mj-blink { animation: mj-blink 1s step-end infinite; }
`;

interface TerminalHeroProps {
  text?: string;
  size?: number;
  /** Dark-on-light vs light-on-dark contrast. */
  colour?: string;
}

export function TerminalHero({ text = '>_ship', size = 28, colour = '#0D0D0D' }: TerminalHeroProps) {
  return (
    <>
      <style>{BLINK_STYLE}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: size + 12,
        fontFamily: "ui-monospace, 'Cascadia Code', 'JetBrains Mono', monospace",
        fontSize: size,
        fontWeight: 500,
        color: colour,
        letterSpacing: '-0.04em',
        lineHeight: 1,
      }}>
        <span>{text}</span>
        <span className="mj-blink">|</span>
      </div>
    </>
  );
}
