import React from 'react';

interface StatCardsProps {
  products: any[];
}

export function ProductStatCards({ products }: StatCardsProps) {
  if (!products.length) return null;

  const brico = "'Bricolage Grotesque', sans-serif";

  const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.est_monthly_revenue_aud || 0), 0);
  const avgScore = Math.round(products.reduce((sum: number, p: any) => sum + (p.winning_score || 0), 0) / products.length);
  const bestMargin = Math.max(...products.map((p: any) => p.estimated_margin_pct || p.profit_margin || 0));
  const avgMargin = Math.round(products.reduce((sum: number, p: any) => sum + (p.estimated_margin_pct || p.profit_margin || 0), 0) / products.length);
  const highScore = products.filter((p: any) => (p.winning_score || 0) >= 80).length;
  const viralCount = products.filter((p: any) => (p.tags || []).includes('VIRAL')).length;

  const formatRev = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}m` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  const cards = [
    {
      icon: '\uD83D\uDD25',
      label: 'Trending Now',
      value: viralCount.toString(),
      sub: `${highScore} products score 80+`,
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      icon: '\u2B50',
      label: 'Avg AI Score',
      value: `${avgScore}/100`,
      sub: `${highScore} products above 80`,
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      icon: '\uD83D\uDCB0',
      label: 'Best Margin',
      value: `${bestMargin}%`,
      sub: `Avg ${avgMargin}% across all`,
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      icon: '\uD83D\uDCC8',
      label: 'Monthly Potential',
      value: formatRev(totalRevenue),
      sub: 'Combined est. revenue',
      color: '#6366F1',
      bg: '#EEF2FF',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(({ icon, label, value, sub, bg }) => (
        <div key={label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: '#0A0A0A', lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
