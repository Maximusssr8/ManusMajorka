/**
 * MajorkaAppShell — collapsible left sidebar + slim top bar.
 * All 9 nav sections are always visible in the sidebar. Hover expands tool dropdowns.
 * Mobile: hamburger toggle. Desktop: sidebar always visible (collapsed icon-only or expanded).
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { stages } from "@/lib/tools";
import { useState, useRef, useEffect, createElement, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MessageSquare, ChevronDown, ChevronRight, LogOut, User, Settings,
  Menu, X, LayoutDashboard, Search, CheckCircle2, Hammer, Globe,
  Rocket, TrendingUp, BarChart3, PanelLeftClose, PanelLeftOpen, Package, Sun, Moon,
} from "lucide-react";

// ── Nav sections with icons ──
const NAV_SECTIONS = [
  { label: "Dashboard", path: "/app", exact: true, icon: LayoutDashboard },
  { label: "Research",  path: "/app/research",  icon: Search,       stageId: "Research" },
  { label: "Validate",  path: "/app/validate",  icon: CheckCircle2, stageId: "Validate" },
  { label: "Build",     path: "/app/build",     icon: Hammer,       stageId: "Build" },
  { label: "Website",   path: "/app/website-generator", icon: Globe },
  { label: "Launch",    path: "/app/launch",    icon: Rocket,       stageId: "Launch" },
  { label: "Optimize",  path: "/app/optimize",  icon: TrendingUp,   stageId: "Optimize" },
  { label: "Scale",     path: "/app/scale",     icon: BarChart3,    stageId: "Scale" },
];

interface Props {
  children: React.ReactNode;
}

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcuts: Cmd/Ctrl+K → search, Cmd/Ctrl+B → toggle sidebar, Cmd/Ctrl+Shift+L → toggle theme
  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "b") { e.preventDefault(); setSidebarOpen(p => !p); }
    if (mod && e.shiftKey && e.key === "L") { e.preventDefault(); toggleTheme?.(); }
  }, [toggleTheme]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location === path;
    return location.startsWith(path);
  };

  const handleNavClick = (item: typeof NAV_SECTIONS[0]) => {
    if (item.stageId) {
      setExpandedStage(expandedStage === item.stageId ? null : item.stageId);
    } else {
      setLocation(item.path);
    }
  };

  const handleToolClick = (path: string) => {
    setLocation(path);
    setMobileOpen(false);
  };

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={() => { setLocation("/app"); }}
          className="flex items-center gap-2"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}
          >
            M
          </div>
          {!collapsed && (
            <span
              className="font-black text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}
            >
              Majorka
            </span>
          )}
        </button>
        {/* Desktop collapse toggle */}
        {!collapsed && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded-md transition-colors"
            style={{ color: "rgba(240,237,232,0.4)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <PanelLeftClose size={14} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md transition-colors absolute"
            style={{ color: "rgba(240,237,232,0.4)", background: "transparent", border: "none", cursor: "pointer", right: -4, top: 14 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <PanelLeftOpen size={14} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        {NAV_SECTIONS.map((item) => {
          const active = isActive(item.path, item.exact);
          const stageData = item.stageId ? stages.find(s => s.stage === item.stageId) : null;
          const isExpanded = expandedStage === item.stageId;

          return (
            <div key={item.label} className="mb-0.5">
              <button
                onClick={() => handleNavClick(item)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? "rgba(212,175,55,0.12)" : "transparent",
                  color: active ? "#d4af37" : "rgba(240,237,232,0.65)",
                  fontFamily: "Syne, sans-serif",
                  border: `1px solid ${active ? "rgba(212,175,55,0.25)" : "transparent"}`,
                  cursor: "pointer",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                title={collapsed ? item.label : undefined}
              >
                {createElement(item.icon, { size: 15, style: { flexShrink: 0 } })}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.stageId && (
                      <ChevronDown
                        size={11}
                        style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.15s",
                          opacity: 0.4,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Expanded tool list */}
              {item.stageId && isExpanded && stageData && !collapsed && (
                <div className="ml-3 mt-0.5 mb-1 pl-3 border-l" style={{ borderColor: `${stageData.color}30` }}>
                  {stageData.tools.map((tool) => {
                    const toolActive = location === tool.path;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.path)}
                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all"
                        style={{
                          background: toolActive ? `${stageData.color}15` : "transparent",
                          color: toolActive ? stageData.color : "rgba(240,237,232,0.55)",
                          cursor: "pointer",
                          border: "none",
                        }}
                        onMouseEnter={e => { if (!toolActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (!toolActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        {createElement(tool.icon, { size: 11, style: { flexShrink: 0, opacity: 0.7 } })}
                        <span style={{ fontFamily: "Syne, sans-serif" }}>{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* AI Chat + My Products */}
        <div className="mt-2 pt-2 border-t space-y-1" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => handleToolClick("/app/my-products")}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: location.startsWith("/app/my-products") || location.startsWith("/app/product-hub") ? "rgba(212,175,55,0.12)" : "transparent",
              border: `1px solid ${location.startsWith("/app/my-products") || location.startsWith("/app/product-hub") ? "rgba(212,175,55,0.25)" : "transparent"}`,
              color: location.startsWith("/app/my-products") || location.startsWith("/app/product-hub") ? "#d4af37" : "rgba(240,237,232,0.65)",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e => { if (!location.startsWith("/app/my-products") && !location.startsWith("/app/product-hub")) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { if (!location.startsWith("/app/my-products") && !location.startsWith("/app/product-hub")) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            title={collapsed ? "My Products" : undefined}
          >
            <Package size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>My Products</span>}
          </button>
          <button
            onClick={() => handleToolClick("/app/ai-chat")}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: location === "/app/ai-chat" ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.06)",
              border: `1px solid ${location === "/app/ai-chat" ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.15)"}`,
              color: "#d4af37",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            title={collapsed ? "AI Chat" : undefined}
          >
            <MessageSquare size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>AI Chat</span>}
          </button>
        </div>
      </div>

      {/* User section at bottom */}
      <div
        className="flex-shrink-0 border-t px-2 py-2"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
        ref={userMenuRef}
      >
        {isAuthenticated && user != null ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all"
              style={{
                background: userMenuOpen ? "rgba(255,255,255,0.06)" : "transparent",
                cursor: "pointer",
                border: "none",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => { if (!userMenuOpen) (e.currentTarget.style.background = "transparent"); }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #d4af37, #f0c040)",
                  color: "#0a0b0d",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                {((user?.name ?? user?.email ?? "M") as string).charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                    {user?.name ?? "User"}
                  </div>
                  {user?.email && (
                    <div className="text-xs truncate" style={{ color: "rgba(240,237,232,0.35)", fontSize: 10 }}>
                      {user.email}
                    </div>
                  )}
                </div>
              )}
            </button>

            {/* User dropdown (pops up above) */}
            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-1 rounded-xl overflow-hidden w-full"
                style={{
                  background: "#0d0f12",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
                  minWidth: 160,
                  zIndex: 100,
                }}
              >
                <div className="py-1">
                  <button
                    onClick={() => { setLocation("/account"); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(240,237,232,0.7)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <User size={12} /> Account
                  </button>
                  <button
                    onClick={() => { setLocation("/"); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(240,237,232,0.7)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Settings size={12} /> Settings
                  </button>
                  <button
                    onClick={() => { toggleTheme?.(); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(240,237,232,0.7)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    <span className="ml-auto text-xs" style={{ color: "rgba(240,237,232,0.25)", fontSize: 9 }}>⌘⇧L</span>
                  </button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ color: "rgba(255,100,100,0.7)", cursor: "pointer", background: "transparent", border: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,100,100,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => window.location.href = getLoginUrl()}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg transition-all"
            style={{
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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0b0d", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}
    >
      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR (Desktop: always visible; Mobile: slide-in) ── */}
      <aside
        className={`
          flex-shrink-0 flex flex-col border-r relative z-50
          ${mobileOpen ? "fixed inset-y-0 left-0" : "hidden lg:flex"}
        `}
        style={{
          width: sidebarOpen ? 220 : 56,
          background: "#0d0f12",
          borderColor: "rgba(255,255,255,0.07)",
          transition: "width 0.2s ease",
        }}
      >
        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 z-50 w-7 h-7 rounded-md flex items-center justify-center lg:hidden"
            style={{ background: "rgba(255,255,255,0.08)", color: "#f0ede8", border: "none", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        )}
        {sidebarContent(!sidebarOpen && !mobileOpen)}
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar with hamburger */}
        <div
          className="flex items-center gap-3 px-4 border-b flex-shrink-0 lg:hidden"
          style={{
            background: "#0d0f12",
            borderColor: "rgba(255,255,255,0.07)",
            height: 48,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: "#f0ede8", border: "none", cursor: "pointer" }}
          >
            <Menu size={16} />
          </button>
          <div
            className="flex items-center gap-2"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}
            >
              M
            </div>
            <span
              className="font-black text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}
            >
              Majorka
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
