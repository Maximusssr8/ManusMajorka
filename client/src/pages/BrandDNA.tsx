import { Check, ChevronDown, ChevronUp, Copy, RefreshCw, Sparkles } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { getStoredMarket } from '@/contexts/MarketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandDNAResult {
  brandName: string;
  missionStatement: string;
  coreValues: string[];
  brandPersonality: {
    archetype: string;
    traits: string[];
    toneOfVoice: string;
    weAre?: string[];
    weAreNot?: string[];
  };
  targetAudience: {
    primarySegment: string;
    personaName?: string;
    personaAge?: string;
    personaCity?: string;
    personaJob?: string;
    shopsAt?: string[];
    followsOn?: string[];
    psychographics: string[];
    painPoints: string[];
    desires: string[];
    buyingTriggers?: string[];
  };
  uniqueValueProposition: string;
  brandStory: string;
  visualIdentity: {
    colorPalette: string[];
    typography: string;
    aestheticDirection: string;
    logoDirection?: string;
  };
  competitiveDifferentiation: string;
  taglines: string[];
  keyMessages: string[];
  contentPillars?: Array<{
    pillar: string;
    description: string;
    exampleTopics: string[];
  }>;
  domainSuggestions?: string[];
  trademarkNotes?: string;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg transition-all duration-150 flex-shrink-0"
      style={{
        background: copied ? 'rgba(79,142,247,0.15)' : '#F9FAFB',
        border: `1px solid ${copied ? 'rgba(79,142,247,0.4)' : '#E5E7EB'}`,
        color: copied ? '#4f8ef7' : '#9CA3AF',
      }}
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  accent = '#4f8ef7',
  children,
  defaultOpen = true,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: `${accent}08` }}
      >
        <span
          className="text-xs font-extrabold uppercase tracking-widest"
          style={{ fontFamily: "'Syne', sans-serif", color: accent }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} style={{ color: accent }} />
        ) : (
          <ChevronDown size={14} style={{ color: accent }} />
        )}
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────
function TagPill({ text, accent = '#4f8ef7' }: { text: string; accent?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
    >
      {text}
    </span>
  );
}

