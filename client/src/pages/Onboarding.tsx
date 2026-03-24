import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Baby,
  Bot,
  Building2,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Dumbbell,
  Globe,
  Heart,
  HelpCircle,
  Home,
  Loader2,
  Package,
  PawPrint,
  Rocket,
  Shirt,
  Shuffle,
  Smartphone,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Truck,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useDocumentTitle } from '@/_core/hooks/useDocumentTitle';
import { capture } from '@/lib/posthog';
import { trpc } from '@/lib/trpc';

export const ONBOARDING_KEY = 'majorka_onboarded';

// ─── Data ────────────────────────────────────────────────────────────────────

const NICHES = [
  { id: 'health-wellness', label: 'Health & Wellness', Icon: Heart },
  { id: 'beauty-skincare', label: 'Beauty & Skincare', Icon: Sparkles },
  { id: 'home-living', label: 'Home & Living', Icon: Home },
  { id: 'pets', label: 'Pets', Icon: PawPrint },
  { id: 'sports-fitness', label: 'Sports & Fitness', Icon: Dumbbell },
  { id: 'tech-gadgets', label: 'Tech & Gadgets', Icon: Smartphone },
  { id: 'fashion', label: 'Fashion & Accessories', Icon: Shirt },
  { id: 'baby-kids', label: 'Baby & Kids', Icon: Baby },
  { id: 'automotive', label: 'Automotive', Icon: Car },
  { id: 'other', label: 'Other / Not sure', Icon: HelpCircle },
];

const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    label: 'Just starting',
    desc: "I'm brand new to ecommerce",
    Icon: Sprout,
  },
  {
    id: 'intermediate',
    label: 'Some experience',
    desc: "I've made some sales, want to grow",
    Icon: TrendingUp,
  },
  {
    id: 'advanced',
    label: 'Scaling',
    desc: 'I have a store doing revenue, want to scale',
    Icon: Rocket,
  },
];

const GOALS = [
  { id: 'first-sale', label: 'Get my first sale', Icon: Target },
  { id: '5k-month', label: 'Hit $5K/month', Icon: DollarSign },
  { id: 'build-brand', label: 'Build a real brand', Icon: Building2 },
  { id: 'expand-markets', label: 'Expand to more markets', Icon: Globe },
  { id: 'automate', label: 'Automate and run on autopilot', Icon: Bot },
];

const STORE_TYPES = [
  { id: 'dropshipping', label: 'Dropshipping', desc: 'Supplier ships directly', Icon: Truck },
  { id: 'dtc', label: 'DTC', desc: 'I hold/fulfil inventory', Icon: Package },
  { id: 'both', label: 'Both / Not sure', desc: '', Icon: Shuffle },
];

