import { Link } from "wouter";
import { useState } from "react";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

// ── Design tokens ───────────────────────────────────────────────────────────
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
  goldDim: "rgba(212,175,55,0.1)",
  goldBorder: "rgba(212,175,55,0.25)",
};

const syne = "Syne, sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Locked tool overlay ─────────────────────────────────────────────────────
function LockedToolOverlay({ toolName }: { toolName: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.65)",
      borderRadius: 12, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 10, gap: 6,
    }}>
      <span style={{ fontSize: 24 }}>🔒</span>
      <p style={{ fontFamily: syne, fontWeight: 700, color: "#f5f5f5", fontSize: 14 }}>{toolName}</p>
      <p style={{ color: "#94949e", fontSize: 12, marginBottom: 8 }}>Builder plan required</p>
      <Link href="/pricing" style={{
        padding: "6px 14px", background: "#d4af37", color: "#000",
        borderRadius: 8, fontSize: 12, fontWeight: 700,
        fontFamily: syne, textDecoration: "none",
      }}>
        Upgrade to Builder →
      </Link>
    </div>
  );
}

// ── Emotional comparison table ──────────────────────────────────────────────
const COMPETITOR_TOOLS = [
  { name: "NicheScraper (Product Research)", cost: 79 },
  { name: "Minea (Ad Spy)",                  cost: 69 },
  { name: "Durable (Website Builder)",       cost: 59 },
  { name: "Copy.ai (Copywriter)",            cost: 49 },
  { name: "Klaviyo Lite (Email)",            cost: 20 },
  { name: "SaleHoo (Suppliers)",             cost: 27 },
];
const TOTAL_COMPETITOR = COMPETITOR_TOOLS.reduce((s, t) => s + t.cost, 0);
const MAJORKA_PRICE = 79;
const SAVINGS_MO = TOTAL_COMPETITOR - MAJORKA_PRICE;
const SAVINGS_YR = SAVINGS_MO * 12;

function EmotionalComparisonTable() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} style={{ padding: "0 24px 100px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: 18, color: "#94949e", marginBottom: 8 }}>
            While your competitors pay <span style={{ color: "#ef4444" }}>${TOTAL_COMPETITOR}/mo</span> for {COMPETITOR_TOOLS.length} tools...
          </p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8 }}>
            <span style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(48px, 8vw, 80px)", color: "#d4af37", lineHeight: 1 }}>
              {inView ? <CountUp start={TOTAL_COMPETITOR} end={MAJORKA_PRICE} duration={1.4} prefix="$" /> : `$${MAJORKA_PRICE}`}
            </span>
            <span style={{ fontFamily: syne, fontWeight: 600, fontSize: 18, color: "#52525b" }}>AUD/mo</span>
          </div>
          <p style={{ color: "#94949e", fontSize: 15, marginTop: 8 }}>You pay for everything. On one platform.</p>
        </div>

        {/* Table */}
        <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px", background: "#131318", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: syne, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tool</span>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: syne, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Competitor Cost</span>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: syne, color: "#d4af37", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Majorka</span>
          </div>

          {COMPETITOR_TOOLS.map((tool, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 140px 130px",
              padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            }}>
              <span style={{ fontSize: 13, color: "#a1a1aa" }}>{tool.name}</span>
              <span style={{ textAlign: "center", fontSize: 13, color: "#94949e" }}>${tool.cost}/mo</span>
              <span style={{ textAlign: "center", fontSize: 14, color: "#22c55e", fontWeight: 700 }}>✓ Included</span>
            </div>
          ))}

          {/* Totals row */}
          <div style={{ background: "#131318", borderTop: "1px solid rgba(212,175,55,0.2)", padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px", marginBottom: 10 }}>
              <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: "#a1a1aa" }}>Total if bought separately</span>
              <span style={{ textAlign: "center" }}>
                <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#ef4444", textDecoration: "line-through" }}>
                  {inView ? <CountUp start={0} end={TOTAL_COMPETITOR} duration={1.8} prefix="$" suffix="/mo" /> : `$${TOTAL_COMPETITOR}/mo`}
                </span>
              </span>
              <span style={{ textAlign: "center", fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#d4af37" }}>
                ${MAJORKA_PRICE}/mo
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
                color: "#22c55e", borderRadius: 100, padding: "4px 14px",
                fontFamily: syne, fontWeight: 800, fontSize: 13,
              }}>
                You save: ${SAVINGS_MO}/mo · ${SAVINGS_YR.toLocaleString()}/yr
              </span>
            </div>
          </div>
        </div>

        {/* Social proof + urgency */}
        <div style={{ textAlign: "center", marginTop: 24, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: 13, color: "#94949e", fontWeight: 500 }}>2,847 sellers already made the switch</span>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 100, padding: "5px 14px",
          }}>
            <span style={{ fontSize: 12 }}>⚡</span>
            <span style={{ fontSize: 12, color: "#d4af37", fontWeight: 600 }}>Builder plan — 23 spots remaining this month</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Plan data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "AUD/mo",
    description: "Taste what's possible. Upgrade to build.",
    features: [
      "3 AI demos per day",
      "Preview tools only",
      "AU market defaults",
      "Community support",
    ],
    notIncluded: [
      "All 50+ tools",
      "Full Launch Kit",
      "Financial Modeler",
      "Meta + TikTok Ads Pack",
      "API access",
    ],
    cta: "Try a Demo Free",
    ctaHref: "/app",
    highlight: false,
    badge: null,
    afterpay: false,
  },
  {
    name: "Builder",
    price: "$49",
    period: "AUD/mo",
    description: "Everything you need to run a winning AU ecommerce business.",
    features: [
      "Unlimited AI credits",
      "All 50+ tools",
      "Full Launch Kit",
      "Meta + TikTok Ads Pack",
      "Email Sequences",
      "Financial Modeler",
      "Priority support",
    ],
    notIncluded: [
      "White-label export",
      "API access",
      "Custom domain support",
    ],
    cta: "Start Free Trial",
    ctaHref: null, // handled via Stripe
    highlight: true,
    badge: "Most Popular",
    afterpay: true,
  },
  {
    name: "Scale",
    price: "$149",
    period: "AUD/mo",
    description: "For serious operators who need full control and priority AI.",
    features: [
      "Everything in Builder",
      "Priority AI (faster responses)",
      "API access",
      "White-label export",
      "Custom domain support",
      "Dedicated account manager",
    ],
    notIncluded: [],
    cta: "Start Free Trial",
    ctaHref: "/app",
    highlight: false,
    badge: null,
    afterpay: true,
  },
];

