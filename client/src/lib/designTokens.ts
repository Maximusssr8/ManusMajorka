/**
 * Majorka Design Tokens — Syne + DM Sans, gold accent, no hardcoded hex in UI.
 * Export both `C` and `t` (alias) so existing call sites keep working.
 */

export const C = {
  // Backgrounds — 3-layer surface system for visible depth
  bg:           '#080808',
  pageBg:       '#080808',
  contentBg:    '#0d0d0d',
  cardBg:       '#0f0f0f',
  surface:      '#0d0d0d',
  raised:       '#111111',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  borderFocus:  '#3B82F6',

  // Text
  text:         '#ededed',
  body:         '#888888',
  muted:        '#555555',

  // Accent — gold (brand), CTA blue for buttons
  accent:       '#d4af37',
  accentHover:  '#e5c158',
  accentSubtle: 'rgba(212,175,55,0.08)',
  accentInk:    '#ffffff',
  white:        '#ffffff',

  // Data accents
  cyan:         '#22d3ee',
  cyanSubtle:   'rgba(34,211,238,0.1)',
  green:        '#22c55e',
  greenSubtle:  'rgba(34,197,94,0.1)',
  amber:        '#f59e0b',
  amberSubtle:  'rgba(245,158,11,0.12)',
  orange:       '#f97316',
  orangeSubtle: 'rgba(249,115,22,0.12)',
  red:          '#ef4444',
  redSubtle:    'rgba(239,68,68,0.12)',

  // Typography
  fontDisplay:  "'Syne', 'Bricolage Grotesque', sans-serif",
  fontBody:     "'DM Sans', 'Inter', sans-serif",
  fontMono:     "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",

  // Type scale
  fH1: 52, fH2: 32, fH3: 20, fH4: 16,
  fLead: 15, fBody: 13, fSm: 12, fXs: 11, fXxs: 10,

  // Spacing (8pt)
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 48, s10: 64,

  // Radius — max 8px
  rXs: 4, rSm: 6, rMd: 8, rLg: 8, rXl: 8,

  // Motion
  dur:  '150ms',
  ease: 'cubic-bezier(0.16,1,0.3,1)',
} as const;

/* ── Legacy compat aliases for existing call sites ──
   Keep Products.tsx and any other page building without a touch. */
export const t = {
  ...C,

  // Legacy keys that existing files reference
  line:         C.border,
  lineStrong:   C.borderStrong,
  lineFocus:    C.borderFocus,

  fontMono:     C.fontMono,

  // Old type scale keys
  fCaption:     C.fXs,
  fMicro:       C.fXxs,
  fKpi:         40,
  fLabel:       C.fSm,

  // Old accent vars
  accentInk:    '#ffffff',
  accentTint:   'rgba(59,130,246,0.06)',
  faint:        C.muted,

  // Old status dims
  greenDim:     C.greenSubtle,
  amberDim:     C.amberSubtle,
  redDim:       C.redSubtle,

  rPill:        999,
} as const;

export default C;
