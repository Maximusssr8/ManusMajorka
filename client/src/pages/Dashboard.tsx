import React from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import { stages } from "@/lib/tools";

export default function Dashboard() {
  const [location] = useLocation();
  const isToolPage = location.startsWith("/app/") && location !== "/app";

  return (
    <MajorkaAppShell>
      {isToolPage ? <ToolPage /> : <DashboardHome />}
    </MajorkaAppShell>
  );
}

function DashboardHome() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="h-full overflow-auto"
      style={{ background: "#0a0b0d", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Welcome header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#d4af37" }}
            />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
              AI Ecommerce OS
            </span>
          </div>
          <h1
            className="text-2xl font-black mb-2"
            style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}
          >
            Welcome to Majorka
          </h1>
          <p className="text-sm" style={{ color: "rgba(240,237,232,0.45)" }}>
            Select a tool from the nav above, or launch one from the grid below.
          </p>
        </div>

        {/* Quick launch: Website Generator + Meta Ads Pack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {[
            {
              path: "/app/website-generator",
              icon: "🌐",
              label: "Website Generator",
              desc: "Paste a product link → get a full Shopify-ready landing page in seconds",
              accent: "#9c5fff",
            },
            {
              path: "/app/meta-ads-pack",
              icon: "📣",
              label: "Meta Ads Pack",
              desc: "Generate 5 creative angles, ad copy, and a 48-hr launch plan",
              accent: "#2dca72",
            },
          ].map(({ path, icon, label, desc, accent }) => (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className="text-left rounded-2xl p-5 transition-all duration-150 group"
              style={{
                background: `${accent}08`,
                border: `1.5px solid ${accent}25`,
                cursor: "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}50`;
                (e.currentTarget as HTMLButtonElement).style.background = `${accent}12`;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}25`;
                (e.currentTarget as HTMLButtonElement).style.background = `${accent}08`;
                (e.currentTarget as HTMLButtonElement).style.transform = "none";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{icon}</div>
                <div>
                  <div
                    className="text-sm font-black mb-1"
                    style={{ fontFamily: "Syne, sans-serif", color: accent }}
                  >
                    {label}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.5)" }}>
                    {desc}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* All stages grid */}
        {stages.map((stage) => (
          <div key={stage.stage} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
              <h2
                className="text-xs font-black uppercase tracking-widest"
                style={{ fontFamily: "Syne, sans-serif", color: stage.color }}
              >
                {stage.stage}
              </h2>
              <span className="text-xs" style={{ color: "rgba(240,237,232,0.25)" }}>
                {stage.tools.length} tools
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {stage.tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setLocation(tool.path)}
                  className="text-left rounded-xl p-3 transition-all duration-150"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${stage.color}40`;
                    (e.currentTarget as HTMLButtonElement).style.background = `${stage.color}08`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "none";
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${stage.color}18`, color: stage.color }}
                    >
                      {React.createElement(tool.icon, { size: 12 })}
                    </div>
                  </div>
                  <div
                    className="text-xs font-bold leading-tight mb-0.5"
                    style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}
                  >
                    {tool.label}
                  </div>
                  <div
                    className="text-xs leading-snug line-clamp-2"
                    style={{ color: "rgba(240,237,232,0.38)", fontSize: "10px" }}
                  >
                    {tool.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
