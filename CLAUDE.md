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

```tsx
// correct
<Text variant="h3">Blood Meridian</Text>
<Text variant="label" color="accent">Currently Reading</Text>
<Text variant="ui-sm" color="muted">{author}</Text>

// never
const Title = styled('p')(({ theme }) => ({ fontFamily: theme.fontDisplay, fontSize: '1.5rem' }))
```

### Text variants

| Variant                            | Font                             | Size                 |
| ---------------------------------- | -------------------------------- | -------------------- |
| `h1`–`h6`                          | Cormorant Garamond, italic       | 3rem → 1rem          |
| `body1`, `body2`                   | Lora                             | 1.0625rem, 0.9375rem |
| `ui-lg`, `ui-md`, `ui-sm`, `ui-xs` | Outfit                           | 1rem → 0.6875rem     |
| `label`                            | Outfit, bold, uppercase, tracked | 0.6875rem            |

### Text colors

`default` · `muted` · `accent` · `onColor` · `onColorMuted`

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

### Five-layer structure

```
routes/       ← thin HTTP layer; validates input/output shapes, delegates to services
services/     ← business logic; no HTTP concerns, no SQL
providers/    ← lifecycle management for external services (lazy init, caching, invalidation)
clients/      ← external HTTP adapters; one class per external API
repositories/ ← all database access; Zod validation at the DB boundary
```

Never let concerns bleed across layers — routes don't touch the DB, services don't know about `req`/`res`, services never import other services (use providers or repositories instead).

**`clients/`** are pure HTTP adapters. They take config in their constructor, own the wire-format schema (private — never exported), and return types from `@livre/types`. If the external API changes, only the client changes.

**`providers/`** manage the lifecycle of a client — lazy initialisation from config, caching the instance, invalidating it when config changes. Services call providers, never clients directly:

```ts
// correct — service calls provider
async search(query: string) { return this.googleBooks.search(query); }

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

### `bookRef` — the client never sees a source

The client is **deliberately blind** to which provider a book came from. URLs, query keys, dedup maps, and localStorage all reference books by an opaque string `bookRef` — never by `source` / `externalId`.

- **Encoding lives server-only** in `server/src/lib/bookRef.ts`. `encodeBookRef(source, externalId)` returns a base64url string; `decodeBookRef(ref)` reverses it and validates the source against `bookSourceSchema`.
- **Wire shapes** (`BookVolume`, `ShelfEntry`) carry `bookRef` instead of `source` / `externalId`. The shared `bookSourceSchema` enum exists for server use; client code must not import or reference it.
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
