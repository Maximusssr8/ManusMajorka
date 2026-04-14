import { useEffect, useRef, useState } from 'react';

interface TypewriterProps {
  lines: string[];
  speed?: number;        // ms per character
  lineDelay?: number;    // ms between lines
  loop?: boolean;
  className?: string;
}

/**
 * Streams text character-by-character like an LLM. Starts when scrolled
 * into view. Used for the "ad copy generates" demo.
 */
export function Typewriter({ lines, speed = 28, lineDelay = 600, loop = true, className = '' }: TypewriterProps) {
  const [rendered, setRendered] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      while (!cancelled) {
        const next: string[] = [];
        for (let li = 0; li < lines.length && !cancelled; li++) {
          const line = lines[li];
          next.push('');
          setRendered([...next]);
          for (let ci = 0; ci < line.length && !cancelled; ci++) {
            next[li] = line.slice(0, ci + 1);
            setRendered([...next]);
            await new Promise<void>((res) => { timer = setTimeout(res, speed); });
          }
          await new Promise<void>((res) => { timer = setTimeout(res, lineDelay); });
        }
        if (!loop) break;
        await new Promise<void>((res) => { timer = setTimeout(res, 2000); });
        if (cancelled) break;
        setRendered([]);
      }
    }
    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [started, lines, speed, lineDelay, loop]);

  return (
    <div ref={rootRef} className={className}>
      {rendered.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {line}
          {i === rendered.length - 1 && (
            <span className="inline-block w-[2px] h-[1em] ml-0.5 -mb-0.5 bg-[#e5c158] align-middle animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}
