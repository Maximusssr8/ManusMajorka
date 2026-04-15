import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Hero } from './Hero';
import { SocialProofBar } from './SocialProofBar';
import { ValueProps } from './ValueProps';
import { CurriculumSection } from './CurriculumSection';
import { InteractiveDemo } from './InteractiveDemo';
import { ProgressPreview } from './ProgressPreview';
import { FOMOSection } from './FOMOSection';
import { FAQSection } from './FAQSection';
import { FinalCTA } from './FinalCTA';
import { ACADEMY_CURRICULUM } from './curriculum';
import type { AcademyModule } from './curriculum';
import { GoldButton } from './GoldButton';

const LOCAL_KEY = 'majorka_academy_progress_v2';
const STREAK_KEY = 'majorka_academy_streak_v2';

interface StoredStreak {
  lastActiveISO: string;
  days: number;
}

interface AcademyPageProps {
  publicMode: boolean;
}

/**
 * Shared Academy experience. Rendered by both the public `/academy` and the
 * authenticated `/app/learn` routes. In publicMode we add a sticky signup CTA
 * and store progress in localStorage only. Authenticated users sync to
 * /api/academy/progress.
 */
export function AcademyPage({ publicMode }: AcademyPageProps) {
  useEffect(() => {
    document.title = 'Academy — Majorka';
  }, []);

  const { user } = useAuth();
  const isAuthed = !publicMode && Boolean(user);

  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => loadLocalCompleted());
  const [streak, setStreak] = useState<StoredStreak>(() => loadStreak());
  const [fomoModuleId, setFomoModuleId] = useState<string | null>(null);
  const curriculumRef = useRef<HTMLDivElement | null>(null);

  // ── Server sync (authed only) ───────────────────────────────────────────
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    (async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) return;
        const r = await fetch('/api/academy/progress', { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const body = (await r.json()) as { completed?: { lesson_id: string }[] };
        if (cancelled) return;
        const serverIds = Array.isArray(body.completed) ? body.completed.map((c) => c.lesson_id) : [];
        setCompletedLessons((prev) => new Set([...prev, ...serverIds]));
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  // ── Persist locally always ──────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(completedLessons)));
    } catch {
      /* ignore */
    }
  }, [completedLessons]);

  // ── Streak bookkeeping: increment once per calendar day on mount ────────
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const last = streak.lastActiveISO?.slice(0, 10) ?? '';
    if (last === today) return;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nextDays = last === yesterday ? streak.days + 1 : 1;
    const next: StoredStreak = { lastActiveISO: now.toISOString(), days: nextDays };
    setStreak(next);
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLesson = useCallback(
    (lessonId: string) => {
      const wasDone = completedLessons.has(lessonId);
      setCompletedLessons((prev) => {
        const next = new Set(prev);
        if (next.has(lessonId)) next.delete(lessonId);
        else next.add(lessonId);
        return next;
      });
      // Server write (mark complete only — undo is client-only for now)
      if (!wasDone && isAuthed) {
        void (async () => {
          try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            if (!token) return;
            await fetch('/api/academy/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ lesson_id: lessonId }),
            });
          } catch {
            /* non-fatal */
          }
        })();
      }
      // FOMO trigger: fires when the final lesson of a module with a trigger is completed
      if (!wasDone) {
        const mod = ACADEMY_CURRICULUM.find((m) => m.lessons.some((l) => l.id === lessonId));
        if (!mod || !mod.fomoTrigger) return;
        const last = mod.lessons[mod.lessons.length - 1];
        if (last.id === lessonId) setFomoModuleId(mod.id);
      }
    },
    [completedLessons, isAuthed],
  );

  const scrollToCurriculum = useCallback(() => {
    curriculumRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const fomoModule = useMemo<AcademyModule | null>(
    () => ACADEMY_CURRICULUM.find((m) => m.id === fomoModuleId) ?? null,
    [fomoModuleId],
  );

  // Free-only for public visitors; authenticated users have the full deck.
  const lockedPremium = publicMode;

  return (
    <div
      className="min-h-screen text-[#E0E0E0]"
      style={{ background: '#080808', fontFamily: "'DM Sans', sans-serif" }}
    >
      {publicMode ? <PublicTopCTA /> : null}

      <Hero onStart={scrollToCurriculum} onCurriculum={scrollToCurriculum} publicMode={publicMode} />
      <SocialProofBar />
      <ValueProps />
      <CurriculumSection
        scrollRef={curriculumRef}
        completedLessons={completedLessons}
        onToggleLesson={toggleLesson}
        locked={lockedPremium}
      />
      <InteractiveDemo />
      <ProgressPreview
        completedCount={completedLessons.size}
        streakDays={streak.days}
        userName={user?.name ?? user?.email ?? undefined}
      />
      <FOMOSection />
      <FAQSection />
      <FinalCTA onStart={scrollToCurriculum} publicMode={publicMode} />

      <AnimatePresence>
        {fomoModule ? (
          <motion.div
            key="fomo"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
          >
            <div
              className="pointer-events-auto relative w-full max-w-xl overflow-hidden rounded-2xl border p-5 shadow-2xl"
              style={{
                borderColor: 'rgba(212,175,55,0.35)',
                background: 'linear-gradient(180deg, #111111 0%, #0d0d0d 100%)',
                boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.25)',
              }}
            >
              <button
                type="button"
                onClick={() => setFomoModuleId(null)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-white/5 hover:text-[#E0E0E0]"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
              <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">
                Module complete
              </div>
              <p
                className="mb-4 pr-7 text-[15px] leading-relaxed text-[#E0E0E0]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {fomoModule.fomoTrigger?.headline}
              </p>
              <GoldButton href={fomoModule.fomoTrigger?.href ?? '/pricing'}>
                {fomoModule.fomoTrigger?.cta ?? 'Unlock Majorka'}
                <ArrowRight size={14} />
              </GoldButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PublicTopCTA() {
  return (
    <div className="sticky top-0 z-30 border-b border-[#d4af37]/20 backdrop-blur-xl"
      style={{ background: 'rgba(8,8,8,0.85)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#E0E0E0]" style={{ fontFamily: "'Syne', sans-serif" }}>
          <span className="text-[#d4af37]">●</span> Majorka Academy
        </a>
        <div className="flex items-center gap-2">
          <a
            href="/sign-in"
            className="hidden rounded-lg px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#E0E0E0] md:inline-block"
          >
            Sign in
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-semibold text-black transition-all hover:bg-[#e5c158]"
          >
            Start free trial
            <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── local storage helpers ────────────────────────────────────────────────
function loadLocalCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function loadStreak(): StoredStreak {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { lastActiveISO: '', days: 0 };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return { lastActiveISO: '', days: 0 };
    const p = parsed as Partial<StoredStreak>;
    return {
      lastActiveISO: typeof p.lastActiveISO === 'string' ? p.lastActiveISO : '',
      days: typeof p.days === 'number' ? p.days : 0,
    };
  } catch {
    return { lastActiveISO: '', days: 0 };
  }
}
