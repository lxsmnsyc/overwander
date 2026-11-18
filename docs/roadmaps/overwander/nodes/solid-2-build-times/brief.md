---
id: solid-2-build-times
title: Compare build times on Solid 1.x and 2.0
status: active
priority: could
type: chore
story: solid-2
early: false
outline: false
milestone: later
size: M
spike: false
verify: 
gate: false
added: 2026-11-18
owns:
  - docs/roadmaps/overwander/nodes/solid-2-build-times/**
shared: []
provides: []
depends_on:
  - on: solid-2-conventions
    kind: hard
    why: It measures the finished branch.
---

# Compare build times on Solid 1.x and 2.0

## Goal

Measure `pnpm exec vite build` wall time on Solid 1.x and on the finished 2.0 branch, fairly, and report whether 2.0 is faster beyond the noise.

## Context

- Base: `main` at 9776577e0 (the commit `feat/solid-2` was cut from), in a plain `git clone` under the session scratchpad with its own `pnpm install`. Not a worktree. Delete it afterwards.
- Other side: `feat/solid-2` head in the main checkout.
- The spike's rough 1.x numbers: 31.6 s, 32.6 s, 34.4 s.
- Use perf-pass's `bench.py` (`<perf-pass skill>/scripts/bench.py --dir base=<clone> --dir solid2=<repo> --warmup 1 --runs 5 -- pnpm exec vite build`), with no suite, dev server or other build running. Leave out the stamp scripts in `pnpm build`: they do not touch Solid.

## Acceptance

- [ ] `outcome.md` gives median, spread and change for both sides, and whether the change beats the noise as `bench.py` judges it.
- [ ] `outcome.md` also gives `pnpm exec vitest run` wall time on both sides (`bench.py --warmup 0 --runs 2`), since `solid-2-tests` only timed the new posture on a loaded machine (417 s) against 94.6 s for the stopgap on a quiet one. Name any failing file.
- [ ] The clone is deleted and no process is left running.

## Sizing

M: little code, but ten builds of about half a minute each plus two installs.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- Before each timed run check the machine is quiet (`uptime` load, `ps` for other vitest, vite, VMs or builds, including other projects). Record the load. Kill nothing you did not start; if the machine stays busy, wait and say so.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
