/**
 * LiveDemoWidget v2 — Maya Live Intelligence Preview
 * Three tool tabs: Product Scout | Profit Check | Ad Generator
 */
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Lock, Megaphone, Search, TrendingUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'wouter';

const syne = 'Syne, sans-serif';
const dm = "'DM Sans', sans-serif";
const mono = "'DM Mono', 'Fira Code', monospace";

const STYLES = `
@keyframes live-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(99,102,241,0.12), 0 0 80px rgba(99,102,241,0.04); }
  50%       { box-shadow: 0 0 60px rgba(99,102,241,0.22), 0 0 120px rgba(99,102,241,0.08); }
}
@keyframes live-glow-success {
  0%, 100% { box-shadow: 0 0 60px rgba(99,102,241,0.3), 0 0 100px rgba(99,102,241,0.12); }
  50%       { box-shadow: 0 0 90px rgba(99,102,241,0.45), 0 0 150px rgba(99,102,241,0.2); }
}
@keyframes thinking-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40%           { transform: scale(1.0); opacity: 1; }
}
@keyframes pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.8); }
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes gauge-grow {
  from { width: 0; }
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer-cta {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes num-count {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #6366F1;
  animation: thinking-dot 1.4s ease-in-out infinite;
}
.live-dot:nth-child(2) { animation-delay: 0.16s; }
.live-dot:nth-child(3) { animation-delay: 0.32s; }
.live-cursor {
  display: inline-block; width: 2px; height: 14px;
  background: #6366F1; border-radius: 1px;
  vertical-align: middle; margin-left: 2px;
  animation: cursor-blink 0.7s step-end infinite;
}
.widget-shimmer-cta {
  background: linear-gradient(90deg, #4F46E5 0%, #6366F1 25%, #A5B4FC 50%, #6366F1 75%, #4F46E5 100%);
  background-size: 200% 100%;
  animation: shimmer-cta 3s linear infinite;
}
.product-card-anim { animation: card-in 0.35s ease forwards; }
.ad-card-anim { animation: card-in 0.4s ease forwards; }
`;

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = 'scout' | 'profit' | 'ads';

interface TabConfig {
  id: TabId;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  chips: string[];
  placeholder: string;
  toolName: string;
  accent: string;
  subLabel: string;
}

interface ProfitResult {
  buy: number;
  sell: number;
  grossMargin: number;
  grossProfit: number;
  netProfit: number;
  breakEvenCpa: number;
  status: 'GO' | 'CAUTION' | 'NO';
}

interface ProductCard {
  name: string;
  score: number;
  oneLiner: string;
}

interface AdCard {
  headline: string;
  body: string;
  cta: string;
}

// ── Tab configuration ──────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  {
    id: 'scout',
    label: 'Product Scout',
    Icon: Search,
    chips: ['fitness AU', 'pets AU', 'beauty AU', 'home AU', 'tech AU'],
    placeholder: 'Enter a niche, e.g. "fitness AU"',
    toolName: 'product-discovery',
    accent: '#3b82f6',
    subLabel: 'Enter a niche → get scored opportunities',
  },
  {
    id: 'profit',
    label: 'Profit Check',
    Icon: TrendingUp,
    chips: ['buy $8 sell $49', 'buy $12 sell $69', 'buy $5 sell $29', 'buy $20 sell $99'],
    placeholder: 'Try: buy $8 sell $49 AU',
    toolName: 'profit-calculator',
    accent: '#6366F1',
    subLabel: 'Validate margins — instant AUD numbers',
  },
  {
    id: 'ads',
    label: 'Ad Generator',
    Icon: Megaphone,
    chips: ['resistance bands AU women', 'posture corrector AU men', 'dog accessories AU', 'home gym starter'],
    placeholder: 'Product + target audience',
    toolName: 'ad-copy',
    accent: '#22c55e',
    subLabel: 'Generate Facebook ad copy ready to run',
  },
];

// ── LocalStorage helpers ───────────────────────────────────────────────────

const DEMO_USES_KEY = `majorka_demo_uses_${new Date().toDateString()}`;
const MAX_DEMO_USES = 5;

