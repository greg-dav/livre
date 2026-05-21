# Livre — Claude Code Guidelines

## Project overview

Livre is an open-source, self-hosted reading tracker. Three tenets: **Privacy, Openness, Simplicity**. Self-hosted by design, no accounts, no cloud.

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

### Three-layer structure

```
routes/      ← thin HTTP layer; validates input/output shapes, delegates to services
services/    ← business logic; no HTTP concerns, no SQL
repositories/← all database access; Zod validation at the DB boundary
```

Never let concerns bleed across layers — routes don't touch the DB, services don't know about `req`/`res`.

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
