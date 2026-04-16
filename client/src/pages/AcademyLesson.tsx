import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  FileText,
  PlayCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/academy/Badge';
import { ProductExample } from '@/components/academy/ProductExample';
import { CaseStudy } from '@/components/academy/CaseStudy';
import type { CaseStudyProps } from '@/components/academy/CaseStudy';
import {
  findModuleBySlug,
  findLessonBySlug,
  moduleSlug,
  lessonSlug,
  MODULE_PRODUCT_CATEGORIES,
  ACADEMY_CURRICULUM,
} from '@/components/academy/curriculum';
import type { AcademyLesson as AcademyLessonType } from '@/components/academy/curriculum';

const LOCAL_KEY = 'majorka_academy_progress_v2';

const TYPE_LABELS: Record<string, { label: string; icon: typeof PlayCircle }> = {
  video: { label: 'Video lesson', icon: PlayCircle },
  text: { label: 'Reading', icon: FileText },
  interactive: { label: 'Interactive', icon: Zap },
};

// ── Lesson body content (keyed by lesson id) ────────────────────────────────
// The curriculum.ts only stores titles/descriptions. We render educational
// paragraphs here. Lessons without explicit content get a generated body.
const LESSON_BODIES: Record<string, string[]> = {
  'm1-l1': [
    "Most dropshipping gurus talk about revenue. The real number that matters is contribution margin after ad spend, COGS, shipping, returns, and platform fees.",
    "A healthy AU dropshipping store operates at 25-35% gross margin. After Facebook tax (typically 30-40% of revenue on Meta), your net margin sits at 8-15%. That's the realistic range.",
    "CAC (Customer Acquisition Cost) in Australia averages $18-$28 for impulse-buy products. LTV depends on your niche -- pet products see 1.8x repeat rate, while gadgets sit at 1.1x. Understanding these economics before you launch saves you from the 90-day death spiral.",
    "The key insight: dropshipping is not a margin business, it is a volume-and-velocity business. You need products that move fast enough to cover your fixed costs within the first 14 days.",
  ],
  'm1-l2': [
    "Pattern #1: Starting with a product they love, not one the market wants. Your taste is irrelevant -- the data decides.",
    "Pattern #2: Under-capitalising ad spend. You need $500-$1,000 in test budget before you can statistically determine if a product works. Most quit at $150.",
    "Pattern #3: Copying exact products from spy tools without differentiation. By the time a product appears on a spy tool, 200 other dropshippers have already launched it.",
    "Pattern #4: Ignoring shipping times. A 45-day shipping window in 2025 is a death sentence for your reviews and chargebacks.",
    "Pattern #5: Optimising the store when the problem is the product. A beautiful store selling the wrong product converts at 0%. An ugly store selling a winner converts at 2-4%.",
  ],
  'm1-l5': [
    "Signal 1: Order velocity -- not total orders, but the rate of acceleration. A product going from 500 to 2,000 orders in 7 days is more interesting than one sitting at 50,000 total.",
    "Signal 2: Review recency. Fresh reviews (last 14 days) with photos indicate active buyers, not legacy momentum.",
    "Signal 3: Multiple suppliers listing the same product. When 5+ AliExpress sellers carry it, supply is proven and you have negotiating leverage.",
    "Signal 4: The price-value gap. Products that look like they cost $50+ but retail for under $25 create the impulse-buy trigger.",
    "Signal 5: Scroll-stopping visual appeal. Can you understand the product in under 2 seconds from one image? If not, your ad CTR will suffer.",
    "Signal 6: Low return risk. Products without sizing (watches, gadgets, pet items) have 3-5x fewer returns than apparel.",
    "Signal 7: Seasonal independence. Evergreen products compound; seasonal products spike and crash.",
  ],
  'm2-l2': [
    "Trend velocity is the single most predictive metric for product success. It measures the rate of order growth, not the absolute number.",
    "Here is how to read a velocity curve: a product with 200 orders on Day 1 and 2,000 on Day 10 has a 10x velocity. That is a potential winner. A product with 10,000 orders growing at 2% per week is mature -- you have missed the window.",
    "The sweet spot for entry is Day 7-15 of a trend curve. Before Day 7, the signal is too noisy. After Day 30, the market is saturated with copycats.",
    "Majorka's winning score incorporates velocity as a primary signal. When you see a score above 85 with rising velocity, that is the moment to move.",
  ],
  'm2-l3': [
    "Forget star ratings -- they are gamed. The signals that actually matter on AliExpress are: orders in the last 7 days, store age (3+ years is reliable), and the 'Buyer Protection' badge.",
    "Look for the 'N orders in 30 days' badge on product pages. This is harder to fake than total order counts and gives you recency signal.",
    "Store age matters because AliExpress purges fraudulent stores. A 4-year-old store with consistent sales has survived multiple purge cycles.",
    "The 'recently ordered' pulse (small animation on AliExpress) indicates real-time demand. If you see it firing every few seconds, the product has live velocity.",
  ],
  'm2-l6': [
    "The Majorka Winning Score is a composite metric that weighs velocity (40%), margin potential (20%), supplier reliability (15%), market demand (15%), and competition density (10%).",
    "Raw order counts are misleading. A product with 100,000 orders and flat growth is less interesting than one with 3,000 orders and 5x weekly acceleration.",
    "The score updates daily as new data flows through the pipeline. A score above 90 means the product is in its growth phase with strong fundamentals. 75-89 is interesting but needs validation. Below 75, proceed with caution.",
    "Pro tip: filter by score AND velocity together. A high score with declining velocity means the window is closing. A moderate score with rising velocity means opportunity is opening.",
  ],
  'm2-l7': [
    "Step 1: Open Majorka Products. Set filters to Score >= 80, orders last 7d >= 500, category: your target niche.",
    "Step 2: Sort by winning score descending. Scan the top 40 results. Add anything that passes the 'scroll-stop test' to your shortlist.",
    "Step 3: For each shortlisted product, check supplier count (want 3+), shipping options (want ePacket or AliExpress Direct), and review photos (want real customer photos, not studio shots).",
    "Step 4: Cross-reference with Meta Ad Library. Search the product name. If you see 5+ active ads from different advertisers, the product is validated but competition is real.",
    "Step 5: Narrow to your top 20. For each, estimate: target ROAS, shipping time to your market, and potential ad angle. The products that survive this filter are your launch candidates.",
  ],
  'm3-l1': [
    "Metric 1: Store age -- minimum 2 years, ideally 3+. Young stores disappear without warning.",
    "Metric 2: Positive feedback rate -- 95%+ is the baseline. Below 93% is a red flag.",
    "Metric 3: Shipping SLA compliance -- check 'ships on time' rate. Below 90% means delays are structural, not occasional.",
    "Metric 4: Dispute rate -- visible in seller analytics. Below 2% is good. Above 5% is a dealbreaker.",
    "Metric 5: Response time -- message the supplier before ordering. If they reply within 6 hours, good. 24+ hours means they will ghost you when problems arise.",
    "Metric 6: Product variety -- suppliers with 200+ listings are wholesalers with real inventory. Suppliers with 10 listings might be dropshippers themselves.",
    "Metric 7: Order volume -- check if the specific SKU you want has 500+ orders. Low-volume SKUs have unstable supply chains.",
  ],
  'm3-l2': [
    "When five suppliers sell an identical product, the decision framework is: price, shipping speed, reliability score, and communication quality -- in that order.",
    "Run a sample order from your top 2 suppliers simultaneously. Compare packaging quality, shipping time, and product accuracy. The $40 investment saves you thousands in chargebacks.",
    "Negotiate after your first 10 orders. Most suppliers will offer 5-15% discount at 50+ units/month. At 200+/month, you should be getting branded packaging included.",
  ],
};

