import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  is_admin: z.boolean(),
});

export type User = z.infer<typeof userSchema>;
