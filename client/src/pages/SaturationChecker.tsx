import { Activity } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import UsageCounter from '@/components/UsageCounter';
import UpgradePromptBanner from '@/components/UpgradePromptBanner';

// ── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(md: string): string {
  const html = md
    // headings
    .replace(
      /^## (.+)$/gm,
      '<h2 style="font-family:Syne,sans-serif;font-size:1.25rem;font-weight:700;color:#f5f5f5;margin:1.5rem 0 0.75rem">$1</h2>'
    )
    .replace(
      /^### (.+)$/gm,
      '<h3 style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:600;color:#f5f5f5;margin:1.25rem 0 0.5rem">$1</h3>'
    )
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f5f5f5;font-weight:600">$1</strong>')
    // bullet lists
    .replace(
      /^- (.+)$/gm,
      '<li style="margin-left:1.25rem;padding:0.15rem 0;color:#a1a1aa;list-style-type:disc">$1</li>'
    )
    // tables
    .replace(/^\|(.+)\|$/gm, (_match, inner: string) => {
      const cells = inner.split('|').map((c: string) => c.trim());
      const row = cells
        .map(
          (c: string) =>
            `<td style="padding:0.5rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.06);color:#a1a1aa">${c}</td>`
        )
        .join('');
      return `<tr>${row}</tr>`;
    })
    // wrap consecutive <tr> in table
    .replace(
      /((?:<tr>.*<\/tr>\n?)+)/g,
      '<table style="width:100%;border-collapse:collapse;margin:0.75rem 0;font-size:0.875rem">$1</table>'
    )
    // separator rows in tables (remove them)
    .replace(/<tr><td[^>]*>[-:]+<\/td>(?:<td[^>]*>[-:]+<\/td>)*<\/tr>/g, '')
    // paragraphs — wrap loose lines
    .replace(
      /^(?!<[hluot])(.*\S.*)$/gm,
      '<p style="color:#a1a1aa;line-height:1.7;margin:0.4rem 0">$1</p>'
    );

  return html;
}

// ── Types ────────────────────────────────────────────────────────────────────

type SaturationLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERSATURATED';

interface SaturationResult {
  product: string;
  score: number;
  level: SaturationLevel;
  report: string;
  opportunity: string;
}

// ── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<SaturationLevel, { color: string; label: string; desc: string }> = {
  LOW: { color: '#10b981', label: 'Low', desc: 'Low competition — good opportunity' },
  MEDIUM: {
    color: '#f59e0b',
    label: 'Medium',
    desc: 'Moderate competition — differentiation needed',
  },
  HIGH: { color: '#f97316', label: 'High', desc: 'High competition — strong USP required' },
  OVERSATURATED: {
    color: '#ef4444',
    label: 'Oversaturated',
    desc: 'Market is crowded — consider alternatives',
  },
};

const LOADING_STEPS = [
  'Searching AU market...',
  'Analysing competition...',
  'Evaluating trend direction...',
  'Calculating saturation...',
  'Generating report...',
];

const STORAGE_KEY = 'majorka-saturation-recent';

// ── Component ────────────────────────────────────────────────────────────────

