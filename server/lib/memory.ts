/**
 * mem0 Persistent Memory
 *
 * Gives Maya (the AI chat assistant) long-term memory across sessions.
 * Gracefully degrades: if MEM0_API_KEY is not set, all functions are no-ops.
 */

import { type Memory as Mem0Memory, MemoryClient } from 'mem0ai';

// Initialise once — reused across requests
let _client: MemoryClient | null = null;

function getMemoryClient(): MemoryClient | null {
  if (!process.env.MEM0_API_KEY) return null;
  if (!_client) {
    _client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
  }
  return _client;
}

export interface Memory {
  id: string;
  memory: string;
  score?: number;
}

/**
 * Search for relevant memories for a user before responding.
 * Returns a formatted string ready to inject into a system prompt.
 */
export async function searchMemories(userId: string, query: string): Promise<string> {
  const client = getMemoryClient();
  if (!client) return '';

  try {
    const results = await client.search(query, {
      user_id: userId,
      limit: 5,
    });

    if (!results || results.length === 0) return '';

    const memories = results
      .filter((r: Mem0Memory) => r.memory)
      .map((r: Mem0Memory) => `- ${r.memory}`)
      .join('\n');

    return memories ? `What I know about this user:\n${memories}` : '';
  } catch (err) {
    // Memory is non-critical — never fail the main request
    console.warn('[mem0] search failed:', err);
    return '';
  }
}

/**
 * Add a conversation turn to memory after responding.
 * Fire-and-forget — call without await.
 */
export async function addMemory(
  userId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<void> {
  const client = getMemoryClient();
  if (!client) return;

  try {
    await client.add(messages, { user_id: userId });
  } catch (err) {
    console.warn('[mem0] add failed:', err);
  }
}

/**
 * Get all memories for a user (for admin/debug display).
 */
export async function getAllMemories(userId: string): Promise<Memory[]> {
  const client = getMemoryClient();
  if (!client) return [];

  try {
    const results = await client.getAll({ user_id: userId });
    return (results || []).map((r: Mem0Memory) => ({
      id: r.id,
      memory: r.memory || '',
      score: r.score,
    }));
  } catch (err) {
    console.warn('[mem0] getAll failed:', err);
    return [];
  }
}
