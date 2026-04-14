/**
 * Majorka Design Tokens — Nohemi + Inter, indigo accent, no hardcoded hex in UI.
 * Export both `C` and `t` (alias) so existing call sites keep working.
 */

export const C = {
  // Backgrounds — 3-layer surface system for visible depth
  bg:           '#0d0f14',
  pageBg:       '#0d0f14',
  contentBg:    '#111827',
  cardBg:       '#1a2035',
  surface:      '#13151c',
  raised:       '#1a1d27',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  borderFocus:  '#6366f1',

  // Text
  text:         '#f0f4ff',
  body:         '#9499b0',
  muted:        '#555a72',

  // Accent — indigo
  accent:       '#6366f1',
  accentHover:  '#818cf8',
  accentSubtle: 'rgba(99,102,241,0.12)',
  accentInk:    '#ffffff',
  white:        '#ffffff',

  // Data accents
  cyan:         '#22d3ee',
  cyanSubtle:   'rgba(34,211,238,0.1)',
  green:        '#10b981',
  greenSubtle:  'rgba(16,185,129,0.1)',
  amber:        '#f59e0b',
  amberSubtle:  'rgba(245,158,11,0.12)',
  orange:       '#f97316',
  orangeSubtle: 'rgba(249,115,22,0.12)',
  red:          '#ef4444',
  redSubtle:    'rgba(239,68,68,0.12)',

  // Typography
  fontDisplay:  "'Nohemi', 'Inter', sans-serif",
  fontBody:     "'Inter', sans-serif",

  // Type scale
  fH1: 52, fH2: 32, fH3: 20, fH4: 16,
  fLead: 15, fBody: 13, fSm: 12, fXs: 11, fXxs: 10,

  // Spacing (8pt)
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 48, s10: 64,

  // Radius
  rXs: 4, rSm: 8, rMd: 12, rLg: 16, rXl: 24,

  // Motion
  dur:  '150ms',
  ease: 'cubic-bezier(0.16,1,0.3,1)',
} as const;

/* ── Elevation ramp — subtle, premium. Use via style={{ boxShadow: elevation.e2 }} ── */
export const elevation = {
  e1: '0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
  e2: '0 2px 8px -2px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
  e3: '0 12px 32px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
  e4: '0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
  glow:      '0 0 40px -10px rgba(99,102,241,0.6)',
  glowSoft:  '0 0 60px -20px rgba(99,102,241,0.35)',
  glowHover: '0 0 60px -10px rgba(99,102,241,0.75), 0 8px 32px -8px rgba(0,0,0,0.6)',
  ringAccent:'0 0 0 1px rgba(99,102,241,0.35), 0 0 24px -8px rgba(99,102,241,0.5)',
} as const;

/* ── Gradient presets — backgrounds, text fills, mesh ── */
export const gradients = {
  accentGlow:   'radial-gradient(ellipse at center, rgba(99,102,241,0.35) 0%, transparent 70%)',
  surfaceFade:  'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
  textPrimary:  'linear-gradient(135deg, #f0f4ff 0%, #a5b4fc 100%)',
  textAccent:   'linear-gradient(135deg, #f0f4ff 0%, #818cf8 40%, #6366f1 100%)',
  meshBg:       'conic-gradient(from 220deg at 50% 50%, rgba(99,102,241,0.12), rgba(34,211,238,0.06), rgba(139,92,246,0.1), rgba(99,102,241,0.12))',
  ctaShine:     'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)',
  border:       'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08))',
} as const;

/* ── Motion presets — use with CSS transition/duration utilities ── */
export const motion = {
  dur: {
    fast:   '120ms',
    base:   '180ms',
    slow:   '280ms',
    slower: '420ms',
  },
  ease: {
    out:    'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut:  'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

/* ── Legacy compat aliases for existing call sites ──
   Keep Products.tsx and any other page building without a touch. */
export const t = {
  ...C,

  // Legacy keys that existing files reference
  line:         C.border,
  lineStrong:   C.borderStrong,
  lineFocus:    C.borderFocus,

  fontMono:     C.fontBody,

  // Old type scale keys
  fCaption:     C.fXs,
  fMicro:       C.fXxs,
  fKpi:         40,
  fLabel:       C.fSm,

  // Old accent vars
  accentInk:    '#ffffff',
  accentTint:   'rgba(99,102,241,0.06)',
  faint:        C.muted,

  // Old status dims
  greenDim:     C.greenSubtle,
  amberDim:     C.amberSubtle,
  redDim:       C.redSubtle,

  rPill:        999,
} as const;

export default C;
