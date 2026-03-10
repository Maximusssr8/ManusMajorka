import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { stages } from "@/lib/tools";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import {
  ChevronRight, ArrowRight,
  Zap, Globe, BarChart2, MessageSquare, Layers, TrendingUp,
  Search, BarChart, CheckCircle2, Rocket as RocketIcon,
  ChevronDown,
} from "lucide-react";
import { createElement, useState, useEffect } from "react";

const orbitalStages = [
  {
    id: 1, title: "Research", date: "Stage 1",
    content: "Product Discovery, Competitor Breakdown, Trend Radar, Market Map, Niche Scorer, Supplier Finder, Keyword Miner — 7 tools to find your winning product.",
    category: "Discovery", icon: Search,
    relatedIds: [2], status: "completed" as const, energy: 90,
  },
  {
    id: 2, title: "Validate", date: "Stage 2",
    content: "Unit Economics Calculator, Supplier Risk Check, 48-Hour Validation Plan, Demand Tester, Pricing Optimizer, Audience Profiler — 6 tools to de-risk your bet.",
    category: "Validation", icon: CheckCircle2,
    relatedIds: [1, 3], status: "completed" as const, energy: 80,
  },
  {
    id: 3, title: "Build", date: "Stage 3",
    content: "Website Generator, Creative Studio, Brand DNA Analyzer, Copywriter, Email Sequences, Store Auditor, SEO Optimizer — 8 tools to build your brand.",
    category: "Creation", icon: Layers,
    relatedIds: [2, 4], status: "in-progress" as const, energy: 85,
  },
  {
    id: 4, title: "Launch", date: "Stage 4",
    content: "Meta Ads Pack, Ads Studio, TikTok Ads, Google Ads, Launch Checklist, Influencer Brief — 6 tools to go live and get sales.",
    category: "Go-to-Market", icon: RocketIcon,
    relatedIds: [3, 5], status: "in-progress" as const, energy: 95,
  },
  {
    id: 5, title: "Optimize", date: "Stage 5",
    content: "Market Intelligence, Analytics Decoder, CRO Advisor, Retention Engine, Ad Optimizer, Profit Maximizer — 6 tools to squeeze every dollar.",
    category: "Growth", icon: BarChart,
    relatedIds: [4, 6], status: "pending" as const, energy: 70,
  },
  {
    id: 6, title: "Scale", date: "Stage 6",
    content: "AI Chat Co-founder, Project Manager, Scaling Playbook, Automation Builder, Expansion Planner, Financial Modeler — 6 tools to grow beyond.",
    category: "Scaling", icon: TrendingUp,
    relatedIds: [5, 1], status: "pending" as const, energy: 75,
  },
];

const features = [
  {
    icon: Zap,
    title: "50+ AI Tools",
    desc: "Specialised AI tools for every stage of your ecommerce journey — research, validate, build, launch, optimise, and scale.",
  },
  {
    icon: Globe,
    title: "Website Generator",
    desc: "Generate high-converting Shopify-ready landing pages in seconds. Export as HTML or Liquid with one click.",
  },
  {
    icon: BarChart2,
    title: "Meta Ads Launch Pack",
    desc: "Unlimited ad hooks, scripts, shot lists, and full Meta campaign launch packs tailored to your product.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Co-founder",
    desc: "A persistent AI co-founder trained on ecommerce operations — always ready to strategise, review, and advise.",
  },
  {
    icon: Layers,
    title: "Brand DNA Analyzer",
    desc: "Extract your brand's unique positioning, tone of voice, and creative angles from any product or store.",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    desc: "Real-time trend radar, competitor breakdowns, and product discovery scans powered by live web data.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Paste your product",
    desc: "Drop in a product URL, AliExpress link, or just describe your idea. Majorka extracts the product details automatically.",
    accent: "#d4af37",
  },
  {
    step: "02",
    title: "Pick your tools",
    desc: "Choose from 50+ purpose-built AI tools — research competitors, generate ad copy, build a landing page, or run a full launch pack.",
    accent: "#9c5fff",
  },
  {
    step: "03",
    title: "Launch and scale",
    desc: "Export your website, download your ad pack, and go live. Then use the Optimize and Scale tools to grow from first sale to 7 figures.",
    accent: "#2dca72",
  },
];

