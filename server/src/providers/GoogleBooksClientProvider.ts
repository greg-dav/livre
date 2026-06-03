import createError from 'http-errors';
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
import { ConfigRepository } from '../repositories/ConfigRepository';

/**
 * Lifecycle owner for the Google Books HTTP client: it reads the configured API key and produces a
 * ready {@link GoogleBooksClient}, or refuses (503) when the instance has no key. Built fresh from
 * config each call — construction just captures the key, so there's nothing worth caching, and
 * reading config every time means a key change takes effect immediately with no invalidation to
 * remember. This keeps the config→client concern out of the adapter, which only translates and meters.
 */
export class GoogleBooksClientProvider {
  constructor(private readonly config: ConfigRepository) {}

  /** Whether an API key is configured — i.e. whether Google Books can be offered at all. */
  isConfigured(): boolean {
    return !!this.config.get('GOOGLE_BOOKS', ConfigRepository.API_KEY);
  }

  /** A client bound to the configured key, or throw 503 when none is set. */
  get(): GoogleBooksClient {
    const apiKey = this.config.get('GOOGLE_BOOKS', ConfigRepository.API_KEY);
    if (!apiKey) throw createError(503, 'Google Books API key not configured');
    return new GoogleBooksClient(apiKey);
  }
}
