/**
 * Canonical EmptyState — Syne heading, muted subtext, Lucide icon at 48px,
 * optional gold CTA button. Use on every list/search/empty surface.
 *
 * NOTE: keeps its legacy emoji-based API as a fallback so older call sites
 *       ({ emoji, title, description, action }) keep compiling. New call
 *       sites should pass `icon` + `action={{ label, onClick }}` or a
 *       ReactNode for custom actions.
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ActionShape {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  action?: ActionShape | ReactNode;
  secondaryAction?: ActionShape;
}

function isActionShape(a: unknown): a is ActionShape {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof (a as ActionShape).label === 'string' &&
    typeof (a as ActionShape).onClick === 'function'
  );
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="mj-empty">
      <div
        className="flex items-center justify-center rounded-2xl relative"
        style={{
          width: 72,
          height: 72,
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.14)',
          boxShadow: '0 0 40px -10px rgba(212,175,55,0.18)',
        }}
      >
        {Icon ? (
          <Icon size={48} strokeWidth={1.5} style={{ color: '#d4af37' }} />
        ) : emoji ? (
          <span style={{ fontSize: 36 }}>{emoji}</span>
        ) : null}
      </div>

      <h3
        style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '-0.01em',
          color: '#e5e5e5',
          margin: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 14,
          color: '#737373',
          maxWidth: 400,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </p>

      {action !== undefined && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {isActionShape(action) ? (
            <button type="button" onClick={action.onClick} className="mj-btn-gold">
              {action.label}
            </button>
          ) : (
            action
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 40,
                padding: '0 18px',
                background: '#141414',
                color: '#a3a3a3',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #262626',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
