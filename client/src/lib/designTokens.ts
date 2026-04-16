/**
 * Majorka Design Tokens — cobalt/blue, Syne + DM Sans + JetBrains Mono.
 *
 * Authoritative palette (v2 — Apr 2026):
 *   bg     #04060f   card #0d1117   border #161b22
 *   cobalt #4f8ef7   (primary accent / brand)
 *   blue   #3B82F6   (CTA)
 *   text   #e5e5e5   muted #737373   success #10b981
 *
 * Headings: Syne.  Body: DM Sans.  Numbers/stats: JetBrains Mono.
 *
 * Exports both `C` and `t` (alias) so existing call sites keep working.
 */

export const C = {
  // Backgrounds — flat, editorial, almost-black
  bg:           '#04060f',
  pageBg:       '#04060f',
  contentBg:    '#0c0c0c',
  cardBg:       '#0d1117',
  surface:      '#0d1117',
  raised:       '#141414',

  // Borders
  border:       '#161b22',
  borderStrong: '#262626',
  borderFocus:  '#4f8ef7',

  // Text
  text:         '#e5e5e5',
  body:         '#a3a3a3',
  muted:        '#737373',

  // Accent — cobalt (brand)
  accent:       '#4f8ef7',
  accentHover:  '#6ba3ff',
  accentSubtle: 'rgba(79,142,247,0.10)',
  accentInk:    '#04060f',
  white:        '#ffffff',

  // CTA — blue (actions)
  cta:          '#3B82F6',
  ctaHover:     '#60a5fa',
  ctaSubtle:    'rgba(59,130,246,0.12)',

  // Data accents (kept for charts/status)
  cyan:         '#22d3ee',
  cyanSubtle:   'rgba(34,211,238,0.10)',
  green:        '#10b981',
  greenSubtle:  'rgba(16,185,129,0.10)',
  amber:        '#f59e0b',
  amberSubtle:  'rgba(245,158,11,0.12)',
  orange:       '#f97316',
  orangeSubtle: 'rgba(249,115,22,0.12)',
  red:          '#ef4444',
  redSubtle:    'rgba(239,68,68,0.12)',

  // Typography
  fontDisplay:  "'Syne', system-ui, sans-serif",
  fontBody:     "'DM Sans', system-ui, sans-serif",
  fontMono:     "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",

  // Type scale
  fH1: 52, fH2: 32, fH3: 20, fH4: 16,
  fLead: 15, fBody: 14, fSm: 12, fXs: 11, fXxs: 10,

  // Spacing (8pt)
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 48, s10: 64,

  // Radius
  rXs: 4, rSm: 8, rMd: 12, rLg: 16, rXl: 24,

  // Motion
  dur:  '150ms',
  ease: 'cubic-bezier(0.16,1,0.3,1)',
} as const;

/* ── Elevation ramp + signature cobalt glows ── */
export const elevation = {
  e1: '0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)',
  e2: '0 2px 8px -2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
  e3: '0 12px 32px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)',
  e4: '0 30px 80px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)',

  // Cobalt glows — the signature
  glow:      '0 0 0 1px rgba(79,142,247,0.12), 0 8px 40px -10px rgba(79,142,247,0.15)',
  glowSoft:  '0 0 40px -16px rgba(79,142,247,0.25)',
  glowHover: '0 0 0 1px rgba(79,142,247,0.18), 0 14px 44px -10px rgba(79,142,247,0.28)',
  ringAccent:'0 0 0 1px rgba(79,142,247,0.35), 0 0 24px -6px rgba(79,142,247,0.45)',

  // Blue CTA glow
  glowBlue:      '0 0 0 1px rgba(59,130,246,0.12), 0 8px 32px -8px rgba(59,130,246,0.35)',
  glowBlueHover: '0 0 0 1px rgba(59,130,246,0.25), 0 12px 40px -8px rgba(59,130,246,0.55)',
} as const;

/* ── Gradient presets — sparingly used ── */
export const gradients = {
  accentGlow:   'radial-gradient(ellipse at center, rgba(79,142,247,0.22) 0%, transparent 70%)',
  surfaceFade:  'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
  textPrimary:  'linear-gradient(135deg, #f5f5f5 0%, #4f8ef7 100%)',
  textAccent:   'linear-gradient(135deg, #ffffff 0%, #6ba3ff 40%, #4f8ef7 100%)',
  meshBg:       'conic-gradient(from 220deg at 50% 50%, rgba(79,142,247,0.08), rgba(59,130,246,0.04), rgba(79,142,247,0.06), rgba(79,142,247,0.08))',
  ctaShine:     'linear-gradient(135deg, #3B82F6 0%, #60a5fa 50%, #3B82F6 100%)',
  cobaltShine:  'linear-gradient(135deg, #4f8ef7 0%, #6ba3ff 50%, #4f8ef7 100%)',
  border:       'linear-gradient(135deg, rgba(79,142,247,0.22), rgba(255,255,255,0.04) 50%, rgba(79,142,247,0.14))',
} as const;

/* ── Motion presets ── */
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

/* ── Legacy compat aliases — keep every existing call site building.
   The old code referenced gold-ish tokens; they now resolve to cobalt. */
export const t = {
  ...C,

  line:         C.border,
  lineStrong:   C.borderStrong,
  lineFocus:    C.borderFocus,

  fCaption:     C.fXs,
  fMicro:       C.fXxs,
  fKpi:         40,
  fLabel:       C.fSm,

  accentInk:    '#04060f',
  accentTint:   'rgba(79,142,247,0.06)',
  faint:        C.muted,

  greenDim:     C.greenSubtle,
  amberDim:     C.amberSubtle,
  redDim:       C.redSubtle,

  rPill:        999,
} as const;

export default C;
