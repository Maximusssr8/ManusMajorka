import { useEffect, useMemo, useRef, useState } from 'react';
import { C } from '@/lib/designTokens';
import { proxyImage } from '@/lib/imageProxy';

export interface AdProduct {
  id: string;
  title: string;
  image_url: string | null;
  price_aud: number | null;
  sold_count: number | null;
  aliexpress_url: string | null;
  category: string | null;
}

interface ProductSelectorProps {
  token: string | null;
  selected: AdProduct | null;
  onSelect: (product: AdProduct) => void;
}

interface RestProduct {
  id: string | number;
  product_title: string;
  image_url: string | null;
  price_aud: number | string | null;
  sold_count: number | null;
  aliexpress_url: string | null;
  aliexpress_id: string | null;
  category: string | null;
}

function normalize(p: RestProduct): AdProduct {
  return {
    id: String(p.id),
    title: String(p.product_title ?? ''),
    image_url: p.image_url ?? null,
    price_aud: p.price_aud == null ? null : Number(p.price_aud),
    sold_count: p.sold_count == null ? null : Number(p.sold_count),
    aliexpress_url: p.aliexpress_url ?? null,
    category: p.category ?? null,
  };
}

function extractAliItemId(url: string): string | null {
  const match = url.match(/item\/(\d+)/);
  return match ? match[1] : null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return v;
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

async function searchProducts(query: string): Promise<AdProduct[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `${SUPABASE_URL}/rest/v1/winning_products` +
    `?select=id,product_title,image_url,price_aud,sold_count,aliexpress_url,aliexpress_id,category` +
    `&product_title=ilike.*${encodeURIComponent(q)}*` +
    `&order=sold_count.desc.nullslast` +
    `&limit=12`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as RestProduct[];
  return data.map(normalize);
}

async function findByAliexpressId(itemId: string): Promise<AdProduct | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  const url =
    `${SUPABASE_URL}/rest/v1/winning_products` +
    `?select=id,product_title,image_url,price_aud,sold_count,aliexpress_url,aliexpress_id,category` +
    `&aliexpress_id=eq.${encodeURIComponent(itemId)}&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as RestProduct[];
  return data.length > 0 ? normalize(data[0]) : null;
}

async function extractFromAliUrl(token: string, aliexpressUrl: string): Promise<AdProduct | null> {
  const res = await fetch('/api/ai/extract-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ aliexpressUrl }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    ok: boolean;
    title?: string | null;
    priceAud?: number | null;
    image?: string | null;
    soldCount?: number | null;
    category?: string | null;
    productUrl?: string | null;
  };
  if (!body.ok || !body.title) return null;
  return {
    id: `ali:${extractAliItemId(aliexpressUrl) ?? aliexpressUrl}`,
    title: body.title,
    image_url: body.image ?? null,
    price_aud: body.priceAud ?? null,
    sold_count: body.soldCount ?? null,
    aliexpress_url: body.productUrl ?? aliexpressUrl,
    category: body.category ?? null,
  };
}

export default function ProductSelector({ token, selected, onSelect }: ProductSelectorProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [results, setResults] = useState<AdProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const isUrl = useMemo(() => /aliexpress\./i.test(query), [query]);

  useEffect(() => {
    if (isUrl) return; // handled by paste button
    let cancelled = false;
    const id = ++reqId.current;
    if (debounced.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchProducts(debounced)
      .then((items) => {
        if (cancelled || id !== reqId.current) return;
        setResults(items);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, isUrl]);

  async function handleUrlPaste() {
    if (!isUrl) return;
    setPasting(true);
    setError(null);
    try {
      const itemId = extractAliItemId(query);
      if (itemId) {
        const hit = await findByAliexpressId(itemId);
        if (hit) {
          onSelect(hit);
          setQuery('');
          setResults([]);
          return;
        }
      }
      if (!token) {
        setError('Sign in to extract new AliExpress products.');
        return;
      }
      const extracted = await extractFromAliUrl(token, query);
      if (!extracted) {
        setError('Could not extract this product. Try another URL.');
        return;
      }
      onSelect(extracted);
      setQuery('');
      setResults([]);
    } finally {
      setPasting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label
        htmlFor="ads-product-search"
        style={{ fontFamily: C.fontMono, fontSize: 11, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}
      >
        Product
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id="ads-product-search"
          type="text"
          value={query}
          onChange={(e) => {
            setError(null);
            setQuery(e.target.value);
          }}
          placeholder="Search winners or paste an AliExpress URL…"
          style={{
            flex: 1,
            minHeight: 44,
            padding: '10px 14px',
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: C.rMd,
            color: C.text,
            fontFamily: C.fontBody,
            fontSize: 14,
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        />
        {isUrl && (
          <button
            type="button"
            onClick={handleUrlPaste}
            disabled={pasting}
            style={{
              minHeight: 44,
              padding: '0 18px',
              background: C.accent,
              color: C.accentInk,
              border: 'none',
              borderRadius: C.rMd,
              fontFamily: C.fontDisplay,
              fontWeight: 700,
              fontSize: 13,
              cursor: pasting ? 'wait' : 'pointer',
              letterSpacing: 0.5,
            }}
          >
            {pasting ? 'Extracting…' : 'Import URL'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: C.red, fontFamily: C.fontBody }}>{error}</div>
      )}

      {!isUrl && results.length > 0 && (
        <div
          role="listbox"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: 360,
            overflowY: 'auto',
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: C.rMd,
            padding: 4,
          }}
        >
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p);
                setQuery('');
                setResults([]);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 8,
                minHeight: 56,
                background: 'transparent',
                border: 'none',
                borderRadius: C.rSm,
                textAlign: 'left',
                cursor: 'pointer',
                color: C.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.raised;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: C.raised,
                  flexShrink: 0,
                }}
              >
                {p.image_url && (
                  <img
                    src={proxyImage(p.image_url) ?? ''}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: C.fontBody,
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    fontFamily: C.fontMono,
                    fontSize: 11,
                    color: C.muted,
                    marginTop: 2,
                  }}
                >
                  {p.sold_count != null && (
                    <span style={{ color: C.accent }}>{p.sold_count.toLocaleString()} sold</span>
                  )}
                  {p.price_aud != null && <span>${p.price_aud.toFixed(2)} AUD</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isUrl && loading && results.length === 0 && debounced.trim().length >= 2 && (
        <div style={{ fontSize: 12, color: C.muted, fontFamily: C.fontBody }}>Searching…</div>
      )}

      {selected && (
        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: 14,
            background: C.cardBg,
            border: `1px solid ${C.accent}33`,
            borderRadius: C.rMd,
            boxShadow: '0 0 0 1px rgba(212,175,55,0.08)',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              overflow: 'hidden',
              background: C.raised,
              flexShrink: 0,
            }}
          >
            {selected.image_url && (
              <img
                src={proxyImage(selected.image_url) ?? ''}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: C.fontMono,
                fontSize: 10,
                letterSpacing: 1.4,
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Selected
            </div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
              {selected.title}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 14,
                marginTop: 8,
                fontFamily: C.fontMono,
                fontSize: 11,
                color: C.muted,
              }}
            >
              {selected.sold_count != null && (
                <span>
                  <span style={{ color: C.accent }}>{selected.sold_count.toLocaleString()}</span> orders
                </span>
              )}
              {selected.price_aud != null && <span>${selected.price_aud.toFixed(2)} AUD</span>}
              {selected.category && <span>{selected.category}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
