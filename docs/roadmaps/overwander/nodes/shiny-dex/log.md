# Log: shiny-dex

- Branch feat/shiny-dex from batch/overwander. Nothing of the node existed beforehand.
- Pure logic first: `listShinySpecies`, `hasSeenShiny`, `countDexShinySpecies` in pokedex-record.ts; `buildDexEntries` and `readDexFlags` in the new `components/dex/dex-entries.ts` (keeps PokedexTab short).
- Session store `dexShiny` and `useGame()` accessors; grid draws the shiny coat; forms dialog follows the mode.
- Strings dex_mode, dex_mode_regular, dex_mode_shiny, dex_tile_seen_shiny, dex_tile_caught_shiny in en, ja, es.
- Screenshots against `pnpm dev` and the dev database (alice, dex staged by SQL). The shiny tile labels wrap to two lines in the rail, so the label reserves two lines from md up to stop the content below shifting on a toggle.
