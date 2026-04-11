export const tokens = {
  bg: {
    base: 'var(--color-bg)',
    surface: 'var(--color-bg-surface)',
    elevated: 'var(--color-bg-elevated)',
    card: 'var(--bg-card)',
    panel: 'var(--color-bg-panel)',
  },
  border: {
    default: 'var(--color-border)',
    strong: 'var(--color-border-strong)',
    faint: 'var(--color-border-faint)',
    hover: 'var(--color-border-hover)',
  },
  text: {
    primary: 'var(--color-text)',
    muted: 'var(--color-text-muted)',
    dim: 'var(--color-text-dim)',
    faint: 'var(--color-text-faint)',
  },
  accent: {
    primary: 'var(--color-accent)',
    hover: 'var(--color-accent-hover)',
    dim: 'var(--color-accent-dim)',
  },
  status: {
    up: 'var(--color-green)',
    down: 'var(--color-red)',
    warning: 'var(--color-amber)',
  },
  badge: {
    rising:     { bg: 'var(--positive-dim)',  text: 'var(--positive)', border: 'rgba(34,197,94,0.2)' },
    peaked:     { bg: 'var(--warning-dim)',   text: 'var(--warning)',  border: 'rgba(245,158,11,0.2)' },
    declining:  { bg: 'var(--danger-dim)',    text: 'var(--danger)',   border: 'rgba(239,68,68,0.2)' },
    exploding:  { bg: 'var(--danger-dim)',    text: 'var(--danger)',   border: 'rgba(239,68,68,0.2)' },
    hot:        { bg: 'var(--danger-dim)',    text: 'var(--danger)',   border: 'rgba(239,68,68,0.2)' },
    new:        { bg: 'var(--accent-subtle)', text: 'var(--accent)',   border: 'var(--color-border)' },
    bestseller: { bg: 'rgba(212,175,55,0.12)', text: '#d4af37',        border: 'rgba(212,175,55,0.3)' },
  },
} as const;
