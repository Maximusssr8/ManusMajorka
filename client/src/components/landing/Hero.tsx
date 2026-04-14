import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link } from 'wouter';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const GOLD = '#d4af37';
const BLUE = '#3B82F6';
const display = "'Syne', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

function AnimatedScore({ target, reduced }: { target: number; reduced: boolean }): ReactElement {
  const mv = useMotionValue(reduced ? target : 0);
  const [shown, setShown] = useState<number>(reduced ? target : 0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = mv.on('change', (v) => setShown(Math.round(v)));
    return () => unsub();
  }, [mv]);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const controls = animate(mv, target, { duration: 1.6, ease: 'easeOut' });
            io.disconnect();
            return () => controls.stop();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mv, target, reduced]);

  return (
    <div
      ref={ref}
      style={{
        fontFamily: mono,
        fontWeight: 700,
        fontSize: 42,
        lineHeight: 1,
        color: GOLD,
      }}
    >
      {shown}
    </div>
  );
}

function Sparkline({ reduced }: { reduced: boolean }): ReactElement {
  return (
    <svg width="100%" height="48" viewBox="0 0 240 48" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.4" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,40 L20,36 L40,38 L60,30 L80,32 L100,24 L120,26 L140,18 L160,20 L180,12 L200,14 L220,6 L240,4"
        fill="none"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

function MarketBar({ label, pct, delay, reduced }: { label: string; pct: number; delay: number; reduced: boolean }): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: mono, fontSize: 11, color: '#a1a1aa', width: 28 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: reduced ? `${pct}%` : 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay }}
          style={{ height: '100%', background: `linear-gradient(90deg,${GOLD},#f4d77a)` }}
        />
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color: '#ededed', width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

export function Hero(): ReactElement {
  const reduced = useReducedMotion() ?? false;

  return (
    <section
      style={{
        position: 'relative',
        padding: '80px 20px 60px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr)',
          gap: 48,
          alignItems: 'center',
        }}
        className="mj-hero-grid"
      >
        <style>{`
          @media (min-width: 900px) {
            .mj-hero-grid { grid-template-columns: 1.1fr 1fr !important; }
          }
        `}</style>

        <div>
          <motion.div
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(212,175,55,0.12)',
              border: `1px solid ${GOLD}`,
              color: GOLD,
              borderRadius: 999,
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
            }}
          >
            AI-POWERED PRODUCT INTELLIGENCE
          </motion.div>

          <motion.h1
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            style={{
              fontFamily: display,
              fontWeight: 800,
              fontSize: 'clamp(36px, 7vw, 64px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#ededed',
              margin: '20px 0 16px',
            }}
          >
            Find Winning Products <br />
            <span style={{ color: GOLD }}>Before Anyone Else</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: reduced ? 1 : 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: sans,
              fontSize: 'clamp(16px,2vw,18px)',
              lineHeight: 1.55,
              color: '#a1a1aa',
              maxWidth: 560,
              marginBottom: 28,
            }}
          >
            Real-time AliExpress trend data, AI market analysis, and ad generation for AU,
            US &amp; UK dropshippers. 7 days free — no card required.
          </motion.p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <Link
              href="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 24px',
                background: `linear-gradient(135deg,${GOLD} 0%,#f4d77a 50%,${GOLD} 100%)`,
                color: '#111',
                fontFamily: sans,
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 8px 32px -8px rgba(212,175,55,0.6), 0 0 0 1px rgba(212,175,55,0.4)',
              }}
            >
              Start Your 7-Day Free Trial
            </Link>
            <a
              href="#how"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '14px 20px',
                background: 'transparent',
                color: '#ededed',
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.14)',
                textDecoration: 'none',
              }}
            >
              See How It Works →
            </a>
          </div>

          <div
            style={{
              fontFamily: sans,
              fontSize: 13,
              color: '#8a8a8f',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <span>✓ 3,715 products tracked</span>
            <span>✓ No credit card</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#52525b', letterSpacing: '0.1em' }}>
              MAJORKA · PRODUCT
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg,#1a1a1f,#2a2a30)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                color: '#52525b',
                fontSize: 10,
              }}
            >
              IMG
            </div>
            <div>
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ededed',
                  marginBottom: 4,
                }}
              >
                Magnetic Posture Corrector
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#a1a1aa' }}>
                $24.90 AUD · 12,847 sold
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                  padding: '2px 8px',
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                  fontFamily: mono,
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 4,
                }}
              >
                <TrendingUp size={10} strokeWidth={2.5} /> +218% 7d
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ fontFamily: mono, fontSize: 10, color: '#52525b', letterSpacing: '0.1em' }}>
              TREND VELOCITY SCORE
            </div>
          </div>
          <AnimatedScore target={94} reduced={reduced} />
          <div style={{ marginTop: 6, marginBottom: 18 }}>
            <Sparkline reduced={reduced} />
          </div>

          <div style={{ fontFamily: mono, fontSize: 10, color: '#52525b', letterSpacing: '0.1em', marginBottom: 10 }}>
            MARKET SPLIT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <MarketBar label="AU" pct={54} delay={0.0} reduced={reduced} />
            <MarketBar label="US" pct={28} delay={0.15} reduced={reduced} />
            <MarketBar label="UK" pct={18} delay={0.3} reduced={reduced} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
