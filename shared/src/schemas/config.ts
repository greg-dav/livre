import { z } from 'zod';

export const updateApiKeyBodySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type UpdateApiKeyBody = z.infer<typeof updateApiKeyBodySchema>;

/** Per-instance daily cap on a metered source's import lookups. */
export const updateDailyLimitBodySchema = z.object({
  limit: z.number().int().min(1).max(100000),
});

export type UpdateDailyLimitBody = z.infer<typeof updateDailyLimitBodySchema>;
