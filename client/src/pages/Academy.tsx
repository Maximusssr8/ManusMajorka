import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { BookOpen, Lock, CheckCircle2, Clock, Play, X, Check } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type PlanTier = 'free' | 'builder' | 'scale';

interface QuizQuestion {
  question: string;
  options: [string, string, string];
  correctIndex: number;
  hint: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  content: string;
  videoUrl?: string;
  videoNote?: string;
  actionLink?: { label: string; href: string };
  quiz: [QuizQuestion, QuizQuestion];
}

interface Track {
  number: string;
  id: string;
  title: string;
  requiredPlan: PlanTier;
  lessons: Lesson[];
}

interface LessonProgress {
  read: boolean;
  quizPassed?: boolean;
}

type ProgressMap = Record<string, LessonProgress>;

// ── Quiz data per lesson ──────────────────────────────────────────────────
const QUIZZES: Record<string, [QuizQuestion, QuizQuestion]> = {
  'trend-velocity': [
    {
      question: 'A product with 400 orders growing 25%/week scores _____ than one with 10K flat orders',
      options: ['Higher', 'Lower', 'Same'],
      correctIndex: 0,
      hint: 'Trend Velocity rewards acceleration, not total volume.',
    },
    {
      question: 'What score range should AU operators use as a conviction list?',
      options: ['Above 60', 'Above 80', 'Above 90'],
      correctIndex: 2,
      hint: 'The lesson mentions above 80 as a strong shortlist and above 90 as conviction.',
    },
  ],
  'market-split': [
    {
      question: 'Which market rewards premium positioning?',
      options: ['US', 'AU', 'UK'],
      correctIndex: 1,
      hint: 'Australia is smaller with slower shipping tolerance and rewards premium positioning.',
    },
    {
      question: 'A product doing 80% US volume but 5% AU is...',
      options: ['A risk', 'An opportunity', 'Irrelevant'],
      correctIndex: 1,
      hint: 'Imbalance signals opportunity if the product fits AU logistics and audience.',
    },
  ],
  'opportunity-score': [
    {
      question: 'Opportunity Score penalises products that are...',
      options: ['Low priced', 'Already running many Meta ads', 'New to market'],
      correctIndex: 1,
      hint: 'Unlike raw velocity, Opportunity Score penalises high competition saturation.',
    },
    {
      question: 'What is the recommended minimum Opportunity Score filter?',
      options: ['Above 50', 'Above 75', 'Above 95'],
      correctIndex: 1,
      hint: 'The lesson suggests setting Opportunity Score above 75 as your top filter.',
    },
  ],
  'first-pipeline': [
    {
      question: 'How many candidates should a product pipeline hold?',
      options: ['1 to 3', '5 to 10', '20 to 30'],
      correctIndex: 1,
      hint: 'A standing shortlist of 5 to 10 candidates rotated weekly.',
    },
    {
      question: 'What is the recommended test budget per candidate?',
      options: ['$20 AUD total', '$60 AUD over 3 days', '$200 AUD over a week'],
      correctIndex: 1,
      hint: 'Run one $20 AUD test per candidate across 3 days for a clear signal.',
    },
  ],
  'ai-store-generator': [
    {
      question: 'How long does the AI Store Generator take to produce a draft?',
      options: ['Under 2 minutes', 'About 15 minutes', 'Over an hour'],
      correctIndex: 0,
      hint: 'The generator produces a full Shopify-ready draft in under two minutes.',
    },
    {
      question: 'What should you treat the AI output as?',
      options: ['A finished product', 'A starting draft', 'A competitor analysis'],
      correctIndex: 1,
      hint: 'AI gets 90% right but always check claims, warranty text, and shipping times.',
    },
  ],
  'shopify-sync': [
    {
      question: 'Where do you generate a custom app for Shopify sync?',
      options: ['Shopify App Store', 'Settings > Apps and sales channels > Develop apps', 'Majorka dashboard'],
      correctIndex: 1,
      hint: 'Generate under Settings > Apps and sales channels > Develop apps in Shopify admin.',
    },
    {
      question: 'What should AU stores set before the first sync?',
      options: ['Theme to dark mode', 'Base currency to AUD', 'Language to en-AU'],
      correctIndex: 1,
      hint: 'Set base currency to AUD to avoid conversion display issues at checkout.',
    },
  ],
  'descriptions-convert': [
    {
      question: 'A converting description answers how many questions in the first 50 words?',
      options: ['One', 'Three', 'Five'],
      correctIndex: 1,
      hint: 'What is it, why should I care, and why now — three questions.',
    },
    {
      question: 'What format works best for mobile AU traffic?',
      options: ['Long paragraphs', 'Bullet points', 'Full-width images'],
      correctIndex: 1,
      hint: 'Bullet points beat paragraphs on mobile, where 70%+ of AU traffic lives.',
    },
  ],
  'au-pricing': [
    {
      question: 'A $49 product with free shipping outperforms...',
      options: ['$39 + $10 shipping', '$49 + free shipping', 'Neither'],
      correctIndex: 0,
      hint: 'AU shoppers anchor on round numbers and free shipping over raw price.',
    },
    {
      question: 'For products above $80 AUD, what should you add?',
      options: ['Express shipping only', 'Afterpay or Zip badges', 'Volume discounts'],
      correctIndex: 1,
      hint: 'Afterpay or Zip as visible badges near the price can lift conversion 10-20%.',
    },
  ],
  'meta-setup': [
    {
      question: 'What campaign type should dropshippers default to?',
      options: ['Manual CBO campaigns', 'Advantage+ Shopping campaigns', 'Reach campaigns'],
      correctIndex: 1,
      hint: 'Use Advantage+ Shopping campaigns — Meta auto-optimises well since late 2024.',
    },
    {
      question: 'How long should you wait before touching a new ad set?',
      options: ['24 hours', '3 days minimum', '2 weeks'],
      correctIndex: 1,
      hint: 'Let the algorithm learn for 3 days minimum — impatience kills more accounts.',
    },
  ],
  'ai-copy': [
    {
      question: 'What part of AI copy should you always edit manually?',
      options: ['The CTA', 'The first line (hook)', 'The hashtags'],
      correctIndex: 1,
      hint: 'The first line is the hook — AI tends to open with soft questions that scroll past.',
    },
    {
      question: 'How many AI copy variations should you generate?',
      options: ['1 to 2', '5 to 10', '20+'],
      correctIndex: 1,
      hint: 'Generate 5 to 10 variations and pick the one closest to human-written.',
    },
  ],
  'tiktok-vs-meta': [
    {
      question: 'For new AU operators in 2026, which platform should you start with?',
      options: ['TikTok', 'Meta', 'Both simultaneously'],
      correctIndex: 1,
      hint: 'Start with Meta — deeper audience data, more mature tooling, Advantage+ scales AU.',
    },
    {
      question: 'TikTok wins for impulse categories under...',
      options: ['$20 AUD', '$40 AUD', '$80 AUD'],
      correctIndex: 1,
      hint: 'TikTok wins under $40 AUD, Meta wins for considered purchases above $60 AUD.',
    },
  ],
  'reading-metrics': [
    {
      question: 'What is a good CPM benchmark for AU?',
      options: ['Under $10 AUD', 'Under $25 AUD', 'Under $50 AUD'],
      correctIndex: 1,
      hint: 'Under $25 AUD CPM is good for AU — it means creative and targeting are healthy.',
    },
    {
      question: 'How should you scale a winning ad set?',
      options: ['Edit the original budget', 'Duplicate with 50% budget increase', 'Triple the budget overnight'],
      correctIndex: 1,
      hint: 'Duplicate the ad set with a 50% increase — editing resets learning.',
    },
  ],
};

