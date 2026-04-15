// Shared primitives for the Majorka landing page.
// Each is minimal, transform/opacity-only, respects prefers-reduced-motion.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { LT, F } from '@/lib/landingTokens';

// ── Reduced motion hook ─────────────────────────────────────────────────────
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

// ── ParticleField — gold particles canvas ───────────────────────────────────
export function ParticleField({
  count = 60,
  className,
  style,
}: { count?: number; className?: string; style?: CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas || !ctx) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 0.8 + Math.random() * 1.4,
      a: 0.3 + Math.random() * 0.5,
    }));

    function onVis() {
      running = !document.hidden;
      if (running) loop();
    }
    document.addEventListener('visibilitychange', onVis);

    function loop() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      // update + draw
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(212,175,55,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            const o = (1 - d / 80) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(212,175,55,${o})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [count, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

// ── CountUp ─────────────────────────────────────────────────────────────────
export function CountUp({
  to,
  duration = 1500,
  format = (v: number) => v.toLocaleString('en-AU'),
  startOnView = true,
  style,
}: {
  to: number;
  duration?: number;
  format?: (v: number) => string;
  startOnView?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!startOnView) return;
    if (!inView) return;
    if (reduced) { setValue(to); return; }
    const start = performance.now();
    let raf = 0;
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced, startOnView]);

  return <span ref={ref} style={style}>{format(value)}</span>;
}

// ── Typewriter ──────────────────────────────────────────────────────────────
export function Typewriter({
  text,
  speed = 32,
  startDelay = 0,
  style,
  onDone,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  style?: CSSProperties;
  onDone?: () => void;
}) {
  const [out, setOut] = useState('');
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) { setOut(text); onDone?.(); return; }
    let i = 0;
    let timer: number | undefined;
    const startT = window.setTimeout(() => {
      timer = window.setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(timer);
          onDone?.();
        }
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(startT);
      if (timer) window.clearInterval(timer);
    };
  }, [text, speed, startDelay, reduced, onDone]);
  return <span style={style}>{out}</span>;
}

// ── SparklineDraw — animated SVG sparkline ──────────────────────────────────
export function SparklineDraw({
  values,
  width = 240,
  height = 60,
  color = LT.success,
  strokeWidth = 2,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const ref = useRef<SVGPathElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(wrapRef, { once: true, margin: '-10%' });
  const reduced = usePrefersReducedMotion();

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const d = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    const length = path.getTotalLength();
    if (reduced || !inView) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return;
    }
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 1500ms ease-out';
    path.style.strokeDashoffset = '0';
  }, [inView, reduced, d]);

  return (
    <div ref={wrapRef} style={{ display: 'inline-block', lineHeight: 0 }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <path
          ref={ref}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── RevealWords — split H1 into words, stagger in ───────────────────────────
export function RevealWords({
  text,
  delay = 0,
  stagger = 0.08,
  style,
}: { text: string; delay?: number; stagger?: number; style?: CSSProperties }) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={reduced ? false : { y: 30, opacity: 0 }}
          animate={reduced ? undefined : { y: 0, opacity: 1 }}
          transition={{ delay: delay + i * stagger, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

// ── MarketSplitBars ────────────────────────────────────────────────────────
export function MarketSplitBars({
  data = [
    { label: 'AU', pct: 42 },
    { label: 'US', pct: 35 },
    { label: 'UK', pct: 23 },
  ],
  color = LT.gold,
}: { data?: { label: string; pct: number }[]; color?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduced = usePrefersReducedMotion();
  return (
    <div ref={ref} style={{ display: 'grid', gap: 14 }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 48px', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.textMute, letterSpacing: '0.05em' }}>{d.label}</span>
          <div style={{ height: 6, borderRadius: 100, background: LT.border, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: inView || reduced ? `${d.pct}%` : 0,
                background: color,
                transition: reduced ? 'none' : `width 500ms ease-out ${i * 500}ms`,
                borderRadius: 100,
              }}
            />
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: LT.text, textAlign: 'right' }}>{d.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ── ScrollChevron — fades out on scroll > 40 ────────────────────────────────
export function ScrollChevron() {
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    function onScroll() { setHidden(window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: hidden ? 0 : 0.6,
        transition: 'opacity 250ms ease',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        width: 24,
        height: 24,
        color: LT.gold,
        animation: reduced ? undefined : 'mjChevronBounce 1.8s ease-in-out infinite',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── FadeUp — generic whileInView fade ───────────────────────────────────────
export function FadeUp({
  children,
  delay = 0,
  y = 20,
  style,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}
