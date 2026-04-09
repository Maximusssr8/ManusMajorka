/**
 * Majorka Design Tokens — single source of truth.
 *
 * Rules this file enforces, derived from 2025 SaaS benchmarks
 * (Linear, Vercel, Resend, Raycast, Clerk) and our own impeccable/taste
 * design skills:
 *
 *   - Exactly 3 surface levels. Never more.
 *   - One accent. Violet #7c6aff. No gradients on text, no neon glows.
 *   - One neutral ramp. No competing "dark mode" greys.
 *   - 8-point spacing rhythm.
 *   - 3 radii only: 6 (inputs/pills), 10 (cards), 14 (hero surfaces).
 *   - Type scale with real rhythm: 11 / 13 / 15 / 20 / 28 / 36.
 *
 * Import via: `import { t } from '@/lib/designTokens'`
 */

export const t = {
  // ── SURFACES (3 LEVELS MAX) ─────────────────────────────
  // Level 0: the page itself. Near-black, slight violet tint for cohesion.
  bg: '#0a0a0b',
  // Level 1: cards, panels, the sidebar. Sits on bg.
  surface: '#121214',
  // Level 2: hover, menus, raised items. Sits on surface.
  raised: '#18181b',

  // ── BORDERS ─────────────────────────────────────────────
  // One hairline + one hover. That's it.
  line: 'rgba(255,255,255,0.06)',
  lineStrong: 'rgba(255,255,255,0.10)',
  lineFocus: 'rgba(124,106,255,0.45)',

  // ── TEXT ────────────────────────────────────────────────
  // 4 steps — primary for headings, body for everything else,
  // muted for labels, faint for captions.
  text: '#f4f4f5',
  body: '#c8c8cf',
  muted: '#8a8a94',
  faint: '#5a5a63',

  // ── ACCENT (ONE ONLY) ───────────────────────────────────
  accent: '#7c6aff',
  accentHover: '#8f80ff',
  accentDim: 'rgba(124,106,255,0.12)',
  accentTint: 'rgba(124,106,255,0.06)',

  // ── STATUS COLORS (for data only — never decoration) ────
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.12)',

  // ── RADII (3 ONLY) ──────────────────────────────────────
  rSm: 6,
  rMd: 10,
  rLg: 14,
  rPill: 999,

  // ── SPACING (8-POINT) ───────────────────────────────────
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 48,
  s9: 64,

  // ── TYPE SCALE ──────────────────────────────────────────
  // Real rhythm: caption, label, body, lead, h3, h2, h1.
  fCaption: 11,
  fLabel: 12,
  fBody: 13,
  fLead: 15,
  fH3: 18,
  fH2: 22,
  fH1: 32,

  // ── FONTS ───────────────────────────────────────────────
  fontDisplay: "'Bricolage Grotesque', system-ui, sans-serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",

  // ── MOTION ──────────────────────────────────────────────
  // Exponential ease-out. Never bounce, never linear.
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  dur: '180ms',
  durSlow: '320ms',
} as const;

/**
 * Section label — the small uppercase hint above a block.
 * Use via: `<div style={labelStyle}>OVERVIEW</div>`
 */
export const labelStyle: React.CSSProperties = {
  fontFamily: t.fontBody,
  fontSize: t.fCaption,
  fontWeight: 600,
  color: t.muted,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

/**
 * Card — the workhorse container. Flat, hairline border, one radius.
 * No drop shadows, no left-border accents, no gradient fills.
 */
export const cardStyle: React.CSSProperties = {
  background: t.surface,
  border: `1px solid ${t.line}`,
  borderRadius: t.rMd,
};

/**
 * Primary button — solid accent, no glow, scale feedback on press.
 */
export const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: t.s2,
  padding: `${t.s3}px ${t.s5}px`,
  background: t.accent,
  color: '#ffffff',
  border: 'none',
  borderRadius: t.rSm,
  fontFamily: t.fontBody,
  fontSize: t.fBody,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: `transform ${t.dur} ${t.ease}, background ${t.dur} ${t.ease}`,
};

/**
 * Secondary button — transparent with hairline border.
 */
export const btnSecondaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: t.s2,
  padding: `${t.s3}px ${t.s5}px`,
  background: 'transparent',
  color: t.body,
  border: `1px solid ${t.lineStrong}`,
  borderRadius: t.rSm,
  fontFamily: t.fontBody,
  fontSize: t.fBody,
  fontWeight: 500,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: `all ${t.dur} ${t.ease}`,
};

/** Monospace number display — for KPIs, prices, counts. */
export const numStyle: React.CSSProperties = {
  fontFamily: t.fontDisplay,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
  color: t.text,
};
