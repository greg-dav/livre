import { type Router, type RequestHandler } from 'express';
import { configContract, bookSourceSchema, type BookSource } from '@livre/types';
import createError from 'http-errors';
import { server, mountContract, ok } from '../lib/tsRest';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { type BookSourceRegistry } from '../registries/BookSourceRegistry';
import { type ConfigurableSource } from '../ports/bookSource';

/**
 * Per-source instance settings (admin-only). The router is source-agnostic: it resolves the
 * `:source` param against the registry's configurable sources, so adding a keyed source is
 * registration-only. It also owns the instance-wide preferred metadata source, validating a pinned
 * choice against the registry's currently-selectable sources.
 */
export const createConfigRouter = (
  configRepository: ConfigRepository,
  registry: BookSourceRegistry,
  requireAdmin: RequestHandler
): Router => {
  const configurableSources = registry.configurableSources();
  const resolveSource = (raw: string): { source: BookSource; configurable: ConfigurableSource } => {
    const parsed = bookSourceSchema.safeParse(raw);
    if (!parsed.success) throw createError(404, 'Unknown source');
    const configurable = configurableSources.get(parsed.data);
    if (!configurable) throw createError(400, `Source ${parsed.data} is not configurable`);
    return { source: parsed.data, configurable };
  };

  const router = server.router(configContract, {
    getPreferredSource: async () => ok({ source: registry.preferredSearchSource() }),

    setPreferredSource: async ({ body }) => {
      if (!registry.isSelectableSource(body.source)) {
        throw createError(400, `Source ${body.source} is not available`);
      }
      configRepository.setPriorities(registry.searchOrderPreferring(body.source));
      return ok({ ok: true });
    },

    updateApiKey: async ({ params, body }) => {
      const { configurable } = resolveSource(params.source);
      await configurable.validate(body.apiKey);
      configurable.applyApiKey(body.apiKey);
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
