/**
 * LearnHub — Majorka Academy (v2)
 * Premium learning experience: markdown rendering, lesson navigation,
 * track progress, playlist, search + filter, completion celebration,
 * Supabase sync with localStorage fallback, mobile-first.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Lock,
  Minus,
  Play,
  Plus,
  Trophy,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  description: string;
  readTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  free: boolean;
}

interface Track {
  id: string;
  emoji: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

// ── Data ───────────────────────────────────────────────────────────────────────

const TRACKS: Track[] = [
  {
    id: 'fundamentals',
    emoji: '🎓',
    title: 'Dropshipping Fundamentals',
    description: 'Everything you need to know before your first sale',
    lessons: [
      {
        id: 'what-is-dropshipping',
        title: 'What is Dropshipping?',
        description: 'The complete business model explained with real AU examples',
        readTime: '5 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'au-market-101',
        title: 'The Australian Market',
        description: 'Why AU is different: consumer behaviour, platforms, regulations',
        readTime: '8 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'legal-setup',
        title: 'Legal Setup in Australia',
        description: 'ABN, GST, ACCC requirements — what you actually need',
        readTime: '6 min',
        difficulty: 'Beginner',
        free: false,
      },
      {
        id: 'supplier-types',
        title: 'Types of Suppliers',
        description: 'Alibaba, AU wholesalers, 3PL, print-on-demand compared',
        readTime: '7 min',
        difficulty: 'Beginner',
        free: false,
      },
      {
        id: 'profit-maths',
        title: 'The Profit Maths',
        description: 'COGS, margins, ROAS targets — the numbers you must know',
        readTime: '10 min',
        difficulty: 'Intermediate',
        free: false,
      },
    ],
  },
  {
    id: 'products',
    emoji: '🔍',
    title: 'Finding Winning Products',
    description: 'How to find products that actually sell',
    lessons: [
      {
        id: 'product-criteria',
        title: 'The Winning Product Formula',
        description: '7 criteria that separate winners from money-wasters',
        readTime: '8 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'research-tools',
        title: 'Using Majorka Product Scout',
        description: 'Step-by-step: find your first winner using AI',
        readTime: '6 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'trend-timing',
        title: 'Trend Timing',
        description: 'How to enter a trend at the right moment',
        readTime: '7 min',
        difficulty: 'Intermediate',
        free: false,
      },
      {
        id: 'competition-analysis',
        title: 'Analysing Competition',
        description: 'How to read saturation signals and find untapped angles',
        readTime: '9 min',
        difficulty: 'Intermediate',
        free: false,
      },
      {
        id: 'validation',
        title: 'Validate Before You Invest',
        description: 'Test demand with $50 before spending $500',
        readTime: '8 min',
        difficulty: 'Intermediate',
        free: false,
      },
    ],
  },
  {
    id: 'brand',
    emoji: '🏗️',
    title: 'Building Your Brand',
    description: 'Stand out from generic dropship stores',
    lessons: [
      {
        id: 'brand-positioning',
        title: 'Brand Positioning',
        description: 'How to be specific enough to win, broad enough to scale',
        readTime: '7 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'store-building',
        title: 'Building with Majorka',
        description: 'From brand DNA to live Shopify store in one session',
        readTime: '10 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'copywriting-basics',
        title: 'Copywriting That Converts',
        description: '5 principles of high-converting copy for AU buyers',
        readTime: '9 min',
        difficulty: 'Intermediate',
        free: false,
      },
      {
        id: 'trust-signals',
        title: 'AU Trust Signals',
        description: 'Afterpay, AusPost, reviews — what AU buyers need to see',
        readTime: '6 min',
        difficulty: 'Beginner',
        free: false,
      },
      {
        id: 'email-marketing',
        title: 'Email Marketing Foundations',
        description: 'Build a list from day one — your most valuable asset',
        readTime: '8 min',
        difficulty: 'Intermediate',
        free: false,
      },
    ],
  },
  {
    id: 'ads',
    emoji: '📢',
    title: 'Running Ads',
    description: 'Profitable paid traffic for AU ecommerce',
    lessons: [
      {
        id: 'meta-basics',
        title: 'Meta Ads for Beginners',
        description: 'Your first AU Facebook/Instagram campaign, step by step',
        readTime: '12 min',
        difficulty: 'Beginner',
        free: true,
      },
      {
        id: 'creative-strategy',
        title: 'Creative Strategy',
        description: 'Hooks, angles, and formats that work for AU audiences',
        readTime: '10 min',
        difficulty: 'Intermediate',
        free: true,
      },
      {
        id: 'tiktok-ads',
        title: 'TikTok Ads AU',
        description: 'Profitable TikTok Shop and Spark Ads in Australia',
        readTime: '11 min',
        difficulty: 'Intermediate',
        free: false,
      },
      {
        id: 'scaling',
        title: 'Scaling Winning Ads',
        description: 'How to 2x, 5x, 10x a winning campaign without killing it',
        readTime: '9 min',
        difficulty: 'Advanced',
        free: false,
      },
      {
        id: 'analytics',
        title: 'Reading Your Numbers',
        description: 'CPM, CTR, ROAS, CPA — what each metric actually means',
        readTime: '8 min',
        difficulty: 'Intermediate',
        free: false,
      },
    ],
  },
];

// Flat list of all free lesson IDs (exported for sidebar badge)
export const FREE_LESSON_IDS: string[] = TRACKS.flatMap((t) =>
  t.lessons.filter((l) => l.free).map((l) => l.id)
);
export const TOTAL_FREE = FREE_LESSON_IDS.length; // 8

const STORAGE_KEY = 'majorka_academy_v1';
const PLAYLIST_KEY = 'majorka_playlist';
const PLAYBOOK_KEY = 'majorka_playbook';
const TOTAL_LESSONS = 20;

// ── localStorage helpers ───────────────────────────────────────────────────────

function loadProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}
function saveProgress(p: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
function loadPlaylist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PLAYLIST_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function savePlaylist(ids: string[]) {
  try {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
function appendPlaybook(entry: string) {
  try {
    const existing = localStorage.getItem(PLAYBOOK_KEY) ?? '';
    localStorage.setItem(PLAYBOOK_KEY, existing + entry);
  } catch {
    /* ignore */
  }
}

