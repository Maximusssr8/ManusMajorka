import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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

// ── Plan data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "AUD/mo",
    description: "Get started with essential AI tools. Free forever.",
    features: [
      "5 AI credits/day",
      "Core tools access",
      "Website Generator",
      "Basic Copywriter",
      "AU market defaults",
      "Community support",
    ],
    notIncluded: [
      "All 50+ tools",
      "Full Launch Kit",
      "Financial Modeler",
      "API access",
    ],
    cta: "Get Started Free",
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
  const { session } = useAuth();

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
        <p style={{ color: C.secondary, fontSize: 18, maxWidth: 520, margin: "0 auto" }}>
          Start free, upgrade when you're ready. Afterpay & Zip available. No hidden fees.
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
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: syne, fontWeight: 900, fontSize: 48, color: C.text }}>{plan.price}</span>
                <span style={{ color: C.muted, fontSize: 15 }}>{plan.period}</span>
              </div>

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

              {/* Afterpay badge */}
              {plan.afterpay && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "6px 0", marginBottom: 16,
                  fontSize: 11, color: C.secondary, fontWeight: 500,
                }}>
                  <span style={{ background: "#b2fce4", color: "#000", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Afterpay</span>
                  <span>&</span>
                  <span style={{ background: "#7b61ff", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 800 }}>Zip</span>
                  <span>available</span>
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
        <Link href="/app" style={{ display: "inline-block", background: `linear-gradient(135deg, ${C.gold}, #b8941f)`, color: "#000", borderRadius: 10, padding: "14px 36px", fontFamily: syne, fontWeight: 800, fontSize: 16, textDecoration: "none", boxShadow: "0 0 36px rgba(212,175,55,0.35)" }}>
          Get Started Free {"\u2192"}
        </Link>
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
