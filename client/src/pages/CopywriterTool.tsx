import { Check, ChevronDown, ChevronUp, Copy, Loader2, PenTool, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { injectProductIntelligence } from '@/lib/buildToolPrompt';

interface CopyOutput {
  headline: string;
  subheadline: string;
  productDescription: string;
  bulletPoints: string[];
  heroHook: string;
  socialProof: string;
  cta: string;
  emailSubjectLines: string[];
  adHeadlines: string[];
  adPrimaryTexts: string[];
  seoTitle: string;
  seoMetaDescription: string;
  tiktokHook: string;
  usp: string;
}

const SYSTEM_PROMPT = `You are an elite AU ecommerce copywriter who has generated $50M+ in Australian DTC sales. Write high-converting copy using the specified framework.

Return ONLY a raw JSON object (no markdown, no code fences, just {}) with this exact structure:
{"headline":"Main headline (benefit-driven, 8-10 words, AU English)","subheadline":"Supporting line (max 20 words, mentions Afterpay or AusPost if relevant)","productDescription":"2-3 sentence product description for Shopify, AU English, mention AUD price if given","bulletPoints":["Concrete benefit 1","Concrete benefit 2","Concrete benefit 3","Concrete benefit 4","Concrete benefit 5"],"heroHook":"Scroll-stopping first line for ads/TikTok, creates curiosity","socialProof":"Social proof statement mentioning Australians or AU sales numbers","cta":"Call-to-action button (max 4 words)","emailSubjectLines":["Subject 1 (curiosity)","Subject 2 (urgency)","Subject 3 (benefit)","Subject 4 (FOMO)","Subject 5 (question)"],"adHeadlines":["Facebook headline 1","Facebook headline 2","Facebook headline 3","Google headline 1 (max 30 chars)","Google headline 2 (max 30 chars)"],"adPrimaryTexts":["Complete ad body text 1 (PAS framework, 2-3 sentences)","Complete ad body text 2 (AIDA framework, 2-3 sentences)","Complete ad body text 3 (social proof led, 2-3 sentences)"],"seoTitle":"Shopify page title (max 60 chars, includes product + AU keyword)","seoMetaDescription":"Google meta description (120-155 chars, AU focused)","tiktokHook":"TikTok video first 3 seconds voiceover (max 15 words, creates instant curiosity)","usp":"One-line unique selling proposition that differentiates from competitors"}

Rules: AU English (colour, flavour). AUD pricing. Reference Afterpay/Zip, AusPost, Australian shoppers where natural. Output ONLY the JSON object.`;

function parseResult(text: string): CopyOutput | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.headline) return null;
    return parsed as CopyOutput;
  } catch {
    return null;
  }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0"
      style={{
        background: copied ? 'rgba(212,175,55,0.08)' : '#F9FAFB',
        border: `1px solid ${copied ? '#C7D2FE' : '#F5F5F5'}`,
        color: copied ? 'rgba(212,175,55,1.00)' : '#9CA3AF',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
    </button>
  );
}

function CopySection({
  title,
  accent = '#9CA3AF',
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: '#05070F', cursor: 'pointer' }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: accent, fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={12} style={{ color: '#9CA3AF' }} />
        ) : (
          <ChevronDown size={12} style={{ color: '#9CA3AF' }} />
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function CopyItem({ label, text }: { label?: string; text: string }) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-2"
      style={{ borderBottom: '1px solid #F9FAFB' }}
    >
      <div className="flex-1 min-w-0">
        {label && (
          <div
            className="text-xs mb-0.5"
            style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
          >
            {label}
          </div>
        )}
        <div className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
          {text}
        </div>
      </div>
      <CopyBtn text={text} />
    </div>
  );
}

const TONES = ['Conversational', 'Professional', 'Urgent', 'Playful', 'Luxury', 'Empathetic'];
const FRAMEWORKS = [
  'PAS (Problem-Agitate-Solve)',
  'AIDA (Attention-Interest-Desire-Action)',
  'FAB (Features-Advantages-Benefits)',
  'Before/After/Bridge',
];

