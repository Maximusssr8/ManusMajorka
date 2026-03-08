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
import { tavilySearch, tavilyExtract, tavilyImageSearch } from "./tavily";

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

  /** Tavily web search & extract procedures */
  research: router({
    /** General web search — used by Trend Radar, Product Discovery, Supplier Finder */
    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1).max(500),
          maxResults: z.number().min(1).max(10).default(5),
          searchDepth: z.enum(["basic", "advanced"]).default("basic"),
          includeImages: z.boolean().default(false),
          topic: z.enum(["general", "news"]).default("general"),
        })
      )
      .mutation(async ({ input }) => {
        return await tavilySearch(input.query, {
          maxResults: input.maxResults,
          searchDepth: input.searchDepth,
          includeImages: input.includeImages,
          topic: input.topic,
        });
      }),

    /** Extract content from a URL — used by Website Generator, Competitor Breakdown */
    extract: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        return await tavilyExtract(input.url);
      }),

    /** Image search — used by Website Generator, Meta Ads Pack */
    imageSearch: publicProcedure
      .input(
        z.object({
          query: z.string().min(1).max(300),
          maxImages: z.number().min(1).max(12).default(6),
        })
      )
      .mutation(async ({ input }) => {
        const images = await tavilyImageSearch(input.query, input.maxImages);
        return { images };
      }),
  }),
});

export type AppRouter = typeof appRouter;