// ─── Text Row ─────────────────────────────────────────────────────────────────
function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: '1px solid #F0F0F0' }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider flex-shrink-0 mt-0.5"
        style={{ color: '#9CA3AF', minWidth: '120px' }}
      >
        {label}
      </span>
      <span className="text-sm leading-relaxed flex-1" style={{ color: '#F8FAFC' }}>
        {value}
      </span>
      <CopyBtn text={value} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BrandDNA() {
  const [brandName, setBrandName] = useState('');
  const [productType, setProductType] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [brandVibe, setBrandVibe] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [result, setResult] = useState<BrandDNAResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { activeProduct } = useActiveProduct();
  const { session } = useAuth();

  useEffect(() => {
    if (activeProduct && !productType) {
      setProductType(activeProduct.name + (activeProduct.niche ? ' — ' + activeProduct.niche : ''));
    }
  }, [activeProduct]);

  const SYSTEM_PROMPT = `You are an elite brand strategist who has built 100+ Australian ecommerce brands from zero to recognisable names. You know what resonates with AU consumers: authenticity over hype, confidence without arrogance, Australian vernacular, and understated quality. You reference AU brand benchmarks like Frank Body, Go-To Skincare, Aesop, Grown Alchemist, Culture Kings, and The Daily Edited.

When given brand details, you MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation) in this exact format:

{
  "brandName": "string — the provided brand name, or suggest a memorable AU-appropriate name if none given. Avoid American slang. Consider .com.au availability.",
  "missionStatement": "string — one powerful sentence. Written in Australian English. Confident but not arrogant (tall poppy awareness).",
  "coreValues": ["value1", "value2", "value3", "value4"],
  "brandPersonality": {
    "archetype": "string — e.g. The Hero, The Creator, The Sage. Include reasoning for why this archetype suits the AU market.",
    "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
    "toneOfVoice": "string — describe the voice. Reference AU brand tone benchmarks (e.g. 'Frank Body casual meets Aesop sophistication'). Include 3 'We say / We don't say' examples.",
    "weAre": ["what the brand IS — 3 statements"],
    "weAreNot": ["what the brand is NOT — 3 statements"]
  },
  "targetAudience": {
    "primarySegment": "string — demographics + AU cities (Sydney, Melbourne, Brisbane, Gold Coast, Perth). Include age, income bracket in AUD, lifestyle.",
    "personaName": "string — give the persona an Australian name (e.g. 'Sarah from Bondi', 'Josh from Fitzroy')",
    "personaAge": "string — age range",
    "personaCity": "string — AU city",
    "personaJob": "string — occupation",
    "shopsAt": ["where they shop — AU-specific: THE ICONIC, Adore Beauty, Culture Kings, Catch, etc."],
    "followsOn": ["AU influencers/accounts they follow on Instagram/TikTok"],
    "psychographics": ["insight1", "insight2", "insight3"],
    "painPoints": ["pain1 — AU-specific where possible", "pain2", "pain3"],
    "desires": ["desire1", "desire2", "desire3"],
    "buyingTriggers": ["what makes them buy — e.g. 'Afterpay available', 'Australian owned', 'free shipping over $79', 'reviews from AU customers'"]
  },
  "uniqueValueProposition": "string — one compelling sentence. If you removed the brand name, it should still be unique vs AU competitors.",
  "brandStory": "string — 3-4 sentence brand origin story with Australian context. Reference what AU problem sparked it.",
  "visualIdentity": {
    "colorPalette": ["#hex1 - Primary: name — emotional reasoning", "#hex2 - Secondary: name — emotional reasoning", "#hex3 - Accent: name — emotional reasoning", "#hex4 - Neutral: name"],
    "typography": "string — heading font + body font (Google Fonts). Include reasoning. e.g. 'Syne (bold, modern headings) + DM Sans (clean, readable body)'",
    "aestheticDirection": "string — visual style. Reference AU brand aesthetics: clean, minimal, nature-inspired, confident but not flashy. Include photography style direction (lifestyle vs studio, AU settings).",
    "logoDirection": "string — brief for a logo designer. Style, iconography, AU design aesthetic."
  },
  "competitiveDifferentiation": "string — what makes this brand unique vs 3-4 specific AU competitors. Name the competitors.",
  "taglines": ["tagline1 — AU English, conversational", "tagline2 — benefit-driven", "tagline3 — emotional/aspirational"],
  "keyMessages": ["message1 — for product pages", "message2 — for social media", "message3 — for advertising", "message4 — for email marketing"],
  "contentPillars": [
    {"pillar": "pillar name", "description": "what this content pillar covers", "exampleTopics": ["topic1", "topic2", "topic3"]},
    {"pillar": "pillar name", "description": "what this content pillar covers", "exampleTopics": ["topic1", "topic2", "topic3"]},
    {"pillar": "pillar name", "description": "what this content pillar covers", "exampleTopics": ["topic1", "topic2", "topic3"]},
    {"pillar": "pillar name", "description": "what this content pillar covers", "exampleTopics": ["topic1", "topic2", "topic3"]},
    {"pillar": "pillar name", "description": "what this content pillar covers", "exampleTopics": ["topic1", "topic2", "topic3"]}
  ],
  "domainSuggestions": ["brandname.com.au", "alt1.com.au", "alt2.com.au"],
  "trademarkNotes": "string — brief note on AU trademark risk. Check IP Australia for potential conflicts."
}

RULES:
- Use Australian English throughout: colour, organise, analyse, favourite, centre.
- All references must be AU-native: AU platforms, AU competitors, AU cities, AU consumer psychology.
- Australians are turned off by overclaiming (tall poppy syndrome). The brand voice should be confident but never arrogant.
- Reference specific AU brand benchmarks for visual and tone direction.
- Content pillars should include AU-relevant topics and cultural moments.`;

  const getContextualSystemPrompt = () => {
    if (!activeProduct) return SYSTEM_PROMPT;
    return (
      SYSTEM_PROMPT +
      `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? '\n- Niche: ' + activeProduct.niche : ''}${activeProduct.summary ? '\n- Summary: ' + activeProduct.summary : ''}\n\nAll advice and output must be specifically tailored to this product. Reference it by name.`
    );
  };

  const handleGenerate = async () => {
    if (!brandName.trim() || !productType.trim()) {
      toast.error('Please enter a brand name and product type.');
      return;
    }
    setResult(null);
    setIsGenerating(true);

    const prompt = `Analyse and build the complete Brand DNA for:

Brand Name: ${brandName}
Product / Niche: ${productType}
Target Market: ${targetMarket || 'Not specified'}
Brand Vibe / Aesthetic: ${brandVibe || 'Not specified'}
Competitors / Inspiration: ${competitors || 'Not specified'}

Generate a comprehensive brand identity document as JSON.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: getContextualSystemPrompt(),
          market: getStoredMarket(),
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const text = (data.reply ?? '')
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '');
      const parsed = JSON.parse(text) as BrandDNAResult;
      setResult(parsed);
    } catch (e: any) {
      toast.error(
        e.message?.includes('JSON')
          ? 'Failed to parse brand analysis. Please try again.'
          : e.message || 'Failed to generate.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setIsGenerating(false);
    setBrandName('');
    setProductType('');
    setTargetMarket('');
    setBrandVibe('');
    setCompetitors('');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#05070F' }}>
      <ActiveProductBanner
        ctaLabel="Load into tool"
        onUseProduct={(summary) => setProductType(summary)}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <div
          className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{
            width: '320px',
            borderRight: '1px solid #E5E7EB',
            background: '#0d0d10',
            scrollbarWidth: 'thin',
            scrollbarColor: '#F0F0F0 transparent',
          }}
        >
          {/* Header */}
          <div
            className="px-5 pt-6 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#4f8ef7' }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(79,142,247,0.6)', fontFamily: "'Syne', sans-serif" }}
              >
                Brand Strategy
              </span>
            </div>
            <h1
              className="text-lg font-extrabold"
              style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC', letterSpacing: '-0.02em' }}
            >
              Brand DNA Analyzer
            </h1>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Extract your brand's core identity, personality, and positioning.
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 px-5 py-5 space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#94A3B8' }}
              >
                Brand Name *
              </label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Lumière Skin"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#94A3B8' }}
              >
                Product / Niche *
              </label>
              <input
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g. Premium skincare for women 30-45"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#94A3B8' }}
              >
                Target Market
              </label>
              <input
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                placeholder="e.g. Professional women, health-conscious, 30-45"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#94A3B8' }}
              >
                Brand Vibe / Aesthetic
              </label>
              <textarea
                value={brandVibe}
                onChange={(e) => setBrandVibe(e.target.value)}
                placeholder="e.g. Luxurious, minimalist, science-backed, empowering"
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#94A3B8' }}
              >
                Competitors / Inspiration
              </label>
              <input
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g. The Ordinary, Drunk Elephant, Tatcha"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="px-5 pb-6 space-y-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !brandName.trim() || !productType.trim()}
              className="w-full py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: isGenerating
                  ? 'rgba(79,142,247,0.15)'
                  : 'linear-gradient(135deg, #4f8ef7 0%, #3B82F6 100%)',
                color: isGenerating ? '#4f8ef7' : '#FAFAFA',
                border: isGenerating ? '1px solid rgba(79,142,247,0.3)' : 'none',
                opacity: !brandName.trim() || !productType.trim() ? 0.4 : 1,
                cursor: !brandName.trim() || !productType.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Analysing Brand DNA...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analyse Brand DNA
                </>
              )}
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#9CA3AF',
                }}
              >
                Reset & Start Over
              </button>
            )}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#F0F0F0 transparent' }}
        >
          {!result && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(79,142,247,0.1)',
                  border: '1px solid rgba(79,142,247,0.2)',
                }}
              >
                <span className="text-3xl">🧬</span>
              </div>
              <h2
                className="text-xl font-extrabold mb-2"
                style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
              >
                Discover Your Brand DNA
              </h2>
              <p className="text-sm max-w-md" style={{ color: '#9CA3AF' }}>
                Enter your brand details on the left and let AI extract your core identity —
                mission, personality, audience, visual direction, and competitive positioning.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm w-full">
                {[
                  { icon: '🎯', label: 'Brand Archetype' },
                  { icon: '👥', label: 'Target Audience' },
                  { icon: '💎', label: 'Value Proposition' },
                  { icon: '🎨', label: 'Visual Identity' },
                  { icon: '✍️', label: 'Taglines' },
                  { icon: '📖', label: 'Brand Story' },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-base">{icon}</span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: '#94A3B8' }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-16 h-16 mb-6">
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: 'rgba(79,142,247,0.2)' }}
                />
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(79,142,247,0.1)',
                    border: '1px solid rgba(79,142,247,0.3)',
                  }}
                >
                  <Sparkles size={24} style={{ color: '#4f8ef7' }} className="animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#4f8ef7' }}>
                Analysing brand identity...
              </p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                Building your complete brand DNA
              </p>
            </div>
          )}

          {result && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* Brand Header */}
              <div
                className="mb-8 pb-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4f8ef7' }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(79,142,247,0.6)', fontFamily: "'Syne', sans-serif" }}
                  >
                    Brand DNA Report
                  </span>
                </div>
                <h2
                  className="text-3xl font-extrabold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
                >
                  {result.brandName}
                </h2>
                <div className="flex items-start gap-3">
                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: '#94A3B8', fontStyle: 'italic' }}
                  >
                    "{result.missionStatement}"
                  </p>
                  <CopyBtn text={result.missionStatement} />
                </div>
              </div>

              {/* Brand Personality */}
              <SectionCard title="Brand Personality" accent="#4f8ef7">
                <TextRow label="Archetype" value={result.brandPersonality.archetype} />
                <TextRow label="Tone of Voice" value={result.brandPersonality.toneOfVoice} />
                <div className="pt-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider block mb-2"
                    style={{ color: '#9CA3AF' }}
                  >
                    Personality Traits
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.brandPersonality.traits.map((t) => (
                      <TagPill key={t} text={t} accent="#4f8ef7" />
                    ))}
                  </div>
                </div>
                <div className="pt-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider block mb-2"
                    style={{ color: '#9CA3AF' }}
                  >
                    Core Values
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.coreValues.map((v) => (
                      <TagPill key={v} text={v} accent="#3B82F6" />
                    ))}
                  </div>
                </div>
                {result.brandPersonality.weAre && result.brandPersonality.weAreNot && (
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    <div>
                      <span
                        className="text-xs font-semibold uppercase tracking-wider block mb-2"
                        style={{ color: '#4f8ef7' }}
                      >
                        We Are
                      </span>
                      <ul className="space-y-1.5">
                        {result.brandPersonality.weAre.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <div
                              className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                              style={{ background: '#4f8ef7' }}
                            />
                            <span className="text-sm" style={{ color: '#F8FAFC' }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span
                        className="text-xs font-semibold uppercase tracking-wider block mb-2"
                        style={{ color: '#ef4444' }}
                      >
                        We Are Not
                      </span>
                      <ul className="space-y-1.5">
                        {result.brandPersonality.weAreNot.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <div
                              className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                              style={{ background: '#ef4444' }}
                            />
                            <span className="text-sm" style={{ color: '#F8FAFC' }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Target Audience */}
              <SectionCard title="Target Audience" accent="#9c5fff">
                <TextRow label="Primary Segment" value={result.targetAudience.primarySegment} />
                {result.targetAudience.personaName && (
                  <div
                    className="mt-3 p-3 rounded-xl"
                    style={{
                      background: 'rgba(156,95,255,0.06)',
                      border: '1px solid rgba(156,95,255,0.15)',
                    }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wider block mb-2"
                      style={{ color: '#9c5fff' }}
                    >
                      Customer Persona
                    </span>
                    <div className="text-sm font-semibold mb-1" style={{ color: '#F8FAFC' }}>
                      {result.targetAudience.personaName}
                      {result.targetAudience.personaAge
                        ? ` · ${result.targetAudience.personaAge}`
                        : ''}
                      {result.targetAudience.personaCity
                        ? ` · ${result.targetAudience.personaCity}`
                        : ''}
                    </div>
                    {result.targetAudience.personaJob && (
                      <div className="text-xs mb-2" style={{ color: '#94A3B8' }}>
                        {result.targetAudience.personaJob}
                      </div>
                    )}
                    {result.targetAudience.shopsAt && result.targetAudience.shopsAt.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {result.targetAudience.shopsAt.map((s) => (
                          <TagPill key={s} text={s} accent="#9c5fff" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-3 space-y-3">
                  {[
                    {
                      label: 'Psychographics',
                      items: result.targetAudience.psychographics,
                      accent: '#9c5fff',
                    },
                    {
                      label: 'Pain Points',
                      items: result.targetAudience.painPoints,
                      accent: '#ef4444',
                    },
                    { label: 'Desires', items: result.targetAudience.desires, accent: '#4f8ef7' },
                    ...(result.targetAudience.buyingTriggers?.length
                      ? [
                          {
                            label: 'Buying Triggers',
                            items: result.targetAudience.buyingTriggers,
                            accent: '#f59e0b',
                          },
                        ]
                      : []),
                  ].map(({ label, items, accent }) => (
                    <div key={label}>
                      <span
                        className="text-xs font-semibold uppercase tracking-wider block mb-2"
                        style={{ color: '#9CA3AF' }}
                      >
                        {label}
                      </span>
                      <ul className="space-y-1.5">
                        {items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <div
                              className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                              style={{ background: accent }}
                            />
                            <span className="text-sm" style={{ color: '#F8FAFC' }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Positioning */}
              <SectionCard title="Positioning & Differentiation" accent="#4f8ef7">
                <TextRow label="UVP" value={result.uniqueValueProposition} />
                <TextRow label="Differentiation" value={result.competitiveDifferentiation} />
                <div className="pt-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider block mb-2"
                    style={{ color: '#9CA3AF' }}
                  >
                    Brand Story
                  </span>
                  <div className="flex items-start gap-3">
                    <p className="text-sm leading-relaxed flex-1" style={{ color: '#F8FAFC' }}>
                      {result.brandStory}
                    </p>
                    <CopyBtn text={result.brandStory} />
                  </div>
                </div>
              </SectionCard>

              {/* Visual Identity */}
              <SectionCard title="Visual Identity" accent="#f59e0b">
                <TextRow label="Typography" value={result.visualIdentity.typography} />
                <TextRow label="Aesthetic" value={result.visualIdentity.aestheticDirection} />
                <div className="pt-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider block mb-2"
                    style={{ color: '#9CA3AF' }}
                  >
                    Colour Palette
                  </span>
                  <div className="space-y-2">
                    {result.visualIdentity.colorPalette.map((color) => {
                      const hexMatch = color.match(/#[0-9A-Fa-f]{3,6}/);
                      const hex = hexMatch ? hexMatch[0] : '#4f8ef7';
                      return (
                        <div key={color} className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex-shrink-0"
                            style={{ background: hex, border: '1px solid rgba(255,255,255,0.08)' }}
                          />
                          <span className="text-sm flex-1" style={{ color: '#F8FAFC' }}>
                            {color}
                          </span>
                          <CopyBtn text={hex} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>

              {/* Taglines & Key Messages */}
              <SectionCard title="Taglines & Key Messages" accent="#06b6d4">
                <div className="mb-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider block mb-3"
                    style={{ color: '#9CA3AF' }}
                  >
                    Taglines
                  </span>
                  <div className="space-y-2">
                    {result.taglines.map((tagline, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: 'rgba(6,182,212,0.06)',
                          border: '1px solid rgba(6,182,212,0.15)',
                        }}
                      >
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: 'rgba(6,182,212,0.5)', minWidth: '20px' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="text-sm font-semibold flex-1"
                          style={{ color: '#F8FAFC', fontStyle: 'italic' }}
                        >
                          "{tagline}"
                        </span>
                        <CopyBtn text={tagline} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider block mb-3"
                    style={{ color: '#9CA3AF' }}
                  >
                    Key Messages
                  </span>
                  <div className="space-y-2">
                    {result.keyMessages.map((msg, i) => (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ background: '#06b6d4' }}
                        />
                        <span className="text-sm flex-1" style={{ color: '#F8FAFC' }}>
                          {msg}
                        </span>
                        <CopyBtn text={msg} />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Content Pillars */}
              {result.contentPillars && result.contentPillars.length > 0 && (
                <SectionCard title="Content Strategy" accent="#ec4899" defaultOpen={false}>
                  <div className="space-y-4">
                    {result.contentPillars.map((pillar, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-extrabold"
                            style={{ color: 'rgba(236,72,153,0.5)', minWidth: '20px' }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>
                            {pillar.pillar}
                          </span>
                        </div>
                        <p className="text-xs mb-2 ml-7" style={{ color: '#94A3B8' }}>
                          {pillar.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 ml-7">
                          {pillar.exampleTopics.map((t) => (
                            <TagPill key={t} text={t} accent="#ec4899" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Domain & Trademark */}
              {(result.domainSuggestions?.length || result.trademarkNotes) && (
                <SectionCard title="Domain & Trademark" accent="#4f8ef7" defaultOpen={false}>
                  {result.domainSuggestions && result.domainSuggestions.length > 0 && (
                    <div className="mb-3">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider block mb-2"
                        style={{ color: '#9CA3AF' }}
                      >
                        Domain Suggestions
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {result.domainSuggestions.map((d) => (
                          <TagPill key={d} text={d} accent="#4f8ef7" />
                        ))}
                      </div>
                    </div>
                  )}
                  {result.trademarkNotes && (
                    <TextRow label="Trademark" value={result.trademarkNotes} />
                  )}
                </SectionCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
