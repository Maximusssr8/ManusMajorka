/**
 * DashboardAISuggestion — Maya's daily recommendation card.
 * Fetches once per day from /api/chat and caches in localStorage.
 * Shows a gold-bordered glass card with skeleton while loading.
 */

import { Bot, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserProfile {
  niche?: string;
  market?: string;
  experience?: string;
}

interface Props {
  userProfile?: UserProfile;
}

export function DashboardAISuggestion({ userProfile }: Props) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const cacheKey = `majorka_suggestion_${new Date().toDateString()}`;

  function fetchSuggestion() {
    setLoading(true);
    setError(false);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `In 2-3 sentences, what is the single most important next action for a ${
              userProfile?.experience || 'beginner'
            } dropshipper in the ${userProfile?.niche || 'general'} niche in ${
              userProfile?.market || 'Australia'
            }? Be specific and actionable. Start with an action verb.`,
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
        if (text) {
          setSuggestion(text);
          localStorage.setItem(cacheKey, text);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setSuggestion(cached);
      return;
    }
    fetchSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't show if not loading and no suggestion (e.g. error and empty)
  if (!loading && !suggestion && !error) return null;

  return (
    <div
      className="glass-card stat-card-top-border p-5 col-span-full"
      style={{
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 12,
        background: 'rgba(212,175,55,0.03)',
        marginBottom: 24,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Bot size={14} style={{ color: '#d4af37', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 11,
            color: '#d4af37',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          Maya&apos;s Recommendation
        </span>
        <span style={{ fontSize: 11, color: '#52525b', marginLeft: 'auto' }}>Updates daily</span>
        {!loading && (suggestion || error) && (
          <button
            onClick={() => {
              localStorage.removeItem(cacheKey);
              setSuggestion(null);
              fetchSuggestion();
            }}
            title="Refresh recommendation"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#52525b',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#d4af37')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#52525b')}
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{
            height: 16,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 6,
            width: '75%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : error ? (
        <p style={{ fontSize: 13, color: '#52525b', lineHeight: 1.6 }}>
          Could not load recommendation. Click refresh to try again.
        </p>
      ) : (
        <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.7 }}>{suggestion}</p>
      )}
    </div>
  );
}
