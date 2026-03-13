/**
 * Opik LLM Observability
 *
 * Traces every AI call with input/output/latency/tokens.
 * LLM-as-judge AU relevance eval for product-discovery and meta-ads tools.
 * Graceful degradation: returns no-op when OPIK_API_KEY is not set.
 *
 * SDK: https://www.npmjs.com/package/opik
 * Dashboard: https://app.comet.ml/opik
 */

import Anthropic from '@anthropic-ai/sdk';
import { Opik } from 'opik';

let _client: Opik | null = null;

export function getOpikClient(): Opik | null {
  if (!process.env.OPIK_API_KEY) return null;
  if (!_client) {
    _client = new Opik({
      apiKey: process.env.OPIK_API_KEY,
      projectName: 'majorka-ai',
      // workspaceName defaults to the account username — can be set via OPIK_WORKSPACE env
    } as any);
  }
  return _client;
}

export interface TraceParams {
  toolName: string;
  userId?: string | null;
  input: string;
  output: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  market?: string;
  error?: string;
}

export async function logTrace(params: TraceParams): Promise<void> {
  const client = getOpikClient();
  if (!client) return;

  try {
    const trace = client.trace({
      name: `majorka/${params.toolName}`,
      startTime: new Date(Date.now() - params.latencyMs),
      endTime: new Date(),
      input: {
        prompt: params.input.slice(0, 2000),
        tool: params.toolName,
        market: params.market || 'AU',
      },
      output: {
        response: params.output.slice(0, 2000),
      },
      metadata: {
        userId: params.userId || 'anonymous',
        model: params.model,
        latencyMs: params.latencyMs,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        error: params.error,
      },
      tags: [params.toolName, params.market || 'AU', params.userId ? 'authenticated' : 'demo'],
    } as any);

    trace.end();
  } catch (err) {
    // Observability is non-critical — never fail the main request
    console.warn('[opik] trace failed:', err);
  }
}

export async function logEval(params: {
  trace: ReturnType<Opik['trace']>;
  toolName: string;
  score: number;
  scoreReason: string;
}): Promise<void> {
  try {
    params.trace.score({
      name: `${params.toolName}_au_relevance`,
      value: params.score / 10, // Normalise 1-10 → 0-1
      reason: params.scoreReason,
    });
  } catch (err) {
    console.warn('[opik] eval score failed:', err);
  }
}

export async function runAURelevanceEval(
  toolName: string,
  input: string,
  output: string,
  userId?: string | null
): Promise<void> {
  const client = getOpikClient();
  if (!client) return;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const evalPrompt = `You are an expert AU ecommerce evaluator. Score this AI response on Australian market relevance.

Tool: ${toolName}
User query: ${input.slice(0, 300)}
AI response: ${output.slice(0, 500)}

Score from 1-10 on:
- AU-specificity (mentions AUD, AusPost, Afterpay, AU platforms, AU regulations)
- Actionability (specific numbers, real suppliers, concrete steps)
- Accuracy (realistic for AU market conditions)

Respond with ONLY valid JSON: {"score": <1-10>, "reason": "<one sentence>"}`;

    const evalResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      messages: [{ role: 'user', content: evalPrompt }],
    });

    const evalText = evalResponse.content[0].type === 'text' ? evalResponse.content[0].text : '';
    const evalResult = JSON.parse(evalText) as { score: number; reason: string };

    // Log as a standalone trace with the eval score
    const evalTrace = client.trace({
      name: `majorka/${toolName}/au_eval`,
      input: { prompt: input.slice(0, 500) },
      output: { response: output.slice(0, 500) },
      metadata: {
        userId: userId || 'anonymous',
        evalType: 'au_relevance',
        score: evalResult.score || 5,
        reason: evalResult.reason || 'eval failed',
      },
      tags: [toolName, 'au_eval', 'llm-judge'],
    } as any);

    evalTrace.score({
      name: `${toolName}_au_relevance`,
      value: (evalResult.score || 5) / 10,
      reason: evalResult.reason || 'eval failed',
    });

    evalTrace.end();
  } catch (err) {
    console.warn('[opik] eval run failed:', err);
  }
}
