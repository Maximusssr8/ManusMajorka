import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ArrowUp, ArrowDown, Minus, Heart } from 'lucide-react';
import { proxyImage } from '@/lib/imageProxy';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { useFavourites } from '@/hooks/useFavourites';
import { toast } from 'sonner';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

interface RadarProduct {
  id: string | number;
  product_title: string;
  category: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  est_daily_revenue_aud: number | null;
  currentRank: number;
  previousRank: number | null;
  delta: number | null;
  isNew: boolean;
}

interface RadarResponse {
  ranked: RadarProduct[];
  updatedAt: string;
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

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

function categoryColor(cat: string | null): { backgroundColor: string; color: string } {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('car') || c.includes('auto'))                                return { backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' };
  if (c.includes('phone') || c.includes('mobile'))                            return { backgroundColor: 'rgba(255,255,255,0.12)', color: '#cccccc' };
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

/* ══════════════════════════════════════════════════════════════
   Rank delta badge
   ══════════════════════════════════════════════════════════════ */

function RankDelta({ delta, isNew }: { delta: number | null; isNew: boolean }) {
  if (isNew) {
    return (
      <span className="inline-flex items-center justify-center w-11 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent-hover border border-accent/30">
        NEW
      </span>
    );
  }
  if (delta == null || delta === 0) {
    return (
      <span className="inline-flex items-center justify-center w-11 text-xs text-muted">
        <Minus size={12} strokeWidth={2} />
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center justify-center gap-0.5 w-11 text-xs font-semibold text-green tabular-nums">
        <ArrowUp size={11} strokeWidth={2.5} />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center gap-0.5 w-11 text-xs font-semibold text-red-400 tabular-nums">
      <ArrowDown size={11} strokeWidth={2.5} />
      {Math.abs(delta)}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Radar page
   ══════════════════════════════════════════════════════════════ */

export default function Radar() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fav = useFavourites();

  async function load() {
    try {
      const res = await fetch('/api/products/radar', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as RadarResponse;
      setData(json);
      setLoading(false);
      setError(null);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Failed to load radar');
    }
  }

  useEffect(() => {
    load();
    // Refresh every 8 hours to match Minea's cadence
    const interval = setInterval(load, 8 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const ranked = useMemo(() => data?.ranked ?? [], [data]);

  const stats = useMemo(() => {
    const rising = ranked.filter((r) => (r.delta ?? 0) > 0).length;
    const falling = ranked.filter((r) => (r.delta ?? 0) < 0).length;
    const newCount = ranked.filter((r) => r.isNew).length;
    return { rising, falling, newCount };
  }, [ranked]);

  return (
    <div className="min-h-full bg-bg font-body text-text relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 px-4 md:px-8 pt-8 md:pt-10 pb-12 max-w-[1280px] mx-auto">
        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-muted uppercase tracking-widest mb-3">
            <Radio size={13} strokeWidth={2} className="text-green animate-pulse" />
            Live leaderboard
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text tracking-tight">
            Success Radar
          </h1>
          <p className="mt-2 text-sm text-body max-w-xl">
            Top 100 products ranked by order volume. Refreshes every 8 hours — compare against the last snapshot to see what's rising.
          </p>
          {data?.updatedAt && (
            <p className="mt-2 text-xs text-muted">
              Last updated: {formatRelative(data.updatedAt)}
            </p>
          )}
        </div>

        {/* Stat row */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Rising</div>
              <div className="flex items-end gap-1.5">
                <ArrowUp size={16} className="text-green mb-1" strokeWidth={2.5} />
                <div className="text-2xl md:text-3xl font-display font-bold text-green tabular-nums">{stats.rising}</div>
              </div>
            </div>
            <div className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">Falling</div>
              <div className="flex items-end gap-1.5">
                <ArrowDown size={16} className="text-red-400 mb-1" strokeWidth={2.5} />
                <div className="text-2xl md:text-3xl font-display font-bold text-red-400 tabular-nums">{stats.falling}</div>
              </div>
            </div>
            <div className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">New entries</div>
              <div className="text-2xl md:text-3xl font-display font-bold text-accent-hover tabular-nums">{stats.newCount}</div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden">
          {loading ? (
            <div className="flex flex-col">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-white/[0.04]">
                  <span className="w-10 h-6 bg-white/[0.04] rounded animate-pulse" />
                  <span className="w-11 h-5 bg-white/[0.04] rounded animate-pulse" />
                  <span className="w-12 h-12 bg-white/[0.04] rounded-lg animate-pulse" />
                  <span className="flex-1 h-4 bg-white/[0.04] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-sm text-muted">
              {error}
            </div>
          ) : ranked.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">
              No products in the radar yet.
            </div>
          ) : (
            <AnimatePresence>
              {ranked.map((p) => {
                const score = Math.round(p.winning_score ?? 0);
                const catStyle = categoryColor(p.category);
                const orders = p.sold_count ?? 0;
                const isFav = fav.isFavourite(p.id);
                return (
                  <motion.div
                    layout
                    layoutId={`radar-${p.id}`}
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 border-b border-white/[0.04] hover:bg-gradient-to-r hover:from-accent/[0.03] hover:to-transparent transition-colors"
                  >
                    {/* Rank number — big ghost style */}
                    <div className="w-10 md:w-14 text-2xl md:text-3xl font-display font-black text-white/[0.12] tabular-nums text-right shrink-0">
                      {String(p.currentRank).padStart(2, '0')}
                    </div>

                    {/* Delta badge */}
                    <div className="shrink-0">
                      <RankDelta delta={p.delta} isNew={p.isNew} />
                    </div>

                    {/* Thumbnail */}
                    {p.image_url ? (
                      <img
                        src={proxyImage(p.image_url) ?? p.image_url}
                        alt={p.product_title}
                        loading="lazy"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover border border-white/[0.08] bg-card shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-card border border-white/[0.08] flex items-center justify-center text-muted shrink-0">—</div>
                    )}

                    {/* Title + category */}
                    <div className="flex-1 min-w-0">
                      <p
                        title={p.product_title}
                        className="text-sm font-semibold text-text/90 truncate"
                      >
                        {p.product_title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {p.category && (
                          <span
                            className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[140px]"
                            style={catStyle}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        )}
                        <span className="text-[10px] text-muted tabular-nums">
                          {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Score badge */}
                    {score > 0 && (
                      <span
                        className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded text-base font-black tabular-nums shrink-0"
                        style={scoreTierStyle(score)}
                      >
                        {score}
                      </span>
                    )}

                    {/* Orders */}
                    <div className="hidden sm:block text-sm md:text-base font-bold text-text tabular-nums w-16 md:w-20 text-right shrink-0">
                      {orders > 0 ? fmtK(orders) : '—'}
                    </div>

                    {/* Heart */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const wasFav = isFav;
                        await fav.toggleFavourite({
                          id: p.id,
                          product_title: p.product_title,
                          category: p.category,
                          platform: 'aliexpress',
                          price_aud: p.price_aud,
                          sold_count: p.sold_count,
                          winning_score: p.winning_score,
                          trend: null,
                          est_daily_revenue_aud: p.est_daily_revenue_aud ?? null,
                          image_url: p.image_url,
                          product_url: p.product_url,
                          created_at: p.created_at,
                          updated_at: null,
                        });
                        if (wasFav) toast('Removed from saved');
                        else toast.success('Product saved');
                      }}
                      aria-label="Save"
                      className={`shrink-0 p-1.5 rounded transition-colors cursor-pointer ${isFav ? 'text-accent' : 'text-muted hover:text-text'}`}
                    >
                      <Heart size={16} strokeWidth={1.75} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <p className="mt-6 text-xs text-muted text-center">
          Rank changes are computed against the last snapshot. The first time you load Radar, every product will show NEW — subsequent loads will show movement.
        </p>
      </div>
    </div>
  );
}
