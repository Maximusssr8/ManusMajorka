import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronDown, Check, ArrowRight, Clock, Sparkles } from 'lucide-react';
import type { ModuleSpec } from './modules';
import { SampleWinnerCard } from './SampleWinnerCard';
import { StoreBuildDemo } from './StoreBuildDemo';
import { Typewriter } from './Typewriter';

interface ModuleCardProps {
  m: ModuleSpec;
  completed: boolean;
  open: boolean;
  onToggle: () => void;
  onComplete: () => void;
}

const AD_COPY_LINES = [
  '> Generating Meta ad · "Cat Water Fountain"',
  '',
  'HOOK   Your cat is chronically dehydrated — and you',
  '       probably don\'t even know it.',
  '',
  'BODY   Most house cats drink 40% less water than',
  '       they need. This filtered, running-water',
  '       fountain mimics what they drink from in the',
  '       wild — and triples their intake overnight.',
  '',
  'PROOF  12,400+ 5-star reviews · Free AU shipping',
  'CTA    Shop now — 50% off this week only',
];

function difficultyColor(d: ModuleSpec['difficulty']): { bg: string; fg: string } {
  if (d === 'Beginner')     return { bg: 'rgba(16,185,129,0.12)', fg: '#34d399' };
  if (d === 'Intermediate') return { bg: 'rgba(245,158,11,0.12)', fg: '#fbbf24' };
  return                           { bg: 'rgba(249,115,22,0.12)', fg: '#fb923c' };
}

export function ModuleCard({ m, completed, open, onToggle, onComplete }: ModuleCardProps) {
  const [hovered, setHovered] = useState(false);
  const diff = difficultyColor(m.difficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Stepped connector line */}
      <div className="absolute left-6 -top-8 w-px h-8 bg-gradient-to-b from-transparent to-white/[0.08] hidden md:block" aria-hidden />

      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full text-left bg-surface border border-white/[0.07] rounded-2xl p-5 md:p-6 transition-all group"
        style={{
          borderColor: hovered || open ? `${m.accent}44` : 'rgba(255,255,255,0.07)',
          boxShadow: hovered || open ? `0 0 0 1px ${m.accent}22, 0 20px 60px ${m.accent}15` : 'none',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        <div className="flex items-start gap-4 md:gap-5">
          {/* Number badge */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-mono font-semibold text-sm transition-colors"
            style={{
              background: completed ? 'rgba(16,185,129,0.12)' : `${m.accent}18`,
              color: completed ? '#10b981' : m.accent,
              border: `1px solid ${completed ? 'rgba(16,185,129,0.25)' : `${m.accent}33`}`,
            }}
          >
            {completed ? <Check size={18} /> : m.num}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{ background: diff.bg, color: diff.fg }}
              >
                {m.difficulty}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-white/40">
                <Clock size={11} />
                {m.duration}
              </span>
              {completed && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                  Completed
                </span>
              )}
            </div>
            <h3
              className="text-lg md:text-xl font-semibold text-white/95 leading-tight mb-1"
              style={{ fontFamily: "'Nohemi', 'DM Sans', sans-serif" }}
            >
              {m.title}
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">{m.blurb}</p>
          </div>

          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0 text-white/40 mt-2"
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:p-7 space-y-6">
              {/* Body copy */}
              <div className="space-y-4 text-[15px] leading-relaxed text-white/75">
                {m.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* Key points */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">
                  What you need to know
                </div>
                <ul className="space-y-2.5">
                  {m.keyPoints.map((k, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: m.accent }}
                      />
                      <span className="text-sm text-white/70 leading-relaxed">{k}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Inline demos */}
              {m.demo === 'winner' && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Sparkles size={11} />
                    Live example — pulled from the real DB
                  </div>
                  <SampleWinnerCard />
                </div>
              )}
              {m.demo === 'store' && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Sparkles size={11} />
                    What the Store Builder does in 10 minutes
                  </div>
                  <StoreBuildDemo />
                </div>
              )}
              {m.demo === 'adcopy' && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Sparkles size={11} />
                    Ads Studio — live generation preview
                  </div>
                  <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-5 font-mono text-[13px] leading-relaxed text-emerald-300/90 min-h-[280px]">
                    <Typewriter lines={AD_COPY_LINES} speed={22} lineDelay={180} loop />
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
                {m.product && (
                  <Link
                    href={m.product.path}
                    onClick={onComplete}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{
                      background: `${m.accent}15`,
                      color: m.accent,
                      border: `1px solid ${m.accent}33`,
                    }}
                  >
                    {m.product.label}
                    <ArrowRight size={14} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.08] transition-colors"
                >
                  <Check size={14} />
                  Mark as complete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
