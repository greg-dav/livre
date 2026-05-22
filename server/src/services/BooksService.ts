import {
  type BookSearchResult,
  type BookSearchResponse,
  type ShelfResponse,
  type SaveBookResponse,
  type LibraryResponse,
  type ShelfStatus,
} from '@livre/types';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';
import { type BooksRepository } from '../repositories/BooksRepository';
import { type UserBooksRepository } from '../repositories/UserBooksRepository';

export class BooksService {
  constructor(
    private readonly googleBooks: GoogleBooksProvider,
    private readonly booksRepo: BooksRepository,
    private readonly userBooksRepo: UserBooksRepository
  ) {}

  async search(query: string): Promise<BookSearchResponse> {
    return this.googleBooks.search(query);
  }

  async getAuthorBooks(name: string): Promise<BookSearchResponse> {
    const { results, total } = await this.googleBooks.searchByAuthor(name);
    const enriched: BookSearchResult[] = [];
    for (let i = 0; i < results.length; i += 3) {
      const chunk = results.slice(i, i + 3);
      const resolved = await Promise.all(chunk.map((r) => this.getById(r.googleId).catch(() => r)));
      enriched.push(...resolved);
    }
    return { results: enriched, total };
  }

  async getById(id: string): Promise<BookSearchResult> {
    const cached = this.booksRepo.findByGoogleIdResult(id);
    if (cached) return cached;
    const bookData = await this.googleBooks.getById(id);
    this.booksRepo.upsert(bookData);
    return bookData;
  }

  async saveToLibrary(
    userId: number,
    googleId: string,
    status: ShelfStatus
  ): Promise<SaveBookResponse> {
    const cached = this.booksRepo.findByGoogleId(googleId);
    let bookId: number;
    if (cached) {
      bookId = cached.id;
    } else {
      const bookData = await this.googleBooks.getById(googleId);
      bookId = this.booksRepo.upsert(bookData);
    }
    const userBookId = this.userBooksRepo.upsert(userId, bookId, status);
    return { userBookId, status };
  }

  getShelf(userId: number, status: ShelfStatus): ShelfResponse {
    return {
      entries: this.userBooksRepo.findByUserAndStatus(userId, status),
      counts: this.userBooksRepo.countsByUser(userId),
    };
  }

  getLibrary(userId: number): LibraryResponse {
    return this.userBooksRepo.findAllByUser(userId);
  }
}