// ── FAQ data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. Australian Consumer Law applies, and you retain access to paid features until the end of your current billing period.",
  },
  {
    q: "Is there a free trial for Builder or Scale?",
    a: "Yes. Both paid plans include a 7-day free trial with no credit card required. Explore all 50+ tools and decide if it's right for you before being charged.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is never deleted. If you downgrade to Starter, your saved outputs, products, and conversation history remain intact \u2014 you just lose access to premium tools until you re-upgrade.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 14 days, contact us for a full refund \u2014 no questions asked. Australian Consumer Law applies to all purchases.",
  },
  {
    q: "Can I pay with Afterpay or Zip?",
    a: "Yes. Afterpay and Zip are available on both Builder and Scale plans, letting you spread payments over interest-free instalments.",
  },
];

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  const { session } = useAuth();

  // Compute display price based on toggle
  const getDisplayPrice = (plan: typeof PLANS[number]) => {
    if (plan.price === "$0") return "$0";
    const base = parseInt(plan.price.replace("$", ""));
    if (annual) {
      const monthlyEquiv = Math.round(base * 10 / 12); // 10 months = 2 free
      return `$${monthlyEquiv}`;
    }
    return plan.price;
  };
  const getAnnualTotal = (plan: typeof PLANS[number]) => {
    if (plan.price === "$0") return null;
    const base = parseInt(plan.price.replace("$", ""));
    return base * 10; // 2 months free
  };

  const handleProCheckout = async () => {
    const token = session?.access_token ?? "";
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      toast.error(err.message || "Payment error \u2014 please try again.");
    }
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: dm, overflowX: "hidden", minHeight: "100vh" }}>
      <SEO
        title="Majorka Pricing — From Free to Scale | AUD Plans"
        description="Majorka pricing plans in AUD. Start free with 5 AI credits/day. Upgrade to Builder ($49/mo) or Scale ($149/mo) for unlimited access. Afterpay available."
        path="/pricing"
      />

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,6,8,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            {"\u2190"} Back to Home
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#000" }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16 }}>MAJORKA</span>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 24, letterSpacing: "0.05em" }}>
          Simple Pricing &middot; All in AUD
        </div>
        <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "-1.5px", marginBottom: 16 }}>
          Plans that scale with you.
        </h1>
        <p style={{ color: C.secondary, fontSize: 18, maxWidth: 520, margin: "0 auto", marginBottom: 32 }}>
          Start free, upgrade when you're ready. No hidden fees.
        </p>

        {/* Monthly / Annual toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 100, padding: "6px 8px" }}>
          <button
            onClick={() => setAnnual(false)}
            style={{
              padding: "8px 20px", borderRadius: 100, fontSize: 14, fontWeight: 700, fontFamily: syne,
              background: !annual ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : "transparent",
              color: !annual ? "#000" : C.secondary,
              border: "none", cursor: "pointer",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            style={{
              padding: "8px 20px", borderRadius: 100, fontSize: 14, fontWeight: 700, fontFamily: syne,
              background: annual ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : "transparent",
              color: annual ? "#000" : C.secondary,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Annual
            <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100 }}>
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section style={{ padding: "0 24px 100px" }}>
        <div style={{ maxWidth: 1050, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? C.elevated : C.card,
                border: `1px solid ${plan.highlight ? C.gold : C.border}`,
                borderRadius: 20,
                padding: 36,
                position: "relative",
                boxShadow: plan.highlight ? "0 0 48px rgba(212,175,55,0.18)" : "none",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, color: "#000", borderRadius: 100,
                  padding: "5px 18px", fontSize: 11, fontWeight: 800, fontFamily: syne, whiteSpace: "nowrap",
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 20, marginBottom: 4, color: plan.highlight ? C.gold : C.text }}>{plan.name}</div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{plan.description}</p>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 48, color: C.text }}>{getDisplayPrice(plan)}</span>
                <span style={{ color: C.muted, fontSize: 15 }}>{annual && plan.price !== "$0" ? "AUD/mo" : plan.period}</span>
              </div>
              {annual && plan.price !== "$0" && (
                <div style={{ fontSize: 12, color: C.secondary, marginBottom: 20 }}>
                  <span style={{ textDecoration: "line-through", color: C.muted }}>${parseInt(plan.price.replace("$", "")) * 12}/yr</span>
                  {" "}
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>${getAnnualTotal(plan)}/yr — save ${parseInt(plan.price.replace("$", "")) * 2}</span>
                </div>
              )}
              {(!annual || plan.price === "$0") && <div style={{ marginBottom: 20 }} />}

              {/* CTA button */}
              {plan.ctaHref !== null ? (
                <Link
                  href={plan.ctaHref}
                  style={{
                    display: "block", textAlign: "center",
                    background: plan.highlight ? `linear-gradient(135deg, ${C.gold}, #b8941f)` : "transparent",
                    color: plan.highlight ? "#000" : C.text,
                    border: plan.highlight ? "none" : `1px solid ${C.border}`,
                    borderRadius: 10, padding: "13px 20px",
                    fontFamily: syne, fontWeight: 700, fontSize: 15,
                    textDecoration: "none", marginBottom: 16,
                  }}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={handleProCheckout}
                  style={{
                    display: "block", width: "100%", textAlign: "center",
                    background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, color: "#000",
                    border: "none", borderRadius: 10,
                    padding: "13px 20px", fontFamily: syne, fontWeight: 700, fontSize: 15,
                    cursor: "pointer", marginBottom: 16,
                    boxShadow: "0 0 24px rgba(212,175,55,0.3)",
                  }}
                >
                  {plan.cta}
                </button>
              )}

              {/* Payment info */}
              {plan.afterpay && annual && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "6px 0", marginBottom: 16,
                  fontSize: 11, color: C.secondary, fontWeight: 500,
                }}>
                  <span style={{ background: "#b2fce4", color: "#000", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Afterpay</span>
                  <span>&</span>
                  <span style={{ background: "#7b61ff", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Zip</span>
                  <span>available on annual</span>
                </div>
              )}
              {plan.afterpay && !annual && (
                <div style={{ padding: "6px 0", marginBottom: 16, textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Or save 20% with annual billing</span>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />

              {/* Included features */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.secondary }}>
                    <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{"\u2713"}</span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.muted }}>
                    <span style={{ color: C.muted, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{"\u2013"}</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON SUMMARY ── */}
      <section style={{ padding: "0 24px 100px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto", paddingTop: 80 }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.8px", textAlign: "center", marginBottom: 48 }}>
            What's included in each plan?
          </h2>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", background: C.elevated, padding: "14px 24px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: C.muted, textTransform: "uppercase" }}>Feature</span>
              {PLANS.map((p) => (
                <span key={p.name} style={{ fontSize: 12, fontWeight: 700, fontFamily: syne, color: p.highlight ? C.gold : C.muted, textTransform: "uppercase", textAlign: "center" }}>{p.name}</span>
              ))}
            </div>
            {[
              { label: "AI Credits/day", starter: "5", builder: "Unlimited", scale: "Unlimited" },
              { label: "All 50+ Tools", starter: "\u2717", builder: "\u2713", scale: "\u2713" },
              { label: "Full Launch Kit", starter: "\u2717", builder: "\u2713", scale: "\u2713" },
              { label: "Meta + TikTok Ads", starter: "\u2717", builder: "\u2713", scale: "\u2713" },
              { label: "Financial Modeler", starter: "\u2717", builder: "\u2713", scale: "\u2713" },
              { label: "Priority AI", starter: "\u2717", builder: "\u2717", scale: "\u2713" },
              { label: "White-label Export", starter: "\u2717", builder: "\u2717", scale: "\u2713" },
              { label: "API Access", starter: "\u2717", builder: "\u2717", scale: "\u2713" },
              { label: "Support", starter: "Community", builder: "Priority", scale: "Dedicated" },
              { label: "Afterpay / Zip", starter: "\u2717", builder: "\u2713", scale: "\u2713" },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", padding: "14px 24px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <span style={{ fontSize: 14, color: C.secondary }}>{row.label}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.starter === "\u2717" ? C.muted : C.secondary, fontWeight: row.starter === "\u2713" ? 700 : 400 }}>{row.starter}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.builder === "\u2713" ? "#22c55e" : row.builder === "\u2717" ? C.muted : C.gold, fontWeight: 600 }}>{row.builder}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.scale === "\u2713" ? "#22c55e" : row.scale === "\u2717" ? C.muted : C.gold, fontWeight: 600 }}>{row.scale}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMOTIONAL COMPARISON ── */}
      <EmotionalComparisonTable />

      {/* ── FAQ ── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.8px", textAlign: "center", marginBottom: 48 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  border: `1px solid ${openFaq === i ? C.goldBorder : C.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: openFaq === i ? "rgba(212,175,55,0.04)" : C.card,
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", cursor: "pointer", background: "transparent", border: "none", color: C.text, textAlign: "left" }}
                >
                  <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 15 }}>{faq.q}</span>
                  <span style={{ color: C.gold, fontSize: 18, transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, marginLeft: 12 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 22px 20px" }}>
                    <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{
        padding: "80px 24px",
        background: `linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.03) 60%, ${C.bg} 100%)`,
        borderTop: `1px solid ${C.goldBorder}`,
        textAlign: "center",
      }}>
        <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.8px", marginBottom: 16 }}>
          Not sure yet? Start for free.
        </h2>
        <p style={{ color: C.secondary, fontSize: 16, marginBottom: 36 }}>
          No credit card required. Upgrade when you're ready. Afterpay available.
        </p>
        <Link href="/app" style={{ display: "inline-block", background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, color: "#000", borderRadius: 10, padding: "14px 36px", fontFamily: syne, fontWeight: 800, fontSize: 16, textDecoration: "none", boxShadow: "0 0 36px rgba(212,175,55,0.35)", marginBottom: 24 }}>
          Get Started Free {"\u2192"}
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 16 }}>{"\uD83D\uDEE1\uFE0F"}</span>
          <span style={{ fontSize: 13, color: C.secondary, fontWeight: 500 }}>14-day money-back guarantee &middot; Australian Consumer Law applies</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: syne, fontWeight: 900, fontSize: 14, color: "#000" }}>M</div>
          <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15 }}>MAJORKA</span>
        </div>
        <p style={{ color: C.muted, fontSize: 13 }}>&copy; {new Date().getFullYear()} Majorka. The AI Ecommerce Operating System. Made in Australia {"\uD83C\uDDE6\uD83C\uDDFA"}</p>
        <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>ABN: [pending] &middot; Australian Consumer Law applies</p>
      </footer>
    </div>
  );
}
