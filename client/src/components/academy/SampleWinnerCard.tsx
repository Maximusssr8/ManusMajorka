import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { proxyImage } from '@/lib/imageProxy';

interface WinnerPreview {
  id: string | number;
  title: string;
  category: string | null;
  price: number;
  sold: number;
  score: number;
  imageUrl: string | null;
  estDaily: number;
}

/**
 * Pulls one real winning product and renders a stripped-down preview card.
 * Used inline in the Academy to show what a "winner" looks like before
 * nudging the visitor to upgrade.
 */
export function SampleWinnerCard() {
  const [p, setP] = useState<WinnerPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('winning_products')
          .select('id,product_title,category,price_aud,sold_count,winning_score,image_url,est_daily_revenue_aud')
          .gte('winning_score', 85)
          .gt('sold_count', 500)
          .not('image_url', 'is', null)
          .order('winning_score', { ascending: false })
          .limit(10);
        if (cancelled || error || !data || data.length === 0) return;
        // Pick a stable-but-non-boring row
        const pick = data[Math.floor(Math.random() * Math.min(data.length, 5))];
        if (!pick) return;
        setP({
          id: pick.id,
          title: pick.product_title,
          category: pick.category,
          price: Number(pick.price_aud ?? 0),
          sold: Number(pick.sold_count ?? 0),
          score: Number(pick.winning_score ?? 0),
          imageUrl: pick.image_url,
          estDaily: Number(pick.est_daily_revenue_aud ?? (pick.sold_count ?? 0) / 365 * (pick.price_aud ?? 0)),
        });
      } catch {
        // Silent — the card just won't render if DB is unreachable
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!p) {
    return (
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 h-[380px] flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading a live winner…</div>
      </div>
    );
  }

  const scoreColor = p.score >= 90 ? '#10b981' : p.score >= 75 ? '#f59e0b' : '#f97316';
  const estMonthly = p.estDaily * 30;
  const img = proxyImage(p.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      whileHover={{ scale: 1.015, borderColor: 'rgba(212,175,55,0.3)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-surface border border-white/[0.07] rounded-2xl overflow-hidden group"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
    >
      <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={p.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">No image</div>
        )}
        {/* Score badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5"
          style={{ background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}44` }}
        >
          <Flame size={12} />
          {p.score.toFixed(0)}
        </div>
        {/* Live marker */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">Live winner</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">
            {p.category ?? 'Uncategorized'}
          </div>
          <div className="text-sm text-white/90 line-clamp-2 leading-snug min-h-[2.5rem]">
            {p.title}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.06]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Price</div>
            <div className="text-sm font-semibold text-white/90 tabular-nums">${p.price.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Sold</div>
            <div className="text-sm font-semibold text-white/90 tabular-nums flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" />
              {p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Est / mo</div>
            <div className="text-sm font-semibold tabular-nums" style={{ color: '#10b981' }}>
              ${estMonthly >= 1000 ? `${(estMonthly / 1000).toFixed(1)}k` : estMonthly.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#e5c158]/80 bg-[#d4af37]/[0.08] border border-[#d4af37]/20 rounded-lg px-3 py-2">
          <Sparkles size={12} />
          <span>This is what the Products tab shows you, 24/7.</span>
        </div>
      </div>
    </motion.div>
  );
}
