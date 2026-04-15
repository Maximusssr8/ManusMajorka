// Directive 2 — scroll-linked chapter morph.
// One sticky dashboard, four chapters (Discover/Score/Brief/Ads).
// Framer Motion useScroll + useTransform drive crossfades.
// Chapter copy scrolls past on one side, dashboard is pinned on the other.

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LT, F, R } from '@/lib/landingTokens';
import { Typewriter, MarketSplitBars, CountUp, SparklineDraw } from '../primitives';

interface Chapter {
  key: string;
  n: string;
  title: string;
  body: string;
}

const CHAPTERS: Chapter[] = [
  { key: 'discover', n: '01', title: 'Discover', body: 'Tens of millions of AliExpress listings, filtered down to the few thousand worth shipping. You see a grid; our pipeline saw the rejects.' },
  { key: 'score',    n: '02', title: 'Score',    body: 'Trend Velocity isolates products breaking out this week — not last quarter. Three market splits (AU/US/UK) tell you where demand actually lives.' },
  { key: 'brief',    n: '03', title: 'Brief',    body: 'A one-paragraph AI brief per product: angle, audience, price ceiling, why now. Written in the voice a Meta buyer wants to read.' },
  { key: 'ads',      n: '04', title: 'Ads',      body: 'Four ad formats, pre-filled: feed, reel, story, carousel. Copy the winning one and ship it in under a minute.' },
];

