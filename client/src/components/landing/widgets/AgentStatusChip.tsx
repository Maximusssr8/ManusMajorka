import { useEffect, useState } from 'react';

export type AgentStatusAction = 'Edited' | 'Read' | 'Thought' | 'Explored' | 'Wrote';
export type AgentStatusState = 'ok' | 'fail' | 'pending';

export interface AgentStatusChipProps {
  action: AgentStatusAction;
  /** Filename or description. */
  text: string;
  state?: AgentStatusState;
  /** Appearance delay for staggered group entrance (ms). */
  delayMs?: number;
  fullWidth?: boolean;
}

const ACTION_COLOUR: Record<AgentStatusAction, string> = {
  Edited:   'rgb(251,191,36)', // amber
  Read:     'rgba(255,255,255,0.5)',
  Thought:  'rgba(255,255,255,0.5)',
  Explored: 'rgba(255,255,255,0.5)',
  Wrote:    'rgb(251,191,36)',
};

const STATE_GLYPH: Record<AgentStatusState, { char: string; color: string } | null> = {
  ok:      { char: '✓', color: 'rgb(34,197,94)' },
  fail:    { char: '×', color: 'rgb(239,68,68)' },
  pending: null,
};

export function AgentStatusChip({
  action,
  text,
  state = 'pending',
  delayMs = 0,
  fullWidth = true,
}: AgentStatusChipProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  const glyph = STATE_GLYPH[state];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'rgb(24,24,24)',
      borderRadius: 6,
      padding: '4px 10px',
      height: 28,
      fontSize: 13,
      width: fullWidth ? '100%' : undefined,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(4px)',
      transition: 'opacity 250ms ease, transform 250ms ease',
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box',
    }}>
      <span style={{
        color: ACTION_COLOUR[action],
        fontSize: 13,
        fontWeight: 500,
        flexShrink: 0,
      }}>{action}</span>
      <span style={{
        color: 'white',
        fontSize: 13,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: "'JetBrains Mono', monospace",
      }}>{text}</span>
      {glyph && (
        <span style={{
          color: glyph.color,
          fontSize: 13,
          marginLeft: 'auto',
          fontWeight: 700,
          flexShrink: 0,
        }}>{glyph.char}</span>
      )}
    </div>
  );
}

/**
 * Convenience wrapper that renders a list of chips with a 300ms stagger.
 */
export function AgentStatusStream({ items }: { items: Omit<AgentStatusChipProps, 'delayMs' | 'fullWidth'>[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {items.map((item, i) => (
        <AgentStatusChip key={i} {...item} delayMs={i * 300} fullWidth />
      ))}
    </div>
  );
}
