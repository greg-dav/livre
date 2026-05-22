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
  shelfEntrySchema,
  shelfCountsSchema,
  shelfResponseSchema,
  saveBookBodySchema,
  saveBookResponseSchema,
  libraryEntrySchema,
  libraryResponseSchema,
} from './schemas/shelves';
export type {
  ShelfStatus,
  ShelfEntry,
  ShelfCounts,
  ShelfResponse,
  SaveBookBody,
  SaveBookResponse,
  LibraryEntry,
  LibraryResponse,
} from './schemas/shelves';
