import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, authResponseSchema, okResponseSchema } from './_shared';

const c = initContract();

/**
 * Demo mode. `enter` switches the caller into the instance's isolated demo user — its own library,
 * seeded on first entry — and returns a session for it; the real account is never touched. `reset`
 * restores the demo library to its pristine fixture. Both are guarded (a real session enters; the
 * demo session can reset its own data). Exit is purely client-side (the client restores its stashed
 * real token), so there's no exit route. Mounted at /api/demo.
 */
export const demoContract = c.router(
  {
    enter: {
      method: 'POST',
      path: '/enter',
      body: z.object({}),
      responses: { 200: authResponseSchema },
    },
    reset: {
      method: 'POST',
      path: '/reset',
      body: z.object({}),
      responses: { 200: okResponseSchema },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
