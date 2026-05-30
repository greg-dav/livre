import { z } from 'zod';

export const updateApiKeyBodySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type UpdateApiKeyBody = z.infer<typeof updateApiKeyBodySchema>;
