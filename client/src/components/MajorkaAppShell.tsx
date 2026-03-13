/**
 * MajorkaAppShell — fixed 220px left sidebar + mobile bottom tab bar.
 * Premium sidebar with sectioned navigation (Linear/Vercel aesthetic).
 * Mobile: bottom tab bar with icons.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

import { useState, useRef, useEffect, createElement } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, LogOut, User, Settings,
  Menu, X, LayoutDashboard, Search, CheckCircle2, Globe,
  Rocket, Package, Home,
  Target, BarChart2, Megaphone, Video, LineChart, PieChart,
  FolderKanban, Brain, PenTool, Mail, Eye, Sparkles, Truck,
  Store, ShoppingBag, ClipboardList,
} from "lucide-react";

// ── Navigation structure ──────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  icon: any;
  badge?: string;
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
      { label: "Validate", path: "/app/validate", icon: CheckCircle2 },
      { label: "Competitor Breakdown", path: "/app/competitor-breakdown", icon: Target },
      { label: "Ad Spy", path: "/app/ad-spy", icon: Eye },
    ],
  },
  {
    label: "BUILD",
    items: [
      { label: "Website Generator", path: "/app/website-generator", icon: Globe },
      { label: "Brand DNA", path: "/app/brand-dna", icon: Brain },
      { label: "Copywriter", path: "/app/copywriter", icon: PenTool },
      { label: "Email Sequences", path: "/app/email-sequences", icon: Mail },
    ],
  },
  {
    label: "LAUNCH",
    items: [
      { label: "Launch Kit", path: "/app/launch-kit", icon: Sparkles, badge: "✨" },
      { label: "Meta Ads Pack", path: "/app/meta-ads", icon: Megaphone },
      { label: "Ads Studio", path: "/app/ads-studio", icon: Video },
      { label: "TikTok Slides", path: "/app/tiktok", icon: Video, badge: "NEW" },
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
      { label: "Supplier Finder", path: "/app/supplier-finder", icon: Truck },
    ],
  },
  {
    label: "MY STORE",
    items: [
      { label: "Store Setup", path: "/app/store/setup", icon: Store },
      { label: "Storefront", path: "/app/store/products", icon: ShoppingBag },
      { label: "Orders", path: "/app/store/orders", icon: ClipboardList },
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
  const { user, isAuthenticated, loading, session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const productsQuery = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
  const productCount = productsQuery.data?.length ?? 0;

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

  const navItem = (item: NavItem) => {
    const active = isActive(item.path, item.exact);
    return (
      <div key={item.path} className="mb-0.5">
        <button
          onClick={() => handleNavClick(item.path)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all relative"
          style={{
            borderRadius: 6,
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
            {item.label}
            {item.badge && (
              <span className="ml-1" style={{ fontSize: 10 }}>{item.badge}</span>
            )}
            {item.path === "/app/my-products" && productCount > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontSize: 9, fontWeight: 700 }}
              >
                {productCount}
              </span>
            )}
          </span>
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

      {/* Nav sections */}
      <div
        className="flex-1 overflow-y-auto py-3 px-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
      >
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} className={si > 0 ? "mt-2" : ""}>
            <div
              className="px-3 pb-1 font-bold uppercase"
              style={{
                color: "#3f3f46",
                fontFamily: "Syne, sans-serif",
                fontSize: 10,
                letterSpacing: "0.12em",
                paddingTop: si > 0 ? 12 : 4,
              }}
            >
              {section.label}
            </div>
            {section.items.map(item => navItem(item))}
          </div>
        ))}

        {/* Divider + bottom items */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {BOTTOM_ITEMS.map(item => navItem(item))}
        </div>
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
                <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>
                  {user?.name ?? session?.user?.user_metadata?.full_name ?? "User"}
                </div>
                {(user?.email ?? session?.user?.email) && (
                  <div className="truncate" style={{ color: "#52525b", fontSize: 10, fontFamily: "DM Sans, sans-serif" }}>
                    {user?.email ?? session?.user?.email}
                  </div>
                )}
              </div>
            </button>

            {/* Sign Out button always visible below user card */}
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — always 220px, desktop only */}
      <aside
        className={`flex-shrink-0 flex flex-col relative z-50 ${mobileOpen ? "fixed inset-y-0 left-0" : "hidden lg:flex"}`}
        style={{
          width: 220,
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
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#f5f5f5", border: "none", cursor: "pointer" }}
          >
            <Menu size={15} />
          </button>
          <div className="flex items-center gap-2">
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
        </div>

        <div className="flex-1 overflow-hidden pb-16 lg:pb-0">{children}</div>

        {/* Mobile bottom tab bar */}
        <div
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
        </div>
      </div>
    </div>
  );
}
