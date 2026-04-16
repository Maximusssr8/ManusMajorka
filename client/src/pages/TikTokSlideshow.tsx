/**
 * TikTok Slideshow Builder — generates faceless slide-by-slide content
 * for TikTok / Reels / Shorts from product details.
 */

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { getStoredMarket } from '@/contexts/MarketContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { type PexelsPhoto, searchPortraitPhotos } from '@/lib/pexels';
import { capture } from '@/lib/posthog';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SlideData {
  slideNumber: number;
  text: string;
  type: 'hook' | 'body' | 'cta';
  notes?: string;
}

interface SlideshowResult {
  slides: SlideData[];
  captions: string[];
  audioStyle: string;
  postingTimes: string;
  colorSchemes: string[];
}

const HOOK_STYLES = [
  'Shocking stat',
  'Question',
  'Bold claim',
  'POV:',
  "Things AU sellers won't tell you",
];

const SLIDE_COUNTS = [5, 7, 10];
const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function TikTokSlideshow() {
  const { activeProduct } = useActiveProduct();
  const [productName, setProductName] = useState(activeProduct?.name || '');
  const [price, setPrice] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [hookStyle, setHookStyle] = useState(HOOK_STYLES[0]);
  const [slideCount, setSlideCount] = useState(7);
  const [platform, setPlatform] = useState(PLATFORMS[0]);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SlideshowResult | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [bgPhotos, setBgPhotos] = useState<PexelsPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!productName.trim()) {
      toast.error('Enter a product name');
      return;
    }
    setGenerating(true);
    capture('tool_opened', { tool: 'tiktok-slideshow' });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Generate a ${slideCount}-slide faceless ${platform} slideshow script for:

Product: ${productName}
Price: ${price || 'not specified'}
Target audience: ${targetAudience || 'AU online shoppers'}
Hook style: ${hookStyle}
Platform: ${platform}

Respond in STRICT JSON format only. No markdown, no explanation. Return this exact structure:
{
  "slides": [
    { "slideNumber": 1, "text": "hook text here", "type": "hook", "notes": "delivery notes" },
    { "slideNumber": 2, "text": "body text", "type": "body", "notes": "..." },
    ...
    { "slideNumber": ${slideCount}, "text": "CTA text", "type": "cta", "notes": "..." }
  ],
  "captions": ["caption 1 with #hashtags", "caption 2", "caption 3"],
  "audioStyle": "recommended audio type",
  "postingTimes": "best times for AU audience in AEST",
  "colorSchemes": ["scheme1 description", "scheme2", "scheme3", "scheme4", "scheme5"]
}

