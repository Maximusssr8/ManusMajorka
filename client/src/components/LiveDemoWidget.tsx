/**
 * LiveDemoWidget — Real live AI demo that calls /api/chat with streaming.
 * This IS the sales pitch — seeing real AI responses converts better than any copy.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Zap, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const mono = "'DM Mono', 'Fira Code', 'Courier New', monospace";
const syne = 'Syne, sans-serif';
const dm = "'DM Sans', sans-serif";

const LIVE_STYLES = `
@keyframes live-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(212,175,55,0.12), 0 0 80px rgba(212,175,55,0.04); }
  50%       { box-shadow: 0 0 60px rgba(212,175,55,0.22), 0 0 120px rgba(212,175,55,0.08); }
}
@keyframes cursor-blink-live {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}
@keyframes pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(0.8); }
}
@keyframes thinking-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40%           { transform: scale(1.0); opacity: 1; }
}
@keyframes scan-line {
  0%   { top: -2px; }
  100% { top: 100%; }
}
.live-cursor {
  display: inline-block; width: 2px; height: 14px;
  background: #d4af37; border-radius: 1px;
  vertical-align: middle; margin-left: 2px;
  animation: cursor-blink-live 0.7s step-end infinite;
}
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #d4af37;
  animation: thinking-dot 1.4s ease-in-out infinite;
}
.live-dot:nth-child(2) { animation-delay: 0.16s; }
.live-dot:nth-child(3) { animation-delay: 0.32s; }
.shimmer-cta {
  position: relative; overflow: hidden;
}
.shimmer-cta::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: demo-shimmer-live 2.5s linear infinite;
  pointer-events: none;
}
@keyframes demo-shimmer-live {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
`;

const DEMO_PROMPTS = [
  'Find winning products for AU pet niche under $20 COGS',
  'Validate: posture corrector, buy $8, sell $49, AU market',
  'Generate 3 Facebook ad angles for resistance bands, AU women 30-45',
  "What's the profit margin if I buy for $12 and sell for $59 with $15 Meta spend?",
];

const DEMO_USES_KEY = 'majorka_demo_uses';
const MAX_DEMO_USES = 3;

function getDemoUses(): number {
  try {
    return parseInt(localStorage.getItem(DEMO_USES_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function incrementDemoUses(): number {
  try {
    const n = getDemoUses() + 1;
    localStorage.setItem(DEMO_USES_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

export default function LiveDemoWidget() {
  const [activePrompt, setActivePrompt] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [thinking, setThinking] = useState(false);
  const [usesLeft, setUsesLeft] = useState(MAX_DEMO_USES - getDemoUses());
  const [showSignup, setShowSignup] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [promptSuggestionIdx, setPromptSuggestionIdx] = useState(0);
  const responseRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate prompt suggestion every 3s when idle
  useEffect(() => {
    if (streaming || thinking || response) return;
    const id = setInterval(() => {
      setPromptSuggestionIdx((i) => (i + 1) % DEMO_PROMPTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [streaming, thinking, response]);

  // Scroll response to bottom
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  // Timer while streaming
  useEffect(() => {
    if (streaming) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streaming]);

  const handleSend = async (prompt?: string) => {
    const text = prompt ?? inputValue.trim();
    if (!text || streaming || thinking) return;

    const uses = getDemoUses();
    if (uses >= MAX_DEMO_USES) {
      setShowSignup(true);
      return;
    }

    setActivePrompt(text);
    setInputValue('');
    setResponse('');
    setThinking(true);
    setStreaming(false);
    setShowSignup(false);
    setElapsedMs(null);

    const newUses = incrementDemoUses();
    setUsesLeft(MAX_DEMO_USES - newUses);

    try {
      const abort = new AbortController();
      abortRef.current = abort;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          toolName: 'product-discovery',
          market: 'AU',
          stream: true,
        }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      setThinking(false);
      setStreaming(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          // Vercel AI SDK format: 0:"text"
          const textMatch = trimmed.match(/^0:"(.*)"$/);
          if (textMatch) {
            const chunk = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            fullText += chunk;
            setResponse(fullText);
            continue;
          }
          // Plain text fallback
          if (!trimmed.startsWith('d:') && !trimmed.startsWith('e:') && !trimmed.startsWith('2:')) {
            // Check if it's raw text (not data event)
            try { JSON.parse(trimmed); } catch {
              // Not JSON, treat as text
              if (!trimmed.startsWith('data:')) {
                fullText += trimmed + '\n';
                setResponse(fullText);
              }
            }
          }
        }
      }

      setStreaming(false);
      if (!fullText) {
        setResponse('Maya analysed your request. Sign up to see the full results with detailed market data, supplier contacts, and ad angles.');
      }

      // If used all, show signup after response
      if (MAX_DEMO_USES - newUses <= 0) {
        setTimeout(() => setShowSignup(true), 2000);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setThinking(false);
      setStreaming(false);
      setResponse('Maya is ready — sign up for full access to real-time market data.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setActivePrompt('');
    setInputValue('');
    setResponse('');
    setThinking(false);
    setStreaming(false);
    setShowSignup(false);
    setElapsedMs(null);
  };

  return (
    <div style={{ maxWidth: 680, width: '100%', minWidth: 0 }}>
      <style>{LIVE_STYLES}</style>

      {/* Main terminal card */}
      <div
        style={{
          background: 'rgba(8,10,14,0.96)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 18,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: 'live-glow 5s ease-in-out infinite',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scanline overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.004) 0px, rgba(255,255,255,0.004) 1px, transparent 1px, transparent 4px)',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'relative', zIndex: 2,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px',
            background: 'rgba(0,0,0,0.4)',
            borderBottom: '1px solid rgba(212,175,55,0.12)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f' }} />
          </div>

          <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Zap size={12} color="#d4af37" />
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 12, color: '#d4af37', letterSpacing: '0.08em' }}>
              Maya AI — Live Demo
            </span>
          </div>

          {/* Uses left indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {usesLeft > 0 ? (
              <span style={{ fontSize: 11, color: '#52525b', fontFamily: dm }}>
                {usesLeft} free {usesLeft === 1 ? 'query' : 'queries'} left
              </span>
            ) : (
              <span style={{ fontSize: 11, color: '#d4af37', fontFamily: dm }}>Sign up for unlimited</span>
            )}
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse-live 2s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Prompt suggestions bar */}
        {!response && !thinking && !streaming && (
          <div
            style={{
              position: 'relative', zIndex: 2,
              padding: '10px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', gap: 8, overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {DEMO_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => { setInputValue(p); handleSend(p); }}
                style={{
                  flexShrink: 0,
                  background: i === promptSuggestionIdx ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${i === promptSuggestionIdx ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8, padding: '6px 12px',
                  fontSize: 11, color: i === promptSuggestionIdx ? '#d4af37' : '#52525b',
                  fontFamily: dm, cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Current prompt display */}
        {activePrompt && (
          <div
            style={{
              position: 'relative', zIndex: 2,
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(212,175,55,0.03)',
            }}
          >
            <span style={{ color: '#d4af37', fontFamily: mono, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>›</span>
            <span style={{ fontFamily: dm, fontSize: 13, color: '#e2e8f0', flex: 1, lineHeight: 1.5 }}>
              {activePrompt}
            </span>
            {!streaming && !thinking && (
              <button
                onClick={handleReset}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: 11, fontFamily: dm, padding: '2px 6px', borderRadius: 4, transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#d4af37')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
              >
                new query
              </button>
            )}
          </div>
        )}

        {/* Response area */}
        <div
          ref={responseRef}
          style={{
            position: 'relative', zIndex: 2,
            padding: '16px 18px',
            minHeight: 200, maxHeight: 340,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          }}
        >
          {/* Thinking state */}
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}
            >
              <div style={{ display: 'flex', gap: 5 }}>
                <div className="live-dot" />
                <div className="live-dot" />
                <div className="live-dot" />
              </div>
              <span style={{ fontFamily: dm, fontSize: 13, color: '#94949e' }}>Maya is thinking...</span>
            </motion.div>
          )}

          {/* Streaming response */}
          {(streaming || (response && !thinking)) && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: dm, fontSize: 13, color: '#d1d5db', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                <ResponseRenderer text={response} />
                {streaming && <span className="live-cursor" />}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Idle state */}
          {!thinking && !streaming && !response && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 12, opacity: 0.5 }}>
              <Sparkles size={28} color="#d4af37" />
              <p style={{ fontFamily: dm, fontSize: 13, color: '#52525b', textAlign: 'center', maxWidth: 300 }}>
                Click a prompt above or type your own question to see Maya in action — live AI, no fake responses
              </p>
            </div>
          )}
        </div>

        {/* Speed indicator */}
        {elapsedMs !== null && !thinking && response && (
          <div
            style={{
              position: 'relative', zIndex: 2,
              padding: '6px 18px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>
              Response in {(elapsedMs / 1000).toFixed(1)}s
            </span>
            <span style={{ fontSize: 11, color: '#22c55e', fontFamily: dm, fontWeight: 600 }}>
              ● Live — Real Claude AI
            </span>
          </div>
        )}

        {/* Input row */}
        <div
          style={{
            position: 'relative', zIndex: 2,
            padding: '12px 18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 10, alignItems: 'center',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming || thinking || showSignup}
            placeholder={usesLeft > 0 ? 'Ask Maya anything about dropshipping...' : 'Sign up for unlimited queries'}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#e2e8f0',
              fontFamily: dm,
              outline: 'none',
              minHeight: 42,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.4)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.15)')}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || streaming || thinking || showSignup}
            style={{
              background: inputValue.trim() && !streaming && !thinking && !showSignup
                ? 'linear-gradient(135deg, #d4af37, #b8941f)'
                : 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 10,
              width: 42, height: 42,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: inputValue.trim() && !streaming && !thinking ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={16} color={inputValue.trim() && !streaming && !thinking ? '#000' : '#52525b'} />
          </button>
        </div>

        {/* Signup gate overlay */}
        <AnimatePresence>
          {showSignup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(8,10,14,0.92)',
                backdropFilter: 'blur(8px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 20, padding: 32,
                textAlign: 'center',
              }}
            >
              <Lock size={32} color="#d4af37" />
              <div>
                <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 20, color: '#f5f5f5', marginBottom: 8 }}>
                  You've seen what Maya can do
                </h3>
                <p style={{ fontFamily: dm, fontSize: 14, color: '#94949e', lineHeight: 1.6, maxWidth: 340 }}>
                  Sign up free to get unlimited queries, product research, ad generation, and all 20+ tools.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="shimmer-cta"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #d4af37, #b8941f)',
                  color: '#000',
                  borderRadius: 12, padding: '14px 36px',
                  fontFamily: syne, fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', minHeight: 52,
                  boxShadow: '0 0 32px rgba(212,175,55,0.3)',
                }}
              >
                Start Free — No Credit Card →
              </Link>
              <button
                onClick={() => { setShowSignup(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: 12, fontFamily: dm }}
              >
                or keep browsing
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom labels */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '0 4px' }}>
        <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>
          Try it free — no signup required
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: '#d4af37', fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
}

