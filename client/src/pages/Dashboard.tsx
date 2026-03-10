import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import OnboardingModal from "@/components/OnboardingModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { getToolByPath, recordRecentTool, allTools } from "@/lib/tools";
import { Search, Rocket, Globe, CheckCircle2, MessageSquare, Package, ChevronRight } from "lucide-react";

// ── 6 core tool cards for the dashboard ──
const CORE_TOOL_CARDS = [
  { path: "/app/product-discovery", label: "Research",          desc: "Get real market intelligence — competitors, trends, and opportunities", icon: Search,       color: "#3b82f6" },
  { path: "/app/validate",         label: "Validate",          desc: "Score your idea's viability with demand signals and honest risk analysis", icon: CheckCircle2, color: "#f59e0b" },
  { path: "/app/website-generator", label: "Website Generator", desc: "Generate a conversion-ready landing page from a product link",          icon: Globe,        color: "#9c5fff" },
  { path: "/app/launch-planner",   label: "Launch Planner",    desc: "Get a week-by-week go-to-market plan with budget and channel strategy",  icon: Rocket,       color: "#ef4444" },
  { path: "/app/ai-chat",          label: "AI Chat",           desc: "Talk to a smart business advisor about strategy, pricing, or anything",   icon: MessageSquare,color: "#9c5fff" },
  { path: "/app/my-products",      label: "My Products",       desc: "View all saved products and their generated content in one place",        icon: Package,      color: "#d4af37" },
];

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const isToolPage = location.startsWith("/app/") && location !== "/app";

  // Redirect to login once we know user is not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Save last visited tool and recent tools to localStorage
  useEffect(() => {
    if (isToolPage) {
      const tool = getToolByPath(location);
      if (tool) {
        localStorage.setItem("majorka_last_tool", JSON.stringify({ path: tool.path, label: tool.label }));
        recordRecentTool(tool.id);
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
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
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

function RecentTools({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [recentTools, setRecentTools] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("majorka_recent_tools");
      if (raw) setRecentTools(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  if (recentTools.length === 0) return null;

  const toolDefs = recentTools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as (typeof allTools)[number][];

  return (
    <section className="mb-6">
      <h3 className="font-syne text-xs font-black uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>
        Continue Where You Left Off
      </h3>
      <div className="flex gap-3 flex-wrap">
        {toolDefs.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.path)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)";
                e.currentTarget.style.background = "rgba(212,175,55,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = "rgba(255,255,255,0.025)";
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(212,175,55,0.12)", color: "#d4af37" }}
              >
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black whitespace-nowrap" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                  {tool.label}
                </div>
              </div>
              <span className="text-xs ml-1 flex-shrink-0" style={{ color: "rgba(212,175,55,0.55)" }}>Open →</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div
      className="h-full overflow-auto"
      style={{ background: "#0a0b0d", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Welcome header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#d4af37" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
              AI Ecommerce OS
            </span>
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>
            <TextShimmer duration={4} spread={2} className="text-2xl font-black" as="span">
              {user?.name ? `Welcome back, ${(user.name as string).split(" ")[0]}` : "Welcome to Majorka"}
            </TextShimmer>
          </h1>
          <p className="text-sm" style={{ color: "rgba(240,237,232,0.45)" }}>
            Pick a tool to get started, or ask the AI Chat anything about your business.
          </p>
        </div>

        {/* Continue where you left off — recent tools (multi-tool) */}
        <RecentTools onNavigate={setLocation} />

        {/* Continue where you left off — last single tool */}
        <ContinueLastTool onNavigate={setLocation} />

        {/* Quick start CTA */}
        <button
          onClick={() => setLocation("/app/product-discovery")}
          className="w-full mb-8 px-5 py-4 rounded-2xl text-left transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))",
            border: "1.5px solid rgba(212,175,55,0.2)",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.4)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.2)";
            (e.currentTarget as HTMLButtonElement).style.transform = "none";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}>
              <Search size={18} color="#0a0b0d" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>Start New Product Research</div>
              <div className="text-xs" style={{ color: "rgba(240,237,232,0.45)" }}>Enter a product idea or paste a URL to get market intelligence</div>
            </div>
            <ChevronRight size={16} style={{ color: "rgba(212,175,55,0.5)" }} />
          </div>
        </button>

        {/* 6 Core Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {CORE_TOOL_CARDS.map(({ path, label, desc, icon: Icon, color }) => (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className="text-left rounded-2xl p-5 transition-all duration-150"
              style={{
                background: `${color}08`,
                border: `1.5px solid ${color}20`,
                cursor: "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}45`;
                (e.currentTarget as HTMLButtonElement).style.background = `${color}12`;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}20`;
                (e.currentTarget as HTMLButtonElement).style.background = `${color}08`;
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, color }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-black mb-0.5" style={{ fontFamily: "Syne, sans-serif", color }}>
                    {label}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.5)" }}>
                    {desc}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Workflow steps */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
            How it works
          </div>
          <div className="space-y-3">
            {[
              { step: "01", title: "Research your idea", desc: "Paste a product URL or describe your idea. Get market size, competitors, and opportunities.", color: "#3b82f6" },
              { step: "02", title: "Validate before you invest", desc: "Get an honest viability score with demand signals, risks, and a go/no-go recommendation.", color: "#f59e0b" },
              { step: "03", title: "Build your landing page", desc: "Generate a full multi-section website with professional copy. Export to Shopify.", color: "#9c5fff" },
              { step: "04", title: "Plan your launch", desc: "Get a week-by-week plan with channel strategy, budget breakdown, and launch checklist.", color: "#ef4444" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="text-xs font-black w-6 text-right flex-shrink-0 pt-0.5" style={{ color, fontFamily: "Syne, sans-serif" }}>{step}</div>
                <div>
                  <div className="text-xs font-bold" style={{ color: "#f0ede8", fontFamily: "Syne, sans-serif" }}>{title}</div>
                  <div className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
