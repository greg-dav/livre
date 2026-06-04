import { z } from 'zod';
import express, { type Router, type RequestHandler } from 'express';
import { libraryContract, bookSourceSchema, importResultSchema } from '@livre/types';
import createError from 'http-errors';
import { server, attachContract, userOf, ok, notFound } from '../lib/tsRest';
import { decodeBookRef } from '../lib/bookRef';
import { type LibraryService } from '../services/LibraryService';
import { type LibraryTransferService } from '../services/LibraryTransferService';

const decodeRef = (
  raw: string
): { source: import('@livre/types').BookSource; externalId: string } => {
  try {
    return decodeBookRef(raw);
  } catch {
    throw createError(400, 'Invalid book reference');
  }
};

export function createLibraryRouter(
  service: LibraryService,
  transfer: LibraryTransferService,
  requireAuth: RequestHandler
): Router {
  const expressRouter = express.Router();
  expressRouter.use(requireAuth);

  // Non-JSON routes stay as plain Express, registered before the contract so "/export" and
  // "/import" aren't captured by the "/:libraryBookId" matcher.
  expressRouter.get('/export', (req, res) => {
    const format = z.string().min(1).safeParse(req.query.format).data ?? 'goodreads';
    const { content, mimeType, filename } = transfer.export(userOf(req).id, format);
    res.setHeader('Content-Type', `${mimeType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  });

  expressRouter.post(
    '/import',
    express.text({ type: () => true, limit: '5mb' }),
    async (req, res, next) => {
      try {
        const content = typeof req.body === 'string' ? req.body : '';
        if (!content.trim()) throw createError(400, 'Empty import file');
        const format = z.string().min(1).safeParse(req.query.format).data ?? 'goodreads';
        const source = bookSourceSchema.safeParse(req.query.source).data ?? 'OPEN_LIBRARY';
        const result = await transfer.import(userOf(req).id, format, content, source);
        res.json(importResultSchema.parse(result));
      } catch (e) {
        next(e);
      }
    }
  );

  const router = server.router(libraryContract, {
    add: async ({ body, req }) => {
      const { source, externalId } = decodeRef(body.bookRef);
      return ok(
        await service.addToLibrary(userOf(req).id, source, externalId, body.event, body.date)
      );
    },

    getLibrary: async ({ req }) => ok(service.getLibrary(userOf(req).id)),

    deleteLibrary: async ({ req }) =>
      ok({ ok: true, deleted: service.deleteLibrary(userOf(req).id) }),

    getTags: async ({ req }) => ok(service.getTags(userOf(req).id)),

    getShelf: async ({ params, req }) => ok(service.getShelf(userOf(req).id, params.status)),

    getFormats: async () => ok(transfer.listFormats()),

    getImportSources: async () => ok(transfer.listImportSources()),

    getLibraryBook: async ({ params, req }) => {
      const detail = service.getLibraryBook(userOf(req).id, params.libraryBookId);
      return detail ? ok(detail) : notFound('Book not found');
    },

    updateTags: async ({ params, body, req }) => {
      const updated = service.updateTags(userOf(req).id, params.libraryBookId, body.tags);
      return updated ? ok({ ok: true }) : notFound('Book not found');
    },

    updateMetadata: async ({ params, body, req }) => {
      const updated = service.updateMetadata(userOf(req).id, params.libraryBookId, body);
      return updated ? ok({ ok: true }) : notFound('Book not found');
    },

    logEvent: async ({ params, body, req }) => {
      const text = body.event === 'note' || body.event === 'quote' ? body.text : undefined;
      const format = body.event === 'format' ? body.format : undefined;
      const result = service.logEvent(
        userOf(req).id,
        params.libraryBookId,
        body.event,
        body.date,
        text,
        format
      );
      return result ? ok(result) : notFound('Book not found');
    },

    updateRating: async ({ params, body, req }) => {
      const updated = service.updateRating(userOf(req).id, params.libraryBookId, body.rating);
      return updated ? ok({ ok: true }) : notFound('Book not found');
    },

    updateReview: async ({ params, body, req }) => {
      const updated = service.updateReview(userOf(req).id, params.libraryBookId, body.review);
      return updated ? ok({ ok: true }) : notFound('Book not found');
    },

    updateLogEntry: async ({ params, body, req }) => {
      const updated = service.updateLogEntry(
        userOf(req).id,
        params.libraryBookId,
        params.logId,
        body
      );
      return updated ? ok({ ok: true }) : notFound('Log entry not found');
    },

    deleteLogEntry: async ({ params, req }) => {
      const deleted = service.deleteLogEntry(userOf(req).id, params.libraryBookId, params.logId);
      return deleted ? ok({ ok: true }) : notFound('Log entry not found');
    },

    resetReadingLog: async ({ params, req }) => {
      const reset = service.resetReadingLog(userOf(req).id, params.libraryBookId);
      return reset ? ok({ ok: true }) : notFound('Book not found');
    },

    removeFromLibrary: async ({ params, req }) => {
      const removed = service.removeFromLibrary(userOf(req).id, params.libraryBookId);
      return removed ? ok({ ok: true }) : notFound('Book not found');
    },
  });

  attachContract(expressRouter, libraryContract, router);
  return expressRouter;
}
