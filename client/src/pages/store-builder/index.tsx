import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import ProductInput from '@/components/store-builder/ProductInput';
import BlueprintPreview from '@/components/store-builder/BlueprintPreview';
import ShopifyConnect from '@/components/store-builder/ShopifyConnect';
import PushSuccess from '@/components/store-builder/PushSuccess';

const STEP_LABELS = ['Choose a Template', 'Pick Your Niche', 'Customise Your Store', 'Connect & Launch'];
const accent = '#6366F1';
const brico = "'Bricolage Grotesque', sans-serif";

// ── Template data ──────────────────────────────────────────────

interface StoreTemplate {
  id: string;
  name: string;
  niche: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  tags: string[];
  aov: string;
  cr: string;
}

const TEMPLATES: StoreTemplate[] = [
  {
    id: "prestige",
    name: "Prestige",
    niche: "Luxury & Premium",
    description: "Dark, elegant aesthetic for high-ticket products. Bold typography, gold accents, full-screen hero.",
    accentColor: "#B8860B",
    bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    tags: ["Luxury", "High-ticket", "Premium"],
    aov: "$180–$420",
    cr: "2.8%",
  },
  {
    id: "aurora",
    name: "Aurora",
    niche: "Beauty & Skincare",
    description: "Soft gradients, clean product photography focus. Perfect for cosmetics and wellness brands.",
    accentColor: "#EC4899",
    bgGradient: "linear-gradient(135deg, #fdf4ff 0%, #fce7f3 100%)",
    tags: ["Beauty", "Skincare", "Wellness"],
    aov: "$65–$120",
    cr: "3.4%",
  },
  {
    id: "velocity",
    name: "Velocity",
    niche: "Sports & Fitness",
    description: "High energy, bold typography, dark hero with electric accents. Built for performance brands.",
    accentColor: "#10B981",
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    tags: ["Fitness", "Sports", "Performance"],
    aov: "$85–$160",
    cr: "3.1%",
  },
  {
    id: "minimal",
    name: "Minimal",
    niche: "Home & Lifestyle",
    description: "Clean whitespace, editorial layout. Products speak for themselves. Timeless and trustworthy.",
    accentColor: "#374151",
    bgGradient: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    tags: ["Home", "Minimal", "Lifestyle"],
    aov: "$55–$130",
    cr: "3.8%",
  },
  {
    id: "neonpulse",
    name: "Neon Pulse",
    niche: "Tech & Gadgets",
    description: "Futuristic dark UI with neon highlights. Converts exceptionally for electronic gadgets.",
    accentColor: "#6366F1",
    bgGradient: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
    tags: ["Tech", "Gadgets", "Electronics"],
    aov: "$95–$250",
    cr: "2.6%",
  },
  {
    id: "botanical",
    name: "Botanical",
    niche: "Eco & Sustainable",
    description: "Earth tones, natural textures, sustainability-focused copy. Perfect for eco-friendly products.",
    accentColor: "#16A34A",
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    tags: ["Eco", "Sustainable", "Natural"],
    aov: "$45–$95",
    cr: "4.1%",
  },
  {
    id: "metro",
    name: "Metro",
    niche: "Fashion & Apparel",
    description: "Urban, editorial fashion layout. Magazine-style grid with strong typography hierarchy.",
    accentColor: "#111827",
    bgGradient: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    tags: ["Fashion", "Apparel", "Streetwear"],
    aov: "$70–$180",
    cr: "3.2%",
  },
  {
    id: "playful",
    name: "Playful",
    niche: "Kids & Toys",
    description: "Bright, fun, high-trust design. Rounded corners and friendly typography for family products.",
    accentColor: "#F59E0B",
    bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    tags: ["Kids", "Toys", "Family"],
    aov: "$35–$85",
    cr: "4.5%",
  },
  {
    id: "heritage",
    name: "Heritage",
    niche: "Food & Gourmet",
    description: "Warm, artisanal aesthetic. Serif typography and rich photography for premium food brands.",
    accentColor: "#92400E",
    bgGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    tags: ["Food", "Gourmet", "Artisan"],
    aov: "$55–$110",
    cr: "3.9%",
  },
  {
    id: "storm",
    name: "Storm",
    niche: "Outdoor & Adventure",
    description: "Rugged, bold photography-first layout. Built for outdoor gear and adventure equipment.",
    accentColor: "#0EA5E9",
    bgGradient: "linear-gradient(135deg, #0c4a6e 0%, #075985 100%)",
    tags: ["Outdoor", "Adventure", "Gear"],
    aov: "$110–$280",
    cr: "2.9%",
  },
  {
    id: "rose",
    name: "Rose",
    niche: "Jewellery & Accessories",
    description: "Feminine, elegant, luxury feel without the high-ticket price point. Perfect for accessories.",
    accentColor: "#BE185D",
    bgGradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    tags: ["Jewellery", "Accessories", "Gifts"],
    aov: "$60–$150",
    cr: "3.6%",
  },
  {
    id: "clinical",
    name: "Clinical",
    niche: "Health & Supplements",
    description: "Clean, clinical, high-trust layout. Medical-grade credibility for health and wellness products.",
    accentColor: "#0891B2",
    bgGradient: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
    tags: ["Health", "Supplements", "Wellness"],
    aov: "$80–$200",
    cr: "3.3%",
  },
  {
    id: "coastal",
    name: "Coastal",
    niche: "Beach & Summer",
    description: "Fresh ocean vibes. Light and airy with sand and sky tones. Perfect for summer lifestyle brands.",
    accentColor: "#0284C7",
    bgGradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    tags: ["Beach", "Summer", "Lifestyle"],
    aov: "$40–$90",
    cr: "4.2%",
  },
  {
    id: "autozone",
    name: "AutoZone",
    niche: "Auto & Car Accessories",
    description: "Dark, masculine design for car accessories, detailing products, and automotive gear.",
    accentColor: "#EF4444",
    bgGradient: "linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)",
    tags: ["Auto", "Cars", "Accessories"],
    aov: "$70–$200",
    cr: "2.7%",
  },
  {
    id: "crafthaven",
    name: "CraftHaven",
    niche: "Art & Craft Supplies",
    description: "Creative, artsy aesthetic for craft supplies, stationery, and DIY products.",
    accentColor: "#7C3AED",
    bgGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    tags: ["Art", "Craft", "DIY"],
    aov: "$25–$75",
    cr: "3.9%",
  },
];

