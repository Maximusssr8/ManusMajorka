// Directive 3 — cursor-reactive spring-physics particle field.
// Drop-in replacement for primitives/ParticleField.
// - Up to 120 on desktop / 40 on mobile
// - Cursor within 120px: repulsion ∝ (1 - d/120)²
// - Spring (damp=0.85, stiff=0.1) returns particles to drift
// - Respects prefers-reduced-motion (gentle drift only)
// - Pauses on document.hidden

import { type CSSProperties, useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../primitives';

interface Props {
  count?: number;
  className?: string;
  style?: CSSProperties;
}

export function ParticleFieldReactive({ count, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1, y: -1, active: false });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const N = count ?? (isMobile ? 40 : 120);

    let raf = 0;
    let running = true;
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
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

    type P = { x: number; y: number; homeVx: number; homeVy: number; vx: number; vy: number; r: number; a: number };
    const ps: P[] = Array.from({ length: N }, () => {
      const vx = (Math.random() - 0.5) * 0.3;
      const vy = (Math.random() - 0.5) * 0.3;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        homeVx: vx, homeVy: vy,
        vx, vy,
        r: 0.8 + Math.random() * 1.4,
        a: 0.3 + Math.random() * 0.5,
      };
    });

    function onMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onLeave() { mouseRef.current.active = false; }
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    function onVis() { running = !document.hidden; if (running) loop(); }
    document.addEventListener('visibilitychange', onVis);

    const R_RADIUS = 120;
    const STIFF = 0.1;
    const DAMP = 0.85;

    function loop() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      const m = mouseRef.current;

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];

        if (!reduced && m.active) {
          const dx = p.x - m.x, dy = p.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R_RADIUS * R_RADIUS && d2 > 0) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R_RADIUS);
            const imp = f * f * 1.8;
            p.vx += (dx / d) * imp;
            p.vy += (dy / d) * imp;
          }
        }

        // Spring back toward drift velocity
        if (!reduced) {
          p.vx += (p.homeVx - p.vx) * STIFF;
          p.vy += (p.homeVy - p.vy) * STIFF;
          p.vx *= DAMP;
          p.vy *= DAMP;
          // Ensure a minimum drift so particles never fully stall when damp+spring zero them out.
          if (Math.abs(p.vx) < 0.05) p.vx = p.homeVx;
          if (Math.abs(p.vy) < 0.05) p.vy = p.homeVy;
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) { p.vx *= -1; p.homeVx *= -1; p.x = Math.max(0, Math.min(W, p.x)); }
        if (p.y < 0 || p.y > H) { p.vy *= -1; p.homeVy *= -1; p.y = Math.max(0, Math.min(H, p.y)); }

        ctx.beginPath();
        ctx.fillStyle = `rgba(212,175,55,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connection lines
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], b = ps[j];
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
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
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
        pointerEvents: 'auto',
        ...style,
      }}
    />
  );
}

export default ParticleFieldReactive;
