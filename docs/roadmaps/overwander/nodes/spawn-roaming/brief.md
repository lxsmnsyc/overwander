---
id: spawn-roaming
title: Roaming wild pokemon
status: active
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
verify: pnpm exec vitest run test/overworld/spawn-roam.test.ts test/overworld/spawn-life.test.ts
gate: false
added: 2026-10-26
owns:
  - src/overworld/spawn-life/roam.ts
  - src/canvas/overworld/chunk-view/spawn-walk.ts
  - test/overworld/spawn-roam.test.ts
shared:
  - src/overworld/spawn-life/lifetimes.ts
  - src/game/overworld/board-view.ts
  - src/canvas/overworld/chunk-view/index.ts
  - src/overworld/chunk-snapshot.ts
reserves: []
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
  - on: spawn-lifetimes
    kind: hard
    why: A spawn can only move once its identity no longer names its cell, which spawn-lifetimes changes
  - on: spawn-radius
    kind: hard
    why: Both edit the spawn draw loops in chunk-view/index.ts, and walking builds on the fade hook radius adds
---

# Roaming wild pokemon

## Goal

Idle wild pokemon walk a deterministic path within a leash of their home cell, on the surfaces their kind allows, drawn walking on the board. Every client places a pokemon in the same cell at the same moment, and the server checks a meeting against that cell.

## Context

- Read `contracts/spawn-life.md` "Roaming" and the `positionAt` and `getRoamArea` signatures. Read the outcomes of `spawn-lifetimes` and `spawn-radius`. Skills: `spawn-surfaces` (`fitsSurface`), `terraces` (`canStep`), `world-generation` (`AleaRNG` strings only, no `world.draws`), `sprite-fps`, `board-modes`.
- The area uses what the start cell uses: `getSpawnGround` in `lifetimes.ts` (landmarks, decorations, rock, face, lava, the hour's phenomena closed), `chunk.isTownCell(cell)` for towns (`src/overworld/chunk.ts:512`), `getCellSurface`, and `canStep(from, dx, dy, passable)` (`src/overworld/path.ts:75`) for terrace steps.
- `checkMeeting` in `lifetimes.ts` compares the press with `live.home` through a local helper (see `spawn-lifetimes-core`). Replace the helper with `positionAt` and keep the 1 s and 1 cell drift (`MEET_DRIFT_MS`, `MEET_DRIFT_CELLS`). Per contract decision 4, `meetSpawn` itself does not change.
- Board: the board's spawn map is keyed by seat (`board-view.ts:300`), but a roamer changes cell every half second. The board view carries the live spawn and its roam area. The draw loop asks `positionAt(area, live, now)` per frame for the cell and the sub-cell offset (`dx, dy`) and places the sprite there. Pressing resolves the pressed cell against positions at `now` (lower slot first on overlap).
- Sprite: facing and walk frames come from the step direction (`src/canvas/overworld/chunk-view/index.ts`, near the spawn loops at 3135 and 3218). Read the sheets through the `sprite-sheet-layout` skill. Every pokemon sheet animates at 24fps (`sprite-fps`). The pokemon stands still on the idle frame between steps.
- wAthena's idle walk is `randomWalk` and `nextWalk` in `server/zone/monster.go` (reference for the pace and pause).

## Steps

- [ ] `roam.ts`: `getRoamArea` (flood fill, memoized per chunk key, hour, home and habitat) and `positionAt` as in the contract, pure.
- [ ] Tests in `test/overworld/spawn-roam.test.ts` from the contract: every position inside the area, every step one cell, a walk ends inside its epoch, no landmark cell occupied, a water species stays on water, a country slot never enters a town, same answer in two runs.
- [ ] `spawn-walk.ts`: the draw-side walk (cell to pixel, facing, frame) with fades from `spawn-radius`.
- [ ] Wire `checkMeeting` and the press resolution to `positionAt`.
- [ ] Update `docs/mechanics/spawning.md` only if a number changed (it already describes roaming).

## Acceptance

- [ ] The roam tests above pass.
- [ ] `checkMeeting` accepts a press at the roamer's cell at `local`, or within one cell of its position at `local` or `local - 1 s`, and refuses the start cell once the pokemon has walked beyond one cell.
- [ ] In `pnpm dev`, a wild pokemon walks, stops, turns toward its step, and pressing it while it walks opens the meeting (one manual pass, then stop the dev server).
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above, then `pnpm exec vitest run test/overworld/generation-fingerprint.test.ts`.

## Sizing

L: uncertainty medium (path search and per-frame placement are new here), coupling medium (store, draw loops, server check), context high (the draw file is 150 KB, read only the spawn loops).

## Notes for the worker

- Contract v2 (2026-11-18): a cycle crossing an hour mark keeps its length only while its ground stays open. `staysOpen(nextGround, home)` in `src/overworld/spawn-life/lifetimes.ts` tests the start cell today; widen it to every cell of the roam area, so a kept roamer never walks onto a cell the new hour closes.

- The contract fixes the shape: a position is a pure function of the cycle and the time, with no simulation and no chain of waypoints. Do not add state to replay.
- A walk takes at most 4 s plus a 1 s delay inside a 5 s epoch, so it always ends in its epoch. Test that bound.
- The area is clipped to the pokemon's own chunk, so no neighbour chunk is derived to place one.
- A roamer on one cell may overlap another. Do not push either away.
