import { z } from 'zod';

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '');

export const storeBuilderSchema = z.object({
  productName: z.string().min(1).max(100).transform(stripHtml).optional(),
  niche: z.string().min(1).max(50).transform(stripHtml),
  productDescription: z.string().max(500).optional().transform(s => s ? stripHtml(s) : s),
  pricePoint: z.string().max(20).optional(),
  template: z.string().max(50).optional(),
});

export const websiteGenerateSchema = z.object({
  storeName: z.string().min(1).max(100).transform(stripHtml),
  niche: z.string().min(1).max(50).transform(stripHtml),
  description: z.string().max(500).optional().transform(s => s ? stripHtml(s) : s),
  template: z.string().max(50).optional(),
  accentColor: z.string().max(20).optional(),
  designDirection: z.string().max(50).optional(),
});

export const importProductSchema = z.object({
  url: z.string().url().max(2000),
});

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues.map(i => i.message).join('; ');
    return { error: msg };
  }
  return { data: result.data };
}
