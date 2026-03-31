-- Migration: Add discord_user_id to users table
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ievekuazsjbdrltsdksn/sql/new

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;

-- Optional: index for fast lookup during role sync
CREATE INDEX IF NOT EXISTS idx_users_discord_user_id
  ON users (discord_user_id)
  WHERE discord_user_id IS NOT NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'discord_user_id';
