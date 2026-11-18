# Outcome: solid-2-spike

## Built

- Branch `spike/solid-2-spike`, cut from `feat/solid-2` (9776577e0).
- Packages: solid-js 2.0.0, @solidjs/web 2.0.0 (new), @solidjs/router 2.0.0, @solidjs/meta 2.0.0, terracotta 2.0.0, solid-floating-ui 2.0.0, solid-marked 1.0.0, @solidjs/vite-plugin 3.0.1, unplugin-solid-marked 1.0.0, filesystem-routing 0.5.0. Removed: @solidjs/start, vite-plugin-solid-marked (vite-plugin-solid was never a direct dependency).
- `vite.config.ts`: `@solidjs/vite-plugin` in SSR start mode (`ssr: true`, `start.middleware`, `serverFunctions: true`, `extensions: ['.jsx', '.tsx']` for the `?pick=` route modules), `filesystem-routing/vite` `fileRoutes({ httpMethods: true, types: true })`, `unplugin-solid-marked` before it, Nitro kept as the deploy provider. Under Vitest only a bare `solid()` loads (it still claims `server-only`), and `test.environment: 'node'` is set (see Gotchas).
- `src/app.tsx`: `createRouter({ routes: fileRoutes(pageRoutes) })` with a render-prop child, `MetaProvider` removed (2.0 has none), `Suspense` to `Loading`, `onMount` to `onSettled`, the effect split in two. It also exports `Document` (the `<html>` shell with the theme script, `<HydrationScript />`, the client entry script and an `<Errored>` that prints a render error), because Solid 2 hydrates the whole document and both entries render it.
- `src/entry-server.tsx`: authored entry, `render(request, context)` around `renderToStream` with `virtual:solid-manifest`. `src/entry-client.tsx`: `guardServerCalls()`, then `hydrate(() => <Document><App /></Document>, document)`.
- `src/middleware/index.ts`: an array of `StartMiddleware` (https redirect, stale build refusal, `createAPIHandler(routes)` for the Better Auth route's `GET`/`POST`).
- `tsconfig.json`: `jsxImportSource: "@solidjs/web"`, types `vite/client`. `src/global.d.ts` references `@solidjs/vite-plugin/boundary-modules`, `/virtual-modules` and the generated `file-routes.d.ts`.
- Temporary shims in `vite.config.ts`, which the codemod child deletes: aliases `solid-js/web` to `@solidjs/web` and `solid-js/store` to `solid-js`, and a `terracottaRoot()` plugin that resolves a bare `terracotta` import (2.0 has only per-component entries) to a module re-exporting the entries the app uses.
- `pnpm dev` serves `/` with 200 and the full document. The render inside then throws at `src/auth/context.tsx` (`onMount is not a function`), and the `<Errored>` prints that. `/demo` 200, `/api/auth/ok` 200, `/src/entry-client.tsx` 200.

Docs read (links for the children):

- Solid 2.0 migration guide: https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/MIGRATION.md, and the cheatsheet shipped at `node_modules/solid-js/CHEATSHEET.md` (its "What changed from 1.x" tables are the codemod list).
- @solidjs/router 2.0: README section "Migration from 0.x" (https://github.com/solidjs/solid-router#migration-from-0x, also in `node_modules/@solidjs/router/README.md`).
- @solidjs/vite-plugin 3.0: https://github.com/solidjs/vite-plugin-solid#readme (start mode, `serverFunctions`, deployment contract, boundary markers, Testing, "Migrating from vite-plugin-solid").
- @solidjs/meta 2.0: README "Migrating from 0.x (Solid 1)".
- terracotta 2.0: https://github.com/lxsmnsyc/terracotta (one entry per component, `terracotta/<name>`).
- unplugin-solid-marked 1.0 and solid-marked 1.0: https://github.com/lxsmnsyc/solid-marked#readme.
- filesystem-routing 0.5 README, and the `solid-v2/fullstack` template: https://github.com/solidjs/templates/tree/main/solid-v2/fullstack.

## Error map

Counted on 2026-11-18 from source (files whose text uses the API, `src`, `test`, `e2e`), because typecheck errors are dominated by failed imports that hide the rest. A file can sit in several columns. "store setter" is 0: every `createStore` in the app is its own `src/game/store.ts`, not Solid's.

Areas: styled = `components/styled`, `icons`, `sprites`; overworld = `components/overworld`, `src/overworld`, `src/canvas`, `src/game`; battle = `components/battle`, `components/moves`, `src/battle`; catches = `components/catches`, `dex`, `items`; social = `auctions`, `duels`, `friends`, `gifts`, `notifications`, `profile`, `quests`, `raids`, `trades`, `news`, `settings`; shell = `components/app`, `forms`, `admin`, `demo`, `sprite-processor`; routes+server = `src/routes`, `auth`, `middleware`, `i18n`, `server`, `model`, `data`, entries.

| area | files | renamed import | resource to async | effect split | onMount/onCleanup | Suspense | Index | store setter | router | terracotta API | server functions | other |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| styled | 53 | 49 | 0 | 12 | 13 | 2 | 0 | 0 | 0 | 15 | 0 | 12 |
| overworld | 17 | 17 | 6 | 6 | 6 | 5 | 0 | 0 | 0 | 1 | 0 | 5 |
| battle | 25 | 24 | 7 | 4 | 5 | 6 | 5 | 0 | 1 | 2 | 0 | 6 |
| catches | 59 | 59 | 20 | 14 | 3 | 14 | 7 | 0 | 0 | 2 | 0 | 7 |
| social | 64 | 61 | 33 | 10 | 7 | 24 | 1 | 0 | 0 | 3 | 0 | 11 |
| shell | 62 | 58 | 16 | 16 | 18 | 13 | 2 | 0 | 13 | 4 | 0 | 10 |
| routes+server | 90 | 32 | 0 | 2 | 1 | 0 | 0 | 0 | 10 | 0 | 74 | 5 |
| tests | 5 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 |
| total | 375 | 302 | 83 | 64 | 53 | 64 | 15 | 0 | 24 | 27 | 76 | 57 |

Column contents: renamed import = `solid-js/web`, `solid-js/store`, `JSX` from `solid-js`, `mergeProps`, `splitProps`, `unwrap`, `createSelector`, `ErrorBoundary`, `classList`, `.Provider`. effect split = `createEffect`, `createComputed`, `createRenderEffect`, `on(`, `batch(`. router = files importing `@solidjs/router` (the app uses `useSearchParams` 9, `A` 7, `useLocation` 3, `useSubmission` 2, `useParams` 2, `useNavigate` 1, `action` 1; no `query`, no `createAsync`). server functions = `'use server'` (221 functions in 55 files), `readOnly(`, `@solidjs/start`, `getRequestEvent`. other = `Portal`, `Dynamic`, `keyed`, solid-floating-ui (3 files in styled), solid-marked (3 files in news).

What the tools say today:

- Compiler: running `@solidjs/compiler` (dom and ssr) over all 301 `.tsx` files fails only 2, both on the removed `on:` namespace; fixed here (see Deviations). 0 compile errors now.
- `pnpm typecheck`: exit 2, 1249 errors in 313 files. 296 `JSX` not exported by `solid-js`, 68 `createResource`, 58 `Resource`, 56 `Suspense`, 20 `onMount`, 15 `Index`, 13 `on`, 7 router `A`, 2 `useSubmission`, 2 `batch`; missing modules `terracotta` 27, `solid-js/web` 24 (tsc does not see the Vite aliases), `@solidjs/start` 17 (16 `clientOnly`, 1 `HttpStatusCode`). By code: TS2305 465, TS2322 107, TS2554 100 (one-argument `createEffect` and friends), TS7006 96, TS2344 86, TS2698 82, TS2724 72, TS2307 68. Expect more once imports resolve.
- `pnpm exec vite build`: fails after 26.5 s with 210 `MISSING_EXPORT` errors (the same removed names). No `'use server'` error surfaced.
- `pnpm exec vitest run`: see Verification.

## Server functions and the build guard

- Ids are `<dotted binding name>-<xxhash32(root-relative path)>` (@solidjs/compiler README, `transformDirectives`): a function is named by where it is bound, not by its place in the file. Adding, removing or reordering functions does not move the others. This was already true under @solidjs/start 2.1.0 (`dist/directives/plugin.js`, `createID`: file hash plus a hash of the hierarchical name; the 1.x build shipped ids like `d72f21b2-69853500`), so the skill's "by its place in its file" was stale before 2.0. Two nuances, checked with `transformDirectives`: two functions with the same binding path in one file are told apart by order (`a-e4747210`, then `a-e4747210-1`), so reordering those two still swaps them; and production ids now ship the plain binding name (SolidStart hashed it).
- The guard is still needed: an old tab calling a function whose parameters changed still reaches it with the old arguments, and a renamed or moved function still breaks. "Never weaken the guard" holds; the reason in the skill, the middleware comment and `vite.config.ts` must say "same id, new parameters" rather than "position".
- The guard is broken on this branch, silently. An ordinary 2.0 call is `POST /_server/data/<id>` (`createServerReference` in `@solidjs/web/server-functions/dist/client.js`); `/_server/<id>` is only `fn.url` and form actions, and `/_server/live/<id>` the live wire. None is `/_server?id=`. `isServerCall` in `src/model/build.ts` tests `endsWith('/_server')`, so neither `stale-build.ts` stamps `X-Build` nor the middleware refuses. Proven on `pnpm dev`: `POST /_server/nothing-123` with no `X-Build` reached the runtime (404 unknown function) instead of the 409. Fix: match every path under the `/_server/` prefix (`/_server/<id>` and `/_server/data/<id>` at least), then update `test/model/build.test.ts` and `test/auth/stale-build.test.ts`.
- `X-Server-Id` is gone (the id is the last path segment). On this branch the call counter never moves at all, because `src/auth/stale-build.ts` returns before `countServerCall` for every path `isServerCall` rejects, which is every call. Once the path is fixed, `countServerCall` gets null for every call, and `readOnly` (`src/auth/server-calls.ts`) finds no `?id=` in `fn.url` (a Proxy getter that returns `/_server/<id>`; it does not throw), so no read is registered and every read counts as a change. Replacement: the reference exposes `fn.id`, so `readOnly` can key on `fn.id` and the wrapper on the id in the path while reads stay POST. The alternative is 2.0's `GET(fn)` declared reads, which change reads to cacheable GETs with the arguments in the URL. Decision for `solid-2-server-calls`.
- The plugin adds a build stamp of its own: `X-Server-Function-Build` on every non-GET call, and the runtime answers 409 with `X-Server-Function-Unknown` to a mismatched build. It lets through a call that sends no header, so it is weaker than the app's guard and does not replace it. Unknown function ids answer 404 with the same unknown header. A child may choose to also treat those as "reload".
- Every browser server call still goes through `fetch`: the client transport calls `config.fetch || fetch` at call time (`@solidjs/web/server-functions` client, `createRequest`), so the global wrapper from `guardServerCalls()` sees every call as long as nothing sets `configureServerFunctionsClient({ fetch })` or a per-function `meta.fetch`. `'use server'` still compiles as a hoisted function that may only read its parameters, locals and module top-level bindings (same rule as SolidStart).

## Rough 1.x build times

`pnpm exec vite build` on 9776577e0 before any bump, `/usr/bin/time -p`, nothing else running: real 31.59 s, 32.60 s, 34.35 s (user 49.6 s, 50.3 s, 52.0 s). The 2.0 build does not finish yet (fails at 26.5 s). The real comparison is `solid-2-build-times`.

## One to one (a codemod can do them)

- `solid-js/web` to `@solidjs/web` (22 src files plus tests), `solid-js/store` to `solid-js`, `type JSX` from `solid-js` to `@solidjs/web` (about 296 imports).
- `terracotta` to `terracotta/<component>` per name (27 files; names used: Transition, Toggle, RadioGroup*, ColorScheme*, Tab*, Popover*, Disclosure*, Button, Listbox*). Prop changes inside terracotta 2 are not mapped yet: typecheck shows them once the paths resolve.
- `clientOnly` from `@solidjs/start` to `@solidjs/web` (16 route files); `HttpStatusCode` to `httpStatus()` from `@solidjs/web` (1).
- `Suspense` to `Loading`, `ErrorBoundary` to `Errored`, `mergeProps` to `merge`, `splitProps` to `omit`, `unwrap` to `snapshot`, `classList` to `class` object form, `Context.Provider` to `<Context value>`.
- `<Index>` to `<For keyed={false}>` (15 files): same callback shape, item accessor and numeric index.
- `onMount` to `onSettled` (20 files), where the body only runs once and returns nothing or a cleanup.
- Router `<A href>` to `<a href>` (7 files; `activeClass`/`end` become `[aria-current]` CSS).
- `on:event={fn}` to a `ref` that calls `addEventListener` (done here for the 2 uses).

## Needs a decision

- `createResource` (69 files) to async memos under `<Loading>`: no `.loading`, `.error`, `.state`, `.latest` or `mutate`/`refetch`. The `resource-suspense` convention (declare in a parent, read in a child under Suspense) has to be restated for `createMemo(async)`, `isPending`, `latest`, `refresh` and `<Errored>`. `test/components/resource-reads.test.ts` tests the 1.x `Resource` shape.
- `createEffect` (66 files) is two-phase only: each effect needs its compute and apply split by hand, and `on(...)` (13) goes with it. Effects no longer compare, so `effect-props`' memo rule still applies but its examples change.
- Writes from owned scope throw in dev (a signal set in a component body, memo or effect compute). Every effect that sets a signal needs `{ ownedWrite: true }`, a move to `onSettled`, or a memo. Not counted: it shows only at run time.
- Setters apply after a microtask flush: code that sets then reads in the same tick changes. Tests need `flush()`.
- `Loading` replaces `Suspense` with different rules: once content shows, a refetch keeps it, and `on` re-arms the fallback. `dialog-transitions` and `action-forms` assume 1.x Suspense.
- `createStoreSignal` (`src/components/app/store-signal.ts`): keep a signal plus cleanup in `onSettled`, or `createMemo(() => from(store.subscribe))`, which 2.0 is built for.
- `useSubmission` (2 files, among them `src/auth/sprites.ts` with router `action`) is gone: `formAction(...).onSubmit` with optimistic primitives, or plain calls.
- Server calls: the guard path fix, `readOnly` against `GET(fn)`, and whether to also reload on `X-Server-Function-Unknown`.
- Test posture (see Gotchas): browser (default, jsdom for component tests) or server (`environment: 'node'`), per file group via `test.projects`.
- Entries: keep the authored entries, or move to generated ones (`src/Document.tsx` convention, `start.clientSetup` for `guardServerCalls()`, `start.serverSetup` for the UTC pin), which get `productionErrorBoundary` and the dev toolbar for free.

## Skills and mirrors that name removed APIs

- `resource-suspense` (`.claude/skills/`, `.agents/skills/`): `createResource` (8), `Suspense` (10), one-argument `createEffect` (4).
- `effect-props` (both): one-argument `createEffect` (2).
- `dialog-transitions` (both): `Suspense` (4).
- `action-forms` (both): `Suspense` (1).
- `app-logic` (both): `onMount` (1), and `createStoreSignal`'s shape.
- `device-settings` (`.claude/skills/` only, no `.agents` copy): `onMount` (1).
- `server-function-order` (both): "SolidStart", "by its place in its file", "SolidStart's client looks `fetch` up".
- `server-reads` (both): `readOnly(fn)`, whose mechanism (`fn.url` `?id=`) is gone.
- `src/components/CLAUDE.md`: `Suspense`, `createResource`.
- `CLAUDE.md`: "SolidStart 2" in the stack line, and "SolidStart's transform strips module-level imports" (now @solidjs/compiler's directive pass; recheck the claim).
- `README.md`: "SolidStart 2" row in the stack table.
- `AGENTS.md` (lines 32 to 38): its summaries of `server-reads` ("registered with `readOnly`") and `server-function-order` ("addressed by its place in its file").
- `.opencode/AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*`: no hits.
- `deferred-jsx-props` names `JSX.Element` but no import path: still true, the type now comes from `@solidjs/web`.

## Proposed children

| id | title | owns | size | depends on |
| --- | --- | --- | --- | --- |
| `solid-2-codemod` | Rewrite the one-to-one 2.0 imports and renames | `src/**`, `test/**` (imports and the renames above only), `vite.config.ts` (delete the shims) | M | `solid-2-spike` (hard) |
| `solid-2-server-calls` | Fix the build guard and server reads for `/_server/<id>` | `src/model/build.ts`, `src/auth/stale-build.ts`, `src/auth/server-calls.ts`, `src/middleware/**`, `test/model/build.test.ts`, `test/auth/**`, the `server-function-order` and `server-reads` skills in `.claude/skills/` and `.agents/skills/` | M | `solid-2-spike` (hard) |
| `solid-2-styled` | Migrate the styled primitives, dialogs and floating UI | `src/components/styled/**`, `src/components/icons*`, `src/components/sprites/**` | L | `solid-2-codemod` (hard) |
| `solid-2-overworld-battle` | Migrate the overworld, canvas mounts and battle views | `src/components/overworld/**`, `src/components/battle/**`, `src/components/moves/**`, `src/components/app/store-signal.ts` | L | `solid-2-styled` (soft), `solid-2-codemod` (hard) |
| `solid-2-catches` | Migrate catches, the dex and items | `src/components/catches/**`, `src/components/dex/**`, `src/components/items/**` | L | `solid-2-styled` (soft), `solid-2-codemod` (hard) |
| `solid-2-social` | Migrate the social tabs and dialogs | `src/components/{auctions,duels,friends,gifts,notifications,profile,quests,raids,trades,news,settings}/**` | L | `solid-2-styled` (soft), `solid-2-codemod` (hard) |
| `solid-2-shell-routes` | Migrate the shell, admin, demos and routes | `src/components/{app,forms,admin,demo,sprite-processor}/**` (not `store-signal.ts`), `src/routes/**`, `src/auth/context.tsx`, `src/auth/sprites.ts` (router `action` and `useSubmission`, after the codemod's import rename), `src/app.tsx`, entries | L | `solid-2-styled` (soft), `solid-2-codemod` (hard) |
| `solid-2-tests` | Settle the test posture and fix the suite | `vite.config.ts` (`test`), `test/**` | M | the four area children and `solid-2-shell-routes` (hard) |
| `solid-2-conventions` | Rewrite the skills and mirrors for 2.0 | `.claude/skills/{resource-suspense,effect-props,dialog-transitions,action-forms,app-logic,device-settings}/**`, the `.agents/skills/` copies, `src/components/CLAUDE.md`, `CLAUDE.md`, `README.md`, `AGENTS.md`, `.opencode/AGENTS.md`, `.github/**` | M | area children (soft: the patterns they settle), `solid-2-server-calls` (hard: it changes the two server skills, and this child then syncs `AGENTS.md`'s passage on them) |
| `solid-2-build-times` | Compare build times on 1.x and 2.0 | none | M | everything above (hard) |

The decisions in "Needs a decision" for resources, effects and owned writes should be fixed (by the orchestrator or a short note in `solid-2-conventions`' brief) before the area children start, or each area picks its own.

## Deviations

- `pnpm-workspace.yaml`: pnpm added the new releases (all under a day old) to `minimumReleaseAgeExclude`; the install needs them.
- `file-routes.d.ts` at the root: generated by `fileRoutes({ types: true })` and committed, as the Solid template does. It types `virtual:file-routes`.
- `src/components/app/command-bar/index.tsx` and `src/components/styled/search/index.tsx`: the removed `on:keydown` moved into each input's existing `ref` as `addEventListener('keydown', ...)`. Without it nothing reachable from `/` compiles. The handler bodies are unchanged; oxfmt reindented them.
- `devDependencies` gained `filesystem-routing` 0.5.0: file routes moved from the framework to it.
- `<Errored>` in the Document prints the render error so `/` answers 200 while components are unmigrated. Keep or replace it in `solid-2-shell-routes`.

## Stubs left

- The `solid-js/web` and `solid-js/store` aliases and `terracottaRoot()` in `vite.config.ts`: `solid-2-codemod` deletes them.
- `isServerCall` still matches the 1.x endpoint, so the guard passes every call: `solid-2-server-calls`.
- `test.environment: 'node'` is a stopgap: `solid-2-tests`.

## Gotchas

- Test posture: the plugin compiles tests for the browser unless `test.environment` is set. With the default, 5 files fail (`window is not defined` in `hover-card/safe-area.ts` at import, `matchMedia is not a function` in `settings.ts`, `renderToString is not supported in the browser`, `MISSING_EFFECT_FN`). With `environment: 'node'` those pass but `test/game/overworld/windows.test.ts` fails (`Missing species data for 1014404`: something registers differently when `isServer` is true), and the full run took 605 s against 154 s, with 15 timeouts that pass alone.
- Solid 2 hydrates the whole document: the old `<div id="app">` wrapper is gone and `<body>` is the root. The portal host `ROOT_HOST` still sits inside the app.
- `@solidjs/meta` 2 dedupes `<Meta>` by name, last wins, and has no provider.
- `better-auth` 1.7.13 peers on solid-js ^1 (only for `better-auth/solid-start`, which the auth route uses as `toSolidStartHandler`, and which only reads `event.request`). It works; `pnpm peers check` warns.
- Nitro as provider is unverified: the build has to pass first. `pnpm start` runs `.output/server/index.mjs`; check Nitro still writes it with the plugin's `ssr` environment, the `/_live` socket and `migrate-on-start`.
- The plugin's `env` option probes `env.ts` at the root in start mode; the repo has none today, so it is off. Do not add one by accident.
- The middleware now reads `event.request` (2.0 has no `event.req`/`event.url`).
- `X-Build` and `X-Server-Function-Build` are two headers for the same idea; the app's must stay strict.

## Proposed learnings

- Match the server-function endpoint by the `/_server/` prefix, not the exact path | 2.0 puts the id in the path and an exact match silently turns the guard off | `src/model`, `src/auth`, `src/middleware` | yes
- A server function is named by its binding path and file, not its position | the skill said position since SolidStart 2.1 at least | `src` | no

## Verification

- `pnpm exec vite build` x3 on 9776577e0 (1.x): exit 0, 31.6 s, 32.6 s, 34.4 s.
- `pnpm dev` on port 3123 with `pnpm db` (54324): `/` 200 (document, render error printed), `/demo` 200, `/api/auth/ok` 200, `POST /_server/nothing-123` 404 from the runtime (guard bypass). `pnpm db:stop` run. The dev servers were not stopped: `pkill -f "vite dev --port 3123"` matched nothing, and the orchestrator killed five orphaned servers.
- Compiler sweep over 301 `.tsx` files: 2 failures before the `on:` fix, 0 after.
- `pnpm typecheck`: fail, exit 2, 1249 errors in 313 files (expected; mapped above).
- `pnpm exec vitest run`, default posture: fail, 5 files / 4 tests failed, 5901 passed, 154 s. With `environment: 'node'`: fail, 12 files / 17 tests failed (15 timeouts), 5934 passed, 605 s; the failed files rerun alone leave 4 failures (`windows.test.ts` x3, `tera-sites` timeout) plus `news.test.tsx`.
- `pnpm exec vite build` on the branch: fail, 210 `MISSING_EXPORT`, 26.5 s.
- `pnpm exec oxlint` on the changed source files: exit 0. `pnpm exec oxfmt` run on them.
- Not run: `pnpm test:db`, `pnpm test:e2e` (per the brief).

## Size

- Estimated M, actual M.
