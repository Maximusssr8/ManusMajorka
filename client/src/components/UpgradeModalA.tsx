/**
 * Upgrade Modal — Variant A: Feature-focused
 * "Unlock unlimited research + all 20 AI tools"
 */
import { Check, Code2, Download, Infinity, X, Zap } from 'lucide-react';
import { capture } from '@/lib/posthog';

interface UpgradeModalAProps {
  placement: string;
  currentTier: string;
  onClose: () => void;
  onUpgrade: (tier: string) => void;
}

const PLANS = [
  {
    id: 'builder',
    name: 'Builder',
    price: '$49',
    period: '/mo AUD',
    features: [
      'Unlimited AI tool usage',
      'All 20+ tools unlocked',
      'PDF & CSV exports',
      'Conversation memory',
      'Priority AI responses',
    ],
    cta: 'Start Building',
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$149',
    period: '/mo AUD',
    features: [
      'Everything in Builder',
      'Bulk export (CSV, ZIP)',
      'API access',
      'White-label exports',
      'Dedicated support',
      'Custom AI prompts',
    ],
    cta: 'Scale Up',
    popular: false,
  },
];

export default function UpgradeModalA({
  placement,
  currentTier,
  onClose,
  onUpgrade,
}: UpgradeModalAProps) {
  const handleUpgrade = (planId: string) => {
    capture('upgrade_clicked', {
      from_tier: currentTier,
      to_tier: planId,
      trigger_feature: placement,
      variant: 'A',
    });
    onUpgrade(planId);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{
          background: '#0d0d10',
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all"
          style={{
            cursor: 'pointer',
            color: '#9CA3AF',
            background: 'none',
            border: 'none',
            zIndex: 10,
          }}
        >
          <X size={16} />
        </button>

        <div className="p-6 pb-2 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Zap size={12} style={{ color: '#6366F1' }} />
            <span
              className="text-xs font-bold"
              style={{ color: '#6366F1', fontFamily: "'Syne', sans-serif" }}
            >
              Unlock Full Power
            </span>
          </div>
          <h2
            className="text-xl font-extrabold mb-2"
            style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
          >
            You've hit a limit
          </h2>
          <p className="text-sm mb-1" style={{ color: '#94A3B8' }}>
            Upgrade to unlock unlimited access to all Majorka AI tools.
          </p>
        </div>

        <div className="p-6 pt-4 grid grid-cols-2 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-xl p-4 flex flex-col"
              style={{
                background: plan.popular ? 'rgba(99,102,241,0.06)' : '#FAFAFA',
                border: `1.5px solid ${plan.popular ? 'rgba(99,102,241,0.3)' : '#F9FAFB'}`,
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: '#6366F1',
                    color: '#FAFAFA',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 9,
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <div className="mb-3">
                <div
                  className="text-xs font-bold mb-1"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
                >
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span
                    className="text-2xl font-extrabold"
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      color: plan.popular ? '#6366F1' : '#0A0A0A',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {plan.period}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 flex-1 mb-4">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check
                      size={11}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: plan.popular ? '#6366F1' : '#4ade80' }}
                    />
                    <span className="text-xs" style={{ color: '#CBD5E1' }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleUpgrade(plan.id)}
                className="w-full py-2.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: plan.popular
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : '#F9FAFB',
                  color: plan.popular ? '#FAFAFA' : '#0A0A0A',
                  border: plan.popular ? 'none' : '1px solid #F0F0F0',
                  fontFamily: "'Syne', sans-serif",
                  cursor: 'pointer',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5 text-center">
          <button
            onClick={onClose}
            className="text-xs transition-all"
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
