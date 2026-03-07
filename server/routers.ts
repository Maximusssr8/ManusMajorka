import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getSubscriptionByUserId,
  hasActiveSubscription,
  createSubscription,
  updateSubscriptionStatus,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  subscription: router({
    /** Get the current user's subscription (null if none). */
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getSubscriptionByUserId(ctx.user.id) ?? null;
    }),

    /** Check whether the current user has active access. */
    hasAccess: protectedProcedure.query(async ({ ctx }) => {
      const active = await hasActiveSubscription(ctx.user.id);
      return { hasAccess: active };
    }),

    /**
     * Activate a subscription for the current user.
     * In production this would be triggered by a payment webhook.
     * For now it can be called directly (e.g. after Stripe checkout success).
     */
    activate: protectedProcedure
      .input(
        z.object({
          plan: z.string().default("pro"),
          externalRef: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getSubscriptionByUserId(ctx.user.id);
        if (existing?.status === "active") {
          return { success: true, subscription: existing };
        }
        // Set period end to 30 days from now
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const sub = await createSubscription({
          userId: ctx.user.id,
          status: "active",
          plan: input.plan,
          priceInCents: 9900,
          currency: "USD",
          periodStart: new Date(),
          periodEnd,
          externalRef: input.externalRef ?? null,
        });
        return { success: true, subscription: sub };
      }),

    /** Cancel the current user's subscription (access until period end). */
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const sub = await getSubscriptionByUserId(ctx.user.id);
      if (!sub || sub.status !== "active") {
        return { success: false, message: "No active subscription found." };
      }
      await updateSubscriptionStatus(ctx.user.id, "cancelled");
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