// ── Case studies for specific lessons ────────────────────────────────────────
const LESSON_CASE_STUDIES: Record<string, CaseStudyProps[]> = {
  'm1-l1': [{
    title: 'Pet grooming glove goes from $0 to $47K/mo',
    description: 'An AU-based operator launched a silicone pet grooming glove at $14.95 AUD. COGS $2.10, shipping $3.50, ad spend averaged $4.20/unit.',
    metric: '$47,210/mo revenue',
    insight: 'Net margin 18.4% after all costs. Velocity doubled every 48 hours in the first 2 weeks -- classic hockey-stick launch.',
  }],
  'm2-l2': [{
    title: 'Kitchen gadget caught at Day 8',
    description: 'A vegetable spiralizer showed 340 orders on Day 1, then 3,200 by Day 8. The operator entered on Day 9 with a TikTok-first creative strategy.',
    metric: '48,210 orders in 7 days',
    insight: 'Velocity doubled every 48 hours. By Day 15 there were 40+ copycats, but first-mover advantage held a 3.2x ROAS for 6 weeks.',
  }],
  'm3-l1': [{
    title: 'Supplier switch saves $12K in chargebacks',
    description: 'An operator selling LED strip lights had a 7.2% dispute rate with Supplier A (2-year-old store). Switching to Supplier B (5-year store, 97% feedback) dropped disputes to 1.1%.',
    metric: '$12,400 saved in Q1',
    insight: 'The 15% price premium from Supplier B was offset 8x by reduced chargebacks, refunds, and customer service hours.',
  }],
};

