import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { libraryBooks, readingLog } from '../db/schema';
import { logEntrySchema, type BookFormat, type LogEntry, type LogEventType } from '@livre/types';

export class ReadingLogRepository {
  findByLibraryBookId(libraryBookId: number): LogEntry[] {
    const rows = db
      .select({
        id: readingLog.id,
        event: readingLog.event,
        date: readingLog.date,
        text: readingLog.text,
        format: readingLog.format,
      })
      .from(readingLog)
      .where(eq(readingLog.libraryBookId, libraryBookId))
      .orderBy(desc(readingLog.date), desc(readingLog.id))
      .all();
    return rows.map((r) => logEntrySchema.parse(r));
  }

  insert(
    libraryBookId: number,
    event: LogEventType,
    date: string,
    text?: string,
    format?: BookFormat
  ): number {
    const row = db
      .insert(readingLog)
      .values({ libraryBookId, event, date, text: text ?? null, format: format ?? null })
      .returning({ id: readingLog.id })
      .get();
    if (!row) throw new Error('Failed to insert log event');
    return row.id;
  }

  // Returns true when 'started' should be promoted to 'restarted': the book was previously
  // started at least once, but the current head event is not started/restarted (i.e. the
  // prior reading session ended).
  shouldPromoteToRestart(libraryBookId: number): boolean {
    const hasStart = db
      .select({ id: readingLog.id })
      .from(readingLog)
      .where(
        and(
          eq(readingLog.libraryBookId, libraryBookId),
          inArray(readingLog.event, ['started', 'restarted'])
        )
      )
      .get();

    if (!hasStart) return false;

    const head = db
      .select({ event: readingLog.event })
      .from(readingLog)
      .where(
        and(
          eq(readingLog.libraryBookId, libraryBookId),
          inArray(readingLog.event, ['shelved', 'started', 'restarted', 'finished', 'dnf'])
        )
      )
      .orderBy(desc(readingLog.date), desc(readingLog.id))
      .limit(1)
      .get();

    return !!head && !['started', 'restarted'].includes(head.event);
  }

  belongsToLibraryBook(id: number, libraryBookId: number): boolean {
    return !!db
      .select({ id: readingLog.id })
      .from(readingLog)
      .where(and(eq(readingLog.id, id), eq(readingLog.libraryBookId, libraryBookId)))
      .get();
  }

  update(id: number, fields: { text?: string; date?: string }): void {
    db.update(readingLog)
      .set({
        ...(fields.text !== undefined ? { text: fields.text } : {}),
        ...(fields.date !== undefined ? { date: fields.date } : {}),
      })
      .where(eq(readingLog.id, id))
      .run();
  }

  delete(id: number): void {
    db.delete(readingLog).where(eq(readingLog.id, id)).run();
  }

  deleteAllForBook(libraryBookId: number): void {
    db.delete(readingLog).where(eq(readingLog.libraryBookId, libraryBookId)).run();
  }

  // Drop every log row belonging to the user's books. Scoped via subquery since reading_log has no
  // user_id of its own; done explicitly rather than relying on the FK cascade, which is only enabled
  // on connections that ran the reading_log migration.
  deleteAllForUser(userId: number): void {
    db.delete(readingLog)
      .where(
        inArray(
          readingLog.libraryBookId,
          db
            .select({ id: libraryBooks.id })
            .from(libraryBooks)
            .where(eq(libraryBooks.userId, userId))
        )
      )
      .run();
  }
}
