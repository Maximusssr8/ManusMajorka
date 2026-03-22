/**
 * Upgrade Modal — Variant B: Price-anchored
 * "Less than $1.65/day — less than your morning coffee"
 */
import { ArrowRight, Check, Coffee, Star, X } from 'lucide-react';
import { capture } from '@/lib/posthog';

interface UpgradeModalBProps {
  placement: string;
  currentTier: string;
  onClose: () => void;
  onUpgrade: (tier: string) => void;
}

export default function UpgradeModalB({
  placement,
  currentTier,
  onClose,
  onUpgrade,
}: UpgradeModalBProps) {
  const handleUpgrade = (planId: string) => {
    capture('upgrade_clicked', {
      from_tier: currentTier,
      to_tier: planId,
      trigger_feature: placement,
      variant: 'B',
    });
    onUpgrade(planId);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
          style={{
            cursor: 'pointer',
            color: 'rgba(240,237,232,0.4)',
            background: 'none',
            border: 'none',
            zIndex: 10,
          }}
        >
          <X size={16} />
        </button>

        <div className="p-6 text-center">
          <div className="text-4xl mb-3">
            <Coffee size={40} style={{ color: '#6366F1', margin: '0 auto' }} />
          </div>
          <h2
            className="text-xl font-black mb-2"
            style={{ fontFamily: 'Syne, sans-serif', color: '#0A0A0A' }}
          >
            Less than your morning coffee
          </h2>
          <p className="text-sm mb-1" style={{ color: 'rgba(240,237,232,0.5)' }}>
            For <span style={{ color: '#6366F1', fontWeight: 700 }}>$1.63/day</span>, get an entire
            AI ecommerce team working for you.
          </p>

          {/* Price comparison */}
          <div
            className="mt-5 rounded-xl p-4"
            style={{
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.12)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>
                Flat white in Sydney
              </span>
              <span className="text-sm font-bold" style={{ color: 'rgba(240,237,232,0.6)' }}>
                ~$5.50/day
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>
                Hiring a VA
              </span>
              <span className="text-sm font-bold" style={{ color: 'rgba(240,237,232,0.6)' }}>
                ~$30/day
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>
                Freelance copywriter
              </span>
              <span className="text-sm font-bold" style={{ color: 'rgba(240,237,232,0.6)' }}>
                ~$150/task
              </span>
            </div>
            <div className="h-px my-2" style={{ background: 'rgba(99,102,241,0.2)' }} />
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold"
                style={{ color: '#6366F1', fontFamily: 'Syne, sans-serif' }}
              >
                Majorka Builder
              </span>
              <span
                className="text-lg font-black"
                style={{ color: '#6366F1', fontFamily: 'Syne, sans-serif' }}
              >
                $1.63/day
              </span>
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1 mt-4 mb-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={12} fill="#6366F1" style={{ color: '#6366F1' }} />
            ))}
            <span className="text-xs ml-1" style={{ color: 'rgba(240,237,232,0.4)' }}>
              Used by AU sellers daily
            </span>
          </div>

          {/* CTA buttons */}
          <button
            onClick={() => handleUpgrade('builder')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all mb-2"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #f0c040)',
              color: '#080a0e',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
            }}
          >
            Get Builder — $49/mo <ArrowRight size={14} />
          </button>

          <button
            onClick={() => handleUpgrade('scale')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(240,237,232,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
            }}
          >
            Or go Scale — $149/mo (API + bulk export)
          </button>

          <button
            onClick={onClose}
            className="mt-3 text-xs transition-all"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(240,237,232,0.25)',
              cursor: 'pointer',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
