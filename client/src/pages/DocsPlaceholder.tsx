import { useState, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  default?: string;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  description: string;
  params?: EndpointParam[];
  body?: string;
  example_response: string;
}

interface EndpointGroup {
  title: string;
  id: string;
  description: string;
  endpoints: Endpoint[];
}

// ── Endpoint data ──────────────────────────────────────────────────────────────

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    title: 'Products',
    id: 'products',
    description: 'Access the full Majorka product intelligence database. Filter, search, and discover winning products.',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/products',
        description: 'Paginated product list with filters. Returns scored products sorted by your criteria.',
        params: [
          { name: 'category', type: 'string', description: 'Filter by product category (partial match).' },
          { name: 'min_score', type: 'integer', description: 'Minimum winning score (0-100).', default: '0' },
          { name: 'min_orders', type: 'integer', description: 'Minimum order count.' },
          { name: 'sort', type: 'string', description: 'Sort field.', default: 'score' },
          { name: 'order', type: 'string', description: 'Sort direction (asc|desc).', default: 'desc' },
          { name: 'limit', type: 'integer', description: 'Results per page (max 100).', default: '25' },
          { name: 'offset', type: 'integer', description: 'Pagination offset.', default: '0' },
          { name: 'cursor', type: 'string', description: 'Cursor for cursor-based pagination (created_at value).' },
          { name: 'fields', type: 'string', description: 'Comma-separated field names to include in response.' },
          { name: 'q', type: 'string', description: 'Search query across product titles and categories.' },
        ],
        example_response: `{
  "ok": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Portable Blender Pro",
      "category": "Kitchen",
      "price_aud": 34.99,
      "sold_count": 12450,
      "winning_score": 92,
      "image_url": "https://...",
      "est_daily_revenue_aud": 1192.50,
      "velocity_score": 85,
      "ships_to_au": true
    }
  ],
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-04-16T12:00:00Z",
    "total": 3715,
    "limit": 25,
    "offset": 0,
    "has_more": true,
    "pipeline_age": 3600
  }
}`,
      },
      {
        method: 'GET',
        path: '/v1/products/trending',
        description: 'Top products by velocity score — the fastest movers in the last 7 days.',
        params: [
          { name: 'limit', type: 'integer', description: 'Number of results (max 50).', default: '20' },
          { name: 'fields', type: 'string', description: 'Comma-separated field names.' },
        ],
        example_response: `{
  "ok": true,
  "data": [
    {
      "id": "...",
      "title": "LED Galaxy Projector",
      "winning_score": 96,
      "velocity_score": 98,
      "sold_count": 28000,
      "price_aud": 42.50
    }
  ],
  "meta": { "request_id": "...", "pipeline_age": 1200 }
}`,
      },
      {
        method: 'GET',
        path: '/v1/products/hot',
        description: 'Newly discovered products in the last 48 hours. Catch winners early.',
        params: [
          { name: 'limit', type: 'integer', description: 'Number of results (max 50).', default: '20' },
          { name: 'fields', type: 'string', description: 'Comma-separated field names.' },
        ],
        example_response: `{
  "ok": true,
  "data": [
    {
      "id": "...",
      "title": "Smart Posture Corrector",
      "winning_score": 88,
      "created_at": "2026-04-15T06:00:00Z",
      "price_aud": 29.99,
      "sold_count": 3200
    }
  ],
  "meta": { "request_id": "...", "pipeline_age": 600 }
}`,
      },
      {
        method: 'GET',
        path: '/v1/products/search?q=<query>',
        description: 'Full-text search across product names and categories.',
        params: [
          { name: 'q', type: 'string', required: true, description: 'Search query (min 2 characters).' },
          { name: 'limit', type: 'integer', description: 'Results per page (max 100).', default: '25' },
          { name: 'offset', type: 'integer', description: 'Pagination offset.', default: '0' },
          { name: 'fields', type: 'string', description: 'Comma-separated field names.' },
        ],
        example_response: `{
  "ok": true,
  "data": [
    {
      "id": "...",
      "title": "Pet Hair Remover Roller",
      "category": "Pet Supplies",
      "winning_score": 91,
      "sold_count": 18500
    }
  ],
  "meta": { "total": 42, "limit": 25, "offset": 0, "query": "pet hair" }
}`,
      },
      {
        method: 'GET',
        path: '/v1/products/:id',
        description: 'Get a single product by ID with all available data.',
        params: [
          { name: 'id', type: 'uuid', required: true, description: 'Product UUID.' },
          { name: 'fields', type: 'string', description: 'Comma-separated field names.' },
        ],
        example_response: `{
  "ok": true,
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Portable Blender Pro",
    "category": "Kitchen",
    "price_aud": 34.99,
    "cost_price_aud": 12.50,
    "sold_count": 12450,
    "winning_score": 92,
    "image_url": "https://...",
    "product_url": "https://aliexpress.com/item/...",
    "est_daily_revenue_aud": 1192.50,
    "profit_margin": 64,
    "rating": 4.8,
    "velocity_score": 85,
    "velocity_label": "Accelerating",
    "ships_to_au": true,
    "tags": ["kitchen", "portable", "trending"],
    "tiktok_signal": true,
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-04-15T12:00:00Z"
  }
}`,
      },
    ],
  },
  {
    title: 'Scoring',
    id: 'scoring',
    description: 'Score any AliExpress product URL. Get Majorka\'s proprietary winning score, market data, and velocity analysis.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/score',
        description: 'Score any AliExpress product URL. Returns the winning score, market split, and velocity data. Rate limited: 10/min (Builder), 50/min (Scale).',
        body: `{ "url": "https://www.aliexpress.com/item/1005006..." }`,
        example_response: `{
  "ok": true,
  "data": {
    "score": 87,
    "product": {
      "title": "Wireless Earbuds Pro",
      "price_aud": 24.99,
      "sold_count": 8500,
      "winning_score": 87
    },
    "source": "database"
  }
}`,
      },
    ],
  },
  {
    title: 'AI',
    id: 'ai',
    description: 'Generate AI-powered marketing briefs and ad copy for any product in the database.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/brief',
        description: 'Generate an AI marketing brief for a product. Returns target audience, hook, angle, platform recommendation, and CTA.',
        body: `{ "product_id": "a1b2c3d4-..." }`,
        example_response: `{
  "ok": true,
  "data": {
    "brief": {
      "target": "Women 25-40 who meal prep on weekends",
      "hook": "Stop wasting 30 min every morning on smoothies",
      "angle": "Time-saving convenience for busy professionals",
      "platform": "TikTok + Instagram Reels",
      "cta": "Grab yours before they sell out"
    },
    "product_id": "a1b2c3d4-...",
    "product_title": "Portable Blender Pro"
  }
}`,
      },
      {
        method: 'POST',
        path: '/v1/ads/generate',
        description: 'Generate platform-specific ad copy with headlines, body text, CTA, and hook variations.',
        body: `{
  "product_id": "a1b2c3d4-...",
  "format": "meta_feed"
}`,
        params: [
          { name: 'product_id', type: 'uuid', required: true, description: 'Product UUID from the database.' },
          { name: 'format', type: 'string', required: true, description: 'Ad format: meta_feed, meta_story, tiktok_feed, tiktok_story.' },
        ],
        example_response: `{
  "ok": true,
  "data": {
    "headline": "The kitchen gadget TikTok can't stop talking about",
    "body": "Make restaurant-quality smoothies in 30 seconds. No cord, no mess. 12,000+ happy customers.",
    "cta": "Shop Now - 40% Off Today",
    "hooks": [
      "I threw away my $300 blender for this $35 one",
      "POV: Your morning routine just got 10x easier",
      "The portable blender that outsells Nutribullet 3:1"
    ],
    "format": "meta_feed",
    "product_id": "a1b2c3d4-..."
  }
}`,
      },
    ],
  },
  {
    title: 'Alerts',
    id: 'alerts',
    description: 'Create price and score alerts for products. Get notified when products hit your thresholds.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/alerts',
        description: 'Create a price or score alert for a product.',
        body: `{
  "product_id": "a1b2c3d4-...",
  "type": "price",
  "threshold": 25.00
}`,
        example_response: `{
  "ok": true,
  "data": {
    "id": "alert-uuid-...",
    "product_id": "a1b2c3d4-...",
    "alert_type": "price",
    "threshold": 25.00,
    "is_active": true,
    "created_at": "2026-04-16T12:00:00Z"
  }
}`,
      },
      {
        method: 'GET',
        path: '/v1/alerts',
        description: 'List all your active alerts.',
        example_response: `{
  "ok": true,
  "data": [
    {
      "id": "...",
      "product_id": "...",
      "alert_type": "price",
      "threshold": 25.00,
      "is_active": true,
      "created_at": "2026-04-16T12:00:00Z"
    }
  ]
}`,
      },
      {
        method: 'DELETE',
        path: '/v1/alerts/:id',
        description: 'Deactivate an alert.',
        params: [
          { name: 'id', type: 'uuid', required: true, description: 'Alert UUID.' },
        ],
        example_response: `{
  "ok": true,
  "data": { "id": "...", "deleted": true }
}`,
      },
    ],
  },
  {
    title: 'Stats',
    id: 'stats',
    description: 'Platform-level statistics. Total products, categories, average scores, and pipeline freshness.',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/stats',
        description: 'Get a high-level overview of the Majorka product database.',
        example_response: `{
  "ok": true,
  "data": {
    "total_products": 3715,
    "categories": 24,
    "category_list": ["Beauty", "Electronics", "Fashion", "Home", "Kitchen", "Pet Supplies", ...],
    "average_score": 72,
    "pipeline_age_seconds": 3600,
    "last_refresh": "2026-04-15T06:00:00Z"
  }
}`,
      },
    ],
  },
  {
    title: 'Webhooks',
    id: 'webhooks',
    description: 'Register webhook URLs to receive real-time notifications when products match your criteria.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/webhooks',
        description: 'Register a webhook to receive events. Currently in beta.',
        body: `{
  "event": "product.hot",
  "url": "https://your-server.com/webhook",
  "category": "Kitchen"
}`,
        params: [
          { name: 'event', type: 'string', required: true, description: 'Event type: product.hot, product.trending, alert.triggered.' },
          { name: 'url', type: 'string', required: true, description: 'HTTPS URL to receive POST events.' },
          { name: 'category', type: 'string', description: 'Optional category filter.' },
        ],
        example_response: `{
  "ok": true,
  "data": {
    "webhook_id": "...",
    "event": "product.hot",
    "url": "https://your-server.com/webhook",
    "status": "registered"
  }
}`,
      },
    ],
  },
];