// ── Template Card ──────────────────────────────────────────────

function TemplateCard({ template, selected, onClick }: { template: StoreTemplate; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 16,
        border: selected ? "2px solid #6366F1" : "2px solid transparent",
        boxShadow: selected
          ? "0 0 0 4px rgba(99,102,241,0.12), 0 8px 24px rgba(99,102,241,0.15)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 200ms cubic-bezier(0.4,0,0.2,1)",
        background: "white",
        position: "relative" as const,
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Preview area */}
      <div style={{ height: 120, background: template.bgGradient, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: template.accentColor, marginBottom: 4, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{template.name}</div>
          <div style={{ width: 48, height: 3, background: template.accentColor, borderRadius: 999, margin: "0 auto 8px" }} />
          <div style={{ width: 80, height: 8, background: `${template.accentColor}40`, borderRadius: 4, margin: "0 auto 4px" }} />
          <div style={{ width: 56, height: 8, background: `${template.accentColor}25`, borderRadius: 4, margin: "0 auto" }} />
        </div>
        {selected && (
          <div style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%", background: "#6366F1", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>✓</div>
        )}
        <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
          {template.cr} CR
        </div>
      </div>
      {/* Info area */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: "#0A0A0A" }}>{template.name}</div>
          <div style={{ fontSize: 10, color: "#6B7280", whiteSpace: "nowrap" as const }}>AOV {template.aov}</div>
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>{template.niche}</div>
        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, marginBottom: 10 }}>{template.description}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
          {template.tags.map(tag => (
            <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: "#6366F1", background: "#EEF2FF", padding: "2px 7px", borderRadius: 999 }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function StoreBuilder() {
  // Steps: 1=Template, 2=Niche/Product, 3=Blueprint, 4=Connect, 5=Success
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [blueprint, setBlueprint] = useState<Record<string, any> | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState('');
  const [pushResult, setPushResult] = useState<Record<string, any> | null>(null);
  const [oauthConnected, setOauthConnected] = useState(false);
  const { session } = useAuth();

  const [urlProduct] = useState(() => new URLSearchParams(window.location.search).get('product') || '');
  const [urlNiche] = useState(() => new URLSearchParams(window.location.search).get('niche') || '');
  const [urlPrice] = useState(() => new URLSearchParams(window.location.search).get('price') || '');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setStep(4);
      setOauthConnected(true);
      window.history.replaceState({}, '', '/store-builder');
    }
    const oauthError = params.get('error');
    if (oauthError) {
      console.warn('[StoreBuilder] OAuth error:', oauthError);
    }
  }, []);

  const handleReset = () => {
    setStep(1);
    setSelectedTemplate('');
    setBlueprint(null);
    setPushResult(null);
    setSelectedStoreName('');
    setOauthConnected(false);
  };

  // Map internal step (1-5) to display step (0-3)
  const displayStep = step <= 1 ? 0 : step <= 2 ? 1 : step <= 3 ? 2 : 3;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Store Builder AI — Majorka</title>
      </Helmet>
      <style>{`
        @media (max-width: 640px) {
          .sb-topbar { padding: 12px 16px !important; }
          .sb-step-label { display: none !important; }
          .sb-content { padding: 24px 16px 80px !important; }
          .sb-template-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="sb-topbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: accent, letterSpacing: '-0.02em' }}>
          🏪 Store Builder AI
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {STEP_LABELS.map((label, i) => {
            const isActive = displayStep === i;
            const isDone = displayStep > i;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? accent : isDone ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#080a0e' : isDone ? accent : '#52525b',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className="sb-step-label" style={{ fontSize: 12, color: isActive ? accent : '#52525b' }}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero headline — only on step 1 */}
      {step === 1 && (
        <div style={{ textAlign: 'center', padding: '48px 24px 0' }}>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px, 5vw, 44px)', color: '#f0ede8', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Your Shopify store, built in 60 seconds.
          </h1>
          <p style={{ fontSize: 16, color: '#71717a', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Pick a template, choose your niche, and let Majorka's AI build a complete, conversion-optimised Shopify store — ready to launch.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="sb-content" style={{ maxWidth: step === 1 ? 1100 : 680, margin: '0 auto', padding: '40px 24px 80px', transition: 'max-width 300ms' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= displayStep ? '#6366F1' : '#F3F4F6',
                  color: i <= displayStep ? 'white' : '#9CA3AF',
                  fontSize: 14, fontWeight: 700,
                  boxShadow: i === displayStep ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  transition: 'all 200ms',
                }}>
                  {i < displayStep ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: i === displayStep ? 600 : 400,
                  color: i <= displayStep ? '#6366F1' : '#9CA3AF',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: i < displayStep ? '#6366F1' : '#F3F4F6',
                  transition: 'background 300ms',
                  marginBottom: 28,
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Choose a Template */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', color: '#f0ede8', marginBottom: 8 }}>
                Choose a template
              </h2>
              <p style={{ fontSize: 15, color: '#71717a' }}>
                Each template is built for a specific niche and pre-optimised for AU conversions. You can customise colours and copy after selecting.
              </p>
            </div>

            <div className="sb-template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {TEMPLATES.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate === template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setTimeout(() => setStep(2), 400);
                  }}
                />
              ))}
            </div>

            {selectedTemplate && (
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    height: 44, padding: '0 28px', background: '#6366F1', color: 'white',
                    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    transition: 'transform 150ms',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Continue with {TEMPLATES.find(t => t.id === selectedTemplate)?.name} →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pick Your Niche / Product */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 8 }}
              >
                ← Back to templates
              </button>
            </div>
            <ProductInput
              session={session}
              initialProduct={urlProduct}
              initialNiche={urlNiche}
              initialPrice={urlPrice}
              onComplete={(input, bp) => {
                setBlueprint(bp);
                setSelectedStoreName(bp.storeNameOptions?.[0] || input.productName);
                setStep(3);
              }}
            />
          </div>
        )}

        {/* Step 3: Customise Your Store */}
        {step === 3 && blueprint && (
          <BlueprintPreview
            blueprint={blueprint}
            selectedStoreName={selectedStoreName}
            onSelectStoreName={setSelectedStoreName}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {/* Step 4: Connect & Launch */}
        {step === 4 && (
          <ShopifyConnect
            blueprint={blueprint}
            selectedStoreName={selectedStoreName}
            session={session}
            initialConnected={oauthConnected}
            onPushComplete={result => { setPushResult(result); setStep(5); }}
            onBack={() => setStep(3)}
          />
        )}

        {/* Step 5: Success */}
        {step === 5 && pushResult && (
          <PushSuccess result={pushResult} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
