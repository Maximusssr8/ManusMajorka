import { useAuth } from '@/_core/hooks/useAuth';
/**
 * StoreHealthScore — FREE public lead-gen tool at /store-health
 * No login required. Rate limited at 3/IP/day on the backend.
 */

import { Activity, Lock, Shield } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0A0A0A',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  gold: '#6366F1',
  goldDim: 'rgba(99,102,241,0.10)',
  goldBorder: 'rgba(99,102,241,0.25)',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

interface HealthScoreResult {
  overall_score: number;
  niche_saturation: number;
  product_mix: number;
  pricing_competitiveness: number;
  seo_strength: number;
  social_proof: number;
  market_position: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  biggest_opportunity: string;
  top_3_issues: string[];
  estimated_monthly_revenue: number;
  competitor_advantage: string;
  summary: string;
}

const LOADING_STEPS = [
  { emoji: '🔍', text: 'Scanning store products...' },
  { emoji: '📊', text: 'Analysing market position...' },
  { emoji: '🏆', text: 'Comparing to 2,400+ AU stores...' },
  { emoji: '💡', text: 'Generating recommendations...' },
];

function gradeColor(grade: string) {
  if (grade === 'A') return C.green;
  if (grade === 'B') return C.gold;
  if (grade === 'C') return C.amber;
  return C.red;
}

function scoreIcon(score: number) {
  if (score >= 70) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: C.secondary, fontFamily: dm }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: dm, color: C.text }}>
          {scoreIcon(score)} {score}/100
        </span>
      </div>
      <div
        style={{
          background: '#F9FAFB',
          borderRadius: 6,
          height: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: `linear-gradient(90deg, ${C.gold}, #f0c84a)`,
            height: '100%',
            width: `${score}%`,
            borderRadius: 6,
            transition: 'width 1s ease',
          }}
        />
      </div>
    </div>
  );
}

function LoadingAnimation({ storeUrl }: { storeUrl: string }) {
  const { session } = useAuth();
    const [step, setStep] = useState(0);

  // CSS animation via useEffect-driven step progression
  const stepRef = useRef(step);
  stepRef.current = step;

  // Steps advance automatically via CSS animation delays — using a simple interval
  useState(() => {
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setStep(i + 1), i * 2000 + 500)
    );
    return () => timers.forEach(clearTimeout);
  });

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div
        style={{
          fontFamily: syne,
          fontSize: 22,
          fontWeight: 700,
          color: C.text,
          marginBottom: 8,
        }}
      >
        Analysing Your Store
      </div>
      <div style={{ color: C.muted, fontSize: 14, marginBottom: 40, fontFamily: dm }}>
        {storeUrl}
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        {LOADING_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step - 1 || (i === 0 && step === 0);
          const pct = done ? 100 : active ? 60 : 0;
          return (
            <div key={i} style={{ marginBottom: 20, opacity: i <= step ? 1 : 0.3, transition: 'opacity 0.4s' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 14, color: done ? C.gold : C.secondary, fontFamily: dm }}>
                  {s.emoji} {s.text}
                </span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: dm }}>{pct}%</span>
              </div>
              <div
                style={{
                  background: '#F9FAFB',
                  borderRadius: 6,
                  height: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: done
                      ? `linear-gradient(90deg, ${C.gold}, #f0c84a)`
                      : 'rgba(99,102,241,0.4)',
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 6,
                    transition: 'width 1.5s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32, color: C.muted, fontSize: 13, fontFamily: dm }}>
        Powered by Majorka AI · Usually takes 15–30 seconds
      </div>
    </div>
  );
}

