// Innovation 1 — Interactive "Score Any Product"
// Let visitors paste ANY AliExpress URL and get a live score WITHOUT signing up.
// No other dropshipping tool does this on their landing page.

import { useState, useRef } from 'react';
import { LT, F } from '@/lib/landingTokens';
import { Eyebrow, H2, CtaPrimary } from './shared';
import { useInViewFadeUp } from '../useInViewFadeUp';

interface QuickScoreResult {
  id: string | null;
  title: string;
  image: string | null;
  trendVelocity: number;
  orderEstimate: number;
  price: number;
  category: string;
  markets: { label: string; pct: number }[];
  sparkline: number[];
  brief: string;
  sampled: boolean;
}

type ScorerState = 'idle' | 'loading' | 'result' | 'error';

const ALIEXPRESS_PATTERN = /aliexpress\.com/i;

function MiniSparkline({ data }: { data: number[] }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block' }}>
      <polyline
        points={points}
        stroke={LT.cobalt}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={LT.cobalt} stopOpacity="0.2" />
        <stop offset="100%" stopColor={LT.cobalt} stopOpacity="0" />
      </linearGradient>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sparkGrad)"
      />
    </svg>
  );
}

export function ProductScorer() {
  const fade = useInViewFadeUp();
  const [url, setUrl] = useState('');
  const [state, setState] = useState<ScorerState>('idle');
  const [result, setResult] = useState<QuickScoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleScore() {
    const trimmed = url.trim();
    if (!trimmed || !ALIEXPRESS_PATTERN.test(trimmed)) {
      setErrorMsg('Paste a valid AliExpress product URL');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMsg('');
    setResult(null);

    try {
      const resp = await fetch(`/api/public/quick-score?url=${encodeURIComponent(trimmed)}`);
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setState('result');
    } catch {
      setErrorMsg("We couldn't score that one. Try another product or explore our database.");
      setState('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleScore();
  }

  const scoreColor = (v: number) =>
    v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#f97316';

  return (
    <section
      ref={fade.ref}
      style={{
        ...fade.style,
        background: '#0a0d14',
        borderTop: '1px solid #161b22',
        borderBottom: '1px solid #161b22',
        padding: '80px 24px',
        width: '100%',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Eyebrow center>TRY IT NOW</Eyebrow>
        <H2 style={{ textAlign: 'center', marginBottom: 4 }}>
          Score any AliExpress product.
        </H2>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#8b949e',
          margin: '0 0 32px 0',
          textAlign: 'center',
        }}>
          Right here. No signup.
        </p>

        {/* Input + Button */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (state === 'error') setState('idle'); }}
            onKeyDown={handleKeyDown}
            placeholder="Paste any AliExpress product URL..."
            aria-label="AliExpress product URL"
            style={{
              flex: 1,
              minWidth: 0,
              background: '#0d1117',
              border: '1px solid #161b22',
              borderRadius: 12,
              padding: '16px 18px',
              fontFamily: F.body,
              fontSize: 15,
              color: '#E0E0E0',
              outline: 'none',
              transition: 'border-color 150ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = LT.cobalt; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#161b22'; }}
          />
          <button
            onClick={handleScore}
            disabled={state === 'loading'}
            aria-label="Score this product"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '16px 28px',
              background: LT.cobalt,
              color: '#000',
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              borderRadius: 12,
              cursor: state === 'loading' ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 10px 40px -8px rgba(79,142,247,0.55)',
              transition: 'transform 150ms, filter 150ms',
              opacity: state === 'loading' ? 0.7 : 1,
            }}
          >
            {state === 'loading' ? 'Scoring...' : 'Score it →'}
          </button>
        </div>

        {/* Error */}
        {state === 'error' && errorMsg && (
          <p style={{
            fontFamily: F.body,
            fontSize: 14,
            color: '#f97316',
            marginTop: 12,
            textAlign: 'center',
          }}>
            {errorMsg}
          </p>
        )}

        {/* Loading skeleton */}
        {state === 'loading' && (
          <div style={{
            marginTop: 24,
            background: '#0d1117',
            border: '1px solid #161b22',
            borderRadius: 16,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            {[180, 120, 200].map((w, i) => (
              <div
                key={i}
                style={{
                  width: w,
                  height: 16,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #161b22 25%, #1c2333 50%, #161b22 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            ))}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
          </div>
        )}

        {/* Result card */}
        {state === 'result' && result && (
          <div style={{
            marginTop: 24,
            background: '#0d1117',
            border: '1px solid rgba(79,142,247,0.15)',
            borderRadius: 16,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            {/* Top row: title + score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: F.body,
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#E0E0E0',
                  margin: 0,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {result.title}
                </p>
                <p style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#6B7280',
                  margin: '6px 0 0',
                }}>
                  {result.category}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 48,
                  fontWeight: 800,
                  color: scoreColor(result.trendVelocity),
                  lineHeight: 1,
                }}>
                  {result.trendVelocity}
                </span>
                <span style={{
                  fontFamily: F.mono,
                  fontSize: 12,
                  color: '#6B7280',
                  display: 'block',
                  marginTop: 2,
                }}>
                  / 100
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 16,
              borderTop: '1px solid #161b22',
              paddingTop: 16,
            }}>
              <div>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Orders
                </span>
                <p style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, color: '#E0E0E0', margin: '4px 0 0' }}>
                  {result.orderEstimate.toLocaleString('en-AU')}
                </p>
              </div>
              <div>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Price
                </span>
                <p style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, color: '#E0E0E0', margin: '4px 0 0' }}>
                  ${result.price.toFixed(2)} AUD
                </p>
              </div>
              {result.markets.length > 0 && (
                <div>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Top Market
                  </span>
                  <p style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, color: '#E0E0E0', margin: '4px 0 0' }}>
                    {result.markets.sort((a, b) => b.pct - a.pct)[0].label} {result.markets.sort((a, b) => b.pct - a.pct)[0].pct}%
                  </p>
                </div>
              )}
            </div>

            {/* Sparkline */}
            {result.sparkline.length > 0 && (
              <div style={{ borderTop: '1px solid #161b22', paddingTop: 12 }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  30-day trend
                </span>
                <div style={{ marginTop: 6 }}>
                  <MiniSparkline data={result.sparkline} />
                </div>
              </div>
            )}

            {/* Badge + brief */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {result.trendVelocity >= 80 && (
                <span style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#10b981',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 100,
                  padding: '4px 10px',
                }}>
                  {result.trendVelocity >= 90 ? '🔥 HOT' : '📈 TRENDING'}
                </span>
              )}
              {result.sampled && (
                <span style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: '#f59e0b',
                  letterSpacing: '0.08em',
                }}>
                  Sampled score — sign up for live scoring
                </span>
              )}
            </div>

            {/* Brief */}
            <p style={{
              fontFamily: F.body,
              fontSize: 14,
              color: '#9CA3AF',
              margin: 0,
              lineHeight: 1.6,
            }}>
              {result.brief}
            </p>

            {/* CTA */}
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <CtaPrimary href="/sign-up" style={{ fontSize: 14, padding: '14px 24px' }}>
                Want to see 4,155+ more? →
              </CtaPrimary>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
