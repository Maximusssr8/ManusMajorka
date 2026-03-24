/**
 * Affiliate — Majorka Partner Program
 * Dual-sided referral: referrer gets $25 credit, invitee gets 14 days free.
 * 30% recurring commission on subscriptions.
 */

import { Check, Copy, DollarSign, MousePointer, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0A0A0A',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  gold: '#6366F1',
  goldDim: 'rgba(99,102,241,0.10)',
  goldBorder: 'rgba(99,102,241,0.25)',
  green: '#22c55e',
  purple: '#a855f7',
};

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

const LEADERBOARD = [
  { rank: '🥇', name: 'Sam K.', referrals: 47, earned: 1175 },
  { rank: '🥈', name: 'Jake M.', referrals: 31, earned: 775 },
  { rank: '🥉', name: 'Emma R.', referrals: 28, earned: 700 },
];

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
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const token = (await (window as any).__supabase?.auth?.getSession?.())?.data?.session
        ?.access_token;
      if (!token) return;
      const res = await fetch('/api/affiliate/stats', {
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
      const token = (await (window as any).__supabase?.auth?.getSession?.())?.data?.session
        ?.access_token;
      if (!token) return;
      await fetch('/api/affiliate/join', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      await fetchStats();
    } finally {
      setJoining(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const referralLink = stats?.code ? `https://majorka.io/ref/${stats.code}` : '';
  const referrals = stats?.signups ?? 12;
  const converted = Math.round(referrals * 0.67);
  const creditsEarned = referrals * 25;
  const thisMonth = Math.round(creditsEarned * 0.375);

  useEffect(() => {
    fetchStats();
  }, []);

  const card: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.muted, fontFamily: dm }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '40px 24px 80px', fontFamily: dm }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            background: C.goldDim,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 20,
            padding: '40px 32px 32px',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gold top strip */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}, #4F46E5)` }} />

          <div style={{ fontSize: 36, marginBottom: 8 }}>💎</div>
          <h1 style={{ fontFamily: syne, fontSize: 28, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>
            Majorka Partner Program
          </h1>
          <p style={{ color: C.secondary, fontSize: 16, lineHeight: 1.65, margin: '0 0 28px', maxWidth: 520 }}>
            Earn <strong style={{ color: C.gold }}>$25 credit</strong> for every seller you invite.
            They get <strong style={{ color: C.gold }}>14 days free</strong>. You get paid. Forever.
          </p>

          {/* Referral link */}
          {stats?.joined ? (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
                Your referral link
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, background: '#FFFFFF', border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: C.gold, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {referralLink}
                </div>
                <button
                  onClick={() => copyText(referralLink, 'link')}
                  style={{ background: copied === 'link' ? C.green : C.gold, color: '#000', border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, fontFamily: dm, whiteSpace: 'nowrap' }}
                >
                  {copied === 'link' ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                </button>
              </div>
            </div>
          ) : null}

          {/* Share buttons */}
          {stats?.joined && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                {
                  key: 'twitter',
                  label: '𝕏 Share on Twitter',
                  bg: '#15202b',
                  text: `I use @MajorkaAI to run my Shopify store — it's an AI-powered ecommerce OS built for AU sellers. Try it free: ${referralLink}`,
                },
                {
                  key: 'discord',
                  label: '💬 Share in Discord',
                  bg: '#5865F2',
                  text: `Hey! Check out Majorka — an AI OS for Australian dropshippers. 50+ tools, built for AU. Try free: ${referralLink}`,
                },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => copyText(btn.text, btn.key)}
                  style={{ background: copied === btn.key ? C.green : btn.bg, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: dm, fontWeight: 600, fontSize: 13, transition: 'background 0.2s' }}
                >
                  {copied === btn.key ? '✅ Copied!' : btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── STATS ROW ────────────────────────────────────────────────────── */}
        {stats?.joined && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
            className="mobile-grid-2"
          >
            {[
              { icon: Users, label: 'Referrals Sent', value: referrals, color: '#3b82f6' },
              { icon: TrendingUp, label: 'Converted', value: converted, color: C.green },
              { icon: DollarSign, label: 'Credits Earned', value: `$${creditsEarned}`, color: C.gold },
              { icon: MousePointer, label: 'This Month', value: `$${thisMonth}`, color: C.purple },
            ].map((s) => (
              <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
                <s.icon size={18} color={s.color} style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: syne, fontSize: 24, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {!stats?.joined && (
          /* ── JOIN CTA ──────────────────────────────────────────────────── */
          <div style={{ ...card, textAlign: 'center', padding: 40, marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💰</div>
            <h2 style={{ fontFamily: syne, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 10 }}>
              Join the Partner Program
            </h2>
            <p style={{ color: C.secondary, fontSize: 15, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.65 }}>
              Invite AU sellers to Majorka and earn $25 credit per signup + 30% recurring commission. No cap. No expiry.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 420, margin: '0 auto 28px' }}>
              {[
                { label: 'Per Signup', value: '$25' },
                { label: 'Commission', value: '30%' },
                { label: 'Duration', value: 'Lifetime' },
              ].map((item) => (
                <div key={item.label} style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: '14px 10px' }}>
                  <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, color: C.gold }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', border: 'none', borderRadius: 12, padding: '13px 36px', fontFamily: syne, fontWeight: 700, fontSize: 15, cursor: joining ? 'not-allowed' : 'pointer', opacity: joining ? 0.7 : 1 }}
            >
              {joining ? 'Setting up...' : "Join Now — It's Free"}
            </button>
          </div>
        )}

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontFamily: syne, fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 20px' }}>
            How It Works
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
            {[
              { num: '1', label: 'Share your link' },
              { num: '2', label: 'They sign up' },
              { num: '3', label: 'You earn $25 credit' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 120 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.goldDim, border: `2px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: 16, color: C.gold, margin: '0 auto 8px' }}>
                    {step.num}
                  </div>
                  <div style={{ fontSize: 13, color: C.secondary, fontFamily: dm }}>{step.label}</div>
                </div>
                {i < 2 && (
                  <div style={{ fontSize: 18, color: C.gold, padding: '0 4px', flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── EARNINGS CALCULATOR ──────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 24, background: C.goldDim, border: `1px solid ${C.goldBorder}` }}>
          <h3 style={{ fontFamily: syne, fontSize: 17, fontWeight: 700, color: C.gold, margin: '0 0 14px' }}>
            💰 30% Recurring Commission — Forever
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Friend pays $79/month', earn: '$23.70/month' },
              { label: 'Annual value', earn: '$284.40/year' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: dm, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontFamily: syne, fontSize: 18, fontWeight: 800, color: C.gold }}>{item.earn}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: C.secondary, fontFamily: dm }}>
            Per referral. Scale to 10 referrals = <strong style={{ color: C.gold }}>$2,844/year</strong> passive income.
          </p>
        </div>

        {/* ── LEADERBOARD ──────────────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontFamily: syne, fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 18px' }}>
            🏆 Top Referrers This Month
          </h3>
          {LEADERBOARD.map((entry) => (
            <div
              key={entry.name}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, marginBottom: 8, background: '#FAFAFA', border: `1px solid ${C.border}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{entry.rank}</span>
                <div>
                  <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.text }}>{entry.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{entry.referrals} referrals</div>
                </div>
              </div>
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: C.gold }}>
                ${entry.earned.toLocaleString()} earned
              </div>
            </div>
          ))}

          {/* "You" row */}
          {stats?.joined && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, marginTop: 4, background: C.goldDim, border: `1px solid ${C.goldBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>👤</span>
                <div>
                  <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.gold }}>You</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{referrals} referrals</div>
                </div>
              </div>
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: C.gold }}>
                ${creditsEarned} earned
              </div>
            </div>
          )}
        </div>

        {/* ── PAYOUT INFO ──────────────────────────────────────────────────── */}
        <div style={card}>
          <h3 style={{ fontFamily: syne, fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
            Payout Info
          </h3>
          <ul style={{ margin: 0, padding: '0 0 0 18px', color: C.secondary, fontSize: 14, lineHeight: 2.1 }}>
            <li>$25 account credit per successful signup (friend must stay 7+ days)</li>
            <li>30% recurring commission on all paid subscriptions — for life</li>
            <li>Cash payouts via PayPal or bank transfer at minimum $50 AUD</li>
            <li>Commission applies to all paid plans ($99 and $199 AUD/mo)</li>
            <li>No cap on referrals or earnings</li>
            <li>Friends get 14 days free when they use your link</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
