# Outcome: spawn-lifetimes-core

## Built

- `src/overworld/spawn-life/index.ts`: constants `SLOT_COUNT` 8, `LURE_SLOTS` 3, `RARE_SLOT` 11, `SLOT_TOTAL` 12, `SLOT_PERIOD`, `PRESENT_MIN`, `PRESENT_MAX`, `MIN_STAY`, `HOUR`, `MEET_DRIFT_MS`, `MEET_DRIFT_CELLS`, `RARE_ODDS_SCALE`; types `SlotKind`, `SlotCycle`, `LiveSpawn`. Only `import type` of `Spawn`. The roaming and fade constants (`WAYPOINT_MS`, `LEASH_CELLS`, `DRAW_RADIUS`, fades and the rest) are not added: `spawn-radius` and `spawn-roaming` add theirs.
- `src/overworld/spawn-life/lifetimes.ts`: `slotPhase`, `cycleOf(chunk, offset, slot, cycle)`, `cycleAt(chunk, offset, slot, time)` (both take the chunk and zone now, since a cycle's end reads the hour's closed cells; `slotPhase` still takes the chunk key), `staysOpen(nextGround, home)` (the roaming hook), `getSpawnGround` (returns `SpawnGround { kinds, territories, closed }`, memo per chunk key and hour), `rollSlot` (memo per spawn id), `liveSpawns`, `parseSpawnId` (refuses any id that does not read back as the exact string `spawnId` writes, such as `#07` or `@-0#3`), `checkMeeting(chunk, offset, id, individualValue, cell, localNow)`. Memos are cleared when they pass 2048 entries, so a memoised `LiveSpawn` is equal but not always identical across calls: compare with `toEqual`.
- `src/data/biome/__create.ts`, re-exported by `index.ts`: `commonSpawn(groups, random)` (fixed bands removed, then `pickSpawn`) and `rareSpawn(groups, random, scale)` (fixed bands only at `scale` times their odds, null on a miss).
- `src/overworld/chunk-snapshot.ts`: new public `getClosedCells()` (the occupied set `getSpawns` built inline) and `finishSpawn(species, rng)` (shore form, wing pattern, seasonal coat, individual value, trait value, rare shape), both used by `getSpawns`; `getStreetPool` is now public. `getSpawns` draws in the same order as before.
- `test/overworld/spawn-life.test.ts` and its snapshot `test/overworld/__snapshots__/spawn-life.test.ts.snap` (the pinned list for chunk (0,0), zone 0, one hour).

## Deviations

- A street slot whose territory is empty (more street slots than street cells) becomes a country or lure slot (`kinds` shows it) and deals from the country list, so it rolls the cell pool, not the town pool. The contract says only "falls back to the country list".
- `finishSpawn` applies the shore form, wing pattern and coat to street rolls too (contract step 6 says so); the old `getSpawns` street branch did not, and still does not.
- Contract v2 (the maintainer's decision on the change request) is implemented: a cycle that runs past the next hour mark keeps its full length when its start cell is open in that hour's closed-cell set (`getSpawnGround(chunk, offset, mark).closed`), and otherwise ends at the mark. Species, values and coat stay as rolled at the start. A kept cycle is not part of the next hour's territories. The mean live fraction is back within 2 percent of 0.727 (tested).
- `chunk-snapshot.ts` and the biome files are listed as shared, so nothing is outside owned or shared paths.

## Stubs left

- `checkMeeting` uses a local `findCellAt` that returns the start cell. `spawn-roaming` replaces it with `positionAt`.
- Nothing calls these functions yet. `spawn-lifetimes` moves the board, `meetSpawn`, snapshots, the teaser and the docs over.

## Gotchas

- Hook for `spawn-roaming`: `staysOpen(next, home)` in `lifetimes.ts` is the one place a cycle's ground is tested against the next hour. Widen it from the start cell to every cell of the roam area (`next.closed` is the set to test). `openCycle` calls it; nothing else needs to change, and `liveSpawns` and `checkMeeting` follow through `cycleOf`.
- `cycleOf` now computes the ground of the start hour and the start cell (the draw after the present length), so it needs the chunk. The draw order is unchanged.
- `rollSlot` builds `new ChunkSnapshot(chunk, cycle.start, offset)`, which floors to 5 minutes, so a cycle's pool, season and weather come from that window. A meeting's `spawnKey` timestamp is `start` floored to `SNAPSHOT_INTERVAL`.
- `getSpawnGround` reads the closed cells from a snapshot of the hour start, so the hour's phenomena are the ones holding ground.
- `rareSpawn` takes the pool from `getCellPool(home)`, so a dark day's true shadows (special band) are reachable in the rare slot.
- The draw order inside a cycle is: present length, start cell, `commonSpawn` or `rareSpawn` draws, individual value, trait value. The snapshot test pins it.
- `Chunk.seed` already holds the layer (`overworld(x, y)` against `overworld cave(x, y)`), so caves get their own slots with no extra code.

## Proposed learnings

- A cycle's draw order is frozen once released; the snapshot list in `spawn-life.test.ts` is the pin | a changed order must be a decision | src/overworld/spawn-life | yes

## Verification

- `pnpm typecheck`: exit 0.
- `pnpm exec oxlint src test` (read by exit code): 0.
- `pnpm exec oxfmt --check src test`: clean.
- `pnpm exec vitest run test/overworld/spawn-life.test.ts test/overworld/generation-fingerprint.test.ts test/overworld/world/chunk-snapshot.test.ts`: 48 passed.

## Size

- Estimated M, actual M.

## Landed

- Commit `cb739c945` on `batch/overwander`, after two fresh review rounds (clean). Contract bumped to v2 (crossing the hour); `cycleOf` and `cycleAt` take the chunk and offset.
- Nits left: `openCycle` builds the next hour's ground (a snapshot with phenomena) for crossing cycles, memoised per hour; `findCellAt` keeps an unused `_time` for `positionAt`.
