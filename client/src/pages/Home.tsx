import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { stages } from "@/lib/tools";
import {
  ChevronRight, CheckCircle, ArrowRight, Rocket,
  Zap, Globe, BarChart2, MessageSquare, Layers, TrendingUp,
} from "lucide-react";
import { useState, createElement } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleLaunchApp = () => {
    setLocation("/app");
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    // Store email (could be wired to a tRPC mutation later)
    setWaitlistSubmitted(true);
    toast.success("You're on the list! We'll notify you of updates.");
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

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.name?.split(" ")[0]}
              </span>
            )}
            <Button
              size="sm"
              onClick={handleLaunchApp}
              style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e", fontFamily: "Syne, sans-serif", fontWeight: 700 }}
            >
              Launch App <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
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

      {/* ── TOOL STAGES OVERVIEW ── */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
              6 stages · 50+ tools
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              One OS. Every tool you need.
            </h2>
          </div>

          {/* Stage pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {stages.map((s) => (
              <div
                key={s.stage}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                style={{
                  background: `${s.color}12`,
                  border: `1px solid ${s.color}30`,
                  color: s.color,
                  fontFamily: "Syne, sans-serif",
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.stage}
                <span className="text-xs opacity-60">{s.tools.length}</span>
              </div>
            ))}
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

      {/* ── EARLY ACCESS / WAITLIST ── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(212,175,55,0.1)" }}
          >
            <Rocket className="w-7 h-7" style={{ color: "#d4af37" }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Early Access
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Majorka is currently in beta. Get free access to all 50+ AI tools while we build.
            Join the waitlist to get notified of new features and updates.
          </p>

          {waitlistSubmitted ? (
            <div
              className="rounded-2xl p-6 border"
              style={{ background: "rgba(212,175,55,0.05)", borderColor: "rgba(212,175,55,0.2)" }}
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#d4af37" }} />
              <p className="font-bold" style={{ fontFamily: "Syne, sans-serif" }}>You're on the list!</p>
              <p className="text-sm text-muted-foreground mt-1">We'll notify you of updates and new tools.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex gap-3 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="you@email.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                required
                className="flex-1"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
              />
              <Button
                type="submit"
                style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e", fontFamily: "Syne, sans-serif", fontWeight: 700 }}
              >
                Join
              </Button>
            </form>
          )}
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
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#d4af37" }} />
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
            <button onClick={handleLaunchApp} className="hover:text-foreground transition-colors">Launch App</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
