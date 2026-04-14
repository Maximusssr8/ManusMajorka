import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface FlameStreakProps {
  days: number;
  max?: number;
}

/**
 * Visual daily streak — 7-day dot grid with flame icon.
 * Shows current streak and motivates daily return.
 */
export function FlameStreak({ days, max = 7 }: FlameStreakProps) {
  const bounded = Math.min(days, max);
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0) 70%)',
        }}
      >
        <Flame size={42} className="text-[#d4af37]" strokeWidth={1.5} />
      </motion.div>
      <div className="mt-4 text-3xl font-semibold tabular-nums text-[#E0E0E0]" style={{ fontFamily: "'Syne', sans-serif" }}>
        {days}
        <span className="text-[#9CA3AF] text-xl"> days</span>
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">Current streak</div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: max }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={`h-2 w-2 rounded-full ${i < bounded ? 'bg-[#d4af37]' : 'bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
}
