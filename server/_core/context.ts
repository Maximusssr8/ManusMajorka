import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Profile } from "../../drizzle/schema";
import { getSupabaseAdmin } from "./supabase";
import { upsertProfile, getProfileById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: Profile | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: Profile | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user: supabaseUser }, error } = await getSupabaseAdmin().auth.getUser(token);

      if (!error && supabaseUser) {
        // Ensure profile exists in our database
        let profile = await getProfileById(supabaseUser.id);
        if (!profile) {
          await upsertProfile({
            id: supabaseUser.id,
            email: supabaseUser.email ?? null,
            name: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
            avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
            lastSignedIn: new Date(),
          });
          profile = await getProfileById(supabaseUser.id);
        }
        user = profile ?? null;
      }
    }
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
