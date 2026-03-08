import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { stages } from "@/lib/tools";
import { LogOut, PanelLeft, ChevronDown, Home } from "lucide-react";
import { CSSProperties, useState, createElement } from "react";
import { useLocation } from "wouter";

const SIDEBAR_W = 260;
const SIDEBAR_COLLAPSED_W = 56;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    // Auto-expand the stage that contains the active tool
    const result: Record<string, boolean> = {};
    for (const s of stages) {
      const hasActive = s.tools.some((t) => t.path === location);
      result[s.stage] = hasActive;
    }
    // If none active, expand Research by default
    if (!Object.values(result).some(Boolean)) {
      result["Research"] = true;
    }
    return result;
  });

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col border-r transition-all duration-200"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          borderColor: "rgba(255,255,255,0.07)",
          background: "rgba(8,10,14,0.97)",
        }}
      >
        {/* Logo Header */}
        <div
          className="flex items-center gap-2.5 px-3 h-14 flex-shrink-0 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0"
          >
            {collapsed ? (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}
              >
                M
              </div>
            ) : (
              <PanelLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}
              >
                M
              </div>
              <span className="font-black text-sm truncate" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.3px" }}>
                Majorka
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0"
                style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontFamily: "Syne, sans-serif" }}
              >
                BETA
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {/* Home button */}
            <div className="px-2 mb-1">
              <button
                onClick={() => setLocation("/app")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  location === "/app"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
                style={location === "/app" ? { background: "rgba(212,175,55,0.1)", color: "#d4af37" } : {}}
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Home</span>}
              </button>
            </div>

            {/* Stage groups */}
            {stages.map((stage) => {
              const isExpanded = expandedStages[stage.stage] ?? false;
              const hasActiveTool = stage.tools.some((t) => t.path === location);

              return (
                <div key={stage.stage} className="px-2 mb-0.5">
                  {/* Stage header */}
                  <button
                    onClick={() => !collapsed && toggleStage(stage.stage)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                      collapsed ? "justify-center" : ""
                    }`}
                    style={{
                      color: hasActiveTool ? stage.color : "rgba(255,255,255,0.35)",
                      fontFamily: "Syne, sans-serif",
                    }}
                    title={collapsed ? stage.stage : undefined}
                  >
                    {!collapsed && (
                      <>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: stage.color, opacity: hasActiveTool ? 1 : 0.5 }}
                        />
                        <span className="flex-1 text-left">{stage.stage}</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                          style={{ opacity: 0.5 }}
                        />
                      </>
                    )}
                    {collapsed && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: stage.color, opacity: hasActiveTool ? 1 : 0.4 }}
                      />
                    )}
                  </button>

                  {/* Tool buttons */}
                  {(isExpanded || collapsed) && (
                    <div className={collapsed ? "space-y-0.5" : "space-y-0.5 ml-1 mb-1"}>
                      {stage.tools.map((tool) => {
                        const isActive = location === tool.path;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => setLocation(tool.path)}
                            className={`w-full flex items-center gap-2.5 rounded-lg text-sm transition-all ${
                              collapsed ? "justify-center px-0 py-2" : "px-2.5 py-1.5"
                            } ${
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            }`}
                            style={isActive ? {
                              background: `${stage.color}15`,
                              color: stage.color,
                            } : {}}
                            title={collapsed ? tool.label : undefined}
                          >
                            {createElement(tool.icon, {
                              className: `w-4 h-4 flex-shrink-0`,
                              style: isActive ? { color: stage.color } : {},
                            })}
                            {!collapsed && (
                              <span className="truncate text-[13px]">{tool.label}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* User Footer */}
        <div
          className="flex-shrink-0 border-t p-2"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}
                    >
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium truncate">{user.name || "User"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email || ""}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/")} className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={`flex items-center gap-2.5 px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                >
                  G
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <span className="text-xs text-muted-foreground">Guest</span>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
