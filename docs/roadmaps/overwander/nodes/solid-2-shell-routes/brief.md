---
id: solid-2-shell-routes
title: Migrate the shell, admin, demos and routes to Solid 2.0
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
spent: 516586
owns:
  - src/components/app/**
  - src/components/forms/**
  - src/components/admin/**
  - src/components/demo/**
  - src/components/sprite-processor/**
  - src/routes/**
  - src/auth/context.tsx
  - src/auth/sprites.ts
  - src/app.tsx
  - src/entry-client.tsx
  - src/entry-server.tsx
shared: []
provides: []
depends_on:
  - on: solid-2-social
    kind: hard
    why: Sequential on one device; the order keeps each area's diff on top of the last.
---

# Migrate the shell, admin, demos and routes to Solid 2.0

## Goal

Migrate the app shell, forms, admin, demos, sprite processor, routes, the auth context and the entries to Solid 2.0 so no file in the owned paths has a typecheck error, following the story's Decisions.

## Context

- Spike error map, row `shell (and the route files of routes+server)`: 62 files, 16 resources, 16 effect splits, 18 onMount/onCleanup, 13 router.
- Not `src/components/app/store-signal.ts`: `solid-2-overworld-battle` owns it.
- Minimal deviation allowed: `src/components/styled/search` and `TooltipHost` log `STRICT_READ_UNTRACKED` in dev; fix them here once the app renders.
- `src/components/app/watch.ts` is already migrated (`watchLive(key, (key, set) => unsubscribe)`, by `solid-2-social`); do not redo it.
- A `from` subscribes during the server render in 2.0: guard the `from` calls in `src/routes/index.tsx`, `src/routes/admin.tsx` and any shell screen that renders on the server (`isServer`, or seed and skip as `watchLive` does).
- A context provider reads its value once: `admin/staff-context.tsx:24` copies `uid: props.uid`; check it, and any shell provider whose value can change must carry an accessor.
- Still owed from `solid-2-catches` and `solid-2-social` once the shell renders: the catch sheet, boxes, dex and bag; auctions with a bid and a listing, a duel and a raid lobby, a trade offer, the profile sheet and editor, quests with a claim, gifts, settings security.
- Reads that must not wait use `createLoad` (`src/components/app/create-load.ts`).
- `src/components/app/resource-reads.ts` still uses the 1.x `Resource` type and nothing migrated imports it; delete it or rewrite it for async memos (`answered` has no 2.0 equivalent), and fix its test with `solid-2-tests` if it moves.
- Still owed from `solid-2-overworld-battle` once the shell renders: walk the overworld, open the Honey tree, Portal, Gym seat and Safari dialogs, start and finish a battle.
- `src/auth/context.tsx` is where the page first throws (`onMount`).
- `src/auth/sprites.ts` uses router `action` with `useSubmission`: replace with plain calls (Decisions 5).
- Keep the authored entries (Decisions 8). Replace the spike's `<Errored>` stopgap in the Document with a real error screen, or keep it with a comment saying why.
- The `useSearchParams`, `useLocation`, `useParams` and `useNavigate` uses keep working under router 2; check navigation in `pnpm dev`.
- After this node the whole app should render: sign in, walk, open a dialog, start a battle in `pnpm dev`, and report what still fails.

## Acceptance

- [ ] `pnpm typecheck 2>&1 | grep -E 'src/components/(app|forms|admin|demo|sprite-processor)|src/routes|src/auth/(context|sprites)|src/app.tsx|src/entry'` prints nothing.
- [ ] The tests under the matching `test/` folders pass alone with `pnpm exec vitest run <folders>`, or fail only for a reason the outcome hands to `solid-2-tests`.
- [ ] Every `{ ownedWrite: true }` carries a comment saying why a memo or `onSettled` would not do.
- [ ] oxlint on the owned paths adds no error kind that `feat/solid-2` does not already have (it is type-aware and cannot exit 0 while typecheck is red; `solid-2-tests` checks exit 0), and oxfmt is clean.
- [ ] The outcome lists each pattern you had to invent beyond the Decisions, for `solid-2-conventions`.

## Sizing

L: 62 files plus the routes, and it is the first point where the app renders end to end.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
