/**
 * AIConceptPanel — Niche → full store concept in one click.
 * Generates 3 store name options, tagline, palette, fonts, audience,
 * and 5 real winning_products with per-product "This fits because…" rationale.
 * Save persists to saved_stores (RLS); Export downloads JSON.
 */
import { useState } from 'react';
import { Sparkles, Loader2, Save, Download, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ConceptProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  price_aud: number | null;
  rationale: string;
}

interface Concept {
  names: string[];
  tagline: string;
  palette: { primary: string; secondary: string; accent: string };
  fonts: { heading: string; body: string };
  audience: string;
}

interface Props {
  initialNiche?: string;
  initialMarket?: string;
  onSelectConcept?: (concept: Concept & { products: ConceptProduct[]; chosenName: string }) => void;
}

const dm = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";
const syne = "'Syne', sans-serif";

function hex(c: string): string {
  return c.startsWith('#') ? c : `#${c}`;
}

export default function AIConceptPanel({ initialNiche = '', initialMarket = 'Australia', onSelectConcept }: Props) {
  const [niche, setNiche] = useState(initialNiche);
  const [market, setMarket] = useState(initialMarket);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [products, setProducts] = useState<ConceptProduct[]>([]);
  const [chosenName, setChosenName] = useState('');
  const [tagline, setTagline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function generate(): Promise<void> {
    if (niche.trim().length < 2) {
      setError('Enter a niche (e.g. "dog accessories").');
      return;
    }
    setError('');
    setLoading(true);
    setConcept(null);
    setProducts([]);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Please sign in to generate a concept.');
        setLoading(false);
        return;
      }
      const r = await fetch('/api/ai/generate-store-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ niche: niche.trim(), market }),
      });
      const data = (await r.json()) as {
        ok: boolean;
        concept?: Concept;
        products?: ConceptProduct[];
        message?: string;
        reason?: string;
      };
      if (!data.ok || !data.concept || !data.products) {
        setError(data.message ?? `Generation failed (${data.reason ?? 'unknown'})`);
        setLoading(false);
        return;
      }
      setConcept(data.concept);
      setProducts(data.products);
      setChosenName(data.concept.names[0] ?? '');
      setTagline(data.concept.tagline);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function saveConcept(): Promise<void> {
    if (!concept || products.length === 0 || !chosenName) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Sign in to save.');
        setSaving(false);
        return;
      }
      const r = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: chosenName,
          niche,
          market,
          tagline,
          palette: concept.palette,
          fonts: concept.fonts,
          products,
          concept: { names: concept.names, audience: concept.audience },
        }),
      });
      const data = (await r.json()) as { success?: boolean; error?: string };
      if (!data.success) {
        toast.error(data.error ?? "Couldn't build that store. Try refining your niche.", {
          description: 'If this keeps happening, email support@majorka.io.',
          duration: 4000,
        });
      } else {
        toast.success('Concept saved to Marketplace');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't build that store. Try refining your niche.";
      toast.error(msg, {
        description: 'If this keeps happening, email support@majorka.io.',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  }

  function exportJson(): void {
    if (!concept) return;
    const payload = {
      version: 1,
      generated_at: new Date().toISOString(),
      niche,
      market,
      name: chosenName,
      tagline,
      palette: concept.palette,
      fonts: concept.fonts,
      audience: concept.audience,
      candidate_names: concept.names,
      products,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = chosenName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    a.download = `store-concept-${slug || 'majorka'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  }

  function useThisConcept(): void {
    if (!concept || !onSelectConcept) return;
    onSelectConcept({ ...concept, tagline, products, chosenName });
    toast.success('Concept applied to wizard');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: '#111111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 16,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <Sparkles size={16} color="#d4af37" />
          <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: '#f0f4ff' }}>
            AI Concept — one-click brand identity
          </span>
        </div>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr auto' }}>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Niche — e.g. dog accessories, skincare, home office"
            style={{
              minHeight: 44, padding: '0 12px',
              background: '#080808', color: '#f0f4ff',
              border: '1px solid #1a1a1a', borderRadius: 8,
              fontFamily: dm, fontSize: 13, outline: 'none',
            }}
          />
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            style={{
              minHeight: 44, padding: '0 12px',
              background: '#080808', color: '#f0f4ff',
              border: '1px solid #1a1a1a', borderRadius: 8,
              fontFamily: dm, fontSize: 13,
            }}
          >
            {['Australia', 'United States', 'United Kingdom', 'Global'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={loading}
            style={{
              minHeight: 44, padding: '0 16px', borderRadius: 8,
              background: loading ? 'rgba(59,130,246,0.2)' : '#3B82F6',
              color: '#fff', border: 'none',
              fontFamily: dm, fontWeight: 700, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            {loading ? 'Generating…' : concept ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: 12, fontFamily: dm,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={generate} style={{ background: 'none', color: '#f87171', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        )}

        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }`}</style>
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: 80, borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite',
            }} />
          ))}
        </div>
      )}

      {concept && (
        <>
          <div style={{
            background: '#111111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 16,
            display: 'grid', gap: 14,
          }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Store name — pick one
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {concept.names.map((n) => {
                  const selected = n === chosenName;
                  return (
                    <button
                      key={n}
                      onClick={() => setChosenName(n)}
                      style={{
                        minHeight: 44, padding: '0 14px', borderRadius: 999,
                        background: selected ? 'rgba(212,175,55,0.15)' : '#0f0f14',
                        color: selected ? '#d4af37' : '#f0f4ff',
                        border: `1px solid ${selected ? 'rgba(212,175,55,0.5)' : '#1a1a1a'}`,
                        fontFamily: syne, fontWeight: 700, fontSize: 14,
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {selected && <Check size={14} />} {n}
                    </button>
                  );
                })}
              </div>
              <input
                value={chosenName}
                onChange={(e) => setChosenName(e.target.value)}
                placeholder="Or type your own"
                style={{
                  marginTop: 10, width: '100%', minHeight: 44, padding: '0 12px',
                  background: '#080808', border: '1px solid #1a1a1a', borderRadius: 8,
                  color: '#f0f4ff', fontFamily: syne, fontSize: 16, fontWeight: 700, outline: 'none',
                }}
              />
            </div>

            <div>
              <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Tagline — click to edit
              </div>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={{
                  width: '100%', minHeight: 44, padding: '0 12px',
                  background: '#080808', border: '1px solid #1a1a1a', borderRadius: 8,
                  color: '#f0f4ff', fontFamily: dm, fontSize: 14, outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Palette
                </div>
                <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {(['primary', 'secondary', 'accent'] as const).map((k) => (
                    <div key={k} style={{
                      background: '#0f0f14', border: '1px solid #1a1a1a', borderRadius: 8,
                      padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <div style={{
                        height: 34, borderRadius: 6,
                        background: hex(concept.palette[k]),
                      }} />
                      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontFamily: mono, fontSize: 11, color: '#f0f4ff' }}>{hex(concept.palette[k])}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Fonts
                </div>
                <div style={{ background: '#0f0f14', border: '1px solid #1a1a1a', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontFamily: concept.fonts.heading, fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>
                    {chosenName || 'Your Brand'}
                  </div>
                  <div style={{ fontFamily: concept.fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    {tagline || 'A short tagline goes here.'}
                  </div>
                  <div style={{ marginTop: 8, fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                    {concept.fonts.heading} · {concept.fonts.body}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Target audience
              </div>
              <div style={{
                background: '#0f0f14', border: '1px solid #1a1a1a', borderRadius: 8,
                padding: 10, color: '#f0f4ff', fontFamily: dm, fontSize: 13, lineHeight: 1.55,
              }}>{concept.audience}</div>
            </div>
          </div>

          <div style={{
            background: '#111111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 16,
          }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              5 matching products — each with a fit rationale
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {products.map((p) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'start',
                  background: '#0f0f14', border: '1px solid #1a1a1a', borderRadius: 10, padding: 10,
                }}>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.product_title}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, background: '#080808' }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: '#080808' }} />
                  )}
                  <div>
                    <div style={{ color: '#f0f4ff', fontFamily: dm, fontSize: 13, fontWeight: 600 }}>
                      {p.product_title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontFamily: mono, fontSize: 11, marginTop: 2 }}>
                      ${p.price_aud != null ? Number(p.price_aud).toFixed(2) : '—'} AUD
                    </div>
                    <div style={{
                      marginTop: 6, color: '#d4af37', fontFamily: dm, fontSize: 12, lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}>
                      {p.rationale}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={saveConcept}
              disabled={saving || !chosenName}
              style={{
                minHeight: 44, padding: '0 16px', borderRadius: 8,
                background: '#3B82F6', color: '#fff', border: 'none',
                fontFamily: dm, fontWeight: 700, fontSize: 13,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor: saving ? 'wait' : 'pointer',
                opacity: !chosenName ? 0.5 : 1,
              }}
            >
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save concept
            </button>
            <button
              onClick={exportJson}
              style={{
                minHeight: 44, padding: '0 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', color: '#f0f4ff',
                border: '1px solid #1a1a1a',
                fontFamily: dm, fontWeight: 600, fontSize: 13,
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}
            >
              <Download size={13} /> Export JSON
            </button>
            {onSelectConcept && (
              <button
                onClick={useThisConcept}
                style={{
                  minHeight: 44, padding: '0 14px', borderRadius: 8,
                  background: 'rgba(212,175,55,0.12)', color: '#d4af37',
                  border: '1px solid rgba(212,175,55,0.3)',
                  fontFamily: dm, fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Use in wizard →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Marketplace list — user's saved stores, with delete + publish toggle ────
interface SavedStore {
  id: string;
  name: string;
  niche: string | null;
  tagline: string | null;
  palette: { primary?: string; secondary?: string; accent?: string } | null;
  fonts: { heading?: string; body?: string } | null;
  products: ConceptProduct[] | null;
  published: boolean;
  created_at: string;
}

interface MarketplaceListProps {
  isScale: boolean;
  onRequireUpgrade: () => void;
  reloadKey?: number;
}

export function SavedStoresList({ isScale, onRequireUpgrade, reloadKey = 0 }: MarketplaceListProps) {
  const [items, setItems] = useState<SavedStore[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }
      const r = await fetch('/api/stores', { headers: { Authorization: `Bearer ${token}` } });
      const data = (await r.json()) as { success?: boolean; data?: SavedStore[] };
      if (data.success && data.data) setItems(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Effect wrapper around load
  useState(() => { void load(); return undefined; });
  // reload when key changes
  if (reloadKey && items.length === 0 && !loading) {
    void load();
  }

  async function del(id: string): Promise<void> {
    if (!window.confirm('Delete this saved concept? This cannot be undone.')) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch(`/api/stores/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  async function publish(s: SavedStore): Promise<void> {
    if (!isScale) {
      onRequireUpgrade();
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const r = await fetch(`/api/stores/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ published: true }),
      });
      const data = (await r.json()) as { success?: boolean };
      if (data.success) {
        setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, published: true } : x)));
        toast.success(`Published as majorka.io/store/${slugify(s.name)}`);
      } else {
        toast.error('Publish failed');
      }
    } catch {
      toast.error('Publish failed');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {loading && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: dm }}>Loading your saved concepts…</div>}
      {!loading && items.length === 0 && (
        <div style={{
          background: '#111111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20,
          color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: dm, textAlign: 'center',
        }}>
          No saved concepts yet. Generate one with AI Concept above and click Save.
        </div>
      )}
      {items.map((s) => (
        <div key={s.id} style={{
          background: '#111111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 14,
          display: 'grid', gap: 10, gridTemplateColumns: '1fr auto',
        }}>
          <div>
            <div style={{ fontFamily: syne, fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>{s.name}</div>
            {s.tagline && <div style={{ fontFamily: dm, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.tagline}</div>}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
              {s.palette?.primary && <div style={{ width: 14, height: 14, borderRadius: 3, background: hex(s.palette.primary) }} />}
              {s.palette?.secondary && <div style={{ width: 14, height: 14, borderRadius: 3, background: hex(s.palette.secondary) }} />}
              {s.palette?.accent && <div style={{ width: 14, height: 14, borderRadius: 3, background: hex(s.palette.accent) }} />}
              <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                {s.niche ?? ''} · {new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
              {s.published && (
                <span style={{
                  fontFamily: mono, fontSize: 9, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(16,185,129,0.12)', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.25)',
                  marginLeft: 6,
                }}>PUBLISHED</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!s.published && (
              <button
                onClick={() => publish(s)}
                style={{
                  minHeight: 36, padding: '0 10px', borderRadius: 6,
                  background: isScale ? '#3B82F6' : 'rgba(255,255,255,0.04)',
                  color: isScale ? '#fff' : '#d4af37',
                  border: isScale ? 'none' : '1px solid rgba(212,175,55,0.3)',
                  fontFamily: dm, fontWeight: 700, fontSize: 11, cursor: 'pointer',
                }}
              >
                {isScale ? 'Publish' : 'Upgrade to publish'}
              </button>
            )}
            <button
              onClick={() => del(s.id)}
              style={{
                minHeight: 36, minWidth: 36, borderRadius: 6,
                background: 'rgba(239,68,68,0.1)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
              }}
              aria-label="Delete"
            >×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
