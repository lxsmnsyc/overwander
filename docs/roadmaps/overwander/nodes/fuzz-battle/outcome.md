# Outcome: fuzz-battle

## Status

- Built and passing. One acceptance item is only partly met: see "Purity check by hand".

## Built

- `fast-check` (dev), `vitest.fuzz.ts` and `pnpm fuzz`, which runs `test/fuzz/**/*.fuzz.ts`. `FUZZ_RUNS` sets the run count (default 100), `FUZZ_SEED` and `FUZZ_PATH` replay a failure. One seed feeds every property in a run, so the properties draw the same fights.
- `test/fuzz/arbitraries.ts`: a battle (seed, party size 1 to 3, level 1 to 100, abilities, items, signatures on or off) and a raid (the same parties allied against a staged boss, levels 50 to 100). Raids run a quarter of the run count.
- `runBattle` in `test/sim/ai-sim.ts` takes a `watch` argument: mode, boss alliance, `onStart` and `onTick`. `SimOptions.signatures` adds each species' signature ability in front of its rolled ones.
- `test/fuzz/battle/watch.ts` plays a fight with every rule watched and caches the report by input. `test/fuzz/battle/invariants.fuzz.ts` holds seven properties:
  - HP within 0 and max, every stat and stage finite (every tick).
  - Every PvP fight settles before `TIME_LIMIT`.
  - Purity: every 30 ticks, each standing unit's move is chosen with `chooseMove`, and a plain-value snapshot (health, stages, statuses, items, consumed, abilities, worn, types, move states, tallies, cast, team statuses, weather, terrain) must not change.
  - Items: the held set changes only through `UnitAddItem` and `UnitRemoveItem`, a foe takes an item for good only when it is a consumable, and nothing is reported lost that the unit never held.
  - The same seed played twice, unwatched, gives the same cast log.
  - Raid: indirect and share-of-HP damage on a boss stays within its allowance (200, refilling at 50 a second).
  - Raid: the bounds, purity and item rules hold in raids too.
- `test/battle/moves/damaging-moves.test.ts` (in `pnpm test`): every damaging move that is not fixed-damage or OHKO lowers a typeless target's HP when it lands, at two levels drawn per move. It is outside the brief's owned paths, because the brief puts it in `pnpm test`. Untried, with reasons in the file: type Z-Moves and Max Moves (power comes from the replaced move), Present (heals at the pinned roll), Frenzy Burst (reads its noble caster).

## Purity check by hand

- Reverting the Three Heads guard (`parent.flags & MoveAttackFlags.Simulated` in `src/battle/abilities/signature/gen-5/axew-to-deino.ts`) and pinning Hydreigon with Three Heads against two foes: the watcher reports a purity breach on every probe. So the snapshot and probe catch the bug from `10163984a`.
- The random property did not catch it: with the guard reverted, purity passed at 500 runs and at 3000 runs (5.6 min). In 3000 drawn inputs, 7 fights field Hydreigon with Three Heads beside a second unit. Six of them, replayed with the guard reverted, report no breach. The cause is not found. Next step for a follow-up: log `UnitAttackResolveDamage` during probes in `fuzz-896298` (size 2, level 92, abilities 0, items 0, signatures on) and compare with the pinned fight.
- Removing the central `triggerItem` or `triggerAbility` estimating guard in `src/battle/unit.ts` did not fail purity at 40 runs: the listeners behind those cues carry their own guards, so the cue alone changes no state.

## Bugs found

- None. Every property passed at 100 and at 500 runs.

## Checks

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test vitest.fuzz.ts`: exit 0.
- `pnpm fuzz`: 7 passed, 24 s.
- `FUZZ_RUNS=500 pnpm fuzz`, alone: 7 passed, 150 s.
- `pnpm test --maxWorkers=2`: 5836 passed (283 files).

## Size

- Estimated M, actual M. One headless fight takes 0.1 to 0.3 s, so the brief's worry about minutes per battle did not hold.
