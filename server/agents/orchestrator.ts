/**
 * Agent Orchestrator
 *
 * The "main agent" that receives a user request, analyses it, decides which
 * sub-agents to invoke, runs them in parallel, and compiles the results into
 * a final summary. Designed to be triggered from N8N via HTTP Request nodes.
 */

import { getAnthropicClient, CLAUDE_MODEL, BASE_SYSTEM_PROMPT } from "../lib/anthropic";
import { listAgents } from "./tools";
import { executeAgent } from "./executor";
import {
  createOrder,
  addTask,
  updateTask,
  updateOrder,
  type AgentOrder,
} from "./store";

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Majorka Orchestrator — a master AI coordinator that manages a team of specialised ecommerce AI agents.

Your job is to:
1. Analyse the user's request
2. Decide which specialist agents should handle different parts of the request
3. Create specific, targeted prompts for each agent

You have access to the following specialist agents:

${listAgents().map((a) => `- **${a.id}** (${a.label}): ${a.description}`).join("\n")}

RESPONSE FORMAT — You MUST respond with valid JSON only, no markdown fences:
{
  "plan": "Brief description of your execution plan",
  "tasks": [
    {
      "agentId": "agent-id-from-list-above",
      "prompt": "Specific prompt for this agent based on the user's request"
    }
  ]
}

RULES:
- Select 1–5 agents that are most relevant to the request
- Write specific, detailed prompts for each agent — don't just forward the user's message
- Each prompt should focus that agent on its speciality area
- If the request is simple and only needs one agent, use just one
- If you're unsure which agent to use, default to "ai-chat" (the co-founder)
- Always respond with valid JSON — nothing else`;

export interface OrchestratorResult {
  order: AgentOrder;
}

/**
 * Orchestrate a multi-agent workflow from a user message.
 * Returns the order with all task results populated.
 */
export async function orchestrate(userMessage: string, context?: string): Promise<OrchestratorResult> {
  const order = createOrder(userMessage);

  try {
    // Step 1: Ask the orchestrator to plan which agents to use
    const client = getAnthropicClient();
    const planResponse = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: ORCHESTRATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const planText = planResponse.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse the orchestrator's plan
    let plan: { plan: string; tasks: { agentId: string; prompt: string }[] };
    try {
      plan = JSON.parse(planText);
    } catch {
      // If JSON parsing fails, fall back to ai-chat
      plan = {
        plan: "Routing to AI Co-founder for general assistance",
        tasks: [{ agentId: "ai-chat", prompt: userMessage }],
      };
    }

    updateOrder(order.id, { orchestratorPlan: plan.plan, status: "running" });

    // Step 2: Create tasks and execute agents in parallel
    const taskEntries = plan.tasks.map((t) => {
      const agentDef = listAgents().find((a) => a.id === t.agentId);
      const task = addTask(order.id, t.agentId, agentDef?.label ?? t.agentId, t.prompt);
      return { task, prompt: t.prompt, agentId: t.agentId };
    });

    const results = await Promise.allSettled(
      taskEntries.map(async ({ task, prompt, agentId }) => {
        updateTask(order.id, task.id, {
          status: "running",
          startedAt: new Date().toISOString(),
        });

        try {
          const result = await executeAgent({ agentId, prompt, context });
          updateTask(order.id, task.id, {
            status: "completed",
            result: result.response,
            completedAt: new Date().toISOString(),
          });
          return result;
        } catch (err: any) {
          updateTask(order.id, task.id, {
            status: "failed",
            error: err.message || "Agent execution failed",
            completedAt: new Date().toISOString(),
          });
          throw err;
        }
      })
    );

    // Step 3: Generate a summary of all agent results
    const completedResults = results
      .map((r, i) => {
        if (r.status === "fulfilled") {
          return `## ${taskEntries[i].task.agentLabel}\n${r.value.response}`;
        }
        return `## ${taskEntries[i].task.agentLabel}\n*Failed: ${(r as PromiseRejectedResult).reason?.message || "Unknown error"}*`;
      })
      .join("\n\n---\n\n");

    // Generate final summary
    const summaryResponse = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: `${BASE_SYSTEM_PROMPT}\n\nYou are the Majorka Orchestrator. You've delegated tasks to specialist agents and received their results. Provide a cohesive executive summary that synthesises all the agent outputs into a clear, actionable brief. Highlight the key insights from each agent and end with consolidated next steps.`,
      messages: [
        {
          role: "user",
          content: `Original request: "${userMessage}"\n\nAgent results:\n\n${completedResults}`,
        },
      ],
    });

    const summary = summaryResponse.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    updateOrder(order.id, { summary, status: "completed" });

    return { order: { ...order, summary, status: "completed" } };
  } catch (err: any) {
    updateOrder(order.id, { status: "failed" });
    throw err;
  }
}
