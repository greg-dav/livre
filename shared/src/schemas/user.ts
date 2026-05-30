import { z } from 'zod';

export const themeNameSchema = z.enum(['roman-light', 'roman-dark']);

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  is_admin: z.boolean(),
  theme: themeNameSchema.default('roman-light'),
});

export type ThemeName = z.infer<typeof themeNameSchema>;
export type User = z.infer<typeof userSchema>;
