# Livre — Claude Code Guidelines

## Project overview

Livre is an open-source, self-hosted reading tracker. Three tenets: **Privacy, Openness, Simplicity**. Self-hosted by design, no accounts, no cloud.

## Design ground truth

**If a prototype exists under `prototypes/` for the screen or component you're touching, it is the design ground truth — always.** Open the relevant prototype file and reference it directly before any design work: typography sizes, weights, line-heights, colors, spacing, radii, layout, hover states, transitions, edge cases. Compare side-by-side and match. Don't approximate from memory or from the running app — both will drift.

This is non-negotiable. Prototypes encode deliberate decisions the working code may not have caught up to yet. Skipping the comparison leads to slow drift back to defaults and erodes everything the prototype was meant to fix. When in doubt, the prototype wins — propose a change to it before deviating in the working code.

## Tech stack

- **Frontend**: React 19, Vite 5, TypeScript, styled-components v6
- **Backend**: Node.js (Express), TypeScript via `tsx` in dev / `tsc` in prod
- **API contracts**: ts-rest (`@ts-rest/core`, `@ts-rest/express`) — one Zod contract per domain types both the Express handlers and the client. Pinned to `3.53.0-rc.1` (the only line with Zod 4 support, via Standard Schema); the durable asset is our own Zod schemas, so the runtime is a swappable bet.
- **Database**: SQLite via `better-sqlite3` — requires **Node 20 LTS** (incompatible with Node 26+)
- **ORM**: Drizzle ORM — all repository data access goes through its query builder
- **Monorepo**: npm workspaces — `client`, `server`, `shared`, `fe-libs/*`
- **UI primitives**: Radix UI (installed in `@livre/primitives`)
- **Shared types**: `@livre/types` (`shared/`) — the **domain model** (`shared/src/domain/`) plus the **API contracts** (`shared/src/contracts/`), consumed by both client and server

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
routes/       ← thin ts-rest handlers; parse/validation handled by the contract, delegate to services
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

#### Route layer (ts-rest contracts)

Routes are **ts-rest contract handlers**, not hand-rolled Express. A contract (`shared/src/contracts/<domain>.ts`) declares each route's `method`/`path`/`pathParams`/`query`/`body`/`responses` as Zod; ts-rest parses and 400s **before** the handler runs, so handlers only see typed, validated input and return a discriminated `{ status, body }`. Everything route-related lives in `server/src/lib/tsRest.ts`:

