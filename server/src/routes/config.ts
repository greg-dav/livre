import { Router } from 'express';
import { updateApiKeyBodySchema } from '@livre/types';
import { requireAdmin } from '../middleware/auth';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

export const createConfigRouter = (
  configRepository: ConfigRepository,
  googleBooksProvider: GoogleBooksProvider
) => {
  const router = Router();

  /** Update and validate the Google Books API key; requires admin privileges. */
  router.put('/google-books-key', requireAdmin, async (req, res, next) => {
    try {
      const { apiKey } = updateApiKeyBodySchema.parse(req.body);
      await googleBooksProvider.validate(apiKey);
      configRepository.set(ConfigRepository.GOOGLE_BOOKS_API_KEY, apiKey);
      googleBooksProvider.invalidate();
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
