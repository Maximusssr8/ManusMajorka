/**
 * StreakWidget — daily login streak tracker using localStorage.
 * Tracks majorka_last_visit (YYYY-MM-DD) and majorka_streak (number).
 */

import { useEffect, useState } from 'react';

const C = {
  bg: 'white',
  border: '#E5E7EB',
  text: '#374151',
  secondary: '#94949e',
  muted: '#52525b',
  gold: '#6366F1',
  goldDim: 'rgba(99,102,241,0.10)',
  goldBorder: 'rgba(99,102,241,0.25)',
  green: '#22c55e',
};

const MILESTONES = [
  { days: 3, emoji: '🔥', label: 'On Fire' },
  { days: 7, emoji: '🏆', label: 'Weekly Champion' },
  { days: 14, emoji: '💎', label: 'Diamond' },
  { days: 30, emoji: '👑', label: 'Royalty' },
];

const NEXT_MILESTONE_AFTER = [3, 7, 14, 30, 50];

function getNextMilestone(streak: number): { days: number; emoji: string; label: string } | null {
  for (const m of MILESTONES) {
    if (streak < m.days) return m;
  }
  return null;
}

function getBadge(streak: number): { emoji: string; label: string } {
  let best = { emoji: '⚡', label: 'Getting Started' };
  for (const m of MILESTONES) {
    if (streak >= m.days) best = m;
  }
  return best;
}

function computeStreak(): number {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('majorka_last_visit');
    const storedStreak = parseInt(localStorage.getItem('majorka_streak') ?? '0', 10);

    if (!lastVisit) {
      localStorage.setItem('majorka_last_visit', today);
      localStorage.setItem('majorka_streak', '1');
      return 1;
    }

    if (lastVisit === today) return storedStreak;

    const last = new Date(lastVisit);
    const now = new Date(today);
    const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000);

    if (diffDays === 1) {
      const newStreak = storedStreak + 1;
      localStorage.setItem('majorka_last_visit', today);
      localStorage.setItem('majorka_streak', String(newStreak));
      return newStreak;
    }

    // Gap > 1 day — reset
    localStorage.setItem('majorka_last_visit', today);
    localStorage.setItem('majorka_streak', '1');
    return 1;
  } catch {
    return 1;
  }
}

function wasMilestoneShown(days: number): boolean {
  try {
    return localStorage.getItem(`majorka_milestone_${days}`) === '1';
  } catch {
    return false;
  }
}

function markMilestoneShown(days: number) {
  try {
    localStorage.setItem(`majorka_milestone_${days}`, '1');
  } catch {}
}

export default function StreakWidget() {
  const [streak, setStreak] = useState(0);
  const [popup, setPopup] = useState<{ emoji: string; label: string; days: number } | null>(null);

  useEffect(() => {
    const s = computeStreak();
    setStreak(s);

    // Check for milestone popup (one-time)
    for (const m of MILESTONES) {
      if (s === m.days && !wasMilestoneShown(m.days)) {
        markMilestoneShown(m.days);
        setPopup({ ...m });
        break;
      }
    }
  }, []);

  const badge = getBadge(streak);
  const next = getNextMilestone(streak);
  const daysToNext = next ? next.days - streak : 0;

  // Progress: toward next milestone
  const prevMilestone = (() => {
    let prev = 0;
    for (const m of MILESTONES) {
      if (streak < m.days) break;
      prev = m.days;
    }
    return prev;
  })();
  const progressMax = next ? next.days - prevMilestone : 30;
  const progressVal = Math.min(streak - prevMilestone, progressMax);
  const progressPct = Math.round((progressVal / progressMax) * 100);

  return (
    <>
      {/* Milestone popup */}
      {popup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setPopup(null)}
        >
          <div
            style={{
              background: 'white',
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 20,
              padding: '40px 48px',
              textAlign: 'center',
              maxWidth: 340,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>{popup.emoji}</div>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 22,
                fontWeight: 800,
                color: C.gold,
                marginBottom: 8,
              }}
            >
              Achievement Unlocked!
            </div>
            <div style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              "{popup.label}" Badge
            </div>
            <div style={{ color: C.secondary, fontSize: 13, marginBottom: 24 }}>
              {popup.days}-day streak — you're on a roll! 🚀
            </div>
            <button
              onClick={() => setPopup(null)}
              style={{
                background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
                color: '#000',
                border: 'none',
                borderRadius: 10,
                padding: '10px 28px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Keep it going! →
            </button>
          </div>
        </div>
      )}

      {/* Widget */}
      <div
        style={{
          background: C.bg,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 14,
          padding: '14px 18px',
          minWidth: 220,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{badge.emoji}</span>
            <div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.2,
                }}
              >
                {streak}-Day Streak
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{badge.label}</div>
            </div>
          </div>
          <div
            style={{
              background: C.goldDim,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: C.gold,
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {streak}🔥
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 6,
            height: 6,
            marginBottom: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: `linear-gradient(90deg, ${C.gold}, #f0c84a)`,
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 6,
              transition: 'width 0.6s ease',
            }}
          />
        </div>

        <div style={{ fontSize: 11, color: C.muted }}>
          {next ? (
            <>
              {daysToNext} more day{daysToNext !== 1 ? 's' : ''} to unlock{' '}
              <span style={{ color: C.gold }}>"{next.label}" {next.emoji}</span>
            </>
          ) : (
            <span style={{ color: C.gold }}>👑 Streak Legend — keep going!</span>
          )}
        </div>
      </div>
    </>
  );
}
