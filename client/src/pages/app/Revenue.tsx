import { useEffect, useState } from 'react';
import { Plus, TrendingUp, DollarSign, Target, Trash2 } from 'lucide-react';

/**
 * Revenue.tsx — personal profit log for the operator.
 *
 * Pure localStorage-backed (key: majorka_revenue_v1). No server, no
 * Supabase — operator's data stays on their device. Each entry tracks
 * a product they're running with daily revenue, daily ad spend, and
 * days running. The page aggregates totals + ROAS across all entries.
 *
 * The point of this page is retention: it turns Majorka from a research
 * tool into a business management tool — the operator's daily check-in
 * spot for "am I making money?".
 */

interface RevenueEntry {
  id: string;
  productTitle: string;
  startDate: string;
  dailyRevenue: number;
  dailyAdSpend: number;
  daysRunning: number;
  notes?: string;
}

const STORAGE_KEY = 'majorka_revenue_v1';

function loadEntries(): RevenueEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RevenueEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: RevenueEntry[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* quota */ }
}

export default function Revenue() {
  const [entries, setEntries] = useState<RevenueEntry[]>(() => loadEntries());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ productTitle: '', dailyRevenue: '', dailyAdSpend: '', daysRunning: '' });

  useEffect(() => { document.title = 'Revenue Diary — Majorka'; }, []);

  function persist(updated: RevenueEntry[]) {
    setEntries(updated);
    saveEntries(updated);
  }

  function addEntry() {
    if (!form.productTitle.trim() || !form.dailyRevenue) return;
    const entry: RevenueEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `rev_${Date.now()}`,
      productTitle: form.productTitle.trim(),
      startDate: new Date().toISOString().split('T')[0],
      dailyRevenue: Number(form.dailyRevenue) || 0,
      dailyAdSpend: Number(form.dailyAdSpend) || 0,
      daysRunning: Number(form.daysRunning) || 1,
    };
    persist([entry, ...entries]);
    setForm({ productTitle: '', dailyRevenue: '', dailyAdSpend: '', daysRunning: '' });
    setShowAdd(false);
  }

  function deleteEntry(id: string) {
    persist(entries.filter((e) => e.id !== id));
  }

  // Aggregate stats
  const totalRevenue = entries.reduce((s, e) => s + e.dailyRevenue * e.daysRunning, 0);
  const totalAdSpend = entries.reduce((s, e) => s + e.dailyAdSpend * e.daysRunning, 0);
  const totalProfit = totalRevenue - totalAdSpend;
  const avgROAS = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : '—';

  return (
    <div className="min-h-full bg-bg font-body text-text">
      <div className="px-4 md:px-8 pt-8 pb-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text tracking-tight leading-tight">
              Revenue Diary
            </h1>
            <p className="text-sm text-muted mt-2 max-w-md">
              Log your sales locally. This lives on this device only — we&apos;ll add store sync in a future release.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add product
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Revenue', value: `A$${totalRevenue.toLocaleString()}`, Icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            {
              label: 'Net Profit',
              value: `A$${totalProfit.toLocaleString()}`,
              Icon: TrendingUp,
              color: totalProfit >= 0 ? '#10b981' : '#ef4444',
              bg: totalProfit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            },
            { label: 'Ad Spend', value: `A$${totalAdSpend.toLocaleString()}`, Icon: Target, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Avg ROAS', value: `${avgROAS}x`, Icon: TrendingUp, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="glass-card glass-card--elevated rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={13} strokeWidth={2} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-display font-bold tabular-nums" style={{ color, letterSpacing: '-0.03em' }}>
                {entries.length === 0 ? '—' : value}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state OR table */}
        {entries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <TrendingUp size={20} className="text-accent" />
            </div>
            <p className="text-text font-semibold mb-1">No products tracked yet</p>
            <p className="text-sm text-muted mb-5 max-w-sm mx-auto">
              Log your first product to start tracking your real profit from Majorka. Takes 30 seconds.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)' }}
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                  {['Product', 'Days', 'Rev/day', 'Ad/day', 'Net Profit', 'ROAS', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.1em] text-white/30">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const totalRev = e.dailyRevenue * e.daysRunning;
                  const totalSpend = e.dailyAdSpend * e.daysRunning;
                  const profit = totalRev - totalSpend;
                  const roas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : '—';
                  return (
                    <tr key={e.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-text">{e.productTitle}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">Started {e.startDate}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-body tabular-nums">{e.daysRunning}d</td>
                      <td className="px-4 py-4 text-sm font-semibold text-text tabular-nums">A${e.dailyRevenue}</td>
                      <td className="px-4 py-4 text-sm text-body tabular-nums">A${e.dailyAdSpend}</td>
                      <td
                        className="px-4 py-4 text-sm font-bold tabular-nums"
                        style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}
                      >
                        A${profit.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-accent-hover tabular-nums">{roas}x</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => deleteEntry(e.id)}
                          aria-label="Delete entry"
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add product modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 glass-card glass-card--elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-display font-bold text-text mb-4">Add product</h3>
            <div className="space-y-3">
              {[
                { key: 'productTitle' as const, label: 'Product name', placeholder: 'e.g. Nano Tape Strong', type: 'text' },
                { key: 'dailyRevenue' as const, label: 'Daily revenue (A$)', placeholder: '0', type: 'number' },
                { key: 'dailyAdSpend' as const, label: 'Daily ad spend (A$)', placeholder: '0', type: 'number' },
                { key: 'daysRunning' as const, label: 'Days running', placeholder: '1', type: 'number' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-text placeholder-white/20 outline-none bg-white/[0.05] border border-white/[0.08] focus:border-accent transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl text-sm text-white/40 border border-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                disabled={!form.productTitle.trim() || !form.dailyRevenue}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