// ── Track content ──────────────────────────────────────────────────────────
const TRACKS: Track[] = [
  {
    number: '01',
    id: 'finding-winners',
    title: 'Finding Winners',
    requiredPlan: 'builder',
    lessons: [
      {
        id: 'trend-velocity',
        title: 'How Trend Velocity Score works',
        duration: '8 min read',
        difficulty: 'Beginner',
        content:
          'Trend Velocity Score measures how fast a product is gaining traction across the last 7, 14, and 30 days — not how many total orders it has. A product sitting at 10,000 lifetime orders with flat weekly growth scores lower than a product with 400 orders growing 25% week over week. The score rewards acceleration, which is when margins are still intact and ad costs have not been bid up by every other dropshipper. For AU operators, use scores above 80 as a strong shortlist and above 90 as a conviction list worth testing this week. Always cross-check the velocity against Meta ad library saturation before committing budget.',
        videoUrl: '',
        videoNote: 'Video walkthrough coming this month',
        actionLink: { label: 'Try it now — browse Products →', href: '/app/products?tab=trending' },
        quiz: QUIZZES['trend-velocity'],
      },
      {
        id: 'market-split',
        title: 'Reading the AU/US/UK market split',
        duration: '7 min read',
        difficulty: 'Beginner',
        content:
          'The same product rarely performs identically across AU, US, and UK. Australia is smaller, has slower shipping tolerance, and rewards premium positioning. The US is high volume but brutally competitive on ad cost. The UK sits in the middle with strong conversion on home and lifestyle categories. When you see the market split on a product card, look for imbalance: a product doing 80% of its volume in the US but only 5% in AU is an opportunity if the product is light, ships fast from local 3PLs, and has a hook that speaks to an Aussie audience. Local-market winners almost always win faster than global winners.',
        quiz: QUIZZES['market-split'],
      },
      {
        id: 'opportunity-score',
        title: 'Using Opportunity Score to filter',
        duration: '6 min read',
        difficulty: 'Intermediate',
        content:
          'Opportunity Score blends trend velocity, competition saturation, and margin potential into one number between 0 and 100. Unlike raw velocity, it penalises products already running on hundreds of Meta ads. Use it as your top filter when you have more than 50 candidates. A pragmatic workflow is to set Opportunity Score above 75, price between $29 and $79 AUD, and sold count above 300. That leaves you with roughly 15 to 25 candidates per week to review manually. Do not trust the score blindly — always open the ad library and check creative quality before testing.',
        quiz: QUIZZES['opportunity-score'],
      },
      {
        id: 'first-pipeline',
        title: 'Setting up your first product pipeline',
        duration: '9 min read',
        difficulty: 'Intermediate',
        content:
          'A product pipeline is a standing shortlist of 5 to 10 candidates you rotate through testing each week. Save products to a named list in Majorka, tag them by category, and set a rule: nothing enters the pipeline without a score above 75 and an existing Meta ad getting traction. Each week, kill the bottom two and add two fresh ones. Run one $20 AUD test per candidate across 3 days — that is $60 AUD per product for a clear kill or scale signal. A consistent pipeline beats hero shots every time because it converts product research from a guessing game into a repeatable process.',
        quiz: QUIZZES['first-pipeline'],
      },
    ],
  },
  {
    number: '02',
    id: 'building-store',
    title: 'Building Your Store',
    requiredPlan: 'scale',
    lessons: [
      {
        id: 'ai-store-generator',
        title: 'AI Store Generator walkthrough',
        duration: '10 min read',
        difficulty: 'Beginner',
        content:
          'The AI Store Generator takes a product URL and produces a full Shopify-ready store draft in under two minutes — hero copy, product page sections, FAQ, trust badges, and a checkout-optimised theme. Start by pasting the AliExpress or Majorka product link, then pick a tone (premium, playful, or clinical). Review every generated section before publishing — AI gets 90% right but always check claims, warranty text, and shipping times for accuracy. Treat the output as a starting draft, not a finished product. The real edge is speed: you go from idea to live store in the time it used to take to write one hero headline.',
        quiz: QUIZZES['ai-store-generator'],
      },
      {
        id: 'shopify-sync',
        title: 'Shopify sync setup',
        duration: '6 min read',
        difficulty: 'Beginner',
        content:
          'Syncing with Shopify means connecting your store via the admin API so Majorka can push products, update inventory, and pull order data automatically. Generate a custom app in your Shopify admin under Settings → Apps and sales channels → Develop apps, then grant read/write access to products, inventory, and orders. Paste the access token into Majorka settings. Once connected, pushing a product takes one click. For AU stores, set your base currency to AUD before the first sync to avoid conversion display issues at checkout.',
        quiz: QUIZZES['shopify-sync'],
      },
      {
        id: 'descriptions-convert',
        title: 'Writing product descriptions that convert',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content:
          'A converting description answers three questions in the first 50 words: what is it, why should I care, and why now. Skip the generic feature dump. Lead with the outcome — "stop dog hair destroying your car interior" — then follow with two or three specific proof points. Bullet points beat paragraphs on mobile, which is where 70%+ of AU traffic lives. Always include a size, weight, or capacity number to anchor credibility. End with a soft urgency line like "ships from Sydney in 2-5 days" to close the decision loop. Read your own copy out loud — if it sounds like a brochure, rewrite it.',
        quiz: QUIZZES['descriptions-convert'],
      },
      {
        id: 'au-pricing',
        title: 'Pricing strategy for AU market',
        duration: '7 min read',
        difficulty: 'Advanced',
        content:
          'Australian shoppers anchor on round numbers and free shipping over raw price. A $49 AUD product with free shipping routinely outperforms the same product at $39 AUD + $10 shipping, even though the total is identical. Build your price on a 3x to 4x markup from landed cost (product + shipping + payment fees + packaging). Include a compare-at strikethrough at roughly 30% above the sale price — not 60%, which reads as a scam. For products above $80 AUD, add Afterpay or Zip as visible badges near the price. These two details alone can lift AU conversion by 10 to 20%.',
        quiz: QUIZZES['au-pricing'],
      },
    ],
  },
  {
    number: '03',
    id: 'running-ads',
    title: 'Running Ads',
    requiredPlan: 'scale',
    lessons: [
      {
        id: 'meta-setup',
        title: 'Meta Ads setup for dropshippers',
        duration: '12 min read',
        difficulty: 'Intermediate',
        content:
          'Before a single dollar spends, verify your domain in Business Manager, set up the Meta Pixel with Conversions API, and configure 8 priority events (Purchase at the top). For dropshippers, use Advantage+ Shopping campaigns as your default — Meta has gotten significantly better at auto-optimising since late 2024. Start with a $30 AUD daily budget per ad set, three creatives minimum, and broad targeting (age 22-55, AU only). Avoid interest stacking unless you are past $500/day in spend. Let the algorithm learn for 3 days minimum before you touch anything — impatience kills more accounts than bad creative.',
        quiz: QUIZZES['meta-setup'],
      },
      {
        id: 'ai-copy',
        title: 'Using AI-generated copy effectively',
        duration: '6 min read',
        difficulty: 'Beginner',
        content:
          'AI-generated ad copy works best when you feed it specifics: who the product is for, the exact pain point, and the proof. Generic prompts produce generic copy. Always generate 5 to 10 variations and pick the one that feels closest to a human wrote it. Edit the first line manually — that is the hook, and AI tends to open with soft questions that scroll past easily. Keep the body under 80 words for Reels and Stories, longer for static feed placements. Test AI copy against your own writing head-to-head for the first month to calibrate what works for your niche.',
        quiz: QUIZZES['ai-copy'],
      },
      {
        id: 'tiktok-vs-meta',
        title: 'TikTok Shop vs Meta: which to start with',
        duration: '8 min read',
        difficulty: 'Intermediate',
        content:
          'For new AU operators in 2026, start with Meta. TikTok Shop AU is still maturing, ad pixel reporting is less reliable, and organic reach is harder to convert than the feed suggests. Meta has deeper audience data, more mature creative tooling, and Advantage+ Shopping reliably scales AU campaigns. Once you have one profitable product running on Meta, add TikTok as a second channel — do not run both from day one. TikTok wins for impulse categories under $40 AUD, Meta wins for considered purchases above $60 AUD. Match the platform to the price point, not to the hype.',
        quiz: QUIZZES['tiktok-vs-meta'],
      },
      {
        id: 'reading-metrics',
        title: 'Reading your ad metrics',
        duration: '9 min read',
        difficulty: 'Advanced',
        content:
          'The three numbers that actually matter are CPM, CTR, and ROAS — in that order. CPM tells you if your creative and targeting are healthy (under $25 AUD is good for AU). CTR tells you if the hook works (aim for 1.5%+ on feed, 2%+ on Reels). ROAS is the final scoreboard, but only look at it after spending at least 3x your product price per ad set. Kill anything below 1.3 ROAS after $60 AUD spend. Scale winners by duplicating the ad set with a 50% budget increase, not by editing the original — editing resets learning. Report on blended ROAS across the account weekly, not daily.',
        quiz: QUIZZES['reading-metrics'],
      },
    ],
  },
];

