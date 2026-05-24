export { userSchema } from './schemas/user';
export type { User } from './schemas/user';
export {
  registerBodySchema,
  loginBodySchema,
  instanceStatusSchema,
  authResponseSchema,
} from './schemas/auth';
export type { RegisterBody, LoginBody, InstanceStatus, AuthResponse } from './schemas/auth';
export { apiErrorSchema } from './schemas/api';
export type { ApiError } from './schemas/api';
export { bookSearchResultSchema, bookSearchResponseSchema } from './schemas/books';
export type { BookSearchResult, BookSearchResponse } from './schemas/books';
export { updateApiKeyBodySchema, updateApiKeyResponseSchema } from './schemas/config';
export type { UpdateApiKeyBody } from './schemas/config';
export {
  shelfStatusSchema,
  logEventTypeSchema,
  shelfEntrySchema,
  shelfCountsSchema,
  shelfResponseSchema,
  createLogEventBodySchema,
  createLogEventResponseSchema,
  libraryResponseSchema,
} from './schemas/shelves';
export type {
  ShelfStatus,
  LogEventType,
  ShelfEntry,
  ShelfCounts,
  ShelfResponse,
  CreateLogEventBody,
  CreateLogEventResponse,
  LibraryResponse,
} from './schemas/shelves';
