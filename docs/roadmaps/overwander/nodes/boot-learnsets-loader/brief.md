---
id: boot-learnsets-loader
title: Learn sets on their own loader
status: active
priority: should
type: refactor
outline: false
milestone: next
size: L
spike: false
verify: pnpm exec vitest run test/data test/overworld/world/chunk-snapshot.test.ts test/model/level-moves.test.ts
gate: false
owns:
  - src/data/species/learnsets.ts
  - src/data/species/learnset-store.ts
  - src/data/species/yaml.ts
  - src/data/learnset-data.ts
  - src/components/app/LearnSetData.tsx
  - test/data/learnsets-loader.test.ts
shared:
  - src/data/species/__create.ts
  - src/data/species/index.ts
  - src/data/index.ts
  - src/app.tsx
  - src/data/items/machines.ts
  - src/components/dex/dex-entry-dialog/**
  - src/components/catches/**
  - src/model/level-moves.ts
  - src/model/search/catch/fields.ts
  - docs/engine/boot.md
reserves: []
provides: []
depends_on:
  - on: boot-derive-shiny
    kind: hard
    why: The board stopped needing learn sets only because it reads shininess on its own (done)
  - on: boot-measure
    kind: hard
    why: Reports its before and after in docs/engine/boot.md
---

# Learn sets on their own loader

## Goal

The learn sets (`src/data/species/learnsets/`, 1.4 MB of YAML, most of the `species` startup chunk) leave the first-frame bundle. The browser loads them on demand, behind a gate, as it already does for moves, abilities and items. The server keeps registering everything at import.

## Context

- Source: docs/todo.md (removed, see git history): Platform, Deferring data and runtime at boot.
- The pattern exists: `src/data/battle-data.ts` (memoized dynamic import, `ensureBattleData`, `isBattleDataReady`), `src/components/app/BattleData.tsx` (a Suspense gate), `src/app.tsx` (world registered sync, the rest fetched after first paint), `src/server/game-data.ts` (server takes everything). Copy it for learn sets.
- Today `readSpecies` (`src/data/species/yaml.ts:344-403`) reads the learnset files with the rest and builds `SpeciesData.learnSet` (`src/data/species/__create.ts:240`). The readers are `getLearnableMoves`, `getLevelUpMoves`, `getMovesLearnedAt`, `getMovesLearnedBetween`, `getTeachableMoves`, `getEggMoves`, `getReachableMoves` (`__create.ts:520-620`) and `getSpeciesData(..).learnSet` in `src/data/items/machines.ts:43`.
- Callers (grep `learnSet|getLearnableMoves|getLevelUpMoves|getTeachableMoves|getEggMoves|getReachableMoves|getMovesLearned`): the dex entry (`MoveLists.tsx`, `species-facts.ts`), the catch sheet and reminder through `src/model/level-moves.ts`, catch search (`src/model/search/catch/fields.ts`), `src/overworld/breeding.ts`, `encounter/moves.ts`, `nest-egg.ts`, `field-moves.ts`, `raid/index.ts`, `builds/best-*.ts`, `src/data/overworld/{npc,vendor}.ts` and `experts/gym-leaders.ts` (NPC team building), `src/game/items/use-item.ts`, `src/server/moves.ts`. The battle engine reads none (`src/battle` is not in the list), which is the reason this loads apart from `battle-data`.
- `docs/engine/boot.md` has the baseline and says how to report.
- Skills: `data-yaml`, `resource-suspense`, `app-logic`.

## Steps

- [ ] Run `pnpm build && pnpm measure-boot` and keep the totals. Check in the manifest which chunk holds the learnset YAML and how big.
- [ ] Split reading: `readSpecies` stops requiring learnset files. A new reader in `species/yaml.ts` turns the learnset files into `LearnSetData` per species (keep family teachables and the same validation). The glob for them is lazy (`import.meta.glob(..., { import: 'default' })` without `eager`) in the new loader module `learnsets.ts`, which is only ever imported dynamically.
- [ ] A small static module `learnset-store.ts` holds the map and the accessors (moved out of `__create.ts`, re-exported from `species/index.ts` under the same names, so callers keep their imports). An accessor read before the load throws a clear error naming `ensureLearnSets`.
- [ ] `learnset-data.ts`: `ensureLearnSets()` and `isLearnSetsReady()`, same shape as `battle-data.ts`. `registerGameData` (`src/data/index.ts`) registers learn sets too so the server and tests keep working with one call.
- [ ] `LearnSetData.tsx` gate like `BattleData.tsx`. Put it where a browser reader first runs: the dex entry, the catch sheet and its move reminder and tutor lists, the catch search, the TM and breeding views, and any item use that reads a teachable list. Where a gate already sits (`BattleData` around the dex entry and the sheet), nest or combine so the player sees one loading state.
- [ ] Client code paths that are not a component (trainer and NPC team building at battle start, field moves) await `ensureLearnSets()` before reading. Start the fetch from `app.tsx` after first paint, as `ensureBattleData` is.
- [ ] Tests that read learn sets keep passing through `registerGameData`. Add `test/data/learnsets-loader.test.ts`: the world registers without learn sets, a read before `ensureLearnSets` throws, a read after returns the same lists as the eager path did (spot check a few species and a form).
- [ ] Rebuild, run `pnpm measure-boot`, add the row to the "Changes since the baseline" table in `docs/engine/boot.md`.

## Acceptance

- [ ] After `pnpm build`, the startup set of `pnpm measure-boot` no longer holds the learnset data, and the numbers are in `docs/engine/boot.md` and the PR.
- [ ] The first frame of the main page reads no learn set. Check by loading the page without the gate (a test that registers world data only and builds a board view, or the browser console while walking).
- [ ] The dex entry, the catch sheet, the move tutor and reminder, TMs, breeding and the catch search work in `pnpm dev` after the load (one manual pass, no screenshots needed).
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above.

## Sizing

L: blast radius high (the species registry and about 20 readers), coupling medium, uncertainty medium (which startup path reads a learn set before the load), verifiability medium (a bundle number plus tests).

## Notes for the worker

- `boot-lazy-registries` and `boot-true-shadows-yaml` edit `species/index.ts` and `species/yaml.ts` after this node. Keep the split small and clean.
- Run the whole `pnpm test` once at the end: tests that read a learn set after `registerSpecies()` alone will fail and need `registerGameData` (or the new register call).
- If a reader runs during board derivation on the client (check `deriveEncounter` callers: `stage.ts` runs on the server, `stop/index.ts` and `trader.ts` may not), it needs the await or must move to the server.
