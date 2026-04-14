import { motion } from 'framer-motion';
import { Check, Circle, FileText, Lock, PlayCircle, Sparkles, Zap } from 'lucide-react';
import type { AcademyLesson } from './curriculum';

interface LessonRowProps {
  lesson: AcademyLesson;
  completed: boolean;
  locked: boolean;
  onToggle: (lessonId: string) => void;
  index: number;
}

const TYPE_ICONS = {
  video: PlayCircle,
  text: FileText,
  interactive: Zap,
};

export function LessonRow({ lesson, completed, locked, onToggle, index }: LessonRowProps) {
  const TypeIcon = TYPE_ICONS[lesson.type];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      disabled={locked}
      onClick={() => !locked && onToggle(lesson.id)}
      className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
        locked
          ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.015] opacity-60'
          : 'border-transparent hover:border-[#d4af37]/20 hover:bg-white/[0.03]'
      }`}
      style={{ minHeight: 56 }}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
          completed
            ? 'border-[#d4af37] bg-[#d4af37] text-black'
            : 'border-white/15 bg-transparent text-[#6B7280] group-hover:border-[#d4af37]/40'
        }`}
      >
        {completed ? <Check size={14} strokeWidth={3} /> : <Circle size={10} strokeWidth={2.5} />}
      </div>
      <TypeIcon size={16} className="shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium text-[#E0E0E0]">{lesson.title}</div>
          {lesson.hasMajorkaDemo ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-[#e5c158]">
              <Sparkles size={9} /> Live demo
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-xs text-[#6B7280]">{lesson.description}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs font-mono tabular-nums text-[#9CA3AF]">{lesson.durationMinutes} min</div>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-mono uppercase tracking-widest">
          {locked ? (
            <span className="flex items-center gap-1 text-[#6B7280]">
              <Lock size={9} /> Pro
            </span>
          ) : (
            <span className="text-emerald-400/80">Free</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
