/**
 * LearnHub — Majorka Academy
 * 4 tracks, 20 lessons, AI-generated content, progress tracking, free/locked tiers
 */
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  description: string;
  readTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  free: boolean;
}

interface Track {
  id: string;
  emoji: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const TRACKS: Track[] = [
  {
    id: "fundamentals",
    emoji: "🎓",
    title: "Dropshipping Fundamentals",
    description: "Everything you need to know before your first sale",
    lessons: [
      {
        id: "what-is-dropshipping",
        title: "What is Dropshipping?",
        description: "The complete business model explained with real AU examples",
        readTime: "5 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "au-market-101",
        title: "The Australian Market",
        description: "Why AU is different: consumer behaviour, platforms, regulations",
        readTime: "8 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "legal-setup",
        title: "Legal Setup in Australia",
        description: "ABN, GST, ACCC requirements — what you actually need",
        readTime: "6 min",
        difficulty: "Beginner",
        free: false,
      },
      {
        id: "supplier-types",
        title: "Types of Suppliers",
        description: "Alibaba, AU wholesalers, 3PL, print-on-demand compared",
        readTime: "7 min",
        difficulty: "Beginner",
        free: false,
      },
      {
        id: "profit-maths",
        title: "The Profit Maths",
        description: "COGS, margins, ROAS targets — the numbers you must know",
        readTime: "10 min",
        difficulty: "Intermediate",
        free: false,
      },
    ],
  },
  {
    id: "products",
    emoji: "🔍",
    title: "Finding Winning Products",
    description: "How to find products that actually sell",
    lessons: [
      {
        id: "product-criteria",
        title: "The Winning Product Formula",
        description: "7 criteria that separate winners from money-wasters",
        readTime: "8 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "research-tools",
        title: "Using Majorka Product Scout",
        description: "Step-by-step: find your first winner using AI",
        readTime: "6 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "trend-timing",
        title: "Trend Timing",
        description: "How to enter a trend at the right moment",
        readTime: "7 min",
        difficulty: "Intermediate",
        free: false,
      },
      {
        id: "competition-analysis",
        title: "Analysing Competition",
        description: "How to read saturation signals and find untapped angles",
        readTime: "9 min",
        difficulty: "Intermediate",
        free: false,
      },
      {
        id: "validation",
        title: "Validate Before You Invest",
        description: "Test demand with $50 before spending $500",
        readTime: "8 min",
        difficulty: "Intermediate",
        free: false,
      },
    ],
  },
  {
    id: "brand",
    emoji: "🏗️",
    title: "Building Your Brand",
    description: "Stand out from generic dropship stores",
    lessons: [
      {
        id: "brand-positioning",
        title: "Brand Positioning",
        description: "How to be specific enough to win, broad enough to scale",
        readTime: "7 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "store-building",
        title: "Building with Majorka",
        description: "From brand DNA to live Shopify store in one session",
        readTime: "10 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "copywriting-basics",
        title: "Copywriting That Converts",
        description: "5 principles of high-converting copy for AU buyers",
        readTime: "9 min",
        difficulty: "Intermediate",
        free: false,
      },
      {
        id: "trust-signals",
        title: "AU Trust Signals",
        description: "Afterpay, AusPost, reviews — what AU buyers need to see",
        readTime: "6 min",
        difficulty: "Beginner",
        free: false,
      },
      {
        id: "email-marketing",
        title: "Email Marketing Foundations",
        description: "Build a list from day one — your most valuable asset",
        readTime: "8 min",
        difficulty: "Intermediate",
        free: false,
      },
    ],
  },
  {
    id: "ads",
    emoji: "📢",
    title: "Running Ads",
    description: "Profitable paid traffic for AU ecommerce",
    lessons: [
      {
        id: "meta-basics",
        title: "Meta Ads for Beginners",
        description: "Your first AU Facebook/Instagram campaign, step by step",
        readTime: "12 min",
        difficulty: "Beginner",
        free: true,
      },
      {
        id: "creative-strategy",
        title: "Creative Strategy",
        description: "Hooks, angles, and formats that work for AU audiences",
        readTime: "10 min",
        difficulty: "Intermediate",
        free: true,
      },
      {
        id: "tiktok-ads",
        title: "TikTok Ads AU",
        description: "Profitable TikTok Shop and Spark Ads in Australia",
        readTime: "11 min",
        difficulty: "Intermediate",
        free: false,
      },
      {
        id: "scaling",
        title: "Scaling Winning Ads",
        description: "How to 2x, 5x, 10x a winning campaign without killing it",
        readTime: "9 min",
        difficulty: "Advanced",
        free: false,
      },
      {
        id: "analytics",
        title: "Reading Your Numbers",
        description: "CPM, CTR, ROAS, CPA — what each metric actually means",
        readTime: "8 min",
        difficulty: "Intermediate",
        free: false,
      },
    ],
  },
];

const STORAGE_KEY = "majorka_academy_v1";
const TOTAL_LESSONS = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

function difficultyStyle(difficulty: string): { bg: string; color: string } {
  if (difficulty === "Beginner") return { bg: "rgba(34,197,94,0.1)", color: "#4ade80" };
  if (difficulty === "Advanced") return { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
  return { bg: "rgba(212,175,55,0.1)", color: "#d4af37" };
}

// ── Render lesson content ─────────────────────────────────────────────────────

function renderContent(text: string) {
  if (!text) return null;
  const paragraphs = text.split("\n\n");
  return paragraphs.map((para, i) => {
    if (para.startsWith("## ")) {
      return (
        <h3
          key={i}
          className="text-lg font-bold text-white mt-6 mb-3"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {para.replace(/^## /, "")}
        </h3>
      );
    }
    const lines = para.split("\n");
    const isList = lines.every((l) => l.startsWith("- ") || l === "");
    if (isList) {
      return (
        <ul key={i} className="list-none space-y-1.5 my-3">
          {lines
            .filter((l) => l.startsWith("- "))
            .map((l, j) => (
              <li key={j} className="flex items-start gap-2" style={{ color: "#a1a1aa" }}>
                <span style={{ color: "#d4af37", flexShrink: 0, marginTop: 2 }}>·</span>
                <span dangerouslySetInnerHTML={{ __html: boldify(l.replace(/^- /, "")) }} />
              </li>
            ))}
        </ul>
      );
    }
    return (
      <p
        key={i}
        className="text-sm leading-relaxed my-3"
        style={{ color: "#a1a1aa" }}
        dangerouslySetInnerHTML={{ __html: boldify(para) }}
      />
    );
  });
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong style=\"color:#f5f5f5\">$1</strong>");
}

// ── Circular progress ring ────────────────────────────────────────────────────

function CircularRing({ percent }: { percent: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={40} height={40} className="flex-shrink-0">
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
      <circle
        cx={20}
        cy={20}
        r={r}
        fill="none"
        stroke="#d4af37"
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ── Lesson Modal ──────────────────────────────────────────────────────────────

interface LessonModalProps {
  lesson: Lesson | null;
  open: boolean;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
  completed: Record<string, boolean>;
}

function LessonModal({ lesson, open, onClose, onComplete, completed }: LessonModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!lesson || !open) return;
    setContent("");
    setLoading(true);

    const prompt = `Write a lesson titled "${lesson.title}". ${lesson.description}. Format: use ## for subheadings, bullet points for lists, **bold** for key terms. Include 2-3 Australian examples with AUD pricing. Difficulty: ${lesson.difficulty}. Target length: ${lesson.readTime} read. End with 3 actionable takeaways in a numbered list.`;

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        toolName: "ai-chat",
        market: "AU",
        stream: false,
      }),
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as Record<string, unknown>;
        const choices = d.choices as Array<{ message: { content: string } }> | undefined;
        const text =
          (d.content as string) ||
          (d.text as string) ||
          (d.result as string) ||
          choices?.[0]?.message?.content ||
          "";
        setContent(text);
      })
      .catch(() => {
        setContent(
          "## Lesson Content\n\nContent is loading. Please try again in a moment.\n\nIf this persists, check your connection."
        );
      })
      .finally(() => setLoading(false));
  }, [lesson, open]);

  if (!lesson) return null;

  const isCompleted = completed[lesson.id];
  const diffStyle = difficultyStyle(lesson.difficulty);

  const handleComplete = () => {
    onComplete(lesson.id);
    onClose();
  };

  const handleAskMaya = () => {
    setLocation(`/app/ai-chat?q=${encodeURIComponent(`Tell me more about: ${lesson.title}`)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl border border-white/10 p-0 overflow-hidden"
        style={{ background: "#0d1117", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: diffStyle.bg, color: diffStyle.color }}
            >
              {lesson.difficulty}
            </span>
            <span className="text-xs" style={{ color: "#52525b" }}>
              {lesson.readTime} read
            </span>
          </div>
          <DialogTitle
            className="text-2xl font-bold text-white leading-tight"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {lesson.title}
          </DialogTitle>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            {lesson.description}
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
          {loading ? (
            <div className="space-y-3 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-4 rounded animate-pulse"
                  style={{ background: "rgba(255,255,255,0.05)", width: `${60 + (i % 3) * 15}%` }}
                />
              ))}
              <div className="h-4 rounded animate-pulse mt-6" style={{ background: "rgba(255,255,255,0.05)", width: "80%" }} />
              <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "65%" }} />
              <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "90%" }} />
            </div>
          ) : (
            <div>{renderContent(content)}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={handleAskMaya}
            className="text-sm font-medium text-left transition-opacity hover:opacity-80"
            style={{ color: "#d4af37", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Ask Maya about this →
          </button>
          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: isCompleted
                ? "rgba(34,197,94,0.15)"
                : "linear-gradient(135deg, #d4af37, #b8941f)",
              color: isCompleted ? "#4ade80" : "#0a0a0a",
              border: isCompleted ? "1px solid rgba(34,197,94,0.3)" : "none",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}
          >
            {isCompleted ? "✓ Completed" : "Mark Complete ✓"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Upgrade Dialog ────────────────────────────────────────────────────────────

function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm border border-white/10 text-center"
        style={{ background: "#0d1117" }}
      >
        <div className="py-4 flex flex-col items-center gap-4">
          <div className="text-5xl">🔒</div>
          <DialogTitle
            className="text-xl font-bold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Builder Plan Required
          </DialogTitle>
          <p className="text-sm" style={{ color: "#71717a" }}>
            Unlock all 20 lessons + AI personalisation to accelerate your dropshipping journey.
          </p>
          <button
            onClick={() => { setLocation("/pricing"); onClose(); }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8941f)",
              color: "#0a0a0a",
              border: "none",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}
          >
            Upgrade to Builder Plan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Track Card ────────────────────────────────────────────────────────────────

interface TrackCardProps {
  track: Track;
  isOpen: boolean;
  onToggle: () => void;
  progress: Record<string, boolean>;
  onLessonClick: (lesson: Lesson) => void;
}

function TrackCard({ track, isOpen, onToggle, progress, onLessonClick }: TrackCardProps) {
  const completedInTrack = track.lessons.filter((l) => progress[l.id]).length;
  const progressPercent = (completedInTrack / track.lessons.length) * 100;
  const freeCount = track.lessons.filter((l) => l.free).length;

  return (
    <div
      className="rounded-2xl border cursor-pointer transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isOpen ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.07)",
      }}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span style={{ fontSize: 48, lineHeight: 1 }}>{track.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-white text-lg leading-tight"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {track.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              {track.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "#71717a" }}
              >
                {track.lessons.length} lessons · {freeCount} free
              </span>
              {completedInTrack > 0 && (
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37" }}
                >
                  {completedInTrack}/{track.lessons.length} done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full overflow-hidden mt-4"
          style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #d4af37, #f0c040)",
            }}
          />
        </div>
      </div>

      {/* Accordion lessons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 pb-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {track.lessons.map((lesson) => {
                const isCompleted = progress[lesson.id];
                const diffStyle = difficultyStyle(lesson.difficulty);
                const icon = isCompleted ? "✅" : lesson.free ? "🔓" : "🔒";

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onLessonClick(lesson)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mt-1"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
                    }
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: isCompleted ? "#71717a" : "#f5f5f5" }}
                      >
                        {lesson.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: "#52525b" }}>
                        {lesson.readTime}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: diffStyle.bg, color: diffStyle.color }}
                      >
                        {lesson.difficulty}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LearnHub() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [openTrack, setOpenTrack] = useState<string | null>("fundamentals");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Load progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const overallPercent = Math.round((completedCount / TOTAL_LESSONS) * 100);

  const handleComplete = useCallback(
    (lessonId: string) => {
      const updated = { ...progress, [lessonId]: true };
      setProgress(updated);
      saveProgress(updated);
    },
    [progress]
  );

  const handleLessonClick = useCallback((lesson: Lesson) => {
    if (!lesson.free) {
      setUpgradeOpen(true);
      return;
    }
    setSelectedLesson(lesson);
    setLessonModalOpen(true);
  }, []);

  const handleToggleTrack = useCallback((trackId: string) => {
    setOpenTrack((prev) => (prev === trackId ? null : trackId));
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080a0e", fontFamily: "DM Sans, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1
              className="text-4xl md:text-5xl font-black leading-tight"
              style={{
                fontFamily: "Syne, sans-serif",
                background: "linear-gradient(135deg, #d4af37, #f5d98a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Majorka Academy
            </h1>
            <p className="text-base mt-2" style={{ color: "#71717a" }}>
              From zero to your first $10K month — step by step.
            </p>
          </div>

          {/* Progress badge */}
          <div
            className="flex items-center gap-4 px-5 py-4 rounded-2xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="relative flex items-center justify-center">
              <CircularRing percent={overallPercent} />
              <span
                className="absolute text-xs font-bold"
                style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}
              >
                {overallPercent}%
              </span>
            </div>
            <div>
              <div className="font-bold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                {completedCount} of {TOTAL_LESSONS}
              </div>
              <div className="text-xs" style={{ color: "#52525b" }}>
                lessons complete
              </div>
            </div>
          </div>
        </div>

        {/* Track grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRACKS.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isOpen={openTrack === track.id}
              onToggle={() => handleToggleTrack(track.id)}
              progress={progress}
              onLessonClick={handleLessonClick}
            />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center">
          <p className="text-sm" style={{ color: "#3f3f46" }}>
            🔓 Free lessons are open to all · 🔒 Locked lessons require a Builder Plan
          </p>
        </div>
      </div>

      {/* Lesson Modal */}
      <LessonModal
        lesson={selectedLesson}
        open={lessonModalOpen}
        onClose={() => { setLessonModalOpen(false); setSelectedLesson(null); }}
        onComplete={handleComplete}
        completed={progress}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
