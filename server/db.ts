import { and, eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  type InsertProfile,
  type InsertSubscription,
  type InsertProduct,
  type InsertSavedOutput,
  type InsertUserProfile,
  type InsertConversationMessage,
  profiles,
  subscriptions,
  products,
  savedOutputs,
  userProfiles,
  conversationMemory,
  taskPlanProgress,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Profile helpers ──────────────────────────────────────────────────────

export async function upsertProfile(profile: InsertProfile): Promise<void> {
  if (!profile.id) throw new Error("Profile id is required for upsert");
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot upsert profile: database not available"); return; }

  try {
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "avatarUrl"] as const;
    for (const field of textFields) {
      const value = profile[field];
      if (value !== undefined) updateSet[field] = value ?? null;
    }
    if (profile.lastSignedIn !== undefined) updateSet.lastSignedIn = profile.lastSignedIn;
    if (profile.role !== undefined) updateSet.role = profile.role;
    updateSet.updatedAt = new Date();
    if (Object.keys(updateSet).length === 1) updateSet.lastSignedIn = new Date();

    await db.insert(profiles).values({
      ...profile,
      lastSignedIn: profile.lastSignedIn ?? new Date(),
    }).onConflictDoUpdate({
      target: profiles.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert profile:", error);
    throw error;
  }
}

export async function getProfileById(id: string) {
  const db = getDb();
  if (!db) { console.warn("[Database] Cannot get profile: database not available"); return undefined; }
  const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Subscription helpers ────────────────────────────────────────────────────

export async function getSubscriptionByUserId(userId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await getSubscriptionByUserId(userId);
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.periodEnd && sub.periodEnd < new Date()) return false;
  return true;
}

export async function createSubscription(data: InsertSubscription) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscriptions).values(data);
  return getSubscriptionByUserId(data.userId);
}

export async function updateSubscriptionStatus(
  userId: string,
  status: "active" | "cancelled" | "expired",
  periodEnd?: Date
) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (periodEnd !== undefined) updateData.periodEnd = periodEnd;
  await db
    .update(subscriptions)
    .set(updateData)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
}

// ─── Product helpers ────────────────────────────────────────────────────────

export async function getProductsByUserId(userId: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.updatedAt));
}

export async function getProductById(productId: string, userId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.id, productId), eq(products.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductByIdPublic(productId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data).returning();
  return result[0];
}

export async function updateProduct(productId: string, userId: string, data: Partial<Pick<InsertProduct, "name" | "url" | "niche" | "description" | "status">>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ ...data, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.userId, userId)));
  return getProductById(productId, userId);
}

export async function deleteProduct(productId: string, userId: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedOutputs).where(and(eq(savedOutputs.productId, productId), eq(savedOutputs.userId, userId)));
  await db.delete(products).where(and(eq(products.id, productId), eq(products.userId, userId)));
}

// ─── Saved Output helpers ───────────────────────────────────────────────────

export async function getSavedOutputsByProductId(productId: string, userId: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(savedOutputs).where(and(eq(savedOutputs.productId, productId), eq(savedOutputs.userId, userId))).orderBy(desc(savedOutputs.createdAt));
}

export async function createSavedOutput(data: InsertSavedOutput) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(savedOutputs).values(data);
}

export async function deleteSavedOutput(outputId: string, userId: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedOutputs).where(and(eq(savedOutputs.id, outputId), eq(savedOutputs.userId, userId)));
}

// ─── User Profile helpers ──────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(userId: string, data: Partial<Omit<InsertUserProfile, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserProfile(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
  return getUserProfile(userId);
}

// ─── Conversation Memory helpers ───────────────────────────────────────────

export async function getConversationHistory(userId: string, toolName: string, limit = 10) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(conversationMemory)
    .where(and(eq(conversationMemory.userId, userId), eq(conversationMemory.toolName, toolName)))
    .orderBy(desc(conversationMemory.createdAt))
    .limit(limit)
    .then(rows => rows.reverse());
}

