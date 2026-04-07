import { useMemo } from 'react';

// Deterministic meteor data — no Math.random()
const METEOR_COUNT = 20;
const meteorsData = Array.from({ length: METEOR_COUNT }, (_, i) => ({
  id: i,
  left: `${(i * 5.26) % 100}%`,  // deterministic spread
  delay: `${(i * 0.31) % 2}s`,
  duration: `${4 + (i % 6)}s`,
}));

export function Meteors({ number = 12 }: { number?: number }) {
  const meteors = useMemo(() => meteorsData.slice(0, number), [number]);

  return (
    <div className="meteors-container" aria-hidden="true">
      {meteors.map((m) => (
        <span
          key={m.id}
          className="meteor"
          style={{
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </div>
  );
}
