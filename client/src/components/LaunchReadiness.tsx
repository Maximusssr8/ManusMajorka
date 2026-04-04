/**
 * LaunchReadiness — cinematic kanban checklist with SVG progress dial.
 * Cards animate between columns via Framer Motion layoutId.
 * Confetti CSS fireworks fire when 100% complete.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Lock, Rocket } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

const LAUNCH_CSS = `
@keyframes firework-burst {
  0%   { transform: scale(0) translate(-50%, -50%); opacity: 1; }
  100% { transform: scale(1) translate(-50%, -50%); opacity: 0; }
}
@keyframes firework-particle {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(0) translateY(-40px); opacity: 0; }
}
@keyframes launch-ready-glow {
  0%,100% { box-shadow: 0 0 20px rgba(16,185,129,0.2); }
  50%      { box-shadow: 0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2); }
}
@keyframes confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
}
.launch-all-done {
  animation: launch-ready-glow 2s ease-in-out infinite;
}
.confetti-piece {
  position: absolute;
  width: 6px; height: 6px;
  border-radius: 1px;
  animation: confetti-fall 1.2s ease-out forwards;
}
@keyframes pulse-ring-launch {
  0%   { transform: scale(1); opacity: 0.8; }
  50%  { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}
`;

interface ChecklistItem {
  id: string;
  label: string;
  toolPath: string;
  toolLabel: string;
  icon: string;
  column: 'todo' | 'inprogress' | 'done';
}

const INITIAL_ITEMS: Omit<ChecklistItem, 'column'>[] = [
  {
    id: 'brand-dna',
    label: 'Create Brand DNA',
    toolPath: '/app/brand-dna',
    toolLabel: 'Brand DNA',
    icon: '🎨',
  },
  {
    id: 'product-discovery',
    label: 'Research your product',
    toolPath: '/app/product-discovery',
    toolLabel: 'Product Discovery',
    icon: '🔍',
  },
  {
    id: 'winning-products',
    label: 'Identify winning product',
    toolPath: '/app/winning-products',
    toolLabel: 'Winning Products',
    icon: '🏆',
  },
  {
    id: 'profit-calculator',
    label: 'Validate profit margins',
    toolPath: '/app/profit-calculator',
    toolLabel: 'Profit Calculator',
    icon: '📊',
  },
  {
    id: 'website-generator',
    label: 'Build your store page',
    toolPath: '/app/website-generator',
    toolLabel: 'Website Generator',
    icon: '🌐',
  },
  {
    id: 'meta-ads',
    label: 'Write first ad copy',
    toolPath: '/app/meta-ads',
    toolLabel: 'Meta Ads Pack',
    icon: '📢',
  },
  {
    id: 'supplier-finder',
    label: 'Contact your supplier',
    toolPath: '/app/supplier-finder',
    toolLabel: 'Supplier Finder',
    icon: '📦',
  },
  {
    id: 'store-spy',
    label: 'Analyse a competitor',
    toolPath: '/app/store-spy',
    toolLabel: 'Store Spy',
    icon: '🔎',
  },
];

const STORAGE_KEY = 'majorka_launch_checklist_v2';

type ColKey = 'todo' | 'inprogress' | 'done';

interface StoredState {
  [id: string]: ColKey;
}

function getStorageKey(userId?: string | null) {
  return userId ? `majorka_kanban_${userId}` : STORAGE_KEY;
}

function loadState(userId?: string | null): StoredState {
  // Try user-specific key first, then fall back to legacy key
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    // Migrate from legacy key if user-specific key is empty
    if (userId) {
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.setItem(key, legacy);
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return {};
}
function saveState(s: StoredState, userId?: string | null) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(s));
}

function buildItems(stored: StoredState): ChecklistItem[] {
  return INITIAL_ITEMS.map((item) => ({
    ...item,
    column: stored[item.id] ?? 'todo',
  }));
}

// SVG circular progress dial
function ProgressDial({ percent, allDone }: { percent: number; allDone: boolean }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = allDone ? '#10b981' : percent > 60 ? '#6366F1' : '#6366F1';

  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#F9FAFB" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1), stroke 0.4s ease' }}
        />
        {/* Glow */}
        {percent > 0 && (
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
              opacity: 0.5,
              transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)',
            }}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 18,
            color: allDone ? '#10b981' : '#0A0A0A',
            lineHeight: 1,
          }}
        >
          {allDone ? '🚀' : `${percent}%`}
        </span>
        {!allDone && (
          <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.04em' }}>
            DONE
          </span>
        )}
      </div>
    </div>
  );
}

// Confetti burst component
function ConfettiBurst() {
  const pieces = Array.from({ length: 18 });
  const colors = ['#6366F1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
  return (
    <div
      style={{ position: 'absolute', top: '20%', left: '50%', pointerEvents: 'none', zIndex: 10 }}
    >
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * 360;
        const dist = 40 + Math.random() * 30;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist;
        const color = colors[i % colors.length];
        const delay = Math.random() * 0.3;
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              background: color,
              left: 0,
              top: 0,
              transform: `translate(${dx}px, ${dy}px)`,
              animationDelay: `${delay}s`,
              animationDuration: `${0.9 + Math.random() * 0.5}s`,
              width: Math.random() > 0.5 ? 6 : 4,
              height: Math.random() > 0.5 ? 6 : 10,
              borderRadius: Math.random() > 0.5 ? '50%' : '1px',
            }}
          />
        );
      })}
    </div>
  );
}

