/**
 * CompetitorSpy — /app/competitor-spy
 * Search-driven competitor intelligence. Maya + Tavily research.
 * Bloomberg terminal style — clean, data-dense, no gamification.
 */

import { Eye, Loader2, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompetitorResult {
  query: string;
  timestamp: string;
  reply: string;
}

interface WatchlistEntry {
  id: string;
  query: string;
  notes: string | null;
  created_at: string;
}

// ── Analysis progress steps ───────────────────────────────────────────────────

const PROGRESS_STEPS = [
  'Searching TikTok Shop…',
  'Analysing product catalogue…',
  'Mapping ad strategy…',
  'Finding weaknesses…',
  'Generating tactics…',
];

// ── Main component ────────────────────────────────────────────────────────────

// ── Competitor Quick Actions ──────────────────────────────────────────────────
function CompetitorQuickActions({ query }: { query: string }) {
  const [, nav] = useLocation();
  // Extract likely niche from query (first significant word)
  const niche = encodeURIComponent(query.split(/\s+/).slice(0, 3).join(' '));
  const actions = [
    { label: 'Find Winning Products', path: `/app/winning-products`, color: '#ef4444' },
    { label: 'Generate Ads', path: `/app/meta-ads?category=${niche}`, color: '#a78bfa' },
    { label: 'Build Competing Store', path: `/app/website-generator?niche=${niche}`, color: '#34d399' },
    { label: 'Find Creators', path: `/app/creators`, color: '#38bdf8' },
    { label: 'Check Market Saturation', path: `/app/saturation-checker`, color: '#f59e0b' },
  ];
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
        Attack Plan — Jump to Tool
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => nav(a.path)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: `${a.color}14`, color: a.color, border: `1px solid ${a.color}30` }}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = `${a.color}28`)}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = `${a.color}14`)}
          >
            {a.label} →
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CompetitorSpy() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load watchlist from Supabase
  useEffect(() => {
    if (user) { void fetchWatchlist(); }
  }, [user]);

  async function fetchWatchlist() {
    if (!user) return;
    const { data } = await supabase
      .from('competitor_watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setWatchlist((data ?? []) as WatchlistEntry[]);
  }

  async function saveToWatchlist() {
    if (!user || !result) return;
    const { error } = await supabase.from('competitor_watchlist').upsert({
      user_id: user.id,
      query: result.query,
      notes: null,
    }, { onConflict: 'user_id,query' });
    if (!error) {
      toast.success('Saved to watchlist');
      void fetchWatchlist();
    }
  }

  async function removeFromWatchlist(id: string) {
    await supabase.from('competitor_watchlist').delete().eq('id', id);
    setWatchlist(w => w.filter(e => e.id !== id));
  }

  function startProgress() {
    setProgressStep(0);
    let step = 0;
    progressRef.current = setInterval(() => {
      step = Math.min(step + 1, PROGRESS_STEPS.length - 1);
      setProgressStep(step);
    }, 1800);
  }

  function stopProgress() {
    if (progressRef.current) clearInterval(progressRef.current);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setResult(null);
    startProgress();

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          toolName: 'competitor-spy',
          messages: [{
            role: 'user',
            content: `Research this competitor for an Australian dropshipper: "${q}"

Use web search to find real information. Return your analysis in this exact structure:

## 🔍 Competitor Overview
[2-3 sentences: what they sell, estimated scale, AU market presence]

## 📦 Top Products
List their top 5 products with estimated prices in AUD. Format each as:
- **[Product name]** — $XX AUD — [why it sells]

## 🎯 Their Strategy
- **Pricing:** [their approach]
- **Traffic sources:** [organic/paid/both]
- **Content style:** [what they post]
- **Audience:** [who they target in AU]

## ⚠️ Their Weaknesses
List 3-5 specific, exploitable weaknesses an AU dropshipper could attack.

## 🏆 How to Beat Them
5 concrete action steps an AU dropshipper can execute in the next 30 days to outcompete them.

## 💡 Quick Win
One specific opportunity you can exploit this week.

Be specific, data-driven, AU-market-focused. Use real numbers where possible.`,
          }],
          stream: false,
          searchQuery: `${q} TikTok Shop ecommerce competitor Australia`,
        }),
      });

      const json = await res.json() as { reply?: string; error?: string };
      if (json.reply) {
        setResult({ query: q, timestamp: new Date().toISOString(), reply: json.reply });
      } else {
        toast.error(json.error ?? 'Research failed — please try again');
      }
    } catch {
      toast.error('Network error — check connection');
    } finally {
      stopProgress();
      setLoading(false);
    }
  }

  function renderMarkdown(text: string) {
    // Split into sections by ## headers
    const sections = text.split(/^(## .+)$/m).filter(Boolean);
    return sections.map((section, i) => {
      if (section.startsWith('## ')) {
        return (
          <h3
            key={i}
            className="text-sm font-semibold mt-5 mb-2 first:mt-0"
            style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}
          >
            {section.replace('## ', '')}
          </h3>
        );
      }
      // Render the body
      const lines = section.trim().split('\n');
      return (
        <div key={i} className="space-y-1.5 mb-1">
          {lines.filter(l => l.trim()).map((line, j) => {
            if (line.startsWith('- **')) {
              // Key-value bullet
              const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
              if (match) {
                return (
                  <div key={j} className="flex gap-2 text-sm" style={{ color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif' }}>
                    <span style={{ color: '#d4af37', flexShrink: 0 }}>·</span>
                    <span>
                      <span className="font-semibold" style={{ color: '#d4af37' }}>{match[1]}</span>
                      <span style={{ color: '#94a3b8' }}>{match[2]}</span>
                    </span>
                  </div>
                );
              }
            }
            if (line.startsWith('- ')) {
              return (
                <div key={j} className="flex gap-2 text-sm" style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>
                  <span style={{ color: '#475569', flexShrink: 0 }}>·</span>
                  <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
                </div>
              );
            }
            if (/^\d+\./.test(line)) {
              return (
                <div key={j} className="flex gap-2 text-sm" style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="font-mono flex-shrink-0" style={{ color: '#475569', minWidth: 20 }}>{line.match(/^\d+/)?.[0]}.</span>
                  <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
                </div>
              );
            }
            return (
              <p key={j} className="text-sm" style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }}
              />
            );
          })}
        </div>
      );
    });
  }

  const isInWatchlist = result && watchlist.some(w => w.query === result.query);

  return (
    <div className="min-h-full" style={{ background: '#080a0e', color: '#e2e8f0' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}>Competitor Spy</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
          Research any TikTok Shop competitor — products, strategy, weaknesses, how to beat them
        </p>
      </div>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left sidebar — watchlist */}
        {user && (
          <aside
            className="hidden lg:flex flex-col w-56 flex-shrink-0 p-4 border-r"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#080a0e' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Watchlist</p>
            {watchlist.length === 0 ? (
              <p className="text-xs" style={{ color: '#334155' }}>Save competitors to track them</p>
            ) : (
              <div className="space-y-1">
                {watchlist.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => { setQuery(w.query); inputRef.current?.focus(); }}
                      className="flex-1 text-left text-xs px-2 py-1.5 rounded transition-colors truncate"
                      style={{ color: '#94a3b8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#d4af37')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                      {w.query}
                    </button>
                    <button
                      onClick={() => void removeFromWatchlist(w.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#475569' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 p-6">
          {/* Search form */}
          <form onSubmit={(e) => void handleSearch(e)} className="mb-8">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a TikTok Shop name, URL, or niche (e.g. 'PetLover AU' or 'pet water fountains')"
                className="w-full pl-11 pr-32 py-4 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#e2e8f0',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.35)' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = 'rgba(212,175,55,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.2)')}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Analyse →'}
              </button>
            </div>

            {/* Example queries */}
            {!result && !loading && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs" style={{ color: '#475569' }}>Try:</span>
                {['PetLover AU TikTok shop', 'scalp brush competitors', 'dog lick mat sellers AU', 'mushroom coffee Australia'].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setQuery(ex)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Loading state */}
          {loading && (
            <div
              className="rounded-xl p-8 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex justify-center mb-4">
                <Eye size={28} style={{ color: '#d4af37' }} className="animate-pulse" />
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: '#e2e8f0' }}>Researching: <span style={{ color: '#d4af37' }}>"{query}"</span></p>
              <div className="space-y-2 max-w-xs mx-auto">
                {PROGRESS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                      style={{
                        background: i <= progressStep ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${i <= progressStep ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {i < progressStep ? '✓' : i === progressStep ? <Loader2 size={10} className="animate-spin" style={{ color: '#d4af37' }} /> : ''}
                    </div>
                    <span className="text-xs text-left" style={{ color: i <= progressStep ? '#94a3b8' : '#334155' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div>
              {/* Result header */}
              <div
                className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Analysis: <span style={{ color: '#d4af37' }}>{result.query}</span></p>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                    {new Date(result.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user && !isInWatchlist && (
                    <button
                      onClick={() => void saveToWatchlist()}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.25)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.1)')}
                    >
                      + Save to Watchlist
                    </button>
                  )}
                  {isInWatchlist && (
                    <span className="text-xs px-2 py-1" style={{ color: '#22c55e' }}>✓ Saved</span>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ color: '#475569' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Actions flywheel */}
              <CompetitorQuickActions query={result.query} />

              {/* Analysis content */}
              <div
                className="rounded-xl p-6"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
              >
                {renderMarkdown(result.reply)}
              </div>

              {/* Run another */}
              <button
                onClick={() => { setResult(null); setQuery(''); inputRef.current?.focus(); }}
                className="mt-4 text-sm transition-colors"
                style={{ color: '#64748b' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                ← Research another competitor
              </button>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Product Intel', desc: 'See exactly what products competitors are selling and at what prices', icon: '📦' },
                { title: 'Strategy Map', desc: 'Understand their traffic sources, content style and audience targeting', icon: '🗺️' },
                { title: 'Attack Plan', desc: 'Get 5 concrete steps to outcompete them in the AU market', icon: '⚡' },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl p-5"
                  style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-2xl mb-2">{card.icon}</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0', fontFamily: 'Syne, sans-serif' }}>{card.title}</p>
                  <p className="text-xs" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
