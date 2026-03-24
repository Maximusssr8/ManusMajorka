/**
 * TrialBanner — shown on dashboard when user has no active subscription.
 * Displays free plan limits and prompts upgrade.
 */

import { Zap } from 'lucide-react';
import { Link } from 'wouter';
import { trackUpgradeClicked } from '@/lib/analytics';

interface TrialBannerProps {
  className?: string;
}

export default function TrialBanner({ className }: TrialBannerProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 ${className ?? ''}`}
      style={{
        background: 'linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.04) 100%)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: '#374151' }}>
        <Zap size={13} style={{ color: '#6366F1' }} />
        <span>
          You&apos;re on the <strong style={{ color: '#6366F1' }}>Free plan</strong>
          {' · '}5 AI tools/day
          {' · '}Upgrade for unlimited access
        </span>
      </div>
      <Link
        href="/pricing"
        onClick={() => trackUpgradeClicked({ source: 'trial_banner', plan: 'free' })}
        className="text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0 transition-all"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #f0c040)',
          color: '#FAFAFA',
          textDecoration: 'none',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}
      >
        Upgrade →
      </Link>
    </div>
  );
}
