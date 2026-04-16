import { motion } from 'framer-motion';
import { ArrowRight, Clock, TrendingUp, Users } from 'lucide-react';
import { GoldButton } from './GoldButton';
import { GhostButton } from './GhostButton';
import { AnimatedCounter } from './AnimatedCounter';

const STATS = [
  {
    icon: TrendingUp,
    value: 10342,
    suffix: '',
    label: 'Products tracked right now',
  },
  {
    icon: Users,
    value: 500,
    suffix: '+',
    label: 'Dropshippers learning inside',
  },
  {
    icon: Clock,
    value: 6,
    suffix: 'h',
    label: 'Fresh data refresh cadence',
  },
];

export function FOMOSection() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.05] py-20 md:py-28">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(79,142,247,0.15) 0%, transparent 60%)',
        }}
      />
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
            The data doesn't sleep
          </div>
          <h2
            className="text-3xl font-bold tracking-tight text-[#E0E0E0] md:text-5xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Every hour you delay,<br />
            <span className="text-[#4f8ef7]">someone else is launching your winner.</span>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border p-6"
              style={{ borderColor: 'rgba(79,142,247,0.12)', background: '#0d1117' }}
            >
              <s.icon size={18} className="mb-3 text-[#4f8ef7]" strokeWidth={1.75} />
              <div
                className="text-3xl font-bold tabular-nums text-[#E0E0E0]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs text-[#9CA3AF]">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          <GoldButton size="lg" href="/pricing">
            Start 7-day free trial
            <ArrowRight size={16} />
          </GoldButton>
          <GhostButton size="lg" href="#curriculum">
            Keep learning first
          </GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
