import { type BookSearchResult, type BookSearchResponse } from '@livre/types';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

export class BooksService {
  constructor(private readonly googleBooks: GoogleBooksProvider) {}

  async search(query: string): Promise<BookSearchResponse> {
    return this.googleBooks.search(query);
  }

  async searchByAuthor(name: string): Promise<BookSearchResponse> {
    return this.googleBooks.search(`inauthor:"${name}"`);
  }

  async getById(id: string): Promise<BookSearchResult> {
    return this.googleBooks.getById(id);
  }
}
