import { ReactNode } from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'No products found',
  description = 'Try adjusting your filters or check back soon — the product database refreshes every 4 hours.',
  icon,
}: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '64px 24px',
      background: '#111114',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6366F1',
        marginBottom: 16,
      }}>
        {icon ?? <Package size={24} />}
      </div>
      <h3 style={{
        fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 18,
        color: '#ededed',
        margin: '0 0 8px',
        letterSpacing: '-0.015em',
      }}>{title}</h3>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 14,
        color: '#71717a',
        margin: 0,
        maxWidth: 360,
        lineHeight: 1.55,
      }}>{description}</p>
    </div>
  );
}
