/**
 * OnboardingChecklist — v3 schema (Engagement Director).
 *
 * Backed by /api/onboarding/me which returns:
 *   { profile_complete, first_search, first_save, first_brief,
 *     store_connected, completed_at, created_at }
 *
 * Hidden when ANY of:
 *   - user signed up >14 days ago
 *   - 3 or more steps already completed
 *   - completed_at is set (server-side dismiss)
 *   - locally dismissed via X button
 */

import { CheckCircle2, Circle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const DISMISSED_KEY = 'majorka_onboarding_v3_dismissed';
const MAX_AGE_DAYS = 14;

type FlagKey =
  | 'profile_complete'
  | 'first_search'
  | 'first_save'
  | 'first_brief'
  | 'store_connected';

interface OnboardingRow {
  profile_complete: boolean;
  first_search: boolean;
  first_save: boolean;
  first_brief: boolean;
  store_connected: boolean;
  completed_at: string | null;
  created_at: string | null;
}

interface ChecklistItem {
  id: FlagKey;
  label: string;
  path: string;
}

const ITEMS: ChecklistItem[] = [
  { id: 'profile_complete', label: 'Pick your niche',     path: '/app/settings' },
  { id: 'first_search',     label: 'Search for products', path: '/app/products' },
  { id: 'first_save',       label: 'Save a product',      path: '/app/products' },
  { id: 'first_brief',      label: 'Read a brief',        path: '/app/products' },
  { id: 'store_connected',  label: 'Connect Shopify',     path: '/app/store-builder' },
];

async function fetchOnboarding(): Promise<OnboardingRow | null> {
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return null;
    const r = await fetch('/api/onboarding/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { success: boolean; data: OnboardingRow | null };
    return j.data ?? null;
  } catch {
    return null;
  }
}

function daysBetween(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const ts = value instanceof Date ? value.getTime() : Date.parse(String(value));
  if (!Number.isFinite(ts)) return 0;
  return Math.floor((Date.now() - ts) / 86_400_000);
}

export default function OnboardingChecklist() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [row, setRow] = useState<OnboardingRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [locallyDismissed, setLocallyDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (!isAuthenticated || locallyDismissed) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetchOnboarding().then((r) => {
      if (!cancelled) {
        setRow(r);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, locallyDismissed]);

  const completedCount = useMemo(() => {
    if (!row) return 0;
    return ITEMS.reduce((n, item) => n + (row[item.id] ? 1 : 0), 0);
  }, [row]);

  // Hard gates — hide when any condition is met.
  const accountAgeDays = daysBetween((user?.createdAt as string | Date | undefined) ?? row?.created_at ?? null);
  const tooOld         = accountAgeDays > MAX_AGE_DAYS;
  const enoughDone     = completedCount >= 3;
  const serverComplete = !!row?.completed_at;

  if (!loaded) return null;
  if (!isAuthenticated) return null;
  if (locallyDismissed) return null;
  if (tooOld || enoughDone || serverComplete) return null;
  if (!row) return null;

  const totalCount = ITEMS.length;
  const progress = (completedCount / totalCount) * 100;

  function handleDismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* */ }
    setLocallyDismissed(true);
  }

  return (
    <div
      className="rounded-xl p-4 mb-8 relative overflow-hidden"
      style={{
        background: 'rgba(212,175,55,0.03)',
        border: '1px solid rgba(212,175,55,0.12)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
          >
            Getting Started
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37' }}
          >
            {completedCount}/{totalCount} complete
          </span>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss onboarding"
          className="rounded flex items-center justify-center"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#9CA3AF',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #d4af37, #e5c158)',
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {ITEMS.map((item) => {
          const done = !!row[item.id];
          return (
            <button
              key={item.id}
              onClick={() => !done && setLocation(item.path)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all text-left"
              style={{
                background: done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
                cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.7 : 1,
              }}
            >
              {done ? (
                <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <Circle size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-medium truncate"
                  style={{
                    color: done ? '#10b981' : '#F8FAFC',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
