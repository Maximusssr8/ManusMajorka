import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);
export const productStatusEnum = pgEnum("product_status", ["research", "validate", "build", "launch", "optimize", "scale"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  plan: varchar("plan", { length: 64 }).default("pro").notNull(),
  /** Price in cents, e.g. 9900 = $99.00 */
  priceInCents: integer("priceInCents").default(9900).notNull(),
  /** ISO currency code */
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  /** When the current billing period started */
  periodStart: timestamp("periodStart").defaultNow().notNull(),
  /** When the current billing period ends (null = indefinite) */
  periodEnd: timestamp("periodEnd"),
  /** External payment reference (Stripe subscription ID, etc.) */
  externalRef: varchar("externalRef", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Products table — each user can track multiple products/projects.
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url"),
  niche: varchar("niche", { length: 255 }),
  description: text("description"),
  status: productStatusEnum("status").default("research").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Saved outputs — tool results saved to a product for future reference.
 */
export const savedOutputs = pgTable("saved_outputs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
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
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  experienceLevel: varchar("experience_level", { length: 20 }),
  mainGoal: varchar("main_goal", { length: 100 }),
  budget: varchar("budget", { length: 50 }),
  businessName: varchar("business_name", { length: 255 }),
  targetNiche: varchar("target_niche", { length: 255 }),
  monthlyRevenue: varchar("monthly_revenue", { length: 50 }),
  country: varchar("country", { length: 100 }),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Conversation memory — stores last messages per user per tool for AI continuity.
 */
export const conversationMemory = pgTable("conversation_memory", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  toolName: varchar("tool_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ConversationMessage = typeof conversationMemory.$inferSelect;
export type InsertConversationMessage = typeof conversationMemory.$inferInsert;

/**
 * Task plan progress — tracks each user's progress through the 4-step workflow.
 * stepKey: "research" | "build" | "launch" | "optimize"
 * status: "pending" | "in_progress" | "completed"
 */
export const taskPlanProgress = pgTable("task_plan_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stepKey: varchar("step_key", { length: 64 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TaskPlanProgress = typeof taskPlanProgress.$inferSelect;
export type InsertTaskPlanProgress = typeof taskPlanProgress.$inferInsert;
