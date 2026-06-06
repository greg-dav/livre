<!-- HERO -->
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/media/hero_roman_dark.png" />
  <img src="docs/media/hero_roman_light.png" alt="Livre — a self-hosted reading tracker" width="100%" />
</picture>

<!-- BADGES -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Status: alpha](https://img.shields.io/badge/status-alpha-orange)
![Node](https://img.shields.io/badge/node-20_LTS-339933?logo=node.js&logoColor=white)

</div>

<!-- SHORT PITCH -->

Livre is a self-hosted application for managing your digital bookshelf.

**📸 [See the screenshots →](docs/screenshots.md)** — library, book detail, reading timeline, and search.

## Features

<!-- TODO: tighten copy (prose); bullets reflect what ships -->

- **Shelves** — want to read, reading, read, did-not-finish; status derived from your reading log
- **Ratings & reviews** — rate and review in your own private copy of each book
- **Reading timeline** — track reading sessions across cycles
- **Book search** — Open Library by default, Google Books when configured
- **Goodreads import / export** — bring your library in, take it out anytime (CSV)
- **Light & dark themes**

## Quick start (Docker)

The fastest way to run Livre. Requires Docker.

```bash
docker compose up -d
```

Then open <http://localhost:3000>.

That's it — a session secret is generated and persisted to the `livre_data` volume on first run, and your library lives in that same volume. To pin a specific secret (e.g. across multiple instances), set `JWT_SECRET` in the environment or a `.env` file before starting.

## Manual setup (development)

Requires **Node 20 LTS** (`better-sqlite3` uses native APIs removed in newer Node).

```bash
nvm use 20
npm install            # installs all workspaces

cp .env.example .env   # optional — sensible defaults work out of the box
npm run dev            # types watcher + client (:5173) + server (:3001)
```

Then open <http://localhost:5173>. The Vite dev server proxies `/api` to the backend on `:3001`.

## Configuration

All configuration is via environment variables, validated at startup. None are required.

| Variable     | Default       | Description                                                                                                                               |
| ------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET` | _auto_        | Secret for signing session tokens. If unset, one is generated and persisted to `DATA_DIR/.jwt_secret` (min 32 chars when set explicitly). |
| `DATA_DIR`   | `./data`      | Directory for the SQLite database and the generated secret. Docker uses `/data` (a mounted volume).                                       |
| `PORT`       | `3001`        | Server port. The Docker image defaults to `3000`.                                                                                         |
| `NODE_ENV`   | `development` | `development` · `production` · `test`.                                                                                                    |

## First run

<!-- TODO: prose around the steps -->

Livre has no accounts system and no cloud — the **first account you create on your instance is yours**, and it lives only in your database.

1. Open the app and create your account.
2. Start adding books via search, or import an existing library.

### Importing from Goodreads

<!-- TODO: confirm exact Settings path/labels against the running app before finalizing -->

1. In Goodreads, export your library to CSV (My Books → Import/Export → Export Library).
2. In Livre, open Settings → Import and upload the CSV.
<!-- TODO: screenshot of import dialog (light + dark) -->

## Demo mode

Want to see Livre with a real library before adding your own? Open **Settings → Demo → Enter demo mode** for an isolated, pre-seeded sandbox — shelves, ratings, reviews, and reading timelines across a curated set of books. Leaving demo mode returns you to your own data untouched.

## Tech stack

- **Client** — React 19, Vite, TypeScript, styled-components
- **Server** — Node.js (Express), TypeScript
- **Database** — SQLite via better-sqlite3, Drizzle ORM
- **API** — ts-rest contracts shared between client and server (Zod)
- **Monorepo** — npm workspaces (`client`, `server`, `shared`, `fe-libs/*`)

## Status

**Alpha.** Livre is usable and self-hostable today, but the schema and APIs may still change between releases.

Where it's headed — custom lists & collections, reading insights over the log, and integrations (KOReader, Calibre). See the full **[roadmap →](docs/ROADMAP.md)**.

## Contributing

Contributions are welcome. See [CLAUDE.md](CLAUDE.md) for architecture and conventions.

```bash
npm run lint           # eslint
npm run format         # prettier --write
npm test -w server     # vitest (server unit tests)
npm run build          # production build (types + client)
```

## License

[MIT](LICENSE)
