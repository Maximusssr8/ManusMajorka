import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import { stages, getToolByPath } from "@/lib/tools";
import { AgentPlan } from "@/components/ui/agent-plan";
import { TextShimmer } from "@/components/ui/text-shimmer";
import OnboardingModal from "@/components/OnboardingModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { Search, Rocket, TrendingUp, Zap, Award, ChevronRight, Sparkles } from "lucide-react";

const RECOMMENDED_PATHS: Record<string, { title: string; desc: string; tools: { path: string; label: string; icon: any; color: string }[] }> = {
  beginner: {
    title: "Beginner's Path",
    desc: "Start by finding a product, then build your first store",
    tools: [
      { path: "/app/product-discovery", label: "1. Find Products", icon: Search, color: "#2dca72" },
      { path: "/app/niche-scorer", label: "2. Score Your Niche", icon: TrendingUp, color: "#4ab8f5" },
      { path: "/app/website-generator", label: "3. Build Landing Page", icon: Rocket, color: "#9c5fff" },
      { path: "/app/meta-ads", label: "4. Launch First Ad", icon: Zap, color: "#ff6b6b" },
    ],
  },
  intermediate: {
    title: "Growth Path",
    desc: "Research trends, analyse competitors, and optimise your funnel",
    tools: [
      { path: "/app/trend-radar", label: "1. Scan Trends", icon: TrendingUp, color: "#4ab8f5" },
      { path: "/app/competitor-breakdown", label: "2. Analyse Competitors", icon: Search, color: "#e05c7a" },
      { path: "/app/website-generator", label: "3. Build or Improve Site", icon: Rocket, color: "#9c5fff" },
      { path: "/app/cro-advisor", label: "4. Optimise Conversions", icon: Award, color: "#d4af37" },
    ],
  },
  advanced: {
    title: "Scale Path",
    desc: "Dive into analytics, scale campaigns, and maximise profits",
    tools: [
      { path: "/app/analytics-decoder", label: "1. Decode Analytics", icon: TrendingUp, color: "#7c6af5" },
      { path: "/app/ad-optimizer", label: "2. Optimise Ads", icon: Zap, color: "#ff6b6b" },
      { path: "/app/scaling-playbook", label: "3. Scale Playbook", icon: Rocket, color: "#2dca72" },
      { path: "/app/financial-modeler", label: "4. Financial Model", icon: Award, color: "#d4af37" },
    ],
  },
};

function RecommendedPath({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {
    setLevel(localStorage.getItem("majorka_level"));
  }, []);

  const path = level ? RECOMMENDED_PATHS[level] : null;
  if (!path) return null;

  return (
    <div className="mb-6 rounded-2xl p-4" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
            {path.title}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>{path.desc}</div>
        </div>
        <div className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
          {level === "beginner" ? "🌱" : level === "intermediate" ? "🌿" : "🌳"} {level}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {path.tools.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.path}
              onClick={() => onNavigate(tool.path)}
              className="text-left rounded-xl p-3 transition-all"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${tool.color}40`;
                (e.currentTarget as HTMLButtonElement).style.background = `${tool.color}08`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)";
              }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center mb-1.5" style={{ background: `${tool.color}15`, color: tool.color }}>
                <Icon size={12} />
              </div>
              <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", fontSize: 10 }}>{tool.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isToolPage = location.startsWith("/app/") && location !== "/app";

  // Save last visited tool to localStorage
  useEffect(() => {
    if (isToolPage) {
      const tool = getToolByPath(location);
      if (tool) {
        localStorage.setItem("majorka_last_tool", JSON.stringify({ path: tool.path, label: tool.label }));
      }
    }
  }, [location, isToolPage]);

  return (
    <MajorkaAppShell>
      {isToolPage ? <ToolPage /> : <DashboardHome />}
      {user && <OnboardingModal userName={user.name ?? undefined} />}
    </MajorkaAppShell>
  );
}

const MILESTONES = [
  { key: "majorka_milestone_research", label: "First Product Researched", icon: "🔍", desc: "Ran Product Discovery" },
  { key: "majorka_milestone_site", label: "First Landing Page", icon: "🌐", desc: "Generated a website" },
  { key: "majorka_milestone_ads", label: "First Ad Pack", icon: "📣", desc: "Created Meta Ads Pack" },
  { key: "majorka_milestone_model", label: "Financial Model Built", icon: "📊", desc: "Ran Financial Modeler" },
];

function MilestoneBadges() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const c: Record<string, boolean> = {};
    MILESTONES.forEach(m => { c[m.key] = !!localStorage.getItem(m.key); });
    setCompleted(c);
  }, []);

  const count = Object.values(completed).filter(Boolean).length;
  if (count === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Award size={12} style={{ color: "#d4af37" }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
          Milestones — {count}/{MILESTONES.length}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MILESTONES.map(m => {
          const done = completed[m.key];
          return (
            <div
              key={m.key}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                background: done ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${done ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)"}`,
                opacity: done ? 1 : 0.5,
              }}
            >
              <div className="text-lg mb-1">{done ? "✅" : m.icon}</div>
              <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: done ? "#d4af37" : "rgba(240,237,232,0.4)", fontSize: 10 }}>
                {m.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.25)", fontSize: 9 }}>{m.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContinueLastTool({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [lastTool, setLastTool] = useState<{ path: string; label: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("majorka_last_tool");
      if (saved) setLastTool(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  if (!lastTool) return null;

  return (
    <div className="mb-6">
      <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>
        Continue where you left off
      </div>
      <button
        onClick={() => onNavigate(lastTool.path)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
          e.currentTarget.style.background = "rgba(212,175,55,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          e.currentTarget.style.background = "rgba(255,255,255,0.025)";
        }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,175,55,0.12)", color: "#d4af37" }}>
          <ChevronRight size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{lastTool.label}</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Jump back in →</div>
        </div>
      </button>
    </div>
  );
}

