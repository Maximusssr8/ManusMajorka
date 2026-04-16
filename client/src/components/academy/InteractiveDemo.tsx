import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { Sparkline } from './Sparkline';
import { Badge } from './Badge';

interface TrendingProduct {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  orders?: number;
  winningScore?: number;
}

interface ApiProduct {
  id?: string;
  product_title?: string;
  image_url?: string;
  real_price_aud?: number;
  price_aud?: number;
  real_orders_count?: number;
  orders_count?: number;
  sold_count?: number;
  winning_score?: number;
}

/**
 * Mock Majorka dashboard that renders a LIVE trending product for authenticated
 * users, or a polished placeholder otherwise. All counters animate on view.
 */
export function InteractiveDemo() {
  const [product, setProduct] = useState<TrendingProduct | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/products?trending=true&limit=1', {
          headers: { Accept: 'application/json' },
        });
        if (!r.ok) return;
        const body = (await r.json()) as { data?: ApiProduct[]; products?: ApiProduct[] };
        const list = Array.isArray(body.data) ? body.data : Array.isArray(body.products) ? body.products : [];
        const first = list[0];
        if (!first || cancelled) return;
        setProduct({
          id: String(first.id ?? ''),
          title: first.product_title ?? 'Live trending product',
          imageUrl: first.image_url,
          price: Number(first.real_price_aud ?? first.price_aud ?? 0) || undefined,
          orders: Number(first.real_orders_count ?? first.orders_count ?? first.sold_count ?? 0) || undefined,
          winningScore: Number(first.winning_score ?? 0) || undefined,
        });
      } catch {
        // best-effort — placeholder will show
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sparkData = [8, 12, 14, 18, 22, 25, 32, 38, 45, 52, 61, 70, 78, 84, 88, 91, 94];
  const displayTitle = product?.title ?? 'Portable Neck Fan Pro';
  const displayImage =
    product?.imageUrl ??
    'https://ae01.alicdn.com/kf/S7f5ec1a8f1d34c859c38e5720a44e2f6s.jpg';

  return (
    <section className="border-t border-white/[0.05] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
            Live Demo · this is what you'll see inside
          </div>
          <h2
            className="text-3xl font-bold tracking-tight text-[#E0E0E0] md:text-5xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            The Dashboard That Replaces{' '}
            <span className="text-[#4f8ef7]">40 Hours</span> of Research
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: 'rgba(79,142,247,0.18)',
            background: 'linear-gradient(180deg, #0d1117 0%, #0d0d0d 100%)',
            boxShadow: '0 40px 100px -30px rgba(79,142,247,0.22)',
          }}
        >
          {/* Top bar mimicking app chrome */}
          <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
              <span className="ml-3 text-[11px] font-mono text-[#6B7280]">app.majorka.io / products / trending</span>
            </div>
            <Badge tone="emerald">Live Data</Badge>
          </div>

          {/* Demo body */}
          <div className="scrollbar-hide grid gap-6 overflow-x-auto p-6 md:grid-cols-[1.3fr_1fr] md:overflow-visible md:p-8">
            {/* Left: product card */}
            <div className="min-w-[320px] rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-5">
              <div className="flex gap-4">
                <div
                  className="h-24 w-24 shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] bg-cover bg-center"
                  style={{ backgroundImage: `url(${displayImage})` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">Top Trending</div>
                  <div
                    className="mt-1 line-clamp-2 text-base font-semibold text-[#E0E0E0]"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {displayTitle}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="font-mono text-[#9CA3AF]">
                      ${product?.price?.toFixed(2) ?? '39.90'}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/15" />
                    <span className="font-mono text-[#9CA3AF] tabular-nums">
                      <AnimatedCounter to={product?.orders ?? 14523} /> orders
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <ScoreTile
                  label="Trend Velocity"
                  value={product?.winningScore ?? 87}
                  color="#4f8ef7"
                />
                <ScoreTile label="Opportunity Score" value={73} color="#3B82F6" />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
                  <span>30-day orders velocity</span>
                  <span className="text-emerald-300">+38%</span>
                </div>
                <Sparkline data={sparkData} />
              </div>
            </div>

            {/* Right: market intelligence */}
            <div className="min-w-[280px] flex flex-col gap-4">
              <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">Market Split</div>
                  <Globe2 size={14} className="text-[#6B7280]" />
                </div>
                <MarketBar label="Australia" pct={42} color="#4f8ef7" />
                <MarketBar label="United States" pct={35} color="#3B82F6" />
                <MarketBar label="United Kingdom" pct={23} color="#10b981" />
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">Est. Daily Revenue</div>
                <div
                  className="mt-2 text-3xl font-bold tabular-nums text-emerald-300"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  $<AnimatedCounter to={1847} />
                </div>
                <div className="mt-1 text-xs text-[#6B7280]">across the 3-market opportunity</div>
              </div>

              <div className="rounded-xl border border-[#4f8ef7]/20 bg-gradient-to-br from-[#4f8ef7]/10 to-transparent p-5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">Recommended Action</div>
                <div className="mt-1.5 text-sm leading-relaxed text-[#E0E0E0]">
                  Launch AU Meta creative test at A$30/day. Historical ROAS for this velocity band: <span className="font-mono text-[#4f8ef7]">2.1x</span>.
                </div>
                <a
                  href="/app/products"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-[#4f8ef7] hover:text-[#6ba3ff]"
                >
                  Open in Products <ArrowUpRight size={11} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ScoreTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
      <div className="text-[9px] font-mono uppercase tracking-widest text-[#6B7280]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: "'Syne', sans-serif" }}>
          <AnimatedCounter to={value} />
        </div>
        <div className="text-[10px] font-mono text-[#6B7280]">/100</div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function MarketBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[#E0E0E0]">{label}</span>
        <span className="font-mono tabular-nums text-[#9CA3AF]">
          <AnimatedCounter to={pct} suffix="%" />
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
