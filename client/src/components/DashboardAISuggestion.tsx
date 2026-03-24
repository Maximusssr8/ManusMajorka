/**
 * DashboardAISuggestion — Maya's personalised 3-card smart suggestions bar.
 * Shows 3 action cards with context-aware recommendations.
 * Daily cached in localStorage. Framer Motion entrance.
 */
import { motion } from 'framer-motion';
import { Bot, RefreshCw, ArrowRight, Zap, TrendingUp, BarChart2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  niche?: string;
  market?: string;
  experience?: string;
}

interface ActionCard {
  icon: 'zap' | 'trending' | 'chart';
  title: string;
  context: string;
  action: string;
  path: string;
  prefill?: string;
  color: string;
}

interface Props {
  userProfile?: UserProfile;
}

const ICON_MAP = {
  zap: Zap,
  trending: TrendingUp,
  chart: BarChart2,
};

const COLOR_MAP = {
  zap: '#6366F1',
  trending: '#22c55e',
  chart: '#4ab8f5',
};

const FALLBACK_CARDS: ActionCard[] = [
  {
    icon: 'zap',
    title: 'Find a winning product',
    context: 'Start with AI product discovery',
    action: 'Discover Now',
    path: '/app/product-discovery',
    color: '#6366F1',
  },
  {
    icon: 'trending',
    title: 'Check AU trend radar',
    context: 'See what\'s going viral this week',
    action: 'View Trends',
    path: '/app/trend-radar',
    color: '#22c55e',
  },
  {
    icon: 'chart',
    title: 'Calculate your margins',
    context: 'Know your numbers before you launch',
    action: 'Run Numbers',
    path: '/app/profit-calculator',
    color: '#4ab8f5',
  },
];

function parseCards(text: string, profile: UserProfile): ActionCard[] {
  try {
    // Try JSON parse first
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.slice(0, 3).map((c: any, i: number) => ({
          icon: (['zap', 'trending', 'chart'] as const)[i % 3],
          title: c.title || c.action || 'Action',
          context: c.context || c.reason || c.description || '',
          action: c.cta || c.button || 'Do This',
          path: c.path || '/app/product-discovery',
          color: [COLOR_MAP.zap, COLOR_MAP.trending, COLOR_MAP.chart][i % 3],
        }));
      }
    }
  } catch {}

  // Build contextual cards from profile
  const niche = profile.niche || 'general';
  const market = profile.market || 'Australia';

  return [
    {
      icon: 'zap' as const,
      title: `Validate a ${niche} product`,
      context: `Based on your ${niche} niche in ${market}`,
      action: 'Validate Now',
      path: '/app/validate',
      prefill: niche,
      color: COLOR_MAP.zap,
    },
    {
      icon: 'trending' as const,
      title: `${niche} trending this week`,
      context: `What\'s hot in ${market} right now`,
      action: 'See Trends',
      path: '/app/trend-radar',
      color: COLOR_MAP.trending,
    },
    {
      icon: 'chart' as const,
      title: 'Run a saturation check',
      context: `Is your ${niche} niche still open?`,
      action: 'Check Now',
      path: '/app/saturation-checker',
      color: COLOR_MAP.chart,
    },
  ];
}

export function DashboardAISuggestion({ userProfile }: Props) {
  const [cards, setCards] = useState<ActionCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { session } = useAuth();

  const cacheKey = `majorka_suggestions_v2_${new Date().toDateString()}`;

  function fetchSuggestions() {
    setLoading(true);

    const niche = userProfile?.niche || 'general';
    const market = userProfile?.market || 'Australia';
    const experience = userProfile?.experience || 'beginner';

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
            content: `You are Maya, an AI ecommerce assistant. Give 3 specific actionable suggestions for a ${experience} dropshipper in the ${niche} niche in ${market}. Return ONLY a JSON array: [{"title":"short title","context":"one line why this matters for their niche","cta":"button label","path":"/app/TOOL_NAME"}] Use these valid paths: /app/product-discovery, /app/validate, /app/trend-radar, /app/profit-calculator, /app/saturation-checker, /app/supplier-finder, /app/meta-ads. Be specific to ${niche}. Return ONLY the JSON array.`,
          },
        ],
        toolName: 'ai-chat',
        market: userProfile?.market || 'AU',
        stream: false,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data.content || data.text || data.result || '';
        const parsed = parseCards(text, userProfile || {});
        setCards(parsed);
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      })
      .catch(() => {
        setCards(parseCards('', userProfile || {}));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setCards(JSON.parse(cached));
        return;
      }
    } catch {}
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    try { localStorage.removeItem(cacheKey); } catch {}
    setCards(null);
    fetchSuggestions();
  };

  const displayCards = cards || (loading ? null : FALLBACK_CARDS);

  return (
    <div className="col-span-full" style={{ marginBottom: 24 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Bot size={13} style={{ color: '#6366F1', flexShrink: 0 }} />
        <span style={{
          fontSize: 11, color: '#6366F1', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          Maya's Smart Actions
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
          {loading ? 'Personalising...' : 'Updated daily'}
        </span>
        {!loading && (
          <button
            onClick={handleRefresh}
            title="Refresh suggestions"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', padding: '2px 4px',
              display: 'flex', alignItems: 'center',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#6366F1')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF')}
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} style={{
                background: '#FAFAFA',
                border: '1px solid #F9FAFB',
                borderRadius: 12, padding: '16px 18px',
                minHeight: 100,
              }}>
                <div style={{ height: 10, background: '#F9FAFB', borderRadius: 5, width: '60%', marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 8, background: '#F9FAFB', borderRadius: 4, width: '80%', marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 8, background: '#F9FAFB', borderRadius: 4, width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))
          : (displayCards || FALLBACK_CARDS).map((card, i) => {
              const Icon = ICON_MAP[card.icon];
              const cardColor = card.color || COLOR_MAP[card.icon];

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
                  style={{
                    background: '#FAFAFA',
                    border: `1px solid #E5E7EB`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${cardColor}40`;
                    el.style.background = `${cardColor}08`;
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '#E5E7EB';
                    el.style.background = '#FAFAFA';
                    el.style.transform = '';
                  }}
                  onClick={() => {
                    if (card.prefill) {
                      sessionStorage.setItem('majorka_prefill', card.prefill);
                    }
                    setLocation(card.path);
                  }}
                >
                  {/* Color accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${cardColor}, transparent)`,
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: `${cardColor}15`,
                    border: `1px solid ${cardColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                    <Icon size={14} color={cardColor} />
                  </div>

                  {/* Title */}
                  <div style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 700, fontSize: 13,
                    color: '#0A0A0A', marginBottom: 4, lineHeight: 1.3,
                  }}>
                    {card.title}
                  </div>

                  {/* Context */}
                  <div style={{
                    fontSize: 11, color: '#9CA3AF',
                    fontFamily: 'DM Sans, sans-serif',
                    lineHeight: 1.5, marginBottom: 12,
                  }}>
                    {card.context}
                  </div>

                  {/* CTA */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 700, color: cardColor,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}>
                    {card.action}
                    <ArrowRight size={11} />
                  </div>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
