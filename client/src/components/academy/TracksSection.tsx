/**
 * Learning Tracks — three tracks, four lessons each.
 * Progress is persisted server-side (caller provides `completed` Set + handler).
 * On track completion, a certificate-style card is revealed.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowRight, Check, ChevronDown, Lock, GraduationCap } from 'lucide-react';
import type { TrackSpec, LessonSpec } from './tracks';

const displayFont = "'Syne', 'DM Sans', sans-serif";

interface TracksSectionProps {
  tracks: TrackSpec[];
  completed: ReadonlySet<string>;
  onComplete: (lessonId: string) => void;
  userName: string;
}

export function TracksSection({ tracks, completed, onComplete, userName }: TracksSectionProps) {
  return (
    <section className="relative py-16 md:py-24 border-t border-white/[0.05]">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <div className="mb-10">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#e5c158]/70 mb-3">
            Learning Tracks · built for day-14 retention
          </div>
          <h2
            className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: displayFont }}
          >
            Three tracks.
            <br />
            <span className="text-white/50">Twelve lessons that compound.</span>
          </h2>
        </div>

        <div className="space-y-8">
          {tracks.map((t) => (
            <TrackCard
              key={t.id}
              track={t}
              completed={completed}
              onComplete={onComplete}
              userName={userName}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TrackCardProps {
  track: TrackSpec;
  completed: ReadonlySet<string>;
  onComplete: (lessonId: string) => void;
  userName: string;
}

function TrackCard({ track, completed, onComplete, userName }: TrackCardProps) {
  const done = track.lessons.filter((l) => completed.has(l.id)).length;
  const pct = Math.round((done / track.lessons.length) * 100);
  const isTrackDone = done === track.lessons.length;

  return (
    <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-semibold text-sm"
          style={{
            background: `${track.accent}18`,
            color: track.accent,
            border: `1px solid ${track.accent}33`,
          }}
        >
          {track.num}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{
                background: track.tier === 'scale' ? 'rgba(245,158,11,0.12)' : 'rgba(212,175,55,0.12)',
                color: track.tier === 'scale' ? '#fbbf24' : '#e5c158',
              }}
            >
              {track.tier === 'scale' ? 'Scale only' : 'Builder + Scale'}
            </span>
            <span className="text-[11px] font-mono text-white/40 tabular-nums">
              {done}/{track.lessons.length} · {pct}%
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-white/95" style={{ fontFamily: displayFont }}>
            Track {track.num} — {track.title}
          </h3>
          <p className="text-sm text-white/55 mt-1 leading-relaxed">{track.blurb}</p>
        </div>
      </div>

      {/* Track progress bar */}
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-6">
        <motion.div
          className="h-full rounded-full"
          style={{ background: track.accent }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="space-y-3">
        {track.lessons.map((l) => (
          <LessonRow
            key={l.id}
            lesson={l}
            accent={track.accent}
            done={completed.has(l.id)}
            onComplete={() => onComplete(l.id)}
          />
        ))}
      </div>

      {isTrackDone && (
        <CertificateCard
          trackTitle={track.title}
          accent={track.accent}
          userName={userName}
        />
      )}
    </div>
  );
}

interface LessonRowProps {
  lesson: LessonSpec;
  accent: string;
  done: boolean;
  onComplete: () => void;
}

function LessonRow({ lesson, accent, done, onComplete }: LessonRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      id={lesson.id}
      className="border border-white/[0.06] rounded-xl overflow-hidden transition-colors"
      style={{ borderColor: open ? `${accent}33` : 'rgba(255,255,255,0.06)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-semibold flex-shrink-0"
          style={{
            background: done ? 'rgba(16,185,129,0.15)' : `${accent}14`,
            color: done ? '#10b981' : accent,
            border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : `${accent}2a`}`,
          }}
        >
          {done ? <Check size={14} /> : lesson.num}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm md:text-base font-medium text-white/90 leading-snug">{lesson.title}</div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="text-white/40">
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4">
              <div className="space-y-3 text-[15px] leading-relaxed text-white/75">
                {lesson.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                  Key points
                </div>
                <ul className="space-y-2">
                  {lesson.keyPoints.map((k, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: accent }}
                      />
                      <span className="text-sm text-white/70 leading-relaxed">{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
                {lesson.demoCta && (
                  <Link
                    href={lesson.demoCta.path}
                    onClick={onComplete}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{
                      background: `${accent}15`,
                      color: accent,
                      border: `1px solid ${accent}33`,
                    }}
                  >
                    {lesson.demoCta.label}
                    <ArrowRight size={14} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  disabled={done}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-60 text-white/70 border border-white/[0.08] transition-colors"
                >
                  {done ? <Lock size={14} /> : <Check size={14} />}
                  {done ? 'Completed' : 'Mark as complete'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CertificateCardProps {
  trackTitle: string;
  accent: string;
  userName: string;
}

function CertificateCard({ trackTitle, accent, userName }: CertificateCardProps) {
  const dateStr = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-6 p-6 md:p-8 rounded-2xl text-center"
      style={{
        background:
          'linear-gradient(180deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))',
        border: '1px solid rgba(212,175,55,0.35)',
        boxShadow: '0 0 0 1px rgba(212,175,55,0.15), 0 20px 60px rgba(212,175,55,0.08)',
      }}
    >
      <div
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
        style={{ background: 'rgba(212,175,55,0.12)', color: '#e5c158', border: '1px solid rgba(212,175,55,0.3)' }}
      >
        <GraduationCap size={12} />
        Track complete
      </div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-1">
        Certificate of completion
      </div>
      <div
        className="text-2xl md:text-3xl font-semibold text-white mb-2"
        style={{ fontFamily: displayFont }}
      >
        {userName}
      </div>
      <div className="text-sm text-white/60 mb-1">has completed the Majorka Academy track</div>
      <div className="text-lg font-semibold mb-4" style={{ color: accent, fontFamily: displayFont }}>
        {trackTitle}
      </div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-white/40">
        Issued {dateStr}
      </div>
    </motion.div>
  );
}
