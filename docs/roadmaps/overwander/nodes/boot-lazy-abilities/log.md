# Log: boot-lazy-abilities

- Branch `refactor/boot-lazy-abilities` from `batch/overwander` at `69169d453`.
- Measured first with a throwaway vitest file (deleted, not committed): `createBattle` from `test/battle/harness.ts` and `setupAbilities` alone, 40 iterations per run, first 5 dropped, three separate vitest runs, `performance.now()`.
- Command: `pnpm exec vitest run test/battle/zz-bench.test.ts` (results appended to a file, vitest hides console output).
- Result (ms, medians of the three runs): full 1v1 setup 0.83 to 0.87; `setupAbilities` alone 0.59 to 0.61; setup plus 49 units 1.85 to 1.88. Means are 1.0 to 1.5 ms with sd 1.2 to 1.6 (GC spikes up to 7 ms). Second battle in a fresh process, `setupAbilities` alone: 1.07, 1.07, 2.52.
- Every figure is under the brief's 5 ms line, so the node stops here.
