import { z } from 'zod';
import { type Router } from 'express';
import {
  bookRefSchema,
  bookVolumeSchema,
  bookSearchResponseSchema,
  createLogEventBodySchema,
  createLogEventResponseSchema,
  libraryBookDetailSchema,
  libraryResponseSchema,
  updateTagsBodySchema,
  updateTagsResponseSchema,
  updateDescriptionBodySchema,
  updateDescriptionResponseSchema,
  updateCoverBodySchema,
  updateCoverResponseSchema,
  updateTitleBodySchema,
  updateTitleResponseSchema,
  updatePublisherBodySchema,
  updatePublisherResponseSchema,
  updatePageCountBodySchema,
  updatePageCountResponseSchema,
  updatePublishedDateBodySchema,
  updatePublishedDateResponseSchema,
  updateLanguageBodySchema,
  updateLanguageResponseSchema,
  updateIsbnBodySchema,
  updateIsbnResponseSchema,
  refreshMetadataBodySchema,
  refreshMetadataResponseSchema,
  updateRatingBodySchema,
  updateRatingResponseSchema,
  updateReviewBodySchema,
  updateReviewResponseSchema,
  updateLogEntryBodySchema,
  updateLogEntryResponseSchema,
  deleteLogEntryResponseSchema,
} from '@livre/types';
import createError from 'http-errors';
import { requireAuth } from '../middleware/auth';
import { SchemaRouter } from '../lib/SchemaRouter';
import { decodeBookRef } from '../lib/bookRef';
import { type BooksService } from '../services/BooksService';

const parseBookRef = (
  raw: unknown
): { source: import('@livre/types').BookSource; externalId: string } => {
  const ref = bookRefSchema.safeParse(raw);
  if (!ref.success) throw createError(400, 'Invalid book reference');
  try {
    return decodeBookRef(ref.data);
  } catch {
    throw createError(400, 'Invalid book reference');
  }
};

