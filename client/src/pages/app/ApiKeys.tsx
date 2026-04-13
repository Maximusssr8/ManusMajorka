/**
 * ApiKeys — /app/api-keys
 * Stripe-style developer API key dashboard.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
  requestCount: number;
}

interface CreatedKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
}

interface UsageInfo {
  requestsThisMonth: number;
  dailyLimit: number;
  monthlyEstimate?: number;
  plan: string;
  month?: string;
}

interface ApiCallError extends Error {
  status?: number;
  code?: string;
}

async function apiCall<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? '';
  if (!token) {
    const err = new Error('Not signed in — refresh the page and sign in again') as ApiCallError;
    err.status = 401;
    throw err;
  }
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = '';
    let code = '';
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      detail = body.message ?? body.error ?? '';
      code = body.error ?? '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    const err = new Error(detail || `HTTP ${res.status}`) as ApiCallError;
    err.status = res.status;
    err.code = code;
    throw err;
  }
  return (await res.json()) as T;
}

const MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";
const DISPLAY = "'Syne', 'Bricolage Grotesque', system-ui, sans-serif";
const SANS = "'DM Sans', system-ui, sans-serif";

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  } catch {
    return '—';
  }
}

function maskPrefix(prefix: string): string {
  return `${prefix}••••••••`;
}

export default function ApiKeys(): ReactElement {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationPending, setMigrationPending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageAvailable, setUsageAvailable] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMigrationPending(false);
    try {
      const data = await apiCall<{ keys: ApiKey[] }>('/api-keys');
      setKeys(data.keys ?? []);
    } catch (e: unknown) {
      const err = e as ApiCallError;
      if (err.code === 'migration_pending' || err.status === 503) {
        setMigrationPending(true);
      } else {
        setError(err?.message || 'Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      const data = await apiCall<UsageInfo>('/api-keys/usage');
      setUsage(data);
      setUsageAvailable(true);
    } catch (e: unknown) {
      // Hide the usage card gracefully on any failure (404, 500, 503).
      // The migration may not have run yet in a fresh environment, which
      // would make this endpoint return 500 — that's not a page-level crash.
      setUsageAvailable(false);
      void e;
    }
  }, []);

  useEffect(() => {
    void load();
    void loadUsage();
  }, [load, loadUsage]);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await apiCall<CreatedKey>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });
      setJustCreated(created);
      setNewName('');
      setShowCreate(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await apiCall(`/api-keys/${id}`, { method: 'DELETE' });
      setConfirmRevokeId(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to revoke key');
    } finally {
      setRevokingId(null);
    }
  }

  function copyKey() {
    if (!justCreated) return;
    try {
      void navigator.clipboard.writeText(justCreated.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#080808',
        color: '#ededed',
        fontFamily: SANS,
        padding: '40px 32px 80px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h1
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  margin: 0,
                  color: '#ffffff',
                }}
              >
                Developer API
              </h1>
              <Link
                href="/app/api-docs"
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: '#d4af37',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                  padding: '4px 10px',
                  border: '1px solid rgba(212,175,55,0.35)',
                  borderRadius: 6,
                }}
              >
                View API docs →
              </Link>
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.55)',
                maxWidth: 620,
                marginTop: 10,
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              Programmatic access to Majorka&apos;s ecommerce intelligence. Build your own
              tools and dashboards.
            </p>
          </div>
          {!showCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{
                background: '#3B82F6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '11px 20px',
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              + Create API key
            </button>
          )}
        </div>

        {/* Migration-pending banner — shown when the api_keys table hasn't
            been created yet (first-time deploy). Friendly, not scary. */}
        {migrationPending && (
          <div
            style={{
              marginTop: 24,
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderRadius: 8,
              padding: '18px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4af37', boxShadow: '0 0 10px rgba(212,175,55,0.6)' }} />
              <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: '#ededed' }}>
                Database migration required
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.65, marginBottom: 10 }}>
              The <code style={{ fontFamily: MONO, color: '#d4af37' }}>api_keys</code> and{' '}
              <code style={{ fontFamily: MONO, color: '#d4af37' }}>api_usage</code> tables haven&rsquo;t been created on
              this Supabase instance yet. The Developer API needs these to store your keys.
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
              <strong style={{ color: '#ededed' }}>To fix:</strong> paste{' '}
              <code style={{ fontFamily: MONO, color: '#d4af37' }}>supabase/migrations/20260411_api_keys.sql</code>{' '}
              into your Supabase SQL Editor and run it, or run{' '}
              <code style={{ fontFamily: MONO, color: '#d4af37' }}>supabase db push</code> from your local CLI.
            </div>
            <button
              type="button"
              onClick={() => void load()}
              style={{
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Check again
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            style={{
              marginTop: 24,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 8,
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ color: '#fca5a5', fontSize: 13 }}>{error}</div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                void load();
              }}
              style={{
                background: 'transparent',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.45)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Inline create form */}
        {showCreate && (
          <div
            style={{
              marginTop: 28,
              background: '#0f0f0f',
              border: '1px solid #1a1a1a',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 14,
                color: '#ffffff',
              }}
            >
              Create a new API key
            </div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 8,
              }}
            >
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Production backend"
              style={{
                width: '100%',
                background: '#080808',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                padding: '11px 14px',
                color: '#ededed',
                fontSize: 14,
                fontFamily: SANS,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating || !newName.trim()}
                style={{
                  background: '#3B82F6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
                  opacity: creating || !newName.trim() ? 0.6 : 1,
                                  }}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                }}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid #1a1a1a',
                  borderRadius: 6,
                  padding: '9px 18px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Copy-once banner */}
        {justCreated && (
          <div
            style={{
              marginTop: 28,
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 8,
              padding: 22,
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
                color: '#d4af37',
                marginBottom: 6,
              }}
            >
              API key created
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 14 }}>
              This is the only time you&apos;ll see this key. Copy it now.
            </div>
            <div
              style={{
                background: '#050505',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                padding: '12px 14px',
                fontFamily: MONO,
                fontSize: 13,
                color: '#ededed',
                wordBreak: 'break-all',
                marginBottom: 14,
              }}
            >
              {justCreated.key}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={copyKey}
                style={{
                  background: '#3B82F6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                                  }}
              >
                {copied ? 'Copied' : 'Copy key'}
              </button>
              <button
                type="button"
                onClick={() => setJustCreated(null)}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid #1a1a1a',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        <div style={{ marginTop: 36 }}>
          {loading ? (
            <div
              style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                padding: 24,
              }}
            >
              <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 48, width: '100%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 48, width: '100%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 48, width: '100%' }} />
            </div>
          ) : keys.length === 0 ? (
            <div
              style={{
                background: '#0f0f0f',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                padding: 48,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 18,
                  color: '#ededed',
                  marginBottom: 6,
                }}
              >
                No API keys yet
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                You don&apos;t have any API keys yet. Create one to start building.
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div
                className="mj-keys-table"
                style={{
                  background: '#0f0f0f',
                  border: '1px solid #1a1a1a',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontFamily: MONO,
                    fontSize: 12.5,
                  }}
                >
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: '#0d0d0d',
                      borderBottom: '1px solid #d4af37',
                    }}
                  >
                    <tr>
                      {['Name', 'Prefix', 'Created', 'Last used', 'Requests', ''].map(
                        (h, i) => (
                          <th
                            key={i}
                            style={{
                              textAlign: i === 4 ? 'right' : 'left',
                              padding: '12px 16px',
                              fontSize: 10,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              color: '#d4af37',
                              fontWeight: 600,
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => {
                      const isConfirm = confirmRevokeId === k.id;
                      return (
                        <tr
                          key={k.id}
                          style={{ borderTop: '1px solid #1a1a1a' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              'rgba(59,130,246,0.04)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              'transparent';
                          }}
                        >
                          <td style={{ padding: '14px 16px', color: '#ededed' }}>
                            {k.name}
                            {k.revoked && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 10,
                                  color: '#ef4444',
                                  textTransform: 'uppercase',
                                }}
                              >
                                revoked
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '14px 16px',
                              color: 'rgba(255,255,255,0.65)',
                            }}
                          >
                            {maskPrefix(k.prefix)}
                          </td>
                          <td
                            style={{
                              padding: '14px 16px',
                              color: 'rgba(255,255,255,0.55)',
                            }}
                          >
                            {formatDate(k.createdAt)}
                          </td>
                          <td
                            style={{
                              padding: '14px 16px',
                              color: 'rgba(255,255,255,0.55)',
                            }}
                          >
                            {formatRelative(k.lastUsedAt)}
                          </td>
                          <td
                            style={{
                              padding: '14px 16px',
                              color: '#ededed',
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {k.requestCount.toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            {k.revoked ? (
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                                —
                              </span>
                            ) : isConfirm ? (
                              <span style={{ display: 'inline-flex', gap: 8 }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.7)',
                                    marginRight: 4,
                                  }}
                                >
                                  Are you sure?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleRevoke(k.id)}
                                  disabled={revokingId === k.id}
                                  style={{
                                    background: 'transparent',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    borderRadius: 4,
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {revokingId === k.id ? '…' : 'Revoke'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRevokeId(null)}
                                  style={{
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.6)',
                                    border: '1px solid #1a1a1a',
                                    borderRadius: 4,
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmRevokeId(k.id)}
                                style={{
                                  background: 'transparent',
                                  color: 'rgba(255,255,255,0.7)',
                                  border: '1px solid #1a1a1a',
                                  borderRadius: 4,
                                  padding: '4px 12px',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="mj-keys-cards" style={{ display: 'none' }}>
                {keys.map((k) => {
                  const isConfirm = confirmRevokeId === k.id;
                  return (
                    <div
                      key={k.id}
                      style={{
                        background: '#0f0f0f',
                        border: '1px solid #1a1a1a',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: DISPLAY,
                            fontSize: 15,
                            color: '#ededed',
                            fontWeight: 600,
                          }}
                        >
                          {k.name}
                        </div>
                        {k.revoked && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#ef4444',
                              textTransform: 'uppercase',
                            }}
                          >
                            revoked
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.65)',
                          marginBottom: 10,
                        }}
                      >
                        {maskPrefix(k.prefix)}
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                          fontFamily: MONO,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.55)',
                          marginBottom: 12,
                        }}
                      >
                        <div>Created: {formatDate(k.createdAt)}</div>
                        <div>Used: {formatRelative(k.lastUsedAt)}</div>
                        <div>
                          Requests:{' '}
                          <span style={{ color: '#ededed', fontVariantNumeric: 'tabular-nums' }}>
                            {k.requestCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!k.revoked &&
                        (isConfirm ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => void handleRevoke(k.id)}
                              disabled={revokingId === k.id}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.4)',
                                borderRadius: 6,
                                padding: '8px',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              Confirm revoke
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRevokeId(null)}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.7)',
                                border: '1px solid #1a1a1a',
                                borderRadius: 6,
                                padding: '8px',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeId(k.id)}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              color: 'rgba(255,255,255,0.7)',
                              border: '1px solid #1a1a1a',
                              borderRadius: 6,
                              padding: '8px',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Revoke
                          </button>
                        ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Usage card */}
        {usageAvailable && usage && (
          <div
            style={{
              marginTop: 36,
              background: '#0f0f0f',
              border: '1px solid #1a1a1a',
              borderRadius: 8,
              padding: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ededed',
                  }}
                >
                  Usage this month
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: MONO,
                  }}
                >
                  {usage.plan || 'free'} plan
                </div>
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  color: '#ededed',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {(usage.requestsThisMonth ?? 0).toLocaleString()} /{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {((usage.monthlyEstimate ?? usage.dailyLimit * 30) || 0).toLocaleString()} /mo
                </span>
              </div>
            </div>
            <div
              style={{
                height: 6,
                background: '#080808',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, ((usage.requestsThisMonth ?? 0) / Math.max(1, (usage.monthlyEstimate ?? usage.dailyLimit * 30) || 1)) * 100)}%`,
                  height: '100%',
                  background: '#d4af37',
                  boxShadow: '0 0 12px rgba(212,175,55,0.5)',
                  transition: 'width 400ms ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Responsive: table/cards toggle */}
        <style>{`
          @media (max-width: 767px) {
            .mj-keys-table { display: none !important; }
            .mj-keys-cards { display: block !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