export async function saveConversationMessage(data: InsertConversationMessage) {
  const db = getDb();
  if (!db) return;
  await db.insert(conversationMemory).values(data);
  await trimConversationHistory(data.userId, data.toolName, 20);
}

async function trimConversationHistory(userId: string, toolName: string, maxMessages: number) {
  const db = getDb();
  if (!db) return;
  const all = await db
    .select({ id: conversationMemory.id })
    .from(conversationMemory)
    .where(and(eq(conversationMemory.userId, userId), eq(conversationMemory.toolName, toolName)))
    .orderBy(desc(conversationMemory.createdAt));
  if (all.length > maxMessages) {
    const idsToDelete = all.slice(maxMessages).map(r => r.id);
    for (const id of idsToDelete) {
      await db.delete(conversationMemory).where(eq(conversationMemory.id, id));
    }
  }
}

/** Build user context string for AI system prompts */
export async function getUserContextString(userId: string, userName?: string | null): Promise<string> {
  const profile = await getUserProfile(userId);
  if (!profile) return "";
  const parts: string[] = [];
  if (userName) parts.push(`Name: ${userName}`);
  if (profile.businessName) parts.push(`Business: ${profile.businessName}`);
  if (profile.targetNiche) parts.push(`Niche: ${profile.targetNiche}`);
  if (profile.monthlyRevenue) parts.push(`Revenue: ${profile.monthlyRevenue}`);
  if (profile.experienceLevel) parts.push(`Experience: ${profile.experienceLevel}`);
  if (profile.mainGoal) parts.push(`Goal: ${profile.mainGoal}`);
  if (profile.country) parts.push(`Country: ${profile.country}`);
  if (parts.length === 0) return "";
  return `User context: ${parts.join(", ")}. Tailor all advice specifically to this user.`;
}

// ─── Task Plan Progress helpers ─────────────────────────────────────────────

/** Returns all task plan steps for a user, ordered by creation time. */
export async function getTaskPlanProgress(userId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(taskPlanProgress)
    .where(eq(taskPlanProgress.userId, userId))
    .orderBy(asc(taskPlanProgress.createdAt));
}

/** Creates or updates a task plan step for a user. */
export async function upsertTaskPlanStep(userId: string, stepKey: string, status: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(taskPlanProgress)
    .where(and(eq(taskPlanProgress.userId, userId), eq(taskPlanProgress.stepKey, stepKey)))
    .limit(1);

  const now = new Date();
  const completedAt = status === "completed" ? now : null;

  if (existing.length > 0) {
    await db
      .update(taskPlanProgress)
      .set({ status, completedAt, updatedAt: now })
      .where(and(eq(taskPlanProgress.userId, userId), eq(taskPlanProgress.stepKey, stepKey)));
  } else {
    await db
      .insert(taskPlanProgress)
      .values({ userId, stepKey, status, completedAt, createdAt: now, updatedAt: now });
  }

  // Return the updated row
  const result = await db
    .select()
    .from(taskPlanProgress)
    .where(and(eq(taskPlanProgress.userId, userId), eq(taskPlanProgress.stepKey, stepKey)))
    .limit(1);
  return result[0] ?? null;
}

// ─── Storefront helpers ──────────────────────────────────────────────────────

import type { InsertStore, InsertStorefrontProduct, InsertOrder } from "../drizzle/schema";
import { stores, storefrontProducts, orders } from "../drizzle/schema";

