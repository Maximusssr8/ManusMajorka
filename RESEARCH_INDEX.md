# Majorka Research Index
*Cloned to ~/ManusMajorka/.research/ — do not install into main project*
*Last updated: 2026-03-13*

---

## 🔒 SECURITY

### promptfoo
**What it does:** LLM evaluation and red-teaming framework. Tests AI prompts for quality, safety, and regression. Can run automated test suites against any LLM.
**Majorka use case:** Run automated quality checks on all 13 AI tool prompts. Set up a test suite that catches regressions when prompts are changed (e.g. "validate tool must always output AUD maths"). Run nightly to ensure no tool drifts to generic output.
**npm install:** `npm install -g promptfoo` ✅ (CLI) or `npm install promptfoo` (programmatic)
**Priority:** 🟡 Medium — implement after prompts are stable

### semgrep
**What it does:** Static analysis tool that finds security vulnerabilities, code smells, and anti-patterns across codebases using rules.
**Majorka use case:** Scan the Majorka codebase for: hardcoded API keys, SQL injection risks, missing auth checks on routes, exposed env vars, insecure Supabase queries. Run before every deploy.
**npm install:** Python only (`pip install semgrep`) ✅
**Priority:** 🔴 High — run a scan now, fix issues before launch

---

## 🧪 TESTING

### playwright
**What it does:** Microsoft's end-to-end browser testing framework. Automates real browser interactions.
**Majorka use case:** Write E2E tests for: Google OAuth flow, onboarding wizard completion, each AI tool accepting input and returning output, checkout flow (when Stripe is wired), admin panel access control. Run on every PR.
**npm install:** `npm install @playwright/test` ✅
**Priority:** 🔴 High — critical before public launch, prevents broken auth/checkout reaching users

### vitest
**What it does:** Fast Vite-native unit testing framework. Drop-in Jest replacement.
**Majorka use case:** Unit tests for: `buildTemplatePreview()` function, market context injection (`buildMarketContext()`), rate limiter logic, profit calculation maths in validate tool, Supabase admin auth guard.
**npm install:** `npm install vitest` ✅ (already a Vite project — trivial to add)
**Priority:** 🟡 Medium — add unit tests for critical business logic (validate maths, rate limiter)

### storybook
**What it does:** Component development and documentation tool. Renders components in isolation with different props.
**Majorka use case:** Build a Majorka component library — DemoWidget, stat cards, glass-card variants, AI tool outputs, onboarding steps — visible without running the full app. Useful for rapid UI iteration and catching visual regressions.
**npm install:** `npx storybook@latest init` ✅
**Priority:** 🟢 Low — nice-to-have for UI consistency as team grows

---

## 🧠 AI MEMORY

### mem0
**What it does:** AI memory layer — stores user conversations and context, retrieves relevant memories when needed. Works with OpenAI, Anthropic, Ollama.
**Majorka use case:** Give Maya persistent memory across sessions. "Remember that I'm targeting gym-goers in Melbourne" — Maya references this in future conversations. Store user's winning products, ad experiments, supplier contacts. Makes the AI genuinely personal.
**npm install:** `npm install mem0ai` ✅ (JS SDK) or `pip install mem0ai` (Python)
**Priority:** 🔴 High — major differentiator. Users currently lose all context between sessions. This fixes it.

### letta
**What it does:** Stateful AI agents with persistent memory, tool use, and long-running tasks. Formerly MemGPT.
**Majorka use case:** Build a persistent Majorka agent that maintains memory of a user's entire business — their products, suppliers, ad results, goals. Could replace the current stateless Maya with a true long-running agent that proactively surfaces insights.
**npm install:** Python only (`pip install letta`) ✅
**Priority:** 🟡 Medium — more complex integration, use mem0 first for quick win

