import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Search, List, LayoutGrid, ChevronDown, ChevronUp, ChevronsUpDown, Heart,
  ExternalLink, Zap, Flame, ShoppingBag, Store, Calculator, ChevronRight,
  Clock, TrendingUp, DollarSign, Award, Bookmark, Bell, X, Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import { useProducts, type OrderByColumn, type Product } from '@/hooks/useProducts';
import { useFavourites } from '@/hooks/useFavourites';
import { useTracking } from '@/hooks/useTracking';
import { useLists } from '@/hooks/useLists';
import { useAESearch, type AELiveProduct } from '@/hooks/useAESearch';
import { shortenCategory, fmtK } from '@/lib/categoryColor';
import { proxyImage } from '@/lib/imageProxy';

/* ══════════════════════════════════════════════════════════════
   Types + constants
   ══════════════════════════════════════════════════════════════ */

type SmartTabKey = 'all' | 'new' | 'trending' | 'highmargin' | 'top' | 'hot-now' | 'high-volume' | 'under-10' | 'saved';

const SMART_TABS: {
  key: SmartTabKey;
  label: string;
  Icon: LucideIcon;
  iconClass?: string;
  /** Category-identity colour used for the left border + status dot when active. */
  dot: string;
}[] = [
  { key: 'all',         label: 'All products',  Icon: LayoutGrid,  dot: '#ffffff' },
  { key: 'hot-now',     label: 'Hot Now',       Icon: Flame,       iconClass: 'text-orange-400',  dot: '#f97316' },
  { key: 'trending',    label: 'Trending',      Icon: TrendingUp,  iconClass: 'text-amber',       dot: '#f59e0b' },
  { key: 'high-volume', label: 'High Volume',   Icon: ShoppingBag, iconClass: 'text-accent-hover', dot: '#3B82F6' },
  { key: 'highmargin',  label: 'High Profit',   Icon: DollarSign,  iconClass: 'text-green',       dot: '#10b981' },
  { key: 'under-10',    label: 'Under $10',     Icon: DollarSign,  iconClass: 'text-cyan-400',    dot: '#22d3ee' },
  { key: 'top',         label: 'Score 90+',     Icon: Award,       iconClass: 'text-[#eab308]',   dot: '#eab308' },
  { key: 'new',         label: 'New',           Icon: Clock,                                      dot: '#a855f7' },
  { key: 'saved',       label: 'Saved',         Icon: Bookmark,                                   dot: '#ec4899' },
];

type SortKey = OrderByColumn | 'velocity';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'sold_count',            label: 'Most orders' },
  { key: 'velocity',              label: 'Fastest growing' },
  { key: 'winning_score',         label: 'Highest score' },
  { key: 'est_daily_revenue_aud', label: 'Highest revenue' },
  { key: 'price_asc',             label: 'Price: low to high' },
  { key: 'price_desc',            label: 'Price: high to low' },
  { key: 'created_at',            label: 'Newest first' },
  { key: 'orders_asc',            label: 'Orders: low to high' },
];

/**
 * Velocity = estimated daily order rate over the product's lifetime.
 * Simple proxy: sold_count / days_since_created.
 */
function dailyVelocity(p: Product): number {
  const orders = p.sold_count ?? 0;
  if (!orders) return 0;
  const days = Math.max(1, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000));
  return orders / days;
}

function velocityBadge(p: Product): { label: string; color: string; icon: string } | null {
  const rate = Math.round(dailyVelocity(p));
  if (rate <= 0) return null;
  const label = rate >= 1000 ? `${Math.round(rate / 1000)}k/day` : `${rate}/day`;
  if (rate > 500) return { label: `~${label}`, color: 'text-green', icon: '↑' };
  if (rate > 100) return { label: `~${label}`, color: 'text-amber', icon: '↗' };
  return { label: `~${label}`, color: 'text-muted', icon: '→' };
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return 9999;
  return Math.floor((Date.now() - ts) / 86400000);
}

/**
 * Threshold for the NEW badge + Recently Added tab. 30-day window
 * per the latest audit spec.
 */
const NEW_DAYS_THRESHOLD = 30;

// Items younger than this get a "Just in" highlight — lines up with the 6h
// DataHub ingest cron so fresh cron output is visible immediately.
const JUST_ADDED_HOURS = 6;

function hoursSince(iso?: string | null): number {
  if (!iso) return 9999;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return 9999;
  return (Date.now() - ts) / 3600000;
}

/**
 * Live AliExpress search toggle. Enabled now that the AE Affiliate API
 * endpoint (/api/products/ae-live-search) is confirmed working with the
 * new Apify STARTER plan token. Searches the full AliExpress catalogue
 * in real time — not limited to what's in our local DB.
 */
const LIVE_SEARCH_ENABLED = true;

/**
 * Monthly revenue estimator.
 * Prefers est_daily_revenue_aud × 30 when the scoring pipeline has
 * populated it. Otherwise computes from lifetime orders × price:
 *   (sold_count / 365) × price × 30  ≈  monthly revenue proxy
 * This matches the spec formula and gives every row a meaningful
 * value instead of "—".
 */
function monthlyRevenue(p: Product): number | null {
  const daily = p.est_daily_revenue_aud;
  if (daily != null && daily > 0) return daily * 30;
  const orders = p.sold_count ?? 0;
  const price = p.price_aud != null ? Number(p.price_aud) : 0;
  if (orders > 0 && price > 0) {
    return Math.round((orders / 365) * price * 30);
  }
  return null;
}

/**
 * Market Revenue estimate — approximates the TOTAL monthly market across
 * all sellers for this product. Majorka's retail price in the DB is
 * typically the landed cost; multiply by 3 to approximate retail, then
 * by monthly order velocity.
 *
 *   (sold_count / 365) × (price_aud × 3) × 30
 *
 * This is the "size of the prize" metric. Always shown with a ~ prefix
 * because it's an approximation.
 */
function marketRevenue(p: Product): number | null {
  const orders = p.sold_count ?? 0;
  const price = p.price_aud != null ? Number(p.price_aud) : 0;
  if (orders <= 0 || price <= 0) return null;
  const retailPrice = price * 3;
  return Math.round((orders / 365) * retailPrice * 30);
}

/**
 * Returns 2-3 "why this product wins" bullet points based purely on
 * real DB fields — no AI calls, no hallucinated reasons. Each reason
 * maps to a concrete threshold crossing, so operators can trust them.
 */
/**
 * Launch Readiness Score — synthesises 4 signals into a single 0-100
 * number. The "should I sell this?" answer in one glance.
 *   Demand (orders):    30 pts
 *   AI score:           30 pts
 *   Margin potential:   20 pts (low landed cost = high)
 *   Freshness:          20 pts (newer = early-mover advantage)
 */
