# Livre — Claude Code Guidelines

## Project overview

Livre is an open-source, self-hosted reading tracker. Three tenets: **Privacy, Openness, Simplicity**. Self-hosted by design, no accounts, no cloud.

## Design ground truth

**If a prototype exists under `prototypes/` for the screen or component you're touching, it is the design ground truth — always.** Open the relevant prototype file and reference it directly before any design work: typography sizes, weights, line-heights, colors, spacing, radii, layout, hover states, transitions, edge cases. Compare side-by-side and match. Don't approximate from memory or from the running app — both will drift.

This is non-negotiable. Prototypes encode deliberate decisions the working code may not have caught up to yet. Skipping the comparison leads to slow drift back to defaults and erodes everything the prototype was meant to fix. When in doubt, the prototype wins — propose a change to it before deviating in the working code.

## Tech stack

- **Frontend**: React 19, Vite 5, TypeScript, styled-components v6
- **Backend**: Node.js (Express), TypeScript via `tsx` in dev / `tsc` in prod
- **Database**: SQLite via `better-sqlite3` — requires **Node 20 LTS** (incompatible with Node 26+)
- **Monorepo**: npm workspaces — `client`, `server`, `shared`, `fe-libs/*`
- **UI primitives**: Radix UI (installed in `@livre/primitives`)
- **Shared types**: `@livre/types` (`shared/`) — Zod schemas and inferred TypeScript types consumed by both client and server

## Package hierarchy

```
@livre/ui         ← theme tokens, DefaultTheme, LivreThemeProvider, GlobalStyle
    ↓
@livre/primitives ← reusable components (Text, BookCard, StarRating, etc.)
    ↓
client            ← app screens and components
```

- `DefaultTheme` is declared **exactly once**: `fe-libs/ui/src/styled.d.ts`. Never declare it anywhere else.
- Never import theme types or tokens directly in `client` — use `@livre/ui` exports.

## styled-components rules

Always use **object syntax**:

```ts
// correct
const Box = styled('div')(({ theme }) => ({
  color: theme.text,
}));

// never
const Box = styled.div`
  color: ${({ theme }) => theme.text};
`;
```

Transient props must use the `$` prefix to prevent DOM forwarding:

```ts
styled('div')<{ $active: boolean }>(({ $active }) => ({ ... }))
```

**Never use color literals** in styled components. Always read from theme tokens:

```ts
// correct
color: theme.textMuted;

// never
color: '#6B6860';
```

## Typography rules

**Never reference `fontFamily`, `fontWeight`, or `fontSize` in any component or styles file.** All typography goes through `<Text>` from `@livre/primitives`.

**Bounded exception — `font: inherit` in contenteditable:** Contenteditable elements can't receive font via `<Text>` children because React's reconciler conflicts with direct DOM mutation via `innerHTML`. Wrap the contenteditable in `<Text variant="..." as="div">` and set `font: inherit` on the inner element so it picks up the font from the wrapper. Selector-based typography on the same element (drop caps via `::first-letter`, inter-paragraph spacing via `& > p + p`) is also permitted when CSS pseudo-elements are the only viable approach. Do not generalize either exception.

```tsx
// correct
<Text variant="h3">Blood Meridian</Text>
<Text variant="label" color="accent">Currently Reading</Text>
<Text variant="ui-sm" color="muted">{author}</Text>

// never
const Title = styled('p')(({ theme }) => ({ fontFamily: theme.fontDisplay, fontSize: '1.5rem' }))
```

### Text variants

| Variant                                        | Font                             | Size                 |
| ---------------------------------------------- | -------------------------------- | -------------------- |
| `h1`–`h6`                                      | Cormorant Garamond, italic       | 3rem → 1rem          |
| `body1`, `body2`                               | Lora                             | 1.0625rem, 0.9375rem |
| `ui-lg`, `ui-md`, `ui-sm`, `ui-tight`, `ui-xs` | Outfit                           | 1rem → 0.6875rem     |
| `label`                                        | Outfit, bold, uppercase, tracked | 0.6875rem            |
| `meta`                                         | Outfit, uppercase, tracked       | 0.6875rem            |

### Text colors

