import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import OnboardingModal from "@/components/OnboardingModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { getToolByPath, recordRecentTool } from "@/lib/tools";
import { useDocumentTitle } from "@/_core/hooks/useDocumentTitle";
import {
  Search, Rocket, Globe, MessageSquare, Package,
  Link2, PenTool, TrendingUp, BarChart2, Star, Zap, ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { ProductImporter } from "@/components/ProductImporter";
import { getActivityLog, getRelativeTime, type ActivityEntry } from "@/lib/activity";

// ── Tool category cards ─────────────────────────────────────────────────────
const TOOL_CATEGORY_CARDS = [
  {
    label: "Research",
    icon: Search,
    color: "#3b82f6",
    tools: ["Product Discovery", "Competitor Breakdown", "Ad Spy"],
    path: "/app/product-discovery",
  },
  {
    label: "Build",
    icon: Globe,
    color: "#9c5fff",
    tools: ["Website Generator", "Brand DNA", "Copywriter"],
    path: "/app/website-generator",
  },
  {
    label: "Copy",
    icon: PenTool,
    color: "#f59e0b",
    tools: ["Copywriter", "Email Sequences", "Ad Copy"],
    path: "/app/copywriter",
  },
  {
    label: "Launch",
    icon: Rocket,
    color: "#ef4444",
    tools: ["Launch Kit", "Meta Ads Pack", "Launch Planner"],
    path: "/app/launch-kit",
  },
  {
    label: "Grow",
    icon: TrendingUp,
    color: "#10b981",
    tools: ["Market Intelligence", "Analytics Decoder", "AI Chat"],
    path: "/app/market-intel",
  },
  {
    label: "Manage",
    icon: Package,
    color: "#71717a",
    tools: ["My Products", "Project Manager", "Supplier Finder"],
    path: "/app/my-products",
  },
];

// ── Quick actions ───────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Import Product URL", desc: "Scrape & import a product", icon: Link2, path: "/app/my-products" },
  { label: "Open AI Chat", desc: "Ask anything", icon: MessageSquare, path: "/app/ai-chat" },
  { label: "Generate Website", desc: "Build a landing page", icon: Globe, path: "/app/website-generator" },
  { label: "Write Copy", desc: "AI copywriter", icon: PenTool, path: "/app/copywriter" },
];


// ── Helper: format currency ─────────────────────────────────────────────────
function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

