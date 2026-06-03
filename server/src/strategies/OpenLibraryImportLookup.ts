import _ from 'lodash';
import { type BookSource, type ImportSource } from '@livre/types';
import { type SourcedBook } from '../lib/bookRef';
import { type BatchIsbnSource, type BookSourceProvider } from '../ports/bookSource';
import {
  type ImportCandidate,
  type ImportLookup,
  type ImportLookupSession,
} from '../ports/importLookup';

/**
 * Import-lookup strategy for Open Library: resolves the whole file in a few batched ISBN requests up
 * front, then answers per-row from the result. Always available (no key, no quota) and never defers.
 * Both ISBN variants a row carries go into the one batch so an edition indexed under only one of
 * them still resolves; resolution is keyed by each row's canonical ISBN.
 */
export class OpenLibraryImportLookup implements ImportLookup {
  readonly source: BookSource;

  constructor(private readonly openLibrary: BatchIsbnSource & BookSourceProvider) {
    this.source = openLibrary.source;
  }

  available(): boolean {
    return true;
  }

  describe(): ImportSource {
    return { id: this.source, label: 'Open Library', metered: false, usage: null };
  }

  async begin(rows: ImportCandidate[]): Promise<ImportLookupSession> {
    const candidates = _(rows)
      .flatMap((row) => [row.isbn, row.isbnAlt])
      .compact()
      .uniq()
      .value();
    const known = candidates.length > 0 ? await this.openLibrary.getByIsbns(candidates) : new Map();

    // Map back to each row's canonical ISBN; the first variant that resolved wins.
    const byCanonicalIsbn = new Map<string, SourcedBook>();
    for (const row of rows) {
      if (!row.isbn || byCanonicalIsbn.has(row.isbn)) continue;
      const hit = known.get(row.isbn) ?? (row.isbnAlt ? known.get(row.isbnAlt) : undefined);
      if (hit) byCanonicalIsbn.set(row.isbn, hit);
    }

    return {
      resolve: async (row) => ({
        status: 'resolved',
        book: row.isbn ? (byCanonicalIsbn.get(row.isbn) ?? null) : null,
      }),
    };
  }
}
