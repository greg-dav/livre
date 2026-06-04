import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, okResponseSchema } from './_shared';
import { managedUserSchema } from '../domain/user';

const c = initContract();

const userIdParams = z.object({ id: z.coerce.number().int().positive() });

const usersListResponse = z.object({ users: managedUserSchema.array() });

const createUserBody = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  isAdmin: z.boolean(),
});
export type CreateUserBody = z.infer<typeof createUserBody>;

const updateUserBody = z
  .object({
    username: z.string().min(2, 'Username must be at least 2 characters').max(32).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    isAdmin: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No changes provided' });
export type UpdateUserBody = z.infer<typeof updateUserBody>;

/**
 * Admin-only account management. Mounted behind requireAdmin; the delete handler also needs the
 * acting admin's own id to guard against self-deletion.
 */
export const usersContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/',
      responses: { 200: usersListResponse },
    },
    create: {
      method: 'POST',
      path: '/',
      body: createUserBody,
      responses: { 201: managedUserSchema },
    },
    update: {
      method: 'PATCH',
      path: '/:id',
      pathParams: userIdParams,
      body: updateUserBody,
      responses: { 200: managedUserSchema },
    },
    remove: {
      method: 'DELETE',
      path: '/:id',
      pathParams: userIdParams,
      responses: { 200: okResponseSchema },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema, 403: apiErrorSchema } }
);
