import {
  type BookVolume,
  type BookSearchResponse,
  type ShelfResponse,
  type CreateLogEventResponse,
  type LibraryBookDetail,
  type LibraryResponse,
  type ShelfStatus,
  type LogEventType,
} from '@livre/types';
import { db } from '../db';
import { type GoogleBooksProvider } from '../providers/GoogleBooksProvider';
import { type BooksRepository } from '../repositories/BooksRepository';
import { type UserBooksRepository } from '../repositories/UserBooksRepository';
import { type ReadingLogRepository } from '../repositories/ReadingLogRepository';

export class BooksService {
  constructor(
    private readonly googleBooks: GoogleBooksProvider,
    private readonly booksRepo: BooksRepository,
    private readonly userBooksRepo: UserBooksRepository,
    private readonly readingLogRepo: ReadingLogRepository
  ) {}

  async search(query: string): Promise<BookSearchResponse> {
    return this.googleBooks.search(query);
  }

  async getAuthorBooks(name: string): Promise<BookSearchResponse> {
    const { results, total } = await this.googleBooks.searchByAuthor(name);
    const enriched: BookVolume[] = [];
    for (let i = 0; i < results.length; i += 3) {
      const chunk = results.slice(i, i + 3);
      const resolved = await Promise.all(chunk.map((r) => this.getById(r.googleId).catch(() => r)));
      enriched.push(...resolved);
    }
    return { results: enriched, total };
  }

  async getById(id: string): Promise<BookVolume> {
    const cached = this.booksRepo.findByGoogleIdResult(id);
    if (cached) return cached;
    const bookData = await this.googleBooks.getById(id);
    this.booksRepo.upsert(bookData);
    return bookData;
  }

  async addToLibrary(
    userId: number,
    googleId: string,
    event: LogEventType,
    date?: string
  ): Promise<CreateLogEventResponse> {
    const cached = this.booksRepo.findByGoogleId(googleId);
    let bookId: number;
    if (cached) {
      bookId = cached.id;
    } else {
      const bookData = await this.googleBooks.getById(googleId);
      bookId = this.booksRepo.upsert(bookData);
    }

    return db.transaction(() => {
      const userBookId = this.userBooksRepo.findOrCreate(userId, bookId);
      const resolvedEvent =
        event === 'started' && this.readingLogRepo.shouldPromoteToRestart(userBookId)
          ? 'restarted'
          : event;
      const logDate = date ?? new Date().toISOString().slice(0, 10);
      const logId = this.readingLogRepo.insert(userBookId, resolvedEvent, logDate);
      return { userBookId, logId };
    });
  }

  async getLibraryBook(userId: number, userBookId: number): Promise<LibraryBookDetail | null> {
    const entry = this.userBooksRepo.findByUserBookId(userId, userBookId);
    if (!entry || !entry.googleId) return null;
    const book = await this.getById(entry.googleId);
    return { entry, book };
  }

  logEvent(
    userId: number,
    userBookId: number,
    event: LogEventType,
    date?: string
  ): CreateLogEventResponse | null {
    const entry = this.userBooksRepo.findByUserBookId(userId, userBookId);
    if (!entry) return null;

    return db.transaction(() => {
      const resolvedEvent =
        event === 'started' && this.readingLogRepo.shouldPromoteToRestart(userBookId)
          ? 'restarted'
          : event;
      const logDate = date ?? new Date().toISOString().slice(0, 10);
      const logId = this.readingLogRepo.insert(userBookId, resolvedEvent, logDate);
      return { userBookId, logId };
    });
  }

  getShelf(userId: number, status: ShelfStatus): ShelfResponse {
    const all = this.userBooksRepo.findAllByUser(userId);
    const entries = all.filter((e) => e.status === status);
    const counts = {
      want: 0,
      reading: 0,
      read: 0,
      dnf: 0,
    };
    for (const entry of all) {
      counts[entry.status]++;
    }
    return { entries, counts };
  }

  getLibrary(userId: number): LibraryResponse {
    return this.userBooksRepo.findAllByUser(userId);
  }
}
