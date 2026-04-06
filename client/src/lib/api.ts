import { supabase } from './supabase';

/**
 * Authenticated fetch wrapper — attaches Bearer token from Supabase session.
 * Drop-in replacement for fetch() for /api/* calls.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    console.error(`[API] 401 on ${path} — token missing or expired`);
  }

  return res;
}
