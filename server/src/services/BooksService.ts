import { type BookSearchResponse } from '@livre/types';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';

export class BooksService {
  constructor(private readonly googleBooks: GoogleBooksProvider) {}

  async search(query: string): Promise<BookSearchResponse> {
    return this.googleBooks.search(query);
  }
}
