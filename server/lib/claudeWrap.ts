/**
 * Majorka — centralised Claude API wrapper.
 *
 * All Claude calls in the server should flow through callClaude() so we can:
 *  1. Default to Haiku (3x cheaper than Sonnet) unless caller explicitly opts in.
 *  2. Enforce a sane per-feature max_tokens cap.
 *  3. Apply ephemeral prompt caching on system prompts.
 *  4. Log cost + token usage to api_cost_log (fire-and-forget).
 *
 * Direct use of `anthropic.messages.create` outside this file is banned.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
export const SONNET_MODEL = 'claude-sonnet-4-6';

// Per-feature cap (tokens). Keep conservative — callers can override but
// the default should never explode a bill.
const MAX_TOKENS_BY_FEATURE: Record<string, number> = {
  ai_brief: 400,
  ads_generation: 600,
  maya_simple: 300,
  maya_complex: 800,
  store_generation: 500,
  default: 500,
};

// Anthropic per-MTok pricing (Apr 2026 — verify periodically).
//   haiku-4-5:  $0.25 input  / $1.25 output
//   sonnet-4-6: $3.00 input  / $15.00 output
const PRICING: Record<string, { input: number; output: number }> = {
  [HAIKU_MODEL]:  { input: 0.00000025, output: 0.00000125 },
  [SONNET_MODEL]: { input: 0.000003,   output: 0.000015   },
};

/* ── Monthly spend ceiling ─────────────────────────────────────── */

const MONTHLY_CEILING_USD = 200;

let _monthlySpendCache: { total: number; checkedAt: number } = { total: 0, checkedAt: 0 };
const CACHE_TTL = 60_000; // re-check every 60s

async function getMonthlySpend(sb: ReturnType<typeof createClient>): Promise<number> {
  const now = Date.now();
  if (now - _monthlySpendCache.checkedAt < CACHE_TTL) return _monthlySpendCache.total;

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (sb.from('api_cost_log') as any)
      .select('estimated_cost_usd')
      .gte('created_at', startOfMonth.toISOString());

    const total = (data || []).reduce((sum: number, r: { estimated_cost_usd?: number }) => sum + (Number(r.estimated_cost_usd) || 0), 0);
    _monthlySpendCache = { total, checkedAt: now };
    return total;
  } catch {
    return _monthlySpendCache.total; // on error, use stale cache
  }
}

/* ── Anthropic client singleton ────────────────────────────────── */

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase(): ReturnType<typeof createClient> | null {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

export interface CallClaudeOptions {
  feature: string;
  userId?: string | null;
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: unknown }>;
  maxTokens?: number;
  /** Permits Sonnet. Default: Haiku only. */
  allowSonnet?: boolean;
  /** Force a specific model (overrides default/allowSonnet). */
  model?: string;
  /** Pass-through: temperature, top_p, stop_sequences, tools, tool_choice, stream, etc. */
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  tools?: unknown;
  toolChoice?: unknown;
  /** Opt-in streaming — caller gets the MessageStream instead of Message. */
  stream?: boolean;
  /** Escape hatch — any additional fields passed straight to messages.create. */
  extra?: Record<string, unknown>;
}

function pickModel(opts: CallClaudeOptions): string {
  if (opts.model) return opts.model;
  if (opts.allowSonnet) return SONNET_MODEL;
  return HAIKU_MODEL;
}

function pickMaxTokens(opts: CallClaudeOptions): number {
  if (typeof opts.maxTokens === 'number' && opts.maxTokens > 0) return opts.maxTokens;
  return MAX_TOKENS_BY_FEATURE[opts.feature] ?? MAX_TOKENS_BY_FEATURE.default;
}

function buildSystem(system: string | undefined): string | Array<{ type: 'text'; text: string; cache_control: { type: 'ephemeral' } }> | undefined {
  if (!system) return undefined;
  return [
    { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
  ];
}

interface UsageLike {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

function estimateCostUsd(model: string, usage: UsageLike): number {
  const price = PRICING[model];
  if (!price) return 0;
  const baseInput = usage.input_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  const cacheCreate = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const inputCost = baseInput * price.input;
  const outputCost = out * price.output;
  const cacheCreateCost = cacheCreate * price.input * 1.25; // 25% premium
  const cacheReadCost = cacheRead * price.input * 0.1;      // 90% discount
  return inputCost + outputCost + cacheCreateCost + cacheReadCost;
}

function logCost(params: {
  feature: string;
  userId?: string | null;
  model: string;
  usage: UsageLike;
}): void {
  const sb = getSupabase();
  if (!sb) return;
  const cost = estimateCostUsd(params.model, params.usage);
  // Fire-and-forget. Do NOT await.
  const row = {
    feature: params.feature,
    user_id: params.userId ?? null,
    input_tokens: params.usage.input_tokens ?? null,
    output_tokens: params.usage.output_tokens ?? null,
    cache_creation_input_tokens: params.usage.cache_creation_input_tokens ?? null,
    cache_read_input_tokens: params.usage.cache_read_input_tokens ?? null,
    model: params.model,
    estimated_cost_usd: cost,
  };
  // Table is not in generated types — cast for the insert call only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (sb.from('api_cost_log') as any)
    .insert(row)
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) console.warn('[claudeWrap] cost log insert failed:', error.message);
    }, (err: unknown) => {
      console.warn('[claudeWrap] cost log insert rejected:', err instanceof Error ? err.message : String(err));
    });
}

/**
 * Unified Claude call. Returns the raw Anthropic Message.
 *
 * Example:
 *   const msg = await callClaude({
 *     feature: 'ai_brief',
 *     userId: req.user?.userId,
 *     system: 'You are an ecommerce analyst.',
 *     messages: [{ role: 'user', content: 'Analyse this product.' }],
 *   });
 */
export async function callClaude(opts: CallClaudeOptions): Promise<Anthropic.Messages.Message> {
  const client = getClient();
  const model = pickModel(opts);
  const max_tokens = pickMaxTokens(opts);
  const system = buildSystem(opts.system);

  // Monthly spend ceiling — soft check (cached, re-queries every 60s).
  const sb = getSupabase();
  if (sb) {
    const monthlySpend = await getMonthlySpend(sb);
    if (monthlySpend >= MONTHLY_CEILING_USD) {
      console.warn(`[claudeWrap] Monthly ceiling hit: $${monthlySpend.toFixed(2)} >= $${MONTHLY_CEILING_USD}`);
      throw new Error('Monthly AI budget reached. Try again next month or contact support.');
    }
  }

  // Build passthrough body; only include defined fields so Anthropic SDK
  // doesn't see stray `undefined` props.
  const body: Record<string, unknown> = {
    model,
    max_tokens,
    messages: opts.messages,
  };
  if (system) body.system = system;
  if (typeof opts.temperature === 'number') body.temperature = opts.temperature;
  if (typeof opts.topP === 'number') body.top_p = opts.topP;
  if (opts.stopSequences) body.stop_sequences = opts.stopSequences;
  if (opts.tools) body.tools = opts.tools;
  if (opts.toolChoice) body.tool_choice = opts.toolChoice;
  if (opts.extra) Object.assign(body, opts.extra);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await client.messages.create(body as any) as Anthropic.Messages.Message;

  try {
    logCost({
      feature: opts.feature,
      userId: opts.userId,
      model,
      usage: resp.usage as UsageLike,
    });
  } catch (err) {
    console.warn('[claudeWrap] logCost threw:', err instanceof Error ? err.message : err);
  }

  return resp;
}
