---
name: registry-text
version: 1
status: frozen
defined_by: i18n-registry-loader
---

# Contract: registry-text

## Purpose

How registry text is laid out per locale under `src/data/text/<locale>/`, and the lookups (`getSpeciesName(id)` and friends) that read the active locale.

## Interface

- **Layout.** A registry's words live under `src/data/text/<locale>/`, English under `text/en/`. A locale file sits at the same path below its locale folder as the English file it translates (`text/ja/moves/gen-1/bulbasaur-to-blastoise.yaml` over `text/en/moves/gen-1/bulbasaur-to-blastoise.yaml`), keyed the same way.
- **English is complete; a locale is an overlay.** A locale file may leave out entries and fields, which then read in English. It may not write a file, entry or field English lacks, or a value where English writes a map (or the reverse). Each of those fails the load. A locale folder must be one of `locales` in `project.inlang/settings.json`.
- **Loading.** A registry globs every locale (`../text/*/moves/**/*.yaml`) and passes the files to `splitLocales` from `src/data/yaml.ts`, which returns `{ english, overlays }`. The registry reads `english` as before, reads each overlay into entries with `readOverlays`, and calls `localize(record, entryName, overlays, fields)` on each record it builds.
- **Lookups.** `localize` turns each translated field into an accessor on the record that reads `currentLocale()`, so `getMoveData(id).name`, `getSpeciesData(id).category` and the rest read the active locale with no new lookup functions. A field no locale translates stays a plain value.
- **Copies.** A record built from another record (a Mega, a Zenith or a true shadow from its base) is made with `extendRecord(base, changes)`, never a spread. A spread reads each accessor once and keeps that locale's text.
- **Flat tables.** A `stringTable` file every locale writes is read with `localeStringTable(ids, files, where)`, given the glob of that one file across locale folders (`../text/*/types.yaml`). Each translated entry reads the active locale.
- **Wired:** species (`name`, `category`), moves and abilities (`name`, `description`), items (`name` and a written `description`), types and natures. Item `templates:` and the other `stringTable` files (biomes, egg groups and the rest) are not wired yet.

## Changes

- v1: initial.
- v2 (i18n-official-names): `localeStringTable` for flat tables; types and natures wired.
