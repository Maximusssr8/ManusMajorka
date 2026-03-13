import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Profile } from '../../drizzle/schema';
import { getProfileById, upsertProfile } from '../db';
import { getSupabaseAdmin } from './supabase';

export type TrpcContext = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: Profile | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: Profile | null = null;

  const authHeader = opts.req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const {
        data: { user: supabaseUser },
        error,
      } = await getSupabaseAdmin().auth.getUser(token);

      if (!error && supabaseUser) {
        try {
          // Ensure profile exists in our database
          let profile = await getProfileById(supabaseUser.id);
          if (!profile) {
            await upsertProfile({
              id: supabaseUser.id,
              email: supabaseUser.email ?? null,
              name:
                supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
              avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
              lastSignedIn: new Date(),
            });
            profile = await getProfileById(supabaseUser.id);
          }
          user = profile ?? null;
        } catch {
          // DB unavailable — return a synthetic profile so the UI can show user info
          user = {
            id: supabaseUser.id,
            email: supabaseUser.email ?? null,
            name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
            avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
          } as Profile;
        }
      }
    } catch {
      // Token verification failed — leave user as null
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
