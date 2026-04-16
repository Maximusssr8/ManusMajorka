/**
 * MetaVariantsPanel — 3×3×3 Meta ad variants with per-field copy,
 * inline editing, Export All (.txt), and save-to-backend.
 * Pluggable into the existing Ads Studio page.
 */
import { useEffect, useState } from 'react';
import { Copy, Download, Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface MetaAd {
  headlines: string[];
  bodies: string[];
  ctas: string[];
  hook: string;
  audience: string;
  interests: string[];
}

interface ProductContext {
  title: string;
  image?: string | null;
  url?: string | null;
  price?: string;
  benefit?: string;
  audienceHint?: string;
}

interface Props {
  product: ProductContext;
}

const mono = "'JetBrains Mono', monospace";
const dm = "'DM Sans', sans-serif";
const brico = "'Syne', sans-serif";

export default function MetaVariantsPanel({ product }: Props) {
  const [ad, setAd] = useState<MetaAd | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function runGenerate(): Promise<void> {
    if (!product.title.trim()) {
      setError('Add a product name first.');
      return;
    }
    setError('');
    setLoading(true);
    setAd(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Please sign in to generate.');
        setLoading(false);
        return;
      }
      const resp = await fetch('/api/ai/generate-meta-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productTitle: product.title,
          productUrl: product.url ?? undefined,
          pricePoint: product.price,
          benefit: product.benefit,
          audience: product.audienceHint,
          format: 'feed',
        }),
      });
      const data = (await resp.json()) as { ok: boolean; ad?: MetaAd; message?: string; reason?: string };
      if (!data.ok || !data.ad) {
        setError(data.message ?? `Generation failed (${data.reason ?? 'unknown'}).`);
        setLoading(false);
        return;
      }
      setAd(data.ad);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function updateHeadline(i: number, value: string): void {
    if (!ad) return;
    const next = { ...ad, headlines: ad.headlines.map((h, idx) => (idx === i ? value : h)) };
    setAd(next);
  }
  function updateBody(i: number, value: string): void {
    if (!ad) return;
    setAd({ ...ad, bodies: ad.bodies.map((b, idx) => (idx === i ? value : b)) });
  }
  function updateCta(i: number, value: string): void {
    if (!ad) return;
    setAd({ ...ad, ctas: ad.ctas.map((c, idx) => (idx === i ? value : c)) });
  }
  function updateInterest(i: number, value: string): void {
    if (!ad) return;
    setAd({ ...ad, interests: ad.interests.map((x, idx) => (idx === i ? value : x)) });
  }
  function updateHook(value: string): void {
    if (!ad) return;
    setAd({ ...ad, hook: value });
  }
  function updateAudience(value: string): void {
    if (!ad) return;
    setAd({ ...ad, audience: value });
  }

  async function copyField(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  }

  function exportAll(): void {
    if (!ad) return;
    const lines = [
      `Meta Ad Pack — ${product.title}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '── HOOK (first 3 seconds) ──',
      ad.hook,
      '',
      '── HEADLINES (≤40 chars) ──',
      ...ad.headlines.map((h, i) => `${i + 1}. ${h} [${h.length}/40]`),
      '',
      '── BODY COPY (≤125 chars) ──',
      ...ad.bodies.map((b, i) => `${i + 1}. ${b} [${b.length}/125]`),
      '',
      '── CTA BUTTONS ──',
      ...ad.ctas.map((c, i) => `${i + 1}. ${c}`),
      '',
      '── TARGET AUDIENCE ──',
      ad.audience,
      '',
      '── INTEREST KEYWORDS ──',
      ...ad.interests.map((k, i) => `${i + 1}. ${k}`),
      '',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    a.download = `meta-ad-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as .txt');
  }

  async function saveToBackend(): Promise<void> {
    if (!ad) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Please sign in to save.');
        setSaving(false);
        return;
      }
      const resp = await fetch('/api/stores/ad-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productTitle: product.title,
          productImage: product.image ?? undefined,
          productUrl: product.url ?? undefined,
          platform: 'Meta',
          format: 'feed',
          headlines: ad.headlines,
          bodies: ad.bodies,
          ctas: ad.ctas,
          hook: ad.hook,
          audience: ad.audience,
          interests: ad.interests,
        }),
      });
      const data = (await resp.json()) as { success?: boolean; error?: string };
      if (!data.success) {
        toast.error(data.error ?? 'Save failed');
      } else {
        toast.success('Saved to your library');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 16, maxWidth: 820 }}>
      <div style={{
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: '#f1f1f3', letterSpacing: '-0.01em' }}>
              Meta Variants — 3 × 3 × 3
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Three headlines, three body variants, three CTAs — plus hook, audience, interests.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={runGenerate}
              disabled={loading}
              style={{
                minHeight: 44, padding: '0 16px',
                borderRadius: 8,
                background: loading ? 'rgba(59,130,246,0.15)' : '#3B82F6',
                color: '#fff', border: 'none',
                fontFamily: dm, fontWeight: 700, fontSize: 13,
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {loading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
              {loading ? 'Generating…' : ad ? 'Regenerate' : 'Generate variants'}
            </button>
            {ad && (
              <>
                <button
                  onClick={exportAll}
                  style={{
                    minHeight: 44, padding: '0 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    color: '#f1f1f3', border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: dm, fontWeight: 600, fontSize: 12,
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Download size={13} /> Export All
                </button>
                <button
                  onClick={saveToBackend}
                  disabled={saving}
                  style={{
                    minHeight: 44, padding: '0 14px',
                    borderRadius: 8,
                    background: 'rgba(79,142,247,0.12)',
                    color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.3)',
                    fontFamily: dm, fontWeight: 700, fontSize: 12,
                    cursor: saving ? 'wait' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: 12,
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: 12, fontFamily: dm,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={runGenerate} style={{ background: 'none', color: '#f87171', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
              Retry
            </button>
          </div>
        )}

        {!ad && !loading && !error && (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: dm }}>
            Click Generate variants to produce three tested-style headlines, bodies, and CTAs.
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                height: 54, borderRadius: 8,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s linear infinite',
              }} />
            ))}
            <style>{`@keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} } .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {ad && (
          <div style={{ display: 'grid', gap: 14 }}>
            <FieldBlock label="Hook (first 3 seconds)" value={ad.hook} onChange={updateHook} onCopy={() => copyField(ad.hook, 'Hook')} />

            <div>
              <FieldLabel>Headlines (≤ 40 chars)</FieldLabel>
              <div style={{ display: 'grid', gap: 8 }}>
                {ad.headlines.map((h, i) => (
                  <EditableRow key={`h${i}`} index={i + 1} value={h} limit={40}
                    onChange={(v) => updateHeadline(i, v)}
                    onCopy={() => copyField(h, `Headline ${i + 1}`)}
                  />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Body copy (≤ 125 chars)</FieldLabel>
              <div style={{ display: 'grid', gap: 8 }}>
                {ad.bodies.map((b, i) => (
                  <EditableRow key={`b${i}`} index={i + 1} value={b} limit={125} multiline
                    onChange={(v) => updateBody(i, v)}
                    onCopy={() => copyField(b, `Body ${i + 1}`)}
                  />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Call-to-action</FieldLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {ad.ctas.map((c, i) => (
                  <EditableRow key={`c${i}`} index={i + 1} value={c}
                    onChange={(v) => updateCta(i, v)}
                    onCopy={() => copyField(c, `CTA ${i + 1}`)}
                  />
                ))}
              </div>
            </div>

            <FieldBlock label="Target audience" value={ad.audience} multiline onChange={updateAudience} onCopy={() => copyField(ad.audience, 'Audience')} />

            <div>
              <FieldLabel>Interest keywords (5)</FieldLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {ad.interests.map((k, i) => (
                  <EditableRow key={`k${i}`} index={i + 1} value={k}
                    onChange={(v) => updateInterest(i, v)}
                    onCopy={() => copyField(k, `Interest ${i + 1}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 9,
      color: 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 6,
    }}>{children}</div>
  );
}

