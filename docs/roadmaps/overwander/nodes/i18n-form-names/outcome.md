# Outcome: i18n-form-names

## Built

- `scripts/i18n/official-names.ts` fills a form's name and category after PokeAPI, in this order: `scripts/i18n/overrides/species.yaml`, the regional rule (ja `ゾロアーク（ヒスイのすがた）`, es `Zoroark de Hisui`), the base name and PokeAPI's form label (ja `ビビヨン（みやびなもよう）`, es `Vivillon (Motivo Oriental)`), and for a category the base species' own. Generated fields are still written only by `pnpm official-names`; it reruns with no diff.
- `scripts/i18n/overrides/species.yaml`: 184 entries (107 name fields, 156 category fields). Names it holds: official wording from the zukan or WikiDex for forms PokeAPI has no full name for (Rotom, Kyurem, Hoopa, Tauros breeds, Calyrex riders, Necrozma, Basculin White, Dialga and Palkia Origin and others), Silvally's 17 types as PokeAPI labels them (`シルヴァディ（タイプ：ファイト）`, `Silvally (Tipo: Lucha)`; PokeAPI gives no full name, so the label path misses them), and 10 coined ones (Alcremie's six sweets, named after the repo's sweet items, and Ogerpon's four Terastal masks, each in ja and es).
- `src/data/text/{ja,es}/species/**`: every species and form now has a name and category. Gap fill, names: ja 252 (48 override, 53 regional rule, 151 label), es 252 (59, 53, 140). Categories: ja 258 (27 override, 231 from the base), es 362 (129 override, 233 from the base). PokeAPI still supplies the other 1006 names per locale.
- `test/data/official-names.test.ts`: every English species and form entry has a ja and es name and category, and Sprigatito and Hisuian Zoroark read as the brief asks.
- `docs/strategy/translations-terms.md`: a "Forms and categories" section.
- `.changeset/i18n-form-names.md` (patch).

## Proof

- base: `batch/overwander` (9b93612e7) with only the new test added, `pnpm exec vitest run test/data/official-names.test.ts -t 'every species'`: fails, 252 ja names, 252 es names, 258 ja categories and 362 es categories missing.
- branch: the same command passes; 0 missing.

## Deviations

- None outside the owned and shared paths. The generated header text is unchanged, so it still says every field but names and categories is written by hand and does not mention the overrides file.

## Stubs left

- Female forms and a few pairs share the species name in a locale (Indeedee, Meowstic, Oinkologne, Basculegion, Magearna Original, Unown ! and ?), as PokeAPI names them. Not part of this node.

## Gotchas

- An override wins over PokeAPI for the same field, so a stale override hides a later PokeAPI fix.
- The base of a form is the longest key of its family that starts the form's key. A new form whose key does not start with its base's has to take its category from the overrides.
- The 10 coined names and the es forms taken from WikiDex (Spain wording) are the ones to recheck against the games.

## Proposed learnings

- A form's text is derived from its base species by the generator, never written by hand into a generated field | a hand-written name is dropped on the next run | scripts/i18n | no

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0.
- `pnpm exec vitest run test/data/official-names.test.ts test/data/locale-text.test.ts`: 31 tests pass.
- `pnpm official-names` twice: no diff on the second run.
- The full suite was not run, as the orchestrator asked.

## Size

- Estimated M, actual M. The code was small; finding the official wording took most of the time.
