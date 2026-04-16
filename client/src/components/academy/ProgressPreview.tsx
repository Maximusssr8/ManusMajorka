import { motion } from 'framer-motion';
import { ProgressRing } from './ProgressRing';
import { FlameStreak } from './FlameStreak';
import { CertificatePreview } from './CertificatePreview';
import { TOTAL_LESSONS } from './curriculum';

interface ProgressPreviewProps {
  completedCount: number;
  streakDays: number;
  userName?: string;
}

export function ProgressPreview({ completedCount, streakDays, userName }: ProgressPreviewProps) {
  const cards = [
    { title: 'Lesson Progress', body: <ProgressRing value={completedCount} max={TOTAL_LESSONS} sublabel="Lessons" /> },
    { title: 'Daily Streak', body: <FlameStreak days={streakDays} /> },
    { title: 'Your Certificate', body: <CertificatePreview name={userName ?? 'Operator'} /> },
  ];
  return (
    <section className="border-t border-white/[0.05] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
            Your Progress
          </div>
          <h2
            className="text-3xl font-bold tracking-tight text-[#E0E0E0] md:text-5xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Track it. Build the streak. Earn the cert.
          </h2>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="flex flex-col items-center justify-center rounded-2xl border p-8"
              style={{ borderColor: 'rgba(79,142,247,0.1)', background: '#0d1117', minHeight: 360 }}
            >
              <div className="mb-6 text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">{c.title}</div>
              {c.body}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
