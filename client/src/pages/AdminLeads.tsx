/**
 * Admin Leads Intelligence — /admin/leads
 * Only visible to maximusmajorka@gmail.com or admin role.
 * Shows user leads table, market breakdown chart, and outreach strategy.
 */

import { BarChart2, Copy, Globe, Loader2, Mail, MessageSquare, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { getStoredMarket } from '@/contexts/MarketContext';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

const ADMIN_EMAIL = 'maximusmajorka@gmail.com';

const MARKET_COLORS: Record<string, string> = {
  AU: '#6366F1',
  US: '#7c6af5',
  UK: '#6366F1',
  CA: '#e05c7a',
  NZ: '#4ecdc4',
  OTHER: '#9CA3AF',
};

interface LeadIntelResult {
  places: string[];
  outreachTemplates: Record<string, string>;
  weeklySchedule: string;
}

export default function AdminLeads() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'leads' | 'outreach'>('leads');
  const [keywords, setKeywords] = useState('looking for dropshipping supplier australia');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<LeadIntelResult | null>(null);

  const leadsQuery = trpc.admin.getLeads.useQuery(undefined, {
    enabled: user?.email === ADMIN_EMAIL || user?.role === 'admin',
  });

  // Gate access
  if (user?.email !== ADMIN_EMAIL && user?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#05070F' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
          >
            Admin Only
          </h2>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            This page is restricted.
          </p>
        </div>
      </div>
    );
  }

  const leads = leadsQuery.data ?? [];

  // Market breakdown data
  const marketCounts: Record<string, number> = {};
  for (const lead of leads) {
    const mkt = lead.market ?? 'OTHER';
    marketCounts[mkt] = (marketCounts[mkt] ?? 0) + 1;
  }
  const marketChartData = Object.entries(marketCounts).map(([name, value]) => ({ name, value }));

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Build lead summary for outreach strategy
      const leadSummary = leads
        .slice(0, 50)
        .map(
          (l) =>
            `${l.email ?? 'unknown'} | plan: ${l.plan ?? 'free'} | market: ${l.market ?? 'AU'} | niche: ${l.targetNiche ?? '?'}`
        )
        .join('\n');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are a growth hacker for Majorka, an AI ecommerce OS for Australian dropshippers. Price: $99/mo Builder, $199/mo Scale.

Lead database (${leads.length} total users):
${leadSummary || 'No leads yet — generate outreach based on target audience'}

Keywords our ideal customers use: "${keywords}"

Generate a lead intelligence report in STRICT JSON format:
{
  "places": [
    "20 specific places where our ideal customers are posting right now. Include specific subreddits, Facebook groups, TikTok hashtags, LinkedIn search strings, Twitter/X operators"
  ],
  "outreachTemplates": {
    "reddit_comment": "Reddit comment template — adds value, mentions Majorka naturally. 3-4 sentences.",
    "facebook_post": "Facebook group post template — helpful, leads with value.",
    "twitter_reply": "Twitter reply template — short, helpful, casual.",
    "dm_template": "DM template — personal, not salesy, offers genuine help.",
    "linkedin_message": "LinkedIn connection message — professional, mentions AU ecom."
  },
  "weeklySchedule": "A weekly lead generation schedule. Mon/Wed/Fri: Reddit engagement. Tue/Thu: TikTok comment strategy. Weekend: Facebook group participation. Be specific."
}

