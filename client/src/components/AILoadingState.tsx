/**
 * AILoadingState — animated loading with cycling progress messages.
 * Shows skeleton shapes + rotating status text.
 */
import { useEffect, useState } from 'react';

interface AILoadingStateProps {
  messages?: string[];
  /** Shape hint for skeletons: "cards" | "text" | "table" */
  shape?: 'cards' | 'text' | 'table';
}

const DEFAULT_MESSAGES = [
  'Analysing your inputs...',
  'Researching AU market data...',
  'Generating content...',
  'Optimising for conversions...',
  'Almost there...',
];

export function AILoadingState({
  messages = DEFAULT_MESSAGES,
  shape = 'text',
}: AILoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Skeleton shapes */}
      <div className="w-full max-w-md mb-8">
        {shape === 'cards' && (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{
                  height: 100,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
        {shape === 'text' && (
          <div className="space-y-3">
            {[100, 85, 92, 70, 88].map((w, i) => (
              <div
                key={i}
                className="rounded-lg animate-pulse"
                style={{
                  height: 12,
                  width: `${w}%`,
                  background: 'rgba(255,255,255,0.04)',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
        {shape === 'table' && (
          <div className="space-y-2">
            <div
              className="rounded-lg animate-pulse"
              style={{ height: 32, background: 'rgba(212,175,55,0.06)' }}
            />
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg animate-pulse"
                style={{
                  height: 24,
                  background: 'rgba(255,255,255,0.03)',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Animated dot loader */}
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              background: '#d4af37',
              opacity: 0.6,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Cycling message */}
      <p
        className="text-xs font-semibold transition-opacity duration-300"
        style={{
          color: 'rgba(212,175,55,0.7)',
          fontFamily: 'Syne, sans-serif',
        }}
      >
        {messages[msgIndex]}
      </p>
    </div>
  );
}
