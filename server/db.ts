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
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(taskPlanProgress)
    .where(eq(taskPlanProgress.userId, userId))
    .orderBy(asc(taskPlanProgress.createdAt));
}

/** Creates or updates a task plan step for a user. */
export async function upsertTaskPlanStep(userId: string, stepKey: string, status: string) {
  const db = await getDb();
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
