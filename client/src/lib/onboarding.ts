/**
 * Supabase-backed onboarding state helper.
 * Falls back to localStorage if user not authenticated.
 */
import { supabase } from './supabase';

export type OnboardingStep = 'scouted_product' | 'generated_store' | 'connected_shopify' | 'pushed_to_shopify';

export interface OnboardingState {
  scouted_product: boolean;
  generated_store: boolean;
  connected_shopify: boolean;
  pushed_to_shopify: boolean;
}

const LS_KEY = 'majorka_onboarding_v2';

function getLocalState(): OnboardingState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { scouted_product: false, generated_store: false, connected_shopify: false, pushed_to_shopify: false };
}

function setLocalState(state: OnboardingState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export async function getOnboardingState(userId?: string): Promise<OnboardingState> {
  if (!userId) return getLocalState();
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('scouted_product,generated_store,connected_shopify,pushed_to_shopify')
    .eq('user_id', userId)
    .single();
  if (error || !data) return getLocalState();
  return data as OnboardingState;
}

export async function markOnboardingStep(step: OnboardingStep, userId?: string): Promise<void> {
  // Always update local state
  const local = getLocalState();
  local[step] = true;
  setLocalState(local);

  if (!userId) return;
  // Upsert to Supabase
  await supabase
    .from('user_onboarding')
    .upsert({ user_id: userId, [step]: true }, { onConflict: 'user_id' });
}
