/**
 * ProductImporter — reusable product URL import flow.
 * Calls POST /api/import-product, shows shimmer loading with step indicators,
 * previews result with AI insights, and sets the active product via useActiveProduct
 * and ProductContext.
 */

import { ArrowRight, Check, ExternalLink, Package, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useProduct } from '@/contexts/ProductContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import type { ProductIntelligence } from '@/lib/buildToolPrompt';
import { proxyImage } from '@/lib/imageProxy';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportedProduct {
  productTitle: string;
  cleanTitle?: string;
  description: string;
  bulletPoints: string[];
  price: string;
  imageUrls: string[];
  sourceUrl?: string;
  sourcePlatform?: string;
  intelligence?: ProductIntelligence;
}

interface ProductImporterProps {
  onSuccess?: (product: ImportedProduct) => void;
  compact?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanProductTitle(title: string): string {
  let cleaned = title
    // Strip platform suffixes after - | –
    .replace(
      /\s*[-|–]\s*(aliexpress|amazon|shopify|ebay|etsy|walmart|temu|wish|dhgate|alibaba|lazada|shopee|taobao|jd\.com|rakuten|overstock|target|bestbuy|homedepot|wayfair|newegg)[^]*/gi,
      ''
    )
    // Strip pure alphanumeric 6+ char tokens (SKU-like codes)
    .replace(/\b[A-Z0-9]{6,}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleaned.length > 60) {
    cleaned = cleaned.slice(0, 57) + '...';
  }
  return cleaned || title.slice(0, 60);
}

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('aliexpress')) return 'AliExpress';
  if (lower.includes('amazon')) return 'Amazon';
  if (lower.includes('shopify') || lower.includes('myshopify')) return 'Shopify';
  if (lower.includes('ebay')) return 'eBay';
  if (lower.includes('etsy')) return 'Etsy';
  if (lower.includes('walmart')) return 'Walmart';
  if (lower.includes('temu')) return 'Temu';
  if (lower.includes('dhgate')) return 'DHgate';
  if (lower.includes('alibaba')) return 'Alibaba';
  if (lower.includes('lazada')) return 'Lazada';
  if (lower.includes('taobao')) return 'Taobao';
  if (lower.includes('newegg')) return 'Newegg';
  if (lower.includes('target.com')) return 'Target';
  if (lower.includes('wayfair')) return 'Wayfair';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

// ── Shimmer Skeleton ──────────────────────────────────────────────────────────

