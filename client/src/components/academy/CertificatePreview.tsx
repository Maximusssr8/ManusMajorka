import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

interface CertificatePreviewProps {
  name?: string;
}

export function CertificatePreview({ name = 'Your Name' }: CertificatePreviewProps) {
  return (
    <motion.div
      initial={{ rotateY: -8, opacity: 0 }}
      whileInView={{ rotateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, rotateZ: 0.5 }}
      className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border p-6"
      style={{
        borderColor: 'rgba(212,175,55,0.3)',
        background:
          'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(17,17,17,1) 50%, rgba(212,175,55,0.04) 100%)',
        boxShadow: '0 20px 60px -20px rgba(212,175,55,0.3)',
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d4af37]/10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#9CA3AF]">Majorka Academy</span>
          <Award size={20} className="text-[#d4af37]" strokeWidth={1.5} />
        </div>
        <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">Certified</div>
        <div
          className="mb-4 text-[17px] font-semibold leading-tight text-[#E0E0E0]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Product Intelligence Analyst
        </div>
        <div className="border-t border-[#d4af37]/15 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">Awarded to</div>
          <div className="mt-1 text-base font-medium text-[#E0E0E0]" style={{ fontFamily: "'Syne', sans-serif" }}>
            {name}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
