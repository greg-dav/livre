import { z } from 'zod';

export const userCountSchema = z.object({
  count: z.number(),
});

export const userRowSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  is_admin: z.number().transform(Boolean),
});
