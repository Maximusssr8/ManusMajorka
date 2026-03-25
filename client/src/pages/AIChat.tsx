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

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { nodes.push(<div key={`gap-${i}`} style={{ height: 4 }} />); i++; continue; }

    if (line.startsWith("### ")) {
      nodes.push(<div key={i} style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: "#E0E7FF", marginBottom: 4, marginTop: 8 }}>{line.slice(4)}</div>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(<div key={i} style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: "#E0E7FF", marginBottom: 6, marginTop: 10 }}>{line.slice(3)}</div>);
      i++; continue;
    }

    if (line.match(/^[\-\*•] /)) {
      const content = line.replace(/^[\-\*•] /, "");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
          <span style={{ color: "#818CF8", flexShrink: 0, marginTop: 1 }}>•</span>
          <span style={{ lineHeight: 1.6 }}>{renderInline(content)}</span>
        </div>
      );
      i++; continue;
    }

    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      const content = line.replace(/^\d+\. /, "");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
          <span style={{ color: "#818CF8", flexShrink: 0, fontWeight: 700, minWidth: 18 }}>{num}.</span>
          <span style={{ lineHeight: 1.6 }}>{renderInline(content)}</span>
        </div>
      );
      i++; continue;
    }

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

    nodes.push(<p key={i} style={{ margin: "0 0 4px 0", lineHeight: 1.6 }}>{renderInline(line)}</p>);
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

const SUGGESTED_PROMPTS = [
  "What products should I test this week?",
  "Write me a TikTok hook for my product",
  "How do I improve my store conversion rate?",
  "Find me a winning product under $20 cost",
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { document.title = "Maya AI | Majorka"; }, []);

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
        body: JSON.stringify({ message: content, history, stream: false }),
      });

      const data = await res.json();
      const reply = data.reply || data.response || data.message || data.content || "I couldn't generate a response right now. Please try again.";

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply, ts: new Date() }]);
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
              onClick={() => setMessages([])}
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
                {SUGGESTED_PROMPTS.map(prompt => (
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
                <span style={{ fontFamily: dm, fontSize: 11, color: "#374151", marginTop: 4 }}>{fmtTime(msg.ts)}</span>
              </div>
            </div>
          ))}

          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 24px 20px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,17,23,0.98)" }}>
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
