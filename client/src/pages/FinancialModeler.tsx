import { BarChart3, Copy, DollarSign, Loader2, Target, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { useActiveProduct } from '@/hooks/useActiveProduct';

interface PLRow {
  label: string;
  value: number;
  pct?: number;
}
interface ForecastMonth {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
  cumulative: number;
}

export default function FinancialModeler() {
  // Inputs
  const [productPrice, setProductPrice] = useState('');
  const [cogs, setCogs] = useState('');
  const [adSpend, setAdSpend] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const [monthlyUnits, setMonthlyUnits] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [growthRate, setGrowthRate] = useState('10');
  const { activeProduct } = useActiveProduct();

  useEffect(() => {
    if (activeProduct && activeProduct.summary) {
      const priceMatch = activeProduct.summary.match(/\$(\d+(?:\.\d{1,2})?)/);
      if (priceMatch && !productPrice) {
        const detectedPrice = parseFloat(priceMatch[1]);
        setProductPrice(String(detectedPrice));
        if (!cogs) {
          setCogs(String(Math.round(detectedPrice * 0.3 * 100) / 100));
        }
      }
    }
  }, [activeProduct]);

  // Output
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    plRows: PLRow[];
    breakEvenUnits: number;
    breakEvenDays: number;
    margin: number;
    roas: number;
    forecast: ForecastMonth[];
  } | null>(null);

  const handleGenerate = useCallback(async () => {
    const price = parseFloat(productPrice);
    const cost = parseFloat(cogs);
    const ads = parseFloat(adSpend);
    const cvr = parseFloat(conversionRate) / 100;
    const units = parseInt(monthlyUnits);
    const ship = parseFloat(shippingCost) || 0;
    const other = parseFloat(otherCosts) || 0;
    const growth = parseFloat(growthRate) / 100;

    if (!price || !cost || !ads || !cvr || !units) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));

    const revenue = price * units;
    const totalCogs = cost * units;
    const totalShipping = ship * units;
    const totalCosts = totalCogs + ads + totalShipping + other;
    const grossProfit = revenue - totalCogs - totalShipping;
    const netProfit = revenue - totalCosts;
    const margin = (netProfit / revenue) * 100;
    const cpa = ads / (units * cvr > 0 ? units : 1);
    const roas = revenue / (ads || 1);
    const profitPerUnit = price - cost - ship;
    const breakEvenUnits = Math.ceil((ads + other) / (profitPerUnit > 0 ? profitPerUnit : 1));
    const breakEvenDays = Math.ceil(breakEvenUnits / (units / 30));

    const plRows: PLRow[] = [
      { label: 'Revenue', value: revenue, pct: 100 },
      { label: 'COGS', value: -totalCogs, pct: -(totalCogs / revenue) * 100 },
      { label: 'Shipping', value: -totalShipping, pct: -(totalShipping / revenue) * 100 },
      { label: 'Gross Profit', value: grossProfit, pct: (grossProfit / revenue) * 100 },
      { label: 'Ad Spend', value: -ads, pct: -(ads / revenue) * 100 },
      { label: 'Other Costs', value: -other, pct: -(other / revenue) * 100 },
      { label: 'Net Profit', value: netProfit, pct: margin },
    ];

    const forecast: ForecastMonth[] = [];
    let cumulative = 0;
    for (let i = 0; i < 6; i++) {
      const factor = (1 + growth) ** i;
      const mUnits = Math.round(units * factor);
      const mRevenue = price * mUnits;
      const mCosts = (cost + ship) * mUnits + ads * factor + other;
      const mProfit = mRevenue - mCosts;
      cumulative += mProfit;
      forecast.push({
        month: `Month ${i + 1}`,
        revenue: Math.round(mRevenue),
        costs: Math.round(mCosts),
        profit: Math.round(mProfit),
        cumulative: Math.round(cumulative),
      });
    }

    setResult({ plRows, breakEvenUnits, breakEvenDays, margin, roas, forecast });
    setGenerating(false);
    toast.success('Financial model generated!');
    localStorage.setItem('majorka_milestone_model', 'true');
  }, [
    productPrice,
    cogs,
    adSpend,
    conversionRate,
    monthlyUnits,
    shippingCost,
    otherCosts,
    growthRate,
  ]);

  const copyTable = () => {
    if (!result) return;
    const text =
      result.plRows.map((r) => `${r.label}: $${r.value.toLocaleString()}`).join('\n') +
      `\n\nBreak-even: ${result.breakEvenUnits} units (${result.breakEvenDays} days)\nROAS: ${result.roas.toFixed(1)}x\nNet Margin: ${result.margin.toFixed(1)}%` +
      `\n\n6-Month Forecast:\n` +
      result.forecast
        .map(
          (f) =>
            `${f.month}: Revenue $${f.revenue.toLocaleString()} | Profit $${f.profit.toLocaleString()} | Cumulative $${f.cumulative.toLocaleString()}`
        )
        .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const maxRevenue = result ? Math.max(...result.forecast.map((f) => f.revenue)) : 0;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}
    >
      <ActiveProductBanner
        ctaLabel="Load into tool"
        onUseProduct={(summary) => {
          const priceMatch = summary.match(/\$(\d+(?:\.\d{1,2})?)/);
          if (priceMatch) {
            const detectedPrice = parseFloat(priceMatch[1]);
            setProductPrice(String(detectedPrice));
            setCogs(String(Math.round(detectedPrice * 0.3 * 100) / 100));
          }
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — Inputs */}
        <div
          className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)', scrollbarWidth: 'thin' }}
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(212,175,55,0.18)',
                border: '1px solid #C7D2FE',
              }}
            >
              <DollarSign size={15} style={{ color: '#d4af37' }} />
            </div>
            <div>
              <div className="text-sm font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
                Financial Modeler
              </div>
              <div className="text-xs" style={{ color: '#9CA3AF' }}>
                P&L · Break-even · Forecast
              </div>
            </div>
          </div>

          {[
            {
              label: 'Product Price ($)',
              value: productPrice,
              set: setProductPrice,
              placeholder: 'e.g. 49.99',
              required: true,
            },
            {
              label: 'Cost of Goods ($)',
              value: cogs,
              set: setCogs,
              placeholder: 'e.g. 12.50',
              required: true,
            },
            {
              label: 'Monthly Ad Spend ($)',
              value: adSpend,
              set: setAdSpend,
              placeholder: 'e.g. 2000',
              required: true,
            },
            {
              label: 'Conversion Rate (%)',
              value: conversionRate,
              set: setConversionRate,
              placeholder: 'e.g. 2.5',
              required: true,
            },
            {
              label: 'Monthly Units Sold',
              value: monthlyUnits,
              set: setMonthlyUnits,
              placeholder: 'e.g. 200',
              required: true,
            },
            {
              label: 'Shipping Cost per Unit ($)',
              value: shippingCost,
              set: setShippingCost,
              placeholder: 'e.g. 5.00',
            },
            {
              label: 'Other Monthly Costs ($)',
              value: otherCosts,
              set: setOtherCosts,
              placeholder: 'e.g. 300 (apps, tools)',
            },
            {
              label: 'Monthly Growth Rate (%)',
              value: growthRate,
              set: setGrowthRate,
              placeholder: 'e.g. 10',
            },
          ].map(({ label, value, set, placeholder, required }) => (
            <div key={label}>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
              >
                {label} {required && <span style={{ color: '#d4af37' }}>*</span>}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid #F5F5F5',
                  color: '#CBD5E1',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.68)')}
                onBlur={(e) => (e.target.style.borderColor = '#F5F5F5')}
              />
            </div>
          ))}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: generating
                ? '#C7D2FE'
                : 'linear-gradient(135deg, #d4af37, #3B82F6)',
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
              boxShadow: generating ? 'none' : '0 4px 20px #C7D2FE',
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Calculating…
              </>
            ) : (
              <>
                <BarChart3 size={14} /> Generate Model
              </>
            )}
          </button>
        </div>

        {/* RIGHT PANEL — Output */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
          {result ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Financial Model
                </h2>
                <SaveToProduct
                  toolId="financial-modeler"
                  toolName="Financial Modeler"
                  outputData={result}
                />
                <button
                  onClick={copyTable}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #F0F0F0',
                    color: '#CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={11} /> Copy All
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Net Margin',
                    value: `${result.margin.toFixed(1)}%`,
                    color: result.margin > 0 ? '#d4af37' : '#ff6b6b',
                    icon: TrendingUp,
                  },
                  {
                    label: 'ROAS',
                    value: `${result.roas.toFixed(1)}x`,
                    color: result.roas >= 2 ? '#d4af37' : result.roas >= 1 ? '#F59E0B' : '#ff6b6b',
                    icon: Target,
                  },
                  {
                    label: 'Break-even',
                    value: `${result.breakEvenUnits} units`,
                    color: '#7c6af5',
                    icon: BarChart3,
                  },
                  {
                    label: 'Break-even Days',
                    value: `${result.breakEvenDays}d`,
                    color: '#d4af37',
                    icon: DollarSign,
                  },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4"
                    style={{ background: `${color}08`, border: `1px solid ${color}25` }}
                  >
                    <Icon size={16} style={{ color, marginBottom: 8 }} />
                    <div
                      className="text-lg font-extrabold"
                      style={{ fontFamily: "'Syne', sans-serif", color }}
                    >
                      {value}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* P&L Table */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: '#05070F',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="text-xs font-extrabold uppercase tracking-widest"
                    style={{ color: '#d4af37', fontFamily: "'Syne', sans-serif" }}
                  >
                    Monthly P&L Statement
                  </div>
                </div>
                {result.plRows.map((row, i) => {
                  const isTotal = row.label === 'Net Profit' || row.label === 'Gross Profit';
                  return (
                    <div
                      key={row.label}
                      className="flex items-center px-4 py-2.5"
                      style={{
                        borderBottom:
                          i < result.plRows.length - 1
                            ? '1px solid #F9FAFB'
                            : 'none',
                        background: isTotal ? '#FAFAFA' : 'transparent',
                      }}
                    >
                      <span
                        className={`text-xs flex-1 ${isTotal ? 'font-bold' : ''}`}
                        style={{
                          fontFamily: isTotal ? "'Syne', sans-serif" : undefined,
                          color: '#CBD5E1',
                        }}
                      >
                        {row.label}
                      </span>
                      <span
                        className={`text-xs font-mono ${isTotal ? 'font-bold' : ''}`}
                        style={{ color: row.value >= 0 ? '#d4af37' : '#ff6b6b' }}
                      >
                        {row.value >= 0 ? '$' : '-$'}
                        {Math.abs(row.value).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      {row.pct !== undefined && (
                        <span
                          className="text-xs font-mono ml-3 w-14 text-right"
                          style={{ color: '#9CA3AF' }}
                        >
                          {row.pct >= 0 ? '' : ''}
                          {row.pct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 6-Month Forecast */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: '#05070F',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="text-xs font-extrabold uppercase tracking-widest"
                    style={{ color: '#7c6af5', fontFamily: "'Syne', sans-serif" }}
                  >
                    6-Month Revenue Forecast
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {result.forecast.map((f) => (
                    <div key={f.month}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                        >
                          {f.month}
                        </span>
                        <div className="flex gap-4 text-xs font-mono">
                          <span style={{ color: '#d4af37' }}>${f.revenue.toLocaleString()}</span>
                          <span style={{ color: f.profit >= 0 ? '#d4af37' : '#ff6b6b' }}>
                            P: ${f.profit.toLocaleString()}
                          </span>
                          <span style={{ color: f.cumulative >= 0 ? '#d4af37' : '#ff6b6b' }}>
                            Σ ${f.cumulative.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((f.revenue / maxRevenue) * 100, 100)}%`,
                            background: 'linear-gradient(90deg, #7c6af5, #9c5fff)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-5xl">📊</div>
              <div className="text-center">
                <div
                  className="text-base font-extrabold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Financial Model
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Enter your product economics on the left to generate a P&L statement, break-even
                  analysis, and 6-month revenue forecast.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
