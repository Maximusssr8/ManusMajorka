/**
 * Admin-only tRPC router.
 * All procedures require the caller to be maximusmajorka@gmail.com.
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getSupabaseAdmin } from "../_core/supabase";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { subscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getAllLeads } from "../db";

const ADMIN_EMAIL = "maximusmajorka@gmail.com";

function requireAdmin(email: string | null | undefined) {
  if (email !== ADMIN_EMAIL) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

export const adminRouter = router({
  /** Get all admin leads (role-based) */
  getLeads: adminProcedure.query(async () => {
    return await getAllLeads();
  }),

  /** Get all Supabase auth users */
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user?.email);
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.auth.admin.listUsers();
    return data?.users || [];
  }),

  /** Platform stats */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user?.email);
    const supabase = getSupabaseAdmin();
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    const today = new Date().toISOString().split("T")[0];
    const { count: activeToday } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", today);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const { count: activeThisWeek } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", weekAgo);
    return { totalUsers, activeToday, activeThisWeek };
  }),

  /** Update a user's subscription plan */
  updateUserPlan: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        plan: z.enum(["starter", "builder", "scale", "pro"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user?.email);
      const db = getDb();
      await db
        .update(subscriptions)
        .set({ plan: input.plan })
        .where(eq(subscriptions.userId, input.userId));
      return { success: true };
    }),

  /** Send a broadcast email via Resend */
  sendBroadcast: protectedProcedure
    .input(z.object({ subject: z.string(), body: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user?.email);
      const supabase = getSupabaseAdmin();
      const { data: users } = await supabase.auth.admin.listUsers();
      const emails =
        users?.users?.map((u) => u.email).filter(Boolean) || [];
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: "Majorka AI <hello@majorka.ai>",
        to: emails.slice(0, 50) as string[],
        subject: input.subject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#080a0e;color:#fff"><h1 style="color:#d4af37">${input.subject}</h1><div style="color:#e5e7eb;line-height:1.6">${input.body}</div><p style="color:#6b7280;font-size:12px;margin-top:32px">Majorka AI · <a href="https://majorka.io" style="color:#d4af37">majorka.io</a></p></div>`,
      });
      return { sent: emails.length, result };
    }),
});
