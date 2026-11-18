---
id: solid-2-social
title: Migrate the social screens to Solid 2.0
status: active
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
  - src/components/auctions/**
  - src/components/duels/**
  - src/components/friends/**
  - src/components/gifts/**
  - src/components/notifications/**
  - src/components/profile/**
  - src/components/quests/**
  - src/components/raids/**
  - src/components/trades/**
  - src/components/news/**
  - src/components/settings/**
shared: []
provides: []
depends_on:
  - on: solid-2-catches
    kind: hard
    why: Sequential on one device; the order keeps each area's diff on top of the last.
---

# Migrate the social screens to Solid 2.0

## Goal

Migrate the auctions, duels, friends, gifts, notifications, profile, quests, raids, trades, news and settings screens to Solid 2.0 so no file in the owned paths has a typecheck error, following the story's Decisions.

## Context

- Spike error map, row `social`: 64 files, 33 resources, 10 effect splits, 24 Suspense, plus solid-marked in 3 news files.
- A resource read without waiting (`.latest`, `answered`, handler reads) uses `createLoad` from `src/components/app/create-load.ts` (settled in `solid-2-catches`); the profile sheet and raid lobby still import `resource-reads.ts`, move them off it. Call `refresh()` and key writes from handlers or promise callbacks only.
- `news.test.tsx` fails on the solid-marked 1.0 change; fix it here.
- `settings.ts` calls `matchMedia` at load; guard it for the server (the spike's test-posture gotcha).
- Live views follow table changes over `src/server/live`; check one live list still updates.

## Acceptance

- [ ] `pnpm typecheck 2>&1 | grep -E 'src/components/(auctions|duels|friends|gifts|notifications|profile|quests|raids|trades|news|settings)'` prints nothing.
- [ ] The tests under the matching `test/` folders pass alone with `pnpm exec vitest run <folders>`, or fail only for a reason the outcome hands to `solid-2-tests`.
- [ ] Every `{ ownedWrite: true }` carries a comment saying why a memo or `onSettled` would not do.
- [ ] oxlint on the owned paths adds no error kind that `feat/solid-2` does not already have (it is type-aware and cannot exit 0 while typecheck is red; `solid-2-tests` checks exit 0), and oxfmt is clean.
- [ ] The outcome lists each pattern you had to invent beyond the Decisions, for `solid-2-conventions`.

## Sizing

L: 64 files, half of them resources.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
