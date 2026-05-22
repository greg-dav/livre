import createError from 'http-errors';
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
import { ConfigRepository } from '../repositories/ConfigRepository';

export class GoogleBooksProvider {
  private cachedClient: GoogleBooksClient | null = null;

  constructor(private readonly config: ConfigRepository) {}

  async search(query: string) {
    return this.client().search(query);
  }

  async validate(apiKey: string): Promise<void> {
    await GoogleBooksClient.validateApiKey(apiKey);
  }

  invalidate(): void {
    this.cachedClient = null;
  }

  private client(): GoogleBooksClient {
    if (!this.cachedClient) {
      const apiKey = this.config.get(ConfigRepository.GOOGLE_BOOKS_API_KEY);
      if (!apiKey) throw createError(503, 'Google Books API key not configured');
      this.cachedClient = new GoogleBooksClient(apiKey);
    }
    return this.cachedClient;
  }
}
