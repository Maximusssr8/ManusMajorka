// Fix 4 — Interactive API Explorer.
// Shows three "endpoints" rendered against the already-loaded useLandingData
// payload so there are no extra API calls. JSON streams in with a typewriter
// effect. Pure-function tokenizer for syntax highlighting (no libs).

import { useEffect, useMemo, useRef, useState } from 'react';
import { LT, F } from '@/lib/landingTokens';
import { useLandingData } from '@/lib/useLandingData';

type TabKey = 'products' | 'score' | 'trending';

interface Tab {
  key: TabKey;
  label: string;
  request: string;
  build: (data: ReturnType<typeof useLandingData>) => unknown;
}

const TABS: Tab[] = [
  {
    key: 'products',
    label: '/v1/products',
    request: 'GET /v1/products?category=pet&limit=3',
    build: (d) => ({
      ok: true,
      data: d.products.slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price_aud: p.price,
        orders: p.orders,
        score: p.score,
      })),
      meta: { total: d.stats?.total ?? 0, page: 1, limit: 3 },
    }),
  },
  {
    key: 'score',
    label: '/v1/products/:id/score',
    request: 'GET /v1/products/48291/score',
    build: (d) => {
      const p = d.products[0];
      return {
        ok: true,
        data: {
          id: p?.id ?? '48291',
          winning_score: p?.score ?? 92,
          market_split: { au: 42, us: 38, uk: 20 },
          orders_7d: p?.orders ?? 1240,
          verdict: 'breakout',
        },
      };
    },
  },
  {
    key: 'trending',
    label: '/v1/trending',
    request: 'GET /v1/trending?window=7d',
    build: (d) => ({
      ok: true,
      data: d.categories.slice(0, 4).map((c) => ({
        category: c.category,
        product_count: c.product_count,
        total_orders: c.total_orders,
      })),
      window: '7d',
    }),
  },
];

// ── Pure JSON tokenizer (30-ish lines, no deps). ────────────────────────────
type Token = { kind: 'key' | 'str' | 'num' | 'bool' | 'punct' | 'ws'; text: string };

function tokenizeJson(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const isWs = (ch: string) => ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r';
  while (i < src.length) {
    const ch = src[i];
    if (isWs(ch)) {
      let j = i;
      while (j < src.length && isWs(src[j])) j++;
      out.push({ kind: 'ws', text: src.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < src.length) j += 2;
        else j += 1;
      }
      j += 1; // closing quote
      // Key if followed (after whitespace) by ':'
      let k = j;
      while (k < src.length && isWs(src[k])) k++;
      const isKey = src[k] === ':';
      out.push({ kind: isKey ? 'key' : 'str', text: src.slice(i, j) });
      i = j;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '-') {
      let j = i;
      while (j < src.length && /[0-9eE+\-.]/.test(src[j])) j++;
      out.push({ kind: 'num', text: src.slice(i, j) });
      i = j;
      continue;
    }
    if (src.startsWith('true', i) || src.startsWith('false', i) || src.startsWith('null', i)) {
      const len = src[i] === 't' || src[i] === 'n' ? 4 : 5;
      out.push({ kind: 'bool', text: src.slice(i, i + len) });
      i += len;
      continue;
    }
    // punctuation: { } [ ] , :
    out.push({ kind: 'punct', text: ch });
    i += 1;
  }
  return out;
}

const TOKEN_COLORS: Record<Token['kind'], string> = {
  key: '#4f8ef7',
  str: '#9CA3AF',
  num: '#22C55E',
  bool: '#F59E0B',
  punct: '#6B7280',
  ws: '',
};

