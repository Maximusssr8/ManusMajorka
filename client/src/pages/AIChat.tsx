import React, { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, Send, Sparkles, Trash2, Package, X, Search } from "lucide-react";
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from "../lib/supabase";
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
import { useLocation } from 'wouter';

const brico = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

// Session boundary: gap > 30min between messages = new session
const SESSION_GAP_MS = 30 * 60 * 1000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

interface AttachedProduct {
  id: string;
  product_title: string;
  price_aud: number | null;
  orders_count?: number | null;
  winning_score?: number | null;
}

interface ProductSearchResult {
  id: string;
  product_title: string;
  price_aud: number | null;
  orders_count?: number | null;
  winning_score?: number | null;
  image_url?: string | null;
}

function fmtSessionDate(d: Date): string {
  const day = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '');
  return `${day}, ${time}`;
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

function stripActionBlocks(t: string): string {
  return t.replace(/<<<ACTION>>>[\s\S]*?<<<END_ACTION>>>/g, '').replace(/<<<ACTION>>>[\s\S]*$/g, '').trim();
}

function renderMarkdown(text: string): React.ReactNode {
  // Safety net: strip any ACTION blocks that leaked through
  text = stripActionBlocks(text);
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
          <span style={{ color: "#6ba3ff", flexShrink: 0, marginTop: 2, fontSize: 10 }}>▸</span>
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
          <span style={{ color: "#6ba3ff", flexShrink: 0, fontWeight: 700, minWidth: 18, fontSize: 13 }}>{num}.</span>
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
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 12, color: "white" }}>M</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f8ef7", display: "inline-block", animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
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
      onClick={() => { navigator.clipboard.writeText(stripActionBlocks(text)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, marginTop: 4, color: copied ? '#10B981' : undefined }}
    >
      {copied ? (
        '✓ Copied'
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function MayaContextChips() {
  const { user, subPlan } = useAuth();
  const niche = localStorage.getItem('majorka_niche') || null;
  const region = localStorage.getItem('majorka_region') || 'AU';

  const planLabel = subPlan
    ? (subPlan.charAt(0).toUpperCase() + subPlan.slice(1) + ' Plan')
    : null;

  const chips = [
    niche ? { label: niche, color: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.08)', text: '#CBD5E1' } : null,
    { label: `${region} market`, color: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.08)', text: '#CBD5E1' },
    planLabel ? { label: planLabel, color: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.2)', text: '#6ba3ff' } : null,
  ].filter(Boolean) as Array<{ label: string; color: string; border: string; text: string }>;

  if (!chips.length) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      padding: '8px 16px 8px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(255,255,255,0.01)',
    }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginRight: 2 }}>Maya knows:</span>
      {chips.map(chip => (
        <span key={chip.label} style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 20,
          background: chip.color, border: `1px solid ${chip.border}`, color: chip.text,
        }}>
          {chip.label}
        </span>
      ))}
    </div>
  );
}

