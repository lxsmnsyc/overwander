---
id: solid-2-tests
title: Settle how the tests run on Solid 2.0 and fix the suite
status: done
priority: could
type: refactor
story: solid-2
early: false
outline: false
milestone: later
size: M
spike: false
verify: pnpm typecheck && pnpm exec oxlint src test && pnpm test
gate: false
added: 2026-11-18
spent: 586619
owns:
  - vite.config.ts
  - test/**
  - vitest.db.ts
  - vitest.fuzz.ts
  - vitest.sim.ts
shared: []
provides: []
depends_on:
  - on: solid-2-shell-routes
    kind: hard
    why: The suite can only go green once every area is migrated.
---

# Settle how the tests run on Solid 2.0 and fix the suite

## Goal

Choose how the tests run under the new plugin, remove the spike's `test.environment: 'node'` stopgap, and get the whole fast check and `pnpm test` green.

## Context

- Spike gotchas: with the plugin's default (browser) setting 5 files fail (`window`, `matchMedia`, `renderToString` in the browser, one-argument `createEffect`); with `environment: 'node'` `windows.test.ts` fails (`Missing species data for 1014404`, something registers differently when `isServer` is true) and the run takes 605 s against 154 s.
- Decided (story Decisions 7): measure, then choose. A `test.projects` split (component tests in the browser setting, the rest on Node) is the likely answer.
- Solid 2 delegates events only inside the element `render` mounts into: a test that renders into a div and portals to `document.body` sees clicks do nothing. Render into the body or a container that holds the portal host.
- Setters apply after a microtask: tests that set then read need `flush()`.
- `test/components/resource-reads.test.ts` tests the 1.x `Resource` shape, and `src/components/app/resource-reads.ts` is now deleted: delete the test, or replace it with one for `createLoad` (`src/components/app/create-load.ts`). It is the only typecheck and lint error left.
- Allowed outside fix: the 2.0 dev warnings `solid-2-shell-routes` left, listed under "Warnings left" in its outcome (`board.tsx` accessors read from `walk.ts` and `windows.ts` effect callbacks, `catch-picker/box.tsx` `draft`, `StatHexagon`, profile sheet, auction board, duel lobby, `HoverCard` ref). Fix the ones in `src`; leave the upstream ones (Floating UI `merge`, terracotta `TabPanel`) named in the outcome. Optional: `readRequestLocale` in `src/i18n/server.ts` may read the request store directly to silence the start-up "RequestEvent is missing" warnings (a review showed they are not a locale bug).
- Still owed a runtime check from earlier children, on the built server: a landmark dialog (Honey tree, Portal, Gym seat or Safari), an auction bid and listing, a raid lobby and a quest claim. Seed what the seed lacks into `pnpm db`'s throwaway database only (a rare catch, a gathering raid, a finished quest, a player beside a landmark). Name whatever stays out of reach.

## Acceptance

- [ ] `pnpm typecheck && pnpm exec oxlint src test` passes (read oxlint's exit code).
- [ ] `pnpm test` passes, apart from the known load timeouts that pass alone (tera-sites, raid-sites); name any other in the outcome.
- [ ] Then `pnpm test:db` passes (run alone; e2e stays out, it is stale).
- [ ] The outcome gives the full-suite time before and after the posture choice.
- [ ] On a built server (`pnpm build`, then `pnpm start` against `pnpm db`'s database through `.env.development` values, never the root `.env`): a page's server calls carry `X-Server-Function-Build`, and a call naming another build gets 409 with `X-Server-Function-Unknown` (left open by `solid-2-server-calls`, since `pnpm dev` neither stamps nor checks).

## Sizing

M: the test posture is one decision; the rest is fixing what it surfaces.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Run `pnpm test:db` only alone, after `pnpm test` is green; never `pnpm test:e2e` (stale). Stop every `pnpm dev` you start (check with `ps` before you reply).
