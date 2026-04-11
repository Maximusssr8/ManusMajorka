import { getSupabaseAdmin } from '../_core/supabase';

function getCurrentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function incrementUsage(userId: string, metric: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { start, end } = getCurrentPeriod();

  const { data: existing } = await sb
    .from('usage_counters')
    .select('id, count')
    .eq('user_id', userId)
    .eq('metric', metric)
    .eq('period_start', start)
    .maybeSingle();

  if (existing) {
    await sb.from('usage_counters').update({
      count: existing.count + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await sb.from('usage_counters').insert({
      user_id: userId,
      metric,
      count: 1,
      period_start: start,
      period_end: end,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function getUsage(userId: string, metric: string): Promise<number> {
  const sb = getSupabaseAdmin();
  const { start } = getCurrentPeriod();

  const { data } = await sb
    .from('usage_counters')
    .select('count')
    .eq('user_id', userId)
    .eq('metric', metric)
    .eq('period_start', start)
    .maybeSingle();

  return data?.count ?? 0;
}

export async function getAllUsage(userId: string): Promise<Record<string, number>> {
  const sb = getSupabaseAdmin();
  const { start } = getCurrentPeriod();

  const { data } = await sb
    .from('usage_counters')
    .select('metric, count')
    .eq('user_id', userId)
    .eq('period_start', start);

  if (!data) return {};
  return Object.fromEntries(data.map((r: any) => [r.metric, r.count]));
}