`default` · `muted` · `accent` · `success` · `onColor` · `onColorMuted`

Use `as` to override the rendered element without changing styles:

```tsx
<Text variant="h3" as="h2">{title}</Text>   // h3 visual, h2 semantics
<Text variant="h2" as="span">livre</Text>    // wordmark
```

## Primitives rules

**Never import from `@radix-ui` directly outside `@livre/primitives`.** If a Radix component is needed in `client/`, add a styled wrapper to `@livre/primitives` first and import that.

Primitives follow one of two composition patterns depending on their structure:

**Composed component** — for primitives with a clear "entry point" element. The component manages portal, trigger, and layout internally. Sub-components attached via `Object.assign`:

```tsx
// correct usage
<DropdownMenu trigger={<button />} align="end">
  <DropdownMenu.Item onSelect={logout}>Sign out</DropdownMenu.Item>
  <DropdownMenu.Separator />
</DropdownMenu>
```

Use this for: `DropdownMenu`, `Dialog`, `Tooltip`.

**Namespace object** — for primitives whose pieces must be coordinated by the caller (state container + multiple children). Export as a plain object:

```tsx
// correct usage
<Tabs.Root defaultValue="read">
  <Tabs.List>
    <Tabs.Trigger value="read">Read</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="read">…</Tabs.Content>
</Tabs.Root>
```

Use this for: `Tabs`, `Form`.

**Never wrap `<Text>` with `styled()`** — styled-components v6 injects the wrapper's CSS class after `Text`'s own class. Same-specificity rules mean the wrapper wins on conflicts, silently breaking font styles. Use a wrapper element instead:

```tsx
// correct
const Wordmark = styled('span')({ cursor: 'pointer' });
<Wordmark>
  <Text variant="h2">…</Text>
</Wordmark>;

// never
const StyledText = styled(Text)({ cursor: 'pointer' });
```

## Z-index ladder

Use these fixed values consistently — never pick ad-hoc numbers:

| Layer                             | Value |
| --------------------------------- | ----- |
| TopBar (sticky header)            | `100` |
| Floating UI (dropdowns, tooltips) | `200` |
| Dialog overlay                    | `200` |
| Dialog content                    | `201` |

## File structure conventions

- Component styles live in a `.styles.tsx` sibling: `Button/Button.tsx` + `Button/Button.styles.tsx`
- **No per-component barrel files** (`Button/index.ts` etc.) — they clutter the tree
- Directory-level barrels are fine: `components/index.ts`, `screens/index.ts`
- All package exports live in the package-level `src/index.ts`
- Screens (`client/src/screens/`) and components (`client/src/components/`) are separate directories

## Component conventions

- Const-based functional components only — no class components
- Named exports only — no `export default` anywhere:
  ```ts
  export const BookCard = (props: BookCardProps) => { ... };
  export type { BookCardProps };
  ```
- No prop destructuring in the type definition — keep interface and destructuring separate

## Spacing

Use `theme.spacing(n)` for all padding, margin, gap, and fixed-size dimensions. The scale is `n × 0.25rem` (4px base):

```ts
// correct
padding: theme.spacing(4),               // 1rem
gap: `${theme.spacing(7)} ${theme.spacing(5)}`,  // 1.75rem 1.25rem
width: theme.spacing(9),                 // 2.25rem (36px)

// never
padding: '1rem'
gap: '1.75rem 1.25rem'
```

Common values: `spacing(1)` = 4px · `spacing(2)` = 8px · `spacing(4)` = 16px · `spacing(6)` = 24px · `spacing(9)` = 36px

**Exception**: leave sub-4px values (1px, 2px, 3px) and oddball legacy sizes (5px, 7px) as raw literals — they don't map cleanly to the grid. Typography values (`fontSize`, `lineHeight`, `letterSpacing`) are never spacing — those are owned by `<Text>`.

## Inline editing pattern

Editable fields extract all state and event handlers into a `use*Edit` hook that lives alongside the screen (e.g. `useDescriptionEdit.ts`, `useCoverEdit.ts`). The view receives only the hook's return value and wires it to JSX — it never owns editing state directly.

