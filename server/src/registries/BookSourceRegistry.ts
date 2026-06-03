import createError from 'http-errors';
import { type BookSource, type ImportSource } from '@livre/types';
import {
  type BookSourceProvider,
  type ConfigurableSource,
  type SearchableBookSource,
} from '../ports/bookSource';
import { type ImportLookup } from '../ports/importLookup';

const isSearchable = (s: BookSourceProvider): s is SearchableBookSource =>
  'search' in s && 'searchByAuthor' in s;
const isConfigurable = (s: BookSourceProvider): s is BookSourceProvider & ConfigurableSource =>
  'validate' in s && 'isConfigured' in s;

/**
 * Owns the app's registered book sources and derives the collections each consumer needs, so no
 * consumer hand-assembles them or branches on a concrete source. Sources are registered as a flat
 * list (the registry sorts them by capability) and import-lookups as another; each already carries
 * its {@link BookSource}, so nothing is keyed by hand. Config-aware: the active search source is
 * chosen at call time from current configuration (a configured source wins, otherwise the keyless
 * default), so setting an API key takes effect without re-wiring.
 */
export class BookSourceRegistry {
  private readonly byId: Map<BookSource, BookSourceProvider>;
  private readonly lookups: Map<BookSource, ImportLookup>;

  constructor(
    private readonly sources: BookSourceProvider[],
    importLookups: ImportLookup[]
  ) {
    this.byId = new Map(sources.map((s) => [s.source, s]));
    this.lookups = new Map(importLookups.map((l) => [l.source, l]));
  }

  /** Resolve a source's by-id provider, or null when nothing is registered for it. */
  providerFor(source: BookSource): BookSourceProvider | null {
    return this.byId.get(source) ?? null;
  }

  /**
   * The searchable source backing the discovery screens. Prefers a configured source (Google Books
   * with a key) over the keyless default (Open Library); 503s only if nothing searchable is
   * available, which can't happen while a keyless searchable source is registered.
   */
  searchSource(): SearchableBookSource {
    const available = this.sources
      .filter(isSearchable)
      .filter((s) => !isConfigurable(s) || s.isConfigured());
    // Pick the first available source configured with an API key, falling back to the keyless default
    const chosen = available.find(isConfigurable) ?? available[0];
    if (!chosen) throw createError(503, 'No search source is available');
    return chosen;
  }

  /** Sources carrying per-instance configuration (an API key), keyed for the config router. */
  configurableSources(): Map<BookSource, ConfigurableSource> {
    const out = new Map<BookSource, ConfigurableSource>();
    for (const s of this.sources) if (isConfigurable(s)) out.set(s.source, s);
    return out;
  }

  /** The import-lookup strategy for a source, or null when the source can't enrich imports. */
  lookupFor(source: BookSource): ImportLookup | null {
    return this.lookups.get(source) ?? null;
  }

  /** Import sources offered to the import view — only those usable right now. */
  importSources(): ImportSource[] {
    return [...this.lookups.values()].filter((l) => l.available()).map((l) => l.describe());
  }
}
