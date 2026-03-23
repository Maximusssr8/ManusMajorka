/**
 * VideoIntelligence — /app/video-intelligence
 * KaloData-level table: Video | Revenue | Product | Items Sold | Rev Trend | Views | Est ROAS | Published
 * Standalone page with tab filters and platform badges.
 */

import { Helmet } from 'react-helmet-async';
import { Copy, Play, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import Sparkline from '@/components/Sparkline';

// ── Design tokens ────────────────────────────────────────────────────────────
const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Platform icons ───────────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    tiktok:    { label: 'TikTok', color: '#000000', bg: '#E8F8F5' },
    meta:      { label: 'Meta', color: '#1877F2', bg: '#EBF5FF' },
    instagram: { label: 'IG', color: '#E1306C', bg: '#FDE8F0' },
    youtube:   { label: 'YT', color: '#FF0000', bg: '#FEE2E2' },
  };
  const c = cfg[platform.toLowerCase()] || cfg.tiktok;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: c.color, background: c.bg, borderRadius: 4, padding: '2px 6px', letterSpacing: '0.03em' }}>
      {c.label}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface VideoRow {
  id: string;
  video_title: string;
  creator_username: string;
  product_name: string;
  product_image?: string;
  platform: string;
  views: number;
  likes: number;
  gmv_driven_aud: number;
  items_sold: number;
  est_roas: number;
  rev_trend: number[];
  hook_type: string | null;
  category: string | null;
  published_at: string;
}

