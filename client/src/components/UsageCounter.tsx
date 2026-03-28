/**
 * UsageCounter — Shows monthly usage from /api/usage/me.
 * Exported helpers kept for backward compatibility.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Legacy exports kept so other files don't break
export const DAILY_LIMIT = 999;
export function getUsageCount(): number { return 0; }
export function incrementUsage(): number { return 0; }
export function isAtLimit(): boolean { return false; }

interface UsageSummary {
  plan: string;
  usage: Record<string, { used: number; limit: number }>;
  month: string;
}

interface UsageCounterProps {
  feature?: string;
  count?: number;
}

export default function UsageCounter({ feature }: UsageCounterProps) {
  const { session, isPro } = useAuth();
  const [data, setData] = useState<UsageSummary | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/usage/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, [session?.access_token]);

  if (!data || !feature || !data.usage[feature]) return null;

  const { used, limit } = data.usage[feature];
  if (limit >= 999999) return null; // unlimited — don't show

  const pct = Math.min((used / limit) * 100, 100);
  const atLimit = used >= limit;
  const warning = used >= limit * 0.8 && !atLimit;
  const barColor = atLimit || warning ? '#ef4444' : '#6366F1';

  return (
    <div
      style={{
        background: atLimit ? 'rgba(239,68,68,0.04)' : 'rgba(99,102,241,0.04)',
        border: `1px solid ${atLimit ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.15)'}`,
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            color: atLimit ? '#ef4444' : '#374151',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {atLimit ? 'LIMIT REACHED' : 'MONTHLY USAGE'}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            fontWeight: 700,
            color: atLimit ? '#ef4444' : '#6366F1',
          }}
        >
          {used} / {limit}
        </span>
      </div>
      <div style={{ height: 6, background: '#F5F5F5', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: barColor,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {atLimit && (
        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
          Limit reached — upgrade to Scale for unlimited
        </span>
      )}
    </div>
  );
}
