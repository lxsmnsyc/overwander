# Outcome: boot-lazy-abilities

## Built

- Not reproduced. Setting up all abilities costs well under the brief's 5 ms line, so no code changed.

## Proof

- base: `69169d453`, throwaway vitest bench (not committed) timing `createBattle` of `test/battle/harness.ts` and `setupAbilities` alone, 35 kept iterations per run, three runs. Medians: full 1v1 setup 0.83 to 0.87 ms; `setupAbilities` alone 0.59 to 0.61 ms; setup plus 49 units 1.85 to 1.88 ms. Means 1.0 to 1.5 ms, sd 1.2 to 1.6 ms (GC outliers up to 7 ms). A second battle in a fresh process: 1.07, 1.07, 2.52 ms for `setupAbilities`.
- branch: not built. Ability setup is a small fraction of a millisecond per battle; a lazy attach could save at most about 0.6 ms, which is inside the noise (sd above 1 ms). A raid roster adds no ability setup cost (it is per battle, not per unit), so the 49-unit case is the same.

## Deviations

- None.

## Stubs left

- None.

## Gotchas

- The brief's premise (about 270 abilities attaching per battle is a visible cost) does not hold on this machine. Memory per battle was not measured; if it matters, a heap measure is the next step before any ranked-listener work.

## Verification

- Bench only; no code changed, so no suite run.

## Size

- Estimated L, actual S: stopped at the measurement.
