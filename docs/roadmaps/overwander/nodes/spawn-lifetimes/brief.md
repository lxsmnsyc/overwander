---
id: spawn-lifetimes
title: Staggered spawn lifetimes and caps
status: done
spent: 216237
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
verify: pnpm exec vitest run test/overworld && pnpm fuzz
gate: false
added: 2026-10-26
owns:
  - src/game/overworld/board-view.ts
  - src/game/overworld/windows.ts
  - src/game/overworld/board-metrics.ts
  - src/server/overworld/spawns.ts
  - src/auth/snapshots.ts
  - src/model/snapshot-record.ts
  - src/components/demo/teaser/world-scene.tsx
  - test/overworld/board-view.test.ts
  - test/overworld/world/world-buddies.test.ts
  - test/fuzz/world/meetings.fuzz.ts
  - docs/mechanics/world-time.md
  - docs/mechanics/encounters.md
shared:
  - src/overworld/chunk-snapshot.ts
  - src/overworld/safari/index.ts
  - src/server/overworld/claims.ts
reserves: []
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
  - on: spawn-lifetimes-core
    kind: hard
    why: Calls rollSlot, liveSpawns and checkMeeting, which that node builds
  - on: meetings-cell-biome
    kind: hard
    why: Both rewrite the meetSpawn call path in src/server/overworld/spawns.ts and the encounter's cell, and that fix is the smaller one
---

# Staggered spawn lifetimes and caps

## Goal

Each wild pokemon appears and leaves on its own clock under the chunk's cap, and a caught or fled pokemon's place fills again after a respawn delay, replacing the whole set turning over every 5 minutes. The board, the server check, the teaser and the docs all read the derived slots from `spawn-lifetimes-core`.

## Context

- Read `contracts/spawn-life.md` (frozen), the outcome of `spawn-life-design`, and the outcome of `spawn-lifetimes-core` once it exists. Skills: `server-function-order`, `server-function-validation`, `server-reads`, `world-generation`, `app-logic`.
- Split: the pure half moved to `spawn-lifetimes-core`. This node is the wiring.
- Board: `buildBoardView` (`src/game/overworld/board-view.ts:272`) takes a published window per chunk (`records`), calls `snapshot.getSpawns(PUBLISHED_SPAWNS)` (`:372`), and pairs the nth placed cell with the nth stored roll (`:394-460`) behind `everShown` (`:231`). It drops a chunk's spawns when the window has run out (`runningWindows`, `:250`). Replace this with `liveSpawns(chunk, offset, now)`, filtered by `overworld.checkSpawnCount(SLOT_COUNT)` (contract: "Lures") and by the fled set (`spawnKey` unchanged).
- Time: the board is built per step, but spawns now come and go on their own clocks. Decide how the view stays right: for example the view carries each live spawn's cycle, and the game store rebuilds the board at the next cycle edge (soonest start or end) with a timer next to the existing refresh timers in `src/game/overworld/windows.ts`. Read time only through `localNow(zone)` (`src/auth/clock.ts:76`).
- Server: `meetSpawn` (`src/server/overworld/spawns.ts:73`) and its wrapper `meetSpawnOnServer` (`src/auth/snapshots.ts:683`). New arguments `cell` and `individualValue`, each checked with `check` (add schemas in `src/server/validate.ts` if missing). The call to `checkMeeting` replaces the stored-window lookup. Follow `server-function-order` exactly (new parameters change the function's address; the build guard).
- Stored window: `snapshot_spawns` keeps being written (contract, decision 3). `src/auth/snapshots.ts:95-160` still publishes `PUBLISHED_SPAWNS` rolls from `getSpawns`; leave that as is, so the window row is unchanged. The contract's callers list says snapshots.ts "stops rolling spawns"; the decisions section says it keeps writing. Follow the decisions section and note the follow-up (dropping the table) in `outcome.md`.
- Other callers of the old ids: `src/server/caught.ts`, `throws.ts`, `encounter-io.ts`, `stops.ts`, `raids/reward.ts` take a spawn id as an opaque string. `encounterWindow` (`src/overworld/safari/index.ts:505`) reads the roll window off the key and stays.
- Tests that build spawn ids from window indices move to cycle starts: `test/overworld/board-view.test.ts`, `world/world-buddies.test.ts` (`PUBLISHED_SPAWNS`, `checkSpawnCount`), `world/chunk-snapshot.test.ts`, `world-windows.test.ts`, `portal-balancing.test.ts`, `world-chunks.test.ts`, and the fuzz test `test/fuzz/world/meetings.fuzz.ts`. Grep `getSpawns|getSpawnCells|getSpawnAt|PUBLISHED_SPAWNS|spawnId`.
- The teaser (`src/components/demo/teaser/world-scene.tsx:83`) moves to `liveSpawns` at a fixed time.

## Steps

- [x] Board: build spawns from `liveSpawns`, keep the shown-lure memory (`everShown`, keyed by spawn id), keep the fled hide, keep `deriveShiny` per spawn.
- [x] Time: rebuild the board at cycle edges.
- [x] Server and client: new `meetSpawn` arguments and `checkMeeting`.
- [x] Remove `ChunkSnapshot.getSpawns`, `getSpawnAt` and `getSpawnCells` once nothing reads them (the publisher in `snapshots.ts` still needs `getSpawns`, so it stays until the table goes). Say which stayed.
- [x] Teaser and tests as above. Docs: the 5 minute row of `docs/mechanics/world-time.md` and the opening of `docs/mechanics/encounters.md` (contract, "Docs the build node updates").

## Acceptance

- [x] Two clients at one instant derive the same pokemon on the same cells, and a spawn leaves at its cycle end and a new one arrives after its rest (a board-view test that steps `now` across a cycle edge).
- [x] The server refuses a meeting outside the cycle, with a wrong individual value, a wrong slot and a wrong cell, and accepts one inside the 1 s and 1 cell allowance (`pnpm test:db` for the server path, one suite at a time).
- [x] A fled or caught pokemon is hidden for that player until its cycle ends, then the slot's next pokemon shows (new key).
- [x] `docs/mechanics/world-time.md` and `encounters.md` match the new behaviour.
- [x] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then `pnpm exec vitest run test/overworld`, then `pnpm fuzz` for the meetings property.

## Sizing

L: coupling medium to high (board, server function, store timers, teaser, six test files), blast radius high (the meeting path every encounter goes through), context load high. Not XL because the roll and the check come prebuilt and tested from `spawn-lifetimes-core`.

## Notes for the worker

- `pnpm test:db` and `pnpm test:e2e` never run together. Never touch the `db` service on 54322.
- The first load of the new build replaces every chunk's pokemon at once (contract: "What changes for existing players"). No migration of spawns. Encounters already staged keep their id.
- Tests in `test/fuzz/world/meetings.fuzz.ts` use the old window ids; move them to the derived ids and keep the property that a meeting records the country of its cell (that is `meetings-cell-biome`, done before this).
