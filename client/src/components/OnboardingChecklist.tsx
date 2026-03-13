/**
 * OnboardingChecklist — persistent checklist for new users (first week).
 * Disappears after all items are completed or user dismisses it.
 */

import { ArrowRight, CheckCircle2, Circle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const CHECKLIST_KEY = 'majorka_checklist';
const DISMISSED_KEY = 'majorka_checklist_dismissed';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  path: string;
  checkFn: () => boolean;
}

const ITEMS: ChecklistItem[] = [
  {
    id: 'account',
    label: 'Created your account',
    description: "You're here — nice one!",
    path: '/app',
    checkFn: () => true, // Always done if they're logged in
  },
  {
    id: 'product-discovery',
    label: 'Run Product Discovery',
    description: 'Find your first winning product',
    path: '/app/product-discovery',
    checkFn: () => {
      try {
        const raw = localStorage.getItem('majorka_recent_tools');
        const tools: string[] = raw ? JSON.parse(raw) : [];
        return tools.includes('product-discovery');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'brand-dna',
    label: 'Generate your Brand DNA',
    description: 'Define your brand identity and voice',
    path: '/app/brand-dna',
    checkFn: () => {
      try {
        const raw = localStorage.getItem('majorka_recent_tools');
        const tools: string[] = raw ? JSON.parse(raw) : [];
        return tools.includes('brand-dna');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'ad-copy',
    label: 'Create your first ad copy',
    description: 'Write compelling ad variations',
    path: '/app/meta-ads',
    checkFn: () => {
      try {
        const raw = localStorage.getItem('majorka_recent_tools');
        const tools: string[] = raw ? JSON.parse(raw) : [];
        return tools.includes('copywriter') || tools.includes('meta-ads');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'website',
    label: 'Download your website template',
    description: 'Get your Shopify store files',
    path: '/app/website-generator',
    checkFn: () => {
      try {
        const raw = localStorage.getItem('majorka_recent_tools');
        const tools: string[] = raw ? JSON.parse(raw) : [];
        return tools.includes('website-generator');
      } catch {
        return false;
      }
    },
  },
];

export default function OnboardingChecklist() {
  const [, setLocation] = useLocation();
  const [dismissed, setDismissed] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Check if dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Load completed state
    const savedCompleted = new Set<string>();
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) JSON.parse(raw).forEach((id: string) => savedCompleted.add(id));
    } catch {}

    // Check each item
    ITEMS.forEach((item) => {
      if (item.checkFn()) savedCompleted.add(item.id);
    });

    // If all completed, don't show
    if (savedCompleted.size >= ITEMS.length) {
      localStorage.setItem(DISMISSED_KEY, 'true');
      return;
    }

    setCompleted(savedCompleted);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(Array.from(savedCompleted)));
    setDismissed(false);
  }, []);

  // Check for newly completed items
  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      const newCompleted = new Set(completed);
      let changed = false;
      ITEMS.forEach((item) => {
        if (!newCompleted.has(item.id) && item.checkFn()) {
          newCompleted.add(item.id);
          changed = true;
        }
      });
      if (changed) {
        setCompleted(newCompleted);
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(Array.from(newCompleted)));
        if (newCompleted.size >= ITEMS.length) {
          setShowConfetti(true);
          setTimeout(() => {
            setDismissed(true);
            localStorage.setItem(DISMISSED_KEY, 'true');
          }, 3000);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissed, completed]);

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
        background: 'rgba(212,175,55,0.03)',
        border: '1px solid rgba(212,175,55,0.12)',
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
            style={{ fontFamily: 'Syne, sans-serif', color: '#d4af37' }}
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
            style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
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
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#52525b' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-4"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background:
              progress === 100
                ? 'linear-gradient(90deg, #10b981, #2dca72)'
                : 'linear-gradient(90deg, #d4af37, #f0c040)',
          }}
        />
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {ITEMS.map((item) => {
          const done = completed.has(item.id);
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
              onMouseEnter={(e) => {
                if (!done) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)';
              }}
              onMouseLeave={(e) => {
                if (!done) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              {done ? (
                <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <Circle size={14} style={{ color: '#52525b', flexShrink: 0 }} />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-medium truncate"
                  style={{
                    color: done ? '#10b981' : '#f5f5f5',
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
