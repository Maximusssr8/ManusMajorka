import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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
  userId: uuid("user_id").notNull().unique().references(() => profiles.id),
  experienceLevel: varchar("experience_level", { length: 20 }),
  mainGoal: varchar("main_goal", { length: 100 }),
  budget: varchar("budget", { length: 50 }),
  businessName: varchar("business_name", { length: 255 }),
  targetNiche: varchar("target_niche", { length: 255 }),
  monthlyRevenue: varchar("monthly_revenue", { length: 50 }),
  country: varchar("country", { length: 100 }),
  market: varchar("market", { length: 10 }).default("AU"),
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
  userId: uuid("user_id").notNull().references(() => profiles.id),
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
  userId: uuid("user_id").notNull().references(() => profiles.id),
  stepKey: varchar("step_key", { length: 64 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TaskPlanProgress = typeof taskPlanProgress.$inferSelect;
export type InsertTaskPlanProgress = typeof taskPlanProgress.$inferInsert;

/**
 * Stores — each user can have one storefront.
 */
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  storeSlug: varchar("store_slug", { length: 128 }).unique().notNull(),
  stripeAccountId: text("stripe_account_id"),
  metaAdAccountId: text("meta_ad_account_id"),
  metaPixelId: text("meta_pixel_id"),
  brandColorPrimary: varchar("brand_color_primary", { length: 16 }).default("#000000"),
  brandColorSecondary: varchar("brand_color_secondary", { length: 16 }).default("#ffffff"),
  logoUrl: text("logo_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * Storefront products — products published to a storefront.
 */
export const storefrontProducts = pgTable("storefront_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  price: text("price"),
  comparePrice: text("compare_price"),
  published: boolean("published").default(false),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StorefrontProduct = typeof storefrontProducts.$inferSelect;
export type InsertStorefrontProduct = typeof storefrontProducts.$inferInsert;

/**
 * Orders — customer purchases through the storefront.
 */
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id),
  storefrontProductId: uuid("storefront_product_id").references(() => storefrontProducts.id),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address"),
  stripePaymentIntent: text("stripe_payment_intent"),
  amount: text("amount"),
  status: varchar("status", { length: 32 }).default("pending"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 32 }).default("unfulfilled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Attribution — UTM tracking for first-touch and last-touch attribution.
 */
export const attribution = pgTable("attribution", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  firstTouchSource: text("first_touch_source"),
  firstTouchMedium: text("first_touch_medium"),
  firstTouchCampaign: text("first_touch_campaign"),
  lastTouchSource: text("last_touch_source"),
  lastTouchMedium: text("last_touch_medium"),
  lastTouchCampaign: text("last_touch_campaign"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Attribution = typeof attribution.$inferSelect;
export type InsertAttribution = typeof attribution.$inferInsert;

/**
 * Subscribers — email list subscribers (not necessarily authenticated users).
 */
export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  niche: text("niche"),
  source: varchar("source", { length: 128 }),
  status: varchar("status", { length: 32 }).default("active"),
  tags: text("tags"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  lastEmailedAt: timestamp("last_emailed_at"),
  emailSequenceStep: integer("email_sequence_step").default(0),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * Automation logs — tracks workflow actions (emails sent, webhooks fired, etc.).
 */
export const automationLogs = pgTable("automation_logs", {
  id: serial("id").primaryKey(),
  workflowName: varchar("workflow_name", { length: 128 }).notNull(),
  subscriberEmail: varchar("subscriber_email", { length: 320 }),
  action: varchar("action", { length: 128 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

/**
 * Affiliates — tracks affiliate partners and their commissions.
 */
export const affiliates = pgTable("affiliates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 64 }).notNull().unique(),
  clicks: integer("clicks").default(0).notNull(),
  signups: integer("signups").default(0).notNull(),
  revenue: integer("revenue_cents").default(0).notNull(), // in cents AUD
  commissionRate: integer("commission_rate").default(30).notNull(), // percentage
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

/**
 * Referrals — tracks individual referral conversions.
 */
export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  affiliateId: uuid("affiliate_id").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  referredUserId: uuid("referred_user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).default("signed_up").notNull(), // signed_up, subscribed, paid
  commissionCents: integer("commission_cents").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
