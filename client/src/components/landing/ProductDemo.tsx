import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, TrendingUp, Calculator, Kanban, Package, Pause, Play } from 'lucide-react';

type Scene = 'products' | 'trending' | 'product-detail' | 'profit-calc' | 'research-board';
const SCENES: Scene[] = ['products', 'trending', 'product-detail', 'profit-calc', 'research-board'];
const SCENE_DURATION = 3500;
const SCENE_LABELS: Record<Scene, string> = {
  products: 'Product Intelligence',
  trending: 'Live Trend Feed',
  'product-detail': 'Product Analysis',
  'profit-calc': 'Profit Calculator',
  'research-board': 'Research Board',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ── Sidebar ────────────────────────────────────────────────────── */

function DemoSidebar({ activeScene }: { activeScene: Scene }) {
  const navItems = [
    { id: 'products', label: 'Products', icon: BarChart2 },
    { id: 'trending', label: 'Trends', icon: TrendingUp },
    { id: 'research-board', label: 'Research', icon: Kanban },
    { id: 'profit-calc', label: 'Calculator', icon: Calculator },
  ];

  return (
    <div className="w-36 border-r flex flex-col py-3 px-2 flex-shrink-0" style={{ borderColor: 'var(--border)', background: '#050505' }}>
      <div className="px-2 mb-4">
        <span className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Majorka</span>
      </div>
      <div className="space-y-0.5">
        {navItems.map(item => (
          <div key={item.id} className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors',
            (activeScene === item.id || (activeScene === 'product-detail' && item.id === 'products'))
              ? 'text-white' : 'text-white/25'
          )} style={(activeScene === item.id || (activeScene === 'product-detail' && item.id === 'products')) ? { background: 'rgba(255,255,255,0.06)', borderRight: '2px solid white' } : undefined}>
            <item.icon className="w-3 h-3 flex-shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
      <div className="mt-auto px-2 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white/30" style={{ background: 'rgba(255,255,255,0.08)' }}>M</div>
        <div><div className="text-[9px] text-white/40">Max S.</div><div className="text-[8px] text-white/15">Scale</div></div>
      </div>
    </div>
  );
}

/* ── Scene 1: Products ──────────────────────────────────────────── */

function SceneProducts() {
  const fakeProducts = [
    { name: 'Magnetic Phone Wallet', orders: 8420, score: 94, market: 'AU', trend: 'hot' as const },
    { name: 'LED Strip Controller', orders: 6102, score: 87, market: 'US', trend: 'rising' as const },
    { name: 'Posture Corrector Pro', orders: 11340, score: 91, market: 'UK', trend: 'hot' as const },
    { name: 'Desk Cable Organiser', orders: 3891, score: 72, market: 'AU', trend: 'rising' as const },
    { name: 'Mini Air Purifier', orders: 5220, score: 79, market: 'US', trend: null },
    { name: 'Portable UV Sanitiser', orders: 9100, score: 88, market: 'UK', trend: 'hot' as const },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="p-3 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Product Intelligence</div>
          <div className="text-[9px] text-white/30 mt-0.5">2,302 products tracked</div>
        </div>
        <div className="flex gap-1.5">
          <div className="text-[9px] border rounded px-1.5 py-0.5 text-white/25" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Export</div>
          <div className="text-[9px] bg-white text-black rounded px-1.5 py-0.5 font-medium">Import</div>
        </div>
      </div>
      <motion.div className="grid grid-cols-3 gap-1.5" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} initial="initial" animate="animate">
        {fakeProducts.map((product, i) => (
          <motion.div key={i} variants={{ initial: { opacity: 0, y: 10, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 } }} transition={{ duration: 0.25, ease: 'easeOut' }} className={cn('rounded overflow-hidden', i === 0 ? 'border-white/15' : '')} style={{ background: '#0f0f0f', border: '1px solid #1c1c1c' }}>
            <div className="aspect-square flex items-center justify-center relative" style={{ background: '#141414' }}>
              <div className="w-6 h-6 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
              {product.trend === 'hot' && <div className="absolute top-1 right-1 text-[7px] rounded px-1 py-px" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>Hot</div>}
              {product.trend === 'rising' && <div className="absolute top-1 right-1 text-[7px] rounded px-1 py-px" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>Rising</div>}
              <div className="absolute bottom-1 left-1 text-[7px] rounded px-1 py-px" style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>{product.market}</div>
            </div>
            <div className="p-1.5">
              <div className="text-[9px] text-white/60 leading-tight mb-1 truncate">{product.name}</div>
              <div className="flex items-center justify-between">
                <div><div className="text-[11px] font-mono font-semibold text-white">{product.orders.toLocaleString()}</div><div className="text-[7px] text-white/25">orders</div></div>
                <div className="text-right"><div className="text-[10px] font-mono font-semibold text-white">{product.score}</div><div className="text-[7px] text-white/25">score</div></div>
              </div>
              <div className="mt-1 h-px rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${product.score}%` }} transition={{ duration: 0.6, delay: i * 0.08 + 0.3, ease: 'easeOut' }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Scene 2: Trending ──────────────────────────────────────────── */

function SceneTrending() {
  const events = [
    { flag: '\u{1F1E6}\u{1F1FA}', text: 'Magnetic Phone Wallet', stat: '+340 orders in 6h', score: 94, color: 'green' },
    { flag: '\u{1F1FA}\u{1F1F8}', text: 'LED Strip Controller', stat: 'Velocity: 89/100', score: 89, color: 'green' },
    { flag: '\u{1F1EC}\u{1F1E7}', text: 'Posture Corrector Pro', stat: '+1,200 orders this week', score: 91, color: 'amber' },
    { flag: '\u{1F1E6}\u{1F1FA}', text: 'Portable UV Sanitiser', stat: 'Entering top 50', score: 88, color: 'green' },
    { flag: '\u{1F1FA}\u{1F1F8}', text: 'Mini Air Purifier', stat: 'Stable', score: 72, color: 'neutral' },
    { flag: '\u{1F1EC}\u{1F1E7}', text: 'Desk Cable Organiser', stat: 'New entrant', score: 77, color: 'amber' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="p-3 h-full">
      <div className="mb-3">
        <div className="text-[11px] font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Live Trend Feed</div>
        <div className="flex items-center gap-1 mt-0.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-green-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <div className="text-[9px] text-white/30">1,776 trending now</div>
        </div>
      </div>
      <div className="space-y-1">
        {events.map((event, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.12 }} className="flex items-center gap-2 p-2 rounded" style={{ background: '#0f0f0f', border: '1px solid #1c1c1c' }}>
            <span className="text-sm">{event.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-white/70 truncate">{event.text}</div>
              <div className="text-[8px] text-white/25">{event.stat}</div>
            </div>
            <div className={cn('text-[11px] font-mono font-semibold', event.color === 'green' ? 'text-green-400' : event.color === 'amber' ? 'text-amber-400' : 'text-white/30')}>{event.score}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Scene 3: Product Detail ────────────────────────────────────── */

function SceneProductDetail() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative h-full">
      <div className="p-3 opacity-25 blur-[1px] pointer-events-none">
        <div className="text-[11px] font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Product Intelligence</div>
        <div className="grid grid-cols-3 gap-1.5">{[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded" style={{ background: '#0f0f0f', border: '1px solid #1c1c1c' }} />)}</div>
      </div>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280, delay: 0.2 }} className="absolute inset-y-0 right-0 w-56 flex flex-col overflow-hidden" style={{ background: '#0a0a0a', borderLeft: '1px solid #1c1c1c' }}>
        <div className="aspect-video flex items-center justify-center flex-shrink-0" style={{ background: '#141414' }}>
          <Package className="w-6 h-6 text-white/8" />
        </div>
        <div className="p-2.5 flex-1 overflow-hidden">
          <div className="text-[10px] font-medium text-white mb-0.5">Magnetic Phone Wallet</div>
          <div className="text-[8px] text-white/25 mb-2">AliExpress · Phone Accessories</div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {[{ label: 'Orders', value: '8,420', color: 'text-white' }, { label: 'Score', value: '94', color: 'text-white' }, { label: 'Revenue', value: '$42.1K', color: 'text-green-400' }, { label: 'Trend', value: '\u2191 89', color: 'text-amber-400' }].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }} className="rounded p-1.5" style={{ background: '#111', border: '1px solid #1c1c1c' }}>
                <div className={cn('text-[10px] font-mono font-semibold', stat.color)}>{stat.value}</div>
                <div className="text-[7px] text-white/25">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="mb-2">
            <div className="text-[8px] text-white/25 mb-1">30-day trend</div>
            <svg viewBox="0 0 200 40" className="w-full h-6">
              <motion.path d="M0,35 C20,30 40,25 60,20 S100,10 120,8 S160,5 180,4 L200,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.6 }} />
              <defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.08" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
              <motion.path d="M0,35 C20,30 40,25 60,20 S100,10 120,8 S160,5 180,4 L200,3 L200,40 L0,40 Z" fill="url(#cf)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} />
            </svg>
          </div>
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white text-black text-[9px] font-medium rounded px-2 py-1 text-center">Generate AI Brief</motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Scene 4: Profit Calculator ─────────────────────────────────── */

function SceneProfitCalc() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 600), setTimeout(() => setStep(2), 1200), setTimeout(() => setStep(3), 1800)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const sellPrice = 29.99;
  const cost = 7.50;
  const shipping = 4.99;
  const adSpend = 8.00;
  const gross = sellPrice - cost - shipping;
  const net = gross - adSpend - sellPrice * 0.029;
  const margin = ((net / sellPrice) * 100).toFixed(1);
  const roas = (sellPrice / adSpend).toFixed(2);

  const fields = [
    { label: 'Sell Price', value: `$${sellPrice.toFixed(2)}` },
    { label: 'Product Cost', value: `$${cost.toFixed(2)}` },
    { label: 'Shipping', value: `$${shipping.toFixed(2)}` },
    { label: 'Ad Spend', value: `$${adSpend.toFixed(2)}` },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="p-3 h-full">
      <div className="text-[11px] font-semibold text-white mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>Profit Calculator</div>
      <div className="text-[9px] text-white/25 mb-3">Magnetic Phone Wallet</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {fields.map((field, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
              <div className="text-[8px] text-white/25 mb-0.5">{field.label}</div>
              <div className={cn('rounded px-2 py-1 text-[10px] font-mono', i <= step ? 'text-white' : 'text-white/30')} style={{ background: '#0f0f0f', border: `1px solid ${i === step ? 'rgba(255,255,255,0.3)' : '#1c1c1c'}` }}>
                {field.value}
                {i === step && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: 3 }} className="inline-block w-px h-2.5 bg-white ml-0.5 align-middle" />}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="space-y-1.5">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 1 : 0 }} className="rounded p-2" style={{ background: '#0f0f0f', border: '1px solid #1c1c1c' }}>
            <div className="text-[8px] text-white/25">Gross Profit</div>
            <div className="text-[11px] font-mono text-white">${gross.toFixed(2)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 3 ? 1 : 0 }} className="rounded p-2" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="text-[8px] text-white/25">Net Profit</div>
            <div className="text-[11px] font-mono font-semibold text-green-400">${net.toFixed(2)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 3 ? 1 : 0 }} className="rounded p-2" style={{ background: '#0f0f0f', border: '1px solid #1c1c1c' }}>
            <div className="text-[8px] text-white/25">Net Margin</div>
            <div className="text-[11px] font-mono text-white">{margin}%</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 3 ? 1 : 0 }} className="rounded p-2" style={{ background: '#0f0f0f', border: '1px solid #1c1c1c' }}>
            <div className="text-[8px] text-white/25">Break-even ROAS</div>
            <div className="text-[11px] font-mono text-amber-400">{roas}x</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene 5: Research Board ────────────────────────────────────── */

function SceneResearchBoard() {
  const [cardCol, setCardCol] = useState<'watching' | 'testing'>('watching');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDragging(true), 1000);
    const t2 = setTimeout(() => { setCardCol('testing'); setDragging(false); }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const columns = [
    { id: 'watching', label: 'Watching', color: 'text-blue-400' },
    { id: 'testing', label: 'Testing', color: 'text-amber-400' },
    { id: 'winning', label: 'Winning', color: 'text-green-400' },
  ];

  const DragCard = ({ name, score, border }: { name: string; score: number; border?: string }) => (
    <div className="rounded p-1.5" style={{ background: '#0f0f0f', border: `1px solid ${border || '#1c1c1c'}` }}>
      <div className="text-[9px] text-white/60 mb-0.5">{name}</div>
      <div className="flex justify-between"><span className="text-[8px] text-white/25">Score</span><span className="text-[8px] font-mono text-white">{score}</span></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="p-3 h-full">
      <div className="text-[11px] font-semibold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>Research Board</div>
      <div className="grid grid-cols-3 gap-2">
        {columns.map(col => (
          <div key={col.id} className="space-y-1">
            <div className={cn('text-[9px] font-medium uppercase tracking-wider mb-1', col.color)}>{col.label}</div>
            {col.id === 'watching' && <>
              {cardCol === 'watching' && <motion.div animate={dragging ? { scale: 1.04, rotate: 1, x: 30, y: -8, opacity: 0.8, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' } : {}} transition={{ duration: 0.3 }}><DragCard name="Magnetic Phone Wallet" score={94} /></motion.div>}
              <DragCard name="LED Strip Controller" score={87} />
            </>}
            {col.id === 'testing' && <>
              {cardCol === 'testing' && <DragCard name="Magnetic Phone Wallet" score={94} border="rgba(245,158,11,0.3)" />}
              <DragCard name="Mini Air Purifier" score={79} />
            </>}
            {col.id === 'winning' && <DragCard name="Posture Corrector Pro" score={91} border="rgba(34,197,94,0.2)" />}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Controls ───────────────────────────────────────────────────── */

function DemoControls({ scenes, currentIndex, isPlaying, onToggle, onSceneSelect }: {
  scenes: Scene[]; currentIndex: number; isPlaying: boolean;
  onToggle: () => void; onSceneSelect: (i: number) => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-2.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
      <div className="flex items-center gap-2.5">
        <button onClick={onToggle} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }} aria-label={isPlaying ? 'Pause demo' : 'Play demo'}>
          {isPlaying ? <Pause className="w-2.5 h-2.5 text-white" /> : <Play className="w-2.5 h-2.5 text-white ml-px" />}
        </button>
        <div className="flex-1 flex gap-1">
          {scenes.map((_, i) => (
            <button key={i} onClick={() => onSceneSelect(i)} className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer" style={{ background: 'rgba(255,255,255,0.08)' }} aria-label={`Go to scene ${i + 1}`}>
              <motion.div className="h-full bg-white rounded-full origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: i < currentIndex ? 1 : i === currentIndex && isPlaying ? 1 : 0 }} transition={i === currentIndex ? { duration: SCENE_DURATION / 1000, ease: 'linear' } : { duration: 0.2 }} />
            </button>
          ))}
        </div>
        <div className="text-[9px] text-white/25 font-mono flex-shrink-0">{currentIndex + 1}/{scenes.length}</div>
      </div>
    </div>
  );
}

/* ── Main Export ─────────────────────────────────────────────────── */

export function ProductDemo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const currentScene = SCENES[sceneIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setSceneIndex(i => (i + 1) % SCENES.length), SCENE_DURATION);
    return () => clearInterval(timer);
  }, [isPlaying, sceneIndex]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/10', border: '1px solid var(--border)', background: '#080808' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 h-8" style={{ background: '#0d0d0d', borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" /><div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" /><div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" /></div>
        <div className="flex-1 mx-3"><div className="rounded px-2 py-0.5 text-[9px] text-white/15 font-mono w-36 mx-auto text-center" style={{ background: '#111' }}>app.majorka.io</div></div>
      </div>

      {/* App */}
      <div className="flex" style={{ height: 'calc(100% - 32px)' }}>
        <DemoSidebar activeScene={currentScene} />
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentScene === 'products' && <SceneProducts key="p" />}
            {currentScene === 'trending' && <SceneTrending key="t" />}
            {currentScene === 'product-detail' && <SceneProductDetail key="d" />}
            {currentScene === 'profit-calc' && <SceneProfitCalc key="c" />}
            {currentScene === 'research-board' && <SceneResearchBoard key="r" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Scene label */}
      <AnimatePresence mode="wait">
        <motion.div key={currentScene} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-10 right-3 rounded px-2 py-1" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[9px] text-white/50 font-mono">{SCENE_LABELS[currentScene]}</span>
        </motion.div>
      </AnimatePresence>

      <DemoControls scenes={SCENES} currentIndex={sceneIndex} isPlaying={isPlaying} onToggle={() => setIsPlaying(p => !p)} onSceneSelect={setSceneIndex} />
    </div>
  );
}
