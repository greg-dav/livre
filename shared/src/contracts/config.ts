import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, okResponseSchema } from './_shared';

const c = initContract();

const sourceParams = z.object({ source: z.string() });

const updateApiKeyBody = z.object({ apiKey: z.string().min(1, 'API key is required') });

const updateDailyLimitBody = z.object({ limit: z.number().int().min(1).max(100000) });

/**
 * Per-source instance settings (admin-only). The `:source` param is a bare string so the server can
 * distinguish "unknown source" (404) from "not configurable" (400); validating it against the source
 * enum here would collapse both into a 400. Mounted at /api/config behind requireAdmin.
 */
export const configContract = c.router(
  {
    updateApiKey: {
      method: 'PUT',
      path: '/sources/:source/key',
      pathParams: sourceParams,
      body: updateApiKeyBody,
      responses: { 200: okResponseSchema },
    },
    updateDailyLimit: {
      method: 'PUT',
      path: '/sources/:source/limit',
      pathParams: sourceParams,
      body: updateDailyLimitBody,
      responses: { 200: okResponseSchema },
    },
  },
  {
    commonResponses: {
      400: apiErrorSchema,
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
    },
  }
);
