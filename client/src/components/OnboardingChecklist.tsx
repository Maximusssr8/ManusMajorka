/**
 * OnboardingChecklist — Supabase-backed checklist for new users.
 * Falls back to localStorage when not authenticated.
 * Disappears after all items are completed or user dismisses it.
 */

import { ArrowRight, CheckCircle2, Circle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { getOnboardingState, type OnboardingStep } from '@/lib/onboarding';

const DISMISSED_KEY = 'majorka_onboarding_v2_dismissed';

interface ChecklistItem {
  id: OnboardingStep;
  label: string;
  description: string;
  path: string;
}

const ITEMS: ChecklistItem[] = [
  {
    id: 'scouted_product',
    label: 'Scout your first product',
    description: 'Find a winning product to sell',
    path: '/app/winning-products',
  },
  {
    id: 'generated_store',
    label: 'Generate a store',
    description: 'Build your Shopify store in minutes',
    path: '/app/website-generator',
  },
  {
    id: 'connected_shopify',
    label: 'Connect Shopify',
    description: 'Link your Shopify account',
    path: '/app/website-generator',
  },
  {
    id: 'pushed_to_shopify',
    label: 'Launch to Shopify',
    description: 'Push your store live',
    path: '/app/website-generator',
  },
];

export default function OnboardingChecklist() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    getOnboardingState(user?.id).then((state) => {
      const done = new Set<string>();
      for (const [key, val] of Object.entries(state)) {
        if (val) done.add(key);
      }

      if (done.size >= ITEMS.length) {
        localStorage.setItem(DISMISSED_KEY, 'true');
        return;
      }

      setCompleted(done);
      setDismissed(false);
    });
  }, [user?.id]);

  // Poll for changes
  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      getOnboardingState(user?.id).then((state) => {
        const done = new Set<string>();
        for (const [key, val] of Object.entries(state)) {
          if (val) done.add(key);
        }
        if (done.size > completed.size) {
          setCompleted(done);
          if (done.size >= ITEMS.length) {
            setShowConfetti(true);
            setTimeout(() => {
              setDismissed(true);
              localStorage.setItem(DISMISSED_KEY, 'true');
            }, 3000);
          }
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissed, completed.size, user?.id]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (dismissed) return null;

  const completedCount = completed.size;
  const totalCount = ITEMS.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div
      className="rounded-xl p-4 mb-8 relative overflow-hidden"
      style={{
        background: 'rgba(99,102,241,0.03)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center gap-4">
          <span className="text-3xl animate-bounce" style={{ animationDelay: '0ms' }}>
            {'\u{1F389}'}
          </span>
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
          >
            You're a power user!
          </span>
          <span className="text-3xl animate-bounce" style={{ animationDelay: '150ms' }}>
            {'\u{1F389}'}
          </span>
        </div>
      )}

      {/* Header */}
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
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}
          >
            {completedCount}/{totalCount} complete
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background:
              progress === 100
                ? 'linear-gradient(90deg, #10b981, #6366F1)'
                : 'linear-gradient(90deg, #6366F1, #818CF8)',
          }}
        />
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {ITEMS.map((item) => {
          const done = completed.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => !done && setLocation(item.path)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all text-left"
              style={{
                background: done ? 'rgba(16,185,129,0.06)' : '#FAFAFA',
                border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : '#F9FAFB'}`,
                cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!done) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
              }}
              onMouseLeave={(e) => {
                if (!done) e.currentTarget.style.borderColor = '#F9FAFB';
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
                    color: done ? '#10b981' : '#0A0A0A',
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
