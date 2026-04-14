import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

interface Step {
  label: string;
  detail: string;
  durationMs: number;
}

const STEPS: Step[] = [
  { label: 'Pasting AliExpress URL',      detail: 'aliexpress.com/item/100500123456…',       durationMs: 1200 },
  { label: 'Scraping product data',       detail: '12 images · 6 variants · specs parsed',   durationMs: 1600 },
  { label: 'Rewriting description',       detail: 'Claude Sonnet, AU spelling, benefit-led', durationMs: 2000 },
  { label: 'Generating hero + trust bar', detail: '3 sections, shop-ready copy',             durationMs: 1500 },
  { label: 'Building Shopify theme',      detail: 'Dawn v15, section-based, mobile-first',   durationMs: 1700 },
  { label: 'Publishing store',            detail: 'your-brand.myshopify.com · live',         durationMs: 1000 },
];

/**
 * Pseudo-live sequence that mimics running Store Builder end-to-end.
 * Loops forever once in view. Pure CSS + framer — no Lottie dependency.
 */
export function StoreBuildDemo() {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      while (!cancelled) {
        setActiveIdx(-1);
        setDone(new Set());
        await new Promise<void>((res) => { t = setTimeout(res, 500); });
        for (let i = 0; i < STEPS.length && !cancelled; i++) {
          setActiveIdx(i);
          await new Promise<void>((res) => { t = setTimeout(res, STEPS[i].durationMs); });
          setDone((prev) => new Set(prev).add(i));
        }
        setActiveIdx(STEPS.length);
        await new Promise<void>((res) => { t = setTimeout(res, 2500); });
      }
    }
    run();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, []);

  const totalMs = STEPS.reduce((s, x) => s + x.durationMs, 0);
  const elapsed = STEPS.slice(0, Math.max(0, activeIdx + 1)).reduce((s, x) => s + x.durationMs, 0);
  const pct = Math.min(100, (elapsed / totalMs) * 100);

  return (
    <div className="bg-surface border border-white/[0.07] rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Store Builder · live demo
        </div>
        <div className="text-[11px] font-mono text-white/40 tabular-nums">
          {(elapsed / 1000).toFixed(1)}s / {(totalMs / 1000).toFixed(0)}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #d4af37, #10b981)' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="space-y-2.5">
        {STEPS.map((s, i) => {
          const isActive = activeIdx === i;
          const isDone = done.has(i);
          const isPending = !isActive && !isDone;

          return (
            <motion.div
              key={i}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors"
              style={{
                background: isActive ? 'rgba(212,175,55,0.08)' : isDone ? 'rgba(16,185,129,0.04)' : 'transparent',
                borderColor: isActive ? 'rgba(212,175,55,0.25)' : isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
              }}
            >
              <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div key="load" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 size={14} className="text-[#e5c158] animate-spin" />
                    </motion.div>
                  )}
                  {isDone && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <Check size={14} className="text-emerald-400" />
                    </motion.div>
                  )}
                  {isPending && (
                    <motion.div key="pend" className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isPending ? 'text-white/40' : 'text-white/90'}`}>
                  {s.label}
                </div>
                <div className={`text-xs font-mono mt-0.5 truncate ${isPending ? 'text-white/20' : 'text-white/50'}`}>
                  {s.detail}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {activeIdx >= STEPS.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-2.5"
        >
          <Check size={14} />
          Store built in 11 minutes. Now it's your turn.
        </motion.div>
      )}
    </div>
  );
}
