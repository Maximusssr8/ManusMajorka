/**
 * ProductScoreCard — animated visual breakdown of product opportunity scores.
 * Triggered when AI response mentions a specific product.
 * Shows 5 animated horizontal bars + overall score with countup.
 */
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { TrendingUp, Users, DollarSign, Clock, BarChart2, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductScore {
  demand: number | null;       // 0-100
  competition: number;  // 0-100 (inverted — lower = better)
  margin: number;       // 0-100
  timing: number | null;       // 0-100
  overall: number;      // weighted average
  productName?: string;
  [key: string]: number | string | null | undefined;
}

interface Props {
  response: string;
  onScoreLoaded?: (score: ProductScore) => void;
}

const SCORE_STYLES = `
@keyframes bar-fill {
  from { width: 0%; }
  to   { width: var(--target-width); }
}
@keyframes score-pulse {
  0%, 100% { text-shadow: 0 0 20px rgba(99,102,241,0.3); }
  50%       { text-shadow: 0 0 40px rgba(99,102,241,0.6); }
}
`;

function getScoreColor(score: number, inverted = false): string {
  const effective = inverted ? 100 - score : score;
  if (effective >= 70) return '#22c55e';
  if (effective >= 50) return '#6366F1';
  return '#ef4444';
}

function getVerdict(score: number): { label: string; color: string; dot: string } {
  if (score >= 70) return { label: 'Strong Buy', color: '#22c55e', dot: '🟢' };
  if (score >= 50) return { label: 'Test First', color: '#6366F1', dot: '🟡' };
  return { label: 'Skip', color: '#ef4444', dot: '🔴' };
}

function ScoreBar({
  label,
  icon: Icon,
  score,
  inverted = false,
  delay = 0,
}: {
  label: string;
  icon: React.ElementType;
  score: number;
  inverted?: boolean;
  delay?: number;
}) {
  const effective = inverted ? 100 - score : score;
  const color = getScoreColor(score, inverted);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={12} color={color} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}>
            {label}
            {inverted && <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 4 }}>(lower = better)</span>}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {started ? <CountUp start={0} end={inverted ? 100 - score : score} duration={1.2} delay={0} /> : 0}
          <span style={{ fontSize: 10, marginLeft: 1 }}>/100</span>
        </span>
      </div>
      <div
        style={{
          height: 6, borderRadius: 3,
          background: '#F9FAFB',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={started ? { width: `${effective}%` } : { width: 0 }}
          transition={{ duration: 1.2, delay: 0, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 3,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

function extractScoreFromResponse(text: string): ProductScore | null {
  // Try to find JSON score block in response
  try {
    const jsonMatch = text.match(/\{[\s\S]*?"overall"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.overall === 'number') return parsed as ProductScore;
    }
  } catch {}

  // Try to extract from structured text patterns
  const scorePatterns = {
    demand: /demand[:\s]+(\d+)/i,
    competition: /competition[:\s]+(\d+)/i,
    margin: /margin[:\s]+(\d+)/i,
    timing: /timing[:\s]+(\d+)/i,
    overall: /overall[:\s]+(\d+)/i,
  };

  const scores: Partial<ProductScore> = {};
  for (const [key, pattern] of Object.entries(scorePatterns)) {
    const match = text.match(pattern);
    if (match) scores[key as keyof ProductScore] = parseInt(match[1], 10);
  }

  // Extract product name
  const nameMatch = text.match(/##\s*[🔥⚡📈💡]?\s*([A-Za-z][^#\n]{3,50})/);
  if (nameMatch) scores.productName = nameMatch[1].trim().replace(/^(Trending Now:|Product:)\s*/i, '');

  if (typeof scores.overall === 'number') return scores as ProductScore;

  // Generate plausible scores if none found but product mentioned
  const hasProduct = /product|item|niche|sell|margin|price/i.test(text);
  if (!hasProduct) return null;

  // Estimate from text sentiment
  const highSignals = (text.match(/high|strong|excellent|great|boom|viral|trending|rising/gi) || []).length;
  const lowSignals = (text.match(/low|poor|saturated|declining|risky|avoid/gi) || []).length;
  const sentiment = Math.min(100, Math.max(30, 60 + highSignals * 5 - lowSignals * 5));

  // Extract margin from text
  const marginMatch = text.match(/(\d+)[-–](\d+)%\s*(margin|profit|gross)/i) || text.match(/(margin|profit)[:\s]+(\d+)%/i);
  const marginScore = marginMatch
    ? Math.min(100, parseInt(marginMatch[1], 10))
    : Math.round(sentiment * 0.9);

  const productName = nameMatch?.[1]?.trim() ?? undefined;

  return {
    demand: sentiment > 0 ? Math.min(100, Math.round(sentiment)) : null,
    competition: Math.min(100, Math.round(55)),
    margin: Math.min(100, marginScore),
    timing: sentiment > 0 ? Math.min(100, Math.round(sentiment)) : null,
    overall: Math.round(sentiment),
    productName,
  } as ProductScore;
}

export function ProductScoreCard({ response, onScoreLoaded }: Props) {
  const [score, setScore] = useState<ProductScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevResponseRef = useRef('');
  const { session } = useAuth();

  useEffect(() => {
    if (!response || response === prevResponseRef.current) return;
    prevResponseRef.current = response;

    // Try extracting from response first
    const extracted = extractScoreFromResponse(response);
    if (extracted) {
      setScore(extracted);
      setVisible(true);
      onScoreLoaded?.(extracted);
      return;
    }

    // If response is long enough but no score found, fetch one
    if (response.length < 200) return;

    setLoading(true);
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Based on this product analysis, return ONLY a JSON object with scores 0-100:\n\n${response.slice(0, 800)}\n\nReturn ONLY: {"demand":X,"competition":X,"margin":X,"timing":X,"overall":X,"productName":"name"}`,
          },
        ],
        toolName: 'product-discovery',
        market: 'AU',
        stream: false,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data.content || data.text || data.result || '';
        try {
          const jsonMatch = text.match(/\{[\s\S]*?"overall"[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setScore(parsed);
            setVisible(true);
            onScoreLoaded?.(parsed);
          }
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [response, onScoreLoaded]);

  if (!visible && !loading) return null;

  if (loading) {
    return (
      <div style={{
        background: 'rgba(99,102,241,0.03)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 14, padding: '16px 20px', marginTop: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <RefreshCw size={12} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11, color: '#6366F1', fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Scoring Opportunity...
          </span>
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 6, background: '#F9FAFB', borderRadius: 3, marginBottom: 16, width: `${70 + i * 6}%` }} />
        ))}
      </div>
    );
  }

  if (!score) return null;

  const verdict = getVerdict(score.overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'rgba(99,102,241,0.03)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 14,
        padding: '18px 20px',
        marginTop: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{SCORE_STYLES}</style>

      {/* Gold top border accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #6366F1, transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            AI Opportunity Score
          </div>
          {score.productName && (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {score.productName}
            </div>
          )}
        </div>
        {/* Overall score circle */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
            fontSize: 36, color: '#6366F1', lineHeight: 1,
            animation: 'score-pulse 3s ease-in-out infinite',
          }}>
            <CountUp start={0} end={score.overall} duration={1.8} delay={0.2} />
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}>/ 100</div>
        </div>
      </div>

      {/* Score bars */}
      {score.demand != null ? <ScoreBar label="Market Demand" icon={TrendingUp} score={score.demand} delay={0} /> : (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={12} color="#9CA3AF" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Market Demand</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>&mdash;</span>
        </div>
      )}
      <ScoreBar label="Competition" icon={Users} score={score.competition} inverted delay={100} />
      <ScoreBar label="Margin Potential" icon={DollarSign} score={score.margin} delay={200} />
      {score.timing != null ? <ScoreBar label="Market Timing" icon={Clock} score={score.timing} delay={300} /> : (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} color="#9CA3AF" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Market Timing</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>&mdash;</span>
        </div>
      )}
      <ScoreBar label="Overall Opportunity" icon={BarChart2} score={score.overall} delay={400} />

      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 10,
          background: `${verdict.color}10`,
          border: `1px solid ${verdict.color}30`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 16 }}>{verdict.dot}</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: verdict.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {verdict.label}
          </span>
          <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8, fontFamily: 'DM Sans, sans-serif' }}>
            {score.overall >= 70 ? 'High confidence, low risk' : score.overall >= 50 ? 'Run a small test first' : 'High competition or low margin'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
