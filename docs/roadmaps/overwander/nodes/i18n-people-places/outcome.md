# Outcome: i18n-people-places

## Built

Every text file of the batch is read in the player's locale, English as the fallback. A locale file lies at the same path below its locale folder (`src/data/text/ja/gym-leaders.yaml` over `text/en/gym-leaders.yaml`), keyed like the English file, and may leave entries and fields out. The server renders several locales at once, so every table is an accessor over `currentLocale()`, never a value picked at load.

How each file is read (new helpers are in `src/data/yaml.ts`):

- Flat `Key: line` files, by `localeStringTable`: awards, biomes, times-of-day, spawn-rarities, item-types, titles, lairs, landmarks, decorations, phenomena, vendor-stalls, egg-groups, families. `achievements.yaml` (`tiers`) and `frontier-rooms.yaml` (`curtains`, `panels`) are read by section.
- Files whose entries are maps, by `localeFieldTable` (one table per field; a locale may translate one field of an entry and leave the other): gym-leaders, elite, champions, legends (`name`, `quote` or `greeting`), executives, syndicates (`name`, `boss`, `boss-title`, `executive-title`, `boss-quote`, `grunt-quote`), frontier (`name`, `house`, `greeting`), weather (`name`, `description`), achievements `lines` (`name`, `deed`).
- Trainer classes (`trainers/<region>.yaml`) by `readLocaleText` and `addLocaleText`, one file a region. `TRAINER_NAMES` is an accessor per class: the classes that carry their region are chosen from the English names (`ENGLISH_TRAINER_NAMES`, new), and the region is added in the active locale. `trainer-sheets.yaml` is keyed by sheet path and read by `localeLines`.
- `npcs.yaml`: `createNpc` returns a definition whose `name`, `description`, `quote` and `spent` are accessors (`localize`).
- `quests.yaml`: each written quest, chain and daily has a `name` accessor (`localizeLine`). A dex chain's rung names come from `dex-rungs.yaml` (a list; a locale writing it writes all of it) and are read each time a dex quest is asked for.
- `town-names.yaml`: see below.
- `megas.yaml` and the new `mega-names.yaml`: see below.

Where translators put files: `src/data/text/ja/<same path as English>.yaml` and `text/es/...`. Keys must exist in English, a list must have English's length, and a message parameter must exist in English (`test/data/locale-people-places.test.ts`, which also lists every file of the batch).

Town names: a locale writes `text/<locale>/town-names.yaml` with all of `heads`, `tails`, `titles`, `marks` and `counties`, the same lengths and order as English (eight heads for each biome English has). A short or long list, or a missing biome, fails the load (`checkTownWords`). A town keeps its place in every list, so it is the same town in every language. A locale with no file reads English names whole, with the English joiner. A locale with a file joins the parts with `TOWN_JOINERS[locale]` in `src/data/overworld/town-names.ts`, a function of `{ mark, head, tail, title, county }`. The English joiner is the old template, unchanged (pinned by `test/data/town-names.test.ts`). `ja` joins `county mark head tail title` with no spaces; `es` puts the title first (`Pueblo Nuevo Concha, Ashmarch`). Both are first drafts for `i18n-places` to adjust, in that file, once the words exist; the `tail` is still welded on with no space. No `ja` or `es` town file was written, so nothing changes yet.

Megas: `text/<locale>/mega-names.yaml` holds a `name` template (`Mega {base}`) and a `variant` template (`{name} {letter}`, the letter being the X, Y or Z a Mega ends in). `ja` (`メガ{base}`, `{name}{letter}`) and `es` (`Mega-{base}`, `{name} {letter}`) are written. A Mega's name in a locale is its entry in that locale's `megas.yaml` if it writes one, else the template filled in with the name the pokemon has in that locale, else English. English keeps its written names in `megas.yaml`.

Families: a family is called what the pokemon it is named for is called. `ids/text.ts` reads each locale's species files for the species under the family with the same key, and a locale's own `families.yaml` overrides it.

## Not derived

- Families with no official ja or es species name yet (the species files have none): Rolycoly, Cufant, Zarude, Squawkabilly, Maschiff, Shroodle, Klawf, Bombirdier, Flamigo, BruteBonnet, IronJugulis, WoChien, ChienPao, Okidogi, IronBoulder, IronCrown. They read English until the species have names.
- Megas in ja: Mega Tatsugiri Stretchy and Mega Tatsugiri Droopy read `メガTatsugiri Stretchy` and `メガTatsugiri Droopy`, since the forms have no name of their own in ja. Every other ja Mega and every es Mega follows its pokemon's name.

## Deviations

- `src/components/demo/BiomePicker.tsx` (outside `owns`) builds its options at load; labels are now getters so they follow the language.
- `src/data/species/megas.ts`, `src/data/quests/dex.ts` and `src/data/quests/written.ts` are inside the brief's paths in spirit but not named in `owns`.
- `localeFieldTable` only checks the field it is asked for, so an extra field in an English entry is no longer a load failure (`v.strictObject` did that before). The parity test still holds each locale to English.
- No exported name changed its type, except that `localeStringTable` has two new optional arguments and `localeFile` returns `{ english, read }`.

## Stubs left

- English words built in code stay English: "Grunt" in `gruntName`, the `Master` and `Professor` titles in `ids/titles.ts`, `Featured:` and `Daily Stroll` in the quest rotations, `Pokedex` and `Complete` in the dex chain, region names (`REGION_NAMES`, used in `TRAINER_NAMES` and titles). They need templates in YAML in a later node.
- `bossName` and `executiveName` still join team, title and name in English order.
- The search vocabulary (`src/model/search/catch/vocabulary.ts`) lists these names as they read in the active locale when asked.

## Gotchas

- Read the tables at use time. Do not copy a value into a module constant, or spread a table: a spread freezes the locale it was read in.
- A name's locale is `currentLocale()`, so a test that checks another locale mocks `../../src/i18n/locale` as `test/data/locale-descriptions.test.ts` does.
- Japanese text files must hold no kanji (`test/data/official-names.test.ts`), comments included.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only).
- `pnpm official-names`: exit 0, no diff.
- `pnpm exec vitest run --maxWorkers=2 test/data test/i18n test/overworld/npcs test/model`: 56 files, 847 tests pass (after the kanji fix in `mega-names.yaml`).

## Size

- Estimated M, actual M.
