import { useMemo } from 'react';
import { Link } from 'wouter';
import { useNicheStats } from '@/hooks/useNicheStats';
import { useProductStats } from '@/hooks/useProducts';
import { ProductSparkline } from '@/components/app/Sparkline';
import { scorePillStyle } from '@/lib/scorePill';
import { shortenCategory, fmtK } from '@/lib/categoryColor';

const display = "'Bricolage Grotesque', sans-serif";
const sans = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

const MARKETS = [
  { flag: '🇦🇺', code: 'AU', active: true },
  { flag: '🇺🇸', code: 'US', active: false },
  { flag: '🇬🇧', code: 'UK', active: false },
  { flag: '🇨🇦', code: 'CA', active: false },
  { flag: '🇳🇿', code: 'NZ', active: false },
  { flag: '🇩🇪', code: 'DE', active: false },
  { flag: '🇸🇬', code: 'SG', active: false },
];

const COLS = '40px minmax(0,2fr) 90px 90px 110px 110px 90px 110px';
const HEADERS = ['#', 'Category', 'Products', 'Avg Score', 'Total Orders', 'Est. Daily Rev', 'Trend', 'Opportunity'];

type OpportunityTier = { icon: string; label: string; color: string; bg: string };

function opportunityTier(avgScore: number, productCount: number): OpportunityTier {
  if (avgScore >= 80 && productCount < 30) {
    return { icon: '🟢', label: 'Open', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  }
  if (avgScore >= 80 && productCount >= 30) {
    return { icon: '🟡', label: 'Competitive', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  }
  return { icon: '⚪', label: 'Saturated', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)' };
}

export default function Market() {
  const { niches, loading } = useNicheStats(15);
  const stats = useProductStats();

  const top3Opportunities = useMemo(() => {
    return [...niches]
      .map((n) => ({ ...n, tier: opportunityTier(n.avgScore, n.count) }))
      .filter((n) => n.tier.label === 'Open' || n.tier.label === 'Competitive')
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3);
  }, [niches]);

  const hottestCategory = niches[0];
  const mostCompetitive = [...niches].sort((a, b) => b.count - a.count)[0];

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: '#e8e8f0', fontFamily: sans }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: display, fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Market Intelligence</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Category rankings, revenue signals, and opportunity scores across 7 markets
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {MARKETS.map((m) => (
            <button key={m.code} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7,
              background: m.active ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${m.active ? 'rgba(124,106,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: m.active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              fontFamily: mono, fontSize: 11, fontWeight: m.active ? 600 : 400,
              cursor: 'pointer', flexShrink: 0,
            }}>
              <span>{m.flag}</span><span>{m.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Hottest Category"
          value={hottestCategory ? shortenCategory(hottestCategory.name) : '—'}
          sub={hottestCategory ? `${fmtK(hottestCategory.totalOrders)} total orders` : ''}
          accent="#f59e0b"
          glow="rgba(245,158,11,0.25)"
        />
        <StatCard
          label="Avg Market Score"
          value={stats.avgScore ? `${stats.avgScore}/100` : '—'}
          sub={`Across ${stats.total.toLocaleString()} tracked products`}
          accent="#10b981"
          glow="rgba(16,185,129,0.25)"
        />
        <StatCard
          label="Most Competitive"
          value={mostCompetitive ? shortenCategory(mostCompetitive.name) : '—'}
          sub={mostCompetitive ? `${mostCompetitive.count} products` : ''}
          accent="#a78bfa"
          glow="rgba(124,106,255,0.25)"
        />
      </div>

      {/* Top Opportunity Niches */}
      {top3Opportunities.length > 0 && (
        <>
          <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Top Opportunity Niches</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 28 }}>
            {top3Opportunities.map((n) => {
              const sp = scorePillStyle(n.avgScore);
              return (
                <Link
                  key={n.name}
                  href={`/app/products?category=${encodeURIComponent(n.name)}`}
                  style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 12,
                    padding: '18px 20px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{n.tier.icon} {n.tier.label}</span>
                    <span style={{
                      background: sp.background, color: sp.color, border: sp.border,
                      fontFamily: mono, fontSize: 11, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 999,
                    }}>{n.avgScore}</span>
                  </div>
                  <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: '#e8e8f0', marginBottom: 6 }}>{shortenCategory(n.name)}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <span>{n.count} products</span>
                    <span>{fmtK(n.totalOrders)} orders</span>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>Browse Products →</div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Category Rankings Table */}
      <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Category Rankings</h2>
      <div style={{
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: COLS, gap: 14,
          padding: '10px 16px', background: '#222222',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {HEADERS.map((h, i) => (
            <div key={i} style={{ textAlign: i === 0 || i === 1 || i === 6 || i === 7 ? 'left' : 'right' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 14,
              padding: '14px 16px', minHeight: 56, alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span className="mj-shim" style={{ height: 12, width: 24 }} />
              <span className="mj-shim" style={{ height: 12, width: '80%' }} />
              <span className="mj-shim" style={{ height: 12, width: 40 }} />
              <span className="mj-shim" style={{ height: 18, width: 50, borderRadius: 999 }} />
              <span className="mj-shim" style={{ height: 12, width: 60 }} />
              <span className="mj-shim" style={{ height: 12, width: 60 }} />
              <span className="mj-shim" style={{ height: 14, width: 70 }} />
              <span className="mj-shim" style={{ height: 18, width: 90, borderRadius: 999 }} />
            </div>
          ))
        ) : niches.length === 0 ? (
          <div style={{ padding: '60px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            No category data yet
          </div>
        ) : (
          niches.map((n, i) => {
            const sp = scorePillStyle(n.avgScore);
            const estDaily = Math.round(n.totalOrders * 0.0003 * (n.avgPrice || 8.5));
            const tier = opportunityTier(n.avgScore, n.count);
            const seed = n.name.charCodeAt(0) * 7 + n.count;
            return (
              <Link
                key={n.name}
                href={`/app/products?category=${encodeURIComponent(n.name)}`}
                className="mj-row mj-row-hover"
                style={{
                  display: 'grid', gridTemplateColumns: COLS, gap: 14,
                  padding: '12px 16px', minHeight: 60, alignItems: 'center',
                  borderBottom: i === niches.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 12, color: '#52525b' }}>{String(i + 1).padStart(2, '0')}</span>
                <span
                  title={n.name}
                  style={{
                    fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#e8e8f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >{shortenCategory(n.name)}</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>{n.count}</span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{
                    background: sp.background, color: sp.color, border: sp.border,
                    fontFamily: mono, fontSize: 11, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 999, display: 'inline-block',
                  }}>{n.avgScore}</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#10b981', textAlign: 'right' }}>{fmtK(n.totalOrders)}</span>
                <span style={{ fontFamily: mono, fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                  ${estDaily >= 1000 ? `${Math.round(estDaily / 1000)}k` : estDaily}
                </span>
                <span><ProductSparkline productId={seed} score={n.avgScore} width={80} height={22} points={7} /></span>
                <span style={{ textAlign: 'left' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: tier.bg, color: tier.color,
                    fontFamily: sans, fontSize: 11, fontWeight: 600,
                    padding: '3px 10px', borderRadius: 999,
                  }}>{tier.icon} {tier.label}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, glow }: { label: string; value: string; sub: string; accent: string; glow: string }) {
  return (
    <div style={{
      background: '#1c1c1c',
      border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 110,
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: glow, filter: 'blur(28px)', pointerEvents: 'none' }} />
      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 24, fontWeight: 800, color: '#f1f1f3', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
    </div>
  );
}
