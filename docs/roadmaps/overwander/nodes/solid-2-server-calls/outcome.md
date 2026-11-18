# Outcome: solid-2-server-calls

## Built

- Branch `refactor/solid-2-server-calls`, cut from `feat/solid-2` (36204e662).
- How Solid 2.0's build id is made (`@solidjs/vite-plugin` 3.0.1, `dist/esm/index.mjs` around lines 1300 to 1430 and 1570; `@solidjs/web` 2.0.0, `server-functions/dist/server.js` around 3200):
  - `const buildId = randomBytes(8).toString("hex")`, drawn once per plugin instance, so once per `vite build` process. It is new on every build, whether or not server code changed: at least one id per deploy, never shared between two builds.
  - Client and server get the same id. `solid:client-build-first` builds the client first in the same process, and the server handler module is generated with `configureServerFunctionsServer({ buildId })` from that process's id (or, for a server built alone, from `.vite/solid-server-functions.json` that the client build writes into its output).
  - The client runtime import is resolved to a virtual module whose `prepareRequest` stamps `X-Server-Function-Build` on every non-GET call, wrapping any `prepareRequest` the app sets. The server answers a call whose header names another build with 409, `X-Server-Function-Unknown: true` and the live build id; an unknown function id answers 404 with the same unknown header. A call with no header passes.
  - Docker: nothing to feed. `pnpm build` runs on the host and the image copies `.output`, which carries the id baked into both bundles. `BUILD_ID` still sets `VITE_BUILD_ID`, which now serves only the live feed.
- What Solid's client does with `X-Server-Function-Unknown`: `serverFunctionFailure` in `client.js` throws an `Error` with `status` and `unknownFunction = true`. It does not reload. So `src/auth/stale-build.ts` keeps its `fetch` wrapper: on any answer carrying that header (409 or 404) it calls `reloadForNewBuild()` and throws the `new-version` refusal. The loop guard in `sessionStorage` keys on the live build the 409 names in `X-Server-Function-Build`, falling back to `VITE_BUILD_ID` (the commit sha from `scripts/deploy.sh`) when the answer names none, so two builds of one commit each reload once.
- Removed the app's guard: the `X-Build` stamp, `BUILD_HEADER`, `STALE_BUILD_HEADER`, `isStaleCall`, `isServerCall` and the `refuseStaleCalls` middleware (`src/middleware/index.ts`).
- `src/model/build.ts` now holds `UNKNOWN_FUNCTION_HEADER` and `getServerCallId(pathname)`, which reads the id off `/_server/<id>`, `/_server/data/<id>` and `/_server/live/<id>` by Solid's own address rules (decoded, one segment).
- Call counter: the wrapper counts each call by the id from its path (going out and coming back). `readOnly` (`src/auth/server-calls.ts`) registers `fn.id`, so a registered read is not counted.
- Tests: `test/model/build.test.ts` (ids from each path form, non-calls), `test/auth/stale-build.test.ts` (passes the call through with Solid's header untouched, counts a change twice, does not count a registered read, leaves other requests alone, reloads once on a 409 unknown, reloads again for a 409 naming another build, reloads on a 404 unknown, does not reload on a 500).
- Skills rewritten in `.claude/skills/` and `.agents/skills/` (the two copies identical): `server-function-order` (ids by binding and file hash, `-1` for two same-named bindings, Solid's build check refuses old tabs, the reload wrapper, every call through Solid's client, reads stay POST, no check in dev, the live feed's own check) and `server-reads` (`readOnly` on `fn.id`, counter on the path id).

## Proof

- base (`feat/solid-2`, 36204e662): the spike already showed the old guard silent (`isServerCall` matched only `/_server`, so nothing was stamped or refused) and `readOnly` registering nothing.
- branch, dev (`pnpm dev`, id `listAnnouncements-7b56653c` read from the compiled `src/auth/announcements.ts`): `POST /_server/data/<id>` with no build header 400, with a wrong `X-Server-Function-Build` 400 (both reached the function, whose `check` refused `[]`); unknown id 404 with `x-server-function-unknown: true`; the 1.x form `POST /_server` 404 plain.
- branch, runtime: a scratch script loading `@solidjs/web/server-functions/dist/server.js`, configured with `buildId: 'live1234'` and one registered function: live build 200, other build 409 with the unknown header, no header 200.
- `createServerReference('listAnnouncements-7b56653c', ...)` from the client runtime: `fn.id` is the id, `fn.url` is `/_server/listAnnouncements-7b56653c`.

## Deviations

- The dev check in the brief cannot hold on `pnpm dev`: the stamp plugin is `apply: "build"` and the server gets a `buildId` only when `isBuild`, so in dev neither side stamps nor checks, and a wrong header reaches the function. The 409 is shown on Solid's runtime instead, and the stamp from the plugin source. A production build cannot be run on this branch yet (`vite build` fails on `createResource`), so the 409 on a built server and the header on a real page's calls are still to be seen: worth checking once the story builds.
- `VITE_BUILD_ID` stays, so the acceptance grep prints `src/global.d.ts`, `src/auth/live.ts`, `src/server/live/socket.ts`, `src/auth/stale-build.ts` and `vite.config.ts`. The live feed (`/_live`, not a server function) checks it on join and sends `stale`, and `reloadForNewBuild` falls back to it for its loop guard when an answer names no build. No `X-Build` is left. The `vite.config.ts` comment now says what the id is for.
- No change outside owned paths. `src/entry-client.tsx` still installs `guardServerCalls()` before hydrating, unchanged.

## Stubs left

- None.

## Gotchas

- Open 1.x tabs at the first 2.0 deploy post to `/_server` with `X-Server-Id`; 2.0 answers 404 with no unknown header, so their 1.x wrapper does not reload on it. They reload through the live feed instead: the deploy restarts the server, the socket reconnects, and the new `VITE_BUILD_ID` answers `stale`. A tab with no live socket open shows errors until reloaded by hand.
- A call with no `X-Server-Function-Build` is let through. Only callers outside Solid's client send none; a GET read declared with `GET(fn)` is not stamped either, which is one more reason reads stay POST.
- Should anyone build the server without the client build in the same process and without `.vite/solid-server-functions.json`, the server gets no `buildId` and checks nothing, silently. `pnpm build` runs one `vite build`, which is fine.
- `AGENTS.md` (and the mirrors) still describe the old guard; `solid-2-conventions` owns that.

## Proposed learnings

- A response with `X-Server-Function-Unknown` reloads the tab | Solid's client only throws on it | `src/auth` | yes (`test/auth/stale-build.test.ts`)
- Skew checks exist only in a production build | the Solid stamp and check are `apply: "build"` | `src` | no

## Verification

- `pnpm exec vitest run test/model test/auth`: 24 files, 293 tests passed.
- `pnpm typecheck`: 474 errors, the same count as the codemod left, none in the changed files.
- `pnpm exec oxlint` on the changed files (through `rtk proxy`): exit 0.
- `pnpm exec oxfmt --check` on the changed files: clean.
- `pnpm exec vite build`: fails on `createResource`, as on the base.
- Dev check on `pnpm dev` with `pnpm db`, by curl, as under Proof. Both stopped after; `ps` shows no vite process.
- Not run: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`.

## Size

- Estimated M, actual M.
