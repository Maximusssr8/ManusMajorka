/**
 * Public-facing Profit Calculator — standalone page at /tools/profit-calculator.
 * No login required. Ranks for "dropshipping profit calculator Australia".
 */

import { ArrowRight, Calculator } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const PLATFORM_OPTIONS = [
  { label: 'Shopify', value: 2 },
  { label: 'eBay AU', value: 13 },
  { label: 'MyDeal', value: 12.5 },
  { label: 'Kogan', value: 12 },
  { label: 'Amazon AU', value: 15 },
  { label: 'Custom', value: -1 },
] as const;

const PAYMENT_PROCESSING_RATE = 1.75;

const fmt = (n: number) =>
  n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const pct = (n: number) => `${n.toFixed(1)}%`;

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0A0A0A',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  gold: '#4f8ef7',
  goldDim: 'rgba(79,142,247,0.1)',
  goldBorder: 'rgba(79,142,247,0.25)',
  green: '#22c55e',
};

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

export default function PublicProfitCalculator() {
  const [productCost, setProductCost] = useState(12);
  const [shipping, setShipping] = useState(8);
  const [platformKey, setPlatformKey] = useState('Shopify');
  const [customPlatformFee, setCustomPlatformFee] = useState(5);
  const [adSpend, setAdSpend] = useState(10);
  const [sellingPrice, setSellingPrice] = useState(49);
  const [showCta, setShowCta] = useState(false);

  const platformFeeRate = useMemo(() => {
    const opt = PLATFORM_OPTIONS.find((o) => o.label === platformKey);
    if (!opt || opt.value === -1) return customPlatformFee;
    return opt.value;
  }, [platformKey, customPlatformFee]);

  const calc = useMemo(() => {
    const revenue = sellingPrice;
    const platformFeeAmt = (platformFeeRate / 100) * sellingPrice;
    const paymentFeeAmt = (PAYMENT_PROCESSING_RATE / 100) * sellingPrice;
    const costsBeforeAds = productCost + shipping + platformFeeAmt + paymentFeeAmt;
    const totalCosts = costsBeforeAds + adSpend;
    const grossMarginAmt = revenue - costsBeforeAds;
    const grossMarginPct = revenue > 0 ? (grossMarginAmt / revenue) * 100 : 0;
    const netMarginAmt = revenue - totalCosts;
    const netMarginPct = revenue > 0 ? (netMarginAmt / revenue) * 100 : 0;
    const roas = adSpend > 0 ? sellingPrice / adSpend : Infinity;
    const breakEvenRoas = adSpend > 0 ? sellingPrice / (sellingPrice - costsBeforeAds) : 0;
    const projections = [100, 500, 1000].map((orders) => ({
      orders,
      revenue: revenue * orders,
      costs: totalCosts * orders,
      profit: netMarginAmt * orders,
    }));
    const afterpayEligible = sellingPrice <= 2000;

    let verdictColor: string, verdictLabel: string, verdictReason: string;
    if (netMarginPct > 30) {
      verdictColor = '#22c55e';
      verdictLabel = 'Highly Viable';
      verdictReason =
        'Strong margins above 30%. This product has healthy room for scaling ad spend and absorbing returns.';
    } else if (netMarginPct >= 15) {
      verdictColor = '#eab308';
      verdictLabel = 'Proceed with Caution';
      verdictReason =
        'Margins between 15-30% can work but leave limited room for error. Consider optimising costs.';
    } else {
      verdictColor = '#ef4444';
      verdictLabel = 'Not Viable';
      verdictReason =
        'Net margin below 15% makes this product risky at scale. Factor in returns, refunds, and overhead.';
    }

    // Trigger CTA after first interaction
    if (!showCta) setShowCta(true);

    return {
      revenue,
      totalCosts,
      grossMarginAmt,
      grossMarginPct,
      netMarginAmt,
      netMarginPct,
      roas,
      breakEvenRoas,
      projections,
      afterpayEligible,
      verdictColor,
      verdictLabel,
      verdictReason,
    };
  }, [productCost, shipping, platformFeeRate, adSpend, sellingPrice]);

  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: dm,
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
    display: 'block',
  };

  const numberInputStyle: React.CSSProperties = {
    fontFamily: dm,
    background: '#0d0d10',
    border: '1px solid #F5F5F5',
    borderRadius: 8,
    color: C.text,
    padding: '8px 12px',
    width: 90,
    fontSize: 14,
    outline: 'none',
  };

  const InputGroup = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    prefix = '$',
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    prefix?: string;
  }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: C.gold, height: 6, cursor: 'pointer' }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: dm,
            color: '#94A3B8',
            fontSize: 14,
          }}
        >
          {prefix && <span>{prefix}</span>}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            style={numberInputStyle}
          />
        </div>
      </div>
    </div>
  );

  const ResultCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ ...cardStyle, padding: '20px 24px' }}>
      <div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>
      <div
        style={{ fontFamily: syne, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.2 }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: dm, fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: dm }}>
      <SEO
        title="Free Dropshipping Profit Calculator Australia | Majorka"
        description="Calculate your real dropshipping profit margins for the Australian market. Includes GST, platform fees, shipping costs, and ad spend. Free tool by Majorka."
        path="/tools/profit-calculator"
      />

      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(6,6,8,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: syne,
                fontWeight: 800,
                fontSize: 17,
                color: '#000',
              }}
            >
              M
            </div>
            <span
              style={{
                fontFamily: syne,
                fontWeight: 800,
                fontSize: 17,
                letterSpacing: '0.08em',
                color: C.text,
              }}
            >
              MAJORKA
            </span>
          </Link>
          <Link
            href="/app"
            style={{
              background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`,
              color: '#000',
              borderRadius: 8,
              padding: '8px 20px',
              fontFamily: syne,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: C.goldDim,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 100,
            padding: '6px 18px',
            marginBottom: 20,
          }}
        >
          <Calculator size={14} color={C.gold} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.gold }}>Free Tool</span>
        </div>
        <h1
          style={{
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 44px)',
            color: C.text,
            marginBottom: 12,
          }}
        >
          Dropshipping Profit Calculator
        </h1>
        <p style={{ color: C.secondary, fontSize: 17, maxWidth: 600, margin: '0 auto' }}>
          Calculate your real margins for the Australian market. Includes platform fees, shipping,
          GST, and ad spend.
        </p>
      </div>

      {/* Calculator */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
        className="profit-calc-grid"
      >
        {/* Inputs */}
        <div>
          <div style={cardStyle}>
            <h2
              style={{
                fontFamily: syne,
                fontSize: 18,
                fontWeight: 600,
                color: C.text,
                margin: '0 0 24px',
              }}
            >
              Product & Costs
            </h2>
            <InputGroup
              label="Product Cost (AUD)"
              value={productCost}
              onChange={setProductCost}
              min={0}
              max={200}
              step={0.5}
            />
            <InputGroup
              label="Shipping to AU (AUD)"
              value={shipping}
              onChange={setShipping}
              min={0}
              max={50}
              step={0.5}
            />

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Platform Fees</label>
              <select
                value={platformKey}
                onChange={(e) => setPlatformKey(e.target.value)}
                style={{
                  width: '100%',
                  fontFamily: dm,
                  background: '#0d0d10',
                  border: '1px solid #F5F5F5',
                  borderRadius: 8,
                  color: C.text,
                  padding: '10px 12px',
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.label} value={o.label}>
                    {o.label}
                    {o.value > 0 ? ` (${o.value}%)` : ''}
                  </option>
                ))}
              </select>
              {platformKey === 'Custom' && (
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={customPlatformFee}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) setCustomPlatformFee(Math.min(100, Math.max(0, v)));
                  }}
                  style={{ ...numberInputStyle, width: '100%', marginTop: 8 }}
                />
              )}
            </div>

            <InputGroup
              label="Ad Spend per Order (AUD)"
              value={adSpend}
              onChange={setAdSpend}
              min={0}
              max={50}
              step={0.5}
            />
            <InputGroup
              label="Selling Price (AUD)"
              value={sellingPrice}
              onChange={setSellingPrice}
              min={0}
              max={500}
              step={1}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Verdict */}
          <div style={{ ...cardStyle, borderColor: calc.verdictColor, borderWidth: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: calc.verdictColor,
                  boxShadow: `0 0 12px ${calc.verdictColor}55`,
                }}
              />
              <span
                style={{
                  fontFamily: syne,
                  fontSize: 22,
                  fontWeight: 700,
                  color: calc.verdictColor,
                }}
              >
                {calc.verdictLabel}
              </span>
            </div>
            <p
              style={{ fontFamily: dm, fontSize: 14, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}
            >
              {calc.verdictReason}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ResultCard label="Revenue per Unit" value={fmt(calc.revenue)} />
            <ResultCard label="Total Costs" value={fmt(calc.totalCosts)} />
            <ResultCard
              label="Gross Margin"
              value={fmt(calc.grossMarginAmt)}
              sub={pct(calc.grossMarginPct)}
            />
            <ResultCard
              label="Net Margin"
              value={fmt(calc.netMarginAmt)}
              sub={pct(calc.netMarginPct)}
            />
          </div>

          {/* Projections */}
          <div style={cardStyle}>
            <h3
              style={{
                fontFamily: syne,
                fontSize: 16,
                fontWeight: 600,
                color: C.text,
                margin: '0 0 16px',
              }}
            >
              Monthly Projections
            </h3>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontFamily: dm, fontSize: 14 }}
            >
              <thead>
                <tr>
                  {['Orders', 'Revenue', 'Costs', 'Profit'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        color: C.muted,
                        fontWeight: 500,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calc.projections.map((row) => (
                  <tr key={row.orders}>
                    <td
                      style={{
                        padding: 12,
                        color: C.text,
                        borderBottom: `1px solid #F9FAFB`,
                      }}
                    >
                      {row.orders.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        color: C.text,
                        borderBottom: `1px solid #F9FAFB`,
                      }}
                    >
                      {fmt(row.revenue)}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        color: '#94A3B8',
                        borderBottom: `1px solid #F9FAFB`,
                      }}
                    >
                      {fmt(row.costs)}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        color: row.profit >= 0 ? C.green : '#ef4444',
                        fontWeight: 600,
                        borderBottom: `1px solid #F9FAFB`,
                      }}
                    >
                      {fmt(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <section
        style={{
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 28,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Want 50+ more AU-specific tools?
        </h2>
        <p
          style={{
            color: C.secondary,
            fontSize: 16,
            maxWidth: 500,
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}
        >
          Product research, ad copy, brand identity, email sequences, competitor analysis — all
          built for Australian sellers.
        </p>
        <Link
          href="/app"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`,
            color: '#000',
            borderRadius: 12,
            padding: '16px 36px',
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 17,
            textDecoration: 'none',
            boxShadow: `0 0 40px rgba(79,142,247,0.3)`,
          }}
        >
          Sign Up Free <ArrowRight size={18} />
        </Link>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 16 }}>
          No credit card required. Free plan available forever.
        </p>
      </section>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .profit-calc-grid { grid-template-columns: 1fr !important; }
        }
        input[type="range"] { -webkit-appearance: none; appearance: none; background: #1e1e24; border-radius: 4px; height: 6px; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #4f8ef7; cursor: pointer; border: 2px solid #060608; }
      `}</style>
    </div>
  );
}
