import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { userSchema, type AuthResponse } from '@livre/types';
import { db } from '../db';
import { signToken } from '../lib/token';
import { DEMO_USERNAME, demoFixtureSchema, type DemoEvent } from '../lib/demoFixture';
import { DEMO_LIBRARY } from '../scripts/demoLibrary.generated';
import { type UsersRepository } from '../repositories/UsersRepository';
import { type LibraryBooksRepository } from '../repositories/LibraryBooksRepository';
import { type ReadingLogRepository } from '../repositories/ReadingLogRepository';

/**
 * Demo mode as an isolated sandbox. The instance carries a single reserved demo user whose library
 * is the committed fixture; entering demo mode mints a session for that user, so a visitor explores
 * (and freely edits) demo data while their real account stays untouched on a different `userId`.
 * That isolation is what makes "reset" safe — it can only ever rewrite the demo user's rows.
 *
 * The fixture is seeded lazily on first entry and persists, so a fresh install's database stays
 * clean until someone actually opens the demo. Seeding authors the full reading-log timeline
 * (explicit `started`/`finished` events, not just the import path's `shelved` + terminal) so the
 * Timeline renders real reading cycles. Composes repositories directly per the layering rules.
 */
export class DemoService {
  constructor(
    private readonly users: UsersRepository,
    private readonly libraryBooks: LibraryBooksRepository,
    private readonly readingLog: ReadingLogRepository
  ) {}

  /** Mint a demo-user session, seeding the demo library on first entry. */
  enter(): AuthResponse {
    const demo = this.ensureUser();
    if (this.libraryBooks.countByUser(demo.id) === 0) {
      db.transaction(() => this.seedRows(demo.id));
    }
    const user = userSchema.parse({ id: demo.id, username: demo.username, is_admin: false });
    return { token: signToken(user, 0), user };
  }

  /** Wipe and re-seed the demo user's library — only ever touches demo rows. */
  reset(): void {
    const demo = this.ensureUser();
    db.transaction(() => {
      this.readingLog.deleteAllForUser(demo.id);
      this.libraryBooks.deleteAllByUser(demo.id);
      this.seedRows(demo.id);
    });
  }

  // The demo user is created on demand with an unusable random password (it's never logged into by
  // credentials — only minted into) and no admin rights, so admin-only screens stay hidden in demo.
  private ensureUser(): { id: number; username: string } {
    const existing = this.users.findByUsername(DEMO_USERNAME);
    if (existing) return { id: existing.id, username: existing.username };
    const passwordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12);
    const created = this.users.create({ username: DEMO_USERNAME, passwordHash, isAdmin: false });
    return { id: created.id, username: created.username };
  }

  // Caller owns the transaction (enter wraps just the seed; reset wraps wipe + seed together).
  private seedRows(userId: number): void {
    const fixture = demoFixtureSchema.parse(DEMO_LIBRARY);
    for (const book of fixture) {
      const libraryBookId = this.libraryBooks.create(
        userId,
        book.source,
        book.externalId,
        book.metadata,
        book.addedDate
      );
      if (book.rating != null) this.libraryBooks.updateRating(libraryBookId, book.rating);
      if (book.review) this.libraryBooks.updateReview(libraryBookId, book.review);
      for (const event of this.withShelvedHead(book.events)) {
        const text = event.event === 'note' || event.event === 'quote' ? event.text : undefined;
        this.readingLog.insert(libraryBookId, event.event, event.date, text);
      }
    }
  }

  // Honor the core invariant: every book needs a `shelved` head so it lands on a shelf. Insert in
  // chronological order (stable on equal dates) so row ids rise with time, keeping the
  // latest-status-event derivation's (date desc, id desc) tie-breaks faithful to the authored order.
  private withShelvedHead(events: DemoEvent[]): DemoEvent[] {
    const ordered = [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (ordered.some((e) => e.event === 'shelved')) return ordered;
    return [{ event: 'shelved', date: ordered[0]?.date ?? events[0].date }, ...ordered];
  }
}
