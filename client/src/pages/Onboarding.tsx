import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Search, PenTool, Palette, Users, Globe, BarChart2, Sparkles, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDocumentTitle } from "@/_core/hooks/useDocumentTitle";
import { capture } from "@/lib/posthog";
import { ONBOARDING_KEY } from "@/components/OnboardingModal";

// ─── Step 1: Niche + Store Status ───────────────────────────────────────────

const NICHES = [
  "General Merchandise",
  "Health & Wellness",
  "Pet Products",
  "Home & Garden",
  "Beauty & Skincare",
  "Electronics",
  "Clothing & Accessories",
  "Sports & Outdoors",
  "Baby & Kids",
  "Food & Beverage",
  "Other",
];

const STORE_STATUSES = [
  { id: "just-starting", label: "Just starting out", desc: "Haven't sold anything yet", emoji: "🌱" },
  { id: "have-store", label: "Have a Shopify store", desc: "Set up but still growing", emoji: "🏪" },
  { id: "already-selling", label: "Already selling (good revenue)", desc: "Active store, looking to scale", emoji: "🚀" },
];

// ─── Step 2: Goals (multi-select) ───────────────────────────────────────────

const GOALS = [
  { id: "find-products", label: "Find winning products", icon: Search, color: "#3b82f6" },
  { id: "write-copy", label: "Write better ad copy", icon: PenTool, color: "#d4af37" },
  { id: "build-brand", label: "Build my brand identity", icon: Palette, color: "#8b5cf6" },
  { id: "research-competitors", label: "Research competitors", icon: Users, color: "#ef4444" },
  { id: "create-store", label: "Create my website/store", icon: Globe, color: "#10b981" },
  { id: "understand-au", label: "Understand the AU market", icon: BarChart2, color: "#f59e0b" },
];

// ─── Step 3: Quick Setup ────────────────────────────────────────────────────

const BUDGET_OPTIONS = [
  { id: "under-500", label: "Under $500 AUD" },
  { id: "500-2000", label: "$500 - $2,000 AUD" },
  { id: "2000-plus", label: "$2,000+ AUD" },
  { id: "not-sure", label: "Not sure yet" },
];

const HOW_FOUND_OPTIONS = [
  "Google Search",
  "Social Media",
  "YouTube",
  "Friend/Referral",
  "Reddit",
  "Podcast",
  "Other",
];

// ─── Tool recommendations based on goals ────────────────────────────────────

const GOAL_TO_TOOLS: Record<string, { label: string; path: string; desc: string }> = {
  "find-products": { label: "Product Discovery", path: "/app/product-discovery", desc: "AI-powered product research for the AU market" },
  "write-copy": { label: "Copywriter", path: "/app/copywriter", desc: "Generate AU-native ad copy and product descriptions" },
  "build-brand": { label: "Brand DNA", path: "/app/brand-dna", desc: "Create your complete brand identity in minutes" },
  "research-competitors": { label: "Competitor Breakdown", path: "/app/competitor-breakdown", desc: "Deep analysis of your competitors' strategies" },
  "create-store": { label: "Website Generator", path: "/app/website-generator", desc: "Build a conversion-optimised landing page" },
  "understand-au": { label: "Market Intelligence", path: "/app/market-intel", desc: "AU market data, trends, and opportunities" },
};

// ─── Experience level mapping ───────────────────────────────────────────────

const STATUS_TO_EXPERIENCE: Record<string, string> = {
  "just-starting": "beginner",
  "have-store": "intermediate",
  "already-selling": "advanced",
};

