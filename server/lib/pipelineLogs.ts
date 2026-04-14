/**
 * pipeline_logs helpers — startRun / finishRun.
 *
 * The `pipeline_logs` table is shared with legacy cron jobs (server/routes/cron.ts
 * uses its own helpers). This module only owns the columns we added in
 * scripts/pipeline-logs-migration.sql: finished_at, duration_ms,
 * products_added, products_updated, products_rejected, source_breakdown.
 *
 * Service-role key required — writes bypass RLS.
 */

import { getSupabaseAdmin } from '../_core/supabase';

export type RunStatus = 'running' | 'success' | 'partial' | 'error';

export interface SourceBreakdown {
  trending: number;
  bestsellers: number;
  hot: number;
  new_arrivals: number;
  [key: string]: number;
}

export interface FinishRunInput {
  products_added: number;
  products_updated: number;
  products_rejected: number;
  source_breakdown: SourceBreakdown;
  status: RunStatus;
  error_message?: string | null;
}

export interface ActiveRun {
  id: string;
  startedAt: number;
}

const PIPELINE_TYPE = 'apify-pintostudio';

/**
 * Insert a 'running' row and return its id. Returns null if Supabase is
 * unreachable or unconfigured — callers must treat that as a soft failure
 * and continue without logging (the pipeline still runs).
 */
export async function startRun(): Promise<ActiveRun | null> {
  try {
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('pipeline_logs')
      .insert({
        pipeline_type: PIPELINE_TYPE,
        source: PIPELINE_TYPE,
        status: 'running',
        started_at: nowIso,
      })
      .select('id')
      .single();
    if (error || !data?.id) return null;
    return { id: data.id as string, startedAt: Date.now() };
  } catch {
    return null;
  }
}

export async function finishRun(
  run: ActiveRun | null,
  input: FinishRunInput,
): Promise<void> {
  if (!run) return;
  try {
    const supabase = getSupabaseAdmin();
    const finishedAtMs = Date.now();
    const durationMs = finishedAtMs - run.startedAt;
    await supabase
      .from('pipeline_logs')
      .update({
        status: input.status,
        finished_at: new Date(finishedAtMs).toISOString(),
        completed_at: new Date(finishedAtMs).toISOString(),
        duration_ms: durationMs,
        duration_seconds: Math.round(durationMs / 1000),
        products_added: input.products_added,
        products_updated: input.products_updated,
        products_rejected: input.products_rejected,
        source_breakdown: input.source_breakdown,
        inserted: input.products_added,
        updated: input.products_updated,
        skipped: input.products_rejected,
        error_message: input.error_message ?? null,
      })
      .eq('id', run.id);
  } catch {
    /* non-fatal */
  }
}
