import { pgTable, pgEnum, uuid, text, varchar, timestamp, serial, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);
export const productStatusEnum = pgEnum("product_status", ["research", "validate", "build", "launch", "optimize", "scale"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches Supabase auth.users.id
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Subscriptions table — tracks each user's membership status.
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  plan: varchar("plan", { length: 64 }).default("pro").notNull(),
  priceInCents: integer("price_in_cents").default(9900).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  periodStart: timestamp("period_start").defaultNow().notNull(),
  periodEnd: timestamp("period_end"),
  externalRef: varchar("external_ref", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Products table — each user can track multiple products/projects.
 */
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url"),
  niche: varchar("niche", { length: 255 }),
  description: text("description"),
  status: productStatusEnum("status").default("research").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Saved outputs — tool results saved to a product for future reference.
 */
export const savedOutputs = pgTable("saved_outputs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  toolId: varchar("tool_id", { length: 128 }).notNull(),
  toolName: varchar("tool_name", { length: 255 }).notNull(),
  stage: varchar("stage", { length: 64 }).notNull(),
  outputJson: text("output_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
