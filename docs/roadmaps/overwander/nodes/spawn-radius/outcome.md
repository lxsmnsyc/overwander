# Outcome: spawn-radius

## Built

- `src/game/overworld/spawn-radius.ts` (pure, no Solid): `spawnAlpha(live, now, distance, standing = false)`, `isDrawn(distance)`, `wasStanding(cycle, seen)`, `DRAW_RADIUS` (= `BOARD_RADIUS`), `STANDING_AFTER_MS` (= `MEET_DRIFT_MS`), type `SpawnFade { cycle, distance, standing }`. Alpha is the least of rise (`(now - start) / FADE_IN_MS`, or `FADE_IN_NEAR_MS` when `distance <= NEAR_RING_CELLS`; 1 when `standing`), fall (`(end - now) / FADE_OUT_MS`) and 1, floored at 0.
- `src/overworld/spawn-life/index.ts`: `FADE_IN_MS` 600, `FADE_IN_NEAR_MS` 2400, `FADE_OUT_MS` 600, `NEAR_RING_CELLS` 4.
- `src/game/overworld/board-view.ts`: each `BoardView.spawns` value is now the exported `BoardSpawn { id, spawn, shiny, female, fade: SpawnFade }`. The `shown` memory (per spawn id, until the cycle ends) now also holds `distance` (cells from the player when the board first saw it) and `standing` (first seen more than `STANDING_AFTER_MS` after the cycle start, so it is drawn at once). Both are fixed at first sight and survive rebuilds and a walk out of the circle and back. The draw-circle test uses `isDrawn`.
- `src/canvas/overworld/scenery.ts`: `SpawnCoat.alpha?: (now) => number`. `src/components/overworld/overworld-tab/board.tsx` sets it from `spawnAlpha`, and leaves it out when `settings().reduceMotion` is on (no fade at all, the pokemon is there or not).
- `src/canvas/overworld/chunk-view/index.ts`: in the spawn draw, `fade = standing.alpha?.(worldTime()) ?? 1` multiplies the sprite alpha and sets the shadow's `alpha`; `animating` stays true while fading. `pickOn` is unchanged, so a press on a fading pokemon still opens it. The canvas imports nothing from `src/game`.
- Tests: `test/game/spawn-radius.test.ts` (fade in, near ring, first frame beside a walker below 0.1, fade out, already standing, short cycles stay in 0..1, `wasStanding`, `isDrawn`), and two cases in `test/overworld/board-view.test.ts` (fade marks on a board spawn, not standing when first seen at the cycle start).

## Deviations

- `spawnAlpha` has a fourth optional argument `standing` (the contract has three) and takes `{ cycle }` rather than a whole `LiveSpawn`, so the board can pass what it stored. The contract's `distance` is read as the distance at first sight.
- Fade constants went into `src/overworld/spawn-life/index.ts` (not in the brief's owned or shared paths) as the contract says; four appended lines. `spawn-roaming` appends its own constants to the same file, so expect an adjacent-lines merge.
- Also touched, minimally: `src/canvas/overworld/scenery.ts` (one optional field) and `src/components/overworld/overworld-tab/board.tsx` (builds the closure and reads reduce motion).
- Not done: the rebuild-frequency note about `nextSpawnEdge` (`src/game/overworld/windows.ts`, not a shared path). Fades add no edges, since alpha is read per frame, so the rebuild rate is unchanged. Skipping edges of hidden lure slots and of spawns homed off the board is still open.
- Not done: the `pnpm dev` look at a spawn arriving and leaving. No browser check was made.
- The teaser and `BoardDemo` build coats without `alpha`, so they draw whole.

## Stubs left

- None. `spawn-roaming` changes the position of a spawn, not its fade.

## Gotchas

- `shown` is module state, so `standing` and `distance` depend on the order of builds in a test: use fresh times, and check one spawn per fresh build.
- The shiny sparkle and the rank herald are not faded; only the sprite and its shadow are. The ripple and seal under a featured or legendary spawn also draw whole.
- `spawn-roaming` edits the same draw block: `fade` is computed once before `thrown`, and `veil(...) * fade` is the one place the alpha enters.
- The sprite's dot placeholder (sheet not ready) is not faded.

## Proposed learnings

- Per-client draw state about a spawn lives in the `shown` memory beside its id, never in the spawn derivation | the derivation must stay identical on every client and on the server | src/game/overworld | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0 (warnings only, none new from this work except none in touched code beyond existing max-depth ones).
- `pnpm exec oxfmt src test`: applied.
- `pnpm exec vitest run test/game/spawn-radius.test.ts test/overworld/board-view.test.ts test/overworld/spawn-life.test.ts`: 40 passed.

## Size

- Estimated M, actual M.

## Landed

- Commit `ba4a8b35a` on `batch/overwander`. Fresh review clean. Not looked at in a browser.
- Nits left: the standing test hardcodes `1_000` instead of `STANDING_AFTER_MS`, and its rebuild assertion passes when the seat is gone. `nextSpawnEdge` still counts hidden and off-board slots.
