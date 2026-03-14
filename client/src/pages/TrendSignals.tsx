/**
 * TrendSignals.tsx — Emerging AU Trend Detection Engine
 * Shows live trend signals from Supabase (6h cron refresh) with AU seasonal calendar.
 */

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import UsageCounter from '@/components/UsageCounter';
import UpgradePromptBanner from '@/components/UpgradePromptBanner';

// ── Types ────────────────────────────────────────────────────────────────────

interface TrendSignal {
  id: string;
  trend_name: string;
  category: string;
  signal_strength: number;
  stage: 'emerging' | 'rising' | 'peak' | 'declining';
  why_now: string;
  opportunity_window: string;
  est_monthly_revenue_aud: number;
  sample_products: string[];
  target_audience: string;
  entry_difficulty: 'Easy' | 'Medium' | 'Hard';
  au_seasonal_relevance: string;
  action: string;
  detected_at: string;
  updated_at: string;
}

// ── Hardcoded fallback data (March 2025 AU trends from Claude) ───────────────

const FALLBACK_TRENDS: TrendSignal[] = [
  {
    id: '1', trend_name: 'Sustainable Bamboo Home Products', category: 'Home & Garden',
    signal_strength: 8, stage: 'rising',
    why_now: 'Australian consumers increasingly prioritize eco-friendly alternatives as awareness of plastic waste grows. Winter season drives home improvement and comfort product purchases.',
    opportunity_window: 'March–May 2025', est_monthly_revenue_aud: 18500,
    sample_products: ['Bamboo cutting boards', 'Reusable bamboo straw sets', 'Bamboo storage organizers'],
    target_audience: 'Eco-conscious women 25–45, affluent suburbs', entry_difficulty: 'Easy',
    au_seasonal_relevance: 'Autumn nesting season, gift-giving preparation',
    action: 'Source from verified sustainable suppliers, emphasize carbon footprint reduction in marketing.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '2', trend_name: 'AI-Powered Fitness Trackers', category: 'Wearables & Tech',
    signal_strength: 9, stage: 'peak',
    why_now: 'New Year fitness resolutions extend into Q1, with AI health analytics becoming mainstream. Australian tech adoption accelerates post-summer fitness motivation.',
    opportunity_window: 'March–June 2025', est_monthly_revenue_aud: 32000,
    sample_products: ['AI sleep tracking rings', 'Smart health monitoring bands', 'ECG-enabled fitness watches'],
    target_audience: 'Tech-savvy professionals 28–50, urban metro areas', entry_difficulty: 'Medium',
    au_seasonal_relevance: 'Autumn wellness focus, winter health preparation',
    action: 'Partner with fitness influencers, highlight health data privacy features for AU consumers.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '3', trend_name: 'Pet Wellness Supplements', category: 'Pet Care',
    signal_strength: 8, stage: 'rising',
    why_now: 'Australian pet ownership remains at record highs with owners investing heavily in pet health. Seasonal allergies and joint issues peak in autumn driving supplement demand.',
    opportunity_window: 'March–August 2025', est_monthly_revenue_aud: 24000,
    sample_products: ['CBD pet treats', 'Joint care supplements for dogs', 'Probiotic pet powders'],
    target_audience: 'Pet parents 30–55, middle to upper income', entry_difficulty: 'Medium',
    au_seasonal_relevance: 'Autumn pet health issues, preparation for winter',
    action: 'Obtain TGA compliance docs, use vet testimonials, focus on natural ingredients in copy.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '4', trend_name: 'Lab-Grown Diamond Jewellery', category: 'Jewellery & Accessories',
    signal_strength: 9, stage: 'rising',
    why_now: 'Younger Australians reject traditional diamonds for ethical reasons; lab-grown diamonds gaining mainstream acceptance. Q1 engagements and gift-giving seasons drive demand.',
    opportunity_window: 'March–June 2025', est_monthly_revenue_aud: 35000,
    sample_products: ['Lab-grown solitaire rings', 'Eco-friendly diamond earrings', 'Sustainable engagement ring sets'],
    target_audience: 'Millennials & Gen Z 22–40, ethical consumers, engaged couples', entry_difficulty: 'Medium',
    au_seasonal_relevance: 'Engagement season, ethical gifting trend',
    action: 'Obtain certification docs, emphasize sustainability angle, partner with wedding influencers.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '5', trend_name: 'Functional Mushroom Beverages', category: 'Food & Beverages',
    signal_strength: 8, stage: 'peak',
    why_now: 'Health-conscious Australians adopt adaptogenic beverages; coffee culture meets wellness. Winter months drive warm beverage consumption and immunity focus.',
    opportunity_window: 'March–June 2025', est_monthly_revenue_aud: 22000,
    sample_products: ['Reishi mushroom coffee blends', "Lion's mane hot chocolate mixes", 'Cordyceps energy drinks'],
    target_audience: 'Health-conscious professionals 25–50, wellness enthusiasts', entry_difficulty: 'Easy',
    au_seasonal_relevance: 'Winter wellness, warm beverage season, immunity focus',
    action: 'Source premium organic suppliers, create recipe content, target health blogs and podcasts.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '6', trend_name: 'Portable Cold Plunge Devices', category: 'Health & Fitness',
    signal_strength: 7, stage: 'emerging',
    why_now: 'Celebrity wellness trends influence affluent Australians; cold therapy becoming mainstream. Winter season aligns with athlete recovery and wellness focus.',
    opportunity_window: 'March–August 2025', est_monthly_revenue_aud: 26000,
    sample_products: ['Portable ice bath tubs', 'Cold plunge inflatable tanks', 'Cryotherapy wearables'],
    target_audience: 'Affluent health enthusiasts 30–55, athletes, executives', entry_difficulty: 'Medium',
    au_seasonal_relevance: 'Winter recovery season, athlete off-season training',
    action: 'Partner with fitness influencers and athletes, provide installation guides, emphasise health benefits.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '7', trend_name: 'Minimalist Capsule Wardrobe', category: 'Fashion & Apparel',
    signal_strength: 8, stage: 'rising',
    why_now: 'Marie Kondo effect continues; Australians embrace minimalism post-summer decluttering. Autumn wardrobe transition naturally drives capsule basics purchases.',
    opportunity_window: 'March–May 2025', est_monthly_revenue_aud: 23000,
    sample_products: ['High-quality white basic tees', 'Neutral linen button-ups', 'Versatile neutral cardigans'],
    target_audience: 'Minimalist professionals 25–50, mid to high income', entry_difficulty: 'Easy',
    au_seasonal_relevance: 'Autumn wardrobe refresh, minimalism trend',
    action: 'Highlight quality and durability, bundle sets for capsule building, use Instagram Reels.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '8', trend_name: 'Smart Garden Irrigation', category: 'Smart Home & Garden',
    signal_strength: 7, stage: 'emerging',
    why_now: 'Australian property owners invest in drought-resistant gardening. Autumn planting season combined with water restrictions makes smart irrigation popular.',
    opportunity_window: 'March–June 2025', est_monthly_revenue_aud: 19500,
    sample_products: ['WiFi-enabled soil moisture sensors', 'Smart sprinkler controllers', 'Weather-responsive garden systems'],
    target_audience: 'Homeowners 35–60, suburban and rural areas', entry_difficulty: 'Hard',
    au_seasonal_relevance: 'Autumn planting, water conservation, drought management',
    action: 'Partner with local landscapers, emphasize water savings, offer setup guides and installation service.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '9', trend_name: 'Nootropics & Brain Health', category: 'Health & Wellness',
    signal_strength: 7, stage: 'rising',
    why_now: 'Post-COVID workplace stress and focus issues drive demand for brain health products. Australian professionals seek productivity solutions as Q2 workplace demands increase.',
    opportunity_window: 'March–September 2025', est_monthly_revenue_aud: 21000,
    sample_products: ['Natural nootropic capsules', "Lion's mane mushroom extracts", 'Adaptogen stress relief blends'],
    target_audience: 'Professionals 25–45, high-income earners, corporate sector', entry_difficulty: 'Hard',
    au_seasonal_relevance: 'Autumn productivity push, stress management season',
    action: 'Ensure TGA compliance, invest in testimonials and clinical backing, target LinkedIn and professional networks.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '10', trend_name: 'Vintage & Thrifted Fashion', category: 'Fashion & Apparel',
    signal_strength: 9, stage: 'peak',
    why_now: 'Gen Z and millennial consumers shift toward sustainable fashion; Australian resale platforms gaining momentum. Autumn wardrobe refresh drives pre-owned fashion shopping.',
    opportunity_window: 'March–May 2025', est_monthly_revenue_aud: 28000,
    sample_products: ['90s vintage band tees', 'Designer pre-owned handbags', 'Retro denim jackets'],
    target_audience: 'Gen Z & millennials 18–35, sustainability-focused', entry_difficulty: 'Easy',
    au_seasonal_relevance: 'Autumn fashion transition, budget-conscious shopping',
    action: 'Source from local op-shops and Depop, authenticate designer items, leverage TikTok and Instagram.',
    detected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

// ── Seasonal Calendar data ────────────────────────────────────────────────────

const AU_SEASONS = [
  { month: 'Apr', label: 'April', events: ['Easter gifting', 'School holidays', 'Cooler weather', 'Autumn fashion'] },
  { month: 'May', label: 'May–Jun', events: ["Mother's Day AU", 'Autumn/winter products', 'Comfort home goods'] },
  { month: 'Jul', label: 'July', events: ['Mid-year sales', 'Winter wellness', 'Hot drinks & warming products'] },
  { month: 'Aug', label: 'August', events: ["Father's Day AU (1st Sun)", 'Spring prep', 'Outdoor gear'] },
  { month: 'Sep', label: 'September', events: ['Spring racing carnival', 'Outdoor living', 'BBQ season begins'] },
  { month: 'Oct', label: 'October', events: ['Spring BBQ', 'Halloween (growing in AU)', 'Summer prep'] },
  { month: 'Nov', label: 'November', events: ['Black Friday (AU adopting)', 'Christmas prep', 'Summer fashion'] },
  { month: 'Dec', label: 'December', events: ['Christmas gifting', 'Boxing Day sales', 'Summer essentials'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAGE_CONFIG = {
  emerging: { label: '🌱 Emerging', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  rising:   { label: '📈 Rising',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  peak:     { label: '🔥 Peak',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  declining:{ label: '📉 Declining',color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const DIFFICULTY_CONFIG = {
  Easy:   { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  Hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

function formatRevenue(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k/mo`;
  return `$${n}/mo`;
}

// ── Trend Card ────────────────────────────────────────────────────────────────

function TrendCard({ trend }: { trend: TrendSignal }) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();

  const stage = STAGE_CONFIG[trend.stage] ?? STAGE_CONFIG.emerging;
  const diff = DIFFICULTY_CONFIG[trend.entry_difficulty] ?? DIFFICULTY_CONFIG.Medium;
  const signalPct = (trend.signal_strength / 10) * 100;

  return (
    <div
      style={{
        background: '#10131a',
        border: '1px solid rgba(212,175,55,0.12)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)')}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#f0ede8', margin: 0, lineHeight: 1.3 }}>
            {trend.trend_name}
          </h3>
          <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)', marginTop: 4, display: 'block' }}>
            {trend.category}
          </span>
        </div>
        <div style={{
          padding: '3px 8px',
          borderRadius: 20,
          background: stage.bg,
          color: stage.color,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {stage.label}
        </div>
      </div>

      {/* Signal strength bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)' }}>Signal Strength</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#d4af37' }}>{trend.signal_strength}/10</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${signalPct}%`, height: '100%', background: '#d4af37', borderRadius: 3 }} />
        </div>
      </div>

      {/* Why Now */}
      <p style={{
        fontSize: 12,
        color: 'rgba(240,237,232,0.65)',
        margin: 0,
        lineHeight: 1.6,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 2,
        WebkitBoxOrient: 'vertical',
      } as any}>
        {trend.why_now}
      </p>

      {/* Revenue + Opportunity + Difficulty row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{
          padding: '4px 10px',
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#d4af37',
        }}>
          {formatRevenue(trend.est_monthly_revenue_aud)}
        </div>
        <div style={{
          padding: '4px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          fontSize: 11,
          color: 'rgba(240,237,232,0.5)',
        }}>
          {trend.opportunity_window}
        </div>
        <div style={{
          padding: '4px 10px',
          background: diff.bg,
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          color: diff.color,
        }}>
          {trend.entry_difficulty}
        </div>
      </div>

      {/* Sample Products */}
      {trend.sample_products && trend.sample_products.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {trend.sample_products.slice(0, 3).map((p, i) => (
            <span key={i} style={{
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              fontSize: 10,
              color: 'rgba(240,237,232,0.5)',
            }}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Expand / Collapse */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {/* Target Audience */}
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Target Audience</div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.7)' }}>{trend.target_audience}</div>
          </div>

          {/* Seasonal Relevance */}
          {trend.au_seasonal_relevance && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>AU Seasonal Relevance</div>
              <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.7)' }}>{trend.au_seasonal_relevance}</div>
            </div>
          )}

          {/* Action */}
          <div style={{
            padding: 14,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>What To Do Now</div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.85)', lineHeight: 1.6 }}>{trend.action}</div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/app/winning-products?q=${encodeURIComponent(trend.trend_name)}`)}
              style={{
                padding: '7px 14px',
                background: 'rgba(212,175,55,0.15)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 8,
                color: '#d4af37',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              Find Products <ArrowRight size={12} />
            </button>
            <button
              onClick={() => navigate(`/app/supplier-finder?q=${encodeURIComponent(trend.sample_products?.[0] ?? trend.trend_name)}`)}
              style={{
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(240,237,232,0.7)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              Find Suppliers <ExternalLink size={12} />
            </button>
            <button
              onClick={() => navigate(`/app/website-generator?niche=${encodeURIComponent(trend.category)}`)}
              style={{
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(240,237,232,0.7)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              Build Store <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: 'rgba(240,237,232,0.5)',
          fontSize: 12,
          cursor: 'pointer',
          padding: '6px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        {expanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Show full details</>}
      </button>
    </div>
  );
}

// ── Trend Alert Teaser ────────────────────────────────────────────────────────

function TrendAlertTeaser({ isPro }: { isPro: boolean }) {
  const [alertsActive, setAlertsActive] = useState(true);

  if (isPro) {
    return (
      <div style={{
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#22c55e', marginBottom: 2 }}>Alerts active</div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.5)' }}>You'll be notified the moment a trend explodes</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.5)' }}>Notifications</span>
          <button
            onClick={() => setAlertsActive((p) => !p)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: alertsActive ? '#22c55e' : 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 3,
              left: alertsActive ? 23 : 3,
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#10131a',
      border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: 14,
      padding: '24px 20px',
      marginBottom: 28,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="#d4af37" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#f0ede8' }}>TREND ALERT SYSTEM</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, padding: '3px 10px', fontFamily: 'Syne, sans-serif' }}>🔒 PRO</span>
      </div>

      <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.65)', lineHeight: 1.6, marginBottom: 16 }}>
        Get notified the <strong style={{ color: '#f0ede8' }}>MOMENT a product starts exploding</strong> — before your competitors know.
      </p>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', marginBottom: 4 }}>Last alert sent: 2 hours ago</div>
        <div style={{ fontSize: 13, color: '#f0ede8', fontStyle: 'italic' }}>"Heatless Curl Rods just jumped $8k → $18k/day"</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)' }}>Alert channels:</span>
        {['Push notification', 'Email', 'SMS'].map((ch) => (
          <span key={ch} style={{ fontSize: 11, color: '#d4af37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, padding: '2px 8px' }}>{ch}</span>
        ))}
      </div>

      <a
        href="/pricing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #d4af37, #b8941f)',
          color: '#000',
          borderRadius: 10,
          padding: '10px 22px',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        <Zap size={13} />
        Unlock Trend Alerts → Upgrade to Pro
      </a>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type StageFilter = 'all' | 'emerging' | 'rising' | 'peak' | 'declining';

export default function TrendSignals() {
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StageFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const currentMonth = new Date().getMonth() + 1; // 1-12

  const fetchTrends = async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('trend_signals')
        .select('*')
        .order('signal_strength', { ascending: false });

      if (sbError || !data || data.length === 0) {
        // Fall back to hardcoded data
        setTrends(FALLBACK_TRENDS);
        setUsingFallback(true);
      } else {
        setTrends(data as TrendSignal[]);
        setUsingFallback(false);
      }
    } catch {
      setTrends(FALLBACK_TRENDS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, []);

  const handleRefresh = async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) { setError('Sign in to refresh trends'); return; }

    setRefreshing(true);
    try {
      const res = await fetch('/api/trends/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Wait a moment then re-fetch
        setTimeout(() => { fetchTrends(); setRefreshing(false); }, 3000);
      } else {
        setError(data.error ?? 'Refresh failed');
        setRefreshing(false);
      }
    } catch (e: any) {
      setError(e.message);
      setRefreshing(false);
    }
  };

  const filtered = filter === 'all' ? trends : trends.filter((t) => t.stage === filter);

  // Stats
  const emergingCount = trends.filter((t) => t.stage === 'emerging').length;
  const avgRevenue = trends.length
    ? Math.round(trends.reduce((s, t) => s + (t.est_monthly_revenue_aud || 0), 0) / trends.length)
    : 0;
  const lastUpdated = trends.length
    ? new Date(trends[0]?.updated_at ?? trends[0]?.detected_at).toLocaleString('en-AU', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a0e' }}>
        <div style={{ textAlign: 'center' }}>
          <TrendingUp size={32} color="#d4af37" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: 14 }}>Scanning AU trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: '#080a0e', color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Usage Counter */}
        <UsageCounter />
        <UpgradePromptBanner />

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <TrendingUp size={24} color="#d4af37" />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, margin: 0, color: '#f0ede8' }}>
                  Trend Signals
                </h1>
                <span style={{
                  padding: '2px 8px',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#d4af37',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  Live
                </span>
              </div>
              <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: 14, margin: 0 }}>
                Emerging AU trends before they peak — 6h auto-refresh
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '9px 18px',
                background: refreshing ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.15)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 10,
                color: '#d4af37',
                fontSize: 13,
                fontWeight: 600,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              {refreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* Fallback notice */}
        {usingFallback && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            fontSize: 12,
            color: 'rgba(245,158,11,0.8)',
          }}>
            <Zap size={14} />
            Showing curated trends — live AI detection activates automatically after first deploy. Refresh to trigger.
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            fontSize: 12,
            color: 'rgba(239,68,68,0.8)',
          }}>
            <AlertCircle size={14} />
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Trends Tracked', value: trends.length },
            { label: 'Emerging Now', value: emergingCount },
            { label: 'Avg Opportunity', value: formatRevenue(avgRevenue) },
            { label: 'Last Updated', value: lastUpdated },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: '#10131a',
              border: '1px solid rgba(212,175,55,0.1)',
              borderRadius: 12,
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#d4af37' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Trend Alert Teaser */}
        <TrendAlertTeaser isPro={false} />

        {/* Stage filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {(['all', 'emerging', 'rising', 'peak', 'declining'] as StageFilter[]).map((stage) => {
            const active = filter === stage;
            const config = stage === 'all' ? null : STAGE_CONFIG[stage];
            const count = stage === 'all' ? trends.length : trends.filter((t) => t.stage === stage).length;
            return (
              <button
                key={stage}
                onClick={() => setFilter(stage)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: active
                    ? `1px solid ${config?.color ?? '#d4af37'}`
                    : '1px solid rgba(255,255,255,0.08)',
                  background: active
                    ? (config?.bg ?? 'rgba(212,175,55,0.15)')
                    : 'rgba(255,255,255,0.03)',
                  color: active ? (config?.color ?? '#d4af37') : 'rgba(240,237,232,0.55)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {stage === 'all' ? 'All' : config?.label}
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  fontSize: 10,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Trend cards grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <TrendingUp size={36} style={{ marginBottom: 12, opacity: 0.3, color: '#d4af37' }} />
            <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>Trend detection running...</p>
            <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: 13, marginBottom: 20 }}>Check back in a few minutes — trends update every 6 hours</p>
            <button onClick={() => window.location.reload()} style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              Refresh
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
            marginBottom: 48,
          }}>
            {filtered.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        )}

        {/* AU Seasonal Calendar */}
        <div style={{
          background: '#10131a',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 16,
          padding: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Calendar size={20} color="#d4af37" />
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, margin: 0, color: '#f0ede8' }}>
              AU Seasonal Opportunity Calendar
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 10, minWidth: 800, paddingBottom: 8 }}>
              {AU_SEASONS.map((season) => {
                // Determine which months to highlight
                const monthIndex = ['Apr','May','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(season.month);
                const seasonMonthNum = [4, 5, 7, 8, 9, 10, 11, 12][monthIndex];
                const isCurrent = currentMonth === seasonMonthNum || (season.month === 'May' && (currentMonth === 5 || currentMonth === 6));

                return (
                  <div
                    key={season.month}
                    style={{
                      flex: 1,
                      minWidth: 110,
                      background: isCurrent ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.025)',
                      border: isCurrent ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '12px 10px',
                    }}
                  >
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 13,
                      fontWeight: 700,
                      color: isCurrent ? '#d4af37' : 'rgba(240,237,232,0.7)',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      {season.label}
                      {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', display: 'inline-block' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {season.events.map((ev, i) => (
                        <div key={i} style={{
                          fontSize: 10,
                          color: 'rgba(240,237,232,0.55)',
                          padding: '3px 6px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 5,
                          lineHeight: 1.4,
                        }}>
                          {ev}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', margin: '16px 0 0', textAlign: 'center' }}>
            Plan your inventory 6–8 weeks ahead of each seasonal opportunity
          </p>
        </div>

      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
