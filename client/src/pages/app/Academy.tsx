/**
 * Majorka Academy — the free tier.
 *
 * Academy is the conversion funnel: it teaches a cold visitor enough about
 * dropshipping that they understand *why* Majorka's paid tools collapse
 * 40 hours/week of product research into a single dashboard. Every module
 * ends with a CTA into a real product surface (Products, Store Builder,
 * Ads Studio, Alerts). The page closes on a plan comparison.
 *
 * No placeholder copy. No lorem ipsum. Every sentence written to convert.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe2,
  ShieldCheck,
  Lock,
  Check,
  Star,
  GraduationCap,
  Target,
  Timer,
} from 'lucide-react';

import { AnimatedGradient } from '@/components/academy/AnimatedGradient';
import { ScrollProgress } from '@/components/academy/ScrollProgress';
import { LiveCounter } from '@/components/academy/LiveCounter';
import { FomoTicker } from '@/components/academy/FomoTicker';
import { ModuleCard } from '@/components/academy/ModuleCard';
import { ACADEMY_MODULES } from '@/components/academy/modules';

const PROGRESS_KEY = 'majorka_academy_progress';

const displayFont = "'Nohemi', 'DM Sans', sans-serif";

interface StoredProgress {
  completed: string[];
  openId: string | null;
}

function loadProgress(): StoredProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: [], openId: null };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return { completed: [], openId: null };
    const p = parsed as Partial<StoredProgress>;
    return {
      completed: Array.isArray(p.completed) ? p.completed.filter((x): x is string => typeof x === 'string') : [],
      openId: typeof p.openId === 'string' ? p.openId : null,
    };
  } catch {
    return { completed: [], openId: null };
  }
}

function saveProgress(p: StoredProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* storage full / disabled — silently fail */
  }
}