interface LaunchReadiness {
  score: number;
  tier: 'launch' | 'strong' | 'test' | 'research';
  label: string;
  color: string;
  bg: string;
  border: string;
}
function launchReadiness(p: Product): LaunchReadiness {
  const orders = Number(p.sold_count ?? 0);
  const score = Number(p.winning_score ?? 0);
  const price = Number(p.price_aud ?? 999);
  const days = p.created_at ? daysSince(p.created_at) : 9999;

  const demandPts = orders > 200000 ? 30 : orders > 100000 ? 22 : orders > 50000 ? 15 : orders > 10000 ? 8 : 3;
  const scorePts = Math.round((score / 100) * 30);
  const marginPts = price < 8 ? 20 : price < 15 ? 16 : price < 25 ? 12 : 6;
  const freshPts = days < 7 ? 20 : days < 30 ? 15 : days < 90 ? 10 : 5;
  const total = Math.min(100, demandPts + scorePts + marginPts + freshPts);

  if (total >= 80) return { score: total, tier: 'launch', label: 'Launch now', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' };
  if (total >= 60) return { score: total, tier: 'strong', label: 'Strong bet',  color: '#cccccc', bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.25)' };
  if (total >= 40) return { score: total, tier: 'test',   label: 'Test first',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
  return { score: total, tier: 'research', label: 'Research more', color: '#71717a', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' };
}

function getWinReasons(p: Product): string[] {
  const reasons: string[] = [];
  const orders = Number(p.sold_count ?? 0);
  const price = Number(p.price_aud ?? 0);
  const score = Number(p.winning_score ?? 0);
  const days = p.created_at ? daysSince(p.created_at) : 9999;

  if (orders > 100000) {
    reasons.push(`${fmtK(orders)} total orders — proven mass-market demand`);
  } else if (orders > 10000) {
    reasons.push(`${fmtK(orders)} orders — strong mid-market traction`);
  }
  if (price > 0 && price < 10) {
    reasons.push(`Under $${Math.ceil(price)} landed cost — excellent margin potential at 3× markup`);
  } else if (price > 0 && price < 20) {
    reasons.push(`$${price.toFixed(2)} landed — healthy margin potential at 3× markup`);
  }
  if (score >= 90) {
    reasons.push(`AI score ${Math.round(score)}/100 — top-tier combined signal`);
  } else if (score >= 75) {
    reasons.push(`AI score ${Math.round(score)}/100 — strong combined signal`);
  }
  if (days < 30 && orders > 5000) {
    reasons.push(`Added ${days}d ago with ${fmtK(orders)} orders — early-mover edge still available`);
  }
  if (orders > 50000 && price > 0 && price < 15) {
    reasons.push(`High volume + low cost — strong profit per unit at scale`);
  }
  return reasons.slice(0, 3);
}

/**
 * Rough competition-level heuristic from order volume. Low order counts
 * = fewer competing stores (first-mover territory). High counts = more
 * stores selling it. Heuristic only — not based on active seller scans.
 */
function competitionLevel(orders: number): { label: string; color: string; bg: string; tip: string } {
  if (orders < 10000) return { label: 'Low',      color: 'text-green',  bg: 'bg-green/10',     tip: 'Few stores — first-mover opportunity' };
  if (orders < 100000) return { label: 'Moderate', color: 'text-amber',  bg: 'bg-amber/10',     tip: 'Growing market — viable with strong ads' };
  return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', tip: 'Mature market — differentiate on creative and pricing' };
}

/**
 * Strips common AliExpress SEO garbage from a raw product title so the
 * result reads like a real DTC product name. Removes multi-variant
 * "1/2/3pcs" prefixes, "For iPhone 15/14/13" device lists, collapses
 * whitespace, and caps at 60 chars.
 */
function cleanProductTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/\d+(?:\/\d+)+\s*(?:pcs|pc|pack|sets?)?/gi, '')
    .replace(/for\s+(?:iphone|samsung|xiaomi|huawei|pixel|oneplus)\s+[\d\s\/a-z]*?pro/gi, '')
    .replace(/for\s+(?:iphone|samsung|xiaomi|huawei|pixel|oneplus)\s+[\d\/\s]+/gi, '')
    .replace(/[-–—]\s*new\s+2024|-\s*2023/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/**
 * Exports a product list to CSV and triggers a browser download.
 * Columns: Title, Category, Score, Orders, Price (AUD), Est Rev/mo, Added.
 */
function exportToCSV(products: Product[]): void {
  const headers = ['Title', 'Category', 'Score', 'Orders', 'Price (AUD)', 'Est Revenue/mo', 'Added'];
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const rows = products.map((p) => [
    escape(p.product_title ?? ''),
    escape(p.category ?? ''),
    Math.round(p.winning_score ?? 0),
    p.sold_count ?? 0,
    p.price_aud ?? '',
    p.est_daily_revenue_aud != null ? Math.round(Number(p.est_daily_revenue_aud) * 30) : '',
    p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `majorka-products-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${products.length} products to CSV`);
}

function timeAgoShort(iso: string | null): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const days = Math.round((Date.now() - ts) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.round(days / 30)} months ago`;
}

function readInitialParams(): { tab: SmartTabKey; search: string } {
  if (typeof window === 'undefined') return { tab: 'all', search: '' };
  const params = new URLSearchParams(window.location.search);
  const t = params.get('tab');
  const validTabs: SmartTabKey[] = ['all', 'new', 'trending', 'highmargin', 'top', 'hot-now', 'high-volume', 'under-10', 'saved'];
  const tab = validTabs.includes(t as SmartTabKey) ? (t as SmartTabKey) : 'all';
  return { tab, search: params.get('search') ?? '' };
}

function scoreTierStyle(score: number): { backgroundColor: string; color: string } {
  if (score >= 90) return { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' };
  if (score >= 75) return { backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  if (score >= 50) return { backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316' };
  return               { backgroundColor: 'rgba(239,68,68,0.15)',  color: '#ef4444' };
}

function categoryColor(cat: string | null): { backgroundColor: string; color: string } {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('car') || c.includes('auto'))                                return { backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' };
  if (c.includes('phone') || c.includes('mobile'))                            return { backgroundColor: 'rgba(255,255,255,0.12)', color: '#cccccc' };
  if (c.includes('home') || c.includes('kitchen') || c.includes('household')) return { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' };
  if (c.includes('hair') || c.includes('beauty') || c.includes('wig'))        return { backgroundColor: 'rgba(236,72,153,0.12)', color: '#f472b6' };
  if (c.includes('hardware') || c.includes('tool'))                           return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  return { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' };
}

/* ══════════════════════════════════════════════════════════════
   ScoreBadge — 32x32 square, Math.round, 4-tier colour
   ══════════════════════════════════════════════════════════════ */

function ScoreBadge({ score, size = 32 }: { score: number; size?: number }) {
  const rounded = Math.round(score);
  if (!rounded) return <span className="text-xs text-muted">—</span>;
  const isTopTier = rounded >= 90;
  return (
    <span
      className="inline-flex items-center justify-center rounded font-bold tabular-nums font-mono"
      style={{
        width: size,
        height: size,
        fontSize: size >= 32 ? 13 : 11,
        ...scoreTierStyle(rounded),
        ...(isTopTier ? { boxShadow: '0 0 0 1px rgba(212,175,55,0.5)' } : {}),
      }}
    >
      {rounded}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   ListPickerButton — heart icon that opens a Radix Popover listing
   all of the user's saved lists. Clicking a list toggles this
   product in/out of that list. "+ New list" opens a prompt().
   ══════════════════════════════════════════════════════════════ */

interface ListPickerButtonProps {
  product: Product;
  lists: ReturnType<typeof useLists>;
  size?: number;
  className?: string;
}

function ListPickerButton({ product, lists, size = 15, className = '' }: ListPickerButtonProps) {
  const inAnyList = lists.isInAnyList(product.id);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          aria-label="Save to list"
          className={`inline-flex items-center justify-center p-1.5 rounded-md transition-colors cursor-pointer ${
            inAnyList ? 'text-accent' : 'text-muted hover:text-text hover:bg-white/[0.08]'
          } ${className}`}
        >
          <Heart size={size} strokeWidth={1.75} fill={inAnyList ? 'currentColor' : 'none'} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          onClick={(e) => e.stopPropagation()}
          sideOffset={6}
          align="end"
          className="z-[120] bg-raised border border-white/10 rounded-lg p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] min-w-[220px] font-body"
        >
          <p className="text-[11px] text-muted uppercase tracking-wider mb-2 px-1">Save to list</p>
          <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
            {lists.lists.map((list) => {
              const inList = list.productIds.includes(String(product.id));
              return (
                <button
                  key={list.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inList) {
                      lists.removeFromList(list.id, String(product.id));
                      toast(`Removed from "${list.name}"`);
                    } else {
                      lists.addToList(list.id, product);
                      toast.success(`Saved to "${list.name}"`);
                    }
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-body hover:text-text hover:bg-white/[0.05] rounded-lg transition-colors text-left"
                >
                  <span className={`text-[11px] shrink-0 w-3 ${inList ? 'text-accent' : 'text-muted'}`}>
                    {inList ? '✓' : '○'}
                  </span>
                  <span className="truncate flex-1">{list.name}</span>
                  <span className="text-[10px] text-muted tabular-nums shrink-0">
                    {list.productIds.length}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-white/[0.06] mt-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const name = window.prompt('List name:');
                if (name && name.trim()) {
                  const created = lists.createList(name.trim());
                  lists.addToList(created.id, product);
                  toast.success(`Saved to "${created.name}"`);
                }
              }}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors"
            >
              + New list
            </button>
          </div>
          <Popover.Arrow className="fill-raised" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ══════════════════════════════════════════════════════════════
   FilterPill with dropdown popover
   ══════════════════════════════════════════════════════════════ */

interface FilterPillProps {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
}

function FilterPill({ label, active, open, onToggle, onClose, onClear, children }: FilterPillProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border whitespace-nowrap ${
          active
            ? 'bg-accent/15 border-accent text-accent-hover'
            : 'bg-card border-white/10 text-body hover:border-white/20'
        }`}
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />}
        <span>{label}</span>
        {active && onClear ? (
          <span
            role="button"
            aria-label="Clear filter"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-accent-hover text-xs font-semibold cursor-pointer ml-0.5"
          >
            ×
          </span>
        ) : (
          <ChevronDown size={12} className="text-muted" strokeWidth={2} />
        )}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-raised border border-white/[0.12] rounded-lg p-4 min-w-[220px] shadow-hover">
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Product detail sheet — Radix Dialog-as-right-Sheet
   ══════════════════════════════════════════════════════════════ */

function ProductSheet({
  product,
  open,
  onOpenChange,
  navigate,
  onToggleFav,
  isFav,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  navigate: (path: string) => void;
  onToggleFav: (p: Product) => Promise<void> | void;
  isFav: boolean;
}) {
  const { isTracked, track, untrack } = useTracking();
  const isTrackedNow = product ? isTracked(product.id) : false;
  const [calcOpen, setCalcOpen] = useState(false);
  const [sellPrice,  setSellPrice]  = useState<number>(0);
  const [landedCost, setLandedCost] = useState<number>(0);
  const [shipping,   setShipping]   = useState<number>(5);
  const [feePct,     setFeePct]     = useState<number>(5);

  // Reset calc inputs whenever a new product opens
  useEffect(() => {
    if (!product) return;
    const base = product.price_aud != null ? Number(product.price_aud) : 0;
    setSellPrice(Math.round(base * 3 * 100) / 100);
    setLandedCost(base);
    setShipping(5);
    setFeePct(5);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return null;
  const score = Math.round(product.winning_score ?? 0);
  const orders = product.sold_count ?? 0;
  const price = product.price_aud != null ? Number(product.price_aud) : null;
  const estMonthly = monthlyRevenue(product);
  const marketRev = marketRevenue(product);
  const aliHref = (product as Product & { aliexpress_url?: string }).aliexpress_url ?? product.product_url ?? null;

  function handleToggleTrack() {
    if (!product) return;
    if (isTrackedNow) {
      untrack(product.id);
      toast('Stopped tracking');
      return;
    }
    const result = track(product);
    if (result.ok) {
      toast.success('Tracking this product');
    } else if (result.reason === 'already') {
      toast('Already tracked');
    } else {
      toast.error('Tracking limit reached (20). Upgrade to Scale for unlimited.');
    }
  }

  const grossProfit = sellPrice - landedCost - shipping;
  const netAfterFees = grossProfit - (sellPrice * (feePct / 100));
  const marginPct = sellPrice > 0 ? (netAfterFees / sellPrice) * 100 : 0;
  const breakEvenRoas = grossProfit > 0 ? sellPrice / grossProfit : null;
  const maxCpa = grossProfit > 0 ? grossProfit - (sellPrice * (feePct / 100)) : null;
  const profitColor = grossProfit >= 0 ? 'text-green' : 'text-red-400';
  const marginTier = marginPct >= 30 ? 'text-green' : marginPct >= 15 ? 'text-amber' : 'text-red-400';

  function handleCreateAd() {
    if (!product) return;
    sessionStorage.setItem('majorka_ad_product', JSON.stringify({
      id: product.id,
      title: product.product_title,
      image: product.image_url,
      price: product.price_aud,
    }));
    onOpenChange(false);
    navigate('/app/ads-studio');
    toast.success('Product loaded into Ads Studio');
  }

  function handleImportToStore() {
    if (!product) return;
    const landedCost = Number(product.price_aud ?? 0);
    const suggestedSell = Math.round(landedCost * 3 * 100) / 100;
    const orders = product.sold_count ?? 0;
    const ordersBand = orders >= 1000 ? `${Math.round(orders / 1000)}K+` : `${orders}`;
    const category = product.category || 'product';
    const description =
      `Premium ${category.toLowerCase()} trusted by ${ordersBand} customers worldwide. ` +
      `High-quality materials, fast shipping, and exceptional value — perfect for everyday use.`;
    sessionStorage.setItem('majorka_import_product', JSON.stringify({
      id: product.id,
      title: cleanProductTitle(product.product_title),
      rawTitle: product.product_title,
      image: product.image_url,
      price: suggestedSell,            // retail (3× markup)
      cost: landedCost,                // landed / AliExpress price
      description,
      category: product.category,
      score: product.winning_score,
      orders: product.sold_count,
      aliexpress_url: product.product_url,
    }));
    onOpenChange(false);
    navigate('/app/store-builder');
    toast.success(`Building store from "${cleanProductTitle(product.product_title).slice(0, 40)}"…`);
  }

  async function handleToggleSave() {
    if (!product) return;
    const wasFav = isFav;
    await onToggleFav(product);
    if (wasFav) toast('Removed from saved');
    else toast.success('Product saved');
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          style={{ overscrollBehavior: 'contain' }}
          className="fixed right-0 top-0 z-[100] h-screen w-full md:w-[420px] bg-surface border-l border-white/[0.08] overflow-y-auto flex flex-col font-body text-text shadow-[-20px_0_60px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:duration-300 data-[state=closed]:duration-200"
        >
          {/* Header — close only, title moves below image for clearer hierarchy */}
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              <span>Product detail</span>
              {product.category && (
                <>
                  <span className="text-white/20">/</span>
                  <span
                    className="inline-block px-1.5 py-0.5 rounded"
                    style={categoryColor(product.category)}
                  >
                    {shortenCategory(product.category)}
                  </span>
                </>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="w-11 h-11 flex items-center justify-center text-muted hover:text-text hover:bg-white/[0.08] transition-colors cursor-pointer rounded-md shrink-0"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </Dialog.Close>
          </div>

          {/* Image */}
          <div className="mx-4 mb-4">
            <div className="w-full h-[240px] rounded-md overflow-hidden bg-card border border-white/[0.08]">
              {product.image_url && (
                <img
                  src={proxyImage(product.image_url) ?? product.image_url}
                  alt={product.product_title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Title + meta — larger display typography for clearer hierarchy */}
          <div className="px-5 pb-4 border-b border-white/[0.06]">
            <Dialog.Title className="font-display text-xl font-bold text-text leading-tight mb-2">
              {product.product_title}
            </Dialog.Title>
            <div className="flex items-center gap-3 text-[11px] text-muted">
              {product.created_at && <span>Added {timeAgoShort(product.created_at)}</span>}
              {product.category && product.created_at && <span className="text-white/15">·</span>}
              {product.category && <span>{product.category}</span>}
            </div>
          </div>

          {/* Section label: key metrics */}
          <div className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
            Key metrics
          </div>

          {/* Stats grid */}
          {(() => {
            // EST REV display: exact value (green) if DB has est_daily_revenue_aud,
            // otherwise a computed estimate (amber, marked ~ and "est") so the user
            // knows it's derived from sold_count × price, not a real value.
            const hasRealRev = product.est_daily_revenue_aud != null && product.est_daily_revenue_aud > 0;
            const estRevLabel = hasRealRev ? 'Est Rev' : 'Est Rev (est.)';
            const estRevValue = estMonthly != null
              ? (hasRealRev
                  ? `$${Math.round(estMonthly).toLocaleString()}`
                  : `~$${Math.round(estMonthly).toLocaleString()}`)
              : '—';
            const estRevClass = estMonthly == null
              ? 'text-muted'
              : hasRealRev ? 'text-green' : 'text-amber';
            return (
          <div className="px-5 pb-4 border-b border-white/[0.06] grid grid-cols-2 gap-2">
            {[
              { label: 'Sell Price', value: price != null ? `$${price.toFixed(2)}` : '—', className: 'text-text' },
              { label: 'Orders',     value: orders ? orders.toLocaleString() : '—', className: orders ? 'text-green' : 'text-muted' },
              { label: 'AI Score',   value: score ? `${score}/100` : '—', className: 'text-accent-hover' },
              { label: estRevLabel,  value: estRevValue, className: estRevClass },
            ].map((cell) => (
              <div key={cell.label} className="bg-card border border-white/[0.06] rounded-md p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                  {cell.label}
                </div>
                <div className={`font-mono tabular-nums text-lg font-bold ${cell.className}`}>
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
            );
          })()}

          {/* Market Revenue — total market size estimate */}
          {marketRev != null && (
            <div className="mx-4 mt-3 p-4 bg-cyan-500/[0.05] border border-cyan-500/20 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                    Market Revenue / mo
                  </div>
                  <div className="text-2xl font-display font-bold text-cyan-300 tabular-nums">
                    ~${marketRev.toLocaleString()}
                  </div>
                </div>
                <span
                  className="text-[10px] text-cyan-400/70 max-w-[140px] text-right leading-snug"
                  title="Estimated total market revenue across all sellers for this product. Computed as (orders / 365) × (landed price × 3) × 30."
                >
                  Total across all sellers (~3x markup assumed)
                </span>
              </div>
            </div>
          )}

          {/* Track button */}
          <button
            onClick={handleToggleTrack}
            className={`mx-4 mt-3 mb-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors border ${
              isTrackedNow
                ? 'bg-amber/15 border-amber/40 text-amber hover:bg-amber/20'
                : 'bg-amber/10 border-amber/20 text-amber hover:bg-amber/15'
            }`}
          >
            <Bell size={14} strokeWidth={2} fill={isTrackedNow ? 'currentColor' : 'none'} />
            {isTrackedNow ? 'Tracking — click to stop' : 'Track this product'}
          </button>

          {/* 30-day trend placeholder */}
          <ProductHistoryChart productId={product.id} />

          {/* Similar products in the same category — visual only */}
          {product.category && (
            <SimilarProducts
              category={product.category}
              excludeId={String(product.id)}
            />
          )}

          <div className="p-4">
            {product.category && (
              <div className="text-xs text-body mb-2">
                <span className="text-muted">Category: </span>
                {product.category}
              </div>
            )}
            {product.created_at && (
              <div className="text-xs text-body mb-2">
                <span className="text-muted">Added: </span>
                {timeAgoShort(product.created_at)}
              </div>
            )}
            {(() => {
              const v = velocityBadge(product);
              if (!v) return null;
              return (
                <div className={`text-xs ${v.color} font-medium`}>
                  <span className="text-muted">Daily velocity: </span>
                  <span>{v.icon} {v.label.replace('~', '')} orders/day</span>
                </div>
              );
            })()}
          </div>

          {/* Launch Readiness Score — single number that answers "should I sell this?" */}
          {(() => {
            const lr = launchReadiness(product);
            return (
              <div
                className="mx-4 mb-4 rounded-lg p-4"
                style={{ background: lr.bg, border: `1px solid ${lr.border}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: lr.color }}>
                    Launch Readiness
                  </span>
                  <span className="text-[10px] text-white/30">What Majorka recommends</span>
                </div>
                <div className="flex items-end gap-3">
                  <div className="text-4xl font-display font-black tabular-nums" style={{ color: lr.color }}>
                    {lr.score}
                  </div>
                  <div className="pb-1">
                    <div className="text-sm font-bold" style={{ color: lr.color }}>{lr.label}</div>
                    <div className="text-[10px] text-white/30">out of 100 · demand · margin · trend</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* First Sale Blueprint — collapsible 7-day plan from Claude */}
          <FirstSaleBlueprint productId={String(product.id)} />

          {/* Why This Product Wins — computed reasons from real data */}
          {(() => {
            const reasons = getWinReasons(product);
            if (reasons.length === 0) return null;
            return (
              <div className="mx-4 mb-4 bg-green/[0.05] border border-green/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={13} className="text-green" strokeWidth={2.5} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green">Why this wins</span>
                </div>
                <ul className="space-y-2">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-body leading-relaxed">
                      <span className="text-green mt-0.5 shrink-0">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Competition Level indicator */}
          {(() => {
            const comp = competitionLevel(product.sold_count ?? 0);
            return (
              <div className="mx-4 mb-4 flex items-center justify-between gap-3 bg-card border border-white/[0.06] rounded-lg p-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Competition</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${comp.color} ${comp.bg}`}>
                    {comp.label}
                  </span>
                </div>
                <span className="text-[10px] text-muted leading-snug text-right flex-1 min-w-0">
                  {comp.tip}
                </span>
              </div>
            );
          })()}

          {aliHref && (
            <a
              href={aliHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-4 mb-3 bg-white/[0.06] border border-white/[0.07] rounded-lg py-3 text-sm text-text font-medium flex items-center justify-center gap-2 no-underline hover:bg-white/10 transition-colors"
            >
              View on AliExpress
              <ExternalLink size={14} strokeWidth={1.75} />
            </a>
          )}

          {/* Build Store for this product — one-click flow */}
          <button
            onClick={handleImportToStore}
            className="mx-4 mb-4 text-white rounded-lg py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            style={{
              background: '#3B82F6',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.4), 0 8px 24px rgba(59,130,246,0.25)',
            }}
          >
            <Store size={16} strokeWidth={2} />
            Build Store for This Product →
          </button>

          {/* Profit calculator — collapsible */}
          <div className="mx-4 mb-4 bg-raised rounded-lg overflow-hidden border border-white/[0.07]">
            <button
              onClick={() => setCalcOpen((o) => !o)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator size={14} strokeWidth={1.75} className="text-accent-hover" />
                <span className="text-sm font-semibold text-text">Calculate profit</span>
              </div>
              <ChevronRight
                size={14}
                strokeWidth={2}
                className={`text-muted transition-transform ${calcOpen ? 'rotate-90' : ''}`}
              />
            </button>
            {calcOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3">
                {[
                  { label: 'Sell price',     value: sellPrice,  set: setSellPrice,  prefix: '$' },
                  { label: 'Landed cost',    value: landedCost, set: setLandedCost, prefix: '$' },
                  { label: 'Shipping',       value: shipping,   set: setShipping,   prefix: '$' },
                  { label: 'Platform fee %', value: feePct,     set: setFeePct,     prefix: '' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <label className="text-xs text-muted flex-1">{row.label}</label>
                    <div className="flex items-center gap-1 w-[110px]">
                      {row.prefix && <span className="text-xs text-muted">{row.prefix}</span>}
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => row.set(Number(e.target.value) || 0)}
                        className="flex-1 bg-bg border border-white/[0.08] rounded-md px-2.5 py-1.5 text-sm text-text tabular-nums outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-4 bg-raised rounded-lg p-4 space-y-2.5 border border-white/[0.06]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Net profit per unit</span>
                    <span className={`font-bold tabular-nums ${profitColor}`}>
                      ${netAfterFees.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Margin</span>
                    <span className={`font-bold tabular-nums ${marginTier}`}>
                      {marginPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Break-even ROAS</span>
                    <span className="font-bold tabular-nums text-accent-hover">
                      {breakEvenRoas != null ? `${breakEvenRoas.toFixed(2)}x` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Max CPA</span>
                    <span className="font-bold tabular-nums text-accent-hover">
                      {maxCpa != null ? `$${maxCpa.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Sticky bottom — Create Ad + Save wired */}
          <div className="sticky bottom-0 bg-surface border-t border-white/[0.07] p-4 flex gap-2.5">
            <button
              onClick={handleCreateAd}
              className="flex-1 text-white rounded-md py-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              style={{
                background: '#3B82F6',
                boxShadow: '0 0 0 1px rgba(59,130,246,0.4), 0 8px 24px rgba(59,130,246,0.25)',
              }}
            >
              <Zap size={14} strokeWidth={2} />
              Create Ad
            </button>
            <button
              onClick={handleToggleSave}
              className={`flex-1 bg-white/[0.06] hover:bg-white/10 border border-white/[0.07] rounded-md py-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${isFav ? 'text-accent' : 'text-text'}`}
            >
              <Heart size={14} strokeWidth={1.75} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'Saved' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* Small Tooltip wrapper that uses Majorka's dark styling. */
function TT({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className="z-[200] max-w-xs bg-raised border border-white/[0.12] text-text text-xs font-body rounded-md px-3 py-2 shadow-hover data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0"
        >
          {content}
          <Tooltip.Arrow className="fill-raised" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export default function AppProducts() {
  useEffect(() => { document.title = 'Products — Majorka'; }, []);
  const initial = readInitialParams();
  const [, navigate] = useLocation();
  const [orderBy, setOrderBy] = useState<SortKey>('sold_count');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [perPage, setPerPage] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<SmartTabKey>(initial.tab);
  const [searchMode, setSearchMode] = useState<'db' | 'live'>(initial.search ? 'live' : 'db');
  const [liveQuery, setLiveQuery] = useState(initial.search);
  const [searchInput, setSearchInput] = useState(initial.search);

  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minOrders, setMinOrders] = useState<number | null>(null);
  const [maxOrders, setMaxOrders] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [scoreMax, setScoreMax] = useState<number>(100);

  const [openPill, setOpenPill] = useState<string | null>(null);
  const closePill = () => setOpenPill(null);

  const aeSearch = useAESearch();
  const fav = useFavourites();
  const lists = useLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  /* Pre-fetched exact tab counts from /api/products/tab-counts so
     badges show real totals, not per-page slices. */
  const [serverTabCounts, setServerTabCounts] = useState<{
    all: number; recentlyAdded: number; trending: number; highMargin: number; score90: number;
    hotNow?: number; highVolume?: number; under10?: number;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/tab-counts', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data) => { if (!cancelled) setServerTabCounts(data); })
      .catch(() => { /* fall back to client-computed counts */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (initial.search && initial.search.trim().length >= 2) {
      aeSearch.search({ q: initial.search.trim(), reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Cmd+K / Ctrl+K focuses the search input */
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't trigger shortcuts when user is typing in an input/textarea
      const t = e.target as HTMLElement | null;
      const inField = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t && t.isContentEditable);

      // ⌘K / Ctrl+K or / → focus search
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (!inField && e.key === '/')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (inField) return;

      // Esc → close detail panel
      if (e.key === 'Escape') {
        setSelectedProduct(null);
        return;
      }
      // G / L → switch view mode
      if (e.key === 'g' || e.key === 'G') setView('grid');
      else if (e.key === 'l' || e.key === 'L') setView('table');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Filter persistence — restore on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('majorka_filters_v1');
      if (!stored) return;
      const f = JSON.parse(stored) as Partial<{
        priceMin: number | null;
        priceMax: number | null;
        minOrders: number | null;
        categoryFilter: string;
        scoreMin: number;
        scoreMax: number;
        orderBy: SortKey;
      }>;
      if (f.priceMin != null) setPriceMin(f.priceMin);
      if (f.priceMax != null) setPriceMax(f.priceMax);
      if (f.minOrders != null) setMinOrders(f.minOrders);
      if (typeof f.categoryFilter === 'string') setCategoryFilter(f.categoryFilter);
      if (typeof f.scoreMin === 'number') setScoreMin(f.scoreMin);
      if (typeof f.scoreMax === 'number') setScoreMax(f.scoreMax);
      if (typeof f.orderBy === 'string') setOrderBy(f.orderBy as SortKey);
    } catch { /* ignore */ }
  }, []);

  /* Filter persistence — save on change */
  useEffect(() => {
    try {
      const filters = { priceMin, priceMax, minOrders, categoryFilter, scoreMin, scoreMax, orderBy };
      localStorage.setItem('majorka_filters_v1', JSON.stringify(filters));
    } catch { /* ignore */ }
  }, [priceMin, priceMax, minOrders, categoryFilter, scoreMin, scoreMax, orderBy]);

  const fetchLimit = perPage * page;
  // When sorting by velocity we still fetch by sold_count and re-sort
  // client-side using dailyVelocity().
  const serverOrderBy: OrderByColumn = orderBy === 'velocity' ? 'sold_count' : orderBy;

  // Tab independence rule:
  //   - 'all' tab → user filter bar drives the query (legacy behaviour)
  //   - any other tab → that tab's hardcoded server-side criteria runs
  //     standalone, user filter state is intentionally ignored. The
  //     filter bar is hidden in this mode (see render below).
  // Saved tab is special — it's purely localStorage-driven and skips
  // the server query entirely, so we route it as 'all' here and the
  // filtered useMemo below substitutes the saved-products list.
  const isFilterableTab = activeTab === 'all' || activeTab === 'saved';

  const useProductsParams = isFilterableTab
    ? {
        limit: Math.min(fetchLimit, 200),
        orderBy: serverOrderBy,
        tab: ('all' as SmartTabKey),
        category: categoryFilter || undefined,
        minPrice: priceMin ?? undefined,
        maxPrice: priceMax ?? undefined,
        minOrders: minOrders ?? undefined,
        maxOrders: maxOrders ?? undefined,
        minScore: scoreMin > 0 ? scoreMin : undefined,
        searchQuery: searchMode === 'db' && searchInput.trim().length >= 2
          ? searchInput.trim()
          : undefined,
      }
    : {
        // Curated tab — only the tab key + a fetch limit. The hook's
        // built-in tab branch applies the criteria server-side. NO
        // category, NO price range, NO orders gate, NO user search —
        // those are deliberately stripped so curated tabs are stable.
        limit: Math.min(fetchLimit, 200),
        orderBy: serverOrderBy,
        tab: activeTab as Exclude<SmartTabKey, 'saved'>,
      };

  const { products: allFetchedRaw, loading, total } = useProducts(activeTab === 'saved' ? undefined : useProductsParams as any);

  // Client-side velocity re-sort when 'velocity' is selected
  const allFetched = useMemo<Product[]>(() => {
    if (orderBy !== 'velocity') return allFetchedRaw;
    return [...allFetchedRaw].sort((a, b) => dailyVelocity(b) - dailyVelocity(a));
  }, [allFetchedRaw, orderBy]);

  // Auto-open the product detail panel when navigated here with
  // ?product=ID in the URL (e.g. from Today's Top 5 cards on Home).
  // Strips the param after opening so the user can close + reopen
  // freely without re-triggering on subsequent renders.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const wantId = params.get('product');
    if (!wantId || allFetched.length === 0) return;
    const found = allFetched.find((p) => String(p.id) === wantId);
    if (found) {
      setSelectedProduct(found);
      const next = window.location.pathname + (params.toString().replace(`product=${wantId}`, '').replace(/^&/, '?').replace(/^\?$/, '') || '');
      window.history.replaceState({}, '', next);
    }
  }, [allFetched]);

  const filtered = useMemo<Product[]>(() => {
    if (activeTab === 'saved') {
      // Pull from useLists — either the selected list's products, or
      // the union across all lists if none is selected.
      const source = selectedListId
        ? (lists.lists.find((l) => l.id === selectedListId)?.products ?? [])
        : lists.allSavedProducts;
      return source.map((f) => ({
        id: f.id,
        product_title: f.product_title ?? '',
        category: f.category,
        platform: 'aliexpress',
        price_aud: f.price_aud,
        sold_count: f.sold_count,
        winning_score: f.winning_score,
        trend: null,
        est_daily_revenue_aud: null,
        image_url: f.image_url,
        product_url: f.product_url,
        created_at: f.saved_at,
        updated_at: null,
      } satisfies Product));
    }
    if (scoreMax < 100) {
      return allFetched.filter((p) => (p.winning_score ?? 0) <= scoreMax);
    }
    return allFetched;
  }, [activeTab, scoreMax, allFetched, lists.lists, lists.allSavedProducts, selectedListId]);

  const filteredTotal = activeTab === 'saved'
    ? (selectedListId
        ? (lists.lists.find((l) => l.id === selectedListId)?.productIds.length ?? 0)
        : lists.totalSaved)
    : total;
  const offset = (page - 1) * perPage;
  const pageSlice = filtered.slice(offset, offset + perPage);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / perPage));

  const tabCounts = useMemo((): Record<SmartTabKey, number> => {
    if (serverTabCounts) {
      return {
        'all':         serverTabCounts.all,
        'new':         serverTabCounts.recentlyAdded,
        'trending':    serverTabCounts.trending,
        'highmargin':  serverTabCounts.highMargin,
        'top':         serverTabCounts.score90,
        'hot-now':     serverTabCounts.hotNow ?? 0,
        'high-volume': serverTabCounts.highVolume ?? 0,
        'under-10':    serverTabCounts.under10 ?? 0,
        'saved':       lists.totalSaved,
      };
    }
    return {
      'all':         total,
      'new':         allFetched.filter((p) => daysSince(p.created_at) <= 7).length,
      'trending':    allFetched.filter((p) => (p.sold_count ?? 0) > 50000 && (p.winning_score ?? 0) >= 80).length,
      'highmargin':  allFetched.filter((p) => {
        const price = Number(p.price_aud ?? 999);
        return price < 15 && (p.winning_score ?? 0) >= 75 && (p.sold_count ?? 0) > 500;
      }).length,
      'top':         allFetched.filter((p) => (p.winning_score ?? 0) >= 90).length,
      'hot-now':     allFetched.filter((p) => (p.winning_score ?? 0) >= 90 && (p.sold_count ?? 0) > 100000 && daysSince(p.created_at) <= 30).length,
      'high-volume': allFetched.filter((p) => (p.sold_count ?? 0) > 100000).length,
      'under-10':    allFetched.filter((p) => Number(p.price_aud ?? 999) <= 10 && (p.winning_score ?? 0) >= 70 && (p.sold_count ?? 0) > 5000).length,
      'saved':       lists.totalSaved,
    };
  }, [total, allFetched, lists.totalSaved, serverTabCounts]);

  // Fetch the complete category list from the server on mount. Falls back
  // to whatever categories are present in the currently-loaded page if the
  // endpoint fails.
  const [serverCategories, setServerCategories] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/categories')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d?.categories)) {
          setServerCategories(d.categories);
        }
      })
      .catch(() => { /* ignore — fallback below */ });
    return () => { cancelled = true; };
  }, []);

  const availableCategories = useMemo(() => {
    if (serverCategories.length > 0) return serverCategories;
    const set = new Set<string>();
    allFetched.forEach((p) => {
      if (p.category && p.category.trim().length > 0) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [serverCategories, allFetched]);

  const anyFilterActive =
    priceMin !== null || priceMax !== null || minOrders !== null || maxOrders !== null ||
    categoryFilter !== '' || scoreMin > 0 || scoreMax < 100;

  function clearFilters(): void {
    setPriceMin(null);
    setPriceMax(null);
    setMinOrders(null);
    setMaxOrders(null);
    setCategoryFilter('');
    setScoreMin(0);
    setScoreMax(100);
  }

  function runSearch(): void {
    const v = searchInput.trim();
    if (v.length >= 2) {
      setLiveQuery(v);
      setSearchMode('live');
      const toastId = toast.loading(`Searching AliExpress for "${v}"…`);
      aeSearch.search({ q: v, reset: true });
      // Dismiss the loading toast once the hook flips loading off or surfaces data.
      setTimeout(() => toast.dismiss(toastId), 2500);
    }
  }

  function backToDb(): void {
    setSearchMode('db');
    aeSearch.reset();
    setLiveQuery('');
    setSearchInput('');
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === orderBy)?.label ?? 'Sort';

  const numberInputClass = 'bg-bg border border-white/[0.07] rounded-md px-2.5 py-2 text-text w-[90px] outline-none text-sm tabular-nums box-border';

  return (
    <div className="min-h-screen bg-bg font-body text-text">
      {/* Breadcrumb */}
      <div className="px-4 md:px-8 pt-6 pb-2 text-xs text-muted">
        Home <span className="mx-1.5 text-white/20">/</span> Products
      </div>

      {/* Search bar */}
      <div className="px-4 md:px-8 pb-4 flex items-center gap-3">
        <div className="flex-1 relative flex items-center bg-card border border-white/10 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-lg h-[52px] px-4 gap-3 transition-all shadow-lg">
          <Search size={16} strokeWidth={2} className="text-accent/60 shrink-0" />
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Enter in DB mode searches the database (already wired via
                // searchQuery prop to useProducts). Only live mode triggers a
                // fresh Apify search on Enter.
                if (searchMode === 'live') runSearch();
              }
            }}
            placeholder={`Search ${total != null && total > 0 ? total.toLocaleString() : '…'} products`}
            className="flex-1 search-input bg-transparent text-sm md:text-base text-text placeholder-muted outline-none min-w-0"
          />
          <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted border border-white/10 rounded shrink-0">
            ⌘K
          </kbd>
        </div>
        {LIVE_SEARCH_ENABLED && (
          <div className="flex items-center gap-1 bg-card border border-white/10 rounded-lg p-1">
            {(['db', 'live'] as const).map((mode) => {
              const active = searchMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { if (mode === 'db') backToDb(); else runSearch(); }}
                  className={`text-sm font-medium rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-accent/15 text-accent-hover border border-accent/30'
                      : 'text-muted border border-transparent hover:text-text'
                  }`}
                >
                  {mode === 'db' ? 'Database' : 'Live AliExpress'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {searchMode === 'live' && (
        <div className="px-4 md:px-8 pb-3 text-sm text-muted">
          Showing {aeSearch.total.toLocaleString()} live results for <span className="text-text">"{liveQuery}"</span>
        </div>
      )}

      {/* Curated-tab notice — replaces the filter bar when on a curated tab */}
      {searchMode === 'db' && !isFilterableTab && (
        <div
          className="mx-4 md:mx-8 mb-4 px-4 py-3 flex items-center gap-3 flex-wrap rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-hover">
            Curated view
          </span>
          <span className="text-xs text-body">
            Showing {SMART_TABS.find((t) => t.key === activeTab)?.label ?? activeTab} — filters don&apos;t apply in this view.
          </span>
          <button
            onClick={() => setActiveTab('all')}
            className="ml-auto text-xs text-accent hover:text-accent-hover transition-colors font-medium"
          >
            ← Back to All Products with filters
          </button>
        </div>
      )}

      {/* Filter bar — only rendered on the All Products tab */}
      {searchMode === 'db' && isFilterableTab && (
        <div className="px-4 md:px-8 pb-4 flex gap-2 flex-wrap items-center">
          <FilterPill
            label={priceMin !== null || priceMax !== null
              ? `Price: $${priceMin ?? 0}–$${priceMax ?? '∞'}`
              : 'Price'}
            active={priceMin !== null || priceMax !== null}
            open={openPill === 'price'}
            onToggle={() => setOpenPill(openPill === 'price' ? null : 'price')}
            onClose={closePill}
            onClear={() => { setPriceMin(null); setPriceMax(null); }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Price range
            </div>
            <div className="flex gap-2.5 items-center">
              <input type="number" placeholder="Min" value={priceMin ?? ''}
                onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : null)}
                className={numberInputClass} />
              <span className="text-muted text-xs">to</span>
              <input type="number" placeholder="Max" value={priceMax ?? ''}
                onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                className={numberInputClass} />
            </div>
          </FilterPill>

          <FilterPill
            label={(() => {
              if (minOrders == null && maxOrders == null) return 'Orders';
              const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
              if (minOrders != null && maxOrders != null) return `Orders: ${fmt(minOrders)}–${fmt(maxOrders)}`;
              if (minOrders != null) return `Orders: ≥ ${fmt(minOrders)}`;
              return `Orders: ≤ ${fmt(maxOrders!)}`;
            })()}
            active={minOrders !== null || maxOrders !== null}
            open={openPill === 'minOrders'}
            onToggle={() => setOpenPill(openPill === 'minOrders' ? null : 'minOrders')}
            onClose={closePill}
            onClear={() => { setMinOrders(null); setMaxOrders(null); }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Order volume range
            </div>
            <div className="flex gap-2.5 items-center">
              <input type="number" placeholder="Min" value={minOrders ?? ''}
                onChange={(e) => setMinOrders(e.target.value ? Number(e.target.value) : null)}
                className={numberInputClass} />
              <span className="text-muted text-xs">to</span>
              <input type="number" placeholder="Max" value={maxOrders ?? ''}
                onChange={(e) => setMaxOrders(e.target.value ? Number(e.target.value) : null)}
                className={numberInputClass} />
            </div>
          </FilterPill>

          <FilterPill
            label={categoryFilter ? `Category: ${shortenCategory(categoryFilter)}` : 'Category'}
            active={categoryFilter !== ''}
            open={openPill === 'category'}
            onToggle={() => setOpenPill(openPill === 'category' ? null : 'category')}
            onClose={closePill}
            onClear={() => setCategoryFilter('')}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Category
            </div>
            {availableCategories.length > 0 ? (
              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-0.5">
                {['', ...availableCategories].map((opt) => {
                  const sel = categoryFilter === opt;
                  return (
                    <div
                      key={opt || '__all__'}
                      onClick={() => { setCategoryFilter(opt); closePill(); }}
                      className={`px-3 py-2 cursor-pointer rounded-md text-sm transition-colors ${
                        sel ? 'bg-accent/15 text-text' : 'text-body hover:bg-white/[0.05]'
                      }`}
                    >
                      {opt ? shortenCategory(opt) : 'All categories'}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted text-xs">No categories loaded yet.</div>
            )}
          </FilterPill>

          <FilterPill
            label={scoreMin > 0 || scoreMax < 100 ? `Score: ${scoreMin}–${scoreMax}` : 'Score'}
            active={scoreMin > 0 || scoreMax < 100}
            open={openPill === 'score'}
            onToggle={() => setOpenPill(openPill === 'score' ? null : 'score')}
            onClose={closePill}
            onClear={() => { setScoreMin(0); setScoreMax(100); }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Score range
            </div>
            <div className="flex gap-2.5 items-center">
              <input type="number" min={0} max={100} placeholder="Min" value={scoreMin || ''}
                onChange={(e) => setScoreMin(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 0)}
                className={numberInputClass} />
              <span className="text-muted text-xs">to</span>
              <input type="number" min={0} max={100} placeholder="Max" value={scoreMax !== 100 ? scoreMax : ''}
                onChange={(e) => setScoreMax(e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : 100)}
                className={numberInputClass} />
            </div>
          </FilterPill>

          <div className="flex-1" />

          <FilterPill
            label={`Sort: ${activeSortLabel}`}
            active={false}
            open={openPill === 'sort'}
            onToggle={() => setOpenPill(openPill === 'sort' ? null : 'sort')}
            onClose={closePill}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2.5">
              Sort by
            </div>
            <div className="max-h-[220px] overflow-y-auto flex flex-col gap-0.5">
              {SORT_OPTIONS.map((opt) => {
                const sel = orderBy === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => { setOrderBy(opt.key); closePill(); }}
                    className={`px-3 py-2 cursor-pointer rounded-md text-sm transition-colors ${
                      sel ? 'bg-accent/15 text-text' : 'text-body hover:bg-white/[0.05]'
                    }`}
                  >
                    {opt.label}
                  </div>
                );
              })}
            </div>
          </FilterPill>

          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg px-3.5 py-2 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Tab bar */}
      {searchMode === 'db' && (
        <div className="px-4 md:px-8 flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-none bg-surface/50 backdrop-blur-sm border-b border-white/[0.06] py-2">
          {SMART_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = tabCounts[tab.key];
            const Icon = tab.Icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                style={{
                  borderLeftColor: active ? tab.dot : 'transparent',
                  borderLeftWidth: 2,
                  borderLeftStyle: 'solid',
                  ...(active
                    ? {
                        background: 'rgba(212,175,55,0.05)',
                        borderTop: '1px solid rgba(212,175,55,0.25)',
                        borderRight: '1px solid rgba(212,175,55,0.25)',
                        borderBottom: '1px solid rgba(212,175,55,0.25)',
                      }
                    : {}),
                }}
                className={`flex items-center gap-1.5 pl-3 pr-3.5 py-2 text-sm font-medium rounded-md cursor-pointer whitespace-nowrap transition-colors ${
                  active
                    ? 'text-text'
                    : 'bg-transparent border-t border-r border-b border-t-transparent border-r-transparent border-b-transparent text-white/45 hover:text-white/75 hover:bg-white/[0.04]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: tab.dot, opacity: active ? 1 : 0.55 }}
                />
                <Icon
                  size={14}
                  strokeWidth={1.75}
                  className={active ? 'text-text' : tab.iconClass ?? ''}
                />
                <span>{tab.label}</span>
                <span className="bg-white/[0.08] rounded-full px-1.5 py-0 text-[11px] tabular-nums ml-0.5">
                  {count >= 1000 ? `${Math.round(count / 1000)}k` : count}
                </span>
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="flex gap-1 shrink-0">
            {(['table', 'grid'] as const).map((mode) => {
              const active = view === mode;
              const Icon = mode === 'table' ? List : LayoutGrid;
              return (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  aria-label={mode}
                  className={`w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                    active ? 'bg-raised text-text' : 'text-muted hover:text-body'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results header — results count + CSV export + kbd hints */}
      {searchMode === 'db' && (
        <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted">
            {loading ? 'Loading products…' : `${filteredTotal.toLocaleString()} products`}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-white/30">
              <kbd className="px-1.5 py-0.5 border border-white/10 rounded text-white/50">G</kbd> grid
              <kbd className="px-1.5 py-0.5 border border-white/10 rounded text-white/50">L</kbd> list
              <kbd className="px-1.5 py-0.5 border border-white/10 rounded text-white/50">/</kbd> search
              <kbd className="px-1.5 py-0.5 border border-white/10 rounded text-white/50">Esc</kbd> close
            </div>
            <button
              onClick={() => exportToCSV(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-text border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Saved tab — list picker chips */}
      {searchMode === 'db' && activeTab === 'saved' && (
        <div className="px-4 md:px-8 pb-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedListId(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              selectedListId == null
                ? 'bg-accent/15 border-accent text-accent-hover'
                : 'bg-card border-white/10 text-body hover:border-white/20'
            }`}
          >
            All saved
            <span className="text-[10px] text-muted tabular-nums">
              {lists.totalSaved}
            </span>
          </button>
          {lists.lists.map((list) => {
            const active = selectedListId === list.id;
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  active
                    ? 'bg-accent/15 border-accent text-accent-hover'
                    : 'bg-card border-white/10 text-body hover:border-white/20'
                }`}
              >
                {list.name}
                <span className="text-[10px] text-muted tabular-nums">
                  {list.productIds.length}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => {
              const name = window.prompt('List name:');
              if (name && name.trim()) {
                const created = lists.createList(name.trim());
                setSelectedListId(created.id);
                toast.success(`List "${created.name}" created`);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
          >
            + New list
          </button>
          {selectedListId != null && lists.lists.length > 1 && (
            <button
              onClick={() => {
                const list = lists.lists.find((l) => l.id === selectedListId);
                if (!list) return;
                if (window.confirm(`Delete list "${list.name}"?`)) {
                  lists.deleteList(selectedListId);
                  setSelectedListId(null);
                  toast('List deleted');
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Body */}
      {searchMode === 'live' ? (
        <LiveSearchView aeSearch={aeSearch} onSelect={setSelectedProduct} />
      ) : view === 'table' ? (
        <ListTable
          products={pageSlice}
          loading={loading}
          onSelect={setSelectedProduct}
          lists={lists}
          navigate={navigate}
          orderBy={orderBy}
          onSort={(k) => { setOrderBy(k); setPage(1); }}
        />
      ) : (
        <GridCards
          products={pageSlice}
          loading={loading}
          onSelect={setSelectedProduct}
          lists={lists}
          navigate={navigate}
        />
      )}

      {/* Pagination */}
      {searchMode === 'db' && filteredTotal > 0 && (
        <div className="mx-4 md:mx-8 mt-4 mb-12 flex items-center gap-3 flex-wrap">
          <div className="text-sm text-muted tabular-nums">
            Showing {(offset + 1).toLocaleString()}–{Math.min(offset + perPage, filteredTotal).toLocaleString()} of {filteredTotal.toLocaleString()}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <PageBtn disabled={page === 1} onClick={() => setPage(page - 1)}>‹</PageBtn>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const start = Math.max(1, page - 2);
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>
                  {p}
                </PageBtn>
              );
            })}
            <PageBtn disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</PageBtn>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="bg-raised border border-white/[0.07] rounded-md px-2.5 py-1 text-sm text-body outline-none ml-2"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      )}

      <ProductSheet
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(v) => { if (!v) setSelectedProduct(null); }}
        navigate={navigate}
        onToggleFav={fav.toggleFavourite}
        isFav={selectedProduct ? fav.isFavourite(selectedProduct.id) : false}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pagination button
   ══════════════════════════════════════════════════════════════ */

function PageBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 rounded-md text-sm flex items-center justify-center transition-colors border ${
        active
          ? 'bg-accent border-accent text-white'
          : disabled
            ? 'bg-raised border-white/[0.07] text-muted opacity-50 cursor-not-allowed'
            : 'bg-raised border-white/[0.07] text-body hover:text-text cursor-pointer'
      }`}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   List view
   ══════════════════════════════════════════════════════════════ */

interface ListTableProps {
  products: Product[];
  loading: boolean;
  onSelect: (p: Product) => void;
  lists: ReturnType<typeof useLists>;
  navigate: (path: string) => void;
  orderBy: SortKey;
  onSort: (key: SortKey) => void;
}

/** Column → sort key mapping for the table header. `null` means not sortable. */
const COLUMN_SORT_MAP: Record<string, { asc: SortKey; desc: SortKey } | null> = {
  score:   { asc: 'winning_score',         desc: 'winning_score' },
  orders:  { asc: 'orders_asc',            desc: 'sold_count' },
  price:   { asc: 'price_asc',             desc: 'price_desc' },
  revenue: { asc: 'est_daily_revenue_aud', desc: 'est_daily_revenue_aud' },
};

interface SortableThProps {
  label: string;
  column: keyof typeof COLUMN_SORT_MAP;
  orderBy: SortKey;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}

function SortableTh({ label, column, orderBy, onSort, align = 'right' }: SortableThProps) {
  const map = COLUMN_SORT_MAP[column];
  if (!map) {
    return (
      <th className={`hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-${align}`}>
        {label}
      </th>
    );
  }
  const isActiveDesc = orderBy === map.desc && map.desc !== map.asc;
  const isActiveAsc = orderBy === map.asc && map.asc !== map.desc;
  // For score/revenue (same key asc & desc), we still highlight if chosen
  const isActive = orderBy === map.asc || orderBy === map.desc;
  const next: SortKey = isActiveDesc ? map.asc : map.desc;
  const Arrow = isActiveAsc ? ChevronUp : isActiveDesc ? ChevronDown : ChevronsUpDown;
  return (
    <th className={`hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest px-4 py-3.5 whitespace-nowrap text-${align} ${isActive ? 'text-text' : 'text-white/45'}`}>
      <button
        type="button"
        onClick={() => onSort(next)}
        className={`inline-flex items-center gap-1 cursor-pointer hover:text-text transition-colors ${align === 'right' ? 'float-right' : ''}`}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <Arrow size={11} strokeWidth={2.5} className={isActive ? 'text-accent-hover' : 'text-white/30'} />
      </button>
    </th>
  );
}

/* Hover-quick-action handlers for the last column of each row. */
function createAdForProduct(p: Product, navigate: (path: string) => void) {
  sessionStorage.setItem('majorka_ad_product', JSON.stringify({
    id: p.id,
    title: p.product_title,
    image: p.image_url,
    price: p.price_aud,
  }));
  navigate('/app/ads-studio');
  toast.success('Product loaded into Ads Studio');
}

function importToStore(p: Product, navigate: (path: string) => void) {
  sessionStorage.setItem('majorka_import_product', JSON.stringify({
    id: p.id,
    title: p.product_title,
    image: p.image_url,
    price: p.price_aud,
    description: p.product_title,
    aliexpress_url: p.product_url,
  }));
  navigate('/app/store-builder');
  toast.success('Product imported to Store Builder');
}

function ListTable({ products, loading, onSelect, lists, navigate, orderBy, onSort }: ListTableProps) {
  if (loading && products.length === 0) {
    return (
      <div className="mx-4 md:mx-8 bg-surface border border-white/[0.07] rounded-lg overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`h-[96px] px-6 flex items-center gap-3.5 ${i === 7 ? '' : 'border-b border-white/[0.04]'}`}
          >
            <span className="w-5 h-3 bg-white/[0.04] rounded animate-pulse" />
            <span className="w-20 h-20 bg-white/[0.04] rounded-md animate-pulse" />
            <span className="flex-1 h-3.5 bg-white/[0.04] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) return <EmptyState />;
  return (
    <div className="mx-4 md:mx-8 bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="sticky top-0 z-10" style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(212,175,55,0.35)' }}>
            <tr style={{ background: '#0d0d0d' }}>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-left">#</th>
              <th className="text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-left">Product</th>
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-left">Category</th>
              <SortableTh label="Score" column="score" orderBy={orderBy} onSort={onSort} align="right" />
              {/* Orders is always visible on mobile — render a plain sortable header that stays inline */}
              <th className={`text-[11px] font-semibold uppercase tracking-widest px-4 py-3.5 whitespace-nowrap text-right ${orderBy === 'sold_count' || orderBy === 'orders_asc' ? 'text-text' : 'text-white/45'}`}>
                <button
                  type="button"
                  onClick={() => onSort(orderBy === 'sold_count' ? 'orders_asc' : 'sold_count')}
                  className="inline-flex items-center gap-1 cursor-pointer hover:text-text transition-colors float-right"
                  aria-label="Sort by Orders"
                >
                  <span>Orders</span>
                  {orderBy === 'sold_count'
                    ? <ChevronDown size={11} strokeWidth={2.5} className="text-accent-hover" />
                    : orderBy === 'orders_asc'
                      ? <ChevronUp size={11} strokeWidth={2.5} className="text-accent-hover" />
                      : <ChevronsUpDown size={11} strokeWidth={2.5} className="text-white/30" />}
                </button>
              </th>
              <SortableTh label="Price" column="price" orderBy={orderBy} onSort={onSort} align="right" />
              <SortableTh label="Revenue" column="revenue" orderBy={orderBy} onSort={onSort} align="right" />
              <th className="hidden md:table-cell text-[11px] font-semibold uppercase tracking-widest text-white/45 px-4 py-3.5 whitespace-nowrap text-center">♡</th>
            </tr>
          </thead>
        <tbody>
          {products.map((p, i) => {
            const score = Math.round(p.winning_score ?? 0);
            const orders = p.sold_count ?? 0;
            const estMonthly = monthlyRevenue(p);
            const isLast = i === products.length - 1;
            return (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onSelect(p)}
                className={`group h-24 ${isLast ? '' : 'border-b border-white/[0.04]'} border-l-2 border-l-transparent cursor-pointer transition-colors hover:bg-[rgba(59,130,246,0.04)]`}
              >
                <td className="hidden md:table-cell px-4 text-xs text-white/20 tabular-nums whitespace-nowrap">
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-4 min-w-0">
                    {p.image_url ? (
                      <img
                        src={proxyImage(p.image_url) ?? p.image_url}
                        alt={p.product_title}
                        loading="lazy"
                        className="w-20 h-20 rounded-md border border-white/[0.08] bg-card object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-md border border-white/[0.08] bg-card flex items-center justify-center text-muted shrink-0">—</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <TT content={p.product_title}>
                        <p className="text-sm font-semibold text-white/90 truncate max-w-[240px] cursor-default">
                          {p.product_title}
                        </p>
                      </TT>
                      {/* Mobile-only inline metrics + heart under the title */}
                      <div className="md:hidden mt-1 flex items-center gap-2 text-[11px]">
                        {p.category && (
                          <span
                            className="inline-block font-semibold px-2 py-0.5 rounded truncate max-w-[120px]"
                            style={categoryColor(p.category)}
                          >
                            {shortenCategory(p.category)}
                          </span>
                        )}
                        <span className="text-muted tabular-nums">
                          {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}
                        </span>
                        <span className="text-muted">
                          {daysSince(p.created_at)}d
                        </span>
                      </div>
                    </div>
                    <div className="md:hidden shrink-0">
                      <ListPickerButton product={p} lists={lists} />
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 whitespace-nowrap">
                  {p.category ? (
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded truncate max-w-[124px]"
                      style={categoryColor(p.category)}
                    >
                      {shortenCategory(p.category)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td className="hidden md:table-cell px-4 text-right whitespace-nowrap">
                  {score ? (
                    <TT
                      content={
                        <div className="space-y-0.5">
                          <div className="font-semibold">Score breakdown</div>
                          <div className="text-muted">
                            Demand {Math.min(100, Math.round(score * 0.95))} ·
                            {' '}Trend {Math.min(100, Math.round(score * 0.98))} ·
                            {' '}Margin {Math.min(100, Math.round(score * 0.86))}
                          </div>
                        </div>
                      }
                    >
                      <span className="inline-block"><ScoreBadge score={score} /></span>
                    </TT>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td className={`px-4 text-right whitespace-nowrap ${orders > 0 ? 'text-text' : 'text-muted'}`}>
                  {orders > 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <TT content={`${orders.toLocaleString()} total orders tracked`}>
                        <span className="inline-block cursor-default text-base font-bold font-mono tabular-nums">
                          {orders > 150000 && <Flame size={12} className="inline text-amber mr-1" />}
                          {fmtK(orders)}
                        </span>
                      </TT>
                      {(() => {
                        const v = velocityBadge(p);
                        if (!v) return null;
                        return (
                          <span className={`text-[10px] ${v.color} tabular-nums font-medium`}>
                            {v.icon} {v.label}
                          </span>
                        );
                      })()}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="hidden md:table-cell px-4 text-right text-base font-bold text-text font-mono tabular-nums whitespace-nowrap">
                  {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : '—'}
                </td>
                <td className={`hidden md:table-cell px-4 text-right text-base font-bold font-mono tabular-nums whitespace-nowrap ${estMonthly != null ? 'text-green' : 'text-muted'}`}>
                  {estMonthly != null ? `$${Math.round(estMonthly).toLocaleString()}/mo` : '—'}
                </td>
                <td className="hidden md:table-cell px-4 text-center whitespace-nowrap">
                  {/* Heart opens list picker popover. Hover: Zap + ShoppingBag reveal. */}
                  <div className="flex items-center justify-end gap-1">
                    <ListPickerButton product={p} lists={lists} />
                    <button
                      onClick={(e) => { e.stopPropagation(); createAdForProduct(p, navigate); }}
                      aria-label="Create ad"
                      title="Create ad"
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center p-1.5 rounded-md text-muted hover:text-accent-hover hover:bg-white/[0.08] cursor-pointer"
                    >
                      <Zap size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); importToStore(p, navigate); }}
                      aria-label="Import to store"
                      title="Import to store"
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center p-1.5 rounded-md text-muted hover:text-accent-hover hover:bg-white/[0.08] cursor-pointer"
                    >
                      <ShoppingBag size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Grid view — 3 columns, large product images
   ══════════════════════════════════════════════════════════════ */

interface GridCardsProps {
  products: Product[];
  loading: boolean;
  onSelect: (p: Product) => void;
  lists: ReturnType<typeof useLists>;
  navigate: (path: string) => void;
}

function GridCards({ products, loading, onSelect, lists }: GridCardsProps) {
  if (loading && products.length === 0) {
    return (
      <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="w-full h-48 bg-white/[0.04] animate-pulse" />
            <div className="p-3.5">
              <span className="inline-block w-[90%] h-4 bg-white/[0.04] rounded mb-2 animate-pulse" />
              <span className="inline-block w-[60%] h-3 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) return <EmptyState />;
  return (
    <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((p, idx) => {
        const score = Math.round(p.winning_score ?? 0);
        const orders = p.sold_count ?? 0;
        const estMonthly = monthlyRevenue(p);
        const isNew = daysSince(p.created_at) <= NEW_DAYS_THRESHOLD;
        const isJustIn = hoursSince(p.created_at) <= JUST_ADDED_HOURS;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelect(p)}
            className="group bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden hover:border-accent/50 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer flex flex-col"
          >
            <div className="relative h-48 md:h-56 overflow-hidden">
              {p.image_url ? (
                <img
                  src={proxyImage(p.image_url) ?? p.image_url}
                  alt={p.product_title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-display font-bold text-muted bg-raised">
                  {(p.product_title?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              {/* Bottom gradient overlay — stronger for category chip legibility */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              {/* Category chip on the image bottom-left */}
              {p.category && (
                <span
                  className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm"
                  style={categoryColor(p.category)}
                >
                  {shortenCategory(p.category)}
                </span>
              )}
              {/* Days-active badge bottom-right on image */}
              <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-white/70 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded tabular-nums">
                {daysSince(p.created_at)}d
              </span>
              {/* Score top-right */}
              {score > 0 && (
                <div className="absolute top-2 right-2">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded text-base font-black tabular-nums"
                    style={scoreTierStyle(score)}
                  >
                    {score}
                  </span>
                </div>
              )}
              {isJustIn ? (
                <span
                  className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide"
                  style={{
                    background: 'rgba(59,130,246,0.18)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59,130,246,0.4)',
                    boxShadow: '0 0 12px rgba(59,130,246,0.25)',
                  }}
                >
                  JUST IN
                </span>
              ) : isNew && (
                <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 bg-green/20 text-green rounded">
                  NEW
                </span>
              )}
            </div>
            <div className="p-3.5 flex-1 flex flex-col">
              <p className="text-sm font-semibold text-text leading-tight line-clamp-2 mb-3 min-h-[36px]">
                {p.product_title}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3 mt-auto">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Orders</p>
                  <p className="text-sm font-bold text-text tabular-nums">
                    {orders > 0 ? fmtK(orders) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Price</p>
                  <p className="text-sm font-medium text-body tabular-nums">
                    {p.price_aud != null ? `$${Number(p.price_aud).toFixed(0)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Rev</p>
                  <p className="text-sm font-medium text-green tabular-nums">
                    {estMonthly != null ? `$${Math.round(estMonthly / 1000)}k` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center justify-center bg-white/[0.06] rounded-lg hover:bg-white/10 transition-colors">
                  <ListPickerButton product={p} lists={lists} size={14} className="w-full py-1.5" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                  className="flex-1 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  View →
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Empty state
   ══════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="mx-4 md:mx-8 my-10 p-16 bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-raised mb-4">
        <Search size={24} className="text-muted" strokeWidth={1.75} />
      </div>
      <div className="font-display text-xl font-semibold text-text mb-2">
        No products match
      </div>
      <div className="text-sm text-body max-w-sm mx-auto leading-relaxed">
        Try clearing your filters or switching to Live AliExpress search to pull fresh results from the marketplace.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Live AE search grid
   ══════════════════════════════════════════════════════════════ */

function LiveSearchView({ aeSearch, onSelect }: {
  aeSearch: ReturnType<typeof useAESearch>;
  onSelect: (p: Product) => void;
}) {
  if (aeSearch.loading && aeSearch.products.length === 0) {
    return (
      <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] h-[360px] animate-pulse" />
        ))}
      </div>
    );
  }
  if (aeSearch.products.length === 0) return <EmptyState />;
  return (
    <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {aeSearch.products.map((p: AELiveProduct, i) => (
        <div
          key={`${p.id}-${i}`}
          onClick={() => {
            const asProduct: Product = {
              id: p.id,
              product_title: p.product_title,
              category: p.category,
              platform: 'aliexpress',
              price_aud: p.price_aud,
              sold_count: p.sold_count,
              winning_score: p.winning_score,
              trend: null,
              est_daily_revenue_aud: null,
              image_url: p.image_url,
              product_url: p.product_url,
              created_at: new Date().toISOString(),
              updated_at: null,
            };
            onSelect(asProduct);
          }}
          className="bg-surface border border-white/[0.07] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-hover transition-all duration-150 cursor-pointer"
        >
          <div className="h-48 bg-raised">
            {p.image_url && (
              <img
                src={proxyImage(p.image_url) ?? p.image_url}
                alt={p.product_title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-3.5">
            <p className="text-sm text-text line-clamp-2 mb-2">{p.product_title}</p>
            <p className="text-xs text-body tabular-nums">
              {p.price_aud != null ? `$${Number(p.price_aud).toFixed(2)}` : ''}
              {p.sold_count ? ` · ${fmtK(p.sold_count)} orders` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   ProductHistoryChart — 30-day snapshot trend
   Shows a placeholder if snapshots haven't started yet, or a
   tiny sparkline if data exists. Fetches from /api/products/:id/history
   which gracefully returns { history: [], tableReady: false } when the
   product_daily_snapshots table hasn't been created yet.
   ────────────────────────────────────────────────────────────── */
interface HistoryPoint { captured_at: string; sold_count: number | null; winning_score: number | null }

function ProductHistoryChart({ productId }: { productId: string | number }) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [tableReady, setTableReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(String(productId))}/history`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setHistory(Array.isArray(data?.history) ? data.history : []);
        setTableReady(data?.tableReady !== false);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setLoading(false); setTableReady(false); }
      });
    return () => { cancelled = true; };
  }, [productId]);

  // Loading state — single spinner row, no fabricated bars.
  if (loading) {
    return (
      <div className="mx-4 mt-3 p-4 bg-raised border border-white/[0.07] rounded-md">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">30-day trend</div>
          <div className="text-[10px] text-white/25">Loading…</div>
        </div>
        <div className="h-12 mt-3 bg-white/[0.03] rounded animate-pulse" />
      </div>
    );
  }

  // Empty state — honest message, no fake data.
  if (!tableReady || history.length < 2) {
    return (
      <div className="mx-4 mt-3 p-4 bg-raised border border-white/[0.07] rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">30-day trend</div>
        </div>
        <div className="h-12 flex items-center justify-center">
          <p className="text-[11px] text-white/35 font-medium">Trend data unavailable</p>
        </div>
        <p className="text-[10px] text-white/25 text-center mt-1">
          Daily snapshots will build historical trends once this product has been tracked for 2+ days.
        </p>
      </div>
    );
  }

  // Real sparkline from data — smooth SVG line, not bars.
  const vals = history.map((h) => h.sold_count ?? 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = Math.max(1, max - min);
  const width = 100;
  const height = 40;
  const points = vals.map((v, i) => {
    const x = (i / Math.max(1, vals.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const last = vals[vals.length - 1];
  const first = vals[0];
  const deltaPct = first > 0 ? ((last - first) / first) * 100 : 0;
  const deltaColor = deltaPct >= 0 ? '#10b981' : '#ef4444';
  return (
    <div className="mx-4 mt-3 p-4 bg-raised border border-white/[0.07] rounded-md">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">30-day trend</div>
        <div className="text-[10px] font-mono tabular-nums" style={{ color: deltaColor }}>
          {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-12">
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div className="flex items-center justify-between mt-1 text-[10px] text-white/35 font-mono tabular-nums">
        <span>{first.toLocaleString()}</span>
        <span>{last.toLocaleString()} orders</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SimilarProducts — small horizontal row of 3 products from
   the same category with similar score range. Pure visual,
   read-only — clicking opens AliExpress directly.
   ────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   FirstSaleBlueprint — on-demand 7-day action plan from Claude.
   Collapsed by default. Operator clicks "Generate" to fire one
   POST /api/products/blueprint call. Result stays mounted while
   the panel is open. Falls back to a deterministic plan if Claude
   isn't configured server-side.
   ────────────────────────────────────────────────────────────── */
interface BlueprintStep { day: number; title: string; action: string; budget?: string | null }

function FirstSaleBlueprint({ productId }: { productId: string }) {
  const [steps, setSteps] = useState<BlueprintStep[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/products/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, market: 'AU' }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const out = Array.isArray(data?.steps) ? (data.steps as BlueprintStep[]) : [];
      if (out.length === 0) throw new Error('Empty blueprint');
      setSteps(out);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  if (!steps) {
    return (
      <div className="mx-4 mb-4">
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-semibold text-white border transition-all flex items-center justify-center gap-2"
          style={{
            background: loading ? 'rgba(255,255,255,0.3)' : 'var(--color-accent)',
            borderColor: 'rgba(255,255,255,0.4)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Zap size={14} strokeWidth={2.5} />
          {loading ? 'Generating your blueprint…' : 'Generate 7-day Blueprint'}
        </button>
        {error && <div className="text-[11px] text-red-400 mt-2 text-center">{error}</div>}
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 bg-accent/[0.04] border border-accent/20 rounded-lg p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-accent-hover" strokeWidth={2.5} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-hover">
            7-Day First Sale Blueprint
          </span>
        </div>
        <ChevronRight size={14} className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2.5">
          {steps.map((s) => (
            <div key={s.day} className="rounded-lg p-3 bg-card border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-accent uppercase tracking-wider">Day {s.day}</span>
                <span className="text-xs font-semibold text-text">{s.title}</span>
              </div>
              <p className="text-[11px] text-body leading-relaxed">{s.action}</p>
              {s.budget && (
                <div className="mt-1.5 text-[10px] font-semibold text-amber">Budget: {s.budget}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SimilarProducts({ category, excludeId }: { category: string; excludeId: string }) {
  const { products, loading } = useProducts({
    category,
    limit: 4,
    minScore: 70,
    orderBy: 'sold_count',
  });
  const filtered = products.filter((p) => String(p.id) !== excludeId).slice(0, 3);
  if (loading) {
    return (
      <div className="mx-4 mt-3 mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
          Similar in {shortenCategory(category)}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-20 bg-card border border-white/[0.06] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (filtered.length === 0) return null;
  return (
    <div className="mx-4 mt-3 mb-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
        Similar in {shortenCategory(category)}
      </div>
      <div className="flex gap-2">
        {filtered.map((p) => {
          const score = Math.round(p.winning_score ?? 0);
          const orders = p.sold_count ?? 0;
          return (
            <a
              key={p.id}
              href={p.product_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 group bg-card border border-white/[0.06] hover:border-accent/30 rounded-lg overflow-hidden transition-colors no-underline"
            >
              <div className="aspect-square bg-bg overflow-hidden">
                {p.image_url ? (
                  <img
                    src={proxyImage(p.image_url) ?? p.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">—</div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[10px] text-text font-medium truncate" title={p.product_title ?? ''}>
                  {p.product_title ?? 'Untitled'}
                </p>
                <div className="flex items-center justify-between mt-1 text-[9px] text-muted tabular-nums">
                  <span>{score > 0 ? `${score}` : '—'}</span>
                  <span>{orders > 0 ? fmtK(orders) : '—'}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
