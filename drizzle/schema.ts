import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscriptions table — tracks each user's membership status.
 * status: 'active' = full access to Majorka Menu
 *         'cancelled' = access revoked at periodEnd
 *         'expired' = past periodEnd, no access
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  plan: varchar("plan", { length: 64 }).default("pro").notNull(),
  /** Price in cents, e.g. 9900 = $99.00 */
  priceInCents: int("priceInCents").default(9900).notNull(),
  /** ISO currency code */
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  /** When the current billing period started */
  periodStart: timestamp("periodStart").defaultNow().notNull(),
  /** When the current billing period ends (null = indefinite) */
  periodEnd: timestamp("periodEnd"),
  /** External payment reference (Stripe subscription ID, etc.) */
  externalRef: varchar("externalRef", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Products table — each user can track multiple products/projects.
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url"),
  niche: varchar("niche", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["research", "validate", "build", "launch", "optimize", "scale"]).default("research").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Saved outputs — tool results saved to a product for future reference.
 */
export const savedOutputs = mysqlTable("saved_outputs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  toolId: varchar("toolId", { length: 128 }).notNull(),
  toolName: varchar("toolName", { length: 255 }).notNull(),
  stage: varchar("stage", { length: 64 }).notNull(),
  outputJson: text("outputJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedOutput = typeof savedOutputs.$inferSelect;
export type InsertSavedOutput = typeof savedOutputs.$inferInsert;

/**
 * User profiles — stores user context for AI personalisation.
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  experienceLevel: varchar("experience_level", { length: 20 }),
  mainGoal: varchar("main_goal", { length: 100 }),
  budget: varchar("budget", { length: 50 }),
  businessName: varchar("business_name", { length: 255 }),
  targetNiche: varchar("target_niche", { length: 255 }),
  monthlyRevenue: varchar("monthly_revenue", { length: 50 }),
  country: varchar("country", { length: 100 }),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Conversation memory — stores last messages per user per tool for AI continuity.
 */
export const conversationMemory = mysqlTable("conversation_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  toolName: varchar("tool_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ConversationMessage = typeof conversationMemory.$inferSelect;
export type InsertConversationMessage = typeof conversationMemory.$inferInsert;
