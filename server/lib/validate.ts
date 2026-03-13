/**
 * Zod validation middleware for Express routes.
 */
import type { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";

/** Express middleware that validates req.body against a Zod schema */
export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Shared schemas ─────────────────────────────────────────────────────────

export const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .optional(),
  message: z.any().optional(),
  systemPrompt: z.string().optional(),
  toolName: z.string().optional(),
  searchQuery: z.string().optional(),
  market: z.string().optional(),
  stream: z.boolean().optional(),
});

export const subscribeSchema = z.object({
  email: z.email(),
});

export const demoResearchSchema = z.object({
  query: z.string().min(1).max(500),
  market: z.string().optional(),
});

export const importProductSchema = z.object({
  url: z.url(),
  productName: z.string().optional(),
});
