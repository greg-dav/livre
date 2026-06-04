// ── Domain model (domain/) ────────────────────────────────────────────────────
export { userSchema, themeNameSchema, managedUserSchema } from './domain/user';
export type { User, ThemeName, ManagedUser } from './domain/user';
export {
  bookSourceSchema,
  bookRefSchema,
  bookGenreSchema,
  bookMetadataSchema,
  bookVolumeSchema,
  libraryVolumeSchema,
  searchScopeSchema,
  searchSortSchema,
  shelfFilterSchema,
  libraryFormatSchema,
  importResultSchema,
  sourceUsageSchema,
  importSourceSchema,
} from './domain/books';
export type {
  BookSource,
  BookGenre,
  BookMetadata,
  BookVolume,
  LibraryVolume,
  BookSearchResult,
  SearchScope,
  SearchSort,
  ShelfFilter,
  LibraryFormat,
  ImportResult,
  SourceUsage,
  ImportSource,
} from './domain/books';
export {
  shelfStatusSchema,
  logEventTypeSchema,
  bookFormatSchema,
  shelfEntrySchema,
  shelfCountsSchema,
  logEntrySchema,
} from './domain/reading';
export type { ShelfStatus, LogEventType, BookFormat, ShelfEntry, LogEntry } from './domain/reading';
export { timelineCycleSchema, timelineBookSchema } from './domain/timeline';
export type { TimelineCycle, TimelineBook } from './domain/timeline';

// ── Contracts + their shared envelopes and request/response DTO types ─────────
export { apiErrorSchema } from './contracts/_shared';
export type { AuthResponse } from './contracts/_shared';
export { accountContract } from './contracts/account';
export { authContract } from './contracts/auth';
export { usersContract } from './contracts/users';
export type { CreateUserBody, UpdateUserBody } from './contracts/users';
export { logContract } from './contracts/log';
export { shelvesContract } from './contracts/shelves';
export type { ShelfResponse } from './contracts/shelves';
export { configContract } from './contracts/config';
export { booksContract } from './contracts/books';
export type {
  CreateLogEventBody,
  CreateLogEventResponse,
  UpdateMetadataBody,
  UpdateLogEntryBody,
  BookSearchResponse,
  SearchResult,
  SearchResponse,
  LibraryResponse,
  LibraryBookDetail,
} from './contracts/books';
