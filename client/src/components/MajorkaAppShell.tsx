/**
 * MajorkaAppShell — collapsible left sidebar + slim top bar.
 * Sidebar sections grouped into WORKFLOW and POWER TOOLS.
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
} from "lucide-react";

const CORE_TOOLS = [
  { label: "Dashboard", path: "/app", exact: true, icon: LayoutDashboard },
  { label: "Research", path: "/app/product-discovery", icon: Search },
  { label: "Validate", path: "/app/validate", icon: CheckCircle2 },
  { label: "Website", path: "/app/website-generator", icon: Globe },
  { label: "Launch Planner", path: "/app/launch-planner", icon: Rocket },
];

const MOBILE_TABS = [
  { label: "Home", path: "/app", icon: Home, exact: true },
  { label: "Research", path: "/app/product-discovery", icon: Search },
  { label: "Website", path: "/app/website-generator", icon: Globe },
  { label: "Planner", path: "/app/launch-planner", icon: Rocket },
  { label: "AI Chat", path: "/app/ai-chat", icon: MessageSquare },
];

interface Props { children: React.ReactNode }

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
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

  const isActive = (path: string, exact?: boolean) => exact ? location === path : location.startsWith(path);

  const handleToolClick = (path: string) => { setLocation(path); setMobileOpen(false); };

  const navButton = (item: { label: string; path: string; exact?: boolean; icon: any }, collapsed: boolean) => {
    const active = isActive(item.path, item.exact);
    return (
      <div key={item.label} className="mb-0.5">
        <button onClick={() => handleToolClick(item.path)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all relative"
          style={{ background: active ? "rgba(212,175,55,0.12)" : "transparent", color: active ? "#d4af37" : "rgba(240,237,232,0.65)", fontFamily: "Syne, sans-serif", border: `1px solid ${active ? "rgba(212,175,55,0.25)" : "transparent"}`, cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          title={collapsed ? item.label : undefined}
        >
          {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r" style={{ background: "#d4af37" }} />}
          {createElement(item.icon, { size: 15, style: { flexShrink: 0 } })}
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        </button>
      </div>
    );
  };

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <button onClick={() => setLocation("/app")} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>M</div>
          {!collapsed && <span className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>Majorka</span>}
        </button>
        {!collapsed && <button onClick={() => setSidebarOpen(false)} className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded-md transition-colors" style={{ color: "rgba(240,237,232,0.4)", background: "transparent", border: "none", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><PanelLeftClose size={14} /></button>}
        {collapsed && <button onClick={() => setSidebarOpen(true)} className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md transition-colors absolute" style={{ color: "rgba(240,237,232,0.4)", background: "transparent", border: "none", cursor: "pointer", right: -4, top: 14 }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><PanelLeftOpen size={14} /></button>}
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        {CORE_TOOLS.map(item => navButton(item, collapsed))}

        <div className="mt-2 pt-2 border-t space-y-1" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <button onClick={() => handleToolClick("/app/my-products")}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all relative"
            style={{ background: location.startsWith("/app/my-products") || location.startsWith("/app/product-hub") ? "rgba(212,175,55,0.12)" : "transparent", border: `1px solid ${location.startsWith("/app/my-products") || location.startsWith("/app/product-hub") ? "rgba(212,175,55,0.25)" : "transparent"}`, color: location.startsWith("/app/my-products") || location.startsWith("/app/product-hub") ? "#d4af37" : "rgba(240,237,232,0.65)", fontFamily: "Syne, sans-serif", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
            onMouseEnter={e => { if (!location.startsWith("/app/my-products") && !location.startsWith("/app/product-hub")) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { if (!location.startsWith("/app/my-products") && !location.startsWith("/app/product-hub")) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            title={collapsed ? "My Products" : undefined}
          >
            {(location.startsWith("/app/my-products") || location.startsWith("/app/product-hub")) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r" style={{ background: "#d4af37" }} />}
            <Package size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <><span>My Products</span>{productCount > 0 && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontSize: 9, fontWeight: 700 }}>{productCount}</span>}</>}
          </button>
          <button onClick={() => handleToolClick("/app/ai-chat")}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all relative"
            style={{ background: location === "/app/ai-chat" ? "rgba(156,95,255,0.15)" : "rgba(156,95,255,0.06)", border: `1px solid ${location === "/app/ai-chat" ? "rgba(156,95,255,0.4)" : "rgba(156,95,255,0.15)"}`, color: "#9c5fff", fontFamily: "Syne, sans-serif", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
            title={collapsed ? "AI Chat" : undefined}
          >
            {location === "/app/ai-chat" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r" style={{ background: "#9c5fff" }} />}
            <MessageSquare size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>AI Chat</span>}
          </button>
        </div>
      </div>

      {/* User section */}
      <div className="flex-shrink-0 border-t px-2 py-2" style={{ borderColor: "rgba(255,255,255,0.07)" }} ref={userMenuRef}>
        {isAuthenticated && user != null ? (
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all"
              style={{ background: userMenuOpen ? "rgba(255,255,255,0.06)" : "transparent", cursor: "pointer", border: "none", justifyContent: collapsed ? "center" : "flex-start" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = "transparent"; }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>
                {((user?.name ?? user?.email ?? "M") as string).charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{user?.name ?? "User"}</div>
                    {user?.email && <div className="text-xs truncate" style={{ color: "rgba(240,237,232,0.35)", fontSize: 10 }}>{user.email}</div>}
                  </div>
                  <Settings size={12} style={{ color: "rgba(240,237,232,0.3)", flexShrink: 0 }} />
                </>
              )}
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 rounded-xl overflow-hidden w-full" style={{ background: "#13151a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)", minWidth: 160, zIndex: 100 }}>
                <div className="py-1">
                  <button onClick={() => { setLocation("/account"); setUserMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all" style={{ color: "rgba(240,237,232,0.7)", cursor: "pointer", background: "transparent", border: "none" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><User size={12} /> Account</button>
                  <button onClick={() => { setLocation("/app/settings/profile"); setUserMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all" style={{ color: "rgba(240,237,232,0.7)", cursor: "pointer", background: "transparent", border: "none" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><Settings size={12} /> Profile Settings</button>
                  <button onClick={() => { toggleTheme?.(); setUserMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all" style={{ color: "rgba(240,237,232,0.7)", cursor: "pointer", background: "transparent", border: "none" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>{theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}{theme === "dark" ? "Light Mode" : "Dark Mode"}</button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all" style={{ color: "rgba(255,100,100,0.7)", cursor: "pointer", background: "transparent", border: "none" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,100,100,0.06)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><LogOut size={12} /> Sign Out</button>
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
            className="w-full text-xs font-bold px-3 py-2 rounded-lg transition-all"
            style={{
              background: "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#0a0b0d",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
              border: "none",
            }}
          >
            {collapsed ? "\u2192" : "Sign In"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0b0d", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setMobileOpen(false)} />}
      <aside className={`flex-shrink-0 flex flex-col border-r relative z-50 ${mobileOpen ? "fixed inset-y-0 left-0" : "hidden lg:flex"}`} style={{ width: sidebarOpen ? 220 : 56, background: "#0d0f12", borderColor: "rgba(255,255,255,0.07)", transition: "width 0.2s ease" }}>
        {mobileOpen && <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 z-50 w-7 h-7 rounded-md flex items-center justify-center lg:hidden" style={{ background: "rgba(255,255,255,0.08)", color: "#f0ede8", border: "none", cursor: "pointer" }}><X size={14} /></button>}
        {sidebarContent(!sidebarOpen && !mobileOpen)}
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b flex-shrink-0 lg:hidden" style={{ background: "#0d0f12", borderColor: "rgba(255,255,255,0.07)", height: 48 }}>
          <button onClick={() => setMobileOpen(true)} className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#f0ede8", border: "none", cursor: "pointer" }}><Menu size={16} /></button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>M</div>
            <span className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>Majorka</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden pb-16 lg:pb-0">{children}</div>
        {/* Mobile bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t" style={{ background: "#0d0f12", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-around py-2">
            {MOBILE_TABS.map((tab) => {
              const active = tab.exact ? location === tab.path : location.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <button key={tab.label} onClick={() => setLocation(tab.path)} className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors" style={{ color: active ? "#d4af37" : "rgba(240,237,232,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                  <Icon size={18} />
                  <span className="text-xs" style={{ fontSize: 9, fontFamily: "Syne, sans-serif", fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
