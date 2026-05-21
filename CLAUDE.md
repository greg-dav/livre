# Livre — Claude Code Guidelines

## Project overview

Livre is an open-source, self-hosted reading tracker. Three tenets: **Privacy, Openness, Simplicity**. Self-hosted by design, no accounts, no cloud.

## Tech stack

- **Frontend**: React 19, Vite 5, TypeScript, styled-components v6
- **Backend**: Node.js (Express), TypeScript via `tsx` in dev / `tsc` in prod
- **Database**: SQLite via `better-sqlite3` — requires **Node 20 LTS** (incompatible with Node 26+)
- **Monorepo**: npm workspaces — `client`, `server`, `packages/*`
- **UI primitives**: Radix UI (installed in `@livre/primitives`)

## Package hierarchy

```
@livre/ui         ← theme tokens, DefaultTheme, LivreThemeProvider, GlobalStyle
    ↓
@livre/primitives ← reusable components (Text, BookCard, StarRating, etc.)
    ↓
client            ← app screens and components
```

- `DefaultTheme` is declared **exactly once**: `packages/ui/src/styled.d.ts`. Never declare it anywhere else.
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
- All package exports live in the package-level `src/index.ts`
- Screens (`client/src/screens/`) and components (`client/src/components/`) are separate directories

## Component conventions

- Const-based functional components only — no class components
- Default export for the component, named exports for types:
  ```ts
  export type { BookCardProps };
  export default BookCard;
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

To add a theme: add an entry to the registry in `packages/ui/src/themes/index.ts`. `ThemeName` is derived automatically via `keyof typeof themes`.

## Comments

Default to **no comments**. Only add one when the WHY is non-obvious — a hidden constraint, a workaround, a subtle invariant. Never comment what the code does; well-named identifiers do that.

No multi-line comment blocks. One short line maximum.

## Node version

Use **Node 20 LTS** (`nvm use 20`). `better-sqlite3` uses native V8 APIs removed in Node 26 and will fail to build there.
