---
id: solid-2-overworld-battle
title: Migrate the overworld, canvas mounts and battle views to Solid 2.0
status: todo
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
owns:
  - src/components/overworld/**
  - src/components/battle/**
  - src/components/moves/**
  - src/components/app/store-signal.ts
shared: []
provides: []
depends_on:
  - on: solid-2-styled
    kind: hard
    why: Sequential on one device, and each area builds on the styled primitives' 2.0 props.
---

# Migrate the overworld, canvas mounts and battle views to Solid 2.0

## Goal

Migrate the overworld, the canvas mounts, the battle and move views and `createStoreSignal` to Solid 2.0 so no file in the owned paths has a typecheck error, following the story's Decisions.

## Context

- Spike error map, row `overworld and battle`: 42 files, 13 resources, 10 effect splits, 11 Suspense, 5 Index.
- `createStoreSignal` moves to `from(store.subscribe)` (Decisions 4); every component that reads a store goes through it, so land it first and check the overworld still walks in `pnpm dev`.
- The draw loops in `src/canvas` and the stores in `src/game` import no Solid; keep it that way.

## Acceptance

- [ ] `pnpm typecheck 2>&1 | grep -E 'src/components/(overworld|battle|moves)|store-signal'` prints nothing.
- [ ] The tests under the matching `test/` folders pass alone with `pnpm exec vitest run <folders>`, or fail only for a reason the outcome hands to `solid-2-tests`.
- [ ] Every `{ ownedWrite: true }` carries a comment saying why a memo or `onSettled` would not do.
- [ ] oxlint on the owned paths adds no error kind that `feat/solid-2` does not already have (it is type-aware and cannot exit 0 while typecheck is red; `solid-2-tests` checks exit 0), and oxfmt is clean.
- [ ] The outcome lists each pattern you had to invent beyond the Decisions, for `solid-2-conventions`.

## Sizing

L: two areas with the canvas mounts and the store bridge every screen depends on.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