- `server.router(contract, { ...handlers })` builds the handlers; `mountContract(contract, router, guard)` mounts them behind an auth guard at the domain prefix. A router that must interleave plain Express (the non-JSON `/library/export` + `/library/import`) builds its own `express.Router()`, registers those routes **first** (matching order), then calls `attachContract`.
- Handlers return through the builders **`ok(body)` / `created(body)` / `notFound(msg)`** — never write `{ status, body }` literals inline.
- Read the authenticated user with **`userOf(req)`** (ts-rest's request type isn't assignable to Express's, so the Express-typed guard helper won't take it). Auth stays Express middleware applied per-router, never per-route: a contract is either fully open (`auth`: `status`/`register`/`login`, mounted via `attachContract` with no guard) or fully guarded (`mountContract` applies `requireAuth` to the whole router). Don't mix authed and unauthed routes in one contract — the signed-in user's record (`me`) lives on the guarded `account` contract precisely so `auth` stays open and homogeneous.
- Validation failures are remapped to our `{ error }` envelope in **one** place (`attachContract`'s `requestValidationErrorHandler`); business errors still `throw createError(404, ...)` and flow through `lib/errorHandler.ts`.
- **Contract paths are relative** (`/username`), mounted at the prefix (`/api/account`) so the guard stays scoped — never use ts-rest `pathPrefix` (it forces a root mount and leaks the guard to every request). ts-rest registers routes in **handler-key order**, so literal paths (`/library/tags`) must precede `/library/:libraryBookId`.
- The client mirrors this: `client/src/lib/api.ts` wraps per-domain `initClient(contract, ...)` and keeps the same public `api.*` surface — never reintroduce hand-written `fetch` + path strings there.

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
const { requireAuth } = createAuthMiddleware(usersRepository);
app.use('/api/auth', createAuthRouter(authService, requireAuth));
```

Route files export factory functions (`createAuthRouter(service, guard)`) rather than pre-built routers; the guard is passed in so the composition root owns auth wiring.

### File naming

Class files in `server/` use **PascalCase matching the exported class**: `UsersRepository.ts`, `AuthService.ts`, `BookCacheProvider.ts`. All other server files are lowercase (`tsRest.ts`, `errorHandler.ts`, `env.ts`, `index.ts`).

### Schema placement (value-locality)

A Zod schema lives **where its value is consumed**. This splits `@livre/types` cleanly:

- **`shared/src/domain/`** — the domain model: entities, value objects, and enums that are composed into other schemas, validated in app code, or used as UI vocabulary (`bookMetadataSchema`, `shelfEntrySchema`, `userSchema`, `shelfStatusSchema`, …). These are reused across layers, so they're exported from the package index.
- **`shared/src/contracts/`** — each route's params, query, **body, and response are defined inline in the contract**, composed from domain schemas. Their _values_ are consumed only by the contract, so they aren't exported; the contract exports just the **inferred DTO types** the app actually uses (`UpdateMetadataBody`, `LibraryBookDetail`, …). Response envelopes shared across more than one contract (`apiError`, `okResponse`, `authResponse`) live in `contracts/_shared.ts`.

When adding a route, put its body/response schema **inline in the contract**, not in `domain/` — promote a shape to `domain/` only when a second module needs its value. A schema **private to one module** (a client's wire-format shape, a parser's row shape, a store's persisted record) still stays in that module, unexported — e.g. `googleVolumeSchema`/`olEntrySchema` (client wire shapes), `csvRecordsSchema` (parser), `usageRecordSchema` (store), `ddlRowSchema`.

### Database access (Drizzle ORM)

All repository data access goes through the **Drizzle query builder** — never hand-written SQL strings, never raw `db.prepare(...)`. Express each query inline in the method that needs it, using `db.select/insert/update/delete` with the table objects from `db/schema` and the `eq`, `and`, `sql` helpers from `drizzle-orm`:

```ts
get(source: BookSource, key: string): string | undefined {
  return db
    .select({ value: config.value })
    .from(config)
    .where(and(eq(config.source, source), eq(config.key, key)))
    .get()?.value;
}
```

Wrap multi-statement mutations that must be atomic in `db.transaction(...)`; pass the transaction handle (`Tx`) down to repository methods that accept an optional `tx` so they enlist in the caller's transaction.

The **one** place raw better-sqlite3 is expected is `db/index.ts`, which uses it directly to bootstrap the schema and run migrations before Drizzle is wired up. Application code never touches better-sqlite3 directly.

### Migrations

There is no migration framework and no schema-version table — `db/index.ts` runs `schema.sql` (all `CREATE TABLE IF NOT EXISTS`) and then a sequence of **idempotent, order-independent** migration steps, each gated on a `pragma_table_info` check that detects whether it has already run.

Adding or changing a column means editing **three** places, or the build and the migration path diverge:

1. `db/schema.sql` — the source of truth the fresh-install path runs.
2. `db/schema.ts` — the Drizzle mirror the query builder types against.
3. `db/index.ts` — an idempotent `ALTER`/rebuild so existing databases pick up the change.

SQLite can't widen a `CHECK` constraint in place, so widening an enum (e.g. adding a `BookSource`) requires a **table rebuild** — copy → drop → rename — with `PRAGMA foreign_keys = OFF` around it so dependent rows survive (row ids are preserved). Follow the existing `library_books`/`reading_log` rebuilds as the pattern. Keep every step safe to run twice.

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

### Core invariants

Two runtime invariants govern the library/log and, if violated, silently corrupt a user's data. Hold them in any code that writes to `library_books` or `reading_log`:

- **Shelf status is derived, never stored.** A book's status (`want`/`reading`/`read`/`dnf`) is computed from its _latest_ reading-log event (`LATEST_STATUS_EVENT_ID` in `LibraryBooksRepository`). Never add a `status` column or cache the value — the log is the single source of truth.
- **A library book must always have ≥1 reading-log event.** Shelf and detail queries inner-join the log, so a book with an empty log disappears from every shelf and from its own detail view. Any path that can empty the log (`resetReadingLog`, a bulk delete, deleting the last entry) must re-seed a `shelved` event **in the same transaction**. Seeding the log to land a book on a chosen shelf (`shelved` head + the terminal `started`/`finished`/`dnf`) is the established pattern — see `LibraryService` and `LibraryTransferService.seedLog`.

### Provider-agnostic provenance

Both `book_cache` and `library_books` carry `source` + `external_id` instead of any provider-specific column. Adding a new source = append to the `BookSource` enum in `@livre/types` (`shared/src/domain/bookRef.ts`) and the matching SQL `CHECK` constraint. Never persist a `google_books_id` (or any other provider-specific id) as a named column.

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

No service touches `BookCacheRepository` directly — `BookLookupProvider` owns the cache-aware by-id fetch (read-through + write-back) that `SearchService` and `LibraryService` share. All TTL logic lives in `BookCacheProvider`:

```ts
bookCache.get(source, externalId)         // returns null on miss OR expiry
bookCache.set(source, book, ttlDays?)     // default 7-day TTL
bookCache.sweep()                          // delete all expired rows; called at startup
```

The cache is decoupled from `library_books` — adding a book to a library _copies_ metadata from cache (or the source) into a new `library_books` row. Cache eviction is therefore always safe; it never leaves library data dangling.

### Shared Zod composition

`@livre/types` (`shared/src/domain/books.ts`) exposes a `bookMetadataSchema` that both `book_cache` and `library_books` shapes compose. Always extend this when adding new metadata fields — never duplicate the field list.

## Type safety

Never use `as` casts or `!` non-null assertions. Use Zod `.parse()` to narrow unknown values:

```ts
// correct
const user = userSchema.parse(jwt.verify(token, secret));

// never
const user = jwt.verify(token, secret) as User;
```

Environment variables are validated at startup in `server/src/env.ts` and exported as a typed `env` object — never read `process.env` directly elsewhere.

## Security baseline

The threat model is a self-hosted instance reachable on a home network or behind a tunnel — not a hardened SaaS, but not trusted-LAN-only either. Hold these:

- **Ownership is checked in app code, not the DB.** There is no row-level scoping in SQLite, so every library/log mutation must verify ownership before writing — `libraryBooksRepo.exists(userId, libraryBookId)` (and `readingLogRepo.belongsToLibraryBook(logId, libraryBookId)` for log rows). A new authed route that touches user data without this check is an IDOR.
- **Revoke sessions on sensitive change.** Any change to a user's password or role must `bumpTokenVersion` so outstanding JWTs stop working immediately (see `AccountService`/`UsersService`). The token carries a `tv` claim that `requireAuth` re-checks every request.
- **`helmet`'s CSP must allow the assets the app actually loads** — the Google Fonts hosts and the external book-cover hosts (`books.google.com`, `covers.openlibrary.org`). The dev server bypasses helmet, so **verify CSP-affected UI (fonts, covers) against a production build**, never just `npm run dev`.
- **Neutralize CSV formula injection when serializing user text** (titles, reviews) to export — cells beginning with `=`, `+`, `-`, or `@` must be defused. See `goodreadsCsv.ts`.
- **Validate user-supplied URLs** (e.g. a manual entry's `coverUrl`) as `http(s)` rather than accepting a bare string.

## Node version

Use **Node 20 LTS** (`nvm use 20`). `better-sqlite3` uses native V8 APIs removed in Node 26 and will fail to build there.

## Testing

Server tests run under **Vitest** (`npm test -w server`), with each test beside its unit as `*.test.ts` (e.g. `lib/cycles.test.ts`). Favor testing:

- **Pure logic** — cycle derivation, import dedup, status mapping, signature/normalization helpers.
- **The service layer** — ownership checks, transaction boundaries, and especially the two Core invariants above. Services compose mockable repositories and ports by design, so they test without a live DB or HTTP.

Keep HTTP and SQL concerns out of unit tests — the layering exists precisely so business logic is testable in isolation. The contract layer already validates request/response shapes at runtime, so tests should target behavior, not wire format.
