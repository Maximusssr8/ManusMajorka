import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Layers, TrendingUp, Flame, Package } from 'lucide-react';
import { shortenCategory } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';

interface NicheOverview {
  name: string;
  product_count: number;
  avg_score: number | null;
  hot_count: number;
  total_orders: number;
  avg_price: number | null;
  top_product: { title: string | null; image: string | null; orders: number } | null;
}

type SortKey = 'products' | 'score' | 'hot' | 'price';

function nicheScore(n: NicheOverview): number {
  const scorePart = (n.avg_score ?? 0) * 0.5;
  const hotRatio = n.product_count > 0 ? Math.min(n.hot_count / n.product_count, 1) : 0;
  return Math.round(scorePart + hotRatio * 50);
}

function scoreTier(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Strong', color: 'text-green' };
  if (score >= 50) return { label: 'Moderate', color: 'text-amber' };
  return { label: 'Weak', color: 'text-muted' };
}

export default function Niches() {
  const [, navigate] = useLocation();
  const [niches, setNiches] = useState<NicheOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('products');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/niches-overview');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setNiches(Array.isArray(data.niches) ? data.niches : []);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load niches');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...niches];
    switch (sortKey) {
      case 'products': copy.sort((a, b) => b.product_count - a.product_count); break;
      case 'score':    copy.sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0)); break;
      case 'hot':      copy.sort((a, b) => b.hot_count - a.hot_count); break;
      case 'price':    copy.sort((a, b) => (b.avg_price ?? 0) - (a.avg_price ?? 0)); break;
    }
    return copy;
  }, [niches, sortKey]);

  const totalHot = niches.reduce((a, n) => a + n.hot_count, 0);
  const totalProducts = niches.reduce((a, n) => a + n.product_count, 0);

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'products', label: 'Most Products' },
    { key: 'score',    label: 'Best Score' },
    { key: 'hot',      label: 'Most Hot Products' },
    { key: 'price',    label: 'Highest Avg Price' },
  ];

  return (
    <div className="min-h-full bg-bg font-body text-text">
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 md:pt-10 pb-6">
        <div className="flex items-center gap-2 text-xs text-muted uppercase tracking-widest mb-3">
          <Layers size={13} strokeWidth={2} />
          <span>Intelligence</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-text tracking-tight leading-tight">
          Niches
        </h1>
        <p className="mt-3 text-base text-body max-w-2xl">
          {loading ? 'Crunching category aggregates…'
            : `${niches.length} niches · ${totalProducts.toLocaleString()} products · ${totalHot} hot products across all categories.`}
        </p>
      </div>

      {/* Sort bar */}
      <div className="px-4 md:px-8 pb-6 flex items-center gap-2 flex-wrap">
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                active
                  ? 'bg-accent/15 border-accent/40 text-accent-hover'
                  : 'bg-surface border-white/[0.07] text-muted hover:text-text hover:border-white/[0.12]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8 pb-12">
        {error && (
          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-surface border border-white/[0.07] rounded-2xl p-5 h-44 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            No niches available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((n) => {
              const score = nicheScore(n);
              const tier = scoreTier(score);
              return (
                <button
                  key={n.name}
                  onClick={() => navigate(`/app/products?category=${encodeURIComponent(n.name)}`)}
                  className="group text-left bg-surface border border-white/[0.07] rounded-2xl p-5 hover:border-accent/30 transition-colors cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg font-display font-semibold text-text leading-tight line-clamp-2 min-h-[44px]">
                      {shortenCategory(n.name)}
                    </h3>
                    {n.top_product?.image && (
                      <img
                        src={proxyImage(n.top_product.image) ?? n.top_product.image}
                        alt=""
                        loading="lazy"
                        className="w-12 h-12 rounded-lg object-cover border border-white/[0.08] bg-card shrink-0"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted mb-4 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Package size={11} strokeWidth={2} />
                      <span className="text-text font-semibold tabular-nums">{n.product_count}</span>
                    </span>
                    <span className="text-white/20">·</span>
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp size={11} strokeWidth={2} />
                      <span className="text-text font-semibold tabular-nums">{n.avg_score ?? '—'}</span>
                      <span>avg</span>
                    </span>
                    <span className="text-white/20">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Flame size={11} strokeWidth={2} className="text-amber" />
                      <span className="text-text font-semibold tabular-nums">{n.hot_count}</span>
                      <span>hot</span>
                    </span>
                    {n.avg_price != null && (
                      <>
                        <span className="text-white/20">·</span>
                        <span className="tabular-nums">${n.avg_price.toFixed(0)} avg</span>
                      </>
                    )}
                  </div>

                  {/* Niche score bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(4, score))}%`,
                          background: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6b7280',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-text tabular-nums">{score}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
