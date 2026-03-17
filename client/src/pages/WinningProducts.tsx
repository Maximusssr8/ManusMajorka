/**
 * WinningProducts.tsx — V2. Revenue-first. Flat top-5 ranking. Supabase watchlist.
 * No framer-motion, no SVG gauges, no localStorage, no CountUp.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import {
  BarChart2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Crown,
  ExternalLink,
  Filter,
  Flame,
  Grid3X3,
  Heart,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  Store,
  Table2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import ProductCompareModal from '@/components/ProductCompareModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/_core/hooks/useAuth';
import { markOnboardingStep } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';
import UsageCounter from '@/components/UsageCounter';
import UpgradePromptBanner from '@/components/UpgradePromptBanner';

// ── Types ────────────────────────────────────────────────────────────────────

type Trend = 'exploding' | 'growing' | 'stable' | 'declining';
type Competition = 'low' | 'medium' | 'high';

interface WinningProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  tiktok_product_url: string | null;
  shop_name?: string | null;
  category: string | null;
  platform: string;
  price_aud: number | null;
  sold_count: number | null;
  rating?: number | null;
  review_count?: number | null;
  winning_score: number;
  trend: Trend | null;
  competition_level: Competition | null;
  au_relevance: number;
  est_daily_revenue_aud: number | null;
  units_per_day: number | null;
  why_winning: string | null;
  ad_angle: string | null;
  source?: string | null;
  scraped_at: string;
  scored_at?: string | null;
  created_at?: string;
  updated_at: string;
  est_monthly_revenue_aud?: number | null;
  revenue_growth_pct?: number | null;
  platforms?: string[] | null;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#080a0e',
  card: 'rgba(255,255,255,0.03)',
  cardHover: 'rgba(255,255,255,0.06)',
  gold: '#d4af37',
  goldHover: '#e5c24a',
  goldBg: 'rgba(212,175,55,0.08)',
  goldBorder: 'rgba(212,175,55,0.2)',
  text: '#f5f5f5',
  sub: '#a1a1aa',
  muted: '#52525b',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.15)',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.1)',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
} as const;

// ── Constants ─────────────────────────────────────────────────────────────────

const TREND_MAP: Record<Trend, { emoji: string; label: string; color: string }> = {
  exploding: { emoji: '🔥', label: 'Exploding', color: '#ef4444' },
  growing:   { emoji: '📈', label: 'Growing',   color: '#22c55e' },
  stable:    { emoji: '➡️', label: 'Stable',    color: '#a1a1aa' },
  declining: { emoji: '📉', label: 'Declining', color: '#f59e0b' },
};

const COMPETITION_MAP: Record<Competition, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#22c55e' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high:   { label: 'High',   color: '#ef4444' },
};

const PAGE_SIZE = 20;

// ── Seeded fallback products ──────────────────────────────────────────────────

const SEEDED_PRODUCTS: WinningProduct[] = [
  { id: 's1', product_title: 'LED Therapy Face Mask', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 89, sold_count: 3240, winning_score: 94, trend: 'exploding', competition_level: 'low', au_relevance: 92, est_daily_revenue_aud: 2800, units_per_day: 31, why_winning: 'Viral TikTok skincare trend — AU women 25–44 spending big on at-home spa tech.', ad_angle: 'Ditch the dermatologist waitlist. Get clinic-grade skin in 10 minutes from your couch.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's2', product_title: 'Posture Corrector Pro', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 49, sold_count: 5100, winning_score: 88, trend: 'exploding', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 1960, units_per_day: 40, why_winning: 'WFH culture driving neck/back pain in AU. Solves real problem with instant relief angle.', ad_angle: '8 hours at a desk destroyed my posture. This fixed it in 2 weeks.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's3', product_title: 'Portable Neck Fan', category: 'Tech', platform: 'TikTok Shop', price_aud: 39, sold_count: 7800, winning_score: 85, trend: 'growing', competition_level: 'medium', au_relevance: 96, est_daily_revenue_aud: 1560, units_per_day: 40, why_winning: 'Summers getting hotter in AU. Seasonal product with strong repeat buyer potential.', ad_angle: 'Queensland summer hits different when you stop sweating through your work shirt.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's4', product_title: 'Pet Self-Cleaning Slicker Brush', category: 'Pet', platform: 'TikTok Shop', price_aud: 34, sold_count: 9200, winning_score: 82, trend: 'growing', competition_level: 'low', au_relevance: 90, est_daily_revenue_aud: 1190, units_per_day: 35, why_winning: 'AU has one of the highest pet ownership rates. Solves universal pain: dog hair everywhere.', ad_angle: 'My golden retriever was destroying my furniture. This self-cleaning brush changed everything.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's5', product_title: 'Resistance Bands Set (11pc)', category: 'Fitness', platform: 'TikTok Shop', price_aud: 45, sold_count: 6700, winning_score: 79, trend: 'growing', competition_level: 'medium', au_relevance: 85, est_daily_revenue_aud: 1350, units_per_day: 30, why_winning: 'Home gym trend still strong. Low ticket, high volume. Gym minimalists love this.', ad_angle: 'Cancel your $60/month gym membership. This $45 kit does everything you need.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's6', product_title: 'Fridge Organiser Bins Set', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 38, sold_count: 12100, winning_score: 76, trend: 'stable', competition_level: 'medium', au_relevance: 82, est_daily_revenue_aud: 1140, units_per_day: 30, why_winning: 'Evergreen product. Strong "satisfying clean fridge" video content potential.', ad_angle: 'Spent 15 mins organising my fridge. Saved $200 in food waste this month.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's7', product_title: 'UV Phone Sanitiser Box', category: 'Tech', platform: 'TikTok Shop', price_aud: 59, sold_count: 4300, winning_score: 74, trend: 'growing', competition_level: 'low', au_relevance: 87, est_daily_revenue_aud: 1180, units_per_day: 20, why_winning: 'Health-conscious AU market. Great gift product. Dual use as wireless charger.', ad_angle: 'Your phone has more bacteria than a toilet seat. This kills 99.9% in 5 minutes.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's8', product_title: 'Anti-Gravity Wall Planter', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 29, sold_count: 8900, winning_score: 71, trend: 'stable', competition_level: 'low', au_relevance: 80, est_daily_revenue_aud: 870, units_per_day: 30, why_winning: 'Plant parent culture massive in AU. Tiny apartments need space-saving solutions.', ad_angle: 'Turn your blank wall into a garden. Perfect for renters — no drilling needed.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's9', product_title: 'Compression Knee Brace (Pair)', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 44, sold_count: 5600, winning_score: 69, trend: 'stable', competition_level: 'medium', au_relevance: 83, est_daily_revenue_aud: 880, units_per_day: 20, why_winning: 'Ageing AU population. Runners and gym-goers. Strong pain-point angle.', ad_angle: 'Finished a half marathon with zero knee pain. Finally found something that actually works.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's10', product_title: 'Waterproof Dog Raincoat', category: 'Pet', platform: 'TikTok Shop', price_aud: 29, sold_count: 7200, winning_score: 67, trend: 'growing', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 870, units_per_day: 30, why_winning: 'Strong gifting category. Cute product = viral UGC. Low competition from AU retailers.', ad_angle: 'My dog refused to walk in rain. Now she sprints to the door when she sees her raincoat.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's11', product_title: 'Electric Scalp Massager', category: 'Health & Beauty', platform: 'TikTok Shop', price_aud: 39, sold_count: 4100, winning_score: 65, trend: 'growing', competition_level: 'low', au_relevance: 78, est_daily_revenue_aud: 780, units_per_day: 20, why_winning: 'Stress relief and hair growth niche growing fast. Strong before/after content angle.', ad_angle: 'Used this for 30 days. My hairdresser asked what changed. Stress-relief bonus too.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's12', product_title: 'Stainless Meal Prep Containers (5pk)', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 52, sold_count: 6300, winning_score: 63, trend: 'stable', competition_level: 'medium', au_relevance: 79, est_daily_revenue_aud: 624, units_per_day: 12, why_winning: 'Meal prep trend huge with AU health-conscious millennials. Eco angle plays well.', ad_angle: 'Ditch plastic. Meal prepped Sunday, ate healthy all week, saved $90 on takeaway.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's13', product_title: 'Portable Jump Rope Counter', category: 'Fitness', platform: 'TikTok Shop', price_aud: 24, sold_count: 9800, winning_score: 61, trend: 'growing', competition_level: 'low', au_relevance: 77, est_daily_revenue_aud: 720, units_per_day: 30, why_winning: 'Cardio at home. Low price point = impulse buy. Auto-counter solves real pain.', ad_angle: 'Track your jumps automatically. No math, no excuses, just burn.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's14', product_title: 'Blue Light Blocking Glasses', category: 'Tech', platform: 'TikTok Shop', price_aud: 34, sold_count: 11200, winning_score: 58, trend: 'stable', competition_level: 'high', au_relevance: 76, est_daily_revenue_aud: 680, units_per_day: 20, why_winning: 'Screen fatigue growing. Low cost gift item. But high competition — needs strong angle.', ad_angle: 'My headaches disappeared after 3 days. My boss thought I got better sleep. I did.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's15', product_title: 'Bamboo Charging Organiser Dock', category: 'Tech', platform: 'TikTok Shop', price_aud: 65, sold_count: 3800, winning_score: 56, trend: 'stable', competition_level: 'medium', au_relevance: 74, est_daily_revenue_aud: 650, units_per_day: 10, why_winning: 'Eco-conscious AU buyers. Desk setups content is huge. Great gift for Christmas.', ad_angle: 'Cleared my bedside table chaos with one purchase. Charges 4 devices overnight.', image_url: null, tiktok_product_url: null, scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Health & Wellness ──────────────────────────────────────────────────────
  { id: 'h1', product_title: 'Red Light Therapy Wand', category: 'Health & Wellness', platform: 'TikTok Shop', price_aud: 89, sold_count: 14200, winning_score: 88, trend: 'exploding', competition_level: 'low', au_relevance: 87, est_daily_revenue_aud: 3200, units_per_day: 36, why_winning: 'Dermatologist-endorsed trend going viral across AU beauty communities.', ad_angle: 'Get rid of fine lines in 10 minutes a day — no needles, no clinic.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 96000, revenue_growth_pct: 142, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h2', product_title: 'Magnesium Sleep Spray', category: 'Health & Wellness', platform: 'Shopify', price_aud: 34, sold_count: 9800, winning_score: 82, trend: 'exploding', competition_level: 'low', au_relevance: 91, est_daily_revenue_aud: 1800, units_per_day: 53, why_winning: 'Sleep anxiety epidemic in AU driving massive demand for natural sleep aids.', ad_angle: 'Spray it on. Sleep in 20 minutes. No pills, no groggy mornings.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 54000, revenue_growth_pct: 89, platforms: ['Shopify', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h3', product_title: 'Acupressure Mat & Pillow Set', category: 'Health & Wellness', platform: 'Amazon AU', price_aud: 49, sold_count: 11600, winning_score: 79, trend: 'growing', competition_level: 'medium', au_relevance: 85, est_daily_revenue_aud: 2100, units_per_day: 43, why_winning: 'Back pain is endemic in desk-worker AU culture and this solves it cheaply.', ad_angle: 'Lie on this for 20 minutes and watch years of back pain disappear.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 63000, revenue_growth_pct: 45, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h4', product_title: 'Cold Plunge Inflatable Tub', category: 'Health & Wellness', platform: 'Shopify', price_aud: 199, sold_count: 3400, winning_score: 85, trend: 'exploding', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 2800, units_per_day: 14, why_winning: 'Cold therapy trend exploded post-Huberman. High AOV, excellent margins.', ad_angle: 'The $500 cold plunge you can set up in your backyard for $199.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 84000, revenue_growth_pct: 210, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h5', product_title: 'Posture Corrector Brace', category: 'Health & Wellness', platform: 'TikTok Shop', price_aud: 39, sold_count: 18400, winning_score: 76, trend: 'growing', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 1600, units_per_day: 41, why_winning: 'Work-from-home culture created a generation of bad posture. Huge repeat purchase.', ad_angle: '8 hours at your desk ruining your posture. Fix it in 2 weeks.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 48000, revenue_growth_pct: 38, platforms: ['TikTok Shop', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h6', product_title: 'Jade Facial Roller Set', category: 'Health & Wellness', platform: 'TikTok Shop', price_aud: 27, sold_count: 22100, winning_score: 71, trend: 'stable', competition_level: 'medium', au_relevance: 84, est_daily_revenue_aud: 1200, units_per_day: 44, why_winning: 'Skincare ritual products have high gift potential and strong repeat purchase.', ad_angle: 'Your 5-minute morning ritual for glowing skin. Depuff in days.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 36000, revenue_growth_pct: 22, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h7', product_title: 'PEMF Therapy Mat', category: 'Health & Wellness', platform: 'Shopify', price_aud: 299, sold_count: 1800, winning_score: 83, trend: 'growing', competition_level: 'low', au_relevance: 80, est_daily_revenue_aud: 2900, units_per_day: 10, why_winning: 'Premium biohacking device with $200+ margins and no major AU competitor.', ad_angle: 'The recovery tool elite athletes use. Now available for everyone.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 87000, revenue_growth_pct: 67, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h8', product_title: 'EMF Protection Phone Case', category: 'Health & Wellness', platform: 'Shopify', price_aud: 54, sold_count: 7200, winning_score: 73, trend: 'growing', competition_level: 'low', au_relevance: 86, est_daily_revenue_aud: 1400, units_per_day: 26, why_winning: 'Health-conscious AU parents driving this niche; fear-based purchase = high conv.', ad_angle: 'Your phone radiates all day. This case blocks 99% of EMF. Peace of mind, $54.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 42000, revenue_growth_pct: 55, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h9', product_title: 'Resistance Band Set (11pc)', category: 'Health & Wellness', platform: 'Amazon AU', price_aud: 32, sold_count: 28600, winning_score: 68, trend: 'stable', competition_level: 'high', au_relevance: 93, est_daily_revenue_aud: 1100, units_per_day: 34, why_winning: 'Perennial bestseller; pivot to niche bundles (pilates, physio) reduces competition.', ad_angle: 'Full gym workout, zero equipment. 11 bands, infinite possibilities.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 33000, revenue_growth_pct: 12, platforms: ['Amazon AU', 'eBay AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'h10', product_title: 'Grounding Mat (Earthing)', category: 'Health & Wellness', platform: 'Shopify', price_aud: 79, sold_count: 4600, winning_score: 78, trend: 'exploding', competition_level: 'low', au_relevance: 82, est_daily_revenue_aud: 1900, units_per_day: 24, why_winning: 'Grounding trend from wellness influencers with almost zero AU direct competition.', ad_angle: 'Walk barefoot all day without leaving your desk. Sleep better tonight.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 57000, revenue_growth_pct: 178, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Beauty & Skincare ──────────────────────────────────────────────────────
  { id: 'b1', product_title: 'LED Teeth Whitening Kit', category: 'Beauty & Skincare', platform: 'TikTok Shop', price_aud: 49, sold_count: 31200, winning_score: 86, trend: 'exploding', competition_level: 'medium', au_relevance: 95, est_daily_revenue_aud: 3600, units_per_day: 73, why_winning: 'Massive vanity market in AU with zero health risk angle and strong UGC potential.', ad_angle: '14 shades whiter in 7 days. Dentist results at 1/50th of the cost.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 108000, revenue_growth_pct: 95, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b2', product_title: 'Gua Sha Facial Tool (Rose Quartz)', category: 'Beauty & Skincare', platform: 'TikTok Shop', price_aud: 22, sold_count: 44500, winning_score: 78, trend: 'stable', competition_level: 'high', au_relevance: 88, est_daily_revenue_aud: 1500, units_per_day: 68, why_winning: 'High gift purchase rate; bundle with oils for 3x AOV lift.', ad_angle: 'The ancient face lift that is absolutely everywhere right now.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 45000, revenue_growth_pct: 18, platforms: ['TikTok Shop', 'eBay AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b3', product_title: 'Hydrocolloid Patch Set (360pk)', category: 'Beauty & Skincare', platform: 'Amazon AU', price_aud: 19, sold_count: 56000, winning_score: 81, trend: 'growing', competition_level: 'medium', au_relevance: 96, est_daily_revenue_aud: 1800, units_per_day: 95, why_winning: 'TikTok acne community is massive in AU; low price = impulse buy, high repeat.', ad_angle: 'Pimples gone by morning. 360 patches, $19. The math is too good.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 54000, revenue_growth_pct: 62, platforms: ['Amazon AU', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b4', product_title: 'Ice Facial Roller (Stainless)', category: 'Beauty & Skincare', platform: 'TikTok Shop', price_aud: 28, sold_count: 19800, winning_score: 74, trend: 'growing', competition_level: 'low', au_relevance: 86, est_daily_revenue_aud: 1300, units_per_day: 46, why_winning: 'Cold skincare trend exploding; stainless steel positions as premium over plastic.', ad_angle: 'Your face will thank you for 60 seconds of this every morning.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 39000, revenue_growth_pct: 73, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b5', product_title: 'Nano Facial Mister', category: 'Beauty & Skincare', platform: 'Shopify', price_aud: 44, sold_count: 12300, winning_score: 76, trend: 'growing', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 1500, units_per_day: 34, why_winning: 'Hydration-focused skincare is the #1 trend in AU beauty. Satisfying to use on camera.', ad_angle: 'Rehydrate your skin in 30 seconds. Works over makeup.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 45000, revenue_growth_pct: 44, platforms: ['Shopify', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b6', product_title: 'Blackhead Vacuum Remover', category: 'Beauty & Skincare', platform: 'TikTok Shop', price_aud: 38, sold_count: 23700, winning_score: 79, trend: 'stable', competition_level: 'medium', au_relevance: 87, est_daily_revenue_aud: 1700, units_per_day: 45, why_winning: 'Satisfying "gross" content drives organic reach; before/after videos go viral.', ad_angle: 'Warning: You will not be able to stop watching your pores get cleaned.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 51000, revenue_growth_pct: 29, platforms: ['TikTok Shop', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b7', product_title: 'Professional Hair Scalp Massager', category: 'Beauty & Skincare', platform: 'Amazon AU', price_aud: 24, sold_count: 34100, winning_score: 72, trend: 'growing', competition_level: 'medium', au_relevance: 91, est_daily_revenue_aud: 1200, units_per_day: 50, why_winning: 'Hair loss anxiety + self-care trend = massive crossover audience.', ad_angle: 'Regrow your hair while you shower. 5 minutes, $24, life-changing results.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 36000, revenue_growth_pct: 41, platforms: ['Amazon AU', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b8', product_title: 'Collagen Eye Patches (60 pairs)', category: 'Beauty & Skincare', platform: 'Shopify', price_aud: 35, sold_count: 16400, winning_score: 75, trend: 'growing', competition_level: 'medium', au_relevance: 89, est_daily_revenue_aud: 1400, units_per_day: 40, why_winning: 'Under-eye care is the #1 skincare concern in AU women 30+; strong subscription potential.', ad_angle: 'Wear these while you sleep. Wake up looking 5 years younger.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 42000, revenue_growth_pct: 48, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Home & Kitchen ─────────────────────────────────────────────────────────
  { id: 'k1', product_title: 'Smart Herb Garden Kit', category: 'Home & Kitchen', platform: 'Shopify', price_aud: 79, sold_count: 8900, winning_score: 84, trend: 'exploding', competition_level: 'low', au_relevance: 93, est_daily_revenue_aud: 2400, units_per_day: 30, why_winning: 'Cost of living crisis making AU households grow their own food.', ad_angle: 'Fresh basil, mint, and chilli growing on your kitchen bench. Zero effort.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 72000, revenue_growth_pct: 134, platforms: ['Shopify', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k2', product_title: 'Beeswax Food Wraps (Set of 4)', category: 'Home & Kitchen', platform: 'Amazon AU', price_aud: 29, sold_count: 19600, winning_score: 76, trend: 'growing', competition_level: 'low', au_relevance: 95, est_daily_revenue_aud: 1300, units_per_day: 45, why_winning: 'Eco-conscious AU household trend; excellent gift product; reorders every 12 months.', ad_angle: 'Ditch the plastic wrap forever. These last a year and cost $29.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 39000, revenue_growth_pct: 52, platforms: ['Amazon AU', 'eBay AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k3', product_title: 'Portable Blender (USB-C)', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 44, sold_count: 24300, winning_score: 80, trend: 'growing', competition_level: 'medium', au_relevance: 88, est_daily_revenue_aud: 1900, units_per_day: 43, why_winning: 'Gym/health trend + compact apartments = perfect storm. Charges with the same cable as your phone.', ad_angle: 'Protein shake in 30 seconds. Anywhere. Charges with your iPhone cable.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 57000, revenue_growth_pct: 61, platforms: ['TikTok Shop', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k4', product_title: 'Vegetable Chopper 14-in-1', category: 'Home & Kitchen', platform: 'Amazon AU', price_aud: 59, sold_count: 16800, winning_score: 77, trend: 'stable', competition_level: 'medium', au_relevance: 92, est_daily_revenue_aud: 1600, units_per_day: 27, why_winning: 'Meal prep content is huge in AU; this is the centrepiece tool for every kitchen hack video.', ad_angle: 'Prep a week of meals in 20 minutes. One tool, 14 cuts.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 48000, revenue_growth_pct: 28, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k5', product_title: 'Weighted Blanket (7kg)', category: 'Home & Kitchen', platform: 'Shopify', price_aud: 89, sold_count: 7200, winning_score: 73, trend: 'stable', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 1400, units_per_day: 16, why_winning: 'Anxiety/sleep market continues to grow; high AOV, good margins.', ad_angle: 'The blanket that feels like a hug. Sleep 2 hours deeper, guaranteed.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 42000, revenue_growth_pct: 19, platforms: ['Shopify', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k6', product_title: 'Self-Watering Plant Pot Set', category: 'Home & Kitchen', platform: 'Amazon AU', price_aud: 38, sold_count: 12400, winning_score: 71, trend: 'growing', competition_level: 'low', au_relevance: 88, est_daily_revenue_aud: 1100, units_per_day: 29, why_winning: 'Plant parent trend + apartment living + forgetful millennials = perfect product.', ad_angle: 'Never kill a plant again. The pot waters itself for up to 2 weeks.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 33000, revenue_growth_pct: 34, platforms: ['Amazon AU', 'eBay AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k7', product_title: 'Collapsible Silicone Storage Bags (8pk)', category: 'Home & Kitchen', platform: 'Amazon AU', price_aud: 34, sold_count: 21000, winning_score: 74, trend: 'stable', competition_level: 'medium', au_relevance: 94, est_daily_revenue_aud: 1200, units_per_day: 35, why_winning: 'Eco-packaging laws in AU making reusable bags more urgent.', ad_angle: 'Replace 500 zip-locks a year with these. Better for you, better for the planet.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 36000, revenue_growth_pct: 24, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'k8', product_title: 'Mini Hot Glue Gun Set', category: 'Home & Kitchen', platform: 'TikTok Shop', price_aud: 24, sold_count: 18900, winning_score: 69, trend: 'growing', competition_level: 'low', au_relevance: 85, est_daily_revenue_aud: 1000, units_per_day: 42, why_winning: 'DIY/craft explosion on AU TikTok; this is in every "apartment DIY" video.', ad_angle: '100 DIY projects start with this $24 tool. Go make something.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 30000, revenue_growth_pct: 47, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Fitness & Sports ───────────────────────────────────────────────────────
  { id: 'f1', product_title: 'Massage Gun Pro (5 heads)', category: 'Fitness & Sports', platform: 'TikTok Shop', price_aud: 79, sold_count: 19400, winning_score: 84, trend: 'growing', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 2600, units_per_day: 33, why_winning: 'Recovery is the new fitness; everyone wants Theragun results without the Theragun price.', ad_angle: 'A $800 Theragun for $79. Same motor, same results, $721 saved.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 78000, revenue_growth_pct: 48, platforms: ['TikTok Shop', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f2', product_title: 'Ab Roller Wheel with Knee Pad', category: 'Fitness & Sports', platform: 'Amazon AU', price_aud: 29, sold_count: 31200, winning_score: 72, trend: 'stable', competition_level: 'high', au_relevance: 92, est_daily_revenue_aud: 1100, units_per_day: 38, why_winning: 'Core training is universal; differentiate with the "6-pack in 30 days" angle.', ad_angle: '30 seconds a day. 30 days. A core you are actually proud of.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 33000, revenue_growth_pct: 14, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f3', product_title: 'Adjustable Dumbbell (2-24kg)', category: 'Fitness & Sports', platform: 'Shopify', price_aud: 149, sold_count: 6800, winning_score: 81, trend: 'growing', competition_level: 'medium', au_relevance: 88, est_daily_revenue_aud: 2200, units_per_day: 15, why_winning: 'Gym memberships declining post-COVID; home gym build-out is a $500B global market.', ad_angle: 'Replace a $3,000 dumbbell rack for $149. Adjusts in 2 seconds.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 66000, revenue_growth_pct: 56, platforms: ['Shopify', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f4', product_title: 'Booty Band Set (5 levels)', category: 'Fitness & Sports', platform: 'TikTok Shop', price_aud: 24, sold_count: 42600, winning_score: 78, trend: 'stable', competition_level: 'high', au_relevance: 91, est_daily_revenue_aud: 1600, units_per_day: 67, why_winning: 'Lower body training dominates AU female fitness content; bundle with leggings for $60+ AOV.', ad_angle: 'The bands every AU fitness creator uses. 5 levels, $24, no excuses.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 48000, revenue_growth_pct: 22, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f5', product_title: 'Foam Roller Deep Tissue (45cm)', category: 'Fitness & Sports', platform: 'Amazon AU', price_aud: 34, sold_count: 24800, winning_score: 68, trend: 'stable', competition_level: 'high', au_relevance: 93, est_daily_revenue_aud: 1000, units_per_day: 29, why_winning: 'Recovery staple; bundle play (mat + roller + ball) increases AOV to $89.', ad_angle: 'The physio tool your muscles have been begging for.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 30000, revenue_growth_pct: 11, platforms: ['Amazon AU', 'eBay AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f6', product_title: 'Pull-Up Bar (No Drill Doorframe)', category: 'Fitness & Sports', platform: 'Amazon AU', price_aud: 54, sold_count: 13600, winning_score: 75, trend: 'growing', competition_level: 'medium', au_relevance: 89, est_daily_revenue_aud: 1400, units_per_day: 26, why_winning: 'Renters cannot drill; this is the only solution. Perfect for AU apartment dwellers.', ad_angle: 'No drill. No damage. No excuses. Pull-ups in your doorframe tonight.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 42000, revenue_growth_pct: 38, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f7', product_title: 'Workout Gloves (Wrist Support)', category: 'Fitness & Sports', platform: 'Amazon AU', price_aud: 29, sold_count: 19200, winning_score: 66, trend: 'stable', competition_level: 'high', au_relevance: 88, est_daily_revenue_aud: 900, units_per_day: 31, why_winning: 'Budget gym accessory; differentiate with "injury prevention" angle not aesthetics.', ad_angle: 'Stop tearing your hands. Start lifting heavier. $29 and problem solved.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 27000, revenue_growth_pct: 8, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f8', product_title: 'Speed Jump Rope (Ball Bearings)', category: 'Fitness & Sports', platform: 'TikTok Shop', price_aud: 27, sold_count: 22400, winning_score: 74, trend: 'growing', competition_level: 'low', au_relevance: 87, est_daily_revenue_aud: 1200, units_per_day: 44, why_winning: 'Crossfit + boxing trends keep this perennially relevant. Lowest barrier home cardio.', ad_angle: '10 minutes, 100 calories. The only cardio equipment you will ever need.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 36000, revenue_growth_pct: 29, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Tech & Gadgets ─────────────────────────────────────────────────────────
  { id: 't1', product_title: 'Magnetic Wireless Charger Stand (3-in-1)', category: 'Tech & Gadgets', platform: 'Amazon AU', price_aud: 59, sold_count: 22800, winning_score: 83, trend: 'growing', competition_level: 'medium', au_relevance: 93, est_daily_revenue_aud: 2400, units_per_day: 41, why_winning: 'Every iPhone 15+ user needs this. No brainer purchase with strong gifting season.', ad_angle: 'Phone, watch, AirPods. One stand. Fully charged every morning.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 72000, revenue_growth_pct: 67, platforms: ['Amazon AU', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't2', product_title: 'Smart Plug (4-Pack, Wi-Fi)', category: 'Tech & Gadgets', platform: 'Amazon AU', price_aud: 49, sold_count: 18600, winning_score: 77, trend: 'growing', competition_level: 'medium', au_relevance: 91, est_daily_revenue_aud: 1700, units_per_day: 35, why_winning: 'Smart home entry product; everyone buys 4 then comes back for more.', ad_angle: 'Turn your old appliances smart for $49. Works with Alexa and Google.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 51000, revenue_growth_pct: 41, platforms: ['Amazon AU', 'eBay AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't3', product_title: 'Portable Solar Power Bank (20000mAh)', category: 'Tech & Gadgets', platform: 'Amazon AU', price_aud: 69, sold_count: 11400, winning_score: 79, trend: 'growing', competition_level: 'medium', au_relevance: 95, est_daily_revenue_aud: 1900, units_per_day: 28, why_winning: 'AU outdoor culture makes solar chargers essential; camping/hiking audience.', ad_angle: 'Never run out of battery on a hike again. Charges off the sun.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 57000, revenue_growth_pct: 53, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't4', product_title: 'Mini Projector (1080p, 120")', category: 'Tech & Gadgets', platform: 'Shopify', price_aud: 189, sold_count: 4200, winning_score: 80, trend: 'exploding', competition_level: 'low', au_relevance: 87, est_daily_revenue_aud: 2100, units_per_day: 11, why_winning: 'Apartment living means no room for big TVs; projector solves this at $189.', ad_angle: 'A 120-inch cinema in your bedroom. No TV required. $189.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 63000, revenue_growth_pct: 112, platforms: ['Shopify', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't5', product_title: 'Cable Management Box (Set of 3)', category: 'Tech & Gadgets', platform: 'Amazon AU', price_aud: 39, sold_count: 14700, winning_score: 69, trend: 'stable', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 1100, units_per_day: 28, why_winning: "Desk setup culture exploded. Everyone's filming their workspace. Cables are the enemy.", ad_angle: 'Hide every cable in your setup for $39. Before: chaos. After: magazine cover.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 33000, revenue_growth_pct: 26, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't6', product_title: 'Webcam Cover Slider (10pk)', category: 'Tech & Gadgets', platform: 'Amazon AU', price_aud: 14, sold_count: 48000, winning_score: 64, trend: 'stable', competition_level: 'high', au_relevance: 92, est_daily_revenue_aud: 700, units_per_day: 50, why_winning: 'Paranoid about privacy? So is everyone. Tiny AOV but sky-high unit economics.', ad_angle: 'Your laptop camera is always watching. $14 and peace of mind.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 21000, revenue_growth_pct: 9, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't7', product_title: 'LED Desk Lamp with Wireless Charger', category: 'Tech & Gadgets', platform: 'Amazon AU', price_aud: 79, sold_count: 8900, winning_score: 76, trend: 'growing', competition_level: 'medium', au_relevance: 91, est_daily_revenue_aud: 1600, units_per_day: 20, why_winning: 'Work-from-home setup product; high gifting potential Dec/Jan.', ad_angle: 'The lamp that also charges your phone. The desk upgrade you should have done years ago.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 48000, revenue_growth_pct: 39, platforms: ['Amazon AU', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't8', product_title: 'Bluetooth Tracker Tile Alternative', category: 'Tech & Gadgets', platform: 'Shopify', price_aud: 34, sold_count: 16300, winning_score: 74, trend: 'growing', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 1300, units_per_day: 38, why_winning: 'AirTag alternative at 1/3 price; anxiety-driven purchase with near-zero refund rate.', ad_angle: 'Find your keys, wallet, and bag. Every time. $34, works with Android and iPhone.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 39000, revenue_growth_pct: 44, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Pets ────────────────────────────────────────────────────────────────────
  { id: 'p1', product_title: 'Automatic Pet Feeder (Wi-Fi)', category: 'Pets', platform: 'Amazon AU', price_aud: 89, sold_count: 11200, winning_score: 82, trend: 'exploding', competition_level: 'low', au_relevance: 92, est_daily_revenue_aud: 2400, units_per_day: 27, why_winning: 'AU pet ownership at all-time high post-COVID. Wi-Fi feeders are the smart home pet must-have.', ad_angle: 'Feed your dog from Bali. Set schedules from your phone. Never miss a meal.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 72000, revenue_growth_pct: 89, platforms: ['Amazon AU', 'Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p2', product_title: 'Pet Stroller (Foldable 3-Wheeler)', category: 'Pets', platform: 'Amazon AU', price_aud: 149, sold_count: 4600, winning_score: 77, trend: 'growing', competition_level: 'low', au_relevance: 89, est_daily_revenue_aud: 1800, units_per_day: 12, why_winning: 'Senior pets + injured pets + dog parents who humanise their pets. Strong UGC.', ad_angle: 'Your old dog still wants to see the world. This costs $149 and changes everything.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 54000, revenue_growth_pct: 64, platforms: ['Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p3', product_title: 'Lick Mat Slow Feeder (Set of 3)', category: 'Pets', platform: 'TikTok Shop', price_aud: 28, sold_count: 19800, winning_score: 80, trend: 'exploding', competition_level: 'low', au_relevance: 94, est_daily_revenue_aud: 1500, units_per_day: 54, why_winning: 'Anxiety reduction in pets is the #1 pet trend in AU; these are satisfying to film.', ad_angle: 'Calm your anxious dog in 5 minutes. Vets recommend it. Filming it is optional.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 45000, revenue_growth_pct: 156, platforms: ['TikTok Shop', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p4', product_title: 'Dog DNA Test Kit', category: 'Pets', platform: 'Shopify', price_aud: 89, sold_count: 6700, winning_score: 75, trend: 'growing', competition_level: 'medium', au_relevance: 88, est_daily_revenue_aud: 1500, units_per_day: 17, why_winning: 'Viral content format: "I found out my dog is 3% dingo." Every dog owner wants to know.', ad_angle: 'Find out exactly what breed your rescue dog is. Results in 2-3 weeks.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 45000, revenue_growth_pct: 71, platforms: ['Shopify'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p5', product_title: 'Cat Window Perch Suction (Large)', category: 'Pets', platform: 'Amazon AU', price_aud: 44, sold_count: 12300, winning_score: 71, trend: 'stable', competition_level: 'medium', au_relevance: 91, est_daily_revenue_aud: 1100, units_per_day: 25, why_winning: 'Cat entertainment is a real spend category; apartment cats need enrichment.', ad_angle: 'Give your indoor cat a window seat. Assembly in 30 seconds, holds up to 15kg.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 33000, revenue_growth_pct: 22, platforms: ['Amazon AU', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ── Fashion & Accessories ──────────────────────────────────────────────────
  { id: 'fa1', product_title: 'Magnetic Closure Handbag (Mini)', category: 'Fashion & Accessories', platform: 'TikTok Shop', price_aud: 49, sold_count: 28600, winning_score: 81, trend: 'exploding', competition_level: 'medium', au_relevance: 87, est_daily_revenue_aud: 2200, units_per_day: 45, why_winning: 'Micro-bag trend dominating AU fashion TikTok; magnetic closure is the differentiator.', ad_angle: 'The bag that went viral for a reason. Fits everything that matters.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 66000, revenue_growth_pct: 98, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'fa2', product_title: 'Stainless Steel Watch (Minimalist)', category: 'Fashion & Accessories', platform: 'Shopify', price_aud: 89, sold_count: 9400, winning_score: 78, trend: 'growing', competition_level: 'medium', au_relevance: 86, est_daily_revenue_aud: 1800, units_per_day: 20, why_winning: 'Quiet luxury trend driving demand for clean, simple watches at accessible prices.', ad_angle: 'The watch that costs $89 but looks like it cost $890. Everyone will ask where you got it.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 54000, revenue_growth_pct: 55, platforms: ['Shopify', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'fa3', product_title: 'Silk Scrunchie Set (12pk)', category: 'Fashion & Accessories', platform: 'TikTok Shop', price_aud: 19, sold_count: 51300, winning_score: 74, trend: 'stable', competition_level: 'high', au_relevance: 93, est_daily_revenue_aud: 1300, units_per_day: 68, why_winning: 'Gift-ready, high repeat purchase, and silk positioning beats cotton at $5 more.', ad_angle: 'Stop breaking your hair. Silk scrunchies, $19 for 12. The upgrade is obvious.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 39000, revenue_growth_pct: 16, platforms: ['TikTok Shop', 'Amazon AU'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'fa4', product_title: 'Crossbody Phone Bag (Card Holder)', category: 'Fashion & Accessories', platform: 'TikTok Shop', price_aud: 34, sold_count: 22100, winning_score: 76, trend: 'growing', competition_level: 'medium', au_relevance: 90, est_daily_revenue_aud: 1400, units_per_day: 41, why_winning: 'Hands-free festival/event accessory; AU summer = massive Q4/Q1 opportunity.', ad_angle: 'Phone + cards + keys. Crossbody. Both hands free. Summer sorted.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 42000, revenue_growth_pct: 48, platforms: ['TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'fa5', product_title: 'Sterling Silver Layered Necklace Set', category: 'Fashion & Accessories', platform: 'Shopify', price_aud: 44, sold_count: 14800, winning_score: 72, trend: 'stable', competition_level: 'high', au_relevance: 88, est_daily_revenue_aud: 1100, units_per_day: 25, why_winning: 'Layered jewellery is the #1 AU jewellery trend; gift market is huge at this price.', ad_angle: 'The necklace stack that sells itself on camera. Gold-filled, tarnish-free, $44.', image_url: null, tiktok_product_url: null, est_monthly_revenue_aud: 33000, revenue_growth_pct: 18, platforms: ['Shopify', 'TikTok Shop'], scraped_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 80) return C.gold;
  if (s >= 60) return C.green;
  if (s >= 40) return C.amber;
  return C.red;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateWeekData(base: number, id: string | undefined | null): { day: string; rev: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const safeId = id ?? 'default';
  const seedNum = safeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRand(seedNum);
  return days.map((day, i) => ({
    day,
    rev: Math.round(Math.max(0, base * (0.65 + i * 0.055 + rand() * 0.2))),
  }));
}

function fmtAUD(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
}

function fmtLastUpdated(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function getAdAngles(p: WinningProduct): string[] {
  const base = p.ad_angle ?? `${p.product_title} — the product Australians can't stop buying.`;
  return [
    base,
    `I've been using ${p.product_title} for 30 days. Here's what nobody tells you...`,
    `POV: You just discovered why every AU dropshipper is selling ${p.category?.toLowerCase() ?? 'this'} right now.`,
  ];
}

// ── Score Badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        color,
        background: `${color}15`,
        border: `1px solid ${color}35`,
        whiteSpace: 'nowrap',
        fontFamily: 'Syne, sans-serif',
      }}
    >
      Score {score}
    </span>
  );
}

// ── Trend Badge ───────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: Trend | null }) {
  if (!trend) return null;
  const t = TREND_MAP[trend];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: t.color,
        background: `${t.color}18`,
        border: `1px solid ${t.color}35`,
        whiteSpace: 'nowrap',
      }}
    >
      {t.emoji} {t.label}
    </span>
  );
}

// ── Competition Badge ─────────────────────────────────────────────────────────

function CompetitionDot({ level }: { level: Competition | null }) {
  if (!level) return null;
  const m = COMPETITION_MAP[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: m.color,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: m.color,
          boxShadow: `0 0 6px ${m.color}80`,
          display: 'inline-block',
        }}
      />
      {m.label} Competition
    </span>
  );
}

// ── Hero Stats Bar (static — no CountUp, no framer-motion) ───────────────────

function HeroStatsBar({
  products,
  total,
  lastUpdatedISO,
}: {
  products: WinningProduct[];
  total: number;
  lastUpdatedISO: string | null;
}) {
  const avgRev = useMemo(() => {
    const withRev = products.filter((p) => p.est_daily_revenue_aud != null);
    if (!withRev.length) return 0;
    return Math.round(
      withRev.reduce((a, p) => a + (p.est_daily_revenue_aud ?? 0), 0) / withRev.length,
    );
  }, [products]);

  const explodingCount = useMemo(
    () => products.filter((p) => p.trend === 'exploding').length,
    [products],
  );

  const stats = [
    {
      label: 'Total Products',
      value: String(total || products.length),
      icon: <BarChart2 size={16} />,
      highlight: true,
    },
    {
      label: 'Avg Daily Revenue',
      value: `$${avgRev.toLocaleString('en-AU')}/day`,
      icon: <TrendingUp size={16} />,
      highlight: false,
    },
    {
      label: 'Exploding Trends',
      value: String(explodingCount),
      icon: <Flame size={16} />,
      highlight: false,
    },
    {
      label: 'Last Updated',
      value: fmtLastUpdated(lastUpdatedISO),
      icon: <RefreshCw size={16} />,
      highlight: false,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: s.highlight
              ? 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.04) 100%)'
              : C.glass,
            border: `1px solid ${s.highlight ? C.goldBorder : C.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              color: s.highlight ? C.gold : C.sub,
            }}
          >
            {s.icon}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {s.label}
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 26,
              fontWeight: 800,
              color: s.highlight ? C.gold : C.text,
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Top 5 Rankings (replaces Top3Podium) ─────────────────────────────────────

function Top5Rankings({
  products,
  onSelect,
}: {
  products: WinningProduct[];
  onSelect: (p: WinningProduct) => void;
}) {
  const top5 = products.slice(0, 5);
  if (top5.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Crown size={14} style={{ color: C.gold }} />
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: C.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Top Products Today
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>by daily revenue</span>
      </div>

      <div
        style={{
          background: C.glass,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {top5.map((p, i) => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              cursor: 'pointer',
              borderBottom: i < top5.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = C.cardHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            {/* Rank */}
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 13,
                fontWeight: 800,
                color: i === 0 ? C.gold : C.muted,
                width: 26,
                flexShrink: 0,
              }}
            >
              #{i + 1}
            </span>

            {/* Image */}
            {p.image_url ? (
              <img
                src={p.image_url}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart2 size={14} style={{ color: C.muted }} />
              </div>
            )}

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.product_title}
              </div>
              {p.category && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.category}</div>
              )}
            </div>

            {/* Revenue */}
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: C.gold,
                fontFamily: 'Syne, sans-serif',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {fmtAUD(p.est_daily_revenue_aud)}/day
            </div>

            {/* Trend badge */}
            <div style={{ flexShrink: 0 }}>
              <TrendBadge trend={p.trend} />
            </div>

            {/* Score badge */}
            <div style={{ flexShrink: 0 }}>
              <ScoreBadge score={p.winning_score} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  product,
  onClose,
  watchlistIds,
  onToggleWatchlist,
  token,
}: {
  product: WinningProduct | null;
  onClose: () => void;
  watchlistIds: Set<string>;
  onToggleWatchlist: (p: WinningProduct) => void;
  token: string | undefined;
}) {
  const [analysis, setAnalysis] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnalysis('');
    setAnalysing(false);
    setAnalysisOpen(false);
    setCopiedIdx(null);
  }, [product?.id]);

  const weekData = useMemo(
    () => (product ? generateWeekData(product.est_daily_revenue_aud ?? 500, product.id) : []),
    [product?.id, product?.est_daily_revenue_aud],
  );

  const runAnalysis = async () => {
    if (!product) return;
    setAnalysisOpen(true);
    setAnalysing(true);
    setAnalysis('');

    const prompt = `Analyse this product for an Australian dropshipper:

Product: ${product.product_title}
Category: ${product.category ?? 'Unknown'}
Est Daily Revenue: $${product.est_daily_revenue_aud ?? 0} AUD
Units/Day: ${product.units_per_day ?? 0}
Competition: ${product.competition_level ?? 'unknown'}
Platform: ${product.platform}
Why Winning: ${product.why_winning ?? ''}

Cover:
1. Demand signals in Australia
2. Profit margin estimate (sourcing cost, selling price, net margin)
3. Target demographics (age, gender, interests, AU-specific)
4. Top 3 ad angles for Meta + TikTok AU (with example hooks)
5. Recommended suppliers: AliExpress, CJDropshipping, any AU-local
6. Go / No-Go recommendation with confidence score

Be specific, opinionated, use AUD figures.`;

    try {
      const res = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt:
            'You are an expert Australian ecommerce analyst specialising in dropshipping. Respond in clean markdown with headers, bullet points, and AUD figures.',
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            if (raw === '[DONE]') break;
            try {
              const payload = JSON.parse(raw) as { text?: string };
              if (payload.text) {
                setAnalysis((p) => p + payload.text);
                if (analysisRef.current) {
                  analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
                }
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAnalysis(`Error: ${msg}`);
    } finally {
      setAnalysing(false);
    }
  };

  const copyAngle = (angle: string, idx: number) => {
    void navigator.clipboard.writeText(angle);
    setCopiedIdx(idx);
    toast('📋 Ad angle copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const inWatchlist = product ? watchlistIds.has(product.id) : false;
  const adAngles = product ? getAdAngles(product) : [];
  const weeklyRev = product?.est_daily_revenue_aud ? product.est_daily_revenue_aud * 7 : null;
  const monthlyRev = product?.est_daily_revenue_aud ? product.est_daily_revenue_aud * 30 : null;

  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100vw)',
          background: '#0d1017',
          borderLeft: `1px solid ${C.glassBorder}`,
          zIndex: 999,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Image header */}
        {product.image_url && (
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              height: 200,
              overflow: 'hidden',
            }}
          >
            <img
              src={product.image_url}
              alt={product.product_title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, #0d1017 100%)',
              }}
            />
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: `1px solid ${C.glassBorder}`,
                color: C.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div
          style={{
            padding: 24,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Close (no image) */}
          {!product.image_url && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: C.glass,
                  border: `1px solid ${C.glassBorder}`,
                  color: C.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.gold,
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  padding: '3px 8px',
                  borderRadius: 20,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {product.platform}
              </span>
              {product.category && (
                <span
                  style={{
                    fontSize: 11,
                    color: C.sub,
                    background: C.glass,
                    padding: '3px 8px',
                    borderRadius: 20,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {product.category}
                </span>
              )}
            </div>
            <h2
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 22,
                fontWeight: 800,
                color: C.text,
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {product.product_title}
            </h2>
          </div>

          {/* Metric row */}
          <div className="metric-grid-4">
            {(
              [
                { label: 'Score', value: product.winning_score },
                { label: 'Rev/Day', value: fmtAUD(product.est_daily_revenue_aud) },
                { label: 'Units/Day', value: product.units_per_day?.toFixed(0) ?? '—' },
                { label: 'Price', value: fmtAUD(product.price_aud) },
              ] as { label: string; value: React.ReactNode }[]
            ).map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: C.glass,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '12px 10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {label === 'Score' ? (
                    <span style={{ color: scoreColor(product.winning_score) }}>
                      {product.winning_score}
                    </span>
                  ) : (
                    value
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue projections */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <div
              style={{
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                Weekly Proj.
              </div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.green,
                }}
              >
                {fmtAUD(weeklyRev)}
              </div>
            </div>
            <div
              style={{
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                Monthly Proj.
              </div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.gold,
                }}
              >
                {fmtAUD(monthlyRev)}
              </div>
            </div>
          </div>

          {/* 7-day trend chart */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              7-Day Revenue Trend (Est. AUD)
            </div>
            <div style={{ width: '100%', height: 130 }}>
              {weekData && weekData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.gold} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: C.muted }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.muted }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                    width={44}
                  />
                  <RechartTooltip
                    contentStyle={{
                      background: '#0f1117',
                      border: `1px solid ${C.goldBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: C.sub }}
                    formatter={(v: number) => [`$${v} AUD`, 'Est. Rev']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rev"
                    stroke={C.gold}
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={{ fill: C.gold, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: C.gold }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Trend + Competition */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <TrendBadge trend={product.trend} />
            <CompetitionDot level={product.competition_level} />
            <span style={{ fontSize: 11, color: C.sub }}>
              🇦🇺 AU Fit{' '}
              <span
                style={{
                  fontWeight: 700,
                  color:
                    product.au_relevance >= 90
                      ? C.green
                      : product.au_relevance >= 70
                        ? C.amber
                        : C.sub,
                }}
              >
                {product.au_relevance}%
              </span>
            </span>
          </div>

          {/* Why Winning */}
          {product.why_winning && (
            <div
              style={{
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.gold,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Why It's Winning
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'rgba(245,245,245,0.85)',
                  lineHeight: 1.55,
                }}
              >
                {product.why_winning}
              </p>
            </div>
          )}

          {/* 3 Ad Angles */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Ad Angles (3 Variations)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adAngles.map((angle, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(34,197,94,0.05)',
                    border: '1px solid rgba(34,197,94,0.18)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.green,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}
                    >
                      Angle {idx + 1}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: 'rgba(245,245,245,0.85)',
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                      }}
                    >
                      "{angle}"
                    </p>
                  </div>
                  <button
                    onClick={() => copyAngle(angle, idx)}
                    title="Copy ad angle"
                    style={{
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: copiedIdx === idx ? 'rgba(34,197,94,0.2)' : C.glass,
                      border: `1px solid ${copiedIdx === idx ? 'rgba(34,197,94,0.4)' : C.border}`,
                      color: copiedIdx === idx ? C.green : C.sub,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClipboardCopy size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          <div
            style={{
              border: `1px solid ${C.glassBorder}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={analysisOpen ? undefined : () => void runAnalysis()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: analysisOpen ? C.glass : C.goldBg,
                border: 'none',
                cursor: analysing ? 'wait' : 'pointer',
                color: C.text,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} style={{ color: C.gold }} />
                <span
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  AI AU Analysis
                </span>
                {analysing && (
                  <Loader2
                    size={12}
                    style={{
                      color: C.gold,
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                )}
              </div>
              {!analysisOpen && (
                <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
                  Run Analysis →
                </span>
              )}
            </button>

            {analysisOpen && (
              <div
                ref={analysisRef}
                style={{
                  maxHeight: 320,
                  overflowY: 'auto',
                  padding: '14px 16px',
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: 'rgba(245,245,245,0.85)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {analysis || (analysing ? '' : 'Click "Run Analysis" to get AI insights.')}
                {analysing && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 14,
                      background: C.gold,
                      marginLeft: 2,
                      animation: 'blink 0.8s step-end infinite',
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Platform Breakdown */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Platform Signals
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(product.platforms ?? [product.platform]).map((pl) => {
                const isTT = pl.includes('TikTok');
                const isAmz = pl.includes('Amazon');
                const isAli = pl.includes('AliExpress') || pl.includes('Ali');
                const isBaba = pl.includes('Alibaba');
                const icon = isTT ? '🔥' : isAmz ? '📦' : isAli ? '⭐' : isBaba ? '🏭' : '🛒';
                const color = isTT ? '#ff0050' : isAmz ? '#ff9900' : '#ff6a00';
                const bg = isTT ? 'rgba(255,0,80,0.08)' : isAmz ? 'rgba(255,153,0,0.08)' : 'rgba(255,106,0,0.08)';
                const border = isTT ? 'rgba(255,0,80,0.3)' : isAmz ? 'rgba(255,153,0,0.3)' : 'rgba(255,106,0,0.3)';
                return (
                  <span key={pl} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 10, background: bg, color, border: `1px solid ${border}` }}>
                    {icon} {pl}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Supplier links */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Find Suppliers
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'AliExpress →', url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.product_title)}`, color: '#ff6a00' },
                { label: 'Alibaba →', url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(product.product_title)}`, color: '#ff9900' },
                { label: 'CJ Dropshipping →', url: `https://cjdropshipping.com/search.html?q=${encodeURIComponent(product.product_title)}`, color: '#0ea5e9' },
              ].map(({ label, url, color }) => (
                <a key={label} href={url} target="_blank" rel="noreferrer" style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', borderRadius: 10, background: `${color}14`, border: `1px solid ${color}40`, color, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                  <ExternalLink size={10} />
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => { window.location.href = `/app/meta-ads?product=${encodeURIComponent(product.product_title)}&price=${product.price_aud ?? ''}`; }}
                style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                🎯 Generate Meta Ads
              </button>
              <button
                onClick={() => { window.location.href = `/app/website-generator?niche=${encodeURIComponent(product.category ?? '')}`; }}
                style={{ flex: '1 1 100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                🏪 Build Store
              </button>
              <button
                onClick={() => { window.location.href = `/app/profit-calculator?price=${product.price_aud ?? ''}`; }}
                style={{ flex: '1 1 100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: C.green, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                💰 Check Profit
              </button>
            </div>
          </div>

          {/* TikTok link */}
          {product.tiktok_product_url && (
            <a
              href={product.tiktok_product_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                background: 'rgba(255,0,80,0.08)',
                border: '1px solid rgba(255,0,80,0.25)',
                color: '#ff0050',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={11} />
              View on TikTok Shop
            </a>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => onToggleWatchlist(product)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '12px 16px',
                borderRadius: 12,
                background: inWatchlist ? 'rgba(34,197,94,0.12)' : C.glass,
                border: `1px solid ${inWatchlist ? 'rgba(34,197,94,0.35)' : C.border}`,
                color: inWatchlist ? C.green : C.sub,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Heart size={14} fill={inWatchlist ? C.green : 'none'} />
              {inWatchlist ? '♥ Saved' : 'Watchlist'}
            </button>
            <a
              href={`/app/meta-ads?product=${encodeURIComponent(product.product_title)}&price=${product.price_aud ?? ''}`}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Play size={14} />
              Run Ads
            </a>
            <a
              href={`/store-builder?product=${encodeURIComponent(product.product_title)}&niche=${encodeURIComponent(product.category ?? '')}&price=${product.price_aud ?? ''}`}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '12px 16px',
                borderRadius: 12,
                background: C.gold,
                border: 'none',
                color: '#000',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              title="Build a Shopify store for this product"
            >
              <Store size={14} />
              Build Store →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Spy Ads Modal ─────────────────────────────────────────────────────────────

function SpyAdsModal({ product, onClose }: { product: WinningProduct; onClose: () => void }) {
  const angles = getAdAngles(product);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(560px, 96vw)',
        maxHeight: '85vh',
        overflowY: 'auto',
        background: '#0d1017',
        border: `1px solid ${C.goldBorder}`,
        borderRadius: 20,
        zIndex: 1001,
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        <div style={{ padding: 28 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                🔍 Spy Ads
              </div>
              <div style={{ fontSize: 12, color: C.sub }}>{product.product_title}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: C.glass, border: `1px solid ${C.border}`, color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>

          {/* Platform links */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>Find Active Ads</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                href={`https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?keyword=${encodeURIComponent(product.product_title)}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,0,80,0.06)', border: '1px solid rgba(255,0,80,0.2)', textDecoration: 'none' }}
              >
                <span style={{ fontSize: 22 }}>🎵</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#ff0050', marginBottom: 2 }}>TikTok Creative Center</div>
                  <div style={{ fontSize: 11, color: C.sub }}>See top-performing TikTok ads for this product</div>
                </div>
                <ExternalLink size={13} style={{ color: '#ff0050', flexShrink: 0 }} />
              </a>
              <a
                href={`https://www.facebook.com/ads/library/?search_type=keyword_unordered&q=${encodeURIComponent(product.product_title)}&country=AU`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', textDecoration: 'none' }}
              >
                <span style={{ fontSize: 22 }}>📘</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 2 }}>Meta Ad Library (AU)</div>
                  <div style={{ fontSize: 11, color: C.sub }}>Active Facebook & Instagram ads in Australia</div>
                </div>
                <ExternalLink size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
              </a>
            </div>
          </div>

          {/* Ad Angles */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>3 Proven Ad Angles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {angles.map((angle, idx) => (
                <div key={idx} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ fontSize: 10, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Angle {idx + 1}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,245,245,0.85)', lineHeight: 1.5, fontStyle: 'italic' }}>"{angle}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Full Report Modal ─────────────────────────────────────────────────────────

function FullReportModal({
  product,
  onClose,
  watchlistIds,
  onToggleWatchlist,
  allProducts,
}: {
  product: WinningProduct;
  onClose: () => void;
  watchlistIds: Set<string>;
  onToggleWatchlist: (p: WinningProduct) => void;
  allProducts: WinningProduct[];
}) {
  const weekData = useMemo(
    () => generateWeekData(product.est_daily_revenue_aud ?? 500, product.id),
    [product.id, product.est_daily_revenue_aud],
  );

  const inWatchlist = watchlistIds.has(product.id);
  const adAngles = getAdAngles(product);
  const weeklyRev = product.est_daily_revenue_aud ? product.est_daily_revenue_aud * 7 : null;
  const monthlyRev = product.est_daily_revenue_aud ? product.est_daily_revenue_aud * 30 : null;
  const costEstimate = product.price_aud ? Math.round(product.price_aud / 3) : null;
  const marginPct = product.price_aud && costEstimate ? Math.round(((product.price_aud - costEstimate) / product.price_aud) * 100) : null;

  const similar = useMemo(() => {
    return allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);
  }, [allProducts, product.id, product.category]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(780px, 96vw)',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0a0c14',
        border: `1px solid ${C.goldBorder}`,
        borderRadius: 24,
        zIndex: 1001,
        boxShadow: '0 32px 100px rgba(0,0,0,0.9)',
      }}>
        {/* Hero image */}
        {product.image_url && (
          <div style={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
            <img src={product.image_url} alt={product.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0c14 100%)' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: `1px solid ${C.glassBorder}`, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ padding: 32 }}>
          {/* Close btn (no image) */}
          {!product.image_url && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: C.glass, border: `1px solid ${C.glassBorder}`, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Title + badges */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: C.goldBg, border: `1px solid ${C.goldBorder}`, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{product.platform}</span>
              {product.category && <span style={{ fontSize: 11, color: C.sub, background: C.glass, padding: '4px 10px', borderRadius: 20, border: `1px solid ${C.border}` }}>{product.category}</span>}
              <TrendBadge trend={product.trend} />
              <CompetitionDot level={product.competition_level} />
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.2 }}>
              {product.product_title}
            </h2>
            <div style={{ marginTop: 8, fontSize: 14, color: C.sub }}>
              {product.price_aud != null && <span style={{ fontWeight: 700, color: C.text }}>{fmtAUD(product.price_aud)} AUD</span>}
              <span style={{ marginLeft: 12, color: C.muted }}>Score: <span style={{ color: scoreColor(product.winning_score), fontWeight: 700 }}>{product.winning_score}</span></span>
              <span style={{ marginLeft: 12 }}>🇦🇺 AU Fit: <span style={{ fontWeight: 700, color: product.au_relevance >= 85 ? C.green : C.amber }}>{product.au_relevance}%</span></span>
            </div>
          </div>

          {/* Revenue metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Daily Revenue', value: fmtAUD(product.est_daily_revenue_aud), highlight: true },
              { label: 'Weekly Proj.', value: fmtAUD(weeklyRev), color: C.green },
              { label: 'Monthly Proj.', value: fmtAUD(monthlyRev), color: C.gold },
              { label: 'Units/Day', value: product.units_per_day?.toFixed(0) ?? '—' },
            ].map(({ label, value, highlight, color }) => (
              <div key={label} style={{ background: highlight ? C.goldBg : C.glass, border: `1px solid ${highlight ? C.goldBorder : C.border}`, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: color ?? (highlight ? C.gold : C.text) }}>{value}</div>
              </div>
            ))}
          </div>

          {/* 7-day revenue chart */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>7-Day Revenue Trend (AUD)</div>
            <div style={{ width: '100%', height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.gold} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} width={44} />
                  <RechartTooltip contentStyle={{ background: '#0f1117', border: `1px solid ${C.goldBorder}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.sub }} formatter={(v: number) => [`$${v} AUD`, 'Est. Rev']} />
                  <Area type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={2} fill="url(#revGrad2)" dot={{ fill: C.gold, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.gold }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Why winning */}
          {product.why_winning && (
            <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>💡 Why It's Winning</div>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(245,245,245,0.9)', lineHeight: 1.6 }}>{product.why_winning}</p>
            </div>
          )}

          {/* Ad angles */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>Top 3 Ad Angles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adAngles.map((angle, idx) => (
                <div key={idx} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 10, color: C.green, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>#{idx + 1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,245,245,0.85)', lineHeight: 1.5, fontStyle: 'italic' }}>"{angle}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profit calculator quick view */}
          {product.price_aud != null && costEstimate != null && (
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>💰 Profit Snapshot (3× markup)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Sell Price', value: fmtAUD(product.price_aud) },
                  { label: 'Est. COGS', value: fmtAUD(costEstimate) },
                  { label: 'Gross Margin', value: `${marginPct ?? 0}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: C.text }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier links */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>📦 Supplier Recommendations</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Search Suppliers →', url: `/app/suppliers?q=${encodeURIComponent(product.product_title)}`, color: C.gold, bg: C.goldBg, border: C.goldBorder },
                { label: 'AliExpress', url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.product_title)}`, color: '#ff6a00', bg: 'rgba(255,106,0,0.08)', border: 'rgba(255,106,0,0.25)' },
                { label: 'CJ Dropshipping', url: `https://cjdropshipping.com/search.html?q=${encodeURIComponent(product.product_title)}`, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)' },
              ].map(({ label, url, color, bg, border }) => (
                <a key={label} href={url} target={url.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ flex: '1 1 130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, background: bg, border: `1px solid ${border}`, color, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  <ExternalLink size={10} />{label}
                </a>
              ))}
            </div>
          </div>

          {/* Similar products */}
          {similar.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>Similar {product.category} Products</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {similar.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    {p.image_url && <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_title}</div>
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: C.gold, flexShrink: 0 }}>{fmtAUD(p.est_daily_revenue_aud)}/day</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`/store-builder?product=${encodeURIComponent(product.product_title)}&niche=${encodeURIComponent(product.category ?? '')}&price=${product.price_aud ?? ''}`}
              style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: C.gold, border: 'none', color: '#000', fontSize: 14, fontWeight: 800, textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}
            >
              🚀 Build Store →
            </a>
            <button
              onClick={() => onToggleWatchlist(product)}
              style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 7, padding: '14px 18px', borderRadius: 14, background: inWatchlist ? 'rgba(34,197,94,0.12)' : C.glass, border: `1px solid ${inWatchlist ? 'rgba(34,197,94,0.35)' : C.border}`, color: inWatchlist ? C.green : C.sub, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              <Heart size={14} fill={inWatchlist ? C.green : 'none'} />
              {inWatchlist ? 'Saved' : '+ Watchlist'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        height: 360,
        animation: 'shimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  rank,
  onSelect,
  onToggleWatchlist,
  inWatchlist,
  onImportShopify,
  onToggleCompare,
  inCompare,
  onSpyAds,
  onFullReport,
}: {
  product: WinningProduct;
  rank: number;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  inWatchlist: boolean;
  onImportShopify?: (p: WinningProduct) => void;
  onToggleCompare?: (p: WinningProduct) => void;
  inCompare?: boolean;
  onSpyAds?: (p: WinningProduct) => void;
  onFullReport?: (p: WinningProduct) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const sparkData = useMemo(
    () => generateWeekData(product.est_daily_revenue_aud ?? 500, product.id),
    [product.id, product.est_daily_revenue_aud],
  );

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = toSlug(product.product_title);
    const url = `https://majorka.io/product/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      toast.success('Report link copied! Share with your dropshipping community');
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  const rankMeta =
    rank === 1
      ? { color: C.gold, label: '#1' }
      : rank === 2
        ? { color: C.silver, label: '#2' }
        : rank === 3
          ? { color: C.bronze, label: '#3' }
          : null;

  return (
    <div
      onClick={() => onSelect(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.glass,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? C.goldBorder : C.glassBorder}`,
        borderRadius: 18,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 0 24px rgba(212,175,55,0.08)' : 'none',
        position: 'relative',
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          height: 160,
          background: 'rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart2 size={32} style={{ color: C.muted, opacity: 0.5 }} />
          </div>
        )}

        {/* Score badge (top-left) */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <ScoreBadge score={product.winning_score} />
        </div>

        {/* Rank badge */}
        {rankMeta && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              color: rankMeta.color,
              background: `${rankMeta.color}22`,
              border: `1px solid ${rankMeta.color}50`,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            {rankMeta.label}
          </div>
        )}

        {/* Trend badge */}
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <TrendBadge trend={product.trend} />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: 16,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 15,
                fontWeight: 800,
                color: C.text,
                lineHeight: 1.25,
              }}
            >
              {product.product_title}
            </div>
            {product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 7 * 86400000 && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>NEW</span>
            )}
            {product.winning_score > 85 && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>TRENDING</span>
            )}
          </div>
          {product.price_aud != null && (
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>
              {fmtAUD(product.price_aud)}
            </div>
          )}
        </div>

        {/* Revenue primary — large gold */}
        <div
          style={{
            background: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 10,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Est. Daily Revenue</div>
          <div
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: C.gold,
            }}
          >
            {fmtAUD(product.est_daily_revenue_aud)}/day
          </div>
        </div>

        {/* Revenue Sparkline */}
        <div style={{ width: '100%', height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
              <Line type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Units + Competition row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
          {product.units_per_day != null && (
            <div style={{ fontSize: 12, color: C.sub }}>
              ~{product.units_per_day.toFixed(0)} units/day
            </div>
          )}
          <CompetitionDot level={product.competition_level} />
        </div>

        {/* Why winning */}
        {product.why_winning && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: C.sub,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.why_winning}
          </p>
        )}

        {/* AU relevance text */}
        <div style={{ fontSize: 11, color: C.muted }}>
          🇦🇺 AU Fit{' '}
          <span
            style={{
              fontWeight: 700,
              color:
                product.au_relevance >= 90
                  ? C.green
                  : product.au_relevance >= 70
                    ? C.amber
                    : C.sub,
            }}
          >
            {product.au_relevance}%
          </span>
        </div>

        {/* Action buttons */}
        <div
          style={{ display: 'flex', gap: 6, marginTop: 'auto', flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Row 1: Spy Ads + Find Supplier + Full Report */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onSpyAds?.(product)}
              title="Spy on ads for this product"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderRadius: 9, background: 'rgba(255,0,80,0.08)', border: '1px solid rgba(255,0,80,0.2)', color: '#ff0050', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🔍 Spy Ads
            </button>
            <a
              href={`/app/suppliers?q=${encodeURIComponent(product.product_title)}`}
              onClick={(e) => e.stopPropagation()}
              title="Find suppliers"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderRadius: 9, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)', color: '#ff6a00', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              📦 Supplier
            </a>
            <button
              onClick={() => onFullReport?.(product)}
              title="Full product report"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderRadius: 9, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📋 Report
            </button>
          </div>

          {/* Row 2: Analyse + Watchlist + Share */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onSelect(product)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', borderRadius: 9, background: C.glass, border: `1px solid ${C.border}`, color: C.sub, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              <Sparkles size={11} /> AI Deep Dive
            </button>
            <button
              onClick={() => onToggleWatchlist(product)}
              title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: inWatchlist ? 'rgba(239,68,68,0.12)' : C.glass, border: `1px solid ${inWatchlist ? 'rgba(239,68,68,0.35)' : C.border}`, color: inWatchlist ? C.red : C.sub, cursor: 'pointer' }}
            >
              <Heart size={13} fill={inWatchlist ? C.red : 'none'} />
            </button>
            <button
              onClick={handleShare}
              title="Share product report"
              style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: shareCopied ? 'rgba(34,197,94,0.12)' : C.glass, border: `1px solid ${shareCopied ? 'rgba(34,197,94,0.35)' : C.border}`, color: shareCopied ? '#22c55e' : C.sub, cursor: 'pointer', fontSize: 13 }}
            >
              {shareCopied ? '✓' : <ClipboardCopy size={12} />}
            </button>
          </div>

          {/* Row 3: Shopify + Compare */}
          <div style={{ display: 'flex', gap: 6 }}>
            {onImportShopify && (
              <button
                onClick={() => onImportShopify(product)}
                title="Download Shopify CSV"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 9, background: 'rgba(6,20,2,0.6)', border: '1px solid rgba(150,191,72,0.3)', color: '#96BF48', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ↓ Shopify CSV
              </button>
            )}
            {onToggleCompare && (
              <button
                onClick={() => onToggleCompare(product)}
                title={inCompare ? 'Remove from compare' : 'Add to compare'}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 9, background: inCompare ? 'rgba(212,175,55,0.12)' : C.glass, border: `1px solid ${inCompare ? C.goldBorder : C.border}`, color: inCompare ? C.gold : C.sub, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {inCompare ? <CheckSquare size={11} /> : <Square size={11} />}
                Compare
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Section (collapsible) ─────────────────────────────────────────────

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, padding: '12px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: 'none', border: 'none', color: C.sub, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', padding: '0 0 6px',
        }}
      >
        {title}
        <span style={{ fontSize: 12, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}

// ── Filter Sidebar ────────────────────────────────────────────────────────────

function FilterSidebar({
  platformFilter, setPlatformFilter,
  categories, category, setCategory,
  trend, setTrend,
  competition, setCompetition,
  sort, setSort,
  minMonthlyRevenue, setMinMonthlyRevenue,
  hideSaturated, setHideSaturated,
  activeFilters, onClearAll,
}: {
  platformFilter: string[];
  setPlatformFilter: React.Dispatch<React.SetStateAction<string[]>>;
  categories: string[];
  category: string;
  setCategory: (c: string) => void;
  trend: string;
  setTrend: (t: string) => void;
  competition: string;
  setCompetition: (c: string) => void;
  sort: string;
  setSort: (s: string) => void;
  minMonthlyRevenue: number;
  setMinMonthlyRevenue: (n: number) => void;
  hideSaturated: boolean;
  setHideSaturated: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilters: number;
  onClearAll: () => void;
}) {
  return (
    <aside
      style={{
        width: 240, flexShrink: 0, position: 'sticky', top: 20, alignSelf: 'flex-start',
        background: C.glass, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: '8px 16px 16px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
        display: 'none',
      }}
      className="sidebar-filters"
    >
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.gold, padding: '10px 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Filter size={13} /> Filters
        {activeFilters > 0 && (
          <span style={{ fontSize: 10, fontWeight: 800, background: C.gold, color: '#000', padding: '1px 6px', borderRadius: 20 }}>{activeFilters}</span>
        )}
      </div>

      <SidebarSection title="Platform">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU'] as const).map((pl) => (
            <label key={pl} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: C.text }}>
              <input
                type="checkbox"
                checked={platformFilter.includes(pl)}
                onChange={() => setPlatformFilter((prev) => prev.includes(pl) ? prev.filter((p) => p !== pl) : [...prev, pl])}
                style={{ accentColor: C.gold, width: 13, height: 13 }}
              />
              {pl}
            </label>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Category">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Trend">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(['All', 'Exploding', 'Growing', 'Stable', 'Declining'] as const).map((t) => {
            const meta = t !== 'All' ? TREND_MAP[t.toLowerCase() as Trend] : null;
            return <Chip key={t} active={trend === t} onClick={() => setTrend(t)}>{meta ? `${meta.emoji} ${t}` : t}</Chip>;
          })}
        </div>
      </SidebarSection>

      <SidebarSection title="Competition">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['All', 'Low', 'Medium', 'High'].map((c) => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: competition === c ? C.gold : C.text }}>
              <input type="radio" name="sidebar-comp" checked={competition === c} onChange={() => setCompetition(c)} style={{ accentColor: C.gold }} />
              {c}
            </label>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Sort by">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {['Revenue', 'Growth %', 'Most Sold', 'Score', 'Newest'].map((s) => (
            <Chip key={s} active={sort === s} onClick={() => setSort(s)}>{s}</Chip>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title={`Min Revenue: $${minMonthlyRevenue === 0 ? 'Any' : `${(minMonthlyRevenue / 1000).toFixed(0)}k`}/mo`}>
        <input
          type="range" min={0} max={500000} step={10000} value={minMonthlyRevenue}
          onChange={(e) => setMinMonthlyRevenue(Number(e.target.value))}
          style={{ width: '100%', accentColor: C.gold }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 2 }}>
          <span>$0</span><span>$250k</span><span>$500k</span>
        </div>
      </SidebarSection>

      <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: C.text }}>
          <div
            onClick={() => setHideSaturated((v) => !v)}
            style={{ width: 36, height: 20, borderRadius: 10, background: hideSaturated ? C.gold : C.glass, border: `1px solid ${hideSaturated ? C.gold : C.border}`, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', top: 2, left: hideSaturated ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: hideSaturated ? '#000' : C.muted, transition: 'left 0.2s' }} />
          </div>
          Hide Saturated
        </label>
      </div>

      {activeFilters > 0 && (
        <button
          onClick={onClearAll}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <X size={11} /> Clear All
        </button>
      )}
    </aside>
  );
}

// ── Trending Now Bar ──────────────────────────────────────────────────────────

function TrendingNowBar({ products, onSelect }: { products: WinningProduct[]; onSelect: (p: WinningProduct) => void }) {
  const top5 = useMemo(() =>
    [...products].sort((a, b) => (b.est_daily_revenue_aud ?? 0) - (a.est_daily_revenue_aud ?? 0)).slice(0, 5),
    [products]
  );
  if (top5.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Flame size={13} style={{ color: C.gold }} />
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trending Now</span>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {top5.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 20,
              background: C.goldBg, border: `1px solid ${C.goldBorder}`,
              color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.goldBg; }}
          >
            🔥 {p.product_title.length > 30 ? p.product_title.slice(0, 30) + '…' : p.product_title} — <span style={{ color: C.gold, fontWeight: 700 }}>{fmtAUD(p.est_daily_revenue_aud)}/day</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Market Signals Bar ────────────────────────────────────────────────────────

function MarketSignalsBar({ products }: { products: WinningProduct[] }) {
  const signals = useMemo(() => {
    const sigs: string[] = [];

    // Exploding per category
    const explodingByCat: Record<string, number> = {};
    products.forEach((p) => {
      if (p.trend === 'exploding' && p.category) {
        explodingByCat[p.category] = (explodingByCat[p.category] ?? 0) + 1;
      }
    });
    Object.entries(explodingByCat).forEach(([cat, count]) => {
      sigs.push(`${count} product${count > 1 ? 's' : ''} exploding in ${cat}`);
    });

    // Top category by revenue
    const revByCat: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category && p.est_daily_revenue_aud) {
        revByCat[p.category] = (revByCat[p.category] ?? 0) + p.est_daily_revenue_aud;
      }
    });
    const topCat = Object.entries(revByCat).sort((a, b) => b[1] - a[1])[0];
    if (topCat) sigs.push(`${topCat[0]} is the #1 AU niche this week`);

    // Newest product
    const newest = [...products].sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())[0];
    if (newest) sigs.push(`Just added: ${newest.product_title}`);

    return sigs.slice(0, 5);
  }, [products]);

  if (signals.length === 0) return null;

  return (
    <div style={{
      marginBottom: 20, background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '10px 16px', overflowX: 'auto', display: 'flex', gap: 24, alignItems: 'center',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Signals</span>
      {signals.map((s, i) => (
        <span key={i} style={{ fontSize: 11, color: C.gold, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {s}
          {i < signals.length - 1 && <span style={{ margin: '0 12px', color: C.muted }}>·</span>}
        </span>
      ))}
    </div>
  );
}

// ── Category Intelligence Table ───────────────────────────────────────────────

function CategoryIntelligenceTable({ products }: { products: WinningProduct[] }) {
  const catData = useMemo(() => {
    const map: Record<string, { count: number; totalDailyRev: number; topProduct: string; topRev: number; compScores: number[] }> = {};
    products.forEach((p) => {
      const cat = p.category ?? 'Uncategorised';
      if (!map[cat]) map[cat] = { count: 0, totalDailyRev: 0, topProduct: '', topRev: 0, compScores: [] };
      const entry = map[cat];
      entry.count++;
      entry.totalDailyRev += p.est_daily_revenue_aud ?? 0;
      if ((p.est_daily_revenue_aud ?? 0) > entry.topRev) {
        entry.topRev = p.est_daily_revenue_aud ?? 0;
        entry.topProduct = p.product_title;
      }
      const compNum = p.competition_level === 'low' ? 1 : p.competition_level === 'medium' ? 2 : p.competition_level === 'high' ? 3 : 2;
      entry.compScores.push(compNum);
    });

    return Object.entries(map).map(([cat, d]) => {
      const avgComp = d.compScores.reduce((a, b) => a + b, 0) / d.compScores.length;
      const marketSize = d.totalDailyRev * 30;
      // Opportunity: high rev + low competition = high score (scale 1-100)
      const revScore = Math.min(d.totalDailyRev / 100, 50);
      const compScore = (4 - avgComp) * 16.7; // low comp = higher score
      const opportunity = Math.round(Math.min(100, revScore + compScore));
      return { cat, count: d.count, marketSize, topProduct: d.topProduct, avgComp, opportunity };
    }).sort((a, b) => b.opportunity - a.opportunity);
  }, [products]);

  const compLabel = (v: number) => v < 1.5 ? 'Low' : v < 2.5 ? 'Medium' : 'High';
  const compColor = (v: number) => v < 1.5 ? C.green : v < 2.5 ? C.amber : C.red;

  const th: React.CSSProperties = {
    padding: '10px 12px', fontSize: 10, fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
    borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
  };

  return (
    <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${C.border}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
        <thead>
          <tr style={{ background: C.glass }}>
            <th style={th}>Category</th>
            <th style={th}># Products</th>
            <th style={th}>Est Market Size</th>
            <th style={th}>Top Product</th>
            <th style={th}>Avg Competition</th>
            <th style={th}>Opportunity</th>
          </tr>
        </thead>
        <tbody>
          {catData.map((row) => (
            <tr key={row.cat} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '12px', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.text }}>{row.cat}</td>
              <td style={{ padding: '12px', fontSize: 12, color: C.sub, fontWeight: 600 }}>{row.count}</td>
              <td style={{ padding: '12px', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800, color: C.gold }}>{fmtAUD(row.marketSize)}/mo</td>
              <td style={{ padding: '12px', fontSize: 12, color: C.text, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.topProduct}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: compColor(row.avgComp) }}>{compLabel(row.avgComp)}</span>
              </td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, maxWidth: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ width: `${row.opportunity}%`, height: '100%', borderRadius: 3, background: row.opportunity >= 70 ? C.green : row.opportunity >= 40 ? C.amber : C.red }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.opportunity >= 70 ? C.green : row.opportunity >= 40 ? C.amber : C.red }}>{row.opportunity}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 20,
        background: active ? C.gold : C.glass,
        border: `1px solid ${active ? C.gold : C.border}`,
        color: active ? '#000' : C.sub,
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────

function TableView({
  products,
  loading,
  onSelect,
  onToggleWatchlist,
  watchlistIds,
  page,
  setPage,
  total,
}: {
  products: WinningProduct[];
  loading: boolean;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  watchlistIds: Set<string>;
  page: number;
  setPage: (n: number) => void;
  total: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const [sortCol, setSortCol] = useState<string>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    const arr = [...products];
    arr.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortCol === 'revenue') { av = a.est_daily_revenue_aud ?? 0; bv = b.est_daily_revenue_aud ?? 0; }
      else if (sortCol === 'growth') { av = a.revenue_growth_pct ?? 0; bv = b.revenue_growth_pct ?? 0; }
      else if (sortCol === 'sold') { av = a.sold_count ?? 0; bv = b.sold_count ?? 0; }
      else if (sortCol === 'price') { av = a.price_aud ?? 0; bv = b.price_aud ?? 0; }
      else if (sortCol === 'score') { av = a.winning_score ?? 0; bv = b.winning_score ?? 0; }
      else if (sortCol === 'au') { av = a.au_relevance ?? 0; bv = b.au_relevance ?? 0; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return arr;
  }, [products, sortCol, sortDir]);

  const SortArrow = ({ col }: { col: string }) => (
    <span style={{ marginLeft: 3, opacity: sortCol === col ? 1 : 0.3, fontSize: 9 }}>
      {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const th = (col: string): React.CSSProperties => ({
    padding: '10px 12px',
    fontSize: 10,
    fontWeight: 700,
    color: sortCol === col ? C.gold : C.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  });

  return (
    <div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 16, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ background: C.glass }}>
              <th style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', width: 40 }}>#</th>
              <th style={th('product')}>Product</th>
              <th style={th('revenue')} onClick={() => handleSort('revenue')}>Est. Revenue/mo <SortArrow col="revenue" /></th>
              <th style={th('trend')}>Trend</th>
              <th style={th('growth')} onClick={() => handleSort('growth')}>Growth % <SortArrow col="growth" /></th>
              <th style={th('sold')} onClick={() => handleSort('sold')}>Items Sold <SortArrow col="sold" /></th>
              <th style={th('price')} onClick={() => handleSort('price')}>Avg Price <SortArrow col="price" /></th>
              <th style={th('platforms')}>Platforms</th>
              <th style={th('score')} onClick={() => handleSort('score')}>Score <SortArrow col="score" /></th>
              <th style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>→</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[40, 220, 100, 90, 80, 80, 80, 80, 50].map((w, j) => (
                      <td key={j} style={{ padding: '14px 12px' }}>
                        <div style={{ height: 14, width: w, maxWidth: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 6, animation: 'shimmer 1.8s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((p, idx) => {
                  const monthly = p.est_monthly_revenue_aud ?? (p.est_daily_revenue_aud ? p.est_daily_revenue_aud * 30 : null);
                  const growth = p.revenue_growth_pct;
                  const plats = p.platforms ?? [p.platform];
                  const sparkData = generateWeekData(p.est_daily_revenue_aud ?? 500, p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelect(p)}
                      style={{ cursor: 'pointer', borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = C.cardHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px', fontSize: 12, color: C.muted, fontWeight: 700, width: 40 }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      {/* Product (image + name) */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180, maxWidth: 280 }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.glass, border: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BarChart2 size={16} style={{ color: C.muted }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{p.product_title}</div>
                            <div style={{ fontSize: 11, color: C.sub }}>{p.category}</div>
                          </div>
                        </div>
                      </td>
                      {/* Est. Revenue/month — gold, large */}
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: C.gold }}>
                          {monthly != null ? `$${(monthly / 1000).toFixed(0)}k/mo` : '—'}
                        </div>
                        {p.est_daily_revenue_aud != null && (
                          <div style={{ fontSize: 10, color: C.sub }}>${p.est_daily_revenue_aud.toFixed(0)}/day</div>
                        )}
                      </td>
                      {/* Trend sparkline (80x28) */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ width: 80, height: 28 }}>
                          <LineChart width={80} height={28} data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                            <Line type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </div>
                      </td>
                      {/* Growth % */}
                      <td style={{ padding: '12px' }}>
                        {growth != null ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: growth >= 0 ? C.green : C.red, background: growth >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${growth >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                            {growth >= 0 ? '+' : ''}{growth}% {growth >= 0 ? '↑' : '↓'}
                          </span>
                        ) : <TrendBadge trend={p.trend} />}
                      </td>
                      {/* Items Sold */}
                      <td style={{ padding: '12px', fontSize: 12, color: C.sub, fontWeight: 600 }}>
                        {p.sold_count != null ? p.sold_count.toLocaleString() : '—'}
                      </td>
                      {/* Avg Price */}
                      <td style={{ padding: '12px', fontSize: 12, color: C.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {p.price_aud != null ? `$${p.price_aud}` : '—'}
                      </td>
                      {/* Platforms */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {plats.map((pl) => (
                            <span key={pl} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: pl.includes('TikTok') ? 'rgba(255,0,80,0.12)' : pl.includes('Amazon') ? 'rgba(255,153,0,0.12)' : pl.includes('Alibaba') ? 'rgba(255,150,0,0.12)' : 'rgba(255,106,0,0.12)', color: pl.includes('TikTok') ? '#ff0050' : pl.includes('Amazon') ? '#ff9900' : '#ff6a00', border: `1px solid ${pl.includes('TikTok') ? 'rgba(255,0,80,0.3)' : pl.includes('Amazon') ? 'rgba(255,153,0,0.3)' : 'rgba(255,106,0,0.3)'}` }}>
                              {pl.includes('TikTok') ? 'TT' : pl.includes('Amazon') ? 'Amz' : pl.includes('Alibaba') ? 'Baba' : 'Ali'}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelect(p)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: C.sub }}>
            Page {page} of {totalPages} · {total} products
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Card Grid ─────────────────────────────────────────────────────────────────

function CardGrid({
  products,
  loading,
  onSelect,
  onToggleWatchlist,
  watchlistIds,
  page,
  setPage,
  total,
  pageOffset,
  onImportShopify,
  onToggleCompare,
  compareIds,
  onSpyAds,
  onFullReport,
}: {
  products: WinningProduct[];
  loading: boolean;
  onSelect: (p: WinningProduct) => void;
  onToggleWatchlist: (p: WinningProduct) => void;
  watchlistIds: Set<string>;
  page: number;
  setPage: (n: number) => void;
  total: number;
  pageOffset?: number;
  onImportShopify?: (p: WinningProduct) => void;
  onToggleCompare?: (p: WinningProduct) => void;
  compareIds?: Set<string>;
  onSpyAds?: (p: WinningProduct) => void;
  onFullReport?: (p: WinningProduct) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 18,
        }}
      >
        {products.length === 0 && !loading && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            marginBottom: 24,
            gridColumn: '1 / -1'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <p style={{
              color: 'rgba(240,237,232,0.9)',
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 8,
              fontFamily: 'Syne, sans-serif'
            }}>No products found</p>
            <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: 13, marginBottom: 20 }}>
              Adjust your filters or check back tomorrow for fresh data
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Posture Corrector', 'LED Face Mask', 'Silk Pillowcase'].map((name) => (
                <div key={name} style={{
                  padding: '8px 14px',
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#d4af37',
                  fontWeight: 600
                }}>
                  {name} →
                </div>
              ))}
            </div>
          </div>
        )}
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                rank={(pageOffset ?? (page - 1) * PAGE_SIZE) + idx + 1}
                onSelect={onSelect}
                onToggleWatchlist={onToggleWatchlist}
                inWatchlist={watchlistIds.has(p.id)}
                onImportShopify={onImportShopify}
                onToggleCompare={onToggleCompare}
                inCompare={compareIds?.has(p.id)}
                onSpyAds={onSpyAds}
                onFullReport={onFullReport}
              />
            ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: C.sub }}>
            Page {page} of {totalPages} · {total} products
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.glass,
              border: `1px solid ${C.border}`,
              color: C.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function WinningProducts() {
  const { session, user } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const isPro = (user as any)?.plan === 'pro' || (user as any)?.plan === 'enterprise' || !!session;

  // ── Tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist' | 'category_intel'>('all');

  // ── View ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<'table' | 'cards'>('cards');

  // ── Products ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState<WinningProduct[]>(SEEDED_PRODUCTS);
  const [total, setTotal] = useState(SEEDED_PRODUCTS.length);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedISO, setLastUpdatedISO] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Health & Beauty',
    'Pet',
    'Fitness',
    'Home & Kitchen',
    'Tech',
    'Fashion',
  ]);
  const [topProducts, setTopProducts] = useState<WinningProduct[]>(SEEDED_PRODUCTS.slice(0, 5));

  // ── Watchlist (Supabase) ──────────────────────────────────────────────
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [watchlistProducts, setWatchlistProducts] = useState<WinningProduct[]>([]);

  // Load watchlist IDs from Supabase on auth change
  useEffect(() => {
    if (!userId) {
      setWatchlistIds(new Set());
      setWatchlistProducts([]);
      return;
    }
    void supabase
      .from('user_watchlist')
      .select('product_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          setWatchlistIds(new Set((data as { product_id: string }[]).map((r) => r.product_id)));
        }
      });
  }, [userId]);

  // Load full product objects for watchlist tab
  useEffect(() => {
    const ids = [...watchlistIds];
    if (ids.length === 0) {
      setWatchlistProducts([]);
      return;
    }
    void supabase
      .from('winning_products')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        if (data) setWatchlistProducts(data as WinningProduct[]);
      });
  }, [watchlistIds]);

  // ── Playbook (localStorage) ──────────────────────────────────────────
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('majorka_saved_products') || '[]'); }
    catch { return []; }
  });
  const toggleSave = (productId: string) => {
    const next = saved.includes(productId)
      ? saved.filter(id => id !== productId)
      : [...saved, productId];
    setSaved(next);
    localStorage.setItem('majorka_saved_products', JSON.stringify(next));
    toast.success(saved.includes(productId) ? 'Removed from Playbook' : 'Saved to Playbook');
  };

  // ── Filters ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [trend, setTrend] = useState('All');
  const [sort, setSort] = useState('Revenue');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [competition, setCompetition] = useState('All');
  const [minMonthlyRevenue, setMinMonthlyRevenue] = useState(0);
  const [platformFilter, setPlatformFilter] = useState<string[]>(['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU']);
  const [hideSaturated, setHideSaturated] = useState(true);

  // ── Niche Search (AI) ─────────────────────────────────────────────────
  const [nicheQuery, setNicheQuery] = useState('');
  const [nicheSearching, setNicheSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WinningProduct[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // ── Detail drawer ─────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);

  // ── Spy Ads + Full Report modals ──────────────────────────────────────
  const [spyAdsProduct, setSpyAdsProduct] = useState<WinningProduct | null>(null);
  const [fullReportProduct, setFullReportProduct] = useState<WinningProduct | null>(null);

  // ── Refresh ───────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  // ── Compare ───────────────────────────────────────────────────────────
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (p: WinningProduct) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
      } else if (next.size < 3) {
        next.add(p.id);
      } else {
        toast('Compare up to 3 products at once');
      }
      return next;
    });
  };

  // ── Debounce search ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Maya prefill — agentic navigation ────────────────────────────────
  useEffect(() => {
    const mayaPrefill = sessionStorage.getItem('maya_prefill_winning-products');
    if (mayaPrefill) {
      try {
        const data = JSON.parse(mayaPrefill);
        if (data.category && data.category !== 'All') setCategory(data.category);
        if (data.filter === 'low-competition') setCompetition('low');
        if (data.search) setSearch(data.search);
        sessionStorage.removeItem('maya_prefill_winning-products');
      } catch {
        /* ignore */
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load recent searches (user_search_history) ───────────────────────
  useEffect(() => {
    if (!userId) { setRecentSearches([]); return; }
    void supabase
      .from('user_search_history')
      .select('query')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set((data as { query: string }[]).map((r) => r.query))];
          setRecentSearches(unique.slice(0, 5));
        }
      });
  }, [userId]);

  // ── Load popular searches (search_cache last 24h) ─────────────────────
  useEffect(() => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    void supabase
      .from('search_cache')
      .select('query')
      .gte('searched_at', dayAgo)
      .order('searched_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          setPopularSearches((data as { query: string }[]).map((r) => r.query));
        }
      });
  }, []);

  // ── Load categories from DB ───────────────────────────────────────────
  useEffect(() => {
    void supabase
      .from('winning_products')
      .select('category')
      .not('category', 'is', null)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const cats = [
            ...new Set(
              (data as { category: string | null }[]).map((r) => r.category).filter(Boolean),
            ),
          ] as string[];
          if (cats.length > 0) setCategories(['All', ...cats.sort()]);
        }
      });
  }, []);

  // ── Load meta (last updated, top 5 by revenue) ────────────────────────
  const loadMeta = async () => {
    const { data: latestData } = await supabase
      .from('winning_products')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (latestData?.[0]) {
      setLastUpdatedISO((latestData[0] as { updated_at: string }).updated_at);
    }

    const { data: topData } = await supabase
      .from('winning_products')
      .select('*')
      .order('est_daily_revenue_aud', { ascending: false })
      .limit(5);
    if (topData && topData.length > 0) {
      setTopProducts(topData as WinningProduct[]);
    }
  };

  useEffect(() => {
    void loadMeta();
  }, []);

  // ── Supabase Realtime ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('winning_products_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'winning_products' },
        () => {
          toast('🔥 New products just dropped!', {
            action: { label: 'Refresh', onClick: () => void fetchProducts() },
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch products ────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('winning_products').select('*', { count: 'exact' });

      if (debouncedSearch) query = query.ilike('product_title', `%${debouncedSearch}%`);
      if (category !== 'All') query = query.eq('category', category);
      if (trend !== 'All') query = query.eq('trend', trend.toLowerCase());

      switch (sort) {
        case 'Score':
          query = query.order('winning_score', { ascending: false });
          break;
        case 'Revenue':
          query = query.order('est_daily_revenue_aud', { ascending: false });
          break;
        case 'Growth %':
          query = query.order('revenue_growth_pct', { ascending: false });
          break;
        case 'Newest':
          query = query.order('scraped_at', { ascending: false });
          break;
        case 'Most Sold':
        case 'Items Sold':
          query = query.order('sold_count', { ascending: false });
          break;
        default:
          query = query.order('est_daily_revenue_aud', { ascending: false });
      }

      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) {
        const filtered = SEEDED_PRODUCTS.filter((p) => {
          if (
            debouncedSearch &&
            !p.product_title.toLowerCase().includes(debouncedSearch.toLowerCase())
          )
            return false;
          if (category !== 'All' && p.category !== category) return false;
          if (trend !== 'All' && p.trend !== trend.toLowerCase()) return false;
          return true;
        });
        setProducts(filtered);
        setTotal(filtered.length);
      } else {
        // Normalise DB values to lowercase to match type definitions
        const normalise = (p: any): WinningProduct => ({
          ...p,
          trend: p.trend ? p.trend.toLowerCase() : null,
          competition_level: p.competition_level ? p.competition_level.toLowerCase() : null,
        });
        const loaded = ((data as any[] | null) ?? []).map(normalise);
        if (loaded.length === 0 && !debouncedSearch && category === 'All' && trend === 'All') {
          setProducts(SEEDED_PRODUCTS);
          setTotal(SEEDED_PRODUCTS.length);
        } else {
          setProducts(loaded);
          setTotal(count ?? 0);
        }
      }
    } catch {
      setProducts(SEEDED_PRODUCTS);
      setTotal(SEEDED_PRODUCTS.length);
      // Mark onboarding step
      markOnboardingStep('scouted_product', userId).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, trend, sort]);

  useEffect(() => {
    if (activeTab === 'all') void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, trend, sort, page, activeTab]);

  // ── Toggle watchlist (Supabase) ───────────────────────────────────────
  const toggleWatchlist = async (p: WinningProduct) => {
    if (!userId) {
      toast('Sign in to save products');
      return;
    }
    if (watchlistIds.has(p.id)) {
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', p.id);
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
      setWatchlistProducts((prev) => prev.filter((w) => w.id !== p.id));
      toast('Removed from watchlist');
    } else {
      await supabase
        .from('user_watchlist')
        .insert({ user_id: userId, product_id: p.id });
      setWatchlistIds((prev) => new Set([...prev, p.id]));
      setWatchlistProducts((prev) => [...prev, p]);
      toast('❤️ Saved to watchlist!');
    }
  };

  // ── Niche / AI product search ─────────────────────────────────────────
  const handleNicheSearch = async (q?: string) => {
    const query = (q ?? nicheQuery).trim();
    if (!query) return;
    if (!token) { toast.error('Sign in to use product search'); return; }
    setNicheSearching(true);
    setSearchResults(null);
    try {
      const res = await fetch('/api/products/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.status === 429) { toast.error('Rate limited — max 10 searches/hour'); return; }
      if (!res.ok) { const j = (await res.json()) as { error?: string }; toast.error(j.error ?? 'Search failed'); return; }
      const data = (await res.json()) as { products: WinningProduct[]; cached: boolean; sources: string[] };
      setSearchResults(data.products);
      if (data.cached) toast('⚡ From cache — instant results!');
      else toast.success(`Found ${data.products.length} products across ${data.sources.join(', ')}`);
      // refresh recent searches
      if (userId) {
        void supabase.from('user_search_history').select('query').eq('user_id', userId).order('searched_at', { ascending: false }).limit(5).then(({ data: d }) => {
          if (d) setRecentSearches([...new Set((d as { query: string }[]).map((r) => r.query))].slice(0, 5));
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setNicheSearching(false);
    }
  };

  // ── Shopify CSV import ────────────────────────────────────────────────
  const showExportLockedToast = () => {
    toast('🔒 Export to CSV is a Pro feature. Upgrade to export unlimited products to Shopify, Google Sheets, or CSV.', {
      duration: 5000,
      style: { background: '#0d0f15', border: '1px solid rgba(212,175,55,0.3)', color: '#f5f5f5', fontSize: 13 },
      action: { label: 'Upgrade Now →', onClick: () => window.location.assign('/pricing') },
    });
  };

  const importToShopify = async (product: WinningProduct) => {
    if (!isPro) {
      showExportLockedToast();
      return;
    }
    if (!token) {
      toast.error('Sign in to use Shopify import');
      return;
    }
    try {
      const res = await fetch('/api/shopify/import-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_title: product.product_title,
          price_aud: product.price_aud,
          supplier_cost_aud: product.price_aud ? product.price_aud / 2.8 : 10,
          description: product.why_winning,
          image_url: product.image_url,
          category: product.category,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.product_title.replace(/[^a-z0-9]/gi, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Shopify CSV downloaded! Import at Shopify Admin → Products → Import');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate CSV';
      toast.error(msg);
    }
  };

  // ── Manual refresh ────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (!token) {
      toast.error('Sign in to trigger refresh');
      return;
    }
    setRefreshing(true);
    try {
      const res = await fetch('/api/products/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.status === 429) {
        toast.error('Rate limited — try again later');
      } else if (res.ok) {
        toast.success('⚡ Refresh triggered!');
        setTimeout(() => {
          void fetchProducts();
          void loadMeta();
        }, 2000);
      } else {
        const json = (await res.json()) as { error?: string };
        toast.error(json.error ?? 'Refresh failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const activeFilters = [debouncedSearch !== '', category !== 'All', trend !== 'All', competition !== 'All', minMonthlyRevenue > 0, platformFilter.length < 4].filter(Boolean).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: 'DM Sans, sans-serif',
        color: C.text,
      }}
    >
      <SEO
        title="Winning Products Australia — Real TikTok Shop Revenue Data | Majorka"
        description="Discover Australia's top-selling TikTok Shop products with real revenue data, margins, and supplier info. Updated every 6 hours by Majorka AI."
        path="/app/winning-products"
      />
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:.2} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(0.88)} }
        @keyframes skeleton-pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .skeleton { background: rgba(255,255,255,0.06); border-radius: 6px; animation: skeleton-pulse 1.5s ease-in-out infinite; }
        @media (min-width: 1024px) { .sidebar-filters { display: block !important; } }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 30,
                    fontWeight: 800,
                    color: C.text,
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Winning Products
                </h1>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 20,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: C.green,
                      display: 'inline-block',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.green,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Live
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
                AU Market Snapshot —{' '}
                <span style={{ color: C.text }}>Updated {fmtLastUpdated(lastUpdatedISO)}</span>
              </p>
            </div>

            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 18px',
                borderRadius: 12,
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                color: C.gold,
                fontSize: 13,
                fontWeight: 700,
                cursor: refreshing ? 'wait' : 'pointer',
                flexShrink: 0,
              }}
            >
              {refreshing ? (
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap size={13} />
              )}
              ⚡ Refresh Now
            </button>
          </div>
        </div>

        {/* ── Data Recency Lock ────────────────────────────────────────── */}
        {isPro ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 20,
              marginBottom: 16,
              fontSize: 12,
              color: '#22c55e',
              fontWeight: 600,
            }}
          >
            ✅ Live data · Updates every 6h
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'flex-start',
              flexDirection: 'column',
              gap: 4,
              padding: '10px 16px',
              background: 'rgba(212,175,55,0.04)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📅</span>
              <span style={{ color: 'rgba(240,237,232,0.6)' }}>
                Showing data from: <strong style={{ color: '#f5f5f5' }}>Last 30 days</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{ color: 'rgba(240,237,232,0.4)' }}>
                Real-time (6h updates) —{' '}
                <button
                  onClick={() => window.location.assign('/pricing')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#d4af37',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Unlock Real-Time Data →
                </button>
              </span>
            </div>
          </div>
        )}

        {/* ── Hero Stats Bar ──────────────────────────────────────────── */}
        <HeroStatsBar products={products} total={total} lastUpdatedISO={lastUpdatedISO} />

        {/* ── Trending Now Bar ────────────────────────────────────────── */}
        <TrendingNowBar products={topProducts} onSelect={setSelectedProduct} />

        {/* ── Market Signals Bar ─────────────────────────────────────── */}
        <MarketSignalsBar products={products} />

        {/* ── Usage Counter + Upgrade Banner ─────────────────────────── */}
        <UsageCounter />
        <UpgradePromptBanner />

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 28,
            background: C.glass,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 4,
            width: 'fit-content',
          }}
        >
          {[
            { id: 'all', label: 'All Products', icon: <Layers size={13} /> },
            {
              id: 'watchlist',
              label: 'My Watchlist',
              icon: <Heart size={13} />,
              count: watchlistIds.size,
            },
            { id: 'category_intel', label: 'Category Intelligence', icon: <BarChart2 size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'all' | 'watchlist' | 'category_intel')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 11,
                background: activeTab === tab.id ? C.gold : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#000' : C.sub,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
              {'count' in tab && (tab.count ?? 0) > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : C.goldBg,
                    color: activeTab === tab.id ? '#000' : C.gold,
                    padding: '1px 6px',
                    borderRadius: 20,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Sidebar + Content Flex Layout ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Filter Sidebar (desktop only) ──────────────────────────── */}
        <FilterSidebar
          platformFilter={platformFilter} setPlatformFilter={setPlatformFilter}
          categories={categories} category={category} setCategory={setCategory}
          trend={trend} setTrend={setTrend}
          competition={competition} setCompetition={setCompetition}
          sort={sort} setSort={setSort}
          minMonthlyRevenue={minMonthlyRevenue} setMinMonthlyRevenue={setMinMonthlyRevenue}
          hideSaturated={hideSaturated} setHideSaturated={setHideSaturated}
          activeFilters={activeFilters}
          onClearAll={() => { setCategory('All'); setTrend('All'); setCompetition('All'); setSearch(''); setSort('Revenue'); setMinMonthlyRevenue(0); setPlatformFilter(['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU']); }}
        />

        {/* ── Main Content ───────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* ── Niche Search Engine ─────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <div style={{ marginBottom: 24 }}>
            {/* Search input */}
            <form
              onSubmit={(e) => { e.preventDefault(); void handleNicheSearch(); }}
              style={{ display: 'flex', gap: 10, marginBottom: 10 }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                <input
                  value={nicheQuery}
                  onChange={(e) => setNicheQuery(e.target.value)}
                  placeholder='Search any product or niche... e.g. "posture corrector"'
                  disabled={nicheSearching}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 40px', borderRadius: 12, background: C.glass, border: `1px solid ${nicheQuery ? C.goldBorder : C.glassBorder}`, color: C.text, fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = C.gold; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = nicheQuery ? C.goldBorder : C.border; }}
                />
              </div>
              <button
                type="submit"
                disabled={nicheSearching || !nicheQuery.trim()}
                style={{ padding: '12px 22px', borderRadius: 12, background: C.gold, border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: nicheSearching || !nicheQuery.trim() ? 'not-allowed' : 'pointer', opacity: nicheSearching || !nicheQuery.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {nicheSearching ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Searching…</> : <><Search size={13} /> Find Products</>}
              </button>
            </form>

            {/* Searching state */}
            {nicheSearching && (
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>
                🔍 Searching TikTok Shop, AliExpress, Alibaba, Amazon AU…
              </div>
            )}

            {/* Recent searches */}
            {userId && recentSearches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Recent:</span>
                {recentSearches.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setNicheQuery(q); void handleNicheSearch(q); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: C.glass, border: `1px solid ${C.border}`, color: C.sub, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                  >
                    {q}
                    <span
                      onClick={(e) => { e.stopPropagation(); setRecentSearches((prev) => prev.filter((r) => r !== q)); }}
                      style={{ color: C.muted, fontWeight: 700, lineHeight: 1 }}
                    >×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular searches */}
            {popularSearches.length > 0 && (
              <div style={{ fontSize: 12, color: C.muted }}>
                <span style={{ fontWeight: 700, color: C.sub }}>Trending searches:</span>{' '}
                {popularSearches.map((q, i) => (
                  <span key={q}>
                    <button
                      onClick={() => { setNicheQuery(q); void handleNicheSearch(q); }}
                      style={{ background: 'none', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}
                    >
                      {q}
                    </button>
                    {i < popularSearches.length - 1 && <span style={{ color: C.muted }}> · </span>}
                  </span>
                ))}
              </div>
            )}

            {/* Search Results */}
            {searchResults !== null && !nicheSearching && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: C.text }}>
                    Search Results
                  </span>
                  <span style={{ fontSize: 11, color: C.sub, background: C.glass, border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: 20 }}>
                    {searchResults.length} products
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU'].map((src) => (
                      <span key={src} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(212,175,55,0.12)', color: C.gold, border: `1px solid ${C.goldBorder}` }}>
                        {src === 'TikTok Shop' ? 'TT' : src === 'AliExpress' ? 'Ali' : src === 'Alibaba' ? 'Baba' : 'Amz'}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => setSearchResults(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>
                    <X size={14} />
                  </button>
                </div>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '40px 24px', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 14, textAlign: 'center' }}>
                    <Search size={32} style={{ color: C.muted, marginBottom: 12, opacity: 0.5 }} />
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>No products found</p>
                    <p style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>Try a different category or search term</p>
                    <button onClick={() => setSearchResults(null)} style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                      ← Clear Search
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                          <tr style={{ background: C.glass }}>
                            {['#', 'Product', 'Est. Revenue/mo', 'Growth %', 'Platforms', 'Competition', '→'].map((h) => (
                              <th key={h} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((p, idx) => {
                            const monthly = p.est_monthly_revenue_aud ?? (p.est_daily_revenue_aud ? p.est_daily_revenue_aud * 30 : null);
                            const growth = p.revenue_growth_pct;
                            const plats = p.platforms ?? [p.platform];
                            return (
                              <tr key={p.id ?? idx} onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer', borderBottom: `1px solid ${C.border}` }} onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = C.cardHover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                <td style={{ padding: '12px', fontSize: 12, color: C.muted, fontWeight: 700 }}>{idx + 1}</td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                                    {p.image_url ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: C.glass, border: `1px solid ${C.border}`, flexShrink: 0 }} />}
                                    <div>
                                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: C.text }}>{p.product_title}</div>
                                      <div style={{ fontSize: 11, color: C.sub }}>{p.category}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800, color: C.gold, whiteSpace: 'nowrap' }}>
                                  {monthly != null ? `$${(monthly / 1000).toFixed(0)}k/mo` : '—'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {growth != null ? (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: growth >= 0 ? C.green : C.red, background: growth >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${growth >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '2px 8px', borderRadius: 20 }}>
                                      {growth >= 0 ? '+' : ''}{growth}% {growth >= 0 ? '↑' : '↓'}
                                    </span>
                                  ) : <span style={{ color: C.muted, fontSize: 12 }}>—</span>}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    {plats.map((pl) => (
                                      <span key={pl} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: pl.includes('TikTok') ? 'rgba(255,0,80,0.12)' : pl.includes('Amazon') ? 'rgba(255,153,0,0.12)' : 'rgba(255,106,0,0.12)', color: pl.includes('TikTok') ? '#ff0050' : pl.includes('Amazon') ? '#ff9900' : '#ff6a00', border: `1px solid ${pl.includes('TikTok') ? 'rgba(255,0,80,0.3)' : pl.includes('Amazon') ? 'rgba(255,153,0,0.3)' : 'rgba(255,106,0,0.3)'}` }}>
                                        {pl.includes('TikTok') ? 'TT' : pl.includes('Amazon') ? 'Amz' : pl.includes('Alibaba') ? 'Baba' : 'Ali'}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <CompetitionDot level={p.competition_level} />
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <button onClick={() => setSelectedProduct(p)} style={{ width: 28, height: 28, borderRadius: 8, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>→</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
                      Revenue estimates based on platform search signals. Actual results vary.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Top 5 Rankings (all tab) ───────────────────────────────────── */}
        {activeTab === 'all' && topProducts.length > 0 && (
          <Top5Rankings products={topProducts} onSelect={setSelectedProduct} />
        )}

        {/* ── Filter Bar ────────────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: filtersOpen ? C.goldBg : C.glass,
                  border: `1px solid ${filtersOpen ? C.goldBorder : C.border}`,
                  color: filtersOpen ? C.gold : C.sub,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Filter size={12} />
                Filters
                {activeFilters > 0 && (
                  <span
                    style={{
                      background: C.gold,
                      color: '#000',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 20,
                    }}
                  >
                    {activeFilters}
                  </span>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Search
                    size={13}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: C.muted,
                    }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    style={{
                      padding: '8px 12px 8px 30px',
                      borderRadius: 10,
                      background: C.glass,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      fontSize: 12,
                      outline: 'none',
                      width: 160,
                    }}
                  />
                </div>

                {/* Export All CSV — locked for free users */}
                <button
                  onClick={() => {
                    if (!isPro) {
                      toast(
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#f5f5f5' }}>🔒 Pro feature</span>
                          <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.6)' }}>
                            Export to CSV is a Pro feature. Upgrade to export unlimited products to Shopify, Google Sheets, or CSV.
                          </span>
                          <button
                            onClick={() => window.location.assign('/pricing')}
                            style={{ background: '#d4af37', color: '#000', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}
                          >
                            Upgrade Now →
                          </button>
                        </div>,
                        { duration: 5000, style: { background: '#0d0f15', border: '1px solid rgba(212,175,55,0.3)', color: '#f5f5f5' } }
                      );
                      return;
                    }
                    // Pro: download all products as CSV
                    const headers = ['Title', 'Category', 'Platform', 'Revenue/mo', 'Score', 'Competition', 'AU Relevance'];
                    const rows = products.map((p) => [
                      p.product_title,
                      p.category ?? '',
                      p.platform,
                      p.est_monthly_revenue_aud ?? '',
                      p.winning_score,
                      p.competition_level ?? '',
                      p.au_relevance,
                    ]);
                    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                    a.download = 'majorka-winning-products.csv';
                    a.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: isPro ? C.goldBg : C.glass,
                    border: `1px solid ${isPro ? C.goldBorder : C.border}`,
                    color: isPro ? C.gold : C.sub,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isPro ? '↓' : '🔒'} Export All (CSV)
                </button>

                {/* View toggle */}
                <div
                  style={{
                    display: 'flex',
                    background: C.glass,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {(
                    [
                      { v: 'cards', icon: <Grid3X3 size={14} /> },
                      { v: 'table', icon: <Table2 size={14} /> },
                    ] as const
                  ).map(({ v, icon }) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        width: 36,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: view === v ? C.goldBg : 'transparent',
                        border: 'none',
                        color: view === v ? C.gold : C.sub,
                        cursor: 'pointer',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtersOpen && (
              <div
                style={{
                  background: C.glass,
                  border: `1px solid ${C.glassBorder}`,
                  borderRadius: 16,
                  padding: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 20,
                }}
              >
                {/* Min Monthly Revenue */}
                <div style={{ flex: '1 1 200px' }}>
                  <div style={filterLabelStyle}>Min Monthly Revenue: ${minMonthlyRevenue === 0 ? 'Any' : `${(minMonthlyRevenue / 1000).toFixed(0)}k`}</div>
                  <input
                    type="range"
                    min={0}
                    max={500000}
                    step={10000}
                    value={minMonthlyRevenue}
                    onChange={(e) => setMinMonthlyRevenue(Number(e.target.value))}
                    style={{ width: '100%', accentColor: C.gold }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 2 }}>
                    <span>$0</span><span>$250k</span><span>$500k</span>
                  </div>
                </div>

                {/* Platform */}
                <div style={{ flex: '1 1 180px' }}>
                  <div style={filterLabelStyle}>Platform</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU'] as const).map((pl) => (
                      <label key={pl} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: C.text }}>
                        <input
                          type="checkbox"
                          checked={platformFilter.includes(pl)}
                          onChange={() => {
                            setPlatformFilter((prev) =>
                              prev.includes(pl) ? prev.filter((p) => p !== pl) : [...prev, pl],
                            );
                          }}
                          style={{ accentColor: C.gold, width: 13, height: 13 }}
                        />
                        {pl}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Competition */}
                <div style={{ flex: '1 1 160px' }}>
                  <div style={filterLabelStyle}>Competition</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['All', 'Low', 'Medium', 'High'].map((c) => (
                      <Chip key={c} active={competition === c} onClick={() => setCompetition(c)}>
                        {c}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Trend */}
                <div style={{ flex: '1 1 160px' }}>
                  <div style={filterLabelStyle}>Trend</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(['All', 'Exploding', 'Growing', 'Stable'] as const).map((t) => {
                      const meta =
                        t !== 'All' ? TREND_MAP[t.toLowerCase() as Trend] : null;
                      return (
                        <Chip key={t} active={trend === t} onClick={() => setTrend(t)}>
                          {meta ? `${meta.emoji} ${t}` : t}
                        </Chip>
                      );
                    })}
                  </div>
                </div>

                {/* Category */}
                <div style={{ flex: '1 1 200px' }}>
                  <div style={filterLabelStyle}>Category</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {categories.map((c) => (
                      <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                        {c}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div style={{ flex: '1 1 140px' }}>
                  <div style={filterLabelStyle}>Sort by</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Revenue', 'Growth %', 'Most Sold', 'Score', 'Newest'].map((s) => (
                      <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Hide Saturated */}
                <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 18 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: C.text }}>
                    <div
                      onClick={() => setHideSaturated((v) => !v)}
                      style={{ width: 36, height: 20, borderRadius: 10, background: hideSaturated ? C.gold : C.glass, border: `1px solid ${hideSaturated ? C.gold : C.border}`, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: hideSaturated ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: hideSaturated ? '#000' : C.muted, transition: 'left 0.2s' }} />
                    </div>
                    <span>Hide Saturated</span>
                  </label>
                  <span style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>Hides high competition + &lt;5% growth</span>
                </div>

                {/* Clear */}
                {activeFilters > 0 && (
                  <button
                    onClick={() => {
                      setCategory('All');
                      setTrend('All');
                      setCompetition('All');
                      setSearch('');
                      setSort('Revenue');
                      setMinMonthlyRevenue(0);
                      setPlatformFilter(['TikTok Shop', 'AliExpress', 'Alibaba', 'Amazon AU']);
                    }}
                    style={{
                      alignSelf: 'flex-end',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '7px 12px',
                      borderRadius: 10,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: C.red,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={11} /> Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── All Products ───────────────────────────────────────────────── */}
        {activeTab === 'all' &&
          (view === 'cards' ? (
            <CardGrid
              products={products}
              loading={loading}
              onSelect={setSelectedProduct}
              onToggleWatchlist={(p) => void toggleWatchlist(p)}
              watchlistIds={watchlistIds}
              page={page}
              setPage={setPage}
              total={total}
              onImportShopify={(p) => void importToShopify(p)}
              onToggleCompare={toggleCompare}
              compareIds={compareIds}
              onSpyAds={setSpyAdsProduct}
              onFullReport={setFullReportProduct}
            />
          ) : (
            <TableView
              products={products}
              loading={loading}
              onSelect={setSelectedProduct}
              onToggleWatchlist={(p) => void toggleWatchlist(p)}
              watchlistIds={watchlistIds}
              page={page}
              setPage={setPage}
              total={total}
            />
          ))}

        {/* ── Watchlist ──────────────────────────────────────────────────── */}
        {activeTab === 'watchlist' &&
          (watchlistProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '72px 24px',
                background: C.glass,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>❤️</div>
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.text,
                  margin: '0 0 8px',
                }}
              >
                No saved products yet
              </h3>
              <p style={{ fontSize: 13, color: C.sub, margin: '0 0 20px' }}>
                {userId
                  ? 'Hit ❤️ on any product to save it to your watchlist'
                  : 'Sign in to save products to your watchlist'}
              </p>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  background: C.gold,
                  border: 'none',
                  color: '#000',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <CardGrid
              products={watchlistProducts}
              loading={false}
              onSelect={setSelectedProduct}
              onToggleWatchlist={(p) => void toggleWatchlist(p)}
              watchlistIds={watchlistIds}
              page={1}
              setPage={() => {}}
              total={watchlistProducts.length}
              pageOffset={0}
              onImportShopify={(p) => void importToShopify(p)}
              onToggleCompare={toggleCompare}
              compareIds={compareIds}
              onSpyAds={setSpyAdsProduct}
              onFullReport={setFullReportProduct}
            />
          ))}

        {/* ── Category Intelligence ──────────────────────────────────── */}
        {activeTab === 'category_intel' && (
          <CategoryIntelligenceTable products={[...products, ...SEEDED_PRODUCTS].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)} />
        )}

        </div>{/* end Main Content */}
        </div>{/* end Sidebar + Content Flex */}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <DetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        watchlistIds={watchlistIds}
        onToggleWatchlist={(p) => void toggleWatchlist(p)}
        token={token}
      />

      {/* ── Spy Ads Modal ────────────────────────────────────────────────── */}
      {spyAdsProduct && (
        <SpyAdsModal product={spyAdsProduct} onClose={() => setSpyAdsProduct(null)} />
      )}

      {/* ── Full Report Modal ────────────────────────────────────────────── */}
      {fullReportProduct && (
        <FullReportModal
          product={fullReportProduct}
          onClose={() => setFullReportProduct(null)}
          watchlistIds={watchlistIds}
          onToggleWatchlist={(p) => void toggleWatchlist(p)}
          allProducts={[...products, ...SEEDED_PRODUCTS]}
        />
      )}

      {/* ── Compare floating bar ───────────────────────────────────────────── */}
      {compareIds.size >= 2 && !showCompare && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 990,
            background: 'linear-gradient(135deg, #1a1600, #0d1017)',
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 16,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.1)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {compareIds.size} products selected
          </span>
          <button
            onClick={() => setShowCompare(true)}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              background: C.gold,
              border: 'none',
              color: '#000',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Compare Selected →
          </button>
          <button
            onClick={() => setCompareIds(new Set())}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.sub,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Compare Modal ──────────────────────────────────────────────────── */}
      {showCompare && (
        <ProductCompareModal
          products={[...products, ...watchlistProducts, ...SEEDED_PRODUCTS].filter(
            (p, i, arr) => compareIds.has(p.id) && arr.findIndex((x) => x.id === p.id) === i,
          )}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const filterLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
};

// ── Error Boundary ────────────────────────────────────────────────────────────

class WPErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WinningProducts crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: '#d4af37',
            fontFamily: 'Syne, sans-serif',
            minHeight: '100vh',
            background: '#080a0e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, marginBottom: 8, color: '#f5f5f5' }}>
            Something went wrong loading products
          </div>
          <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 24 }}>
            Check your connection and try reloading.
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              background: '#d4af37',
              color: '#080a0e',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WinningProductsWithBoundary = () => (
  <WPErrorBoundary>
    <WinningProducts />
  </WPErrorBoundary>
);

export default WinningProductsWithBoundary;
