import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { TOTAL_LESSONS } from './curriculum';

interface CertificatePreviewProps {
  name?: string;
  completedCount?: number;
}

/**
 * Certificate preview. Locked state = gold-dim, lock icon, shows "X / 48 to unlock".
 * Unlocked state (completedCount >= TOTAL_LESSONS) = full gold, award icon, name + date.
 */
export function CertificatePreview({ name = 'Your Name', completedCount = 0 }: CertificatePreviewProps) {
  const unlocked = completedCount >= TOTAL_LESSONS;
  const awardedDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ rotateY: -8, opacity: 0 }}
      whileInView={{ rotateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: unlocked ? 1.03 : 1.01, rotateZ: unlocked ? 0.5 : 0 }}
      className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border p-6"
      style={{
        borderColor: unlocked ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.18)',
        background: unlocked
          ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(17,17,17,1) 45%, rgba(212,175,55,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, rgba(17,17,17,1) 50%, rgba(212,175,55,0.02) 100%)',
        boxShadow: unlocked
          ? '0 30px 80px -20px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.35)'
          : '0 20px 60px -20px rgba(212,175,55,0.15)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
        style={{ background: unlocked ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.08)' }}
      />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#9CA3AF]">
            Majorka Academy
          </span>
          {unlocked ? (
            <Award size={22} className="text-[#d4af37]" strokeWidth={1.5} />
          ) : (
            <Lock size={18} className="text-[#d4af37]/60" strokeWidth={1.75} />
          )}
        </div>
        <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">
          {unlocked ? 'Certified' : `${completedCount} / ${TOTAL_LESSONS} to unlock`}
        </div>
        <div
          className="mb-4 text-[18px] font-semibold leading-tight text-[#E0E0E0]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Majorka Certified Analyst
        </div>
        <div className="border-t border-[#d4af37]/15 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
            {unlocked ? 'Awarded to' : 'Will be awarded to'}
          </div>
          <div
            className={`mt-1 text-base font-medium ${unlocked ? 'text-[#E0E0E0]' : 'text-[#6B7280]'}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {name}
          </div>
          {unlocked ? (
            <div
              className="mt-2 text-[11px] tabular-nums text-[#9CA3AF]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {awardedDate}
            </div>
          ) : (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full bg-[#d4af37]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (completedCount / TOTAL_LESSONS) * 100)}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
