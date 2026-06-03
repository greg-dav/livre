import { Router, type RequestHandler } from 'express';
import {
  updateApiKeyBodySchema,
  updateDailyLimitBodySchema,
  bookSourceSchema,
  type BookSource,
} from '@livre/types';
import createError from 'http-errors';
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
) => {
  const router = Router();

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
  router.put('/sources/:source/key', requireAdmin, async (req, res, next) => {
    try {
      const { source, configurable } = resolveSource(req.params.source);
      const { apiKey } = updateApiKeyBodySchema.parse(req.body);
      await configurable.validate(apiKey);
      configRepository.set(source, ConfigRepository.API_KEY, apiKey);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  /** Set the per-instance daily cap on a source's import lookups. */
  router.put('/sources/:source/limit', requireAdmin, async (req, res, next) => {
    try {
      const { source } = resolveSource(req.params.source);
      const { limit } = updateDailyLimitBodySchema.parse(req.body);
      configRepository.set(source, ConfigRepository.DAILY_LIMIT, String(limit));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
