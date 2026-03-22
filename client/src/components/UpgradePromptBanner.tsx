/**
 * UpgradePromptBanner — Thin banner shown below UsageCounter at 5+ searches.
 * Less aggressive than AlmostWonModal. Dismissible per session.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { getUsageCount, DAILY_LIMIT } from './UsageCounter';

const SESSION_KEY = 'majorka_upgrade_banner_dismissed';

export default function UpgradePromptBanner() {
  const count = getUsageCount();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );
  const [, setLocation] = useLocation();

  if (dismissed || count < 5 || count >= DAILY_LIMIT) return null;

  const remaining = DAILY_LIMIT - count;

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 13, color: 'rgba(240,237,232,0.75)', lineHeight: 1.5, flex: 1, minWidth: 200 }}>
        ⚡ <strong style={{ color: '#6366F1' }}>Only {remaining} searches left today.</strong>{' '}
        Pro users found <strong style={{ color: '#f5f5f5' }}>47 winning products</strong> today.
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => setLocation('/pricing')}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Go Pro →
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'rgba(240,237,232,0.3)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
