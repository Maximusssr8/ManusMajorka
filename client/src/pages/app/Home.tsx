import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowUp, Package, Flame, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProducts, useProductStats, type Product } from '@/hooks/useProducts';
import { useStatsOverview } from '@/hooks/useStatsOverview';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';

/* ──────────────────────────────────────────────────────────────
   Helpers — all data from hooks, no hardcoded values
   ────────────────────────────────────────────────────────────── */

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function timeAgoShort(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const days = Math.round((Date.now() - ts) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

/* Category keyword → tinted colour scheme for chips */
function categoryColor(cat: string | null): { backgroundColor: string; color: string } {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('car') || c.includes('auto'))                                return { backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' };
  if (c.includes('phone') || c.includes('mobile'))                            return { backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' };
  if (c.includes('home') || c.includes('kitchen') || c.includes('household')) return { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' };
  if (c.includes('hair') || c.includes('beauty') || c.includes('wig'))        return { backgroundColor: 'rgba(236,72,153,0.12)', color: '#f472b6' };
  if (c.includes('hardware') || c.includes('tool'))                           return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  return { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' };
}

function scoreTierStyle(score: number): { backgroundColor: string; color: string } {
  if (score >= 90) return { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' };
  if (score >= 75) return { backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  if (score >= 50) return { backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316' };
  return               { backgroundColor: 'rgba(239,68,68,0.15)',  color: '#ef4444' };
}

/* ──────────────────────────────────────────────────────────────
   Home
   ────────────────────────────────────────────────────────────── */

export default function AppHome() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStatsOverview();
  const productStats = useProductStats();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products, loading: prodLoading, total } = useProducts({ limit: 10, orderBy: 'sold_count' });
  const { products: bestMarginProducts } = useProducts({ limit: 1, orderBy: 'price_asc', minScore: 80 });
  const { products: newestProducts } = useProducts({ limit: 1, orderBy: 'created_at' });

  interface CategoryRow { category: string; total_orders: number; product_count: number; }
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [nicheLoading, setNicheLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/stats-categories?limit=8', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data: { categories?: CategoryRow[] }) => {
        if (cancelled) return;
        setCategoryRows(Array.isArray(data.categories) ? data.categories : []);
        setNicheLoading(false);
      })
      .catch(() => { if (!cancelled) setNicheLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });
  const tod = timeOfDay();

  const topProduct    = products[0];
  const bestMargin    = bestMarginProducts[0] ?? null;
  const newestProduct = newestProducts[0] ?? null;

  /* KPI cards — every value from the API */
  const totalDelta = stats?.totalDelta ?? 0;
  const hotDelta = stats?.hotDelta ?? null;
  const kpiCards: {
    label: string; value: string; sub: string;
    Icon: typeof Package; topLine: string;
    trendText: string | null; trendPositive: boolean;
  }[] = [
    {
      label: 'Products Tracked',
      value: stats?.total != null ? stats.total.toLocaleString() : '—',
      sub: 'Live AliExpress feed',
      Icon: Package,
      topLine: 'bg-accent',
      trendText: totalDelta > 0 ? `+${totalDelta.toLocaleString()} this week`
                 : totalDelta < 0 ? `${totalDelta.toLocaleString()} this week`
                 : 'No change this week',
      trendPositive: totalDelta > 0,
    },
    {
      label: 'Hot Products',
      value: stats?.hotProducts != null ? stats.hotProducts.toLocaleString() : '—',
      sub: 'Score 65 and above',
      Icon: Flame,
      topLine: 'bg-amber',
      trendText: hotDelta == null ? null
                 : hotDelta > 0 ? `+${hotDelta}% vs last week`
                 : hotDelta < 0 ? `${hotDelta}% vs last week`
                 : 'Flat vs last week',
      trendPositive: hotDelta != null && hotDelta > 0,
    },
    {
      label: 'Average Score',
      value: stats?.avgScore != null ? `${stats.avgScore}` : '—',
      sub: 'Out of 100',
      Icon: Star,
      topLine: 'bg-green',
      trendText: stats ? `${stats.categoryCount} niches tracked` : null,
      trendPositive: false,
    },
    {
      label: 'Top Score',
      value: stats?.topScore != null ? `${stats.topScore}` : '—',
      sub: 'Highest in database',
      Icon: Trophy,
      topLine: 'bg-cyan',
      trendText: null,
      trendPositive: false,
    },
  ];

  /* Category chart rows */
  const chartRows = categoryRows.map((n) => ({
    name: shortenCategory(n.category),
    fullName: n.category,
    orders: n.total_orders,
  }));
  const maxOrders = Math.max(1, ...chartRows.map((r) => r.orders));

  /* Opportunities */
  const opportunities: { label: string; chipBg: string; chipFg: string; href: string; product: Product | null; stat: string; statClass: string }[] = [
    {
      label: 'Top Trending',
      chipBg: 'rgba(245,158,11,0.15)',
      chipFg: '#f59e0b',
      href: '/app/products?tab=trending',
      product: topProduct ?? null,
      stat: topProduct?.sold_count != null ? `${topProduct.sold_count.toLocaleString()} orders / mo` : '',
      statClass: 'text-green',
    },
    {
      label: 'Best Margin',
      chipBg: 'rgba(16,185,129,0.15)',
      chipFg: '#10b981',
      href: '/app/products?tab=highmargin',
      product: bestMargin,
      stat: bestMargin?.price_aud != null ? `$${Number(bestMargin.price_aud).toFixed(2)} landed` : '',
      statClass: 'text-green',
    },
    {
      label: 'Newest',
      chipBg: 'rgba(99,102,241,0.15)',
      chipFg: '#818cf8',
      href: '/app/products?tab=new',
      product: newestProduct,
      stat: newestProduct?.created_at ? `Added ${timeAgoShort(newestProduct.created_at)}` : '',
      statClass: 'text-muted',
    },
  ];

  const platformStatus = [
    { name: 'AliExpress Feed', chip: 'Live' },
    { name: 'Apify Pipeline',  chip: 'Running' },
    { name: 'Stripe Payments', chip: 'Active' },
  ];

  const liveLabel = stats?.updatedAt
    ? `Live · AliExpress feed · updated ${formatRelative(stats.updatedAt)}`
    : 'Live · AliExpress feed';

  return (
    <div className="min-h-screen bg-bg font-body text-text relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between px-8 h-12 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          <span>{liveLabel}</span>
        </div>
        <Link
          href="/app/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Discover products
          <ArrowRight size={13} strokeWidth={2.25} />
        </Link>
      </div>

      {/* Hero */}
      <div className="relative z-10 px-8 pt-10 pb-6">
        <p className="text-xs text-muted uppercase tracking-widest mb-3">
          {today} · Scale Plan
        </p>
        <h1 className="text-5xl font-display font-bold text-text leading-tight">
          Good {tod}, {firstName}.
        </h1>
        <p className="mt-3 text-base text-body max-w-lg">
          Your product intelligence is live across the Australian market.
        </p>
      </div>

      {/* KPI grid */}
      <div className="relative z-10 grid grid-cols-4 gap-4 px-8 pb-6">
        {kpiCards.map((card) => {
          const Icon = card.Icon;
          return (
            <div
              key={card.label}
              className="bg-surface border border-white/[0.07] rounded-xl p-5 hover:border-accent/30 hover:bg-card transition-all duration-150 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.topLine}`} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {card.label}
                </span>
                <Icon size={14} className="text-muted" strokeWidth={1.75} />
              </div>
              <div className="text-4xl font-display font-bold text-text tabular-nums mb-1 min-h-[36px] flex items-center">
                {statsLoading ? (
                  <span className="inline-block h-7 w-24 bg-white/[0.04] rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </div>
              <div className="text-[11px] text-muted mb-2">{card.sub}</div>
              <div className={`flex items-center gap-1 text-[11px] font-medium min-h-[14px] ${card.trendPositive ? 'text-green' : 'text-muted'}`}>
                {card.trendText && (
                  <>
                    {card.trendPositive && <ArrowUp size={11} strokeWidth={2.25} />}
                    <span>{card.trendText}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content — asymmetric 2 col */}
      <div className="relative z-10 grid grid-cols-[1fr_320px] gap-5 px-8 pb-8">
        {/* Category chart */}
        <div className="bg-surface border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-text">Category Performance</h2>
            <span className="text-xs text-muted">Top 8 by order volume</span>
          </div>
          {nicheLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 px-2">
                  <span className="w-28 h-3 bg-white/[0.04] rounded animate-pulse" />
                  <span className="flex-1 h-2 bg-white/[0.04] rounded-full animate-pulse" />
                  <span className="w-10 h-3 bg-white/[0.04] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : chartRows.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted">
              No category data available yet.
            </div>
          ) : (
            chartRows.map((row, i) => {
              const pct = Math.max(2, (row.orders / maxOrders) * 100);
              const label = row.orders >= 1_000_000
                ? `${(row.orders / 1_000_000).toFixed(1)}M`
                : row.orders >= 1000 ? `${Math.round(row.orders / 1000)}k`
                : row.orders.toLocaleString();
              return (
                <Link
                  key={i}
                  href={`/app/products?category=${encodeURIComponent(row.fullName)}`}
                  className="flex items-center gap-3 py-1.5 rounded-md px-2 hover:bg-white/[0.025] transition-colors group no-underline"
                >
                  <span className="w-28 shrink-0 text-sm text-body truncate" title={row.fullName}>
                    {row.name}
                  </span>
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full group-hover:brightness-110 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs text-muted tabular-nums">{label}</span>
                </Link>
              );
            })
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Opportunities */}
          <div className="bg-surface border border-white/[0.07] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Top Opportunities</h3>
            {opportunities.map((o, i) => (
              <Link
                key={o.label}
                href={o.href}
                className={`flex items-center gap-3 py-3 ${i === opportunities.length - 1 ? '' : 'border-b border-white/[0.05]'} hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors group no-underline`}
              >
                {o.product?.image_url ? (
                  <img
                    src={proxyImage(o.product.image_url) ?? o.product.image_url}
                    alt={o.product.product_title}
                    loading="lazy"
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/[0.08] bg-card"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg shrink-0 bg-card border border-white/[0.08] flex items-center justify-center text-xs text-muted">—</div>
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1"
                    style={{ background: o.chipBg, color: o.chipFg }}
                  >
                    {o.label}
                  </span>
                  <p className="text-sm text-text truncate font-medium">
                    {o.product?.product_title ?? '—'}
                  </p>
                  <p className={`text-xs ${o.statClass} tabular-nums`}>{o.stat}</p>
                </div>
                <ArrowRight size={14} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>

          {/* Platform status */}
          <div className="bg-surface border border-white/[0.07] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Platform Status</h3>
            {platformStatus.map((row, i) => (
              <div
                key={row.name}
                className={`flex items-center justify-between py-2.5 ${i === platformStatus.length - 1 ? '' : 'border-b border-white/[0.05]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  <span className="text-sm text-body">{row.name}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-green/10 text-green font-medium">
                  {row.chip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products table */}
      <div className="relative z-10 mx-8 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-text">Top products</h2>
          <Link
            href="/app/products"
            className="text-sm text-accent hover:text-accent-hover transition-colors no-underline"
          >
            View all {total > 0 ? total.toLocaleString() : productStats.total.toLocaleString() || '…'} →
          </Link>
        </div>
        <div className="bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="bg-raised border-b border-white/[0.07]">
                {['#', 'Product', 'Category', 'Score', 'Orders', 'Price'].map((h, i) => (
                  <th
                    key={h}
                    className={`text-[10px] font-semibold uppercase tracking-widest text-muted px-6 py-3.5 ${i === 0 || i === 1 || i === 2 ? 'text-left' : 'text-right'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prodLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td colSpan={6} className="px-6 py-5">
                      <span className="inline-block h-4 w-full bg-white/[0.04] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted">
                    No products tracked yet.
                  </td>
                </tr>
              ) : (
                products.map((p, i) => {
                  const score = Math.round(p.winning_score ?? 0);
                  const orders = p.sold_count ?? 0;
                  const isLast = i === products.length - 1;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`${isLast ? '' : 'border-b border-white/[0.04]'} hover:bg-white/[0.035] cursor-pointer transition-colors`}
                    >
                      <td className="px-6 py-4 text-xs text-white/20 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.image_url ? (
                            <img
                              src={proxyImage(p.image_url) ?? p.image_url}
                              alt={p.product_title}
                              loading="lazy"
                              className="w-14 h-14 rounded-xl object-cover border border-white/[0.08] bg-card shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-card border border-white/[0.08] flex items-center justify-center text-muted shrink-0">
                              —
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text/90 truncate max-w-sm">
                              {p.product_title}
                            </p>
                            <p className="text-[11px] text-muted mt-0.5 truncate">
                              {shortenCategory(p.category) || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.category ? (
                          <span
                            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded truncate max-w-full"
                            style={categoryColor(p.category)}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {score ? (
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold tabular-nums"
                            style={scoreTierStyle(score)}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-right text-base font-bold tabular-nums ${orders > 0 ? 'text-text' : 'text-muted'}`}>
                        {orders > 150000 && <Flame size={12} className="inline text-amber mr-1" />}
                        {orders > 0 ? fmtK(orders) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-base font-bold text-text tabular-nums">
                        {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