export async function getStoreByUserId(userId: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(stores).where(eq(stores.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getStoreBySlug(slug: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(stores).where(eq(stores.storeSlug, slug)).limit(1);
  return result[0] ?? null;
}

export async function createStore(store: InsertStore) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stores).values(store).returning();
  return result[0];
}

export async function updateStore(id: string, data: Partial<InsertStore>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(stores).set(data).where(eq(stores.id, id)).returning();
  return result[0];
}

export async function getStorefrontProducts(storeId: string) {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(storefrontProducts)
    .where(eq(storefrontProducts.storeId, storeId))
    .orderBy(desc(storefrontProducts.createdAt));
}

export async function getPublishedStorefrontProducts(storeId: string) {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(storefrontProducts)
    .where(and(eq(storefrontProducts.storeId, storeId), eq(storefrontProducts.published, true)))
    .orderBy(desc(storefrontProducts.createdAt));
}

export async function upsertStorefrontProduct(storeId: string, productId: string, data: { price?: string; comparePrice?: string; published?: boolean; seoTitle?: string; seoDescription?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(storefrontProducts)
    .where(and(eq(storefrontProducts.storeId, storeId), eq(storefrontProducts.productId, productId)))
    .limit(1);
  if (existing.length > 0) {
    const result = await db.update(storefrontProducts).set(data).where(eq(storefrontProducts.id, existing[0].id)).returning();
    return result[0];
  } else {
    const result = await db.insert(storefrontProducts).values({ storeId, productId, ...data }).returning();
    return result[0];
  }
}

export async function getOrdersByStoreId(storeId: string) {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt));
}

export async function createOrder(order: InsertOrder) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order).returning();
  return result[0];
}

export async function updateOrderFulfillment(id: string, fulfillmentStatus: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(orders).set({ fulfillmentStatus }).where(eq(orders.id, id)).returning();
  return result[0];
}

// ─── Attribution helpers ─────────────────────────────────────────────────────

import type { InsertAttribution } from "../drizzle/schema";
import { attribution } from "../drizzle/schema";

export async function saveAttribution(data: InsertAttribution) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attribution).values(data).returning();
  return result[0];
}

export async function getAttributionByUserId(userId: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(attribution).where(eq(attribution.userId, userId)).limit(1);
  return result[0] ?? null;
}

// ─── Affiliate helpers ──────────────────────────────────────────────────────

import type { InsertAffiliate, InsertReferral, InsertSubscriber } from "../drizzle/schema";
import { affiliates, referrals, subscribers } from "../drizzle/schema";
import { sql } from "drizzle-orm";

export async function getAffiliateByUserId(userId: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getAffiliateByCode(code: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(affiliates).where(eq(affiliates.code, code)).limit(1);
  return result[0] ?? null;
}

export async function createAffiliate(data: InsertAffiliate) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(affiliates).values(data).returning();
  return result[0];
}

export async function incrementAffiliateClicks(code: string) {
  const db = getDb();
  if (!db) return;
  await db.update(affiliates).set({ clicks: sql`${affiliates.clicks} + 1` }).where(eq(affiliates.code, code));
}

export async function incrementAffiliateSignups(code: string) {
  const db = getDb();
  if (!db) return;
  await db.update(affiliates).set({ signups: sql`${affiliates.signups} + 1` }).where(eq(affiliates.code, code));
}

export async function createReferral(data: InsertReferral) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(referrals).values(data).returning();
  return result[0];
}

// ─── Subscriber helpers ─────────────────────────────────────────────────────

export async function createSubscriber(data: InsertSubscriber) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscribers).values(data).onConflictDoNothing().returning();
  return result[0] ?? null;
}

export async function getSubscriberByEmail(email: string) {
  const db = getDb();
  if (!db) return null;
  const result = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getSubscriberCount() {
  const db = getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(subscribers);
  return Number(result[0]?.count ?? 0);
}

export async function getUserCount() {
  const db = getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(profiles);
  return Number(result[0]?.count ?? 0);
}

/** Admin: get all user leads with subscription and profile data */
export async function getAllLeads() {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      name: profiles.name,
      createdAt: profiles.createdAt,
      role: profiles.role,
      plan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      market: userProfiles.market,
      businessName: userProfiles.businessName,
      targetNiche: userProfiles.targetNiche,
    })
    .from(profiles)
    .leftJoin(subscriptions, eq(subscriptions.userId, profiles.id))
    .leftJoin(userProfiles, eq(userProfiles.userId, profiles.id))
    .orderBy(desc(profiles.createdAt))
    .limit(500);
  return rows;
}
