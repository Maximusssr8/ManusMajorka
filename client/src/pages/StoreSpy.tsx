import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import UsageCounter from '@/components/UsageCounter';
import UpgradePromptBanner from '@/components/UpgradePromptBanner';

// ── Simple markdown-to-HTML converter ────────────────────────────────────────

function md(text: string): string {
  return (
    text
      // Tables: convert | col | col | rows
      .replace(/^\|(.+)\|$/gm, (_, row: string) => {
        const cells = row
          .split('|')
          .map((c: string) => c.trim())
          .filter(Boolean);
        return `<tr>${cells.map((c: string) => `<td style="padding:8px 12px;border:1px solid #F9FAFB">${c}</td>`).join('')}</tr>`;
      })
      // Wrap consecutive <tr> in <table>
      .replace(/((?:<tr>.*<\/tr>\n?)+)/g, (block: string) => {
        // Remove separator rows (---)
        const cleaned = block.replace(/<tr><td[^>]*>-+<\/td>.*?<\/tr>\n?/g, '');
        if (!cleaned.trim()) return '';
        return `<table style="width:100%;border-collapse:collapse;margin:12px 0">${cleaned}</table>`;
      })
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0A0A0A">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Unordered lists
      .replace(/^[-•] (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
      // Ordered lists
      .replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
      // Wrap consecutive <li> in <ul>
      .replace(
        /((?:<li[^>]*>.*<\/li>\n?)+)/g,
        '<ul style="list-style:disc;padding-left:20px;margin:8px 0">$1</ul>'
      )
      // ### H3
      .replace(
        /^### (.+)$/gm,
        `<h3 style="font-family: 'Syne', sans-serif;font-size:16px;font-weight:600;color:#4f8ef7;margin:16px 0 8px">$1</h3>`
      )
      // Paragraphs (non-empty lines that aren't already HTML)
      .replace(/^(?!<)((?!<).+)$/gm, '<p style="margin:6px 0;line-height:1.7">$1</p>')
  );
}

// Minimal XSS sanitizer for AI-generated markdown output
const sanitizeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');

// ── Split report into sections by ## headers ─────────────────────────────────

function splitSections(report: string): { title: string; body: string }[] {
  const parts = report.split(/^## /gm).filter(Boolean);
  return parts.map((part) => {
    const newline = part.indexOf('\n');
    if (newline === -1) return { title: part.trim(), body: '' };
    return {
      title: part.slice(0, newline).trim(),
      body: part.slice(newline + 1).trim(),
    };
  });
}

// ── Progress steps ───────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  'Scraping store data...',
  'Analysing products and pricing...',
  'Generating intelligence report...',
];

// ── Feature cards for empty state ────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Product & Pricing Intel',
    description: 'See their full product catalogue, price ranges, and bestsellers at a glance.',
  },
  {
    title: 'Trust Signal Audit',
    description:
      'Reviews, payment badges, guarantees — know exactly how they build buyer confidence.',
  },
  {
    title: 'Ad Spend Signals',
    description: 'Detect signs of paid traffic, retargeting pixels, and active campaign patterns.',
  },
  {
    title: 'Gaps & Opportunities',
    description: "AI-identified weaknesses you can exploit and market angles they're missing.",
  },
  {
    title: 'AU-Specific Insights',
    description: 'Shipping, payment methods, and positioning evaluated for the Australian market.',
  },
  {
    title: 'Actionable Report',
    description:
      'A complete intelligence brief you can use immediately to out-position competitors.',
  },
];