export function ChapterMorph() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Map scroll progress [0..1] to opacity per chapter with smooth crossfades.
  // Hooks called unconditionally (one per chapter) — length is fixed at 4.
  const fade0 = useTransform(scrollYProgress, [0, 0.125, 0.25], [1, 1, 0]);
  const fade1 = useTransform(scrollYProgress, [0.15, 0.375, 0.5], [0, 1, 0]);
  const fade2 = useTransform(scrollYProgress, [0.45, 0.625, 0.75], [0, 1, 0]);
  const fade3 = useTransform(scrollYProgress, [0.7, 0.875, 1], [0, 1, 1]);
  const fades = [fade0, fade1, fade2, fade3];

  if (reduced) {
    // Static stack: show all four chapters one after another.
    return (
      <section style={{ padding: '96px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: LT.text, margin: 0, marginBottom: 32 }}>
          The four chapters
        </h2>
        <div style={{ display: 'grid', gap: 24 }}>
          {CHAPTERS.map((c) => (
            <article key={c.key} style={staticCard}>
              <span style={chapterNumber}>{c.n}</span>
              <h3 style={chapterTitle}>{c.title}</h3>
              <p style={chapterBody}>{c.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        // Four full viewports of scroll runway so each chapter gets real dwell time.
        height: '400vh',
        background: LT.bg,
      }}
      aria-label="Product walkthrough"
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          padding: '0 max(24px, 5vw)',
          alignItems: 'center',
          overflow: 'hidden',
        }}
        className="mj-chapter-sticky"
      >
        {/* Left: chapter copy — the active one fades on, others fade off. */}
        <div style={{ position: 'relative', minHeight: 280 }}>
          {CHAPTERS.map((c, i) => (
            <motion.article
              key={c.key}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: fades[i],
                display: 'grid',
                alignContent: 'center',
                gap: 14,
              }}
            >
              <span style={chapterNumber}>Chapter {c.n}</span>
              <h3 style={chapterTitle}>{c.title}</h3>
              <p style={chapterBody}>{c.body}</p>
            </motion.article>
          ))}
        </div>

        {/* Right: morphing dashboard — each chapter's visual stacks + crossfades. */}
        <div style={{
          position: 'relative',
          height: 'min(520px, 70vh)',
          background: LT.bgCard,
          border: `1px solid ${LT.border}`,
          borderRadius: R.card,
          overflow: 'hidden',
        }}>
          <motion.div style={{ position: 'absolute', inset: 0, opacity: fades[0] }}>
            <DiscoverPanel />
          </motion.div>
          <motion.div style={{ position: 'absolute', inset: 0, opacity: fades[1] }}>
            <ScorePanel />
          </motion.div>
          <motion.div style={{ position: 'absolute', inset: 0, opacity: fades[2] }}>
            <BriefPanel />
          </motion.div>
          <motion.div style={{ position: 'absolute', inset: 0, opacity: fades[3] }}>
            <AdsPanel />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Per-chapter visuals ─────────────────────────────────────────────────────
function DiscoverPanel() {
  return (
    <div style={panel}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{
            aspectRatio: '1 / 1',
            background: LT.bgElevated,
            border: `1px solid ${LT.border}`,
            borderRadius: 10,
            opacity: 0.4 + (i % 3) * 0.15,
          }} />
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Pet', 'Kitchen', 'Home', 'Fitness'].map((t) => (
          <span key={t} style={chip}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ScorePanel() {
  return (
    <div style={panel}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        <div style={{
          aspectRatio: '1 / 1',
          background: LT.bgElevated,
          border: `1px solid ${LT.gold}`,
          borderRadius: 12,
          transform: 'scale(1.03)',
        }} />
        <div style={{ display: 'grid', gap: 10 }}>
          <span style={statLabel}>Trend Velocity</span>
          <CountUp to={92} duration={1100} format={(v) => `${v}`} style={{ fontFamily: F.display, fontSize: 48, fontWeight: 800, color: LT.gold, lineHeight: 1 }} />
          <MarketSplitBars color={LT.gold} />
        </div>
      </div>
    </div>
  );
}

function BriefPanel() {
  return (
    <div style={panel}>
      <div style={{ background: LT.bg, border: `1px solid ${LT.border}`, borderRadius: 12, padding: 16 }}>
        <span style={statLabel}>AI Brief</span>
        <p style={{ color: LT.text, fontFamily: F.body, fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
          <Typewriter text="Angle: pain-relief posture belt for desk workers 28-45. Price ceiling AUD $49. AU demand leads at 48%; US peaks Wed-Fri. Lead creative: before/after reel." speed={14} />
        </p>
        <SparklineDraw values={[30,42,45,52,60,68,74,78,86,92]} width={320} height={46} color={LT.gold} />
      </div>
    </div>
  );
}

function AdsPanel() {
  const formats = ['Feed', 'Reel', 'Story', 'Carousel'];
  return (
    <div style={panel}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {formats.map((f, i) => (
          <div key={f} style={{
            padding: 14,
            background: LT.bgElevated,
            border: `1px solid ${LT.border}`,
            borderRadius: 10,
            animation: `mjFadeIn 600ms ease-out ${i * 120}ms backwards`,
          }}>
            <span style={statLabel}>{f}</span>
            <div style={{ color: LT.text, fontFamily: F.body, fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
              "Slouching all day? Fix it before 5pm."
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes mjFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// ── styles ──────────────────────────────────────────────────────────────────
const panel: React.CSSProperties = {
  padding: 20,
  height: '100%',
  display: 'grid',
  alignContent: 'start',
};

const chapterNumber: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 11,
  color: LT.gold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const chapterTitle: React.CSSProperties = {
  fontFamily: F.display,
  fontSize: 40,
  fontWeight: 700,
  color: LT.text,
  margin: 0,
  lineHeight: 1.1,
};

const chapterBody: React.CSSProperties = {
  fontFamily: F.body,
  fontSize: 17,
  lineHeight: 1.6,
  color: LT.textMute,
  margin: 0,
  maxWidth: 520,
};

const staticCard: React.CSSProperties = {
  padding: 20,
  background: LT.bgCard,
  border: `1px solid ${LT.border}`,
  borderRadius: R.card,
  display: 'grid',
  gap: 8,
};

const statLabel: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 10,
  color: LT.textMute,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const chip: React.CSSProperties = {
  padding: '4px 10px',
  background: LT.bg,
  border: `1px solid ${LT.border}`,
  borderRadius: 100,
  color: LT.textMute,
  fontFamily: F.mono,
  fontSize: 11,
};

export default ChapterMorph;