interface EditableRowProps {
  index: number;
  value: string;
  limit?: number;
  multiline?: boolean;
  onChange: (v: string) => void;
  onCopy: () => void;
}

function EditableRow({ index, value, limit, multiline, onChange, onCopy }: EditableRowProps) {
  const overLimit = limit != null && value.length > limit;
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      background: '#0f0f14', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8, padding: '8px 10px',
    }}>
      <span style={{
        minWidth: 20, fontFamily: mono, fontSize: 10, fontWeight: 700,
        color: 'rgba(255,255,255,0.35)', marginTop: 6,
      }}>{index}.</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.max(1, Math.min(4, Math.ceil(value.length / 80)))}
          style={{
            flex: 1, minHeight: 32, resize: 'vertical',
            background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f1f3', fontFamily: dm, fontSize: 13, lineHeight: 1.5,
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, minHeight: 32,
            background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f1f3', fontFamily: dm, fontSize: 13,
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {limit != null && (
          <span style={{
            fontFamily: mono, fontSize: 9, fontWeight: 700,
            padding: '2px 6px', borderRadius: 999,
            background: overLimit ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)',
            color: overLimit ? '#f87171' : '#10b981',
            border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
          }}>{value.length}/{limit}</span>
        )}
        <button
          onClick={onCopy}
          aria-label="Copy"
          style={{
            minWidth: 32, minHeight: 32, borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><Copy size={13} /></button>
      </div>
    </div>
  );
}

interface FieldBlockProps {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (v: string) => void;
  onCopy: () => void;
}

function FieldBlock({ label, value, multiline, onChange, onCopy }: FieldBlockProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <FieldLabel>{label}</FieldLabel>
        <button
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          style={{
            minWidth: 32, minHeight: 32, borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><Copy size={13} /></button>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{
            width: '100%', background: '#0f0f14',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
            padding: '10px 12px', outline: 'none',
            color: '#f1f1f3', fontFamily: dm, fontSize: 13, lineHeight: 1.5, resize: 'vertical',
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', minHeight: 44, background: '#0f0f14',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
            padding: '0 12px', outline: 'none',
            color: '#f1f1f3', fontFamily: dm, fontSize: 13,
          }}
        />
      )}
    </div>
  );
}

