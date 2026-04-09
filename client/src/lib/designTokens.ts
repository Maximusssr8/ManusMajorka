/**
 * Majorka Design Tokens — futuristic light-dark hybrid.
 * Inspired by Linear, Vercel, Raycast.
 */

export const t = {
  // Backgrounds — dark but not black
  bg: '#0d0f14',
  surface: '#13151c',
  raised: '#1a1d27',
  overlay: '#20243380',

  // Text
  text: '#f0f2ff',
  body: '#9499b0',
  muted: '#555a72',

  // Accent — electric blue/violet, NOT gold
  accent: '#6366f1',
  accentHover: '#818cf8',
  accentSubtle: 'rgba(99,102,241,0.12)',

  // Cyan highlight for data/numbers
  cyan: '#22d3ee',
  cyanSubtle: 'rgba(34,211,238,0.1)',

  // Success
  green: '#10b981',
  greenSubtle: 'rgba(16,185,129,0.1)',

  // Borders
  line: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.12)',
  lineFocus: '#6366f1',

  // Typography
  fontDisplay: "'Syne', sans-serif",
  fontBody: "'DM Sans', sans-serif",
  fontMono: "'JetBrains Mono', monospace",

  // Type scale
  fH1: 48,
  fH2: 28,
  fH3: 18,
  fLead: 15,
  fBody: 14,
  fCaption: 11,

  // Spacing (8pt grid)
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 40,

  // Radius
  rSm: 8,
  rMd: 12,
  rLg: 16,
  rXl: 24,

  // Motion
  dur: '150ms',
  ease: 'cubic-bezier(0.16,1,0.3,1)',

  // ── Compat aliases (used by Products.tsx and other legacy pages) ──
  // These let us ship the new Home + Nav without a full rewrite of
  // every page. They map cleanly onto the new palette.
  fMicro: 10,
  fKpi: 40,
  s9: 48,
  s10: 64,
  rPill: 999,
  faint: '#3a3f52',
  accentInk: '#ffffff',
  accentTint: 'rgba(99,102,241,0.06)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',
  greenDim: 'rgba(16,185,129,0.15)',
  fLabel: 12,
  rLgCompat: 14,
} as const;