const PLATFORMS = ['Shopify', 'WooCommerce', 'eBay AU', 'Amazon', 'Other'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GOLD = '#6366F1';
const GOLD_DIM = 'rgba(99,102,241,0.18)';
const GOLD_BORDER = 'rgba(99,102,241,0.4)';
const DIM_BG = '#FAFAFA';
const DIM_BORDER = '#F5F5F5';

function goldCard(active: boolean) {
  return {
    background: active ? GOLD_DIM : DIM_BG,
    border: `1.5px solid ${active ? GOLD_BORDER : DIM_BORDER}`,
    cursor: 'pointer' as const,
  };
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center">
            <motion.div
              animate={{
                width: active ? 24 : 8,
                background: active
                  ? GOLD
                  : done
                    ? 'rgba(99,102,241,0.5)'
                    : '#D1D5DB',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ height: 6, borderRadius: 99 }}
            />
            {step < total && (
              <div
                style={{
                  width: 16,
                  height: 1,
                  background: done ? GOLD_BORDER : '#F0F0F0',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated Checkmark ───────────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: `2px solid ${GOLD_BORDER}`,
        background: GOLD_DIM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.15 }}
      >
        <Check size={36} style={{ color: GOLD }} strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  useDocumentTitle('Get Started | Majorka');
  const [, navigate] = useLocation();
  const { user, session, isAuthenticated, loading: authLoading } = useAuth();
  const updateProfile = trpc.profile.update.useMutation();

  // Current step: 1-5 + "done"
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 'done'>(1);

  // Step 1 — name
  const [name, setName] = useState('');

  // Step 2 — niche
  const [niche, setNiche] = useState<string | null>(null);
  const [customNiche, setCustomNiche] = useState('');

  // Step 3 — experience
  const [experience, setExperience] = useState<string | null>(null);

  // Step 4 — goal
  const [goal, setGoal] = useState<string | null>(null);

  // Step 5 — store type + platform
  const [storeType, setStoreType] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  // Completion — AI first task
  const [firstTask, setFirstTask] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const firstTaskFetched = useRef(false);

  // Direction for animation (1 = forward, -1 = back)
  const [direction, setDirection] = useState(1);

  // Pre-fill name from auth
  useEffect(() => {
    if (user?.name) {
      setName(user.name.split(' ')[0] || user.name);
    } else if (session?.user?.user_metadata?.full_name) {
      const fn = session.user.user_metadata.full_name as string;
      setName(fn.split(' ')[0] || fn);
    } else if (session?.user?.email) {
      setName(session.user.email.split('@')[0] || '');
    }
  }, [user, session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/sign-in');
  }, [authLoading, isAuthenticated, navigate]);

  // Check if already onboarded
  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_KEY)) navigate('/app');
  }, [navigate]);

  // Fetch AI first task when reaching completion screen
  useEffect(() => {
    if (step !== 'done' || firstTaskFetched.current) return;
    firstTaskFetched.current = true;
    setTaskLoading(true);

    const token = session?.access_token;
    const nicheLabel =
      NICHES.find((n) => n.id === niche)?.label || customNiche || 'general ecommerce';
    const expLabel =
      experience === 'beginner'
        ? 'beginner'
        : experience === 'intermediate'
          ? 'intermediate'
          : 'advanced';

    const prompt = `Give me ONE specific first action for a ${expLabel} ${nicheLabel} dropshipper in Australia. 1-2 sentences, very specific, actionable. Start with a verb.`;

    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: prompt,
        toolName: 'ai-chat',
        stream: false,
      }),
    })
      .then((r) => r.json())
      .then((data: { reply?: string }) => {
        setFirstTask(data.reply?.slice(0, 180) || null);
      })
      .catch(() => setFirstTask(null))
      .finally(() => setTaskLoading(false));
  }, [step, session, niche, customNiche, experience]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  function goNext(from: number) {
    setDirection(1);
    setStep((from + 1) as typeof step);
    capture('onboarding_step_completed', { step: from });
  }

  function goBack(from: number) {
    setDirection(-1);
    setStep((from - 1) as typeof step);
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    updateProfile.mutate({ onboardingCompleted: false });
    navigate('/app');
  }

  async function handleComplete() {
    const nicheValue = customNiche.trim() || (NICHES.find((n) => n.id === niche)?.label ?? '');
    const storeInfo = [storeType, platform].filter(Boolean).join(' / ');

    // Save to localStorage
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(
      'majorka_user_profile',
      JSON.stringify({
        name,
        niche: nicheValue,
        experience,
        goal,
        storeType,
        platform,
      })
    );
    if (nicheValue) localStorage.setItem('majorka_niche', nicheValue);
    if (experience) localStorage.setItem('majorka_level', experience);
    if (goal) localStorage.setItem('majorka_goal', goal);

    // Save to Supabase
    updateProfile.mutate({
      targetNiche: nicheValue || undefined,
      experienceLevel: experience || undefined,
      mainGoal: goal || undefined,
      businessName: storeInfo || undefined,
      country: 'Australia',
      onboardingCompleted: true,
    });

    capture('onboarding_completed', { niche: nicheValue, experience, goal, storeType, platform });

    setDirection(1);
    setStep('done');
  }

  // ── Framer variants ───────────────────────────────────────────────────────

  const variants = {
    enter: (d: number) => ({ x: d * 80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -80, opacity: 0 }),
  };

  const firstName = name.trim().split(' ')[0] || 'there';
  const nicheLabel = NICHES.find((n) => n.id === niche)?.label || customNiche || 'your niche';
  const expLabel =
    EXPERIENCE_LEVELS.find((e) => e.id === experience)?.label?.toLowerCase() || 'beginner';

  if (authLoading) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#FAFAFA',
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: GOLD }}
          >
            <span
              className="text-black font-bold text-xs"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              M
            </span>
          </div>
          <span
            className="text-gray-900 font-semibold text-sm"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Majorka
          </span>
        </div>

        {step !== 'done' && (
          <button
            onClick={handleSkip}
            className="text-xs transition-colors"
            style={{
              background: 'none',
              border: 'none',
              color: '#D1D5DB',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6B7280')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#D1D5DB')}
          >
            Skip for now →
          </button>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {step !== 'done' && (
        <div
          className="h-0.5 w-full flex-shrink-0"
          style={{ background: '#F9FAFB' }}
        >
          <motion.div
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${GOLD}, #f0c040)` }}
            animate={{ width: `${((typeof step === 'number' ? step : 5) / 5) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Dots */}
          {step !== 'done' && (
            <div className="mb-8">
              <ProgressDots current={typeof step === 'number' ? step : 5} total={5} />
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            {/* ── STEP 1: Welcome ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: GOLD_DIM, border: `1.5px solid ${GOLD_BORDER}` }}
                  >
                    <User size={24} style={{ color: GOLD }} />
                  </div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
                  >
                    Welcome to Majorka{name ? `, ${name.split(' ')[0]}` : ''}
                  </h1>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Let's personalise your experience. Takes 2 minutes.
                  </p>
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: '#6B7280' }}
                  >
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && goNext(1)}
                    autoFocus
                    className="w-full rounded-xl py-3 px-4 text-sm outline-none transition-all"
                    style={{
                      background: '#F9FAFB',
                      border: '1.5px solid #F0F0F0',
                      color: '#374151',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
                    onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
                  />
                </div>

                <button
                  onClick={() => goNext(1)}
                  disabled={!name.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: name.trim()
                      ? `linear-gradient(135deg, ${GOLD}, #4F46E5)`
                      : '#F9FAFB',
                    color: name.trim() ? '#FAFAFA' : '#9CA3AF',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                    border: 'none',
                  }}
                >
                  Continue <ChevronRight size={15} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Niche ────────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div className="text-center space-y-1">
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
                  >
                    What do you sell?
                  </h1>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    We'll personalise every AI tool to your market.
                  </p>
                </div>

                {/* Niche grid */}
                <div className="grid grid-cols-2 gap-2">
                  {NICHES.map(({ id, label, Icon }) => {
                    const active = niche === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setNiche(id)}
                        className="text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                        style={goldCard(active)}
                        onMouseEnter={(e) => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background =
                              '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background = DIM_BG;
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? GOLD_DIM : '#F9FAFB' }}
                        >
                          <Icon
                            size={14}
                            style={{ color: active ? GOLD : '#6B7280' }}
                          />
                        </div>
                        <span
                          className="text-xs font-semibold leading-tight"
                          style={{
                            color: active ? GOLD : '#0A0A0A',
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                          }}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom niche input */}
                <div>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ color: '#9CA3AF' }}
                  >
                    Or describe your niche:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. sustainable baby products"
                    value={customNiche}
                    onChange={(e) => {
                      setCustomNiche(e.target.value);
                      if (e.target.value.trim()) setNiche(null);
                    }}
                    className="w-full rounded-xl py-2.5 px-3 text-sm outline-none transition-all"
                    style={{
                      background: '#F9FAFB',
                      border: '1.5px solid #F5F5F5',
                      color: '#374151',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = GOLD_BORDER)}
                    onBlur={(e) => (e.target.style.borderColor = '#F5F5F5')}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => goBack(2)}
                    className="px-4 py-3.5 rounded-xl transition-all"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #F0F0F0',
                      color: '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => goNext(2)}
                    disabled={!niche && !customNiche.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background:
                        niche || customNiche.trim()
                          ? `linear-gradient(135deg, ${GOLD}, #4F46E5)`
                          : '#F9FAFB',
                      color: niche || customNiche.trim() ? '#FAFAFA' : '#9CA3AF',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: niche || customNiche.trim() ? 'pointer' : 'not-allowed',
                      border: 'none',
                    }}
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Experience ───────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div className="text-center space-y-1">
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
                  >
                    How experienced are you?
                  </h1>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Honest answer helps us show the right content.
                  </p>
                </div>

                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map(({ id, label, desc, Icon }) => {
                    const active = experience === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setExperience(id)}
                        className="w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
                        style={goldCard(active)}
                        onMouseEnter={(e) => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background =
                              '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background = DIM_BG;
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? GOLD_DIM : '#F9FAFB' }}
                        >
                          <Icon
                            size={18}
                            style={{ color: active ? GOLD : '#6B7280' }}
                          />
                        </div>
                        <div>
                          <div
                            className="text-sm font-bold"
                            style={{
                              fontFamily: "'Bricolage Grotesque', sans-serif",
                              color: active ? GOLD : '#0A0A0A',
                            }}
                          >
                            {label}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: '#9CA3AF' }}
                          >
                            {desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => goBack(3)}
                    className="px-4 py-3.5 rounded-xl transition-all"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #F0F0F0',
                      color: '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => goNext(3)}
                    disabled={!experience}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: experience
                        ? `linear-gradient(135deg, ${GOLD}, #4F46E5)`
                        : '#F9FAFB',
                      color: experience ? '#FAFAFA' : '#9CA3AF',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: experience ? 'pointer' : 'not-allowed',
                      border: 'none',
                    }}
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Goal ─────────────────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div className="text-center space-y-1">
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
                  >
                    What's your #1 goal?
                  </h1>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    We'll align every tool to help you get there.
                  </p>
                </div>

                <div className="space-y-2">
                  {GOALS.map(({ id, label, Icon }) => {
                    const active = goal === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setGoal(id)}
                        className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all"
                        style={goldCard(active)}
                        onMouseEnter={(e) => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background =
                              '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background = DIM_BG;
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? GOLD_DIM : '#F9FAFB' }}
                        >
                          <Icon
                            size={16}
                            style={{ color: active ? GOLD : '#6B7280' }}
                          />
                        </div>
                        <span
                          className="text-sm font-semibold"
                          style={{
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                            color: active ? GOLD : '#0A0A0A',
                          }}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => goBack(4)}
                    className="px-4 py-3.5 rounded-xl transition-all"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #F0F0F0',
                      color: '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => goNext(4)}
                    disabled={!goal}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: goal
                        ? `linear-gradient(135deg, ${GOLD}, #4F46E5)`
                        : '#F9FAFB',
                      color: goal ? '#FAFAFA' : '#9CA3AF',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: goal ? 'pointer' : 'not-allowed',
                      border: 'none',
                    }}
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Store Setup ──────────────────────────────────────── */}
            {step === 5 && (
              <motion.div
                key="step-5"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div className="text-center space-y-1">
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
                  >
                    How do you sell?
                  </h1>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Almost done — just two quick picks.
                  </p>
                </div>

                {/* Store type */}
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: '#6B7280' }}
                  >
                    Business model
                  </label>
                  <div className="space-y-2">
                    {STORE_TYPES.map(({ id, label, desc, Icon }) => {
                      const active = storeType === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setStoreType(id)}
                          className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all"
                          style={goldCard(active)}
                          onMouseEnter={(e) => {
                            if (!active)
                              (e.currentTarget as HTMLButtonElement).style.background =
                                '#F9FAFB';
                          }}
                          onMouseLeave={(e) => {
                            if (!active)
                              (e.currentTarget as HTMLButtonElement).style.background = DIM_BG;
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: active ? GOLD_DIM : '#F9FAFB' }}
                          >
                            <Icon
                              size={16}
                              style={{ color: active ? GOLD : '#6B7280' }}
                            />
                          </div>
                          <div>
                            <div
                              className="text-sm font-semibold"
                              style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                                color: active ? GOLD : '#0A0A0A',
                              }}
                            >
                              {label}
                            </div>
                            {desc && (
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: '#9CA3AF' }}
                              >
                                {desc}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Platform */}
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: '#6B7280' }}
                  >
                    Which platform?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => {
                      const active = platform === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setPlatform(p)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: active ? GOLD_DIM : '#F9FAFB',
                            border: `1.5px solid ${active ? GOLD_BORDER : DIM_BORDER}`,
                            color: active ? GOLD : '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => goBack(5)}
                    className="px-4 py-3.5 rounded-xl transition-all"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #F0F0F0',
                      color: '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!storeType}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: storeType
                        ? `linear-gradient(135deg, ${GOLD}, #4F46E5)`
                        : '#F9FAFB',
                      color: storeType ? '#FAFAFA' : '#9CA3AF',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: storeType ? 'pointer' : 'not-allowed',
                      border: 'none',
                      boxShadow: storeType ? '0 8px 24px rgba(99,102,241,0.2)' : 'none',
                    }}
                  >
                    Finish Setup <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── COMPLETION ───────────────────────────────────────────────── */}
            {step === 'done' && (
              <motion.div
                key="done"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-8 text-center"
              >
                {/* Checkmark */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex justify-center"
                >
                  <AnimatedCheck />
                </motion.div>

                <div className="space-y-2">
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
                  >
                    You're all set, {firstName}!
                  </h1>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Majorka is now personalised for{' '}
                    <span style={{ color: GOLD }}>{nicheLabel}</span> sellers at{' '}
                    <span style={{ color: GOLD }}>{expLabel}</span> level.
                  </p>
                </div>

                {/* AI First Task Card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  style={{
                    background: 'rgba(99,102,241,0.05)',
                    border: `1.5px solid ${GOLD_BORDER}`,
                    borderRadius: 16,
                    padding: '20px 24px',
                    textAlign: 'left',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} style={{ color: GOLD }} />
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: GOLD, fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      Your First Task
                    </span>
                  </div>
                  {taskLoading ? (
                    <div
                      className="flex items-center gap-2"
                      style={{ color: '#9CA3AF' }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-sm">Personalising your action plan...</span>
                    </div>
                  ) : firstTask ? (
                    <>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#0A0A0A' }}>
                        {firstTask}
                      </p>
                      <button
                        onClick={() => navigate('/app/product-discovery')}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: GOLD,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        Do this first <ArrowRight size={13} />
                      </button>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      Head to your dashboard to get started with personalised tools.
                    </p>
                  )}
                </motion.div>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <button
                    onClick={() => navigate('/app')}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD}, #4F46E5)`,
                      color: '#FAFAFA',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
                    }}
                  >
                    Go to Dashboard <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => navigate('/app')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #F0F0F0',
                      color: '#374151',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = '#D1D5DB')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = '#F0F0F0')
                    }
                  >
                    Explore Tools
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