// ── Saved Ad Sets sidebar — pluggable list of the last 10 saved packs ───────
interface SavedAdSet {
  id: string;
  product_title: string;
  product_image: string | null;
  platform: string | null;
  headlines: string[];
  bodies: string[];
  ctas: string[];
  hook: string | null;
  audience: string | null;
  interests: string[] | null;
  created_at: string;
}

interface SavedAdSetsDrawerProps {
  onRestore: (set: SavedAdSet) => void;
  reloadKey?: number;
}

export function SavedAdSetsDrawer({ onRestore, reloadKey = 0 }: SavedAdSetsDrawerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedAdSet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const r = await fetch('/api/stores/ad-sets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await r.json()) as { success?: boolean; data?: SavedAdSet[] };
        if (!cancelled && data.success && data.data) setItems(data.data);
      } catch {
        // ignore network errors — drawer is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [reloadKey, open]);

  async function del(id: string): Promise<void> {
    if (!window.confirm('Delete this saved ad set?')) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch(`/api/stores/ad-sets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 50 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          minHeight: 44, padding: '0 14px', borderRadius: 999,
          background: '#0d1117', border: '1px solid #161b22',
          color: '#4f8ef7', fontFamily: dm, fontWeight: 700, fontSize: 12,
          cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
        }}
      >
        {open ? 'Close saved ads' : `Saved ads (${items.length})`}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, bottom: 52, width: 340, maxHeight: 480, overflowY: 'auto',
          background: '#0d1117', border: '1px solid #161b22', borderRadius: 12,
          padding: 12,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Last 10 saved ad sets
          </div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: 20 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: 20 }}>No saved ad sets yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {items.map((it) => (
                <div key={it.id} style={{
                  background: '#0f0f14', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '8px 10px',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <button
                    onClick={() => onRestore(it)}
                    style={{
                      flex: 1, textAlign: 'left', minHeight: 44,
                      background: 'transparent', border: 'none', cursor: 'pointer', color: '#f1f1f3',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.product_title}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: mono, marginTop: 2 }}>
                      {new Date(it.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </button>
                  <button
                    onClick={() => del(it.id)}
                    aria-label="Delete"
                    style={{
                      minWidth: 32, minHeight: 32, borderRadius: 6,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#f87171', cursor: 'pointer', fontSize: 12,
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { MetaAd, SavedAdSet };