Requirements:
- Slide 1 MUST be a scroll-stopping hook using "${hookStyle}" style. Max 2 lines, large text energy.
- Body slides: one punchy point per slide. Stats, tips, or surprising facts. Specific to Australian market.
- Final slide: strong CTA ("Link in bio" / "Comment LINK" / "Save this for later")
- Captions must include AU-specific hashtags: #australianbusiness #dropshippingaustralia #ecommerceaustralia
- All content must feel native to ${platform}, not like an ad.
- Be specific to the product. No generic filler.`,
            },
          ],
          toolId: 'tiktok-slideshow',
          skipMemory: true,
          market: getStoredMarket(),
        }),
      });

      const data = await res.json();
      const text = data?.response || data?.content || '';

      // Parse JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse slideshow data');
      const parsed = JSON.parse(jsonMatch[0]) as SlideshowResult;

      if (!parsed.slides?.length) throw new Error('No slides generated');
      setResult(parsed);
      setCurrentSlide(0);
      capture('tool_completed', { tool: 'tiktok-slideshow', output_length: parsed.slides.length });
      toast.success(`${parsed.slides.length} slides generated!`);
    } catch (err: any) {
      toast.error(err?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [productName, price, targetAudience, hookStyle, slideCount, platform]);

  const handleRemixGPT = useCallback(async () => {
    if (!result) return;
    setRemixing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Take this TikTok slideshow script and make it more entertaining and AU-specific. Add relevant Aussie slang where appropriate. Keep it punchy and scroll-stopping. Keep the same JSON structure.

Current script:
${JSON.stringify(result, null, 2)}

Return ONLY the updated JSON. Same structure, better content.`,
            },
          ],
          toolId: 'tiktok-slideshow',
          skipMemory: true,
          market: getStoredMarket(),
        }),
      });

      const data = await res.json();
      const text = data?.response || data?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse remix');
      const parsed = JSON.parse(jsonMatch[0]) as SlideshowResult;
      setResult(parsed);
      setCurrentSlide(0);
      toast.success('Remixed with more AU flavour!');
    } catch {
      toast.error('Remix failed — try again');
    } finally {
      setRemixing(false);
    }
  }, [result]);

  const handleCopyAll = useCallback(() => {
    if (!result) return;
    const text = result.slides.map((s) => `Slide ${s.slideNumber}: ${s.text}`).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success('All slides copied!');
    capture('tool_exported', { tool: 'tiktok-slideshow', format: 'copy' });
  }, [result]);

  const handleCopyCaption = useCallback((caption: string) => {
    navigator.clipboard.writeText(caption).catch(() => {});
    toast.success('Caption copied!');
  }, []);

  // ── Input field style helper ─────────────────────────────────────────────────
  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1.5px solid #F5F5F5',
    color: '#F8FAFC',
    fontFamily: 'DM Sans, sans-serif',
  };

  const labelStyle = {
    color: '#94A3B8',
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#05070F' }}>
      <ActiveProductBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT PANEL: Inputs ── */}
        <div
          className="w-80 flex-shrink-0 border-r overflow-y-auto p-4 space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)', scrollbarWidth: 'thin' }}
        >
          <div>
            <h1
              className="text-lg font-extrabold flex items-center gap-2"
              style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
            >
              <Smartphone size={18} style={{ color: '#4f8ef7' }} />
              TikTok Slides
            </h1>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Generate faceless slideshow content for TikTok, Reels & Shorts
            </p>
          </div>

          <div>
            <label style={labelStyle}>Product Name</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Posture Corrector"
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. $49 AUD"
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Target Audience</label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. AU office workers 25-40"
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Hook Style</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {HOOK_STYLES.map((h) => (
                <button
                  key={h}
                  onClick={() => setHookStyle(h)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background:
                      hookStyle === h ? 'rgba(79,142,247,0.12)' : '#FAFAFA',
                    border: `1.5px solid ${hookStyle === h ? 'rgba(79,142,247,0.4)' : '#F9FAFB'}`,
                    color: hookStyle === h ? '#4f8ef7' : '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label style={labelStyle}>Slides</label>
              <div className="flex gap-1 mt-1">
                {SLIDE_COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSlideCount(c)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background:
                        slideCount === c ? 'rgba(79,142,247,0.12)' : '#FAFAFA',
                      border: `1.5px solid ${slideCount === c ? 'rgba(79,142,247,0.4)' : '#F9FAFB'}`,
                      color: slideCount === c ? '#4f8ef7' : '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg text-xs outline-none appearance-none"
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !productName.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
              color: '#FAFAFA',
              fontFamily: "'Syne', sans-serif",
              cursor: generating ? 'wait' : 'pointer',
              border: 'none',
            }}
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate Slideshow
              </>
            )}
          </button>

          {result && (
            <div
              className="space-y-2 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                onClick={handleCopyAll}
                className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: 'rgba(79,142,247,0.08)',
                  border: '1px solid rgba(79,142,247,0.2)',
                  color: '#4f8ef7',
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                <Copy size={11} /> Copy All Slides
              </button>
              <button
                onClick={handleRemixGPT}
                disabled={remixing}
                className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                style={{
                  background: 'rgba(156,95,255,0.08)',
                  border: '1px solid rgba(156,95,255,0.2)',
                  color: '#9c5fff',
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {remixing ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <RefreshCw size={11} />
                )}{' '}
                Remix (More AU Flavour)
              </button>
              <button
                onClick={async () => {
                  setLoadingPhotos(true);
                  const photos = await searchPortraitPhotos(productName + ' lifestyle', 6);
                  setBgPhotos(photos);
                  setLoadingPhotos(false);
                  if (photos.length) toast.success(`${photos.length} background images found`);
                  else toast.error('No images found — try a different product name');
                }}
                disabled={loadingPhotos || !productName.trim()}
                className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {loadingPhotos ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Download size={11} />
                )}{' '}
                Get Background Images
              </button>
              <SaveToProduct
                toolId="tiktok-slideshow"
                toolName="TikTok Slideshow"
                outputData={JSON.stringify(result)}
              />

              {bgPhotos.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#94A3B8', fontFamily: "'Syne', sans-serif" }}
                  >
                    STOCK BACKGROUNDS
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {bgPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.src.original}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <img
                          src={photo.src.tiny}
                          alt={photo.alt}
                          className="w-full h-16 object-cover"
                        />
                        <div
                          className="px-1 py-0.5 text-center"
                          style={{ fontSize: 7, color: '#9CA3AF' }}
                        >
                          {photo.photographer}
                        </div>
                      </a>
                    ))}
                  </div>
                  <div
                    className="text-center"
                    style={{ fontSize: 8, color: '#D1D5DB' }}
                  >
                    Photos from Pexels — free to use
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Preview ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {result ? (
            <>
              {/* Slide preview */}
              <div
                className="flex-1 flex items-center justify-center p-6"
                style={{ background: '#05070F' }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Toggle 9:16 preview */}
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="mb-3 text-xs px-3 py-1 rounded-full transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #F0F0F0',
                      color: '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    {previewMode ? 'Exit Preview' : `Preview as ${platform}`}
                  </button>

                  {/* Slide card */}
                  <div
                    className="relative rounded-2xl flex items-center justify-center p-8 overflow-hidden transition-all duration-300"
                    style={{
                      width: previewMode ? 270 : 400,
                      height: previewMode ? 480 : 300,
                      background: 'linear-gradient(135deg, #0f0f15, #F3F4F6)',
                      border: '1px solid #F5F5F5',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Slide type indicator */}
                    <div
                      className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background:
                          result.slides[currentSlide]?.type === 'hook'
                            ? 'rgba(239,68,68,0.2)'
                            : result.slides[currentSlide]?.type === 'cta'
                              ? 'rgba(79,142,247,0.2)'
                              : '#F5F5F5',
                        color:
                          result.slides[currentSlide]?.type === 'hook'
                            ? '#ef4444'
                            : result.slides[currentSlide]?.type === 'cta'
                              ? '#4f8ef7'
                              : '#6B7280',
                        fontSize: 9,
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {result.slides[currentSlide]?.type?.toUpperCase()}
                    </div>

                    <p
                      className="text-center font-extrabold leading-tight"
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        color: '#ffffff',
                        fontSize: previewMode ? 20 : 24,
                        maxWidth: '90%',
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      {result.slides[currentSlide]?.text}
                    </p>

                    {/* Slide number */}
                    <div
                      className="absolute bottom-3 right-3 text-xs"
                      style={{ color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {currentSlide + 1}/{result.slides.length}
                    </div>
                  </div>

                  {/* Navigation arrows */}
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                      disabled={currentSlide === 0}
                      className="p-2 rounded-full transition-all disabled:opacity-20"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <ArrowLeft size={16} />
                    </button>

                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                      {result.slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className="rounded-full transition-all"
                          style={{
                            width: i === currentSlide ? 16 : 6,
                            height: 6,
                            background: i === currentSlide ? '#4f8ef7' : '#D1D5DB',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentSlide(Math.min(result.slides.length - 1, currentSlide + 1))
                      }
                      disabled={currentSlide === result.slides.length - 1}
                      className="p-2 rounded-full transition-all disabled:opacity-20"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Slide notes */}
                  {result.slides[currentSlide]?.notes && (
                    <div
                      className="mt-3 text-xs text-center max-w-sm"
                      style={{ color: '#9CA3AF' }}
                    >
                      {result.slides[currentSlide].notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom panel: Captions + extras */}
              <div
                className="flex-shrink-0 border-t p-4 overflow-y-auto"
                style={{ borderColor: 'rgba(255,255,255,0.08)', maxHeight: 220 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Captions */}
                  <div>
                    <h3
                      className="text-xs font-bold mb-2"
                      style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                    >
                      CAPTIONS
                    </h3>
                    <div className="space-y-2">
                      {result.captions.map((cap, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded-lg"
                          style={{
                            background: '#05070F',
                            border: '1px solid #F9FAFB',
                          }}
                        >
                          <span
                            className="flex-1 text-xs"
                            style={{ color: '#CBD5E1', lineHeight: 1.5 }}
                          >
                            {cap}
                          </span>
                          <button
                            onClick={() => handleCopyCaption(cap)}
                            className="flex-shrink-0 p-1 rounded transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              color: '#9CA3AF',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Copy size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="space-y-3">
                    <div>
                      <h3
                        className="text-xs font-bold mb-1"
                        style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                      >
                        AUDIO STYLE
                      </h3>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {result.audioStyle}
                      </p>
                    </div>
                    <div>
                      <h3
                        className="text-xs font-bold mb-1"
                        style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                      >
                        POSTING TIMES (AEST)
                      </h3>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {result.postingTimes}
                      </p>
                    </div>
                    <div>
                      <h3
                        className="text-xs font-bold mb-1"
                        style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                      >
                        COLOR SCHEMES
                      </h3>
                      <div className="space-y-1">
                        {result.colorSchemes?.map((cs, i) => (
                          <div
                            key={i}
                            className="text-xs"
                            style={{ color: '#9CA3AF' }}
                          >
                            {i + 1}. {cs}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-xs">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: 'rgba(79,142,247,0.08)',
                    border: '1px solid rgba(79,142,247,0.15)',
                  }}
                >
                  <Smartphone size={28} style={{ color: '#4f8ef7' }} />
                </div>
                <h2
                  className="text-base font-extrabold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
                >
                  No slideshow yet
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Enter your product details and generate a scroll-stopping faceless slideshow for
                  TikTok, Reels, or Shorts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
