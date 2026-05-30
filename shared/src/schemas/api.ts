import { z } from 'zod';

export const apiErrorSchema = z.object({
  error: z.string(),
});

/** Canonical success envelope for mutations that return no payload. */
export const okResponseSchema = z.object({ ok: z.literal(true) });

export type ApiError = z.infer<typeof apiErrorSchema>;
export type OkResponse = z.infer<typeof okResponseSchema>;
