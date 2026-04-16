/**
 * AlmostWonModal — "You Almost Found a Winner" upgrade modal.
 * Shown when a free user hits exactly 10 searches (limit reached) mid-result.
 * Uses psychological FOMO + guilt framing.
 *
 * Usage:
 *   triggerAlmostWonModal(94, 16400);
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// ── Global event bus ──────────────────────────────────────────────────────────

type AlmostWonEvent = { score: number; revenue: number };
const LISTENERS: ((e: AlmostWonEvent) => void)[] = [];

export function triggerAlmostWonModal(score: number, revenue: number) {
  LISTENERS.forEach((cb) => cb({ score, revenue }));
}

// ── Blurred product name placeholder ─────────────────────────────────────────

function BlurredName() {
  return (
    <span
      style={{
        display: 'inline-block',
        background: 'rgba(79,142,247,0.12)',
        borderRadius: 6,
        padding: '4px 16px',
        color: 'transparent',
        userSelect: 'none',
        filter: 'blur(6px)',
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: '0.04em',
        border: '1px solid rgba(79,142,247,0.25)',
      }}
    >
      ████████████████
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AlmostWonModal() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<AlmostWonEvent>({ score: 94, revenue: 16400 });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: AlmostWonEvent) => {
      setData(e);
      setVisible(true);
    };
    LISTENERS.push(handler);
    return () => {
      const idx = LISTENERS.indexOf(handler);
      if (idx !== -1) LISTENERS.splice(idx, 1);
    };
  }, []);

  if (!visible) return null;

  const fmtRevenue = `$${data.revenue.toLocaleString('en-AU')}/day`;

  return (
    <>
      <style>{`
        @keyframes almost-won-in {
          0% { opacity: 0; transform: scale(0.92) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes almost-won-trophy {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          50% { transform: scale(1.08) rotate(3deg); }
        }
        @keyframes almost-won-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,142,247,0.35); }
          50% { box-shadow: 0 0 0 12px rgba(79,142,247,0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={() => setVisible(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0d0d10',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '40px 36px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.15), 0 0 60px rgba(79,142,247,0.08)',
            animation: 'almost-won-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          {/* Trophy */}
          <div
            style={{
              fontSize: 52,
              marginBottom: 16,
              display: 'inline-block',
              animation: 'almost-won-trophy 2s ease-in-out infinite',
            }}
          >
            🏆
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: '#F8FAFC',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            You found a winning product
          </h2>

          {/* Score + revenue */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              background: 'rgba(79,142,247,0.08)',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 12,
              padding: '10px 20px',
              margin: '12px 0 16px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#4f8ef7',
                }}
              >
                {data.score}/100
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Win Score
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(79,142,247,0.2)' }} />
            <div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#22c55e',
                }}
              >
                {fmtRevenue}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Est. Revenue
              </div>
            </div>
          </div>

          {/* Blurred product name */}
          <div style={{ marginBottom: 16 }}>
            <BlurredName />
          </div>

          {/* Body copy */}
          <p
            style={{
              fontSize: 14,
              color: '#94A3B8',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            This product has been validated against{' '}
            <span style={{ color: '#4f8ef7', fontWeight: 700 }}>40+ AU market signals</span>.
            It's ready to sell — but your daily limit has been reached.
          </p>

          {/* CTA */}
          <button
            onClick={() => { setVisible(false); setLocation('/pricing'); }}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f8ef7, #3B82F6)',
              border: 'none',
              color: '#FFFFFF',
              fontFamily: "'Syne', sans-serif",
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              marginBottom: 12,
              animation: 'almost-won-pulse 2s ease-in-out infinite',
            }}
          >
            🚀 Unlock Full Analysis — Start Free →
          </button>

          {/* Social proof */}
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' }}>
            47 sellers found their next winner today
          </p>

          {/* Guilt-FOMO dismiss */}
          <button
            onClick={() => setVisible(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              color: '#9CA3AF',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              lineHeight: 1.4,
            }}
          >
            Maybe later — I'll keep losing to competitors
          </button>
        </div>
      </div>
    </>
  );
}
