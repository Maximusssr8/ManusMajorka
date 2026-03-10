import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import ToolPage from "./ToolPage";
import { stages } from "@/lib/tools";
import { AgentPlan } from "@/components/ui/agent-plan";
import { TextShimmer } from "@/components/ui/text-shimmer";
import OnboardingModal from "@/components/OnboardingModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { Search, Rocket, TrendingUp, Zap, Award, ChevronRight } from "lucide-react";

const RECOMMENDED_PATHS: Record<string, { title: string; desc: string; tools: { path: string; label: string; icon: any; color: string }[] }> = {
  beginner: {
    title: "Beginner's Path",
    desc: "Start by finding a product, then build your first store",
    tools: [
      { path: "/app/product-discovery", label: "1. Find Products", icon: Search, color: "#2dca72" },
      { path: "/app/niche-scorer", label: "2. Score Your Niche", icon: TrendingUp, color: "#4ab8f5" },
      { path: "/app/website-generator", label: "3. Build Landing Page", icon: Rocket, color: "#9c5fff" },
      { path: "/app/meta-ads", label: "4. Launch First Ad", icon: Zap, color: "#ff6b6b" },
    ],
  },
  intermediate: {
    title: "Growth Path",
    desc: "Research trends, analyse competitors, and optimise your funnel",
    tools: [
      { path: "/app/trend-radar", label: "1. Scan Trends", icon: TrendingUp, color: "#4ab8f5" },
      { path: "/app/competitor-breakdown", label: "2. Analyse Competitors", icon: Search, color: "#e05c7a" },
      { path: "/app/website-generator", label: "3. Build or Improve Site", icon: Rocket, color: "#9c5fff" },
      { path: "/app/cro-advisor", label: "4. Optimise Conversions", icon: Award, color: "#d4af37" },
    ],
  },
  advanced: {
    title: "Scale Path",
    desc: "Dive into analytics, scale campaigns, and maximise profits",
    tools: [
      { path: "/app/analytics-decoder", label: "1. Decode Analytics", icon: TrendingUp, color: "#7c6af5" },
      { path: "/app/ad-optimizer", label: "2. Optimise Ads", icon: Zap, color: "#ff6b6b" },
      { path: "/app/scaling-playbook", label: "3. Scale Playbook", icon: Rocket, color: "#2dca72" },
      { path: "/app/financial-modeler", label: "4. Financial Model", icon: Award, color: "#d4af37" },
    ],
  },
};

function RecommendedPath({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {
    setLevel(localStorage.getItem("majorka_level"));
  }, []);

  const path = level ? RECOMMENDED_PATHS[level] : null;
  if (!path) return null;

  return (
    <div className="mb-6 rounded-2xl p-4" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
            {path.title}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>{path.desc}</div>
        </div>
        <div className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
          {level === "beginner" ? "🌱" : level === "intermediate" ? "🌿" : "🌳"} {level}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {path.tools.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.path}
              onClick={() => onNavigate(tool.path)}
              className="text-left rounded-xl p-3 transition-all"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${tool.color}40`;
                (e.currentTarget as HTMLButtonElement).style.background = `${tool.color}08`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)";
              }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center mb-1.5" style={{ background: `${tool.color}15`, color: tool.color }}>
                <Icon size={12} />
              </div>
              <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", fontSize: 10 }}>{tool.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isToolPage = location.startsWith("/app/") && location !== "/app";

  return (
    <MajorkaAppShell>
      {isToolPage ? <ToolPage /> : <DashboardHome />}
      {user && <OnboardingModal userName={user.name ?? undefined} />}
    </MajorkaAppShell>
  );
}

const MILESTONES = [
  { key: "majorka_milestone_research", label: "First Product Researched", icon: "🔍", desc: "Ran Product Discovery" },
  { key: "majorka_milestone_site", label: "First Landing Page", icon: "🌐", desc: "Generated a website" },
  { key: "majorka_milestone_ads", label: "First Ad Pack", icon: "📣", desc: "Created Meta Ads Pack" },
  { key: "majorka_milestone_model", label: "Financial Model Built", icon: "📊", desc: "Ran Financial Modeler" },
];

function MilestoneBadges() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const c: Record<string, boolean> = {};
    MILESTONES.forEach(m => { c[m.key] = !!localStorage.getItem(m.key); });
    setCompleted(c);
  }, []);

  const count = Object.values(completed).filter(Boolean).length;
  if (count === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Award size={12} style={{ color: "#d4af37" }} />
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
          Milestones — {count}/{MILESTONES.length}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MILESTONES.map(m => {
          const done = completed[m.key];
          return (
            <div
              key={m.key}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                background: done ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${done ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)"}`,
                opacity: done ? 1 : 0.5,
              }}
            >
              <div className="text-lg mb-1">{done ? "✅" : m.icon}</div>
              <div className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: done ? "#d4af37" : "rgba(240,237,232,0.4)", fontSize: 10 }}>
                {m.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.25)", fontSize: 9 }}>{m.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContinueSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [hasResearch, setHasResearch] = useState(false);

  useEffect(() => {
    setHasResearch(!!localStorage.getItem("majorka_milestone_research"));
  }, []);

  if (!hasResearch) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)" }}>
      <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Continue where you left off</div>
      <div className="text-sm font-black mb-3" style={{ fontFamily: "Syne, sans-serif" }}>Your product journey</div>
      <div className="flex gap-2">
        <button onClick={() => onNavigate("/app/niche-scorer")} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: "rgba(124,106,245,0.1)", border: "1px solid rgba(124,106,245,0.25)", color: "#7c6af5", cursor: "pointer" }}>→ Validate</button>
        <button onClick={() => onNavigate("/app/website-generator")} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: "rgba(45,202,114,0.08)", border: "1px solid rgba(45,202,114,0.2)", color: "#2dca72", cursor: "pointer" }}>→ Build Page</button>
        <button onClick={() => onNavigate("/app/validation-plan")} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer" }}>→ Plan Launch</button>
      </div>
    </div>
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
        <div className="mb-6">
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
            Select a tool from the sidebar, or launch one from the grid below.
          </p>
        </div>

        {/* Start New Product CTA */}
        <button
          onClick={() => setLocation("/app/product-discovery")}
          className="w-full mb-6 px-5 py-4 rounded-2xl text-left transition-all group"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.04))",
            border: "1.5px solid rgba(212,175,55,0.2)",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.4)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.2)";
            (e.currentTarget as HTMLButtonElement).style.transform = "none";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🚀</div>
            <div className="flex-1">
              <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>Start New Product</div>
              <div className="text-xs" style={{ color: "rgba(240,237,232,0.45)" }}>Begin your ecommerce journey — from product research to launch</div>
            </div>
            <div className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}>
              Launch →
            </div>
          </div>
        </button>

        {/* Continue where you left off */}
        <ContinueSection onNavigate={setLocation} />

        {/* Recommended Starting Path (based on onboarding level) */}
        <RecommendedPath onNavigate={setLocation} />

        {/* Milestone Badges */}
        <MilestoneBadges />

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