export function createBooksRouter(service: BooksService): Router {
  const router = new SchemaRouter().use(requireAuth);

  /** Search by query string. */
  router.get('/search', bookSearchResponseSchema, async (respond, req) => {
    const q = z.string().min(1, 'Query is required').safeParse(req.query.q);
    if (!q.success) throw createError(400, q.error.issues[0]?.message ?? 'Invalid query');
    respond(await service.search(q.data));
  });

  /** Return books by a given author. */
  router.get('/search/author/:name', bookSearchResponseSchema, async (respond, req) => {
    const name = z.string().min(1).parse(req.params.name);
    respond(await service.getAuthorBooks(name));
  });

  /** Fetch full volume data for a single book by its opaque ref. */
  router.get('/search/book/:bookRef', bookVolumeSchema, async (respond, req) => {
    const { source, externalId } = parseBookRef(req.params.bookRef);
    respond(await service.getById(source, externalId));
  });

  /** Add a book to the library with an initial status event. */
  router.post(
    '/search/book/:bookRef/add',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const { source, externalId } = parseBookRef(req.params.bookRef);
      respond(await service.addToLibrary(user.id, source, externalId, body.event, body.date));
    }
  );

  /** Return all books in the authenticated user's library. */
  router.get('/library', libraryResponseSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    respond(service.getLibrary(user.id));
  });

  /** Return full volume data and shelf metadata for a single library book. */
  router.get('/library/:libraryBookId', libraryBookDetailSchema, async (respond, req) => {
    const user = req.user;
    if (!user) throw createError(401, 'Unauthorized');
    const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
    const detail = service.getLibraryBook(user.id, libraryBookId);
    if (!detail) throw createError(404, 'Book not found');
    respond(detail);
  });

  /** Update the tags on a library book. */
  router.patch(
    '/library/:libraryBookId/tags',
    updateTagsBodySchema,
    updateTagsResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateTags(user.id, libraryBookId, body.tags);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the description on a library book. */
  router.patch(
    '/library/:libraryBookId/description',
    updateDescriptionBodySchema,
    updateDescriptionResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateDescription(user.id, libraryBookId, body.description);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the cover image URL on a library book. */
  router.patch(
    '/library/:libraryBookId/cover',
    updateCoverBodySchema,
    updateCoverResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateCover(user.id, libraryBookId, body.url);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the title on a library book. */
  router.patch(
    '/library/:libraryBookId/title',
    updateTitleBodySchema,
    updateTitleResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateTitle(user.id, libraryBookId, body.title);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the publisher on a library book. */
  router.patch(
    '/library/:libraryBookId/publisher',
    updatePublisherBodySchema,
    updatePublisherResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updatePublisher(user.id, libraryBookId, body.publisher);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the page count on a library book. */
  router.patch(
    '/library/:libraryBookId/page-count',
    updatePageCountBodySchema,
    updatePageCountResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updatePageCount(user.id, libraryBookId, body.pageCount);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the published date on a library book. */
  router.patch(
    '/library/:libraryBookId/published-date',
    updatePublishedDateBodySchema,
    updatePublishedDateResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updatePublishedDate(user.id, libraryBookId, body.publishedDate);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the language on a library book. */
  router.patch(
    '/library/:libraryBookId/language',
    updateLanguageBodySchema,
    updateLanguageResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateLanguage(user.id, libraryBookId, body.language);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the ISBN on a library book. */
  router.patch(
    '/library/:libraryBookId/isbn',
    updateIsbnBodySchema,
    updateIsbnResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateIsbn(user.id, libraryBookId, body.isbn);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Bulk-refresh metadata on a library book (e.g. after an ISBN lookup). */
  router.patch(
    '/library/:libraryBookId/metadata',
    refreshMetadataBodySchema,
    refreshMetadataResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.refreshMetadata(user.id, libraryBookId, body);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Log a reading event for a book already in the library. */
  router.post(
    '/library/:libraryBookId/log',
    createLogEventBodySchema,
    createLogEventResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const text = body.event === 'note' || body.event === 'quote' ? body.text : undefined;
      const format = body.event === 'format' ? body.format : undefined;
      const result = service.logEvent(user.id, libraryBookId, body.event, body.date, text, format);
      if (!result) throw createError(404, 'Book not found');
      respond(result);
    }
  );

  /** Update the star rating on a library book. */
  router.patch(
    '/library/:libraryBookId/rating',
    updateRatingBodySchema,
    updateRatingResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateRating(user.id, libraryBookId, body.rating);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update the review text on a library book. */
  router.patch(
    '/library/:libraryBookId/review',
    updateReviewBodySchema,
    updateReviewResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const ok = service.updateReview(user.id, libraryBookId, body.review);
      if (!ok) throw createError(404, 'Book not found');
      respond({ ok: true });
    }
  );

  /** Update text and/or date on an existing log entry. */
  router.patch(
    '/library/:libraryBookId/log/:logId',
    updateLogEntryBodySchema,
    updateLogEntryResponseSchema,
    async (body, respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const logId = z.coerce.number().int().positive().parse(req.params.logId);
      const ok = service.updateLogEntry(user.id, libraryBookId, logId, body);
      if (!ok) throw createError(404, 'Log entry not found');
      respond({ ok: true });
    }
  );

  /** Delete a log entry. */
  router.delete(
    '/library/:libraryBookId/log/:logId',
    deleteLogEntryResponseSchema,
    async (respond, req) => {
      const user = req.user;
      if (!user) throw createError(401, 'Unauthorized');
      const libraryBookId = z.coerce.number().int().positive().parse(req.params.libraryBookId);
      const logId = z.coerce.number().int().positive().parse(req.params.logId);
      const ok = service.deleteLogEntry(user.id, libraryBookId, logId);
      if (!ok) throw createError(404, 'Log entry not found');
      respond({ ok: true });
    }
  );

  return router.router;
}