function ShimmerBlock({
  height = 16,
  width = '100%',
}: {
  height?: number;
  width?: string | number;
}) {
  return (
    <div
      className="rounded-lg shimmer-block"
      style={{
        height,
        width,
        background:
          'linear-gradient(90deg, #F9FAFB 25%, #F0F0F0 50%, #F9FAFB 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ProductImporter({ onSuccess, compact = false }: ProductImporterProps) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'result' | 'saved'>('idle');
  const [result, setResult] = useState<ImportedProduct | null>(null);
  const [importStep, setImportStep] = useState<'idle' | 'scraping' | 'analyzing' | 'done'>('idle');
  const { setProduct } = useActiveProduct();
  const { setActiveProduct: setContextProduct } = useProduct();
  const [, setLocation] = useLocation();

  const handleImport = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    setImportStep('scraping');
    setResult(null);

    // Switch to "analyzing" state after 4 seconds (scraping usually done by then)
    const analyzeTimer = setTimeout(() => setImportStep('analyzing'), 4000);

    try {
      const res = await fetch('/api/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearTimeout(analyzeTimer);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || data.error) {
        throw new Error(data.error || 'Import failed');
      }

      const p = data.product;

      const importedProduct: ImportedProduct = {
        productTitle: p.productTitle || 'Imported Product',
        cleanTitle: p.cleanTitle || cleanProductTitle(p.productTitle || 'Imported Product'),
        description: p.description || '',
        bulletPoints: p.bulletPoints || [],
        price: p.price || '',
        imageUrls: p.imageUrls || [],
        sourceUrl: url.trim(),
        sourcePlatform: p.sourcePlatform || detectPlatform(url.trim()),
        intelligence: p.intelligence,
      };

      setResult(importedProduct);
      setImportStep('done');
      setStatus('result');
    } catch {
      clearTimeout(analyzeTimer);
      setImportStep('idle');
      setStatus('error');
    }
  };

  const handleSetActive = () => {
    if (!result) return;
    const name = result.cleanTitle || result.productTitle;
    setProduct({
      name,
      niche: result.sourcePlatform || 'imported',
      summary: [
        result.description,
        result.price ? `Price: ${result.price}` : '',
        result.bulletPoints.slice(0, 3).join(' | '),
      ]
        .filter(Boolean)
        .join(' — ')
        .slice(0, 500),
      source: 'research',
      savedAt: Date.now(),
    });
    if (result) {
      setContextProduct({
        id: crypto.randomUUID(),
        name: result.cleanTitle || result.productTitle,
        niche: result.sourcePlatform || 'imported',
        summary: [result.description, result.price ? `Price: ${result.price}` : '']
          .filter(Boolean)
          .join(' — ')
          .slice(0, 500),
        images: result.imageUrls || [],
        price: result.price,
        sourceUrl: result.sourceUrl || '',
        intelligence: result.intelligence,
        savedAt: Date.now(),
        source: 'research',
      });
    }
    toast.success(`${name} is now your active product`);
    setStatus('saved');
    if (onSuccess) onSuccess(result);
  };

  const handleDiscard = () => {
    setResult(null);
    setStatus('idle');
    setUrl('');
  };

  const handleRetry = () => {
    setStatus('idle');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputBlock = (
    <div className="flex gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleImport()}
        placeholder="Paste AliExpress, Amazon, or any product URL..."
        className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #F0F0F0',
          color: '#F8FAFC',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
      />
      <button
        onClick={handleImport}
        disabled={!url.trim()}
        className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
        style={{
          background: url.trim()
            ? 'linear-gradient(135deg, #4f8ef7, #3B82F6)'
            : 'rgba(79,142,247,0.15)',
          color: url.trim() ? '#FFFFFF' : 'rgba(79,142,247,0.4)',
          border: 'none',
          cursor: url.trim() ? 'pointer' : 'not-allowed',
          fontFamily: "'Syne', sans-serif",
        }}
      >
        Import
      </button>
    </div>
  );

  const loadingBlock = (
    <div className="space-y-3">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${importStep === 'scraping' ? 'bg-yellow-400 animate-pulse' : importStep === 'analyzing' || importStep === 'done' ? 'bg-green-500' : 'bg-zinc-600'}`}
        />
        <span
          className={
            importStep === 'scraping'
              ? 'text-zinc-200'
              : importStep === 'analyzing' || importStep === 'done'
                ? 'text-zinc-500'
                : 'text-zinc-600'
          }
        >
          {importStep === 'scraping' ? 'Scraping product page...' : 'Product scraped ✓'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${importStep === 'analyzing' ? 'bg-yellow-400 animate-pulse' : importStep === 'done' ? 'bg-green-500' : 'bg-zinc-600'}`}
        />
        <span
          className={
            importStep === 'analyzing'
              ? 'text-yellow-400'
              : importStep === 'done'
                ? 'text-zinc-500'
                : 'text-zinc-600'
          }
        >
          {importStep === 'analyzing'
            ? 'AI is analyzing your product...'
            : importStep === 'done'
              ? 'Analysis complete ✓'
              : 'AI analysis'}
        </span>
      </div>
      {/* Shimmer skeleton */}
      <p
        className="text-xs font-semibold mb-3"
        style={{ color: 'rgba(79,142,247,0.7)', fontFamily: "'Syne', sans-serif" }}
      >
        Analysing product...
      </p>
      <ShimmerBlock height={20} width="70%" />
      <ShimmerBlock height={14} width="100%" />
      <ShimmerBlock height={14} width="85%" />
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );

  const errorBlock = (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <X size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
        <span className="text-sm flex-1" style={{ color: '#F8FAFC' }}>
          Failed to import product. Check the URL and try again.
        </span>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
            cursor: 'pointer',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    </div>
  );

  const resultCard = result && (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0d0d10',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Hero image */}
      {result.imageUrls.length > 0 ? (
        <div className="w-full overflow-hidden" style={{ height: 160, background: 'rgba(255,255,255,0.03)' }}>
          <img
            src={proxyImage(result.imageUrls[0]) ?? undefined}
            alt={result.cleanTitle || result.productTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{ height: 160, background: 'rgba(255,255,255,0.03)' }}
        >
          <Package size={48} style={{ color: '#E5E7EB' }} />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + badges */}
        <div className="flex items-start gap-2 flex-wrap">
          <h3
            className="text-sm font-extrabold flex-1 min-w-0"
            style={{ color: '#F8FAFC', fontFamily: "'Syne', sans-serif", lineHeight: 1.35 }}
          >
            {result.cleanTitle || result.productTitle}
          </h3>
          {result.price && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{
                background: 'rgba(79,142,247,0.12)',
                color: '#4f8ef7',
                border: '1px solid rgba(79,142,247,0.25)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {result.price}
            </span>
          )}
          {result.sourcePlatform && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
              style={{
                background: '#E5E7EB',
                color: '#94A3B8',
                border: '1px solid #F0F0F0',
              }}
            >
              {result.sourcePlatform}
            </span>
          )}
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
            {result.description.length > 120
              ? result.description.slice(0, 117) + '...'
              : result.description}
          </p>
        )}

        {/* Bullet points */}
        {result.bulletPoints.length > 0 && (
          <ul className="space-y-1">
            {result.bulletPoints.slice(0, 3).map((bp, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check size={11} style={{ color: '#4f8ef7', flexShrink: 0, marginTop: 2 }} />
                <span className="text-xs" style={{ color: '#94A3B8' }}>
                  {bp}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Image thumbnails */}
        {result.imageUrls.length > 1 && (
          <div className="flex gap-1.5">
            {result.imageUrls.slice(0, 4).map((imgUrl, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img
                  src={proxyImage(imgUrl) ?? undefined}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* AI Insights panel */}
        {result.intelligence && (
          <div
            className="mt-3 p-3 rounded-lg border"
            style={{ background: 'rgba(79,142,247,0.05)', borderColor: 'rgba(79,142,247,0.2)' }}
          >
            <div className="text-xs font-medium mb-2" style={{ color: '#4f8ef7' }}>
              🧠 AI Product Intelligence
            </div>
            <div className="space-y-1">
              <div className="text-xs" style={{ color: '#CBD5E1' }}>
                <span style={{ color: '#9CA3AF' }}>Audience: </span>
                {result.intelligence.primaryAudience}
              </div>
              <div className="text-xs" style={{ color: '#CBD5E1' }}>
                <span style={{ color: '#9CA3AF' }}>Hero angle: </span>
                {result.intelligence.heroAngle}
              </div>
              <div className="text-xs" style={{ color: '#CBD5E1' }}>
                <span style={{ color: '#9CA3AF' }}>Best season: </span>
                {result.intelligence.seasonality}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSetActive}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #3B82F6)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            <Check size={14} />
            Set as Active Product
          </button>
          <button
            onClick={handleDiscard}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'transparent',
              border: '1px solid #F0F0F0',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#F0F0F0')}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );

  const savedMessage = result && (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: 'rgba(79,142,247,0.06)',
        border: '1px solid rgba(79,142,247,0.2)',
      }}
    >
      <Check size={14} style={{ color: '#4f8ef7', flexShrink: 0 }} />
      <span className="text-sm flex-1" style={{ color: '#F8FAFC' }}>
        <span style={{ color: '#4f8ef7', fontWeight: 700 }}>
          {result.cleanTitle || result.productTitle}
        </span>{' '}
        is now your active product
      </span>
      <button
        onClick={() => setLocation('/app/product-discovery')}
        className="flex items-center gap-1.5 text-xs font-bold transition-all flex-shrink-0"
        style={{
          color: '#4f8ef7',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Syne', sans-serif",
        }}
      >
        Open in tools <ArrowRight size={11} />
      </button>
    </div>
  );

  // ── Compact mode ───────────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className="space-y-3">
        {status === 'idle' && inputBlock}
        {status === 'loading' && loadingBlock}
        {status === 'error' && (
          <>
            {errorBlock}
            {inputBlock}
          </>
        )}
        {status === 'result' && resultCard}
        {status === 'saved' && savedMessage}
      </div>
    );
  }

  // ── Full card mode ─────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: '#0d0d10',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div>
        <h3
          className="text-sm font-extrabold mb-0.5"
          style={{ fontFamily: "'Syne', sans-serif", color: '#F8FAFC' }}
        >
          Import Product
        </h3>
        <p className="text-xs" style={{ color: '#94A3B8' }}>
          Paste any product URL to auto-fill details
        </p>
      </div>

      {(status === 'idle' || status === 'error') && (
        <>
          {status === 'error' && errorBlock}
          {inputBlock}
        </>
      )}

      {status === 'loading' && loadingBlock}

      {status === 'result' && resultCard}

      {status === 'saved' && (
        <>
          {savedMessage}
          <button
            onClick={handleDiscard}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            Import another product
          </button>
        </>
      )}

      {/* Source link */}
      {(status === 'result' || status === 'saved') && result?.sourceUrl && (
        <a
          href={result.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4f8ef7')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
        >
          <ExternalLink size={11} />
          View original listing
        </a>
      )}
    </div>
  );
}

export default ProductImporter;
