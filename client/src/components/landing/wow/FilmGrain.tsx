// Directive 7 — 3% gold film grain overlay.
// Luxury cue; 30fps; single 256x256 pre-rendered tile translated frame-to-frame
// so GPU cost stays near zero. Respects prefers-reduced-motion.

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../primitives';

export function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Build one 256x256 noise tile with gold-tinted alpha.
    const TILE = 256;
    const off = document.createElement('canvas');
    off.width = TILE;
    off.height = TILE;
    const octx = off.getContext('2d');
    if (!octx) return;
    const img = octx.createImageData(TILE, TILE);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = Math.random() * 255;
      // Gold RGB shifted to match 212,175,55 but kept subtle.
      img.data[i] = 212;
      img.data[i + 1] = 175;
      img.data[i + 2] = 55;
      // 3% opacity maximum; jittered.
      img.data[i + 3] = Math.random() < 0.5 ? 0 : Math.floor(n * 0.08);
    }
    octx.putImageData(img, 0, 0);

    let raf = 0;
    let last = 0;
    const FPS = 30;
    const FRAME_MS = 1000 / FPS;
    let running = true;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function onVis() { running = !document.hidden; if (running) loop(performance.now()); }
    document.addEventListener('visibilitychange', onVis);

    function loop(now: number) {
      if (!running || !ctx || !canvas) return;
      if (now - last >= FRAME_MS) {
        last = now;
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        // Two jittered translations = masks obvious tiling.
        const ox = Math.floor(Math.random() * TILE);
        const oy = Math.floor(Math.random() * TILE);
        for (let x = -ox; x < W; x += TILE) {
          for (let y = -oy; y < H; y += TILE) {
            ctx.drawImage(off, x, y);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        mixBlendMode: 'overlay',
        opacity: 0.6,
      }}
    />
  );
}

export default FilmGrain;
