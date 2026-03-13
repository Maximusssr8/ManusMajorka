import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import Marquee from "react-fast-marquee";
import { SEO } from "@/components/SEO";

// ── Keyframe styles ──────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
@keyframes aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-ring {
  0%   { transform: scale(0.9); opacity: 0.6; }
  50%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}
@keyframes blink {
  50% { opacity: 0; }
}
@keyframes gradient-x {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes ray-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 768px) {
  .hidden-mobile { display: none !important; }
  .mobile-grid-1 { grid-template-columns: 1fr !important; }
  .mobile-grid-2 { grid-template-columns: 1fr 1fr !important; }
  .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
  .mobile-text-sm { font-size: 14px !important; }
  .mobile-hero-h1 { font-size: 32px !important; }
}
`;

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#060608",
  card: "#0c0c10",
  elevated: "#131318",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(212,175,55,0.3)",
  text: "#f5f5f5",
  secondary: "#94949e",
  muted: "#52525b",
  gold: "#d4af37",
  goldLight: "#e8c84a",
  goldDim: "rgba(212,175,55,0.1)",
  goldBorder: "rgba(212,175,55,0.25)",
  green: "#22c55e",
  red: "#ef4444",
};

const syne = "Syne, sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Trust bar items ──────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  "Sellers in 30+ countries",
  "AU, UK, US & EU pricing",
  "Global shipping integrations",
  "All major payment methods",
];

// ── Platform logos ───────────────────────────────────────────────────────────
const PLATFORMS = [
  "Shopify", "Amazon AU", "eBay AU", "TikTok Shop", "Catch",
  "THE ICONIC", "Meta Ads", "Google Ads", "Klaviyo", "Afterpay",
];

// ── Metrics ──────────────────────────────────────────────────────────────────
const METRICS = [
  { value: "50+", label: "AI Tools" },
  { value: "500+", label: "Sellers Worldwide" },
  { value: "$63B", label: "AU Ecom Market" },
  { value: "6hrs", label: "Saved / Day" },
];

// ── Stats for animated counter bar ───────────────────────────────────────────
const STATS = [
  { end: 12400, suffix: "", label: "Products Researched" },
  { end: 3200,  suffix: "", label: "Active Sellers" },
  { end: 18,    suffix: "M+", label: "Revenue Generated", prefix: "$" },
];

// ── Logo strip items ─────────────────────────────────────────────────────────
const LOGO_STRIP = [
  "Shopify", "AliExpress", "Meta", "Google", "TikTok",
  "Australia Post", "Stripe", "Klarna", "Afterpay", "Amazon", "Canva",
];

// ── 6 Key Features ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: "\uD83D\uDD0D",
    title: "Product Research",
    tagline: "Find winning products in 3 clicks",
    desc: "Global market data, landed cost calculations, and competitor analysis. Know exactly what sells before you spend a cent.",
    badge: "Research",
    color: "#3b82f6",
  },
  {
    emoji: "\uD83E\uDDE0",
    title: "Niche Validator",
    tagline: "Know if it'll sell before you spend a cent",
    desc: "AI scores your niche across demand, competition, margin potential, and seasonal trends. Data-driven validation in seconds.",
    badge: "Validate",
    color: "#f59e0b",
  },
  {
    emoji: "\uD83C\uDFA8",
    title: "Brand DNA",
    tagline: "Full brand identity in 60 seconds",
    desc: "Name, logo direction, colour palette, brand voice, taglines — all calibrated for your target market and positioning.",
    badge: "Build",
    color: "#10b981",
  },
  {
    emoji: "\uD83D\uDCF1",
    title: "Meta Ads Pack",
    tagline: "Targeted ads that actually convert",
    desc: "Complete Meta campaigns — 5 ad angles, audience targeting, compliant copy, and scheduling. Ready to launch worldwide.",
    badge: "Launch",
    color: "#ef4444",
  },
  {
    emoji: "\uD83C\uDFEA",
    title: "Website Generator",
    tagline: "Shopify-ready store pages, instantly",
    desc: "High-converting landing pages with trust signals and Shopify Liquid export. Production-ready in minutes.",
    badge: "Build",
    color: "#10b981",
  },
  {
    emoji: "\uD83D\uDCCA",
    title: "Competitor Teardown",
    tagline: "See exactly what your rivals are doing",
    desc: "Deep analysis of competitor pricing, ad strategy, product range, and market positioning. Find gaps and exploit them.",
    badge: "Research",
    color: "#3b82f6",
  },
];

// ── How it works steps ──────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Tell Majorka about your product",
    desc: "Paste a product URL, describe your niche, or tell us your idea. Majorka understands your local market.",
  },
  {
    num: "02",
    title: "AI generates everything you need",
    desc: "Product research, ad copy, landing pages, email sequences, financial models — all calibrated for your target market.",
  },
  {
    num: "03",
    title: "Launch with confidence",
    desc: "Export your launch kit: Shopify theme files, ad campaigns, email flows. Everything ready to go live.",
  },
];

// ── Testimonials (8 global) ─────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Found my first $10K/mo product in week 1. Game changer.",
    name: "Jake M.",
    city: "Gold Coast, AU",
    stars: 5,
  },
  {
    quote: "Finally an AI tool that understands international shipping and Klarna.",
    name: "Sarah T.",
    city: "London, UK",
    stars: 5,
  },
  {
    quote: "Replaced 6 different tools. Majorka does it all at a fraction of the cost.",
    name: "Marcus L.",
    city: "New York, US",
    stars: 5,
  },
  {
    quote: "The competitor teardown alone paid for itself in the first week.",
    name: "Priya K.",
    city: "Singapore, SG",
    stars: 5,
  },
  {
    quote: "Launched my Shopify store in under 48 hours using the Website Generator.",
    name: "Tom B.",
    city: "Sydney, AU",
    stars: 5,
  },
  {
    quote: "The Brand DNA tool gave me a complete identity I'd have paid €2K for elsewhere.",
    name: "Emma R.",
    city: "Berlin, EU",
    stars: 5,
  },
  {
    quote: "Majorka's product research is the best I've used. Accurate, fast, actionable.",
    name: "Chris D.",
    city: "Melbourne, AU",
    stars: 5,
  },
  {
    quote: "Meta Ads Pack cut my launch prep from 2 weeks to 2 hours. Incredible ROI.",
    name: "Lisa H.",
    city: "Austin, US",
    stars: 5,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { feature: "Product Research", majorka: true, tools: "$49/mo" },
  { feature: "AI Ad Copy", majorka: true, tools: "$59/mo" },
  { feature: "Website Builder", majorka: true, tools: "$39/mo" },
  { feature: "Financial Modeler", majorka: true, tools: "Not available" },
  { feature: "Email Sequences", majorka: true, tools: "$29/mo" },
  { feature: "Global Market Data", majorka: true, tools: "Not available" },
  { feature: "TikTok Content", majorka: true, tools: "$29/mo" },
  { feature: "Supplier Finder", majorka: true, tools: "Not available" },
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Is Majorka built for sellers worldwide?",
    a: "Yes. Majorka detects your timezone and currency automatically, serving sellers in Australia (AUD), UK (GBP), Europe (EUR), and the US (USD). Every tool adapts to your local market — shipping carriers, compliance, language, and pricing.",
  },
  {
    q: "What makes this different from other AI tools?",
    a: "Most tools are US-centric. Majorka supports multi-currency pricing, global shipping carriers, regional compliance, and local payment methods (Afterpay, Klarna, Zip, Stripe). No more converting USD or adapting American advice.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. You retain access until the end of your billing period.",
  },
  {
    q: "Do you support Shopify?",
    a: "Yes. Website Generator exports production-ready Shopify Liquid theme files as a ZIP. All landing pages include trust signals, local payment badges, and mobile-optimised layouts ready for your store.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. The Starter plan is free forever with 5 AI credits per day and access to core tools. Paid plans include a 7-day free trial with no credit card required.",
  },
];

// ── Demo typing lines ───────────────────────────────────────────────────────
const DEMO_LINES = [
  { type: "heading", text: "## Global Market Opportunity" },
  { type: "text", text: "The portable blender market is valued at **$42M AUD** in Australia with **23% YoY growth** globally. Key demand drivers:" },
  { type: "bullet", text: "\u2022 Health-conscious consumers (gym membership up 18% YoY)" },
  { type: "bullet", text: "\u2022 Commuter culture in major cities" },
  { type: "bullet", text: "\u2022 Instagram fitness influencer adoption" },
  { type: "heading", text: "## Top Pick: BlendJet-Style 600ml" },
  { type: "text", text: "**Price:** $49.95 AUD / £24.99 GBP / $29.99 USD | **Margin:** 62%" },
  { type: "text", text: "**Landed cost:** $14.20 AUD (product $8 + freight $4.20 + tax $1.40)" },
];

// ── Quick-try demo prompts ──────────────────────────────────────────────────
const DEMO_PROMPTS = [
  { label: "Trending Products", prompt: "Find me trending products to sell globally right now" },
  { label: "Build My Brand", prompt: "Create a brand identity for a global skincare brand" },
  { label: "Write My Ad", prompt: "Write a Meta ad for a portable blender targeting fitness enthusiasts" },
];

// ── FAQ Accordion Item ──────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: C.text, paddingRight: 16 }}>{q}</span>
        <span style={{
          color: C.gold, fontSize: 20, fontWeight: 300, flexShrink: 0,
          transform: open ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s",
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, opacity: open ? 1 : 0,
        transition: "max-height 0.3s ease, opacity 0.2s ease", overflow: "hidden",
      }}>
        <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.7, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

// ── Live Demo Widget ────────────────────────────────────────────────────────
function LiveDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [activePrompt, setActivePrompt] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= DEMO_LINES.length) {
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [activePrompt]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const handlePromptClick = (idx: number) => {
    setActivePrompt(idx);
    setVisibleLines(0);
  };

  const defaultPrompt = "Find me a winning product to sell globally under $50";

  return (
    <div style={{ maxWidth: 600, width: "100%" }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 80px rgba(212,175,55,0.06)",
      }}>
        {/* Window chrome */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
          background: C.elevated, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.muted, fontFamily: dm }}>
            Product Discovery — Majorka AI
          </div>
        </div>

        {/* User input */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            background: "rgba(212,175,55,0.06)", borderRadius: 8, border: `1px solid ${C.goldBorder}`,
          }}>
            <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, flexShrink: 0 }}>You:</span>
            <span style={{ fontSize: 13, color: C.secondary }}>{activePrompt === 0 ? defaultPrompt : DEMO_PROMPTS[activePrompt - 1]?.prompt ?? defaultPrompt}</span>
          </div>
        </div>

        {/* AI response */}
        <div ref={containerRef} style={{ padding: 16, minHeight: 200, maxHeight: 280, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
          {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} style={{ animation: "fadeUp 0.3s ease both", marginBottom: line.type === "heading" ? 12 : 6 }}>
              {line.type === "heading" ? (
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 14, color: C.gold, marginTop: i > 0 ? 16 : 0 }}>
                  {line.text.replace("## ", "")}
                </div>
              ) : line.type === "bullet" ? (
                <div style={{ fontSize: 13, color: C.secondary, lineHeight: 1.6, paddingLeft: 4 }}>{line.text}</div>
              ) : (
                <div style={{ fontSize: 13, color: C.secondary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{
                  __html: line.text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f5f5f5;font-weight:600">$1</strong>'),
                }} />
              )}
            </div>
          ))}
          {visibleLines < DEMO_LINES.length && visibleLines > 0 && (
            <span style={{
              display: "inline-block", width: 8, height: 16,
              background: C.gold, animation: "blink 0.8s step-end infinite",
              borderRadius: 1, verticalAlign: "middle",
            }} />
          )}
          {visibleLines === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, animation: "pulse-ring 1.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 13, color: C.muted }}>Majorka AI is analysing global market data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick-try buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {DEMO_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => handlePromptClick(i + 1)}
            style={{
              background: activePrompt === i + 1 ? C.goldDim : "rgba(255,255,255,0.04)",
              border: `1px solid ${activePrompt === i + 1 ? C.goldBorder : C.border}`,
              borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600,
              color: activePrompt === i + 1 ? C.gold : C.secondary,
              cursor: "pointer", transition: "all 0.2s", fontFamily: dm,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Social Proof Counter ────────────────────────────────────────────────────
function SocialProofCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats/users")
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => setCount(500)); // fallback
  }, []);

  if (count === null) return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
      borderRadius: 100, padding: "6px 18px", marginTop: 24,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", background: C.green,
        animation: "pulse-ring 2s ease-in-out infinite",
      }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>
        Join {count.toLocaleString()}+ sellers worldwide using Majorka
      </span>
    </div>
  );
}

// ── Animated Stats Bar ──────────────────────────────────────────────────────
function StatsBar() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section
      ref={ref}
      style={{
        padding: "80px 24px",
        background: C.elevated,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32,
          textAlign: "center",
        }}
        className="mobile-grid-1"
      >
        {STATS.map((stat, i) => (
          <div key={i} style={{ padding: "16px 0" }}>
            <div style={{
              fontFamily: syne,
              fontWeight: 900,
              fontSize: "2.5rem",
              color: C.gold,
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
              {inView ? (
                <>
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <CountUp
                    start={0}
                    end={stat.end}
                    duration={2.4}
                    separator=","
                    delay={i * 0.2}
                  />
                  {stat.suffix && <span>{stat.suffix}</span>}
                </>
              ) : (
                <span>{stat.prefix ?? ""}{stat.end.toLocaleString()}{stat.suffix ?? ""}</span>
              )}
            </div>
            <div style={{ fontSize: 14, color: C.secondary, fontWeight: 500, letterSpacing: "0.02em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Testimonial Card ────────────────────────────────────────────────────────
function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div style={{
      background: "#0d1117",
      borderRadius: 12,
      padding: 20,
      borderLeft: `2px solid ${C.gold}`,
      marginRight: 16,
      minWidth: 280,
      maxWidth: 320,
      flexShrink: 0,
    }}>
      <div style={{ color: C.gold, fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>
        {"★".repeat(t.stars)}
      </div>
      <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 16, fontWeight: 500 }}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div>
        <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: C.text }}>{t.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{t.city}</div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
// ── Email Capture Component ─────────────────────────────────────────────────
function EmailCapture() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, source: "landing-guide" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div style={{
        background: C.elevated, border: `1px solid ${C.goldBorder}`,
        borderRadius: 20, padding: "48px 32px", textAlign: "center",
        maxWidth: 560, margin: "0 auto",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2705"}</div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 12 }}>
          You're in! Check your inbox.
        </h3>
        <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>
          Your free product research guide is on its way. While you wait,{" "}
          <Link href="/app" style={{ color: C.gold, textDecoration: "underline" }}>try the tools free</Link>.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: C.elevated, border: `1px solid ${C.border}`,
      borderRadius: 20, padding: "48px 32px",
      maxWidth: 560, margin: "0 auto",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: C.goldDim, border: `1px solid ${C.goldBorder}`,
          borderRadius: 100, padding: "5px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 14 }}>{"\uD83C\uDF0D"}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gold }}>FREE PRODUCT GUIDE</span>
        </div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 8 }}>
          Get the Product Research Playbook
        </h3>
        <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.6 }}>
          How top sellers find $10K/mo products — plus weekly trending product alerts. Free, no spam.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="First name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14,
            fontFamily: dm, outline: "none",
          }}
        />
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14,
            fontFamily: dm, outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
            color: "#000", borderRadius: 10, padding: "14px 20px",
            fontFamily: syne, fontWeight: 800, fontSize: 15,
            border: "none", cursor: status === "loading" ? "wait" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {status === "loading" ? "Sending..." : "Send Me the Guide"}
        </button>
        {status === "error" && (
          <p style={{ color: C.red, fontSize: 13, textAlign: "center" }}>{errorMsg}</p>
        )}
        <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
          Unsubscribe anytime. We respect your privacy.
        </p>
      </form>
    </div>
  );
}

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredPricing, setHoveredPricing] = useState<number | null>(null);

  // ── Timezone-based pricing detection ──────────────────────────────────────
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isAU = tz.startsWith("Australia");
  const isEU = tz.startsWith("Europe");
  const isUK = tz === "Europe/London";
  const priceBuilder = isAU ? "A$79" : isUK ? "£39" : isEU ? "€45" : "$49";
  const priceScale = isAU ? "A$229" : isUK ? "£119" : isEU ? "€135" : "$149";
  const priceCurrencyLabel = isAU ? "AUD/mo" : isUK ? "GBP/mo" : isEU ? "EUR/mo" : "USD/mo";

  // ── Dynamic pricing plans ─────────────────────────────────────────────────
  const PRICING = [
    {
      name: "Starter",
      price: "$0",
      period: "forever free",
      description: "Get started with essential AI tools. Free forever.",
      features: ["5 AI credits/day", "Core tools access", "Website Generator", "Basic Copywriter", "Multi-currency defaults"],
      highlight: false,
      cta: "Start Free",
      href: "/app",
      afterpay: false,
    },
    {
      name: "Builder",
      price: priceBuilder,
      period: priceCurrencyLabel,
      description: "Everything you need to run a winning ecommerce business.",
      features: ["Unlimited AI credits", "All 50+ tools", "Full Launch Kit", "Meta + TikTok Ads Pack", "Email Sequences", "Financial Modeler", "Priority support"],
      highlight: true,
      badge: "Most Popular",
      cta: "Start Free Trial",
      href: "/pricing",
      afterpay: true,
    },
    {
      name: "Scale",
      price: priceScale,
      period: priceCurrencyLabel,
      description: "For serious operators who need full control and priority AI.",
      features: ["Everything in Builder", "Priority AI (faster responses)", "API access", "White-label export", "Custom domain support", "Dedicated account manager"],
      highlight: false,
      cta: "Start Free Trial",
      href: "/pricing",
      afterpay: true,
    },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: dm, overflowX: "hidden", minHeight: "100vh" }}>
      <SEO
        title="Majorka — AI Ecommerce OS for Sellers Worldwide | Start Free"
        description="AI-powered ecommerce operating system for dropshippers worldwide. 50+ tools to research, validate, build, launch and scale your store. Start free today."
        path="/"
      />
      <style>{GLOBAL_STYLES}</style>

      {/* ═══════════════════════════════════════════════════
          1. NAV BAR
      ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,6,8,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: syne, fontWeight: 900, fontSize: 17, color: "#000",
            }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 17, letterSpacing: "0.08em", color: C.text }}>MAJORKA</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
            <a href="#features" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>Features</a>
            <a href="#demo" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>Demo</a>
            <a href="#pricing" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>Pricing</a>
            <a href="#faq" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>FAQ</a>
            <Link href="/sign-in" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign In</Link>
          </div>

          <Link href="/app" style={{
            background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
            color: "#000", borderRadius: 8,
            padding: "8px 20px", fontFamily: syne, fontWeight: 700, fontSize: 14,
            textDecoration: "none", display: "inline-block",
            boxShadow: `0 0 20px rgba(212,175,55,0.2)`,
          }}>Start Free</Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          2. HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "100px 24px 60px",
        overflow: "hidden",
      }}>
        {/* Animated aurora background */}
        <div style={{
          position: "absolute", top: "-30%", left: "-20%",
          width: "140%", height: "140%",
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 30% 60%, rgba(59,130,246,0.04) 0%, transparent 50%),
                       radial-gradient(ellipse 50% 50% at 70% 30%, rgba(212,175,55,0.05) 0%, transparent 50%)`,
          backgroundSize: "200% 200%",
          animation: "aurora 15s ease-in-out infinite",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Rotating rays */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 800, height: 800,
          marginTop: -400, marginLeft: -400,
          background: `conic-gradient(from 0deg, transparent, rgba(212,175,55,0.03), transparent, rgba(212,175,55,0.02), transparent, rgba(212,175,55,0.03), transparent)`,
          animation: "ray-rotate 30s linear infinite",
          pointerEvents: "none", zIndex: 0, borderRadius: "50%",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, width: "100%" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.goldDim, border: `1px solid ${C.goldBorder}`,
            borderRadius: 100, padding: "6px 18px", marginBottom: 32,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: C.green,
              animation: "pulse-ring 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.gold, letterSpacing: "0.03em" }}>
              Built for Sellers Worldwide
            </span>
          </div>

          {/* Headline */}
          <h1 className="mobile-hero-h1" style={{
            fontFamily: syne, fontWeight: 900,
            fontSize: "clamp(36px, 6.5vw, 68px)",
            lineHeight: 1.05, letterSpacing: "-2px",
            marginBottom: 24, color: C.text,
          }}>
            50+ AI Tools for Sellers.<br />
            One Platform.{" "}
            <span style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight}, ${C.gold})`,
              backgroundSize: "200% 200%",
              animation: "gradient-x 4s ease infinite",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Your Unfair Advantage.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(16px, 2.2vw, 20px)", color: C.secondary,
            lineHeight: 1.6, marginBottom: 40, maxWidth: 640, margin: "0 auto 40px",
          }}>
            Product research, ad copy, brand building, and launch strategy — for dropshippers
            and DTC brands worldwide. In your currency. With local payment methods. Actually useful.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            <Link
              href="/app"
              aria-label="Start using Majorka for free"
              style={{
                background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
                color: "#000", borderRadius: 12,
                padding: "16px 40px", fontFamily: syne, fontWeight: 800, fontSize: 17,
                textDecoration: "none", display: "inline-block",
                boxShadow: `0 0 40px rgba(212,175,55,0.3), 0 4px 16px rgba(0,0,0,0.3)`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 0 56px rgba(212,175,55,0.45), 0 8px 24px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(212,175,55,0.3), 0 4px 16px rgba(0,0,0,0.3)";
              }}
            >Start Free</Link>

            <a
              href="#demo"
              aria-label="Watch a live demo"
              style={{
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 12, padding: "16px 36px",
                fontFamily: syne, fontWeight: 700, fontSize: 17,
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
                transition: "border-color 0.2s, background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.borderColor = C.goldBorder;
                e.currentTarget.style.background = "rgba(212,175,55,0.04)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <span style={{ fontSize: 14 }}>{"\u25B6"}</span> See It Work
            </a>
          </div>

          {/* Trust bar */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8,
            maxWidth: 700, margin: "0 auto",
          }}>
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: C.muted, fontWeight: 500, letterSpacing: "0.02em",
              }}>
                <span style={{ color: C.gold, fontSize: 8 }}>{"\u25C6"}</span>
                {item}
                {i < TRUST_ITEMS.length - 1 && (
                  <span style={{ color: C.border, margin: "0 4px" }}>{"\u00B7"}</span>
                )}
              </div>
            ))}
          </div>

          {/* Social proof counter */}
          <SocialProofCounter />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2a. ANIMATED STATS BAR
      ═══════════════════════════════════════════════════ */}
      <StatsBar />

      {/* ═══════════════════════════════════════════════════
          2b. EMAIL CAPTURE + SOCIAL PROOF
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "60px 24px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: syne, fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)",
            letterSpacing: "-0.5px", marginBottom: 12, color: C.text,
          }}>
            Get the Free Product Playbook
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
            50 winning products for 2025 + weekly trending product alerts. Built for sellers worldwide.
          </p>
          <EmailCapture />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          3. METRICS STRIP
      ═══════════════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        background: C.card,
      }}>
        <div className="mobile-grid-2" style={{
          maxWidth: 900, margin: "0 auto", padding: "40px 24px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
          textAlign: "center",
        }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ animation: "countUp 0.5s ease both", animationDelay: `${i * 0.1}s` }}>
              <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 32, color: C.text }}>{m.value}</span>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. LIVE DEMO WIDGET
      ═══════════════════════════════════════════════════ */}
      <section id="demo" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{
              fontFamily: syne, fontWeight: 900,
              fontSize: "clamp(28px, 5vw, 44px)",
              letterSpacing: "-1px", marginBottom: 16,
            }}>
              Watch Majorka think.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17, maxWidth: 550, margin: "0 auto" }}>
              Real AI analysis with global market data, multi-currency pricing, and local supplier intelligence.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. LOGO STRIP (react-fast-marquee)
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "48px 0" }}>
        <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: C.muted, marginBottom: 28, textTransform: "uppercase" }}>
          Built for the platforms sellers use worldwide
        </p>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
          <Marquee speed={30} gradient={false}>
            {[...LOGO_STRIP, ...LOGO_STRIP].map((name, i) => (
              <div key={i} style={{
                padding: "10px 40px", fontSize: 14, fontWeight: 700,
                fontFamily: syne, color: C.secondary, whiteSpace: "nowrap",
                borderRight: `1px solid ${C.border}`,
              }}>{name}</div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          6. FEATURES GRID
      ═══════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{
              fontFamily: syne, fontWeight: 900,
              fontSize: "clamp(28px, 5vw, 44px)",
              letterSpacing: "-1px", marginBottom: 16,
            }}>
              50+ tools. One platform. Built for sellers everywhere.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17, maxWidth: 550, margin: "0 auto" }}>
              Every tool defaults to your local currency, language, suppliers, and compliance. No more adapting US-centric advice.
            </p>
          </div>

          <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  background: hoveredFeature === i ? "rgba(255,255,255,0.02)" : C.card,
                  border: `1px solid ${hoveredFeature === i ? C.borderHover : C.border}`,
                  borderRadius: 16, padding: 28,
                  transition: "all 0.3s ease",
                  boxShadow: hoveredFeature === i ? `0 8px 32px rgba(212,175,55,0.08)` : "none",
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>{f.emoji}</span>
                  <div>
                    <div style={{
                      display: "inline-block", padding: "3px 8px", borderRadius: 6,
                      fontSize: 10, fontWeight: 700, fontFamily: syne,
                      background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}30`,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>{f.badge}</div>
                  </div>
                </div>
                <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 6, color: C.text }}>{f.title}</h3>
                <p style={{ fontFamily: syne, fontWeight: 600, fontSize: 14, color: C.gold, marginBottom: 10 }}>{f.tagline}</p>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          7. HOW IT WORKS
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 64 }}>
            From idea to launch in 3 steps.
          </h2>

          <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                background: C.elevated, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: 32,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -10, right: 12,
                  fontFamily: syne, fontWeight: 900, fontSize: 100,
                  color: "rgba(212,175,55,0.04)", lineHeight: 1, pointerEvents: "none",
                }}>{step.num}</div>
                <div style={{
                  fontFamily: syne, fontWeight: 900, fontSize: 14, color: C.gold,
                  marginBottom: 16, letterSpacing: "0.05em",
                }}>STEP {step.num}</div>
                <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 19, marginBottom: 12, color: C.text, position: "relative" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7, position: "relative" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          8. COMPARISON TABLE
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", marginBottom: 16 }}>
              Replace your entire tool stack.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17 }}>
              Stop paying $250+/month for 5 separate subscriptions.
            </p>
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px", background: C.elevated, padding: "14px 24px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Majorka</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Separate Tools</span>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 140px 160px",
                padding: "14px 24px", borderBottom: `1px solid ${C.border}`,
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}>
                <span style={{ fontSize: 14, color: C.text }}>{row.feature}</span>
                <span style={{ textAlign: "center", fontSize: 16, color: C.green, fontWeight: 700 }}>{"\u2713"}</span>
                <span style={{
                  textAlign: "center", fontSize: 13,
                  color: row.tools.includes("Not") ? C.red : C.secondary,
                  fontWeight: row.tools.includes("Not") ? 600 : 400,
                }}>{row.tools.includes("Not") ? "\u2717" : row.tools}</span>
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px", padding: "18px 24px", background: C.elevated, borderTop: `1px solid ${C.goldBorder}` }}>
              <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.text }}>Monthly Cost</span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.gold }}>$0{"\u2013"}49</span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.red }}>$250+</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          9. TESTIMONIALS (react-fast-marquee dual-row)
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px 100px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 56 }}>
            Loved by sellers worldwide.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Row 1 — scrolls left */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <Marquee direction="left" speed={40} gradient={false}>
              {TESTIMONIALS.slice(0, 4).concat(TESTIMONIALS.slice(0, 4)).map((t, i) => (
                <TestimonialCard key={i} t={t} />
              ))}
            </Marquee>
          </div>

          {/* Row 2 — scrolls right */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <Marquee direction="right" speed={40} gradient={false}>
              {TESTIMONIALS.slice(4, 8).concat(TESTIMONIALS.slice(4, 8)).map((t, i) => (
                <TestimonialCard key={i} t={t} />
              ))}
            </Marquee>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          10. PRICING (timezone-aware)
      ═══════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1050, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", marginBottom: 16 }}>
              Simple pricing. Your currency.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17 }}>
              Start free, upgrade when you&apos;re ready. Local payment methods on all paid plans.
            </p>
            {isAU && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 100, padding: "5px 14px",
              }}>
                <span style={{ fontSize: 12 }}>🇦🇺</span>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Prices shown in AUD · Afterpay & Zip available</span>
              </div>
            )}
            {isUK && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 100, padding: "5px 14px",
              }}>
                <span style={{ fontSize: 12 }}>🇬🇧</span>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Prices shown in GBP · Klarna available</span>
              </div>
            )}
            {isEU && !isUK && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 100, padding: "5px 14px",
              }}>
                <span style={{ fontSize: 12 }}>🇪🇺</span>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Prices shown in EUR · Klarna available</span>
              </div>
            )}
          </div>

          <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {PRICING.map((plan, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredPricing(i)}
                onMouseLeave={() => setHoveredPricing(null)}
                style={{
                  background: plan.highlight ? C.elevated : C.card,
                  border: `2px solid ${plan.highlight ? C.gold : hoveredPricing === i ? C.borderHover : C.border}`,
                  borderRadius: 20, padding: 32,
                  position: "relative",
                  boxShadow: plan.highlight ? `0 0 48px rgba(212,175,55,0.15)` : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, color: "#000",
                    borderRadius: 100, padding: "4px 16px", fontSize: 11, fontWeight: 800,
                    fontFamily: syne, whiteSpace: "nowrap",
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 4, color: plan.highlight ? C.gold : C.text }}>{plan.name}</div>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{plan.description}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 44, color: C.text }}>{plan.price}</span>
                  <span style={{ color: C.muted, fontSize: 14 }}>{plan.period}</span>
                </div>
                <Link href={plan.href} style={{
                  display: "block", textAlign: "center",
                  background: plan.highlight ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : "rgba(255,255,255,0.04)",
                  color: plan.highlight ? "#000" : C.text,
                  border: plan.highlight ? "none" : `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 20px",
                  fontFamily: syne, fontWeight: 700, fontSize: 14, textDecoration: "none",
                  transition: "opacity 0.2s", marginBottom: 24,
                }}>{plan.cta}</Link>

                {/* Payment badges */}
                {plan.afterpay && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 0", marginBottom: 16,
                    fontSize: 11, color: C.secondary, fontWeight: 500,
                  }}>
                    {isAU && (
                      <>
                        <span style={{ background: "#b2fce4", color: "#000", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Afterpay</span>
                        <span>&</span>
                        <span style={{ background: "#7b61ff", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Zip</span>
                      </>
                    )}
                    {(isUK || (isEU && !isUK)) && (
                      <span style={{ background: "#ffb3c7", color: "#000", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Klarna</span>
                    )}
                    {!isAU && !isUK && !isEU && (
                      <>
                        <span style={{ background: "#b2fce4", color: "#000", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Afterpay</span>
                        <span>&</span>
                        <span style={{ background: "#ffb3c7", color: "#000", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Klarna</span>
                      </>
                    )}
                    <span>available</span>
                  </div>
                )}

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }} />
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.secondary }}>
                      <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>{"\u2713"}</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          11. FAQ
      ═══════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: "100px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1px", textAlign: "center", marginBottom: 56 }}>
            Frequently asked questions.
          </h2>
          <div>
            {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          11.5. EMAIL CAPTURE — LEAD MAGNET
      ═══════════════════════════════════════════════════ */}
      <section id="guide" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{
              fontFamily: syne, fontWeight: 900,
              fontSize: "clamp(28px, 5vw, 44px)",
              letterSpacing: "-1px", marginBottom: 16,
            }}>
              Free resources. No catch.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17, maxWidth: 550, margin: "0 auto" }}>
              Get our product research playbook and weekly trending products — straight to your inbox.
            </p>
          </div>
          <EmailCapture />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          12. FINAL CTA
      ═══════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", padding: "120px 24px", textAlign: "center",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 800, height: 400,
          marginTop: -200, marginLeft: -400,
          background: `radial-gradient(ellipse, rgba(212,175,55,0.1) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(28px, 5vw, 48px)", letterSpacing: "-1px", marginBottom: 20 }}>
            Stop guessing.<br />Start selling.
          </h2>
          <p style={{ color: C.secondary, fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
            50+ AI tools. Worldwide. No credit card required.<br />Start in 30 seconds.
          </p>
          <Link href="/app" style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
            color: "#000", borderRadius: 14,
            padding: "18px 48px", fontFamily: syne, fontWeight: 800, fontSize: 19,
            textDecoration: "none",
            boxShadow: `0 0 60px rgba(212,175,55,0.35), 0 4px 20px rgba(0,0,0,0.3)`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}>
            Start Free Today
          </Link>
          <p style={{ marginTop: 20, fontSize: 13, color: C.muted }}>
            Join 3,200+ sellers worldwide already using Majorka
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          13. FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, justifyContent: "space-between", marginBottom: 40 }}>
            {/* Brand */}
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 7,
                  background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#000",
                }}>M</div>
                <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, letterSpacing: "0.08em" }}>MAJORKA</span>
              </div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                The AI Ecommerce Operating System built for sellers worldwide. From idea to launch in minutes.
              </p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>
                Made on the Gold Coast 🇦🇺 · Used worldwide 🌍
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: C.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Product</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="#features" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Features</a>
                  <a href="#pricing" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Pricing</a>
                  <a href="#demo" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Demo</a>
                  <a href="#faq" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>FAQ</a>
                  <Link href="/tools/profit-calculator" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Profit Calculator</Link>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: C.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Account</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/sign-in" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Sign In</Link>
                  <Link href="/app" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Dashboard</Link>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: C.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Legal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="#" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Privacy Policy</a>
                  <a href="#" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Terms of Service</a>
                  <a href="#" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Refund Policy</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: C.muted, fontSize: 12 }}>
              &copy; 2026 Majorka. ABN: [pending] &middot; Built on the Gold Coast, Australia.
            </p>
            <p style={{ color: C.muted, fontSize: 12 }}>
              Powered by Anthropic Claude AI &middot; Consumer rights apply in your jurisdiction
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
