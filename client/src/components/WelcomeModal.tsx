/**
 * WelcomeModal — full-screen overlay shown on first login only.
 * Checks localStorage: majorka_welcomed.
 */

import { Compass, Globe, Megaphone, Palette, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useProductTour } from './ProductTour';

const WELCOMED_KEY = 'majorka_welcomed';

interface Props {
  userName?: string;
}

const GOALS = [
  {
    id: 'find-product',
    label: 'Find a winning product to sell',
    icon: Search,
    path: '/app/intelligence',
  },
  { id: 'build-brand', label: 'Build my brand identity', icon: Palette, path: '/app/growth' },
  {
    id: 'create-store',
    label: 'Create my Shopify store',
    icon: Globe,
    path: '/app/website-generator',
  },
  { id: 'write-ads', label: 'Write my first ad campaign', icon: Megaphone, path: '/app/growth' },
  { id: 'explore', label: 'Just explore', icon: Compass, path: '/app' },
];

const STATS = [
  { value: '50+', label: 'AI Tools' },
  { value: '100%', label: 'AU Native' },
  { value: 'AUD', label: 'Pricing' },
];

export default function WelcomeModal({ userName }: Props) {
  const [visible, setVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { startTour } = useProductTour();

  useEffect(() => {
    if (!localStorage.getItem(WELCOMED_KEY)) {
      // Small delay for smooth entrance after page load
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(WELCOMED_KEY, 'true');
    setVisible(false);
  };

  const handleTakeTour = () => {
    dismiss();
    // Start driver.js tour after modal closes
    setTimeout(() => startTour(), 300);
  };

  const handleStartExploring = () => {
    const goal = GOALS.find((g) => g.id === selectedGoal);
    dismiss();
    if (goal) setLocation(goal.path);
  };

  if (!visible) return null;

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-lg mx-4 overflow-hidden animate-scale-in"
        style={{
          background: 'white',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center z-10"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: '#52525b',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>

        <div className="px-8 py-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-2xl mb-2" style={{ lineHeight: 1 }}>
              {'\u{1F1E6}\u{1F1FA}'}
            </div>
            <h1
              className="text-xl font-bold mb-2"
              style={{ fontFamily: 'Syne, sans-serif', color: '#374151' }}
            >
              Welcome to Majorka
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,245,245,0.5)', lineHeight: 1.6 }}>
              G'day {firstName}! You've just unlocked Australia's most powerful ecommerce AI
              toolkit.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-xl py-3 px-2"
                style={{
                  background: 'rgba(99,102,241,0.04)',
                  border: '1px solid rgba(99,102,241,0.1)',
                }}
              >
                <div
                  className="text-lg font-bold"
                  style={{ fontFamily: 'Syne, sans-serif', color: '#6366F1' }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: 'rgba(245,245,245,0.4)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Goal selection */}
          <div className="mb-6">
            <p
              className="text-sm font-bold mb-3"
              style={{ fontFamily: 'Syne, sans-serif', color: '#374151' }}
            >
              What do you want to do first?
            </p>
            <div className="space-y-2">
              {GOALS.map((goal) => {
                const Icon = goal.icon;
                const selected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selected ? 'rgba(99,102,241,0.3)' : '#E5E7EB'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <Icon size={14} style={{ color: selected ? '#6366F1' : '#71717a' }} />
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: selected ? '#374151' : 'rgba(55,65,81,0.6)' }}
                    >
                      {goal.label}
                    </span>
                    <div className="ml-auto flex-shrink-0">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{
                          border: `2px solid ${selected ? '#6366F1' : 'rgba(255,255,255,0.15)'}`,
                          background: selected ? '#6366F1' : 'transparent',
                        }}
                      >
                        {selected && (
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#FAFAFA' }}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleTakeTour}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#374151',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              Take the Tour
            </button>
            <button
              onClick={handleStartExploring}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                border: 'none',
                color: '#080a0e',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              }}
            >
              Start Exploring {'\u2192'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
