import { Link } from "wouter";
import { useState, useEffect } from "react";

// ── Keyframe styles injected once ──────────────────────────────────────────
const GLOBAL_STYLES = `
@keyframes heroGlow {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.35; }
  50%  { transform: translate(-50%, -52%) scale(1.12); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.35; }
}
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

// ── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0a",
  card: "#111111",
  elevated: "#1a1a1a",
  border: "rgba(255,255,255,0.08)",
  text: "#f5f5f5",
  secondary: "#a1a1aa",
  muted: "#52525b",
  gold: "#f59e0b",
  goldDim: "rgba(245,158,11,0.12)",
  goldBorder: "rgba(245,158,11,0.35)",
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
  { icon: "🔍", name: "Product Discovery",   desc: "Find winning products before your competitors do." },
  { icon: "🌐", name: "Website Generator",   desc: "High-converting product pages in seconds." },
  { icon: "✍️", name: "AI Copywriter",       desc: "Persuasive copy for any channel, instantly." },
  { icon: "📢", name: "Ads Studio",          desc: "Full Meta & TikTok ad packs with hooks." },
  { icon: "📧", name: "Email Sequences",     desc: "Automated flows: welcome, cart, post-purchase." },
  { icon: "📊", name: "Financial Modeler",   desc: "Unit economics, margins, and break-even in one view." },
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
    role: "Dropshipper, Gold Coast",
    initials: "PS",
  },
  {
    quote: "The financial modeler alone saved me from a $3k mistake. This tool pays for itself.",
    name: "Marcus W., AU",
    role: "Dropshipper, Gold Coast",
    initials: "MW",
  },
];

// ── ANALYSE ICONS ───────────────────────────────────────────────────────────
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

export default function Home() {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Majorka — Your AI Ecommerce Operating System";
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: inter, overflowX: "hidden", minHeight: "100vh" }}>
      {/* Inject keyframes */}
      <style>{GLOBAL_STYLES}</style>

      {/* ═══════════════════════════════════════════════════
          1. NAV BAR
      ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: syne, fontWeight: 900, fontSize: 18, color: "#000",
            }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>MAJORKA</span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
            <a href="#features"  style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Features</a>
            <Link href="/pricing" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Pricing</Link>
            <Link href="/sign-in" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign In</Link>
          </div>

          {/* CTA */}
          <Link href="/app" style={{
            background: C.gold, color: "#000", borderRadius: 8,
            padding: "8px 20px", fontFamily: syne, fontWeight: 700, fontSize: 14,
            textDecoration: "none", display: "inline-block",
          }}>Start Free</Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          2. HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px" }}>
        {/* Animated glow blob */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 700, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.05) 50%, transparent 70%)",
          animation: "heroGlow 7s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820 }}>
          {/* Badge */}
          <div style={{
            display: "inline-block", background: C.goldDim, border: `1px solid ${C.goldBorder}`,
            borderRadius: 100, padding: "6px 16px", fontSize: 12, fontWeight: 600,
            color: C.gold, marginBottom: 28, letterSpacing: "0.05em",
          }}>AI Ecommerce Operating System</div>

          {/* Headline */}
          <h1 style={{
            fontFamily: syne, fontWeight: 900, fontSize: "clamp(40px, 7vw, 64px)",
            lineHeight: 1.08, letterSpacing: "-1.5px", marginBottom: 24, color: C.text,
          }}>
            Your AI Ecommerce<br />Operating System.
          </h1>

          {/* Sub-headline */}
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: C.secondary, lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            From product idea to live store in minutes. Research, brand, copy,
            website, ads — all in one platform.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            <Link href="/app" style={{
              background: C.gold, color: "#000", borderRadius: 10,
              padding: "14px 32px", fontFamily: syne, fontWeight: 800, fontSize: 16,
              textDecoration: "none", display: "inline-block",
              boxShadow: "0 0 32px rgba(245,158,11,0.35)",
            }}>Start Free →</Link>

            <button style={{
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.text, borderRadius: 10, padding: "14px 32px",
              fontFamily: syne, fontWeight: 700, fontSize: 16, cursor: "pointer",
            }}>Watch Demo</button>
          </div>

          {/* Social proof */}
          <p style={{ fontSize: 13, color: C.muted }}>
            42 AI tools &nbsp;·&nbsp; 1,000+ sellers &nbsp;·&nbsp; Saves 6+ hours/day
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          3. PLATFORM LOGOS TICKER
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "48px 0" }}>
        <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: C.muted, marginBottom: 28, textTransform: "uppercase" }}>
          Works with your existing platforms
        </p>
        <div style={{ overflow: "hidden", position: "relative" }}>
          {/* Fade edges */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />

          <div style={{ display: "flex", animation: "ticker 28s linear infinite", width: "max-content" }}>
            {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
              <div key={i} style={{
                padding: "10px 36px", fontSize: 15, fontWeight: 700,
                fontFamily: syne, color: C.secondary, whiteSpace: "nowrap",
                borderRight: `1px solid ${C.border}`,
              }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. FEATURE COMPARISON TABLE
      ═══════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", marginBottom: 16 }}>
              Everything your tool stack does. In one tab.
            </h2>
            <p style={{ color: C.secondary, fontSize: 18 }}>
              Replace Minea + AutoDS + Jasper + Canva + your web developer.
            </p>
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", background: C.elevated, padding: "14px 24px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Majorka</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>5 Separate Tools</span>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <span style={{ fontSize: 14, color: C.text }}>{row.feature}</span>
                <span style={{ textAlign: "center", fontSize: 16, color: "#22c55e", fontWeight: 700 }}>{row.majorka}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.tools === "✗" ? "#ef4444" : C.secondary, fontWeight: row.tools === "✗" ? 700 : 400 }}>{row.tools}</span>
              </div>
            ))}

            {/* Total row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", padding: "18px 24px", background: C.elevated, borderTop: `1px solid ${C.goldBorder}` }}>
              <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.text }}>Total</span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.gold }}>$0 extra</span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: "#ef4444" }}>$250+/mo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. PRODUCT WORKFLOW — 3 STEPS
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 64 }}>
            From zero to launch in 3 steps.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {/* Step 1 */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
              <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 40, color: C.goldDim, marginBottom: 16, lineHeight: 1 }}>01</div>
              <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 16, color: C.gold }}>Paste any product URL</h3>
              {/* Mock URL input */}
              <div style={{ background: "#0a0a0a", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.muted, flex: 1, fontFamily: "monospace" }}>https://aliexpress.com/item/1234567…</span>
                <div style={{ background: C.gold, color: "#000", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: syne, flexShrink: 0 }}>Analyse</div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
              <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 40, color: C.goldDim, marginBottom: 16, lineHeight: 1 }}>02</div>
              <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 16, color: C.gold }}>Majorka analyses everything</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ANALYSE_ITEMS.map((item) => (
                  <div key={item} style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: C.gold }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
              <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 40, color: C.goldDim, marginBottom: 16, lineHeight: 1 }}>03</div>
              <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 16, color: C.gold }}>Get your full launch kit</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["✓  Product page ready", "✓  Ad copy generated", "✓  Email flows written", "✓  Financial model built"].map((item) => (
                  <div key={item} style={{ background: "#0a0a0a", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.secondary }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. TOOL SHOWCASE GRID
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 16 }}>
            42 tools. Zero app switching.
          </h2>
          <p style={{ textAlign: "center", color: C.secondary, fontSize: 16, marginBottom: 56 }}>
            Every tool you need, purpose-built for ecommerce.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {TOOLS.map((tool, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredTool(i)}
                onMouseLeave={() => setHoveredTool(null)}
                style={{
                  background: C.card,
                  border: `1px solid ${hoveredTool === i ? C.gold : C.border}`,
                  borderRadius: 16,
                  padding: 28,
                  cursor: "default",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxShadow: hoveredTool === i ? `0 0 24px rgba(245,158,11,0.15)` : "none",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>{tool.icon}</div>
                <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 17, marginBottom: 8, color: C.text }}>{tool.name}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. TESTIMONIALS
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 56 }}>
            Loved by ecommerce operators.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
                {/* Stars */}
                <div style={{ marginBottom: 16, color: C.gold, fontSize: 14 }}>★★★★★</div>
                <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.7, fontStyle: "italic", marginBottom: 24 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.goldDim, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: syne, fontWeight: 800, fontSize: 13, color: C.gold }}>
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
          8. PRICING PREVIEW
      ═══════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 16 }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ textAlign: "center", color: C.secondary, fontSize: 16, marginBottom: 56 }}>
            Start free, upgrade when you're ready.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
            {PRICING_PREVIEW.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? C.elevated : C.card,
                border: `1px solid ${plan.highlight ? C.gold : C.border}`,
                borderRadius: 20,
                padding: 32,
                position: "relative",
                boxShadow: plan.highlight ? `0 0 40px rgba(245,158,11,0.15)` : "none",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.gold, color: "#000", borderRadius: 100, padding: "4px 16px", fontSize: 11, fontWeight: 800, fontFamily: syne, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 8, color: plan.highlight ? C.gold : C.text }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 40, color: C.text }}>{plan.price}</span>
                  <span style={{ color: C.muted, fontSize: 14 }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.secondary }}>
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: "block", textAlign: "center",
                  background: plan.highlight ? C.gold : "transparent",
                  color: plan.highlight ? "#000" : C.text,
                  border: plan.highlight ? "none" : `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 20px",
                  fontFamily: syne, fontWeight: 700, fontSize: 14, textDecoration: "none",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 15, color: C.secondary }}>
            <Link href="/pricing" style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}>See full pricing →</Link>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          9. FINAL CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <section style={{
        padding: "100px 24px",
        background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 50%, #0a0a0a 100%)",
        borderTop: `1px solid ${C.goldBorder}`,
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
            background: C.gold, color: "#000", borderRadius: 12,
            padding: "16px 40px", fontFamily: syne, fontWeight: 800, fontSize: 18,
            textDecoration: "none",
            boxShadow: "0 0 48px rgba(245,158,11,0.4)",
          }}>
            Start Free Today →
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          10. FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo + tagline */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#000" }}>M</div>
              <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16 }}>MAJORKA</span>
            </div>
            <p style={{ color: C.muted, fontSize: 13 }}>The AI Ecommerce Operating System</p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "/pricing" },
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
