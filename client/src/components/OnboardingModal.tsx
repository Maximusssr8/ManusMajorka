import {
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  Rocket,
  ShoppingBag,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { capture } from '@/lib/posthog';
import { trpc } from '@/lib/trpc';

const ONBOARDING_KEY = 'majorka_onboarded';

interface OnboardingModalProps {
  userName?: string;
}

const experienceLevels = [
  { id: 'beginner', label: 'Complete Beginner', desc: 'Never sold online before', icon: '🌱' },
  {
    id: 'intermediate',
    label: 'Some Experience',
    desc: 'Sold a few products, learning the ropes',
    icon: '🌿',
  },
  {
    id: 'advanced',
    label: 'Experienced Seller',
    desc: 'Running an active store, looking to scale',
    icon: '🌳',
  },
];

const goals = [
  {
    id: 'find-product',
    label: 'Find a winning product',
    icon: ShoppingBag,
    color: '#00b4d8',
    path: '/app/product-discovery',
  },
  {
    id: 'build-store',
    label: 'Build my store',
    icon: Rocket,
    color: '#6366F1',
    path: '/app/website-generator',
  },
  {
    id: 'launch-ads',
    label: 'Launch my first ads',
    icon: Zap,
    color: '#ff6b6b',
    path: '/app/meta-ads',
  },
  {
    id: 'scale-up',
    label: "Scale what's working",
    icon: TrendingUp,
    color: '#6366F1',
    path: '/app/scaling-playbook',
  },
];

const budgetRanges = [
  { id: 'under-500', label: 'Under $500', desc: 'Testing the waters, lean start', icon: '💸' },
  {
    id: '500-2000',
    label: '$500 – $2,000',
    desc: 'Comfortable budget to launch properly',
    icon: '💰',
  },
  { id: '2000-plus', label: '$2,000+', desc: 'Ready to invest seriously in growth', icon: '🏦' },
];

export default function OnboardingModal({ userName }: OnboardingModalProps) {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  // Step 4 — import product
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedTitle, setImportedTitle] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const profileQuery = trpc.profile.get.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const updateProfile = trpc.profile.update.useMutation();

  useEffect(() => {
    // Fast path: check localStorage cache first
    const localDone = localStorage.getItem(ONBOARDING_KEY);
    if (localDone) return; // already onboarded per cache

    // If profile loaded from server, check onboardingCompleted
    if (profileQuery.data !== undefined) {
      if (profileQuery.data?.onboardingCompleted) {
        // Server says done — sync localStorage cache
        localStorage.setItem(ONBOARDING_KEY, 'true');
        return;
      }
      // Not completed on server either — show modal
      setVisible(true);
    }

    // If profile query errored (e.g. not logged in), fall back to showing modal
    if (profileQuery.error) {
      setVisible(true);
    }
  }, [profileQuery.data, profileQuery.error]);

  /** Persist onboarding data to Supabase via tRPC and cache in localStorage */
  const persistOnboarding = () => {
    // Write to localStorage as fast cache/fallback
    localStorage.setItem(ONBOARDING_KEY, 'true');
    if (selectedLevel) localStorage.setItem('majorka_level', selectedLevel);
    if (selectedGoal) localStorage.setItem('majorka_goal', selectedGoal);
    if (selectedBudget) localStorage.setItem('majorka_budget', selectedBudget);

    // Persist to Supabase via tRPC (fire-and-forget; localStorage is already set)
    updateProfile.mutate({
      onboardingCompleted: true,
      ...(selectedLevel ? { experienceLevel: selectedLevel } : {}),
      ...(selectedGoal ? { mainGoal: selectedGoal } : {}),
      ...(selectedBudget ? { budget: selectedBudget } : {}),
    });
  };

  const handleDismiss = () => {
    persistOnboarding();
    setVisible(false);
  };

  const handleFinish = () => {
    persistOnboarding();
    capture('onboarding_completed', {
      experience_level: selectedLevel,
      goal: selectedGoal,
      budget: selectedBudget,
    });
    setVisible(false);
    // Navigate to chosen goal
    const goal = goals.find((g) => g.id === selectedGoal);
    if (goal) navigate(goal.path);
  };

  const handleStep3Next = () => {
    if (selectedBudget) {
      capture('onboarding_step_completed', { step: 3, budget: selectedBudget });
      setStep(4);
    }
  };

  const handleImportProduct = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    setImportedTitle(null);
    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any).error || `Failed: ${response.status}`);
      }
      const data = (await response.json()) as { productTitle?: string };
      setImportedTitle(data.productTitle || 'Product imported');
      setImportSuccess(true);
      localStorage.setItem('majorka_onboarded', 'true');
      setTimeout(() => {
        setVisible(false);
        navigate('/app');
      }, 1500);
    } catch (err: any) {
      setImportError(err?.message || 'Could not import this URL. Try another or skip.');
    } finally {
      setImporting(false);
    }
  }, [importUrl, navigate]);

  if (!visible) return null;

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid #F0F0F0',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5 transition-all"
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

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: '#F9FAFB' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            }}
          />
        </div>

        <div className="p-6">
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">👋</div>
                <h2
                  className="text-lg font-extrabold mb-1"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
                >
                  Welcome{userName ? `, ${userName}` : ''}!
                </h2>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  Let's personalise your experience. What's your e-commerce level?
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {experienceLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background:
                        selectedLevel === level.id
                          ? 'rgba(99,102,241,0.12)'
                          : '#FAFAFA',
                      border: `1.5px solid ${selectedLevel === level.id ? 'rgba(99,102,241,0.4)' : '#E5E7EB'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="text-xl">{level.icon}</span>
                    <div>
                      <div
                        className="text-xs font-bold"
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                          color: selectedLevel === level.id ? '#6366F1' : '#0A0A0A',
                        }}
                      >
                        {level.label}
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {level.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (selectedLevel) {
                    capture('onboarding_step_completed', {
                      step: 1,
                      experience_level: selectedLevel,
                    });
                    setStep(2);
                  }
                }}
                disabled={!selectedLevel}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{
                  background: selectedLevel
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : '#F9FAFB',
                  color: selectedLevel ? '#FAFAFA' : '#9CA3AF',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  cursor: selectedLevel ? 'pointer' : 'not-allowed',
                  border: 'none',
                }}
              >
                Continue <ChevronRight size={14} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">🎯</div>
                <h2
                  className="text-lg font-extrabold mb-1"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
                >
                  What's your priority?
                </h2>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  We'll take you straight to the right tool.
                </p>
              </div>

              <div className="space-y-2 mb-4">
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{
                        background:
                          selectedGoal === goal.id ? `${goal.color}15` : '#FAFAFA',
                        border: `1.5px solid ${selectedGoal === goal.id ? `${goal.color}50` : '#E5E7EB'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${goal.color}15` }}
                      >
                        <Icon size={16} style={{ color: goal.color }} />
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-xs font-bold"
                          style={{
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                            color: selectedGoal === goal.id ? goal.color : '#0A0A0A',
                          }}
                        >
                          {goal.label}
                        </div>
                      </div>
                      {selectedGoal === goal.id && (
                        <div className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #F0F0F0',
                    color: '#6B7280',
                    cursor: 'pointer',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => {
                    if (selectedGoal) {
                      capture('onboarding_step_completed', { step: 2, goal: selectedGoal });
                      setStep(3);
                    }
                  }}
                  disabled={!selectedGoal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{
                    background: selectedGoal
                      ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                      : '#F9FAFB',
                    color: selectedGoal ? '#FAFAFA' : '#9CA3AF',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    cursor: selectedGoal ? 'pointer' : 'not-allowed',
                    border: 'none',
                  }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">💰</div>
                <h2
                  className="text-lg font-extrabold mb-1"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
                >
                  Starting budget?
                </h2>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  This helps us tailor realistic strategies and expectations.
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {budgetRanges.map((budget) => (
                  <button
                    key={budget.id}
                    onClick={() => setSelectedBudget(budget.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background:
                        selectedBudget === budget.id
                          ? 'rgba(99,102,241,0.18)'
                          : '#FAFAFA',
                      border: `1.5px solid ${selectedBudget === budget.id ? 'rgba(99,102,241,0.60)' : '#E5E7EB'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="text-xl">{budget.icon}</span>
                    <div>
                      <div
                        className="text-xs font-bold"
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                          color: selectedBudget === budget.id ? '#6366F1' : '#0A0A0A',
                        }}
                      >
                        {budget.label}
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {budget.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #F0F0F0',
                    color: '#6B7280',
                    cursor: 'pointer',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleStep3Next}
                  disabled={!selectedBudget}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{
                    background: selectedBudget
                      ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                      : '#F9FAFB',
                    color: selectedBudget ? '#fff' : '#9CA3AF',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    cursor: selectedBudget ? 'pointer' : 'not-allowed',
                    border: 'none',
                    boxShadow: selectedBudget ? '0 4px 20px #C7D2FE' : 'none',
                  }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">📦</div>
                <h2
                  className="text-lg font-extrabold mb-1"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
                >
                  Import your first product to get started
                </h2>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  Paste any AliExpress, Amazon, or store URL and Majorka will analyse it instantly.
                </p>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex gap-2">
                  <input
                    value={importUrl}
                    onChange={(e) => {
                      setImportUrl(e.target.value);
                      setImportError('');
                      setImportedTitle(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleImportProduct()}
                    placeholder="https://aliexpress.com/item/... or any product URL"
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      background: '#F9FAFB',
                      border: `1.5px solid ${importError ? 'rgba(224,92,122,0.5)' : '#F5F5F5'}`,
                      color: '#0A0A0A',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.45)')}
                    onBlur={(e) =>
                      (e.target.style.borderColor = importError
                        ? 'rgba(224,92,122,0.5)'
                        : '#F5F5F5')
                    }
                  />
                  <button
                    onClick={handleImportProduct}
                    disabled={importing || !importUrl.trim()}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                      color: '#FAFAFA',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: importing || !importUrl.trim() ? 'not-allowed' : 'pointer',
                      border: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {importing ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Link2 size={12} />
                    )}
                    {importing ? 'Importing...' : 'Import'}
                  </button>
                </div>

                {importError && (
                  <div
                    className="text-xs p-2.5 rounded-lg"
                    style={{
                      background: 'rgba(224,92,122,0.1)',
                      border: '1px solid rgba(224,92,122,0.25)',
                      color: '#e05c7a',
                    }}
                  >
                    {importError}
                  </div>
                )}

                {importSuccess && importedTitle && (
                  <div
                    className="flex items-center gap-2 p-2.5 rounded-lg"
                    style={{
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.30)',
                    }}
                  >
                    <Check size={13} style={{ color: '#6366F1', flexShrink: 0 }} />
                    <span className="text-xs font-semibold" style={{ color: '#6366F1' }}>
                      ✓ Product imported! Taking you to your dashboard...
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #F0F0F0',
                    color: '#6B7280',
                    cursor: 'pointer',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: '#fff',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 20px #C7D2FE',
                  }}
                >
                  🚀 Let's Go!
                </button>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('majorka_onboarded', 'true');
                  persistOnboarding();
                  setVisible(false);
                  navigate('/app');
                }}
                className="w-full mt-3 text-xs transition-all"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                Skip for now
              </button>
            </>
          )}

          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background:
                    s === step
                      ? '#6366F1'
                      : s < step
                        ? 'rgba(99,102,241,0.4)'
                        : '#D1D5DB',
                  width: s === step ? 16 : 6,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ONBOARDING_KEY };
