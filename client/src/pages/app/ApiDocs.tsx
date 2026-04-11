/**
 * ApiDocs — /app/api-docs
 * Developer documentation with interactive try-it panel.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { supabase } from '@/lib/supabase';

const MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";
const DISPLAY = "'Syne', 'Bricolage Grotesque', system-ui, sans-serif";
const SANS = "'DM Sans', system-ui, sans-serif";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

type Method = 'GET' | 'POST';

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  description: string;
  params: Param[];
  body?: { example: string };
  response: string;
  comingSoon?: boolean;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'get-products',
    method: 'GET',
    path: '/v1/products',
    description: 'List winning products with optional filters.',
    params: [
      { name: 'category', type: 'string', required: false, description: 'Filter by product category.' },
      { name: 'min_score', type: 'number', required: false, description: 'Minimum winning score (0-100).' },
      { name: 'limit', type: 'number', required: false, description: 'Page size (max 100).', default: '25' },
      { name: 'offset', type: 'number', required: false, description: 'Pagination offset.', default: '0' },
    ],
    response: `{
  "data": [
    {
      "id": "prod_01hxz2k",
      "title": "Nano Tape Strong — 3M",
      "score": 99,
      "category": "home",
      "price_aud": 24.9
    }
  ],
  "meta": { "total": 1482, "limit": 25, "offset": 0 }
}`,
  },
  {
    id: 'get-product',
    method: 'GET',
    path: '/v1/products/:id',
    description: 'Fetch a single product by id.',
    params: [{ name: 'id', type: 'string', required: true, description: 'Product id.' }],
    response: `{
  "id": "prod_01hxz2k",
  "title": "Nano Tape Strong — 3M",
  "score": 99,
  "margin_pct": 54,
  "sold_count": 231482
}`,
  },
  {
    id: 'search-products',
    method: 'GET',
    path: '/v1/products/search',
    description: 'Full-text search across the products database.',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Search query.' },
      { name: 'limit', type: 'number', required: false, description: 'Max results.', default: '20' },
    ],
    response: `{
  "data": [
    { "id": "prod_01hxz2k", "title": "Nano Tape Strong — 3M", "score": 99 }
  ]
}`,
  },
  {
    id: 'tiktok-leaderboard',
    method: 'GET',
    path: '/v1/products/tiktok-leaderboard',
    description: 'Ranked TikTok Shop bestsellers by velocity × score.',
    params: [
      { name: 'niche', type: 'string', required: false, description: 'Optional niche filter.' },
    ],
    response: `{
  "market": "AU",
  "refreshed_at": "2026-04-11T08:00:00Z",
  "winners": [
    {
      "id": "prod_01hxz2k",
      "title": "Nano Tape Strong — 3M",
      "score": 99,
      "est_daily_rev_aud": 15600
    }
  ]
}`,
  },
  {
    id: 'stats-overview',
    method: 'GET',
    path: '/v1/stats/overview',
    description: 'Database totals and today\u2019s deltas.',
    params: [],
    response: `{
  "total_products": 14820,
  "new_today": 142,
  "trending_up": 86,
  "refreshed_at": "2026-04-11T08:00:00Z"
}`,
  },
  {
    id: 'ads-brief',
    method: 'POST',
    path: '/v1/ads/brief',
    description: 'Generate an AI-powered ad brief for a product.',
    params: [
      { name: 'productId', type: 'string', required: true, description: 'Product id.' },
      {
        name: 'format',
        type: 'enum',
        required: true,
        description: 'One of meta_feed, meta_story, tiktok_feed, tiktok_story.',
      },
    ],
    body: { example: `{ "productId": "prod_01hxz2k", "format": "meta_feed" }` },
    response: `{
  "headline": "The 3M Nano Tape Everyone's Obsessed With",
  "body": "Hold anything. Leaves no residue.",
  "hook": "POV: your walls finally behave",
  "cta": "Shop now"
}`,
  },
  {
    id: 'creators-matrix',
    method: 'GET',
    path: '/v1/creators/matrix',
    description: 'Creator-niche match scores for a given product.',
    params: [
      { name: 'productId', type: 'string', required: true, description: 'Product id to match.' },
    ],
    response: `{
  "productId": "prod_01hxz2k",
  "matches": [
    { "creator": "@home.hacks", "fit_score": 94, "avg_views": 1250000 }
  ]
}`,
  },
  {
    id: 'webhooks',
    method: 'POST',
    path: '/v1/webhooks',
    description: 'Register a webhook URL subscribed to events.',
    params: [
      { name: 'url', type: 'string', required: true, description: 'HTTPS webhook endpoint.' },
      { name: 'events', type: 'string[]', required: true, description: 'Event types to subscribe to.' },
    ],
    body: { example: `{ "url": "https://...", "events": ["product.new", "score.changed"] }` },
    response: `{ "id": "whk_...", "url": "...", "status": "active" }`,
    comingSoon: true,
  },
];

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'errors', label: 'Errors' },
  { id: 'rate-limiting', label: 'Rate limiting' },
  { id: 'endpoints', label: 'Endpoints' },
];

function CodeBlock({
  code,
  language,
  highlightJson,
}: {
  code: string;
  language: string;
  highlightJson?: boolean;
}): ReactElement {
  const [copied, setCopied] = useState(false);

  function copy() {
    try {
      void navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  function renderJson(src: string): ReactElement[] {
    const tokens: ReactElement[] = [];
    const regex = /("[^"]*")(\s*:)?|(-?\d+\.?\d*)|(\b(?:true|false|null)\b)|([{}[\],])|(\s+)/g;
    let idx = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(src)) !== null) {
      if (match.index > idx) {
        tokens.push(<span key={key++}>{src.slice(idx, match.index)}</span>);
      }
      if (match[1]) {
        if (match[2]) {
          tokens.push(
            <span key={key++} style={{ color: '#d4af37' }}>
              {match[1]}
            </span>,
          );
          tokens.push(<span key={key++}>{match[2]}</span>);
        } else {
          tokens.push(
            <span key={key++} style={{ color: '#10b981' }}>
              {match[1]}
            </span>,
          );
        }
      } else if (match[3]) {
        tokens.push(
          <span key={key++} style={{ color: '#3B82F6' }}>
            {match[3]}
          </span>,
        );
      } else if (match[4]) {
        tokens.push(
          <span key={key++} style={{ color: '#a78bfa' }}>
            {match[4]}
          </span>,
        );
      } else {
        tokens.push(<span key={key++}>{match[0]}</span>);
      }
      idx = match.index + match[0].length;
    }
    if (idx < src.length) tokens.push(<span key={key++}>{src.slice(idx)}</span>);
    return tokens;
  }

  return (
    <div
      style={{
        background: '#050505',
        border: '1px solid rgba(212,175,55,0.35)',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid rgba(212,175,55,0.15)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2a2a2a' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2a2a2a' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2a2a2a' }} />
        <span
          style={{
            marginLeft: 10,
            fontFamily: MONO,
            fontSize: 10.5,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {language}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={copy}
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: copied ? '#22c55e' : 'rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '3px 9px',
            borderRadius: 5,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '16px 18px',
          fontFamily: MONO,
          fontSize: 13,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.85)',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
        }}
      >
        {highlightJson ? renderJson(code) : code}
      </pre>
    </div>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }): ReactElement {
  const [tryOpen, setTryOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyValue, setBodyValue] = useState(ep.body?.example ?? '');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const curlSnippet = useMemo(() => {
    if (ep.method === 'GET') {
      return `curl -H "Authorization: Bearer $MAJORKA_API_KEY" \\\n  https://majorka.io${ep.path}`;
    }
    return `curl -X POST -H "Authorization: Bearer $MAJORKA_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.body?.example ?? '{}'}' \\\n  https://majorka.io${ep.path}`;
  }, [ep]);

  async function runIt() {
    setRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? '';
      if (!token) throw new Error('Not signed in');

      let url = ep.path.replace(/^\/v1/, '/api/v1');
      // Replace path params like :id
      Object.entries(paramValues).forEach(([k, v]) => {
        url = url.replace(`:${k}`, encodeURIComponent(v));
      });
      if (ep.method === 'GET') {
        const qs = new URLSearchParams();
        ep.params
          .filter((p) => !ep.path.includes(`:${p.name}`))
          .forEach((p) => {
            const v = paramValues[p.name];
            if (v !== undefined && v !== '') qs.set(p.name, v);
          });
        const q = qs.toString();
        if (q) url += `?${q}`;
      }
      const res = await fetch(url, {
        method: ep.method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(ep.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: ep.method === 'POST' ? bodyValue || '{}' : undefined,
      });
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as unknown;
        setRunResult(JSON.stringify(parsed, null, 2));
      } catch {
        setRunResult(text);
      }
      if (!res.ok) setRunError(`HTTP ${res.status}`);
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  }

  const methodColor = ep.method === 'GET' ? '#10b981' : '#3B82F6';

  return (
    <div
      id={ep.id}
      style={{
        background: '#0f0f0f',
        border: '1px solid #1a1a1a',
        borderRadius: 10,
        padding: 22,
        marginBottom: 20,
        opacity: ep.comingSoon ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            fontWeight: 700,
            color: methodColor,
            background: `${methodColor}18`,
            border: `1px solid ${methodColor}55`,
            padding: '3px 9px',
            borderRadius: 4,
            letterSpacing: '0.05em',
          }}
        >
          {ep.method}
        </span>
        <code
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: '#ededed',
          }}
        >
          {ep.path}
        </code>
        {ep.comingSoon && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: '#d4af37',
              border: '1px solid rgba(212,175,55,0.4)',
              padding: '2px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}
          >
            Coming soon
          </span>
        )}
      </div>
      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', marginTop: 10, marginBottom: 0 }}>
        {ep.description}
      </p>

      {ep.params.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          >
            Parameters
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: MONO,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Name', 'Type', 'Req', 'Description'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ep.params.map((p) => (
                <tr key={p.name} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '8px 10px', color: '#d4af37' }}>{p.name}</td>
                  <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)' }}>{p.type}</td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: p.required ? '#ef4444' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {p.required ? 'yes' : 'no'}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.7)' }}>
                    {p.description}
                    {p.default && (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {' '}
                        (default: {p.default})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginTop: 20,
        }}
      >
        Example response
      </div>
      <CodeBlock code={ep.response} language="json" highlightJson />

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {!ep.comingSoon && (
          <button
            type="button"
            onClick={() => setTryOpen((o) => !o)}
            style={{
              background: '#3B82F6',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(59,130,246,0.35)',
            }}
          >
            {tryOpen ? 'Close' : 'Try it'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            try {
              void navigator.clipboard.writeText(curlSnippet);
            } catch {
              /* noop */
            }
          }}
          style={{
            background: 'transparent',
            color: '#d4af37',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: 6,
            padding: '7px 14px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Copy as curl
        </button>
      </div>

      {tryOpen && !ep.comingSoon && (
        <div
          style={{
            marginTop: 18,
            background: '#080808',
            border: '1px solid #1a1a1a',
            borderRadius: 8,
            padding: 18,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 12,
            }}
          >
            Try it live
          </div>
          {ep.method === 'GET' &&
            ep.params.map((p) => (
              <div key={p.name} style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: MONO,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: 4,
                  }}
                >
                  {p.name} {p.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) =>
                    setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                  }
                  placeholder={p.default ?? p.type}
                  style={{
                    width: '100%',
                    background: '#050505',
                    border: '1px solid #1a1a1a',
                    borderRadius: 6,
                    padding: '8px 11px',
                    fontFamily: MONO,
                    fontSize: 12,
                    color: '#ededed',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          {ep.method === 'POST' && (
            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: MONO,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 4,
                }}
              >
                Request body (JSON)
              </label>
              <textarea
                value={bodyValue}
                onChange={(e) => setBodyValue(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  background: '#050505',
                  border: '1px solid #1a1a1a',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontFamily: MONO,
                  fontSize: 12,
                  color: '#ededed',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => void runIt()}
            disabled={running}
            style={{
              background: '#3B82F6',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.6 : 1,
              boxShadow: '0 0 16px rgba(59,130,246,0.35)',
            }}
          >
            {running ? 'Running…' : 'Run'}
          </button>
          {runError && (
            <div
              style={{
                marginTop: 12,
                color: '#fca5a5',
                fontSize: 12,
                fontFamily: MONO,
              }}
            >
              {runError}
            </div>
          )}
          {runResult && <CodeBlock code={runResult} language="json" highlightJson />}
        </div>
      )}
    </div>
  );
}

export default function ApiDocs(): ReactElement {
  const [activeSection, setActiveSection] = useState<string>('introduction');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      const ids = [...SECTIONS.map((s) => s.id), ...ENDPOINTS.map((e) => e.id)];
      let current = 'introduction';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const curlAuth = `curl -H "Authorization: Bearer mk_live_your_api_key_here" \\
  https://majorka.io/v1/products`;

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#080808',
        color: '#ededed',
        fontFamily: SANS,
        padding: '40px 32px 120px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 40,
        }}
        className="mj-docs-grid"
      >
        {/* Sidebar */}
        <aside
          className="mj-docs-sidebar"
          style={{
            position: 'sticky',
            top: 80,
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 14,
            }}
          >
            Documentation
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    padding: '7px 12px',
                    color: active ? '#d4af37' : 'rgba(255,255,255,0.65)',
                    textDecoration: 'none',
                    borderLeft: active ? '3px solid #d4af37' : '3px solid transparent',
                    background: active ? 'rgba(212,175,55,0.06)' : 'transparent',
                    transition: 'all 180ms ease',
                  }}
                >
                  {s.label}
                </a>
              );
            })}
            <div style={{ height: 8 }} />
            <div
              style={{
                fontFamily: MONO,
                fontSize: 9,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '6px 12px',
              }}
            >
              Endpoints
            </div>
            {ENDPOINTS.map((e) => {
              const active = activeSection === e.id;
              return (
                <a
                  key={e.id}
                  href={`#${e.id}`}
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    padding: '6px 12px',
                    color: active ? '#d4af37' : 'rgba(255,255,255,0.55)',
                    textDecoration: 'none',
                    borderLeft: active ? '3px solid #d4af37' : '3px solid transparent',
                    background: active ? 'rgba(212,175,55,0.06)' : 'transparent',
                    transition: 'all 180ms ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {e.method} {e.path.replace('/v1', '')}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div ref={contentRef} style={{ minWidth: 0 }}>
          <section id="introduction" style={{ marginBottom: 48 }}>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: 36,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.025em',
                color: '#ffffff',
              }}
            >
              Majorka API
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.65)',
                maxWidth: 680,
                marginTop: 12,
              }}
            >
              The Majorka Developer API gives you programmatic access to our product
              intelligence database, TikTok Shop leaderboard, and AI-powered ad brief
              generation. Build dashboards, automation pipelines, and agents on top of
              real ecommerce signals.
            </p>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.55)',
                maxWidth: 680,
                marginTop: 10,
              }}
            >
              Rate limits:{' '}
              <span style={{ fontFamily: MONO, color: '#d4af37' }}>Builder</span> plan
              includes 1,000 requests/day,{' '}
              <span style={{ fontFamily: MONO, color: '#d4af37' }}>Scale</span> plan
              includes 10,000 requests/day.
            </p>
          </section>

          <section id="authentication" style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Authentication
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.65)',
                marginTop: 10,
              }}
            >
              Pass your API key via the{' '}
              <code style={{ fontFamily: MONO, color: '#d4af37' }}>Authorization</code>{' '}
              header as a bearer token. Generate keys on the{' '}
              <a
                href="/app/api-keys"
                style={{ color: '#3B82F6', textDecoration: 'none' }}
              >
                API Keys page
              </a>
              .
            </p>
            <CodeBlock code={curlAuth} language="bash" />
            <div
              style={{
                marginTop: 14,
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 12.5,
                color: '#fca5a5',
              }}
            >
              Never embed API keys in client-side code. Keep them on your server.
            </div>
          </section>

          <section id="errors" style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Errors
            </h2>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: MONO,
                fontSize: 12.5,
                marginTop: 14,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Status', 'Code', 'Description'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['401', 'invalid_key', 'Missing or malformed API key.'],
                  ['403', 'revoked', 'API key was revoked.'],
                  ['429', 'rate_limited', 'Daily rate limit exceeded.'],
                  ['500', 'server_error', 'Internal server error — retry later.'],
                ].map((row) => (
                  <tr key={row[0]} style={{ borderBottom: '1px solid #141414' }}>
                    <td style={{ padding: '10px 12px', color: '#ef4444' }}>{row[0]}</td>
                    <td style={{ padding: '10px 12px', color: '#d4af37' }}>{row[1]}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)' }}>
                      {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="rate-limiting" style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Rate limiting
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.65)',
                marginTop: 10,
              }}
            >
              Rate limits are enforced per API key, per rolling 24-hour window.
              Builder plan allows 1,000 requests/day, Scale plan allows 10,000
              requests/day. Every response includes these headers:
            </p>
            <ul
              style={{
                marginTop: 10,
                paddingLeft: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <li style={{ fontFamily: MONO, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: '#d4af37' }}>X-RateLimit-Remaining</span> — requests left
                in the current window.
              </li>
              <li style={{ fontFamily: MONO, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: '#d4af37' }}>X-RateLimit-Reset</span> — unix timestamp when
                the window resets.
              </li>
            </ul>
          </section>

          <section id="endpoints">
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: 24,
                fontWeight: 600,
                margin: '0 0 16px',
                letterSpacing: '-0.02em',
              }}
            >
              Endpoints
            </h2>
            {ENDPOINTS.map((ep) => (
              <EndpointCard key={ep.id} ep={ep} />
            ))}
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mj-docs-grid { grid-template-columns: 1fr !important; }
          .mj-docs-sidebar { position: relative !important; top: 0 !important; max-height: none !important; margin-bottom: 24px; }
        }
      `}</style>
    </div>
  );
}
