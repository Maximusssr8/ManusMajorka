import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, ArrowRight, Package, Rocket } from 'lucide-react';

/**
 * OnboardingWizard — first-time user 3-step niche-based setup.
 *
 * Shown once per browser (gated on localStorage majorka_onboarded).
 * Step 1: pick a niche, Step 2: see first winning product,
 * Step 3: quick-start links. Skippable at every step.
 */

const NICHE_CHIPS = [
  { id: 'kitchen',  label: 'Kitchen' },
  { id: 'beauty',   label: 'Beauty' },
  { id: 'pet',      label: 'Pet' },
  { id: 'tech',     label: 'Tech' },
  { id: 'fitness',  label: 'Fitness' },
  { id: 'fashion',  label: 'Fashion' },
] as const;

interface WinnerProduct {
  product_title: string;
  category: string | null;
  price_aud: number | null;
  winning_score: number | null;
  image_url: string | null;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState('');
  const [nicheInput, setNicheInput] = useState('');
  const [winner, setWinner] = useState<WinnerProduct | null>(null);
  const [winnerLoading, setWinnerLoading] = useState(false);
  const [, navigate] = useLocation();

  const selectedNiche = niche || nicheInput.trim();

  // Fetch a winning product when entering step 2
  useEffect(() => {
    if (step !== 2 || !selectedNiche) return;
    let cancelled = false;
    setWinnerLoading(true);
    fetch(`/api/products?category=${encodeURIComponent(selectedNiche)}&limit=1&sort=winning_score`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data?.products ?? data?.data ?? []);
        if (items.length > 0) {
          setWinner(items[0] as WinnerProduct);
        }
        setWinnerLoading(false);
      })
      .catch(() => { if (!cancelled) setWinnerLoading(false); });
    return () => { cancelled = true; };
  }, [step, selectedNiche]);

  function finish() {
    try {
      localStorage.setItem('majorka_onboarded', '1');
      if (selectedNiche) localStorage.setItem('majorka_niche', selectedNiche);
    } catch { /* quota / private mode */ }
    onComplete();
  }

  function skip() {
    try { localStorage.setItem('majorka_onboarded', '1'); } catch { /* */ }
    onComplete();
  }

  function saveToLibrary() {
    if (!winner) return;
    try {
      const existing = JSON.parse(localStorage.getItem('majorka_lists_v1') ?? '[]');
      const defaultList = existing[0];
      if (defaultList) {
        defaultList.products = defaultList.products ?? [];
        defaultList.products.push({
          id: `onboard-${Date.now()}`,
          product_title: winner.product_title,
          category: winner.category,
          price_aud: winner.price_aud,
          winning_score: winner.winning_score,
          image_url: winner.image_url,
          saved_at: new Date().toISOString(),
        });
        localStorage.setItem('majorka_lists_v1', JSON.stringify(existing));
      }
    } catch { /* ignore */ }
    setStep(3);
  }

  const STEPS = [
    { Icon: Sparkles, title: "What's your niche?",          subtitle: "We'll show products tailored to your market." },
    { Icon: Package,  title: "Here's your first winning product", subtitle: `Top pick in ${selectedNiche || 'your niche'} — ready to sell.` },
    { Icon: Rocket,   title: "You're ready!",                subtitle: "Start building your dropshipping business." },
  ];

  const current = STEPS[step - 1];
  const StepIcon = current.Icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
    >
      <div className="w-full max-w-lg rounded-lg overflow-hidden bg-[#0f0f0f] border border-[#1a1a1a]">
        <div className="px-7 pt-7 pb-5">
          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: s <= step ? '#d4af37' : 'rgba(255,255,255,0.08)' }}
              />
            ))}
          </div>

          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            <StepIcon size={18} style={{ color: '#d4af37' }} strokeWidth={2} />
          </div>

          <h2 className="text-xl font-bold text-[#ededed] mb-1" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            {current.title}
          </h2>
          <p className="text-sm text-[#888888]">{current.subtitle}</p>
        </div>

        <div className="px-7 pb-7">
          {step === 1 && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Type your niche..."
                value={nicheInput}
                onChange={(e) => { setNicheInput(e.target.value); setNiche(''); }}
                className="w-full bg-[#080808] border border-[#1a1a1a] rounded-lg px-4 py-3 text-sm text-[#ededed] placeholder-[#555555] outline-none focus:border-[#d4af37] transition-colors mb-4"
              />
              <div className="flex flex-wrap gap-2">
                {NICHE_CHIPS.map((chip) => {
                  const active = niche === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => { setNiche(chip.id); setNicheInput(''); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? '#d4af37' : '#888888',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mb-6">
              {winnerLoading ? (
                <div className="rounded-lg p-6 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-sm text-[#888888]">Finding your first winner...</div>
                </div>
              ) : winner ? (
                <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start gap-4">
                    {winner.image_url && (
                      <img
                        src={winner.image_url}
                        alt={winner.product_title}
                        className="w-16 h-16 rounded-lg object-cover border border-[#1a1a1a]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#ededed] truncate">{winner.product_title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {winner.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#888888]">{winner.category}</span>
                        )}
                        {winner.price_aud != null && (
                          <span className="text-xs font-mono text-[#ededed]">${Number(winner.price_aud).toFixed(2)}</span>
                        )}
                        {winner.winning_score != null && (
                          <span className="text-xs font-mono" style={{ color: winner.winning_score >= 80 ? '#22c55e' : winner.winning_score >= 60 ? '#f59e0b' : '#ef4444' }}>
                            Score {winner.winning_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={saveToLibrary}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#3B82F6' }}
                  >
                    Save to library
                  </button>
                </div>
              ) : (
                <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm text-[#888888]">No products found for this niche yet. Browse all products to find your winner.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="mb-6 space-y-2">
              {[
                { label: 'Browse all products', path: '/app/products', icon: Package },
                { label: 'Generate your first ad', path: '/app/ads-studio', icon: Sparkles },
                { label: 'Build your store', path: '/app/store-builder', icon: Rocket },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => { finish(); navigate(link.path); }}
                  className="w-full flex items-center justify-between p-4 rounded-lg text-left transition-all hover:bg-white/[0.04]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-3">
                    <link.icon size={16} style={{ color: '#d4af37' }} />
                    <span className="text-sm font-semibold text-[#ededed]">{link.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-[#555555]" />
                </button>
              ))}
            </div>
          )}

          {/* CTA row */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-3 rounded-lg text-sm text-[#555555] hover:text-[#888888] transition-colors border border-[#1a1a1a]"
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !selectedNiche}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#3B82F6' }}
              >
                Continue
                <ArrowRight size={15} strokeWidth={2.25} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={finish}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#3B82F6' }}
              >
                Get started
                <ArrowRight size={15} strokeWidth={2.25} />
              </button>
            )}
          </div>

          <button
            onClick={skip}
            className="block text-center text-xs text-[#555555] hover:text-[#888888] mt-4 w-full transition-colors"
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  );
}
