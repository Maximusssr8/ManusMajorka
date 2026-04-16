import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GoldButton } from './GoldButton';
import { GhostButton } from './GhostButton';

interface FinalCTAProps {
  onStart: () => void;
  publicMode: boolean;
}

export function FinalCTA({ onStart, publicMode }: FinalCTAProps) {
  return (
    <section className="border-t border-white/[0.05] py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.65 }}
          className="relative overflow-hidden rounded-3xl p-[1px]"
          style={{
            background:
              'linear-gradient(135deg, #4f8ef7 0%, rgba(79,142,247,0.15) 30%, rgba(79,142,247,0.15) 70%, #4f8ef7 100%)',
          }}
        >
          <div
            className="relative rounded-[calc(1.5rem-1px)] px-6 py-16 text-center md:px-12 md:py-24"
            style={{
              background: 'linear-gradient(180deg, #0d1117 0%, #0d0d0d 100%)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-48 opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at center top, rgba(79,142,247,0.18) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div className="mb-4 text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
                The last slide
              </div>
              <h2
                className="mx-auto max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-[#E0E0E0] md:text-6xl"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Academy teaches you the game.
                <br />
                <span className="bg-gradient-to-br from-[#6ba3ff] via-[#4f8ef7] to-[#a88620] bg-clip-text text-transparent">
                  Majorka wins it for you.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#9CA3AF]">
                Start with the free curriculum. When you're ready, the live product database, store
                builder, and ad intelligence are one click away.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <GoldButton size="lg" onClick={onStart}>
                  {publicMode ? 'Start free — no card needed' : 'Continue learning'}
                  <ArrowRight size={16} />
                </GoldButton>
                <GhostButton size="lg" href="/pricing">
                  View pricing
                </GhostButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
