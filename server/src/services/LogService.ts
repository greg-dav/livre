import { LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { ReadingLogRepository } from '../repositories/ReadingLogRepository';
import { deriveCycles } from '../lib/cycles';
import { type TimelineBook, type TimelineCycle } from '@livre/types';

interface DateRange {
  start: string;
  end: string;
}

// A cycle overlaps the range if it starts on/before the range end and hasn't ended before the range
// start. An open (reading) cycle is treated as running through today. YYYY-MM-DD compares lexically.
const cycleOverlaps = (cycle: TimelineCycle, range: DateRange, today: string): boolean =>
  cycle.start <= range.end && (cycle.end ?? today) >= range.start;

/**
 * Builds the reading-timeline view: every library book with its reading activity sliced into
 * cycles (one bar per read). Owns no HTTP or SQL concerns — composes the library-books and
 * reading-log repositories and the pure `deriveCycles` helper. Books arrive from the repository
 * already source-blind (as `ShelfEntry`, carrying an opaque `bookRef`), so the provider is never
 * exposed to the client.
 */
export class LogService {
  constructor(
    private readonly libraryBooks: LibraryBooksRepository,
    private readonly readingLog: ReadingLogRepository
  ) {}

  getTimeline(userId: number, range?: DateRange): TimelineBook[] {
    const today = new Date().toISOString().slice(0, 10);

    let books = this.libraryBooks.findAllByUser(userId).map((entry) => {
      const log = this.readingLog.findByLibraryBookId(entry.libraryBookId);
      return {
        libraryBookId: entry.libraryBookId,
        bookRef: entry.bookRef,
        title: entry.title,
        authors: entry.authors,
        coverUrl: entry.coverUrl,
        rating: entry.rating,
        addedDate: entry.addedDate,
        shelvedDate: log.find((e) => e.event === 'shelved')?.date ?? null,
        cycles: deriveCycles(log),
      };
    });

    // Scope to books with a cycle overlapping the requested window (omitted = full library).
    if (range) {
      books = books.filter((b) => b.cycles.some((c) => cycleOverlaps(c, range, today)));
    }

    // Currently-reading books (an open cycle) float to the top so active reads are always visible;
    // the rest follow by most-recent activity. Stable sort keeps the repository's order within ties.
    const isReading = (b: TimelineBook) => b.cycles.some((c) => c.status === 'reading');
    const lastActivity = (b: TimelineBook) =>
      b.cycles.reduce((max, c) => {
        const d = c.end ?? c.start;
        return d > max ? d : max;
      }, '');
    return books.sort((a, b) => {
      if (isReading(a) !== isReading(b)) return isReading(a) ? -1 : 1;
      return lastActivity(b).localeCompare(lastActivity(a));
    });
  }
}
