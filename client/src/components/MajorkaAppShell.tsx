/**
 * MajorkaAppShell — collapsible left sidebar + slim top bar.
 * Premium sidebar with sectioned navigation (Linear/Vercel aesthetic).
 * Collapsed/expanded state persisted to localStorage.
 * Mobile: bottom tab bar with icons.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

import { useState, useRef, useEffect, createElement, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, LogOut, User, Settings,
  Menu, X, LayoutDashboard, Search, CheckCircle2, Globe,
  Rocket, PanelLeftClose, PanelLeftOpen, Package, Sun, Moon, Home,
  Target, BarChart2, Megaphone, Video, LineChart, PieChart,
  FolderKanban, Workflow, Brain,
} from "lucide-react";

// ── Navigation structure ──────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  icon: any;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Dashboard", path: "/app", exact: true, icon: LayoutDashboard },
    ],
  },
  {
    label: "RESEARCH",
    items: [
      { label: "Product Discovery", path: "/app/product-discovery", icon: Search },
      { label: "Validate", path: "/app/validation-plan", icon: CheckCircle2 },
      { label: "Competitor Breakdown", path: "/app/competitor-breakdown", icon: Target },
    ],
  },
  {
    label: "BUILD",
    items: [
      { label: "Website Generator", path: "/app/website-generator", icon: Globe },
      { label: "Brand DNA", path: "/app/brand-dna", icon: Brain },
      { label: "Copywriter", path: "/app/copywriter", icon: FolderKanban },
      { label: "Email Sequences", path: "/app/email-sequences", icon: MessageSquare },
    ],
  },
  {
    label: "LAUNCH",
    items: [
      { label: "Meta Ads Pack", path: "/app/meta-ads", icon: Megaphone },
      { label: "Ads Studio", path: "/app/ads-studio", icon: Video },
      { label: "Launch Planner", path: "/app/launch-planner", icon: Rocket },
    ],
  },
  {
    label: "GROW",
    items: [
      { label: "Market Intelligence", path: "/app/market-intel", icon: LineChart },
      { label: "Analytics Decoder", path: "/app/analytics-decoder", icon: PieChart },
      { label: "AI Chat", path: "/app/ai-chat", icon: MessageSquare },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { label: "My Products", path: "/app/my-products", icon: Package },
      { label: "Project Manager", path: "/app/project-manager", icon: FolderKanban },
      { label: "Scaling Playbook", path: "/app/scaling-playbook", icon: Workflow },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", path: "/app/settings", icon: Settings },
  { label: "Account", path: "/account", icon: User },
];

const MOBILE_TABS: NavItem[] = [
  { label: "Home", path: "/app", icon: Home, exact: true },
  { label: "Research", path: "/app/product-discovery", icon: Search },
  { label: "Website", path: "/app/website-generator", icon: Globe },
  { label: "Planner", path: "/app/launch-planner", icon: Rocket },
  { label: "AI Chat", path: "/app/ai-chat", icon: MessageSquare },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { children: React.ReactNode }

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("majorka_sidebar_open");
    return stored !== null ? stored === "true" : true;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: !!user });
  const productCount = productsQuery.data?.length ?? 0;

  useEffect(() => { localStorage.setItem("majorka_sidebar_open", String(sidebarOpen)); }, [sidebarOpen]);

  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "b") { e.preventDefault(); setSidebarOpen(p => !p); }
    if (mod && e.shiftKey && e.key === "L") { e.preventDefault(); toggleTheme?.(); }
  }, [toggleTheme]);

  useEffect(() => { window.addEventListener("keydown", handleKeyboard); return () => window.removeEventListener("keydown", handleKeyboard); }, [handleKeyboard]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [location]);

  const isActive = (path: string, exact?: boolean) => {
    if (path === "/app/my-products") return location.startsWith("/app/my-products") || location.startsWith("/app/product-hub");
    return exact ? location === path : location.startsWith(path);
  };

  const handleNavClick = (path: string) => { setLocation(path); setMobileOpen(false); };

  const navItem = (item: NavItem, collapsed: boolean) => {
    const active = isActive(item.path, item.exact);
    return (
      <div key={item.path} className="mb-0.5">
        <button
          onClick={() => handleNavClick(item.path)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-all relative"
          style={{
            borderRadius: 6,
            background: active ? "rgba(212,175,55,0.1)" : "transparent",
            color: active ? "#d4af37" : "rgba(240,237,232,0.55)",
            fontFamily: "DM Sans, sans-serif",
            border: "none",
            cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          title={collapsed ? item.label : undefined}
        >
          {/* Gold left border for active */}
          {active && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
              style={{ width: 2, height: 16, background: "#d4af37" }}
            />
          )}
          {createElement(item.icon, { size: 14, style: { flexShrink: 0, opacity: active ? 1 : 0.7 } })}
          {!collapsed && (
            <span className="flex-1 text-left truncate">
              {item.label}
              {item.path === "/app/my-products" && productCount > 0 && (
                <span className="ml-auto float-right text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontSize: 9, fontWeight: 700 }}>{productCount}</span>
              )}
            </span>
          )}
        </button>
      </div>
    );
  };

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button onClick={() => setLocation("/app")} className="flex items-center gap-2.5" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}
          >
            M
          </div>
          {!collapsed && (
            <span className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>
              Majorka
            </span>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded"
            style={{ color: "rgba(240,237,232,0.3)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <PanelLeftClose size={13} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded absolute"
            style={{ color: "rgba(240,237,232,0.3)", background: "transparent", border: "none", cursor: "pointer", right: -4, top: 14 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <PanelLeftOpen size={13} />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} className={si > 0 ? "mt-4" : ""}>
            {!collapsed && (
              <div
                className="px-2.5 mb-1.5 text-xs font-bold tracking-widest uppercase"
                style={{ color: "rgba(240,237,232,0.25)", fontFamily: "Syne, sans-serif", fontSize: 9, letterSpacing: "0.12em" }}
              >
                {section.label}
              </div>
            )}
            {section.items.map(item => navItem(item, collapsed))}
          </div>
        ))}

        {/* Divider + bottom items */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {BOTTOM_ITEMS.map(item => navItem(item, collapsed))}
        </div>
      </div>

      {/* User section */}
      <div
        className="flex-shrink-0 px-2 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        ref={userMenuRef}
      >
        {loading ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
            <div className="w-7 h-7 rounded-full flex-shrink-0 animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
            {!collapsed && (
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)", width: "60%" }} />
                <div className="h-2 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "80%" }} />
              </div>
            )}
          </div>
        ) : isAuthenticated && user != null ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 transition-all"
              style={{
                borderRadius: 8,
                background: userMenuOpen ? "rgba(255,255,255,0.05)" : "transparent",
                cursor: "pointer",
                border: "none",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => { if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name ?? "User"}
                  className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}
                >
                  {(user.name ?? user.email ?? "M").charAt(0).toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{user.name ?? "User"}</div>
                    {user.email && <div className="truncate" style={{ color: "rgba(240,237,232,0.3)", fontSize: 10, fontFamily: "DM Sans, sans-serif" }}>{user.email}</div>}
                  </div>
                  <Settings size={11} style={{ color: "rgba(240,237,232,0.25)", flexShrink: 0 }} />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 overflow-hidden w-full"
                style={{
                  background: "#13151a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
                  minWidth: 160,
                  zIndex: 100,
                  borderRadius: 10,
                }}
              >
                <div className="py-1">
                  <button onClick={() => { setLocation("/account"); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(240,237,232,0.65)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <User size={11} /> Account
                  </button>
                  <button onClick={() => { setLocation("/app/settings/profile"); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(240,237,232,0.65)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Settings size={11} /> Profile Settings
                  </button>
                  <button onClick={() => { toggleTheme?.(); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(240,237,232,0.65)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {theme === "dark" ? <Sun size={11} /> : <Moon size={11} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(255,100,100,0.65)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,100,100,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <LogOut size={11} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const { data } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: "http://localhost:3000/app",
                  skipBrowserRedirect: true,
                  queryParams: { prompt: "select_account" },
                },
              });
              if (data?.url) window.open(data.url, "_self");
            }}
            className="w-full text-xs font-bold px-3 py-2 transition-all"
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#0a0b0d",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
              border: "none",
            }}
          >
            {collapsed ? "→" : "Sign In"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col relative z-50 ${mobileOpen ? "fixed inset-y-0 left-0" : "hidden lg:flex"}`}
        style={{
          width: sidebarOpen ? 220 : 52,
          background: "#0d0f12",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transition: "width 0.2s ease",
        }}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 z-50 w-7 h-7 rounded-md flex items-center justify-center lg:hidden"
            style={{ background: "rgba(255,255,255,0.08)", color: "#f0ede8", border: "none", cursor: "pointer" }}
          >
            <X size={13} />
          </button>
        )}
        {sidebarContent(!sidebarOpen && !mobileOpen)}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 border-b flex-shrink-0 lg:hidden"
          style={{ background: "#0d0f12", borderColor: "rgba(255,255,255,0.06)", height: 48 }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#f0ede8", border: "none", cursor: "pointer" }}
          >
            <Menu size={15} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>M</div>
            <span className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>Majorka</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden pb-16 lg:pb-0">{children}</div>

        {/* Mobile bottom tab bar */}
        <div
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{ background: "#0d0f12", borderTop: "1px solid rgba(255,255,255,0.06)" }}
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
                  style={{ color: active ? "#d4af37" : "rgba(240,237,232,0.35)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <Icon size={17} />
                  <span style={{ fontSize: 9, fontFamily: "Syne, sans-serif", fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
