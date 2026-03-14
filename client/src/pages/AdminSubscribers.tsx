/**
 * AdminSubscribers — /admin/subscribers
 * Lists all subscribers from the public.subscribers table.
 * Admin-only: restricted to maximusmajorka@gmail.com or admin role.
 */

import { Download, Loader2, Mail, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'maximusmajorka@gmail.com';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  subscribed_at: string;
  is_active: boolean;
}

export default function AdminSubscribers() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL && user?.role !== 'admin') return;
    supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setSubscribers(data || []);
        setLoading(false);
      });
  }, [user]);

  if (user?.email !== ADMIN_EMAIL && user?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#080a0e' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#f0ede8' }}>
            Admin Only
          </h2>
          <p className="text-sm" style={{ color: 'rgba(240,237,232,0.4)' }}>
            This page is restricted.
          </p>
        </div>
      </div>
    );
  }

  const filtered = subscribers.filter(
    (s) =>
      !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const active = subscribers.filter((s) => s.is_active).length;

  const exportCsv = () => {
    const rows = [
      ['Email', 'Name', 'Source', 'Subscribed At', 'Active'],
      ...filtered.map((s) => [
        s.email,
        s.name || '',
        s.source,
        new Date(s.subscribed_at).toLocaleDateString('en-AU'),
        s.is_active ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#080a0e', color: '#f0ede8' }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Syne, sans-serif', color: '#d4af37' }}
        >
          Subscribers
        </h1>
        <p className="text-sm" style={{ color: 'rgba(240,237,232,0.5)' }}>
          Email list from all acquisition channels
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Subscribers', value: subscribers.length, icon: Users },
          { label: 'Active', value: active, icon: Mail },
          { label: 'Inactive', value: subscribers.length - active, icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.15)' }}
            >
              <Icon size={16} style={{ color: '#d4af37' }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {value.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Export */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(240,237,232,0.3)' }}
          />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f0ede8',
            }}
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: '#d4af37' }} />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm" style={{ color: 'rgba(240,237,232,0.5)' }}>
            Error: {error}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Email', 'Name', 'Source', 'Subscribed', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: 'rgba(240,237,232,0.5)', fontFamily: 'Syne, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <td className="px-4 py-3" style={{ color: '#f0ede8' }}>
                    {s.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'rgba(240,237,232,0.7)' }}>
                    {s.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37' }}
                    >
                      {s.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>
                    {new Date(s.subscribed_at).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        background: s.is_active ? 'rgba(45,202,114,0.12)' : 'rgba(255,255,255,0.06)',
                        color: s.is_active ? '#2dca72' : 'rgba(240,237,232,0.4)',
                      }}
                    >
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'rgba(240,237,232,0.4)' }}>
            No subscribers found
          </div>
        )}
      </div>

      <div className="mt-4 text-xs" style={{ color: 'rgba(240,237,232,0.3)' }}>
        Showing {filtered.length} of {subscribers.length} subscribers
      </div>
    </div>
  );
}