function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const toggleSection = (stage: string) => {
    setCollapsedSections((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  const TESTIMONIALS = [
    { text: "Launched my first store in 24 hours", author: "Jake M., Sydney" },
    { text: "Made $4,200 in week 1 using the Meta Ads Pack", author: "Priya K., Melbourne" },
    { text: "Website Generator saved me $3k in dev costs", author: "Tom R., Brisbane" },
    { text: "Found a winning product on my first try", author: "Sarah L., Perth" },
  ];

  const STAGE_PILLS = [
    { label: "Research", color: "#4ab8f5" },
    { label: "Validate", color: "#2dca72" },
    { label: "Build", color: "#9c5fff" },
    { label: "Launch", color: "#ff6b6b" },
    { label: "Optimize", color: "#f59e0b" },
    { label: "Scale", color: "#e05c7a" },
  ];

  const FEATURED_TOOLS = [
    { path: "/app/product-discovery", icon: "🔍", title: "Find Winning Products", desc: "AI-powered product research with real market data", accent: "#4ab8f5" },
    { path: "/app/financial-modeler", icon: "📊", title: "Validate Unit Economics", desc: "P&L modelling, break-even, and 6-month forecast", accent: "#2dca72" },
    { path: "/app/website-generator", icon: "🌐", title: "Generate Product Website", desc: "Paste a URL → get a Shopify-ready landing page", accent: "#9c5fff" },
    { path: "/app/meta-ads", icon: "📣", title: "Generate Ad Creatives", desc: "5 creative angles, copy, and a 48-hr launch plan", accent: "#ff6b6b" },
    { path: "/app/brand-dna", icon: "🧬", title: "Build Brand Identity", desc: "Define your voice, colours, positioning", accent: "#f59e0b" },
    { path: "/app/scaling-playbook", icon: "🚀", title: "Scale Strategy", desc: "Build a systematic framework to scale profitably", accent: "#e05c7a" },
  ];

  const CHECKLIST = [
    { label: "Create your first project", key: "majorka_milestone_research" },
    { label: "Analyse product opportunity", key: "majorka_milestone_research" },
    { label: "Generate product website", key: "majorka_milestone_site" },
    { label: "Generate ad creatives", key: "majorka_milestone_ads" },
    { label: "Build financial model", key: "majorka_milestone_model" },
  ];

  return (
    <div
      className="h-full overflow-auto page-enter"
      style={{ background: "#0a0b0d", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
    >
      <div className="flex">
        {/* ── Main content ── */}
        <div className="flex-1 max-w-4xl mx-auto px-6 py-8">

          {/* Personalised greeting */}
          <div className="mb-6">
            <h1
              className="text-3xl font-black mb-1"
              style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}
            >
              <TextShimmer duration={4} spread={2} className="text-3xl font-black" as="span">
                {greeting}, {firstName}.
              </TextShimmer>
            </h1>
            <p className="text-sm" style={{ color: "rgba(240,237,232,0.45)" }}>
              Your AI ecommerce co-founder
            </p>
          </div>

          {/* Social proof ticker */}
          <div
            className="mb-8 overflow-hidden relative"
            style={{ maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}
          >
            <div className="flex gap-4 animate-ticker" style={{ width: "max-content" }}>
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    minWidth: 260,
                  }}
                >
                  <div className="text-xs mb-1" style={{ color: "rgba(240,237,232,0.6)" }}>"{t.text}"</div>
                  <div className="text-xs font-bold" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif", fontSize: 10 }}>
                    — {t.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage pills */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {STAGE_PILLS.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  const el = document.getElementById(`stage-${s.label.toLowerCase()}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  fontFamily: "Syne, sans-serif",
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}30`,
                  color: s.color,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Continue where you left off */}
          <ContinueLastTool onNavigate={setLocation} />

          {/* Start New Product CTA */}
          <button
            onClick={() => setLocation("/app/product-discovery")}
            className="w-full mb-8 px-5 py-4 rounded-2xl text-left transition-all group"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.04))",
              border: "1.5px solid rgba(212,175,55,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚀</div>
              <div className="flex-1">
                <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>Start New Product</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.45)" }}>Begin your ecommerce journey — from product research to launch</div>
              </div>
              <div className="text-xs font-bold px-3 py-1.5 rounded-lg btn-gold">Launch →</div>
            </div>
          </button>

          {/* Featured tools */}
          <div className="mb-8">
            <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
              Featured Tools
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURED_TOOLS.map((t) => (
                <button
                  key={t.path}
                  onClick={() => setLocation(t.path)}
                  className="text-left rounded-2xl p-5 transition-all duration-150"
                  style={{ background: `${t.accent}06`, border: `1.5px solid ${t.accent}20` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${t.accent}50`;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${t.accent}20`;
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif", color: t.accent }}>{t.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.5)" }}>{t.desc}</div>
                  <div className="mt-3 text-xs font-bold" style={{ color: t.accent, fontFamily: "Syne, sans-serif" }}>Launch →</div>
                </button>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <MilestoneBadges />

          {/* Recommended path */}
          <RecommendedPath onNavigate={setLocation} />

          {/* Collapsible tools grid */}
          {stages.map((stage) => (
            <div key={stage.stage} className="mb-6" id={`stage-${stage.stage.toLowerCase()}`}>
              <button
                onClick={() => toggleSection(stage.stage)}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                <h2
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ fontFamily: "Syne, sans-serif", color: stage.color }}
                >
                  {stage.stage}
                </h2>
                <span className="text-xs" style={{ color: "rgba(240,237,232,0.25)" }}>
                  {stage.tools.length} tools
                </span>
                <ChevronRight
                  size={12}
                  className="ml-auto transition-transform"
                  style={{
                    color: "rgba(240,237,232,0.25)",
                    transform: collapsedSections[stage.stage] ? "rotate(0deg)" : "rotate(90deg)",
                  }}
                />
              </button>

              {!collapsedSections[stage.stage] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 animate-fade-in">
                  {stage.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setLocation(tool.path)}
                      className="text-left rounded-xl p-3 transition-all duration-150"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${stage.color}40`;
                        e.currentTarget.style.background = `${stage.color}08`;
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: `${stage.color}18`, color: stage.color }}
                        >
                          {React.createElement(tool.icon, { size: 12 })}
                        </div>
                      </div>
                      <div className="text-xs font-bold leading-tight mb-0.5" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                        {tool.label}
                      </div>
                      <div className="text-xs leading-snug line-clamp-2" style={{ color: "rgba(240,237,232,0.38)", fontSize: "10px" }}>
                        {tool.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Operator AI sidebar (desktop only) ── */}
        <div className="hidden xl:block w-80 flex-shrink-0 border-l border-white/5 p-5" style={{ background: "rgba(255,255,255,0.01)" }}>
          <div className="sticky top-8">
            {/* AI Chat */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}>
                  <Sparkles size={12} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
                  AI Co-founder
                </span>
              </div>

              {/* Suggested prompts */}
              <div className="space-y-2 mb-4">
                {[
                  "What product should I sell?",
                  "Review my store for conversion issues",
                  "Help me write ad copy for Meta",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setLocation("/app/ai-chat")}
                    className="w-full text-left rounded-xl px-3 py-2.5 text-xs transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(240,237,232,0.5)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)";
                      e.currentTarget.style.color = "rgba(240,237,232,0.8)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "rgba(240,237,232,0.5)";
                    }}
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setLocation("/app/ai-chat")}
                className="w-full rounded-xl py-2.5 text-xs font-bold text-center btn-gold"
              >
                Open AI Chat →
              </button>
            </div>

            {/* Getting Started Checklist */}
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>
                Getting Started
              </div>
              <div className="space-y-1.5">
                {CHECKLIST.map((item) => {
                  const done = typeof window !== "undefined" && !!localStorage.getItem(item.key);
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-xs py-1.5"
                      style={{ color: done ? "rgba(212,175,55,0.6)" : "rgba(240,237,232,0.35)" }}
                    >
                      <div
                        className="w-4 h-4 rounded-sm flex items-center justify-center"
                        style={{
                          background: done ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${done ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        {done && <span style={{ fontSize: 9 }}>✓</span>}
                      </div>
                      <span style={{ textDecoration: done ? "line-through" : "none" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

