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

// ── Blink cursor ──────────────────────────────────────────────────────────────

const BLINK_STYLE = `
  @keyframes sba-blink { 50% { opacity: 0; } }
  @keyframes sba-grid-expand { 0% { transform: scale(0.3); opacity: 0; } 40% { opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
  @keyframes sba-gold-pulse { 0%, 100% { box-shadow: 0 0 40px rgba(212,175,55,0.08), 0 0 80px rgba(100,149,237,0.06); } 50% { box-shadow: 0 0 60px rgba(212,175,55,0.18), 0 0 120px rgba(100,149,237,0.12); } }
  @keyframes sba-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
`;

// ── Animation phases ──────────────────────────────────────────────────────────
// 0 = idle/black
// 1 = typing text
// 2 = grid pulse
// 3 = browser building (sub-phases via browserStep)
// 4 = complete hold
// 5 = fade out

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

export default function StoreBuilderAnimation() {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>(0);
  const [browserStep, setBrowserStep] = useState(0);
  // browserStep: 0=none, 1=chrome, 2=nav, 3=product-img, 4=title, 5=price, 6=button, 7=stars, 8=badge
  const [visible, setVisible] = useState(true);
  const cancelRef = useRef<boolean>(false);

  const typingText = 'majorka.ai — initialising store build...';
  const productTitle = 'LED Smart Ring Light Pro';

  const typingActive = phase === 1;
  const titleTypingActive = browserStep >= 4 && phase === 3;

  const displayedInit = useTypingEffect(typingText, typingActive, 35);
  const displayedTitle = useTypingEffect(productTitle, titleTypingActive, 45);

  useEffect(() => {
    cancelRef.current = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(() => {
          if (!cancelRef.current) resolve();
        }, ms);
        return id;
      });

    const run = async () => {
      // Reset
      setPhase(0);
      setBrowserStep(0);
      setVisible(true);
      await sleep(200);

      if (cancelRef.current) return;

      // Phase 1 — typing
      setPhase(1);
      await sleep(1600); // let text type + read

      if (cancelRef.current) return;

      // Phase 2 — grid pulse
      setPhase(2);
      await sleep(900);

      if (cancelRef.current) return;

      // Phase 3 — browser builds
      setPhase(3);
      setBrowserStep(1); // chrome
      await sleep(400);

      if (cancelRef.current) return;
      setBrowserStep(2); // nav
      await sleep(400);

      if (cancelRef.current) return;
      setBrowserStep(3); // product image
      await sleep(600);

      if (cancelRef.current) return;
      setBrowserStep(4); // title types
      await sleep(1100); // time for title to type

      if (cancelRef.current) return;
      setBrowserStep(5); // price
      await sleep(500);

      if (cancelRef.current) return;
      setBrowserStep(6); // button
      await sleep(500);

      if (cancelRef.current) return;
      setBrowserStep(7); // stars
      await sleep(550);

      if (cancelRef.current) return;
      setBrowserStep(8); // badge

      // Phase 4 — complete hold
      await sleep(400);
      if (cancelRef.current) return;
      setPhase(4);
      await sleep(1400);

      // Phase 5 — fade out
      if (cancelRef.current) return;
      setPhase(5);
      setVisible(false);
      await sleep(800);

      // Loop
      if (!cancelRef.current) {
        run();
      }
    };

    run();

    return () => {
      cancelRef.current = true;
    };
  }, []);

  return (
    <>
      <style>{BLINK_STYLE}</style>

      {/* Mobile scaling wrapper */}
      <div style={isMobile ? { maxHeight: 280, overflow: 'hidden' } : {}}>
      <div style={isMobile ? { transform: 'scale(0.75)', transformOrigin: 'top center', width: '100%' } : {}}>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="sba-outer"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 5 ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 360,
              borderRadius: 12,
              background: '#080a0e',
              border: '1px solid rgba(212,175,55,0.1)',
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
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: 13,
                      color: '#d4af37',
                      letterSpacing: '0.02em',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span>{displayedInit}</span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 2,
                        height: '1em',
                        background: '#d4af37',
                        marginLeft: 2,
                        animation: 'sba-blink 0.8s step-end infinite',
                        verticalAlign: 'middle',
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 2: Grid pulse ── */}
            <AnimatePresence>
              {phase === 2 && (
                <motion.div
                  key="grid-pulse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: 300,
                      height: 300,
                      animation: 'sba-grid-expand 0.9s ease-out forwards',
                      backgroundImage: `
                        linear-gradient(rgba(212,175,55,0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(212,175,55,0.15) 1px, transparent 1px)
                      `,
                      backgroundSize: '30px 30px',
                      maskImage: 'radial-gradient(circle at center, black 20%, transparent 80%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 80%)',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Phase 3/4: Browser window ── */}
            <AnimatePresence>
              {(phase === 3 || phase === 4) && browserStep >= 1 && (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: '16px',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(212,175,55,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow:
                      phase === 4
                        ? '0 0 40px rgba(212,175,55,0.12), inset 0 0 60px rgba(0,0,0,0.3)'
                        : '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Browser chrome */}
                  <div
                    style={{
                      background: '#161b22',
                      borderRadius: '10px 10px 0 0',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      flexShrink: 0,
                    }}
                  >
                    {/* Traffic lights */}
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
                    </div>
                    {/* URL bar */}
                    <div
                      style={{
                        flex: 1,
                        background: '#0d1117',
                        borderRadius: 4,
                        padding: '3px 10px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span style={{ color: '#4ade80', fontSize: 8 }}>●</span>
                      majorka.ai/store
                    </div>
                  </div>

                  {/* Store content */}
                  <div
                    style={{
                      flex: 1,
                      background: '#0a0c10',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Store nav */}
                    <AnimatePresence>
                      {browserStep >= 2 && (
                        <motion.div
                          key="store-nav"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          style={{
                            background: '#0d1117',
                            borderBottom: '1px solid rgba(212,175,55,0.15)',
                            padding: '10px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'Syne, sans-serif',
                              color: '#d4af37',
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                            }}
                          >
                            MAJORKA STORE
                          </span>
                          <span
                            style={{
                              color: '#6b7280',
                              fontSize: 9,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Products · About · Cart
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Product area */}
                    <div
                      style={{
                        flex: 1,
                        padding: '16px 14px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 14,
                        alignItems: 'center',
                      }}
                    >
                      {/* Product image placeholder */}
                      <AnimatePresence>
                        {browserStep >= 3 && (
                          <motion.div
                            key="product-img"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{
                              height: 140,
                              borderRadius: 8,
                              background:
                                'linear-gradient(135deg, #1a1d24 0%, #252833 50%, #1e2130 100%)',
                              backgroundSize: '200% 100%',
                              animation: 'sba-shimmer 2.5s ease-in-out infinite',
                              boxShadow:
                                '0 0 40px rgba(100,149,237,0.12), inset 0 0 30px rgba(100,149,237,0.05)',
                              border: '1px solid rgba(100,149,237,0.1)',
                            }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Product info column */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          justifyContent: 'center',
                          minHeight: 140,
                        }}
                      >
                        {/* Title */}
                        <AnimatePresence>
                          {browserStep >= 4 && (
                            <motion.div
                              key="product-title"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                fontFamily: 'Syne, sans-serif',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1.3,
                                minHeight: 32,
                              }}
                            >
                              {displayedTitle}
                              {titleTypingActive && displayedTitle.length < productTitle.length && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 1.5,
                                    height: '0.9em',
                                    background: '#d4af37',
                                    marginLeft: 1,
                                    animation: 'sba-blink 0.8s step-end infinite',
                                    verticalAlign: 'middle',
                                  }}
                                />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Price */}
                        <AnimatePresence>
                          {browserStep >= 5 && (
                            <motion.div
                              key="price"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{
                                fontFamily: 'Syne, sans-serif',
                                fontSize: 18,
                                fontWeight: 900,
                                color: '#d4af37',
                              }}
                            >
                              $89.99 AUD
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Add to Cart */}
                        <AnimatePresence>
                          {browserStep >= 6 && (
                            <motion.button
                              key="add-to-cart"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
                              style={{
                                background: '#d4af37',
                                color: '#080a0e',
                                border: 'none',
                                borderRadius: 5,
                                padding: '7px 12px',
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 800,
                                fontSize: 10,
                                cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(212,175,55,0.4)',
                                letterSpacing: '0.03em',
                              }}
                            >
                              Add to Cart
                            </motion.button>
                          )}
                        </AnimatePresence>

                        {/* Stars */}
                        <AnimatePresence>
                          {browserStep >= 7 && (
                            <motion.div
                              key="stars"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{
                                color: '#f59e0b',
                                fontSize: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
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

                    {/* ── Completion badge ── */}
                    <AnimatePresence>
                      {browserStep >= 8 && (
                        <motion.div
                          key="badge"
                          initial={{ opacity: 0, scale: 0.8, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
                          style={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            background: 'rgba(12,14,20,0.92)',
                            border: '1px solid rgba(74,222,128,0.35)',
                            borderRadius: 20,
                            padding: '4px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 9,
                            color: '#4ade80',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            backdropFilter: 'blur(8px)',
                            zIndex: 20,
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#4ade80',
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          Built by Majorka AI · 12s
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder to maintain layout when invisible */}
      {!visible && (
        <div
          style={{
            width: '100%',
            minHeight: 360,
            borderRadius: 12,
            background: '#080a0e',
            border: '1px solid rgba(212,175,55,0.05)',
          }}
        />
      )}

      </div>{/* end mobile scale wrapper */}
      </div>{/* end mobile height wrapper */}
    </>
  );
}
