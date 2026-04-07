/**
 * CompetitorSpy — /app/competitor-spy
 * Search-driven competitor intelligence. Maya + Tavily research.
 * Bloomberg terminal style — clean, data-dense, no gamification.
 */

import { useIsMobile } from '@/hooks/useIsMobile';
import { Eye, Loader2, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
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

// Minimal XSS sanitizer for AI-generated markdown output
const sanitizeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');

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
  const isMobile = useIsMobile();
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
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0D1424' }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
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
  const { user, subPlan, subStatus, session } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [error, setError] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
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
    setError('');
    startProgress();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
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

      clearTimeout(timeoutId);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        const errMsg = (errBody as { error?: string }).error ?? `Analysis failed (${res.status})`;
        setError(errMsg);
        toast.error(errMsg);
      } else {
        const json = await res.json() as { reply?: string; error?: string };
        if (json.reply) {
          setResult({ query: q, timestamp: new Date().toISOString(), reply: json.reply });
        } else {
          const errMsg = json.error ?? 'Research returned no results — try a different query';
          setError(errMsg);
          toast.error(errMsg);
        }
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errMsg = err instanceof Error && err.name === 'AbortError'
        ? 'Analysis took too long. Please try again.'
        : err instanceof Error ? err.message : 'Network error — check connection';
      setError(errMsg);
      toast.error(errMsg);
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
            style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
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
                  <div key={j} className="flex gap-2 text-sm" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
                    <span style={{ color: '#6366F1', flexShrink: 0 }}>·</span>
                    <span>
                      <span className="font-semibold" style={{ color: '#6366F1' }}>{match[1]}</span>
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
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F1F5F9">$1</strong>')) }} />
                </div>
              );
            }
            if (/^\d+\./.test(line)) {
              return (
                <div key={j} className="flex gap-2 text-sm" style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="font-mono flex-shrink-0" style={{ color: '#475569', minWidth: 20 }}>{line.match(/^\d+/)?.[0]}.</span>
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(line.replace(/^\d+\.\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F1F5F9">$1</strong>')) }} />
                </div>
              );
            }
            return (
              <p key={j} className="text-sm" style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F1F5F9">$1</strong>')) }}
              />
            );
          })}
        </div>
      );
    });
  }

  const isInWatchlist = result && watchlist.some(w => w.query === result.query);

  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  if (!isAdmin && !isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => setLocation('/app/dashboard')} feature="Competitor Intelligence" reason="Analyse competitor shops and strategies" />;
  }

  return (
    <div className="min-h-full" style={{ background: 'var(--content-bg, #0a0a0a)', color: 'var(--cell-text, #F1F5F9)' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-color, rgba(255,255,255,0.08))' }}>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--cell-text, #F1F5F9)' }}>Competitor Spy</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
          Research any TikTok Shop competitor — products, strategy, weaknesses, how to beat them
        </p>
      </div>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left sidebar — watchlist */}
        {user && (
          <aside
            className="hidden lg:flex flex-col w-56 flex-shrink-0 p-4 border-r"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a0a0a' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>Watchlist</p>
            {watchlist.length === 0 ? (
              <p className="text-xs" style={{ color: '#94A3B8' }}>Save competitors to track them</p>
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
                      style={{ color: '#94A3B8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#818CF8')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a TikTok Shop name, URL, or niche (e.g. 'PetLover AU' or 'pet water fountains')"
                style={{
                  flex: 1, minWidth: 0,
                  background: '#111B2E',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '11px 16px',
                  fontSize: 14, color: '#F1F5F9',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                disabled={loading}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  flexShrink: 0,
                  padding: '11px 20px',
                  background: '#6366F1',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !query.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading && query.trim()) e.currentTarget.style.background = '#5558E8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#6366F1'; }}
              >
                {loading ? 'Analysing...' : 'Analyse'}
              </button>
            </div>

            {/* Example queries */}
            {!result && !loading && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs" style={{ color: '#94A3B8' }}>Try:</span>
                {['PetLover AU TikTok shop', 'scalp brush competitors', 'dog lick mat sellers AU', 'mushroom coffee Australia'].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setQuery(ex)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}
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
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0D1424' }}
            >
              <div className="flex justify-center mb-4">
                <Eye size={28} style={{ color: '#6366F1' }} className="animate-pulse" />
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: '#F1F5F9' }}>Researching: <span style={{ color: '#6366F1' }}>"{query}"</span></p>
              <div className="space-y-2 max-w-xs mx-auto">
                {PROGRESS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                      style={{
                        background: i <= progressStep ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${i <= progressStep ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {i < progressStep ? '✓' : i === progressStep ? <Loader2 size={10} className="animate-spin" style={{ color: '#6366F1' }} /> : ''}
                    </div>
                    <span className="text-xs text-left" style={{ color: i <= progressStep ? '#94A3B8' : '#64748B' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state — blurred preview + waitlist */}
          {error && !loading && !result && (
            <div className="flex flex-col items-center justify-center py-12 gap-8 px-6">
              {/* Blurred mockup preview */}
              <div className="relative w-full max-w-2xl">
                <div style={{
                  position: 'absolute', inset: 0,
                  backdropFilter: 'blur(6px)',
                  background: 'rgba(5,7,15,0.6)',
                  borderRadius: 12,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '8px 18px', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    Coming soon — Scale Plan early access
                  </span>
                </div>
                {/* Blurred mock UI */}
                <div style={{
                  background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: 24, opacity: 0.5,
                }}>
                  <div style={{ height: 16, width: 192, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 16 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA + waitlist */}
              <div style={{ textAlign: 'center', maxWidth: 440 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', marginBottom: 8 }}>
                  Full competitor intelligence, coming soon
                </h3>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>
                  Analyse any Shopify store — pricing, top products, ad spend estimates, traffic sources, and growth trends. Available on Scale plan.
                </p>
                <div style={{ display: 'flex', gap: 8, maxWidth: 360, margin: '0 auto' }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#F1F5F9',
                      outline: 'none',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <button
                    onClick={() => {
                      if (waitlistEmail) {
                        setWaitlistSubmitted(true);
                        toast.success("You're on the list!");
                      }
                    }}
                    style={{
                      padding: '8px 16px', background: waitlistSubmitted ? '#10B981' : '#6366F1', color: 'white',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!waitlistSubmitted) e.currentTarget.style.background = '#5558E8'; }}
                    onMouseLeave={e => { if (!waitlistSubmitted) e.currentTarget.style.background = '#6366F1'; }}
                  >
                    {waitlistSubmitted ? '✓ Noted!' : 'Notify me'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div>
              {/* AI disclaimer */}
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{'\u26A0\uFE0F'}</span>
                <span style={{ fontSize: 11, color: '#FDE68A', lineHeight: 1.4 }}>
                  <strong>AI-generated estimate</strong> — This analysis is synthesised by AI and may not reflect real competitor data. Verify key figures independently before making business decisions.
                </span>
              </div>
              {/* Result header */}
              <div
                className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
                style={{ background: '#0D1424', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Analysis: <span style={{ color: '#6366F1' }}>{result.query}</span></p>
                  <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                    {new Date(result.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user && !isInWatchlist && (
                    <button
                      onClick={() => void saveToWatchlist()}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
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
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0D1424' }}
              >
                {renderMarkdown(result.reply)}
              </div>

              {/* Run another */}
              <button
                onClick={() => { setResult(null); setQuery(''); inputRef.current?.focus(); }}
                className="mt-4 text-sm transition-colors"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                ← Research another competitor
              </button>
            </div>
          )}

          {/* Empty / initial state — blurred preview + waitlist */}
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-8 px-6">
              {/* Blurred mockup preview */}
              <div className="relative w-full max-w-2xl">
                <div style={{
                  position: 'absolute', inset: 0,
                  backdropFilter: 'blur(6px)',
                  background: 'rgba(5,7,15,0.6)',
                  borderRadius: 12,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '8px 18px', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    Coming soon — Scale Plan early access
                  </span>
                </div>
                {/* Blurred mock UI */}
                <div style={{
                  background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: 24, opacity: 0.5,
                }}>
                  <div style={{ height: 16, width: 192, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 16 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA + waitlist */}
              <div style={{ textAlign: 'center', maxWidth: 440 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', marginBottom: 8 }}>
                  Full competitor intelligence, coming soon
                </h3>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>
                  Analyse any Shopify store — pricing, top products, ad spend estimates, traffic sources, and growth trends. Available on Scale plan.
                </p>
                <div style={{ display: 'flex', gap: 8, maxWidth: 360, margin: '0 auto' }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#F1F5F9',
                      outline: 'none',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <button
                    onClick={() => {
                      if (waitlistEmail) {
                        setWaitlistSubmitted(true);
                        toast.success("You're on the list!");
                      }
                    }}
                    style={{
                      padding: '8px 16px', background: waitlistSubmitted ? '#10B981' : '#6366F1', color: 'white',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!waitlistSubmitted) e.currentTarget.style.background = '#5558E8'; }}
                    onMouseLeave={e => { if (!waitlistSubmitted) e.currentTarget.style.background = '#6366F1'; }}
                  >
                    {waitlistSubmitted ? '✓ Noted!' : 'Notify me'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
