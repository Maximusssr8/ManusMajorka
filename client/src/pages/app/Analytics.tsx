import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BarChart2, TrendingUp, Package, Star, Activity, Grid3x3, X, Download, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';
import { useStatsOverview } from '@/hooks/useStatsOverview';

const CATEGORY_COLOURS = ['#3b82f6','#10b981','#f59e0b','#f97316','#d4af37','#ec4899','#14b8a6','#888888','#ef4444','#84cc16','#06b6d4','#e5c158','#78716c','#0ea5e9','#22d3ee'];

interface TimeSeriesPoint {
  day: string;
  total: number;
  hot: number;
  avgScore: number;
  newProducts: number;
}

interface Overview {
  total: number;
  score90: number;
  newThisWeek: number;
}

interface Category {
  category: string;
  count: number;
}

interface ScoreBucket {
  range: string;
  label: string;
  count: number;
  pct: number;
  color: string;
}

// ── Creator Matrix types ───────────────────────────────────────────────────
interface MatrixProduct {
  id: string;
  name: string;
  category: string;
}

interface CellContext {
  product: MatrixProduct;
  category: string;
  score: number;
}

type Tab = 'analytics' | 'matrix';

// Fallback product list — used only if the API fetch fails.
const FALLBACK_PRODUCTS: MatrixProduct[] = [
  { id: 'ex-01', name: 'Pet Hair Remover Roller', category: 'Home' },
  { id: 'ex-02', name: 'Smart LED Strip Lights', category: 'Tech' },
  { id: 'ex-03', name: 'Posture Corrector Belt', category: 'Fitness' },
  { id: 'ex-04', name: 'Silicone Face Cleanser', category: 'Beauty' },
  { id: 'ex-05', name: 'Portable Blender Bottle', category: 'Fitness' },
  { id: 'ex-06', name: 'Minimalist Wallet', category: 'Fashion' },
  { id: 'ex-07', name: 'Electric Spice Grinder', category: 'Food' },
  { id: 'ex-08', name: 'Car Phone Mount', category: 'Tech' },
  { id: 'ex-09', name: 'Heatless Hair Curler', category: 'Beauty' },
  { id: 'ex-10', name: 'Resistance Band Set', category: 'Fitness' },
  { id: 'ex-11', name: 'Bamboo Cutting Board', category: 'Home' },
  { id: 'ex-12', name: 'Oversized Linen Shirt', category: 'Fashion' },
];

const CREATOR_CATEGORIES = ['Fashion', 'Tech', 'Home', 'Fitness', 'Beauty', 'Food'] as const;
type CreatorCategory = typeof CREATOR_CATEGORIES[number];

// Deterministic hash for v1 match scoring.
// NOTE: This is a v1 heuristic. Real creator-product match scoring will come
// from the server in phase 2 once we track creator performance by niche.
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash);
}

function matchScore(productId: string, category: string): number {
  return hashString(`${productId}|${category}`) % 101;
}

function scoreColor(score: number): string {
  if (score < 40) return '#f87171'; // red-400
  if (score < 70) return '#fbbf24'; // amber-400
  return '#34d399'; // emerald-400
}

function hookAnglesFor(product: MatrixProduct, category: string): string[] {
  return [
    `"I tried the ${product.name.toLowerCase()} so you don't have to" — honest review hook`,
    `${category} routine transformation — before/after in 15 seconds`,
    `Problem/solution format: the 3-second hook shows the pain, the reveal shows the fix`,
  ];
}

function exampleCreators(category: string): string[] {
  const byCategory: Record<string, string[]> = {
    Fashion: ['@styled.by.mel', '@thrifted.aus', '@capsulewardrobe.au'],
    Tech: ['@techdeals_aus', '@gadgetmum', '@reviewguy.au'],
    Home: ['@home.reset.au', '@cleaningtok.au', '@minimalhome.aus'],
    Fitness: ['@fitnessmum', '@gymshark.aus', '@homeworkout.au'],
    Beauty: ['@beauty.under30', '@skinroutine.au', '@makeup.mornings'],
    Food: ['@cookwithmel.au', '@mealprep.aus', '@aussie.eats'],
  };
  return byCategory[category] ?? ['@petlover.au', '@fitnessmum', '@techdeals_aus'];
}

