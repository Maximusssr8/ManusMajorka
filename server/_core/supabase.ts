import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

/**
 * Server-side Supabase client using the service role key.
 * Used for verifying access tokens and admin operations.
 */
export const supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
