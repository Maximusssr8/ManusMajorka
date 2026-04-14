/**
 * Subtle animated gradient background used behind the hero.
 * Pure CSS keyframes — no JS, no canvas. Respects prefers-reduced-motion.
 */
export function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Radial spotlight */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full blur-3xl opacity-40 academy-float"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)',
        }}
      />
      {/* Secondary emerald blob */}
      <div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-25 academy-float-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
        }}
      />
      {/* Amber accent */}
      <div
        className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 academy-float-slower"
        style={{
          background:
            'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />
      <style>{`
        @keyframes academyFloat {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50%      { transform: translate(-50%, 30px) scale(1.05); }
        }
        @keyframes academyFloatSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-40px, 20px) scale(1.08); }
        }
        @keyframes academyFloatSlower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(30px, -20px) scale(1.1); }
        }
        .academy-float        { animation: academyFloat 12s ease-in-out infinite; }
        .academy-float-slow   { animation: academyFloatSlow 16s ease-in-out infinite; }
        .academy-float-slower { animation: academyFloatSlower 20s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .academy-float, .academy-float-slow, .academy-float-slower { animation: none; }
        }
      `}</style>
    </div>
  );
}
