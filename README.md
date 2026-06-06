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

## Why Another Reading Tracker? — A Brief Manifesto

Obviously Goodreads is terrible, for innumerable reasons. We need not get into them.

There are corporate alternatives (StoryGraph) and a few decent open-source options (BookWyrm, LazyLibrarian), but none of these quite captured the product philosophy I was searching for: one that embraced privacy, openness, and simplicity. I won't bash StoryGraph — I've never used it, but I didn't want to pay for another service, or give my data to another corporation. I also feel no need to disparage the works of other talented engineers who have taken it upon themselves to realize products that are entirely free for public use. The self-hosted options that exist, though, are not for me.

It always sort of seems like the entrance of one of these tenents (Privacy, Openness, Simplicity) results in the absence of another, like a triangle without a third side. What a sad biangle.

Anyway, Livre exists to bridge the gap.

It's private, with all your data hosted on your machine (or a trusted friend's). No telemetry, no tracking. (For the record, we don't have social yet, but we plan to do it right, with privacy at the forefront.)

It's fully open, allowing readers to pull in book data from OpenLibrary, Google Books, or even paid APIs. Once you add a book to your library, it's yours to do what you wish with: everything is editable.

Livre is simple. Every design decision is scrutinized, from the UI to the system architecture. Every element exists for a reason; there are no product dead ends.

If we do it right, Livre should feel like writing down log entries in a physical book. I've done this, and I like it, but shouldn't technology offer us a delightful alternative?

— G

## Features — The Brief Manifesto, Made Briefer

- **Shelves** — want to read, reading, read, did-not-finish; status derived from your reading log
- **Ratings & reviews** — rate and review in your own private copy of each book; add notes, quotes, and custom tags
- **Reading timeline** — view reading progress in a gantt-style timeline
- **Book search** — Open Library by default, Google Books when configured, other sources once built ;)
- **Goodreads import / export** — bring your library in, take it out anytime (CSV)

## Quick start (Docker)

The fastest way to run Livre — no clone required. Drop this into a `docker-compose.yml`:

```yaml
services:
  livre:
    image: ghcr.io/greg-dav/livre:alpha
    ports:
      - '3000:3000'
    volumes:
      - livre_data:/data
    restart: unless-stopped

volumes:
  livre_data:
```

Then `docker compose up -d` and open <http://localhost:3000>. Your library lives in the `livre_data` volume — that's the only thing to back up.

## Manual setup (development)

Requires **Node 20 LTS** (`better-sqlite3` uses native APIs removed in newer Node).

```bash
nvm use 20
npm install            # installs all workspaces

cp .env.example .env   # optional — sensible defaults work out of the box
npm run dev            # types watcher + client (:5173) + server (:3001)
```

Then open <http://localhost:5173>. The Vite dev server proxies `/api` to the backend on `:3001`.

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