function getDemoUses() {
  try { return parseInt(localStorage.getItem(DEMO_USES_KEY) || '0', 10); } catch { return 0; }
}
function incrementDemoUses() {
  try {
    const n = getDemoUses() + 1;
    localStorage.setItem(DEMO_USES_KEY, String(n));
    return n;
  } catch { return 1; }
}

// ── Parsers ────────────────────────────────────────────────────────────────

function parseProfitInput(input: string): ProfitResult | null {
  const match = input.match(/buy\s*\$?(\d+(?:\.\d+)?)\s+sell\s*\$?(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const buy = parseFloat(match[1]);
  const sell = parseFloat(match[2]);
  if (buy <= 0 || sell <= buy) return null;
  const grossProfit = sell - buy;
  const grossMargin = (grossProfit / sell) * 100;
  const shipping = 9.9;
  const platformFee = sell * 0.02;
  const payment = sell * 0.015;
  const netProfit = grossProfit - shipping - platformFee - payment;
  const breakEvenCpa = Math.max(0, netProfit);
  const status: 'GO' | 'CAUTION' | 'NO' = grossMargin >= 60 ? 'GO' : grossMargin >= 38 ? 'CAUTION' : 'NO';
  return { buy, sell, grossMargin, grossProfit, netProfit, breakEvenCpa, status };
}

function parseProductCards(text: string): ProductCard[] {
  const cards: ProductCard[] = [];
  const sections = text.split(/\n(?=\d+[\.\)]\s|#{1,3}\s|\*\*\d)/);

  for (const section of sections) {
    if (cards.length >= 3) break;
    const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let name = lines[0]
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/^#+\s*/, '')
      .split(':')[0]
      .trim();

    if (!name || name.length < 3 || name.length > 60) continue;

    let score = 0;
    for (const line of lines) {
      const m = line.match(/(\d{2,3})\s*(?:\/\s*100)?/);
      if (m && (line.toLowerCase().includes('score') || line.toLowerCase().includes('opportunity') || line.toLowerCase().includes('/100'))) {
        score = Math.min(100, parseInt(m[1]));
        break;
      }
    }
    if (!score) score = 78;

    let oneLiner = '';
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i].replace(/^\*\*.*?\*\*:?\s*/, '').replace(/^[-•→]\s*/, '').replace(/\*\*/g, '').trim();
      if (l && l.length > 20 && !l.match(/^(\d|score|opportunity)/i)) {
        oneLiner = l.substring(0, 85);
        break;
      }
    }

    cards.push({ name: name.substring(0, 45), score, oneLiner });
  }

  // Fallback: if no structured cards found, try bold-text product names
  if (cards.length === 0) {
    const boldMatches = [...text.matchAll(/\*\*([^*]{4,45})\*\*/g)];
    for (const m of boldMatches.slice(0, 3)) {
      const name = m[1].trim();
      if (name && !name.toLowerCase().includes('score') && !name.toLowerCase().includes('note')) {
        cards.push({ name, score: 78, oneLiner: '' });
      }
    }
  }

  return cards.slice(0, 3);
}

function parseAdCard(text: string): AdCard | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  let headline = '';
  let body = '';
  let cta = 'Shop Now →';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!headline && (lower.startsWith('headline:') || lower.startsWith('hook:') || lower.startsWith('**hook') || lower.startsWith('**headline') || line.startsWith('##'))) {
      headline = line.replace(/^#+\s*/, '').replace(/^\*\*(headline|hook):?\*\*/i, '').replace(/^(headline|hook):/i, '').replace(/\*\*/g, '').trim();
      continue;
    }
    if (lower.startsWith('cta:') || lower.startsWith('call to action:') || lower.startsWith('button:')) {
      cta = line.replace(/^(cta|call to action|button):/i, '').replace(/\*\*/g, '').trim() || 'Shop Now →';
      continue;
    }
    if (!body && line.length > 40 && !line.startsWith('#') && !line.startsWith('**')) {
      body = line.replace(/\*\*/g, '').trim();
    }
  }

  if (!headline && lines.length > 0) headline = lines[0].replace(/\*\*/g, '').substring(0, 80);
  if (!body && lines.length > 1) {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].length > 30) { body = lines[i].replace(/\*\*/g, '').substring(0, 200); break; }
    }
  }

  return { headline, body, cta };
}