export default function Onboarding() {
  useDocumentTitle("Get Started | Majorka");
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const updateProfile = trpc.profile.update.useMutation();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [niche, setNiche] = useState("");
  const [storeStatus, setStoreStatus] = useState<string | null>(null);

  // Step 2
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 3
  const [storeUrl, setStoreUrl] = useState("");
  const [budget, setBudget] = useState<string | null>(null);
  const [howFound, setHowFound] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/sign-in");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Check if already onboarded
  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_KEY)) {
      navigate("/app");
    }
  }, [navigate]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) return prev.filter(g => g !== goalId);
      if (prev.length >= 3) return prev;
      return [...prev, goalId];
    });
  };

  const getRecommendedTools = () => {
    return selectedGoals
      .map(g => GOAL_TO_TOOLS[g])
      .filter(Boolean)
      .slice(0, 3);
  };

  const handleComplete = () => {
    // Save to localStorage
    localStorage.setItem(ONBOARDING_KEY, "true");
    if (niche) localStorage.setItem("majorka_niche", niche);
    if (storeStatus) localStorage.setItem("majorka_level", STATUS_TO_EXPERIENCE[storeStatus] || storeStatus);
    if (selectedGoals.length > 0) localStorage.setItem("majorka_goal", selectedGoals[0]);
    if (budget) localStorage.setItem("majorka_budget", budget);

    // Save to server
    updateProfile.mutate({
      onboardingCompleted: true,
      targetNiche: niche || undefined,
      experienceLevel: storeStatus ? STATUS_TO_EXPERIENCE[storeStatus] : undefined,
      mainGoal: selectedGoals.join(","),
      budget: budget || undefined,
      businessName: storeUrl || undefined,
      country: "Australia",
    });

    capture("onboarding_completed", {
      niche,
      store_status: storeStatus,
      goals: selectedGoals,
      budget,
      how_found: howFound,
    });

    // Navigate to the first recommended tool, or dashboard
    const tools = getRecommendedTools();
    navigate(tools.length > 0 ? tools[0].path : "/app");
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    updateProfile.mutate({ onboardingCompleted: true });
    navigate("/app");
  };

  const firstName = user?.name?.split(" ")[0] || "there";
  const progress = (step / 4) * 100;

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080a0e" }}>
      {/* ── Top bar: Logo + Progress ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#d4af37" }}>
            <span className="text-black font-bold text-xs" style={{ fontFamily: "Syne, sans-serif" }}>M</span>
          </div>
          <span className="text-white font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Majorka</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-xs transition-colors"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          Skip setup
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, #d4af37, #f0c040)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Business Info ─────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">👋</div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
                  >
                    Tell us about your business
                  </h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    We'll personalise every AI response to your niche and stage.
                  </p>
                </div>

                {/* Niche dropdown */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    What's your niche?
                  </label>
                  <select
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    className="w-full rounded-xl py-3 px-4 text-sm outline-none appearance-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: niche ? "#f5f5f5" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    <option value="" disabled>Select your niche...</option>
                    {NICHES.map(n => (
                      <option key={n} value={n} style={{ background: "#1a1a2e", color: "#f5f5f5" }}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Store status */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Where are you at?
                  </label>
                  <div className="space-y-2">
                    {STORE_STATUSES.map(status => (
                      <button
                        key={status.id}
                        onClick={() => setStoreStatus(status.id)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                        style={{
                          background: storeStatus === status.id ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${storeStatus === status.id ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)"}`,
                          cursor: "pointer",
                        }}
                      >
                        <span className="text-xl">{status.emoji}</span>
                        <div>
                          <div
                            className="text-sm font-semibold"
                            style={{
                              fontFamily: "Syne, sans-serif",
                              color: storeStatus === status.id ? "#d4af37" : "#f5f5f5",
                            }}
                          >
                            {status.label}
                          </div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{status.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { capture("onboarding_step_completed", { step: 1, niche, store_status: storeStatus }); setStep(2); }}
                  disabled={!niche || !storeStatus}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: (niche && storeStatus) ? "linear-gradient(135deg, #d4af37, #b8941f)" : "rgba(255,255,255,0.06)",
                    color: (niche && storeStatus) ? "#080a0e" : "rgba(255,255,255,0.3)",
                    fontFamily: "Syne, sans-serif",
                    cursor: (niche && storeStatus) ? "pointer" : "not-allowed",
                    border: "none",
                  }}
                >
                  Continue <ChevronRight size={15} />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Goals ─────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
                  >
                    What do you need most right now?
                  </h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Pick up to 3. We'll recommend the right tools for you.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map(goal => {
                    const Icon = goal.icon;
                    const selected = selectedGoals.includes(goal.id);
                    const disabled = !selected && selectedGoals.length >= 3;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => !disabled && toggleGoal(goal.id)}
                        className="text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                        style={{
                          background: selected ? `${goal.color}12` : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${selected ? `${goal.color}45` : "rgba(255,255,255,0.07)"}`,
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.4 : 1,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${goal.color}15` }}
                        >
                          <Icon size={14} style={{ color: selected ? goal.color : "rgba(255,255,255,0.5)" }} />
                        </div>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: selected ? goal.color : "#f5f5f5", fontFamily: "Syne, sans-serif" }}
                        >
                          {goal.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-3.5 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => { capture("onboarding_step_completed", { step: 2, goals: selectedGoals }); setStep(3); }}
                    disabled={selectedGoals.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: selectedGoals.length > 0 ? "linear-gradient(135deg, #d4af37, #b8941f)" : "rgba(255,255,255,0.06)",
                      color: selectedGoals.length > 0 ? "#080a0e" : "rgba(255,255,255,0.3)",
                      fontFamily: "Syne, sans-serif",
                      cursor: selectedGoals.length > 0 ? "pointer" : "not-allowed",
                      border: "none",
                    }}
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Quick Setup ───────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
                  >
                    Quick setup
                  </h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Optional details to make your experience even better.
                  </p>
                </div>

                {/* Store URL */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Your store URL <span style={{ color: "rgba(255,255,255,0.25)" }}>(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://mystore.com.au"
                    value={storeUrl}
                    onChange={e => setStoreUrl(e.target.value)}
                    className="w-full rounded-xl py-3 px-4 text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f5f5f5",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Budget for products?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setBudget(opt.id)}
                        className="py-2.5 px-3 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: budget === opt.id ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${budget === opt.id ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)"}`,
                          color: budget === opt.id ? "#d4af37" : "rgba(255,255,255,0.6)",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* How did you find us */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    How did you find Majorka?
                  </label>
                  <select
                    value={howFound}
                    onChange={e => setHowFound(e.target.value)}
                    className="w-full rounded-xl py-3 px-4 text-sm outline-none appearance-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: howFound ? "#f5f5f5" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    <option value="" disabled>Select...</option>
                    {HOW_FOUND_OPTIONS.map(opt => (
                      <option key={opt} value={opt} style={{ background: "#1a1a2e", color: "#f5f5f5" }}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-3.5 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => { capture("onboarding_step_completed", { step: 3, budget, how_found: howFound }); setStep(4); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "linear-gradient(135deg, #d4af37, #b8941f)",
                      color: "#080a0e",
                      fontFamily: "Syne, sans-serif",
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    Finish Setup <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Completion ────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-8 text-center"
              >
                <div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))", border: "2px solid rgba(212,175,55,0.3)" }}
                  >
                    <Sparkles size={32} style={{ color: "#d4af37" }} />
                  </motion.div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
                  >
                    You're ready, {firstName}!
                  </h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Here are your recommended tools based on your answers:
                  </p>
                </div>

                {/* Recommended tools */}
                <div className="space-y-2">
                  {getRecommendedTools().map((tool, i) => (
                    <motion.button
                      key={tool.path}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      onClick={() => {
                        handleComplete();
                        navigate(tool.path);
                      }}
                      className="w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl transition-all group"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.3)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.04)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(212,175,55,0.1)" }}
                      >
                        <span className="text-sm font-bold" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                          {tool.label}
                        </div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{tool.desc}</div>
                      </div>
                      <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                    </motion.button>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleComplete}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #d4af37, #b8941f)",
                    color: "#080a0e",
                    fontFamily: "Syne, sans-serif",
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 8px 32px rgba(212,175,55,0.2)",
                  }}
                >
                  Start Using Majorka <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step dots */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className="rounded-full transition-all"
                  style={{
                    background: s === step ? "#d4af37" : s < step ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.12)",
                    width: s === step ? 20 : 6,
                    height: 6,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
