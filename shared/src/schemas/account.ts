import { z } from 'zod';
import { themeNameSchema } from './user';

export const updateUsernameBodySchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters'),
});

export const updatePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const updateThemeBodySchema = z.object({
  theme: themeNameSchema,
});

export type UpdateUsernameBody = z.infer<typeof updateUsernameBodySchema>;
export type UpdatePasswordBody = z.infer<typeof updatePasswordBodySchema>;
export type UpdateThemeBody = z.infer<typeof updateThemeBodySchema>;
