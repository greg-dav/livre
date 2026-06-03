import { z } from 'zod';

export const updateApiKeyBodySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type UpdateApiKeyBody = z.infer<typeof updateApiKeyBodySchema>;

/** Per-instance daily cap on Google Books enrichment lookups during import. */
export const updateGoogleBooksLimitBodySchema = z.object({
  limit: z.number().int().min(1).max(100000),
});

export type UpdateGoogleBooksLimitBody = z.infer<typeof updateGoogleBooksLimitBodySchema>;
