import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

// ── Shared callAI function ──────────────────────────────────────────────────
async function callAI(tool: string, params: Record<string, string>): Promise<string> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, ...params }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.result || data.text || '';
  } catch {
    const fallbacks: Record<string, string> = {
      'ad-copy': `Headline: Australians Can't Stop Talking About This ${params.productName || 'Product'}\n\nBody: Join 10,000+ AU shoppers who discovered the secret to ${params.productName || 'this product'}. Free shipping Australia-wide. 30-day money-back guarantee. Limited stock — order now!\n\nCTA: Shop Now — Only $${params.price || '49'} AUD`,
      'description': `**${params.productName || 'Product'}**\n\nAustralian dropshippers and online shoppers love this product for good reason. The ${params.productName || 'product'} delivers exceptional quality at an unbeatable price point.\n\n**Key Benefits:**\n• Premium build quality that lasts\n• Fast AU shipping (3-7 days)\n• 30-day hassle-free returns\n• Trusted by 10,000+ Australian customers\n\nOrder today and receive free shipping on orders over $75.`,
      'email': `Subject: Did you forget something? 👀\n\nHey there,\n\nYou left something amazing in your cart — the ${params.brandName || 'our'} bestseller!\n\nDon't miss out. Your cart expires in 24 hours, and this product is selling fast.\n\n[Complete Your Order →]\n\nFree shipping on all orders over $75 🇦🇺\n\nBest,\nThe ${params.brandName || 'Store'} Team`,
      'name': `Here are 8 store name ideas for your ${params.niche || 'general'} niche:\n\n1. ${params.niche || 'Shop'}Hub AU\n2. The${params.niche || 'Good'}Store\n3. AU${params.niche || 'Best'}Co\n4. Shop${params.niche || 'Smart'}\n5. ${params.niche || 'Shop'}Direct\n6. Prime${params.niche || 'Goods'}\n7. ${params.niche || 'Shop'}Market\n8. True${params.niche || 'Quality'}`,
    };
    return fallbacks[tool] || 'Generated content will appear here.';
  }
}

// ── Shared ToolCard wrapper ─────────────────────────────────────────────────
function ToolCard({ icon, title, description, children }: { icon: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A0A0A' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{description}</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #F5F5F5', paddingTop: 16 }}>{children}</div>
    </div>
  );
}

// ── Shared input style ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  height: 40, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', width: '100%',
  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' as const, color: '#0A0A0A',
};

const btnStyle: React.CSSProperties = {
  height: 40, background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms', width: '100%',
};

// ── Tool 1: Ad Copy Generator ───────────────────────────────────────────────
function AdCopyTool() {
  const [productName, setProductName] = useState('');
  const [platform, setPlatform] = useState('Facebook');
  const [tone, setTone] = useState('Urgent');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    const text = await callAI('ad-copy', { productName, platform, tone });
    setResult(text);
    setLoading(false);
  };

  return (
    <ToolCard icon="📣" title="Ad Copy Generator" description="Meta, TikTok & Google ad copy in seconds">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Product name (e.g. Posture Corrector)" value={productName} onChange={e => setProductName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <div style={{ display: 'flex', gap: 8 }}>
          {['Facebook', 'TikTok', 'Google'].map(p => (
            <button key={p} onClick={() => setPlatform(p)} style={{
              flex: 1, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 150ms',
              background: platform === p ? '#6366F1' : '#F5F5F5', color: platform === p ? 'white' : '#374151',
            }}>{p}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Urgent', 'Casual', 'Premium'].map(t => (
            <button key={t} onClick={() => setTone(t)} style={{
              flex: 1, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 150ms',
              background: tone === t ? '#6366F1' : '#F5F5F5', color: tone === t ? 'white' : '#374151',
            }}>{t}</button>
          ))}
        </div>
        <button onClick={generate} disabled={loading || !productName.trim()} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Generating...' : 'Generate Ad Copy →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: 'inherit', margin: 0 }}>{result}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : 'Copy All'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Tool 2: Product Description Writer ──────────────────────────────────────
