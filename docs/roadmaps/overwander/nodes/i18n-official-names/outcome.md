# Outcome: i18n-official-names

## Built

- `scripts/i18n/official-names.ts` (`pnpm official-names`): reads PokeAPI's name tables at a pinned commit, matches each English entry by name, and writes `text/ja/` and `text/es/` beside the English files, then formats them with oxfmt. Japanese is the kana (`ja-Hrkt`), and the plain Japanese name stands in only where it has no kanji. Species also take their category (PokeAPI's genus).
- Matched: 1225 of 1258 species, 901 of 941 moves, 312 of 871 abilities, 625 of 1136 items, 19 of 20 types, all 25 natures. What is left is this game's own (signature abilities, Zeniths and their shards, Frenzy moves, custom items), G-Max moves, and forms PokeAPI gives no English name (Silvally's types, Alcremie's sweets, Calyrex's riders).
- Matching ignores accents, punctuation and spacing, compares a form's words in any order without words like "Form" or "Pattern", writes Nidoran's ♀ and ♂ as F and M, and maps the older names this game keeps (Vice Grip, Stick, the Wings) to PokeAPI's.
- `ja` and `es` are in `project.inlang/settings.json`, with empty message files. `SHOWN_LOCALES` in `src/i18n/locale.ts` holds English only, and the server serves English to any request for another locale, so players see nothing yet.
- `localeStringTable` in `src/data/yaml.ts`; `TYPE_NAMES` and `NATURE_NAMES` use it.
- `test/data/official-names.test.ts` reads registered species, moves, abilities, items, types and natures in ja and es, and holds that Japanese has no kanji.

## Deviations

- The brief was an outline; it is refined in place.

## Stubs left

- Batch 5 adds ja and es to `SHOWN_LOCALES`, and a language picker.

## Gotchas

- Startup grows by 79.4 KiB gzipped (+6.6%, see `docs/engine/boot.md`), for names no player can see yet.
- The generated files carry a header saying not to edit them. Change the English or the script, then rerun.
- A new species, move, ability or item the games name needs a rerun of `pnpm official-names`.

## Verification

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0, and no errors in the script).
- `pnpm test`: 5711 passed and 18 timed out under load (743 s). The 12 files with timeouts pass together, and `tera-sites` passes alone, as `GOAL.md` warns. `yaml-mapper` and `cave` run no slower alone than on main.
