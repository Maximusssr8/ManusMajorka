/**
 * EmptyState (ui/) — Lucide-icon variant used by tool pages.
 * Matches the v2 gold design system. For general pages, prefer the
 * canonical component exported from `@/components/EmptyState`.
 */
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm flex flex-col items-center gap-4">
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
          <Icon size={48} strokeWidth={1.5} style={{ color: '#d4af37' }} />
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
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
        {ctaLabel && onCta && (
          <button type="button" onClick={onCta} className="mj-btn-gold">
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
