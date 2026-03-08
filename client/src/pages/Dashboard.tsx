import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import ToolPage from "./ToolPage";
import { stages } from "@/lib/tools";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [location, setLocation] = useLocation();

  // Check if we're on a specific tool page
  const isToolPage = location.startsWith("/app/") && location !== "/app";

  return (
    <DashboardLayout>
      {isToolPage ? <ToolPage /> : <DashboardHome />}
    </DashboardLayout>
  );
}

function DashboardHome() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Welcome to Majorka
          </h1>
          <p className="text-sm text-muted-foreground">
            Your AI ecommerce operating system. Select a tool from the sidebar, or explore the stages below.
          </p>
        </div>

        {/* Stage Overview */}
        <div className="space-y-8">
          {stages.map((stage) => (
            <div key={stage.stage}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: stage.color }}
                />
                <h2
                  className="text-sm font-black uppercase tracking-wider"
                  style={{ fontFamily: "Syne, sans-serif", color: stage.color }}
                >
                  {stage.stage}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {stage.tools.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stage.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setLocation(tool.path)}
                    className="text-left rounded-xl p-4 border transition-all duration-150 hover:-translate-y-0.5 group"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${stage.color}40`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${stage.color}15`, color: stage.color }}
                      >
                        {React.createElement(tool.icon, { className: "w-4 h-4" })}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold mb-1 text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                          {tool.label}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Need React for createElement in JSX
import React from "react";
