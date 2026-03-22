/**
 * UsageCounter — Futuristic HUD panel tracking daily search quota.
 * Shown at the top of every tool page for all users (free or logged-out).
 * Tracks usage via localStorage by calendar day.
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// ── Constants ─────────────────────────────────────────────────────────────────

export const DAILY_LIMIT = 10;

function todayKey(): string {
  return `majorka_usage_${new Date().toISOString().slice(0, 10)}`;
}

export function getUsageCount(): number {
  try {
    return parseInt(localStorage.getItem(todayKey()) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementUsage(): number {
  try {
    const next = getUsageCount() + 1;
    localStorage.setItem(todayKey(), String(next));
    return next;
  } catch {
    return 0;
  }
}

export function isAtLimit(): boolean {
  return getUsageCount() >= DAILY_LIMIT;
}

// ── Reset countdown ───────────────────────────────────────────────────────────

function getResetLabel(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diffMs = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface UsageCounterProps {
  /** If omitted, reads from localStorage */
  count?: number;
}

export default function UsageCounter({ count: countProp }: UsageCounterProps) {
  const [count, setCount] = useState(countProp ?? getUsageCount());
  const [resetLabel, setResetLabel] = useState(getResetLabel());
  const [, setLocation] = useLocation();

  // Sync when localStorage changes (e.g. after a search)
  useEffect(() => {
    if (countProp !== undefined) {
      setCount(countProp);
      return;
    }
    const update = () => setCount(getUsageCount());
    update();
    const interval = setInterval(update, 5_000);
    return () => clearInterval(interval);
  }, [countProp]);

  // Update reset timer every minute
  useEffect(() => {
    const interval = setInterval(() => setResetLabel(getResetLabel()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.min((count / DAILY_LIMIT) * 100, 100);
  const atLimit = count >= DAILY_LIMIT;
  const warning = count >= 8 && !atLimit;
  const barColor = atLimit || warning ? '#ef4444' : '#6366F1';
  const barColorEnd = atLimit || warning ? '#f87171' : '#f0c840';

  return (
    <>
      <style>{`
        @keyframes usage-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes usage-bar-pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 14px rgba(239,68,68,0.7); }
        }
      `}</style>

      <div
        style={{
          background: 'rgba(99,102,241,0.04)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          ...(atLimit ? { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' } : {}),
        }}
      >
        {/* Row 1 — label + PRO badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6366F1', fontSize: 13, fontWeight: 700, letterSpacing: '0.03em' }}>
              ◈
            </span>
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 11,
                fontWeight: 800,
                color: atLimit ? '#ef4444' : 'rgba(240,237,232,0.7)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                animation: warning || atLimit ? 'usage-pulse 2s ease-in-out infinite' : undefined,
              }}
            >
              {atLimit ? 'LIMIT REACHED' : 'DAILY INTELLIGENCE QUOTA'}
            </span>
          </div>

          <button
            onClick={() => setLocation('/pricing')}
            style={{
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#000',
              border: 'none',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            PRO
          </button>
        </div>

        {/* Row 2 — progress bar + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Bar track */}
          <div
            style={{
              flex: 1,
              height: 6,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${barColor}, ${barColorEnd})`,
                borderRadius: 3,
                transition: 'width 0.4s ease',
                ...(warning || atLimit ? { animation: 'usage-bar-pulse 1.5s ease-in-out infinite' } : {}),
              }}
            />
          </div>

          {/* Count */}
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              fontWeight: 700,
              color: atLimit ? '#ef4444' : warning ? '#ef4444' : '#6366F1',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {count} / {DAILY_LIMIT}
          </span>
        </div>

        {/* Row 3 — footer text */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {atLimit ? (
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
              Limit reached — upgrade to continue
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)' }}>
              Resets in {resetLabel} · Upgrade for unlimited
            </span>
          )}

          {(warning || atLimit) && (
            <button
              onClick={() => setLocation('/pricing')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 12,
                fontWeight: 700,
                color: '#6366F1',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Upgrade ↗
            </button>
          )}
        </div>
      </div>
    </>
  );
}
