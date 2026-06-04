import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema } from './_shared';
import { timelineBookSchema } from '../domain/timeline';

const c = initContract();

const timelineQuery = z.object({ start: z.string().optional(), end: z.string().optional() });

const timelineResponse = z.array(timelineBookSchema);

/**
 * Reading timeline. Optional `start`/`end` (YYYY-MM-DD) filter to cycles overlapping that range; a
 * range is only applied when both are present. Mounted behind requireAuth.
 */
export const logContract = c.router(
  {
    timeline: {
      method: 'GET',
      path: '/',
      query: timelineQuery,
      responses: { 200: timelineResponse },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