Be extremely specific. Real subreddit names, real Facebook group names, real hashtags.`,
            },
          ],
          toolId: 'admin-leads',
          skipMemory: true,
          market: getStoredMarket(),
        }),
      });

      const data = await res.json();
      const text = data?.response || data?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse response');
      const parsed = JSON.parse(jsonMatch[0]) as LeadIntelResult;
      setResult(parsed);
      toast.success('Outreach strategy generated!');
    } catch (err: any) {
      toast.error(err?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success(`${label} copied!`);
  };

  return (
    <div
      className="h-full overflow-y-auto p-6"
      style={{ background: '#05070F', scrollbarWidth: 'thin' }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1
              className="text-xl font-extrabold flex items-center gap-2"
              style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
            >
              <Users size={20} style={{ color: '#6366F1' }} />
              Lead Intelligence
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              {leads.length} registered users · Admin view
            </p>
          </div>
          {/* Tabs */}
          <div className="flex gap-2">
            {(['leads', 'outreach'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all"
                style={{
                  background: tab === t ? 'rgba(99,102,241,0.12)' : '#F9FAFB',
                  border: `1px solid ${tab === t ? 'rgba(99,102,241,0.3)' : '#F5F5F5'}`,
                  color: tab === t ? '#6366F1' : '#6B7280',
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {t === 'leads' ? (
                  <>
                    <BarChart2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Leads
                  </>
                ) : (
                  <>
                    <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Outreach
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === 'leads' && (
          <>
            {/* Market Breakdown Chart */}
            {marketChartData.length > 0 && (
              <div
                className="rounded-xl p-5"
                style={{
                  background: '#05070F',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <h2
                  className="text-sm font-bold mb-4 flex items-center gap-2"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
                >
                  <Globe size={14} /> Market Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={marketChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {marketChartData.map((entry, index) => (
                        <Cell key={index} fill={MARKET_COLORS[entry.name] ?? MARKET_COLORS.OTHER} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a1a',
                        border: '1px solid #F0F0F0',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#F8FAFC' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#CBD5E1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Leads Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: '#05070F',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="px-4 py-3 border-b flex items-center gap-2"
                style={{ borderColor: '#F9FAFB' }}
              >
                <Mail size={14} style={{ color: '#6366F1' }} />
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
                >
                  All Users ({leads.length})
                </span>
              </div>
              {leadsQuery.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: '#6366F1' }} />
                </div>
              ) : leads.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: '#9CA3AF' }}>
                  No users yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F9FAFB' }}>
                        {['Email', 'Signup Date', 'Plan', 'Market', 'Niche'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left font-bold uppercase tracking-wider"
                            style={{
                              color: '#9CA3AF',
                              fontFamily: "'Syne', sans-serif",
                              fontSize: 10,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <tr
                          key={lead.id}
                          style={{
                            borderBottom:
                              i < leads.length - 1 ? '1px solid #F9FAFB' : 'none',
                          }}
                        >
                          <td className="px-4 py-2.5" style={{ color: '#F8FAFC' }}>
                            {lead.email ?? '—'}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: '#94A3B8' }}>
                            {lead.createdAt
                              ? new Date(lead.createdAt).toLocaleDateString('en-AU')
                              : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                background:
                                  lead.plan === 'free' || !lead.plan
                                    ? '#F9FAFB'
                                    : 'rgba(99,102,241,0.1)',
                                color:
                                  lead.plan === 'free' || !lead.plan
                                    ? '#9CA3AF'
                                    : '#6366F1',
                              }}
                            >
                              {lead.plan ?? 'free'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                background: `${MARKET_COLORS[lead.market ?? 'OTHER'] ?? MARKET_COLORS.OTHER}20`,
                                color:
                                  MARKET_COLORS[lead.market ?? 'OTHER'] ?? '#9CA3AF',
                              }}
                            >
                              {lead.market ?? 'AU'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5" style={{ color: '#94A3B8' }}>
                            {lead.targetNiche ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Generate Outreach Strategy CTA */}
            <button
              onClick={() => setTab('outreach')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#FAFAFA',
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <MessageSquare size={15} />
              Generate Outreach Strategy →
            </button>
          </>
        )}

        {tab === 'outreach' && (
          <div className="space-y-4">
            {/* Input */}
            <div className="flex gap-2">
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Keywords your ideal customers use..."
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid #F5F5F5',
                  color: '#F8FAFC',
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#FAFAFA',
                  fontFamily: "'Syne', sans-serif",
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {generating ? 'Finding...' : 'Generate Strategy'}
              </button>
            </div>

            {result && (
              <div className="space-y-6">
                {/* Places */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <h2
                    className="text-sm font-bold mb-3 flex items-center gap-2"
                    style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
                  >
                    <Globe size={14} /> Where Your Customers Are (Top 20)
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {result.places.map((place, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 rounded-lg"
                        style={{
                          background: '#05070F',
                          border: '1px solid #F9FAFB',
                          color: '#CBD5E1',
                        }}
                      >
                        {i + 1}. {place}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outreach templates */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <h2
                    className="text-sm font-bold mb-3 flex items-center gap-2"
                    style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
                  >
                    <Mail size={14} /> Outreach Templates
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(result.outreachTemplates).map(([key, template]) => (
                      <div
                        key={key}
                        className="rounded-lg p-3"
                        style={{
                          background: '#05070F',
                          border: '1px solid #F9FAFB',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-bold uppercase"
                            style={{
                              color: '#94A3B8',
                              fontFamily: "'Syne', sans-serif",
                              letterSpacing: '0.05em',
                            }}
                          >
                            {key.replace(/_/g, ' ')}
                          </span>
                          <button
                            onClick={() => copyText(template, key)}
                            className="text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-all"
                            style={{
                              background: 'rgba(99,102,241,0.08)',
                              color: '#6366F1',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Copy size={9} /> Copy
                          </button>
                        </div>
                        <p
                          className="text-xs leading-relaxed whitespace-pre-wrap"
                          style={{ color: '#CBD5E1' }}
                        >
                          {template}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly schedule */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2
                      className="text-sm font-bold flex items-center gap-2"
                      style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
                    >
                      <MessageSquare size={14} /> Weekly Schedule
                    </h2>
                    <button
                      onClick={() => copyText(result.weeklySchedule, 'Schedule')}
                      className="text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-all"
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        color: '#6366F1',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <Copy size={9} /> Copy
                    </button>
                  </div>
                  <pre
                    className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: '#CBD5E1' }}
                  >
                    {result.weeklySchedule}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
