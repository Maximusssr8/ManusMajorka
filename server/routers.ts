import { z } from 'zod';
import { systemRouter } from './_core/systemRouter';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import {
  createProduct,
  createSavedOutput,
  createStore,
  createSubscription,
  deleteProduct,
  deleteSavedOutput,
  getAttributionByUserId,
  getConversationHistory,
  getOrdersByStoreId,
  getProductById,
  getProductsByUserId,
  getSavedOutputsByProductId,
  getStoreBySlug,
  getStoreByUserId,
  getStorefrontProducts,
  getSubscriptionByUserId,
  getTaskPlanProgress,
  getUserProfile,
  hasActiveSubscription,
  saveAttribution,
  saveConversationMessage,
  updateOrderFulfillment,
  updateProduct,
  updateStore,
  updateSubscriptionStatus,
  upsertStorefrontProduct,
  upsertTaskPlanStep,
  upsertUserProfile,
} from './db';
import { getAllMemories } from './lib/memory';
import { adminRouter } from './routers/admin';
import { tavilyExtract, tavilyImageSearch, tavilySearch } from './tavily';

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // Client-side handles signOut via Supabase; server is a no-op
      return { success: true } as const;
    }),
  }),

  subscription: router({
    /** Get the current user's subscription (null if none). */
    get: protectedProcedure.query(async ({ ctx }) => {
      return (await getSubscriptionByUserId(ctx.user.id)) ?? null;
    }),

    /** Check whether the current user has active access. */
    hasAccess: protectedProcedure.query(async ({ ctx }) => {
      const active = await hasActiveSubscription(ctx.user.id);
      return { hasAccess: active };
    }),

    activate: protectedProcedure
      .input(
        z.object({
          plan: z.string().default('pro'),
          externalRef: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getSubscriptionByUserId(ctx.user.id);
        if (existing?.status === 'active') {
          return { success: true, subscription: existing };
        }
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const sub = await createSubscription({
          userId: ctx.user.id,
          status: 'active',
          plan: input.plan,
          priceInCents: 9900,
          currency: 'USD',
          periodStart: new Date(),
          periodEnd,
          externalRef: input.externalRef ?? null,
        });
        return { success: true, subscription: sub };
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const sub = await getSubscriptionByUserId(ctx.user.id);
      if (!sub || sub.status !== 'active') {
        return { success: false, message: 'No active subscription found.' };
      }
      await updateSubscriptionStatus(ctx.user.id, 'cancelled');
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
        return (await getProductById(input.id, ctx.user.id)) ?? null;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          url: z.string().optional(),
          niche: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createProduct({ ...input, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(255).optional(),
          url: z.string().optional(),
          niche: z.string().optional(),
          description: z.string().optional(),
          status: z
            .enum(['research', 'validate', 'build', 'launch', 'optimize', 'scale'])
            .optional(),
        })
      )
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
      .input(
        z.object({
          productId: z.string().uuid(),
          toolId: z.string(),
          toolName: z.string(),
          stage: z.string(),
          outputJson: z.string(),
        })
      )
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
      try {
        return await getUserProfile(ctx.user.id);
      } catch {
        // user_profiles table may not exist yet — return null gracefully
        return null;
      }
    }),

    update: protectedProcedure
      .input(
        z.object({
          businessName: z.string().optional(),
          targetNiche: z.string().optional(),
          monthlyRevenue: z.string().optional(),
          country: z.string().optional(),
          experienceLevel: z.string().optional(),
          mainGoal: z.string().optional(),
          budget: z.string().optional(),
          onboardingCompleted: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await upsertUserProfile(ctx.user.id, input);
      }),

    /** Get all mem0 memories for the current user (admin/debug) */
    getMemories: protectedProcedure.query(async ({ ctx }) => {
      return getAllMemories(ctx.user.id);
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
      .input(
        z.object({
          toolName: z.string(),
          role: z.string(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await saveConversationMessage({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),

  /** Task plan progress tracking */
  taskPlan: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getTaskPlanProgress(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          stepKey: z.string().min(1).max(64),
          status: z.enum(['pending', 'in_progress', 'completed']),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await upsertTaskPlanStep(ctx.user.id, input.stepKey, input.status);
        return { success: true, step: result };
      }),
  }),

  /** Tavily web search & extract procedures */
  research: router({
    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1).max(500),
          maxResults: z.number().min(1).max(10).default(5),
          searchDepth: z.enum(['basic', 'advanced']).default('basic'),
          includeImages: z.boolean().default(false),
          topic: z.enum(['general', 'news']).default('general'),
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
  /** Storefront management */
  storefront: router({
    getMyStore: protectedProcedure.query(async ({ ctx }) => {
      return await getStoreByUserId(ctx.user.id);
    }),

    getStoreBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getStoreBySlug(input.slug);
      }),

    createStore: protectedProcedure
      .input(
        z.object({
          storeName: z.string().min(1).max(255),
          storeSlug: z
            .string()
            .min(1)
            .max(128)
            .regex(/^[a-z0-9-]+$/),
          metaAdAccountId: z.string().optional(),
          metaPixelId: z.string().optional(),
          brandColorPrimary: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createStore({ ...input, userId: ctx.user.id });
      }),

    updateStore: protectedProcedure
      .input(
        z.object({
          storeName: z.string().optional(),
          storeSlug: z.string().optional(),
          metaAdAccountId: z.string().optional(),
          metaPixelId: z.string().optional(),
          brandColorPrimary: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreByUserId(ctx.user.id);
        if (!store) throw new Error('Store not found');
        return await updateStore(store.id, input);
      }),

    getStorefrontProducts: protectedProcedure.query(async ({ ctx }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) return [];
      return await getStorefrontProducts(store.id);
    }),

    upsertStorefrontProduct: protectedProcedure
      .input(
        z.object({
          productId: z.string().uuid(),
          price: z.string().optional(),
          comparePrice: z.string().optional(),
          published: z.boolean().optional(),
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const store = await getStoreByUserId(ctx.user.id);
        if (!store) throw new Error('Create a store first');
        const { productId, ...data } = input;
        return await upsertStorefrontProduct(store.id, productId, data);
      }),

    getOrders: protectedProcedure.query(async ({ ctx }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) return [];
      return await getOrdersByStoreId(store.id);
    }),

    markFulfilled: protectedProcedure
      .input(z.object({ orderId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        return await updateOrderFulfillment(input.orderId, 'fulfilled');
      }),
  }),

  /** Email sending */
  email: router({
    sendPlaybook: protectedProcedure
      .input(
        z.object({
          to: z.string().email(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { sendPlaybook } = await import('./lib/email');
        const result = await sendPlaybook(input.to, input.content);
        if (result && 'error' in result && result.error) {
          throw new Error(String(result.error));
        }
        return { success: true };
      }),
  }),

  /** Admin-only endpoints */
  admin: adminRouter,

  /** UTM attribution tracking */
  attribution: router({
    save: protectedProcedure
      .input(
        z.object({
          firstTouchSource: z.string().nullable().optional(),
          firstTouchMedium: z.string().nullable().optional(),
          firstTouchCampaign: z.string().nullable().optional(),
          lastTouchSource: z.string().nullable().optional(),
          lastTouchMedium: z.string().nullable().optional(),
          lastTouchCampaign: z.string().nullable().optional(),
          referrer: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getAttributionByUserId(ctx.user.id);
        if (existing) return { success: true, attribution: existing };
        const result = await saveAttribution({ userId: ctx.user.id, ...input });
        return { success: true, attribution: result };
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return await getAttributionByUserId(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
