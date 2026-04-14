import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Circle, FileText, Lock, PlayCircle, Sparkles, Zap } from 'lucide-react';
import type { AcademyLesson } from './curriculum';
import { getLessonBody, hasLessonBody } from './lessonBodiesIndex';
import { LessonView } from './LessonView';

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
  const [expanded, setExpanded] = useState(false);
  const hasBody = hasLessonBody(lesson.id);
  const canExpand = hasBody && !locked;

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!locked) onToggle(lesson.id);
  };

  const handleRowClick = () => {
    if (canExpand) setExpanded((v) => !v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className={`overflow-hidden rounded-xl border transition-colors ${
        locked
          ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.015] opacity-60'
          : expanded
            ? 'border-[#d4af37]/25 bg-[#d4af37]/[0.03]'
            : 'border-transparent hover:border-[#d4af37]/20 hover:bg-white/[0.03]'
      }`}
    >
      <button
        type="button"
        disabled={locked && !hasBody}
        onClick={handleRowClick}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
        style={{ minHeight: 56 }}
      >
        <span
          role="button"
          tabIndex={0}
          aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
          aria-pressed={completed}
          onClick={handleCheckbox}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!locked) onToggle(lesson.id);
            }
          }}
          className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
            completed
              ? 'border-[#d4af37] bg-[#d4af37] text-black'
              : 'border-white/15 bg-transparent text-[#6B7280] hover:border-[#d4af37]/60'
          }`}
        >
          {completed ? <Check size={14} strokeWidth={3} /> : <Circle size={10} strokeWidth={2.5} />}
        </span>
        <TypeIcon size={16} className="shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
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
          <div
            className="text-xs tabular-nums text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {lesson.durationMinutes} min
          </div>
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
        {canExpand ? (
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 text-[#9CA3AF]"
          >
            <ChevronDown size={16} />
          </motion.span>
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasBody ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t border-white/[0.05] px-5 py-5 md:px-8 md:py-6">
              <LessonView body={getLessonBody(lesson.id) ?? ''} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
