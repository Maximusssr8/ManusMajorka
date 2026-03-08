import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Rocket, ShoppingBag, TrendingUp, Zap, ChevronRight, X } from "lucide-react";

const ONBOARDING_KEY = "majorka_onboarded";

interface OnboardingModalProps {
  userName?: string;
}

const experienceLevels = [
  { id: "beginner", label: "Complete Beginner", desc: "Never sold online before", icon: "🌱" },
  { id: "intermediate", label: "Some Experience", desc: "Sold a few products, learning the ropes", icon: "🌿" },
  { id: "advanced", label: "Experienced Seller", desc: "Running an active store, looking to scale", icon: "🌳" },
];

const goals = [
  { id: "find-product", label: "Find a winning product", icon: ShoppingBag, color: "#00b4d8", path: "/app/product-discovery" },
  { id: "build-store", label: "Build my store", icon: Rocket, color: "#d4af37", path: "/app/website-generator" },
  { id: "launch-ads", label: "Launch my first ads", icon: Zap, color: "#ff6b6b", path: "/app/meta-ads" },
  { id: "scale-up", label: "Scale what's working", icon: TrendingUp, color: "#2dca72", path: "/app/scaling-playbook" },
];

export default function OnboardingModal({ userName }: OnboardingModalProps) {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
  };

  const handleGoalSelect = (path: string) => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    if (selectedLevel) localStorage.setItem("majorka_level", selectedLevel);
    setVisible(false);
    navigate(path);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden" style={{ background: "#0f1115", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        {/* Close button */}
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)", background: "none", border: "none", zIndex: 10 }}>
          <X size={16} />
        </button>

        <div className="p-6">
          {step === 1 ? (
            <>
              {/* Step 1: Experience Level */}
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">👋</div>
                <h2 className="text-lg font-black mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                  Welcome{userName ? `, ${userName}` : ""}!
                </h2>
                <p className="text-xs" style={{ color: "rgba(240,237,232,0.45)" }}>
                  Let's personalise your experience. What's your e-commerce level?
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {experienceLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: selectedLevel === level.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${selectedLevel === level.id ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.07)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-xl">{level.icon}</span>
                    <div>
                      <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: selectedLevel === level.id ? "#d4af37" : "#f0ede8" }}>{level.label}</div>
                      <div className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>{level.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { if (selectedLevel) setStep(2); }}
                disabled={!selectedLevel}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{
                  background: selectedLevel ? "linear-gradient(135deg, #d4af37, #f0c040)" : "rgba(255,255,255,0.06)",
                  color: selectedLevel ? "#080a0e" : "rgba(240,237,232,0.3)",
                  fontFamily: "Syne, sans-serif",
                  cursor: selectedLevel ? "pointer" : "not-allowed",
                  border: "none",
                }}
              >
                Continue <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              {/* Step 2: Goal Selection */}
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">🎯</div>
                <h2 className="text-lg font-black mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                  What's your priority?
                </h2>
                <p className="text-xs" style={{ color: "rgba(240,237,232,0.45)" }}>
                  We'll take you straight to the right tool.
                </p>
              </div>

              <div className="space-y-2 mb-4">
                {goals.map(goal => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.path)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1.5px solid rgba(255,255,255,0.07)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${goal.color}50`;
                        (e.currentTarget as HTMLButtonElement).style.background = `${goal.color}10`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${goal.color}15` }}>
                        <Icon size={16} style={{ color: goal.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{goal.label}</div>
                      </div>
                      <ChevronRight size={14} style={{ color: "rgba(240,237,232,0.3)" }} />
                    </button>
                  );
                })}
              </div>

              <button onClick={handleDismiss} className="w-full text-center text-xs py-2" style={{ color: "rgba(240,237,232,0.35)", cursor: "pointer", background: "none", border: "none" }}>
                Skip for now — I'll explore on my own
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { ONBOARDING_KEY };
