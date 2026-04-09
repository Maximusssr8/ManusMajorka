/**
 * Majorka Design Tokens — Codex editorial black aesthetic.
 *
 * Reference: openai.com/codex
 *
 * Rules this file enforces:
 *   - Pure black background. #000000. Not dark grey.
 *   - Typography is the whole design. White text, generous scale.
 *   - Zero decorative chrome. No gradients, no glows, no sparklines.
 *   - One accent — gold — used at most once per screen, on the
 *     primary CTA only. Everything else is white or grey.
 *   - Surfaces are either flush (no card at all) or separated by
 *     a single 1px hairline. Never a filled card on a filled page.
 *   - Radii never exceed 6px.
 *   - 48px+ gaps between sections. Generous rhythm.
 */

export const t = {
  // ── SURFACES ────────────────────────────────────────────
  // Pure black. One level. That's it.
  bg: '#000000',
  // Raised is used sparingly — only for popover menus, hover rows,
  // drawers. Not for cards.
  raised: 'rgba(255,255,255,0.04)',

  // ── BORDERS ─────────────────────────────────────────────
  // One hairline. That's the whole border system.
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.16)',
  lineFocus: 'rgba(255,255,255,0.35)',

  // ── TEXT ────────────────────────────────────────────────
  // Four steps, all white with descending opacity.
  text: '#ffffff',
  body: 'rgba(255,255,255,0.72)',
  muted: 'rgba(255,255,255,0.48)',
  faint: 'rgba(255,255,255,0.28)',

  // ── ACCENT (ONE ONLY — PRIMARY CTA) ─────────────────────
  // Gold. Used at most once per screen.
  accent: '#d4af37',
  accentHover: '#e6c14a',
  accentInk: '#000000',

  // ── STATUS COLORS (for data only) ───────────────────────
  // Less saturated. No glows. Used in score pills and deltas only.
  green: '#10b981',
  greenDim: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',

  // ── RADII (NEVER > 6) ───────────────────────────────────
  rSm: 4,
  rMd: 6,
  rPill: 999,

  // ── SPACING — generous. Section gaps live at s8+ ────────
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 48,
  s9: 64,
  s10: 96,

  // ── TYPE SCALE ──────────────────────────────────────────
  // Editorial rhythm. H1 is massive; everything else falls
  // back to quiet, functional sizes.
  fMicro: 10,
  fCaption: 12,
  fBody: 13,
  fLead: 15,
  fH3: 18,
  fH2: 28,
  fH1: 52,
  fKpi: 44,

  // ── FONTS ───────────────────────────────────────────────
  fontDisplay: "'Bricolage Grotesque', system-ui, sans-serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",

  // ── MOTION ──────────────────────────────────────────────
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  dur: '160ms',
  durSlow: '280ms',
} as const;

/**
 * Section label — 10px uppercase tracked grey.
 * The workhorse eyebrow above every block.
 */
export const labelStyle: React.CSSProperties = {
  fontFamily: t.fontBody,
  fontSize: t.fMicro,
  fontWeight: 500,
  color: t.muted,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

/**
 * Primary CTA — the only thing on the page that uses the accent.
 * Gold on black, thin, no glow, no border radius greater than 4.
 */
export const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: t.s2,
  padding: `${t.s3}px ${t.s5}px`,
  background: t.accent,
  color: t.accentInk,
  border: 'none',
  borderRadius: t.rSm,
  fontFamily: t.fontBody,
  fontSize: t.fBody,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: `background ${t.dur} ${t.ease}`,
};

/**
 * Secondary — white text, hairline border, transparent fill.
 */
export const btnSecondaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: t.s2,
  padding: `${t.s3}px ${t.s5}px`,
  background: 'transparent',
  color: t.text,
  border: `1px solid ${t.line}`,
  borderRadius: t.rSm,
  fontFamily: t.fontBody,
  fontSize: t.fBody,
  fontWeight: 500,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: `border-color ${t.dur} ${t.ease}`,
};

/**
 * Numeric display — editorial serif-ish weighting via Bricolage.
 * Tabular figures so columns align.
 */
export const numStyle: React.CSSProperties = {
  fontFamily: t.fontDisplay,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
  color: t.text,
};

/**
 * Input — borderless flat field with a single bottom hairline.
 * No rounded >6px, no filled background unless focused.
 */
export const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${t.line}`,
  borderRadius: t.rMd,
  padding: `${t.s3}px ${t.s4}px`,
  color: t.text,
  fontFamily: t.fontBody,
  fontSize: t.fBody,
  outline: 'none',
  boxSizing: 'border-box',
  transition: `border-color ${t.dur} ${t.ease}`,
};
