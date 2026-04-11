import { useState } from 'react';
import { useLocation } from 'wouter';
import { Globe, DollarSign, Sparkles, ArrowRight } from 'lucide-react';

/**
 * OnboardingWizard — first-time user 3-step setup.
 *
 * Shown once per browser (gated on localStorage majorka_onboarded).
 * Captures market preference + budget tier and persists both so the
 * rest of the app can react. Skippable. After completing, navigates
 * to /app/products.
 */

const MARKETS = [
  { code: 'AU', flag: '🇦🇺', name: 'Australia',     detail: 'Our home market — most products optimised here' },
  { code: 'US', flag: '🇺🇸', name: 'United States', detail: 'Largest market, highest competition' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom', detail: 'Strong dropshipping market, VAT-aware' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',        detail: 'CAD pricing, similar to US market' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand',   detail: 'Low competition, growing market' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany',       detail: "Europe's largest ecommerce market" },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore',     detail: 'APAC hub, 55% avg margins' },
];

const BUDGETS = [
  { id: 'testing',  label: 'Just testing',     range: 'Under $200/mo',  detail: 'Find products first, spend later' },
  { id: 'starter',  label: 'Getting started',  range: '$200–$500/mo',   detail: 'Ready to run first test ads' },
  { id: 'scaling',  label: 'Ready to scale',   range: '$500–$2k/mo',    detail: 'Already have a store, finding winners' },
  { id: 'serious',  label: 'Serious operator', range: '$2k+/mo',        detail: 'Running volume, need intelligence' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [market, setMarket] = useState('AU');
  const [budget, setBudget] = useState('');
  const [, navigate] = useLocation();

  function finish() {
    try {
      localStorage.setItem('majorka_onboarded', '1');
      localStorage.setItem('majorka_market', market);
      if (budget) localStorage.setItem('majorka_budget_tier', budget);
    } catch { /* quota / private mode */ }
    onComplete();
    navigate('/app/products');
  }

  function skip() {
    try { localStorage.setItem('majorka_onboarded', '1'); } catch { /* */ }
    onComplete();
  }

  const STEPS = [
    { Icon: Globe,       title: 'Which market are you selling in?', subtitle: "We'll show you products and pricing optimised for your market." },
    { Icon: DollarSign,  title: "What's your current ad budget?",   subtitle: "We'll tailor product recommendations to match your spend capacity." },
    { Icon: Sparkles,    title: "You're all set.",                  subtitle: `Top picks for ${market} are loaded. One click to start finding winners.` },
  ];

  const current = STEPS[step - 1];
  const Icon = current.Icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden glass-card glass-card--elevated"
      >
        <div className="px-7 pt-7 pb-5">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: s <= step ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)' }}
              />
            ))}
          </div>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            <Icon size={18} className="text-accent" strokeWidth={2} />
          </div>

          <h2 className="text-xl font-display font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
            {current.title}
          </h2>
          <p className="text-sm text-white/45">{current.subtitle}</p>
        </div>

        <div className="px-7 pb-7">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-6 max-h-[280px] overflow-y-auto">
              {MARKETS.map((m) => {
                const active = market === m.code;
                return (
                  <button
                    key={m.code}
                    onClick={() => setMarket(m.code)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <span className="text-2xl">{m.flag}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{m.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 mb-6">
              {BUDGETS.map((b) => {
                const active = budget === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setBudget(b.id)}
                    className="flex items-center justify-between w-full p-4 rounded-xl text-left transition-all"
                    style={{
                      background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{b.label}</div>
                      <div className="text-xs text-white/45 mt-0.5">{b.detail}</div>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-3"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
                    >
                      {b.range}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="mb-6 space-y-3">
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}
              >
                <div className="text-xs font-semibold text-green mb-2">✓ Setup complete</div>
                <div className="text-sm text-white/80 leading-relaxed">
                  We&apos;ll show you {market} products with prices and shipping tailored to that market. You can change this anytime in Settings.
                </div>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}
              >
                <div className="text-xs font-semibold text-accent-hover mb-2">What&apos;s next</div>
                <ul className="text-xs text-white/60 space-y-1.5">
                  <li>• Browse 3,200+ AI-scored products in your market</li>
                  <li>• Click any product → see Launch Readiness Score</li>
                  <li>• Generate a 7-day First Sale Blueprint with one click</li>
                  <li>• Build a Shopify store from any winner</li>
                </ul>
              </div>
            </div>
          )}

          {/* CTA row */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-3 rounded-xl text-sm text-white/45 hover:text-white/70 transition-colors border border-white/[0.08]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (step < 3 ? setStep((s) => s + 1) : finish())}
              disabled={step === 2 && !budget}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-accent)',
              }}
            >
              {step < 3 ? 'Continue' : 'Start finding products'}
              <ArrowRight size={15} strokeWidth={2.25} />
            </button>
          </div>

          <button
            onClick={skip}
            className="block text-center text-xs text-white/25 hover:text-white/45 mt-4 w-full transition-colors"
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  );
}