export default function AIChat() {
  const { subPlan, subStatus, session } = useAuth();
  const [, setLocation] = useLocation();
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

  // Load chat history — prefer server-backed, fall back to localStorage for unauth
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch('/api/chat/history?tool=ai-chat', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const json = await res.json() as { messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }> };
            if (!cancelled && Array.isArray(json.messages) && json.messages.length > 0) {
              setMessages(json.messages.slice(-50).map(m => ({
                id: m.id,
                role: m.role,
                content: stripActionBlocks(m.content),
                ts: new Date(m.created_at),
              })));
              return;
            }
          }
        }
      } catch { /* fall through to localStorage */ }

      try {
        const saved = localStorage.getItem('maya_chat_history');
        if (saved && !cancelled) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map((m: Message) => ({ ...m, content: stripActionBlocks(m.content), ts: new Date(m.ts) })));
          }
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
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

  // Fix 2 — Empty chat suggestion chips (spec text)
  const suggestedPrompts = [
    "Find me a trending pet product for AU under $30",
    "Write a Meta ad hook for the nano tape product",
    "What's the best niche for AU dropshipping right now?",
    "How do I price a product with 30% margin?",
  ];
  void userNiche; // retained for future personalisation

  // Fix 3 — Product attachment state
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachQuery, setAttachQuery] = useState("");
  const [attachResults, setAttachResults] = useState<ProductSearchResult[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachedProduct[]>([]);
  const attachRef = useRef<HTMLDivElement>(null);

  // Debounced product search (250ms)
  useEffect(() => {
    if (!attachOpen) return;
    const q = attachQuery.trim();
    if (!q) { setAttachResults([]); return; }
    const t = setTimeout(async () => {
      setAttachLoading(true);
      try {
        const { data: { session: sess } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (sess?.access_token) headers["Authorization"] = `Bearer ${sess.access_token}`;
        const res = await fetch(`/api/products?limit=8&search=${encodeURIComponent(q)}`, { headers });
        if (res.ok) {
          const json = await res.json();
          const list: ProductSearchResult[] = (json.products || []).slice(0, 8).map((p: any) => ({
            id: String(p.id),
            product_title: p.product_title || p.title || 'Untitled',
            price_aud: p.price_aud ?? null,
            orders_count: p.orders_count ?? p.real_orders_count ?? p.sold_count ?? null,
            winning_score: p.winning_score ?? null,
            image_url: p.image_url ?? null,
          }));
          setAttachResults(list);
        } else {
          setAttachResults([]);
        }
      } catch {
        setAttachResults([]);
      } finally {
        setAttachLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [attachQuery, attachOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!attachOpen) return;
    const onClick = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [attachOpen]);

  const addAttachment = (p: ProductSearchResult) => {
    if (attachments.length >= 3) return;
    if (attachments.some(a => a.id === p.id)) return;
    setAttachments(prev => [...prev, {
      id: p.id, product_title: p.product_title, price_aud: p.price_aud,
      orders_count: p.orders_count, winning_score: p.winning_score,
    }]);
    setAttachQuery("");
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

  // Fix 1 — Session divider computation: gap > 30min indicates new session
  const sessionDividers = useMemo(() => {
    const map = new Map<string, Date>();
    for (let i = 0; i < messages.length; i++) {
      if (i === 0) continue;
      const prev = messages[i - 1].ts.getTime();
      const cur = messages[i].ts.getTime();
      if (cur - prev > SESSION_GAP_MS) {
        map.set(messages[i].id, messages[i].ts);
      }
    }
    return map;
  }, [messages]);

  // Last divider id => everything strictly before it is "previous session" (opacity 0.6)
  const lastDividerIdx = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < messages.length; i++) {
      if (i > 0 && sessionDividers.has(messages[i].id)) idx = i;
    }
    return idx;
  }, [messages, sessionDividers]);

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
    const baseContent = (text ?? input).trim();
    if (!baseContent || loading) return;

    // Fix 3 — append attached product context to outgoing message
    const attachmentSuffix = attachments.length > 0
      ? '\n\n' + attachments.map(a => {
          const price = a.price_aud != null ? `AUD $${Number(a.price_aud).toFixed(2)}` : 'AUD $—';
          const orders = a.orders_count != null ? `${a.orders_count} orders` : '— orders';
          const score = a.winning_score != null ? `score ${a.winning_score}` : 'score —';
          return `[Attached: ${a.product_title} · ${price} · ${orders} · ${score}]`;
        }).join('\n')
      : '';
    const content = baseContent + attachmentSuffix;

    if (content.length > 10000) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant' as const, content: 'Message too long (max 10,000 characters). Please shorten your message.', ts: new Date() }]);
      return;
    }

    // Clear attachments after compose
    setAttachments([]);

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
          const reply = stripActionBlocks(fallback.reply || fallback.response || fallback.message || "I couldn't generate a response right now.");
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

  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  if (!isAdmin && !isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => setLocation('/app/dashboard')} feature="Maya AI" reason="Your AI-powered ecommerce assistant" />;
  }

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
        <div className="px-3 sm:px-6 py-3 sm:py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(79,142,247,0.4)" }}>
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

        {/* Maya context chips */}
        <MayaContextChips />

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        <div className="px-3 sm:px-6" style={{ flex: 1, overflowY: "auto", paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Empty state */}
          {messages.length === 0 && !loading && (
<<<<<<< HEAD
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, paddingTop: 24 }}>
              <div style={{ width: "100%", maxWidth: 560 }}>
                <EmptyState
                  icon={<MessageSquare size={40} strokeWidth={1.75} />}
                  title="Ask Maya anything"
                  body="Find a winning product. Price a margin. Write an ad hook. Maya uses Majorka's live data to answer."
                  primaryCta={{
                    label: 'Try a suggested prompt',
                    onClick: () => {
                      const first = suggestedPrompts[0];
                      if (first) sendMessage(first);
                    },
                  }}
                />
=======
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, paddingTop: 40 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 32px rgba(79,142,247,0.3)" }}>
                  <Sparkles size={28} color="white" />
                </div>
                <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: "white", marginBottom: 8 }}>How can I help you win today?</div>
                <div style={{ fontFamily: dm, fontSize: 14, color: "#94A3B8" }}>Ask me anything about products, marketing, or your Shopify store</div>
