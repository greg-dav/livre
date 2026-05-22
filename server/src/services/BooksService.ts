import { type BookSearchResult, type BookSearchResponse } from '@livre/types';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

export class BooksService {
  constructor(private readonly googleBooks: GoogleBooksProvider) {}

  async search(query: string): Promise<BookSearchResponse> {
    return this.googleBooks.search(query);
  }

  async getAuthorBooks(name: string): Promise<BookSearchResponse> {
    const { results, total } = await this.googleBooks.searchByAuthor(name);
    // Enrich each result with a full getById so the grid gets large image URLs.
    // Individual failures fall back to the search result rather than breaking the whole response.
    const enriched = await Promise.all(
      results.map((r) => this.googleBooks.getById(r.googleId).catch(() => r))
    );
    return { results: enriched, total };
  }

  async getById(id: string): Promise<BookSearchResult> {
    return this.googleBooks.getById(id);
  }
}
