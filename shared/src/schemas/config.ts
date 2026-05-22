import { z } from 'zod';

export const updateApiKeyBodySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export const updateApiKeyResponseSchema = z.object({ ok: z.literal(true) });

export type UpdateApiKeyBody = z.infer<typeof updateApiKeyBodySchema>;
