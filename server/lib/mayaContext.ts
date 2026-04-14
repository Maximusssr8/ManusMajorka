/**
 * Maya AI context enrichment.
 *
 * Fetches the requesting user's subscription tier, the products they have
 * tracked (via alerts), and the current top-20 trending winning products
 * (by velocity_7d DESC) and packs them into a compact JSON-like block
 * the Maya system prompt can reason over.
 *
 * Designed to stay under ~1500 tokens total — we cap row counts and
 * truncate titles before returning.
 */

import { getSupabaseAdmin } from '../_core/supabase';

export type MayaTier = 'free' | 'builder' | 'scale' | 'admin';

export interface MayaTrendingProduct {
  title: string;
  category: string | null;
  sold_count: number;
  velocity_7d: number;
  price_aud: number;
  winning_score: number | null;
}

export interface MayaTrackedProduct {
  title: string;
  category: string | null;
  price_aud: number | null;
}

export interface MayaContext {
  tier: MayaTier;
  tracked: MayaTrackedProduct[];
  trending: MayaTrendingProduct[];
}

const MAX_TITLE_LEN = 90;
const MAX_TRENDING = 20;
const MAX_TRACKED = 10;
const ADMIN_EMAILS = new Set<string>(['maximusmajorka@gmail.com']);

function truncate(text: string | null | undefined, len = MAX_TITLE_LEN): string {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len - 1)}…` : text;
}

/** Fetch subscription tier for a given user. */
async function fetchTier(userId: string, email: string | null): Promise<MayaTier> {
  if (email && ADMIN_EMAILS.has(email.toLowerCase())) return 'admin';
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('user_subscriptions')
      .select('status, plan')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (!data) return 'free';
    const plan = (data as { status?: string; plan?: string }).plan;
    const status = (data as { status?: string }).status;
    if (status !== 'active') return 'free';
    if (plan === 'scale') return 'scale';
    if (plan === 'builder') return 'builder';
    return 'free';
  } catch {
    return 'free';
  }
}

/** Products the user currently tracks (joined from alerts.product_id). */
async function fetchTracked(userId: string): Promise<MayaTrackedProduct[]> {
  try {
    const sb = getSupabaseAdmin();
    const { data: alerts } = await sb
      .from('alerts')
      .select('product_id')
      .eq('user_id', userId)
      .not('product_id', 'is', null)
      .limit(MAX_TRACKED * 2);

    const ids = Array.from(
      new Set(
        ((alerts ?? []) as Array<{ product_id: string | null }>)
          .map((a) => a.product_id)
          .filter((x): x is string => typeof x === 'string' && x.length > 0)
      )
    ).slice(0, MAX_TRACKED);

    if (ids.length === 0) return [];

    const { data: products } = await sb
      .from('winning_products')
      .select('product_title, category, price_aud')
      .in('id', ids);

    return ((products ?? []) as Array<{
      product_title: string;
      category: string | null;
      price_aud: number | null;
    }>).map((p) => ({
      title: truncate(p.product_title),
      category: p.category ?? null,
      price_aud: p.price_aud ?? null,
    }));
  } catch {
    return [];
  }
}

/** Top 20 trending winning products by 7-day velocity. */
async function fetchTrending(): Promise<MayaTrendingProduct[]> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('winning_products')
      .select('product_title, category, sold_count, velocity_7d, price_aud, winning_score')
      .gt('sold_count', 0)
      .not('image_url', 'is', null)
      .order('velocity_7d', { ascending: false, nullsFirst: false })
      .limit(MAX_TRENDING);
    return ((data ?? []) as Array<{
      product_title: string;
      category: string | null;
      sold_count: number | null;
      velocity_7d: number | null;
      price_aud: number | null;
      winning_score: number | null;
    }>).map((r) => ({
      title: truncate(r.product_title),
      category: r.category ?? null,
      sold_count: r.sold_count ?? 0,
      velocity_7d: r.velocity_7d ?? 0,
      price_aud: r.price_aud ?? 0,
      winning_score: r.winning_score ?? null,
    }));
  } catch {
    return [];
  }
}

/** Build the full Maya context for a given authenticated user. */
export async function buildMayaContext(
  userId: string | null,
  email: string | null
): Promise<MayaContext> {
  if (!userId) {
    return { tier: 'free', tracked: [], trending: await fetchTrending() };
  }
  const [tier, tracked, trending] = await Promise.all([
    fetchTier(userId, email),
    fetchTracked(userId),
    fetchTrending(),
  ]);
  return { tier, tracked, trending };
}

/** Render the Maya context as a compact prompt fragment (≤ ~1500 tokens). */
export function renderMayaContext(ctx: MayaContext): string {
  const trendingLines = ctx.trending
    .map(
      (p, i) =>
        `  ${i + 1}. ${p.title} | ${p.category ?? 'uncategorised'} | $${p.price_aud} AUD | sold ${p.sold_count} | v7d +${p.velocity_7d}${p.winning_score !== null ? ` | score ${p.winning_score}` : ''}`
    )
    .join('\n');

  const trackedLines = ctx.tracked.length
    ? ctx.tracked
        .map(
          (p, i) =>
            `  ${i + 1}. ${p.title}${p.category ? ` (${p.category})` : ''}${p.price_aud ? ` — $${p.price_aud} AUD` : ''}`
        )
        .join('\n')
    : '  (none yet)';

  return `\n\nMAYA LIVE CONTEXT (ground truth — never invent products outside this list):\nSubscription tier: ${ctx.tier}\n\nUser's saved products:\n${trackedLines}\n\nCurrent trending products (top 20 by 7-day velocity):\n${trendingLines || '  (data not yet available)'}\n\nWhen the user asks "find me a winner…", select from Current trending products that match their filter (category, price band, market). Return real products by title + price + sold_count + velocity + one-sentence why-it-might-win. If nothing matches, say so and suggest a broader filter.`;
}

/** Tier-specific coaching line for the system prompt. */
export function renderTierLine(tier: MayaTier): string {
  if (tier === 'free') {
    return `The user is on the FREE tier — if they ask for deeper product/ads features, gently remind them Scale ($199/mo AUD) unlocks live AliExpress signals, Ads Studio at full capacity, and unlimited Maya queries.`;
  }
  return `The user is on the ${tier.toUpperCase()} tier — treat them as a power user and skip upsell language.`;
}
