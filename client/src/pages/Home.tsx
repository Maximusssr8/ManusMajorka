import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import Marquee from "react-fast-marquee";
import { SEO } from "@/components/SEO";
import DemoWidget from "@/components/DemoWidget";
import {
  Users, DollarSign, BarChart2, Clock,
  Search, TrendingUp, Package, Zap, Globe,
} from "lucide-react";

// ── Animation variants ────────────────────────────────────────────────────────
// Pure state variants — transition is declared per-component via `transition` prop
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1 },
};

// ── Global styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
/* ── Keyframes ── */
@keyframes aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50%       { transform: translateY(-10px) rotate(-1deg); }
}
@keyframes float-mobile {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
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
  50%       { background-position: 100% 50%; }
}
@keyframes ray-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer-btn {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes gold-pulse {
  0%, 100% { opacity: 0.05; }
  50%       { opacity: 0.08; }
}
@keyframes line-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes horizon-glow {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.55; }
}

/* ── Utility classes ── */
.btn-shimmer {
  background: linear-gradient(
    90deg,
    #b8941f 0%, #d4af37 25%, #f5d98a 50%, #d4af37 75%, #b8941f 100%
  );
  background-size: 200% 100%;
  animation: shimmer-btn 3s linear infinite;
  color: #000;
}
.gold-text {
  background: linear-gradient(135deg, #d4af37, #f5d98a, #d4af37);
  background-size: 200% 200%;
  animation: gradient-x 5s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.particle-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}
.horizon-line {
  position: absolute;
  left: 0; right: 0;
  top: 60%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(212,175,55,0.18) 30%,
    rgba(212,175,55,0.35) 50%,
    rgba(212,175,55,0.18) 70%,
    transparent
  );
  animation: horizon-glow 6s ease-in-out infinite;
  pointer-events: none;
}
.feature-card:hover .gold-dot { opacity: 1; }
.gold-dot {
  position: absolute;
  top: 12px; left: 12px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #d4af37;
  opacity: 0;
  transition: opacity 0.25s;
}
.step-line {
  flex: 0 0 48px;
  height: 2px;
  margin-top: 44px;
  border-top: 1px dashed rgba(212,175,55,0.4);
  transform-origin: left center;
}
.social-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #94949e;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.social-icon-btn:hover {
  border-color: rgba(212,175,55,0.35);
  color: #d4af37;
  background: rgba(212,175,55,0.06);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hide-mobile   { display: none !important; }
  .stack-mobile  { flex-direction: column !important; }
  .grid-1-mobile { grid-template-columns: 1fr !important; }
  .grid-2-mobile { grid-template-columns: 1fr 1fr !important; }
  .px-4-mobile   { padding-left: 16px !important; padding-right: 16px !important; }
  .text-center-mobile { text-align: center !important; }
  .step-line     { display: none !important; }
  .hero-widget   { transform: none !important; animation: float-mobile 6s ease-in-out infinite !important; }
}
@media (min-width: 769px) {
  .hide-desktop { display: none !important; }
}
`;

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#080a0e",
  card:        "#0d1117",
  elevated:    "#131620",
  border:      "rgba(255,255,255,0.06)",
  borderHover: "rgba(212,175,55,0.25)",
  text:        "#f5f5f5",
  secondary:   "#94949e",
  muted:       "#52525b",
  gold:        "#d4af37",
  goldLight:   "#f5d98a",
  goldDim:     "rgba(212,175,55,0.08)",
  goldBorder:  "rgba(212,175,55,0.25)",
  green:       "#22c55e",
  red:         "#ef4444",
};

const syne = "Syne, sans-serif";
const dm   = "'DM Sans', sans-serif";

// ── Avatar data (hero social proof) ──────────────────────────────────────────
const AVATARS = [
  { initials: "JM", bg: "#d4af37", color: "#000" },
  { initials: "ST", bg: "#b8941f", color: "#000" },
  { initials: "ML", bg: "#374151", color: "#e5e7eb" },
  { initials: "PK", bg: "#d4af37", color: "#000" },
  { initials: "TB", bg: "#4b5563", color: "#f9fafb" },
];

// ── Stats bar ─────────────────────────────────────────────────────────────────
const STATS = [
  { end: 2847,  suffix: "+",  prefix: "",  label: "Sellers Worldwide",    icon: Users },
  { end: 18,    suffix: "M+", prefix: "$", label: "Revenue Generated",    icon: DollarSign },
  { end: 12400, suffix: "+",  prefix: "",  label: "Products Researched",  icon: Package },
  { end: 6,     suffix: "hrs",prefix: "",  label: "Saved Per Day",        icon: Clock },
];

// ── Phase-grouped features ────────────────────────────────────────────────────
const PHASE_FEATURES = [
  {
    phase: "Phase 1", icon: "⚡", label: "Discover", color: "#3b82f6",
    tools: [
      { emoji: "🔍", title: "Product Discovery",   desc: "AI scans global marketplaces to surface winning products with real AU demand, low competition, and healthy margins." },
      { emoji: "🔑", title: "Keyword Miner",        desc: "Extract high-converting search terms from Amazon AU, Google, and TikTok. Rank your listings from day one." },
      { emoji: "📊", title: "Saturation Checker",   desc: "Know before you sell if a niche is already dead. Scores competition on a 0–100 index across 5 platforms." },
      { emoji: "🏭", title: "Supplier Finder",       desc: "Verified supplier matches from Alibaba, AliExpress, CJ, and AU-based warehouses — with landed cost to your door." },
      { emoji: "🎯", title: "Audience Profiler",    desc: "Laser-precise buyer personas for AU, UK, and US markets. Feed directly into Meta and TikTok targeting." },
    ],
  },
  {
    phase: "Phase 2", icon: "🏗️", label: "Build", color: "#10b981",
    tools: [
      { emoji: "🌐", title: "Website Generator",  desc: "Full Shopify-ready store pages — hero, product, collection. Exports Liquid theme files, production-ready in minutes." },
      { emoji: "✍️", title: "Copywriter",          desc: "Conversion-optimised product descriptions, taglines, and homepage copy in your brand voice. AU English by default." },
      { emoji: "📧", title: "Email Sequences",     desc: "5-email welcome flows, abandon cart, and post-purchase sequences tuned for AU consumer psychology." },
      { emoji: "🎨", title: "Brand DNA",           desc: "Full brand identity: name, colour palette, voice guide, and taglines — calibrated for your niche in 60 seconds." },
      { emoji: "🎬", title: "Ads Studio",          desc: "Multi-platform ad creative briefs with hooks, scripts, and visual direction for Meta and TikTok AU." },
      { emoji: "📱", title: "Meta Ads Pack",       desc: "5 complete ad angles with AU audience targeting and compliant copy — ready to upload to Ads Manager." },
      { emoji: "🎵", title: "TikTok Builder",      desc: "Viral TikTok scripts, trending audio suggestions, and content calendars aligned with AU peak seasons." },
    ],
  },
  {
    phase: "Phase 3", icon: "📈", label: "Grow", color: "#f59e0b",
    tools: [
      { emoji: "✅", title: "Validate",            desc: "AI-scores your product on 12 dimensions: demand, margin, competition, trend, and compliance. Know before you spend." },
      { emoji: "🚀", title: "Scaling Playbook",    desc: "Structured 30-60-90 day scaling plan with ad budget allocations, SKU expansion triggers, and milestone targets." },
      { emoji: "💬", title: "AI Chat",             desc: "Always-on AI advisor that knows your products, niche, and market. Ask anything — get answers that apply to you." },
      { emoji: "📚", title: "Knowledge Base",      desc: "Searchable library of AU ecommerce guides, compliance checklists, and supplier playbooks. Built by operators." },
    ],
  },
];

// ── How It Works steps ────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    icon: "🔍",
    num:  "1",
    title: "Find your winning product",
    body:  "Our AI scans thousands of products for AU demand signals, low competition, and healthy margins. No guessing. No spreadsheets.",
  },
  {
    icon: "🏗️",
    num:  "2",
    title: "Build your store in minutes",
    body:  "From brand identity to full Shopify theme — generated by AI, ready to launch. Copy, ads, and emails all included.",
  },
  {
    icon: "📈",
    num:  "3",
    title: "Launch and scale with AI",
    body:  "Meta ads that convert, TikTok content that goes viral, email sequences that print money. All in one place.",
  },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: "Found my first $10K/mo product in week 1. Game changer.",                          name: "Jake M.",   city: "Gold Coast, AU", flag: "🇦🇺", plan: "Builder Plan", stars: 5 },
  { quote: "Finally an AI tool that understands international shipping and Klarna.",             name: "Sarah T.",  city: "London, UK",     flag: "🇬🇧", plan: "Scale Plan",   stars: 5 },
  { quote: "Replaced 6 different tools. Majorka does it all at a fraction of the cost.",        name: "Marcus L.", city: "New York, US",   flag: "🇺🇸", plan: "Builder Plan", stars: 5 },
  { quote: "The competitor teardown alone paid for itself in the first week.",                   name: "Priya K.",  city: "Singapore",      flag: "🌏", plan: "Builder Plan", stars: 5 },
  { quote: "Launched my Shopify store in under 48 hours using the Website Generator.",          name: "Tom B.",    city: "Sydney, AU",     flag: "🇦🇺", plan: "Builder Plan", stars: 5 },
  { quote: "The Brand DNA tool gave me a complete identity I'd have paid €2K for elsewhere.",   name: "Emma R.",   city: "Berlin, EU",     flag: "🇪🇺", plan: "Scale Plan",   stars: 5 },
  { quote: "Majorka's product research is the best I've used. Accurate, fast, actionable.",    name: "Chris D.",  city: "Melbourne, AU",  flag: "🇦🇺", plan: "Builder Plan", stars: 5 },
  { quote: "Meta Ads Pack cut my launch prep from 2 weeks to 2 hours. Incredible ROI.",         name: "Lisa H.",   city: "Austin, US",     flag: "🇺🇸", plan: "Scale Plan",   stars: 5 },
];

// ── Comparison ────────────────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { feature: "Product Research",   tools: "$49/mo" },
  { feature: "AI Ad Copy",         tools: "$59/mo" },
  { feature: "Website Builder",    tools: "$39/mo" },
  { feature: "Financial Modeler",  tools: "Not available" },
  { feature: "Email Sequences",    tools: "$29/mo" },
  { feature: "Global Market Data", tools: "Not available" },
  { feature: "TikTok Content",     tools: "$29/mo" },
  { feature: "Supplier Finder",    tools: "Not available" },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ = [
  { q: "Is Majorka built for sellers worldwide?", a: "Yes. Majorka detects your timezone and currency automatically, serving sellers in Australia (AUD), UK (GBP), Europe (EUR), and the US (USD). Every tool adapts to your local market — shipping carriers, compliance, language, and pricing." },
  { q: "What makes this different from other AI tools?", a: "Most tools are US-centric. Majorka supports multi-currency pricing, global shipping carriers, regional compliance, and local payment methods (Afterpay, Klarna, Zip, Stripe). No more converting USD or adapting American advice." },
  { q: "Can I cancel anytime?", a: "Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. You retain access until the end of your billing period." },
  { q: "Do you support Shopify?", a: "Yes. Website Generator exports production-ready Shopify Liquid theme files as a ZIP. All landing pages include trust signals, local payment badges, and mobile-optimised layouts ready for your store." },
  { q: "Is there a free trial?", a: "Yes. The Starter plan is free forever with 5 AI credits per day and access to core tools. Paid plans include a 7-day free trial with no credit card required." },
];

// ── Logo strip ────────────────────────────────────────────────────────────────
const LOGO_STRIP = [
  "Shopify", "AliExpress", "Meta", "Google", "TikTok",
  "Australia Post", "Stripe", "Klarna", "Afterpay", "Amazon", "Canva",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "20px 0",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
          minHeight: 48,
        }}
      >
        <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: C.text, paddingRight: 16 }}>{q}</span>
        <span style={{
          color: C.gold, fontSize: 22, fontWeight: 300, flexShrink: 0,
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.25s",
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, opacity: open ? 1 : 0,
        transition: "max-height 0.35s ease, opacity 0.25s ease",
        overflow: "hidden",
      }}>
        <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.7, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

function EmailCapture() {
  const [email, setEmail]   = useState("");
  const [name, setName]     = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res  = await fetch("/api/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, source: "landing-guide" }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setStatus("success"); }
      else { setStatus("error"); setErrMsg(data.error || "Something went wrong. Try again."); }
    } catch {
      setStatus("error"); setErrMsg("Network error. Check your connection.");
    }
  };

  if (status === "success") {
    return (
      <div style={{
        background: C.elevated, border: `1px solid ${C.goldBorder}`,
        borderRadius: 20, padding: "48px 32px", textAlign: "center",
        maxWidth: 560, margin: "0 auto",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 12 }}>
          You're in! Check your inbox.
        </h3>
        <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>
          While you wait,{" "}
          <Link href="/app" style={{ color: C.gold, textDecoration: "underline" }}>try the tools free →</Link>
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
          <span style={{ fontSize: 14 }}>🌍</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gold }}>FREE PRODUCT GUIDE</span>
        </div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 8 }}>
          Get the Product Research Playbook
        </h3>
        <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.6 }}>
          How top sellers find $10K/mo products + weekly trending product alerts. Free, no spam.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text" placeholder="First name (optional)"
          value={name} onChange={(e) => setName(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 16px", color: C.text,
            fontSize: 14, fontFamily: dm, outline: "none", minHeight: 48,
          }}
        />
        <input
          type="email" placeholder="Your email address" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 16px", color: C.text,
            fontSize: 14, fontFamily: dm, outline: "none", minHeight: 48,
          }}
        />
        <button
          type="submit" disabled={status === "loading"}
          style={{
            background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
            color: "#000", borderRadius: 10, padding: "14px 20px",
            fontFamily: syne, fontWeight: 800, fontSize: 15,
            border: "none", cursor: status === "loading" ? "wait" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
            transition: "opacity 0.2s", minHeight: 48,
          }}
        >{status === "loading" ? "Sending..." : "Send Me the Guide"}</button>
        {status === "error" && (
          <p style={{ color: C.red, fontSize: 13, textAlign: "center" }}>{errMsg}</p>
        )}
        <p style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>
          Unsubscribe anytime. We respect your privacy.
        </p>
      </form>
    </div>
  );
}

function SocialProofCounter() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/stats/users")
      .then(r => r.json())
      .then(d => setCount(d.count))
      .catch(() => setCount(2847));
  }, []);
  if (count === null) return null;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
      borderRadius: 100, padding: "6px 18px",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "pulse-ring 2s ease-in-out infinite" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>
        Join {count.toLocaleString()}+ sellers worldwide using Majorka
      </span>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section
      ref={ref as React.RefCallback<HTMLElement>}
      style={{
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "64px 24px",
        overflowX: "hidden",
      }}
    >
      <div
        className="grid-2-mobile"
        style={{
          maxWidth: 960, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          textAlign: "center",
        }}
      >
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              style={{ padding: "16px 8px", position: "relative" }}
            >
              {/* Vertical divider (not on last) */}
              {i < STATS.length - 1 && (
                <div style={{
                  position: "absolute", right: 0, top: "20%", bottom: "20%",
                  width: 1, background: "rgba(255,255,255,0.06)",
                }} className="hide-mobile" />
              )}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40, borderRadius: 10,
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                margin: "0 auto 12px",
              }}>
                <Icon size={18} color={C.gold} />
              </div>
              <div style={{
                fontFamily: syne, fontWeight: 900,
                fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                color: C.gold, lineHeight: 1.1, marginBottom: 6,
              }}>
                {inView ? (
                  <>
                    {stat.prefix && <span>{stat.prefix}</span>}
                    <CountUp start={0} end={stat.end} duration={2.2} separator="," delay={i * 0.15} />
                    {stat.suffix && <span>{stat.suffix}</span>}
                  </>
                ) : (
                  <span>{stat.prefix}{stat.end.toLocaleString()}{stat.suffix}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: C.secondary, fontWeight: 500, letterSpacing: "0.02em" }}>
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({
  tool, index, phaseColor,
}: {
  tool: { emoji: string; title: string; desc: string };
  index: number;
  phaseColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="feature-card"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 16, padding: "24px 24px 24px 24px",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.1)"
          : "none",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        cursor: "default",
        overflow: "hidden",
      }}
    >
      {/* Gold dot indicator on hover */}
      <div className="gold-dot" />

      {/* Inner left glow on hover */}
      {hovered && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 2, background: C.gold,
          boxShadow: `0 0 16px rgba(212,175,55,0.6)`,
          borderRadius: "16px 0 0 16px",
        }} />
      )}

      <div style={{ fontSize: 36, marginBottom: 14, lineHeight: 1 }}>{tool.emoji}</div>
      <h3 style={{
        fontFamily: syne, fontWeight: 800, fontSize: 17,
        color: C.text, marginBottom: 10,
      }}>{tool.title}</h3>
      <p style={{
        fontSize: 14, color: C.secondary, lineHeight: 1.7,
      }}>{tool.desc}</p>
    </motion.div>
  );
}

// ── How It Works Step ─────────────────────────────────────────────────────────
function HowStep({
  step, index,
}: {
  step: { icon: string; num: string; title: string; body: string };
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
      style={{
        flex: 1, minWidth: 0, position: "relative",
        background: C.elevated,
        border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "36px 28px",
        overflow: "hidden",
      }}
    >
      {/* Large faint background number */}
      <div style={{
        position: "absolute", top: -8, right: 12,
        fontFamily: syne, fontWeight: 900, fontSize: 120,
        lineHeight: 1,
        color: `rgba(212,175,55,0.04)`,
        pointerEvents: "none", userSelect: "none",
      }}>{step.num}</div>

      {/* Icon circle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 60, height: 60, borderRadius: 16,
        background: C.goldDim, border: `1px solid ${C.goldBorder}`,
        fontSize: 28, marginBottom: 20,
      }}>
        {step.icon}
      </div>

      <h3 style={{
        fontFamily: syne, fontWeight: 800, fontSize: 20,
        color: C.text, marginBottom: 12, lineHeight: 1.25,
      }}>{step.title}</h3>
      <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.7 }}>{step.body}</p>
    </motion.div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "20px 20px 20px 24px",
      marginRight: 16, minWidth: 280, maxWidth: 320, flexShrink: 0,
      overflow: "hidden",
    }}>
      {/* Gold left border bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, background: C.gold,
        boxShadow: "4px 0 20px rgba(212,175,55,0.2)",
        borderRadius: "12px 0 0 12px",
      }} />

      <div style={{ color: C.gold, fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>
        {"★".repeat(t.stars)}
      </div>
      <p style={{
        fontSize: 14, color: "#e2e8f0", lineHeight: 1.65,
        marginBottom: 16, fontStyle: "italic",
      }}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Avatar circle */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: C.goldDim, border: `1px solid ${C.goldBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: syne, fontWeight: 800, fontSize: 11, color: C.gold, flexShrink: 0,
        }}>
          {t.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: C.text }}>
            {t.name} {t.flag}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{t.city}</div>
        </div>
        <div style={{
          marginLeft: "auto", flexShrink: 0,
          background: C.goldDim, border: `1px solid ${C.goldBorder}`,
          borderRadius: 100, padding: "2px 8px",
          fontSize: 10, fontWeight: 700, color: C.gold, fontFamily: syne,
          whiteSpace: "nowrap",
        }}>
          {t.plan}
        </div>
      </div>
    </div>
  );
}

