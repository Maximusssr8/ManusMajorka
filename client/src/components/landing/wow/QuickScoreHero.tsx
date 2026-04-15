// Directive 1 — interactive public scorer.
// Visitor pastes an AliExpress URL (or picks a seeded chip) and gets back a
// live-looking scorecard in < 1.5s. Real data when the product is in the
// scored shortlist; transparent sampled data otherwise (sampled: true flag).

import { useCallback, useEffect, useRef, useState } from 'react';
import { LT, F, R, SHADOW } from '@/lib/landingTokens';
import { CountUp, MarketSplitBars, SparklineDraw, Typewriter, usePrefersReducedMotion } from '../primitives';

export interface QuickScoreResponse {
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
  sourceUrl: string;
}

interface Seed {
  id: string;
  title: string;
  image: string | null;
  category: string;
  url: string;
}

interface Props {
  externalUrl?: string | null; // set by TickerBar click
}

const FALLBACK_SEEDS: Seed[] = [
  { id: 'seed-pet', title: 'Pet', image: null, category: 'Pet', url: 'https://www.aliexpress.com/item/1005006000001.html' },
  { id: 'seed-kitchen', title: 'Kitchen', image: null, category: 'Kitchen', url: 'https://www.aliexpress.com/item/1005006000002.html' },
  { id: 'seed-home', title: 'Home Org', image: null, category: 'Home', url: 'https://www.aliexpress.com/item/1005006000003.html' },
  { id: 'seed-beauty', title: 'Beauty', image: null, category: 'Beauty', url: 'https://www.aliexpress.com/item/1005006000004.html' },
  { id: 'seed-fitness', title: 'Fitness', image: null, category: 'Fitness', url: 'https://www.aliexpress.com/item/1005006000005.html' },
  { id: 'seed-tech', title: 'Tech Gadget', image: null, category: 'Tech', url: 'https://www.aliexpress.com/item/1005006000006.html' },
];

export function QuickScoreHero({ externalUrl }: Props) {
  const [url, setUrl] = useState('');
  const [seeds, setSeeds] = useState<Seed[]>(FALLBACK_SEEDS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  // Load seeds once (real products from DB where possible).
  useEffect(() => {
    let alive = true;
    fetch('/api/public/quick-score/seeds', { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : { picks: [] }))
      .then((j) => {
        if (!alive) return;
        const picks = Array.isArray(j.picks) ? j.picks : [];
        if (picks.length >= 3) setSeeds(picks);
      })
      .catch(() => { /* keep fallback */ });
    return () => { alive = false; };
  }, []);

  const submit = useCallback(async (u: string) => {
    const trimmed = u.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`/api/public/quick-score?url=${encodeURIComponent(trimmed)}`, {
        credentials: 'omit',
      });
      if (r.status === 429) {
        setError('You\'ve hit the free scoring limit. Sign in for unlimited runs.');
        return;
      }
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      const data: QuickScoreResponse = await r.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // External URL (ticker click) re-runs the scorer.
  useEffect(() => {
    if (externalUrl) {
      setUrl(externalUrl);
      submit(externalUrl);
    }
  }, [externalUrl, submit]);

  const onChip = (s: Seed) => {
    setUrl(s.url);
    submit(s.url);
  };

  return (
    <div
      style={{
        background: LT.bgElevated,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
        padding: 24,
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: 100, background: LT.gold,
          animation: reduced ? undefined : 'mjLivePulse 1.6s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: F.mono, fontSize: 11, color: LT.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Live Scorer — No Signup
        </span>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(url); }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <input
          type="url"
          placeholder="https://www.aliexpress.com/item/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Paste an AliExpress product URL"
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            padding: '14px 16px',
            background: LT.bg,
            border: `1px solid ${LT.border}`,
            borderRadius: 10,
            color: LT.text,
            fontFamily: F.mono,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !url}
          style={{
            padding: '14px 22px',
            background: LT.gold,
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 10,
            fontFamily: F.body,
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? 'progress' : 'pointer',
            opacity: loading || !url ? 0.65 : 1,
            boxShadow: SHADOW.button,
            transition: 'opacity 150ms ease',
          }}
        >
          {loading ? 'Scoring…' : 'Score it'}
        </button>
      </form>

      <p style={{ margin: 0, color: LT.textMute, fontSize: 12, fontFamily: F.body }}>
        Try it. No signup. Real data from our scored shortlist.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {seeds.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChip(s)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${LT.border}`,
              borderRadius: 100,
              color: LT.textMute,
              fontFamily: F.mono,
              fontSize: 11,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = LT.gold; (e.currentTarget as HTMLButtonElement).style.color = LT.gold; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = LT.border; (e.currentTarget as HTMLButtonElement).style.color = LT.textMute; }}
          >
            {s.category || s.title}
          </button>
        ))}
      </div>

      {/* Result region */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" style={{ minHeight: 240 }}>
        {error && (
          <div style={{ padding: 16, border: `1px solid ${LT.error}`, borderRadius: R.card, color: LT.error, fontFamily: F.body, fontSize: 13 }}>
            {error}
          </div>
        )}
        {loading && !result && !error && (
          <div style={{ display: 'grid', placeItems: 'center', padding: 32, color: LT.textMute, fontFamily: F.mono, fontSize: 12 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 100, border: `2px solid ${LT.border}`,
              borderTopColor: LT.gold, animation: 'mjSpin 700ms linear infinite', marginBottom: 10,
            }} />
            Scoring product…
            <style>{`@keyframes mjSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {result && (
          <ResultCard key={result.sourceUrl} result={result} />
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: QuickScoreResponse }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        padding: 16,
        background: LT.bgCard,
        border: `1px solid ${LT.border}`,
        borderRadius: R.card,
      }}
      className="mj-grid-two"
    >
      <div style={{ display: 'grid', gap: 10 }}>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: LT.textMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Trend Velocity
        </span>
        <CountUp
          to={result.trendVelocity}
          duration={900}
          format={(v) => `${v}`}
          style={{ fontFamily: F.display, fontSize: 56, fontWeight: 800, color: LT.gold, lineHeight: 1 }}
        />
        <SparklineDraw values={result.sparkline} width={260} height={52} color={LT.gold} />
        <div style={{ marginTop: 6 }}>
          <MarketSplitBars data={result.markets} color={LT.gold} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <div style={{ fontFamily: F.body, fontSize: 14, color: LT.text, fontWeight: 600, lineHeight: 1.3 }}>
          {result.title}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat label="Orders / mo" value={result.orderEstimate.toLocaleString('en-AU')} />
          <Stat label="Price AUD" value={`$${result.price.toFixed(2)}`} />
        </div>
        <div style={{
          fontFamily: F.body, fontSize: 13, color: LT.textMute, lineHeight: 1.5,
          padding: 12, background: LT.bg, border: `1px solid ${LT.border}`, borderRadius: 10,
        }}>
          <Typewriter text={result.brief} speed={18} />
        </div>
        {result.sampled && (
          <div style={{ fontFamily: F.mono, fontSize: 10, color: LT.textDim, lineHeight: 1.5 }}>
            Sampled from our scored shortlist — sign in to see live scoring on any URL.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 10, background: LT.bg, border: `1px solid ${LT.border}`, borderRadius: 10 }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, color: LT.textMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: LT.text, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default QuickScoreHero;