const TOTAL_LESSONS = TRACKS.reduce((sum, t) => sum + t.lessons.length, 0);
const PROGRESS_KEY = 'majorka_academy_progress_v1';

// ── Confetti CSS keyframes (injected once) ────────────────────────────────
const CONFETTI_STYLE_ID = 'majorka-confetti-style';

function ensureConfettiStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(CONFETTI_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = CONFETTI_STYLE_ID;
  style.textContent = `
    @keyframes majorka-confetti-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
    }
    @keyframes majorka-confetti-drift {
      0% { transform: translateX(0); }
      50% { transform: translateX(15px); }
      100% { transform: translateX(-15px); }
    }
    .majorka-confetti-piece {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 1px;
      animation: majorka-confetti-fall 3s ease-out forwards, majorka-confetti-drift 1.5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ── Difficulty pill colours ────────────────────────────────────────────────
function difficultyStyle(d: Difficulty): { bg: string; color: string; border: string } {
  if (d === 'Beginner') return { bg: 'rgba(16,185,129,0.10)', color: '#10b981', border: 'rgba(16,185,129,0.30)' };
  if (d === 'Intermediate') return { bg: 'rgba(212,175,55,0.10)', color: '#d4af37', border: 'rgba(212,175,55,0.35)' };
  return { bg: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'rgba(239,68,68,0.30)' };
}

// ── localStorage helpers ───────────────────────────────────────────────────
function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const result: ProgressMap = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (value === true) {
          result[key] = { read: true };
        } else if (value && typeof value === 'object' && 'read' in (value as Record<string, unknown>)) {
          result[key] = value as LessonProgress;
        }
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Quota exceeded or unavailable
  }
}

function planTier(isBuilder: boolean, isScale: boolean): PlanTier {
  if (isScale) return 'scale';
  if (isBuilder) return 'builder';
  return 'free';
}

function isTrackUnlocked(track: Track, userPlan: PlanTier): boolean {
  if (track.requiredPlan === 'builder') return userPlan === 'builder' || userPlan === 'scale';
  if (track.requiredPlan === 'scale') return userPlan === 'scale';
  return true;
}

// ── Video Placeholder ─────────────────────────────────────────────────────
function VideoFrame({ videoUrl }: { videoUrl?: string }) {
  if (videoUrl !== undefined && videoUrl.length > 0) {
    return (
      <div className="mt-4 w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={videoUrl}
          title="Lesson video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="mt-4 w-full rounded-lg flex flex-col items-center justify-center"
      style={{
        aspectRatio: '16/9',
        background: '#050505',
        border: '1px solid #1a1a1a',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          border: '2px solid #d4af37',
        }}
      >
        <Play size={22} style={{ color: '#d4af37', marginLeft: 2 }} fill="#d4af37" />
      </div>
      <span
        className="mt-3 text-xs text-[#555]"
        style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}
      >
        Video walkthrough coming soon
      </span>
    </div>
  );
}

// ── Quiz Component ────────────────────────────────────────────────────────
function LessonQuiz({
  quiz,
  lessonId,
  quizPassed,
  onPass,
}: {
  quiz: [QuizQuestion, QuizQuestion];
  lessonId: string;
  quizPassed: boolean;
  onPass: (lessonId: string) => void;
}) {
  const [answers, setAnswers] = useState<[number | null, number | null]>([null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<[boolean | null, boolean | null]>([null, null]);

  const handleSelect = useCallback((qIndex: 0 | 1, optionIndex: number) => {
    setAnswers(prev => {
      const next: [number | null, number | null] = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
    if (submitted) {
      setSubmitted(false);
      setResults([null, null]);
    }
  }, [submitted]);

  const handleCheck = useCallback(() => {
    const r0 = answers[0] === quiz[0].correctIndex;
    const r1 = answers[1] === quiz[1].correctIndex;
    setResults([r0, r1]);
    setSubmitted(true);
    if (r0 && r1) {
      onPass(lessonId);
    }
  }, [answers, quiz, lessonId, onPass]);

  if (quizPassed) {
    return (
      <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Quiz passed</span>
        </div>
      </div>
    );
  }

  const allAnswered = answers[0] !== null && answers[1] !== null;

  return (
    <div className="mt-5 p-4 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
      <h4
        className="text-xs uppercase tracking-wider text-[#888] mb-4"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Knowledge check
      </h4>

      {quiz.map((q, qIdx) => {
        const qKey = qIdx as 0 | 1;
        const result = results[qIdx];
        return (
          <div key={`${lessonId}-q${qIdx}`} className="mb-4 last:mb-0">
            <p className="text-sm text-[#ededed] mb-2 font-medium">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[qIdx] === oIdx;
                const showCorrectHighlight = submitted && result === true && isSelected;
                const showWrongHighlight = submitted && result === false && isSelected;

                return (
                  <label
                    key={oIdx}
                    className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors"
                    style={{
                      background: showCorrectHighlight
                        ? 'rgba(16,185,129,0.08)'
                        : showWrongHighlight
                          ? 'rgba(239,68,68,0.08)'
                          : isSelected
                            ? 'rgba(212,175,55,0.08)'
                            : 'transparent',
                      border: `1px solid ${
                        showCorrectHighlight
                          ? 'rgba(16,185,129,0.3)'
                          : showWrongHighlight
                            ? 'rgba(239,68,68,0.3)'
                            : isSelected
                              ? 'rgba(212,175,55,0.35)'
                              : '#1a1a1a'
                      }`,
                    }}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${isSelected ? '#d4af37' : '#333'}`,
                        background: isSelected ? '#d4af37' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#080808',
                            display: 'block',
                          }}
                        />
                      )}
                    </span>
                    <input
                      type="radio"
                      name={`${lessonId}-q${qIdx}`}
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => handleSelect(qKey, oIdx)}
                    />
                    <span className="text-sm text-[#a1a1aa]">{opt}</span>
                  </label>
                );
              })}
            </div>

            {submitted && result === false && (
              <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-md" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <X size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                <span className="text-xs text-[#ef4444]">Try again. Hint: {q.hint}</span>
              </div>
            )}
            {submitted && result === true && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Check size={14} style={{ color: '#10b981' }} />
                <span className="text-xs" style={{ color: '#10b981' }}>Correct!</span>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleCheck}
        disabled={!allAnswered}
        className="mt-3 px-4 py-2 rounded-md text-xs font-semibold transition-opacity"
        style={{
          background: allAnswered ? '#3B82F6' : '#1a1a1a',
          color: allAnswered ? '#ffffff' : '#555',
          cursor: allAnswered ? 'pointer' : 'not-allowed',
        }}
      >
        Check answers
      </button>
    </div>
  );
}

