import { z } from 'zod';
import createError from 'http-errors';

const uniqueViolationSchema = z.object({ code: z.literal('SQLITE_CONSTRAINT_UNIQUE') });

/** True when the error is a SQLite UNIQUE constraint violation (e.g. a duplicate username). */
export const isUniqueViolation = (err: unknown): boolean =>
  uniqueViolationSchema.safeParse(err).success;

/** Narrow a possibly-missing repository row, throwing a 404 when absent. */
export const found = <T>(row: T | undefined | null, message = 'Not found'): T => {
  if (row == null) throw createError(404, message);
  return row;
};
