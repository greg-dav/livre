import createError from 'http-errors';
import { type SearchScope, type SearchSort } from '@livre/types';
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
import { ConfigRepository } from '../repositories/ConfigRepository';

type SearchOptions = { startIndex?: number; sort?: SearchSort; maxResults?: number };

export class GoogleBooksProvider {
  private cachedClient: GoogleBooksClient | null = null;

  constructor(private readonly config: ConfigRepository) {}

  async search(query: string, scope: SearchScope = 'anything', opts: SearchOptions = {}) {
    return this.client().search(query, scope, opts);
  }

  async searchByAuthor(name: string, opts: SearchOptions = {}) {
    return this.client().searchByAuthor(name, opts);
  }

  async getById(id: string) {
    return this.client().getById(id);
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
