# Outcome: i18n-descriptions

## Built

- `scripts/i18n/keep-written.ts` (`keepWritten`, `GENERATED_FIELDS`): `official-names.ts` lays its output over the file it replaces. It writes only `name` and `category`; every other field and every entry it did not match stays. A `name` or `category` it no longer writes for a matched entry is dropped.
- `text/<locale>/stats.yaml` and `stages.yaml` (flat maps), with the official ja and es names. `STAT_NAMES` and `STAGE_NAMES` are `localeStringTable`s, so vitamin, berry, mint, wing and power-item descriptions name their stat in the active locale. `ENGLISH_STAT_NAMES` and `ENGLISH_STAGE_NAMES` hold the English names.
- Zenith names: `text/<locale>/zeniths.yaml` holds a `name` template with a `{holder}` mark (English `Zenith {holder}`, ja `ゼニス{holder}`, es `Cenit-{holder}`). A Zenith and each of its shapes is copied with `extendRecord` and its name derived per locale from the template and the base pokemon's name in that locale.
- `docs/roadmaps/overwander/contracts/registry-text.change-request.md` (v3), and the stat and Zenith terms in `docs/strategy/translations-terms.md`.
- Tests in `test/data/official-names.test.ts`: the merge keeps a hand-written field and entry (also inside a species family, and is stable on a second run), stat and stage names per locale, English names kept, a vitamin's description per locale, Zenith names per locale.

## Deviations

- `scripts/i18n/keep-written.ts` is a new file outside `owns`: the script runs `main()` on import, so the merge lives in a module a test can load.
- `src/data/species/zeniths.ts` (builds Zenith names), `src/components/app/command-bar/names.ts`, `src/data/species/yaml.ts` and `src/overworld/npcs/hyper-trainer/interact.ts` (read `ENGLISH_STAT_NAMES`) are outside `owns`, as the brief expected.
- The generated files keep their "Do not edit" header, so a regeneration changes no file. A hand-written field in one is still safe; the header is now partly wrong. Rewording it touches every generated file, so it is left to a run that has other changes.
- `official-names.ts` was not run: it downloads PokeAPI tables. Acceptance "git diff stays empty on a rerun" is covered by the merge test, not by a run.
- The Zenith shard description still reads the English holder (`Alolan Raticate`); it is a description, for the items node.
- In ja and es a Zenith of a form whose pokemon has no official name in that locale reads the English name inside the template.

## Stubs left

- No description is translated; the six `i18n-desc-*` nodes do that, writing `description` beside the generated names.
- Zenith holder names in ja and es come from the base species' translated name; a locale can still not override one holder.
- The hyper trainer's stat labels and the staff command bar stay English.

## Gotchas

- `STAT_NAMES` is read live. Do not copy a value into a module constant; a derived description has to go through `deriveLocalized`.
- A file whose only content is hand-written is kept by the script; it never deletes a locale file.
- In `zeniths.yaml`, `name` is the template and is not a holder; `readZeniths` skips it.

## Proposed learnings

- Code that matches or parses a displayed name reads an English-only table, never the locale table | the locale table changes with the player's language | src | no

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only).
- `pnpm exec vitest run test/data test/i18n`: see the report; `pnpm test` full run at the end.

## Size

- Estimated M, actual M.
