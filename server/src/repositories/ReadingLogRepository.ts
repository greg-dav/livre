import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { readingLog } from '../db/schema';
import type { LogEventType } from '@livre/types';

export class ReadingLogRepository {
  insert(libraryBookId: number, event: LogEventType, date: string, note?: string): number {
    const row = db
      .insert(readingLog)
      .values({ libraryBookId, event, date, note: note ?? null })
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
}