// ── Main Home ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [hoveredPricing, setHoveredPricing] = useState<number | null>(null);

  // Timezone-aware pricing
  const tz         = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isAU       = tz.startsWith("Australia");
  const isEU       = tz.startsWith("Europe");
  const isUK       = tz === "Europe/London";
  const priceBuilder  = isAU ? "A$79"  : isUK ? "£39"  : isEU ? "€45"  : "$49";
  const priceScale    = isAU ? "A$229" : isUK ? "£119" : isEU ? "€135" : "$149";
  const priceCurrency = isAU ? "AUD/mo" : isUK ? "GBP/mo" : isEU ? "EUR/mo" : "USD/mo";

  const PRICING = [
    {
      name: "Starter", price: "$0", period: "forever free",
      description: "Get started with essential AI tools. Free forever.",
      features: ["5 AI credits/day", "Core tools access", "Website Generator", "Basic Copywriter", "Multi-currency defaults"],
      highlight: false, cta: "Start Free", href: "/app", afterpay: false,
    },
    {
      name: "Builder", price: priceBuilder, period: priceCurrency,
      description: "Everything you need to run a winning ecommerce business.",
      features: ["Unlimited AI credits", "All 20+ tools", "Full Launch Kit", "Meta + TikTok Ads Pack", "Email Sequences", "Priority support"],
      highlight: true, badge: "Most Popular", cta: "Start Free Trial", href: "/pricing", afterpay: true,
    },
    {
      name: "Scale", price: priceScale, period: priceCurrency,
      description: "For serious operators who need full control and priority AI.",
      features: ["Everything in Builder", "Priority AI (faster)", "API access", "White-label export", "Dedicated account manager"],
      highlight: false, cta: "Start Free Trial", href: "/pricing", afterpay: true,
    },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: dm, overflowX: "hidden", minHeight: "100vh" }}>
      <SEO
        title="Majorka — AI Ecommerce OS for Serious Sellers | Start Free"
        description="20+ AI tools for product research, store building, ads, and scaling. One platform. Your unfair advantage. Start free today."
        path="/"
      />
      <style>{GLOBAL_STYLES}</style>

      {/* ══════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,10,14,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 24px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: syne, fontWeight: 900, fontSize: 17, color: "#000",
            }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 17, letterSpacing: "0.08em" }}>MAJORKA</span>
          </div>

          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["#features","Features"],["#demo","Demo"],["#pricing","Pricing"],["#faq","FAQ"]].map(([href, label]) => (
              <a key={href} href={href} style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.secondary)}>
                {label}
              </a>
            ))}
            <Link href="/sign-in" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign In</Link>
          </div>

          <Link href="/app" style={{
            background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
            color: "#000", borderRadius: 8, padding: "8px 20px",
            fontFamily: syne, fontWeight: 700, fontSize: 14,
            textDecoration: "none", display: "inline-block",
            boxShadow: `0 0 20px rgba(212,175,55,0.2)`,
            minHeight: 36,
          }}>Start Free</Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center",
        padding: "100px 24px 80px",
        overflow: "hidden",
      }}>
        {/* Particle dot grid */}
        <div className="particle-grid" style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        }} />

        {/* Gold radial glow behind headline */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "70%",
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)",
          zIndex: 0, pointerEvents: "none",
        }} />

        {/* Rotating conic rays */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 900, height: 900, marginTop: -450, marginLeft: -450,
          background: "conic-gradient(from 0deg, transparent, rgba(212,175,55,0.025), transparent, rgba(212,175,55,0.015), transparent, rgba(212,175,55,0.02), transparent)",
          animation: "ray-rotate 40s linear infinite",
          borderRadius: "50%", zIndex: 0, pointerEvents: "none",
        }} />

        {/* Gold horizon line */}
        <div className="horizon-line" />

        {/* Two-column layout */}
        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 1200, width: "100%", margin: "0 auto",
          display: "flex", alignItems: "center",
          gap: "clamp(32px, 6vw, 80px)",
          flexWrap: "wrap",
        }}>
          {/* Left: text */}
          <div style={{ flex: "1 1 380px", minWidth: 0 }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 100, padding: "6px 18px", marginBottom: 28,
              }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: C.green,
                animation: "pulse-ring 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.gold, letterSpacing: "0.03em" }}>
                Built for Serious Sellers
              </span>
            </motion.div>

            {/* Headline — word-by-word stagger */}
            <h1 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(2rem, 6.5vw, 5rem)",
              lineHeight: 1.08, letterSpacing: "-0.03em",
              marginBottom: 24, color: C.text,
            }}>
              {/* Line 1 */}
              <span style={{ display: "block" }}>
                {"The ".split("").length && (
                  <>
                    {["The"].map((w, i) => (
                      <motion.span key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.45, ease: "easeOut" }}
                        style={{ display: "inline-block", marginRight: "0.25em" }}
                      >{w}</motion.span>
                    ))}
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                      className="gold-text"
                      style={{ display: "inline-block" }}
                    >AI Ecommerce OS</motion.span>
                  </>
                )}
              </span>
              {/* Line 2 */}
              <span style={{ display: "block" }}>
                {["Built", "for", "Serious", "Sellers."].map((w, i) => (
                  <motion.span key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 + i * 0.08, duration: 0.45, ease: "easeOut" }}
                    style={{ display: "inline-block", marginRight: "0.25em" }}
                  >{w}</motion.span>
                ))}
              </span>
            </h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              style={{
                fontSize: "clamp(15px, 2vw, 18px)", color: C.secondary,
                lineHeight: 1.65, marginBottom: 36,
                maxWidth: 500,
              }}
            >
              20+ AI tools for product research, store building, ads, and scaling.
              One platform. Your unfair advantage.
            </motion.p>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, duration: 0.5 }}
              className="stack-mobile"
              style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}
            >
              <Link href="/sign-in" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                borderRadius: 12, padding: "14px 36px",
                fontFamily: syne, fontWeight: 800, fontSize: 16,
                textDecoration: "none", minHeight: 52, minWidth: 160,
                position: "relative", overflow: "hidden",
              }}
                className="btn-shimmer"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              >
                Start for Free →
              </Link>

              <a href="#demo" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: 8,
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 12, padding: "14px 28px",
                fontFamily: syne, fontWeight: 700, fontSize: 16,
                textDecoration: "none", minHeight: 52, minWidth: 140,
                transition: "border-color 0.2s, background 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.goldBorder;
                  el.style.background  = "rgba(212,175,55,0.05)";
                  el.style.transform   = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.border;
                  el.style.background  = "rgba(255,255,255,0.04)";
                  el.style.transform   = "";
                }}
              >
                ▶ Watch Demo
              </a>
            </motion.div>

            {/* Micro-trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ fontSize: 12, color: C.muted, marginBottom: 28 }}
            >
              No credit card · Free forever plan · Cancel anytime
            </motion.p>

            {/* Social proof avatars */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.92, duration: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
            >
              <div style={{ display: "flex" }}>
                {AVATARS.map((av, i) => (
                  <div key={i} style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: av.bg, border: "2px solid #080a0e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: syne, fontWeight: 800, fontSize: 11, color: av.color,
                    marginLeft: i === 0 ? 0 : -10,
                    zIndex: AVATARS.length - i,
                    position: "relative",
                    flexShrink: 0,
                  }}>{av.initials}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Join 2,847 sellers worldwide
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  🇦🇺 🇺🇸 🇬🇧 🇪🇺 🌏
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: DemoWidget (desktop floating, mobile below) */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
            className="hero-widget"
            style={{
              flex: "1 1 340px", minWidth: 0,
              transform: "rotate(-1deg)",
              transformOrigin: "top right",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.06)",
              animation: "float 7s ease-in-out infinite",
            }}
          >
            <DemoWidget />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════ */}
      <StatsBar />

      {/* ══════════════════════════════════════════════
          FEATURES — Phase grouped
      ══════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Section header */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ textAlign: "center", marginBottom: 80 }}
          >
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
              lineHeight: 1.15, letterSpacing: "-0.025em",
              marginBottom: 16, color: C.text,
            }}>
              Everything you need to{" "}
              <span className="gold-text">go from idea to income</span>
            </h2>
            <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: C.secondary, maxWidth: 560, margin: "0 auto" }}>
              20+ AI-powered tools covering every stage of your ecommerce journey.
            </p>
          </motion.div>

          {/* Phases */}
          {PHASE_FEATURES.map((phase, phaseIdx) => (
            <div key={phaseIdx} style={{ marginBottom: phaseIdx < PHASE_FEATURES.length - 1 ? 72 : 0 }}>
              {/* Phase header */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  marginBottom: 32,
                }}
              >
                {/* Phase pill */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: `${phase.color}12`,
                  border: `1px solid ${phase.color}30`,
                  borderRadius: 100, padding: "4px 14px",
                  fontSize: 11, fontWeight: 700, fontFamily: syne,
                  color: phase.color, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {phase.icon} {phase.phase}
                </div>
                <h3 style={{
                  fontFamily: syne, fontWeight: 800,
                  fontSize: "clamp(1.15rem, 2.5vw, 1.5rem)",
                  color: C.text, margin: 0,
                }}>{phase.label}</h3>
                <div style={{
                  flex: 1, height: 1,
                  background: `linear-gradient(to right, ${phase.color}25, transparent)`,
                }} className="hide-mobile" />
              </motion.div>

              {/* Tool cards grid */}
              <div
                className="grid-1-mobile"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                {phase.tools.map((tool, toolIdx) => (
                  <FeatureCard
                    key={toolIdx}
                    tool={tool}
                    index={toolIdx}
                    phaseColor={phase.color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section style={{
        padding: "100px 24px",
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ textAlign: "center", marginBottom: 72 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.goldDim, border: `1px solid ${C.goldBorder}`,
              borderRadius: 100, padding: "5px 16px", marginBottom: 20,
              fontSize: 11, fontWeight: 700, color: C.gold, fontFamily: syne,
              letterSpacing: "0.06em",
            }}>
              HOW IT WORKS
            </div>
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
              letterSpacing: "-0.025em", color: C.text, marginBottom: 0,
            }}>
              From idea to income in 3 steps.
            </h2>
          </motion.div>

          {/* Steps with connecting lines */}
          <div style={{
            display: "flex", alignItems: "flex-start",
            gap: 0, flexWrap: "wrap",
          }}>
            {HOW_STEPS.map((step, i) => (
              <>
                <HowStep key={step.num} step={step} index={i} />
                {i < HOW_STEPS.length - 1 && (
                  <motion.div
                    key={`line-${i}`}
                    className="step-line"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.3, duration: 0.7, ease: "easeInOut" }}
                  />
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DEMO WIDGET
      ══════════════════════════════════════════════ */}
      <section id="demo" style={{ padding: "100px 24px", position: "relative", overflow: "hidden" }}>
        {/* Background glow behind widget */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 700, height: 400,
          marginTop: -200, marginLeft: -350,
          background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ textAlign: "center", marginBottom: 52 }}
          >
            <div style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              color: C.gold, fontFamily: syne, letterSpacing: "0.1em",
              textTransform: "uppercase", marginBottom: 14,
            }}>
              See it in action
            </div>
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
              letterSpacing: "-0.025em", color: C.text, marginBottom: 0,
            }}>
              Watch AI build your ecommerce business
            </h2>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <DemoWidget />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          LOGO STRIP
      ══════════════════════════════════════════════ */}
      <section style={{
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "48px 0",
      }}>
        <p style={{
          textAlign: "center", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", color: C.muted, marginBottom: 28,
          textTransform: "uppercase",
        }}>
          Built for the platforms sellers use worldwide
        </p>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
          <Marquee speed={28} gradient={false}>
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

      {/* ══════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section style={{
        padding: "100px 0",
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        overflow: "hidden",
      }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          style={{ textAlign: "center", marginBottom: 56, padding: "0 24px" }}
        >
          <h2 style={{
            fontFamily: syne, fontWeight: 800,
            fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
            letterSpacing: "-0.025em", color: C.text,
          }}>
            Loved by sellers worldwide.
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Row 1 → left */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <Marquee direction="left" speed={30} gradient={false}>
              {[...TESTIMONIALS.slice(0,4), ...TESTIMONIALS.slice(0,4)].map((t, i) => (
                <TestimonialCard key={i} t={t} />
              ))}
            </Marquee>
          </div>
          {/* Row 2 → right */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
            <Marquee direction="right" speed={30} gradient={false}>
              {[...TESTIMONIALS.slice(4,8), ...TESTIMONIALS.slice(4,8)].map((t, i) => (
                <TestimonialCard key={i} t={t} />
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COMPARISON TABLE
      ══════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
              letterSpacing: "-0.025em", marginBottom: 16,
            }}>
              Replace your entire tool stack.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17 }}>
              Stop paying $250+/month for 5 separate subscriptions.
            </p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            style={{
              border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
              overflowX: "auto", WebkitOverflowScrolling: "touch",
            }}
          >
            <div style={{ minWidth: 480 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 140px 160px",
                background: C.elevated, padding: "14px 24px",
                borderBottom: `1px solid ${C.border}`,
              }}>
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
                  <span style={{ textAlign: "center", fontSize: 16, color: C.green, fontWeight: 700 }}>✓</span>
                  <span style={{
                    textAlign: "center", fontSize: 13,
                    color: row.tools.includes("Not") ? C.red : C.secondary,
                    fontWeight: row.tools.includes("Not") ? 600 : 400,
                  }}>
                    {row.tools.includes("Not") ? "✗" : row.tools}
                  </span>
                </div>
              ))}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 140px 160px",
                padding: "18px 24px", background: C.elevated,
                borderTop: `1px solid ${C.goldBorder}`,
              }}>
                <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.text }}>Monthly Cost</span>
                <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.gold }}>$0–49</span>
                <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 15, color: C.red }}>$250+</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="pricing" style={{
        padding: "100px 24px",
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
              letterSpacing: "-0.025em", marginBottom: 16,
            }}>
              Simple pricing. No surprises.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17, maxWidth: 520, margin: "0 auto 16px" }}>
              Join thousands of sellers paying a fraction of what they'd spend on 6 separate tools.
            </p>
            {isAU && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: "5px 14px" }}>
                <span>🇦🇺</span>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Prices in AUD · Afterpay & Zip available</span>
              </div>
            )}
            {isUK && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: "5px 14px" }}>
                <span>🇬🇧</span>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Prices in GBP · Klarna available</span>
              </div>
            )}
            {isEU && !isUK && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: "5px 14px" }}>
                <span>🇪🇺</span>
                <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Prices in EUR · Klarna available</span>
              </div>
            )}
          </motion.div>

          <div
            className="grid-1-mobile"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                onMouseEnter={() => setHoveredPricing(i)}
                onMouseLeave={() => setHoveredPricing(null)}
                style={{
                  background: plan.highlight ? C.elevated : C.card,
                  border: `2px solid ${plan.highlight ? C.gold : hoveredPricing === i ? C.borderHover : C.border}`,
                  borderRadius: 20, padding: 32, position: "relative",
                  boxShadow: plan.highlight ? `0 0 48px rgba(212,175,55,0.15)` : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, color: "#000",
                    borderRadius: 100, padding: "4px 16px", fontSize: 11, fontWeight: 800,
                    fontFamily: syne, whiteSpace: "nowrap",
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, marginBottom: 4, color: plan.highlight ? C.gold : C.text }}>
                  {plan.name}
                </div>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{plan.description}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 44, color: C.text }}>{plan.price}</span>
                  <span style={{ color: C.muted, fontSize: 14 }}>/{plan.period}</span>
                </div>
                <Link href={plan.href} style={{
                  display: "flex", textAlign: "center",
                  alignItems: "center", justifyContent: "center",
                  background: plan.highlight ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : "rgba(255,255,255,0.04)",
                  color: plan.highlight ? "#000" : C.text,
                  border: plan.highlight ? "none" : `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 20px",
                  fontFamily: syne, fontWeight: 700, fontSize: 14,
                  textDecoration: "none", transition: "opacity 0.2s",
                  marginBottom: 24, minHeight: 48,
                }}>{plan.cta}</Link>

                {plan.afterpay && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16, fontSize: 11, color: C.secondary }}>
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
                      <span style={{ color: C.green, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.6rem, 4.5vw, 3rem)",
              letterSpacing: "-0.025em", textAlign: "center", marginBottom: 56,
            }}
          >
            Frequently asked questions.
          </motion.h2>
          <div>
            {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          EMAIL CAPTURE
      ══════════════════════════════════════════════ */}
      <section id="guide" style={{
        padding: "100px 24px",
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              letterSpacing: "-0.025em", marginBottom: 16,
            }}>
              Free resources. No catch.
            </h2>
            <p style={{ color: C.secondary, fontSize: 17, maxWidth: 500, margin: "0 auto" }}>
              Get our product research playbook and weekly trending products — straight to your inbox.
            </p>
          </motion.div>
          <EmailCapture />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section style={{
        position: "relative", padding: "120px 24px",
        textAlign: "center", overflow: "hidden",
      }}>
        {/* Animated gold glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 900, height: 500,
          marginTop: -250, marginLeft: -450,
          background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)",
          animation: "gold-pulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Particle grid */}
        <div className="particle-grid" style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <h2 style={{
              fontFamily: syne, fontWeight: 800,
              fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em", marginBottom: 20, lineHeight: 1.1,
            }}>
              Your competitors are already using AI.{" "}
              <span className="gold-text">Are you?</span>
            </h2>
            <p style={{ color: C.secondary, fontSize: "clamp(15px, 2vw, 18px)", marginBottom: 44, lineHeight: 1.65 }}>
              Start free. No credit card. Upgrade when you're ready.
            </p>

            {/* CTA buttons — stack on mobile */}
            <div
              className="stack-mobile"
              style={{
                display: "flex", gap: 16, justifyContent: "center",
                flexWrap: "wrap", marginBottom: 28,
              }}
            >
              <Link href="/sign-in" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                borderRadius: 14, padding: "18px 52px",
                fontFamily: syne, fontWeight: 800, fontSize: "clamp(15px, 2vw, 18px)",
                textDecoration: "none",
                boxShadow: `0 0 60px rgba(212,175,55,0.35), 0 4px 24px rgba(0,0,0,0.3)`,
                minHeight: 56, minWidth: 200,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                className="btn-shimmer"
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = "0 0 80px rgba(212,175,55,0.5), 0 8px 32px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "";
                  el.style.boxShadow = "0 0 60px rgba(212,175,55,0.35), 0 4px 24px rgba(0,0,0,0.3)";
                }}
              >
                Get Started Free →
              </Link>

              <a href="#demo" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.border}`,
                color: C.secondary, borderRadius: 14, padding: "18px 36px",
                fontFamily: syne, fontWeight: 600, fontSize: 15,
                textDecoration: "none", minHeight: 56,
                transition: "border-color 0.2s, color 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.goldBorder;
                  el.style.color = C.gold;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.border;
                  el.style.color = C.secondary;
                }}
              >
                or book a demo
              </a>
            </div>

            <SocialProofCounter />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer style={{ background: C.card, position: "relative" }}>
        {/* Gradient border top */}
        <div style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(212,175,55,0.35) 30%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0.35) 70%, transparent)",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 40px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, justifyContent: "space-between", marginBottom: 48 }}>

            {/* Brand */}
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 7,
                  background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#000",
                }}>M</div>
                <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, letterSpacing: "0.08em" }}>MAJORKA</span>
              </div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
                The AI Ecommerce Operating System built for serious sellers worldwide. From idea to income.
              </p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 100, padding: "4px 12px", marginBottom: 20,
              }}>
                <span style={{ fontSize: 13 }}>🇦🇺</span>
                <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>Built in Australia</span>
              </div>
              {/* Social links */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href="https://twitter.com/majorkaai" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="X / Twitter">𝕏</a>
                <a href="https://instagram.com/majorkaai" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Instagram">📸</a>
                <a href="https://tiktok.com/@majorkaai"  target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="TikTok">♪</a>
                <a href="https://discord.gg/majorka"     target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Discord">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 11, color: C.secondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Product</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href="#features" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Features</a>
                  <a href="#pricing"  style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Pricing</a>
                  <a href="#demo"     style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Demo</a>
                  <a href="#faq"      style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>FAQ</a>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 11, color: C.secondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link href="/sign-in" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Sign In</Link>
                  <Link href="/app"     style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Dashboard</Link>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 11, color: C.secondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Legal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href="#" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Privacy Policy</a>
                  <a href="#" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Terms of Service</a>
                  <a href="#" style={{ color: C.muted, textDecoration: "none", fontSize: 13 }}>Refund Policy</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: `1px solid ${C.border}`, paddingTop: 24,
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 12,
          }}>
            <p style={{ color: C.muted, fontSize: 12 }}>
              © 2026 Majorka · ABN: [pending] · Built on the Gold Coast, Australia 🇦🇺
            </p>
            <p style={{ color: C.muted, fontSize: 12 }}>
              Powered by Anthropic Claude AI · Consumer rights apply in your jurisdiction
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
