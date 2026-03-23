// server/lib/trend-velocity.ts
// Trend Velocity Score — predicts WHERE a product is in its trend lifecycle
// EARLY → PEAK → FADING

interface TrendDataPoint {
  date: string;
  signal_strength: number; // 0-100
}

export interface VelocityResult {
  label: 'EARLY' | 'PEAK' | 'FADING' | 'UNKNOWN';
  score: number; // 0-100
  peak_in_days: number | null;
  curve: TrendDataPoint[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string; // human-readable explanation
}

const TAVILY_KEY = process.env.TAVILY_API_KEY || '';

async function tavilySearch(query: string): Promise<{ results: any[]; count: number }> {
  if (!TAVILY_KEY) return { results: [], count: 0 };
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: false,
      }),
    });
    if (!res.ok) return { results: [], count: 0 };
    const data = await res.json();
    return { results: data.results || [], count: (data.results || []).length };
  } catch {
    return { results: [], count: 0 };
  }
}

function extractSignalStrength(results: any[], positiveWords: string[], negativeWords: string[]): number {
  if (!results.length) return 0;

  let score = Math.min(100, results.length * 18);

  for (const r of results) {
    const text = `${r.title || ''} ${r.content || ''}`.toLowerCase();
    const url = (r.url || '').toLowerCase();

    if (text.includes('2026')) score += 8;
    if (text.includes('2025')) score += 4;

    for (const w of positiveWords) {
      if (text.includes(w)) score += 6;
    }

    for (const w of negativeWords) {
      if (text.includes(w)) score -= 8;
    }

    if (url.includes('tiktok')) score += 10;
    if (text.includes('million')) score += 5;
    if (text.includes('australia') || text.includes('au ')) score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildVelocityCurve(
  historical: number,
  recent: number,
  current: number
): TrendDataPoint[] {
  const now = Date.now();
  const day = 86400000;

  const rawValues = [
    historical * 0.7,
    historical * 0.85,
    historical,
    (historical + recent) / 2,
    recent,
    (recent + current) / 2,
    current,
  ];

  const points: TrendDataPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now - (6 - i) * day).toISOString().split('T')[0];
    points.push({
      date,
      signal_strength: Math.max(0, Math.min(100, Math.round(rawValues[i]))),
    });
  }

  return points;
}

function classifyVelocity(curve: TrendDataPoint[], current: number): {
  label: 'EARLY' | 'PEAK' | 'FADING' | 'UNKNOWN';
  peak_in_days: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
} {
  if (curve.length < 3 || current < 5) {
    return { label: 'UNKNOWN', peak_in_days: null, confidence: 'LOW' };
  }

  const values = curve.map(p => p.signal_strength);
  const recentSlope = values[6] - values[4];
  const overallSlope = values[6] - values[0];

  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    current > 60 ? 'HIGH' : current > 30 ? 'MEDIUM' : 'LOW';

  if (recentSlope < -10 || (overallSlope < 0 && current < 35)) {
    const daysSincePeak = Math.round(Math.abs(recentSlope) / 5);
    return { label: 'FADING', peak_in_days: -daysSincePeak, confidence };
  }

  if (current > 60 && Math.abs(recentSlope) < 8) {
    const daysUntilDecline = Math.round(current / 10);
    return { label: 'PEAK', peak_in_days: daysUntilDecline, confidence };
  }

  if (recentSlope > 5 || (overallSlope > 10 && current < 70)) {
    const daysToEstimatedPeak = Math.max(7, Math.round((80 - current) / Math.max(1, recentSlope)));
    return {
      label: 'EARLY',
      peak_in_days: Math.min(60, daysToEstimatedPeak),
      confidence,
    };
  }

  if (current >= 45) {
    return { label: 'PEAK', peak_in_days: 7, confidence: 'MEDIUM' };
  }

  return { label: 'EARLY', peak_in_days: 21, confidence: 'LOW' };
}

const SUMMARIES: Record<string, string> = {
  EARLY: 'Getting traction. Early mover advantage available.',
  PEAK: 'Peak demand now. Move fast — margins still strong.',
  FADING: 'Trend fading. High competition, margin pressure.',
  UNKNOWN: 'Insufficient data to predict trend direction.',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const calculateTrendVelocity = async (productName: string): Promise<VelocityResult> => {
  try {
    const name = productName.split(' ').slice(0, 5).join(' ');

    const [currentRes, recentRes, historicalRes] = await Promise.allSettled([
      tavilySearch(`${name} trending tiktok shop australia 2026`),
      tavilySearch(`${name} dropship australia viral`),
      tavilySearch(`${name} aliexpress bestseller australia`),
    ]);

    const current = currentRes.status === 'fulfilled' ? currentRes.value : { results: [], count: 0 };
    const recent = recentRes.status === 'fulfilled' ? recentRes.value : { results: [], count: 0 };
    const historical = historicalRes.status === 'fulfilled' ? historicalRes.value : { results: [], count: 0 };

    const POSITIVE = ['trending', 'viral', 'hot', 'winning', 'popular', 'demand', 'selling fast', 'best seller', 'growth'];
    const NEGATIVE = ['saturated', 'declining', 'dying', 'oversaturated', 'dead', 'avoid', 'competition'];

    const currentScore = extractSignalStrength(current.results, POSITIVE, NEGATIVE);
    const recentScore = extractSignalStrength(recent.results, POSITIVE, NEGATIVE);
    const historicalScore = extractSignalStrength(historical.results, POSITIVE, NEGATIVE);

    const curve = buildVelocityCurve(historicalScore, recentScore, currentScore);
    const { label, peak_in_days, confidence } = classifyVelocity(curve, currentScore);

    const score = Math.round(currentScore * 0.5 + recentScore * 0.3 + historicalScore * 0.2);

    return {
      label,
      score,
      peak_in_days,
      curve,
      confidence,
      summary: SUMMARIES[label],
    };
  } catch (err) {
    console.error('[velocity] error for', productName, err instanceof Error ? err.message : '');
    return {
      label: 'UNKNOWN',
      score: 0,
      peak_in_days: null,
      curve: [],
      confidence: 'LOW',
      summary: SUMMARIES.UNKNOWN,
    };
  }
};

export const batchCalculateTrendVelocity = async (
  products: Array<{ id: string; name: string }>,
  delayMs = 600
): Promise<Map<string, VelocityResult>> => {
  const results = new Map<string, VelocityResult>();

  for (const product of products) {
    results.set(product.id, await calculateTrendVelocity(product.name));
    if (delayMs > 0) await sleep(delayMs);
  }

  return results;
};
