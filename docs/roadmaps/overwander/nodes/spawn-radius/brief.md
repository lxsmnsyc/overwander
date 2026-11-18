---
id: spawn-radius
title: Spawn radius around the player
status: active
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
verify: pnpm exec vitest run test/game/spawn-radius.test.ts test/overworld/board-view.test.ts
gate: false
added: 2026-10-26
owns:
  - src/game/overworld/spawn-radius.ts
  - test/game/spawn-radius.test.ts
shared:
  - src/game/overworld/board-view.ts
  - src/canvas/overworld/chunk-view/index.ts
reserves: []
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
  - on: spawn-lifetimes
    kind: hard
    why: Fades read the cycle start and end that spawn-lifetimes puts on the board's spawns, and both edit board-view.ts
---

# Spawn radius around the player

## Goal

The player's side of the spawn rules: what is drawn, how pokemon fade in and out, and that none pops up beside the player. Existence never depends on where the player stands, so the "radius" is a draw rule. A pokemon fades in over `FADE_IN_MS` from its start (slower, `FADE_IN_NEAR_MS`, when it starts within `NEAR_RING_CELLS` of the player), fades out over the last `FADE_OUT_MS` of its cycle, and one already standing when its chunk enters the circle is drawn at once.

## Context

- Read `contracts/spawn-life.md` "Draw side and what is per-client" and the "Functions" block for `spawnAlpha` and `isDrawn`. The outline's wording (only chunks within a radius are live) is superseded by the contract: the loaded chunks and `BOARD_RADIUS` do not change. Read the `spawn-lifetimes` outcome for what the board's spawn entries carry.
- Today the board's spawn entries are `{ id, spawn, shiny, female }` per seat (`src/game/overworld/board-view.ts:135`), and the draw loops that place them are in `src/canvas/overworld/chunk-view/index.ts` (the loops over `props.spawns` near lines 3135, 3218 and 3626). The circle is `BOARD_RADIUS` (`src/overworld/board/index.ts:37`) and `reachOf(seat)` in the board builder.
- Time reads only through `localNow(zone)` (`src/auth/clock.ts:76`), which is the client's synced clock. The draw loop reads time per frame, the board is rebuilt per step, so alpha is computed in the draw loop from the cycle on each entry.
- The constants come from `src/overworld/spawn-life/index.ts` (`spawn-lifetimes-core`).
- Skills: `app-logic` (no Solid in `src/game`), `sprite-fps`, `board-modes`.

## Steps

- [ ] `spawn-radius.ts`: `spawnAlpha(live, now, distance)` and `isDrawn(distance)` as in the contract, pure, with unit tests (fade in, near fade in, fade out, already standing, a press during a fade).
- [ ] Mark each board spawn with whether it started inside the near ring (distance to the player when its cycle started, or at first draw if the chunk was not loaded then). Keep the "already standing" case instant.
- [ ] Draw: multiply the sprite's alpha by `spawnAlpha` in the chunk view. A press on a fading spawn still opens it (the server decides).
- [ ] Reduce motion: with the setting on, fades are skipped or shortened like other motion (`device-settings` skill, `src/components/app/settings.ts`).

## Acceptance

- [ ] `spawnAlpha` is 0 at the cycle start, reaches 1 after `FADE_IN_MS` (`FADE_IN_NEAR_MS` inside the near ring), starts falling `FADE_OUT_MS` before the end, and is 1 for a spawn already standing, all in `test/game/spawn-radius.test.ts`.
- [ ] A spawn whose cycle starts beside a walking player is not drawn at full alpha on its first frame (test on the pure function).
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above.

## Sizing

M: one pure module and two small edits in shared files; uncertainty low, verifiability low for the logic and manual for the look.

## Notes for the worker

- From the spawn-lifetimes review: `nextSpawnEdge` in `src/game/overworld/windows.ts` counts edges of hidden lure slots and of spawns homed outside `BOARD_RADIUS`, so the board rebuilds about every 3 to 4 s. Fades add edges of their own, so skip edges nobody draws while you are in there, and measure the rebuild cost.

- Do not change which chunks are loaded or which cells hold a pokemon.
- `spawn-roaming` runs after this and edits the same draw loops. Keep the alpha hook one small function so it merges cleanly.
- Run `pnpm dev` once and watch a spawn arrive and leave. Stop the dev server after the check.
