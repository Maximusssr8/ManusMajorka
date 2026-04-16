import React from 'react';

interface StatCardsProps {
  products: any[];
}

export function ProductStatCards({ products }: StatCardsProps) {
  if (!products.length) return null;

  const brico = "'Syne', sans-serif";

  const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.est_monthly_revenue_aud || 0), 0);
  const avgScore = Math.round(products.reduce((sum: number, p: any) => sum + (p.winning_score || 0), 0) / products.length);
  const bestMargin = Math.max(...products.map((p: any) => p.estimated_margin_pct || 0));
  const avgMargin = Math.round(products.reduce((sum: number, p: any) => sum + (p.estimated_margin_pct || 0), 0) / products.length);
  const highScore = products.filter((p: any) => (p.winning_score || 0) >= 65).length;
  // "Trending" = tiktok_signal true, or trend='up', or score>=65, or VIRAL tag
  const trendingCount = products.filter((p: any) =>
    p.tiktok_signal === true ||
    p.trend === 'up' ||
    (p.winning_score || 0) >= 65 ||
    (p.tags || []).includes('VIRAL')
  ).length;

  const formatRev = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}m` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  const cards = [
    {
      icon: '\uD83D\uDD25',
      label: 'Trending Now',
      value: trendingCount.toString(),
      sub: `${highScore} products score 65+`,
      color: '#A78BFA',
      bg: 'rgba(124,58,237,0.12)',
    },
    {
      icon: '\u2B50',
      label: 'Avg AI Score',
      value: `${avgScore}/100`,
      sub: `${highScore} products above 65`,
      color: '#FCD34D',
      bg: 'rgba(217,119,6,0.12)',
    },
    {
      icon: '\uD83D\uDCB0',
      label: 'Best Margin',
      value: bestMargin > 0 ? `${bestMargin}%` : '—',
      sub: avgMargin > 0 ? `Avg ${avgMargin}% across all` : 'No margin data',
      color: '#34D399',
      bg: 'rgba(5,150,105,0.12)',
    },
    ...(totalRevenue > 0 ? [{
      icon: '\uD83D\uDCC8',
      label: 'Monthly Potential',
      value: formatRev(totalRevenue),
      sub: 'Combined est. revenue',
      color: '#6ba3ff',
      bg: 'rgba(79,142,247,0.12)',
    }] : []),
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
      {cards.map(({ icon, label, value, sub, bg, color }) => (
        <div key={label} style={{ background: '#0D1424', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: color, lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
