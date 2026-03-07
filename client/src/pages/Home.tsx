import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import {
  Zap, Globe, BarChart2, MessageSquare, Layers, TrendingUp,
  ChevronRight, CheckCircle, Star, ArrowRight, Lock
} from "lucide-react";

const MAJORKA_CDN = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663410730336/BApNLVTQJIkjfTKY.html?Expires=1804386341&Signature=VMk5i6QImmjlDYzAeo1ueLBFHRfcckgvTWeyI4ISHQQc-Xss~Dbzto6yNsOGZfdaNnRVnQ0VtqbVJQ4Xwx~f7eQykCAE3BFq4O6M9cHjDclq5pBee0faV71819fXJTuqaliONfahipmy~f9Jy6awmsiZrUZTee~ppw5ypYObfYZOWU~qcrDBbVYOS0OHTpsasgjn~JbOozyMmDkGBN5L5sIf4Q9pdwU5bLME7xUFGTtZ4IL60TMjwVky7DOukS~d6UXMF-3hQhod65Lb2~m2XMq3AISdhMnV9XJeGKSssX8gvYMwGDJatEDM0rvFm1Zg6euNj~fV0t0ztz6EgSRFEQ__&Key-Pair-Id=K2HSFNDJXOU9YS";

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "AI Tool Suite",
    desc: "50+ specialised AI tools for every stage of your ecommerce journey — research, validate, build, launch, optimise, and scale.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Website Generator",
    desc: "Generate high-converting Shopify-ready landing pages in seconds. Export as HTML or Liquid with one click.",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Meta Ads Launch Pack",
    desc: "Unlimited ad hooks, scripts, shot lists, and full Meta campaign launch packs tailored to your product.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "AI Chat Co-founder",
    desc: "A persistent AI co-founder trained on ecommerce operations — always ready to strategise, review, and advise.",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Brand DNA Analyzer",
    desc: "Extract your brand's unique positioning, tone of voice, and creative angles from any product or store.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Market Intelligence",
    desc: "Real-time trend radar, competitor breakdowns, and product discovery scans powered by live web data.",
  },
];

const testimonials = [
  { quote: "Launched my first store in 24 hours using Majorka.", author: "Jake M.", location: "Sydney" },
  { quote: "Made $4,200 in week 1 using the Meta Ads Pack.", author: "Priya K.", location: "Melbourne" },
  { quote: "Website Generator saved me $3k in dev costs.", author: "Tom R.", location: "Brisbane" },
  { quote: "Found a winning product on my very first try.", author: "Sarah L.", location: "Perth" },
];

const planIncludes = [
  "Unlimited AI tool runs",
  "Unlimited website generations",
  "Unlimited Meta Ads Launch Packs",
  "Ads Studio — hooks, scripts & copy",
  "UGC Video Studio",
  "Brand DNA Analyzer",
  "Full Research → Scale workflow",
  "AI Chat Co-founder",
  "Market Intelligence & Trend Radar",
  "Priority support",
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleCTA = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
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
          {/* Logo */}
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

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user?.name?.split(" ")[0]}
                </span>
                <Button
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                  style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e", fontFamily: "Syne, sans-serif", fontWeight: 700 }}
                >
                  Open App <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => window.location.href = getLoginUrl()}>
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={handleCTA}
                  style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e", fontFamily: "Syne, sans-serif", fontWeight: 700 }}
                >
                  Get Access
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO (21st Dev Geometric) ── */}
      <section className="relative z-10">
        <HeroGeometric
          badge="AI Ecommerce Operating System"
          title1="Your AI"
          title2="Ecommerce Co-founder"
        />
        {/* CTA overlay positioned over hero */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto">
            <Button
              size="lg"
              onClick={handleCTA}
              className="px-8 py-6 text-base font-bold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #d4af37, #c09a28)",
                color: "#080a0e",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                boxShadow: "0 4px 24px rgba(212,175,55,0.35)",
              }}
            >
              {isAuthenticated ? "Open Majorka" : "Get Access — $99 / month"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── APP PREVIEW ── */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: "rgba(212,175,55,0.2)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)",
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div
                className="ml-3 flex-1 max-w-xs rounded-md px-3 py-1 text-xs text-muted-foreground"
                style={{ background: "rgba(255,255,255,0.04)", fontFamily: "DM Mono, monospace" }}
              >
                app.majorka.com/dashboard
              </div>
            </div>
            {/* Preview iframe */}
            <div className="relative" style={{ height: "520px" }}>
              <iframe
                src={`${MAJORKA_CDN}`}
                className="w-full h-full border-0"
                title="Majorka App Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ pointerEvents: "none" }}
              />
              {/* Overlay gradient to blur bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
                style={{
                  background: "linear-gradient(to top, rgba(8,10,14,0.95) 0%, transparent 100%)",
                }}
              />
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
                <div
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    color: "#d4af37",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  <Lock className="w-4 h-4" />
                  Subscribe to unlock full access
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 py-24 px-4 bg-background/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Everything you need
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              One OS. Every tool.
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
                  {f.icon}
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

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Real results
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Operators love Majorka
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border"
                style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" style={{ color: "#d4af37" }} />
                  ))}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed mb-4">"{t.quote}"</p>
                <p className="text-xs font-bold" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
                  {t.author} · {t.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="relative z-10 py-24 px-4 bg-background/50 backdrop-blur-sm" id="pricing">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              Simple pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              One plan. Full access.
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
            {/* Shimmer top border */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }}
            />

            <div className="text-center mb-8">
              <div className="text-5xl font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
                $99
                <span className="text-xl font-semibold text-muted-foreground"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground">Everything included. No hidden fees.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {planIncludes.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              className="w-full py-6 text-base font-black rounded-xl"
              onClick={handleCTA}
              style={{
                background: "linear-gradient(135deg, #d4af37, #c09a28)",
                color: "#080a0e",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                boxShadow: "0 4px 22px rgba(212,175,55,0.35)",
              }}
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Access Now"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              30-day money-back guarantee · Cancel anytime
            </p>
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
          <div className="flex gap-5 text-xs text-muted-foreground">
            <button onClick={() => setLocation("/account")} className="hover:text-foreground transition-colors">Account</button>
            <button onClick={handleCTA} className="hover:text-foreground transition-colors">Dashboard</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
