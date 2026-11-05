# Outcome: fuzz-battle

## Status

- Done. Every acceptance item is met.

## Built

- `fast-check` (dev), `vitest.fuzz.ts` and `pnpm fuzz`, which runs `test/fuzz/**/*.fuzz.ts`. `FUZZ_RUNS` sets the run count (default 100), `FUZZ_SEED` and `FUZZ_PATH` replay a failure. One seed feeds every property in a run, so the properties draw the same fights.
- `test/fuzz/arbitraries.ts`: a battle (seed, party size 1 to 3, level 1 to 100, abilities, items, signatures on or off) and a raid (the same parties allied against a staged boss, levels 50 to 100). Raids run a quarter of the run count.
- `runBattle` in `test/sim/ai-sim.ts` takes a `watch` argument: mode, boss alliance, `onStart` and `onTick`. `SimOptions.signatures` adds each species' signature ability in front of its rolled ones.
- `test/fuzz/battle/watch.ts` plays a fight with every rule watched and caches the report by input. `test/fuzz/battle/invariants.fuzz.ts` holds seven properties:
  - HP within 0 and max, every stat and stage finite (every tick).
  - Every PvP fight settles before `TIME_LIMIT`.
  - Purity: every 30 ticks, each standing unit's move is chosen with `chooseMove`. While it guesses, it may raise only questions (`Check*`, `Resolve*`, the decision itself, the same rule as `test/battle/ai/estimates.test.ts`) and may draw from the battle's RNG only for its one tie-break. A plain-value snapshot (health, stages, statuses, items, consumed, abilities, worn, types, move states, tallies, cast, team statuses, weather, terrain) must not change either. `FUZZ_TRACE=1` prints where each draw came from.
  - Items: the held set changes only through `UnitAddItem` and `UnitRemoveItem`, a foe takes an item for good only when it is a consumable, and nothing is reported lost that the unit never held.
  - The same seed played twice, unwatched, gives the same cast log.
  - Raid: indirect and share-of-HP damage on a boss stays within its allowance (200, refilling at 50 a second).
  - Raid: the bounds, purity and item rules hold in raids too.
- `test/battle/moves/damaging-moves.test.ts` (in `pnpm test`): every damaging move that is not fixed-damage or OHKO lowers a typeless target's HP when it lands, at two levels drawn per move. It is outside the brief's owned paths, because the brief puts it in `pnpm test`. Untried, with reasons in the file: type Z-Moves and Max Moves (power comes from the replaced move), Present (heals at the pinned roll), Frenzy Burst (reads its noble caster).

## Purity check by hand

- Removing `MoveAttackFlags.Simulated` from the AI's damage estimate (`estimateDamage` in `src/battle/ai/choose-move.ts`), so estimates resolve as real hits: purity fails on the first fight and shrinks to the smallest input (`{"seed":"fuzz-0","size":1,"level":1,...}`), with every probe drawing from the RNG. Checked by hand, not committed.
- A snapshot alone missed it: an unmarked estimate mostly raises events and draws rolls without leaving a change in state. That is why the property checks events and draws as the sweep does.

## Bugs found

- `stealableItem` (`src/battle/items/held.ts`) rolled the battle's RNG to pick which held item a question was about, so the AI weighing Fling or Poltergeist against a pokemon holding two items moved the fight's rolls. While `battle.estimating` holds it now reads the first held item. Regression test in `test/battle/ai/estimates.test.ts` (fails with 2 draws without the fix). Changeset `fling-poltergeist-guess`. Found by the purity property on `fuzz-278253` (size 2, level 1, items on).
- `CheckUnitRecoil` was emitted with an empty `id` (`src/battle/moves/recoil.ts`), so it did not read as a question. Fixed to `'CheckUnitRecoil'`.

## Checks

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test vitest.fuzz.ts`: exit 0.
- `pnpm fuzz`: 7 passed, 38 s.
- `FUZZ_RUNS=500 pnpm fuzz`, alone: 7 passed, 308 s (150 s on an earlier, quieter run).
- `pnpm test --maxWorkers=2`: 5837 passed (283 files).

## Size

- Estimated M, actual M. One headless fight takes 0.1 to 0.3 s, so the brief's worry about minutes per battle did not hold.
