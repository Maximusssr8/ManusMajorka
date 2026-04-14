import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { Badge } from './Badge';
import { GoldButton } from './GoldButton';
import { GhostButton } from './GhostButton';

interface HeroProps {
  onStart: () => void;
  onCurriculum: () => void;
  publicMode: boolean;
}

/**
 * Full-viewport hero with an animated gold grid background, a live "Trend
 * Velocity Score" mini card, and the primary two-CTA conversion block.
 */
export function Hero({ onStart, onCurriculum, publicMode }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-24 md:pt-32 md:pb-36">
      {/* Animated gold grid */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 75%)',
          animation: 'academyGridPulse 8s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes academyGridPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.65; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mkr-academy-anim { animation: none !important; }
        }
      `}</style>
      {/* Radial gold glow */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[18%] -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.18) 0%, transparent 65%)' }}
      />

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid items-center gap-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-block"
            >
              <Badge tone="gold" icon={<Sparkles size={11} />}>
                Free Academy · 48 lessons · No card required
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-[36px] font-bold leading-[1.05] tracking-tight text-[#E0E0E0] sm:text-5xl md:text-[56px]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Master Dropshipping with{' '}
              <span className="bg-gradient-to-br from-[#e5c158] via-[#d4af37] to-[#a88620] bg-clip-text text-transparent">
                Data, Not Guesswork
              </span>
              .
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-[#9CA3AF]"
            >
              Eight modules. Forty-eight lessons. Written by operators running real stores in Sydney,
              London, and New York. Completely free.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <GoldButton size="lg" onClick={onStart}>
                Start Learning — It's Free
                <ArrowRight size={16} />
              </GoldButton>
              <GhostButton size="lg" onClick={onCurriculum}>
                View Curriculum
              </GhostButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-x-10 gap-y-4"
            >
              <div>
                <div
                  className="text-2xl font-semibold tabular-nums text-[#E0E0E0]"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <AnimatedCounter to={500} suffix="+" />
                </div>
                <div className="mt-0.5 text-[11px] font-mono uppercase tracking-widest text-[#9CA3AF]">
                  AU · US · UK dropshippers enrolled
                </div>
              </div>
              <div>
                <div
                  className="text-2xl font-semibold tabular-nums text-[#E0E0E0]"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <AnimatedCounter to={48} />
                </div>
                <div className="mt-0.5 text-[11px] font-mono uppercase tracking-widest text-[#9CA3AF]">
                  Data-driven lessons
                </div>
              </div>
            </motion.div>

            {publicMode ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.55 }}
                className="mt-8 text-xs text-[#6B7280]"
              >
                No signup needed to start. Upgrade for the live product database when you're ready.
              </motion.div>
            ) : null}
          </div>

          <HeroVelocityCard />
        </div>
      </div>
    </section>
  );
}

function HeroVelocityCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[360px] rounded-2xl border p-6"
      style={{
        borderColor: 'rgba(212,175,55,0.2)',
        background: 'linear-gradient(180deg, #111111 0%, #0d0d0d 100%)',
        boxShadow: '0 30px 80px -30px rgba(212,175,55,0.25), inset 0 1px 0 rgba(212,175,55,0.06)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">Live Product Intel</span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          LIVE
        </span>
      </div>
      <div className="text-sm text-[#9CA3AF]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Trend Velocity Score
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div
          className="text-6xl font-bold tabular-nums text-[#d4af37]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          <AnimatedCounter to={94} duration={2.2} />
        </div>
        <div className="text-sm text-emerald-300">+38% this week</div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #d4af37, #e5c158)' }}
          initial={{ width: 0 }}
          animate={{ width: '94%' }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.05] pt-5">
        {[
          { label: 'Orders', value: 14523, prefix: '' },
          { label: 'Avg Price', value: 47, prefix: '$' },
          { label: 'Markets', value: 3, prefix: '' },
        ].map((m) => (
          <div key={m.label}>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#6B7280]">{m.label}</div>
            <div
              className="mt-1 text-sm font-semibold tabular-nums text-[#E0E0E0]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <AnimatedCounter to={m.value} prefix={m.prefix} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
