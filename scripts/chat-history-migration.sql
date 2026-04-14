-- Maya AI per-user chat history persistence.
--
-- Idempotent: safe to run multiple times. chat_messages already exists
-- in production with a tool_name column (see server/_core/chat.ts) — this
-- migration ensures the canonical schema described in the Maya upgrade
-- spec is present, adds the required index for fast per-user lookups,
-- and enforces user-scoped RLS.

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional tool_name column (kept for backward compatibility with the
-- existing multi-tool chat surface).
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS tool_name text NOT NULL DEFAULT 'ai-chat';

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_tool_created
  ON public.chat_messages (user_id, tool_name, created_at DESC);

-- Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_own" ON public.chat_messages;
CREATE POLICY "chat_messages_select_own"
  ON public.chat_messages FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_own"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "chat_messages_delete_own" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_own"
  ON public.chat_messages FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Server uses the service_role key which bypasses RLS — these policies
-- only gate direct anon/authenticated client access.
