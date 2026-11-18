---
id: shiny-dex
title: Shiny dex
status: todo
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
verify: pnpm exec vitest run test/model/pokedex.test.ts test/components
gate: false
added: 2026-11-03
owns:
  - src/components/dex/**
  - src/model/pokedex-record.ts
  - test/model/pokedex.test.ts
shared:
  - src/game/session/index.ts
  - src/components/app/game-context.tsx
  - src/i18n/messages/en.json
  - src/i18n/messages/ja.json
  - src/i18n/messages/es.json
reserves: []
provides: []
depends_on:
  - on: ui-redesign-box-dex-bag
    kind: hard
    why: Rebuilt the dex screen this node adds a mode to (PokedexTab, PokedexGrid, rail), so it builds on the new components
---

# Shiny dex

## Goal

A shiny dex beside the regular one: the same dex grid read by shiny coats seen and caught, with its own counts per region, so collecting shinies has a place to show progress.

## Context

- Source: user request, 2026-11-03.
- The record already holds what is needed and nothing on the server changes. `pokedex_entries` keeps `seen_shiny` and `caught_shiny` beside the ordinary counts; `PokedexView` (`src/auth/pokedex.ts:21`) returns `seen` and `caught` as `DexTally[]` each with `regular`, `shiny` and `total` (`src/model/pokedex-record.ts:61`). `hasCaughtShiny` exists. `countDexSpecies` counts base forms (`:152`).
- The dex screen is `src/components/dex/PokedexTab.tsx` (rebuilt by `ui-redesign-box-dex-bag`): a rail with two `CountTile`s and one `regions()` chip per region (with the gold star for a fully caught region), the `Segmented` all / caught / missing filter, a pager and `PokedexGrid` (squares in three states: caught, seen as `SILHOUETTE`, unmet). Rows are one per base form (`getBaseForms`); a row with forms opens `SpeciesFormsDialog` through `game.setDexForms` (session store `dexForms`, `src/game/session/index.ts:51`).
- `AnimatedSprite` takes a `shiny` prop (`src/components/sprites/AnimatedSprite.tsx:445`).
- Skills: `app-logic` (the mode is session state, not component state, so the forms dialog sees it), `resource-suspense`, `paged-lists` (the grid already pages at 30), `grid-cards`. Strings go in the three message files; decide and write the ja and es wording yourself.

## Decisions

Made by the planner so the maintainer can review them. Change here before the worker starts.

- **No award or title for a finished region.** The regular dex medal chain (`regions.yaml` `medal`, `AwardRegion` shelf) needs new award ids, colours, art slots and three locales of text per region, and the awards are granted by the server. The progress bar and the existing gold star on a region's chip carry the same meaning at no schema cost. In shiny mode the star shows for a region with every row's shiny caught. Awards can follow as their own node if wanted.
- **A toggle, not a tab.** `PokedexTab` is one screen already full (rail, search, filter, pager, grid), and the shiny dex is the same grid read through a different lens. A two-option `Segmented` (Regular, Shiny) sits at the top of the rail, above the two count tiles. On a phone the rail is a chip row, so it sits above that row.
- **Forms count as in the regular dex.** One row per base form, lit from any of its forms, exactly the rule the dex counts by (`countDexSpecies`: an Unown B and an Unown Q fill one row). Pressing a row with forms opens the forms dialog, which follows the mode and lights each form by its own shiny status.
- **Squares in shiny mode.** Caught shiny: drawn in the shiny coat. Seen shiny, not caught: silhouette. Anything else: unmet (a plain blank square, even if the ordinary one is caught, so the gaps are the shinies still to find). Names of unmet squares stay hidden as today.
- **Counts.** The two rail tiles read "shiny seen" and "shiny caught" in this mode (species counted by base form). Each region chip shows seen/total and the caught bar from shiny data. Search and the all, caught, missing filter keep working on the shiny state.
- **The dex entry dialog is unchanged.** It already says whether a shiny was caught (`SpeciesDexEntry.shiny`). Pressing a square opens the same entry.
- **The mode is remembered for the session only**, as a new `dexShiny` store in `src/game/session/index.ts` and `game-context.tsx`, like `dexForms`. It is not a device setting.

## Steps

- [ ] `pokedex-record.ts`: `countDexShinySpecies(dex, spec)` counting base forms with any shiny in the tally, and a per-species `hasSeenShiny`. Tests in `test/model/pokedex.test.ts` (forms roll up, a shiny caught but never seen counts as seen, zero stays zero).
- [ ] Session store `dexShiny`, exposed through `useGame()`.
- [ ] `PokedexTab.tsx`: the `Segmented` mode, entries built from shiny flags in shiny mode, the region tallies and tiles from shiny data, the star rule. Keep the file readable: if it grows past reading in one sitting, split per the `component-layout` skill.
- [ ] `PokedexGrid.tsx`: a `shiny` flag on `DexEntry` (or the grid) that draws the caught square in the shiny coat.
- [ ] `SpeciesFormsDialog.tsx`: read the mode, light forms by shiny, draw the shiny coat.
- [ ] Strings in en, ja, es, and a changeset only if the repo uses one for this kind of change (check `.changeset`).

## Acceptance

- [ ] With a dex that holds a caught shiny Gyarados and a seen-only shiny Pidgey, shiny mode shows the first as caught in its shiny coat, the second as a silhouette, and a regular-caught Pidgey in any other state as unmet. Counts and region tallies match (a component test or a test on the pure entry builder).
- [ ] A region where every row has a caught shiny shows the star; one short by a row does not.
- [ ] Switching the mode keeps the search text and the page sensible (the page clamps, as it does when a filter narrows the list).
- [ ] The regular mode is unchanged (existing tests pass).
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above.

## Sizing

M: uncertainty low (the data is already there), blast radius low to medium (one screen, one session store, three message files), verifiability medium (pure logic is tested, the look is checked by eye in `pnpm dev`).

## Notes for the worker

- Stop any `pnpm dev` you start once the check is done.
- A stale `shiny` answer in a resource keeps its last value while reloading: read it in a child of the `Suspense`, as `PokedexTab` does today.
- `getBaseFormSpecies` rolls a form up to its row. Reuse it for the shiny sets as the regular builder does.