// ── Which lessons get product examples ───────────────────────────────────────
const LESSON_PRODUCT_EXAMPLES: Record<string, { category: string; caption: string; seed: number }[]> = {
  'm1-l1': [{ category: 'Pet', caption: 'This pet product demonstrates the margin profile discussed above -- high perceived value, low COGS.', seed: 2 }],
  'm1-l5': [
    { category: 'Kitchen', caption: 'Notice the order velocity on this kitchen product -- a classic signal of early-trend momentum.', seed: 3 },
    { category: 'Beauty', caption: 'This beauty product scores high on visual scroll-stop appeal -- you understand it in under 2 seconds.', seed: 4 },
  ],
  'm2-l2': [{ category: 'Pet', caption: 'This product is in its velocity window right now -- the score reflects active momentum, not legacy orders.', seed: 5 }],
  'm2-l3': [{ category: 'Home', caption: 'Check the order count on this home product -- the "recently ordered" signal is what we look for on AliExpress.', seed: 6 }],
  'm2-l6': [{ category: 'Kitchen', caption: 'This product\'s Majorka score factors in velocity, margin potential, and supplier reliability -- not just raw orders.', seed: 7 }],
  'm2-l7': [{ category: 'Fitness', caption: 'A product like this would survive the shortlist filter: high score, proven supplier base, and clear ad angle.', seed: 8 }],
  'm3-l1': [{ category: 'Home', caption: 'Multiple suppliers carry this product -- giving you negotiating leverage and supply redundancy.', seed: 9 }],
  'm3-l2': [{ category: 'Pet', caption: 'When comparing suppliers for a product like this, sample ordering from the top 2 is always worth the $20 investment.', seed: 10 }],
};

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

function saveCompleted(completed: Set<string>): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(completed)));
  } catch { /* ignore */ }
}