const valueComparison = [
  { role: "Copywriter", cost: "$800–$2,000/mo", majorka: "Copywriter tool — unlimited" },
  { role: "Ads Manager", cost: "$1,500–$4,000/mo", majorka: "Meta Ads Pack + Ads Studio" },
  { role: "Web Developer", cost: "$500–$3,000/project", majorka: "Website Generator — instant" },
  { role: "Market Researcher", cost: "$500–$1,500/mo", majorka: "Trend Radar + Competitor Breakdown" },
  { role: "Brand Strategist", cost: "$1,000–$3,000/project", majorka: "Brand DNA Analyzer" },
  { role: "Email Marketer", cost: "$500–$1,500/mo", majorka: "Email Sequences tool" },
];

const faqs = [
  {
    q: "Do I need a Shopify store already?",
    a: "No. Majorka works at every stage — from zero to scaling. You can use the Website Generator to build your landing page, then export it directly to Shopify Liquid when you're ready.",
  },
  {
    q: "Is this for beginners or experienced sellers?",
    a: "Both. Beginners use the Research and Validate tools to find winning products without guesswork. Experienced operators use the Launch and Optimize tools to move faster and cut agency costs.",
  },
  {
    q: "What AI model powers it?",
    a: "Majorka uses frontier AI models (GPT-4 class) with ecommerce-specific system prompts trained on real store data, ad performance patterns, and conversion principles.",
  },
  {
    q: "Is it really free during beta?",
    a: "Yes — all 50+ tools, unlimited runs, no credit card required. Beta access is free while we're building. The price will increase when we launch publicly.",
  },
  {
    q: "Can I export the generated content?",
    a: "Yes. The Website Generator exports HTML and Shopify Liquid. Ad copy, email sequences, and all text outputs have one-click copy buttons. Nothing is locked inside the platform.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "ChatGPT is a general-purpose chat interface. Majorka is purpose-built for ecommerce — every tool has a structured form, real-time web data via Tavily, and output formatted for immediate use (ad copy, landing pages, email flows, etc.).",
  },
];

const betaIncludes = [
  "All 50+ AI tools — unlimited runs",
  "Website Generator — unlimited generations",
  "Meta Ads Launch Pack — unlimited packs",
  "Ads Studio — hooks, scripts & copy",
  "Brand DNA Analyzer",
  "Full Research → Scale workflow",
  "AI Chat Co-founder",
  "Market Intelligence & Trend Radar",
  "All future tools added during beta",
];

