---
id: solid-2-spike
title: Upgrade to Solid 2.0 and map what breaks
status: done
priority: could
type: spike
story: solid-2
early: false
outline: false
milestone: later
size: M
spike: true
gate: true
added: 2026-11-18
spent: 371000
owns:
  - package.json
  - pnpm-lock.yaml
  - vite.config.ts
  - tsconfig.json
  - src/global.d.ts
  - src/app.tsx
  - src/entry-client.tsx
  - src/entry-server.tsx
  - src/middleware/**
shared: []
provides: []
depends_on: []
---

# Upgrade to Solid 2.0 and map what breaks

## Goal

On the story branch `feat/solid-2`, move every Solid package to its 2.0 release, replace @solidjs/start and vite-plugin-solid with @solidjs/vite-plugin, and get the dev server to boot. Then list everything that still breaks, grouped by area, so the orchestrator can write the remaining children of `solid-2`.

## Context

- Read the `solid-2` story brief first: it has the versions, the scale counts and the conventions that will need rewriting.
- Read the official Solid 2.0 migration guide and the release notes of @solidjs/router 2.0, @solidjs/vite-plugin 3.0 and terracotta 2.0 before touching code. Record their links in the outcome.
- The build guard in `vite.config.ts` and the `server-function-order` skill depend on how server functions are addressed. Find out whether @solidjs/vite-plugin keeps addressing them by place in file, and whether `'use server'` still compiles the same way.
- Under Vitest, `vite.config.ts` keeps SolidStart only to resolve the `server-only` marker. @solidjs/vite-plugin still does this; keep it loaded under Vitest the same way.
- Replace vite-plugin-solid-marked with unplugin-solid-marked 1.0.0 (its Vite entry), which pairs with solid-marked 1.0.

## Steps

- [ ] The orchestrator has created `feat/solid-2` from `main`. Work in the main checkout (no worktree) on `spike/solid-2-spike`, cut from `feat/solid-2`.
- [ ] Before any bump, on `main`'s commit, time `pnpm exec vite build` three times and record the wall times in `log.md` as a rough 1.x baseline. The real comparison is `solid-2-build-times`.
- [ ] Bump solid-js, add @solidjs/web, bump @solidjs/router, @solidjs/meta, terracotta, solid-floating-ui, solid-marked; remove @solidjs/start, vite-plugin-solid and vite-plugin-solid-marked; add @solidjs/vite-plugin and unplugin-solid-marked.
- [ ] Rewrite `vite.config.ts`, `tsconfig.json`, `src/global.d.ts`, `src/app.tsx`, the entries and `src/middleware/` for the new plugin until `pnpm dev` serves the root route, even if pages below it fail.
- [ ] Run `pnpm typecheck` and `pnpm exec vitest run` (unit suite only) and save both outputs in `log.md`.
- [ ] Group every error by area and by kind of change (renamed import, resource to async, effect split, `Suspense`, `Index`, store setter, router `query`/`action`, terracotta API, server functions, other). Count files per group.

## Acceptance

- [ ] `spike/solid-2-spike` holds the package bumps and build switch, with a draft pull request into `feat/solid-2`. Check `gh repo view --json visibility` before pushing (the repo is public, so pushing runs CI).
- [ ] `pnpm dev` boots and serves `/` without a build error.
- [ ] `outcome.md` holds: the error table (area x kind, file counts), whether server functions are still named by file and position (and so whether the build guard and the `server-function-order` skill still hold as written), the rough 1.x build times, which 2.0 APIs map one to one (a codemod can do them) and which need a decision, and a proposed list of children with owned paths and sizes, each M or L.
- [ ] The outcome lists every skill and mirror that names a removed API.

## Sizing

M: package and config work is small; the real output is the error map. Stop when the map is complete, even if most of `src` still fails to typecheck.

## Notes for the worker

- Do not migrate components here beyond what the entries and `app.tsx` need to boot. Each area is its own child.
- Do not touch the `db` service on port 54322 or the root `.env`.
- Do not run `pnpm test:db` or `pnpm test:e2e`; e2e is stale anyway (see the `e2e-specs` outcome).
- Stop every `pnpm dev` you start.
- Prose in the outcome and commits avoids em-dashes.
