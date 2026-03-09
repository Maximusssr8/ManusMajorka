import { and, eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertSubscription, subscriptions, users, userProfiles, conversationMemory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Subscription helpers ────────────────────────────────────────────────────

/** Returns the most recent subscription for a user, or undefined if none. */
export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Returns true if the user has an active subscription that hasn't expired. */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const sub = await getSubscriptionByUserId(userId);
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.periodEnd && sub.periodEnd < new Date()) return false;
  return true;
}

/** Creates a new active subscription for a user. */
export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscriptions).values(data);
  return getSubscriptionByUserId(data.userId);
}

/** Updates subscription status (e.g. cancel or expire). */
export async function updateSubscriptionStatus(
  userId: number,
  status: "active" | "cancelled" | "expired",
  periodEnd?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (periodEnd !== undefined) updateData.periodEnd = periodEnd;
  await db
    .update(subscriptions)
    .set(updateData)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
}

// ─── Product helpers ────────────────────────────────────────────────────────

import { products, savedOutputs, type InsertProduct, type InsertSavedOutput, type InsertUserProfile, type InsertConversationMessage } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.updatedAt));
}

export async function getProductById(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.id, productId), eq(products.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return getProductById(result[0].insertId, data.userId);
}

export async function updateProduct(productId: number, userId: number, data: Partial<Pick<InsertProduct, "name" | "url" | "niche" | "description" | "status">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(and(eq(products.id, productId), eq(products.userId, userId)));
  return getProductById(productId, userId);
}

export async function deleteProduct(productId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedOutputs).where(and(eq(savedOutputs.productId, productId), eq(savedOutputs.userId, userId)));
  await db.delete(products).where(and(eq(products.id, productId), eq(products.userId, userId)));
}

// ─── Saved Output helpers ───────────────────────────────────────────────────

export async function getSavedOutputsByProductId(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedOutputs).where(and(eq(savedOutputs.productId, productId), eq(savedOutputs.userId, userId))).orderBy(desc(savedOutputs.createdAt));
}

export async function createSavedOutput(data: InsertSavedOutput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(savedOutputs).values(data);
}

export async function deleteSavedOutput(outputId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedOutputs).where(and(eq(savedOutputs.id, outputId), eq(savedOutputs.userId, userId)));
}

// ─── User Profile helpers ──────────────────────────────────────────────────

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(userId: number, data: Partial<Omit<InsertUserProfile, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
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

export async function getConversationHistory(userId: number, toolName: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conversationMemory)
    .where(and(eq(conversationMemory.userId, userId), eq(conversationMemory.toolName, toolName)))
    .orderBy(desc(conversationMemory.createdAt))
    .limit(limit)
    .then(rows => rows.reverse()); // Return in chronological order
}

export async function saveConversationMessage(data: InsertConversationMessage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(conversationMemory).values(data);
  // Trim to keep only latest 20 messages per user+tool
  await trimConversationHistory(data.userId, data.toolName, 20);
}

async function trimConversationHistory(userId: number, toolName: string, maxMessages: number) {
  const db = await getDb();
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
export async function getUserContextString(userId: number, userName?: string | null): Promise<string> {
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
