import createError from 'http-errors';
import { type BookSearchResponse } from '@livre/types';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { type GoogleBooksClient } from '../clients/GoogleBooksClient';

export class BooksService {
  constructor(
    private readonly config: ConfigRepository,
    private readonly books: GoogleBooksClient
  ) {}

  async search(query: string): Promise<BookSearchResponse> {
    const apiKey = this.config.get(ConfigRepository.GOOGLE_BOOKS_API_KEY);
    if (!apiKey) throw createError(503, 'Google Books API key not configured');
    return this.books.search(query, apiKey);
  }
}
