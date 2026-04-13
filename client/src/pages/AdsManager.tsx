import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Send, Copy, Download, Smartphone, Megaphone, Search, Link2 } from 'lucide-react';

// ── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#080808',
  surface: '#0d0d0d',
  card: '#0f0f0f',
  raised: '#111111',
  border: '#1a1a1a',
  borderHover: '#262626',
  text: '#f5f5f5',
  muted: '#a1a1a1',
  dim: '#6b6b6b',
  gold: '#d4af37',
  blue: '#3B82F6',
  blueHover: '#2563eb',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.08)',
  redBorder: 'rgba(239,68,68,0.25)',
} as const;

const FONT_DISPLAY = "'Syne', 'Bricolage Grotesque', sans-serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

// ── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  title: string;
  product_title?: string;
  image_url?: string;
  image?: string;
  price_aud?: number;
  price?: number;
}

type AdFormat = 'meta_feed' | 'meta_story' | 'tiktok_feed' | 'tiktok_story';

interface AdCopyResponse {
  headlines: string[];
  bodies: string[];
  ctas: string[];
  hook: string;
  audience: string;
  keywords: string[];
}

interface AdHistoryItem {
  id: string;
  product_title?: string;
  format?: string;
  created_at?: string;
  headline?: string;
}

const FORMATS: { id: AdFormat; label: string }[] = [
  { id: 'meta_feed', label: 'Meta Feed' },
  { id: 'meta_story', label: 'Meta Story' },
  { id: 'tiktok_feed', label: 'TikTok Feed' },
  { id: 'tiktok_story', label: 'TikTok Story' },
];

// ── Hooks ───────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Toast ───────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 1400);
  }, []);
  return { msg, show };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function getProductTitle(p: Product): string {
  return p.title || p.product_title || 'Untitled product';
}
function getProductImage(p: Product): string | undefined {
  return p.image_url || p.image;
}
function getProductPrice(p: Product): number | undefined {
  return p.price_aud ?? p.price;
}

