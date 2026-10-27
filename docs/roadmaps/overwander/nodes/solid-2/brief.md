---
id: solid-2
title: Migrate to Solid 2.0
status: todo
priority: could
type: refactor
outline: true
milestone: later
size: XL
spike: false
gate: false
added: 2026-10-27
owns: []
shared: []
provides: []
depends_on:
  - on: deps-update
    kind: hard
    why: Both rewrite package.json and the lockfile; the migration starts from current 1.x releases so its diff holds only the 2.0 changes.
---

# Migrate to Solid 2.0

## Goal

Move the app from solid-js 1.9 to Solid 2.0, along with the router, meta tags, SolidStart, terracotta and every other Solid library the app uses, and update the conventions written against 1.x.

## Context

- Source: user request, 2026-10-27.
- Not ready to start. On 2026-10-27: solid-js 2.0 is `2.0.0-rc.18` on the `next` tag; @solidjs/router `2.0.0-next.42`, terracotta `2.0.0-next.10` and @solidjs/vite-plugin `3.0.0-next.51` need it; @solidjs/meta has `1.0.0-next.2`; solid-marked and solid-floating-ui have no 2.0 release. Refine this node only once solid-js 2.0 is on `latest`.
- @solidjs/start and vite-plugin-solid are dropped in 2.0: @solidjs/vite-plugin replaces both. That reaches past components to `vite.config.ts`, `tsconfig.json`, `src/global.d.ts`, `src/app.tsx`, the client and server entries, `src/middleware/` and the routes that import from @solidjs/start, plus every `'use server'` function if the new plugin changes how they compile (see the `server-function-order` skill).
- Scale: about 240 files under `src/` import solid-js, and about 120 use resources, effects or stores.
- Conventions that name 1.x APIs and must be rewritten with the code: the skills `resource-suspense`, `effect-props`, `deferred-jsx-props`, `dialog-transitions` and `app-logic` (`createStoreSignal`), `src/components/CLAUDE.md`, and their mirrors in `AGENTS.md`, `.opencode/AGENTS.md` and `.github/`.

## Refinement notes

- Start with a spike: upgrade on a branch, list what breaks, and decide the split from that list (likely by area: styled primitives, overworld, battle, the rest), since each part touches files that the i18n-ui nodes also own.
- Plan the merge order against any open i18n-ui or pixel node; a codemod-style change across 240 files conflicts with everything.