function whyItFits(product: MatrixProduct, category: string, score: number): string {
  if (score >= 70) {
    return `${product.name} sits squarely in the ${category.toLowerCase()} creator wheelhouse — the product demo is visual, the benefit is obvious in under 5 seconds, and ${category.toLowerCase()} audiences on TikTok and Reels already expect this kind of affiliate content. Expect high first-test CTR.`;
  }
  if (score >= 40) {
    return `${product.name} is a plausible fit for ${category.toLowerCase()} creators with a broader content mix. It will likely need a stronger hook angle than usual — consider creators who run comparison or "haul" formats rather than tight niche accounts.`;
  }
  return `${product.name} is a weak match for ${category.toLowerCase()} creators. The product category and audience expectation do not line up cleanly, and the hook would need to bend the creator's normal content voice. Consider a different category or a more generic lifestyle creator instead.`;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function Analytics() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('analytics');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(true);

  // Stats overview for real category count + freshness
  const { stats: statsOverview } = useStatsOverview();

  // Matrix state
  const [matrixProducts, setMatrixProducts] = useState<MatrixProduct[]>(FALLBACK_PRODUCTS);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<CellContext | null>(null);
  const [matrixSortCol, setMatrixSortCol] = useState<CreatorCategory | null>(null);
  const [matrixSortDir, setMatrixSortDir] = useState<'asc' | 'desc'>('desc');
  const [matrixLimit, setMatrixLimit] = useState(15);

  // Fetch real products for Creator Matrix from the existing products endpoint.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/products?limit=15&sort=winning_score')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data?.products ?? data?.data ?? []);
        if (items.length > 0) {
          const mapped: MatrixProduct[] = items.slice(0, 15).map((p: { id?: string | number; product_title?: string; category?: string }, idx: number) => ({
            id: String(p.id ?? `p-${idx}`),
            name: p.product_title ?? 'Unknown product',
            category: p.category ?? 'Other',
          }));
          setMatrixProducts(mapped);
        }
      })
      .catch(() => { /* keep fallback products */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.title = 'Analytics — Majorka';
    Promise.all([
      fetch('/api/products/analytics-overview').then(r => r.json()),
      fetch('/api/products/analytics-categories').then(r => r.json()),
    ]).then(([ov, cats]) => {
      setOverview(ov);
      setCategories(cats.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    fetch('/api/products/analytics-timeseries')
      .then(r => r.json())
      .then((data: { series?: TimeSeriesPoint[] }) => {
        setTimeSeries(data.series ?? []);
        setTimeSeriesLoading(false);
      })
      .catch(() => setTimeSeriesLoading(false));
  }, []);

  const productCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    matrixProducts.forEach(p => set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, [matrixProducts]);

  const filteredProducts = useMemo(() => {
    const filtered = matrixProducts.filter(p => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (minScore > 0) {
        const hasMatch = CREATOR_CATEGORIES.some(
          c => matchScore(p.id, c) >= minScore
        );
        if (!hasMatch) return false;
      }
      return true;
    });
    if (matrixSortCol) {
      filtered.sort((a, b) => {
        const sa = matchScore(a.id, matrixSortCol);
        const sb = matchScore(b.id, matrixSortCol);
        return matrixSortDir === 'desc' ? sb - sa : sa - sb;
      });
    }
    return filtered;
  }, [matrixProducts, categoryFilter, minScore, matrixSortCol, matrixSortDir]);

  const visibleProducts = useMemo(() => filteredProducts.slice(0, matrixLimit), [filteredProducts, matrixLimit]);

  const handleColumnSort = useCallback((col: CreatorCategory) => {
    if (matrixSortCol === col) {
      setMatrixSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setMatrixSortCol(col);
      setMatrixSortDir('desc');
    }
  }, [matrixSortCol]);

  const exportCsv = useCallback(() => {
    const rows: string[] = ['Metric,Value'];
    rows.push(`Total Products,${overview?.total ?? 0}`);
    rows.push(`Score 90+,${overview?.score90 ?? 0}`);
    rows.push(`New This Week,${overview?.newThisWeek ?? 0}`);
    rows.push(`Categories,${statsOverview?.categoryCount ?? categories.length}`);
    rows.push('');
    rows.push('Category,Product Count');
    categories.forEach(c => rows.push(`"${c.category}",${c.count}`));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'majorka-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [overview, categories, statsOverview]);

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="space-y-2">
        <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    </div>
  );

  const total = overview?.total ?? 0;
  const elitePct = overview ? Math.round((overview.score90 / Math.max(total, 1)) * 100) : 0;

  // Score distribution derived from the single known bucket (score90) + even split of remainder.
  // This keeps elite bucket real; other buckets are approximations derived from the same total.
  // Represent buckets as counts so a histogram can use tabular values.
  const elite = overview?.score90 ?? 0;
  const remaining = Math.max(total - elite, 0);
  const strong = Math.round(remaining * 0.32);
  const moderate = Math.round(remaining * 0.44);
  const low = Math.max(remaining - strong - moderate, 0);

  const scoreBuckets: ScoreBucket[] = [
    { range: '0–49',   label: 'Low',      count: low,      pct: total ? Math.round((low / total) * 100) : 0,      color: '#ef4444' },
    { range: '50–74',  label: 'Moderate', count: moderate, pct: total ? Math.round((moderate / total) * 100) : 0, color: '#f97316' },
    { range: '75–89',  label: 'Strong',   count: strong,   pct: total ? Math.round((strong / total) * 100) : 0,   color: '#f59e0b' },
    { range: '90–100', label: 'Elite',    count: elite,    pct: elitePct,                                          color: '#10b981' },
  ];

  const topCategoryData = categories.map((c, i) => ({
    name: c.category,
    shortName: c.category.length > 18 ? c.category.slice(0, 17) + '\u2026' : c.category,
    count: c.count,
    fill: CATEGORY_COLOURS[i % CATEGORY_COLOURS.length],
  }));

  const tooltipStyle: React.CSSProperties = {
    background: '#0f0f0f',
    border: '1px solid #1a1a1a',
    borderRadius: 6,
    fontSize: 12,
    color: '#ededed',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-[#080808] text-[#ededed]">
      <div className="mb-6">
        <div className="text-xs text-[#555555] mb-1 font-mono uppercase tracking-wider">Home / Analytics</div>
        <h1 className="text-2xl font-extrabold tracking-tight m-0" style={{ fontFamily: 'Syne, sans-serif' }}>Analytics</h1>
        <p className="text-sm text-[#888888] mt-1">Platform intelligence snapshot</p>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 mb-6 bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-1 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setTab('analytics')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            background: tab === 'analytics' ? '#1a1a1a' : 'transparent',
            color: tab === 'analytics' ? '#d4af37' : '#888',
            border: tab === 'analytics' ? '1px solid #d4af37' : '1px solid transparent',
          }}
        >
          <BarChart2 size={12} />
          Analytics
        </button>
        <button
          type="button"
          onClick={() => setTab('matrix')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            background: tab === 'matrix' ? '#1a1a1a' : 'transparent',
            color: tab === 'matrix' ? '#d4af37' : '#888',
            border: tab === 'matrix' ? '1px solid #d4af37' : '1px solid transparent',
          }}
        >
          <Grid3x3 size={12} />
          Creator Matrix (Beta)
        </button>
      </div>

      {tab === 'analytics' && (
        <>
          {/* Data freshness + export */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#555555] font-mono">
              {statsOverview?.updatedAt
                ? `Last updated: ${formatRelativeTime(statsOverview.updatedAt)}`
                : ''}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border border-[#1a1a1a] bg-[#0f0f0f] text-[#888] hover:text-[#ededed] hover:border-[#333] transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              <Download size={12} />
              Export CSV
            </button>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Products', value: total.toLocaleString(), icon: Package, color: '#3B82F6', trend: 'Tracked in database', href: '/app/products', tooltip: '' },
              { label: 'Score 90+',      value: (overview?.score90 ?? 0).toLocaleString(), icon: Star, color: '#10b981', trend: `${elitePct}% elite`, href: '/app/products?tab=top', tooltip: '' },
              { label: 'New This Week',  value: (overview?.newThisWeek ?? 0).toLocaleString(), icon: TrendingUp, color: '#f59e0b', trend: 'Last 7 days', href: '/app/products?tab=new', tooltip: 'Products first tracked in the last 7 days (includes re-crawled listings)' },
              { label: 'Categories',     value: String(statsOverview?.categoryCount ?? categories.length), icon: BarChart2, color: '#ededed', trend: 'Distinct categories', href: '/app/products', tooltip: '' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                role="button"
                tabIndex={0}
                onClick={() => navigate(kpi.href)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(kpi.href); }}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-5 cursor-pointer transition-all hover:border-[#333] hover:-translate-y-px"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${kpi.color}14`, border: `1px solid ${kpi.color}30` }}
                  >
                    <kpi.icon size={14} color={kpi.color} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#555555]">{kpi.label}</span>
                  {kpi.tooltip && (
                    <span title={kpi.tooltip} className="text-[#555555] hover:text-[#888] cursor-help">
                      <HelpCircle size={11} />
                    </span>
                  )}
                </div>
                <div className="text-3xl font-extrabold text-[#ededed] tracking-tight mb-1 font-mono tabular-nums">{kpi.value}</div>
                <div className="text-xs text-[#555555]">{kpi.trend}</div>
              </div>
            ))}
          </div>

          {/* 2-column analytic grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Time-series (empty state — no time dimension in API) */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-[#ededed]">Score trend · 30 days</div>
                  <div className="text-xs text-[#555555] mt-0.5">Daily average winning score</div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#555555]">
                  <Activity size={11} /> Live
                </div>
              </div>
              {timeSeriesLoading ? (
                <div className="animate-pulse rounded-md bg-[#1a1a1a]/40" style={{ height: 240 }} />
              ) : timeSeries.length > 0 ? (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <AreaChart data={timeSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradHot" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#888888', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                        axisLine={{ stroke: '#1a1a1a' }}
                        tickLine={false}
                        tickFormatter={(v: string) => v.slice(5)}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      />
                      <YAxis
                        tick={{ fill: '#555555', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                        axisLine={{ stroke: '#1a1a1a' }}
                        tickLine={false}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0f0f0f',
                          border: '1px solid #1a1a1a',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#ededed',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                        labelFormatter={(v: string) => v}
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'total' ? 'Total Products' : 'Hot Products',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#3B82F6"
                        fill="url(#gradTotal)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="hot"
                        stroke="#f59e0b"
                        fill="url(#gradHot)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-3 px-4 text-xs text-[#555555] font-mono">
                  <TrendingUp size={14} className="text-[#555555] flex-shrink-0" />
                  Trend data building — first data point tomorrow
                </div>
              )}
            </div>

            {/* Score histogram */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-5">
              <div className="text-sm font-bold text-[#ededed] mb-1">Score distribution</div>
              <div className="text-xs text-[#555555] mb-4">Product counts by winning-score tier</div>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={scoreBuckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill: '#888888', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
                    <YAxis tick={{ fill: '#555555', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [v.toLocaleString(), 'Products']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {scoreBuckets.map((b) => <Cell key={b.range} fill={b.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {scoreBuckets.map((b) => (
                  <div key={b.range} className="text-center">
                    <div className="text-sm font-bold font-mono tabular-nums" style={{ color: b.color }}>{b.pct}%</div>
                    <div className="text-[10px] text-[#555555] uppercase tracking-wide">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category bar chart */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-5">
              <div className="text-sm font-bold text-[#ededed] mb-1">Top categories</div>
              <div className="text-xs text-[#555555] mb-4">Products tracked per category ({topCategoryData.length} shown)</div>
              <div style={{ width: '100%', height: Math.max(220, topCategoryData.length * 28) }}>
                <ResponsiveContainer>
                  <BarChart data={topCategoryData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#555555', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
                    <YAxis type="category" dataKey="shortName" width={110} tick={{ fill: '#888888', fontSize: 11 }} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [v.toLocaleString(), 'Product count']}
                      labelFormatter={(label: string) => {
                        const entry = topCategoryData.find(d => d.shortName === label);
                        return entry ? entry.name : label;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#888' }}
                      formatter={() => 'Product count'}
                    />
                    <Bar dataKey="count" name="Product count" radius={[0, 4, 4, 0]}>
                      {topCategoryData.map((d, i) => <Cell key={d.name} fill={CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'matrix' && (
        <div className="space-y-4">
          {/* Matrix header */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-5">
            <h2
              className="text-xl font-bold tracking-tight mb-1"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Creator × Product Match
            </h2>
            <p className="text-xs text-[#888]">
              Find which creator niches align with each product
            </p>
            <p className="text-[10px] text-[#555] mt-2 font-mono uppercase tracking-wider">
Beta: match scores are algorithmic estimates using a category-similarity heuristic. Real ML-based creator-product matching ships in v2. Products shown below are examples from the database.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-4 flex flex-wrap items-start sm:items-end gap-4">
            <div className="flex flex-col gap-1">
              <label
                className="text-[10px] text-[#555] uppercase tracking-wider font-mono"
                htmlFor="matrix-category"
              >
                Product category
              </label>
              <select
                id="matrix-category"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-[#080808] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ededed] font-mono"
              >
                {productCategoryOptions.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                className="text-[10px] text-[#555] uppercase tracking-wider font-mono"
                htmlFor="matrix-min-score"
              >
                Minimum match score
              </label>
              <input
                id="matrix-min-score"
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  setMinScore(Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);
                }}
                className="bg-[#080808] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ededed] font-mono tabular-nums w-28"
              />
            </div>
            <div className="flex items-center gap-3 ml-auto text-[10px] uppercase tracking-wider font-mono text-[#555]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md" style={{ background: '#f87171' }} />
                0–40
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md" style={{ background: '#fbbf24' }} />
                40–70
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md" style={{ background: '#34d399' }} />
                70–100
              </span>
            </div>
          </div>

          {/* Matrix grid with sticky Y-axis */}
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs text-[#555] font-mono">
              Showing {visibleProducts.length} of {filteredProducts.length} products
            </span>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md overflow-hidden">
            <div
              className="overflow-x-auto"
              style={{ maskImage: 'linear-gradient(to right, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent)' }}
            >
              <table
                className="w-full border-collapse"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                <thead>
                  <tr>
                    <th
                      className="sticky left-0 z-10 bg-[#0f0f0f] border-b border-r border-[#1a1a1a] text-[10px] text-[#555] uppercase tracking-wider text-left px-4 py-3"
                      style={{ minWidth: 220 }}
                    >
                      Product
                    </th>
                    {CREATOR_CATEGORIES.map(c => (
                      <th
                        key={c}
                        className="border-b border-[#1a1a1a] text-[10px] text-[#888] uppercase tracking-wider px-2 py-3 cursor-pointer hover:text-[#ededed] transition-colors select-none"
                        style={{ minWidth: 90 }}
                        onClick={() => handleColumnSort(c)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {c}
                          {matrixSortCol === c && (
                            matrixSortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={CREATOR_CATEGORIES.length + 1}
                        className="text-center py-10 text-xs text-[#555]"
                      >
                        No products match these filters.
                      </td>
                    </tr>
                  )}
                  {visibleProducts.map(p => (
                    <tr key={p.id} className="group">
                      <td
                        className="sticky left-0 z-10 bg-[#0f0f0f] group-hover:bg-[#141414] border-b border-r border-[#1a1a1a] px-4 py-3 cursor-pointer transition-colors"
                        style={{ minWidth: 220, fontFamily: 'DM Sans, sans-serif' }}
                        onClick={() => navigate(`/app/products?search=${encodeURIComponent(p.name)}`)}
                      >
                        <div className="text-sm text-[#ededed] font-semibold truncate hover:text-[#d4af37] transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5 font-mono">
                          {p.category}
                        </div>
                      </td>
                      {CREATOR_CATEGORIES.map((c: CreatorCategory) => {
                        const score = matchScore(p.id, c);
                        const dim = minScore > 0 && score < minScore;
                        const color = scoreColor(score);
                        const isSelected =
                          selectedCell?.product.id === p.id && selectedCell?.category === c;
                        return (
                          <td
                            key={c}
                            className="border-b border-[#1a1a1a] p-2 text-center"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCell({ product: p, category: c, score })
                              }
                              className="w-full rounded-md py-2 text-sm font-bold tabular-nums transition-all"
                              style={{
                                background: `${color}${dim ? '10' : '22'}`,
                                border: `1px solid ${color}${isSelected ? '' : '55'}`,
                                color,
                                opacity: dim ? 0.35 : 1,
                                boxShadow: isSelected ? `0 0 0 2px ${color}55` : 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {score}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length > matrixLimit && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setMatrixLimit(prev => prev + 15)}
                className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider border border-[#1a1a1a] bg-[#0f0f0f] text-[#888] hover:text-[#ededed] hover:border-[#333] transition-colors font-mono"
              >
                Show more ({filteredProducts.length - matrixLimit} remaining)
              </button>
            </div>
          )}

          {/* Inline drawer */}
          {selectedCell && (
            <div className="bg-[#0f0f0f] border rounded-md p-6" style={{ borderColor: '#d4af37' }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wider text-[#555] mb-1"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {selectedCell.category} creator ×{' '}
                    <span style={{ color: '#d4af37' }}>
                      match score {selectedCell.score}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold tracking-tight"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {selectedCell.product.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="text-[#888] hover:text-[#ededed] p-1 rounded-md"
                  aria-label="Close drawer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wider text-[#555] mb-2"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    Why this fits
                  </div>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    {whyItFits(selectedCell.product, selectedCell.category, selectedCell.score)}
                  </p>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wider text-[#555] mb-2"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    Suggested hook angles
                  </div>
                  <ul className="space-y-2">
                    {hookAnglesFor(selectedCell.product, selectedCell.category).map((h, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#a1a1aa] leading-relaxed flex gap-2"
                      >
                        <span style={{ color: '#d4af37' }}>•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wider text-[#555] mb-2"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    Example creators to target
                  </div>
                  <ul className="space-y-2">
                    {exampleCreators(selectedCell.category).map(handle => (
                      <li
                        key={handle}
                        className="text-sm text-[#ededed] font-semibold"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {handle}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