// ── Sub-components: Results ────────────────────────────────────────────────

function ProfitDisplay({ result }: { result: ProfitResult }) {
  const { buy, sell, grossMargin, grossProfit, netProfit, breakEvenCpa, status } = result;
  const statusColor = status === 'GO' ? '#22c55e' : status === 'CAUTION' ? '#f59e0b' : '#ef4444';
  const statusBg = status === 'GO' ? 'rgba(34,197,94,0.08)' : status === 'CAUTION' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

  const rows = [
    { label: 'Buy Price', value: `$${buy.toFixed(2)}`, color: '#94949e' },
    { label: 'Sell Price', value: `$${sell.toFixed(2)}`, color: '#6366F1' },
    { label: 'Gross Profit', value: `$${grossProfit.toFixed(2)}`, color: '#6366F1' },
    { label: 'Est. AU Shipping', value: '-$9.90', color: '#94949e' },
    { label: 'Platform Fees', value: `-$${(sell * 0.035).toFixed(2)}`, color: '#94949e' },
    { label: 'Net Profit', value: `$${netProfit.toFixed(2)}`, color: netProfit > 0 ? '#22c55e' : '#ef4444' },
    { label: 'Break-even CPA', value: `$${breakEvenCpa.toFixed(2)}`, color: '#6366F1' },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Margin gauge */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: '#94949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Gross Margin
          </span>
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ fontFamily: syne, fontWeight: 900, fontSize: 20, color: '#6366F1' }}
          >
            {grossMargin.toFixed(1)}%
          </motion.span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 8, overflow: 'hidden', position: 'relative' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, grossMargin)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            style={{
              height: '100%',
              borderRadius: 6,
              background: grossMargin >= 60
                ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                : grossMargin >= 38
                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                : 'linear-gradient(90deg, #dc2626, #ef4444)',
              boxShadow: `0 0 8px ${statusColor}80`,
            }}
          />
        </div>
      </div>

      {/* Metrics table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '9px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: i === rows.length - 2 ? 'rgba(99,102,241,0.04)' : 'transparent',
            }}
          >
            <span style={{ fontFamily: dm, fontSize: 12, color: '#52525b' }}>{row.label}</span>
            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: statusBg,
          border: `1px solid ${statusColor}40`,
          borderRadius: 10,
          padding: '12px 20px',
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0, boxShadow: `0 0 8px ${statusColor}` }} />
        <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15, color: statusColor }}>
          {status === 'GO' ? '✓ Strong margin — GO' : status === 'CAUTION' ? '⚠ Tight margin — CAUTION' : '✗ Too thin — NO-GO'}
        </span>
      </motion.div>
    </div>
  );
}

function ProductScoutDisplay({ cards, streaming }: { cards: ProductCard[]; streaming: boolean }) {
  if (!cards.length && !streaming) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cards.map((card, i) => (
        <div
          key={i}
          className="product-card-anim"
          style={{
            animationDelay: `${i * 0.08}s`,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '14px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, #3b82f6, #60a5fa)', borderRadius: '12px 0 0 12px' }} />
          <div style={{ paddingLeft: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 14, color: '#f5f5f5' }}>{card.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Score bar */}
                <div style={{ width: 48, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${card.score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                    style={{ height: '100%', background: card.score >= 80 ? '#22c55e' : '#6366F1', borderRadius: 2 }}
                  />
                </div>
                <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: card.score >= 80 ? '#22c55e' : '#6366F1', minWidth: 32, textAlign: 'right' }}>
                  {card.score}
                </span>
              </div>
            </div>
            {card.oneLiner && (
              <p style={{ fontFamily: dm, fontSize: 12, color: '#7a7a8a', lineHeight: 1.5, margin: 0 }}>{card.oneLiner}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdDisplay({ card }: { card: AdCard }) {
  return (
    <div className="ad-card-anim" style={{ animationDelay: '0.1s' }}>
      {/* Facebook ad mockup */}
      <div style={{
        background: '#1c1e21',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: dm,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 900, fontSize: 14, color: '#000', flexShrink: 0 }}>
            M
          </div>
          <div>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: '#f5f5f5' }}>Majorka Brand</div>
            <div style={{ fontSize: 11, color: '#52525b' }}>Sponsored · <span style={{ color: '#3b82f6' }}>🌐 Public</span></div>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: '14px 14px 0' }}>
          {card.headline && (
            <p style={{ fontFamily: syne, fontWeight: 800, fontSize: 15, color: '#f5f5f5', lineHeight: 1.4, marginBottom: 10 }}>
              {card.headline}
            </p>
          )}
          {card.body && (
            <p style={{ fontSize: 13, color: '#94949e', lineHeight: 1.65, marginBottom: 12 }}>
              {card.body}
            </p>
          )}
        </div>
        {/* Image placeholder */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>[ Product creative / UGC video ]</span>
        </div>
        {/* CTA row */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#52525b', marginBottom: 1 }}>majorka.com</div>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: '#f5f5f5' }}>Majorka AI</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: '#000',
            borderRadius: 6,
            padding: '8px 16px',
            fontFamily: syne,
            fontWeight: 700,
            fontSize: 13,
          }}>
            {card.cta}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: 11, color: '#52525b', fontFamily: dm }}>AU audience · Ready to upload to Ads Manager</span>
      </div>
    </div>
  );
}

