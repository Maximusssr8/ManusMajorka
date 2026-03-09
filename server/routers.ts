import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getSubscriptionByUserId,
  hasActiveSubscription,
  createSubscription,
  updateSubscriptionStatus,
  getProductsByUserId,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSavedOutputsByProductId,
  createSavedOutput,
  deleteSavedOutput,
  getUserProfile,
  upsertUserProfile,
  getConversationHistory,
  saveConversationMessage,
} from "./db";
import { tavilySearch, tavilyExtract, tavilyImageSearch } from "./tavily";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // Client-side handles signOut via Supabase; server is a no-op
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

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const sub = await getSubscriptionByUserId(ctx.user.id);
      if (!sub || sub.status !== "active") {
        return { success: false, message: "No active subscription found." };
      }
      await updateSubscriptionStatus(ctx.user.id, "cancelled");
      return { success: true };
    }),
  }),

  /** Product management */
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getProductsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return await getProductById(input.id, ctx.user.id) ?? null;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        url: z.string().optional(),
        niche: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createProduct({ ...input, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        url: z.string().optional(),
        niche: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["research", "validate", "build", "launch", "optimize", "scale"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await updateProduct(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProduct(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /** Saved outputs per product */
  savedOutputs: router({
    list: protectedProcedure
      .input(z.object({ productId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return await getSavedOutputsByProductId(input.productId, ctx.user.id);
      }),

    save: protectedProcedure
      .input(z.object({
        productId: z.string().uuid(),
        toolId: z.string(),
        toolName: z.string(),
        stage: z.string(),
        outputJson: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createSavedOutput({ ...input, userId: ctx.user.id });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSavedOutput(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /** User profile management */
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProfile(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        businessName: z.string().optional(),
        targetNiche: z.string().optional(),
        monthlyRevenue: z.string().optional(),
        country: z.string().optional(),
        experienceLevel: z.string().optional(),
        mainGoal: z.string().optional(),
        budget: z.string().optional(),
        onboardingCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await upsertUserProfile(ctx.user.id, input);
      }),
  }),

  /** Conversation memory per tool */
  memory: router({
    get: protectedProcedure
      .input(z.object({ toolName: z.string(), limit: z.number().min(1).max(20).default(10) }))
      .query(async ({ ctx, input }) => {
        return await getConversationHistory(ctx.user.id, input.toolName, input.limit);
      }),

    save: protectedProcedure
      .input(z.object({
        toolName: z.string(),
        role: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveConversationMessage({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),

  /** Tavily web search & extract procedures */
  research: router({
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

    extract: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        return await tavilyExtract(input.url);
      }),

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