`useContentEditable` (`client/src/hooks/`) is the shared primitive for contenteditable fields: focus tracking, debounced save (3.5s default), and Escape-to-revert. Field-specific hooks call it and add any DOM initialisation logic (e.g. a `useLayoutEffect` to set `innerHTML` from props without triggering React reconciliation). DOM init must live in the field hook, not in the view.

## Theming

Themes are named in French — `roman-light`, `roman-dark` (roman = French for novel).

To add a theme: add an entry to the registry in `fe-libs/ui/src/themes/index.ts`. `ThemeName` is derived automatically via `keyof typeof themes`.

## Comments

Default to **no comments**. Only add one when the WHY is non-obvious — a hidden constraint, a workaround, a subtle invariant. Never comment what the code does; well-named identifiers do that. Inline comments are one short line maximum.

### Component JSDoc

Every component gets a JSDoc block. Keep it declarative: explain the component's purpose, intended usage context, and any constraints on how it should be used. Explain the WHY behind design decisions — not the HOW, which the code already shows. No `@param` or `@returns` tags; the TypeScript interface documents props. 2–4 sentences.

```tsx
// imports, types, constants...

/**
 * Filters the book grid by shelf status. Purely presentational — active state and counts come
 * from the parent so this component stays in sync with the data layer without owning any state
 * itself.
 */
export const ShelfTabs = ...
```

## Backend architecture

### Layered structure

```
routes/       ← thin HTTP layer; validates input/output shapes, delegates to services
services/     ← business logic; no HTTP concerns, no SQL
ports/        ← domain-owned interfaces (the contracts consumers depend on)
adapters/     ← translate a foreign API into our domain types; implement ports
strategies/   ← per-source implementations of a port, composed from adapters (not a foreign API)
registries/   ← own a collection keyed by id and resolve it; no lifecycle, no foreign API
providers/    ← lifecycle management of a collaborator (lazy init, caching, invalidation)
stores/       ← stateful accumulators persisted via a repository (not lifecycle)
clients/      ← external HTTP adapters; one class per external API
repositories/ ← all database access; Zod validation at the DB boundary
```

Never let concerns bleed across layers — routes don't touch the DB, services don't know about `req`/`res`, services never import other services (use ports, registries, providers, stores, or repositories instead).

**`clients/`** are pure HTTP adapters. They take config in their constructor, own the wire-format schema (private — never exported), and return types from `@livre/types`. If the external API changes, only the client changes.

#### Ports & Adapters (anti-corruption boundary)

**`adapters/`** wrap a `client` and translate its foreign API into our domain types (e.g. `GoogleBooksAdapter`, `OpenLibraryAdapter` → `SourcedBook`). An adapter implements one or more **ports**.

**`ports/`** are the domain-owned interfaces consumers depend on (`BookSourceProvider`, `SearchableBookSource`, `ConfigurableSource`, `BatchIsbnSource`, `ImportLookup`). Conformance is enforced on **consumers, not classes**: every consumer types its dep as the **narrowest port** it actually uses (intersect ports when it needs more than one), never a concrete adapter. Segregate ports so every public method of an adapter belongs to some consumed port. The composition root (`index.ts`) is the **only** place that names concrete adapter classes.

These ports are **orthogonal axes**, not a hierarchy — a source occupies whichever combination fits. Open Library is `SearchableBookSource` **and** `BatchIsbnSource` but **not** `ConfigurableSource` (no API key); Google Books is all three. Don't merge two ports because one class happens to implement both; the keyless searchable source is the standing counterexample.

```ts
// correct — consumer depends on a segregated port (or an intersection)
constructor(private readonly googleBooks: SearchableBookSource & ConfigurableSource) {}

// never — consumer names the concrete adapter
import { GoogleBooksAdapter } from '../adapters/GoogleBooksAdapter';
```

Singleton stores and repositories (one impl, not swappable) may be consumed as concrete `type` imports — the ports-only rule is scoped to swappable external **sources/adapters**.

Per-source instance settings live in the `config` table keyed by `(source, key)` (see `ConfigRepository`), so source-specific configuration goes through the same `ConfigurableSource` port rather than forcing a consumer to name a concrete adapter. The config router is handed the `Map<BookSource, ConfigurableSource>` produced by `BookSourceRegistry.configurableSources()`, resolving the client-facing kebab `:source` param against it — adding a configurable source is registration-only.

