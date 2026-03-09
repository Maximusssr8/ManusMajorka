import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import { stages } from "@/lib/tools";
import OnboardingModal from "@/components/OnboardingModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import TaskPlanTracker from "@/components/TaskPlanTracker";
import {
  Search, Rocket, TrendingUp, Zap, ChevronRight, ChevronDown,
  Globe, Megaphone, Clock, BarChart2, Plus, MessageSquare, CheckCircle2,
} from "lucide-react";

// ── Social proof testimonials ────────────────────────────────────────────────
const TESTIMONIALS = [
  { text: "Launched my first store in 24 hours", name: "Jake M.", city: "Sydney" },
  { text: "Made $4,200 in week 1 using the Meta Ads Pack", name: "Priya K.", city: "Melbourne" },
  { text: "Website Generator saved me $3k in dev costs", name: "Tom R.", city: "Brisbane" },
  { text: "Found a winning product on my first try", name: "Sarah L.", city: "Perth" },
];

function TestimonialTicker() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame: number;
    let offset = 0;
    const scroll = () => {
      offset += 0.5;
      if (offset >= el.scrollWidth / 2) offset = 0;
      el.scrollLeft = offset;
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, []);

  const cards = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div className="mb-8 overflow-hidden" ref={scrollRef} style={{ scrollbarWidth: "none" }}>
      <div className="flex gap-3 w-max">
        {cards.map((t, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-xl px-4 py-3 text-xs"
            style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", color: "rgba(240,237,232,0.6)", minWidth: 260 }}
          >
            <span style={{ color: "rgba(240,237,232,0.85)" }}>"{t.text}"</span>
            <span className="ml-2" style={{ color: "rgba(212,175,55,0.7)" }}>— {t.name}, {t.city}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick launch workflow stages ─────────────────────────────────────────────
const WORKFLOW_STAGES = [
  { label: "Research", icon: Search, color: "#3b82f6" },
  { label: "Validate", icon: CheckCircle2, color: "#10b981" },
  { label: "Build", icon: Globe, color: "#9c5fff" },
  { label: "Launch", icon: Rocket, color: "#f59e0b" },
  { label: "Optimize", icon: TrendingUp, color: "#ef4444" },
  { label: "Scale", icon: BarChart2, color: "#d4af37" },
];

// ── Featured tools ──────────────────────────────────────────────────────────
const FEATURED_TOOLS = [
  { path: "/app/product-discovery", icon: Search, label: "Find Winning Products", desc: "AI-powered product research with real-time data", color: "#3b82f6" },
  { path: "/app/unit-economics", icon: BarChart2, label: "Validate Unit Economics", desc: "Calculate margins, breakeven and profitability", color: "#10b981" },
  { path: "/app/website-generator", icon: Globe, label: "Generate Product Website", desc: "Full Shopify-ready landing page in seconds", color: "#9c5fff" },
  { path: "/app/meta-ads", icon: Megaphone, label: "Generate Ad Creatives", desc: "5 creative angles and complete ad copy", color: "#ef4444" },
  { path: "/app/validation-plan", icon: Clock, label: "48-Hour Validation Plan", desc: "Step-by-step plan to validate in 2 days", color: "#f59e0b" },
  { path: "/app/scaling-playbook", icon: Zap, label: "Scale Strategy", desc: "Systematic framework for scaling winners", color: "#d4af37" },
];

// ── Getting started checklist ───────────────────────────────────────────────
const CHECKLIST = [
  { key: "majorka_check_project", label: "Create your first project", path: "/app/product-discovery" },
  { key: "majorka_check_research", label: "Analyse product opportunity", path: "/app/product-discovery" },
  { key: "majorka_check_website", label: "Generate product website", path: "/app/website-generator" },
  { key: "majorka_check_ads", label: "Generate ad creatives", path: "/app/meta-ads" },
  { key: "majorka_check_validate", label: "Launch validation test", path: "/app/validation-plan" },
];

function GettingStartedChecklist({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const c: Record<string, boolean> = {};
    CHECKLIST.forEach((item) => { c[item.key] = !!localStorage.getItem(item.key); });
    setCompleted(c);
  }, []);
  const count = Object.values(completed).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(212,175,55,0.7)", fontFamily: "Syne, sans-serif" }}>Getting Started</span>
        <span className="text-xs" style={{ color: "rgba(240,237,232,0.3)" }}>{count}/{CHECKLIST.length}</span>
      </div>
      {CHECKLIST.map((item) => {
        const done = completed[item.key];
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.path)}
            className="w-full flex items-center gap-2 text-left text-xs py-1.5 transition-colors hover:opacity-80"
            style={{ color: done ? "rgba(212,175,55,0.5)" : "rgba(240,237,232,0.6)" }}
          >
            <div
              className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
              style={{ borderColor: done ? "#d4af37" : "rgba(255,255,255,0.15)", background: done ? "rgba(212,175,55,0.2)" : "transparent" }}
            >
              {done && <CheckCircle2 size={10} style={{ color: "#d4af37" }} />}
            </div>
            <span style={{ textDecoration: done ? "line-through" : "none" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const AI_PROMPTS = [
  "What niche should I start with based on current trends?",
  "Analyse my top competitor and find opportunities",
  "Help me plan a 48-hour product validation test",
];

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [location] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const isToolPage = location.startsWith("/app/") && location !== "/app";

  // Show nothing while auth is resolving or redirecting
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0b0d" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm animate-pulse" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>M</div>
      </div>
    );
  }

  return (
    <MajorkaAppShell>
      {isToolPage ? <ToolPage /> : <DashboardHome />}
      {user && <OnboardingModal userName={user.name ?? undefined} />}
    </MajorkaAppShell>
  );
}

function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: !!user });
  const products = productsQuery.data ?? [];

  const firstName = user?.name ? (user.name as string).split(" ")[0] : "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const toggleStage = (stage: string) => {
    setCollapsedStages((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  const scrollToStage = (label: string) => {
    const el = document.getElementById(`stage-${label.toLowerCase()}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0b0d", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
      <div className="flex gap-6 max-w-7xl mx-auto px-6 py-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-black" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>
              {getGreeting()}, {firstName}.
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(240,237,232,0.45)" }}>Your AI ecommerce co-founder</p>
          </div>

          <TestimonialTicker />

          {/* Task Plan Tracker */}
          <TaskPlanTracker />

          {/* Workflow pills */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {WORKFLOW_STAGES.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.label} onClick={() => scrollToStage(s.label)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all flex-shrink-0 hover:scale-105" style={{ background: `${s.color}10`, borderColor: `${s.color}30`, color: s.color, fontFamily: "Syne, sans-serif" }}>
                  <Icon size={12} /> {s.label}
                </button>
              );
            })}
          </div>

          {/* Featured tools */}
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>Featured Tools</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURED_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.path} onClick={() => setLocation(tool.path)} className="text-left rounded-xl p-4 transition-all duration-150 group" style={{ background: `${tool.color}08`, border: `1.5px solid ${tool.color}20` }}
                    onMouseEnter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = `${tool.color}50`; t.style.transform = "translateY(-2px)"; t.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = `${tool.color}20`; t.style.transform = "none"; t.style.boxShadow = "none"; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${tool.color}18`, color: tool.color }}><Icon size={16} /></div>
                    <div className="text-sm font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{tool.label}</div>
                    <div className="text-xs mb-3" style={{ color: "rgba(240,237,232,0.45)" }}>{tool.desc}</div>
                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: tool.color }}>Launch <ChevronRight size={12} /></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Projects */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>Active Projects</div>
              <button onClick={() => setLocation("/app/my-products")} className="text-xs font-semibold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "#d4af37" }}>
                View All <ChevronRight size={12} />
              </button>
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.slice(0, 4).map((p) => (
                  <button key={p.id} onClick={() => setLocation(`/app/product-hub/${p.id}`)} className="text-left rounded-xl p-4 transition-all" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <div className="text-sm font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{p.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)" }}>{p.status}</span>
                      {p.niche && <span className="text-xs" style={{ color: "rgba(240,237,232,0.3)" }}>{p.niche}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setLocation("/app/product-discovery")} className="w-full rounded-xl p-5 text-center transition-all" style={{ background: "rgba(212,175,55,0.04)", border: "1.5px dashed rgba(212,175,55,0.2)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.4)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.2)"; }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(212,175,55,0.1)" }}><Plus size={18} style={{ color: "#d4af37" }} /></div>
                <div className="text-sm font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>Start Your First Real Project</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>Research, validate, and launch your first product</div>
              </button>
            )}
          </div>

          {/* Collapsible tools grid */}
          {stages.map((stage) => (
            <div key={stage.stage} id={`stage-${stage.stage.toLowerCase()}`} className="mb-6">
              <button onClick={() => toggleStage(stage.stage)} className="flex items-center gap-2 mb-3 w-full text-left">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                <h2 className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "Syne, sans-serif", color: stage.color }}>{stage.stage}</h2>
                <span className="text-xs" style={{ color: "rgba(240,237,232,0.25)" }}>{stage.tools.length} tools</span>
                <ChevronDown size={12} className="ml-auto transition-transform" style={{ color: "rgba(240,237,232,0.3)", transform: collapsedStages[stage.stage] ? "rotate(-90deg)" : "rotate(0deg)" }} />
              </button>
              {!collapsedStages[stage.stage] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {stage.tools.map((tool) => (
                    <button key={tool.id} onClick={() => setLocation(tool.path)} className="text-left rounded-xl p-3 transition-all duration-150" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = `${stage.color}40`; t.style.background = `${stage.color}08`; t.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = "rgba(255,255,255,0.07)"; t.style.background = "rgba(255,255,255,0.025)"; t.style.transform = "none"; }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${stage.color}18`, color: stage.color }}>{React.createElement(tool.icon, { size: 12 })}</div>
                      </div>
                      <div className="text-xs font-bold leading-tight mb-0.5" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{tool.label}</div>
                      <div className="text-xs leading-snug line-clamp-2" style={{ color: "rgba(240,237,232,0.38)", fontSize: "10px" }}>{tool.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Operator AI sidebar (desktop only) */}
        <div className="hidden xl:block w-72 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <div className="rounded-2xl p-4" style={{ background: "rgba(156,95,255,0.04)", border: "1px solid rgba(156,95,255,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(156,95,255,0.15)" }}><MessageSquare size={14} style={{ color: "#9c5fff" }} /></div>
                <div>
                  <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>AI Co-Founder</div>
                  <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Ask me anything</div>
                </div>
              </div>
              <div className="space-y-2">
                {AI_PROMPTS.map((prompt, i) => (
                  <button key={i} onClick={() => setLocation("/app/ai-chat")} className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(156,95,255,0.06)", color: "rgba(240,237,232,0.6)", border: "1px solid rgba(156,95,255,0.1)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(156,95,255,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(156,95,255,0.06)"; }}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
              <button onClick={() => setLocation("/app/ai-chat")} className="w-full mt-3 text-xs font-bold py-2 rounded-lg transition-all" style={{ background: "rgba(156,95,255,0.15)", color: "#9c5fff", border: "1px solid rgba(156,95,255,0.3)" }}>Open Chat</button>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
              <GettingStartedChecklist onNavigate={setLocation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
