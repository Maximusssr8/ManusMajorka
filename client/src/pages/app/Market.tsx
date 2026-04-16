import { useMemo } from 'react';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNicheStats } from '@/hooks/useNicheStats';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { cleanCategory, shortenCategory, fmtK } from '@/lib/categoryColor';

import { C } from '@/lib/designTokens';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontBody;

const surfaceBg = C.surface;
const surfaceBorder = '1px solid rgba(255,255,255,0.06)';

// ── Opportunity classification ─────────────────────────────────────────────
// Open:       <20 products with 90+ score (or product count <20)
// Competitive: 20–50 products
// Saturated:  50+ products
type TierKey = 'open' | 'competitive' | 'saturated';
interface Tier { key: TierKey; label: string; color: string; bg: string; border: string }

function tierFor(count: number): Tier {
  if (count < 20) return { key: 'open', label: 'Open', color: C.green, bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' };
  if (count <= 50) return { key: 'competitive', label: 'Competitive', color: C.amber, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)' };
  return { key: 'saturated', label: 'Saturated', color: C.red, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)' };
}

// ── Bar colour gradient: accent gold (1–3), teal (4–6), amber (7–10) ──────
function barColour(rank: number): string {
  if (rank < 3) return C.accent;
  if (rank < 6) return '#14b8a6';
  return C.amber;
}

function fmtBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

const MARKETS = [
  { flag: '🇦🇺', code: 'AU', active: true },
  { flag: '🇺🇸', code: 'US', active: false },
  { flag: '🇬🇧', code: 'UK', active: false },
  { flag: '🇨🇦', code: 'CA', active: false },
  { flag: '🇳🇿', code: 'NZ', active: false },
  { flag: '🇩🇪', code: 'DE', active: false },
  { flag: '🇸🇬', code: 'SG', active: false },
];

export default function Market() {
  const { niches, loading } = useNicheStats(15);
  const stats = useProductStats();
  // Pull the single hottest product for the market signals strip
  const hottest = useProducts({ limit: 1, orderBy: 'sold_count' });

  // Top 10 categories by total orders for the heatmap.
  const top10 = useMemo(() => {
    return [...niches]
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10)
      .map((n, i) => ({
        ...n,
        cleanName: cleanCategory(n.name),
        shortName: shortenCategory(n.name),
        rank: i,
        tier: tierFor(n.count),
      }));
  }, [niches]);

  // Top 3 opportunity cards — rank by (totalOrders * 0.7) − (count penalty).
  const top3 = useMemo(() => {
    return [...niches]
      .map((n) => {
        const opportunityScore = Math.log(1 + n.totalOrders) * 10 - n.count * 0.4 + n.avgScore * 0.3;
        return { ...n, cleanName: cleanCategory(n.name), opportunityScore };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 3);
  }, [niches]);

  const totalOrdersAll = niches.reduce((a, n) => a + n.totalOrders, 0);
  const hottestProduct = hottest.products[0];

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: C.text, fontFamily: sans }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: display, fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.025em', margin: '0 0 4px', lineHeight: 1.1,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #4f8ef7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Market Intelligence</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Category heatmap, opportunity scoring, and live market signals
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {MARKETS.map((m) => (
            <button key={m.code} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7,
              background: m.active ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${m.active ? 'rgba(79,142,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: m.active ? C.accentHover : 'rgba(255,255,255,0.4)',
              fontFamily: mono, fontSize: 11, fontWeight: m.active ? 600 : 400,
              cursor: 'pointer', flexShrink: 0,
            }}>
              <span>{m.flag}</span><span>{m.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Section A — Category Heatmap ──────────────────────── */}
      <SectionLabel text="Category Heatmap · top 10 by order volume" />
      <div style={{
        background: surfaceBg,
        border: surfaceBorder,
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        {loading ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: mono, fontSize: 12 }}>
            Loading market data…
          </div>
        ) : top10.length === 0 ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: mono, fontSize: 12 }}>
            No market data available yet
          </div>
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10}
                layout="vertical"
                margin={{ top: 4, right: 120, left: 8, bottom: 4 }}
                barSize={22}
                onClick={(data) => {
                  const active = data?.activePayload?.[0]?.payload as { cleanName?: string } | undefined;
                  if (active?.cleanName) {
                    window.location.href = `/app/products?category=${encodeURIComponent(active.cleanName)}`;
                  }
                }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => fmtBig(v)}
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  stroke="rgba(255,255,255,0.55)"
                  tick={{ fontSize: 11, fontFamily: C.fontBody, fill: '#d8d8e0' }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(79,142,247,0.06)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const n = payload[0].payload as typeof top10[number];
                    return (
                      <div style={{
                        background: C.surface,
                        border: '1px solid rgba(79,142,247,0.3)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontFamily: sans,
                        fontSize: 12,
                        minWidth: 180,
                      }}>
                        <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{n.cleanName}</div>
                        <div style={{ color: C.body, fontSize: 11 }}>
                          {fmtK(n.totalOrders)} orders · {n.count} products · avg score {n.avgScore}
                        </div>
                        <div style={{ marginTop: 4, color: n.tier.color, fontSize: 11, fontWeight: 600 }}>
                          {n.tier.label}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="totalOrders" radius={[0, 4, 4, 0]}>
                  {top10.map((entry, i) => (
                    <Cell key={i} fill={barColour(entry.rank)} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Opportunity badges row — aligns below the chart */}
        {!loading && top10.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {top10.map((n) => (
              <Link
                key={n.name}
                href={`/app/products?category=${encodeURIComponent(n.cleanName)}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: n.tier.bg,
                  border: `1px solid ${n.tier.border}`,
                  borderRadius: 999,
                  fontSize: 10,
                  fontFamily: mono,
                  fontWeight: 600,
                  color: n.tier.color,
                  textDecoration: 'none',
                }}
              >
                <span>{shortenCategory(n.name)}</span>
                <span style={{ opacity: 0.7 }}>·</span>
                <span>{n.tier.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Section B — Top 3 Opportunity Cards ────────────────── */}
      <SectionLabel text="Top 3 Opportunities · highest order volume vs competition" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="mj-shim" style={{ height: 170, borderRadius: 14 }} />
            ))
          : top3.map((n) => {
              const t = tierFor(n.count);
              return (
                <Link
                  key={n.name}
                  href={`/app/products?category=${encodeURIComponent(n.cleanName)}`}
                  style={{
                    display: 'block',
                    background: surfaceBg,
                    border: surfaceBorder,
                    borderLeft: `2px solid ${t.color}`,
                    borderRadius: 14,
                    padding: '20px 22px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 180ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                      fontFamily: mono, fontSize: 9, textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)',
                    }}>Opportunity</span>
                    <span style={{
                      fontFamily: mono, fontSize: 10, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 999,
                      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
                    }}>{t.label}</span>
                  </div>
                  <div style={{
                    fontFamily: display, fontSize: 22, fontWeight: 800, color: C.text,
                    letterSpacing: '-0.02em', marginBottom: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{shortenCategory(n.cleanName)}</div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <Stat label="Orders" value={fmtK(n.totalOrders)} />
                    <Stat label="Products" value={String(n.count)} />
                    <Stat label="Avg Score" value={`${n.avgScore}`} />
                  </div>
                  <div style={{ fontSize: 12, color: C.accentHover, fontWeight: 600 }}>
                    Browse {shortenCategory(n.cleanName)} products →
                  </div>
                </Link>
              );
            })}
      </div>

      {/* ── Section C — Market Signals Strip ────────────────────── */}
      <SectionLabel text="Market Signals · live from winning_products" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        marginBottom: 8,
      }}>
        <Signal
          label="Categories Tracked"
          value={stats.loading ? '…' : String(stats.categoryCount)}
          sub="Distinct niches in DB"
          color={C.accent}
        />
        <Signal
          label="Hottest Product"
          value={hottestProduct
            ? (hottestProduct.product_title || '').slice(0, 22) + ((hottestProduct.product_title || '').length > 22 ? '…' : '')
            : '—'}
          sub={hottestProduct?.sold_count ? `${fmtK(hottestProduct.sold_count)} orders` : ''}
          color={C.amber}
          smallValue
        />
        <Signal
          label="Avg Market Score"
          value={stats.loading ? '…' : `${stats.avgScore}/100`}
          sub={`Across ${stats.total.toLocaleString()} products`}
          color={C.green}
        />
        <Signal
          label="Total Monthly Orders"
          value={loading ? '…' : fmtBig(totalOrdersAll)}
          sub="Sum of tracked product volume"
          color={C.accentHover}
        />
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, marginTop: 4,
    }}>{text}</div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.text }}>{value}</div>
    </div>
  );
}

function Signal({ label, value, sub, color, smallValue }: { label: string; value: string; sub: string; color: string; smallValue?: boolean }) {
  return (
    <div style={{
      background: surfaceBg,
      border: surfaceBorder,
      borderLeft: `2px solid ${color}`,
      borderRadius: 14,
      padding: '18px 22px',
      minHeight: 110,
    }}>
      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{
        fontFamily: display, fontSize: smallValue ? 18 : 28, fontWeight: 800,
        color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>
    </div>
  );
}
