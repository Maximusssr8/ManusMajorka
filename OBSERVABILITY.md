# Majorka AI Observability — Opik

## Dashboard
- URL: https://app.comet.ml/opik (or https://opik.ai)
- Project: majorka-ai
- Sign up at: https://www.comet.ml/signup

## Getting your API key
1. Sign up at comet.ml or opik.ai
2. Go to Settings → API Keys
3. Create a new key
4. Set OPIK_API_KEY in .env.local and Vercel env vars

## What's traced (every AI call)
| Field | What it captures |
|-------|-----------------|
| name | majorka/{toolName} |
| input.prompt | First 2000 chars of user message |
| input.tool | Tool name (product-discovery, meta-ads, etc) |
| input.market | AU / US / EU etc |
| output.response | First 2000 chars of AI response |
| metadata.userId | Supabase user ID (anonymous for demo users) |
| metadata.model | claude-sonnet-4-5-20250929 |
| metadata.latencyMs | Total response time |
| metadata.inputTokens | Tokens sent to Claude |
| metadata.outputTokens | Tokens returned by Claude |
| tags | [toolName, market, authenticated/demo] |

## LLM-as-Judge Evals (auto-run on every call)
Tools evaluated: product-discovery, meta-ads, meta-ads-pack
Evaluator model: claude-haiku-4-5 (cheap)
Score: 1-10 on AU relevance, actionability, accuracy — normalised to 0-1 for Opik
Cost: ~$0.001 per eval call

## Estimated costs (Opik itself is free/OSS)
Eval overhead: ~$0.001 per product-discovery or meta-ads call
No overhead on other tools

## Graceful degradation
If OPIK_API_KEY is not set:
- `getOpikClient()` returns null
- `logTrace()` returns immediately (no-op)
- `runAURelevanceEval()` returns immediately (no-op)
- The main chat request is NEVER affected — all trace calls are fire-and-forget with `.catch(() => {})`

## Files changed
- server/lib/opik.ts (new) — Opik client, logTrace, runAURelevanceEval
- server/_core/chat.ts (modified) — timing + trace wiring at end of both streaming and non-streaming paths
- .env.local (OPIK_API_KEY=opik_placeholder added)
- OBSERVABILITY.md (this file)
