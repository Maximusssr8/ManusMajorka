import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Keyframe styles ──────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
@keyframes heroMesh {
  0%   { transform: translate(-50%, -50%) scale(1) rotate(0deg);   opacity: 0.4; }
  33%  { transform: translate(-52%, -48%) scale(1.1) rotate(60deg); opacity: 0.55; }
  66%  { transform: translate(-48%, -52%) scale(0.95) rotate(120deg); opacity: 0.45; }
  100% { transform: translate(-50%, -50%) scale(1) rotate(180deg);   opacity: 0.4; }
}
@keyframes heroMesh2 {
  0%   { transform: translate(-50%, -50%) scale(1.1) rotate(180deg); opacity: 0.3; }
  50%  { transform: translate(-48%, -52%) scale(0.9) rotate(270deg); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.1) rotate(360deg); opacity: 0.3; }
}
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes progressFill {
  from { width: 0%; }
  to { width: 100%; }
}
@keyframes cardReveal {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.hidden-mobile { display: flex; }
@media (max-width: 768px) {
  .hidden-mobile { display: none !important; }
}
`;

// ── Design tokens — Modern Gradient ─────────────────────────────────────────
const C = {
  bg: "#06060a",
  card: "#0e0e14",
  elevated: "#151520",
  border: "rgba(139,92,246,0.12)",
  borderHover: "rgba(139,92,246,0.3)",
  text: "#f0f0f5",
  secondary: "#8b8b9e",
  muted: "#4a4a5c",
  violet: "#8b5cf6",
  violetDim: "rgba(139,92,246,0.12)",
  violetBorder: "rgba(139,92,246,0.3)",
  gradient: "linear-gradient(135deg, #7c3aed, #3b82f6)",
  gradientAccent: "linear-gradient(135deg, #a855f7, #6366f1)",
  gradientCta: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
  glow: "rgba(139,92,246,0.25)",
};

const syne = "Syne, sans-serif";
const inter = "Inter, sans-serif";

// ── Ticker platforms ────────────────────────────────────────────────────────
const PLATFORMS = [
  "AliExpress", "Shopify", "Amazon", "TikTok", "Instagram",
  "Facebook", "Etsy", "eBay", "WooCommerce",
];

// ── Comparison rows ─────────────────────────────────────────────────────────
const COMPARISON_ROWS: Array<{ feature: string; majorka: string; tools: string }> = [
  { feature: "Product Research",  majorka: "✓", tools: "$49/mo extra" },
  { feature: "Ad Spy",            majorka: "✓", tools: "$29/mo extra" },
  { feature: "AI Copywriter",     majorka: "✓", tools: "$59/mo extra" },
  { feature: "Website Builder",   majorka: "✓", tools: "$39/mo extra" },
  { feature: "Email Sequences",   majorka: "✓", tools: "✗" },
  { feature: "Financial Modeler", majorka: "✓", tools: "✗" },
  { feature: "Brand Kit",         majorka: "✓", tools: "$29/mo extra" },
  { feature: "Supplier Finder",   majorka: "✓", tools: "✗" },
  { feature: "Launch Kit",        majorka: "✓", tools: "✗" },
];

// ── Tool cards ──────────────────────────────────────────────────────────────
const TOOLS = [
  { name: "Product Discovery",   desc: "Find winning products before your competitors do.", badge: "" },
  { name: "Website Generator",   desc: "High-converting product pages in seconds.", badge: "NEW" },
  { name: "AI Copywriter",       desc: "Persuasive copy for any channel, instantly.", badge: "" },
  { name: "Ads Studio",          desc: "Full Meta & TikTok ad packs with hooks.", badge: "" },
  { name: "Email Sequences",     desc: "Automated flows: welcome, cart, post-purchase.", badge: "" },
  { name: "Financial Modeler",   desc: "Unit economics, margins, and break-even in one view.", badge: "NEW" },
];

// ── Testimonials ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I replaced Minea, AutoDS, and Jasper with just Majorka. It's insane value.",
    name: "Jake T., AU",
    role: "Dropshipper, Gold Coast",
    initials: "JT",
  },
  {
    quote: "Generated my entire launch kit in 20 minutes. Product page, ads, emails — everything.",
    name: "Priya S., AU",
    role: "Ecommerce Founder, Sydney",
    initials: "PS",
  },
  {
    quote: "The financial modeler alone saved me from a $3k mistake. This tool pays for itself.",
    name: "Marcus W., AU",
    role: "Brand Owner, Melbourne",
    initials: "MW",
  },
];

// ── Analyse items ───────────────────────────────────────────────────────────
const ANALYSE_ITEMS = [
  "Research", "Brand", "Copy", "Website",
  "Ads", "Email", "Financial", "Supplier",
];

// ── Pricing preview ─────────────────────────────────────────────────────────
const PRICING_PREVIEW = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["5 products", "10 AI req/day", "Website Generator", "Basic Copywriter"],
    highlight: false,
    cta: "Get Started",
    href: "/app",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    features: ["Unlimited products", "Unlimited AI", "All 42 tools", "Launch Kit & Ad Spy"],
    highlight: true,
    badge: "Most Popular",
    cta: "Start Pro Trial",
    href: "/pricing",
  },
  {
    name: "Elite",
    price: "$99",
    period: "/mo",
    features: ["Everything in Pro", "White-label export", "API access", "Custom domain"],
    highlight: false,
    cta: "Go Elite",
    href: "/pricing",
  },
];

// ── Demo products for FOMO section ──────────────────────────────────────────
const DEMO_PRODUCTS = [
  { url: "aliexpress.com/item/3256805…", name: "LED Sunset Lamp", score: 87, revenue: "$4.2k/mo", margin: "62%", trend: "Rising", competition: "Low" },
  { url: "tiktokshop.com/product/829…", name: "Ice Roller Face Massager", score: 92, revenue: "$8.7k/mo", margin: "71%", trend: "Rising", competition: "Medium" },
  { url: "amazon.com.au/dp/B09KX3…", name: "Portable Blender Cup", score: 78, revenue: "$3.1k/mo", margin: "55%", trend: "Stable", competition: "Low" },
];

const DEMO_STEPS = ["Scraping product data...", "Analysing profit margins...", "Checking competition...", "Generating ad angles..."];

// ── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, trigger = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration, trigger]);

  return count;
}

// ── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ── Live Demo Component ─────────────────────────────────────────────────────
function LiveDemoSection() {
  const [phase, setPhase] = useState<"typing" | "analysing" | "results">("typing");
  const [productIdx, setProductIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const product = DEMO_PRODUCTS[productIdx];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typedChars < product.url.length) {
        timer = setTimeout(() => setTypedChars(c => c + 1), 40);
      } else {
        timer = setTimeout(() => { setPhase("analysing"); setStepIdx(0); }, 600);
      }
    } else if (phase === "analysing") {
      if (stepIdx < DEMO_STEPS.length - 1) {
        timer = setTimeout(() => setStepIdx(s => s + 1), 900);
      } else {
        timer = setTimeout(() => setPhase("results"), 700);
      }
    } else if (phase === "results") {
      timer = setTimeout(() => {
        setPhase("typing");
        setTypedChars(0);
        setProductIdx(i => (i + 1) % DEMO_PRODUCTS.length);
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [phase, typedChars, stepIdx, product.url.length]);

  const competitionColor = product.competition === "Low" ? "#10b981" : product.competition === "Medium" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", perspective: 1000 }}>
      {/* Mock browser chrome */}
      <div style={{
        background: C.elevated, borderRadius: "16px 16px 0 0",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
        </div>
        <div style={{
          flex: 1, background: "rgba(139,92,246,0.06)", borderRadius: 8,
          padding: "6px 12px", fontSize: 12, color: C.secondary, fontFamily: "monospace",
        }}>
          majorka.io/app/product-discovery
        </div>
      </div>

      {/* Demo content area */}
      <div style={{
        background: C.card, borderRadius: "0 0 16px 16px",
        padding: 32, minHeight: 280,
        border: `1px solid ${C.border}`, borderTop: "none",
        position: "relative", overflow: "hidden",
      }}>
        {/* URL input phase */}
        {phase === "typing" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Paste any product URL
            </div>
            <div style={{
              background: "rgba(139,92,246,0.06)", border: `1px solid ${C.borderHover}`,
              borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 14, color: C.text, fontFamily: "monospace", flex: 1 }}>
                {product.url.slice(0, typedChars)}
                <span style={{ animation: "blink 0.8s step-end infinite", color: C.violet }}>|</span>
              </span>
              <div style={{
                background: C.gradient, color: "#fff", borderRadius: 8,
                padding: "6px 16px", fontSize: 12, fontWeight: 700, fontFamily: syne,
                opacity: typedChars >= product.url.length ? 1 : 0.4,
                transition: "opacity 0.3s",
              }}>Analyse</div>
            </div>
          </div>
        )}

        {/* Analysing phase */}
        {phase === "analysing" && (
          <div style={{ animation: "slideUp 0.3s ease-out" }}>
            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
              Analysing: {product.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DEMO_STEPS.map((step, i) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= stepIdx ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: i < stepIdx ? "rgba(16,185,129,0.15)" : i === stepIdx ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${i < stepIdx ? "rgba(16,185,129,0.3)" : i === stepIdx ? C.violetBorder : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: i < stepIdx ? "#10b981" : C.violet,
                  }}>
                    {i < stepIdx ? "✓" : i === stepIdx ? "⟳" : ""}
                  </div>
                  <span style={{ fontSize: 13, color: i <= stepIdx ? C.text : C.muted }}>{step}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 20, height: 3, background: "rgba(139,92,246,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: C.gradient,
                width: `${((stepIdx + 1) / DEMO_STEPS.length) * 100}%`,
                transition: "width 0.8s ease-out",
              }} />
            </div>
          </div>
        )}

        {/* Results phase */}
        {phase === "results" && (
          <div style={{ animation: "cardReveal 0.5s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, color: C.text }}>{product.name}</div>
                <div style={{ fontSize: 12, color: C.secondary, marginTop: 2 }}>Analysis complete</div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: syne, fontWeight: 900, fontSize: 18, color: "#10b981",
              }}>{product.score}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Revenue", value: product.revenue, color: "#10b981" },
                { label: "Margin", value: product.margin, color: "#8b5cf6" },
                { label: "Trend", value: product.trend, color: "#3b82f6" },
                { label: "Competition", value: product.competition, color: competitionColor },
              ].map(m => (
                <div key={m.label} style={{
                  background: "rgba(255,255,255,0.02)", borderRadius: 10,
                  padding: "12px", border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: m.color, fontFamily: syne }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stats counter ───────────────────────────────────────────────────────────
function StatsBar() {
  const { ref, inView } = useInView(0.5);
  const products = useCountUp(2847, 2500, inView);
  const sellers = useCountUp(183, 2000, inView);
  const revenue = useCountUp(1200000, 3000, inView);

  const formatRevenue = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n}`;
  };

  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, maxWidth: 800, margin: "0 auto" }}>
      {[
        { value: `${products.toLocaleString()}+`, label: "Products Tracked" },
        { value: `${sellers}+`, label: "Active Sellers" },
        { value: formatRevenue(revenue), label: "Revenue Generated" },
      ].map(stat => (
        <div key={stat.label} style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 4vw, 40px)",
            background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: 8,
          }}>{stat.value}</div>
          <div style={{ fontSize: 14, color: C.secondary }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Home component ─────────────────────────────────────────────────────
export default function Home() {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);
  const [hoveredPricing, setHoveredPricing] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Majorka — Your AI Ecommerce Operating System";
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: inter, overflowX: "hidden", minHeight: "100vh" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ═══════════════════════════════════════════════════
          1. NAV BAR
      ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,6,10,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: syne, fontWeight: 900, fontSize: 18, color: "#fff",
              boxShadow: `0 0 20px ${C.glow}`,
            }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>MAJORKA</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
            <a href="#features" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>Features</a>
            <a href="#pricing" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>Pricing</a>
            <Link href="/sign-in" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign In</Link>
          </div>

          <Link href="/app" style={{
            background: C.gradient, color: "#fff", borderRadius: 10,
            padding: "8px 22px", fontFamily: syne, fontWeight: 700, fontSize: 14,
            textDecoration: "none", display: "inline-block",
            boxShadow: `0 0 20px ${C.glow}`,
          }}>Start Free</Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          2. HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px" }}>
        {/* Animated gradient mesh blobs */}
        <div style={{
          position: "absolute", top: "40%", left: "50%",
          width: 800, height: 600, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)",
          animation: "heroMesh 12s ease-in-out infinite",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", top: "45%", left: "45%",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)",
          animation: "heroMesh2 10s ease-in-out infinite",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820 }}>
          {/* Badge */}
          <div style={{
            display: "inline-block",
            background: C.violetDim, border: `1px solid ${C.violetBorder}`,
            borderRadius: 100, padding: "6px 18px", fontSize: 12, fontWeight: 600,
            color: C.violet, marginBottom: 28, letterSpacing: "0.05em",
          }}>
            <span style={{ marginRight: 6 }}>✦</span>
            AI-Powered Ecommerce OS
          </div>

          {/* Headline with gradient text */}
          <h1 style={{
            fontFamily: syne, fontWeight: 900, fontSize: "clamp(40px, 7vw, 68px)",
            lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 24,
          }}>
            Your AI Ecommerce{" "}
            <span style={{
              background: C.gradient,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Operating System.</span>
          </h1>

          {/* Sub-headline */}
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: C.secondary, lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            From product idea to live store in minutes. Research, brand, copy,
            website, ads — all in one platform.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            <Link href="/app" style={{
              background: C.gradient, color: "#fff", borderRadius: 12,
              padding: "14px 36px", fontFamily: syne, fontWeight: 800, fontSize: 16,
              textDecoration: "none", display: "inline-block",
              boxShadow: `0 0 40px ${C.glow}, 0 4px 20px rgba(0,0,0,0.3)`,
            }}>Start Free →</Link>

            <Link href="#demo" style={{
              background: "transparent", border: `1px solid ${C.violetBorder}`,
              color: C.text, borderRadius: 12, padding: "14px 36px",
              fontFamily: syne, fontWeight: 700, fontSize: 16, cursor: "pointer",
              textDecoration: "none", display: "inline-block",
            }}>Watch Demo ↓</Link>
          </div>

          {/* Social proof */}
          <p style={{ fontSize: 13, color: C.muted }}>
            42 AI tools &nbsp;·&nbsp; 1,000+ sellers &nbsp;·&nbsp; Saves 6+ hours/day
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          3. LIVE DEMO — FOMO Section
      ═══════════════════════════════════════════════════ */}
      <section id="demo" style={{
        padding: "80px 24px",
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.card} 50%, ${C.bg} 100%)`,
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: syne, color: C.violet, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
              Live Demo
            </div>
            <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "-1px", marginBottom: 12 }}>
              See what sellers are discovering{" "}
              <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>right now</span>
            </h2>
            <p style={{ color: C.secondary, fontSize: 16 }}>
              Watch Majorka analyse a product in real-time — from URL to full launch kit.
            </p>
          </div>

          <LiveDemoSection />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. PLATFORM LOGOS TICKER
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "40px 0" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: C.muted, marginBottom: 24, textTransform: "uppercase" }}>
          Works with your existing platforms
        </p>
        <div style={{ overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />

          <div style={{ display: "flex", animation: "ticker 28s linear infinite", width: "max-content" }}>
            {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
              <div key={i} style={{
                padding: "8px 36px", fontSize: 14, fontWeight: 600,
                fontFamily: syne, color: C.secondary, whiteSpace: "nowrap",
                borderRight: `1px solid ${C.border}`,
              }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. FEATURE COMPARISON TABLE
      ═══════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", marginBottom: 16 }}>
              Everything your tool stack does.{" "}
              <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>In one tab.</span>
            </h2>
            <p style={{ color: C.secondary, fontSize: 18 }}>
              Replace Minea + AutoDS + Jasper + Canva + your web developer.
            </p>
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", background: C.elevated, padding: "14px 24px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.violet, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Majorka</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>5 Separate Tools</span>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(139,92,246,0.02)" }}>
                <span style={{ fontSize: 14, color: C.text }}>{row.feature}</span>
                <span style={{ textAlign: "center", fontSize: 16, color: C.violet, fontWeight: 700 }}>{row.majorka}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.tools === "✗" ? "#ef4444" : C.secondary, fontWeight: row.tools === "✗" ? 700 : 400 }}>{row.tools}</span>
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", padding: "18px 24px", background: "rgba(139,92,246,0.06)", borderTop: `1px solid ${C.violetBorder}` }}>
              <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.text }}>Total</span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$0 extra</span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: "#ef4444" }}>$250+/mo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. PRODUCT WORKFLOW — 3 STEPS
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 64 }}>
            From zero to launch in{" "}
            <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>3 steps.</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {[
              { num: "01", title: "Paste any product URL", content: "url" as const },
              { num: "02", title: "Majorka analyses everything", content: "tags" as const },
              { num: "03", title: "Get your full launch kit", content: "checklist" as const },
            ].map((step) => (
              <div key={step.num} className="glow-card" style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
                <div style={{
                  fontFamily: syne, fontWeight: 900, fontSize: 40, marginBottom: 16, lineHeight: 1,
                  background: C.gradientAccent, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  opacity: 0.6,
                }}>{step.num}</div>
                <h3 style={{
                  fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 16,
                  background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>{step.title}</h3>

                {step.content === "url" && (
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: C.muted, flex: 1, fontFamily: "monospace" }}>https://aliexpress.com/item/1234567…</span>
                    <div style={{ background: C.gradient, color: "#fff", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: syne, flexShrink: 0 }}>Analyse</div>
                  </div>
                )}

                {step.content === "tags" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ANALYSE_ITEMS.map((item) => (
                      <div key={item} style={{ background: C.violetDim, border: `1px solid ${C.violetBorder}`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: C.violet }}>
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {step.content === "checklist" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["✓  Product page ready", "✓  Ad copy generated", "✓  Email flows written", "✓  Financial model built"].map((item) => (
                      <div key={item} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.secondary }}>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. TOOL SHOWCASE GRID
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 16 }}>
            42 tools.{" "}
            <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Zero app switching.</span>
          </h2>
          <p style={{ textAlign: "center", color: C.secondary, fontSize: 16, marginBottom: 56 }}>
            Every tool you need, purpose-built for ecommerce.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {TOOLS.map((tool, i) => (
              <div
                key={i}
                className="glow-card"
                onMouseEnter={() => setHoveredTool(i)}
                onMouseLeave={() => setHoveredTool(null)}
                style={{
                  background: C.card,
                  border: `1px solid ${hoveredTool === i ? C.violetBorder : C.border}`,
                  borderRadius: 16,
                  padding: 28,
                  cursor: "default",
                  transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
                  boxShadow: hoveredTool === i ? `0 0 30px ${C.glow}` : "none",
                  transform: hoveredTool === i ? "translateY(-2px)" : "none",
                  position: "relative",
                }}
              >
                {tool.badge && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: C.gradient, color: "#fff",
                    borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 700, fontFamily: syne,
                    letterSpacing: "0.05em",
                  }}>{tool.badge}</div>
                )}
                {/* Icon circle */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: C.violetDim, border: `1px solid ${C.violetBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: C.gradient,
                  }} />
                </div>
                <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 17, marginBottom: 8, color: C.text }}>{tool.name}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          8. TESTIMONIALS
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 56 }}>
            Loved by ecommerce{" "}
            <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>operators.</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: "rgba(21,21,32,0.6)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${C.border}`, borderRadius: 16, padding: 32,
              }}>
                <div style={{ marginBottom: 16, fontSize: 14 }}>
                  {[...Array(5)].map((_, si) => (
                    <span key={si} style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.7, fontStyle: "italic", marginBottom: 24 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: C.violetDim, border: `1px solid ${C.violetBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: syne, fontWeight: 800, fontSize: 13, color: C.violet,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          9. LIVE STATS BAR
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px" }}>
        <StatsBar />
      </section>

      {/* ═══════════════════════════════════════════════════
          10. PRICING PREVIEW
      ═══════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 16 }}>
            Simple, transparent{" "}
            <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>pricing.</span>
          </h2>
          <p style={{ textAlign: "center", color: C.secondary, fontSize: 16, marginBottom: 56 }}>
            Start free, upgrade when you're ready.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
            {PRICING_PREVIEW.map((plan, i) => (
              <div
                key={i}
                className={plan.highlight ? "animate-pulse-glow" : "glow-card"}
                onMouseEnter={() => setHoveredPricing(i)}
                onMouseLeave={() => setHoveredPricing(null)}
                style={{
                  background: plan.highlight ? C.elevated : C.card,
                  border: `1px solid ${plan.highlight ? C.violetBorder : C.border}`,
                  borderRadius: 20,
                  padding: 32,
                  position: "relative",
                  transition: "transform 0.3s",
                  transform: hoveredPricing === i ? "translateY(-4px)" : "none",
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: C.gradient, color: "#fff",
                    borderRadius: 100, padding: "4px 16px", fontSize: 11, fontWeight: 800, fontFamily: syne, whiteSpace: "nowrap",
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{
                  fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 8,
                  color: plan.highlight ? C.violet : C.text,
                }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 40, color: C.text }}>{plan.price}</span>
                  <span style={{ color: C.muted, fontSize: 14 }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.secondary }}>
                      <span style={{ color: C.violet, fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: "block", textAlign: "center",
                  background: plan.highlight ? C.gradient : "transparent",
                  color: plan.highlight ? "#fff" : C.text,
                  border: plan.highlight ? "none" : `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 20px",
                  fontFamily: syne, fontWeight: 700, fontSize: 14, textDecoration: "none",
                  boxShadow: plan.highlight ? `0 4px 20px ${C.glow}` : "none",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 15, color: C.secondary }}>
            <Link href="/pricing" style={{ color: C.violet, textDecoration: "none", fontWeight: 600 }}>See full pricing →</Link>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          11. FINAL CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <section style={{
        padding: "100px 24px",
        background: `linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.06) 50%, ${C.bg} 100%)`,
        borderTop: `1px solid ${C.violetBorder}`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", marginBottom: 20 }}>
            Ready to build your ecommerce business?
          </h2>
          <p style={{ color: C.secondary, fontSize: 18, marginBottom: 40 }}>
            42 AI tools. No credit card required. Start in 30 seconds.
          </p>
          <Link href="/app" style={{
            display: "inline-block",
            background: C.gradient, color: "#fff", borderRadius: 14,
            padding: "18px 48px", fontFamily: syne, fontWeight: 800, fontSize: 18,
            textDecoration: "none",
            boxShadow: `0 0 60px ${C.glow}, 0 4px 20px rgba(0,0,0,0.3)`,
          }}>
            Start Free Today →
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          12. FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: C.gradient, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#fff",
              }}>M</div>
              <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16 }}>MAJORKA</span>
            </div>
            <p style={{ color: C.muted, fontSize: 13 }}>The AI Ecommerce Operating System</p>
          </div>

          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Sign In", href: "/sign-in" },
              { label: "Terms", href: "#" },
              { label: "Privacy", href: "#" },
            ].map(({ label, href }) => (
              href.startsWith("#")
                ? <a key={label} href={href} style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>{label}</a>
                : <Link key={label} href={href} style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
