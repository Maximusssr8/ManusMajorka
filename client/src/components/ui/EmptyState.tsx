/**
 * EmptyState — Shopify-inspired centred placeholder for empty list pages.
 *
 * Used on: Saved products tab, Alerts (no alerts), Revenue (no entries),
 * Store Builder (no stores), Search results (no matches).
 */

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export function EmptyState({ emoji, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '80px 24px',
      gap: 16,
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{emoji}</div>
      <h3 style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-primary, #f0f4ff)',
        margin: 0,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        color: 'var(--text-muted, rgba(255,255,255,0.35))',
        maxWidth: 380,
        lineHeight: 1.6,
        margin: 0,
      }}>
        {description}
      </p>
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {action && (
            <button
              onClick={action.onClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 40,
                padding: '0 18px',
                background: 'var(--accent, #3B82F6)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-lg, 12px)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-accent, 0 4px 20px rgba(59,130,246,0.25))',
                transition: 'all 150ms ease',
              }}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 40,
                padding: '0 18px',
                background: 'var(--bg-card, #1a2035)',
                color: 'var(--text-secondary, rgba(255,255,255,0.65))',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid var(--border-normal, rgba(255,255,255,0.10))',
                borderRadius: 'var(--radius-lg, 12px)',
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
