import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, authResponseSchema } from './_shared';

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
 * Authentication. Every route is open — `status`/`register`/`login` all run before a session
 * exists. The signed-in user's record (`me`) lives on the guarded account contract, so this router
 * carries no auth and stays homogeneous. Mounted at /api/auth.
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
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
