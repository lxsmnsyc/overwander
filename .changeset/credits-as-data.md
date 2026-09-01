---
'overwander': minor
---

- The credits are a list rather than a page: `public/credits.json` holds the art
  sources and their terms, the packages, the artists and the landmark and
  decoration names, and `docs/credits.md` keeps the half that has to be
  explained.
- The About tab reads that file, so the credits screen names everybody instead
  of four sources and a note saying the rest ships with the source. Artists are
  deduped, with their works grouped under them.
- `pnpm import-sprites` scans every sheet's own credits into the list, so a
  pokemon cannot ship without its artists reaching a player. The sprite
  processor writes a packed charset's artist into the same file instead of
  editing a markdown table.
- The landmark, decoration and tree artists are credited for the first time.
