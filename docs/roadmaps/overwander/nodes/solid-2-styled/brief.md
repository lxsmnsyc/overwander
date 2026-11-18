---
id: solid-2-styled
title: Migrate the styled primitives, dialogs and floating UI to Solid 2.0
status: done
priority: could
type: refactor
story: solid-2
early: false
outline: false
milestone: later
size: L
spike: false
verify: 
gate: false
added: 2026-11-18
spent: 363000
owns:
  - src/components/styled/**
  - src/components/icons*
  - src/components/sprites/**
shared: []
provides: []
depends_on:
  - on: solid-2-codemod
    kind: hard
    why: It finishes what the renames left in the same files.
---

# Migrate the styled primitives, dialogs and floating UI to Solid 2.0

## Goal

Migrate the styled primitives, dialogs, icons, sprites and floating UI to Solid 2.0 so no file in the owned paths has a typecheck error, following the story's Decisions.

## Context

- Spike error map, row `styled`: 53 files, 12 effect splits, 13 onMount/onCleanup, 15 terracotta, 3 solid-floating-ui.
- Terracotta 2 prop changes surface here first once its paths resolve; record them for the other areas.
- `dialog-transitions`: the `Transition` that mounts a dialog and its `TransitionChild` fade must still behave; check one dialog in `pnpm dev` and say so in the outcome.
- `hover-card/safe-area.ts` reads `window` at import; guard it with `isServer` (the spike's test-posture gotcha).

## Acceptance

- [ ] `pnpm typecheck 2>&1 | grep -E 'src/components/(styled|icons|sprites)'` prints nothing.
- [ ] The tests under the matching `test/` folders pass alone with `pnpm exec vitest run <folders>`, or fail only for a reason the outcome hands to `solid-2-tests`.
- [ ] Every `{ ownedWrite: true }` carries a comment saying why a memo or `onSettled` would not do.
- [ ] oxlint on the owned paths adds no error kind that `feat/solid-2` does not already have (it is type-aware and cannot exit 0 while typecheck is red; `solid-2-tests` checks exit 0), and oxfmt is clean.
- [ ] The outcome lists each pattern you had to invent beyond the Decisions, for `solid-2-conventions`.

## Sizing

L: 53 files, and the other four areas build on its props and patterns.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