function ColouredJson({ text }: { text: string }) {
  const tokens = useMemo(() => tokenizeJson(text), [text]);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.kind === 'ws') return <span key={i}>{t.text}</span>;
        return (
          <span key={i} style={{ color: TOKEN_COLORS[t.kind] }}>
            {t.text}
          </span>
        );
      })}
    </>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function ApiExplorer() {
  const data = useLandingData();
  const [active, setActive] = useState<TabKey>('products');
  const [rendered, setRendered] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);

  const tab = TABS.find((t) => t.key === active) ?? TABS[0];
  const fullJson = useMemo(() => {
    try {
      return JSON.stringify(tab.build(data), null, 2);
    } catch {
      return '{}';
    }
  }, [tab, data]);

  // Typewriter effect: 120 chars/sec.
  useEffect(() => {
    setRendered('');
    setCopied(false);
    if (!fullJson) return;
    const charsPerSec = 120;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsedSec = (now - start) / 1000;
      const target = Math.min(fullJson.length, Math.floor(elapsedSec * charsPerSec));
      setRendered(fullJson.slice(0, target));
      if (target < fullJson.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fullJson]);

  const onCopy = () => {
    void navigator.clipboard.writeText(fullJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section
      id="api-explorer"
      aria-label="Developer API explorer"
      style={{
        padding: '96px 20px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={pill}>DEVELOPER API</span>
        <h2 style={h2}>Real data. Real endpoints. Stream it yourself.</h2>
        <p style={sub}>
          Every number on this page is available to your dev team via a
          documented REST API. Try one below.
        </p>
      </div>

      <div
        style={{
          background: '#0a0a0a',
          border: `1px solid ${LT.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 10,
            borderBottom: `1px solid ${LT.border}`,
            background: '#070707',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'thin',
          }}
          className="mj-api-tabs"
        >
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                style={{
                  ...tabBtn,
                  color: isActive ? LT.gold : '#9CA3AF',
                  borderColor: isActive ? LT.gold : 'transparent',
                  background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                }}
                aria-pressed={isActive}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Request line */}
        <div
          style={{
            padding: '14px 20px',
            fontFamily: F.mono,
            fontSize: 13,
            color: LT.gold,
            borderBottom: `1px solid ${LT.border}`,
            background: '#090909',
            overflowX: 'auto',
          }}
        >
          {tab.request}
        </div>

        {/* Response JSON */}
        <div style={{ position: 'relative' }}>
          <pre
            aria-live="polite"
            style={{
              margin: 0,
              padding: '20px 20px 24px',
              fontFamily: F.mono,
              fontSize: 13,
              lineHeight: 1.6,
              color: '#9CA3AF',
              whiteSpace: 'pre',
              overflowX: 'auto',
              minHeight: 240,
              background: '#0a0a0a',
            }}
          >
            <ColouredJson text={rendered} />
            {rendered.length < fullJson.length && (
              <span
                style={{
                  display: 'inline-block',
                  width: 7,
                  height: 14,
                  background: LT.gold,
                  marginLeft: 2,
                  verticalAlign: 'middle',
                  animation: 'mjApiCaret 900ms steps(2, end) infinite',
                }}
              />
            )}
          </pre>

          <button
            type="button"
            onClick={onCopy}
            style={copyBtn}
            aria-label="Copy JSON response"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <a href="/docs" style={ghostCta}>Full API docs →</a>
      </div>

      <style>{`
        @keyframes mjApiCaret {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .mj-api-tabs::-webkit-scrollbar { height: 6px; }
        .mj-api-tabs::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 3px; }
      `}</style>
    </section>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const pill: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 12px',
  background: 'rgba(212,175,55,0.10)',
  border: `1px solid rgba(212,175,55,0.35)`,
  borderRadius: 999,
  color: LT.gold,
  fontFamily: F.mono,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 14,
};

const h2: React.CSSProperties = {
  fontFamily: F.display,
  fontSize: 'clamp(28px, 4.2vw, 44px)',
  fontWeight: 700,
  color: LT.text,
  margin: '0 0 14px',
  letterSpacing: '-0.02em',
};

const sub: React.CSSProperties = {
  fontFamily: F.body,
  fontSize: 17,
  lineHeight: 1.55,
  color: LT.textMute,
  margin: '0 auto',
  maxWidth: 600,
};

const tabBtn: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  border: `1px solid transparent`,
  borderRadius: 10,
  fontFamily: F.mono,
  fontSize: 12,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'color 180ms, background 180ms, border-color 180ms',
};

const copyBtn: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 14,
  padding: '6px 12px',
  background: 'rgba(212,175,55,0.08)',
  border: `1px solid rgba(212,175,55,0.35)`,
  borderRadius: 8,
  color: LT.gold,
  fontFamily: F.mono,
  fontSize: 11,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const ghostCta: React.CSSProperties = {
  padding: '12px 22px',
  border: `1px solid ${LT.border}`,
  borderRadius: 999,
  color: LT.text,
  fontFamily: F.mono,
  fontSize: 12,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  transition: 'border-color 180ms, color 180ms',
};
