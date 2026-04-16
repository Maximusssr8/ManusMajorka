// Majorka landing — locked design tokens (v2: cobalt blue, Codex/Linear grade).
// Enforced palette: only these colours may appear on the landing page.
// Single source of truth — all landing components must import from here.
export const LT = {
  // Backgrounds
  bg: '#04060f',
  bgElevated: '#0d1117',
  bgCard: '#0d1117',
  border: '#161b22',
  // Accent (cobalt) — CTA, active states, underline, badges, checkmarks only.
  cobalt: '#4f8ef7',
  cobaltTint: 'rgba(79,142,247,0.15)',
  cobaltSubtle: 'rgba(79,142,247,0.08)',
  cobaltBorder: 'rgba(79,142,247,0.4)',
  cobaltGlow: 'rgba(79,142,247,0.04)',
  // Text
  text: '#ffffff',
  textMute: '#8b949e',
  textDim: '#8b949e',
  // States (non-accent)
  success: '#22c55e',
  error: '#ef4444',
  crossGrey: '#3f3f46',
  // Backward-compat aliases (consumed by Guarantee.tsx and other non-landing pages
  // that import from landingTokens). Maps to cobalt palette.
  gold: '#4f8ef7',
  goldTint: 'rgba(79,142,247,0.15)',
  goldGlow: 'rgba(79,142,247,0.30)',
  blue: '#4f8ef7',
} as const;

export const F = {
  display: "'Syne', system-ui, -apple-system, sans-serif",
  body: "'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
} as const;

// 8px base scale
export const S = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  xxxl: 96,
  huge: 128,
} as const;

export const R = {
  card: 12,
  button: 12,
  badge: 100,
  image: 12,
  input: 10,
} as const;

export const SHADOW = {
  cardHover: '0 0 30px rgba(79,142,247,0.1)',
  button: '0 0 20px rgba(79,142,247,0.25)',
  overlay: '0 25px 50px rgba(0,0,0,0.5)',
  hero: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,142,247,0.06)',
} as const;

export const MAX = 1200;
