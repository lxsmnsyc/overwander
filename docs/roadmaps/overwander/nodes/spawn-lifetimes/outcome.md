# Outcome: spawn-lifetimes

## Built

- Board (`src/game/overworld/board-view.ts`): `buildBoardView` stands the chunk's pokemon from `liveSpawns(chunk, offset, instant)` (`instant` is the `now` argument, else `localNow(offset)`), only for the chunks of `boardChunks`. A chunk needs no window record for its spawns: with or without one, they stand. A slot is drawn when it is the rare slot, or below `overworld.checkSpawnCount(SLOT_COUNT)`, or already shown. The shown-lure memory is now per spawn id (`shown`: id to the cycle end and the cycle's snapshot), cleared as cycles end. The fled hide uses `spawnKey(x, y, roll window, individualValue)` with the roll window of the cycle start, so it matches what `deriveEncounter` writes. `deriveShiny` reads the cycle's own snapshot (the one the server stages with). The pressed cell's snapshot comes from `at`, which falls back to the spawn's chunk snapshot for a chunk with no window. `runningWindows` stays and still drops expired windows (for caches, phenomena and the rest), no longer the pokemon.
- Time (`src/game/overworld/windows.ts`): new `nextSpawnEdge(chunks, now)` (soonest cycle start or end after `now`, from `cycleOf` of the current and next cycle of every slot) and an `awaitEdge` timer that sets `live` to a new map at that edge plus 20 ms, then re-arms. It re-arms when the watched chunks change (`follow`) and is cleared on dispose.
- Server: `meetSpawn(uid, x, y, spawnId, now, offset, depth, cell, individualValue)` (`src/server/overworld/spawns.ts`) derives the chunk, calls `checkMeeting(chunk, zone, id, individualValue, cell, toLocalTime(now, zone))`, builds `new ChunkSnapshot(chunk, live.cycle.start, zone)` and stages with `{ cell }` (the pressed cell). It no longer reads `snapshot_spawns` or `resolveSnapshot`. `meetSpawnOnServer` and the client `startEncounter(snapshot, spawn, cell, individualValue)` in `src/auth/snapshots.ts` check the two new arguments with `CELL` and `INT32` (`INT32` is now exported from `src/server/validate.ts`). `interact.ts` passes `spot.cell` and `spawn.spawn[1]`.
- Teaser (`world-scene.tsx`): the windows no longer carry rolls (`spawns: []`); the board derives the pokemon at the fixed `props.now`.
- Tests: `test/overworld/board-view.test.ts` rewritten (two clients agree, no window needed, cave versus ground ids, leaves at cycle end and the slot's next id after the rest, fled hidden for that player only, lure extras kept for their cycle, `runningWindows`), `world/world-buddies.test.ts` (slot constants equal the lure engine's figures), `test/fuzz/world/meetings.fuzz.ts` (the three spawn properties run on `liveSpawns`, plus a `checkMeeting` accept and a wrong-value refusal; the country-of-the-cell property is kept).
- Docs: `docs/mechanics/world-time.md` (the 5 minute row is now a slot cycle of 5.5 minutes) and `docs/mechanics/encounters.md` (opening and "How many appear").

## Deviations

- `ChunkSnapshot.getSpawns`, `getSpawnAt` and `getSpawnCells` all stayed. The window publisher (`resolveSnapshotWindow`) still calls `getSpawns` (it refuses a window with no rolls), and `chunk-snapshot.test.ts`, `portal-balancing.test.ts`, `world-chunks.test.ts` still pin the old placement rules through them. Nothing in `src` reads `getSpawnAt` or `getSpawnCells` outside those; they go with the table.
- `PUBLISHED_SPAWNS` stays (the publisher and `windows.ts` `visitChunkWindow` use it), so `world-buddies.test.ts` keeps its assertion.
- Touched outside owned and shared paths, minimally: `src/server/validate.ts` (export `INT32`, as the brief allows), `src/game/overworld/interact.ts` (pass the two new arguments), `test/overworld/board-window.test.ts` (one assertion: with no window the board now still draws pokemon, from the clock). `src/server/overworld/claims.ts` and `safari/index.ts` and `chunk-snapshot.ts` untouched.
- `test/overworld/world/chunk-snapshot.test.ts`, `world-windows.test.ts`, `portal-balancing.test.ts`, `world-chunks.test.ts` needed no change: they test the old roll, which still exists.
- No DB-backed server test was run (`pnpm test:db` is left to the reviewer); the check logic itself (`checkMeeting`) is covered by `spawn-life.test.ts` and the fuzz property.
- `docs/mechanics/spawning.md` (not owned) still says "a cycle never runs past the end of the local hour", which is contract v1; v2 lets a cycle cross the hour where its ground stays open. The orchestrator should update that line.

## Stubs left

- Position is the start cell: `checkMeeting` has `findCellAt` returning `home`. `spawn-roaming` replaces it with `positionAt`, widens `staysOpen`, and must make `nextSpawnEdge` also follow roaming only if it adds new edges (it does not: positions do not change existence).
- `spawn-radius` fades are not here; `LiveSpawn.cycle` is not on the board's spawn record yet (`BoardView.spawns` values hold `id`, `spawn`, `shiny`, `female`). Add `cycle` and `home` to that value when fades need them.

## Gotchas

- Follow-up: dropping `snapshot_spawns` and the old roll (`getSpawns`, `getSpawnCells`, `getSpawnAt`, `PUBLISHED_SPAWNS`, `asSpawnRolls`, the publisher's rolls) is now possible and needs a migration, so it was not done. The window row is still written and read (`existing.spawns.length > 0` in `resolveSnapshotWindow`).
- A press needs no window: the server derives everything. The board draws pokemon in a chunk before its window lands, and `at` returns the chunk's derived snapshot for such a cell.
- The board is rebuilt at every cycle edge: with 12 slots over about 4 board chunks that is an edge every few seconds. The rebuild is the same one a step makes; if profiling shows it hurts, make `nextSpawnEdge` skip edges of slots whose home is outside `BOARD_RADIUS`.
- The `shown` memory is module state like before, keyed by spawn id, so tests that rely on it must use fresh times.
- Fled keys written before this build match nothing and are swept within the hour (contract).

## Proposed learnings

- A board-built spawn id is the server's meeting id, and the server re-derives it from the clock: never add a spawn source the server cannot derive | the check refuses anything it cannot roll | src/game/overworld, src/server/overworld | yes (the meetings fuzz and `spawn-life.test.ts`)

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm exec oxfmt src test`: applied.
- `pnpm exec vitest run test/overworld`: all passed (tera-sites and spawn-life timed out once under load and passed alone).
- `pnpm fuzz`: 15 passed.

## Size

- Estimated L, actual L.
