import createError from 'http-errors';
import { type BookSource, type ImportSource } from '@livre/types';
import {
  type BookSourceProvider,
  type ConfigurableSource,
  type MeteredSource,
  type SearchableBookSource,
} from '../ports/bookSource';
import { type ImportLookup } from '../ports/importLookup';
import { type ConfigRepository } from '../repositories/ConfigRepository';

const isSearchable = (s: BookSourceProvider): s is SearchableBookSource =>
  'search' in s && 'searchByAuthor' in s;
const isConfigurable = (s: BookSourceProvider): s is BookSourceProvider & ConfigurableSource =>
  'validate' in s && 'isConfigured' in s;
const isMetered = (s: BookSourceProvider): s is BookSourceProvider & MeteredSource =>
  'hasBudget' in s;

/**
 * Owns the app's registered book sources and derives the collections each consumer needs, so no
 * consumer hand-assembles them or branches on a concrete source. Sources are registered as a flat
 * list (the registry sorts them by capability) and import-lookups as another; each already carries
 * its {@link BookSource}, so nothing is keyed by hand. Config-aware: the live search source is
 * chosen at call time as the highest-priority source that can serve a request right now — the
 * admin-pinned preference first, else a configured source, else the keyless default, skipping a
 * metered source that's out of its daily budget. So setting an API key, a preference, or exhausting
 * a quota all take effect without re-wiring.
 */
export class BookSourceRegistry {
  private readonly byId: Map<BookSource, BookSourceProvider>;
  private readonly lookups: Map<BookSource, ImportLookup>;

  constructor(
    private readonly sources: BookSourceProvider[],
    importLookups: ImportLookup[],
    private readonly config: ConfigRepository
  ) {
    this.byId = new Map(sources.map((s) => [s.source, s]));
    this.lookups = new Map(importLookups.map((l) => [l.source, l]));
  }

  /** Resolve a source's by-id provider, or null when nothing is registered for it. */
  providerFor(source: BookSource): BookSourceProvider | null {
    return this.byId.get(source) ?? null;
  }

  /** Searchable sources that are configured (keyless ones always), regardless of today's budget. */
  private availableSearchSources(): SearchableBookSource[] {
    return this.sources.filter(isSearchable).filter((s) => !isConfigurable(s) || s.isConfigured());
  }

  /**
   * The configured searchable sources in priority order: by stored rank where set, otherwise
   * configured keyed sources ahead of the keyless default. Budget isn't considered here — this is
   * the standing order; {@link searchSource} applies the runtime budget skip on top.
   */
  private orderedSearchSources(): SearchableBookSource[] {
    const priorities = this.config.getPriorities();
    // Unranked sources sort after ranked ones; among the unranked, configured keyed before keyless.
    const rank = (s: SearchableBookSource) =>
      priorities.get(s.source) ?? this.byId.size + (isConfigurable(s) ? 0 : 1);
    return [...this.availableSearchSources()].sort((a, b) => rank(a) - rank(b));
  }

  /** The current search priority order, as source ids, with `source` moved to the front. */
  searchOrderPreferring(source: BookSource): BookSource[] {
    const rest = this.orderedSearchSources()
      .map((s) => s.source)
      .filter((id) => id !== source);
    return [source, ...rest];
  }

  /**
   * The searchable source backing the discovery screens right now: the highest-priority source that
   * can serve a request, skipping a metered source that's out of its daily budget so it falls back
   * to an unmetered one. Falls back to the top-priority source if somehow none have budget (an
   * unmetered source always does). 503s only if nothing searchable is configured, which can't happen
   * while a keyless searchable source is registered.
   */
  searchSource(): SearchableBookSource {
    const ordered = this.orderedSearchSources();
    const chosen = ordered.find((s) => !isMetered(s) || s.hasBudget()) ?? ordered[0];
    if (!chosen) throw createError(503, 'No search source is available');
    return chosen;
  }

  /**
   * The admin's standing source preference (top of the priority order), independent of today's
   * budget — so the settings picker shows what was chosen even when that source is momentarily
   * exhausted and {@link searchSource} is falling back.
   */
  preferredSearchSource(): BookSource {
    const top = this.orderedSearchSources()[0];
    if (!top) throw createError(503, 'No search source is available');
    return top.source;
  }

  /** Whether a source can be pinned as preferred right now (registered, searchable, configured). */
  isSelectableSource(source: BookSource): boolean {
    return this.availableSearchSources().some((s) => s.source === source);
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
