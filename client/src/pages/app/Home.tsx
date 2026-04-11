import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUp, Package, Flame, Bookmark, TrendingUp, Heart } from 'lucide-react';
import CountUp from 'react-countup';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { GradientM } from '@/components/MajorkaLogo';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useStatsOverview } from '@/hooks/useStatsOverview';
import { useFavourites } from '@/hooks/useFavourites';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';
import { ProductDetailDrawer } from '@/components/app/ProductDetailDrawer';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';

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
  useEffect(() => { document.title = 'Dashboard — Majorka'; }, []);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  /**
   * Wipes the persisted Products filters from localStorage so that
   * navigating to /app/products from Home opens a clean page (no
   * stale Category/Price/Score chips left over from a previous
   * session). Returns an onClick handler — call as
   *   onClick={clearFiltersAndGo('/app/products')}
   */
  function clearFiltersAndGo(target: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      try { localStorage.removeItem('majorka_filters_v1'); } catch { /* */ }
      navigate(target);
    };
  }
  const { stats, loading: statsLoading } = useStatsOverview();
  const fav = useFavourites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products, loading: prodLoading, total } = useProducts({ limit: 10, orderBy: 'sold_count' });
  const { products: hotTodayProducts } = useProducts({ limit: 4, tab: 'hot-now' });
  const { products: bestMarginProducts } = useProducts({ limit: 1, orderBy: 'price_asc', minScore: 80 });
  const { products: newestProducts } = useProducts({ limit: 1, orderBy: 'created_at' });

  const firstName = (user?.name ?? user?.email?.split('@')[0] ?? 'Operator').split(' ')[0];
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });
  const tod = timeOfDay();

  const topProduct    = products[0];
  const bestMargin    = bestMarginProducts[0] ?? null;
  const newestProduct = newestProducts[0] ?? null;

  /* Hot Today — uses the hot-now tab logic (score >= 90 + orders > 100k +
     created within 30d). Falls back to the top-volume slice if the strict
     filter returns nothing so this card always shows real products. */
  const trendingNow = hotTodayProducts.length > 0 ? hotTodayProducts : products.slice(0, 4);

  /* Trending Today — products with sold_count > 100,000 in the loaded set */
  const trendingTodayCount = products.filter((p) => (p.sold_count ?? 0) > 100000).length;

  /* KPI cards */
  const totalDelta = stats?.totalDelta ?? 0;
  const hotDelta = stats?.hotDelta ?? null;
  const kpiCards: {
    label: string; numeric: number | null; sub: string;
    Icon: typeof Package; accent: string; href: string;
    trendText: string | null; trendPositive: boolean;
  }[] = [
    {
      label: 'Products Tracked',
      numeric: stats?.total ?? null,
      sub: 'Live AliExpress feed',
      Icon: Package,
      accent: '#6366f1',
      href: '/app/products',
      // Only show a trend pill when we actually have movement — empty
      // weeks shouldn't render a "No change" pill that ages badly
      trendText: totalDelta > 0 ? `+${totalDelta.toLocaleString()} this week`
                 : totalDelta < 0 ? `${totalDelta.toLocaleString()} this week`
                 : null,
      trendPositive: totalDelta > 0,
    },
    {
      label: 'Hot Products',
      numeric: stats?.hotProducts ?? null,
      sub: 'Score 65 and above',
      Icon: Flame,
      accent: '#f59e0b',
      href: '/app/products?tab=hot-now',
      // Hide the pill entirely when we don't have a meaningful delta —
      // null reads as "no claim", which is cleaner than +999% or "insufficient data"
      trendText: hotDelta == null ? null
                 : hotDelta > 0 ? `+${hotDelta}% vs last week`
                 : hotDelta < 0 ? `${hotDelta}% vs last week`
                 : 'Flat vs last week',
      trendPositive: hotDelta != null && hotDelta > 0,
    },
    {
      label: 'Saved Products',
      numeric: fav.count,
      sub: fav.count === 0 ? 'Start saving winners' : 'In your library',
      Icon: Bookmark,
      accent: '#10b981',
      href: '/app/products?tab=saved',
      trendText: null,
      trendPositive: false,
    },
    {
      label: 'Trending Today',
      numeric: trendingTodayCount,
      sub: 'Orders above 100K',
      Icon: TrendingUp,
      accent: '#22d3ee',
      href: '/app/products?tab=trending',
      trendText: null,
      trendPositive: false,
    },
  ];

  // Animation variants now driven by CSS .animate-in / .stagger-N classes

  /* Top Opportunities — pulled from live data */
  const opportunities: {
    label: string; chipBg: string; chipFg: string; href: string;
    product: Product | null;
  }[] = [
    {
      label: 'Top Trending',
      chipBg: 'rgba(245,158,11,0.15)', chipFg: '#f59e0b',
      href: '/app/products?tab=hot-now',
      product: topProduct ?? null,
    },
    {
      label: 'Best Margin',
      chipBg: 'rgba(16,185,129,0.15)', chipFg: '#10b981',
      href: '/app/products?tab=high-profit',
      product: bestMargin,
    },
    {
      label: 'Newest',
      chipBg: 'rgba(99,102,241,0.15)', chipFg: '#818cf8',
      href: '/app/products?tab=new',
      product: newestProduct,
    },
  ];

  const liveLabel = stats?.updatedAt
    ? `Live · AliExpress feed · updated ${formatRelative(stats.updatedAt)}`
    : 'Live · AliExpress feed';

  /* Dynamic insight — live-derived, never hardcoded */
  const insight = stats && stats.newThisWeek > 0
    ? `${stats.newThisWeek} new products added this week across ${stats.categoryCount} categories.`
    : stats
      ? `${stats.total.toLocaleString()} products tracked across ${stats.categoryCount} categories.`
      : '';

  async function handleSaveFromOpportunity(p: Product, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const wasFav = fav.isFavourite(p.id);
    await fav.toggleFavourite(p);
    if (wasFav) toast('Removed from saved');
    else toast.success('Product saved');
  }

  return (
    <motion.div {...fadeIn}>
    <div className="min-h-full bg-bg font-body text-text relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      {/* Status bar */}
      <div className="relative z-10 hidden md:flex items-center justify-between px-4 md:px-8 h-12 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          <span>{liveLabel}</span>
        </div>
      </div>

      {/* Today's 5 — daily-briefing card. Top of page = first thing operators see */}
      <TodaysFive />

      {/* Hero — with a subtle mesh gradient backing the greeting block */}
      <div className="relative z-10 px-4 md:px-8 pt-8 md:pt-10 pb-6">
        <div className="relative">
          {/* Hero mesh gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.06)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <img src="/majorka-logo.jpg" alt="Majorka" style={{ height: 36, width: 36, borderRadius: 10, objectFit: 'cover' }} />
                <p className="text-xs text-muted uppercase tracking-widest">
                  {today} · Scale Plan
                </p>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-text tracking-tight leading-tight">
                Good {tod}, <span className="text-accent">{firstName}</span>.
              </h1>
              <p className="mt-3 text-base text-body max-w-lg">
                Your product intelligence is live across the Australian market.
              </p>
              {insight && (
                <a
                  href="/app/products?tab=new"
                  onClick={clearFiltersAndGo('/app/products?tab=new')}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:text-accent-hover transition-colors no-underline cursor-pointer"
                >
                  <span>{insight}</span>
                  <ArrowRight size={13} strokeWidth={2.25} />
                </a>
              )}
            </div>
            <a
              href="/app/products"
              onClick={clearFiltersAndGo('/app/products')}
              className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors no-underline shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_24px_rgba(99,102,241,0.25)] cursor-pointer"
            >
              Discover products
              <ArrowRight size={14} strokeWidth={2.25} />
            </a>
          </div>
        </div>
      </div>

      {/* KPI grid — premium glass cards with per-card accent glow */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-8 pb-6">
        {kpiCards.map((card, i) => {
          const Icon = card.Icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`block no-underline group glass-card glass-card--elevated glass-card--interactive relative overflow-hidden p-6 animate-in stagger-${i + 1}`}
            >
              {/* Decorative oversized icon — sits behind the number */}
              <div className="pointer-events-none absolute -top-4 -right-4 opacity-[0.05]">
                <Icon size={120} strokeWidth={1} />
              </div>
              {/* Hover arrow — appears bottom-right */}
              <div className="pointer-events-none absolute bottom-3 right-3 text-white/0 group-hover:text-accent transition-colors text-base">
                →
              </div>

              {/* Top accent line — full width, fades to transparent edges */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }}
              />

              {/* Soft ambient glow at the top, behind the label */}
              <div
                className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-16 blur-2xl opacity-30"
                style={{ background: card.accent }}
              />

              {/* Label + accent icon tile */}
              <div className="relative z-10 flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  {card.label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.accent}20`, border: `1px solid ${card.accent}30` }}
                >
                  <Icon size={13} strokeWidth={2} style={{ color: card.accent }} />
                </div>
              </div>

              {/* Hero number — full bleed with subtle glow */}
              <div
                className="relative z-10 text-4xl md:text-5xl font-display font-bold text-white leading-none mb-2 min-h-[40px] flex items-center tabular-nums tracking-tight"
                style={{ textShadow: `0 0 40px ${card.accent}40` }}
              >
                {statsLoading || card.numeric == null ? (
                  <span
                    className="inline-block h-10 w-28 rounded-xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                ) : (
                  <CountUp start={0} end={card.numeric} duration={1.5} separator="," useEasing preserveValue />
                )}
              </div>

              <div className="relative z-10 text-[11px] text-white/35 mb-3">{card.sub}</div>

              <div className="relative z-10 min-h-[22px] flex items-center">
                {card.trendText && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{
                      background: card.trendPositive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                      color: card.trendPositive ? '#10b981' : 'rgba(255,255,255,0.45)',
                      border: `1px solid ${card.trendPositive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {card.trendPositive && <ArrowUp size={10} strokeWidth={2.5} />}
                    {card.trendText}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Top products table — full-width hero content, Shopify-style */}
      <div className="relative z-10 mx-4 md:mx-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-text">Top products</h2>
          <a
            href="/app/products"
            onClick={clearFiltersAndGo('/app/products')}
            className="text-sm text-accent hover:text-accent-hover transition-colors no-underline cursor-pointer"
          >
            View all {total > 0 ? total.toLocaleString() : '…'} →
          </a>
        </div>
        <div className="bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-raised border-b border-white/[0.07]">
                <th className="text-[10px] font-semibold uppercase tracking-widest text-muted px-4 py-3.5 text-left w-10">#</th>
                <th className="text-[10px] font-semibold uppercase tracking-widest text-muted px-4 py-3.5 text-left">Product</th>
                <th className="hidden md:table-cell text-[10px] font-semibold uppercase tracking-widest text-muted px-4 py-3.5 text-left">Category</th>
                <th className="hidden md:table-cell text-[10px] font-semibold uppercase tracking-widest text-muted px-4 py-3.5 text-right">Score</th>
                <th className="text-[10px] font-semibold uppercase tracking-widest text-muted px-4 py-3.5 text-right">Orders</th>
                <th className="text-[10px] font-semibold uppercase tracking-widest text-muted px-4 py-3.5 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {prodLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td colSpan={6} className="px-5 py-5">
                      <span className="inline-block h-4 w-full bg-white/[0.04] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted">
                    No products tracked yet.
                  </td>
                </tr>
              ) : (
                products.slice(0, 8).map((p, i) => {
                  const score = Math.round(p.winning_score ?? 0);
                  const orders = p.sold_count ?? 0;
                  const isLast = i === Math.min(products.length, 8) - 1;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`${isLast ? '' : 'border-b border-white/[0.04]'} hover:bg-white/[0.035] cursor-pointer transition-colors`}
                    >
                      <td className="px-4 py-4 text-xs text-white/20 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.image_url ? (
                            <img
                              src={proxyImage(p.image_url) ?? p.image_url}
                              alt={p.product_title ?? ''}
                              loading="lazy"
                              className="w-12 h-12 rounded-lg object-cover border border-white/[0.08] bg-card shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-card border border-white/[0.08] flex items-center justify-center text-muted shrink-0">—</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              title={p.product_title ?? undefined}
                              className="text-sm font-medium text-text/90 truncate max-w-[320px] lg:max-w-[440px]"
                            >
                              {p.product_title ?? 'Untitled product'}
                            </p>
                            <p className="text-[11px] text-muted mt-0.5 truncate">
                              {shortenCategory(p.category) || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        {p.category ? (
                          <span
                            className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded truncate max-w-full"
                            style={categoryColor(p.category)}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-right">
                        {score ? (
                          <span
                            className="inline-flex items-center justify-center w-9 h-9 rounded text-base font-black tabular-nums"
                            style={scoreTierStyle(score)}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-4 text-right text-sm font-bold tabular-nums ${orders > 0 ? 'text-text' : 'text-muted'}`}>
                        {orders > 150000 && <Flame size={12} className="inline text-amber mr-1" />}
                        {orders > 0 ? fmtK(orders) : '—'}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-text tabular-nums">
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

      {/* Bottom two-column — Trending Now + Top Opportunities. Stacks on mobile. */}
      <div className="relative z-10 flex flex-col md:flex-row items-start gap-5 px-4 md:px-8 pb-12">

        {/* LEFT — Trending Now */}
        <div className="w-full flex-1 min-w-0 bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-text flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Hot Today
            </h2>
            <Link
              href="/app/products?tab=trending"
              className="text-xs text-accent hover:text-accent-hover transition-colors no-underline"
            >
              View all →
            </Link>
          </div>
          {prodLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="flex-1 h-4 bg-white/[0.04] rounded animate-pulse" />
                  <div className="w-10 h-6 bg-white/[0.04] rounded animate-pulse" />
                  <div className="w-14 h-4 bg-white/[0.04] rounded animate-pulse" />
                  <div className="w-12 h-4 bg-white/[0.04] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : trendingNow.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted">
              No trending products yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {trendingNow.map((p, i) => {
                const score = Math.round(p.winning_score ?? 0);
                const orders = p.sold_count ?? 0;
                const catStyle = categoryColor(p.category);
                const isLast = i === trendingNow.length - 1;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`group flex items-center gap-3 py-3 ${isLast ? '' : 'border-b border-white/[0.05]'} hover:bg-white/[0.04] -mx-2 px-2 rounded-xl transition-colors text-left`}
                  >
                    {p.image_url ? (
                      <img
                        src={proxyImage(p.image_url) ?? p.image_url}
                        alt={p.product_title}
                        loading="lazy"
                        className="w-[52px] h-[52px] rounded-xl object-cover border border-white/[0.08] bg-card shrink-0"
                      />
                    ) : (
                      <div className="w-[52px] h-[52px] rounded-xl bg-card border border-white/[0.08] flex items-center justify-center text-muted shrink-0">—</div>
                    )}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p
                        title={p.product_title ?? undefined}
                        className="text-sm font-semibold text-text truncate mb-1"
                      >
                        {p.product_title ?? 'Untitled product'}
                      </p>
                      {p.category && (
                        <span
                          className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[140px]"
                          style={catStyle}
                        >
                          {shortenCategory(p.category)}
                        </span>
                      )}
                    </div>
                    {score > 0 && (
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded text-base font-black tabular-nums shrink-0"
                        style={scoreTierStyle(score)}
                      >
                        {score}
                      </span>
                    )}
                    <div className="hidden sm:block text-sm font-bold text-text tabular-nums w-14 text-right shrink-0">
                      {orders > 0 ? fmtK(orders) : '—'}
                    </div>
                    <div className="hidden sm:block text-sm text-muted tabular-nums w-14 text-right shrink-0">
                      {p.price_aud != null ? `$${Number(p.price_aud).toFixed(0)}` : '—'}
                    </div>
                    <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Opportunities + Quick Stats stacked. Full width on mobile,
            fixed 320px on desktop. */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4">

          {/* Top Opportunities */}
          <div className="bg-surface border border-white/[0.07] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Top Opportunities</h3>
            {opportunities.map((o, i) => {
              const p = o.product;
              const score = Math.round(p?.winning_score ?? 0);
              const isLast = i === opportunities.length - 1;
              const isFav = p ? fav.isFavourite(p.id) : false;
              return (
                <a
                  key={o.label}
                  href={o.href}
                  onClick={clearFiltersAndGo(o.href)}
                  className={`flex items-center gap-3 py-3 ${isLast ? '' : 'border-b border-white/[0.05]'} hover:bg-white/[0.03] -mx-3 px-3 rounded-xl transition-colors group cursor-pointer no-underline`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {p?.image_url ? (
                      <img
                        src={proxyImage(p.image_url) ?? p.image_url}
                        alt={p.product_title}
                        loading="lazy"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/[0.08] bg-card"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl shrink-0 bg-card border border-white/[0.08] flex items-center justify-center text-xs text-muted">—</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded mb-1"
                        style={{ background: o.chipBg, color: o.chipFg }}
                      >
                        {o.label}
                      </span>
                      <p className="text-sm text-text truncate font-semibold">
                        {p?.product_title ?? '—'}
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        {p?.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}
                      </p>
                    </div>
                  </div>
                  {score > 0 && (
                    <span
                      className="inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold tabular-nums shrink-0"
                      style={scoreTierStyle(score)}
                    >
                      {score}
                    </span>
                  )}
                  {p && (
                    <button
                      onClick={(e) => handleSaveFromOpportunity(p, e)}
                      aria-label="Save"
                      className={`shrink-0 p-1.5 rounded transition-colors cursor-pointer ${isFav ? 'text-accent' : 'text-muted hover:text-text'}`}
                    >
                      <Heart size={14} strokeWidth={1.75} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </a>
              );
            })}
          </div>

        </div>
      </div>

      <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
    </motion.div>
  );
}

// timeAgoShort retained for potential future use
export { timeAgoShort };

/* ──────────────────────────────────────────────────────────────
   TodaysFive — daily-briefing horizontal scroll of 5 picks.
   Fetches from /api/products/todays-picks. Caches via useProducts'
   own caching layer would be ideal but the endpoint shape is bespoke,
   so we fetch once on mount.
   ────────────────────────────────────────────────────────────── */
interface TodaysPick {
  id: string;
  product_title: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  image_url: string | null;
  category: string | null;
}

function TodaysFive() {
  const [picks, setPicks] = useState<TodaysPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/todays-picks?market=AU&limit=5')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setPicks(Array.isArray(d?.picks) ? d.picks : []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative z-10 px-4 md:px-8 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">Today&apos;s Top 5</span>
            <span className="text-[10px] text-white/25">
              · {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h2 className="text-lg font-display font-bold text-white">Your daily picks</h2>
        </div>
        <Link
          href="/app/products"
          className="text-xs text-accent hover:text-accent-hover font-medium no-underline"
        >
          Browse all →
        </Link>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-52 shrink-0 h-72 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))
          : picks.length === 0
            ? <div className="text-xs text-muted py-8">No picks today — check back later.</div>
            : picks.map((p, i) => <TodayCard key={p.id} product={p} rank={i + 1} />)
        }
      </div>
    </div>
  );
}

function TodayCard({ product, rank }: { product: TodaysPick; rank: number }) {
  const score = Math.round(product.winning_score ?? 0);
  const orders = product.sold_count ?? 0;
  return (
    <Link
      href={`/app/products?product=${product.id}`}
      className="w-52 shrink-0 rounded-2xl overflow-hidden cursor-pointer group relative no-underline glass-card glass-card--interactive"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Decorative rank number */}
      <div className="absolute top-2 left-3 z-10 font-display font-black text-4xl text-white/10 leading-none select-none pointer-events-none">
        {rank}
      </div>
      <div className="relative h-36 overflow-hidden">
        {product.image_url ? (
          <img
            src={proxyImage(product.image_url) ?? product.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        <div
          className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
          style={{
            background: score >= 90 ? 'rgba(16,185,129,0.92)' : 'rgba(245,158,11,0.92)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {score}
        </div>
      </div>
      <div className="p-3">
        <p
          className="text-xs font-medium text-text leading-snug mb-2 overflow-hidden"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          title={product.product_title ?? ''}
        >
          {product.product_title ?? 'Untitled'}
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-text tabular-nums">
            ${product.price_aud != null ? Number(product.price_aud).toFixed(2) : '—'}
          </span>
          <span className="text-xs text-green font-semibold tabular-nums">
            {orders > 0 ? `${fmtK(orders)} sold` : '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}
