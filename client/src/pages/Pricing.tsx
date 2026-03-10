import { Link } from "wouter";
import { useState } from "react";

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

// ── Plan data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Get started with essential AI tools.",
    features: [
      "5 products",
      "10 AI requests/day",
      "Website Generator",
      "Basic Copywriter",
      "Community support",
    ],
    notIncluded: [
      "Ad Spy",
      "Full Launch Kit",
      "Financial Modeler",
      "API access",
    ],
    cta: "Get Started Free",
    ctaHref: "/app",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "Everything you need to run a winning ecommerce business.",
    features: [
      "Unlimited products",
      "Unlimited AI requests",
      "All 42 tools",
      "Launch Kit",
      "Ad Spy",
      "Financial Modeler",
      "Priority support",
    ],
    notIncluded: [
      "White-label export",
      "API access",
      "Custom domain support",
    ],
    cta: "Start Pro Trial",
    ctaHref: null, // handled via Stripe
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    price: "$99",
    period: "/mo",
    description: "For serious operators who need full control and flexibility.",
    features: [
      "Everything in Pro",
      "White-label export",
      "API access",
      "Custom domain support",
      "Dedicated account manager",
    ],
    notIncluded: [],
    cta: "Go Elite",
    ctaHref: "/app",
    highlight: false,
    badge: null,
  },
];

// ── FAQ data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. You can cancel your subscription at any time from your account settings. You'll retain access to Pro/Elite features until the end of your current billing period.",
  },
  {
    q: "Is there a free trial for Pro or Elite?",
    a: "Pro includes a 7-day free trial with no credit card required. You can explore all 42 tools and decide if it's right for you before being charged.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is never deleted. If you downgrade to Free, your saved outputs, products, and conversation history remain intact — you just lose access to Pro-only tools until you re-upgrade.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 14 days, contact us for a full refund — no questions asked.",
  },
];

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleProCheckout = async () => {
    // TODO: Replace with actual auth token from useAuth hook once wired up
    const token = localStorage.getItem("supabase_token") ?? "";
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
    }
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: inter, overflowX: "hidden", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            ← Back to Home
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: syne, fontWeight: 900, fontSize: 16, color: "#000" }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16 }}>MAJORKA</span>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 24, letterSpacing: "0.05em" }}>
          Simple Pricing
        </div>
        <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "-1.5px", marginBottom: 16 }}>
          Plans that scale with you.
        </h1>
        <p style={{ color: C.secondary, fontSize: 18, maxWidth: 520, margin: "0 auto" }}>
          Start free, upgrade when you're ready. No hidden fees, cancel anytime.
        </p>
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
                boxShadow: plan.highlight ? "0 0 48px rgba(245,158,11,0.18)" : "none",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: C.gold, color: "#000", borderRadius: 100,
                  padding: "5px 18px", fontSize: 11, fontWeight: 800, fontFamily: syne, whiteSpace: "nowrap",
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 20, marginBottom: 4, color: plan.highlight ? C.gold : C.text }}>{plan.name}</div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{plan.description}</p>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32 }}>
                <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 48, color: C.text }}>{plan.price}</span>
                <span style={{ color: C.muted, fontSize: 15 }}>{plan.period}</span>
              </div>

              {/* CTA button */}
              {plan.ctaHref !== null ? (
                <Link
                  href={plan.ctaHref}
                  style={{
                    display: "block", textAlign: "center",
                    background: plan.highlight ? C.gold : "transparent",
                    color: plan.highlight ? "#000" : C.text,
                    border: plan.highlight ? "none" : `1px solid ${C.border}`,
                    borderRadius: 10, padding: "13px 20px",
                    fontFamily: syne, fontWeight: 700, fontSize: 15,
                    textDecoration: "none", marginBottom: 32,
                  }}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={handleProCheckout}
                  style={{
                    display: "block", width: "100%", textAlign: "center",
                    background: C.gold, color: "#000",
                    border: "none", borderRadius: 10,
                    padding: "13px 20px", fontFamily: syne, fontWeight: 700, fontSize: 15,
                    cursor: "pointer", marginBottom: 32,
                    boxShadow: "0 0 24px rgba(245,158,11,0.3)",
                  }}
                >
                  {plan.cta}
                </button>
              )}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />

              {/* Included features */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.secondary }}>
                    <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.muted }}>
                    <span style={{ color: C.muted, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>–</span>
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
              { label: "Products", free: "5", pro: "Unlimited", elite: "Unlimited" },
              { label: "AI Requests/day", free: "10", pro: "Unlimited", elite: "Unlimited" },
              { label: "All 42 Tools", free: "✗", pro: "✓", elite: "✓" },
              { label: "Ad Spy", free: "✗", pro: "✓", elite: "✓" },
              { label: "Launch Kit", free: "✗", pro: "✓", elite: "✓" },
              { label: "Financial Modeler", free: "✗", pro: "✓", elite: "✓" },
              { label: "White-label Export", free: "✗", pro: "✗", elite: "✓" },
              { label: "API Access", free: "✗", pro: "✗", elite: "✓" },
              { label: "Support", free: "Community", pro: "Priority", elite: "Dedicated" },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", padding: "14px 24px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <span style={{ fontSize: 14, color: C.secondary }}>{row.label}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.free === "✗" ? C.muted : C.secondary, fontWeight: row.free === "✓" ? 700 : 400 }}>{row.free}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.pro === "✓" ? "#22c55e" : row.pro === "✗" ? C.muted : C.gold, fontWeight: 600 }}>{row.pro}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: row.elite === "✓" ? "#22c55e" : row.elite === "✗" ? C.muted : C.gold, fontWeight: 600 }}>{row.elite}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "100px 24px" }}>
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
                  background: openFaq === i ? "rgba(245,158,11,0.04)" : C.card,
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
        background: "linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.03) 60%, #0a0a0a 100%)",
        borderTop: `1px solid ${C.goldBorder}`,
        textAlign: "center",
      }}>
        <h2 style={{ fontFamily: syne, fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.8px", marginBottom: 16 }}>
          Not sure yet? Start for free.
        </h2>
        <p style={{ color: C.secondary, fontSize: 16, marginBottom: 36 }}>
          No credit card required. Upgrade when you're ready.
        </p>
        <Link href="/app" style={{ display: "inline-block", background: C.gold, color: "#000", borderRadius: 10, padding: "14px 36px", fontFamily: syne, fontWeight: 800, fontSize: 16, textDecoration: "none", boxShadow: "0 0 36px rgba(245,158,11,0.35)" }}>
          Get Started Free →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: syne, fontWeight: 900, fontSize: 14, color: "#000" }}>M</div>
          <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15 }}>MAJORKA</span>
        </div>
        <p style={{ color: C.muted, fontSize: 13 }}>© {new Date().getFullYear()} Majorka. The AI Ecommerce Operating System.</p>
      </footer>
    </div>
  );
}
