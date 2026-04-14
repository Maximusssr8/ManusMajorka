import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import { LockedTeaser } from '@/components/funnel/LockedTeaser';
import { C } from '@/lib/designTokens';
import { Download, History as HistoryIcon, Save, Sparkles, RefreshCw } from 'lucide-react';
import ProductSelector, { type AdProduct } from '@/components/ads/ProductSelector';
import FormatTabs, { AD_FORMATS, getFormatSpec, type AdFormat } from '@/components/ads/FormatTabs';
import AdFieldEditor from '@/components/ads/AdFieldEditor';
import AdPreview from '@/components/ads/AdPreview';
import HistoryDrawer, { type HistoryItem } from '@/components/ads/HistoryDrawer';

interface AdOutput {
  headlines: string[];
  bodies: string[];
  ctas: string[];
  hook: string;
  audience: string;
  interests: string[];
}

interface GenerateResponse {
  ok: boolean;
  output?: AdOutput;
  product?: { id: string; title: string; image_url: string | null };
  error?: string;
  message?: string;
}

interface HistoryResponse {
  ok: boolean;
  items?: HistoryItem[];
}

interface SaveResponse {
  ok: boolean;
  id?: string;
  createdAt?: string;
  error?: string;
}

const EMPTY_OUTPUT: AdOutput = {
  headlines: ['', '', ''],
  bodies: ['', '', ''],
  ctas: ['', '', ''],
  hook: '',
  audience: '',
  interests: ['', '', '', '', ''],
};

function buildExportText(product: AdProduct | null, format: AdFormat, output: AdOutput): string {
  const spec = getFormatSpec(format);
  const head = [
    `Majorka Ads Studio — Export`,
    `Product: ${product?.title ?? '(none)'}`,
    `Format:  ${spec.label} (${spec.aspect})`,
    `Market:  AU`,
    ``,
  ].join('\n');

  const section = (title: string, lines: string[]): string =>
    `## ${title}\n` + lines.map((l, i) => `${i + 1}. ${l}`).join('\n') + '\n';

  const body = [
    section('Headlines', output.headlines),
    section('Bodies', output.bodies),
    section('CTAs', output.ctas),
    `## Hook\n${output.hook}\n`,
    `## Audience\n${output.audience}\n`,
    section('Interests', output.interests),
  ].join('\n');

  return head + body;
}