function StageTabsSection() {
  const [activeStage, setActiveStage] = useState(0);
  const active = stages[activeStage];
  return (
    <div>
      {/* Stage tab buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {stages.map((s, i) => (
          <button
            key={s.stage}
            onClick={() => setActiveStage(i)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: activeStage === i ? `${s.color}22` : `${s.color}08`,
              border: `1px solid ${activeStage === i ? s.color + "60" : s.color + "20"}`,
              color: activeStage === i ? s.color : `${s.color}80`,
              fontFamily: "Syne, sans-serif",
              transform: activeStage === i ? "scale(1.04)" : "scale(1)",
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: activeStage === i ? s.color : `${s.color}50` }} />
            {s.stage}
            <span className="text-xs opacity-60">{s.tools.length}</span>
          </button>
        ))}
      </div>
      {/* Tool grid for active stage */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: `${active.color}20`, background: `${active.color}04` }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: active.color, fontFamily: "Syne, sans-serif" }}>
          Stage {activeStage + 1} — {active.stage}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {active.tools.map((tool) => (
            <div
              key={tool.id}
              className="flex items-start gap-2.5 p-3 rounded-xl border transition-colors"
              style={{ borderColor: `${active.color}15`, background: "rgba(255,255,255,0.02)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: `${active.color}15`, color: active.color }}
              >
                {createElement(tool.icon, { className: "w-3.5 h-3.5" })}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{tool.label}</p>
                <p className="text-xs mt-0.5 leading-tight" style={{ color: "rgba(240,237,232,0.4)" }}>{tool.description.split(" ").slice(0, 5).join(" ")}…</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const handleLaunchApp = () => {
    setLocation("/app");
  };

  // SEO — dynamic title and meta description
  useEffect(() => {
    document.title = "Majorka — The AI Operating System for Ecommerce Winners";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Majorka is the AI operating system for ecommerce operators. 50+ AI tools to research products, validate ideas, generate Shopify landing pages, launch campaigns, and scale your store — all in one place.");
    }
  }, []);
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background decorations */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 500px at 8% 5%, rgba(212,175,55,0.07) 0%, transparent 60%), radial-gradient(ellipse 500px 400px at 94% 92%, rgba(212,175,55,0.04) 0%, transparent 55%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.025) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)",
        }}
      />

      {/* ── NAV ── */}
      <nav className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
              style={{
                background: "linear-gradient(135deg, #d4af37, #f0c040)",
                color: "#080a0e",
                fontFamily: "Syne, sans-serif",
                boxShadow: "0 0 20px rgba(212,175,55,0.3)",
              }}
            >
              M
            </div>
            <span className="font-black text-xl text-foreground" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.5px" }}>
              Majorka
            </span>
          </div>

          {/* Anchor nav links — desktop only */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: "Features", id: "features" },
              { label: "How It Works", id: "how-it-works" },
              { label: "Pricing", id: "pricing" },
              { label: "FAQ", id: "faq" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontFamily: "Syne, sans-serif", fontWeight: 600 }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.name?.split(" ")[0]}
              </span>
            ) : (
              <button
                onClick={() => setLocation("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                style={{ fontFamily: "Syne, sans-serif", fontWeight: 600 }}
              >
                Sign In
              </button>
            )}
            <Button
              size="sm"
              onClick={handleLaunchApp}
              style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e", fontFamily: "Syne, sans-serif", fontWeight: 700 }}
            >
              Enter Majorka <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO (21st Dev Geometric) ── */}
      <section className="relative z-10">
        <HeroGeometric
          badge="AI Ecommerce Operating System"
          title1="The AI OS for"
          title2="Ecommerce Winners"
        />
      </section>

      {/* ── HERO CTA ── */}
      <section className="relative z-10 -mt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
            The AI operating system built for ecommerce operators. Research, validate, build, launch, and scale — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleLaunchApp}
              className="px-8 py-6 text-base font-bold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #d4af37, #c09a28)",
                color: "#080a0e",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                boxShadow: "0 4px 24px rgba(212,175,55,0.35)",
              }}
            >
              Enter Majorka
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground">Free during beta · No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                quote: "I launched my first winning product in 3 weeks using Majorka's research and ads tools. $14K in my first month. Nothing else comes close.",
                name: "Jake T.",
                role: "Dropshipping, Gold Coast",
                initials: "JT",
                accent: "#d4af37",
              },
              {
                quote: "The Website Generator saved me $2,000 in dev costs and the landing page converts better than anything my agency built. The Meta Ads Pack is insane.",
                name: "Priya S.",
                role: "Beauty Brand, Melbourne",
                initials: "PS",
                accent: "#9c5fff",
              },
              {
                quote: "I use the AI Chat Co-founder every single day. It's like having a business partner who's always available and actually knows ecommerce.",
                name: "Marcus W.",
                role: "DTC Supplements, Sydney",
                initials: "MW",
                accent: "#2dca72",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border"
                style={{ background: `${t.accent}06`, borderColor: `${t.accent}20` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} style={{ color: "#d4af37", fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(240,237,232,0.75)", fontFamily: "DM Sans, sans-serif", fontStyle: "italic" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${t.accent}22`, color: t.accent, fontFamily: "Syne, sans-serif" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{t.name}</div>
                    <div className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOL STAGES OVERVIEW ── */}
      <section id="features-stages" className="relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              6 stages · 50+ tools
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              One OS. Every tool you need.
            </h2>
          </div>

          {/* Interactive stage tabs */}
          <StageTabsSection />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-24 px-4 bg-background/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Everything you need
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Built for operators, by operators.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.28)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(212,175,55,0.12)", color: "#d4af37" }}
                >
                  {createElement(f.icon, { className: "w-5 h-5" })}
                </div>
                <h3 className="font-bold text-base mb-2 text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Simple by design
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Three steps to your first sale.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl p-7 border relative"
                style={{
                  background: `${step.accent}06`,
                  borderColor: `${step.accent}22`,
                }}
              >
                <div
                  className="text-4xl font-black mb-4 leading-none"
                  style={{ fontFamily: "Syne, sans-serif", color: `${step.accent}40` }}
                >
                  {step.step}
                </div>
                <h3 className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif", color: step.accent }}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE COMPARISON ── */}
      <section className="relative z-10 py-24 px-4 bg-background/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              The maths
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Normally $3,000+/month.
            </h2>
            <p className="text-base text-muted-foreground mt-3">
              Majorka replaces an entire ecommerce team — at a fraction of the cost.
            </p>
          </div>
          <div className="rounded-2xl overflow-x-auto border" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
            {/* Table header */}
            <div
              className="grid grid-cols-3 min-w-[480px] px-5 py-3 text-xs font-black uppercase tracking-widest"
              style={{ background: "rgba(212,175,55,0.08)", color: "rgba(212,175,55,0.7)", fontFamily: "Syne, sans-serif" }}
            >
              <span>Role</span>
              <span>Agency / Freelancer</span>
              <span>Majorka</span>
            </div>
            {valueComparison.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 min-w-[480px] px-5 py-4 text-sm border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}
              >
                <span className="font-semibold text-foreground/80">{row.role}</span>
                <span className="text-red-400/70 line-through">{row.cost}</span>
                <span className="font-semibold" style={{ color: "#d4af37" }}>{row.majorka}</span>
              </div>
            ))}
            <div
              className="grid grid-cols-3 min-w-[480px] px-5 py-4 border-t"
              style={{ borderColor: "rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.06)" }}
            >
              <span className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Total</span>
              <span className="font-black text-sm text-red-400/70 line-through">$4,800–$15,000/mo</span>
              <span className="font-black text-sm" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Free during beta</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORBITAL TIMELINE ── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              The workflow
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              From zero to scaling — in one OS.
            </h2>
            <p className="text-sm text-muted-foreground mt-3">Click any stage to explore the tools inside it.</p>
          </div>
          <RadialOrbitalTimeline timelineData={orbitalStages} />
        </div>
      </section>

      {/* ── PRICING (Free Beta) ── */}
      <section className="relative z-10 py-24 px-4 bg-background/50 backdrop-blur-sm" id="pricing">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Beta pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Free during beta.
            </h2>
          </div>

          <div
            className="rounded-2xl p-8 border relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(212,175,55,0.3)",
              boxShadow: "0 0 60px rgba(212,175,55,0.08)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }}
            />

            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
                  $0
                </span>
                <span className="text-lg text-muted-foreground line-through">$99/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Free while in beta. No credit card required.</p>
              <div
                className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(212,175,55,0.12)", color: "#d4af37", fontFamily: "Syne, sans-serif" }}
              >
                BETA ACCESS
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {betaIncludes.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              className="w-full py-6 text-base font-black rounded-xl"
              onClick={handleLaunchApp}
              style={{
                background: "linear-gradient(135deg, #d4af37, #c09a28)",
                color: "#080a0e",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                boxShadow: "0 4px 22px rgba(212,175,55,0.35)",
              }}
            >
              Enter Majorka — It's Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Questions
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Frequently asked.
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)",
                  background: openFaq === i ? "rgba(212,175,55,0.04)" : "rgba(255,255,255,0.02)",
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0 ml-3 transition-transform duration-200"
                    style={{
                      color: "#d4af37",
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Final CTA */}
          <div className="text-center mt-14">
            <p className="text-base text-muted-foreground mb-6">Still have questions? Just launch the app and ask the AI Co-founder.</p>
            <Button
              size="lg"
              onClick={handleLaunchApp}
              className="px-8 py-6 text-base font-bold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #d4af37, #c09a28)",
                color: "#080a0e",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                boxShadow: "0 4px 24px rgba(212,175,55,0.35)",
              }}
            >
              Enter Majorka — It's Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border/50 py-10 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}
            >
              M
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Majorka</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Majorka. AI Ecommerce Operating System.</p>
          <div className="flex gap-5 text-xs text-muted-foreground flex-wrap justify-center">
            <button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="hover:text-foreground transition-colors">How It Works</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-foreground transition-colors">FAQ</button>
            <button onClick={handleLaunchApp} className="hover:text-foreground transition-colors">Launch App</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
