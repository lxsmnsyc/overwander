# Outcome: solid-2-build-times

## Result

- `pnpm exec vite build` takes about 66 to 68 percent less time on the 2.0 branch than on 1.x. Both batches are beyond the noise as `bench.py` judges it.
- `pnpm exec vitest run` takes the same time on both sides, within noise (+1.4 percent).

## Build times

Command: `pnpm exec vite build`, 1 warmup, 5 runs per side, interleaved, in seconds.

| Batch | Load before, after | Base (1.x) median, min to max, MAD | Solid 2.0 median, min to max, MAD | Change | `bench.py` verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | 5.35, 4.78 | 60.44, 53.62 to 83.67, 6.82 | 19.25, 18.17 to 24.35, 1.07 | -68.2% | better |
| 2 | 3.09, 4.86 | 53.73, 53.09 to 59.86, 0.64 | 18.22, 16.76 to 20.11, 0.56 | -66.1% | better |

- Batch 2 ran on the quieter machine and is the one to quote: 53.7 s against 18.2 s.
- Batch 1 overlapped a browser renderer using about 280 percent CPU, which shows in the base spread (MAD 6.82 s). The change is the same size in both batches.
- The spike's rough 1.x numbers (31.6 s to 34.4 s) were lower than both batches here. A single build in the clone before the batches took 45.5 s wall.
- Output size: `.output` is 111 MB on 1.x and 57 MB on 2.0.

What differs between the sides besides Solid:

- The 2.0 branch replaces SolidStart 1.x's `solidStart()` plugin with `@solidjs/vite-plugin` (start mode), `filesystem-routing` and Nitro, in `vite.config.ts`.
- The saving is the whole toolchain change plus the code migration. It is not Solid's compiler alone, and this node did not separate the parts.
- The base side warns `INEFFECTIVE_DYNAMIC_IMPORT` for the locale YAML files. This was not checked on the 2.0 side.
- `main` has moved only by docs commits since `9776577e0`, so no other source change is in the comparison.

## Suite times

Command: `pnpm exec vitest run`, 0 warmup, 2 runs per side, interleaved (base, solid2, base, solid2), in seconds. The command was wrapped in `sh -c '... ; exit 0'` so a failing test did not stop `bench.py` (it aborts on a non-zero exit). Output went to a file per run.

| Load before, after | Base (1.x) median, min to max, MAD | Solid 2.0 median, min to max, MAD | Change | `bench.py` verdict |
| --- | --- | --- | --- | --- |
| 3.46, 14.51 (peaks of 27 to 75 during the batch, from the suite's own workers) | 371.1, 367.9 to 374.2, 3.17 | 376.5, 365.2 to 387.7, 11.2 | +1.4% | within noise |

Failing files, all timeouts (20 s, one 90 s), none an assertion failure:

| Run | Failed files |
| --- | --- |
| base 1 | `damaging-moves`, `experts`, `spawn-life`, `raid-sites`, `tera-sites` |
| solid2 1 | `damaging-moves`, `experts`, `spawn-life`, `tera-sites`, `world-windows` |
| base 2 | `damaging-moves`, `species-sprite-animation`, `experts`, `spawn-life`, `noble-sites`, `placement-invariants`, `tera-sites` |
| solid2 2 | `damaging-moves`, `experts`, `spawn-life`, `tera-sites`, `world-windows` |

- Test counts: 5951 tests on 1.x and 5959 on 2.0, 298 files on both.
- `damaging-moves`, `experts`, `spawn-life` and `tera-sites` time out in all four runs. The suite is CPU-bound on this machine (the load reaches 27 to 75 from its own workers), so these are load timeouts. They pass alone, as the `solid-2-tests` outcome recorded.
- The `solid-2-tests` figure of 417 s for 2.0 against 94.6 s for the stopgap was a loaded machine against a quiet one. On equal footing here, 2.0 is 376.5 s against 371.1 s for 1.x.

## Environment handling

- Clone: plain `git clone` of the repo into the session scratchpad, `git checkout 9776577e0`, `pnpm install`. Deleted at the end.
- The clone has the committed `.env.development` and no `.env`. The repo side has the root `.env` as well. The root `.env` was not read, copied or edited.
- `vite build` runs in production mode and does not load `.env.development`. The clone's build worked without any `.env`.
- The repo side therefore builds with the root `.env` values for `VITE_*` (world seed, generation, sprite origin). These are inlined constants and add no build work, so the sides were left as they were. The suite reads `test/env/.env.test` on both.
- The `db` service on port 54322 was not touched. `pnpm test:db`, `pnpm test:e2e` and `pnpm dev` were not run.

## Machine

- Before each batch `uptime` and `ps` were checked. The only other load was a browser renderer (Dia) and the window server, which were not started by this node and were not stopped.
- No other Vitest or Vite process was running.

## Done and not done

- Done: build medians, spread and verdict on two batches. Suite medians on two runs per side. Failing files named.
- Not done: separating the toolchain change from the Solid compiler. No profile of where the build time went.
- Uncertain: with 2 runs per side the suite MAD is a weak estimate. The result is "no difference found", not "proven equal".
