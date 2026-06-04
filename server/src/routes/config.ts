import { type Router, type RequestHandler } from 'express';
import {
  updateApiKeyBodySchema,
  updateDailyLimitBodySchema,
  okResponseSchema,
  bookSourceSchema,
  type BookSource,
} from '@livre/types';
import createError from 'http-errors';
import { SchemaRouter } from '../lib/SchemaRouter';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { type ConfigurableSource } from '../ports/bookSource';

/**
 * Per-source instance settings (admin-only). The router is source-agnostic: it's handed a registry
 * of the configurable sources and resolves the `:source` param against it, so adding a keyed source
 * is registration-only.
 */
export const createConfigRouter = (
  configRepository: ConfigRepository,
  configurableSources: Map<BookSource, ConfigurableSource>,
  requireAdmin: RequestHandler
): Router => {
  const admin = new SchemaRouter().use(requireAdmin);

  const resolveSource = (
    raw: unknown
  ): { source: BookSource; configurable: ConfigurableSource } => {
    const parsed = bookSourceSchema.safeParse(raw);
    if (!parsed.success) throw createError(404, 'Unknown source');
    const configurable = configurableSources.get(parsed.data);
    if (!configurable) throw createError(400, `Source ${parsed.data} is not configurable`);
    return { source: parsed.data, configurable };
  };

  /** Update and validate a source's API key (validated against the live API before storing). */
  admin.put(
    '/sources/:source/key',
    updateApiKeyBodySchema,
    okResponseSchema,
    async ({ apiKey }, respond, req) => {
      const { source, configurable } = resolveSource(req.params.source);
      await configurable.validate(apiKey);
      configRepository.set(source, ConfigRepository.API_KEY, apiKey);
      respond({ ok: true });
    }
  );

  /** Set the per-instance daily cap on a source's import lookups. */
  admin.put(
    '/sources/:source/limit',
    updateDailyLimitBodySchema,
    okResponseSchema,
    ({ limit }, respond, req) => {
      const { source } = resolveSource(req.params.source);
      configRepository.set(source, ConfigRepository.DAILY_LIMIT, String(limit));
      respond({ ok: true });
    }
  );

  return admin.router;
};