>>>>>>> origin/app-theme-cobalt
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10, width: "100%", maxWidth: 520 }}>
                {suggestedPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", color: "#D1D5DB", fontFamily: dm, fontSize: 13, textAlign: "left" as const, lineHeight: 1.4, transition: "all 150ms" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(79,142,247,0.5)"; e.currentTarget.style.background = "rgba(79,142,247,0.08)"; e.currentTarget.style.color = "#E0E7FF"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#D1D5DB"; }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages with Fix 1 session dividers */}
          {messages.map((msg, idx) => {
            const isPrevSession = lastDividerIdx > 0 && idx < lastDividerIdx;
            const dividerTs = sessionDividers.get(msg.id);
            return (
              <React.Fragment key={msg.id}>
                {dividerTs && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px', opacity: 0.6 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontFamily: dm, fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      New session — {fmtSessionDate(dividerTs)}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, opacity: isPrevSession ? 0.6 : 1, transition: 'opacity 200ms' }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 18 }}>
                  <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 12, color: "white" }}>M</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: msg.role === "user" ? "70%" : "75%" }}>
                <div
                  className={msg.role === "user" ? "rounded-xl px-4 py-3 border-r-2 border-[#3B82F6]" : "rounded-xl px-4 py-3 border-l-2 border-[#4f8ef7]"}
                  style={msg.role === "user" ? {
                    background: 'rgba(59,130,246,0.10)',
                    color: "white",
                    fontFamily: dm,
                    fontSize: 14,
                    lineHeight: 1.6,
                  } : {
                    background: 'rgba(79,142,247,0.05)',
                    color: "white",
                    fontFamily: dm,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                </div>
                {msg.role === "assistant" && msg.content && (
                  <CopyMsgButton text={msg.content} />
                )}
                <span style={{ fontFamily: dm, fontSize: 11, color: "#64748B", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{fmtTime(msg.ts)}</span>
              </div>
            </div>
              </React.Fragment>
            );
          })}

          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────────────────── */}
        <div className="px-3 sm:px-6" style={{ paddingTop: 12, paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,17,23,0.98)", position: "sticky", bottom: 0, zIndex: 10 }}>
          {/* Fix 3 — attached product chips */}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {attachments.map(a => (
                <span key={a.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, padding: '4px 8px', borderRadius: 16,
                  background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
                  color: '#6ba3ff', fontFamily: dm, maxWidth: 280,
                }}>
                  <Package size={11} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.product_title}
                  </span>
                  <button
                    onClick={() => removeAttachment(a.id)}
                    aria-label="Remove attachment"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6ba3ff', padding: 0, display: 'flex' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <span style={{ fontSize: 10, color: '#64748B', alignSelf: 'center' }}>{attachments.length}/3</span>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-end" }}>
            {/* Fix 3 — Attach product button + dropdown */}
            <div ref={attachRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setAttachOpen(v => !v)}
                disabled={attachments.length >= 3}
                aria-label="Attach product"
                title={attachments.length >= 3 ? 'Max 3 attachments' : 'Attach product'}
                style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: attachOpen ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: attachments.length >= 3 ? 'not-allowed' : 'pointer',
                  color: attachOpen ? '#6ba3ff' : '#94A3B8', opacity: attachments.length >= 3 ? 0.4 : 1,
                  transition: 'all 150ms',
                }}
              >
                <Package size={15} />
              </button>
              {attachOpen && (
                <div style={{
                  position: 'absolute', bottom: 44, left: 0, width: 320,
                  background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 6 }}>
                    <Search size={12} color="#94A3B8" />
                    <input
                      autoFocus
                      value={attachQuery}
                      onChange={e => setAttachQuery(e.target.value)}
                      placeholder="Search products..."
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: '#E0E7FF', fontFamily: dm, fontSize: 12,
                      }}
                    />
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {attachLoading && (
                      <div style={{ padding: 12, textAlign: 'center' as const, color: '#64748B', fontSize: 11 }}>Searching…</div>
                    )}
                    {!attachLoading && attachQuery.trim() && attachResults.length === 0 && (
                      <div style={{ padding: 12, textAlign: 'center' as const, color: '#64748B', fontSize: 11 }}>No products found</div>
                    )}
                    {!attachLoading && !attachQuery.trim() && (
                      <div style={{ padding: 12, textAlign: 'center' as const, color: '#64748B', fontSize: 11 }}>Type to search products</div>
                    )}
                    {attachResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addAttachment(p)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', background: 'transparent', border: 'none',
                          borderRadius: 6, cursor: 'pointer', textAlign: 'left' as const,
                          color: '#D1D5DB', fontFamily: dm, fontSize: 12,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,142,247,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {p.image_url && (
                          <img src={p.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_title}</div>
                          <div style={{ fontSize: 10, color: '#64748B' }}>
                            {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                            {p.winning_score != null ? ` · score ${p.winning_score}` : ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <textarea
              ref={textareaRef}
              className="w-full bg-[#0d0d10]/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-slate-100 placeholder:text-white/30 outline-none focus:border-[#4f8ef7]/50 resize-none transition-all maya-textarea"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Maya anything about your ecommerce business..."
              rows={1}
              style={{ flex: 1, fontFamily: dm, fontSize: 14, lineHeight: 1.5, overflowY: "auto" as const, maxHeight: 120, minHeight: 24 }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed", border: "none", transition: "all 150ms",
                background: input.trim() && !loading ? "linear-gradient(135deg, #4f8ef7, #4f8ef7)" : "rgba(255,255,255,0.06)",
                opacity: input.trim() && !loading ? 1 : 0.4,
              }}
              onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Send size={15} color="white" />
            </button>
          </div>
          <div style={{ fontFamily: dm, fontSize: 11, color: "#64748B", textAlign: "center" as const, marginTop: 8 }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>

      </div>
    </>
  );
}
