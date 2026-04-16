import type { ReactElement } from 'react';
import { Link } from 'wouter';
import { Lock } from 'lucide-react';
import type { LockedFeature, LockedTier } from './LockedTeaser';

interface UpgradeCTAProps {
  feature: LockedFeature;
  tier?: LockedTier;
  reason: string;
  compact?: boolean;
}

/**
 * UpgradeCTA \u2014 short inline CTA for locked actions where a full blur doesn't fit.
 * Shows a lock icon + 1-sentence reason + "Unlock \u2192" pill link.
 */
export function UpgradeCTA({ feature, tier = 'scale', reason, compact = false }: UpgradeCTAProps): ReactElement {
  const href = `/pricing?highlight=${encodeURIComponent(feature)}`;
  const tierLabel = tier === 'builder' ? 'Builder' : 'Scale';

  return (
    <div
      role="note"
      aria-label={`${tierLabel} feature locked`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: compact ? '6px 10px' : '10px 14px',
        background: 'rgba(79,142,247,0.06)',
        border: '1px solid rgba(79,142,247,0.25)',
        borderRadius: 999,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        maxWidth: '100%',
      }}
    >
      <Lock size={compact ? 12 : 14} strokeWidth={2.5} style={{ color: '#4f8ef7', flexShrink: 0 }} />
      <span
        style={{
          fontSize: compact ? 12 : 13,
          color: '#e5e5e5',
          lineHeight: 1.4,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {reason}
      </span>
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 28,
          padding: '0 10px',
          background: 'linear-gradient(135deg, #4f8ef7 0%, #f4d77a 50%, #4f8ef7 100%)',
          color: '#0d1117',
          fontWeight: 700,
          fontSize: 12,
          borderRadius: 999,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        Unlock &rarr;
      </Link>
    </div>
  );
}
