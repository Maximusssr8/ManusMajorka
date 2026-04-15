// Majorka landing — locked design tokens.
// Enforced palette: only these colours may appear on the landing page.
export const LT = {
  // Backgrounds
  bg: '#080808',
  bgElevated: '#0d0d0d',
  bgCard: '#111111',
  border: '#1a1a1a',
  // Accents
  gold: '#d4af37',
  goldTint: 'rgba(212,175,55,0.15)',
  goldGlow: 'rgba(212,175,55,0.30)',
  blue: '#3B82F6',
  // Text
  text: '#ffffff',
  textMute: '#9CA3AF',
  textDim: '#6B7280',
  // States
  success: '#22C55E',
  error: '#EF4444',
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
  card: 16,
  button: 12,
  badge: 100,
  image: 12,
  input: 10,
} as const;

export const SHADOW = {
  cardHover: '0 0 30px rgba(212,175,55,0.1)',
  button: '0 0 20px rgba(212,175,55,0.3)',
  overlay: '0 25px 50px rgba(0,0,0,0.5)',
} as const;

export const MAX = 1200;
