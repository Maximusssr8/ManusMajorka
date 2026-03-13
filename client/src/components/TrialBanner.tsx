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
        background: 'linear-gradient(90deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.04) 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(240,237,232,0.7)' }}>
        <Zap size={13} style={{ color: '#d4af37' }} />
        <span>
          You&apos;re on the <strong style={{ color: '#d4af37' }}>Free plan</strong>
          {' · '}5 AI tools/day
          {' · '}Upgrade for unlimited access
        </span>
      </div>
      <Link
        href="/pricing"
        onClick={() => trackUpgradeClicked({ source: 'trial_banner', plan: 'free' })}
        className="text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0 transition-all"
        style={{
          background: 'linear-gradient(135deg, #d4af37, #f0c040)',
          color: '#080a0e',
          textDecoration: 'none',
          fontFamily: 'Syne, sans-serif',
        }}
      >
        Upgrade →
      </Link>
    </div>
  );
}
