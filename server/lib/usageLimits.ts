import { createClient } from '@supabase/supabase-js';
import { getPlanLimit, type Plan } from '../../shared/plans';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

export interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan: Plan;
}

export async function checkUsageLimit(
  userId: string,
  feature: string,
  plan: Plan
): Promise<UsageResult> {
  const limit = getPlanLimit(plan, feature);
  if (limit >= 999999) return { allowed: true, used: 0, limit, plan };

  const supabase = getSupabase();
  const month = currentMonth();

  const { data } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('month', month)
    .single();

  const used = data?.count ?? 0;
  return { allowed: used < limit, used, limit, plan };
}

export async function incrementUsage(
  userId: string,
  feature: string
): Promise<void> {
  const supabase = getSupabase();
  const month = currentMonth();

  const rpcResult = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_month: month,
  });

  if (rpcResult.error) {
    // Fallback: upsert manually if RPC not available
    const { data } = await supabase
      .from('usage_tracking')
      .select('id, count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('month', month)
      .single();

    if (data) {
      await supabase
        .from('usage_tracking')
        .update({ count: data.count + 1, updated_at: new Date().toISOString() })
        .eq('id', data.id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({ user_id: userId, feature, month, count: 1 });
    }
  }
}

export async function getUsageSummary(userId: string, plan: Plan): Promise<Record<string, { used: number; limit: number }>> {
  const supabase = getSupabase();
  const month = currentMonth();
  const { data } = await supabase
    .from('usage_tracking')
    .select('feature, count')
    .eq('user_id', userId)
    .eq('month', month);

  const result: Record<string, { used: number; limit: number }> = {};
  const features = ['product_searches', 'video_searches', 'ad_intel', 'creator_searches', 'shop_spy', 'ads_studio'];
  for (const f of features) {
    const row = (data || []).find(r => r.feature === f);
    result[f] = { used: row?.count ?? 0, limit: getPlanLimit(plan, f) };
  }
  return result;
}
