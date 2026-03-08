/**
 * MajorkaAppShell — top-nav app shell matching the original Majorka HTML design.
 * Horizontal nav: logo | Dashboard · Research · Validate · Build · Website · Launch · Optimize · Scale · Insights | + AI Chat | avatar
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { stages } from "@/lib/tools";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, ChevronDown, LogOut, User, Settings } from "lucide-react";

// ── Nav sections ──────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { label: "Dashboard", path: "/app", exact: true },
  { label: "Research",  path: "/app/research"  },
  { label: "Validate",  path: "/app/validate"  },
  { label: "Build",     path: "/app/build"     },
  { label: "Website",   path: "/app/website-generator" },
  { label: "Launch",    path: "/app/launch"    },
  { label: "Optimize",  path: "/app/optimize"  },
  { label: "Scale",     path: "/app/scale"     },
  { label: "Insights",  path: "/app/insights"  },
];

// Map section labels to stage ids for dropdown menus
const SECTION_STAGE_MAP: Record<string, string> = {
  Research: "Research",
  Validate: "Validate",
  Build:    "Build",
  Launch:   "Launch",
  Optimize: "Optimize",
  Scale:    "Scale",
};

interface Props {
  children: React.ReactNode;
}

export default function MajorkaAppShell({ children }: Props) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location === path;
    return location.startsWith(path);
  };

  const handleNavClick = (item: typeof NAV_SECTIONS[0]) => {
    const stageId = SECTION_STAGE_MAP[item.label];
    if (stageId) {
      // Toggle dropdown for stage sections
      setOpenDropdown(openDropdown === item.label ? null : item.label);
    } else {
      setLocation(item.path);
      setOpenDropdown(null);
    }
  };

  const handleToolClick = (path: string) => {
    setLocation(path);
    setOpenDropdown(null);
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#0a0b0d", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}
    >
      {/* ── TOP NAV ── */}
      <nav
        className="flex-shrink-0 flex items-center gap-1 px-4 border-b relative z-50"
        style={{
          background: "#0d0f12",
          borderColor: "rgba(255,255,255,0.07)",
          height: 52,
        }}
        ref={dropdownRef}
      >
        {/* Logo */}
        <button
          onClick={() => { setLocation("/app"); setOpenDropdown(null); }}
          className="flex items-center gap-2 mr-3 flex-shrink-0"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8 }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}
          >
            M
          </div>
          <span
            className="font-black text-sm hidden sm:block"
            style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}
          >
            Majorka
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 flex-shrink-0 mr-1" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* Nav items */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {NAV_SECTIONS.map((item) => {
            const stageId = SECTION_STAGE_MAP[item.label];
            const active = isActive(item.path, item.exact);
            const stageData = stageId ? stages.find(s => s.stage === stageId) : null;
            const isOpen = openDropdown === item.label;

            return (
              <div key={item.label} className="relative flex-shrink-0">
                <button
                  onClick={() => handleNavClick(item)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: active ? "rgba(212,175,55,0.12)" : isOpen ? "rgba(255,255,255,0.06)" : "transparent",
                    color: active ? "#d4af37" : "rgba(240,237,232,0.65)",
                    fontFamily: "Syne, sans-serif",
                    border: `1px solid ${active ? "rgba(212,175,55,0.3)" : "transparent"}`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!active && !isOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {item.label}
                  {stageId && (
                    <ChevronDown
                      size={10}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s",
                        opacity: 0.5,
                      }}
                    />
                  )}
                </button>

                {/* Dropdown for stage sections */}
                {stageId && isOpen && stageData && (
                  <div
                    className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden"
                    style={{
                      background: "#13151a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                      minWidth: 220,
                      zIndex: 100,
                    }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      <div className="text-xs font-black uppercase tracking-widest" style={{ color: stageData.color, fontFamily: "Syne, sans-serif" }}>
                        {stageData.stage}
                      </div>
                    </div>
                    <div className="py-1">
                      {stageData.tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool.path)}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 transition-all"
                          style={{
                            background: location === tool.path ? `${stageData.color}12` : "transparent",
                            color: location === tool.path ? stageData.color : "rgba(240,237,232,0.7)",
                            cursor: "pointer",
                            border: "none",
                          }}
                          onMouseEnter={e => { if (location !== tool.path) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={e => { if (location !== tool.path) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: `${stageData.color}18`, color: stageData.color }}
                          >
                            {/* @ts-ignore */}
                            {tool.icon && <tool.icon size={12} />}
                          </div>
                          <span className="text-xs font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>{tool.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right side: AI Chat button + user avatar */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={() => { setLocation("/app/ai-chat"); setOpenDropdown(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: location === "/app/ai-chat" ? "rgba(156,95,255,0.2)" : "rgba(156,95,255,0.1)",
              border: `1px solid ${location === "/app/ai-chat" ? "rgba(156,95,255,0.5)" : "rgba(156,95,255,0.25)"}`,
              color: "#9c5fff",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
            }}
          >
            <MessageSquare size={11} />
            <span className="hidden sm:inline">+ AI Chat</span>
          </button>

          {/* User avatar / login */}
          <div className="relative">
                {isAuthenticated && user != null ? (
                <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all"
                    style={{
                      background: "linear-gradient(135deg, #d4af37, #f0c040)",
                      color: "#0a0b0d",
                      fontFamily: "Syne, sans-serif",
                      border: "2px solid rgba(212,175,55,0.4)",
                      cursor: "pointer",
                    }}
                  >
                    {((user?.name ?? user?.email ?? "M") as string).charAt(0).toUpperCase()}
                  </button>
            ) : (
              <button
                onClick={() => window.location.href = getLoginUrl()}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #d4af37, #f0c040)",
                  color: "#0a0b0d",
                  fontFamily: "Syne, sans-serif",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            )}

            {/* User dropdown */}
                {userMenuOpen && isAuthenticated && user != null && (
              <div
                className="absolute top-full right-0 mt-1 rounded-xl overflow-hidden"
                style={{
                  background: "#13151a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  minWidth: 180,
                  zIndex: 100,
                }}
              >
                  <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif" }}>{user?.name ?? "User"}</div>
                    {user?.email && <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(240,237,232,0.4)" }}>{user.email}</div>}
                </div>
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
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
