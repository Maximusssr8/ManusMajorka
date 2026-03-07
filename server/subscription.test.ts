import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getSubscriptionByUserId: vi.fn(),
  hasActiveSubscription: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscriptionStatus: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

describe("subscription.hasAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns hasAccess: true when subscription is active", async () => {
    vi.mocked(db.hasActiveSubscription).mockResolvedValue(true);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.hasAccess();
    expect(result).toEqual({ hasAccess: true });
  });

  it("returns hasAccess: false when no subscription", async () => {
    vi.mocked(db.hasActiveSubscription).mockResolvedValue(false);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.hasAccess();
    expect(result).toEqual({ hasAccess: false });
  });
});

describe("subscription.activate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new subscription when none exists", async () => {
    const mockSub = {
      id: 1, userId: 1, status: "active" as const, plan: "pro",
      priceInCents: 9900, currency: "USD",
      periodStart: new Date(), periodEnd: new Date(),
      externalRef: null, createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(db.getSubscriptionByUserId).mockResolvedValue(undefined);
    vi.mocked(db.createSubscription).mockResolvedValue(mockSub);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.activate({ plan: "pro" });
    expect(result.success).toBe(true);
    expect(db.createSubscription).toHaveBeenCalledOnce();
  });

  it("returns existing subscription if already active", async () => {
    const existing = {
      id: 1, userId: 1, status: "active" as const, plan: "pro",
      priceInCents: 9900, currency: "USD",
      periodStart: new Date(), periodEnd: new Date(),
      externalRef: null, createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(db.getSubscriptionByUserId).mockResolvedValue(existing);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.activate({ plan: "pro" });
    expect(result.success).toBe(true);
    expect(db.createSubscription).not.toHaveBeenCalled();
  });
});

describe("subscription.cancel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels an active subscription", async () => {
    const activeSub = {
      id: 1, userId: 1, status: "active" as const, plan: "pro",
      priceInCents: 9900, currency: "USD",
      periodStart: new Date(), periodEnd: new Date(),
      externalRef: null, createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(db.getSubscriptionByUserId).mockResolvedValue(activeSub);
    vi.mocked(db.updateSubscriptionStatus).mockResolvedValue(undefined);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.cancel();
    expect(result.success).toBe(true);
    expect(db.updateSubscriptionStatus).toHaveBeenCalledWith(1, "cancelled");
  });

  it("returns failure message when no active subscription", async () => {
    vi.mocked(db.getSubscriptionByUserId).mockResolvedValue(undefined);
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.cancel();
    expect(result.success).toBe(false);
  });
});