function ResultsScreen({ result, storeUrl }: { result: HealthScoreResult; storeUrl: string }) {
  const gc = gradeColor(result.grade);

  const bars = [
    { label: 'Niche Saturation', score: result.niche_saturation },
    { label: 'Product Mix', score: result.product_mix },
    { label: 'Pricing', score: result.pricing_competitiveness },
    { label: 'SEO Strength', score: result.seo_strength },
    { label: 'Social Proof', score: result.social_proof },
    { label: 'Market Position', score: result.market_position },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Score circle + grade */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: dm, marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Your Store Health Score
        </div>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: `6px solid ${gc}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            background: `${gc}10`,
            boxShadow: `0 0 30px ${gc}30`,
          }}
        >
          <div
            style={{
              fontFamily: syne,
              fontSize: 40,
              fontWeight: 800,
              color: gc,
              lineHeight: 1,
            }}
          >
            {result.overall_score}
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: dm }}>/ 100</div>
        </div>
        <div
          style={{
            display: 'inline-block',
            background: `${gc}20`,
            border: `1px solid ${gc}50`,
            borderRadius: 8,
            padding: '4px 16px',
            fontFamily: syne,
            fontWeight: 700,
            fontSize: 18,
            color: gc,
            marginBottom: 16,
          }}
        >
          Grade: {result.grade}
        </div>
        {result.summary && (
          <p
            style={{
              color: C.secondary,
              fontSize: 15,
              fontStyle: 'italic',
              lineHeight: 1.6,
              maxWidth: 480,
              margin: '0 auto',
              fontFamily: dm,
            }}
          >
            "{result.summary}"
          </p>
        )}
      </div>

      {/* Score breakdown */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: syne,
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            marginBottom: 20,
          }}
        >
          Score Breakdown
        </div>
        {bars.map((b) => (
          <ScoreBar key={b.label} label={b.label} score={b.score} />
        ))}
      </div>

      {/* Top 3 Issues */}
      {result.top_3_issues?.length > 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid rgba(239,68,68,0.3)`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontFamily: syne,
              fontSize: 16,
              fontWeight: 700,
              color: C.text,
              marginBottom: 16,
            }}
          >
            Top Issues to Fix
          </div>
          {result.top_3_issues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                marginBottom: 10,
                fontSize: 14,
                color: C.text,
                fontFamily: dm,
              }}
            >
              <span>❌</span>
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Biggest Opportunity */}
      {result.biggest_opportunity && (
        <div
          style={{
            background: C.goldDim,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontFamily: syne,
              fontSize: 13,
              fontWeight: 700,
              color: C.gold,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            💡 Biggest Opportunity
          </div>
          <p style={{ color: C.text, fontSize: 15, lineHeight: 1.65, margin: 0, fontFamily: dm }}>
            {result.biggest_opportunity}
          </p>
        </div>
      )}

      {/* Revenue estimate */}
      {result.estimated_monthly_revenue > 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 32 }}>📈</div>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: dm, marginBottom: 4 }}>
              Estimated Monthly Revenue
            </div>
            <div
              style={{
                fontFamily: syne,
                fontSize: 22,
                fontWeight: 800,
                color: C.gold,
              }}
            >
              ${result.estimated_monthly_revenue.toLocaleString('en-AU')} AUD
            </div>
          </div>
        </div>
      )}

      {/* LOCKED SECTION */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 16,
          padding: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Blur overlay hint */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${C.gold}, #4F46E5)`,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Lock size={18} color={C.gold} />
          <div
            style={{
              fontFamily: syne,
              fontSize: 16,
              fontWeight: 700,
              color: C.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Full Competitive Analysis
          </div>
        </div>

        <ul
          style={{
            margin: '0 0 24px 0',
            padding: 0,
            listStyle: 'none',
          }}
        >
          {[
            'Your top 5 competitors (with revenue estimates)',
            'Exact products beating yours + their pricing',
            '30-day trend forecast for your niche',
            'Personalised product recommendations',
            'Step-by-step action plan to hit $10k/month',
          ].map((item) => (
            <li
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                fontSize: 14,
                color: C.secondary,
                fontFamily: dm,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <span style={{ color: C.gold }}>→</span>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/sign-in"
          style={{
            display: 'block',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`,
            color: '#000',
            borderRadius: 12,
            padding: '14px 24px',
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 15,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          Unlock Full Report — Start Free →
        </Link>

        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, fontFamily: dm }}>
          Used by 2,400+ AU sellers to find their edge.
        </div>
      </div>

      {/* Analyse another store */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#F9FAFB',
            border: `1px solid ${C.border}`,
            color: C.secondary,
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 13,
            fontFamily: dm,
            cursor: 'pointer',
          }}
        >
          ← Analyse Another Store
        </button>
      </div>
    </div>
  );
}

export default function StoreHealthScore() {
  const [storeUrl, setStoreUrl] = useState('');
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input');
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [error, setError] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');

  const handleAnalyse = async () => {
    const url = storeUrl.trim();
    if (!url) return;
    setError('');
    setSubmittedUrl(url);
    setPhase('loading');

    try {
      const res = await fetch('/api/tools/store-health-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl: url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Something went wrong. Please try again.');
        setPhase('input');
        return;
      }

      setResult(data);
      setPhase('result');
    } catch (err: any) {
      setError('Network error — please check your connection and try again.');
      setPhase('input');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: dm,
        padding: '0 0 80px',
      }}
    >
      <SEO
        title="Free Store Health Score — Analyse Your Shopify Store | Majorka"
        description="Get an instant AI-powered health score for your Shopify store. Score your niche fit, pricing, SEO strength, and social proof in 30 seconds. Free for AU dropshippers."
      />

      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: syne,
            fontWeight: 800,
            fontSize: 18,
            color: C.gold,
            textDecoration: 'none',
          }}
        >
          Majorka
        </Link>
        <Link
          href="/sign-in"
          style={{
            fontSize: 13,
            color: C.secondary,
            textDecoration: 'none',
            fontFamily: dm,
          }}
        >
          {session ? 'Go to Dashboard →' : 'Sign In →'}
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 0' }}>
        {phase === 'input' && (
          <>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 13, color: C.gold, fontFamily: syne, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                Free Tool
              </div>
              <h1
                style={{
                  fontFamily: syne,
                  fontSize: 'clamp(28px, 5vw, 44px)',
                  fontWeight: 800,
                  color: C.text,
                  margin: '0 0 16px',
                  lineHeight: 1.15,
                }}
              >
                🏥 Free Store Health Score
              </h1>
              <p
                style={{
                  color: C.secondary,
                  fontSize: 17,
                  lineHeight: 1.65,
                  maxWidth: 480,
                  margin: '0 auto 40px',
                  fontFamily: dm,
                }}
              >
                Enter your Shopify store URL and get an instant AI-powered health report in 30 seconds.
              </p>

              {/* Input */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  maxWidth: 520,
                  margin: '0 auto 16px',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyse()}
                  placeholder="https://yourstore.myshopify.com"
                  style={{
                    flex: 1,
                    background: C.card,
                    border: `1px solid ${C.goldBorder}`,
                    borderRadius: 12,
                    padding: '14px 18px',
                    fontSize: 15,
                    color: C.text,
                    fontFamily: dm,
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleAnalyse}
                  disabled={!storeUrl.trim()}
                  style={{
                    background: storeUrl.trim()
                      ? `linear-gradient(135deg, ${C.gold}, #4F46E5)`
                      : 'rgba(99,102,241,0.2)',
                    color: storeUrl.trim() ? '#000' : C.muted,
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 28px',
                    fontFamily: syne,
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: storeUrl.trim() ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  Analyse My Store →
                </button>
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    fontSize: 14,
                    color: '#fca5a5',
                    maxWidth: 520,
                    margin: '0 auto 16px',
                    fontFamily: dm,
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: C.muted,
                  fontFamily: dm,
                }}
              >
                <Shield size={12} />
                We never store your data · Powered by Majorka AI
              </div>
            </div>

            {/* Social proof bar */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 24,
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 16,
                  fontSize: 13,
                  color: C.secondary,
                }}
              >
                <Activity size={14} color={C.gold} />
                <span>
                  <strong style={{ color: C.text }}>247 stores</strong> analysed this week
                </span>
              </div>
              <blockquote
                style={{
                  margin: 0,
                  fontStyle: 'italic',
                  color: C.secondary,
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                "I had no idea my pricing was 34% above market until I got the health score."
                <br />
                <cite
                  style={{
                    fontStyle: 'normal',
                    color: C.muted,
                    fontSize: 13,
                    display: 'block',
                    marginTop: 8,
                  }}
                >
                  — Tom W., Perth WA
                </cite>
              </blockquote>
            </div>

            {/* What you'll get */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { emoji: '📊', label: 'Niche Saturation Score' },
                { emoji: '💰', label: 'Pricing Analysis' },
                { emoji: '🔍', label: 'SEO Assessment' },
                { emoji: '⭐', label: 'Social Proof Check' },
                { emoji: '💡', label: 'Top Opportunities' },
                { emoji: '🎯', label: 'Growth Action Plan' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: '16px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>
                  <div style={{ fontSize: 12, color: C.secondary, fontFamily: dm, lineHeight: 1.4 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {phase === 'loading' && <LoadingAnimation storeUrl={submittedUrl} />}

        {phase === 'result' && result && (
          <ResultsScreen result={result} storeUrl={submittedUrl} />
        )}
      </div>
    </div>
  );
}
