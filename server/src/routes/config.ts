import { Router, type RequestHandler } from 'express';
import { updateApiKeyBodySchema, updateGoogleBooksLimitBodySchema } from '@livre/types';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

export const createConfigRouter = (
  configRepository: ConfigRepository,
  googleBooksProvider: GoogleBooksProvider,
  requireAdmin: RequestHandler
) => {
  const router = Router();

  /** Update and validate the Google Books API key; requires admin privileges. */
  router.put('/google-books-key', requireAdmin, async (req, res, next) => {
    try {
      const { apiKey } = updateApiKeyBodySchema.parse(req.body);
      await googleBooksProvider.validate(apiKey);
      configRepository.set(ConfigRepository.GOOGLE_BOOKS_API_KEY, apiKey);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  /** Set the per-instance daily cap on Google Books import lookups; requires admin privileges. */
  router.put('/google-books-limit', requireAdmin, async (req, res, next) => {
    try {
      const { limit } = updateGoogleBooksLimitBodySchema.parse(req.body);
      configRepository.set(ConfigRepository.GOOGLE_BOOKS_DAILY_LIMIT, String(limit));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