export default function SaturationChecker() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<SaturationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentChecks, setRecentChecks] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recent checks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecentChecks(JSON.parse(stored));
    } catch {
      /* ignore */
    }

    // Maya prefill — agentic navigation
    const mayaPrefill = sessionStorage.getItem('maya_prefill_saturation-checker');
    if (mayaPrefill) {
      try {
        const data = JSON.parse(mayaPrefill);
        if (data.product) {
          setProduct(data.product);
          sessionStorage.removeItem('maya_prefill_saturation-checker');
          // Auto-check after a short delay
          setTimeout(() => {
            const form = document.querySelector<HTMLFormElement>('[data-saturation-form]');
            if (form) form.requestSubmit();
          }, 800);
        }
      } catch {
        /* ignore */
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveRecent(name: string) {
    const updated = [
      name,
      ...recentChecks.filter((c) => c.toLowerCase() !== name.toLowerCase()),
    ].slice(0, 5);
    setRecentChecks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Loading step animation
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      intervalRef.current = setInterval(() => {
        setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
      }, 1800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  async function handleCheck() {
    const trimmed = product.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/saturation-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ product: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
      saveRecent(trimmed);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Split report by ## headings into sections
  function getReportSections(report: string): { title: string; body: string }[] {
    const parts = report.split(/^## /gm).filter(Boolean);
    return parts.map((part) => {
      const newline = part.indexOf('\n');
      if (newline === -1) return { title: part.trim(), body: '' };
      return { title: part.slice(0, newline).trim(), body: part.slice(newline + 1).trim() };
    });
  }

  const levelConf = result ? LEVEL_CONFIG[result.level] : null;

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#060608',
    fontFamily: 'DM Sans, sans-serif',
    color: '#f5f5f5',
    padding: '1.5rem 1rem 5rem',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 800,
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: '#0c0c10',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '1.5rem',
    marginBottom: '1.25rem',
  };

  const goldButton: React.CSSProperties = {
    background: '#6366F1',
    color: '#060608',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 700,
    fontSize: '0.95rem',
    border: 'none',
    borderRadius: 12,
    padding: '0.75rem 2rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '0.75rem 1rem',
    color: '#f5f5f5',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.95rem',
    outline: 'none',
  };

  const chipStyle: React.CSSProperties = {
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 20,
    padding: '0.35rem 0.85rem',
    color: '#6366F1',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'background 0.2s',
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Usage Counter */}
        <UsageCounter />
        <UpgradePromptBanner />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 20,
              padding: '0.3rem 0.9rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#6366F1',
              fontFamily: 'Syne, sans-serif',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}
          >
            AU EXCLUSIVE
          </span>
          <h1
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
              fontWeight: 800,
              color: '#f5f5f5',
              margin: '0.5rem 0 0.75rem',
              lineHeight: 1.15,
            }}
          >
            Saturation Checker
          </h1>
          <p
            style={{
              color: '#a1a1aa',
              fontSize: '1.05rem',
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Find out if a product is oversaturated in Australia before you invest
          </p>
        </div>

        {/* Input Section */}
        <div style={cardStyle}>
          <div className="input-btn-row">
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleCheck()}
              placeholder="e.g. Posture Corrector, LED Face Mask, Portable Blender"
              style={inputStyle}
              disabled={loading}
            />
            <button
              onClick={handleCheck}
              disabled={loading || !product.trim()}
              style={{
                ...goldButton,
                opacity: loading || !product.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Checking...' : 'Check Saturation'}
            </button>
          </div>

          {/* Recent checks */}
          {recentChecks.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#52525b', fontSize: '0.8rem' }}>Recent:</span>
              {recentChecks.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setProduct(name);
                  }}
                  style={chipStyle}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <Activity
              style={{
                width: 36,
                height: 36,
                color: '#6366F1',
                margin: '0 auto 1.25rem',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div style={{ marginBottom: '1.5rem' }}>
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  style={{
                    padding: '0.4rem 0',
                    fontSize: '0.9rem',
                    color: i < loadingStep ? '#52525b' : i === loadingStep ? '#6366F1' : '#52525b',
                    fontWeight: i === loadingStep ? 600 : 400,
                    opacity: i <= loadingStep ? 1 : 0.3,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {i < loadingStep ? '\u2713' : i === loadingStep ? '\u25CF' : '\u25CB'} {step}
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                  background: '#6366F1',
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              ...cardStyle,
              borderColor: 'rgba(239,68,68,0.3)',
              textAlign: 'center',
              color: '#ef4444',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{error}</p>
            <button
              onClick={handleCheck}
              style={{
                ...goldButton,
                marginTop: '1rem',
                fontSize: '0.85rem',
                padding: '0.5rem 1.5rem',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {result && levelConf && (
          <>
            {/* Saturation Level Gauge + Score */}
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              {/* Score circle */}
              <div
                style={{
                  position: 'relative',
                  width: 140,
                  height: 140,
                  margin: '0 auto 1.5rem',
                }}
              >
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke={levelConf.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 377} 377`}
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: levelConf.color,
                      lineHeight: 1,
                    }}
                  >
                    {result.score}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#52525b', marginTop: 2 }}>/ 100</div>
                </div>
              </div>

              {/* Level indicator */}
              <div
                style={{
                  display: 'inline-block',
                  background: `${levelConf.color}15`,
                  border: `1px solid ${levelConf.color}40`,
                  borderRadius: 12,
                  padding: '0.5rem 1.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: levelConf.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {levelConf.label}
                </span>
              </div>
              <p style={{ color: '#a1a1aa', fontSize: '0.95rem', margin: '0.5rem 0 0' }}>
                {levelConf.desc}
              </p>

              {/* Gauge bar */}
              <div style={{ maxWidth: 400, margin: '1.5rem auto 0' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: '#52525b',
                    marginBottom: 6,
                  }}
                >
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Oversaturated</span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'linear-gradient(to right, #10b981, #f59e0b, #f97316, #ef4444)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${result.score}%`,
                      top: -4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: levelConf.color,
                      border: '2px solid #0c0c10',
                      transform: 'translateX(-50%)',
                      transition: 'left 1s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Window of Opportunity */}
            {result.opportunity && (
              <div
                style={{
                  ...cardStyle,
                  borderColor: 'rgba(99,102,241,0.2)',
                  background: 'rgba(99,102,241,0.04)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#6366F1',
                    marginBottom: '0.75rem',
                  }}
                >
                  Window of Opportunity
                </div>
                <div
                  style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '0.95rem' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(result.opportunity) }}
                />
              </div>
            )}

            {/* Report sections */}
            {result.report &&
              getReportSections(result.report).map((section, i) => (
                <div key={i} style={cardStyle}>
                  <h2
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: '#f5f5f5',
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {section.title}
                  </h2>
                  <div
                    style={{ fontSize: '0.9rem' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(section.body) }}
                  />
                </div>
              ))}
          </>
        )}

        {/* Initial state — feature cards */}
        {!loading && !result && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {[
              {
                title: 'Competition Analysis',
                desc: 'See how many AU sellers are already competing in this product space and their positioning.',
                icon: '\uD83D\uDD0D',
              },
              {
                title: 'Trend Direction',
                desc: 'Understand whether demand is rising, peaking, or declining in the Australian market.',
                icon: '\uD83D\uDCC8',
              },
              {
                title: 'Timing Verdict',
                desc: 'Get a clear recommendation on whether now is the right time to enter this niche.',
                icon: '\u23F0',
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  ...cardStyle,
                  textAlign: 'center',
                  padding: '2rem 1.25rem',
                  marginBottom: 0,
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{card.icon}</div>
                <h3
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#f5f5f5',
                    marginBottom: '0.5rem',
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
