import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
import { OpenLibraryAdapter } from '../adapters/OpenLibraryAdapter';
import { type SourcedBook, type SourcedBookSearchResponse } from '../lib/bookRef';
import { type DemoFixture } from '../lib/demoFixture';
import { DEMO_FACTS, type DemoFact } from './demo-facts';

/**
 * Offline fixture builder for the demo library. Resolves every title in `demo-facts.ts` against a
 * real book source (Google Books when GOOGLE_BOOKS_API_KEY is set, otherwise the keyless Open
 * Library) to capture cover + description + genre, then merges the authored facts on top and writes
 * `demoLibrary.generated.ts`. The runtime never calls a source — it reads the committed snapshot —
 * so this only runs when (re)curating the demo set.
 *
 *   GOOGLE_BOOKS_API_KEY=… npm run build:demo-fixture -w server
 */

interface Resolver {
  readonly label: string;
  query(fact: DemoFact): string;
  search(query: string): Promise<SourcedBookSearchResponse>;
  getById(externalId: string): Promise<SourcedBook>;
}

// Covers narrower than this read as blurry once scaled up to the grid/detail art, so flag them.
const MIN_COVER_WIDTH = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildResolver = (): Resolver => {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) {
    const client = new GoogleBooksClient(key);
    return {
      label: 'Google Books',
      // Google honours field qualifiers; an authored `query` overrides for disambiguation.
      query: (fact) => fact.query ?? `intitle:"${fact.title}" inauthor:"${fact.authors[0]}"`,
      search: (q) => client.search(q, 'anything', { maxResults: 5 }),
      getById: (id) => client.getById(id),
    };
  }
  const ol = new OpenLibraryAdapter();
  return {
    label: 'Open Library (no key — set GOOGLE_BOOKS_API_KEY for Google Books)',
    // Open Library takes plain free text, not Google's intitle/inauthor syntax.
    query: (fact) => `${fact.title} ${fact.authors[0]}`,
    search: (q) => ol.search(q),
    getById: (id) => ol.getById(id),
  };
};

// Read the pixel width of a remote JPEG/PNG without a decode dependency, so we can hold the demo to
// high-resolution covers only. Returns 0 when it can't be determined (treated as a flag-worthy miss).
const coverWidth = async (url: string | undefined): Promise<number> => {
  if (!url) return 0;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return 0;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 24 && buf.toString('ascii', 12, 16) === 'IHDR') return buf.readUInt32BE(16);
    for (let i = 2; i + 9 < buf.length; ) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return buf.readUInt16BE(i + 7);
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return 0;
  } catch {
    return 0;
  }
};

// The source supplies the metadata a reader can't (cover, description, genre, page count); the
// authored facts win on the fields a reader owns (title, attribution, tags) so attribution stays
// clean and tags read as shelves rather than the source's noisy subject list.
const merge = (fact: DemoFact, full: SourcedBook): DemoFixture[number] => {
  const { source, externalId, ...metadata } = full;
  return {
    source,
    externalId,
    addedDate: fact.addedDate,
    ...(fact.rating !== undefined ? { rating: fact.rating } : {}),
    ...(fact.review !== undefined ? { review: fact.review } : {}),
    metadata: { ...metadata, title: fact.title, authors: fact.authors, tags: fact.tags },
    events: fact.events,
  };
};

const main = async (): Promise<void> => {
  const resolver = buildResolver();
  console.log(`Resolving ${DEMO_FACTS.length} titles via ${resolver.label}…`);

  const fixture: DemoFixture = [];
  const missing: string[] = [];
  const lowRes: string[] = [];

  // Walk the top relevance-ordered editions and take the first whose cover clears the resolution
  // bar; if none do, keep the widest seen so we still ship the best available (flagged for curation).
  const resolveBest = async (
    fact: DemoFact
  ): Promise<{ full: SourcedBook; width: number } | null> => {
    const { results } = await resolver.search(resolver.query(fact));
    let best: { full: SourcedBook; width: number } | null = null;
    for (const hit of results.slice(0, 6)) {
      const full = await resolver.getById(hit.externalId);
      const width = await coverWidth(full.largeThumbnail ?? full.thumbnail);
      if (width >= MIN_COVER_WIDTH) return { full, width };
      if (!best || width > best.width) best = { full, width };
      await sleep(150);
    }
    return best;
  };

  for (const fact of DEMO_FACTS) {
    try {
      const picked = await resolveBest(fact);
      if (!picked) {
        missing.push(fact.title);
        console.warn(`  ✗ no match: ${fact.title}`);
        continue;
      }
      if (picked.width < MIN_COVER_WIDTH) {
        lowRes.push(`${fact.title} (${picked.width || 'no'}px)`);
        console.warn(`  ⚠ low-res cover: ${fact.title} (${picked.width || 'none'}px)`);
      } else {
        console.log(`  ✓ ${fact.title} (${picked.width}px)`);
      }
      fixture.push(merge(fact, picked.full));
    } catch (err) {
      missing.push(fact.title);
      console.warn(`  ✗ failed: ${fact.title} (${err instanceof Error ? err.message : err})`);
    }
    await sleep(250);
  }

  const body = `// AUTO-GENERATED by \`npm run build:demo-fixture -w server\`. Do not edit by hand.
// Offline snapshot of the demo library: metadata + cover URLs resolved from a real book source,
// merged with the authored facts in \`demo-facts.ts\`. Parsed at runtime by DemoService.
import { type DemoFixture } from '../lib/demoFixture';

export const DEMO_LIBRARY: DemoFixture = ${JSON.stringify(fixture, null, 2)};
`;

  writeFileSync(join(__dirname, 'demoLibrary.generated.ts'), body);
  console.log(`\nWrote ${fixture.length} books to demoLibrary.generated.ts.`);
  if (lowRes.length > 0) {
    console.log(
      `Low-res covers (${lowRes.length}) — consider a different edition: ${lowRes.join(', ')}`
    );
  }
  if (missing.length > 0) {
    console.log(`Unresolved (${missing.length}): ${missing.join(', ')}`);
    process.exitCode = 1;
  }
};

void main();
