import { useMemo, useState, useCallback } from 'react';
import { useNicheStats } from '@/hooks/useNicheStats';
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';
import { scorePillStyle } from '@/lib/scorePill';
import { shortenCategory, fmtK } from '@/lib/categoryColor';

import { toast } from 'sonner';
import { C } from '@/lib/designTokens';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontMono;

interface Template {
  title: string;
  body: string;
  note: string;
}

const TEMPLATES: Template[] = [
  {
    title: 'Cold DM — Product Review Ask',
    body: `Hey {creator} — love your content on {topic}! I run a small brand selling {product} and I think it would be a perfect fit for your audience. Would you be open to trying it out and sharing your honest thoughts? Happy to send one over with no strings attached.`,
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
  {
    title: 'Paid Partnership Proposal',
    body: `Hi {creator} — I've been following your content on {topic} and think there's a strong alignment with {brand}. I'd love to propose a paid partnership: 1 dedicated post + 2 story mentions over 2 weeks. We'll provide the product, creative brief, and a flat fee of {fee} for the deliverables. Happy to negotiate — let me know if you're interested and I'll send over the full brief.`,
    note: 'For established creators with proven engagement. Set clear deliverables and payment terms upfront.',
  },
  {
    title: 'UGC Content License',
    body: `Hi {creator} — I came across your video on {topic} and it perfectly captures the vibe we're going for at {brand}. Rather than asking you to create something new, I'd love to license that existing piece of content to run as a paid ad on our channels. We'd offer a flat fee of {fee} for a 90-day license, with full credit to you. Would you be open to that?`,
    note: 'Great for licensing existing content for ads. Lower effort for the creator, fast turnaround for you.',
  },
];

function creatorTierByPrice(avgPrice: number): { label: string; reach: string; cpm: string } {
  if (avgPrice > 80) return {
    label: 'Macro influencer',
    reach: '500k+ followers',
    cpm: '$30–$60 CPM',
  };
  if (avgPrice > 40) return {
    label: 'Mid-tier influencer',
    reach: '100k–500k followers',
    cpm: '$15–$30 CPM',
  };
  if (avgPrice >= 15) return {
    label: 'Micro influencer',
    reach: '10k–100k followers',
    cpm: '$8–$15 CPM',
  };
  return {
    label: 'Nano influencer',
    reach: '1k–10k followers',
    cpm: '$3–$8 CPM',
  };
}

interface MatchResult {
  niche: { name: string; count: number; totalOrders: number; avgScore: number; avgPrice: number };
  tier: { label: string; reach: string; cpm: string };
  hashtags: string[];
  isExact: boolean;
  isFuzzy: boolean;
  noMatch: boolean;
}

export default function Creators() {
  const { niches: rawNiches, loading } = useNicheStats(20);
  const niches = useMemo(
    () => [...rawNiches].sort((a, b) => b.avgScore - a.avgScore).slice(0, 12),
    [rawNiches]
  );
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const matchResults = useMemo((): MatchResult[] | null => {
    if (!query.trim() || niches.length === 0) return null;
    const q = query.toLowerCase().trim();

    // Exact matches (category name includes query)
    const exactMatches = niches.filter((n) => n.name.toLowerCase().includes(q));
    if (exactMatches.length > 0) {
      return exactMatches.slice(0, 3).map((match) => {
        const tier = creatorTierByPrice(match.avgPrice);
        const baseTags = ['#tiktokmademebuyit', '#fyp', '#auhaul', '#dropshipau'];
        const catTag = '#' + shortenCategory(match.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        return { niche: match, tier, hashtags: [catTag, ...baseTags], isExact: true, isFuzzy: false, noMatch: false };
      });
    }

    // Fuzzy matches (word overlap)
    const fuzzyMatches = niches.filter((n) =>
      n.name.toLowerCase().split(/\s+/).some((w) => q.includes(w) || w.includes(q))
    );
    if (fuzzyMatches.length > 0) {
      return fuzzyMatches.slice(0, 3).map((match) => {
        const tier = creatorTierByPrice(match.avgPrice);
        const baseTags = ['#tiktokmademebuyit', '#fyp', '#auhaul', '#dropshipau'];
        const catTag = '#' + shortenCategory(match.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        return { niche: match, tier, hashtags: [catTag, ...baseTags], isExact: false, isFuzzy: true, noMatch: false };
      });
    }

    // No match
    return [];
  }, [query, niches]);

  const copyHashtag = useCallback(async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedHashtag(tag);
      setTimeout(() => setCopiedHashtag(null), 1500);
      toast.success(`Copied ${tag}`);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

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
      setTimeout(() => setCopied(null), 2000);
      toast.success('Copied to clipboard');
    } catch { toast.error('Failed to copy'); }
  };

  const displayNiches = showAll ? niches : niches.slice(0, 8);

  return (
    <motion.div {...fadeIn}>
    <div style={{ padding: '32px 36px', overflow: 'auto', color: C.text, fontFamily: sans }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16, fontFamily: sans }}>
        <span style={{ cursor: 'default' }}>Home</span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: C.accentHover }}>Creator Strategy</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: display, fontSize: 28, fontWeight: 800,
          letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
          color: '#ededed',
        }}>Creator Strategy</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>
          Find the right product categories for influencer partnerships and get ready-made outreach templates.
        </p>
        <div style={{
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.5,
        }}>
          Creator profiles database coming in V2 — currently showing category intelligence to help you plan influencer campaigns.
        </div>
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
              borderRadius: 8,
              padding: '14px 18px 14px 44px',
              color: '#f5f5f5',
              fontFamily: sans,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {matchResults !== null && matchResults.length === 0 && (
          <div style={{
            background: C.raised,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              No matching category found
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
              Try a different search term. Here are some suggestions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {niches.slice(0, 5).map((n) => (
                <button
                  key={n.name}
                  onClick={() => setQuery(n.name)}
                  style={{
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: C.accentHover,
                    fontFamily: sans, fontSize: 12,
                    padding: '4px 12px', borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  {shortenCategory(n.name)}
                </button>
              ))}
            </div>
          </div>
        )}

        {matchResults !== null && matchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {matchResults[0].isFuzzy && (
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>⚠</span>
                <span>No exact match — showing closest results</span>
              </div>
            )}
            {matchResults.map((result) => (
              <div key={result.niche.name} style={{
                background: C.raised,
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 8,
                padding: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Matched Category</div>
                  <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{shortenCategory(result.niche.name)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{result.niche.count} products · {fmtK(result.niche.totalOrders)} orders · avg ${Math.round(result.niche.avgPrice)} AUD</div>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recommended Tier</div>
                  <div style={{ fontFamily: display, fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{result.tier.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{result.tier.reach}</div>
                  <div style={{ fontSize: 12, color: C.green, marginTop: 2 }}>{result.tier.cpm}</div>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hashtags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.hashtags.map((t) => (
                      <span
                        key={t}
                        onClick={() => copyHashtag(t)}
                        style={{
                          background: copiedHashtag === t ? 'rgba(16,185,129,0.15)' : 'rgba(212,175,55,0.1)',
                          border: `1px solid ${copiedHashtag === t ? 'rgba(16,185,129,0.3)' : 'rgba(212,175,55,0.2)'}`,
                          color: copiedHashtag === t ? C.green : C.accentHover,
                          fontFamily: mono, fontSize: 11,
                          padding: '2px 8px', borderRadius: 999,
                          cursor: 'pointer',
                          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                        }}
                      >
                        {copiedHashtag === t ? '✓ Copied' : t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Top Categories */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Top Categories for Creator Collab</h2>
        <div
          className="mj-creator-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mj-shim" style={{ height: 140, borderRadius: 8 }} />
              ))
            : displayNiches.map((n) => {
                const sp = scorePillStyle(n.avgScore);
                const short = shortenCategory(n.name);
                const initial = short.trim().charAt(0).toUpperCase() || '•';
                const nicheTag = 'niche: ' + short.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
                return (
                  <div
                    key={n.name}
                    style={{
                      background: '#0f0f0f',
                      border: '1px solid #1a1a1a',
                      borderRadius: 8,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    {/* Header row — avatar + name/handle + score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                          border: '1px solid #1a1a1a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: display,
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#ededed',
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          title={n.name}
                          style={{
                            fontFamily: display,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#ededed',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {short}
                        </div>
                        <div
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11,
                            color: '#555555',
                          }}
                        >
                          {nicheTag}
                        </div>
                      </div>
                      <span
                        style={{
                          background: sp.background,
                          color: sp.color,
                          border: sp.border,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 6,
                        }}
                      >
                        {n.avgScore}
                      </span>
                    </div>

                    {/* 3 metrics in mono row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        padding: '10px 0',
                        borderTop: '1px solid #1a1a1a',
                        borderBottom: '1px solid #1a1a1a',
                      }}
                    >
                      <Metric label="Products" value={String(n.count)} />
                      <Metric label="Orders" value={fmtK(n.totalOrders)} />
                      <Metric label="Score" value={String(n.avgScore)} />
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => setQuery(n.name)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        background: '#3B82F6',
                        border: '1px solid #3B82F6',
                        color: '#ffffff',
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 0 0 1px rgba(59,130,246,0.3)',
                      }}
                    >
                      Explore category
                    </button>
                  </div>
                );
              })}
        </div>
        {!showAll && niches.length > 8 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => setShowAll(true)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid #1a1a1a',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Show all categories ({niches.length})
            </button>
          </div>
        )}
        {showAll && niches.length > 8 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => setShowAll(false)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid #1a1a1a',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Show fewer
            </button>
          </div>
        )}
      </section>

      {/* Section 3 — Outreach Templates */}
      <section>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: mono, fontSize: 11, fontWeight: 700,
              color: '#3B82F6',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 999,
              padding: '2px 10px',
            }}>Step 2</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>→</span>
          </div>
          <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>Reach out to creators in your niche</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Copy a template, personalize the placeholders, and send your first DM.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {TEMPLATES.map((t) => (
            <div key={t.title} style={{
              background: C.raised,
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
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
                  background: copied === t.title ? 'rgba(16,185,129,0.15)' : 'rgba(212,175,55,0.1)',
                  border: `1px solid ${copied === t.title ? 'rgba(16,185,129,0.3)' : 'rgba(212,175,55,0.25)'}`,
                  color: copied === t.title ? C.green : C.accentHover,
                  fontFamily: sans, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >{copied === t.title ? '✓ Copied!' : 'Copy template'}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          fontWeight: 700,
          color: '#ededed',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: '#555555',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
