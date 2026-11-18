# Outcome: meetings-cell-biome

## Built

- `EncounterOptions.cell` (`src/overworld/encounter/index.ts`): `deriveEncounter` records `snapshot.biomeAt(cell)` when a cell is named (`biome` still wins, for Beyond and the mythical).
- `stageEncounter` and `startEncounter` take `StagedOptions` (`cell: number | null`, required), so a staged meeting cannot leave the cell out. Gifts and the level-bounds property pass null.
- Callers now name their cell: `meetSpawn` (the spawn's cell read off `getSpawnCells` by index), honey trees, phenomena, Rocket stop rewards (`record.cell`), raid prizes (`raid.cell`), fossils, the trader (`deriveTraderPokemon(snapshot, cell, spawn, uid)`), nest eggs and bred eggs. `writeEgg` writes `origin_biome` from `snapshot.biomeAt(fields.cell)` (new required `EggFields.cell`); `grantBredEgg` takes the cell after the snapshot.
- `test/fuzz/world/meetings.fuzz.ts`: the `(not yet)` check is now `fc.assert`; a sibling property covers raid prizes at a lair's cell; the other staging properties pass the cell.
- No migration: stored rows keep what they say.

## Proof

- base: `35bd5135f`, `pnpm fuzz test/fuzz/world/meetings.fuzz.ts -t country`: fails, `expected 15 to be 16` (recorded biome vs the cell's country).
- branch: `pnpm fuzz`: 15 passed (the same property under `fc.assert`).

## Deviations

- Touched files outside the owned paths, minimally, to pass the cell through: `src/server/npcs/breeder.ts` (pass `cell` to `grantBredEgg`), `src/server/npcs/trader.ts` and `src/overworld/npcs/trader/interact.ts` (pass the cell to `deriveTraderPokemon`).
- `src/overworld/stop/index.ts` (`createStopSnapshot`, a battle party, no stored meeting) is unchanged and still reads the chunk's middle; its biome is not written to a row.

## Stubs left

- None.

## Gotchas

- Any new caller of `stageEncounter`/`startEncounter` must name `cell` (or null). A direct `deriveEncounter` call still falls back to the chunk's middle when no cell is given.

## Proposed learnings

- A meeting at a cell names that cell, never the chunk's biome | borders cross chunks | src/overworld, src/server | yes (the fuzz property covers spawns and raids)

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm fuzz`: 15 passed.
- `vitest run` on `test/overworld/{eggs,nest-egg,alpha-raid,totem-raid}.test.ts`, `test/overworld/raid`, `test/overworld/encounter`: passed. Full `pnpm test` left to the reviewer.

## Size

- Estimated M, actual M.

## Landed

- Commit `739508a0a` on `batch/overwander`. Fresh review clean; nits left: `src/server/overworld/spawns.ts:127` falls back to the chunk middle when the spawn index is past the cell list, and `deriveEncounter` still falls back to `chunk.biome` without a cell (`src/server/gifts.ts:239`, `src/overworld/stop/index.ts:67`).
- Deviations accepted: `src/server/npcs/breeder.ts`, `src/server/npcs/trader.ts`, `src/overworld/npcs/trader/interact.ts` (callers of changed signatures).
