# Outcome: spawn-roaming

## Built

- `src/overworld/spawn-life/roam.ts`: `getRoamArea(chunk, offset, live)` (flood fill from the start cell, 8 neighbours with no corner cutting, leash `LEASH_CELLS` 4 or `TOWN_LEASH_CELLS` 2, closed cells of the start hour, `fitsSurface` per cell, streets for a street slot and country otherwise, clipped to the chunk, memoised per chunk key, hour, home, habitat and kind), `positionAt(area, live, time)` (returns `{ cell, dx, dy, heading, moving, walked }`; cell is the nearest one, dx and dy the offset from its middle), `getHourClosed`, and the constants `WAYPOINT_MS`, `LEASH_CELLS`, `TOWN_LEASH_CELLS`, `STEP_MS`, `WALK_DELAY_MAX`. Walk draws use `${chunkKey}slot${slot}cycle${cycle}walk${epoch}` (target, then delay). No `world.draws`.
- `lifetimes.ts`: `staysOpen(next, area: number[])` now tests every cell of the roam area. A cycle's start roll is made before its end (`rollStart`, memo per spawn id), since the area needs the species. `checkMeeting` uses `positionAt` at `local` and `local - MEET_DRIFT_MS` (1 cell drift kept). `getSpawnGround` reads the closed set through `getHourClosed`.
- `src/canvas/overworld/chunk-view/spawn-walk.ts`: `SpawnWalk`, `SpawnStep`, `stepSpawn(walk, now)` (board cell, fractional x and y, facing, moving, walked).
- Board: `BoardSpawn.walk`; `findSpawnAt(view, index, now)` in `board-view.ts` resolves a press against positions at `now` and 250 ms earlier (lower slot first); used by `interact.ts` and the hover title in `board.tsx`. `SpawnCoat.walk` carries the step into the canvas. Two pokemon on one start cell take keys `seat`, `seat + BOARD_COUNT`, ...; the chunk view places by `walk`, the teaser skips the extra.
- `chunk-view/index.ts`: `placeSpawns()` places every coat per frame; the standing order, rings and seals, sprite, shadow, sparkle and herald follow the current cell and the sub-cell offset. A walking pokemon plays Walk facing its step, a standing one Idle facing its last step (its old seeded facing before the first). Redraws start when a pokemon starts, stops or changes cell.
- `species-sprite-animation.ts`: `seek(ms)`, so pokemon sharing one sheet play at their own moment of the clip.
- Tests: `test/overworld/spawn-roam.test.ts` (area leash, closed cells, water and ground species, towns, positions inside the area and one cell apart, walks end inside the epoch, order independence, `checkMeeting` accept and refuse, `findSpawnAt`).

## Deviations

- Constants are in `roam.ts`, not `spawn-life/index.ts` (not an owned or shared path).
- Roamers use their own chunk-local step rule, not `canStep`, which works on the board grid. The closed set already holds every cliff face, so a roamer never crosses a terrace step, not even a seamed face a player can walk (contract decision 8 allowed ramps; left out as the draws stay simple).
- Outside owned and shared paths, kept small: `src/canvas/overworld/scenery.ts` (one optional field), `src/canvas/sprites/species-sprite-animation.ts` (`seek`), `src/game/overworld/interact.ts`, `src/components/overworld/overworld-tab/board.tsx`, `src/components/demo/teaser/world-scene.tsx` (skip a second pokemon on one cell), `test/overworld/spawn-life.test.ts` (crossing test asks the roam area; the server-check tests press where the pokemon stands), `test/fuzz/world/meetings.fuzz.ts` (presses at the roamer's cell).
- `getRoamArea` imports nothing from `lifetimes.ts` (a lint cycle rule), so the hour's closed set comes from `getHourClosed` in `roam.ts`, which `getSpawnGround` also uses.
- Fix in `lifetimes.ts` `deal`: a chunk with a few town cells and no street slot crashed `getSpawnGround`; it now deals nothing.
- The manual `pnpm dev` pass was not done (no browser driven). The draw code is untested by eye.
- `docs/mechanics/spawning.md` unchanged: no number changed.

## Stubs left

- None.

## Gotchas

- `positionAt` heading is null until a pokemon has taken a step; the chunk view then uses its old seeded facing.
- A roamer is drawn off its cell by up to half a cell; its shadow and the veil key follow the cell's depth, the sprite follows the offset.
- A kept cycle's whole area must be open in the next hour, so `cycleOf` now rolls the species for any cycle that crosses an hour mark (memoised).
- Rings and seals of featured and ranked spawns hop cell to cell with the pokemon.
- `nextSpawnEdge` is unchanged: positions add no cycle edges.

## Proposed learnings

- A position the server checks is read through `positionAt` on both sides, never from a cell kept on the spawn | the client and server must agree on where it stands | src/game/overworld, src/server/overworld | yes (spawn-roam.test.ts)

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm exec oxfmt src test`: applied.
- `pnpm exec vitest run test/overworld/spawn-roam.test.ts test/overworld/spawn-life.test.ts test/overworld/generation-fingerprint.test.ts test/overworld/board-view.test.ts test/overworld/board-window.test.ts test/game`: 89 passed.
- `pnpm fuzz`: 15 passed.

## Size

- Estimated L, actual L.

## Landed

- Commit `61886ffe0` on `batch/overwander`. Fresh review clean. The orchestrator trimmed the hour-crossing test to one day (it timed out under full load). Not looked at in a browser.
- Nits left: no regression test for the `deal` fix; `placeSpawns` runs twice a frame and `findHeading` re-derives up to 7 routes; roamers never change terrace level, stricter than contract decision 8.
