# Outcome: i18n-desc-items

## Built

- Japanese and Spanish `description` for all 277 written item descriptions, and `templates:` for all 28 families that have them, in `src/data/text/{ja,es}/items/`. Beside the generated `name` where a file existed; new files per locale for the 7 families with no official names (balms, machines, the portal key, the purifying gem, the skill book, the utility belt, Zenith shards).
- `test/data/locale-descriptions.test.ts`: for ja and es, every registered item has a description that differs from English and ends in 。 (ja) or . (es), built lines included. A later node adds its registry to `REGISTRIES` (an entry with a name and a `describe()` returning key to line).
- Terms in `docs/strategy/translations-terms.md` (Item descriptions): holder, stage, critical hit, super-effective, wind-up, multipliers, Mega Stone and Z-Crystal, gimmick verbs, TM names, forms, and the NPCs and weather the lines name.

## Deviations

- None outside the owned paths, except the terms file (shared) and `test/data/locale-descriptions.test.ts`.
- `pnpm official-names` reordered keys and added the generated header to files that held only hand-written text; no value changed, so the reordered files are committed.

## Stubs left

- Zenith shard lines carry the holder's English name (`shape.holder`) and the shard's name stays English, as the Zenith items are built from English.
- `Dark Day`, the stop trainer, and the weather and NPC words in these lines are provisional until batch 9 names them.
- The generated files still say "Do not edit" above hand-written text (known from `i18n-descriptions`).

## Gotchas

- The test mock replaces `currentLocale` only, so `formatList` and `formatNumber` (which read the locale inside their own module) still answer in English there: a treat's list reads "a, b or c" and a decimal "1.5" in a test, not in the game.
- A Spanish stat name ending in `Esp.` doubles the full stop when it closes a sentence; put it mid-sentence.

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only).
- `pnpm exec vitest run test/data test/i18n`: 37 files, 569 tests pass.
- `pnpm test`: 278 files, 5773 tests; 5772 pass. `tera-sites` timed out under load and passes alone (6 of 6).
- `pnpm official-names` rerun: no parsed value differs from the committed files, and a second run changes nothing.

## Size

- Estimated M, actual M.
