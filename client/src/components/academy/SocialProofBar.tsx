import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

const METRICS = [
  { label: 'AU dropshippers', value: 320, suffix: '+' },
  { label: 'Live products tracked', value: 10342, suffix: '' },
  { label: 'Markets covered', value: 7, suffix: '' },
  { label: 'Avg student rating', value: 4.9, suffix: '', decimals: 1 },
];

export function SocialProofBar() {
  return (
    <section className="border-t border-white/[0.05] py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center text-sm text-[#9CA3AF]"
        >
          Trusted by dropshippers scaling in{' '}
          <span className="text-[#E0E0E0]">Sydney</span>,{' '}
          <span className="text-[#E0E0E0]">London</span>,{' '}
          <span className="text-[#E0E0E0]">New York</span>,{' '}
          <span className="text-[#E0E0E0]">Melbourne</span>, and{' '}
          <span className="text-[#E0E0E0]">Auckland</span>.
        </motion.p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="rounded-2xl border p-4 text-center"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              <div
                className="text-2xl font-bold tabular-nums text-[#4f8ef7] md:text-3xl"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <AnimatedCounter to={m.value} suffix={m.suffix} decimals={m.decimals ?? 0} />
              </div>
              <div className="mt-1 text-[11px] font-mono uppercase tracking-widest text-[#9CA3AF]">
                {m.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
