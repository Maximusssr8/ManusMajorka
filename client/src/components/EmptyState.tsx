/**
 * EmptyState — reusable illustrated empty state for tools.
 * Dark/gold style matching Majorka design system.
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
      <div className="text-center max-w-xs">
        {/* Illustrated icon container */}
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center relative"
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.12)',
            boxShadow: '0 0 40px rgba(99,102,241,0.05)',
          }}
        >
          {/* Decorative ring */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.08), transparent 60%)',
            }}
          />
          <Icon size={32} style={{ color: '#6366F1', opacity: 0.8 }} />
        </div>
        <h3
          className="text-base font-extrabold mb-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#CBD5E1' }}
        >
          {title}
        </h3>
        <p className="text-xs leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>
          {description}
        </p>
        {ctaLabel && onCta && (
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#FAFAFA',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
            }}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
