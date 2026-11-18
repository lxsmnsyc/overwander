---
id: solid-2
title: Migrate to Solid 2.0
status: active
priority: could
type: story
outline: false
milestone: later
size: XL
spike: false
verify: pnpm typecheck && pnpm exec oxlint src test && pnpm test && pnpm build
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

Move the app from solid-js 1.9 to Solid 2.0, along with the router, meta tags, terracotta, solid-floating-ui, solid-marked and the build plugin, and rewrite the conventions written against 1.x. The app ships on 2.0 in one piece: the story branch `feat/solid-2` holds every child, and one pull request takes it into `main`.

## Context

- Source: user request, 2026-10-27. Solid 2.0 confirmed stable by the user on 2026-11-18.
- solid-js 2.0.0 went to `latest` on 2026-11-17. On 2026-11-18 every library the app uses has a stable release that peers on it: @solidjs/router 2.0.0, @solidjs/meta 2.0.0, terracotta 2.0.0, solid-floating-ui 2.0.0, solid-marked 1.0.0 and @solidjs/vite-plugin 3.0.1. Each also peers on the new `@solidjs/web` package, which replaces `solid-js/web`. vite-plugin-solid-marked stays on 0.8.0: unplugin-solid-marked 1.0.0 (peers on solid-js 2 and solid-marked 1) replaces it.
- @solidjs/start 2.2.3 still peers on solid-js `^1.9.15` and router `<2.0.0`, so it cannot stay. @solidjs/vite-plugin replaces @solidjs/start and vite-plugin-solid. That reaches `vite.config.ts` (it keeps SolidStart under Vitest to resolve `server-only`; @solidjs/vite-plugin still resolves it, per the maintainer), `tsconfig.json`, `src/global.d.ts`, `src/app.tsx`, the client and server entries, `src/middleware/` and the 22 files that import @solidjs/start, plus every `'use server'` function if the new plugin changes how they compile (see the `server-function-order` skill and the build guard in `vite.config.ts`).
- Scale on 2026-11-18: 311 files under `src/` import solid-js; 69 use `createResource`, 67 `Suspense`, 66 `createEffect`, 21 `onMount`, 15 `<Index>`, 14 `createStore`, 22 `solid-js/web`. 24 import @solidjs/router (13 `query(`, 40 `action(`), 27 import terracotta.
- Conventions that name 1.x APIs and must be rewritten with the code: the skills `resource-suspense`, `effect-props`, `deferred-jsx-props`, `dialog-transitions`, `device-settings` and `app-logic` (`createStoreSignal`), `src/components/CLAUDE.md`, and their mirrors in `.claude/skills/`, `.agents/skills/`, `AGENTS.md`, `.opencode/AGENTS.md` and `.github/`.

## Children

Run in this order, one at a time: `solid-2-spike` (done, PR #301), `solid-2-codemod`, `solid-2-server-calls`, `solid-2-styled`, `solid-2-overworld-battle`, `solid-2-catches`, `solid-2-social`, `solid-2-shell-routes`, `solid-2-tests`, `solid-2-conventions`, `solid-2-build-times`. The spike's outcome on the story branch (`nodes/solid-2-spike/outcome.md`) holds the error map, the one-to-one list and the links every child needs.

## Decisions

Agreed with the maintainer on 2026-11-18. Every child follows them; a child that has to deviate says so in its outcome.

1. Resources: `createMemo(async)` under `<Loading>`, declared in a parent and read in a child, as `resource-suspense` does today. `refresh` replaces `refetch`; `<Errored>` catches errors; `isPending` and `latest` replace `.loading` and `.latest`.
2. Effects: split each `createEffect` into its compute and apply parts by hand. `on(...)` goes with it. Keep `effect-props`' rule: stateful effects read props through memos.
3. Writes from owned scope (a signal set in a component body, memo or effect compute): derive the value with a memo where possible, otherwise move the write to `onSettled`. `{ ownedWrite: true }` only as a last resort, with a comment saying why.
4. `createStoreSignal` (`src/components/app/store-signal.ts`) is rebuilt on `from(store.subscribe)`.
5. `useSubmission` (2 files): replaced by plain calls.
6. Server reads stay POST. `readOnly` keys on `fn.id`, the call counter on the id from the path, and a response with `X-Server-Function-Unknown` reloads the tab.
7. Test setup: `solid-2-tests` measures and chooses, likely a `test.projects` split (component tests in the browser setting, the rest on Node).
8. Entries: keep the authored client and server entries, so `guardServerCalls()` visibly runs before the app mounts.

## Acceptance

- [ ] `package.json` has no 1.x Solid package, no @solidjs/start and no vite-plugin-solid.
- [ ] Fast check, `pnpm test`, then `pnpm test:db`, one at a time, pass on `feat/solid-2`.
- [ ] `pnpm build` succeeds and `pnpm start` serves the game: sign in, walk the overworld, open a dialog, start and finish a battle.
- [ ] No skill or mirror names an API that 2.0 removed.
- [ ] The story pull request states the build time on 1.x and 2.0 from `solid-2-build-times`.

## Notes for the orchestrator

- No other node touching `src/components`, `src/routes`, `src/auth` or the canvas mounts should run while the story is open: a change across 300 files conflicts with everything. Today no such node is active.
- `ts-style-sweep` waits for this story, or the same files are rewritten twice.