### MemOS
**What it does:** Memory operating system for LLMs — structured storage of episodic, semantic, and working memory.
**Majorka use case:** Architecture reference for implementing tiered memory in Maya: working memory (current session), episodic memory (past conversations), semantic memory (user's business knowledge base). Study their memory hierarchy design.
**npm install:** Python only (`pip install memos-agent`) ✅
**Priority:** 🟢 Low — architecture reference, implement with mem0 first

---

## 📡 AI OBSERVABILITY

### opik (Comet ML)
**What it does:** LLM observability platform — traces every AI call, logs prompts/responses, tracks quality metrics, detects regressions.
**Majorka use case:** See exactly what prompts are being sent to Claude for each tool, track response quality over time, catch when a tool starts giving worse outputs, monitor token usage and cost per tool. Self-hosted or cloud.
**npm install:** `npm install @comet-ml/opik` ✅ (JS SDK) — reference their integration patterns from the clone
**Priority:** 🔴 High — flying blind without this. Need to know which tools are underperforming and why.

---

## 🔍 RAG & AGENTS

### ragflow
**What it does:** Enterprise RAG (Retrieval Augmented Generation) engine — deep document parsing, knowledge base ingestion, hybrid search.
**Majorka use case:** Ingest Australian ecommerce data (ABS stats, AusPost reports, Meta AU ad benchmarks, Shopify AU data) into a searchable knowledge base. Maya searches this before answering questions about AU market conditions. Makes every answer data-backed.
**npm install:** Python/Docker only — no npm package
**Priority:** 🟡 Medium — requires data collection effort first. High ROI once AU data is ingested.

### mastra
**What it does:** TypeScript AI agent framework by the Gatsby team — workflows, tools, memory, vector search, evals. Native Vercel/Node.js.
**Majorka use case:** Replace the current manual Anthropic SDK tool-calling implementation with a proper agent framework. Mastra handles: tool execution, memory, multi-step reasoning, streaming. Could simplify server/_core/chat.ts significantly and add proper agent capabilities.
**npm install:** `npm install @mastra/core` ✅ — TypeScript-native, designed for exactly this stack
**Priority:** 🔴 High — study their architecture. When refactoring the AI layer, use Mastra instead of raw Anthropic SDK.

### langchainjs
**What it does:** The JavaScript version of LangChain — chains, agents, tools, memory, vector stores.
**Majorka use case:** Reference their tool-calling patterns, memory implementations, and streaming handlers. Specifically: how they handle RAG retrieval, tool result formatting, and multi-turn agent conversations. Don't use LangChain directly (too heavy), but study the patterns.
**npm install:** `npm install langchain @langchain/anthropic` ✅ — but prefer Mastra for new Majorka code
**Priority:** 🟢 Low — reference only, Mastra is the better choice for this stack

---

## ⚡ CODE QUALITY

### biome
**What it does:** Extremely fast JavaScript/TypeScript linter and formatter (Rust-based). Replaces ESLint + Prettier in one tool. 35x faster than Prettier.
**Majorka use case:** Replace the current ESLint/Prettier setup. Run `biome check --apply` to auto-fix all lint/format issues. Add to CI pipeline and pre-commit hooks. Keeps the 20k+ line codebase consistent.
**npm install:** `npm install --save-dev @biomejs/biome` ✅ — TypeScript-native, zero config needed
**Priority:** 🟡 Medium — easy win, do it in a single session. Dramatically improves DX.

---

## 📊 PRIORITY SUMMARY

### 🔴 High Priority (do soon)
| Repo | Why Now |
|------|---------|
| **mem0** | Persistent Maya memory — users lose context every session, this fixes it. `npm install mem0ai` |
| **mastra** | Proper agent framework — replace manual Anthropic SDK calls. TypeScript-native. `npm install @mastra/core` |
| **opik** | AI observability — know which tools underperform before users do. `npm install @comet-ml/opik` |
| **playwright** | E2E tests — catch broken auth/checkout before users. `npm install @playwright/test` |
| **semgrep** | Security scan — find auth bypasses and hardcoded secrets before launch. `pip install semgrep` |

### 🟡 Medium Priority (next 2 weeks)
| Repo | Why |
|------|-----|
| **promptfoo** | Automated prompt regression testing — prevents tool quality drift |
| **vitest** | Unit tests for profit maths, rate limiter, market context |
| **letta** | Stateful long-running Maya agent (after mem0 is working) |
| **ragflow** | AU market data knowledge base (requires data collection first) |
| **biome** | Replace ESLint/Prettier — one command, done |

### 🟢 Low Priority (future)
| Repo | Why |
|------|-----|
| **storybook** | Component library — useful when team grows |
| **MemOS** | Architecture reference only |
| **langchainjs** | Reference patterns only — use Mastra instead |

---

## ⚡ QUICK WINS (can install right now without breaking anything)

```bash
# These can be added to Majorka immediately:
npm install mem0ai              # Maya persistent memory
npm install @mastra/core        # Agent framework (study first)  
npm install @playwright/test    # E2E testing
npm install vitest              # Unit testing
npm install --save-dev @biomejs/biome  # Linting
pip install semgrep             # Security scan (run once)
```

