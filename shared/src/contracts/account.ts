import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, authResponseSchema } from './_shared';
import { themeNameSchema, userSchema } from '../domain/user';

const c = initContract();

const updateUsernameBody = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters'),
});

const updatePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const updateThemeBody = z.object({ theme: themeNameSchema });

/**
 * Account routes for the signed-in user: read the current user (`me`) and the profile mutations.
 * Each mutation re-issues the JWT so the client picks up the new username/theme (or a rotated token
 * after a password change). The whole contract is mounted behind requireAuth, so every route here
 * is guarded — `me` lives here rather than on the open auth contract to keep both routers
 * homogeneous.
 */
export const accountContract = c.router(
  {
    me: {
      method: 'GET',
      path: '/me',
      responses: { 200: userSchema },
    },
    updateUsername: {
      method: 'PATCH',
      path: '/username',
      body: updateUsernameBody,
      responses: { 200: authResponseSchema },
    },
    updatePassword: {
      method: 'PATCH',
      path: '/password',
      body: updatePasswordBody,
      responses: { 200: authResponseSchema },
    },
    updateTheme: {
      method: 'PATCH',
      path: '/theme',
      body: updateThemeBody,
      responses: { 200: authResponseSchema },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
