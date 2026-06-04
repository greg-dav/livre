import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema } from './_shared';
import { shelfEntrySchema, shelfCountsSchema, shelfStatusSchema } from '../domain/reading';

const c = initContract();

const shelfResponse = z.object({
  entries: z.array(shelfEntrySchema),
  counts: shelfCountsSchema,
});
export type ShelfResponse = z.infer<typeof shelfResponse>;

/** Books on a given shelf plus counts for every shelf status. Mounted behind requireAuth. */
export const shelvesContract = c.router(
  {
    getShelf: {
      method: 'GET',
      path: '/:status',
      pathParams: z.object({ status: shelfStatusSchema }),
      responses: { 200: shelfResponse },
    },
  },
  { commonResponses: { 400: apiErrorSchema, 401: apiErrorSchema } }
);
