---
name: registry-text
version: 3
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
- **Hand-written fields beside generated ones.** A locale file the generator writes may also hold fields it does not write (anything but `name` and `category` inside an entry) and entries it did not match. A rerun keeps both (`keepWritten` in `scripts/i18n/keep-written.ts`), rewrites only `name` and `category`, and drops entries English no longer has.
- **Wired:** species (`name`, `category`), moves and abilities (`name`, `description`), items (`name`, a written `description` and `templates:`), types, natures, stats and stages (`text/<locale>/{stats,stages}.yaml`; `ENGLISH_STAT_NAMES` and `ENGLISH_STAGE_NAMES` for code that matches names), and Zenith names (a `name` template in `text/<locale>/zeniths.yaml`). The other `stringTable` files (biomes, egg groups and the rest) are not wired yet.

## Changes

- v1: initial.
- v2 (i18n-official-names): `localeStringTable` for flat tables; types and natures wired.
- v3 (i18n-descriptions): hand-written fields kept by the generator; stats, stages and Zenith names wired.
