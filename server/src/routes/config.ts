import { type Router, type RequestHandler } from 'express';
import { configContract, bookSourceSchema, type BookSource } from '@livre/types';
import createError from 'http-errors';
import { server, mountContract, ok } from '../lib/tsRest';
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
  const resolveSource = (raw: string): { source: BookSource; configurable: ConfigurableSource } => {
    const parsed = bookSourceSchema.safeParse(raw);
    if (!parsed.success) throw createError(404, 'Unknown source');
    const configurable = configurableSources.get(parsed.data);
    if (!configurable) throw createError(400, `Source ${parsed.data} is not configurable`);
    return { source: parsed.data, configurable };
  };

  const router = server.router(configContract, {
    updateApiKey: async ({ params, body }) => {
      const { source, configurable } = resolveSource(params.source);
      await configurable.validate(body.apiKey);
      configRepository.set(source, ConfigRepository.API_KEY, body.apiKey);
      return ok({ ok: true });
    },

    updateDailyLimit: async ({ params, body }) => {
      const { source } = resolveSource(params.source);
      configRepository.set(source, ConfigRepository.DAILY_LIMIT, String(body.limit));
      return ok({ ok: true });
    },
  });

  return mountContract(configContract, router, requireAdmin);
};
