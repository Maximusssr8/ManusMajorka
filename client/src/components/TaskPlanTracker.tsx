import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Globe,
  Rocket,
  TrendingUp,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    key: "research",
    label: "Research & Validate",
    description: "Find and validate winning products",
    icon: Search,
    color: "#3b82f6",
  },
  {
    key: "build",
    label: "Build Your Store",
    description: "Generate your website and brand assets",
    icon: Globe,
    color: "#9c5fff",
  },
  {
    key: "launch",
    label: "Launch Campaigns",
    description: "Create ads and go live",
    icon: Rocket,
    color: "#f59e0b",
  },
  {
    key: "optimize",
    label: "Optimise & Scale",
    description: "Analyse results and scale winners",
    icon: TrendingUp,
    color: "#22c55e",
  },
] as const;

type StepStatus = "pending" | "in_progress" | "completed";

interface StepState {
  key: string;
  status: StepStatus;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TaskPlanTracker() {
  const utils = trpc.useUtils();
  const progressQuery = trpc.taskPlan.get.useQuery();
  const updateMutation = trpc.taskPlan.update.useMutation({
    onSuccess: () => {
      utils.taskPlan.get.invalidate();
    },
  });

  // Merge server data with step definitions
  const serverSteps = progressQuery.data ?? [];
  const stepStates: StepState[] = STEPS.map((step) => {
    const serverStep = serverSteps.find((s) => s.stepKey === step.key);
    return {
      key: step.key,
      status: (serverStep?.status as StepStatus) ?? "pending",
    };
  });

  const completedCount = stepStates.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  // A step is unlocked if it's the first step, or the previous step is completed
  const isUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    return stepStates[index - 1]?.status === "completed";
  };

  const handleStepClick = (index: number) => {
    if (!isUnlocked(index) || updateMutation.isPending) return;

    const step = stepStates[index];
    if (!step) return;

    // Cycle: pending -> in_progress -> completed -> pending
    const nextStatus: StepStatus =
      step.status === "pending"
        ? "in_progress"
        : step.status === "in_progress"
          ? "completed"
          : "pending";

    updateMutation.mutate({ stepKey: step.key, status: nextStatus });
  };

  const getStatusIcon = (status: StepStatus, locked: boolean, stepColor: string) => {
    if (locked) {
      return <Lock size={16} style={{ color: "rgba(240,237,232,0.2)" }} />;
    }
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} style={{ color: "#22c55e" }} />;
      case "in_progress":
        return <Loader2 size={16} className="animate-spin" style={{ color: "#d4af37" }} />;
      default:
        return <Circle size={16} style={{ color: stepColor }} />;
    }
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}
        >
          Your Game Plan
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
            {completedCount}/{STEPS.length}
          </span>
          <span className="text-xs font-semibold" style={{ color: "#d4af37" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-5"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #d4af37, #f0c040)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step, index) => {
          const state = stepStates[index];
          if (!state) return null;
          const locked = !isUnlocked(index);
          const Icon = step.icon;

          return (
            <button
              key={step.key}
              onClick={() => handleStepClick(index)}
              disabled={locked || updateMutation.isPending}
              className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-150"
              style={{
                background:
                  state.status === "in_progress"
                    ? "rgba(212,175,55,0.06)"
                    : state.status === "completed"
                      ? "rgba(34,197,94,0.04)"
                      : "rgba(255,255,255,0.025)",
                border:
                  state.status === "in_progress"
                    ? "1.5px solid rgba(212,175,55,0.25)"
                    : state.status === "completed"
                      ? "1.5px solid rgba(34,197,94,0.15)"
                      : "1.5px solid rgba(255,255,255,0.07)",
                opacity: locked ? 0.45 : 1,
                cursor: locked ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!locked) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    state.status === "completed"
                      ? "rgba(34,197,94,0.35)"
                      : `${step.color}50`;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!locked) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    state.status === "in_progress"
                      ? "rgba(212,175,55,0.25)"
                      : state.status === "completed"
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "none";
                }
              }}
            >
              {/* Step number */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    state.status === "completed"
                      ? "rgba(34,197,94,0.15)"
                      : state.status === "in_progress"
                        ? "rgba(212,175,55,0.15)"
                        : locked
                          ? "rgba(255,255,255,0.04)"
                          : `${step.color}18`,
                  color:
                    state.status === "completed"
                      ? "#22c55e"
                      : state.status === "in_progress"
                        ? "#d4af37"
                        : locked
                          ? "rgba(240,237,232,0.2)"
                          : step.color,
                }}
              >
                <Icon size={14} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "Syne, sans-serif",
                    color:
                      state.status === "completed"
                        ? "rgba(240,237,232,0.4)"
                        : locked
                          ? "rgba(240,237,232,0.25)"
                          : "#f0ede8",
                    textDecoration: state.status === "completed" ? "line-through" : "none",
                  }}
                >
                  {step.label}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: locked ? "rgba(240,237,232,0.15)" : "rgba(240,237,232,0.4)",
                  }}
                >
                  {step.description}
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                {getStatusIcon(state.status, locked, step.color)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
