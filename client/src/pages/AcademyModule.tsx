import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Lock,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/academy/Badge';
import { ProductExample } from '@/components/academy/ProductExample';
import {
  findModuleBySlug,
  moduleSlug,
  lessonSlug,
  totalDurationInModule,
  MODULE_PRODUCT_CATEGORIES,
  ACADEMY_CURRICULUM,
} from '@/components/academy/curriculum';
import type { AcademyLesson, AcademyModule as AcademyModuleType } from '@/components/academy/curriculum';
import { proxyImage } from '@/lib/imageProxy';

const LOCAL_KEY = 'majorka_academy_progress_v2';

const DIFFICULTY_TONE = {
  Beginner: 'emerald',
  Intermediate: 'gold',
  Advanced: 'amber',
} as const;

const TYPE_ICONS = {
  video: PlayCircle,
  text: FileText,
  interactive: Zap,
} as const;

function loadCompleted(): Set<string> {
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

interface HeroImageProps {
  category: string | undefined;
}

function ModuleHeroImage({ category }: HeroImageProps) {
  const [product, setProduct] = useState<{ image: string | null; title: string } | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    fetch(`/api/demo/quick-score?category=${encodeURIComponent(category)}&seed=0`)
      .then((r) => r.json())
      .then((body: { ok: boolean; product?: { image: string | null; title: string } }) => {
        if (!cancelled && body.ok && body.product) setProduct(body.product);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [category]);

  const imageUrl = product?.image ? proxyImage(product.image) : null;

  if (!imageUrl || imgError) {
    return (
      <div
        className="flex h-48 w-full items-center justify-center rounded-2xl sm:h-64"
        style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
      >
        <ShoppingBag size={48} className="text-[#4f8ef7]/20" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product?.title ?? 'Module hero'}
      className="h-48 w-full rounded-2xl object-cover sm:h-64"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

export default function AcademyModule() {
  const params = useParams<{ moduleSlug: string }>();
  const mod = useMemo(() => findModuleBySlug(params.moduleSlug ?? ''), [params.moduleSlug]);
  const [completed, setCompleted] = useState<Set<string>>(loadCompleted);

  useEffect(() => {
    if (mod) document.title = `${mod.title} — Majorka Academy`;
    return () => { document.title = 'Majorka'; };
  }, [mod]);

  if (!mod) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 text-[#E0E0E0]"
        style={{ background: '#04060f', fontFamily: "'DM Sans', sans-serif" }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Module not found
        </h1>
        <Link href="/academy" className="text-sm text-[#4f8ef7] hover:underline">
          Back to Academy
        </Link>
      </div>
    );
  }

  const completedCount = mod.lessons.filter((l) => completed.has(l.id)).length;
  const progressPct = (completedCount / mod.lessons.length) * 100;
  const duration = totalDurationInModule(mod);
  const category = MODULE_PRODUCT_CATEGORIES[mod.id];
  const mSlug = moduleSlug(mod);

  // Prev/next module navigation
  const currentIdx = ACADEMY_CURRICULUM.findIndex((m) => m.id === mod.id);
  const prevMod = currentIdx > 0 ? ACADEMY_CURRICULUM[currentIdx - 1] : null;
  const nextMod = currentIdx < ACADEMY_CURRICULUM.length - 1 ? ACADEMY_CURRICULUM[currentIdx + 1] : null;

  return (
    <div
      className="min-h-screen text-[#E0E0E0]"
      style={{ background: '#04060f', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-mono text-[#6B7280]">
          <Link href="/academy" className="hover:text-[#4f8ef7] transition-colors">
            Academy
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#E0E0E0]">Module {mod.num}</span>
        </nav>

        {/* Back link */}
        <Link
          href="/academy"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#4f8ef7] hover:text-[#6ba3ff] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Academy
        </Link>

        {/* Hero image for modules 1-3 */}
        {category ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 overflow-hidden rounded-2xl border"
            style={{ borderColor: 'rgba(79,142,247,0.08)' }}
          >
            <ModuleHeroImage category={category} />
          </motion.div>
        ) : null}

        {/* Module header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#4f8ef7]">
              Module {mod.num}
            </span>
            <Badge tone={DIFFICULTY_TONE[mod.difficulty]}>{mod.difficulty}</Badge>
          </div>
          <h1
            className="mb-3 text-3xl font-bold leading-tight tracking-tight text-[#E0E0E0] md:text-4xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {mod.title}
          </h1>
          <p className="mb-5 max-w-2xl text-base leading-relaxed text-[#9CA3AF]">
            {mod.description}
          </p>
          <div className="flex flex-wrap items-center gap-5 text-xs font-mono text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} /> {mod.lessons.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {duration} min
            </span>
            <span className="tabular-nums">
              {completedCount}/{mod.lessons.length} complete
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-[#4f8ef7]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Lessons list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-2"
        >
          <h2
            className="mb-4 text-lg font-semibold text-[#E0E0E0]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Lessons
          </h2>
          {mod.lessons.map((lesson, i) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={i}
              isCompleted={completed.has(lesson.id)}
              moduleSlug={mSlug}
            />
          ))}
        </motion.div>

        {/* Product example for modules 1-3 */}
        {category ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10"
          >
            <h3
              className="mb-2 text-base font-semibold text-[#E0E0E0]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Featured product from this module
            </h3>
            <ProductExample category={category} seed={1} />
          </motion.div>
        ) : null}

        {/* Prev / Next module nav */}
        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
          {prevMod ? (
            <Link
              href={`/academy/${moduleSlug(prevMod)}`}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              <ArrowLeft size={14} />
              Module {prevMod.num}: {prevMod.title}
            </Link>
          ) : <div />}
          {nextMod ? (
            <Link
              href={`/academy/${moduleSlug(nextMod)}`}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              Module {nextMod.num}: {nextMod.title}
              <ChevronRight size={14} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  index,
  isCompleted,
  moduleSlug: mSlug,
}: {
  lesson: AcademyLesson;
  index: number;
  isCompleted: boolean;
  moduleSlug: string;
}) {
  const TypeIcon = TYPE_ICONS[lesson.type];
  const lSlug = lessonSlug(lesson);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link
        href={`/academy/${mSlug}/${lSlug}`}
        className="group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-[#4f8ef7]/25 hover:bg-white/[0.02]"
        style={{
          borderColor: 'rgba(79,142,247,0.08)',
          background: '#0d1117',
          minHeight: 60,
        }}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
            isCompleted
              ? 'border-[#4f8ef7] bg-[#4f8ef7] text-black'
              : 'border-white/15 bg-transparent text-[#6B7280] group-hover:border-[#4f8ef7]/40'
          }`}
        >
          {isCompleted ? <Check size={14} strokeWidth={3} /> : <Circle size={10} strokeWidth={2.5} />}
        </div>
        <TypeIcon size={16} className="shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-medium text-[#E0E0E0]">{lesson.title}</div>
            {lesson.hasMajorkaDemo ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#4f8ef7]/30 bg-[#4f8ef7]/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-[#6ba3ff]">
                <Sparkles size={9} /> Live demo
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 truncate text-xs text-[#6B7280]">{lesson.description}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-mono tabular-nums text-[#9CA3AF]">{lesson.durationMinutes} min</div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-mono uppercase tracking-widest">
            {!lesson.isFree ? (
              <span className="flex items-center gap-1 text-[#6B7280]">
                <Lock size={9} /> Pro
              </span>
            ) : (
              <span className="text-emerald-400/80">Free</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-[#6B7280] group-hover:text-[#4f8ef7] transition-colors" />
      </Link>
    </motion.div>
  );
}
