import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FomoEvent {
  city: string;
  name: string;
  action: string;
  detail: string;
  accent: string;
}

const EVENTS: FomoEvent[] = [
  { city: 'Melbourne', name: 'Sarah K.',   action: 'flagged a winner',        detail: '$47k/mo pet niche product',      accent: '#10b981' },
  { city: 'Sydney',    name: 'James L.',   action: 'launched their first ad', detail: 'Meta creative via Ads Studio',   accent: '#6366f1' },
  { city: 'Brisbane',  name: 'Ayana P.',   action: 'made their first sale',   detail: '$89 AOV, 54% margin',            accent: '#10b981' },
  { city: 'Perth',     name: 'Tom R.',     action: 'built a store',           detail: '11 min, 12 products imported',   accent: '#f59e0b' },
  { city: 'Adelaide',  name: 'Lena M.',    action: 'hit $1k day',             detail: 'Home & kitchen, 4 SKUs',         accent: '#10b981' },
  { city: 'Auckland',  name: 'Noah T.',    action: 'tracked 8 products',      detail: 'Velocity alert triggered 2x',    accent: '#6366f1' },
  { city: 'Gold Coast',name: 'Priya S.',   action: 'scaled to $12k/mo',      detail: 'Scale plan, 3 alerts hot',       accent: '#10b981' },
  { city: 'Wellington',name: 'Harper J.',  action: 'beat a competitor',       detail: 'Spotted via Competitor Spy',     accent: '#f59e0b' },
  { city: 'Canberra',  name: 'Omar B.',    action: 'found a rising niche',    detail: '+340% 7-day velocity',           accent: '#6366f1' },
  { city: 'Hobart',    name: 'Chloe D.',   action: 'saved a list',            detail: '23 winners under $20 CoGS',      accent: '#f59e0b' },
];

/**
 * FOMO belt. Rotates a pseudo-live feed of operator activity every 4s.
 * Copy is hand-written (not AI slop) and rotates deterministically.
 */
export function FomoTicker() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % EVENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const e = EVENTS[i];

  return (
    <div className="relative w-full overflow-hidden bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
      <div className="flex items-center gap-4 px-5 py-4 md:px-6">
        {/* Live pulse */}
        <div className="relative flex-shrink-0">
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: e.accent, opacity: 0.5 }}
          />
          <span
            className="relative block w-2.5 h-2.5 rounded-full"
            style={{ background: e.accent, boxShadow: `0 0 10px ${e.accent}` }}
          />
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 flex-shrink-0">
          LIVE
        </span>

        <div className="relative flex-1 h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center gap-2 text-sm truncate"
            >
              <span className="text-white/90 font-medium">{e.name}</span>
              <span className="text-white/40">from</span>
              <span className="text-white/70">{e.city}</span>
              <span className="text-white/40">·</span>
              <span style={{ color: e.accent }} className="font-medium">{e.action}</span>
              <span className="text-white/40 hidden sm:inline">—</span>
              <span className="text-white/60 hidden sm:inline truncate">{e.detail}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <span className="text-[10px] font-mono text-white/30 flex-shrink-0 hidden md:inline">
          {String(i + 1).padStart(2, '0')}/{String(EVENTS.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