function DescriptionTool() {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [audience, setAudience] = useState('AU Shoppers (General)');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    const text = await callAI('description', { productName, features, audience });
    setResult(text);
    setLoading(false);
  };

  return (
    <ToolCard icon="📝" title="Product Description Writer" description="SEO-optimised product copy for AU stores">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Product name" value={productName} onChange={e => setProductName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <textarea placeholder="Key features (2-3 bullet points)" value={features} onChange={e => setFeatures(e.target.value)} rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' as const }}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <select value={audience} onChange={e => setAudience(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {['AU Shoppers (General)', 'Young Adults 18-34', 'Parents', 'Fitness Enthusiasts', 'Tech Users'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button onClick={generate} disabled={loading || !productName.trim()} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Generating...' : 'Generate Description →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: 'inherit', margin: 0 }}>{result}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : 'Copy All'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Tool 3: Email Templates ─────────────────────────────────────────────────
function EmailTool() {
  const [templateType, setTemplateType] = useState('Abandoned Cart');
  const [brandName, setBrandName] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    const text = await callAI('email', { templateType, brandName: brandName || 'Your Store' });
    setResult(text);
    setLoading(false);
  };

  const subjectLine = result.split('\n').find(l => l.toLowerCase().startsWith('subject:'))?.replace(/^subject:\s*/i, '') || '';
  const emailBody = result.split('\n').filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();

  return (
    <ToolCard icon="📧" title="Email Templates" description="Abandoned cart, welcome & win-back emails">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Abandoned Cart', 'Welcome', 'Win-back'].map(t => (
            <button key={t} onClick={() => setTemplateType(t)} style={{
              flex: 1, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 150ms',
              background: templateType === t ? '#6366F1' : '#F5F5F5', color: templateType === t ? 'white' : '#374151',
            }}>{t}</button>
          ))}
        </div>
        <input placeholder="Brand name (e.g. PureGlow AU)" value={brandName} onChange={e => setBrandName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <button onClick={generate} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Generating...' : 'Generate Email →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            {subjectLine && (
              <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>Subject Line</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A' }}>{subjectLine}</div>
              </div>
            )}
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: 'inherit', margin: 0 }}>{emailBody}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : 'Copy All'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Tool 4: Store Name Generator ────────────────────────────────────────────
function NameGeneratorTool() {
  const [niche, setNiche] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    const text = await callAI('name', { niche });
    setResult(text);
    setLoading(false);
  };

  // Parse numbered list from result
  const names = result
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(l => l.length > 0 && !l.toLowerCase().startsWith('here'));

  return (
    <ToolCard icon="✨" title="Store Name Generator" description="AI-powered brand name ideas for your niche">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Niche (e.g. pet accessories)" value={niche} onChange={e => setNiche(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          onKeyDown={e => { if (e.key === 'Enter') generate(); }} />
        <button onClick={generate} disabled={loading || !niche.trim()} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Generating...' : 'Generate Names →'}
        </button>
        {names.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {names.map((name, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{name}</span>
                <button onClick={() => { navigator.clipboard.writeText(name); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                  style={{ height: 28, padding: '0 12px', background: copiedIdx === i ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms', flexShrink: 0 }}>
                  {copiedIdx === i ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Content Creator: callContentAI ──────────────────────────────────────────
async function callContentAI(tool: string, params: Record<string, string>): Promise<string> {
  try {
    const res = await fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, ...params }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.result || '';
  } catch {
    return 'Could not generate content. Please try again.';
  }
}

// ── Content Tool 1: TikTok Script Generator ─────────────────────────────────
function TikTokScriptTool() {
  const [productName, setProductName] = useState('');
  const [benefit, setBenefit] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    const text = await callContentAI('tiktok-script', { productName, benefit });
    setResult(text);
    setLoading(false);
  };

  return (
    <ToolCard icon="🎵" title="TikTok Script Generator" description="Hook → content → CTA in TikTok-native language">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Product name (e.g. Posture Corrector)" value={productName} onChange={e => setProductName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <input placeholder="Key benefit (e.g. relieves back pain in 10 min)" value={benefit} onChange={e => setBenefit(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <button onClick={generate} disabled={loading || !productName.trim()}
          style={{ ...btnStyle, opacity: loading || !productName.trim() ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Writing Script...' : '🎵 Generate TikTok Script →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{result}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : '📋 Copy Script'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Content Tool 2: YouTube Short Script ────────────────────────────────────
function YouTubeShortTool() {
  const [productName, setProductName] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    const text = await callContentAI('youtube-short', { productName });
    setResult(text);
    setLoading(false);
  };

  return (
    <ToolCard icon="📹" title="YouTube Short Script" description="Title, hook, 60-second script, CTA">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Product name (e.g. LED Desk Lamp)" value={productName} onChange={e => setProductName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <button onClick={generate} disabled={loading || !productName.trim()}
          style={{ ...btnStyle, opacity: loading || !productName.trim() ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Writing Script...' : '📹 Generate YouTube Script →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{result}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : '📋 Copy Script'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Content Tool 3: Ad Copy Pack ────────────────────────────────────────────
function AdCopyPackTool() {
  const [productName, setProductName] = useState('');
  const [audience, setAudience] = useState('AU Shoppers (General)');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    const text = await callContentAI('ad-pack', { productName, audience });
    setResult(text);
    setLoading(false);
  };

  return (
    <ToolCard icon="📦" title="Ad Copy Pack" description="5 platform variations — Facebook, TikTok, Instagram, Google, Email">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Product name (e.g. Wireless Earbuds)" value={productName} onChange={e => setProductName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        <select value={audience} onChange={e => setAudience(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {['AU Shoppers (General)', 'Young Adults 18-34', 'Parents & Families', 'Fitness Enthusiasts', 'Home Workers'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button onClick={generate} disabled={loading || !productName.trim()}
          style={{ ...btnStyle, opacity: loading || !productName.trim() ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Generating Pack...' : '📦 Generate Full Ad Pack →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{result}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : '📋 Copy All'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Content Tool 4: Hashtag Research ────────────────────────────────────────
function HashtagTool() {
  const [niche, setNiche] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    const text = await callContentAI('hashtags', { niche });
    setResult(text);
    setLoading(false);
  };

  return (
    <ToolCard icon="#️⃣" title="Hashtag Research" description="20 hashtags by size — mega, macro, micro, niche, AU-specific">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Niche (e.g. fitness gadgets)" value={niche} onChange={e => setNiche(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366F1')} onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          onKeyDown={e => { if (e.key === 'Enter') generate(); }} />
        <button onClick={generate} disabled={loading || !niche.trim()}
          style={{ ...btnStyle, opacity: loading || !niche.trim() ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⟳ Researching...' : '#️⃣ Research Hashtags →'}
        </button>
        {result && (
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{result}</pre>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ marginTop: 10, height: 30, padding: '0 14px', background: copied ? '#059669' : '#6366F1', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}>
              {copied ? '✓ Copied!' : '📋 Copy All'}
            </button>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function GrowthTools() {
  const [activeTab, setActiveTab] = useState<'marketing' | 'content'>('marketing');

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Growth Tools | Majorka</title></Helmet>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ borderBottom: '1px solid #F0F0F0', paddingBottom: 20, marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A0A0A', marginBottom: 4, marginTop: 0 }}>Growth Tools</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>AI-powered marketing tools for Australian dropshippers</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: '#F5F5F5', borderRadius: 10, padding: 4, marginBottom: 28, width: 'fit-content' }}>
          {(['marketing', 'content'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 150ms',
                background: activeTab === tab ? '#6366F1' : 'transparent',
                color: activeTab === tab ? 'white' : '#6B7280' }}>
              {tab === 'marketing' ? '📢 Marketing Tools' : '🎬 Content Creator'}
            </button>
          ))}
        </div>

        {/* Marketing Tools tab */}
        {activeTab === 'marketing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20 }}>
            <AdCopyTool />
            <DescriptionTool />
            <EmailTool />
            <NameGeneratorTool />
          </div>
        )}

        {/* Content Creator tab */}
        {activeTab === 'content' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20 }}>
            <TikTokScriptTool />
            <YouTubeShortTool />
            <AdCopyPackTool />
            <HashtagTool />
          </div>
        )}
      </div>
    </div>
  );
}
