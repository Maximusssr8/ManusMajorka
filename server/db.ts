import { and, eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  type InsertProfile,
  type InsertSubscription,
  type InsertProduct,
  type InsertSavedOutput,
  profiles,
  subscriptions,
  products,
  savedOutputs,
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
