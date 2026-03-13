import React, { useEffect, useState, createElement } from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import OnboardingModal from "@/components/OnboardingModal";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import ProductTour from "@/components/ProductTour";
import WelcomeModal from "@/components/WelcomeModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { getToolByPath, recordRecentTool, allTools, stages } from "@/lib/tools";
import { useDocumentTitle } from "@/_core/hooks/useDocumentTitle";
import {
  Search, MessageSquare, Package,
  BarChart2, Star, Zap, ArrowRight,
  Clock, ArrowUpRight, Timer,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { ProductImporter } from "@/components/ProductImporter";
import { getActivityLog, getRelativeTime, type ActivityEntry } from "@/lib/activity";
import LaunchReadiness from "@/components/LaunchReadiness";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function getRecentToolIds(): string[] {
  try { return JSON.parse(localStorage.getItem("majorka_recent_tools") || "[]"); } catch { return []; }
}

const GOAL_TOOL_MAP: Record<string, string[]> = {
  "find-product": ["product-discovery", "trend-radar", "niche-scorer", "competitor-breakdown"],
  "build-store": ["website-generator", "brand-dna", "copywriter", "email-sequences"],
  "launch-ads": ["meta-ads", "ads-studio", "tiktok", "audience-profiler"],
  "scale-up": ["market-intel", "analytics-decoder", "scaling-playbook", "store-auditor"],
};
const DEFAULT_RECOMMENDED = ["product-discovery", "website-generator", "meta-ads", "ai-chat"];

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const isToolPage = location.startsWith("/app/") && location !== "/app";
  const currentTool = isToolPage ? getToolByPath(location) : null;
  useDocumentTitle(currentTool?.label ?? "Dashboard");

  useEffect(() => { if (!loading && !isAuthenticated) setLocation("/login"); }, [loading, isAuthenticated, setLocation]);

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

function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user, session, isAuthenticated } = useAuth();
  const { activeProduct } = useActiveProduct();
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
  const ordersQuery = trpc.storefront.getOrders.useQuery(undefined, { enabled: isAuthenticated });

  const [toolsToday, setToolsToday] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try { const r = localStorage.getItem("majorka_tools_today"); if (r) { const p = JSON.parse(r); setToolsToday(Array.isArray(p) ? p.length : 0); } } catch {}
    try { const c = localStorage.getItem("majorka_ai_count"); if (c) setAiCount(Number(c) || 0); } catch {}
    setActivityLog(getActivityLog().slice(0, 6));
    setRecentToolIds(getRecentToolIds());
  }, []);

  const productCount = productsQuery.data?.length ?? 0;
  const orders = ordersQuery.data ?? [];
  const orderCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat((o as any).amount ?? "0"), 0);
  const revenuePotential = totalRevenue > 0 ? totalRevenue : productCount * 49;
  const rawDisplayName = user?.name?.trim() || session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || null;
  const firstName = rawDisplayName ? (rawDisplayName as string).split(" ")[0] : "there";
  const savedGoal = typeof window !== "undefined" ? localStorage.getItem("majorka_goal") : null;
  const recommendedIds = savedGoal && GOAL_TOOL_MAP[savedGoal] ? GOAL_TOOL_MAP[savedGoal] : DEFAULT_RECOMMENDED;
  const recommendedTools = recommendedIds.map(id => allTools.find(t => t.id === id)).filter(Boolean) as typeof allTools;
  const recentTools = recentToolIds.map(id => allTools.find(t => t.id === id)).filter(Boolean) as typeof allTools;
  const timeSavedHours = Math.round((aiCount * 0.5) * 10) / 10;
  const filteredStages = searchQuery.trim()
    ? stages.map(s => ({ ...s, tools: s.tools.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(s => s.tools.length > 0)
    : stages;

  return (
    <div className="h-full overflow-auto" style={{ background: "#060608", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5", letterSpacing: "-0.02em" }}>
                {getGreeting()}{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-sm" style={{ color: "#a1a1aa" }}>Your AI Ecommerce OS &middot; <span style={{ color: "#52525b" }}>{formatDate()}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLocation("/app/history")} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
                <Clock size={14} /> History
              </button>
              <button onClick={() => setLocation("/app/ai-chat")} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", cursor: "pointer", fontFamily: "Syne, sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(212,175,55,0.08)")}>
                <MessageSquare size={14} /> Ask AI
              </button>
            </div>
          </div>
        </div>

        <OnboardingChecklist />
        <LaunchReadiness />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Active Products", value: productsQuery.isLoading ? "\u2014" : productCount, sub: productCount > 0 ? "Active" : "Add your first product", subColor: productCount > 0 ? "#10b981" : "#52525b", icon: Package, iconColor: "#3b82f6", iconBg: "rgba(59,130,246,0.1)" },
            { label: "Tools Today", value: toolsToday, sub: toolsToday > 0 ? `${toolsToday} tool${toolsToday !== 1 ? "s" : ""} used` : "Start exploring", subColor: toolsToday > 0 ? "#10b981" : "#52525b", icon: Zap, iconColor: "#d4af37", iconBg: "rgba(212,175,55,0.1)" },
            { label: "AI Requests", value: aiCount, sub: aiCount > 0 ? "Requests today" : "Ask anything", subColor: aiCount > 0 ? "#10b981" : "#52525b", icon: MessageSquare, iconColor: "#8b5cf6", iconBg: "rgba(139,92,246,0.1)" },
            { label: timeSavedHours > 0 ? "Time Saved" : orderCount > 0 ? "Revenue (AUD)" : "Est. Potential", value: timeSavedHours > 0 ? `${timeSavedHours}h` : ordersQuery.isLoading ? "\u2014" : formatCurrency(revenuePotential), sub: timeSavedHours > 0 ? "Hours saved with AI" : orderCount > 0 ? `${orderCount} order${orderCount !== 1 ? "s" : ""}` : "AUD estimate", subColor: timeSavedHours > 0 || orderCount > 0 ? "#10b981" : "#52525b", icon: timeSavedHours > 0 ? Timer : BarChart2, iconColor: "#10b981", iconBg: "rgba(16,185,129,0.1)" },
          ].map(({ label, value, sub, subColor, icon: Icon, iconColor, iconBg }) => (
            <div key={label} className="rounded-xl p-4 transition-all" style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)")} onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: iconBg }}><Icon size={10} style={{ color: iconColor }} /></div>
                <span className="text-xs font-medium" style={{ color: "#71717a" }}>{label}</span>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5", letterSpacing: "-0.02em" }}>{value}</div>
              <div className="text-xs" style={{ color: subColor }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Recommended Tools */}
        {recommendedTools.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Recommended for you</div>
              <span className="text-xs" style={{ color: "#3f3f46" }}>Based on your goals</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recommendedTools.map(tool => (
                <button key={tool.id} onClick={() => setLocation(tool.path)} className="text-left rounded-xl p-4 transition-all"
                  style={{ background: "#0c0c10", border: "1px solid rgba(212,175,55,0.1)", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; e.currentTarget.style.background = "rgba(212,175,55,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.1)"; e.currentTarget.style.background = "#0c0c10"; }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(212,175,55,0.08)" }}>
                    {createElement(tool.icon, { size: 16, style: { color: "#d4af37" } })}
                  </div>
                  <div className="text-sm font-bold mb-0.5" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>{tool.label}</div>
                  <div className="text-xs mb-3" style={{ color: "#52525b", lineHeight: 1.5 }}>{tool.description}</div>
                  <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "#d4af37" }}>Try it <ArrowRight size={10} /></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recently Used */}
        {recentTools.length > 0 && (
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Recently Used</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recentTools.map(tool => (
                <button key={tool.id} onClick={() => setLocation(tool.path)} className="flex items-center gap-2.5 rounded-lg p-3 transition-all"
                  style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "#0c0c10"; }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(212,175,55,0.08)" }}>
                    {createElement(tool.icon, { size: 12, style: { color: "#d4af37" } })}
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: "#f5f5f5" }}>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Two-column */}
        <div className="flex gap-6 mb-8" style={{ alignItems: "flex-start" }}>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="rounded-xl p-4" style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Active Product</div>
              {activeProduct ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>{activeProduct.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37" }}>{activeProduct.niche}</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#a1a1aa", lineHeight: 1.6 }}>{activeProduct.summary.slice(0, 120)}{activeProduct.summary.length > 120 ? "..." : ""}</p>
                  <button onClick={() => setLocation("/app/product-discovery")} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#d4af37", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Open in Tools <ArrowRight size={12} />
                  </button>
                </div>
              ) : <ProductImporter compact={false} onSuccess={() => {}} />}
            </div>
            <div className="rounded-xl p-4" style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Recent Activity</div>
                {activityLog.length > 0 && <button onClick={() => setLocation("/app/history")} className="text-xs flex items-center gap-1" style={{ color: "#d4af37", background: "none", border: "none", cursor: "pointer" }}>View all <ArrowUpRight size={10} /></button>}
              </div>
              {activityLog.length === 0 ? (
                <p className="text-xs" style={{ color: "#52525b" }}>No recent activity. <button onClick={() => setLocation("/app/product-discovery")} className="underline" style={{ background: "none", border: "none", cursor: "pointer", color: "#d4af37", padding: 0, fontSize: "inherit" }}>Start exploring</button></p>
              ) : (
                <div className="space-y-1">{activityLog.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}><span style={{ fontSize: 9, color: "#d4af37" }}>&#x25CF;</span></div>
                    <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate" style={{ color: "#f5f5f5" }}>{entry.label}</div></div>
                    <div className="text-xs flex-shrink-0" style={{ color: "#52525b" }}>{getRelativeTime(entry.timestamp)}</div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
          <div style={{ width: 280, flexShrink: 0 }} className="space-y-4 hidden md:block">
            <div className="rounded-xl p-4" style={{ background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.15)" }}>
              <div className="flex items-center gap-1.5 mb-2"><Star size={12} style={{ color: "#d4af37" }} /><span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Launch Kit</span></div>
              <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>Full AU Launch Kit</h3>
              <p className="text-xs mb-4" style={{ color: "#a1a1aa", lineHeight: 1.6 }}>Brand &rarr; Copy &rarr; Website &rarr; Ads &rarr; Emails — all AU-native.</p>
              <button onClick={() => setLocation("/app/launch-kit")} className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg" style={{ background: "linear-gradient(135deg, #d4af37, #b8941f)", color: "#060608", border: "none", cursor: "pointer", fontFamily: "Syne, sans-serif" }}>
                Try Launch Kit <ArrowRight size={11} />
              </button>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Your Progress</div>
              <div className="flex items-center gap-1">
                {["Research", "Brand", "Copy", "Launch"].map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: idx === 0 ? "#10b981" : "rgba(255,255,255,0.06)", color: idx === 0 ? "#0a0a0a" : "#52525b", fontSize: 9 }}>{idx === 0 ? "\u2713" : idx + 1}</div>
                      <span style={{ fontSize: 9, color: idx === 0 ? "#10b981" : "#52525b" }}>{step}</span>
                    </div>
                    {idx < 3 && <div className="flex-1 h-px mb-3" style={{ background: idx === 0 ? "#10b981" : "rgba(255,255,255,0.06)" }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Tool Grid */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>All Tools</div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter tools..."
              className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#f5f5f5", width: 160 }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.3)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.06)")} />
          </div>
        </div>
        {filteredStages.map(stage => (
          <div key={stage.stage} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: stage.color, fontFamily: "Syne, sans-serif" }}>{stage.stage}</span>
              <span className="text-xs" style={{ color: "#3f3f46" }}>{stage.tools.length} tools</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stage.tools.map(tool => {
                const isNew = tool.id === "tiktok" || tool.id === "launch-kit" || tool.id === "au-trending";
                const isPopular = tool.id === "product-discovery" || tool.id === "website-generator" || tool.id === "meta-ads";
                return (
                  <button key={tool.id} onClick={() => setLocation(tool.path)} className="text-left rounded-xl p-4 transition-all"
                    style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${stage.color}40`; e.currentTarget.style.background = `${stage.color}06`; e.currentTarget.style.boxShadow = `0 4px 24px ${stage.color}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "#0c0c10"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stage.color}12` }}>
                        {createElement(tool.icon, { size: 14, style: { color: stage.color } })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>{tool.label}</span>
                          {isNew && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontSize: 9, fontWeight: 700 }}>NEW</span>}
                          {isPopular && !isNew && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6", fontSize: 9, fontWeight: 700 }}>Popular</span>}
                        </div>
                        <p className="text-xs mb-2" style={{ color: "#71717a", lineHeight: 1.5 }}>{tool.description}</p>
                        <div className="flex items-center gap-1 text-xs" style={{ color: stage.color, fontWeight: 600 }}>Try it <ArrowRight size={10} /></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
