import { z } from 'zod';

export const managedUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  is_admin: z.boolean(),
  created_at: z.string(),
  last_login: z.string().nullable(),
});

export const usersListResponseSchema = z.object({
  users: managedUserSchema.array(),
});

export const createUserBodySchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  isAdmin: z.boolean(),
});

export const updateUserBodySchema = z
  .object({
    username: z.string().min(2, 'Username must be at least 2 characters').max(32).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    isAdmin: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No changes provided' });

export type ManagedUser = z.infer<typeof managedUserSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
