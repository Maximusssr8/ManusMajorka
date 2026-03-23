---
name: superagent-patterns
description: Multi-agent orchestration patterns from ByteDance DeerFlow — task decomposition, parallel subagents, research pipelines, state reducers. Use for parallel product fetching and multi-agent research.
---

# Superagent Orchestration Patterns (from DeerFlow)

Production multi-agent framework on LangGraph. Lead agent spawns background subagents, communicates via state reducers, runs long tasks with polling + SSE streaming.

## Architecture

```
Lead Agent (LangGraph)
├── Middleware Chain (11 layers, composable)
├── Tool Registry (builtins + MCP + custom)
├── Subagent Executor (ThreadPoolExecutor, max 3 concurrent)
└── Memory System (file-based JSON, per-agent)
```

## Task Decomposition: Spawn + Poll

Subagents are background ThreadPoolExecutor tasks (not async continuations):

```python
@dataclass
class SubagentConfig:
    name: str
    description: str
    system_prompt: str
    tools: list[str] | None = None         # allowlist (None = inherit all)
    disallowed_tools: list[str] | None = field(default_factory=lambda: ["task"])
    model: str = "inherit"
    max_turns: int = 50
    timeout_seconds: int = 900              # 15 minutes default
```

**Key:** Subagents cannot spawn subagents (`"task"` in disallowed_tools) — no infinite nesting.

## Background Task Execution

```python
@tool("task")
def task_tool(runtime, description, prompt, subagent_type, ...):
    task_id = executor.execute_async(prompt)

    while True:
        result = get_background_task_result(task_id)

        # Stream AI messages via SSE
        if new_messages:
            writer({"type": "task_running", "task_id": task_id, "message": msg})

        if result.status == COMPLETED: return f"Result: {result.result}"
        if result.status == FAILED: return f"Error: {result.error}"
        time.sleep(5)  # poll every 5s

        if poll_count > max_poll_count: return "Task timed out"
```

## State Reducers: Agent Communication

```python
def merge_artifacts(existing, new):
    """Deduplicate and merge artifact lists."""
    return list(dict.fromkeys((existing or []) + (new or [])))

class ThreadState(AgentState):
    messages: list[BaseMessage]
    artifacts: Annotated[list[str], merge_artifacts]    # custom reducer
    todos: NotRequired[list | None]
```

**Pattern:** Sub-agents return results → lead agent reduces into shared state.

## Middleware Chain (Composable)

```python
middlewares = [
    ThreadDataMiddleware(),        # workspace setup
    UploadsMiddleware(),           # file processing
    SandboxMiddleware(),           # isolation
    ToolErrorHandlingMiddleware(), # exception → ToolMessage
    # Dynamic:
    SummarizationMiddleware(),     # if enabled
    TodoListMiddleware(),          # if plan_mode
    TitleMiddleware(),
    MemoryMiddleware(),
    ViewImageMiddleware(),         # if vision model
    SubagentLimitMiddleware(3),    # max concurrent
    LoopDetectionMiddleware(),     # break infinite loops
    ClarificationMiddleware(),     # ALWAYS LAST
]
```

## Research Pipeline (4-Phase)

```
Phase 1: Broad Exploration — survey landscape, identify dimensions
Phase 2: Deep Dive — targeted queries, multiple phrasings, full content
Phase 3: Diversity — facts, examples, expert views, criticisms
Phase 4: Synthesis — verify coverage, concrete data, current sources
```

## Majorka Application

### Parallel Product Fetching

```
Lead Agent: "Find 30 trending products for AU market"

Spawns 5 parallel subagents:
├── Agent 1: DataHub "wireless earbuds" + "LED lights"
├── Agent 2: DataHub "skincare tools" + "fitness gadgets"
├── Agent 3: DataHub "home decor" + "pet accessories"
├── Agent 4: DataHub "kitchen gadgets" + "phone accessories"
└── Agent 5: DataHub "beauty tools" + "outdoor gear"

Merge via state reducer → dedup → AI score → insert trend_signals
```

### Trend Enrichment (Parallel Tavily)

```
Per product (parallel):
├── Tavily: "{product} trending Australia 2026"
├── Tavily: "{product} TikTok viral"
├── Tavily: "{product} review complaints"
→ Merge: trendBoost, news mentions, TikTok signals
```

### Feature Development Pattern

```
1. Planner → task breakdown with dependencies
2. Architect → component structure + API contracts
3. TDD agent → test cases (RED)
4. Implementation agent → code (GREEN)
5. Code reviewer → quality + security
6. Verification agent → build + types + coverage
```

### Claude Code Integration

```typescript
// Launch 3 parallel agents:
Agent({ prompt: "Fetch AliExpress 'earbuds'", subagent_type: "general-purpose" })
Agent({ prompt: "Fetch AliExpress 'LED strip'", subagent_type: "general-purpose" })
Agent({ prompt: "Fetch AliExpress 'phone case'", subagent_type: "general-purpose" })
```

## Key Patterns

| Pattern | When to Use |
|---------|-------------|
| Spawn + Poll | Long tasks (>30s) — don't block lead agent |
| State Reducers | Merge parallel results (dedup, combine) |
| Middleware Chain | Cross-cutting concerns (auth, logging) |
| Subagent Limits | Max 3 concurrent, prevent exhaustion |
| Loop Detection | Break infinite retry cycles |
| Config-Driven Skills | Load capabilities lazily per task |
| Memory per Agent | Persist learnings without contamination |
