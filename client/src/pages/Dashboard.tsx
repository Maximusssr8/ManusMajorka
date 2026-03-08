import React from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import { stages } from "@/lib/tools";
import { AgentPlan } from "@/components/ui/agent-plan";
import { TextShimmer } from "@/components/ui/text-shimmer";

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
            <TextShimmer duration={4} spread={2} className="text-2xl font-black" as="span">
              Welcome to Majorka
            </TextShimmer>
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
              path: "/app/meta-ads",
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

        {/* Agent Plan — ecommerce launch workflow */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
            Your Launch Workflow
          </div>
          <AgentPlan
            tasks={[
              {
                id: "1",
                title: "Research & Validate",
                description: "Find winning products and validate demand before investing",
                status: "completed",
                priority: "high",
                level: 1,
                dependencies: [],
                subtasks: [
                  { id: "1-1", title: "Product Discovery", status: "completed", description: "Find trending products with high demand", priority: "high" },
                  { id: "1-2", title: "Market Intelligence", status: "completed", description: "Analyse market size and trends", priority: "high" },
                  { id: "1-3", title: "Competitor Analysis", status: "completed", description: "Map competitor pricing and positioning", priority: "medium" },
                ],
              },
              {
                id: "2",
                title: "Build Your Store",
                description: "Create your brand identity and product landing page",
                status: "in-progress",
                priority: "high",
                level: 2,
                dependencies: ["1"],
                subtasks: [
                  { id: "2-1", title: "Brand DNA Analyzer", status: "completed", description: "Define brand voice, colours, and identity", priority: "high" },
                  { id: "2-2", title: "Website Generator", status: "in-progress", description: "Build a conversion-optimised landing page", priority: "high" },
                  { id: "2-3", title: "Product Photography Brief", status: "pending", description: "Create visual direction for product shots", priority: "medium" },
                ],
              },
              {
                id: "3",
                title: "Launch Campaigns",
                description: "Create and deploy your Meta & TikTok ad campaigns",
                status: "pending",
                priority: "high",
                level: 3,
                dependencies: ["2"],
                subtasks: [
                  { id: "3-1", title: "Meta Ads Pack", status: "pending", description: "Generate 5 creative angles and ad copy", priority: "high" },
                  { id: "3-2", title: "TikTok Content Plan", status: "pending", description: "Create viral content hooks and scripts", priority: "medium" },
                  { id: "3-3", title: "Email Sequence", status: "pending", description: "Build automated post-purchase flows", priority: "medium" },
                ],
              },
              {
                id: "4",
                title: "Optimise & Scale",
                description: "Analyse performance and scale winning campaigns",
                status: "pending",
                priority: "medium",
                level: 4,
                dependencies: ["3"],
                subtasks: [
                  { id: "4-1", title: "Analytics Dashboard", status: "pending", description: "Track ROAS, CVR, and key metrics", priority: "high" },
                  { id: "4-2", title: "A/B Test Generator", status: "pending", description: "Design split tests for ads and landing pages", priority: "medium" },
                  { id: "4-3", title: "Scale Playbook", status: "pending", description: "Build a systematic scaling framework", priority: "low" },
                ],
              },
            ]}
          />
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
