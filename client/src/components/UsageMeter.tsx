import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';

interface UsageMeterProps {
  feature: string;
  limit: number;
  label: string;
  compact?: boolean;
}

export default function UsageMeter({ feature, limit, label, compact }: UsageMeterProps) {
  const { subPlan, session } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!session?.access_token || subPlan === 'scale') return;
    fetch(`/api/usage/${feature}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.count === 'number') setCount(d.count); })
      .catch(() => {}); // fail silently
  }, [feature, session?.access_token, subPlan]);

  // Scale users: no meter
  if (subPlan === 'scale') return null;
  if (count === null) return null;

  const pct = Math.min(100, (count / limit) * 100);
  const color = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';
  const atLimit = count >= limit;

  if (compact) {
    return (
      <>
        <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 300ms' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 10, color, whiteSpace: 'nowrap' as const }}>{count}/{limit}</span>
        </div>
        {showUpgrade && <UpgradeModal isOpen onClose={() => setShowUpgrade(false)} feature={feature} reason={`You've used all ${limit} ${label} this month`} />}
      </>
    );
  }

  return (
    <>
      <div style={{ background: atLimit ? '#FEF2F2' : '#F9FAFB', border: `1px solid ${atLimit ? '#FECACA' : '#E5E7EB'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{count} / {limit} {label} this month</span>
            {atLimit && (
              <button onClick={() => setShowUpgrade(true)} style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                Upgrade →
              </button>
            )}
          </div>
          <div style={{ height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 300ms' }} />
          </div>
        </div>
      </div>
      {showUpgrade && <UpgradeModal isOpen onClose={() => setShowUpgrade(false)} feature={feature} reason={`You've used all ${limit} ${label} this month`} />}
    </>
  );
}
