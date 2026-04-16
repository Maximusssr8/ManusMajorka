import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ACADEMY_CURRICULUM, TOTAL_LESSONS, TOTAL_DURATION_MINUTES, moduleSlug } from './curriculum';
import type { AcademyModule, Difficulty } from './curriculum';
import { ModuleAccordion } from './ModuleAccordion';
import { ChevronRight } from 'lucide-react';

interface CurriculumSectionProps {
  completedLessons: Set<string>;
  onToggleLesson: (lessonId: string) => void;
  locked: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

type Filter = 'All Levels' | Difficulty;
const FILTERS: Filter[] = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export function CurriculumSection({ completedLessons, onToggleLesson, locked, scrollRef }: CurriculumSectionProps) {
  const [filter, setFilter] = useState<Filter>('All Levels');
  const [openId, setOpenId] = useState<string | null>(ACADEMY_CURRICULUM[0]?.id ?? null);

  const filtered = useMemo<AcademyModule[]>(() => {
    if (filter === 'All Levels') return ACADEMY_CURRICULUM;
    return ACADEMY_CURRICULUM.filter((m) => m.difficulty === filter);
  }, [filter]);

  return (
    <section
      id="curriculum"
      ref={scrollRef}
      className="scroll-mt-24 border-t border-white/[0.05] py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7] mb-3">
            The Curriculum · 8 modules · {TOTAL_LESSONS} lessons · {Math.round(TOTAL_DURATION_MINUTES / 60)} hours
          </div>
          <h2
            className="text-3xl font-bold leading-tight tracking-tight text-[#E0E0E0] md:text-5xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Everything you need.
            <br />
            <span className="text-[#9CA3AF]">Nothing you don't.</span>
          </h2>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-xs font-mono uppercase tracking-widest transition-all ${
                filter === f
                  ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-[#4f8ef7]'
                  : 'border-white/[0.08] text-[#9CA3AF] hover:border-white/20 hover:text-[#E0E0E0]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((m) => (
            <ModuleAccordion
              key={m.id}
              module={m}
              open={openId === m.id}
              onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
              completedLessons={completedLessons}
              onToggleLesson={onToggleLesson}
              locked={locked}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