const EXAMPLE_STORES = [
  'https://gymshark.com',
  'https://cultbeauty.com.au',
  'https://frankbody.com',
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function StoreSpy() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progress step animation
  useEffect(() => {
    if (loading) {
      setProgressIndex(0);
      intervalRef.current = setInterval(() => {
        setProgressIndex((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
      }, 4000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  const analyse = async (storeUrl?: string) => {
    const target = storeUrl || url.trim();
    if (!target) return;
    if (storeUrl) setUrl(target);

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/store-spy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: target }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setReport(data.report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sections = report ? splitSections(report) : [];

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    background: '#05070F',
    minHeight: '100vh',
    padding: '32px 16px 80px',
    fontFamily: 'DM Sans, sans-serif',
    color: '#F8FAFC',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 960,
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: '#0d0d10',
    border: '1px solid #F9FAFB',
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Usage Counter */}
        <UsageCounter />
        <UpgradePromptBanner />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 700,
              color: '#F8FAFC',
              margin: 0,
            }}
          >
            Store Spy
          </h1>
          <p
            style={{
              color: '#94A3B8',
              fontSize: 16,
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            Enter any Shopify store URL to get a full competitor intelligence report
          </p>
        </div>

        {/* ── URL Input ───────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, marginBottom: 32 }}>
          <div className="input-btn-row">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                }}
              />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) analyse();
                }}
                placeholder="e.g. https://example.myshopify.com"
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#05070F',
                  border: '1px solid #F9FAFB',
                  borderRadius: 10,
                  padding: '14px 14px 14px 42px',
                  fontSize: 15,
                  color: '#F8FAFC',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            <button
              onClick={() => analyse()}
              disabled={loading || !url.trim()}
              style={{
                background: loading || !url.trim() ? '#9CA3AF' : '#4f8ef7',
                color: loading || !url.trim() ? '#6B7280' : '#FAFAFA',
                border: 'none',
                borderRadius: 10,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s, transform 0.1s',
              }}
            >
              {loading ? 'Analysing...' : 'Analyse Store'}
            </button>
          </div>
        </div>

        {/* ── Loading State ───────────────────────────────────────────── */}
        {loading && (
          <div style={{ ...cardStyle, marginBottom: 32, textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                width: 40,
                height: 40,
                border: '3px solid rgba(79,142,247,0.2)',
                borderTopColor: '#4f8ef7',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 20,
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              {PROGRESS_STEPS.map((step, i) => {
                const isActive = i === progressIndex;
                const isDone = i < progressIndex;
                return (
                  <div
                    key={step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      opacity: isDone ? 0.5 : isActive ? 1 : 0.3,
                      transition: 'opacity 0.4s',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isDone ? '#22c55e' : isActive ? '#4f8ef7' : '#9CA3AF',
                        transition: 'background 0.4s',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        color: isActive ? '#0A0A0A' : '#6B7280',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error State ─────────────────────────────────────────────── */}
        {error && !loading && (
          <div
            style={{
              ...cardStyle,
              marginBottom: 32,
              borderColor: 'rgba(239,68,68,0.3)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#ef4444',
                fontSize: 15,
                fontWeight: 500,
                margin: '0 0 8px',
              }}
            >
              Analysis failed
            </p>
            <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── Report ──────────────────────────────────────────────────── */}
        {report && sections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {sections.map((section) => (
              <div key={section.title} style={cardStyle}>
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#4f8ef7',
                    margin: '0 0 16px',
                  }}
                >
                  {section.title}
                </h2>
                <div
                  style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(md(section.body)) }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty / Initial State ───────────────────────────────────── */}
        {!loading && !report && !error && (
          <div>
            {/* Feature cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: 16,
                marginBottom: 40,
              }}
            >
              {FEATURES.map((f) => (
                <div key={f.title} style={cardStyle}>
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#F8FAFC',
                      margin: '0 0 8px',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      color: '#94A3B8',
                      fontSize: 13,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {f.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Example stores */}
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Try an example
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {EXAMPLE_STORES.map((store) => (
                  <button
                    key={store}
                    onClick={() => analyse(store)}
                    style={{
                      background: 'rgba(79,142,247,0.08)',
                      border: '1px solid rgba(79,142,247,0.2)',
                      borderRadius: 8,
                      padding: '8px 16px',
                      color: '#4f8ef7',
                      fontSize: 13,
                      fontFamily: 'DM Sans, sans-serif',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {store.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
