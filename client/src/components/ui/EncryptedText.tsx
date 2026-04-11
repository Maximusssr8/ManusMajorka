import { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

// Seeded pseudo-random — deterministic per char position
function seededChar(seed: number): string {
  return CHARS[(seed * 2654435761) % CHARS.length];
}

export function EncryptedText({ text, duration = 500 }: { text: string; duration?: number }) {
  const [display, setDisplay] = useState(() =>
    text.split('').map((c, i) => c === ' ' ? ' ' : seededChar(i)).join('')
  );
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const totalFrames = Math.floor(duration / 30);
    let frame = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      frame = Math.floor((now - startTime) / 30);
      const revealedChars = Math.floor((Math.min(frame, totalFrames) / totalFrames) * text.length);

      setDisplay(
        text.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (i < revealedChars) return char;
          return seededChar(i + frame);
        }).join('')
      );

      if (frame < totalFrames) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
        setDone(true);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, duration]);

  return (
    <span className={done ? '' : 'font-mono text-blue-300'}>
      {display}
    </span>
  );
}
