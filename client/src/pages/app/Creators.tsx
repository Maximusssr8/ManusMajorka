import { useMemo, useState } from 'react';
import { useNicheStats } from '@/hooks/useNicheStats';
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';
import { scorePillStyle } from '@/lib/scorePill';
import { shortenCategory, fmtK } from '@/lib/categoryColor';

import { C } from '@/lib/designTokens';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontBody;

interface Template {
  title: string;
  body: string;
  note: string;
}

const TEMPLATES: Template[] = [
  {
    title: 'Cold DM — Product Review Ask',
    body: `Hey {creator} — love your content on {topic}! I run a small AU brand selling {product} and I think it would be a perfect fit for your audience. Would you be open to trying it out and sharing your honest thoughts? Happy to send one over with no strings attached.`,
    note: 'Use for creators with < 100k followers. No payment asked upfront — just gifting.',
  },
  {
    title: 'Commission Collab Offer',
    body: `Hi {creator} — I've been watching your content for a while and your engagement on {category} posts is impressive. I run {brand} and I'd love to set up a commission-based partnership. 15% per sale using your unique code, paid weekly via PayPal. No fixed fee, you only earn if your audience buys. Interested in seeing the product first?`,
    note: 'Best for creators who have done collabs before. Low risk for both sides.',
  },
  {
    title: 'Gifting for Content',
    body: `Hi {creator} — saw your {recent_post} and it stopped my scroll. I'd love to send you our {product} for free in exchange for one organic post or story mention if you genuinely like it. No script, no hard sell. DM me your shipping info and I'll get it out today.`,
    note: 'Highest response rate. Simple, honest, and low-commitment.',
  },
];

function creatorTier(score: number): { label: string; reach: string; cpm: string } {
  if (score >= 90) return {
    label: 'Micro influencer',
    reach: '10k–100k followers',
    cpm: '$8–$15 CPM',
  };
  if (score >= 70) return {
    label: 'Macro influencer',
    reach: '100k–1M followers',
    cpm: '$12–$25 CPM',
  };
  return {
    label: 'Brand ambassador',
    reach: 'Long-term partnership',
    cpm: '$5–$12 CPM',
  };
}

export default function Creators() {
  const { niches: rawNiches, loading } = useNicheStats(20);
  // Re-rank by average score for creator matching (highest-quality categories first)
  const niches = useMemo(
    () => [...rawNiches].sort((a, b) => b.avgScore - a.avgScore).slice(0, 12),
    [rawNiches]
  );
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const matchResult = useMemo(() => {
    if (!query.trim() || niches.length === 0) return null;
    const q = query.toLowerCase();
    const match = niches.find((n) => n.name.toLowerCase().includes(q))
      ?? niches.find((n) => n.name.toLowerCase().split(/\s+/).some((w) => q.includes(w)))
      ?? niches[0];
    const tier = creatorTier(match.avgScore);
    const baseTags = ['#tiktokmademebuyit', '#fyp', '#auhaul', '#dropshipau'];
    const catTag = '#' + shortenCategory(match.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      niche: match,
      tier,
      hashtags: [catTag, ...baseTags],
    };
  }, [query, niches]);

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="space-y-2">
        <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    </div>
  );

  const copyTemplate = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  return (
    <motion.div {...fadeIn}>
    <div style={{ padding: '32px 36px', overflow: 'auto', color: C.text, fontFamily: sans }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: display, fontSize: 28, fontWeight: 800,
          letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Creator Intelligence</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Find creators to partner with based on what's selling — powered by product trend signals
        </p>
      </div>

      {/* Section 1 — Product-Creator Match */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Find creators for a product</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
          Type a product niche or category. We match it to real category data from the Majorka database.
        </p>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. kitchen gadgets, phone cases, pet toys…"
            style={{
              width: '100%',
              background: C.raised,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '14px 18px 14px 44px',
              color: '#f5f5f5',
              fontFamily: sans,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {matchResult && (
          <div style={{
            background: C.raised,
            border: '1px solid rgba(124,106,255,0.2)',
            borderRadius: 12,
            padding: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Matched Category</div>
              <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{shortenCategory(matchResult.niche.name)}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{matchResult.niche.count} products · {fmtK(matchResult.niche.totalOrders)} orders</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recommended Tier</div>
              <div style={{ fontFamily: display, fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{matchResult.tier.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{matchResult.tier.reach}</div>
              <div style={{ fontSize: 12, color: C.green, marginTop: 2 }}>{matchResult.tier.cpm}</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hashtags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {matchResult.hashtags.map((t) => (
                  <span key={t} style={{
                    background: 'rgba(124,106,255,0.1)',
                    border: '1px solid rgba(124,106,255,0.2)',
                    color: C.accentHover,
                    fontFamily: mono, fontSize: 11,
                    padding: '2px 8px', borderRadius: 999,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 2 — Top Categories */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Top Categories for Creator Collab</h2>
        <div style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', paddingBottom: 8,
          scrollbarWidth: 'none' as const,
          minHeight: 0,
        }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mj-shim" style={{ width: 240, height: 180, borderRadius: 12, flexShrink: 0 }} />
              ))
            : niches.slice(0, 8).map((n) => {
                const tier = creatorTier(n.avgScore);
                const sp = scorePillStyle(n.avgScore);
                return (
                  <div key={n.name} style={{
                    flexShrink: 0,
                    width: 240,
                    background: C.raised,
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</span>
                      <span style={{
                        background: sp.background, color: sp.color, border: sp.border,
                        fontFamily: mono, fontSize: 11, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 999,
                      }}>{n.avgScore}</span>
                    </div>
                    <div style={{ fontFamily: display, fontSize: 17, fontWeight: 700, color: C.text }}>{shortenCategory(n.name)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{n.count} products tracked</div>
                    <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Recommended</div>
                      <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{tier.label}</div>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Section 3 — Outreach Templates */}
      <section>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Outreach Templates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {TEMPLATES.map((t) => (
            <div key={t.title} style={{
              background: C.raised,
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ fontFamily: display, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>{t.title}</div>
              <div style={{
                fontFamily: sans, fontSize: 12, color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.55, whiteSpace: 'pre-wrap',
                background: 'rgba(255,255,255,0.03)',
                padding: 14, borderRadius: 8,
                marginBottom: 10, flex: 1,
              }}>{t.body}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{t.note}</div>
              <button
                onClick={() => copyTemplate(t.title, t.body)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: copied === t.title ? 'rgba(16,185,129,0.15)' : 'rgba(124,106,255,0.1)',
                  border: `1px solid ${copied === t.title ? 'rgba(16,185,129,0.3)' : 'rgba(124,106,255,0.25)'}`,
                  color: copied === t.title ? C.green : C.accentHover,
                  fontFamily: sans, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >{copied === t.title ? '✓ Copied' : 'Copy template'}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
    </motion.div>
  );
}
