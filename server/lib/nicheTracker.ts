/**
 * nicheTracker.ts — track user niche signals for personalised Video Intel feed
 * Requires: user_niche_signals table in Supabase
 */
import { getSupabaseAdmin } from '../_core/supabase';

export type SignalType = 'store_builder' | 'spy_tool' | 'product_search' | 'maya_chat' | 'video_search';

const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  store_builder: 5,
  spy_tool: 3,
  product_search: 3,
  maya_chat: 2,
  video_search: 2,
};

const NICHE_KEYWORDS = [
  'pet', 'dog', 'cat', 'beauty', 'skincare', 'fitness',
  'gym', 'kitchen', 'home', 'garden', 'tech', 'gadget',
  'baby', 'health', 'wellness', 'fashion', 'outdoor',
  'sports', 'automotive', 'office',
];

export function extractNiche(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const kw of NICHE_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

export async function trackNicheSignal(
  userId: string,
  niche: string,
  signalType: SignalType,
): Promise<void> {
  if (!userId || !niche) return;
  try {
    const sb = getSupabaseAdmin();
    await sb.from('user_niche_signals').insert({
      user_id: userId,
      niche: niche.toLowerCase().trim(),
      signal_type: signalType,
      weight: SIGNAL_WEIGHTS[signalType] ?? 1,
    });
  } catch {
    // Table may not exist yet — fail silently
  }
}

export async function getTopNiches(userId: string, limit = 3): Promise<string[]> {
  if (!userId) return [];
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('user_niche_signals')
      .select('niche, weight')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!data?.length) return [];
    // Sum weights per niche
    const sums: Record<string, number> = {};
    for (const row of data) {
      sums[row.niche] = (sums[row.niche] || 0) + (row.weight || 1);
    }
    return Object.entries(sums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([niche]) => niche);
  } catch {
    return [];
  }
}

const NICHE_HASHTAG_MAP: Record<string, string[]> = {
  pet: ['petproducts', 'dogtoys', 'catproducts', 'petcare'],
  dog: ['doglife', 'dogtoys', 'petcare'],
  cat: ['catlife', 'catproducts', 'petcare'],
  beauty: ['beautyhacks', 'skincareroutine', 'glowup', 'makeuptips'],
  skincare: ['skincareroutine', 'glowup', 'beautyhacks', 'selfcare'],
  fitness: ['gymessentials', 'workoutgear', 'fitnessproducts', 'homegym'],
  gym: ['gymessentials', 'workoutgear', 'fitnessproducts'],
  kitchen: ['kitchengadgets', 'cookingtools', 'homeessentials', 'mealprep'],
  home: ['homeessentials', 'homeorganisation', 'roomdecor', 'cleaninghacks'],
  garden: ['gardening', 'outdoorliving', 'gardentools'],
  tech: ['gadgets', 'techproducts', 'cooltech', 'techtok'],
  gadget: ['gadgets', 'cooltech', 'techproducts'],
  baby: ['babyproducts', 'newmom', 'parentingtips'],
  health: ['healthproducts', 'wellnessproducts', 'selfcare'],
  wellness: ['wellnessproducts', 'selfcare', 'healthproducts'],
  fashion: ['fashionfinds', 'outfitinspo', 'ootd'],
  outdoor: ['outdoorliving', 'outdoorlife', 'camping'],
  sports: ['sportsproducts', 'athleticgear', 'fitnessproducts'],
  automotive: ['cargadgets', 'carlife', 'carproducts'],
  office: ['workfromhome', 'desksetup', 'officegadgets'],
};

const BASE_HASHTAGS = ['tiktokmademebuyit', 'amazonfinds', 'productreview'];

export async function getPersonalisedHashtags(userId: string): Promise<string[]> {
  const topNiches = await getTopNiches(userId, 3);
  const nicheHashtags = topNiches.flatMap(n => NICHE_HASHTAG_MAP[n] || []);
  const combined = [...new Set([...BASE_HASHTAGS, ...nicheHashtags])].slice(0, 8);
  return combined.length >= 3 ? combined : BASE_HASHTAGS;
}