type TabKey = 'all' | 'high_roas' | 'high_organic' | 'low_follower';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAUD(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function generateRevTrend(seed: number, base: number): number[] {
  let val = base * 0.6;
  const pts: number[] = [];
  for (let i = 0; i < 7; i++) {
    const noise = ((seed * (i + 1) * 7919) % 200 - 100) / 800;
    val = Math.max(100, val * 1.08 * (1 + noise));
    pts.push(Math.round(val));
  }
  pts.push(base);
  return pts;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_VIDEOS: VideoRow[] = [
  { id: 'v1', video_title: 'Stop looking washed out on video calls — this $39 fix changed everything', creator_username: 'zoeaubeauty', product_name: 'LED Ring Light', product_image: 'https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 2400000, likes: 180000, gmv_driven_aud: 127680, items_sold: 1840, est_roas: 4.2, rev_trend: generateRevTrend(1, 127680), hook_type: 'Problem/Solution', category: 'Tech', published_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'v2', video_title: '3 weeks of WFH destroyed my posture — here\'s what fixed it', creator_username: 'healthhackau', product_name: 'Posture Corrector', product_image: 'https://images.pexels.com/photos/4498481/pexels-photo-4498481.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 1890000, likes: 145000, gmv_driven_aud: 89200, items_sold: 2230, est_roas: 3.8, rev_trend: generateRevTrend(2, 89200), hook_type: 'Problem/Solution', category: 'Health', published_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'v3', video_title: 'I ASMR\'d my stress away with this $45 gadget', creator_username: 'glowwithgrace_au', product_name: 'Electric Scalp Massager', product_image: 'https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'instagram', views: 3200000, likes: 290000, gmv_driven_aud: 205000, items_sold: 4100, est_roas: 6.1, rev_trend: generateRevTrend(3, 205000), hook_type: 'Demo', category: 'Beauty', published_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'v4', video_title: '5 exercises to transform your glutes at home — no gym needed', creator_username: 'fitnesswithkyle_au', product_name: 'Resistance Bands Set', product_image: 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 890000, likes: 52000, gmv_driven_aud: 48020, items_sold: 980, est_roas: 2.4, rev_trend: generateRevTrend(4, 48020), hook_type: 'Demo', category: 'Fitness', published_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'v5', video_title: 'Unboxing the charging pad that cleared all the cables off my desk', creator_username: 'techdealsau', product_name: 'Wireless Charging Pad', product_image: 'https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'meta', views: 1560000, likes: 98000, gmv_driven_aud: 143500, items_sold: 2870, est_roas: 5.3, rev_trend: generateRevTrend(5, 143500), hook_type: 'Unboxing', category: 'Tech', published_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'v6', video_title: 'My new morning ritual that actually makes me want to wake up', creator_username: 'cookingwithmateo', product_name: 'Matcha Whisk Set', product_image: 'https://images.pexels.com/photos/5946630/pexels-photo-5946630.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 2100000, likes: 175000, gmv_driven_aud: 96000, items_sold: 3200, est_roas: 3.5, rev_trend: generateRevTrend(6, 96000), hook_type: 'POV', category: 'Beverages', published_at: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'v7', video_title: 'My dog lost his mind when I gave him this $28 puzzle toy', creator_username: 'petsofoz', product_name: 'Dog Puzzle Feeder', product_image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 4500000, likes: 420000, gmv_driven_aud: 224000, items_sold: 5600, est_roas: 7.8, rev_trend: generateRevTrend(7, 224000), hook_type: 'Testimonial', category: 'Pets', published_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'v8', video_title: 'The ancient face sculpting technique — dermatologist approved', creator_username: 'zoeaubeauty', product_name: 'Gua Sha Tool', product_image: 'https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'instagram', views: 1200000, likes: 88000, gmv_driven_aud: 95000, items_sold: 1900, est_roas: 4.6, rev_trend: generateRevTrend(8, 95000), hook_type: 'Demo', category: 'Beauty', published_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'v9', video_title: 'I found what stops my air fryer from staining — game changer', creator_username: 'cookingwithmateo', product_name: 'Air Fryer Silicone Liners', product_image: 'https://images.pexels.com/photos/6996084/pexels-photo-6996084.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'meta', views: 780000, likes: 41000, gmv_driven_aud: 52800, items_sold: 2400, est_roas: 2.1, rev_trend: generateRevTrend(9, 52800), hook_type: 'Problem/Solution', category: 'Kitchen', published_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'v10', video_title: 'Took this on a 5-day hike and it charged my phone 8 times', creator_username: 'outdooradventuresoz', product_name: 'Solar Power Bank', product_image: 'https://images.pexels.com/photos/5474296/pexels-photo-5474296.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 640000, likes: 35000, gmv_driven_aud: 71200, items_sold: 890, est_roas: 3.2, rev_trend: generateRevTrend(10, 71200), hook_type: 'Testimonial', category: 'Outdoor', published_at: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'v11', video_title: 'My pantry went from chaos to Pinterest-worthy in 20 minutes', creator_username: 'homewithsophie', product_name: 'Bamboo Storage Baskets', product_image: 'https://images.pexels.com/photos/6069544/pexels-photo-6069544.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'instagram', views: 920000, likes: 56000, gmv_driven_aud: 44000, items_sold: 1100, est_roas: 2.8, rev_trend: generateRevTrend(11, 44000), hook_type: 'POV', category: 'Home', published_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'v12', video_title: 'Week of baby food in 30 minutes — mums this is for you', creator_username: 'mumlifemelbourne', product_name: 'Baby Food Maker', product_image: 'https://images.pexels.com/photos/3662850/pexels-photo-3662850.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'meta', views: 1080000, likes: 82000, gmv_driven_aud: 53200, items_sold: 760, est_roas: 3.9, rev_trend: generateRevTrend(12, 53200), hook_type: 'Testimonial', category: 'Baby', published_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'v13', video_title: 'This $22 serum replaced my entire skincare routine', creator_username: 'skincarewithemma', product_name: 'Vitamin C Serum', product_image: 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 5200000, likes: 380000, gmv_driven_aud: 312000, items_sold: 7800, est_roas: 8.4, rev_trend: generateRevTrend(13, 312000), hook_type: 'POV', category: 'Beauty', published_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'v14', video_title: 'The $35 car mount every Uber driver needs — changed my commute', creator_username: 'drivewithdan', product_name: 'Magnetic Car Mount', product_image: 'https://images.pexels.com/photos/13861/IMG_3496a.jpg?auto=compress&cs=tinysrgb&w=60', platform: 'tiktok', views: 720000, likes: 38000, gmv_driven_aud: 41500, items_sold: 1186, est_roas: 1.9, rev_trend: generateRevTrend(14, 41500), hook_type: 'Demo', category: 'Auto', published_at: new Date(Date.now() - 9 * 86400000).toISOString() },
  { id: 'v15', video_title: 'Planted this 3 weeks ago — look at my balcony now', creator_username: 'urbangreenau', product_name: 'Self-Watering Planter Kit', product_image: 'https://images.pexels.com/photos/4505166/pexels-photo-4505166.jpeg?auto=compress&cs=tinysrgb&w=60', platform: 'instagram', views: 1340000, likes: 102000, gmv_driven_aud: 78600, items_sold: 1572, est_roas: 4.1, rev_trend: generateRevTrend(15, 78600), hook_type: 'POV', category: 'Garden', published_at: new Date(Date.now() - 5 * 86400000).toISOString() },
];

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Videos' },
  { key: 'high_roas', label: 'High ROAS' },
  { key: 'high_organic', label: 'High Organic' },
  { key: 'low_follower', label: 'Low-Follower Sales' },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function VideoIntelligence() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');
  const [, nav] = useLocation();

  useEffect(() => { void fetchVideos(); }, []);

  async function fetchVideos() {
    try {
      const { data } = await supabase.from('trending_videos').select('*').order('gmv_driven_aud', { ascending: false });
      if (data && data.length > 0) {
        setVideos(data.map((d: any) => ({
          id: d.id,
          video_title: d.video_title || 'Untitled',
          creator_username: d.creator_username || 'unknown',
          product_name: d.product_name || 'Product',
          product_image: d.thumbnail_url,
          platform: d.platform || 'tiktok',
          views: d.views || 0,
          likes: d.likes || 0,
          gmv_driven_aud: d.gmv_driven_aud || 0,
          items_sold: d.items_sold_from_video || 0,
          est_roas: d.est_roas || ((d.gmv_driven_aud || 0) / Math.max(1, (d.views || 1) * 0.005)),
          rev_trend: generateRevTrend(Number(d.id?.replace(/\D/g, '') || 1), d.gmv_driven_aud || 1000),
          hook_type: d.hook_type,
          category: d.category,
          published_at: d.published_at || new Date().toISOString(),
        })));
      } else {
        setVideos(SEED_VIDEOS);
      }
    } catch {
      setVideos(SEED_VIDEOS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...videos];
    switch (tab) {
      case 'high_roas': list = list.filter(v => v.est_roas >= 4.0).sort((a, b) => b.est_roas - a.est_roas); break;
      case 'high_organic': list = list.filter(v => v.views >= 1_000_000).sort((a, b) => b.views - a.views); break;
      case 'low_follower': list = list.filter(v => v.items_sold >= 1000 && v.views < 1_500_000).sort((a, b) => b.items_sold - a.items_sold); break;
      default: list.sort((a, b) => b.gmv_driven_aud - a.gmv_driven_aud);
    }
    return list;
  }, [videos, tab]);

  const thStyle = (width: number, align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties => ({
    width, minWidth: width, padding: '0 12px', fontSize: 11, fontWeight: 700,
    color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    textAlign: align, userSelect: 'none' as const, whiteSpace: 'nowrap' as const,
    borderBottom: '2px solid #F3F4F6', paddingBottom: 10,
  });

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <Helmet><title>Video Intelligence | Majorka</title></Helmet>

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 24px 0', maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A', margin: 0 }}>
          Video Intelligence
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20, fontFamily: dm }}>
          Top-performing AU product videos — what hooks, converts, and drives real revenue
        </p>

        {/* ── TAB FILTERS ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F3F4F6', marginBottom: 16, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                height: 42, padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? '#6366F1' : '#9CA3AF',
                borderBottom: tab === t.key ? '3px solid #6366F1' : '3px solid transparent',
                whiteSpace: 'nowrap' as const, transition: 'all 150ms', marginBottom: -2, minWidth: 120,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 40px', overflowX: 'auto' }}>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1000 }}>
            <colgroup>
              <col style={{ width: 340 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'rgba(250,250,250,0.98)', height: 42, position: 'sticky' as const, top: 0, zIndex: 10 }}>
                <th style={thStyle(340)}>Video</th>
                <th style={thStyle(110, 'right')}>Revenue</th>
                <th style={thStyle(80, 'center')}>Product</th>
                <th style={thStyle(90, 'right')}>Items Sold</th>
                <th style={thStyle(130, 'center')}>Rev Trend</th>
                <th style={thStyle(90, 'right')}>Views</th>
                <th style={thStyle(80, 'center')}>Est ROAS</th>
                <th style={thStyle(80, 'right')}>Published</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ height: 68, borderBottom: '1px solid #F3F4F6' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '0 12px' }}>
                        <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: `${50 + (i * j * 11) % 40}%`, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center' as const }}>
                    <Play size={32} style={{ color: '#D1D5DB', marginBottom: 8 }} />
                    <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 16, color: '#0A0A0A', marginBottom: 4 }}>No videos match this filter</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>Try "All Videos" to see everything</div>
                  </td>
                </tr>
              ) : (
                filtered.map((v, idx) => {
                  const roasColor = v.est_roas >= 5 ? '#059669' : v.est_roas >= 3 ? '#D97706' : '#6B7280';
                  const roasBg = v.est_roas >= 5 ? '#ECFDF5' : v.est_roas >= 3 ? '#FEF3C7' : '#F5F5F5';
                  const trendPositive = v.rev_trend.length >= 2 && v.rev_trend[v.rev_trend.length - 1] >= v.rev_trend[0];

                  return (
                    <tr key={v.id}
                      style={{
                        height: 68, borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                        transition: 'background 120ms',
                        animation: `fadeInRow 0.3s ease ${idx * 0.03}s both`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                    >
                      {/* Video */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' as const }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#F3F4F6', position: 'relative' as const }}>
                            {v.product_image ? (
                              <img src={v.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play size={14} style={{ color: '#9CA3AF' }} />
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0A0A0A', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                              {v.video_title}
                            </div>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: '#6B7280' }}>@{v.creator_username}</span>
                              <PlatformBadge platform={v.platform} />
                              {v.hook_type && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', borderRadius: 4, padding: '1px 5px' }}>
                                  {v.hook_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: '0 12px', textAlign: 'right' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: v.gmv_driven_aud >= 100000 ? '#059669' : '#0A0A0A' }}>
                          {fmtAUD(v.gmv_driven_aud)}
                        </div>
                      </td>

                      {/* Product thumb */}
                      <td style={{ padding: '0 12px', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', border: '1px solid #F3F4F6', margin: '0 auto', background: '#F9FAFB' }}>
                          {v.product_image ? (
                            <img src={v.product_image} alt={v.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=60'; }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9CA3AF' }}>—</div>
                          )}
                        </div>
                        <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 70, margin: '2px auto 0' }}>{v.product_name}</div>
                      </td>

                      {/* Items Sold */}
                      <td style={{ padding: '0 12px', textAlign: 'right' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>
                          {v.items_sold >= 1000 ? `${(v.items_sold / 1000).toFixed(1)}k` : v.items_sold.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>units</div>
                      </td>

                      {/* Rev Trend sparkline */}
                      <td style={{ padding: '0 12px', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Sparkline data={v.rev_trend} width={110} height={28} color={trendPositive ? '#10B981' : '#EF4444'} />
                        </div>
                      </td>

                      {/* Views */}
                      <td style={{ padding: '0 12px', textAlign: 'right' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>{fmtViews(v.views)}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>views</div>
                      </td>

                      {/* Est ROAS */}
                      <td style={{ padding: '0 12px', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', borderRadius: 12, background: roasBg, fontFamily: brico, fontWeight: 800, fontSize: 13, color: roasColor }}>
                          {v.est_roas.toFixed(1)}x
                        </div>
                      </td>

                      {/* Published */}
                      <td style={{ padding: '0 12px', textAlign: 'right' as const, verticalAlign: 'middle' as const }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{timeAgo(v.published_at)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>{filtered.length} of {videos.length} videos shown</p>
      </div>

      <style>{`
        @keyframes fadeInRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { opacity:0.6; } 50% { opacity:1; } 100% { opacity:0.6; } }
      `}</style>
    </div>
  );
}
