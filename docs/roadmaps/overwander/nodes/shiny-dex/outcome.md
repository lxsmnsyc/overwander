# Outcome: shiny-dex

## Built

- A Regular / Shiny `Segmented` at the top of the dex rail (`PokedexTab.tsx`). The mode is session state: `dexShiny` in `src/game/session/index.ts`, exposed as `game.dexShiny()` and `game.setDexShiny()` in `game-context.tsx`.
- `src/components/dex/dex-entries.ts` (new): `buildDexEntries(view, mode)`, `readDexFlags(view, mode, forms)` and the `DexMode` type. Shiny mode: a caught shiny is caught, a shiny seen or caught counts as seen, anything else is unmet. Rows are one per base form.
- `src/model/pokedex-record.ts`: `countDexShinySpecies`, `hasSeenShiny`, `listShinySpecies`.
- `PokedexGrid.tsx`: `DexEntry.shiny` draws a caught square in the shiny coat. `SpeciesFormsDialog.tsx` reads the mode and lights each form by its own shiny tally.
- Rail tiles read "Shiny seen" and "Shiny caught", region chips, bars and the gold star come from the shiny rows, search and the filter work on shiny state, and the page clamps as before.
- New strings in en, ja and es: `dex_mode`, `dex_mode_regular`, `dex_mode_shiny`, `dex_tile_seen_shiny`, `dex_tile_caught_shiny`. Changeset `.changeset/shiny-dex.md` (minor).
- Tests: `test/model/pokedex.test.ts` covers the shiny counts, seen-from-caught, forms rolling up, and the entry builder (caught shiny Gyarados, seen-only shiny Pidgey, ordinary caught Rattata unmet).

## Deviations

- Files outside owned and shared paths: `.changeset/shiny-dex.md` (the brief says to add one if the repo uses them) and `src/components/dex/dex-entries.ts` is inside the owned folder. Nothing else.
- The tile label reserves two lines from `md` up (`md:min-h-[2lh]`), so regular mode's two tiles are one line taller than before on desktop. Without it the content below jumped 16px on each toggle.
- The star rule needed no code: it already reads `caught === total` from the tallies, which are now the shiny ones in shiny mode. It is covered by the builder test only indirectly (no region test).

## Stubs left

- None.

## Gotchas

- `readDexFlags(view, mode, forms)`: `forms` true reads each form by its own species (forms dialog), false rolls up to the base form (dex rows).
- A shiny seen is `seenShiny` in the stored record; a shiny owned counts as seen.
- The existing `pnpm db` stash named "dex work" in `git stash list` is not from this node.

## Proposed learnings

- None.

## Verification

- `pnpm typecheck`: exit 0.
- `pnpm exec oxlint src test` (via rtk proxy): exit 0.
- `pnpm exec vitest run test/model/pokedex.test.ts test/components test/i18n`: 17 files, 114 tests passed.
- Screenshots, desktop 1280x800 and phone 390x844, regular, shiny and the shiny forms dialog, in `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/64e7c105-d344-485c-a0e4-bca78a4b9b7d/scratchpad/shiny-dex/`: `desktop-regular.png`, `desktop-shiny.png`, `desktop-shiny-forms.png`, `phone-regular.png`, `phone-shiny.png`, `phone-shiny-forms.png`. Each looked at; no crop, stretch or repeat found. Dev server stopped; the dev database container was already running and was left as it was.

## Size

- Estimated M, actual M.

## Landed

- Commit `996224263` on `batch/overwander`. Fresh review clean. Nits left: the count tiles reserve a second label line in regular mode too; the legend keeps its regular wording in shiny mode. The maintainer kept the forms mark as it is.
