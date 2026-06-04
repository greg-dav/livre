import { z } from 'zod';
import { userSchema } from '../domain/user';

/**
 * Response envelopes shared across more than one contract — the error shape every route can return,
 * the canonical "no payload" success body, and the auth envelope returned by login/register and
 * every account mutation. They live here rather than in `domain/` because they describe HTTP
 * responses, not the domain model.
 */
export const apiErrorSchema = z.object({ error: z.string() });

export const okResponseSchema = z.object({ ok: z.literal(true) });

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
