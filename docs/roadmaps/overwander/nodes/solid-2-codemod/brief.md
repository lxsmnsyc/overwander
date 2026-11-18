---
id: solid-2-codemod
title: Rewrite the one-to-one Solid 2.0 imports and renames
status: todo
priority: could
type: refactor
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
  - src/**
  - test/**
  - e2e/**
  - vite.config.ts
shared: []
provides: []
depends_on:
  - on: solid-2-spike
    kind: hard
    why: It rewrites the imports the spike's shims stand in for, on the spike's package set.
---

# Rewrite the one-to-one Solid 2.0 imports and renames

## Goal

Apply every one-to-one change in the spike outcome's "One to one" list across `src`, `test` and `e2e`, with a script where it helps, and delete the temporary shims (`solid-js/web` and `solid-js/store` aliases, `terracottaRoot()`) from `vite.config.ts`. No behaviour changes: anything that needs a judgment stays for the area children.

## Context

- The list: `solid-js/web` to `@solidjs/web`, `solid-js/store` to `solid-js`, `JSX` type to `@solidjs/web`, bare `terracotta` to `terracotta/<component>`, `clientOnly` and `HttpStatusCode` from `@solidjs/start`, `Suspense` to `Loading`, `ErrorBoundary` to `Errored`, `mergeProps`/`splitProps`/`unwrap`, `classList`, `Context.Provider`, `<Index>` to `<For keyed={false}>`, `onMount` to `onSettled` where the body runs once, router `<A>` to `<a>` with `[aria-current]` CSS.
- A plain rename of `Suspense` to `Loading` is mechanical; the different refetch rules are the area children's concern.
- If a codemod script is written, keep it under `scripts/` only if it is reusable; otherwise leave it out of the commit and describe it in the log.

## Acceptance

- [ ] `grep -rE "solid-js/(web|store)|from 'terracotta'|@solidjs/start|<Index|\bSuspense\b|mergeProps|splitProps|onMount" src test e2e` prints nothing.
- [ ] `vite.config.ts` has no alias for `solid-js/web` or `solid-js/store` and no `terracottaRoot`.
- [ ] `pnpm typecheck` reports fewer errors than the spike's 1249, and none of kind TS2305/TS2307 for the renamed names.
- [ ] `pnpm exec oxlint src test` exits 0 and oxfmt is clean.

## Sizing

M: about 300 files, but every edit is a rename a script can make.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
