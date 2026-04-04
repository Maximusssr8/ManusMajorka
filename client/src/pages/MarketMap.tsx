import { Copy, Loader2, Map, Plus, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Competitor {
  name: string;
  price: number; // 1-10 (1=budget, 10=premium)
  quality: number; // 1-10 (1=low, 10=high)
  description: string;
  color: string;
}

interface MapData {
  competitors: Competitor[];
  yourBrand?: Competitor;
  insights: string[];
  opportunityZone: string;
  recommendedPosition: { price: number; quality: number; label: string };
}

const COLORS = [
  '#6366F1',
  '#9c5fff',
  '#6366F1',
  '#ff6b6b',
  '#4ecdc4',
  '#ffa500',
  '#e91e63',
  '#00bcd4',
];

export default function MarketMap() {
  const [niche, setNiche] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [yourBrand, setYourBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const { session } = useAuth();

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setMapData(null);
    try {
      const searchQuery = `${niche} competitors pricing positioning market analysis`;

      const competitorList = competitors.trim() ? competitors.split('\n').filter(Boolean) : [];
      const prompt = `You are a market positioning expert. Analyze the ${niche} market and create a competitive positioning map.

${competitorList.length > 0 ? `Known competitors: ${competitorList.join(', ')}\n` : ''}
${yourBrand ? `My brand/product: ${yourBrand}\n` : ''}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "competitors": [
    {
      "name": "Brand Name",
      "price": 7,
      "quality": 8,
      "description": "One sentence about their positioning"
    }
  ],
  ${yourBrand ? `"yourBrand": { "name": "${yourBrand}", "price": 5, "quality": 7, "description": "Suggested positioning for your brand" },` : ''}
  "insights": [
    "Key insight about the market",
    "Gap or opportunity observed",
    "Competitive threat to watch"
  ],
  "opportunityZone": "Description of the white space in the market",
  "recommendedPosition": {
    "price": 6,
    "quality": 8,
    "label": "Premium-but-accessible"
  }
}

Include 4-7 real competitors. Price and quality are 1-10 scales (1=lowest, 10=highest).`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt:
            'You are a market positioning expert. Always respond with valid JSON only, no markdown.',
          searchQuery,
        }),
      });

      let fullText = '';
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                fullText += text;
              } catch {}
            }
          }
        }
      }

      // Extract JSON from response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed: MapData = JSON.parse(jsonMatch[0]);

      // Assign colors
      parsed.competitors = parsed.competitors.map((c, i) => ({
        ...c,
        color: COLORS[i % COLORS.length],
      }));
      if (parsed.yourBrand) {
        parsed.yourBrand.color = '#ffffff';
      }

      setMapData(parsed);
    } catch (err: any) {
      toast.error('Failed to generate market map. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert 1-10 scale to percentage position on the grid
  const toPercent = (val: number) => ((val - 1) / 9) * 100;

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ background: '#05070F' }}>
      {/* Left Panel — Inputs */}
      <div
        className="w-80 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#05070F' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-4 h-4" style={{ color: '#6366F1' }} />
            <h1
              className="font-extrabold text-sm"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#F8FAFC' }}
            >
              Market Map
            </h1>
          </div>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Visualise competitor positioning on a Price vs Quality grid.
          </p>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <div>
            <label
              className="text-xs font-bold uppercase tracking-widest mb-2 block"
              style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Niche / Market *
            </label>
            <Input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Protein powder, yoga mats, pet supplements"
              className="text-sm"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: '#F0F0F0',
                color: '#F8FAFC',
              }}
            />
          </div>

          <div>
            <label
              className="text-xs font-bold uppercase tracking-widest mb-2 block"
              style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Known Competitors (optional)
            </label>
            <Textarea
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder={'Gymshark\nMyProtein\nOptimum Nutrition'}
              rows={4}
              className="text-sm resize-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: '#F0F0F0',
                color: '#F8FAFC',
              }}
            />
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              One per line. Leave blank to auto-discover.
            </p>
          </div>

          <div>
            <label
              className="text-xs font-bold uppercase tracking-widest mb-2 block"
              style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Your Brand / Product (optional)
            </label>
            <Input
              value={yourBrand}
              onChange={(e) => setYourBrand(e.target.value)}
              placeholder="e.g. My protein brand"
              className="text-sm"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: '#F0F0F0',
                color: '#F8FAFC',
              }}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !niche.trim()}
            className="w-full font-extrabold"
            style={{
              background: loading
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366F1, #c09a28)',
              color: '#FAFAFA',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mapping market…
              </>
            ) : (
              <>
                <Map className="w-4 h-4 mr-2" /> Generate Map
              </>
            )}
          </Button>

          {/* Example prompts */}
          {!mapData && !loading && (
            <div className="space-y-2">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Try these
              </p>
              {['Protein powder', 'Yoga mats', 'Pet supplements', 'Skincare serums'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setNiche(ex)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: 'rgba(99,102,241,0.2)',
                    color: 'rgba(99,102,241,0.8)',
                    background: 'rgba(99,102,241,0.04)',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Map */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!mapData && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(99,102,241,0.08)' }}
              >
                <Map className="w-8 h-8" style={{ color: '#6366F1', opacity: 0.4 }} />
              </div>
              <p
                className="text-sm font-bold mb-1"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#94A3B8' }}
              >
                Your market map will appear here
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Enter a niche and click Generate Map
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#6366F1' }} />
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Researching market positioning…
              </p>
            </div>
          </div>
        )}

        {mapData && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Map Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-lg font-extrabold"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#F8FAFC' }}
                  >
                    {niche} — Market Positioning Map
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    Price (x-axis) vs Quality (y-axis) · 1 = Low, 10 = High
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerate}
                  className="text-xs"
                  style={{ borderColor: '#F0F0F0', color: '#CBD5E1' }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </Button>
              </div>

              {/* 2x2 Grid */}
              <div
                className="relative rounded-2xl border"
                style={{
                  borderColor: '#F0F0F0',
                  background: '#05070F',
                  aspectRatio: '4/3',
                  minHeight: '360px',
                }}
              >
                {/* Axis labels */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* X axis label */}
                  <div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Price →
                  </div>
                  {/* Y axis label */}
                  <div
                    className="absolute left-2 top-1/2 text-xs font-bold uppercase tracking-widest"
                    style={{
                      color: '#9CA3AF',
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      transform: 'translateY(-50%) rotate(-90deg)',
                      transformOrigin: 'center',
                    }}
                  >
                    Quality →
                  </div>
                  {/* Quadrant labels */}
                  <div
                    className="absolute top-3 left-8 text-xs"
                    style={{ color: '#E5E7EB', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Budget / High Quality
                  </div>
                  <div
                    className="absolute top-3 right-4 text-xs"
                    style={{ color: '#E5E7EB', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Premium
                  </div>
                  <div
                    className="absolute bottom-8 left-8 text-xs"
                    style={{ color: '#E5E7EB', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Budget
                  </div>
                  <div
                    className="absolute bottom-8 right-4 text-xs"
                    style={{ color: '#E5E7EB', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Expensive / Low Quality
                  </div>
                  {/* Center lines */}
                  <div
                    className="absolute top-0 bottom-0 left-1/2 border-l"
                    style={{ borderColor: '#F9FAFB' }}
                  />
                  <div
                    className="absolute left-0 right-0 top-1/2 border-t"
                    style={{ borderColor: '#F9FAFB' }}
                  />
                </div>

                {/* Opportunity zone marker */}
                {mapData.recommendedPosition && (
                  <div
                    className="absolute w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
                    style={{
                      left: `calc(${toPercent(mapData.recommendedPosition.price)}% - 20px)`,
                      bottom: `calc(${toPercent(mapData.recommendedPosition.quality)}% - 20px)`,
                      borderColor: 'rgba(99,102,241,0.75)',
                      background: 'rgba(99,102,241,0.09)',
                    }}
                    title={`Opportunity: ${mapData.recommendedPosition.label}`}
                  >
                    <Plus className="w-4 h-4" style={{ color: '#6366F1', opacity: 0.7 }} />
                  </div>
                )}

                {/* Competitor dots */}
                {mapData.competitors.map((c, i) => (
                  <div
                    key={i}
                    className="absolute group"
                    style={{
                      left: `calc(${toPercent(c.price)}% - 16px)`,
                      bottom: `calc(${toPercent(c.quality)}% - 16px)`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold cursor-default transition-transform hover:scale-125"
                      style={{
                        background: c.color,
                        color: '#FAFAFA',
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        boxShadow: `0 0 12px ${c.color}40`,
                      }}
                      title={`${c.name}: ${c.description}`}
                    >
                      {c.name.charAt(0)}
                    </div>
                    {/* Tooltip */}
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{
                        background: 'rgba(0,0,0,0.9)',
                        color: '#F8FAFC',
                        border: `1px solid ${c.color}40`,
                      }}
                    >
                      <strong>{c.name}</strong>
                    </div>
                  </div>
                ))}

                {/* Your brand dot */}
                {mapData.yourBrand && (
                  <div
                    className="absolute group"
                    style={{
                      left: `calc(${toPercent(mapData.yourBrand.price)}% - 16px)`,
                      bottom: `calc(${toPercent(mapData.yourBrand.quality)}% - 16px)`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 cursor-default transition-transform hover:scale-125"
                      style={{
                        background: '#F0F0F0',
                        borderColor: '#ffffff',
                        color: '#ffffff',
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        boxShadow: '0 0 16px #9CA3AF',
                      }}
                      title={`You: ${mapData.yourBrand.description}`}
                    >
                      ★
                    </div>
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{
                        background: 'rgba(0,0,0,0.9)',
                        color: '#F8FAFC',
                        border: '1px solid #9CA3AF',
                      }}
                    >
                      <strong>You ({mapData.yourBrand.name})</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {mapData.competitors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: c.color }}
                    />
                    <span style={{ color: '#CBD5E1' }}>{c.name}</span>
                  </div>
                ))}
                {mapData.yourBrand && (
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full border flex-shrink-0"
                      style={{ borderColor: '#ffffff', background: '#F0F0F0' }}
                    />
                    <span style={{ color: '#ffffff' }}>You ({mapData.yourBrand.name})</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full border border-dashed flex-shrink-0"
                    style={{ borderColor: '#6366F1' }}
                  />
                  <span style={{ color: '#6366F1' }}>Opportunity zone</span>
                </div>
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    background: 'rgba(99,102,241,0.06)',
                    borderColor: 'rgba(99,102,241,0.30)',
                  }}
                >
                  <h3
                    className="text-xs font-extrabold uppercase tracking-widest mb-3"
                    style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Opportunity Zone
                  </h3>
                  <p className="text-sm" style={{ color: '#E2E8F0' }}>
                    {mapData.opportunityZone}
                  </p>
                  {mapData.recommendedPosition && (
                    <div
                      className="mt-3 px-3 py-1.5 rounded-lg inline-block text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.18)', color: '#6366F1' }}
                    >
                      Recommended: {mapData.recommendedPosition.label}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl p-5 border"
                  style={{
                    background: '#05070F',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className="text-xs font-extrabold uppercase tracking-widest"
                      style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      Key Insights
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mapData.insights.join('\n'));
                        toast.success('Copied!');
                      }}
                      className="p-1 rounded hover:bg-[#0C1120]/5 transition-colors"
                    >
                      <Copy className="w-3 h-3" style={{ color: '#9CA3AF' }} />
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {mapData.insights.map((ins, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs"
                        style={{ color: '#CBD5E1' }}
                      >
                        <span style={{ color: '#6366F1', flexShrink: 0 }}>→</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Competitor details */}
              <div>
                <h3
                  className="text-xs font-extrabold uppercase tracking-widest mb-3"
                  style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Competitor Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mapData.competitors.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4 border"
                      style={{ background: `${c.color}06`, borderColor: `${c.color}22` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold"
                          style={{ background: c.color, color: '#FAFAFA' }}
                        >
                          {c.name.charAt(0)}
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#F8FAFC' }}
                        >
                          {c.name}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: '#CBD5E1' }}>
                        {c.description}
                      </p>
                      <div className="flex gap-3 text-xs">
                        <span style={{ color: '#9CA3AF' }}>
                          Price: <strong style={{ color: c.color }}>{c.price}/10</strong>
                        </span>
                        <span style={{ color: '#9CA3AF' }}>
                          Quality: <strong style={{ color: c.color }}>{c.quality}/10</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