// ── Confetti Burst ────────────────────────────────────────────────────────
function ConfettiBurst() {
  useEffect(() => {
    ensureConfettiStyles();
  }, []);

  const pieces = useMemo(() => {
    const colors = ['#d4af37', '#f5d76e', '#3B82F6', '#10b981', '#ededed'];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.floor(Math.random() * 100)}%`,
      delay: `${(Math.random() * 2).toFixed(2)}s`,
      color: colors[i % colors.length],
      size: Math.floor(Math.random() * 4) + 4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          className="majorka-confetti-piece"
          style={{
            left: p.left,
            top: '-10px',
            animationDelay: p.delay,
            background: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Academy() {
  const { isBuilder, isScale } = useAuth();
  const userPlan: PlanTier = planTier(!!isBuilder, !!isScale);

  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Mark lesson as read after 5 seconds of expansion
  useEffect(() => {
    if (!expandedLesson) return;
    if (progress[expandedLesson]?.read) return;
    const t = setTimeout(() => {
      setProgress(prev => {
        const existing = prev[expandedLesson] ?? { read: false };
        const next = { ...prev, [expandedLesson]: { ...existing, read: true } };
        saveProgress(next);
        return next;
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [expandedLesson, progress]);

  const handleQuizPass = useCallback((lessonId: string) => {
    setProgress(prev => {
      const existing = prev[lessonId] ?? { read: false };
      const next = { ...prev, [lessonId]: { ...existing, read: true, quizPassed: true } };
      saveProgress(next);
      return next;
    });
  }, []);

  const readCount = useMemo(
    () => Object.values(progress).filter(p => p.read).length,
    [progress],
  );
  const quizCount = useMemo(
    () => Object.values(progress).filter(p => p.quizPassed).length,
    [progress],
  );
  const readPct = Math.min(100, Math.round((readCount / TOTAL_LESSONS) * 100));
  const quizPct = Math.min(100, Math.round((quizCount / TOTAL_LESSONS) * 100));
  const allComplete = readCount >= TOTAL_LESSONS && quizCount >= TOTAL_LESSONS;

  return (
    <div className="min-h-screen bg-[#080808] text-[#ededed]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <SEO
        title="Majorka Academy — Master dropshipping with AI"
        description="Three tracks. Twelve lessons. Master product research, store building, and Meta ads for the AU dropshipping market."
      />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
        <Link
          to="/"
          className="text-lg font-bold text-[#ededed] no-underline"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Majorka
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-sm text-[#888] no-underline">
            Pricing
          </Link>
          <Link
            to="/sign-in"
            className="text-sm font-semibold no-underline px-4 py-1.5 rounded-md"
            style={{ background: '#d4af37', color: '#080808' }}
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#1a1a1a] mb-6 text-xs text-[#888]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <BookOpen size={12} /> 3 tracks · 12 lessons
        </div>
        <h1
          className="font-bold mb-3 tracking-tight"
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(36px, 6vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          Majorka Academy
        </h1>
        <p className="text-base text-[#888] max-w-md mx-auto">Master dropshipping with AI</p>
      </div>

      {/* Completion Certificate */}
      {allComplete && (
        <div className="max-w-3xl mx-auto px-6 pb-6">
          <div
            className="relative rounded-lg p-6 text-center overflow-hidden"
            style={{ background: '#0f0f0f', border: '1px solid rgba(212,175,55,0.35)' }}
          >
            <ConfettiBurst />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div
                className="inline-flex items-center justify-center rounded-full mb-3"
                style={{ width: 48, height: 48, background: 'rgba(212,175,55,0.12)', border: '2px solid #d4af37' }}
              >
                <CheckCircle2 size={24} style={{ color: '#d4af37' }} />
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'Syne, sans-serif', color: '#d4af37' }}
              >
                Majorka Academy — Complete
              </h2>
              <p className="text-sm text-[#888] max-w-md mx-auto">
                You have completed all 3 tracks. You are ready to find, launch, and scale.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs uppercase tracking-wider text-[#888]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Progress
            </span>
            <span
              className="text-sm font-semibold text-[#ededed] tabular-nums"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {readCount} of {TOTAL_LESSONS} read · {quizCount} of {TOTAL_LESSONS} quizzes passed
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#555]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Lessons read
                </span>
                <span className="text-[10px] text-[#555] tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {readPct}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1a] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${readPct}%`,
                    background: 'linear-gradient(90deg, #d4af37, #f5d76e)',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-[#555]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Quizzes passed
                </span>
                <span className="text-[10px] text-[#555] tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {quizPct}%
                </span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1a] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${quizPct}%`,
                    background: 'linear-gradient(90deg, #3B82F6, #60a5fa)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
        {TRACKS.map(track => {
          const unlocked = isTrackUnlocked(track, userPlan);
          return (
            <section
              key={track.id}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-6 md:p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="text-4xl font-bold tabular-nums"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#d4af37',
                    lineHeight: 1,
                  }}
                >
                  {track.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2
                      className="text-2xl font-bold tracking-tight"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {track.title}
                    </h2>
                    {!unlocked && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider"
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          background: 'rgba(212,175,55,0.08)',
                          color: '#d4af37',
                          borderColor: 'rgba(212,175,55,0.35)',
                        }}
                      >
                        <Lock size={10} />
                        {track.requiredPlan === 'scale' ? 'Scale plan' : 'Builder plan'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#555] mt-1">{track.lessons.length} lessons</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {track.lessons.map(lesson => {
                  const lessonProgress = progress[lesson.id];
                  const isRead = !!lessonProgress?.read;
                  const isQuizPassed = !!lessonProgress?.quizPassed;
                  const isExpanded = expandedLesson === lesson.id;
                  const dStyle = difficultyStyle(lesson.difficulty);
                  return (
                    <div
                      key={lesson.id}
                      className="bg-[#080808] border rounded-md transition-colors"
                      style={{
                        borderColor: isExpanded ? '#d4af37' : '#1a1a1a',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!unlocked) return;
                          setExpandedLesson(isExpanded ? null : lesson.id);
                        }}
                        disabled={!unlocked}
                        className="w-full text-left p-5 disabled:cursor-not-allowed"
                        style={{ opacity: unlocked ? 1 : 0.55 }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-[#ededed] leading-snug flex-1">
                            {lesson.title}
                          </h3>
                          {!unlocked ? (
                            <Lock size={14} className="text-[#d4af37] flex-shrink-0 mt-0.5" />
                          ) : isRead && isQuizPassed ? (
                            <CheckCircle2
                              size={14}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: '#10b981' }}
                            />
                          ) : isRead ? (
                            <CheckCircle2
                              size={14}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: '#d4af37' }}
                            />
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-[#555]"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            <Clock size={10} />
                            {lesson.duration}
                          </span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold"
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              background: dStyle.bg,
                              color: dStyle.color,
                              borderColor: dStyle.border,
                            }}
                          >
                            {lesson.difficulty}
                          </span>
                          {isRead && !isQuizPassed && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px]"
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                background: 'rgba(212,175,55,0.08)',
                                color: '#d4af37',
                                borderColor: 'rgba(212,175,55,0.25)',
                              }}
                            >
                              Quiz pending
                            </span>
                          )}
                        </div>
                      </button>

                      {isExpanded && unlocked && (
                        <div className="px-5 pb-5 pt-1 border-t border-[#1a1a1a] mt-1">
                          <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-line">
                            {lesson.content}
                          </p>

                          {/* Video frame */}
                          <VideoFrame videoUrl={lesson.videoUrl} />

                          {lesson.actionLink && (
                            <a
                              href={lesson.actionLink.href}
                              className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-md no-underline"
                              style={{ background: '#3B82F6', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}
                            >
                              {lesson.actionLink.label}
                            </a>
                          )}

                          {isRead && (
                            <div
                              className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider"
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                color: '#10b981',
                              }}
                            >
                              <CheckCircle2 size={10} /> Marked as read
                            </div>
                          )}

                          {/* Quiz */}
                          <LessonQuiz
                            quiz={lesson.quiz}
                            lessonId={lesson.id}
                            quizPassed={isQuizPassed}
                            onPass={handleQuizPass}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!unlocked && (
                <div className="mt-6 flex items-center justify-between gap-4 p-4 rounded-md border border-[#1a1a1a] bg-[#080808]">
                  <div className="text-xs text-[#888]">
                    Unlock this track with the{' '}
                    <span className="text-[#d4af37] font-semibold">
                      {track.requiredPlan === 'scale' ? 'Scale' : 'Builder'}
                    </span>{' '}
                    plan.
                  </div>
                  <Link
                    to="/pricing"
                    className="text-xs font-semibold no-underline px-3 py-1.5 rounded-md"
                    style={{
                      background: '#3B82F6',
                      color: '#ffffff',
                      boxShadow: '0 0 20px rgba(59,130,246,0.35)',
                    }}
                  >
                    View plans
                  </Link>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-[#1a1a1a] py-16 px-6 text-center bg-[#0f0f0f]">
        <p className="text-sm text-[#888] mb-4 max-w-md mx-auto">
          Ready to put this into practice? Majorka tracks 2,400+ winning products across AU, US, and
          UK markets.
        </p>
        <Link
          to="/pricing"
          className="inline-block px-6 py-2.5 rounded-md font-semibold text-sm no-underline"
          style={{
            background: '#3B82F6',
            color: '#ffffff',
            boxShadow: '0 0 24px rgba(59,130,246,0.35)',
          }}
        >
          Start with Builder — $99 $AUD/mo
        </Link>
      </div>
    </div>
  );
}