export default function CopywriterTool() {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('Conversational');
  const [framework, setFramework] = useState('PAS (Problem-Agitate-Solve)');
  const [pricePoint, setPricePoint] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CopyOutput | null>(null);
  const [genError, setGenError] = useState('');
  const { activeProduct } = useActiveProduct();
  const { session } = useAuth();

  useEffect(() => {
    if (activeProduct && !product) {
      const prefill =
        activeProduct.name + (activeProduct.summary ? '\n' + activeProduct.summary : '');
      setProduct(prefill);
    }
  }, [activeProduct]);

  const handleGenerate = useCallback(async () => {
    if (!product.trim()) {
      toast.error('Please describe your product first');
      return;
    }
    setGenerating(true);
    setGenError('');
    setResult(null);

    const prompt = [
      `Product: ${product}`,
      audience && `Target audience: ${audience}`,
      `Tone: ${tone}`,
      `Framework: ${framework}`,
      pricePoint && `Price point: $${pricePoint} AUD`,
    ].filter(Boolean).join('\n');

    const systemPrompt = injectProductIntelligence(SYSTEM_PROMPT, activeProduct as any);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          toolName: 'copywriter',
          systemPrompt,
          market: 'AU',
          stream: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error('Rate limit reached. Please sign in or wait an hour.');
        throw new Error((err as any).error || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      const fullText: string = data.reply || data.response || data.content || '';
      const parsed = parseResult(fullText);

      if (parsed) {
        setResult(parsed);
      } else {
        setGenError('Could not parse the response. Try again.');
      }
    } catch (err: any) {
      setGenError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [product, audience, tone, framework, pricePoint, activeProduct, session]);

  const isLoading = generating;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0d0d10' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(224,92,122,0.15)', border: '1px solid rgba(224,92,122,0.3)' }}
        >
          <PenTool size={15} style={{ color: '#e05c7a' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-extrabold leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Copywriter
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            Headlines · Ad copy · Email subjects · SEO · TikTok hooks
          </div>
        </div>
        {result && (
          <button
            onClick={() => {
              setResult(null);
              setGenError('');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #F5F5F5',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} /> New Copy
          </button>
        )}
      </div>

      <ActiveProductBanner
        ctaLabel="Load into tool"
        onUseProduct={(summary) => setProduct(summary)}
      />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div
          className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Product / Offer *
              </label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                rows={3}
                placeholder="Describe your product, key features, and what makes it special…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Target Audience
              </label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Busy mums aged 28-40…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Tone
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      background: tone === t ? 'rgba(224,92,122,0.12)' : '#F9FAFB',
                      border: `1px solid ${tone === t ? 'rgba(224,92,122,0.3)' : '#E5E7EB'}`,
                      color: tone === t ? '#e05c7a' : '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Framework
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              >
                {FRAMEWORKS.map((f) => (
                  <option key={f} value={f} style={{ background: '#0d0d10' }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Price Point (AUD)
              </label>
              <input
                value={pricePoint}
                onChange={(e) => setPricePoint(e.target.value)}
                placeholder="e.g. 79"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm transition-all"
            style={{
              background: isLoading ? 'rgba(224,92,122,0.25)' : '#e05c7a',
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Writing…
              </>
            ) : (
              <>
                <PenTool size={14} /> Generate Copy Pack
              </>
            )}
          </button>

          {genError && (
            <div
              className="text-xs p-3 rounded-xl"
              style={{
                background: 'rgba(224,92,122,0.1)',
                border: '1px solid rgba(224,92,122,0.25)',
                color: 'rgba(224,92,122,0.9)',
              }}
            >
              {genError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(224,92,122,0.1)',
                  border: '1px solid rgba(224,92,122,0.2)',
                }}
              >
                <PenTool size={24} style={{ color: '#e05c7a' }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-extrabold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Writing your copy pack…
                </div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>
                  Crafting high-converting copy across all formats
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3 max-w-2xl">
              {/* Hero section */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(224,92,122,0.05)',
                  border: '1.5px solid rgba(224,92,122,0.2)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div
                    className="text-xl font-extrabold leading-tight"
                    style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                  >
                    {result.headline}
                  </div>
                  <CopyBtn text={result.headline} />
                </div>
                <div className="text-sm mb-3" style={{ color: '#CBD5E1' }}>
                  {result.subheadline}
                </div>
                <div
                  className="text-xs px-3 py-1.5 rounded-lg inline-block font-extrabold"
                  style={{ background: '#e05c7a', color: '#fff', fontFamily: "'Syne', sans-serif" }}
                >
                  {result.cta}
                </div>
              </div>

              <CopySection title="Website Copy" accent="#e05c7a">
                <CopyItem label="USP" text={result.usp} />
                <CopyItem label="Hero Hook" text={result.heroHook} />
                <CopyItem label="Product Description" text={result.productDescription} />
                <CopyItem label="Social Proof" text={result.socialProof} />
                <div className="mt-3">
                  <div
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                  >
                    Bullet Points
                  </div>
                  {result.bulletPoints.map((bp, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 py-1.5"
                      style={{ borderBottom: '1px solid #F9FAFB' }}
                    >
                      <div className="text-sm flex items-start gap-2" style={{ color: '#CBD5E1' }}>
                        <span style={{ color: '#e05c7a', flexShrink: 0 }}>✓</span>
                        {bp}
                      </div>
                      <CopyBtn text={bp} />
                    </div>
                  ))}
                </div>
              </CopySection>

              <CopySection title="Ad Headlines (Meta/Google)" accent="#4ab8f5">
                {result.adHeadlines.map((h, i) => (
                  <CopyItem key={i} label={`Headline ${i + 1}`} text={h} />
                ))}
              </CopySection>

              <CopySection title="Ad Primary Texts" accent="#4ab8f5">
                {result.adPrimaryTexts.map((t, i) => (
                  <CopyItem key={i} label={`Version ${i + 1}`} text={t} />
                ))}
              </CopySection>

              <CopySection title="Email Subject Lines" accent="#d4af37">
                {result.emailSubjectLines.map((s, i) => (
                  <CopyItem key={i} label={`Subject ${i + 1}`} text={s} />
                ))}
              </CopySection>

              <CopySection title="TikTok & Social" accent="#9c5fff">
                <CopyItem label="TikTok Hook (first 3 seconds)" text={result.tiktokHook} />
              </CopySection>

              <CopySection title="SEO" accent="#d4af37">
                <CopyItem label="Page Title" text={result.seoTitle} />
                <CopyItem label="Meta Description" text={result.seoMetaDescription} />
              </CopySection>

              <div className="pt-2">
                <SaveToProduct
                  toolId="copywriter"
                  toolName="Copywriter"
                  outputData={result}
                />
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">✍️</div>
              <div className="text-center">
                <div
                  className="text-base font-extrabold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Generate a full copy pack in seconds
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Headlines, ad copy, email subjects, SEO titles, and TikTok hooks — all tailored to
                  your product and audience.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
