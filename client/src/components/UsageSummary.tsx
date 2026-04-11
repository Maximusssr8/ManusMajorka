import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

interface UsageItem { used: number; limit: number; unlimited: boolean }
interface UsageData {
  plan: string;
  periodEnd: string;
  usage: { aiBriefs: UsageItem; reports: UsageItem; productSearch: UsageItem };
}

function UsageBar({ label, used, limit, unlimited }: { label: string } & UsageItem) {
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isWarning = !unlimited && pct >= 80;
  const isMaxed = !unlimited && pct >= 100;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-mono" style={{ color: isMaxed ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--text-tertiary)' }}>
          {unlimited ? 'Unlimited' : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isMaxed ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--accent)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function UsageSummary() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/usage/summary', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-8 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
    </div>
  );
  if (!data) return null;

  const resetDate = new Date(data.periodEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });

  return (
    <div className="rounded-md p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Usage this month</p>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Resets {resetDate}</p>
        </div>
        <span className="text-[10px] rounded px-2 py-0.5 uppercase tracking-wider font-medium" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{data.plan}</span>
      </div>
      <div className="space-y-4">
        <UsageBar label="AI Briefs" {...data.usage.aiBriefs} />
        <UsageBar label="Reports" {...data.usage.reports} />
        <UsageBar label="Product Search (daily)" {...data.usage.productSearch} />
      </div>
      {data.plan === 'builder' && (
        <button onClick={() => navigate('/pricing')} className="mt-5 w-full text-xs rounded-md py-2 font-medium transition-opacity hover:opacity-90" style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}>
          Upgrade to Scale — unlimited everything
        </button>
      )}
    </div>
  );
}
