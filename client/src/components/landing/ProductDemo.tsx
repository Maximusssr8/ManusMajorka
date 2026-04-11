import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, TrendingUp, Calculator, Pause, Play } from 'lucide-react';

type Scene = 'products' | 'trending' | 'calculator';
const SCENES: Scene[] = ['products', 'trending', 'calculator'];
const DURATION = 4000;
const LABELS: Record<Scene, string> = { products: 'Product Intelligence', trending: 'Live Trends', calculator: 'Profit Calculator' };

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } };

const PRODUCTS = [
  { name: 'Magnetic Phone Wallet', orders: '8.4K', score: 94, price: '$12.99', market: 'AU', trend: 'hot' },
  { name: 'LED Strip Controller', orders: '6.1K', score: 87, price: '$8.50', market: 'US', trend: 'rising' },
  { name: 'Posture Corrector Pro', orders: '11.3K', score: 91, price: '$15.20', market: 'UK', trend: 'hot' },
  { name: 'Mini Air Purifier', orders: '5.2K', score: 79, price: '$22.00', market: 'US', trend: null },
  { name: 'Desk Cable Organiser', orders: '3.9K', score: 72, price: '$6.80', market: 'AU', trend: 'rising' },
];

const TRENDS = [
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'Magnetic Phone Wallet', delta: '+340 in 6h', score: 94 },
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'LED Strip Controller', delta: 'Velocity: 89', score: 89 },
  { flag: '\u{1F1EC}\u{1F1E7}', name: 'Posture Corrector Pro', delta: '+1.2K this week', score: 91 },
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'UV Sanitiser', delta: 'Top 50 entry', score: 88 },
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'Mini Air Purifier', delta: 'Stable', score: 72 },
];

function SceneProducts() {
  return (
    <motion.div {...fade} className="h-full flex flex-col p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Product Intelligence</div>
          <div className="text-[10px] text-white/30 mt-0.5">2,302 products across AU, US, UK</div>
        </div>
        <div className="flex gap-1.5">
          <div className="text-[9px] px-2 py-1 rounded bg-white text-black font-semibold">Import</div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 gap-1.5">
          {PRODUCTS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.25 }}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.03] transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-8 h-8 rounded bg-white/[0.04] flex-shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm bg-white/[0.08]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/80 truncate">{p.name}</div>
                <div className="text-[9px] text-white/25">{p.market} · {p.price}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-mono font-semibold text-white tabular-nums">{p.orders}</div>
                <div className="text-[9px] text-white/25">orders</div>
              </div>
              <div className="w-8 text-right flex-shrink-0">
                <span className="text-[10px] font-mono font-bold text-white">{p.score}</span>
              </div>
              {p.trend === 'hot' && <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20 flex-shrink-0">Hot</span>}
              {p.trend === 'rising' && <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">Rising</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SceneTrending() {
  return (
    <motion.div {...fade} className="h-full flex flex-col p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <motion.div className="w-2 h-2 rounded-full bg-green-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <div className="text-xs font-semibold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Live Trend Feed</div>
        <span className="text-[9px] text-white/25">1,776 trending</span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-hidden">
        {TRENDS.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-base flex-shrink-0">{t.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-white/80 truncate">{t.name}</div>
              <div className="text-[9px] text-white/30">{t.delta}</div>
            </div>
            <span className={`text-sm font-mono font-semibold tabular-nums ${t.score >= 85 ? 'text-green-400' : t.score >= 75 ? 'text-amber-400' : 'text-white/40'}`}>{t.score}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SceneCalculator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 500), setTimeout(() => setStep(2), 1000), setTimeout(() => setStep(3), 1500)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const sell = 29.99, cost = 7.50, ship = 4.99, ads = 8.00;
  const net = sell - cost - ship - ads - sell * 0.029;
  const margin = ((net / sell) * 100).toFixed(1);

  return (
    <motion.div {...fade} className="h-full flex flex-col p-4 md:p-5">
      <div className="text-xs font-semibold text-white mb-1 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Profit Calculator</div>
      <div className="text-[9px] text-white/25 mb-4">Magnetic Phone Wallet</div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="space-y-2">
          {[{ l: 'Sell Price', v: `$${sell}` }, { l: 'Product Cost', v: `$${cost}` }, { l: 'Shipping', v: `$${ship}` }, { l: 'Ad Spend', v: `$${ads}` }].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i <= step ? 1 : 0.3 }} className="rounded px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${i === step ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
              <div className="text-[8px] text-white/25">{f.l}</div>
              <div className="text-[11px] font-mono text-white tabular-nums">{f.v}</div>
            </motion.div>
          ))}
        </div>
        <div className="space-y-2">
          <motion.div animate={{ opacity: step >= 3 ? 1 : 0 }} className="rounded p-2.5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="text-[8px] text-white/25">Net Profit</div>
            <div className="text-sm font-mono font-semibold text-green-400 tabular-nums">${net.toFixed(2)}</div>
          </motion.div>
          <motion.div animate={{ opacity: step >= 3 ? 1 : 0 }} className="rounded p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[8px] text-white/25">Net Margin</div>
            <div className="text-sm font-mono font-semibold text-white tabular-nums">{margin}%</div>
          </motion.div>
          <motion.div animate={{ opacity: step >= 3 ? 1 : 0 }} className="rounded p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[8px] text-white/25">Break-even ROAS</div>
            <div className="text-sm font-mono font-semibold text-amber-400 tabular-nums">{(sell / ads).toFixed(2)}x</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Controls({ scenes, idx, playing, onToggle, onSelect }: { scenes: Scene[]; idx: number; playing: boolean; onToggle: () => void; onSelect: (i: number) => void }) {
  return (
    <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-px" />}
        </button>
        <div className="flex-1 flex gap-1.5">
          {scenes.map((_, i) => (
            <button key={i} onClick={() => onSelect(i)} className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer" style={{ background: 'rgba(255,255,255,0.08)' }} aria-label={`Scene ${i + 1}`}>
              <motion.div className="h-full bg-white rounded-full origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: i < idx ? 1 : i === idx && playing ? 1 : 0 }} transition={i === idx ? { duration: DURATION / 1000, ease: 'linear' } : { duration: 0.2 }} />
            </button>
          ))}
        </div>
        <span className="text-[9px] text-white/20 font-mono tabular-nums flex-shrink-0">{idx + 1}/{scenes.length}</span>
      </div>
    </div>
  );
}