// ── Inline text renderer ───────────────────────────────────────────────────

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\$[\d,.]+%?|[\d.]+%)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: '#f5f5f5', fontWeight: 700 }}>{p.replace(/\*\*/g, '')}</strong>;
    if (/^\$[\d,.]+/.test(p) || /^[\d.]+%$/.test(p)) return <span key={i} style={{ color: '#6366F1', fontWeight: 700, fontFamily: mono }}>{p}</span>;
    return <span key={i}>{p}</span>;
  });
}

function StreamingText({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (!line) return <div key={i} style={{ height: 4 }} />;
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <div key={i} style={{ fontFamily: syne, fontWeight: 800, fontSize: 14, color: '#6366F1', margin: '12px 0 5px', lineHeight: 1.3 }}>
              {line.replace(/^#+\s*/, '')}
            </div>
          );
        }
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('→')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 3 }}>
              <span style={{ color: '#6366F1', flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 13, color: '#94949e', lineHeight: 1.65 }}>{renderInline(line.replace(/^[-•→]\s*/, ''))}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{ fontSize: 13, color: '#94949e', lineHeight: 1.7, marginBottom: 2 }}>
            {renderInline(line)}
          </div>
        );
      })}
      {streaming && <span className="live-cursor" />}
    </>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────

export default function LiveDemoWidget() {
  const [activeTab, setActiveTab] = useState<TabId>('scout');
  const [inputs, setInputs] = useState<Record<TabId, string>>({ scout: '', profit: '', ads: '' });
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [rawText, setRawText] = useState('');
  const [profitResult, setProfitResult] = useState<ProfitResult | null>(null);
  const [productCards, setProductCards] = useState<ProductCard[]>([]);
  const [adCard, setAdCard] = useState<AdCard | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [usesLeft, setUsesLeft] = useState(MAX_DEMO_USES - getDemoUses());
  const [glowSuccess, setGlowSuccess] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const tab = TABS.find((t) => t.id === activeTab)!;
  const inputValue = inputs[activeTab];

  const resetResult = () => {
    setRawText('');
    setProfitResult(null);
    setProductCards([]);
    setAdCard(null);
    setHasResult(false);
    setGlowSuccess(false);
  };

  const switchTab = (id: TabId) => {
    if (abortRef.current) abortRef.current.abort();
    setActiveTab(id);
    setThinking(false);
    setStreaming(false);
    resetResult();
    setShowSignup(false);
  };

  const handleSend = async (prompt?: string) => {
    const text = (prompt ?? inputValue).trim();
    if (!text || thinking || streaming) return;

    const uses = getDemoUses();
    if (uses >= MAX_DEMO_USES) { setShowSignup(true); return; }

    resetResult();
    setThinking(true);
    setStreaming(false);
    setShowSignup(false);

    const newUses = incrementDemoUses();
    setUsesLeft(MAX_DEMO_USES - newUses);

    // Profit Check: instant local calculation for "buy X sell Y" patterns
    if (activeTab === 'profit') {
      const result = parseProfitInput(text);
      if (result) {
        await new Promise((r) => setTimeout(r, 350)); // brief "thinking" moment
        setProfitResult(result);
        setHasResult(true);
        setThinking(false);
        setGlowSuccess(true);
        if (MAX_DEMO_USES - newUses <= 0) setTimeout(() => setShowSignup(true), 2500);
        return;
      }
    }

    try {
      const abort = new AbortController();
      abortRef.current = abort;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          toolName: tab.toolName,
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
          const textMatch = trimmed.match(/^0:"(.*)"$/);
          if (textMatch) {
            const chunk = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            fullText += chunk;
            setRawText(fullText);
          } else if (!trimmed.startsWith('d:') && !trimmed.startsWith('e:') && !trimmed.startsWith('2:') && !trimmed.startsWith('data:')) {
            try { JSON.parse(trimmed); } catch { fullText += trimmed + '\n'; setRawText(fullText); }
          }
        }
        if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
      }

      setStreaming(false);

      if (fullText) {
        // Parse into structured output
        if (activeTab === 'scout') {
          const cards = parseProductCards(fullText);
          if (cards.length > 0) setProductCards(cards);
        } else if (activeTab === 'ads') {
          const card = parseAdCard(fullText);
          if (card && card.headline) setAdCard(card);
        }
        setHasResult(true);
        setGlowSuccess(true);
      } else {
        setRawText("You've used your free queries for today. Sign up free to keep exploring.");
      }

      if (MAX_DEMO_USES - newUses <= 0) setTimeout(() => setShowSignup(true), 2000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setThinking(false);
      setStreaming(false);
      setRawText('Connect to see Maya in action — sign up for full access.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setInputs((prev) => ({ ...prev, [activeTab]: '' }));
    setThinking(false);
    setStreaming(false);
    resetResult();
    setShowSignup(false);
  };

  const showingResult = hasResult || thinking || streaming;

  return (
    <div style={{ maxWidth: 680, width: '100%', minWidth: 0 }}>
      <style>{STYLES}</style>

      <div
        style={{
          background: 'rgba(8,10,14,0.97)',
          border: '1px solid rgba(99,102,241,0.28)',
          borderRadius: 20,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          overflow: 'hidden',
          position: 'relative',
          animation: glowSuccess ? 'live-glow-success 3s ease-in-out infinite' : 'live-glow 5s ease-in-out infinite',
          transition: 'animation 0.5s',
        }}
      >
        {/* Scanline texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.003) 0px, rgba(255,255,255,0.003) 1px, transparent 1px, transparent 4px)' }} />

        {/* ── Top bar ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'rgba(0,0,0,0.45)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 11, color: '#6366F1', letterSpacing: '0.08em', marginLeft: 6 }}>✦ Majorka AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {usesLeft > 0 ? (
              <span style={{ fontSize: 11, color: '#52525b', fontFamily: dm }}>{usesLeft} free today</span>
            ) : (
              <span style={{ fontSize: 11, color: '#6366F1', fontFamily: dm }}>Sign up for unlimited</span>
            )}
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse-live 2s ease-in-out infinite' }} />
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          {TABS.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '11px 8px',
                  background: active ? 'rgba(99,102,241,0.05)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <t.Icon size={13} color={active ? t.accent : '#52525b'} strokeWidth={2.2} />
                <span style={{ fontFamily: syne, fontWeight: active ? 700 : 500, fontSize: 12, color: active ? t.accent : '#52525b', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tool sub-label + chips ── */}
        {!showingResult && (
          <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px 10px' }}>
            <p style={{ fontFamily: dm, fontSize: 12, color: '#52525b', marginBottom: 10 }}>{tab.subLabel}</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {tab.chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => { setInputs((p) => ({ ...p, [activeTab]: chip })); handleSend(chip); }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderRadius: 20,
                    padding: '5px 12px',
                    fontSize: 12,
                    color: '#94949e',
                    fontFamily: dm,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${tab.accent}50`;
                    el.style.color = tab.accent;
                    el.style.background = `${tab.accent}0a`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255,255,255,0.08)';
                    el.style.color = '#94949e';
                    el.style.background = 'rgba(255,255,255,0.04)';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Result / streaming area ── */}
        <div
          ref={responseRef}
          style={{
            position: 'relative',
            zIndex: 2,
            padding: showingResult ? '14px 16px' : '0 16px',
            minHeight: showingResult ? 200 : 0,
            maxHeight: 340,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.07) transparent',
            transition: 'min-height 0.3s ease',
          }}
        >
          {/* Thinking */}
          {thinking && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div className="live-dot" />
                <div className="live-dot" />
                <div className="live-dot" />
              </div>
              <span style={{ fontFamily: dm, fontSize: 13, color: '#52525b' }}>Maya is thinking...</span>
            </motion.div>
          )}

          {/* Profit result (instant) */}
          {profitResult && !thinking && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <ProfitDisplay result={profitResult} />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Streaming raw text */}
          {(streaming || (rawText && !profitResult)) && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Product cards if parsed */}
                {productCards.length > 0 && !streaming ? (
                  <ProductScoutDisplay cards={productCards} streaming={false} />
                ) : adCard && !streaming ? (
                  <AdDisplay card={adCard} />
                ) : (
                  <div style={{ fontFamily: dm, fontSize: 13, color: '#d1d5db', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <StreamingText text={rawText} streaming={streaming} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Reset link after result */}
          {hasResult && !thinking && !streaming && (
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', fontSize: 11, fontFamily: dm, padding: '2px 6px', transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#6366F1')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3f3f46')}>
                ↺ new query
              </button>
            </div>
          )}
        </div>

        {/* ── Input row ── */}
        <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <input
            value={inputValue}
            onChange={(e) => setInputs((p) => ({ ...p, [activeTab]: e.target.value }))}
            onKeyDown={handleKeyDown}
            disabled={streaming || thinking || showSignup}
            placeholder={usesLeft > 0 ? tab.placeholder : 'Sign up for unlimited queries'}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.14)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#e2e8f0',
              fontFamily: dm,
              outline: 'none',
              minHeight: 42,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = `${tab.accent}60`)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.14)')}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || streaming || thinking || showSignup}
            style={{
              background: inputValue.trim() && !streaming && !thinking && !showSignup
                ? `linear-gradient(135deg, ${tab.accent}, ${tab.accent}aa)`
                : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: 10,
              width: 42,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputValue.trim() && !streaming && !thinking ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={16} color={inputValue.trim() && !streaming && !thinking ? '#000' : '#52525b'} />
          </button>
        </div>

        {/* ── Signup gate ── */}
        <AnimatePresence>
          {showSignup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(8,10,14,0.93)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, textAlign: 'center' }}
            >
              <Lock size={30} color="#6366F1" />
              <div>
                <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 20, color: '#f5f5f5', marginBottom: 8 }}>You've seen what Maya can do</h3>
                <p style={{ fontFamily: dm, fontSize: 14, color: '#94949e', lineHeight: 1.6, maxWidth: 340 }}>Sign up free for unlimited queries, all 3 tools, and full access to the AI OS.</p>
              </div>
              <Link
                href="/sign-in"
                className="widget-shimmer-cta"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#000', borderRadius: 12, padding: '14px 36px', fontFamily: syne, fontWeight: 800, fontSize: 15, textDecoration: 'none', minHeight: 52, boxShadow: '0 0 32px rgba(99,102,241,0.3)' }}
              >
                Start Free — No Credit Card →
              </Link>
              <button onClick={() => setShowSignup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: 12, fontFamily: dm }}>
                or keep browsing
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
        <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>Try free — no signup required</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 13, height: 13, borderRadius: 3, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 7, color: '#6366F1', fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>Powered by Majorka AI</span>
        </div>
      </div>
    </div>
  );
}
