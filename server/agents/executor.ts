/**
 * Agent Executor
 *
 * Runs a single Majorka AI agent (tool) and returns the full response.
 * Non-streaming version of the chat endpoint, designed for programmatic use.
 */

import { getAnthropicClient, CLAUDE_MODEL, BASE_SYSTEM_PROMPT } from "../lib/anthropic";
import { getAgent } from "./tools";

export interface ExecuteAgentOptions {
  agentId: string;
  prompt: string;
  context?: string;
}

export interface ExecuteAgentResult {
  agentId: string;
  response: string;
  tokensUsed: { input: number; output: number };
}

/**
 * Execute a single agent with the given prompt and return the full response.
 */
export async function executeAgent(options: ExecuteAgentOptions): Promise<ExecuteAgentResult> {
  const { agentId, prompt, context } = options;

  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  let system = `${BASE_SYSTEM_PROMPT}\n\n${agent.systemPrompt}`;
  if (context) {
    system += `\n\n--- ADDITIONAL CONTEXT ---\n${context}\n--- END CONTEXT ---`;
  }

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    agentId,
    response: text,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
