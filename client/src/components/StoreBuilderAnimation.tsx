import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── Typing hook ───────────────────────────────────────────────────────────────
function useTypingEffect(text: string, active: boolean, speed = 38) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active) {
      setDisplayed('');
      return;
    }
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [active, text, speed]);

  return displayed;
}

// ── Revenue counter hook ──────────────────────────────────────────────────────
function useRevenueCounter(active: boolean, target: number, duration: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setValue(target); clearInterval(id); }
      else setValue(cur);
    }, duration / steps);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return value;
}

// ── Budget counter component ──────────────────────────────────────────────────
function BudgetCounter({ target, active }: { target: number; active: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const steps = 20;
    const duration = 600;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.round(cur));
    }, duration / steps);
    return () => clearInterval(id);
  }, [active, target]);
  return <>${val}/day</>;
}

// ── CSS keyframes ─────────────────────────────────────────────────────────────
const BLINK_STYLE = `
  @keyframes sba-blink { 50% { opacity: 0; } }
  @keyframes sba-grid-expand { 0% { transform: scale(0.3); opacity: 0; } 40% { opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
  @keyframes sba-gold-pulse { 0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.08), 0 0 80px rgba(100,149,237,0.06); } 50% { box-shadow: 0 0 60px rgba(99,102,241,0.18), 0 0 120px rgba(100,149,237,0.12); } }
  @keyframes sba-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes sba-gold-flash { 0% { opacity: 0; } 25% { opacity: 1; } 75% { opacity: 1; } 100% { opacity: 0; } }
`;

// ── Animation phases ──────────────────────────────────────────────────────────
// 0=idle 1=typing 2=grid 3=browser-build 4=complete-hold
// 5=license 6=ads 7=orders 8=fulfilment 9=profit 10=cta-flash 11=fade-out
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// ── Shared panel style ────────────────────────────────────────────────────────
const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(10,12,18,0.97)',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: 10,
  padding: 20,
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
  color: '#e5e7eb',
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
};

