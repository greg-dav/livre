import { z } from 'zod';
import { userSchema } from './user';

export const registerBodySchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  googleBooksApiKey: z.string().min(1, 'Google Books API key is required'),
});

export const loginBodySchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const instanceStatusSchema = z.object({
  hasUsers: z.boolean(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type InstanceStatus = z.infer<typeof instanceStatusSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
