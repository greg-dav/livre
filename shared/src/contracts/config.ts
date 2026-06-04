import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorSchema, okResponseSchema } from './_shared';
import { bookSourceSchema } from '../domain/bookRef';

const c = initContract();

const sourceParams = z.object({ source: z.string() });

const updateApiKeyBody = z.object({ apiKey: z.string().min(1, 'API key is required') });

const updateDailyLimitBody = z.object({ limit: z.number().int().min(1).max(100000) });

const preferredSourceResponse = z.object({ source: bookSourceSchema });
const setPreferredSourceBody = z.object({ source: bookSourceSchema });

/**
 * Per-source instance settings (admin-only). The `:source` param is a bare string so the server can
 * distinguish "unknown source" (404) from "not configurable" (400); validating it against the source
 * enum here would collapse both into a 400. The preferred-source routes are instance-wide rather
 * than per-source: they read and set the top of the metadata-source priority order that backs the
 * discovery screens. Mounted at /api/config behind requireAdmin.
 */
export const configContract = c.router(
  {
    getPreferredSource: {
      method: 'GET',
      path: '/preferred-source',
      responses: { 200: preferredSourceResponse },
    },
    setPreferredSource: {
      method: 'PUT',
      path: '/preferred-source',
      body: setPreferredSourceBody,
      responses: { 200: okResponseSchema },
    },
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
