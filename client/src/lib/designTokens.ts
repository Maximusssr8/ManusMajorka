/**
 * Majorka Design Tokens — Shopify-analytics inspired,
 * Linear/Vercel surface palette, Syne + Inter type.
 */

export const t = {
  // Backgrounds
  bg: '#0f1117',
  surface: '#161b27',
  raised: '#1a2035',
  overlay: '#20243380',

  // Text
  text: '#f9fafb',
  body: '#9ca3af',
  muted: '#6b7280',

  // Accent — electric indigo
  accent: '#6366f1',
  accentHover: '#818cf8',
  accentSubtle: 'rgba(99,102,241,0.12)',

  // Cyan highlight
  cyan: '#22d3ee',
  cyanSubtle: 'rgba(34,211,238,0.1)',

  // Success
  green: '#10b981',
  greenSubtle: 'rgba(16,185,129,0.1)',

  // Borders
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.12)',
  lineFocus: '#6366f1',

  // Typography — Syne for headings/big numbers, Inter for everything else.
  fontDisplay: "'Syne', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontMono: "'Inter', sans-serif",

  // Type scale
  fH1: 40,
  fH2: 28,
  fH3: 18,
  fLead: 15,
  fBody: 13,
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
  rLg: 14,
  rXl: 24,

  // Motion
  dur: '150ms',
  ease: 'cubic-bezier(0.16,1,0.3,1)',

  // ── Compat aliases — Products.tsx legacy references ──
  fMicro: 10,
  fKpi: 40,
  s9: 48,
  s10: 64,
  rPill: 999,
  faint: '#4b5563',
  accentInk: '#ffffff',
  accentTint: 'rgba(99,102,241,0.06)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',
  greenDim: 'rgba(16,185,129,0.15)',
  fLabel: 12,
} as const;
