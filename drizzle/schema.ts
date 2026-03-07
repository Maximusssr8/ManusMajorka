import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