export default function Academy() {
  useEffect(() => {
    document.title = 'Academy — Majorka';
  }, []);

  const initial = useMemo(loadProgress, []);
  const [completed, setCompleted] = useState<Set<string>>(new Set(initial.completed));
  const [openId, setOpenId] = useState<string | null>(initial.openId);
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Persist progress
  useEffect(() => {
    saveProgress({ completed: Array.from(completed), openId });
  }, [completed, openId]);

  // Auto-complete a module when the user scrolls past it (intersection
  // observer fires when the bottom of the card leaves the viewport).
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ACADEMY_MODULES.forEach((m) => {
      const el = moduleRefs.current[m.id];
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            setCompleted((prev) => {
              if (prev.has(m.id)) return prev;
              const next = new Set(prev);
              next.add(m.id);
              return next;
            });
          }
        },
        { threshold: 0 },
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const toggleOpen = useCallback((id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  const markComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const progressPct = Math.round((completed.size / ACADEMY_MODULES.length) * 100);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#f0f4ff]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <ScrollProgress />

      {/* ─────────────────────────────────────────────────────── HERO */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <AnimatedGradient />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-[11px] font-mono uppercase tracking-widest text-white/70 mb-6"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            Academy · Free forever
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight max-w-4xl"
            style={{ fontFamily: displayFont }}
          >
            From zero to your first sale
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
              in 60 minutes.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed"
          >
            The no-fluff dropshipping playbook, written for Australian operators.
            Twelve modules. Real examples. Zero guru nonsense. Completely free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#modules"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-all hover:scale-[1.02] shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_20px_60px_rgba(99,102,241,0.3)]"
            >
              Start free
              <ArrowRight size={16} />
            </a>
            <Link
              href="/app/products"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] text-white/90 text-sm font-medium transition-colors"
            >
              Skip to the product surface
            </Link>
            <span className="text-xs text-white/40 ml-1">Upgrade when you're ready. Not a second sooner.</span>
          </motion.div>

          {/* Live stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Winning products</div>
              <div className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: displayFont }}>
                <LiveCounter />
              </div>
              <div className="text-[11px] text-white/40 mt-1">tracked right now, live</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Refresh cadence</div>
              <div className="text-2xl md:text-3xl font-semibold text-white/95" style={{ fontFamily: displayFont }}>
                Every 6h
              </div>
              <div className="text-[11px] text-white/40 mt-1">fresh AliExpress imports</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Markets covered</div>
              <div className="text-2xl md:text-3xl font-semibold text-white/95" style={{ fontFamily: displayFont }}>
                7
              </div>
              <div className="text-[11px] text-white/40 mt-1">AU, NZ, UK, US, CA, IE, SG</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">First-sale goal</div>
              <div className="text-2xl md:text-3xl font-semibold text-white/95" style={{ fontFamily: displayFont }}>
                &lt; 60 min
              </div>
              <div className="text-[11px] text-white/40 mt-1">from signup to live store</div>
            </div>
          </motion.div>

          {/* FOMO ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6"
          >
            <FomoTicker />
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── WHY ACADEMY */}
      <section className="relative py-16 md:py-24 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                icon: <GraduationCap size={18} />,
                title: 'Taught by operators',
                body: 'Every lesson is written by someone who has actually lost (and then made) money running ads on AliExpress products in Australia.',
              },
              {
                icon: <Target size={18} />,
                title: 'Hyper-specific',
                body: 'No "you could maybe". Exact margin targets, exact ad budgets, exact AU-native copy patterns that convert.',
              },
              {
                icon: <Timer size={18} />,
                title: 'Fast on purpose',
                body: 'The whole curriculum is under two hours. If you can\'t learn dropshipping in that long, no one can teach you.',
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-surface border border-white/[0.07] rounded-2xl p-6 transition-all hover:border-indigo-400/30"
                style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.01)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300 mb-4">
                  {c.icon}
                </div>
                <div className="text-lg font-semibold text-white/95 mb-2" style={{ fontFamily: displayFont }}>
                  {c.title}
                </div>
                <div className="text-sm text-white/55 leading-relaxed">{c.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── MODULES */}
      <section id="modules" className="relative py-16 md:py-24 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-10 md:mb-14"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-300/70 mb-3">
              The Learning Path · 12 modules · ~2 hrs total
            </div>
            <h2
              className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight"
              style={{ fontFamily: displayFont }}
            >
              Everything you need to know.
              <br />
              <span className="text-white/50">Nothing you don't.</span>
            </h2>

            {/* Progress */}
            <div className="mt-8 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-white/50 mb-2">
                  <span>Your progress</span>
                  <span className="tabular-nums">
                    {completed.size}/{ACADEMY_MODULES.length} · {progressPct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)' }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-5">
            {ACADEMY_MODULES.map((m) => (
              <div
                key={m.id}
                ref={(el) => {
                  moduleRefs.current[m.id] = el;
                }}
              >
                <ModuleCard
                  m={m}
                  completed={completed.has(m.id)}
                  open={openId === m.id}
                  onToggle={() => toggleOpen(m.id)}
                  onComplete={() => markComplete(m.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── PROOF */}
      <section className="relative py-16 md:py-24 border-t border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-3xl rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.12), transparent 70%)' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 md:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/70 mb-3">
              Social proof · verified operators
            </div>
            <h2
              className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight"
              style={{ fontFamily: displayFont }}
            >
              Operators who skipped the guesswork.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                name: 'James L.',
                role: 'Sydney · Pet niche',
                rev: '$18,400 / mo',
                quote: 'I spent six months "researching" before Majorka. I spent six days researching with Majorka. Same outcome. Wildly different calendar.',
                color: '#10b981',
              },
              {
                name: 'Sarah K.',
                role: 'Melbourne · Home & kitchen',
                rev: '$9,200 / mo',
                quote: 'The velocity score is the only metric I look at now. If it\'s not 85+, I don\'t even click the product. Saved me from three losers already.',
                color: '#6366f1',
              },
              {
                name: 'Priya S.',
                role: 'Gold Coast · Beauty',
                rev: '$34,700 / mo',
                quote: 'Store Builder took what used to be a 2-week project and made it an afternoon. I ran my first ads before dinner.',
                color: '#f59e0b',
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-surface border border-white/[0.07] rounded-2xl p-6 transition-all"
                style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.01)' }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} fill={t.color} stroke={t.color} />
                  ))}
                </div>
                <p className="text-[15px] leading-relaxed text-white/80 mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}33` }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/90">{t.name}</div>
                    <div className="text-xs text-white/50">{t.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Revenue</div>
                    <div className="text-sm font-semibold tabular-nums" style={{ color: t.color }}>
                      {t.rev}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-mono uppercase tracking-widest text-white/30">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} /> Stripe-verified billing
            </span>
            <span className="flex items-center gap-2">
              <Globe2 size={14} /> 7 markets covered
            </span>
            <span className="flex items-center gap-2">
              <Zap size={14} /> 6-hour data refresh
            </span>
            <span className="flex items-center gap-2">
              <Sparkles size={14} /> Claude Sonnet 4.6 powered
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── PRICING NUDGE */}
      <section className="relative py-20 md:py-28 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-300/70 mb-3">
              You've learned the basics
            </div>
            <h2
              className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight"
              style={{ fontFamily: displayFont }}
            >
              Ready to find your first winner?
            </h2>
            <p className="mt-5 text-lg text-white/55 max-w-2xl mx-auto leading-relaxed">
              Academy teaches you the game. Majorka wins it for you. Start with a 7-day trial —
              cancel before day 7 and you pay nothing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {/* Academy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="bg-surface border border-white/[0.07] rounded-2xl p-7 flex flex-col"
            >
              <div className="text-[11px] font-mono uppercase tracking-widest text-white/50 mb-3">Academy</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-semibold text-white/95" style={{ fontFamily: displayFont }}>Free</span>
                <span className="text-sm text-white/40">forever</span>
              </div>
              <ul className="space-y-3 text-sm text-white/70 flex-1 mb-6">
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" /> 12 full modules, 30+ lessons</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" /> Live demos from real DB</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" /> First-sale checklist</li>
                <li className="flex items-start gap-2.5 text-white/30"><Lock size={14} className="mt-0.5 flex-shrink-0" /> No product database access</li>
                <li className="flex items-start gap-2.5 text-white/30"><Lock size={14} className="mt-0.5 flex-shrink-0" /> No Store Builder</li>
                <li className="flex items-start gap-2.5 text-white/30"><Lock size={14} className="mt-0.5 flex-shrink-0" /> No Ads Studio</li>
              </ul>
              <div className="text-xs text-white/40 border-t border-white/[0.06] pt-4">
                You are here.
              </div>
            </motion.div>

            {/* Builder — featured */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.12 }}
              whileHover={{ y: -4 }}
              className="relative bg-gradient-to-b from-indigo-500/[0.08] to-surface border rounded-2xl p-7 flex flex-col"
              style={{
                borderColor: 'rgba(99,102,241,0.35)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.25), 0 30px 80px rgba(99,102,241,0.15)',
              }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-mono uppercase tracking-widest">
                Most popular
              </div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-indigo-300 mb-3">Builder</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-semibold text-white" style={{ fontFamily: displayFont }}>$99</span>
                <span className="text-sm text-white/50">/ mo AUD</span>
              </div>
              <ul className="space-y-3 text-sm text-white/75 flex-1 mb-6">
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-indigo-300 flex-shrink-0" /> Everything in Academy</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-indigo-300 flex-shrink-0" /> Full Products database (3,715+ SKUs)</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-indigo-300 flex-shrink-0" /> Velocity Leaders &amp; winning scores</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-indigo-300 flex-shrink-0" /> Store Builder — unlimited stores</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-indigo-300 flex-shrink-0" /> Ads Studio (Meta + TikTok copy)</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-indigo-300 flex-shrink-0" /> 10 tracked products in Alerts</li>
              </ul>
              <Link
                href="/pricing"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-all hover:scale-[1.02]"
              >
                Start 7-day trial
                <ArrowRight size={14} />
              </Link>
              <div className="mt-3 text-[11px] text-center text-white/40">
                No charge until day 8. Cancel anytime.
              </div>
            </motion.div>

            {/* Scale */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-surface border border-white/[0.07] rounded-2xl p-7 flex flex-col"
            >
              <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300/80 mb-3">Scale</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-semibold text-white/95" style={{ fontFamily: displayFont }}>$199</span>
                <span className="text-sm text-white/40">/ mo AUD</span>
              </div>
              <ul className="space-y-3 text-sm text-white/70 flex-1 mb-6">
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-amber-300 flex-shrink-0" /> Everything in Builder</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-amber-300 flex-shrink-0" /> Unlimited Alerts tracking</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-amber-300 flex-shrink-0" /> Competitor Spy (coming soon)</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-amber-300 flex-shrink-0" /> Revenue analytics per SKU</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-amber-300 flex-shrink-0" /> Priority 6-hour data refresh</li>
                <li className="flex items-start gap-2.5"><Check size={14} className="mt-0.5 text-amber-300 flex-shrink-0" /> 1-on-1 onboarding call</li>
              </ul>
              <Link
                href="/pricing"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white/90 text-sm font-semibold transition-colors"
              >
                Go Scale
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Closing line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 text-center"
          >
            <p className="text-sm text-white/40 max-w-lg mx-auto">
              The gap between knowing and doing is the product.
              <br />
              Academy closes the knowing gap. The trial closes the doing gap.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