function formatAUD(n: number | undefined): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '$--';
  return `$${n.toFixed(2)} AUD`;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function AdsManager() {
  const [search, setSearch] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const [format, setFormat] = useState<AdFormat>('meta_feed');

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copy, setCopy] = useState<AdCopyResponse | null>(null);

  // Editable state
  const [headlines, setHeadlines] = useState<string[]>(['', '', '']);
  const [bodies, setBodies] = useState<string[]>(['', '', '']);
  const [ctas, setCtas] = useState<string[]>(['', '', '']);
  const [hook, setHook] = useState('');
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  const [history, setHistory] = useState<AdHistoryItem[] | null>(null);
  const [historyMissing, setHistoryMissing] = useState(false);

  const toastCtrl = useToast();
  const debouncedSearch = useDebounce(search, 300);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Debounced product search
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    let aborted = false;
    setSearching(true);
    fetch(`/api/products?search=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('search failed'))))
      .then((data) => {
        if (aborted) return;
        const items: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setResults(items.slice(0, 8));
        setDropdownOpen(true);
      })
      .catch(() => {
        if (!aborted) {
          setResults([]);
          setDropdownOpen(false);
        }
      })
      .finally(() => {
        if (!aborted) setSearching(false);
      });
    return () => {
      aborted = true;
    };
  }, [debouncedSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // History fetch
  useEffect(() => {
    let aborted = false;
    fetch('/api/ads/history?limit=10')
      .then((r) => {
        if (r.status === 404) {
          if (!aborted) setHistoryMissing(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (aborted || data === null) return;
        const items: AdHistoryItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setHistory(items);
      })
      .catch(() => {
        if (!aborted) setHistoryMissing(true);
      });
    return () => {
      aborted = true;
    };
  }, []);

  const handleSelectProduct = useCallback((p: Product) => {
    setProduct(p);
    setDropdownOpen(false);
    setSearch('');
    setResults([]);
  }, []);

  const handleExtractUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setExtracting(true);
    try {
      const res = await fetch(`/api/products/extract-url?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || 'Failed to extract product');
      }
      const data = await res.json();
      const extracted: Product | null = data?.product || data?.data || data;
      if (extracted && (extracted.id || extracted.title || extracted.product_title)) {
        setProduct({
          id: extracted.id || `url-${Date.now()}`,
          title: extracted.title || extracted.product_title || 'Untitled product',
          product_title: extracted.product_title,
          image_url: extracted.image_url || extracted.image,
          price_aud: extracted.price_aud ?? extracted.price,
        });
        setUrlInput('');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to extract product';
      setGenError(message);
    } finally {
      setExtracting(false);
    }
  }, [urlInput]);

  const handleGenerate = useCallback(async () => {
    if (!product) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'ad-copy',
          productName: product.title || product.product_title || 'Product',
          platform: format.startsWith('tiktok') ? 'TikTok' : 'Facebook',
          tone: 'Urgent',
        }),
      });
      if (res.status === 404) {
        throw new Error('Generate endpoint pending');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || `Request failed (${res.status})`);
      }
      const raw = await res.json();
      // /api/ai/generate returns { content } text — parse into structured format
      const content: string = raw.content || raw.text || '';
      const headlineMatch = content.match(/Headline:\s*(.+)/i);
      const bodyMatch = content.match(/Body:\s*([\s\S]*?)(?=CTA:|Hook:|$)/i);
      const ctaMatch = content.match(/CTA:\s*(.+)/i);
      const hookMatch = content.match(/Hook:\s*(.+)/i);
      const data: AdCopyResponse = {
        headlines: headlineMatch ? [headlineMatch[1].trim()] : ['Check this out'],
        bodies: bodyMatch ? [bodyMatch[1].trim()] : [''],
        ctas: ctaMatch ? [ctaMatch[1].trim()] : ['Shop Now'],
        hook: hookMatch ? hookMatch[1].trim() : '',
        audience: 'Australian shoppers',
        keywords: [],
        ...raw,
      };
      const safeHeadlines = (data.headlines || []).slice(0, 3);
      const safeBodies = (data.bodies || []).slice(0, 3);
      const safeCtas = (data.ctas || []).slice(0, 3);
      setCopy(data);
      setHeadlines([safeHeadlines[0] || '', safeHeadlines[1] || '', safeHeadlines[2] || '']);
      setBodies([safeBodies[0] || '', safeBodies[1] || '', safeBodies[2] || '']);
      setCtas([safeCtas[0] || '', safeCtas[1] || '', safeCtas[2] || '']);
      setHook(data.hook || '');
      setAudience(data.audience || '');
      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Generation failed';
      setGenError(message);
    } finally {
      setGenerating(false);
    }
  }, [product, format]);

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toastCtrl.show('Copied');
      } catch {
        toastCtrl.show('Copy failed');
      }
    },
    [toastCtrl]
  );

  const exportAll = useCallback(() => {
    if (!copy && !headlines.some(Boolean)) return;
    const title = product ? getProductTitle(product) : 'Ad Set';
    const lines: string[] = [
      `# Ad Copy — ${title}`,
      `Format: ${FORMATS.find((f) => f.id === format)?.label || format}`,
      '',
      '## Hook',
      hook || '-',
      '',
      '## Headlines',
      ...headlines.map((h, i) => `${i + 1}. ${h}`),
      '',
      '## Body copy',
      ...bodies.map((b, i) => `${i + 1}. ${b}`),
      '',
      '## CTAs',
      ...ctas.map((c, i) => `${i + 1}. ${c}`),
      '',
      '## Target audience',
      audience || '-',
      '',
      '## Keywords',
      keywords.join(', ') || '-',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-copy-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [copy, product, format, headlines, bodies, ctas, hook, audience, keywords]);

  const hasOutput = useMemo(
    () => headlines.some(Boolean) || bodies.some(Boolean) || ctas.some(Boolean) || Boolean(hook),
    [headlines, bodies, ctas, hook]
  );

  return (
    <div
      style={{
        minHeight: '100%',
        background: C.bg,
        color: C.text,
        fontFamily: FONT_BODY,
        padding: '24px',
      }}
    >
      <style>{css}</style>

      <div className="am-container">
        {/* Header */}
        <div className="am-header">
          <div className="am-header-icon">
            <Megaphone size={20} color={C.gold} />
          </div>
          <div>
            <h1 className="am-title">Ads Manager</h1>
            <p className="am-subtitle">Generate high-converting ad copy for Meta and TikTok</p>
          </div>
        </div>

        {/* Product selector */}
        <section className="am-card">
          <div className="am-section-label">Select product</div>

          <div className="am-selector-grid">
            <div className="am-search-wrap" ref={searchBoxRef}>
              <div className="am-input-icon">
                <Search size={16} color={C.dim} />
              </div>
              <input
                className="am-input"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => results.length > 0 && setDropdownOpen(true)}
              />
              {dropdownOpen && (
                <div className="am-dropdown">
                  {searching && <div className="am-dropdown-empty">Searching...</div>}
                  {!searching && results.length === 0 && (
                    <div className="am-dropdown-empty">No results</div>
                  )}
                  {!searching &&
                    results.map((p) => (
                      <button
                        key={p.id}
                        className="am-dropdown-item"
                        onClick={() => handleSelectProduct(p)}
                      >
                        {getProductImage(p) ? (
                          <img src={getProductImage(p)} alt="" className="am-dropdown-thumb" />
                        ) : (
                          <div className="am-dropdown-thumb am-dropdown-thumb-empty" />
                        )}
                        <div className="am-dropdown-info">
                          <div className="am-dropdown-name">{getProductTitle(p)}</div>
                          <div className="am-dropdown-price">{formatAUD(getProductPrice(p))}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="am-url-wrap">
              <div className="am-input-icon">
                <Link2 size={16} color={C.dim} />
              </div>
              <input
                className="am-input"
                placeholder="Paste AliExpress URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExtractUrl();
                }}
              />
              <button
                className="am-url-btn"
                onClick={handleExtractUrl}
                disabled={!urlInput.trim() || extracting}
              >
                {extracting ? 'Extracting...' : 'Extract'}
              </button>
            </div>
          </div>

          {product && (
            <div className="am-product-card">
              {getProductImage(product) ? (
                <img src={getProductImage(product)} alt="" className="am-product-image" />
              ) : (
                <div className="am-product-image am-product-image-empty" />
              )}
              <div className="am-product-meta">
                <div className="am-product-name">{getProductTitle(product)}</div>
                <div className="am-product-price">{formatAUD(getProductPrice(product))}</div>
              </div>
            </div>
          )}
        </section>

        {/* Format tabs */}
        <div className="am-tabs-wrap">
          <div className="am-tabs">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                className={`am-tab${format === f.id ? ' am-tab-active' : ''}`}
                onClick={() => setFormat(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate CTA */}
        <div className="am-generate-row">
          <button
            className="am-cta"
            onClick={handleGenerate}
            disabled={!product || generating}
          >
            <Send size={16} />
            {generating ? 'Generating...' : 'Generate Ad Copy'}
          </button>
          {hasOutput && (
            <button className="am-export-btn" onClick={exportAll}>
              <Download size={15} />
              Export All
            </button>
          )}
        </div>

        {genError && (
          <div className="am-error">
            {genError}
          </div>
        )}

        {/* Workspace: output + preview */}
        <div className="am-workspace">
          <div className="am-output">
            {!hasOutput && !genError && (
              <div className="am-empty">
                {product
                  ? 'Click Generate to create ad copy variations.'
                  : 'Select a product to get started.'}
              </div>
            )}

            {hasOutput && (
              <>
                <VariationGroup
                  label="Headlines"
                  values={headlines}
                  onChange={setHeadlines}
                  onCopy={copyToClipboard}
                  rows={2}
                />
                <VariationGroup
                  label="Body copy"
                  values={bodies}
                  onChange={setBodies}
                  onCopy={copyToClipboard}
                  rows={4}
                />
                <VariationGroup
                  label="CTAs"
                  values={ctas}
                  onChange={setCtas}
                  onCopy={copyToClipboard}
                  rows={2}
                />

                <div className="am-group">
                  <div className="am-group-header">
                    <div className="am-group-label">Hook line</div>
                  </div>
                  <div className="am-variation">
                    <textarea
                      className="am-textarea"
                      rows={2}
                      value={hook}
                      onChange={(e) => setHook(e.target.value)}
                    />
                    <button className="am-copy-btn" onClick={() => copyToClipboard(hook)}>
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                </div>

                <div className="am-meta-grid">
                  <div className="am-meta-block">
                    <div className="am-meta-label">Target audience</div>
                    <div className="am-meta-value">{audience || '—'}</div>
                  </div>
                  <div className="am-meta-block">
                    <div className="am-meta-label">Suggested keywords</div>
                    <div className="am-chips">
                      {keywords.length === 0 && <span className="am-meta-value">—</span>}
                      {keywords.map((k, i) => (
                        <span key={`${k}-${i}`} className="am-chip">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="am-preview">
            <div className="am-preview-header">
              <Smartphone size={14} color={C.gold} />
              <span>Preview</span>
            </div>
            <AdPreview
              format={format}
              headline={headlines[0] || 'Your headline appears here'}
              body={bodies[0] || 'Body copy preview...'}
              product={product}
            />
          </div>
        </div>

        {/* History */}
        <section className="am-history">
          <div className="am-section-label">Recent ad sets</div>
          {historyMissing || !history || history.length === 0 ? (
            <div className="am-history-empty">
              {historyMissing ? 'History endpoint pending' : 'No ad sets yet'}
            </div>
          ) : (
            <div className="am-history-list">
              {history.map((h) => (
                <div key={h.id} className="am-history-item">
                  <div className="am-history-title">{h.product_title || 'Untitled'}</div>
                  <div className="am-history-meta">
                    {h.format || '—'} · {h.created_at ? new Date(h.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {toastCtrl.msg && <div className="am-toast">{toastCtrl.msg}</div>}
    </div>
  );
}

// ── VariationGroup ──────────────────────────────────────────────────────────
interface VariationGroupProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  onCopy: (text: string) => void;
  rows: number;
}

function VariationGroup({ label, values, onChange, onCopy, rows }: VariationGroupProps) {
  return (
    <div className="am-group">
      <div className="am-group-header">
        <div className="am-group-label">{label}</div>
      </div>
      <div className="am-variations">
        {values.map((v, i) => (
          <div key={i} className="am-variation">
            <textarea
              className="am-textarea"
              rows={rows}
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button className="am-copy-btn" onClick={() => onCopy(v)}>
              <Copy size={13} /> Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AdPreview ───────────────────────────────────────────────────────────────
interface AdPreviewProps {
  format: AdFormat;
  headline: string;
  body: string;
  product: Product | null;
}

function AdPreview({ format, headline, body, product }: AdPreviewProps) {
  const img = product ? getProductImage(product) : undefined;
  const isStory = format === 'meta_story' || format === 'tiktok_story';
  const isTikTok = format === 'tiktok_feed' || format === 'tiktok_story';

  return (
    <div className={`am-phone${isStory ? ' am-phone-story' : ''}`}>
      <div className="am-phone-notch" />
      <div className="am-phone-screen">
        {/* Chrome header */}
        <div className="am-phone-chrome">
          {isTikTok ? (
            <span className="am-chrome-brand">TikTok</span>
          ) : (
            <span className="am-chrome-brand">Meta</span>
          )}
          <span className="am-chrome-sponsor">Sponsored</span>
        </div>

        {/* Media */}
        <div className="am-phone-media">
          {img ? (
            <img src={img} alt="" />
          ) : (
            <div className="am-phone-media-empty" />
          )}
          {isStory && (
            <div className="am-story-overlay">
              <div className="am-story-headline">{headline}</div>
              <div className="am-story-body">{body}</div>
              <div className="am-story-cta">Shop now</div>
            </div>
          )}
        </div>

        {/* Footer (feed only) */}
        {!isStory && (
          <div className="am-phone-footer">
            <div className="am-phone-headline">{headline}</div>
            <div className="am-phone-body">{body}</div>
            <button className="am-phone-cta">Shop now</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  :root { --am-gold: ${C.gold}; }

  .am-container { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

  .am-header { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
  .am-header-icon {
    width: 40px; height: 40px; border-radius: 8px;
    background: ${C.card}; border: 1px solid ${C.border};
    display: flex; align-items: center; justify-content: center;
  }
  .am-title {
    font-family: ${FONT_DISPLAY};
    font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
    margin: 0; color: ${C.text};
  }
  .am-subtitle { font-size: 13px; color: ${C.muted}; margin: 2px 0 0; }

  .am-card {
    background: ${C.card};
    border: 1px solid ${C.border};
    border-radius: 12px;
    padding: 20px;
  }

  .am-section-label {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: ${C.dim}; font-weight: 600; margin-bottom: 12px;
  }

  .am-selector-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  @media (max-width: 768px) {
    .am-selector-grid { grid-template-columns: 1fr; }
  }

  .am-search-wrap, .am-url-wrap {
    position: relative;
    display: flex; align-items: center;
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 8px;
    transition: border-color 140ms;
  }
  .am-search-wrap:focus-within, .am-url-wrap:focus-within {
    border-color: ${C.borderHover};
  }
  .am-input-icon { padding: 0 10px 0 12px; display: flex; }
  .am-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: ${C.text}; font-family: ${FONT_BODY}; font-size: 14px;
    padding: 11px 12px 11px 0;
  }
  .am-input::placeholder { color: ${C.dim}; }

  .am-url-btn {
    background: transparent; border: none; border-left: 1px solid ${C.border};
    color: ${C.gold}; font-family: ${FONT_BODY}; font-size: 13px; font-weight: 600;
    padding: 0 14px; cursor: pointer; height: 100%;
  }
  .am-url-btn:disabled { color: ${C.dim}; cursor: not-allowed; }

  .am-dropdown {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0;
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 8px;
    max-height: 320px; overflow-y: auto;
    z-index: 20;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  .am-dropdown-empty { padding: 14px; color: ${C.dim}; font-size: 13px; text-align: center; }
  .am-dropdown-item {
    width: 100%; background: transparent; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    color: ${C.text}; text-align: left;
    border-bottom: 1px solid ${C.border};
  }
  .am-dropdown-item:last-child { border-bottom: none; }
  .am-dropdown-item:hover { background: ${C.card}; }
  .am-dropdown-thumb {
    width: 40px; height: 40px; border-radius: 6px; object-fit: cover;
    background: ${C.card}; border: 1px solid ${C.border};
  }
  .am-dropdown-thumb-empty { }
  .am-dropdown-info { flex: 1; min-width: 0; }
  .am-dropdown-name {
    font-size: 13px; color: ${C.text};
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .am-dropdown-price {
    font-family: ${FONT_MONO}; font-size: 11px; color: ${C.gold};
    margin-top: 2px;
  }

  .am-product-card {
    margin-top: 16px;
    display: flex; align-items: center; gap: 16px;
    padding: 14px;
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 8px;
  }
  .am-product-image {
    width: 96px; height: 96px; border-radius: 8px;
    object-fit: cover; background: ${C.card}; border: 1px solid ${C.border};
    flex-shrink: 0;
  }
  .am-product-image-empty { }
  .am-product-meta { flex: 1; min-width: 0; }
  .am-product-name {
    font-family: ${FONT_DISPLAY};
    font-size: 16px; font-weight: 600; color: ${C.text};
    line-height: 1.3; margin-bottom: 6px;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .am-product-price {
    font-family: ${FONT_MONO}; font-size: 14px; color: ${C.gold}; font-weight: 500;
  }

  .am-tabs-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .am-tabs-wrap::-webkit-scrollbar { display: none; }
  .am-tabs {
    display: flex; gap: 4px; border-bottom: 1px solid ${C.border};
    min-width: max-content;
  }
  .am-tab {
    background: transparent; border: none; cursor: pointer;
    padding: 12px 18px;
    color: ${C.muted}; font-family: ${FONT_BODY}; font-size: 14px; font-weight: 500;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    white-space: nowrap;
    transition: color 140ms;
  }
  .am-tab:hover { color: ${C.text}; }
  .am-tab-active { color: ${C.gold}; border-bottom-color: ${C.gold}; }

  .am-generate-row {
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  }
  .am-cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${C.blue}; color: #fff; border: none;
    border-radius: 8px; padding: 12px 22px;
    font-family: ${FONT_BODY}; font-size: 14px; font-weight: 600;
    cursor: pointer;
    box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 4px 20px rgba(59,130,246,0.35);
    transition: all 160ms;
  }
  .am-cta:hover:not(:disabled) {
    background: ${C.blueHover};
    box-shadow: 0 0 0 1px rgba(59,130,246,0.4), 0 6px 28px rgba(59,130,246,0.5);
    transform: translateY(-1px);
  }
  .am-cta:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .am-export-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${C.card}; color: ${C.text};
    border: 1px solid ${C.border}; border-radius: 8px;
    padding: 10px 16px;
    font-family: ${FONT_BODY}; font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: border-color 140ms;
  }
  .am-export-btn:hover { border-color: ${C.borderHover}; }

  .am-error {
    background: ${C.redBg};
    border: 1px solid ${C.redBorder};
    border-radius: 8px;
    padding: 12px 14px;
    color: ${C.red};
    font-size: 13px;
  }

  .am-workspace {
    display: grid; grid-template-columns: 1fr 340px; gap: 20px;
  }
  @media (max-width: 1024px) {
    .am-workspace { grid-template-columns: 1fr; }
  }

  .am-output {
    background: ${C.card};
    border: 1px solid ${C.border};
    border-radius: 12px;
    padding: 20px;
    display: flex; flex-direction: column; gap: 20px;
    min-width: 0;
  }

  .am-empty {
    padding: 40px 20px;
    text-align: center;
    color: ${C.dim};
    font-size: 14px;
  }

  .am-group { display: flex; flex-direction: column; gap: 10px; }
  .am-group-header { display: flex; justify-content: space-between; align-items: center; }
  .am-group-label {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: ${C.gold}; font-weight: 600;
  }
  .am-variations { display: flex; flex-direction: column; gap: 8px; }
  .am-variation {
    position: relative;
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 8px;
    padding: 10px 10px 10px 12px;
    transition: border-color 140ms;
  }
  .am-variation:focus-within { border-color: ${C.borderHover}; }
  .am-textarea {
    width: 100%; background: transparent; border: none; outline: none; resize: vertical;
    color: ${C.text}; font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.5;
    padding-right: 70px;
  }
  .am-copy-btn {
    position: absolute; top: 8px; right: 8px;
    display: inline-flex; align-items: center; gap: 4px;
    background: ${C.card}; color: ${C.muted};
    border: 1px solid ${C.border}; border-radius: 6px;
    padding: 4px 8px;
    font-family: ${FONT_BODY}; font-size: 11px; font-weight: 500;
    cursor: pointer;
    transition: all 140ms;
  }
  .am-copy-btn:hover { color: ${C.gold}; border-color: ${C.borderHover}; }

  .am-meta-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    padding-top: 16px;
    border-top: 1px solid ${C.border};
  }
  @media (max-width: 640px) {
    .am-meta-grid { grid-template-columns: 1fr; }
  }
  .am-meta-label {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: ${C.dim}; font-weight: 600; margin-bottom: 8px;
  }
  .am-meta-value { font-size: 13px; color: ${C.text}; line-height: 1.5; }
  .am-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .am-chip {
    display: inline-flex; align-items: center;
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px; color: ${C.text};
  }

  .am-preview {
    background: ${C.card};
    border: 1px solid ${C.border};
    border-radius: 12px;
    padding: 20px;
    display: flex; flex-direction: column; align-items: center;
  }
  .am-preview-header {
    width: 100%;
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: ${C.dim}; font-weight: 600; margin-bottom: 16px;
  }

  .am-phone {
    width: 240px;
    background: #000;
    border: 2px solid ${C.border};
    border-radius: 24px;
    padding: 8px;
    position: relative;
  }
  .am-phone-story { }
  .am-phone-notch {
    position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
    width: 60px; height: 4px; background: ${C.border}; border-radius: 2px;
  }
  .am-phone-screen {
    background: ${C.raised};
    border-radius: 16px;
    overflow: hidden;
    margin-top: 10px;
    display: flex; flex-direction: column;
  }
  .am-phone-chrome {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px;
    font-size: 10px; color: ${C.muted};
    border-bottom: 1px solid ${C.border};
  }
  .am-chrome-brand { color: ${C.gold}; font-weight: 600; font-family: ${FONT_DISPLAY}; }
  .am-chrome-sponsor { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; }
  .am-phone-media {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: ${C.bg};
    overflow: hidden;
  }
  .am-phone-story .am-phone-media { aspect-ratio: 9 / 16; }
  .am-phone-media img { width: 100%; height: 100%; object-fit: cover; }
  .am-phone-media-empty { width: 100%; height: 100%; background: ${C.card}; }
  .am-phone-footer {
    padding: 10px 12px 12px;
    border-top: 1px solid ${C.border};
  }
  .am-phone-headline {
    font-family: ${FONT_DISPLAY}; font-size: 11px; font-weight: 600;
    color: ${C.text}; line-height: 1.3; margin-bottom: 4px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .am-phone-body {
    font-size: 10px; color: ${C.muted}; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    margin-bottom: 8px;
  }
  .am-phone-cta {
    width: 100%; background: ${C.blue}; color: #fff; border: none;
    border-radius: 6px; padding: 6px; font-size: 10px; font-weight: 600;
    cursor: pointer;
  }
  .am-story-overlay {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 12px;
    background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
  }
  .am-story-headline {
    font-family: ${FONT_DISPLAY}; font-size: 11px; font-weight: 700;
    color: #fff; line-height: 1.3; margin-bottom: 3px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .am-story-body {
    font-size: 9px; color: rgba(255,255,255,0.8); line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    margin-bottom: 8px;
  }
  .am-story-cta {
    display: inline-block; background: ${C.gold}; color: #000;
    border-radius: 4px; padding: 4px 10px;
    font-size: 9px; font-weight: 700;
  }

  .am-history {
    background: ${C.card};
    border: 1px solid ${C.border};
    border-radius: 12px;
    padding: 20px;
  }
  .am-history-empty {
    padding: 20px; text-align: center; color: ${C.dim}; font-size: 13px;
  }
  .am-history-list {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;
  }
  .am-history-item {
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 8px;
    padding: 12px;
  }
  .am-history-title {
    font-size: 13px; color: ${C.text}; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .am-history-meta {
    font-size: 11px; color: ${C.dim}; margin-top: 4px;
    font-family: ${FONT_MONO};
  }

  .am-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: ${C.raised};
    border: 1px solid ${C.gold};
    border-radius: 8px;
    padding: 10px 18px;
    color: ${C.gold};
    font-size: 13px; font-weight: 500;
    z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  @media (max-width: 480px) {
    .am-title { font-size: 22px; }
    .am-card { padding: 16px; }
    .am-output, .am-preview, .am-history { padding: 16px; }
    .am-product-image { width: 72px; height: 72px; }
  }
`;
