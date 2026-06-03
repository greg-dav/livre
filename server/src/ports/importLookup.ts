import { type BookSource, type ImportSource } from '@livre/types';
import { type SourcedBook } from '../lib/bookRef';

/**
 * The minimal book identity an import row exposes to a lookup: enough to resolve metadata without
 * coupling the port to the formats layer's full `ImportRow`. An `ImportRow` is structurally
 * assignable to this.
 */
export interface ImportCandidate {
  title: string;
  authors: string[];
  isbn?: string;
  isbnAlt?: string;
}

/**
 * Outcome of resolving one import row. `resolved` carries the enriched book or `null` when the
 * source had no match (the row is still imported, unenriched); `deferred` means the source can't
 * resolve it right now (a metered source out of budget) and the row should be left for a re-run.
 */
export type ImportLookupOutcome =
  | { status: 'resolved'; book: SourcedBook | null }
  | { status: 'deferred' };

/**
 * A single import's resolution session. Created by {@link ImportLookup.begin} so a batch source can
 * pre-resolve the whole file up front; the service then queries one row at a time, in row order, so
 * a per-row metered source can meter and defer accurately.
 */
export interface ImportLookupSession {
  resolve(row: ImportCandidate): Promise<ImportLookupOutcome>;
}

/**
 * Source-obfuscating strategy for import enrichment. Hides whether a source batches by ISBN up front
 * or looks rows up one at a time, whether it's metered, and how it defers — so LibraryTransferService
 * depends only on "the lookup for the chosen source", never a concrete adapter or usage store. The
 * registry resolves one of these per {@link BookSource}.
 */
export interface ImportLookup {
  readonly source: BookSource;
  /** Whether this source can be used for import right now (e.g. a metered source needs a key). */
  available(): boolean;
  /** Descriptor for the import view — label, metering, and today's usage. */
  describe(): ImportSource;
  begin(rows: ImportCandidate[]): Promise<ImportLookupSession>;
}