export function ProductDemo() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIdx(i => (i + 1) % SCENES.length), DURATION);
    return () => clearInterval(t);
  }, [playing, idx]);

  const scene = SCENES[idx];

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9', background: '#080808', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 h-9" style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1">
          <div className="mx-auto w-40 rounded px-2 py-0.5 text-center text-[9px] text-white/15 font-mono" style={{ background: 'rgba(255,255,255,0.04)' }}>app.majorka.io</div>
        </div>
      </div>

      {/* App area */}
      <div className="flex" style={{ height: 'calc(100% - 36px)' }}>
        {/* Mini sidebar */}
        <div className="w-40 md:w-44 border-r flex-shrink-0 flex flex-col py-3 px-2" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#050505' }}>
          <div className="px-2 mb-4 text-[11px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Majorka</div>
          <div className="space-y-0.5 flex-1">
            {([['products', 'Products', BarChart2], ['trending', 'Trends', TrendingUp], ['calculator', 'Calculator', Calculator]] as const).map(([id, label, Icon]) => (
              <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors" style={scene === id ? { background: 'rgba(255,255,255,0.06)', color: '#fff', borderRight: '2px solid #fff' } : { color: 'rgba(255,255,255,0.25)' }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="px-2 flex items-center gap-2 mt-auto">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white/30" style={{ background: 'rgba(255,255,255,0.06)' }}>M</div>
            <div><div className="text-[9px] text-white/40">Max</div><div className="text-[7px] text-white/15">Scale</div></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {scene === 'products' && <SceneProducts key="p" />}
            {scene === 'trending' && <SceneTrending key="t" />}
            {scene === 'calculator' && <SceneCalculator key="c" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Scene label */}
      <AnimatePresence mode="wait">
        <motion.div key={scene} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-11 right-3 rounded px-2 py-1" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[9px] text-white/40 font-mono">{LABELS[scene]}</span>
        </motion.div>
      </AnimatePresence>

      <Controls scenes={SCENES} idx={idx} playing={playing} onToggle={() => setPlaying(p => !p)} onSelect={setIdx} />
    </div>
  );
}