// ── Helper: greeting ────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Helper: format date ─────────────────────────────────────────────────────
function formatDate() {
  return new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const isToolPage = location.startsWith("/app/") && location !== "/app";
  const currentTool = isToolPage ? getToolByPath(location) : null;
  useDocumentTitle(currentTool?.label ?? "Dashboard");

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

// ── DashboardHome ────────────────────────────────────────────────────────────
function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user, session, isAuthenticated } = useAuth();
  const { activeProduct } = useActiveProduct();
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });

  // KPI data from localStorage
  const [toolsToday, setToolsToday] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    try {
      const todayRaw = localStorage.getItem("majorka_tools_today");
      if (todayRaw) {
        const parsed = JSON.parse(todayRaw);
        setToolsToday(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch { /* ignore */ }

    try {
      const countRaw = localStorage.getItem("majorka_ai_count");
      if (countRaw) setAiCount(Number(countRaw) || 0);
    } catch { /* ignore */ }

    setActivityLog(getActivityLog().slice(0, 8));
  }, []);

  const productCount = productsQuery.data?.length ?? 0;
  const revenuePotential = productCount * 49;

  const rawDisplayName = user?.name ?? session?.user?.user_metadata?.full_name ?? session?.user?.email?.split("@")[0] ?? null;
  const firstName = rawDisplayName ? (rawDisplayName as string).split(" ")[0] : "there";

  return (
    <div
      className="h-full overflow-auto"
      style={{ background: "#0a0a0a", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── A. Header row ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5", letterSpacing: "-0.02em" }}
          >
            {getGreeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm mb-0.5" style={{ color: "#a1a1aa" }}>
            Your AI Ecommerce OS is ready.
          </p>
          <p className="text-xs" style={{ color: "#52525b" }}>
            {formatDate()}
          </p>
        </div>

        {/* ── B. KPI Metric cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {/* Active Products */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Package size={12} style={{ color: "#a1a1aa" }} />
              <span className="text-xs" style={{ color: "#a1a1aa" }}>Active Products</span>
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace", color: "#f5f5f5" }}
            >
              {productsQuery.isLoading ? "—" : productCount}
            </div>
            <div className="text-xs" style={{ color: "#10b981" }}>+1 this week</div>
          </div>

          {/* Tools Used Today */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={12} style={{ color: "#a1a1aa" }} />
              <span className="text-xs" style={{ color: "#a1a1aa" }}>Tools Today</span>
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace", color: "#f5f5f5" }}
            >
              {toolsToday}
            </div>
            <div className="text-xs" style={{ color: toolsToday > 0 ? "#10b981" : "#52525b" }}>
              {toolsToday > 0 ? "+12%" : "0 today"}
            </div>
          </div>

          {/* AI Requests */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare size={12} style={{ color: "#a1a1aa" }} />
              <span className="text-xs" style={{ color: "#a1a1aa" }}>AI Requests</span>
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace", color: "#f5f5f5" }}
            >
              {aiCount}
            </div>
            <div className="text-xs" style={{ color: aiCount > 0 ? "#10b981" : "#52525b" }}>
              {aiCount > 0 ? "+12%" : "0 today"}
            </div>
          </div>

          {/* Est. Revenue Potential */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart2 size={12} style={{ color: "#a1a1aa" }} />
              <span className="text-xs" style={{ color: "#a1a1aa" }}>Est. Revenue Pot.</span>
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace", color: "#f5f5f5" }}
            >
              {formatCurrency(revenuePotential)}
            </div>
            <div className="text-xs" style={{ color: "#52525b" }}>×$49/product</div>
          </div>
        </div>

        {/* ── C. Quick Actions ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {QUICK_ACTIONS.map(({ label, desc, icon: Icon, path }) => (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                minHeight: 80,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.4)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.04)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.background = "#111111";
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ background: "rgba(245,158,11,0.12)" }}
              >
                <Icon size={15} style={{ color: "#f59e0b" }} />
              </div>
              <div className="text-sm font-bold mb-0.5" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                {label}
              </div>
              <div className="text-xs" style={{ color: "#52525b" }}>{desc}</div>
            </button>
          ))}
        </div>

        {/* ── D. Two-column layout ─────────────────────────────────────── */}
        <div className="flex gap-6 mb-8" style={{ alignItems: "flex-start" }}>
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Active Product card */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}
              >
                Active Product
              </div>
              {activeProduct ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                      {activeProduct.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                    >
                      {activeProduct.niche}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#a1a1aa" }}
                    >
                      {activeProduct.source}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
                    {activeProduct.summary.slice(0, 120)}
                    {activeProduct.summary.length > 120 ? "…" : ""}
                  </p>
                  <button
                    onClick={() => setLocation("/app/product-discovery")}
                    className="flex items-center gap-1.5 text-xs font-bold transition-all"
                    style={{ color: "#f59e0b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Open in Tools <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <ProductImporter compact={false} onSuccess={(_p) => { /* product is set inside ProductImporter */ }} />
              )}
            </div>

            {/* Recent Activity */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}
              >
                Recent Activity
              </div>
              {activityLog.length === 0 ? (
                <p className="text-xs" style={{ color: "#52525b" }}>
                  No recent activity. Start exploring tools{" "}
                  <button
                    onClick={() => setLocation("/app/product-discovery")}
                    className="underline"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", padding: 0, fontSize: "inherit" }}
                  >
                    →
                  </button>
                </p>
              ) : (
                <div className="space-y-1">
                  {activityLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg"
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(245,158,11,0.1)" }}
                      >
                        <span style={{ fontSize: 9, color: "#f59e0b" }}>●</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "#f5f5f5", fontFamily: "DM Sans, sans-serif" }}>
                          {entry.label}
                        </div>
                      </div>
                      <div className="text-xs flex-shrink-0" style={{ color: "#52525b" }}>
                        {getRelativeTime(entry.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ width: 280, flexShrink: 0 }} className="space-y-4">
            {/* Launch Kit promo */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "#111111",
                border: "1px solid",
                borderImage: "linear-gradient(135deg, rgba(245,158,11,0.5), rgba(245,158,11,0.1)) 1",
                outline: "1px solid rgba(245,158,11,0.15)",
                outlineOffset: -1,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} style={{ color: "#f59e0b" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>
                  Launch Kit
                </span>
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                Generate Full Launch Kit
              </h3>
              <p className="text-xs mb-4" style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
                Brand → Copy → Website → Ads → Emails in one click.
              </p>
              <button
                onClick={() => setLocation("/app/launch-kit")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#0a0a0a",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Syne, sans-serif",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Try Launch Kit <ArrowRight size={11} />
              </button>
            </div>

            {/* Workflow stepper */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}
              >
                Your Progress
              </div>
              <div className="flex items-center gap-1">
                {["Research", "Brand", "Copy", "Launch"].map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: idx === 0 ? "#10b981" : "rgba(255,255,255,0.06)",
                          color: idx === 0 ? "#0a0a0a" : "#52525b",
                          fontSize: 9,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {idx === 0 ? "✓" : idx + 1}
                      </div>
                      <span style={{ fontSize: 9, color: idx === 0 ? "#10b981" : "#52525b", fontFamily: "DM Sans, sans-serif" }}>
                        {step}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        className="flex-1 h-px mb-3"
                        style={{ background: idx === 0 ? "#10b981" : "rgba(255,255,255,0.06)" }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── E. Tool grid ─────────────────────────────────────────────── */}
        <div
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}
        >
          All Tools
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TOOL_CATEGORY_CARDS.map(({ label, icon: Icon, color, tools, path }) => (
            <button
              key={label}
              onClick={() => setLocation(path)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`;
                (e.currentTarget as HTMLButtonElement).style.background = `${color}08`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.background = "#111111";
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <span className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                  {label}
                </span>
              </div>
              <div className="space-y-0.5">
                {tools.map(t => (
                  <div key={t} className="text-xs" style={{ color: "#52525b" }}>
                    {t}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
