---
id: solid-2-server-calls
title: Fix the build guard and server reads for Solid 2.0 paths
status: todo
priority: could
type: fix
story: solid-2
early: false
outline: false
milestone: later
size: M
spike: false
verify: pnpm exec vitest run test/model/build.test.ts test/auth
gate: false
added: 2026-11-18
owns:
  - src/model/build.ts
  - src/auth/stale-build.ts
  - src/auth/server-calls.ts
  - src/middleware/**
  - test/model/build.test.ts
  - test/auth/**
  - .claude/skills/server-function-order/**
  - .agents/skills/server-function-order/**
  - .claude/skills/server-reads/**
  - .agents/skills/server-reads/**
shared: []
provides: []
depends_on:
  - on: solid-2-codemod
    kind: hard
    why: Both edit imports in src/auth and src/middleware; this starts from the renamed files.
---

# Fix the build guard and server reads for Solid 2.0 paths

## Goal

Turn the build guard back on and make `readOnly` and the call counter work on 2.0's endpoints, then restate the two server skills.

## Context

- Spike outcome, "Server functions and the build guard". Ordinary calls are `POST /_server/data/<id>`, `fn.url` and form actions are `/_server/<id>`, the live wire is `/_server/live/<id>`. `isServerCall` in `src/model/build.ts` matches only `/_server`, so nothing is stamped or refused today. `X-Server-Id` is gone; the id is the last path segment and `fn.id` is exposed.
- Decided (story Decisions 6): reads stay POST; `readOnly` keys on `fn.id`, the counter on the id from the path. A 404 or 409 answer carrying `X-Server-Function-Unknown` reloads the tab like the app's own 409.
- Ids are `<binding>-<xxhash32(file)>`: the skills, the middleware comment and the `vite.config.ts` build-id comment give "same id, new parameters" as the guard's reason, not position. Two same-named bindings in one file are still ordered (`-1`), so note that.

## Steps

- [ ] Prove it first: a test that a `POST /_server/data/<id>` without `X-Build` is refused fails on `feat/solid-2`.
- [ ] Match every path under `/_server/` in `isServerCall`; update both guard tests to the 2.0 paths.
- [ ] Rekey `readOnly` and `countServerCall`; a test that a registered read does not count as a change.
- [ ] Reload on `X-Server-Function-Unknown`.
- [ ] Rewrite `server-function-order` and `server-reads` in `.claude/skills/` and `.agents/skills/`. Leave `AGENTS.md` to `solid-2-conventions`.

## Acceptance

- [ ] The proof test fails on `feat/solid-2` and passes on the branch.
- [ ] On `pnpm dev` (with `pnpm db`), a `POST /_server/data/<id>` with no `X-Build` gets the 409, and a normal page's calls carry `X-Build` (check in the network log or with a test).
- [ ] `pnpm exec vitest run test/model/build.test.ts test/auth` passes.

## Sizing

M: a handful of files, but the guard is what stops old tabs from corrupting player state, so it needs real proof.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` stays red until every area is done. Judge your node by the errors in your owned paths: `pnpm typecheck 2>&1 | grep -E '<your paths>'` prints nothing.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