export default function StoreBuilderAnimation() {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>(0);
  const [browserStep, setBrowserStep] = useState(0);
  const [licenseStep, setLicenseStep] = useState(0);
  const [adsStep, setAdsStep] = useState(0);
  const [ordersStep, setOrdersStep] = useState(0);
  const [fulfilmentStep, setFulfilmentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const cancelRef = useRef<boolean>(false);

  const typingText = 'majorka.ai — initialising store build...';
  const productTitle = 'LED Smart Ring Light Pro';

  const typingActive = phase === 1;
  const titleTypingActive = browserStep >= 4 && phase === 3;

  const displayedInit = useTypingEffect(typingText, typingActive, 35);
  const displayedTitle = useTypingEffect(productTitle, titleTypingActive, 45);

  const revenue = useRevenueCounter(phase === 9, 3879.57, 1500);

  useEffect(() => {
    cancelRef.current = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!cancelRef.current) resolve();
        }, ms);
      });

    const run = async () => {
      // Reset
      setPhase(0);
      setBrowserStep(0);
      setLicenseStep(0);
      setAdsStep(0);
      setOrdersStep(0);
      setFulfilmentStep(0);
      setVisible(true);
      await sleep(200);
      if (cancelRef.current) return;

      // Phase 1 — typing
      setPhase(1);
      await sleep(1600);
      if (cancelRef.current) return;

      // Phase 2 — grid pulse
      setPhase(2);
      await sleep(900);
      if (cancelRef.current) return;

      // Phase 3 — browser builds
      setPhase(3);
      setBrowserStep(1);
      await sleep(400);
      if (cancelRef.current) return;
      setBrowserStep(2);
      await sleep(400);
      if (cancelRef.current) return;
      setBrowserStep(3);
      await sleep(600);
      if (cancelRef.current) return;
      setBrowserStep(4);
      await sleep(1100);
      if (cancelRef.current) return;
      setBrowserStep(5);
      await sleep(500);
      if (cancelRef.current) return;
      setBrowserStep(6);
      await sleep(500);
      if (cancelRef.current) return;
      setBrowserStep(7);
      await sleep(550);
      if (cancelRef.current) return;
      setBrowserStep(8);
      await sleep(400);

      // Phase 4 — complete hold
      if (cancelRef.current) return;
      setPhase(4);
      await sleep(1400);

      // Phase 5 — License Activation (7.2–9s)
      if (cancelRef.current) return;
      setPhase(5);
      setLicenseStep(0);
      await sleep(400);
      if (cancelRef.current) return;
      setLicenseStep(1);
      await sleep(300);
      if (cancelRef.current) return;
      setLicenseStep(2);
      await sleep(300);
      if (cancelRef.current) return;
      setLicenseStep(3);
      await sleep(300);
      if (cancelRef.current) return;
      setLicenseStep(4);
      await sleep(800);

      // Phase 6 — Ads Launch (9–12s)
      if (cancelRef.current) return;
      setPhase(6);
      setAdsStep(0);
      await sleep(400);
      if (cancelRef.current) return;
      setAdsStep(1);
      await sleep(400);
      if (cancelRef.current) return;
      setAdsStep(2);
      await sleep(400);
      if (cancelRef.current) return;
      setAdsStep(3);
      await sleep(1800);

      // Phase 7 — Orders Coming In (12–16s)
      if (cancelRef.current) return;
      setPhase(7);
      setOrdersStep(0);
      await sleep(200);
      if (cancelRef.current) return;
      setOrdersStep(1);
      await sleep(800);
      if (cancelRef.current) return;
      setOrdersStep(2);
      await sleep(800);
      if (cancelRef.current) return;
      setOrdersStep(3);
      await sleep(600);
      if (cancelRef.current) return;
      setOrdersStep(4);
      await sleep(1200);

      // Phase 8 — Fulfilment (16–18s)
      if (cancelRef.current) return;
      setPhase(8);
      setFulfilmentStep(0);
      await sleep(600);
      if (cancelRef.current) return;
      setFulfilmentStep(1);
      await sleep(600);
      if (cancelRef.current) return;
      setFulfilmentStep(2);
      await sleep(600);
      if (cancelRef.current) return;
      setFulfilmentStep(3);
      await sleep(600);

      // Phase 9 — Profit Dashboard (18–21s)
      if (cancelRef.current) return;
      setPhase(9);
      await sleep(3000);

      // Phase 10 — CTA Flash (21–22s)
      if (cancelRef.current) return;
      setPhase(10);
      await sleep(1000);

      // Phase 11 — fade out
      if (cancelRef.current) return;
      setPhase(11);
      setVisible(false);
      await sleep(800);

      // Loop
      if (!cancelRef.current) run();
    };

    run();
    return () => { cancelRef.current = true; };
  }, []);

  return (
    <>
      <style>{BLINK_STYLE}</style>

      {/* Mobile scaling wrapper */}
      <div style={isMobile ? { maxHeight: 380, overflow: 'hidden' } : {}}>
      <div style={isMobile ? { transform: 'scale(0.75)', transformOrigin: 'top center', width: '100%' } : {}}>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="sba-outer"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 11 ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 380,
              borderRadius: 12,
              background: '#FAFAFA',
              border: '1px solid rgba(99,102,241,0.1)',
              overflow: 'hidden',
              animation: phase === 4 ? 'sba-gold-pulse 2s ease-in-out infinite' : 'none',
              boxShadow:
                phase === 4
                  ? '0 0 60px rgba(100,149,237,0.15), 0 0 120px rgba(100,149,237,0.08), 0 40px 80px rgba(0,0,0,0.6)'
                  : '0 0 60px rgba(100,149,237,0.08), 0 40px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* ── Phase 1: Typing text ── */}
            <AnimatePresence>
              {phase === 1 && (
                <motion.div
                  key="init-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px', zIndex: 10,
                  }}
                >
                  <div style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: 13, color: '#6366F1', letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <span>{displayedInit}</span>
                    <span style={{
                      display: 'inline-block', width: 2, height: '1em',
                      background: '#6366F1', marginLeft: 2,
                      animation: 'sba-blink 0.8s step-end infinite', verticalAlign: 'middle',
                    }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 2: Grid pulse ── */}
            <AnimatePresence>
              {phase === 2 && (
                <motion.div
                  key="grid-pulse"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                  }}
                >
                  <div style={{
                    width: 300, height: 300,
                    animation: 'sba-grid-expand 0.9s ease-out forwards',
                    backgroundImage: `
                      linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                    maskImage: 'radial-gradient(circle at center, black 20%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 80%)',
                  }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 3/4/5: Browser window ── */}
            <AnimatePresence>
              {(phase === 3 || phase === 4 || phase === 5) && browserStep >= 1 && (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: phase === 5 ? 0.35 : 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: '16px', borderRadius: 10,
                    overflow: 'hidden', border: '1px solid rgba(99,102,241,0.12)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: phase === 4
                      ? '0 0 40px rgba(99,102,241,0.12), inset 0 0 60px rgba(0,0,0,0.3)'
                      : '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Browser chrome */}
                  <div style={{
                    background: '#161b22', borderRadius: '10px 10px 0 0',
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
                    </div>
                    <div style={{
                      flex: 1, background: 'white', borderRadius: 4,
                      padding: '3px 10px', fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ color: '#4ade80', fontSize: 8 }}>●</span>
                      majorka.ai/store
                    </div>
                  </div>

                  {/* Store content */}
                  <div style={{
                    flex: 1, background: '#F3F4F6',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {/* Store nav */}
                    <AnimatePresence>
                      {browserStep >= 2 && (
                        <motion.div
                          key="store-nav"
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          style={{
                            background: 'white',
                            borderBottom: '1px solid rgba(99,102,241,0.15)',
                            padding: '10px 16px', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
                          }}
                        >
                          <span style={{
                            fontFamily: 'Syne, sans-serif', color: '#6366F1',
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                          }}>MAJORKA STORE</span>
                          <span style={{ color: '#6b7280', fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>
                            Products · About · Cart
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Product area */}
                    <div style={{
                      flex: 1, padding: '16px 14px',
                      display: 'grid', gridTemplateColumns: '1fr 1fr',
                      gap: 14, alignItems: 'center',
                    }}>
                      {/* Product image */}
                      <AnimatePresence>
                        {browserStep >= 3 && (
                          <motion.div
                            key="product-img"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{ height: 140, borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                          >
                            {/* Shimmer fallback (renders behind the image) */}
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(135deg, #1a1d24 0%, #252833 50%, #1e2130 100%)',
                              backgroundSize: '200% 100%',
                              animation: 'sba-shimmer 2.5s ease-in-out infinite',
                              zIndex: 0,
                            }} />
                            <div style={{
                                width: '100%', height: 140,
                                borderRadius: 6, position: 'relative', zIndex: 1,
                                background: 'linear-gradient(135deg, #0d1117 0%, #141b24 50%, #0d1117 100%)',
                                border: '1px solid rgba(99,102,241,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
                              }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="#6366F1" strokeOpacity="0.35" strokeWidth="1.5"/>
                                  <path d="M8 21h8M12 17v4" stroke="#6366F1" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span style={{ color: 'rgba(99,102,241,0.4)', fontSize: 10, letterSpacing: '0.12em', fontFamily: 'Syne, sans-serif' }}>PRODUCT</span>
                              </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Product info */}
                      <div style={{
                        display: 'flex', flexDirection: 'column',
                        gap: 8, justifyContent: 'center', minHeight: 140,
                      }}>
                        <AnimatePresence>
                          {browserStep >= 4 && (
                            <motion.div
                              key="product-title"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                fontFamily: 'Syne, sans-serif', fontSize: 12,
                                fontWeight: 700, color: '#fff', lineHeight: 1.3, minHeight: 32,
                              }}
                            >
                              {displayedTitle}
                              {titleTypingActive && displayedTitle.length < productTitle.length && (
                                <span style={{
                                  display: 'inline-block', width: 1.5, height: '0.9em',
                                  background: '#6366F1', marginLeft: 1,
                                  animation: 'sba-blink 0.8s step-end infinite', verticalAlign: 'middle',
                                }} />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {browserStep >= 5 && (
                            <motion.div
                              key="price"
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 900, color: '#6366F1' }}
                            >
                              $89.99 AUD
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {browserStep >= 6 && (
                            <motion.button
                              key="add-to-cart"
                              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
                              style={{
                                background: '#6366F1', color: '#080a0e', border: 'none',
                                borderRadius: 5, padding: '7px 12px',
                                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                                fontSize: 10, cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(99,102,241,0.4)', letterSpacing: '0.03em',
                              }}
                            >
                              Add to Cart
                            </motion.button>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {browserStep >= 7 && (
                            <motion.div
                              key="stars"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ color: '#f59e0b', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <span>★★★★★</span>
                              <span style={{ color: '#9ca3af', fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>
                                4.9 (247)
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Completion badge */}
                    <AnimatePresence>
                      {browserStep >= 8 && (
                        <motion.div
                          key="badge"
                          initial={{ opacity: 0, scale: 0.8, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
                          style={{
                            position: 'absolute', bottom: 10, right: 10,
                            background: 'rgba(12,14,20,0.92)',
                            border: '1px solid rgba(74,222,128,0.35)', borderRadius: 20,
                            padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 9, color: '#4ade80',
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                            backdropFilter: 'blur(8px)', zIndex: 20,
                          }}
                        >
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: '#4ade80', display: 'inline-block', flexShrink: 0,
                          }} />
                          Built by Majorka AI · 12s
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 5: License Activation ── */}
            <AnimatePresence>
              {phase === 5 && (
                <motion.div
                  key="license-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    ...PANEL_STYLE, zIndex: 30,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <div style={{ width: '100%', maxWidth: 320 }}>
                    <div style={{
                      color: '#6366F1', fontSize: 14, fontWeight: 700,
                      marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span>◈</span> MAJORKA LICENSE
                    </div>

                    {(['Store activated', 'AU dropshipping enabled', 'Supplier network connected', 'Payment gateway live'] as const).map((text, i) => (
                      <AnimatePresence key={text}>
                        {licenseStep > i && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, fontSize: 12 }}
                          >
                            <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span>
                            <span style={{ color: '#e5e7eb' }}>{text}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}

                    <div style={{ marginTop: 18 }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.08)', borderRadius: 4,
                        height: 6, overflow: 'hidden', marginBottom: 6,
                      }}>
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: licenseStep > 0 ? '100%' : '0%' }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #6366F1, #f0cc6a)',
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280' }}>
                        <span>Store is live — majorka.ai/store</span>
                        <span style={{ color: '#6366F1' }}>100%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 6: Ads Launch ── */}
            <AnimatePresence>
              {phase === 6 && (
                <motion.div
                  key="ads-panel"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  style={{ ...PANEL_STYLE, zIndex: 30 }}
                >
                  <div style={{ color: '#6366F1', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                    📱 AD CAMPAIGNS LAUNCHED
                  </div>

                  {([
                    { name: 'TikTok Shop', budget: 15 },
                    { name: 'Facebook', budget: 20 },
                    { name: 'Google', budget: 10 },
                  ] as const).map((platform, i) => (
                    <AnimatePresence key={platform.name}>
                      {adsStep > i && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: '#e5e7eb', width: 100 }}>{platform.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: '#4ade80', display: 'inline-block',
                              animation: 'pulse-dot 1.5s ease-in-out infinite',
                            }} />
                            <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>LIVE</span>
                          </span>
                          <span style={{ color: '#9ca3af', fontSize: 11, width: 60, textAlign: 'right' }}>
                            <BudgetCounter target={platform.budget} active={adsStep > i} />
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}

                  <AnimatePresence>
                    {adsStep >= 3 && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        style={{ marginTop: 18, color: '#9ca3af', fontSize: 11, lineHeight: 1.9 }}
                      >
                        <div>Reach: <span style={{ color: '#e5e7eb' }}>47,000 AU shoppers/day</span></div>
                        <div>Est. CTR: <span style={{ color: '#e5e7eb' }}>3.2%</span></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 7: Orders Coming In ── */}
            <AnimatePresence>
              {phase === 7 && (
                <motion.div
                  key="orders-panel"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  style={{ ...PANEL_STYLE, zIndex: 30, overflowY: 'auto' }}
                >
                  {([
                    { id: '#1847', name: 'Sarah M.', city: 'Sydney NSW',      qty: 1, price: '$89.99 AUD'  },
                    { id: '#1848', name: 'Jake T.',  city: 'Brisbane QLD',    qty: 2, price: '$179.98 AUD' },
                    { id: '#1849', name: 'Emma R.',  city: 'Melbourne VIC',   qty: 1, price: '$89.99 AUD'  },
                  ] as const).map((order, i) => (
                    <AnimatePresence key={order.id}>
                      {ordersStep > i && (
                        <motion.div
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderLeft: '3px solid #4ade80',
                            borderRadius: 6, padding: '10px 12px', marginBottom: 8,
                          }}
                        >
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 4,
                          }}>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>🛒 NEW ORDER</span>
                            <span style={{
                              fontFamily: 'monospace', color: '#6366F1',
                              fontSize: 11, fontWeight: 700,
                            }}>{order.id}</span>
                          </div>
                          <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 4 }}>
                            {order.name} · {order.city}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: 11 }}>
                              LED Smart Ring Light × {order.qty}
                            </span>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{order.price}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}

                  <AnimatePresence>
                    {ordersStep >= 4 && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{
                          color: '#6366F1', fontSize: 11, fontWeight: 600,
                          textAlign: 'center', marginTop: 4,
                        }}
                      >
                        +44 more orders today
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 8: Fulfilment ── */}
            <AnimatePresence>
              {phase === 8 && (
                <motion.div
                  key="fulfilment-panel"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  style={{ ...PANEL_STYLE, zIndex: 30 }}
                >
                  <div style={{ color: '#6366F1', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    📦 AUTO FULFILMENT
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 14 }}>
                    Supplier: CJ Dropshipping
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }} />

                  {([
                    { id: '#1847', shipped: true  },
                    { id: '#1848', shipped: true  },
                    { id: '#1849', shipped: false },
                  ] as const).map((item, i) => (
                    <AnimatePresence key={item.id}>
                      {fulfilmentStep > i && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            display: 'flex', alignItems: 'center',
                            gap: 10, marginBottom: 12, fontSize: 11,
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', color: '#6366F1', width: 46 }}>{item.id}</span>
                          <div style={{
                            flex: 1, background: 'rgba(255,255,255,0.06)',
                            borderRadius: 3, height: 5, overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={{ width: '0%' }}
                              animate={{ width: '80%' }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                background: item.shipped ? '#4ade80' : '#6366F1',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span style={{
                            color: item.shipped ? '#4ade80' : '#9ca3af',
                            width: 80, textAlign: 'right',
                          }}>
                            {item.shipped ? 'Shipped ✓' : 'Processing'}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}

                  <div style={{ marginTop: 10, color: '#6b7280', fontSize: 11 }}>
                    Avg ship: <span style={{ color: '#e5e7eb' }}>4 days AU</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 9: Profit Dashboard ── */}
            <AnimatePresence>
              {phase === 9 && (
                <motion.div
                  key="profit-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  style={{ ...PANEL_STYLE, zIndex: 30 }}
                >
                  <div style={{ color: '#6366F1', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                    💰 TODAY'S PERFORMANCE
                  </div>

                  {/* Revenue counter */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>Revenue</div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
                      color: '#6366F1',
                      textShadow: '0 0 30px rgba(99,102,241,0.55), 0 0 60px rgba(99,102,241,0.25)',
                    }}>
                      ${revenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 18 }}>
                    {([
                      { label: 'Orders',   value: '47',        extra: '↑ 23%',      extraColor: '#4ade80' },
                      { label: 'Profit',   value: '$2,131.76', extra: 'margin 55%', extraColor: '#9ca3af' },
                      { label: 'Ad Spend', value: '$1,050.00', extra: '',           extraColor: ''        },
                      { label: 'ROAS',     value: '3.7×',      extra: '✅ Healthy', extraColor: '#4ade80' },
                    ] as const).map((m) => (
                      <div key={m.label}>
                        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 3 }}>{m.label}</div>
                        <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 12 }}>
                          {m.value}
                          {m.extra && (
                            <span style={{ color: m.extraColor, fontSize: 10, marginLeft: 6 }}>{m.extra}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Day progress bar */}
                  <div>
                    <div style={{
                      background: 'rgba(255,255,255,0.06)', borderRadius: 4,
                      height: 5, overflow: 'hidden', marginBottom: 5,
                    }}>
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '8%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: '#6366F1', borderRadius: 4 }}
                      />
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 10 }}>Day 1 of your store</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 10: CTA Flash ── */}
            <AnimatePresence>
              {phase === 10 && (
                <motion.div
                  key="cta-flash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 40,
                    background: 'rgba(99,102,241,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'sba-gold-flash 1s ease-in-out forwards',
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{
                      fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
                      color: '#6366F1', letterSpacing: '0.05em',
                    }}
                  >
                    Built with Majorka
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder to maintain layout when invisible */}
      {!visible && (
        <div style={{
          width: '100%', minHeight: 380, borderRadius: 12,
          background: '#FAFAFA', border: '1px solid rgba(99,102,241,0.05)',
        }} />
      )}

      </div>{/* end mobile scale wrapper */}
      </div>{/* end mobile height wrapper */}
    </>
  );
}
