import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Copy, Check, DollarSign, Users, MousePointer, TrendingUp } from "lucide-react";

const C = {
  bg: "#060608",
  card: "#0c0c10",
  border: "rgba(255,255,255,0.06)",
  text: "#f5f5f5",
  secondary: "#94949e",
  muted: "#52525b",
  gold: "#d4af37",
  goldDim: "rgba(212,175,55,0.1)",
  goldBorder: "rgba(212,175,55,0.25)",
  green: "#22c55e",
};

const syne = "Syne, sans-serif";
const dm = "'DM Sans', sans-serif";

const SHARE_TEMPLATES = {
  twitter: (code: string) =>
    `Just discovered @MajorkaAI — an AI-powered ecommerce OS built specifically for Australian sellers. 50+ tools, AUD pricing, AU market data. Try it free: https://manus-majorka.vercel.app?ref=${code}`,
  linkedin: (code: string) =>
    `If you're running an ecommerce business in Australia, check out Majorka. It's an AI-powered operating system with 50+ tools built specifically for the AU market — GST calculations, Afterpay integration, AusPost shipping, the lot.\n\nFree to start: https://manus-majorka.vercel.app?ref=${code}`,
  email: (code: string) =>
    `Subject: Found this AI tool for AU ecommerce sellers\n\nHey,\n\nThought you'd find this useful — Majorka is an AI-powered ecommerce OS built specifically for Australian sellers. It has 50+ tools covering product research, ad copy, landing pages, email sequences, and more.\n\nEverything uses AUD pricing, AU suppliers, and understands things like Afterpay and AusPost.\n\nYou can try it free here: https://manus-majorka.vercel.app?ref=${code}\n\nCheers`,
};

interface AffiliateStats {
  joined: boolean;
  code?: string;
  clicks?: number;
  signups?: number;
  revenueCents?: number;
  commissionRate?: number;
}

export default function Affiliate() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStats = async () => {
    try {
      const token = (await (window as any).__supabase?.auth?.getSession?.())?.data?.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/affiliate/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ joined: false });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const token = (await (window as any).__supabase?.auth?.getSession?.())?.data?.session?.access_token;
      if (!token) return;
      await fetch("/api/affiliate/join", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      await fetchStats();
    } finally {
      setJoining(false);
    }
  };

  const copyLink = () => {
    if (!stats?.code) return;
    navigator.clipboard.writeText(`https://manus-majorka.vercel.app?ref=${stats.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => { fetchStats(); }, []);

  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontFamily: dm }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 24px 80px", fontFamily: dm }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: syne, fontSize: 32, fontWeight: 800, color: C.text, margin: 0, marginBottom: 8 }}>
            Earn with Majorka
          </h1>
          <p style={{ color: C.secondary, fontSize: 16, margin: 0 }}>
            Earn 30% recurring commission for every paying customer you refer. For life.
          </p>
        </div>

        {!stats?.joined ? (
          /* ── Join CTA ──────────────────────────────────────────────────────── */
          <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <h2 style={{ fontFamily: syne, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              Join the Majorka Affiliate Program
            </h2>
            <p style={{ color: C.secondary, fontSize: 15, maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.6 }}>
              Share Majorka with other AU sellers and earn 30% recurring commission on every subscription.
              No cap. No expiry. Paid monthly via PayPal or bank transfer.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 500, margin: "0 auto 32px" }}>
              {[
                { label: "Commission", value: "30%" },
                { label: "Duration", value: "Lifetime" },
                { label: "Min Payout", value: "$50 AUD" },
              ].map((item) => (
                <div key={item.label} style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: "16px 12px" }}>
                  <div style={{ fontFamily: syne, fontSize: 24, fontWeight: 800, color: C.gold }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
                color: "#000", border: "none", borderRadius: 12,
                padding: "14px 40px", fontFamily: syne, fontWeight: 700, fontSize: 16,
                cursor: joining ? "not-allowed" : "pointer", opacity: joining ? 0.7 : 1,
              }}
            >
              {joining ? "Setting up..." : "Join Now — It's Free"}
            </button>
          </div>
        ) : (
          /* ── Dashboard ─────────────────────────────────────────────────────── */
          <>
            {/* Referral Link */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <label style={{ fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Your referral link</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1, background: "#15151a", border: `1px solid ${C.goldBorder}`,
                  borderRadius: 8, padding: "12px 16px", fontSize: 14, color: C.gold,
                  fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  https://manus-majorka.vercel.app?ref={stats.code}
                </div>
                <button
                  onClick={copyLink}
                  style={{
                    background: copied ? C.green : C.gold, color: "#000", border: "none",
                    borderRadius: 8, padding: "12px 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13,
                    fontFamily: dm, whiteSpace: "nowrap",
                  }}
                >
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="mobile-grid-2">
              {[
                { icon: MousePointer, label: "Clicks", value: stats.clicks ?? 0, color: "#3b82f6" },
                { icon: Users, label: "Signups", value: stats.signups ?? 0, color: C.green },
                { icon: DollarSign, label: "Earnings", value: `$${((stats.revenueCents ?? 0) / 100).toFixed(2)}`, color: C.gold },
                { icon: TrendingUp, label: "Commission", value: `${stats.commissionRate ?? 30}%`, color: "#a855f7" },
              ].map((stat) => (
                <div key={stat.label} style={cardStyle}>
                  <stat.icon size={20} color={stat.color} style={{ marginBottom: 8 }} />
                  <div style={{ fontFamily: syne, fontSize: 28, fontWeight: 800, color: C.text }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Payout Info */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h3 style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>Payout Info</h3>
              <ul style={{ margin: 0, padding: "0 0 0 20px", color: C.secondary, fontSize: 14, lineHeight: 2 }}>
                <li>Paid monthly via PayPal or bank transfer</li>
                <li>Minimum payout: $50 AUD</li>
                <li>30% recurring commission for life of each referred customer</li>
                <li>Commission applies to all paid plans ($49 and $149 AUD/mo)</li>
                <li>No cap on earnings</li>
              </ul>
            </div>

            {/* Share Templates */}
            <div style={cardStyle}>
              <h3 style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Ready-to-Share Templates</h3>
              {(["twitter", "linkedin", "email"] as const).map((platform) => (
                <div key={platform} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.gold, textTransform: "capitalize" }}>{platform}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SHARE_TEMPLATES[platform](stats.code!));
                      }}
                      style={{
                        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                        borderRadius: 6, padding: "4px 12px", fontSize: 12, color: C.secondary,
                        cursor: "pointer", fontFamily: dm,
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{
                    background: "#15151a", border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: 12, fontSize: 13, color: C.secondary, lineHeight: 1.6,
                    whiteSpace: "pre-wrap", maxHeight: 120, overflowY: "auto",
                  }}>
                    {SHARE_TEMPLATES[platform](stats.code!)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