// ── Supabase progress sync (graceful fallback) ────────────────────────────────

async function loadProgressFromSupabase(userId: string): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .eq('completed', true);
    if (error) return {};
    const result: Record<string, boolean> = {};
    (data ?? []).forEach((r: { lesson_id: string; completed: boolean }) => {
      result[r.lesson_id] = r.completed;
    });
    return result;
  } catch {
    return {};
  }
}

async function syncProgressToSupabase(userId: string, lessonId: string) {
  try {
    await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );
  } catch {
    /* no-op — table may not exist */
  }
}

// ── Markdown renderer ──────────────────────────────────────────────────────────

// SafeInlineText: parses **bold**, *italic*, `code` without dangerouslySetInnerHTML
function SafeInlineText({ text }: { text: string }) {
  // Split on **bold**, *italic*, and `code` patterns
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*([^*]+?)\*|`([^`]+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[0].startsWith('**')) {
      parts.push(
        <strong key={key++} className="text-white font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else {
      parts.push(
        <code
          key={key++}
          style={{
            background: '#F5F5F5',
            padding: '1px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85em',
            color: '#f0c040',
          }}
        >
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Headings
    if (/^#{1,3} /.test(line)) {
      const content = line.replace(/^#{1,3} /, '');
      nodes.push(
        <h3
          key={key++}
          className="text-lg font-bold text-white mt-6 mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          {content}
        </h3>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^[*-] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[*-] /.test(lines[i])) {
        items.push(lines[i].replace(/^[*-] /, ''));
        i++;
      }
      nodes.push(
        <ul
          key={key++}
          className="list-disc list-inside space-y-1 mb-4"
          style={{ color: '#a1a1aa' }}
        >
          {items.map((item, j) => (
            <li key={j} className="mb-1">
              <SafeInlineText text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(
        <ol
          key={key++}
          className="list-decimal list-inside space-y-1 mb-4"
          style={{ color: '#a1a1aa' }}
        >
          {items.map((item, j) => (
            <li key={j} className="mb-1">
              <SafeInlineText text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={key++} className="mb-4 leading-relaxed text-sm" style={{ color: '#a1a1aa' }}>
        <SafeInlineText text={line} />
      </p>
    );
    i++;
  }
  return nodes;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function difficultyStyle(d: string): { bg: string; color: string } {
  if (d === 'Beginner') return { bg: 'rgba(34,197,94,0.1)', color: '#4ade80' };
  if (d === 'Advanced') return { bg: 'rgba(239,68,68,0.1)', color: '#f87171' };
  return { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' };
}

function getLessonByTrack(lessonId: string): { track: Track; index: number } | null {
  for (const track of TRACKS) {
    const index = track.lessons.findIndex((l) => l.id === lessonId);
    if (index !== -1) return { track, index };
  }
  return null;
}

// ── Circular progress ring ────────────────────────────────────────────────────

function CircularRing({ percent }: { percent: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={40} height={40} className="flex-shrink-0">
      <circle cx={20} cy={20} r={r} fill="none" stroke="#F5F5F5" strokeWidth={3} />
      <circle
        cx={20}
        cy={20}
        r={r}
        fill="none"
        stroke="#6366F1"
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ── Confetti (CSS-only) ───────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#6366F1', '#f0c040', '#22c55e', '#a855f7', '#3b82f6', '#f59e0b'];

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: `${5 + Math.random() * 90}%`,
        delay: Math.random() * 0.5,
        duration: 1.2 + Math.random() * 1.2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.round(Math.random() * 6),
        isCircle: Math.random() > 0.5,
        rotate: Math.random() * 360,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active]
  );

  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -10, opacity: 1, rotate: p.rotate }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.rotate + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.isCircle ? '50%' : 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250] px-6 py-3 rounded-2xl flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(20,20,24,0.98), rgba(28,28,36,0.98))',
            border: '1px solid rgba(99,102,241,0.4)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}
        >
          <Trophy size={18} style={{ color: '#6366F1', flexShrink: 0 }} />
          <span className="text-sm font-bold text-white whitespace-nowrap">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Playlist Drawer ───────────────────────────────────────────────────────────

interface PlaylistDrawerProps {
  open: boolean;
  onClose: () => void;
  playlist: string[];
  progress: Record<string, boolean>;
  onPlay: (lessonId: string) => void;
  onRemove: (lessonId: string) => void;
}

function PlaylistDrawer({
  open,
  onClose,
  playlist,
  progress,
  onPlay,
  onRemove,
}: PlaylistDrawerProps) {
  const allLessons: Record<string, Lesson> = {};
  TRACKS.forEach((t) =>
    t.lessons.forEach((l) => {
      allLessons[l.id] = l;
    })
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[160] flex flex-col"
            style={{
              width: 'min(380px, 100vw)',
              background: 'rgba(10,10,14,0.98)',
              borderLeft: '1px solid #F5F5F5',
              boxShadow: '-16px 0 64px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid #E5E7EB' }}
            >
              <div className="flex items-center gap-2">
                <ListOrdered size={16} style={{ color: '#6366F1' }} />
                <h3
                  className="font-bold text-white text-sm"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  My Playlist
                </h3>
                {playlist.length > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
                  >
                    {playlist.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: '#F9FAFB',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a1a1aa',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    '#F0F0F0')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    '#F9FAFB')
                }
              >
                <X size={13} />
              </button>
            </div>

            {/* List */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#F9FAFB transparent',
              }}
            >
              {playlist.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={32} style={{ color: '#3f3f46', margin: '0 auto 12px' }} />
                  <p className="text-sm" style={{ color: '#52525b' }}>
                    Your playlist is empty
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#3f3f46' }}>
                    Add free lessons to build your queue
                  </p>
                </div>
              ) : (
                playlist.map((id, idx) => {
                  const lesson = allLessons[id];
                  if (!lesson) return null;
                  const done = progress[id];
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 group transition-all"
                      style={{
                        background: '#FAFAFA',
                        border: '1px solid #F9FAFB',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.borderColor =
                          'rgba(99,102,241,0.15)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.borderColor =
                          '#F9FAFB')
                      }
                    >
                      <span
                        className="text-xs font-bold flex-shrink-0"
                        style={{ color: '#52525b', fontFamily: "'Bricolage Grotesque', sans-serif", minWidth: 20 }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-semibold truncate"
                          style={{
                            color: done ? '#52525b' : '#e5e5e5',
                            textDecoration: done ? 'line-through' : 'none',
                          }}
                        >
                          {lesson.title}
                        </div>
                        <div className="text-xs" style={{ color: '#3f3f46' }}>
                          {lesson.readTime}
                        </div>
                      </div>
                      <button
                        onClick={() => onPlay(id)}
                        title="Open lesson"
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: 'rgba(99,102,241,0.1)',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6366F1',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background =
                            'rgba(99,102,241,0.2)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background =
                            'rgba(99,102,241,0.1)')
                        }
                      >
                        <Play size={10} />
                      </button>
                      <button
                        onClick={() => onRemove(id)}
                        title="Remove from playlist"
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#f87171',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background =
                            'rgba(239,68,68,0.2)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background =
                            'rgba(239,68,68,0.08)')
                        }
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {playlist.length > 0 && (
              <div
                className="flex-shrink-0 px-4 py-4"
                style={{ borderTop: '1px solid #E5E7EB' }}
              >
                <button
                  onClick={() => {
                    onPlay(playlist[0]);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: '#0a0a0a',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')
                  }
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                >
                  <Play size={14} />
                  Start Playlist
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Lesson Modal ──────────────────────────────────────────────────────────────

interface LessonModalProps {
  lesson: Lesson | null;
  open: boolean;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
  completed: Record<string, boolean>;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  onNavigate: (lesson: Lesson) => void;
}

function LessonModal({
  lesson,
  open,
  onClose,
  onComplete,
  completed,
  prevLesson,
  nextLesson,
  onNavigate,
}: LessonModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { session } = useAuth();

  useEffect(() => {
    if (!lesson || !open) return;
    setContent('');
    setReadProgress(0);
    setSaved(false);
    setLoading(true);

    const prompt = `Write a detailed lesson titled "${lesson.title}". ${lesson.description}. 

Format requirements:
- Use ## for section headings
- Use **bold** for key terms and important concepts
- Use bullet lists (- item) for lists of features or tips
- Use numbered lists (1. step) for processes and actionable steps
- Include 2-3 Australian examples with AUD pricing where relevant
- Difficulty level: ${lesson.difficulty}
- Target length: ${lesson.readTime} read
- End with a section "## Key Takeaways" containing 3 numbered actionable takeaways

Start with a brief intro paragraph, then dive straight into the content.`;

    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        toolName: 'ai-chat',
        market: 'AU',
        stream: false,
      }),
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as Record<string, unknown>;
        const choices = d.choices as Array<{ message: { content: string } }> | undefined;
        setContent(
          (d.content as string) ||
            (d.text as string) ||
            (d.result as string) ||
            choices?.[0]?.message?.content ||
            '## Lesson Content\n\nContent is loading. Please try again in a moment.'
        );
      })
      .catch(() =>
        setContent(
          '## Lesson Content\n\nContent is loading. Please try again in a moment.\n\nIf this persists, check your connection.'
        )
      )
      .finally(() => setLoading(false));
  }, [lesson, open]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    setReadProgress(max <= 0 ? 100 : Math.round((scrollTop / max) * 100));
  }, []);

  const handleSaveToPlaybook = useCallback(() => {
    if (!lesson || !content) return;
    const date = new Date().toLocaleDateString('en-AU');
    const takeaways = content
      .split('\n')
      .filter((l) => /^\d+\. /.test(l))
      .slice(0, 3)
      .map((l) => l.replace(/^\d+\. /, '• '))
      .join('\n');
    const entry = `\n\n---\n# ${lesson.title}\n*Saved ${date}*\n\n${takeaways || content.slice(0, 300) + '...'}\n`;
    appendPlaybook(entry);
    setSaved(true);
  }, [lesson, content]);

  if (!lesson) return null;

  const isCompleted = completed[lesson.id];
  const diffStyle = difficultyStyle(lesson.difficulty);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl border border-white/10 p-0 overflow-hidden w-full"
        style={{
          background: 'rgba(10,10,18,0.98)',
          backdropFilter: 'blur(20px)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
        }}
      >
        {/* Reading progress bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10"
          style={{ height: 2, background: '#F9FAFB' }}
        >
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${readProgress}%`,
              background: 'linear-gradient(90deg, #6366F1, #f0c040)',
            }}
          />
        </div>

        {/* Header */}
        <DialogHeader
          className="px-6 pt-7 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: diffStyle.bg, color: diffStyle.color }}
            >
              {lesson.difficulty}
            </span>
            <span className="text-xs" style={{ color: '#52525b' }}>
              {lesson.readTime} read
            </span>
            {lesson.free && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}
              >
                Free
              </span>
            )}
          </div>
          <DialogTitle
            className="text-xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            {lesson.title}
          </DialogTitle>
          <p className="text-sm mt-1" style={{ color: '#71717a' }}>
            {lesson.description}
          </p>
        </DialogHeader>

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#F9FAFB transparent' }}
        >
          {loading ? (
            <div className="space-y-3 mt-2 animate-pulse">
              {[85, 70, 90, 60, 75, 55, 80, 65].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 rounded-full"
                  style={{ background: '#F9FAFB', width: `${w}%` }}
                />
              ))}
              <div className="mt-4 h-px" style={{ background: '#F9FAFB' }} />
              {[70, 85, 60, 90].map((w, i) => (
                <div
                  key={i + 10}
                  className="h-3.5 rounded-full mt-2"
                  style={{ background: '#F9FAFB', width: `${w}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="prose-invert">{renderMarkdown(content)}</div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-4 space-y-3"
          style={{ borderTop: '1px solid #E5E7EB' }}
        >
          {/* Navigation + Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {prevLesson ? (
                <button
                  onClick={() => onNavigate(prevLesson)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: '#F9FAFB',
                    color: '#a1a1aa',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      '#F5F5F5')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      '#F9FAFB')
                  }
                >
                  <ChevronLeft size={12} /> Prev
                </button>
              ) : (
                <div style={{ width: 60 }} />
              )}
              {nextLesson && (
                <button
                  onClick={() => onNavigate(nextLesson)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: '#F9FAFB',
                    color: '#a1a1aa',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      '#F5F5F5')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      '#F9FAFB')
                  }
                >
                  Next <ChevronRight size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!loading && content && (
                <button
                  onClick={handleSaveToPlaybook}
                  title="Save key takeaways to My Playbook"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: saved ? 'rgba(99,102,241,0.1)' : '#F9FAFB',
                    color: saved ? '#6366F1' : '#71717a',
                    border: `1px solid ${saved ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!saved)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        '#F5F5F5';
                  }}
                  onMouseLeave={(e) => {
                    if (!saved)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        '#F9FAFB';
                  }}
                >
                  {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                  {saved ? 'Saved' : 'Save to Playbook'}
                </button>
              )}
              <button
                onClick={() => {
                  setLocation(
                    `/app/ai-chat?q=${encodeURIComponent(`Tell me more about: ${lesson.title}`)}`
                  );
                }}
                className="text-xs font-medium transition-opacity"
                style={{ color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >
                Ask Maya →
              </button>
            </div>
          </div>

          {/* Complete button */}
          <button
            onClick={() => {
              onComplete(lesson.id);
              onClose();
            }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{
              background: isCompleted
                ? 'rgba(34,197,94,0.12)'
                : 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: isCompleted ? '#4ade80' : '#0a0a0a',
              border: isCompleted ? '1px solid rgba(34,197,94,0.25)' : 'none',
              cursor: 'pointer',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              boxShadow: isCompleted ? 'none' : '0 4px 16px rgba(99,102,241,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!isCompleted) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            {isCompleted ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Upgrade Dialog ─────────────────────────────────────────────────────────────

function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm border border-white/10 text-center p-0 overflow-hidden"
        style={{ background: 'rgba(10,10,18,0.98)', backdropFilter: 'blur(20px)' }}
      >
        <div className="py-8 px-6 flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <Lock size={22} style={{ color: '#6366F1' }} />
          </div>
          <DialogTitle
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Builder Plan Required
          </DialogTitle>
          <p className="text-sm" style={{ color: '#71717a' }}>
            Unlock all 20 lessons + AI personalisation to accelerate your dropshipping journey.
          </p>
          <button
            onClick={() => {
              setLocation('/pricing');
              onClose();
            }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#0a0a0a',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            Upgrade to Builder Plan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Track Card ─────────────────────────────────────────────────────────────────

interface TrackCardProps {
  track: Track;
  isOpen: boolean;
  onToggle: () => void;
  progress: Record<string, boolean>;
  playlist: string[];
  onLessonClick: (lesson: Lesson) => void;
  onPlaylistToggle: (lessonId: string) => void;
}

function TrackCard({
  track,
  isOpen,
  onToggle,
  progress,
  playlist,
  onLessonClick,
  onPlaylistToggle,
}: TrackCardProps) {
  const completedInTrack = track.lessons.filter((l) => progress[l.id]).length;
  const freeInTrack = track.lessons.filter((l) => l.free);
  const freeCompleted = freeInTrack.filter((l) => progress[l.id]).length;
  const progressPercent = (completedInTrack / track.lessons.length) * 100;
  const trackComplete = freeCompleted === freeInTrack.length && freeInTrack.length > 0;
  const hasStarted = freeCompleted > 0;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: isOpen ? 'rgba(99,102,241,0.04)' : '#FAFAFA',
        border: isOpen ? '1px solid rgba(99,102,241,0.25)' : '1px solid #E5E7EB',
        backdropFilter: 'blur(12px)',
        boxShadow: isOpen
          ? '0 0 40px rgba(99,102,241,0.06), 0 4px 24px rgba(0,0,0,0.3)'
          : '0 2px 12px rgba(0,0,0,0.2)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, background 200ms ease',
      }}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{track.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-bold text-white text-base leading-tight"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {track.title}
              </h3>
              {trackComplete && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: '#6366F1',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                >
                  <Trophy size={10} />
                  Complete
                </span>
              )}
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#71717a' }}>
              {track.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: '#F9FAFB', color: '#71717a' }}
              >
                {track.lessons.length} lessons · {freeInTrack.length} free
              </span>
              {completedInTrack > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}
                >
                  {completedInTrack}/{track.lessons.length} done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="mt-4 w-full rounded-full overflow-hidden"
          style={{ height: 3, background: '#F9FAFB' }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              background: trackComplete
                ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                : 'linear-gradient(90deg, #6366F1, #f0c040)',
            }}
          />
        </div>

        {/* CTA button */}
        {!isOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            style={{
              background: hasStarted ? 'rgba(99,102,241,0.1)' : '#F9FAFB',
              color: hasStarted ? '#6366F1' : '#71717a',
              border: `1px solid ${hasStarted ? 'rgba(99,102,241,0.2)' : '#E5E7EB'}`,
              cursor: 'pointer',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.8')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            {hasStarted ? (
              <>
                <Play size={10} /> Continue
              </>
            ) : (
              <>
                <BookOpen size={10} /> Start Learning
              </>
            )}
          </button>
        )}
      </div>

      {/* Accordion lessons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 pb-3" style={{ borderTop: '1px solid #F9FAFB' }}>
              {track.lessons.map((lesson, idx) => {
                const isCompleted = progress[lesson.id];
                const inPlaylist = playlist.includes(lesson.id);
                const diffStyle = difficultyStyle(lesson.difficulty);
                const num = String(idx + 1).padStart(2, '0');

                return (
                  <div
                    key={lesson.id}
                    className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-1 cursor-pointer transition-all"
                    style={{
                      background: 'transparent',
                      borderLeft: '2px solid transparent',
                      minHeight: 48,
                    }}
                    onClick={() => onLessonClick(lesson)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = '#FAFAFA';
                      el.style.borderLeftColor = isCompleted
                        ? 'rgba(34,197,94,0.4)'
                        : 'rgba(99,102,241,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = 'transparent';
                      el.style.borderLeftColor = 'transparent';
                    }}
                  >
                    {/* Lesson number */}
                    <span
                      className="text-xs font-bold flex-shrink-0 w-7 text-center"
                      style={{ color: '#3f3f46', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      {num}
                    </span>

                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={15} style={{ color: '#4ade80' }} />
                      ) : lesson.free ? (
                        <BookOpen size={15} style={{ color: '#6366F1' }} />
                      ) : (
                        <Lock size={14} style={{ color: '#3f3f46' }} />
                      )}
                    </div>

                    {/* Title + description */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate transition-colors"
                        style={{
                          color: isCompleted ? '#52525b' : lesson.free ? '#e5e5e5' : '#71717a',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {lesson.title}
                      </div>
                    </div>

                    {/* Right badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {lesson.free && !isCompleted && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}
                        >
                          Free
                        </span>
                      )}
                      <span className="text-xs hidden sm:block" style={{ color: '#3f3f46' }}>
                        {lesson.readTime}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-xs font-medium hidden sm:block"
                        style={{ background: diffStyle.bg, color: diffStyle.color }}
                      >
                        {lesson.difficulty}
                      </span>

                      {/* Playlist toggle — free lessons only */}
                      {lesson.free && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaylistToggle(lesson.id);
                          }}
                          title={inPlaylist ? 'Remove from playlist' : 'Add to playlist'}
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all opacity-0 group-hover:opacity-100"
                          style={{
                            background: inPlaylist
                              ? 'rgba(99,102,241,0.15)'
                              : '#F9FAFB',
                            border: 'none',
                            cursor: 'pointer',
                            color: inPlaylist ? '#6366F1' : '#71717a',
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.opacity = '1')
                          }
                        >
                          {inPlaylist ? <Minus size={10} /> : <Plus size={10} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LearnHub() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [openTrack, setOpenTrack] = useState<string | null>('fundamentals');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('All');
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [confettiActive, setConfettiActive] = useState(false);

  // Load progress on mount — Supabase preferred, localStorage fallback
  useEffect(() => {
    async function load() {
      const local = loadProgress();
      if (userId) {
        const remote = await loadProgressFromSupabase(userId);
        // Merge: remote wins for completed lessons, local fills gaps
        const merged = { ...local, ...remote };
        setProgress(merged);
        // Write merged back to localStorage for offline use
        saveProgress(merged);
      } else {
        setProgress(local);
      }
      setProgressLoaded(true);
    }
    load();
    setPlaylist(loadPlaylist());
  }, [userId]);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const overallPercent = Math.round((completedCount / TOTAL_LESSONS) * 100);

  // Trigger toast + confetti when a track's free lessons are all done
  const checkTrackCompletion = useCallback(
    (updated: Record<string, boolean>, prev: Record<string, boolean>) => {
      for (const track of TRACKS) {
        const freeLessons = track.lessons.filter((l) => l.free);
        const wasComplete = freeLessons.every((l) => prev[l.id]);
        const nowComplete = freeLessons.every((l) => updated[l.id]);
        if (nowComplete && !wasComplete) {
          setConfettiActive(true);
          setToast({ message: `You completed ${track.title}!`, visible: true });
          setTimeout(() => setConfettiActive(false), 3000);
          setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
          break;
        }
      }
    },
    []
  );

  const handleComplete = useCallback(
    (lessonId: string) => {
      const updated = { ...progress, [lessonId]: true };
      setProgress(updated);
      saveProgress(updated);
      checkTrackCompletion(updated, progress);
      if (userId) syncProgressToSupabase(userId, lessonId);
    },
    [progress, userId, checkTrackCompletion]
  );

  const handleLessonClick = useCallback((lesson: Lesson) => {
    if (!lesson.free) {
      setUpgradeOpen(true);
      return;
    }
    setSelectedLesson(lesson);
    setLessonModalOpen(true);
  }, []);

  const handlePlaylistToggle = useCallback((lessonId: string) => {
    setPlaylist((prev) => {
      const next = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      savePlaylist(next);
      return next;
    });
  }, []);

  // Lesson navigation (prev/next within same track)
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!selectedLesson) return { prevLesson: null, nextLesson: null };
    const ctx = getLessonByTrack(selectedLesson.id);
    if (!ctx) return { prevLesson: null, nextLesson: null };
    const { track, index } = ctx;
    const freeLessons = track.lessons.filter((l) => l.free);
    const freeIdx = freeLessons.findIndex((l) => l.id === selectedLesson.id);
    return {
      prevLesson: freeIdx > 0 ? freeLessons[freeIdx - 1] : null,
      nextLesson: freeIdx < freeLessons.length - 1 ? freeLessons[freeIdx + 1] : null,
    };
  }, [selectedLesson]);

  const handleNavigate = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
  }, []);

  // Filter tracks by search + difficulty
  const filteredTracks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TRACKS.map((track) => {
      const lessons = track.lessons.filter((l) => {
        const matchDiff = diffFilter === 'All' || l.difficulty === diffFilter;
        const matchSearch =
          !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
        return matchDiff && matchSearch;
      });
      return { ...track, lessons };
    }).filter(
      (track) =>
        track.lessons.length > 0 ||
        (!q && diffFilter === 'All') ||
        track.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, diffFilter]);

  const DIFF_PILLS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

  return (
    <div
      className="min-h-screen"
      style={{ background: '#FAFAFA', fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Confetti */}
      <ConfettiBurst active={confettiActive} />

      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* Playlist Drawer */}
      <PlaylistDrawer
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        playlist={playlist}
        progress={progress}
        onPlay={(id) => {
          const lesson = TRACKS.flatMap((t) => t.lessons).find((l) => l.id === id);
          if (lesson) handleLessonClick(lesson);
        }}
        onRemove={handlePlaylistToggle}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1
              className="text-4xl md:text-5xl font-black leading-tight"
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                background: 'linear-gradient(135deg, #6366F1 20%, #A5B4FC 60%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Majorka Academy
            </h1>
            <p className="text-sm mt-2" style={{ color: '#71717a' }}>
              From zero to your first $10K month — step by step.
            </p>
          </div>

          {/* Progress + Playlist trigger */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Playlist button */}
            <button
              onClick={() => setPlaylistOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: '#F9FAFB',
                border: '1px solid #F5F5F5',
                color: '#a1a1aa',
                cursor: 'pointer',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 13,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.25)';
                (e.currentTarget as HTMLButtonElement).style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5F5F5';
                (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa';
              }}
            >
              <ListOrdered size={14} />
              Playlist
              {playlist.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: '#6366F1', color: '#0a0a0a', fontSize: 9 }}
                >
                  {playlist.length}
                </span>
              )}
            </button>

            {/* Circular progress */}
            {progressLoaded && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #E5E7EB',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="relative flex items-center justify-center">
                  <CircularRing percent={overallPercent} />
                  <span
                    className="absolute text-xs font-black"
                    style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {overallPercent}%
                  </span>
                </div>
                <div>
                  <div
                    className="font-bold text-white text-sm"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {completedCount} of {TOTAL_LESSONS}
                  </div>
                  <div className="text-xs" style={{ color: '#52525b' }}>
                    complete
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:max-w-sm text-sm transition-all focus:outline-none"
            style={{
              background: '#F9FAFB',
              border: '1px solid #F5F5F5',
              borderRadius: 10,
              padding: '10px 16px',
              color: '#374151',
              fontFamily: 'DM Sans, sans-serif',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
            onBlur={(e) => (e.target.style.borderColor = '#F5F5F5')}
          />

          {/* Difficulty pills */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {DIFF_PILLS.map((pill) => {
              const active = diffFilter === pill;
              const col = pill === 'All' ? '#6366F1' : difficultyStyle(pill).color;
              return (
                <button
                  key={pill}
                  onClick={() => setDiffFilter(pill)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: active
                      ? pill === 'All'
                        ? 'rgba(99,102,241,0.15)'
                        : `${difficultyStyle(pill).bg}`
                      : '#F9FAFB',
                    color: active ? col : '#52525b',
                    border: active ? `1px solid ${col}40` : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#52525b';
                  }}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Track grid */}
        {filteredTracks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={36} style={{ color: '#3f3f46', margin: '0 auto 12px' }} />
            <p className="text-sm font-medium" style={{ color: '#52525b' }}>
              No lessons match your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isOpen={openTrack === track.id}
                onToggle={() => setOpenTrack((prev) => (prev === track.id ? null : track.id))}
                progress={progress}
                playlist={playlist}
                onLessonClick={handleLessonClick}
                onPlaylistToggle={handlePlaylistToggle}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs" style={{ color: '#3f3f46' }}>
            Free lessons open to all · Locked lessons require Builder Plan
          </p>
        </div>
      </div>

      {/* Lesson Modal */}
      <LessonModal
        lesson={selectedLesson}
        open={lessonModalOpen}
        onClose={() => {
          setLessonModalOpen(false);
          setSelectedLesson(null);
        }}
        onComplete={handleComplete}
        completed={progress}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        onNavigate={handleNavigate}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