const COLUMNS: { key: ColKey; label: string; color: string }[] = [
  { key: 'todo', label: 'To Do', color: '#9CA3AF' },
  { key: 'inprogress', label: 'In Progress', color: '#6366F1' },
  { key: 'done', label: 'Done ✓', color: '#10b981' },
];

interface LaunchReadinessProps {
  userId?: string | null;
}

export default function LaunchReadiness({ userId }: LaunchReadinessProps = {}) {
  const [, setLocation] = useLocation();
  const [stored, setStored] = useState<StoredState>(() => loadState(userId));
  const [showConfetti, setShowConfetti] = useState(false);

  const items = buildItems(stored);
  const doneCount = items.filter((i) => i.column === 'done').length;
  const total = items.length;
  const percent = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  useEffect(() => {
    saveState(stored, userId);
  }, [stored, userId]);

  // Fire confetti when all done
  useEffect(() => {
    if (allDone) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1800);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  const cycleItem = useCallback(
    (id: string) => {
      setStored((prev) => {
        const cur: ColKey = prev[id] ?? 'todo';
        const next: ColKey = cur === 'todo' ? 'inprogress' : cur === 'inprogress' ? 'done' : 'todo';
        const newState = { ...prev, [id]: next };
        // Save immediately on card move
        saveState(newState, userId);
        return newState;
      });
    },
    [userId]
  );

  const resetBoard = useCallback(() => {
    const empty: StoredState = {};
    setStored(empty);
    saveState(empty, userId);
  }, [userId]);

  return (
    <div
      className={allDone ? 'launch-all-done' : ''}
      style={{
        background: allDone ? 'rgba(16,185,129,0.04)' : 'rgba(99,102,241,0.02)',
        border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.12)'}`,
        borderRadius: 16,
        padding: '20px 20px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.4s ease',
      }}
    >
      <style>{LAUNCH_CSS}</style>
      {showConfetti && <ConfettiBurst />}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Rocket size={16} style={{ color: allDone ? '#10b981' : '#6366F1', flexShrink: 0 }} />
          <div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 14, color: '#F8FAFC' }}>
              Launch Readiness
            </span>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
              {doneCount} of {total} complete · click a card to advance it
            </div>
          </div>
        </div>
        <ProgressDial percent={percent} allDone={allDone} />
      </div>

      {/* All done banner */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: 'rgba(16,185,129,0.10)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15, color: '#10b981' }}>
              You're launch-ready 🚀
            </span>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
              All checklist items complete. Time to go live.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          overflowX: 'auto',
        }}
      >
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.column === col.key);
          return (
            <div
              key={col.key}
              style={{
                background: '#05070F',
                border: `1px solid #F9FAFB`,
                borderRadius: 10,
                padding: 10,
                minWidth: 0,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: col.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: syne,
                    fontWeight: 700,
                    fontSize: 10,
                    color: col.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 9,
                    color: '#9CA3AF',
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 100,
                    padding: '1px 6px',
                  }}
                >
                  {colItems.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
                <AnimatePresence>
                  {colItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={`kanban-card-${item.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      onClick={() => cycleItem(item.id)}
                      style={{
                        background:
                          col.key === 'done'
                            ? 'rgba(16,185,129,0.06)'
                            : col.key === 'inprogress'
                              ? 'rgba(99,102,241,0.06)'
                              : '#FAFAFA',
                        border: `1px solid ${col.key === 'done' ? 'rgba(16,185,129,0.18)' : col.key === 'inprogress' ? 'rgba(99,102,241,0.18)' : '#F9FAFB'}`,
                        borderRadius: 8,
                        padding: '8px 10px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: dm,
                            color: col.key === 'done' ? '#9CA3AF' : '#6B7280',
                            textDecoration: col.key === 'done' ? 'line-through' : 'none',
                            flex: 1,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      {col.key !== 'done' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(item.toolPath);
                          }}
                          style={{
                            marginTop: 5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10,
                            fontWeight: 600,
                            color: col.key === 'inprogress' ? '#6366F1' : '#9CA3AF',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontFamily: dm,
                          }}
                        >
                          {item.toolLabel} <ArrowRight size={8} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colItems.length === 0 && (
                  <div
                    style={{
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic' }}>
                      {col.key === 'done'
                        ? 'Nothing done yet'
                        : col.key === 'inprogress'
                          ? 'Nothing in progress'
                          : 'All clear!'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <p style={{ fontSize: 10, color: '#94A3B8' }}>
          Click any card to cycle it through the columns
        </p>
        <button
          onClick={resetBoard}
          style={{
            fontSize: 10,
            color: '#94A3B8',
            background: 'none',
            border: '1px solid #F9FAFB',
            borderRadius: 6,
            padding: '3px 8px',
            cursor: 'pointer',
            transition: 'color 150ms ease, border-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#F9FAFB';
          }}
        >
          Reset board
        </button>
      </div>
    </div>
  );
}
