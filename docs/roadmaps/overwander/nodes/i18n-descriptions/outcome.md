# Outcome: i18n-descriptions

## Built

- `scripts/i18n/keep-written.ts` (`keepWritten`, `writeKeptFile`, `GENERATED_FIELDS`): `official-names.ts` lays its output over the file it replaces, and writes a file even when nothing matched so a held file is still merged. It writes only `name` and `category`; every other field stays, and so does every entry it did not match, provided English still has that entry. An entry English dropped is removed. A `name` or `category` it no longer writes inside an entry it still writes is dropped, but a top-level string of a flat table is never dropped.
- `text/<locale>/stats.yaml` and `stages.yaml` (flat maps), with the official ja and es names. `STAT_NAMES` and `STAGE_NAMES` are `localeStringTable`s, so vitamin, berry, mint, wing and power-item descriptions name their stat in the active locale. `ENGLISH_STAT_NAMES` and `ENGLISH_STAGE_NAMES` hold the English names.
- Zenith names: `text/<locale>/zeniths.yaml` holds a `name` template with a `{holder}` mark (English `Zenith {holder}`, ja `ゼニス{holder}`, es `Cenit-{holder}`). A Zenith and each of its shapes is copied with `extendRecord` and its name derived per locale from the template and the base pokemon's name in that locale.
- `docs/roadmaps/overwander/contracts/registry-text.change-request.md` (v3), and the stat and Zenith terms in `docs/strategy/translations-terms.md`.
- Tests in `test/data/official-names.test.ts`: `writeKeptFile` on a temp file (hand-written field kept, removed English key dropped, rerun byte-identical, no empty file created), the merge keeps a hand-written field and entry (also inside a species family, and is stable on a second run), stat and stage names per locale, English names kept, a vitamin's description per locale, Zenith names per locale, a form Zenith (Castform Sunny) named for Castform, and the command bar's `STAT_LABELS` staying English under ja.

## Deviations

- `scripts/i18n/keep-written.ts` is a new file outside `owns`: the script runs `main()` on import, so the merge lives in a module a test can load.
- `src/data/species/zeniths.ts` (builds Zenith names), `src/components/app/command-bar/names.ts`, and `src/data/species/yaml.ts` (read `ENGLISH_STAT_NAMES`), and `src/overworld/npcs/hyper-trainer/interact.ts` (its labels now read `STAT_NAMES`, as they are shown, not parsed) are outside `owns`, as the brief expected.
- The generated files keep their "Do not edit" header, so a regeneration changes no file. A hand-written field in one is still safe; the header is now partly wrong. Rewording it touches every generated file, so it is left to a run that has other changes.
- `official-names.ts` was not run: it downloads PokeAPI tables. Acceptance "git diff stays empty on a rerun" is covered by the merge test, not by a run.
- The Zenith shard description still reads the English holder (`Alolan Raticate`); it is a description, for the items node.
- In ja and es a Zenith of a form whose pokemon has no official name in that locale reads the English name inside the template.

## Stubs left

- No description is translated; the six `i18n-desc-*` nodes do that, writing `description` beside the generated names.
- Zenith holder names in ja and es come from the base species' translated name; a locale can still not override one holder.
- The staff command bar's stat names stay English; they are parsed.

## Gotchas

- `STAT_NAMES` is read live. Do not copy a value into a module constant; a derived description has to go through `deriveLocalized`.
- A file whose only content is hand-written is kept by the script; it never deletes a locale file.
- In `zeniths.yaml`, `name` is the template and is not a holder; `readZeniths` skips it.

- An official entry whose PokeAPI row disappears is not rewritten, so it keeps its last name.
- Form Zeniths take the name of the pokemon their Zenith is of, not of the form they stand in for.

## Proposed learnings

- Code that matches or parses a displayed name reads an English-only table, never the locale table | the locale table changes with the player's language | src | no

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only).
- `pnpm exec vitest run test/data test/i18n`: 36 files, 567 tests pass.
- `pnpm test`: 277 files, 5771 tests; 5770 pass. `tera-sites` timed out under load and passes alone (6 of 6).

## Size

- Estimated M, actual M.
