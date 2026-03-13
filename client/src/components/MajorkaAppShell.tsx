/**
 * MajorkaAppShell — premium 240px sidebar + mobile bottom tab bar.
 * Sidebar: phase-based (Discover / Build / Spy) with collapsible sections.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

import { useState, useRef, useEffect, createElement, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, LogOut, User, Settings,
  Menu, X, Search, Home,
  GraduationCap, ChevronDown, ChevronRight,
  Zap, ArrowUpRight,
  TrendingUp, Calculator,
  Flame, Globe, Brain, PenTool, Megaphone, Eye,
  Activity, Store, ClipboardList,
} from "lucide-react";
import { allTools } from "@/lib/tools";
import MarketSelector from "@/components/MarketSelector";
import { useBeginnerMode, BEGINNER_LABELS, BEGINNER_TOOLTIPS } from "@/hooks/useBeginnerMode";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  icon: any;
  badge?: string;
  tooltip?: string;
}

interface PhaseSection {
  id: string;
  phaseNum: number;
  label: string;
  color: string;
  items: NavItem[];
}

// ── Phase-based nav structure ─────────────────────────────────────────────────

const TOP_ITEMS: NavItem[] = [
  {
    label: "Home",
    path: "/app",
    exact: true,
    icon: Home,
    tooltip: "Your Majorka dashboard — overview of all tools and recent activity.",
  },
  {
    label: "My Playbook",
    path: "/app/history",
    icon: ClipboardList,
    tooltip: "View and revisit your saved tool outputs and session history.",
  },
];

const PHASE_SECTIONS: PhaseSection[] = [
  {
    id: "discover",
    phaseNum: 1,
    label: "DISCOVER",
    color: "#10b981",
    items: [
      {
        label: "Product Scout",
        path: "/app/product-discovery",
        icon: Search,
        tooltip: "AI finds trending, profitable products for the Australian market.",
      },
      {
        label: "Trending Now",
        path: "/app/winning-products",
        icon: Flame,
        badge: "HOT",
        tooltip: "See what's selling right now across AU platforms and social media.",
      },
      {
        label: "Profit Check",
        path: "/app/profit-calculator",
        icon: Calculator,
        tooltip: "Calculate real margins including AU shipping, GST, and ad costs.",
      },
    ],
  },
  {
    id: "build",
    phaseNum: 2,
    label: "BUILD",
    color: "#7c6af5",
    items: [
      {
        label: "Store Builder",
        path: "/app/website-generator",
        icon: Globe,
        tooltip: "Generate a complete Shopify store layout and copy in minutes.",
      },
      {
        label: "Brand DNA",
        path: "/app/brand-dna",
        icon: Brain,
        tooltip: "Define your brand name, tone, colours, and identity in one step.",
      },
      {
        label: "Copy Studio",
        path: "/app/copywriter",
        icon: PenTool,
        tooltip: "Write high-converting product copy and email sequences with AI.",
      },
      {
        label: "Ad Studio",
        path: "/app/meta-ads",
        icon: Megaphone,
        tooltip: "Create Meta and TikTok ad creatives, hooks, and full ad packs.",
      },
    ],
  },
  {
    id: "spy",
    phaseNum: 3,
    label: "SPY",
    color: "#f59e0b",
    items: [
      {
        label: "Competitor Intel",
        path: "/app/store-spy",
        icon: Eye,
        tooltip: "Reverse-engineer competitor stores, ads, and pricing strategies.",
      },
      {
        label: "Market Saturation",
        path: "/app/saturation-checker",
        icon: Activity,
        tooltip: "Check how crowded a niche is before you invest time and money.",
      },
    ],
  },
];

const MOBILE_TABS: NavItem[] = [
  { label: "Home", path: "/app", icon: Home, exact: true },
  { label: "Scout", path: "/app/product-discovery", icon: Search },
  { label: "Store", path: "/app/website-generator", icon: Globe },
  { label: "Ads", path: "/app/meta-ads", icon: Megaphone },
  { label: "AI Chat", path: "/app/ai-chat", icon: MessageSquare },
];

// Beginner mode labels for the new sidebar items
export const PHASE_BEGINNER_LABELS: Record<string, string> = {
  "product-discovery": "Find Products to Sell",
  "winning-products": "What's Hot Right Now",
  "profit-calculator": "Check Your Profit",
  "website-generator": "Build Your Store",
  "brand-dna": "Design Your Brand",
  "copywriter": "Write Your Copy",
  "meta-ads": "Create Your Ads",
  "store-spy": "Spy on Competitors",
  "saturation-checker": "Check Market Crowding",
};

// ── Phase collapse state ───────────────────────────────────────────────────────

const PHASE_STORAGE_KEY = "majorka_phase_open";

function getDefaultPhaseState(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(PHASE_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // New users: Phase 1 open, 2+3 closed
  return { discover: true, build: false, spy: false };
}

// ── Usage helper ──────────────────────────────────────────────────────────────
function getUsageToday(): number {
  try {
    const raw = localStorage.getItem("majorka_ai_count");
    return raw ? Number(raw) || 0 : 0;
  } catch { return 0; }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { children: React.ReactNode }

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading, session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseOpen, setPhaseOpen] = useState<Record<string, boolean>>(getDefaultPhaseState);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
  const productCount = productsQuery.data?.length ?? 0;
  const [usageCount, setUsageCount] = useState(0);
  const createdAtStr = user?.createdAt instanceof Date
    ? user.createdAt.toISOString()
    : (user?.createdAt as string | null | undefined);
  const { isBeginnerMode, toggleBeginnerMode } = useBeginnerMode(createdAtStr);

  // Persist phase open state
  useEffect(() => {
    try {
      localStorage.setItem(PHASE_STORAGE_KEY, JSON.stringify(phaseOpen));
    } catch { /* ignore */ }
  }, [phaseOpen]);

  const togglePhase = (id: string) => {
    setPhaseOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Update usage count periodically
  useEffect(() => {
    setUsageCount(getUsageToday());
    const interval = setInterval(() => setUsageCount(getUsageToday()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allTools
      .filter(t => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const isActive = (path: string, exact?: boolean) => {
    if (path === "/app/my-products") {
      return location.startsWith("/app/my-products") || location.startsWith("/app/product-hub");
    }
    return exact ? location === path : location === path || location.startsWith(path + "/");
  };

  const handleNavClick = (path: string) => {
    setLocation(path);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLocation("/login");
  };

  const DAILY_LIMIT = 50;
  const usagePercent = Math.min((usageCount / DAILY_LIMIT) * 100, 100);

  const navItem = (item: NavItem) => {
    const active = isActive(item.path, item.exact);
    const toolId = item.path.replace("/app/", "").replace(/\//g, "-");
    const beginnerLabel = isBeginnerMode
      ? (PHASE_BEGINNER_LABELS[toolId] ?? BEGINNER_LABELS[toolId])
      : undefined;
    const beginnerTooltip = isBeginnerMode ? BEGINNER_TOOLTIPS[toolId] : undefined;
    const displayLabel = beginnerLabel ?? item.label;
    const tooltip = beginnerTooltip ?? item.tooltip;

    return (
      <div key={item.path} className="mb-0.5" data-tour={`nav-${toolId}`}>
        <button
          onClick={() => handleNavClick(item.path)}
          title={tooltip}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all relative"
          style={{
            borderRadius: 8,
            background: active ? "rgba(212,175,55,0.08)" : "transparent",
            color: active ? "#f5f5f5" : "#a1a1aa",
            fontFamily: "DM Sans, sans-serif",
            border: "none",
            cursor: "pointer",
            borderLeft: active ? "2px solid #f59e0b" : "2px solid transparent",
            paddingLeft: active ? 10 : 12,
          }}
          onMouseEnter={e => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f5f5f5";
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
            }
          }}
        >
          {createElement(item.icon, { size: 14, style: { flexShrink: 0, opacity: active ? 1 : 0.8 } })}
          <span className="flex-1 text-left truncate text-sm">
            {displayLabel}
            {item.badge && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  background: "rgba(212,175,55,0.15)",
                  color: "#d4af37",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {item.badge}
              </span>
            )}
          </span>
          {active && (
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "#f59e0b" }}
            />
          )}
        </button>
      </div>
    );
  };

  const sidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => setLocation("/app")}
          className="flex items-center gap-2.5"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #d4af37, #b8941f)", color: "#0a0a0a", fontFamily: "Syne, sans-serif" }}
          >
            M
          </div>
          <span
            className="font-bold text-sm uppercase tracking-widest"
            style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5", letterSpacing: "0.12em" }}
          >
            MAJORKA
          </span>
        </button>
      </div>

      {/* Search bar */}
      <div className="px-2.5 py-2 flex-shrink-0">
        <button
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all"
          style={{
            borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#52525b",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search tools...</span>
          <kbd
            className="px-1.5 py-0.5 rounded text-xs"
            style={{ background: "rgba(255,255,255,0.06)", color: "#52525b", fontSize: 9, fontFamily: "DM Mono, monospace" }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <div
        className="flex-1 overflow-y-auto py-2 px-2"
        data-tour="sidebar-nav"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
      >
        {/* Top items: Home + Playbook */}
        <div className="mb-2">
          {TOP_ITEMS.map(item => navItem(item))}
        </div>

        {/* Phase divider */}
        <div className="mb-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

        {/* Phase sections */}
        {PHASE_SECTIONS.map(phase => (
          <div key={phase.id} className="mb-1">
            {/* Phase header — collapsible */}
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 transition-all"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {/* Phase badge */}
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${phase.color}20`, border: `1px solid ${phase.color}40` }}
              >
                <span style={{ fontSize: 8, fontWeight: 800, color: phase.color, fontFamily: "Syne, sans-serif" }}>
                  {phase.phaseNum}
                </span>
              </div>
              <span
                className="flex-1 text-left uppercase"
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#3f3f46",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                PHASE {phase.phaseNum} · {phase.label}
              </span>
              {phaseOpen[phase.id]
                ? <ChevronDown size={10} style={{ color: "#3f3f46", flexShrink: 0 }} />
                : <ChevronRight size={10} style={{ color: "#3f3f46", flexShrink: 0 }} />}
            </button>

            {/* Phase items */}
            {phaseOpen[phase.id] && (
              <div className="pl-1">
                {phase.items.map(item => navItem(item))}
              </div>
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

        {/* Ask Majorka AI — gold gradient full-width button */}
        <div className="px-1 mb-1">
          <button
            onClick={() => handleNavClick("/app/ai-chat")}
            className="w-full flex items-center gap-2 px-3 py-2 font-semibold text-sm transition-all"
            style={{
              borderRadius: 8,
              background: isActive("/app/ai-chat")
                ? "linear-gradient(90deg, #d4af37, #b8960c)"
                : "linear-gradient(90deg, #d4af37cc, #b8960ccc)",
              color: "#0a0a0a",
              border: "none",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              boxShadow: "0 2px 8px rgba(212,175,55,0.2)",
            }}
            title="Chat with Majorka AI — your dedicated ecommerce strategist"
            onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(90deg, #d4af37, #b8960c)")}
            onMouseLeave={e => (e.currentTarget.style.background = isActive("/app/ai-chat")
              ? "linear-gradient(90deg, #d4af37, #b8960c)"
              : "linear-gradient(90deg, #d4af37cc, #b8960ccc)")}
          >
            <MessageSquare size={14} style={{ flexShrink: 0 }} />
            <span className="flex-1 text-left">Ask Majorka AI</span>
          </button>
        </div>

        {/* Knowledge Base */}
        {navItem({
          label: "Knowledge Base",
          path: "/app/knowledge-base",
          icon: GraduationCap,
          tooltip: "Browse guides, tutorials, and resources for AU dropshippers.",
        })}
      </div>

      {/* Market selector */}
      <div className="flex-shrink-0 px-2.5 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <MarketSelector />
      </div>

      {/* Beginner Mode toggle */}
      <div
        className="flex-shrink-0 px-3 py-2 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span
          className="text-xs"
          style={{ color: "#52525b", fontFamily: "DM Sans, sans-serif" }}
          title="Simplifies tool names and adds helpful tooltips for new users"
        >
          Beginner Mode
        </span>
        <button
          onClick={toggleBeginnerMode}
          aria-label="Toggle Beginner Mode"
          className="relative flex-shrink-0"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <div
            style={{
              width: 32,
              height: 18,
              borderRadius: 9,
              background: isBeginnerMode ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.1)",
              transition: "background 0.2s",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: isBeginnerMode ? "#d4af37" : "#52525b",
                position: "absolute",
                top: 3,
                left: isBeginnerMode ? 17 : 3,
                transition: "left 0.2s, background 0.2s",
              }}
            />
          </div>
        </button>
      </div>

      {/* Usage meter — mini progress bar */}
      <div className="flex-shrink-0 px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: "#52525b", fontFamily: "DM Sans, sans-serif" }}>
            {usageCount} / {DAILY_LIMIT} credits today
          </span>
          <Zap size={10} style={{ color: usagePercent > 80 ? "#ef4444" : "#d4af37" }} />
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
          title={`${usageCount} of ${DAILY_LIMIT} daily credits used`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${usagePercent}%`,
              background: usagePercent > 80
                ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : "linear-gradient(90deg, #d4af37, #f0c040)",
            }}
          />
        </div>
        {usagePercent > 80 && (
          <p className="text-xs mt-1" style={{ color: "#ef4444", fontSize: 9.5 }}>
            Running low — upgrade for more
          </p>
        )}
        {usagePercent > 60 && (
          <button
            onClick={() => setLocation("/pricing")}
            className="upgrade-pulse cta-shimmer w-full mt-2 text-xs font-bold py-1.5 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8941f)",
              color: "#000", border: "none", cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}
          >
            Upgrade — Unlimited
          </button>
        )}
      </div>

      {/* User section */}
      <div
        className="flex-shrink-0 px-2 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        ref={userMenuRef}
      >
        {loading ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-7 h-7 rounded-full flex-shrink-0 animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)", width: "60%" }} />
              <div className="h-2 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "80%" }} />
            </div>
          </div>
        ) : isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 transition-all"
              style={{
                borderRadius: 8,
                background: userMenuOpen ? "rgba(255,255,255,0.05)" : "transparent",
                cursor: "pointer",
                border: "none",
              }}
              onMouseEnter={e => {
                if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={e => {
                if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name ?? "User"}
                  className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #d4af37, #b8941f)", color: "#0a0a0a", fontFamily: "Syne, sans-serif" }}
                >
                  {(user?.name ?? user?.email ?? session?.user?.email ?? "M").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                    {user?.name ?? session?.user?.user_metadata?.full_name ?? "User"}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs flex-shrink-0"
                    style={{
                      background: "rgba(212,175,55,0.12)",
                      color: "#d4af37",
                      fontSize: 8,
                      fontWeight: 800,
                      fontFamily: "Syne, sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PRO
                  </span>
                </div>
                {(user?.email ?? session?.user?.email) && (
                  <div className="truncate" style={{ color: "#52525b", fontSize: 10, fontFamily: "DM Sans, sans-serif" }}>
                    {user?.email ?? session?.user?.email}
                  </div>
                )}
              </div>
            </button>

            {/* Sign Out button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-all mt-0.5"
              style={{
                borderRadius: 6,
                background: "transparent",
                color: "#52525b",
                border: "none",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#52525b";
              }}
            >
              <LogOut size={12} />
              Sign Out
            </button>

            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 overflow-hidden w-full"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
                  minWidth: 180,
                  zIndex: 100,
                  borderRadius: 10,
                }}
              >
                <div className="py-1">
                  <button
                    onClick={() => { setLocation("/account"); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "#a1a1aa", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <User size={11} /> Account
                  </button>
                  <button
                    onClick={() => { setLocation("/app/settings"); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "#a1a1aa", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Settings size={11} /> Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLocation("/sign-in")}
            className="w-full text-xs font-bold px-3 py-2 transition-all"
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #d4af37, #b8941f)",
              color: "#0a0a0a",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
              border: "none",
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060608", color: "#f5f5f5", fontFamily: "DM Sans, sans-serif" }}>
      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
        >
          <div
            className="w-full max-w-lg mx-4 overflow-hidden"
            style={{
              background: "#141418",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Search size={16} style={{ color: "#52525b", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#f5f5f5", fontFamily: "DM Sans, sans-serif" }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                  if (e.key === "Enter" && searchResults.length > 0) {
                    setLocation(searchResults[0].path);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              <kbd
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ background: "rgba(255,255,255,0.06)", color: "#52525b", fontSize: 10 }}
              >
                ESC
              </kbd>
            </div>
            {searchResults.length > 0 && (
              <div className="py-1 max-h-[300px] overflow-auto">
                {searchResults.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setLocation(tool.path);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#f5f5f5" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(212,175,55,0.1)" }}
                    >
                      {createElement(tool.icon, { size: 12, style: { color: "#d4af37" } })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ fontFamily: "Syne, sans-serif" }}>
                        {tool.label}
                      </div>
                      <div className="text-xs truncate" style={{ color: "#52525b" }}>
                        {tool.description}
                      </div>
                    </div>
                    <ArrowUpRight size={12} style={{ color: "#52525b", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm" style={{ color: "#52525b" }}>No tools found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — 240px, desktop only */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`flex-shrink-0 flex flex-col relative z-50 ${mobileOpen ? "fixed inset-y-0 left-0" : "hidden lg:flex"}`}
        style={{
          width: 240,
          background: "#0a0a0e",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 z-50 w-7 h-7 rounded-md flex items-center justify-center lg:hidden"
            style={{ background: "rgba(255,255,255,0.08)", color: "#f5f5f5", border: "none", cursor: "pointer" }}
          >
            <X size={13} />
          </button>
        )}
        {sidebarContent()}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 border-b flex-shrink-0 lg:hidden"
          style={{ background: "#0a0a0e", borderColor: "rgba(255,255,255,0.06)", height: 48 }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#f5f5f5", border: "none", cursor: "pointer" }}
          >
            <Menu size={15} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs"
              style={{ background: "linear-gradient(135deg, #d4af37, #b8941f)", color: "#0a0a0a", fontFamily: "Syne, sans-serif" }}
            >
              M
            </div>
            <span
              className="font-bold text-sm uppercase tracking-widest"
              style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5", letterSpacing: "0.1em" }}
            >
              MAJORKA
            </span>
          </div>
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "none", cursor: "pointer" }}
          >
            <Search size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden pb-16 lg:pb-0 dashboard-bg">{children}</div>

        {/* Mobile bottom tab bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{ background: "#0a0a0e", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-around py-2">
            {MOBILE_TABS.map((tab) => {
              const active = tab.exact ? location === tab.path : location.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.label}
                  onClick={() => setLocation(tab.path)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors"
                  style={{ color: active ? "#f59e0b" : "rgba(161,161,170,0.6)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <Icon size={17} />
                  <span style={{ fontSize: 9, fontFamily: "Syne, sans-serif", fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
