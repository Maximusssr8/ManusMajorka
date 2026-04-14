import { useMemo } from 'react';

const brico = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

export default function PublicProfitShare() {
  const params = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return {
      price: parseFloat(sp.get('price') || '0'),
      cost: parseFloat(sp.get('cost') || '0'),
      units: parseFloat(sp.get('units') || '1'),
      ads: parseFloat(sp.get('ads') || '0'),
      product: sp.get('product') || '',
    };
  }, []);

  const { price, cost, units, ads, product } = params;

  // Calculations (matching ProductProfitCalc logic)
  const shipping = 12;
  const platformFee = price * 0.02;
  const paymentFee = price * 0.0175;
  const returnCost = cost * 0.07;
  const adCostPerUnit = ads / Math.max(units, 0.1);
  const netPerUnit = price - cost - shipping - platformFee - paymentFee - returnCost - adCostPerUnit;
  const marginPct = price > 0 ? (netPerUnit / price) * 100 : 0;
  const dailyProfit = netPerUnit * units;
  const monthlyProfit = dailyProfit * 30;
  const breakEvenCPA = price - cost - shipping - platformFee - paymentFee - returnCost;
  const roas = ads > 0 ? (price * units) / ads : 0;

  const viable = marginPct >= 40 ? 'high' : marginPct >= 25 ? 'viable' : 'risky';
  const viableConfig = {
    high: { label: 'Highly Viable', color: '#059669', bg: '#DCFCE7', border: '#86EFAC' },
    viable: { label: 'Viable', color: '#D97706', bg: '#FEF9C3', border: '#FDE68A' },
    risky: { label: 'Risky', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  }[viable];

  const fmtAUD = (n: number) => `$${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!price && !cost) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: dm }}>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, marginBottom: 8 }}>No Profit Data</div>
          <div style={{ color: '#94A3B8', fontSize: 14, marginBottom: 24 }}>This share link is missing pricing data.</div>
          <a href="https://www.majorka.io/tools/profit-calculator" style={{ color: '#d4af37', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Calculate profit for your own products →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F0EDE8', fontFamily: dm }}>
      {/* Minimal nav */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="https://www.majorka.io" style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: '#d4af37', textDecoration: 'none' }}>
          Majorka
        </a>
      </div>

      {/* Results card */}
      <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px' }}>
        {product && (
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, marginBottom: 20, color: '#F0EDE8', textAlign: 'center' as const }}>
            {product}
          </div>
        )}

        {/* Viability badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: viableConfig.bg, border: `1px solid ${viableConfig.border}`, borderRadius: 999, padding: '6px 16px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: viableConfig.color }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: viableConfig.color }}>{viableConfig.label}</span>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Net Margin', value: `${marginPct.toFixed(1)}%`, color: marginPct >= 40 ? '#10B981' : marginPct >= 25 ? '#F59E0B' : '#EF4444' },
            { label: 'Monthly Profit', value: fmtAUD(monthlyProfit), color: monthlyProfit >= 0 ? '#10B981' : '#EF4444' },
            { label: 'Daily Profit', value: fmtAUD(dailyProfit), color: dailyProfit >= 0 ? '#10B981' : '#EF4444' },
            { label: 'Break-even CPA', value: fmtAUD(breakEvenCPA), color: '#d4af37' },
            { label: 'ROAS', value: `${roas.toFixed(2)}x`, color: roas >= 2 ? '#10B981' : roas >= 1 ? '#F59E0B' : '#EF4444' },
            { label: 'Units/Day', value: String(units), color: '#94A3B8' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontFamily: brico, fontWeight: 900, fontSize: 22, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Assumptions */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Assumptions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Sell Price', val: fmtAUD(price) },
              { label: 'Supplier Cost', val: fmtAUD(cost) },
              { label: 'Ad Spend/Day', val: fmtAUD(ads) },
              { label: 'Shipping', val: fmtAUD(shipping) },
            ].map(a => (
              <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', padding: '4px 0' }}>
                <span>{a.label}</span>
                <span style={{ fontWeight: 600, color: '#D1D5DB' }}>{a.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' as const }}>
          <a href="https://www.majorka.io/tools/profit-calculator"
            style={{ display: 'inline-block', padding: '14px 28px', background: '#d4af37', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: brico, textDecoration: 'none', transition: 'transform 150ms' }}>
            Calculate profit for your own products →
          </a>
          <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
            Powered by <a href="https://www.majorka.io" style={{ color: '#d4af37', textDecoration: 'none' }}>Majorka</a>
          </div>
        </div>
      </div>
    </div>
  );
}