export default function AcademyLesson() {
  const params = useParams<{ moduleSlug: string; lessonSlug: string }>();
  const mod = useMemo(() => findModuleBySlug(params.moduleSlug ?? ''), [params.moduleSlug]);
  const lesson = useMemo(
    () => (mod ? findLessonBySlug(mod, params.lessonSlug ?? '') : undefined),
    [mod, params.lessonSlug],
  );

  const [completed, setCompleted] = useState<Set<string>>(loadCompleted);
  const [showCompleted, setShowCompleted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isCompleted = lesson ? completed.has(lesson.id) : false;

  useEffect(() => {
    if (mod && lesson) {
      document.title = `${lesson.title} — Module ${mod.num} — Majorka Academy`;
    }
    return () => { document.title = 'Majorka'; };
  }, [mod, lesson]);

  // Mark complete on scroll to bottom
  useEffect(() => {
    if (!lesson || isCompleted) return;
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          markComplete();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, isCompleted]);

  const markComplete = useCallback(() => {
    if (!lesson) return;
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(lesson.id);
      saveCompleted(next);
      return next;
    });
    setShowCompleted(true);
    setTimeout(() => setShowCompleted(false), 3000);
  }, [lesson]);

  if (!mod || !lesson) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 text-[#E0E0E0]"
        style={{ background: '#04060f', fontFamily: "'DM Sans', sans-serif" }}
      >
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
          Lesson not found
        </h1>
        <Link href="/academy" className="text-sm text-[#4f8ef7] hover:underline">
          Back to Academy
        </Link>
      </div>
    );
  }

  const mSlug = moduleSlug(mod);
  const typeInfo = TYPE_LABELS[lesson.type] ?? TYPE_LABELS.text;
  const TypeIcon = typeInfo.icon;
  const bodyParagraphs = LESSON_BODIES[lesson.id] ?? generateDefaultBody(lesson);
  const casStudies = LESSON_CASE_STUDIES[lesson.id] ?? [];
  const productExamples = LESSON_PRODUCT_EXAMPLES[lesson.id] ?? [];

  // Prev/next lesson
  const lessonIdx = mod.lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessonIdx > 0 ? mod.lessons[lessonIdx - 1] : null;
  const nextLesson = lessonIdx < mod.lessons.length - 1 ? mod.lessons[lessonIdx + 1] : null;

  // Cross-module navigation
  const modIdx = ACADEMY_CURRICULUM.findIndex((m) => m.id === mod.id);
  const nextModule = !nextLesson && modIdx < ACADEMY_CURRICULUM.length - 1
    ? ACADEMY_CURRICULUM[modIdx + 1]
    : null;
  const prevModule = !prevLesson && modIdx > 0
    ? ACADEMY_CURRICULUM[modIdx - 1]
    : null;

  return (
    <div
      className="min-h-screen text-[#E0E0E0]"
      style={{ background: '#04060f', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs font-mono text-[#6B7280]">
          <Link href="/academy" className="hover:text-[#4f8ef7] transition-colors">
            Academy
          </Link>
          <ChevronRight size={12} />
          <Link href={`/academy/${mSlug}`} className="hover:text-[#4f8ef7] transition-colors">
            Module {mod.num}
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#E0E0E0]">Lesson {lessonIdx + 1}</span>
        </nav>

        {/* Lesson header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="blue">
              <TypeIcon size={10} />
              {typeInfo.label}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs font-mono text-[#6B7280]">
              <Clock size={12} /> {lesson.durationMinutes} min
            </span>
            {isCompleted ? (
              <Badge tone="emerald">
                <Check size={10} />
                Completed
              </Badge>
            ) : null}
          </div>
          <h1
            className="mb-3 text-2xl font-bold leading-tight tracking-tight text-[#E0E0E0] md:text-3xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {lesson.title}
          </h1>
          <p className="text-base leading-relaxed text-[#9CA3AF]">{lesson.description}</p>
        </motion.div>

        {/* Lesson body */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-6"
        >
          {bodyParagraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.8] text-[#B0B0B0]">
              {p}
            </p>
          ))}

          {/* Case studies */}
          {casStudies.map((cs, i) => (
            <CaseStudy key={i} {...cs} />
          ))}

          {/* Product examples */}
          {productExamples.map((pe, i) => (
            <ProductExample key={i} category={pe.category} caption={pe.caption} seed={pe.seed} />
          ))}
        </motion.article>

        {/* Complete button */}
        <div ref={bottomRef} className="mt-12 flex justify-center">
          {!isCompleted ? (
            <button
              type="button"
              onClick={markComplete}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4f8ef7] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[#6ba3ff] hover:scale-[1.02] active:scale-[0.99]"
              style={{ boxShadow: '0 10px 40px -8px rgba(79,142,247,0.55)' }}
            >
              <Check size={16} />
              Mark as complete
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-300">
              <Check size={16} />
              Lesson completed
            </div>
          )}
        </div>

        {/* Completed toast */}
        <AnimatePresence>
          {showCompleted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/30 bg-emerald-900/90 px-5 py-3 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur-xl"
            >
              <span className="flex items-center gap-2">
                <Check size={16} /> Lesson completed!
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Prev / Next navigation */}
        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
          {prevLesson ? (
            <Link
              href={`/academy/${mSlug}/${lessonSlug(prevLesson)}`}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              <ArrowLeft size={14} />
              <span className="truncate">{prevLesson.title}</span>
            </Link>
          ) : prevModule ? (
            <Link
              href={`/academy/${moduleSlug(prevModule)}`}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              <ArrowLeft size={14} />
              Module {prevModule.num}: {prevModule.title}
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link
              href={`/academy/${mSlug}/${lessonSlug(nextLesson)}`}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              <span className="truncate">{nextLesson.title}</span>
              <ArrowRight size={14} />
            </Link>
          ) : nextModule ? (
            <Link
              href={`/academy/${moduleSlug(nextModule)}`}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              Next: Module {nextModule.num}
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/academy"
              className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm text-[#9CA3AF] transition-colors hover:border-[#4f8ef7]/30 hover:text-[#E0E0E0]"
              style={{ borderColor: 'rgba(79,142,247,0.08)', background: '#0d1117' }}
            >
              Back to Academy
              <BookOpen size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Generate a default lesson body when no hand-written content exists. */
function generateDefaultBody(lesson: AcademyLessonType): string[] {
  return [
    lesson.description,
    `This ${lesson.type === 'video' ? 'video lesson' : lesson.type === 'interactive' ? 'interactive exercise' : 'reading'} takes approximately ${lesson.durationMinutes} minutes to complete.`,
    'Work through the material at your own pace. When you reach the bottom, click "Mark as complete" to track your progress.',
  ];
}