// ── Colours ────────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.25)' },
  POST: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  DELETE: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
};

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      style={{
        position: 'absolute', top: 8, right: 8,
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6, padding: '4px 10px',
        color: copied ? '#10b981' : '#94A3B8',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', 'DM Sans', monospace",
        transition: 'all 0.15s',
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Code block ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
      <CopyButton text={code} />
      <pre
        style={{
          background: '#080a12',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '16px 16px 16px 16px',
          overflowX: 'auto',
          fontSize: 12,
          lineHeight: 1.6,
          color: '#e2e8f0',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          margin: 0,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <code data-lang={lang}>{code}</code>
      </pre>
    </div>
  );
}

// ── Try-it panel ───────────────────────────────────────────────────────────────

function TryIt({ endpoint }: { endpoint: Endpoint }) {
  const [apiKey, setApiKey] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const run = async () => {
    if (!apiKey.trim()) {
      setResponse('{"error": "Paste your API key above to try this endpoint."}');
      return;
    }
    setLoading(true);
    setResponse('');
    try {
      const baseUrl = window.location.origin;
      let url = `${baseUrl}${endpoint.path.replace(/:(\w+)/g, 'example-id')}`;

      // Remove query param placeholders
      url = url.replace(/\?q=<query>/, '?q=kitchen');

      const opts: RequestInit = {
        method: endpoint.method,
        headers: {
          'X-Api-Key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.method === 'POST' && endpoint.body) {
        opts.body = bodyRef.current?.value || endpoint.body;
      }

      const res = await fetch(url, opts);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setResponse(JSON.stringify({ error: msg }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      marginTop: 12,
      background: 'rgba(99,102,241,0.04)',
      border: '1px solid rgba(99,102,241,0.12)',
      borderRadius: 10,
      padding: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
        Try it
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="mk_your_api_key_here"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '8px 12px',
            color: '#e2e8f0', fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            background: loading ? 'rgba(99,102,241,0.3)' : '#6366f1',
            border: 'none', borderRadius: 6,
            padding: '8px 20px', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>
      {endpoint.method === 'POST' && endpoint.body && (
        <textarea
          ref={bodyRef}
          defaultValue={endpoint.body}
          style={{
            width: '100%', minHeight: 60,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '8px 12px',
            color: '#e2e8f0', fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none', resize: 'vertical',
            marginBottom: 10,
          }}
        />
      )}
      {response && <CodeBlock code={response} />}
    </div>
  );
}

// ── Endpoint card ──────────────────────────────────────────────────────────────

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const [showTryIt, setShowTryIt] = useState(false);
  const mc = METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET;

  const curlExample = endpoint.method === 'GET'
    ? `curl -H "X-Api-Key: mk_YOUR_KEY" \\\n  "https://www.majorka.io${endpoint.path.replace(/:(\w+)/g, '{$1}').replace(/\?q=<query>/, '?q=kitchen')}"`
    : `curl -X ${endpoint.method} \\\n  -H "X-Api-Key: mk_YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${endpoint.body || '{}'}' \\\n  "https://www.majorka.io${endpoint.path.replace(/:(\w+)/g, '{$1}')}"`;

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: '14px 16px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          display: 'inline-block',
          background: mc.bg, color: mc.text,
          border: `1px solid ${mc.border}`,
          borderRadius: 5, padding: '3px 8px',
          fontSize: 11, fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: 52, textAlign: 'center',
        }}>
          {endpoint.method}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, color: '#e2e8f0', fontWeight: 500,
        }}>
          {endpoint.path}
        </span>
        <span style={{
          fontSize: 12, color: '#64748b',
          fontFamily: "'DM Sans', sans-serif",
          marginLeft: 'auto',
          paddingLeft: 12,
          whiteSpace: 'nowrap',
        }}>
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: '12px 0', fontFamily: "'DM Sans', sans-serif" }}>
            {endpoint.description}
          </p>

          {/* Parameters table */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                Parameters
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map((p) => (
                      <tr key={p.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                          {p.name}
                          {p.required && <span style={{ color: '#ef4444', marginLeft: 4, fontSize: 10 }}>*</span>}
                        </td>
                        <td style={{ padding: '6px 10px', color: '#818cf8' }}>{p.type}</td>
                        <td style={{ padding: '6px 10px', color: '#94a3b8' }}>
                          {p.description}
                          {p.default && <span style={{ color: '#64748b' }}> Default: <code style={{ color: '#818cf8' }}>{p.default}</code></span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request body */}
          {endpoint.body && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                Request Body
              </div>
              <CodeBlock code={endpoint.body} />
            </div>
          )}

          {/* cURL example */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
              cURL Example
            </div>
            <CodeBlock code={curlExample} lang="bash" />
          </div>

          {/* Example response */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
              Example Response
            </div>
            <CodeBlock code={endpoint.example_response} />
          </div>

          {/* Try it */}
          <button
            onClick={() => setShowTryIt(!showTryIt)}
            style={{
              background: showTryIt ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8, padding: '8px 16px',
              color: '#818cf8', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {showTryIt ? 'Hide' : 'Try it'}
          </button>
          {showTryIt && <TryIt endpoint={endpoint} />}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DocsPlaceholder() {
  const [activeSection, setActiveSection] = useState('products');

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .mj-docs-root { flex-direction: column !important; }
          .mj-docs-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            padding: 16px 16px 12px !important;
            display: flex !important;
            overflow-x: auto !important;
            scrollbar-width: none;
            flex-wrap: nowrap !important;
            gap: 4px;
          }
          .mj-docs-sidebar::-webkit-scrollbar { display: none; }
          .mj-docs-sidebar > div:first-child { display: none !important; }
          .mj-docs-sidebar button { flex-shrink: 0 !important; white-space: nowrap; }
          .mj-docs-content { padding: 24px 16px !important; }
        }
      `}</style>
      <div className="mj-docs-root" style={{ display: 'flex', minHeight: '100vh', background: '#04060f' }}>
        {/* Sidebar */}
        <div className="mj-docs-sidebar" style={{
          width: 240, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 16px',
          position: 'sticky', top: 0, height: '100vh',
          overflowY: 'auto',
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'Syne', 'Nohemi', sans-serif",
              fontSize: 16, fontWeight: 800, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 4,
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: '#fff',
              }}>M</span>
              API Docs
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#64748b' }}>
              v1 - REST
            </div>
          </div>

          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)',
            marginBottom: 8,
          }}>
            Endpoints
          </div>

          {ENDPOINT_GROUPS.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveSection(group.id)}
              style={{
                display: 'block', width: '100%',
                textAlign: 'left', padding: '8px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeSection === group.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                borderLeft: activeSection === group.id ? '3px solid #6366f1' : '3px solid transparent',
                color: activeSection === group.id ? '#818cf8' : 'rgba(255,255,255,0.55)',
                fontWeight: activeSection === group.id ? 700 : 400,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.1s',
                marginBottom: 2,
              }}
            >
              {group.title}
              <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>
                {group.endpoints.length}
              </span>
            </button>
          ))}

          {/* Auth section */}
          <div style={{
            marginTop: 24, padding: 12,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 6 }}>
              Authentication
            </div>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              All requests require an API key via <code style={{ color: '#818cf8', fontSize: 10 }}>X-Api-Key</code> header.
            </p>
            <a
              href="/app/settings/profile"
              style={{
                display: 'inline-block', marginTop: 8,
                fontSize: 11, fontWeight: 600, color: '#6366f1',
                textDecoration: 'none',
              }}
            >
              Get your key
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="mj-docs-content" style={{ flex: 1, padding: '40px 48px', maxWidth: 860, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: '#6366f1',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.12em',
            }}>
              MAJORKA API v1
            </span>
            <h1 style={{
              fontFamily: "'Syne', 'Nohemi', sans-serif",
              fontSize: 32, fontWeight: 800, color: '#fff',
              margin: '8px 0 12px', lineHeight: 1.2,
            }}>
              Product Intelligence API
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15, color: '#94a3b8', lineHeight: 1.6,
              maxWidth: 600,
            }}>
              Access real-time scored product data, AI-powered briefs, and ad generation programmatically.
              No competitor offers a live-scored product API with AI creative generation.
            </p>
          </div>

          {/* Quick start */}
          <div style={{
            background: 'rgba(99,102,241,0.04)',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: 12, padding: 20,
            marginBottom: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>
              Quick Start
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
              <strong style={{ color: '#e2e8f0' }}>1.</strong> Generate an API key in <a href="/app/settings/profile" style={{ color: '#6366f1', textDecoration: 'none' }}>Settings</a><br />
              <strong style={{ color: '#e2e8f0' }}>2.</strong> Include it as <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#818cf8' }}>X-Api-Key: mk_your_key</code> header<br />
              <strong style={{ color: '#e2e8f0' }}>3.</strong> All endpoints live at <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#818cf8' }}>https://www.majorka.io/v1/</code><br />
              <strong style={{ color: '#e2e8f0' }}>4.</strong> Responses use a standard envelope: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#818cf8' }}>{'{ ok, data, meta }'}</code>
            </div>
            <div style={{ marginTop: 14 }}>
              <CodeBlock code={`curl -H "X-Api-Key: mk_YOUR_KEY" \\
  "https://www.majorka.io/v1/products?min_score=80&limit=5"`} lang="bash" />
            </div>
          </div>

          {/* Rate limits */}
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 20,
            marginBottom: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>
              Rate Limits
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Plan</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Requests/min</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>AI Endpoints</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 600 }}>Builder</td>
                    <td style={{ padding: '8px 12px', color: '#10b981' }}>100</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>10/min</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>$99/mo AUD</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 600 }}>Scale</td>
                    <td style={{ padding: '8px 12px', color: '#10b981' }}>500</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>50/min</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>$199/mo AUD</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 10, lineHeight: 1.5 }}>
              Rate limit headers are included in every response:
              <code style={{ color: '#818cf8', marginLeft: 4 }}>X-RateLimit-Limit</code>,
              <code style={{ color: '#818cf8', marginLeft: 4 }}>X-RateLimit-Remaining</code>,
              <code style={{ color: '#818cf8', marginLeft: 4 }}>X-RateLimit-Reset</code>
            </p>
          </div>

          {/* Endpoint groups */}
          {ENDPOINT_GROUPS.filter((g) => g.id === activeSection).map((group) => (
            <div key={group.id} id={group.id}>
              <h2 style={{
                fontFamily: "'Syne', 'Nohemi', sans-serif",
                fontSize: 22, fontWeight: 800, color: '#fff',
                margin: '0 0 8px',
              }}>
                {group.title}
              </h2>
              <p style={{
                fontSize: 14, color: '#94a3b8', lineHeight: 1.6,
                marginBottom: 20, fontFamily: "'DM Sans', sans-serif",
              }}>
                {group.description}
              </p>

              {group.endpoints.map((ep, i) => (
                <EndpointCard key={i} endpoint={ep} />
              ))}
            </div>
          ))}

          {/* Footer */}
          <div style={{
            marginTop: 48, paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 16, alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <a
              href="https://discord.gg/njVjqrG8"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
            >
              Discord Support
            </a>
            <a
              href="mailto:support@majorka.io"
              style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}
            >
              support@majorka.io
            </a>
            <span style={{ fontSize: 12, color: '#334155', marginLeft: 'auto' }}>
              Majorka API v1.0
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