function downloadTxt(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdsStudio() {
  const { subPlan, subStatus } = useAuth();
  const isPaid =
    ['builder', 'scale'].includes((subPlan || '').toLowerCase()) &&
    (subStatus || '').toLowerCase() === 'active';

  const [token, setToken] = useState<string | null>(null);
  const [product, setProduct] = useState<AdProduct | null>(null);
  const [format, setFormat] = useState<AdFormat>('meta_feed');
  const [output, setOutput] = useState<AdOutput>(EMPTY_OUTPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState(0);
  const [selectedBody, setSelectedBody] = useState(0);
  const [selectedCta, setSelectedCta] = useState(0);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const spec = useMemo(() => getFormatSpec(format), [format]);

  useEffect(() => {
    document.title = 'Ads Studio | Majorka';
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/ads/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as HistoryResponse;
      setHistoryItems(body.items ?? []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (historyOpen) void loadHistory();
  }, [historyOpen, loadHistory]);

  async function handleGenerate(regenSection?: 'headlines' | 'bodies' | 'ctas' | 'interests' | 'hook' | 'audience') {
    if (!product) {
      setError('Select a product first.');
      return;
    }
    if (!token) {
      setError('Sign in to generate ads.');
      return;
    }
    setError(null);
    setStatus(regenSection ? `Regenerating ${regenSection}…` : 'Generating copy…');
    setLoading(true);
    try {
      const res = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, format, market: 'AU' }),
      });
      const body = (await res.json()) as GenerateResponse;
      if (!body.ok || !body.output) {
        setError(body.message ?? body.error ?? 'Generation failed.');
        setStatus(null);
        return;
      }

      if (regenSection) {
        setOutput((prev) => ({ ...prev, [regenSection]: body.output![regenSection] } as AdOutput));
      } else {
        setOutput(body.output);
      }
      setStatus('Done.');
      setTimeout(() => setStatus(null), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!product || !token) return;
    setStatus('Saving…');
    try {
      const res = await fetch('/api/ads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, format, market: 'AU', output }),
      });
      const body = (await res.json()) as SaveResponse;
      if (!body.ok) {
        setError(body.error ?? 'Save failed');
        setStatus(null);
        return;
      }
      setStatus('Saved to history.');
      void loadHistory();
      setTimeout(() => setStatus(null), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
      setStatus(null);
    }
  }

  function handleExport() {
    const text = buildExportText(product, format, output);
    const fname = `majorka-ads-${format}-${Date.now()}.txt`;
    downloadTxt(fname, text);
  }

  function handleRestore(item: HistoryItem) {
    setFormat(item.format);
    setOutput({
      headlines: item.output_json.headlines ?? ['', '', ''],
      bodies:    item.output_json.bodies    ?? ['', '', ''],
      ctas:      item.output_json.ctas      ?? ['', '', ''],
      hook:      item.output_json.hook      ?? '',
      audience:  item.output_json.audience  ?? '',
      interests: item.output_json.interests ?? ['', '', '', '', ''],
    });
    setHistoryOpen(false);
    setStatus('Restored from history.');
    setTimeout(() => setStatus(null), 1500);
  }

  function updateArray(key: 'headlines' | 'bodies' | 'ctas' | 'interests', index: number, value: string) {
    setOutput((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  }

  const hasOutput = output.headlines.some((h) => h.length > 0) || output.hook.length > 0;

  const workspace = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: 24,
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        {/* 1. Product */}
        <section style={cardStyle}>
          <ProductSelector token={token} selected={product} onSelect={setProduct} />
        </section>

        {/* 2. Format */}
        <section style={cardStyle}>
          <div
            style={{
              fontFamily: C.fontMono,
              fontSize: 11,
              letterSpacing: 1.2,
              color: C.muted,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Format
          </div>
          <FormatTabs value={format} onChange={setFormat} />
        </section>

        {/* 3. Generate */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading || !product}
              style={goldBtn(loading || !product)}
            >
              <Sparkles size={14} />
              {loading ? 'Generating…' : hasOutput ? 'Regenerate all' : 'Generate copy'}
            </button>
            {hasOutput && (
              <>
                <button type="button" onClick={handleSave} style={secondaryBtn} disabled={!product}>
                  <Save size={14} /> Save
                </button>
                <button type="button" onClick={handleExport} style={secondaryBtn}>
                  <Download size={14} /> Export All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              style={secondaryBtn}
              disabled={!token}
            >
              <HistoryIcon size={14} /> History
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 10, color: C.red, fontSize: 12 }}>{error}</div>
          )}
          {status && !error && (
            <div style={{ marginTop: 10, color: C.accent, fontSize: 12, fontFamily: C.fontMono }}>
              {status}
            </div>
          )}
        </section>

        {/* 4. Output sections */}
        {hasOutput && (
          <>
            <OutputSection
              title="Headlines"
              onRegenerate={() => handleGenerate('headlines')}
              loading={loading}
            >
              {output.headlines.map((h, i) => (
                <AdFieldEditor
                  key={i}
                  label={`Headline ${i + 1}`}
                  value={h}
                  limit={spec.headlineLimit}
                  onChange={(v) => updateArray('headlines', i, v)}
                />
              ))}
            </OutputSection>

            <OutputSection
              title="Bodies"
              onRegenerate={() => handleGenerate('bodies')}
              loading={loading}
            >
              {output.bodies.map((b, i) => (
                <AdFieldEditor
                  key={i}
                  label={`Body ${i + 1}`}
                  value={b}
                  limit={spec.bodyLimit}
                  multiline
                  onChange={(v) => updateArray('bodies', i, v)}
                />
              ))}
            </OutputSection>

            <OutputSection
              title="CTAs"
              onRegenerate={() => handleGenerate('ctas')}
              loading={loading}
            >
              {output.ctas.map((c, i) => (
                <AdFieldEditor
                  key={i}
                  label={`CTA ${i + 1}`}
                  value={c}
                  limit={40}
                  onChange={(v) => updateArray('ctas', i, v)}
                />
              ))}
            </OutputSection>

            <OutputSection
              title="Hook"
              onRegenerate={() => handleGenerate('hook')}
              loading={loading}
            >
              <AdFieldEditor
                label="Hook"
                value={output.hook}
                limit={200}
                multiline
                onChange={(v) => setOutput((prev) => ({ ...prev, hook: v }))}
              />
            </OutputSection>

            <OutputSection
              title="Audience"
              onRegenerate={() => handleGenerate('audience')}
              loading={loading}
            >
              <AdFieldEditor
                label="Audience"
                value={output.audience}
                multiline
                onChange={(v) => setOutput((prev) => ({ ...prev, audience: v }))}
              />
            </OutputSection>

            <OutputSection
              title="Interests"
              onRegenerate={() => handleGenerate('interests')}
              loading={loading}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 8,
                }}
              >
                {output.interests.map((it, i) => (
                  <AdFieldEditor
                    key={i}
                    label={`Interest ${i + 1}`}
                    value={it}
                    limit={80}
                    onChange={(v) => updateArray('interests', i, v)}
                  />
                ))}
              </div>
            </OutputSection>

            {/* Variant selectors feeding preview */}
            <section style={cardStyle}>
              <div
                style={{
                  fontFamily: C.fontMono,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  color: C.muted,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Preview variant
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <VariantPicker
                  label="Headline"
                  count={3}
                  value={selectedHeadline}
                  onChange={setSelectedHeadline}
                />
                <VariantPicker label="Body" count={3} value={selectedBody} onChange={setSelectedBody} />
                <VariantPicker label="CTA" count={3} value={selectedCta} onChange={setSelectedCta} />
              </div>
            </section>
          </>
        )}
      </div>

      {/* Right preview column — sticky */}
      <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontFamily: C.fontMono,
            fontSize: 11,
            letterSpacing: 1.2,
            color: C.muted,
            textTransform: 'uppercase',
          }}
        >
          Live preview
        </div>
        <AdPreview
          format={format}
          image={product?.image_url ?? null}
          headline={output.headlines[selectedHeadline] ?? ''}
          body={output.bodies[selectedBody] ?? ''}
          cta={output.ctas[selectedCta] ?? ''}
          brandName="Your Store"
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px 80px', maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: C.fontMono,
            fontSize: 11,
            letterSpacing: 1.6,
            color: C.accent,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Create · Ads
        </div>
        <h1 style={{ fontFamily: C.fontDisplay, fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
          Ads Studio
        </h1>
        <p style={{ color: C.body, fontFamily: C.fontBody, fontSize: 14, maxWidth: 620, marginTop: 6 }}>
          Pick a winner, choose a format, and get three battle-tested variants of headline, body, and CTA —
          plus hook, audience, and interests — ready to paste into Meta or TikTok Ads Manager.
        </p>
      </header>

      {isPaid ? (
        workspace
      ) : (
        <LockedTeaser feature="ads.brief-full" tier="builder">
          <div style={{ pointerEvents: 'none' }}>{workspace}</div>
        </LockedTeaser>
      )}

      <HistoryDrawer
        open={historyOpen}
        items={historyItems}
        loading={historyLoading}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
      />
    </div>
  );
}

const cardStyle = {
  padding: 18,
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: C.rLg,
} as const;

function goldBtn(disabled: boolean) {
  return {
    minHeight: 44,
    padding: '0 20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: disabled ? C.raised : C.accent,
    color: disabled ? C.muted : C.accentInk,
    border: 'none',
    borderRadius: C.rMd,
    fontFamily: C.fontDisplay,
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: 0.4,
  } as const;
}

const secondaryBtn = {
  minHeight: 44,
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: C.cardBg,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: C.rMd,
  fontFamily: C.fontBody,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
} as const;

function OutputSection({
  title,
  onRegenerate,
  loading,
  children,
}: {
  title: string;
  onRegenerate: () => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ fontFamily: C.fontDisplay, fontSize: 15, fontWeight: 700 }}>{title}</div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={loading}
          style={{
            minHeight: 32,
            padding: '0 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: C.rSm,
            color: C.muted,
            fontFamily: C.fontMono,
            fontSize: 10,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={11} /> Regenerate
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  );
}

function VariantPicker({
  label,
  count,
  value,
  onChange,
}: {
  label: string;
  count: number;
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.muted, letterSpacing: 1.2 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            style={{
              width: 36,
              height: 36,
              background: value === i ? C.accent : 'transparent',
              color: value === i ? C.accentInk : C.muted,
              border: `1px solid ${value === i ? C.accent : C.border}`,
              borderRadius: C.rSm,
              fontFamily: C.fontMono,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
// Ensure AD_FORMATS referenced (no-op) — silences unused warnings if any.
void AD_FORMATS;