// Renders markdown-ish response with highlighting
function ResponseRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (!line) return <div key={i} style={{ height: 6 }} />;

        if (line.startsWith('## ')) {
          return (
            <div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#d4af37', margin: '14px 0 6px', lineHeight: 1.3 }}>
              {line.replace(/^## /, '')}
            </div>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 17, color: '#f5f5f5', margin: '14px 0 8px', lineHeight: 1.3 }}>
              {line.replace(/^# /, '')}
            </div>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#e2e8f0', margin: '10px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {line.replace(/^### /, '')}
            </div>
          );
        }
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('→')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 3 }}>
              <span style={{ color: '#d4af37', flexShrink: 0, marginTop: 2 }}>→</span>
              <span style={{ color: '#94949e', fontSize: 13, lineHeight: 1.7 }}>
                {renderInline(line.replace(/^[-•→]\s*/, ''))}
              </span>
            </div>
          );
        }
        if (/^[💰💸📊🚚⚡💳✅🔥🎯📈🏆]/u.test(line)) {
          return (
            <div key={i} style={{ fontSize: 13, color: '#94949e', lineHeight: 1.7, marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>
              {renderInline(line)}
            </div>
          );
        }

        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const hasBold = parts.some(p => p.startsWith('**'));
        if (hasBold) {
          return (
            <div key={i} style={{ fontSize: 13, color: '#94949e', lineHeight: 1.7, marginBottom: 3 }}>
              {renderInline(line)}
            </div>
          );
        }

        return (
          <div key={i} style={{ fontSize: 13, color: '#94949e', lineHeight: 1.7, marginBottom: 3 }}>
            {line}
          </div>
        );
      })}
    </>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} style={{ color: '#f5f5f5', fontWeight: 700 }}>{p.replace(/\*\*/g, '')}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
