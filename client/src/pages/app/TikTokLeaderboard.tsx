/**
 * TikTok Shop Leaderboard — Bloomberg-style ranked feed of top TikTok Shop
 * products. Reads from /api/products/tiktok-leaderboard, which ranks by
 * (winning_score × 0.4) + (velocity × 0.6). No gamification, data-dense.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { Flame, TrendingUp, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { proxyImage } from '@/lib/imageProxy';

interface LeaderboardItem {
  id: string;
  product_title: string;
  category: string | null;
  image_url: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  est_daily_revenue_aud: number | null;
  created_at: string | null;
  shop_name: string | null;
  aliexpress_url: string | null;
  trend: string | null;
  velocity: number;
  daysActive: number;
  rank: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function TikTokLeaderboard(): ReactElement {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [niche, setNiche] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      try {
        const url = niche
          ? `/api/products/tiktok-leaderboard?niche=${encodeURIComponent(niche)}`
          : '/api/products/tiktok-leaderboard';
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items: LeaderboardItem[] };
        if (!cancelled) {
          setItems(data.items ?? []);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [niche]);

  const niches = ['', 'pet', 'beauty', 'home', 'fitness', 'tech', 'kitchen', 'fashion'];

  return (
    <div className="min-h-full" style={{ background: '#080808', color: '#ededed', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="px-6 md:px-8 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Flame size={18} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              TikTok Shop Leaderboard
            </h1>
            <p className="text-[12px] text-white/40 mt-0.5">Ranked by velocity &times; winning score. Updated every 6 hours.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {niches.map((n) => (
            <button
              key={n || 'all'}
              onClick={() => setNiche(n)}
              className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-all"
              style={{
                background: niche === n ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${niche === n ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: niche === n ? '#60A5FA' : '#888',
              }}
            >
              {n || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="px-8 py-20 flex items-center justify-center text-white/40 gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading leaderboard…
        </div>
      )}

      {error && !loading && (
        <div className="px-8 py-10 text-center text-red-400 text-sm">Failed to load: {error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="px-8 py-20 text-center text-white/40 text-sm">
          No TikTok Shop data yet. The ingest agent will populate this feed on the next 6h run.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="px-6 md:px-8 pb-12">
          <div className="rounded-lg overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
            <div className="grid grid-cols-[48px_80px_1fr_90px_90px_90px_80px_40px] gap-3 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/40" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <span>#</span>
              <span>Image</span>
              <span>Product</span>
              <span className="text-right">Orders</span>
              <span className="text-right font-mono">Velocity</span>
              <span className="text-right font-mono">Price</span>
              <span className="text-right">Score</span>
              <span />
            </div>
            {items.map((item, idx) => {
              const sc = item.winning_score ?? 0;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[48px_80px_1fr_90px_90px_90px_80px_40px] gap-3 px-4 py-3 items-center transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[13px] font-mono tabular-nums text-white/50">{idx + 1}</span>
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-black/30 border border-white/[0.05]">
                    {item.image_url && (
                      <img
                        src={proxyImage(item.image_url) ?? item.image_url}
                        alt={item.product_title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white/90 truncate">{item.product_title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5 truncate">
                      {item.category ?? 'Uncategorised'}
                      {item.shop_name ? ` · ${item.shop_name}` : ''}
                      {item.daysActive ? ` · ${item.daysActive}d active` : ''}
                    </p>
                  </div>
                  <span className="text-[13px] font-mono tabular-nums text-right text-white/80">
                    {(item.sold_count ?? 0).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center justify-end gap-1 text-[12px] font-mono tabular-nums text-right" style={{ color: item.velocity > 50 ? '#22c55e' : item.velocity > 10 ? '#f59e0b' : '#888' }}>
                    {item.velocity > 50 && <TrendingUp size={11} />}
                    {item.velocity}/d
                  </span>
                  <span className="text-[13px] font-mono tabular-nums text-right text-white/80">
                    {item.price_aud ? `$${item.price_aud}` : '—'}
                  </span>
                  <span
                    className="text-[13px] font-bold tabular-nums text-right"
                    style={{ color: scoreColor(sc) }}
                  >
                    {Math.round(sc)}
                  </span>
                  <Link
                    href={`/app/products?id=${item.id}`}
                    className="text-white/30 hover:text-white transition-colors flex items-center justify-end"
                    aria-label="Open product"
                  >
                    <ExternalLink size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
