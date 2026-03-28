import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

// ── Inline markdown renderer (no external deps) ───────────────────────────────
// Detect emoji-prefixed bullet lines (✅ ⚠️ 🔥 📈 etc.)
const EMOJI_BULLET_RE = /^(\u2705|\u274c|\u26a0\ufe0f|\u2757|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF]|\uD83C[\uDF00-\uDFFF]|[\u2600-\u27FF])\s+/;

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} style={{ fontWeight: 700, color: "#E0E7FF" }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} style={{ background: "rgba(0,0,0,0.3)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: 12, color: "#C4B5FD" }}>{part.slice(1, -1)}</code>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// Detect plain-text section headers: short line (≤50 chars), no ending punctuation, next line has content
function isPlainHeader(line: string, nextLine: string | undefined): boolean {
  if (line.length > 60 || line.trim().length === 0) return false;
  if (line.startsWith("-") || line.startsWith("*") || line.match(/^\d+\./)) return false;
  if (line.match(/[.!?,:;]$/)) return false; // ends with punctuation = not a header
  if (EMOJI_BULLET_RE.test(line)) return false;
  // Must look like a title: mostly title case or ALL CAPS words
  const words = line.trim().split(" ");
  if (words.length > 8) return false;
  const titleWords = words.filter(w => w.length > 2 && w[0] === w[0].toUpperCase());
  return titleWords.length >= Math.min(2, words.length);
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { nodes.push(<div key={`gap-${i}`} style={{ height: 6 }} />); i++; continue; }

    // Explicit ## headers
    if (line.startsWith("### ")) {
      nodes.push(<div key={i} style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: "#A5B4FC", marginBottom: 4, marginTop: 10, letterSpacing: "0.03em" }}>{line.slice(4)}</div>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(<div key={i} style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: "#E0E7FF", marginBottom: 6, marginTop: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 4 }}>{line.slice(3)}</div>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(<div key={i} style={{ fontFamily: brico, fontWeight: 800, fontSize: 16, color: "#F0EEFF", marginBottom: 8, marginTop: 12 }}>{line.slice(2)}</div>);
      i++; continue;
    }

    // Plain-text implicit headers (e.g. "What's Working Right Now" with no ## prefix)
    if (isPlainHeader(trimmed, lines[i + 1])) {
      nodes.push(<div key={i} style={{ fontFamily: brico, fontWeight: 800, fontSize: 14, color: "#C4B5FD", marginBottom: 5, marginTop: 12, letterSpacing: "0.01em" }}>{trimmed}</div>);
      i++; continue;
    }

    // Markdown bullets (- or * or •)
    if (line.match(/^[\-\*•] /)) {
      const content = line.replace(/^[\-\*•] /, "");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
          <span style={{ color: "#818CF8", flexShrink: 0, marginTop: 2, fontSize: 10 }}>▸</span>
          <span style={{ lineHeight: 1.6, fontSize: 14 }}>{renderInline(content)}</span>
        </div>
      );
      i++; continue;
    }

    // Emoji bullet lines (✅ ⚠️ 🔥 etc.)
    const emojiMatch = trimmed.match(/^(\S+)\s+(.*)/);
    if (emojiMatch && EMOJI_BULLET_RE.test(trimmed)) {
      const [, emoji, content] = emojiMatch;
      const isPositive = ["✅","🟢","💚","🎯","🔥","📈","💡","⭐"].some(e => trimmed.startsWith(e));
      const isWarning = ["⚠️","🔴","❌","🚫","⛔","😬"].some(e => trimmed.startsWith(e));
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4, padding: "4px 8px", borderRadius: 6, background: isPositive ? "rgba(34,197,94,0.06)" : isWarning ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)" }}>
          <span style={{ flexShrink: 0, fontSize: 14, marginTop: 1 }}>{emoji}</span>
          <span style={{ lineHeight: 1.6, fontSize: 14, color: isPositive ? "#86EFAC" : isWarning ? "#FCA5A5" : "#D1D5DB" }}>{renderInline(content)}</span>
        </div>
      );
      i++; continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      const content = line.replace(/^\d+\. /, "");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
          <span style={{ color: "#818CF8", flexShrink: 0, fontWeight: 700, minWidth: 18, fontSize: 13 }}>{num}.</span>
          <span style={{ lineHeight: 1.6, fontSize: 14 }}>{renderInline(content)}</span>
        </div>
      );
      i++; continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      nodes.push(
        <pre key={`code-${i}`} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#C4B5FD", overflowX: "auto", margin: "6px 0" }}>
          {codeLines.join("\n")}
        </pre>
      );
      i++; continue;
    }

    nodes.push(<p key={i} style={{ margin: "0 0 5px 0", lineHeight: 1.65, fontSize: 14, color: "#D1D5DB" }}>{renderInline(line)}</p>);
    i++;
  }

  return <>{nodes}</>;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 12, color: "white" }}>M</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#818CF8", display: "inline-block", animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Copy button for assistant messages ────────────────────────────────────────
function CopyMsgButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 11, color: copied ? '#10B981' : '#6B7280', display: 'flex', alignItems: 'center', gap: 3, transition: 'color 200ms', marginTop: 4 }}
    >
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userNiche, setUserNiche] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { document.title = "Maya AI | Majorka"; }, []);

  // FIX 4: Fetch user niche for dynamic chips
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('user_profiles').select('main_goal, experience_level').eq('user_id', session.user.id).single()
        .then(({ data }) => {
          if (data?.main_goal) setUserNiche(data.main_goal.split(',')[0].trim());
        });
    });
  }, []);

  // FIX 5: Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maya_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.map((m: Message) => ({ ...m, ts: new Date(m.ts) })));
        }
      }
    } catch { /* ignore */ }
  }, []);

  // FIX 5: Save to localStorage when messages change (debounced)
  useEffect(() => {
    if (messages.length === 0) return;
    const timeout = setTimeout(() => {
      try {
        const toSave = messages.slice(-20);
        localStorage.setItem('maya_chat_history', JSON.stringify(toSave));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timeout);
  }, [messages]);

  // FIX 4: Dynamic prompt chips based on user niche
  const suggestedPrompts = userNiche
    ? [
        `What ${userNiche} products should I test this week?`,
        `Write me a TikTok hook for a ${userNiche} product`,
        "How do I improve my store conversion rate?",
        `Find me a winning ${userNiche} product under $20 cost`,
      ]
    : [
        "What products should I test this week?",
        "Write me a TikTok hook for my product",
        "How do I improve my store conversion rate?",
        "Find me a winning product under $20 cost",
      ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    if (content.length > 10000) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant' as const, content: 'Message too long (max 10,000 characters). Please shorten your message.', ts: new Date() }]);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: content, history, stream: true }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Stream the response word by word
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", ts: new Date() }]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.token || parsed.text || parsed.delta || parsed.content || '';
              if (token) {
                fullText += token;
                // Strip ACTION blocks before rendering — complete blocks stripped, partial blocks hidden
                const displayText = fullText
                  .replace(/<<<ACTION>>>[\s\S]*?<<<END_ACTION>>>/g, '')
                  .replace(/<<<ACTION>>>[\s\S]*$/g, '')
                  .trim();
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: displayText } : m));
              }
            } catch {
              if (data && data !== '[DONE]' && !data.startsWith('{')) {
                fullText += data;
                const displayText = fullText
                  .replace(/<<<ACTION>>>[\s\S]*?<<<END_ACTION>>>/g, '')
                  .replace(/<<<ACTION>>>[\s\S]*$/g, '')
                  .trim();
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: displayText } : m));
              }
            }
          }
        }
      }

      // If nothing streamed, try parsing as regular JSON fallback
      if (!fullText) {
        try {
          const text = decoder.decode();
          const fallback = JSON.parse(text);
          const reply = fallback.reply || fallback.response || fallback.message || "I couldn't generate a response right now.";
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: reply } : m));
        } catch {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "I couldn't generate a response right now. Please try again." } : m));
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Connection error. Please check your internet and try again.", ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const fmtTime = (d: Date) => d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes onlinePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .maya-textarea::placeholder { color: #4B5563; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: "linear-gradient(160deg, #0F0F1A 0%, #1A1330 50%, #0D1117 100%)", overflow: "hidden" }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
              <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: "white" }}>M</span>
            </div>
            <div>
              <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: "white", lineHeight: 1.1 }}>Maya AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "onlinePulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: dm, fontSize: 12, color: "#9CA3AF" }}>Your AI ecommerce strategist</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); localStorage.removeItem('maya_chat_history'); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", color: "#9CA3AF", fontSize: 12, fontFamily: dm, transition: "all 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "#F87171"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#9CA3AF"; }}
            >
              <Trash2 size={13} /> Clear chat
            </button>
          )}
        </div>

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, paddingTop: 40 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
                  <Sparkles size={28} color="white" />
                </div>
                <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: "white", marginBottom: 8 }}>How can I help you win today?</div>
                <div style={{ fontFamily: dm, fontSize: 14, color: "#6B7280" }}>Ask me anything about products, marketing, or your Shopify store</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 520 }}>
                {suggestedPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", color: "#D1D5DB", fontFamily: dm, fontSize: 13, textAlign: "left" as const, lineHeight: 1.4, transition: "all 150ms" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = "#E0E7FF"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#D1D5DB"; }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 18 }}>
                  <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 12, color: "white" }}>M</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: msg.role === "user" ? "70%" : "75%" }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? "#6366F1" : "rgba(255,255,255,0.05)",
                  border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  fontFamily: dm,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                </div>
                {msg.role === "assistant" && msg.content && (
                  <CopyMsgButton text={msg.content} />
                )}
                <span style={{ fontFamily: dm, fontSize: 11, color: "#374151", marginTop: 4 }}>{fmtTime(msg.ts)}</span>
              </div>
            </div>
          ))}

          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 24px max(20px, env(safe-area-inset-bottom, 20px))", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,17,23,0.98)" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              className="maya-textarea"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Maya anything about your ecommerce business..."
              rows={1}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontFamily: dm, fontSize: 14, lineHeight: 1.5, resize: "none", overflowY: "auto" as const, maxHeight: 120, minHeight: 24 }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed", border: "none", transition: "all 150ms",
                background: input.trim() && !loading ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "rgba(255,255,255,0.06)",
                opacity: input.trim() && !loading ? 1 : 0.4,
              }}
              onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Send size={15} color="white" />
            </button>
          </div>
          <div style={{ fontFamily: dm, fontSize: 11, color: "#374151", textAlign: "center" as const, marginTop: 8 }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>

      </div>
    </>
  );
}
