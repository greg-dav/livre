import { z } from 'zod';

/**
 * Source of book metadata. Provider-agnostic so we never persist a Google-specific reference.
 * Adding a new provider (e.g. OPEN_LIBRARY) means appending to this enum and the matching DB
 * CHECK constraint — no migration of existing rows.
 *
 * This enum is server-internal. The client never sees source values directly; books are
 * referenced from the client by an opaque `bookRef` string that encodes (source, externalId).
 */
export const bookSourceSchema = z.enum(['GOOGLE_BOOKS']);
export type BookSource = z.infer<typeof bookSourceSchema>;

/**
 * Client-facing book reference. Opaque to the client — encodes (source, externalId) but the
 * client never parses it. Constructed and decoded server-side only.
 *
 * Lives in its own module to keep books.ts and shelves.ts free of a circular import: both
 * reference this primitive, but books.ts also depends on shelfEntrySchema from shelves.ts.
 */
export const bookRefSchema = z.string().min(1);
