# Roadmap

Where Livre is headed. This is a living document, not a commitment — order and scope will shift, and
anything under **Exploring** may never ship. Actionable work is tracked in
[issues](https://github.com/greg-dav/livre/issues); this page is the higher-level vision.

Livre's three tenets — **Privacy, Openness, Simplicity** — are the filter. A feature that can't be
done without weakening one of them gets reworked until it can, or it doesn't ship.

## Organization

How books are grouped, found, and surfaced — beyond the four fixed shelves.

- [ ] **Custom lists** — user-created, named, with a freeform description; shareable reading contexts beyond the four fixed shelves
- [ ] **Favorites** — mark a book as a favorite, independent of its shelf
- [ ] **Hidden books** — keep a book's history without surfacing it in the main library view
- [ ] **Saved searches** — persist a search query + filters as a named shortcut in the sidebar

> **Design note.** Favorites, Hidden, and Custom lists are _not_ new shelves. Shelf status is derived
> from the reading log and never stored, so these are better modeled as one **collections / flags**
> system — a book can belong to any number of named sets while keeping its single derived shelf
> status. Building them as a unified concept avoids three one-off features (and three ways to break
> the "status is derived" invariant).

## Reading insights

Higher-order views built on top of the reading log.

- [ ] **Reading report** — reading stats across years; a higher-order view over the log
- [ ] **Custom timespans** for the reading timeline (selectable horizons)

## Integrations

Bringing reading data in and out, and meeting people where their books already live.

- [ ] **KOReader sync** — real reading progress %, highlights, and session log piped in automatically rather than entered manually _(way later)_
- [ ] **Calibre integration** — import from an existing Calibre library
- [x] **Goodreads import / export** — CSV in and out _(shipped)_

## Metadata & polish

Smaller refinements to how books look and what we store about them.

- [ ] **Book subtitles** — store and display a subtitle field
- [ ] **Author details** — author biography + image displayed on the author detail page
- [ ] **Local cover cache** — fetch and store every cover server-side, serving it from the instance instead of hotlinking the provider

> **Design note.** Today Livre hotlinks all covers (book providers + any host pasted for a manual
> entry), so the production CSP `img-src` allows any https host and viewing a book contacts a
> third-party image host — a privacy leak. Caching covers locally and serving them from `'self'`
> (the way Calibre-Web does) closes that, survives hotlink rot, and works offline — the strongest
> form of the Privacy tenet. The cost is a server-side fetch pipeline that must be hardened against
> SSRF (block private/loopback/link-local ranges, cap size and content-type). Done properly it
> covers _all_ covers, not just manual entries, and lets `img-src` tighten back to `'self'`.

## Exploring (not committed)

Speculative directions that need a real design pass — especially against the Privacy tenet — before
they're more than ideas. Any of this would be **explicitly opt-in and anonymized**; nothing here
changes Livre's default of keeping your data to yourself.

- [ ] **Federated recommendations** — opt in to contribute saved-book signals (via ActivityPub) so participating instances surface better recommendations
- [ ] **Social** — shape and scope TBD; a superset of the federation idea above

---

[← Back to the README](../README.md)
