import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, ChevronDown, Clock } from 'lucide-react';
import type { AcademyModule } from './curriculum';
import { totalDurationInModule, moduleSlug } from './curriculum';
import { Badge } from './Badge';
import { LessonRow } from './LessonRow';

interface ModuleAccordionProps {
  module: AcademyModule;
  open: boolean;
  onToggle: () => void;
  completedLessons: Set<string>;
  onToggleLesson: (lessonId: string) => void;
  locked: boolean; // only applies to premium lessons — free lessons always unlocked
}

const DIFFICULTY_TONE = {
  Beginner: 'emerald',
  Intermediate: 'gold',
  Advanced: 'amber',
} as const;

export function ModuleAccordion({
  module,
  open,
  onToggle,
  completedLessons,
  onToggleLesson,
  locked,
}: ModuleAccordionProps) {
  const completedCount = module.lessons.filter((l) => completedLessons.has(l.id)).length;
  const progressPct = (completedCount / module.lessons.length) * 100;
  const duration = totalDurationInModule(module);

  return (
    <motion.div
      whileHover={{ scale: open ? 1 : 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: open ? 'rgba(79,142,247,0.25)' : 'rgba(79,142,247,0.08)',
        background: '#0d1117',
        boxShadow: open ? '0 20px 60px -20px rgba(79,142,247,0.18)' : 'none',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-mono tabular-nums"
          style={{
            background: 'rgba(79,142,247,0.1)',
            border: '1px solid rgba(79,142,247,0.2)',
            color: '#4f8ef7',
          }}
        >
          {module.num}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-base font-semibold text-[#E0E0E0] md:text-lg"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {module.title}
            </h3>
            <Badge tone={DIFFICULTY_TONE[module.difficulty]}>{module.difficulty}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-[#9CA3AF]">{module.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} /> {module.lessons.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {duration} min
            </span>
            <span className="tabular-nums">
              {completedCount}/{module.lessons.length} complete
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-[#4f8ef7]"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="mt-1 shrink-0 text-[#9CA3AF]"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-1 border-t border-white/[0.05] p-3">
              {module.lessons.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  completed={completedLessons.has(lesson.id)}
                  locked={locked && !lesson.isFree}
                  onToggle={onToggleLesson}
                  index={i}
                />
              ))}
              <a
                href={`/academy/${moduleSlug(module)}`}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-[#4f8ef7]/15 bg-[#4f8ef7]/5 px-4 py-2.5 text-xs font-medium text-[#4f8ef7] transition-all hover:border-[#4f8ef7]/30 hover:bg-[#4f8ef7]/10"
              >
                View full module
                <ArrowRight size={12} />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
