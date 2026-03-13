import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './env';

/**
 * Server-side Supabase client using the service role key.
 * Lazily initialized to avoid crashing when env vars are missing in dev.
 */
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
      throw new Error(
        'Supabase env vars (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured.'
      );
    }
    _supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}
