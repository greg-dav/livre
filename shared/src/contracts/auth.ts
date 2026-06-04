import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, authResponseSchema } from './_shared';
import { userSchema } from '../domain/user';

const c = initContract();

const registerBody = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginBody = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const instanceStatus = z.object({ hasUsers: z.boolean() });

/**
 * Authentication. `status`/`register`/`login` are open; `me` is guarded (the server attaches
 * requireAuth to that route only). Mounted at /api/auth.
 */
export const authContract = c.router(
  {
    status: {
      method: 'GET',
      path: '/status',
      responses: { 200: instanceStatus },
    },
    register: {
      method: 'POST',
      path: '/register',
      body: registerBody,
      responses: { 201: authResponseSchema },
    },
    login: {
      method: 'POST',
      path: '/login',
      body: loginBody,
      responses: { 200: authResponseSchema },
    },
    me: {
      method: 'GET',
      path: '/me',
      responses: { 200: userSchema },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
