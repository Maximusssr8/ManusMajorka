# Maya Memory Integration (mem0)

## Setup
- Package: `mem0ai` (npm)
- API: mem0.ai cloud service
- Auth: MEM0_API_KEY env var

## How it works
1. User sends a message to any Majorka AI tool
2. `searchMemories(userId, query)` runs BEFORE prompt is built
3. Top 5 relevant memories injected into system prompt as "What I know about this user:"
4. After response, `addMemory(userId, [user_msg, assistant_msg])` runs in background
5. Over time, Maya learns: user's niche, preferred suppliers, past winning products, brand style

## What Maya learns automatically
- User's niche and market from tool usage ("posture corrector AU market")
- Brand preferences from website generator ("minimalist black and gold")
- Supplier preferences from supplier finder calls
- Price points they target
- Ad angles that have worked

## To get your API key
1. Go to https://mem0.ai
2. Sign up (free tier available)
3. Go to Settings → API Keys
4. Replace the `m0-placeholder` value in:
   - `.env.local` (MEM0_API_KEY=your-real-key)
   - Vercel env vars (Dashboard → Project → Settings → Environment Variables)

## Graceful degradation
- If MEM0_API_KEY is not set: `getMemoryClient()` returns null, all memory functions return empty/void
- If mem0 API is down: try/catch returns empty string, main AI call continues normally
- Memory is NEVER on the critical path — a failure never breaks the chat

## tRPC endpoint
`trpc.profile.getMemories.query()` returns all stored memories for the current user.
Useful for admin/debug or future "view my memory" UI.

## Files changed
- `server/lib/memory.ts` (new) — mem0 client, searchMemories, addMemory, getAllMemories
- `server/_core/chat.ts` (modified) — memory search injected before system prompt; addMemory called after every response
- `server/routers.ts` (modified) — `profile.getMemories` tRPC procedure added
- `client/src/pages/AIChat.tsx` (modified) — subtle memory indicator when logged in + has chat history
- `.env.local` — MEM0_API_KEY=m0-placeholder added
- Vercel — MEM0_API_KEY encrypted env var added to production + preview
