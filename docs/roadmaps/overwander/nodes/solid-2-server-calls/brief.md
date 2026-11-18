---
id: solid-2-server-calls
title: Move to Solid 2.0's skew protection and fix server reads
status: active
priority: could
type: refactor
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
  - vite.config.ts
  - test/model/**
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

# Move to Solid 2.0's skew protection and fix server reads

## Goal

Drop the app's own build guard in favour of the skew protection built into Solid 2.0's server functions, keep a tab from an old build reloading instead of calling the new server, and make `readOnly` and the call counter work on 2.0's endpoints. Restate the two server skills.

## Context

- Decided by the maintainer on 2026-11-18: Solid 2.0 has skew protection built in, so the app should not keep its own. Today's guard: `src/auth/stale-build.ts` stamps `X-Build` on every `/_server` call through a `fetch` wrapper, `src/middleware/index.ts` refuses a call that does not name the live build, `src/model/build.ts` holds `isServerCall` and the build id, and `vite.config.ts` defines `VITE_BUILD_ID` from `BUILD_ID`.
- Spike and review findings (`solid-2-spike` outcome, "Server functions and the build guard"): the plugin stamps `X-Server-Function-Build` on every non-GET call and the runtime answers a mismatched build with 409 and `X-Server-Function-Unknown`; an unknown function id answers 404 with the same header. A call with no header gets through, which matters only for callers outside the Solid client (a script, a form posted without JavaScript); old tabs always go through the client. Ordinary calls are `POST /_server/data/<id>`, `fn.url` and form actions `/_server/<id>`, the live wire `/_server/live/<id>`. `X-Server-Id` is gone; `fn.id` is exposed.
- Reads stay POST (story Decisions 6), so every read is stamped too.

## Steps

- [ ] Confirm in `node_modules/@solidjs/vite-plugin` and `@solidjs/web/server-functions` how the build id is made: is it new on every build that changes server code, is it the same in the client and server bundles, and does the Docker build (`Dockerfile`, `BUILD_ID`) need to feed it? Record the answer in the outcome. If it is weaker than one id per deploy in a way that lets an old tab reach a changed function, stop and report instead of removing the app's guard.
- [ ] Find out what the Solid client does with a 409 or 404 carrying `X-Server-Function-Unknown`. If it does not reload, keep a small handler (in the existing `fetch` wrapper or the client's `configureServerFunctionsClient` hook) that reloads the tab once on that header. A test covers it.
- [ ] Remove the app's guard: the `X-Build` stamp, the middleware refusal, `isServerCall`'s use for it and `VITE_BUILD_ID` if nothing else reads it. Delete or rewrite their tests (`test/model/build.test.ts`, `test/auth/stale-build.test.ts`).
- [ ] Rekey `readOnly` on `fn.id` and the call counter on the id from the path (last segment under `/_server/`); a test that a registered read does not count as a change.
- [ ] On `pnpm dev` (with `pnpm db`): a `POST /_server/data/<id>` carrying a wrong `X-Server-Function-Build` gets the 409, and a normal page's calls carry the header.
- [ ] Rewrite `server-function-order` (ids are `<binding>-<xxhash32(file)>`, two same-named bindings in one file are ordered with `-1`; Solid's build check, not the app, refuses old tabs; every call still goes through the Solid client) and `server-reads` (`readOnly` on `fn.id`) in `.claude/skills/` and `.agents/skills/`. Leave `AGENTS.md` to `solid-2-conventions`.

## Acceptance

- [ ] The outcome states how Solid's build id is made and that it changes per deploy.
- [ ] No `X-Build` stamp or middleware build refusal is left; `grep -rn "X-Build\|VITE_BUILD_ID" src test vite.config.ts` prints nothing, or only what the outcome justifies.
- [ ] A tab answered with `X-Server-Function-Unknown` reloads (test), and the dev check above holds.
- [ ] `pnpm exec vitest run test/model test/auth` passes.

## Sizing

M: a handful of files, but it replaces what stops old tabs from corrupting player state, so the build-id check needs real evidence.