#### Strategies & registries

**`strategies/`** hold per-source implementations of a port that are composed from adapters (and stores) rather than from a foreign API — so they are **not** adapters. `OpenLibraryImportLookup` / `GoogleBooksImportLookup` implement the `ImportLookup` port: each owns its source's import mechanism (Open Library batches by ISBN up front; Google Books looks up per-row, is metered, and defers when out of budget) behind one uniform contract, so `LibraryTransferService` never branches on the source.

**`registries/`** own a collection keyed by id and resolve it for consumers; they manage **no lifecycle** (so they're not providers) and translate **no foreign API** (so they're not adapters). `BookSourceRegistry` derives the by-id provider map, the active searchable source (a configured `ConfigurableSource` wins, else the keyless default), the configurable-sources map, and the import-lookup per source. `FormatRegistry` does the same for `LibraryFormat`s. A service that needs "the X for id Y" asks a registry instead of hand-keying a `Map` — if you see `new Map(items.map((i) => [i.id, i]))` inside a service, it wants a registry.

#### Provider vs store vs adapter vs registry

"Provider" is reserved **strictly for lifecycle** — lazy init from config, caching an instance, invalidating it on config change (e.g. `BookCacheProvider`). A stateful counter/accumulator persisted through a repository is a **store** (e.g. `GoogleBooksUsageStore`), not a provider. A wrapper that only translates a foreign API is an **adapter**, not a provider. A collection-owner that resolves entries by id is a **registry**, not a provider — even when it reads config to choose (that's config-_awareness_, not lifecycle). Don't file something under `providers/` unless it manages a lifecycle.

```ts
// correct — service calls a port / store, never a client directly
async search(query: string) { return this.searchSource.search(query); }

// never — service instantiates or imports a client
import { GoogleBooksClient } from '../clients/GoogleBooksClient';
```

### Dependency injection

Classes receive dependencies via constructor; nothing self-instantiates. `server/src/index.ts` is the **composition root** — the only place the dependency graph is wired:

```ts
const usersRepository = new UsersRepository();
const authService = new AuthService(usersRepository);
app.use('/api/auth', createAuthRouter(authService));
```

Route files export factory functions (`createAuthRouter(service)`) rather than pre-built routers.

### File naming

Class files in `server/` use **PascalCase matching the exported class**: `UsersRepository.ts`, `AuthService.ts`, `SchemaRouter.ts`. All other server files are lowercase (`route.ts`, `env.ts`, `index.ts`).

### Schema placement

Shared **wire contracts** — anything that crosses the client/server boundary or is consumed by more than one module — live in `shared/src/schemas` (`@livre/types`). A schema that is **private to one module** (a client's wire-format shape, a parser's row shape, a store's persisted record) stays in that module, unexported. Examples that are correct in-module: `googleVolumeSchema`/`olEntrySchema` (client wire shapes), `csvRecordsSchema` (parser), `usageRecordSchema` (store), `ddlRowSchema`. Don't promote a private schema to `shared/` until a second consumer actually needs it.

### better-sqlite3 prepared statements

Prepare statements once at class construction time — never inside a method. Group them into a private `query` / `mutation` object:

```ts
private readonly query = {
  findByName: db.prepare('SELECT ...'),
};
private readonly mutation = (() => {
  const insert = db.prepare('INSERT ...');   // closure-scoped, not exposed
  return {
    create: db.transaction((data) => { ... insert.run(...) ... }),
  };
})();
```

## Book data model

The data model splits _transient API cache_ from _user-owned library records_ and keeps both **provider-agnostic** so a future source (Open Library, manual entry, …) drops in without migrations.

### Three tables

```
book_cache     — shared, transient; (source, external_id) unique; cache_expires_at; no FKs
library_books  — per-user, permanent; owns its metadata snapshot; FK target for reading_log
reading_log    — per-library_book events; FK → library_books.id
```

**`book_cache`** holds metadata fetched from an external source (Google Books, etc.). Rows expire and are swept at startup via `BookCacheProvider.sweep()`. Nothing in the schema references this table — it is purely a read-through cache for the API path.

**`library_books`** is the user's record of a book. It owns a _copy_ of the metadata at the moment of save. This is intentional:

- Users can edit their copy (title, description, cover) without affecting anyone else.
- Library rendering never depends on a cache hit or even on the original source still being reachable.
- Two users saving the same book = two independent rows.

There is **no shared `books` table**. Do not add one.

### Provider-agnostic provenance

Both `book_cache` and `library_books` carry `source` + `external_id` instead of any provider-specific column. Adding a new source = append to the `BookSource` enum in `@livre/types/schemas/books.ts` and the matching SQL `CHECK` constraint. Never persist a `google_books_id` (or any other provider-specific id) as a named column.

On `library_books`, both `source` and `external_id` are **nullable** to support future manual entries. The partial unique index `idx_library_books_source` only enforces dedup when both are present.

### `bookRef` — the client never sees a source _for book identity_

The client is **deliberately blind** to which provider a book came from. URLs, query keys, dedup maps, and localStorage all reference books by an opaque string `bookRef` — never by `source` / `externalId`. This blindness is about **book identity**. Where the user _explicitly chooses_ a source — import enrichment, per-source config — the client legitimately names it: those features use the shared `BookSource` enum directly (`EnrichmentOption.id`, the `/config/sources/:source/*` param). There is **one** source enum (`bookSourceSchema`); don't introduce a parallel client-facing copy.

- **Encoding lives server-only** in `server/src/lib/bookRef.ts`. `encodeBookRef(source, externalId)` returns a base64url string; `decodeBookRef(ref)` reverses it and validates the source against `bookSourceSchema`.
- **Wire shapes** (`BookVolume`, `ShelfEntry`) carry `bookRef` instead of `source` / `externalId` — book identity never leaks a source. (Source-selection features above are the bounded exception.)
- **Server-internal flow** still works in `(source, externalId)` tuples. The route layer decodes `:bookRef` from URL params before calling services; services and repos convert to client-facing `BookVolume` at the API boundary via `toBookVolume(SourcedBook)`.
- **`SourcedBook`** (`server/src/lib/bookRef.ts`) is the server-internal book shape: `BookMetadata & { source, externalId }`. The Google Books client, cache repository, and cache provider all traffic in `SourcedBook`. Never expose it across the API.
- **Client URLs**: `/search/book/:bookRef` for discovery, `/library/:libraryBookId` for library detail. Dedup against the library uses `entry.bookRef === book.bookRef` (string equality).
- **`bookRef` on `ShelfEntry` is nullable** — manual entries (future) have no upstream source and therefore no ref.

### Naming

- DB primary key on the user's record is `library_books.id`, exposed in API/UI as `libraryBookId` (never `userBookId`).
- The reading log FK column is `library_book_id`.
- Repositories/services follow this naming: `LibraryBooksRepository`, `libraryBookId` params.

### `BookCacheProvider`

`BooksService` never touches `BookCacheRepository` directly. All TTL logic lives in `BookCacheProvider`:

```ts
bookCache.get(source, externalId)         // returns null on miss OR expiry
bookCache.set(source, book, ttlDays?)     // default 7-day TTL
bookCache.sweep()                          // delete all expired rows; called at startup
```

The cache is decoupled from `library_books` — adding a book to a library _copies_ metadata from cache (or the source) into a new `library_books` row. Cache eviction is therefore always safe; it never leaves library data dangling.

### Shared Zod composition

`@livre/types/schemas/books.ts` exposes a `bookMetadataSchema` that both `book_cache` and `library_books` shapes compose. Always extend this when adding new metadata fields — never duplicate the field list.

## Type safety

Never use `as` casts or `!` non-null assertions. Use Zod `.parse()` to narrow unknown values:

```ts
// correct
const user = userSchema.parse(jwt.verify(token, secret));

// never
const user = jwt.verify(token, secret) as User;
```

Environment variables are validated at startup in `server/src/env.ts` and exported as a typed `env` object — never read `process.env` directly elsewhere.

## Node version

Use **Node 20 LTS** (`nvm use 20`). `better-sqlite3` uses native V8 APIs removed in Node 26 and will fail to build there.
