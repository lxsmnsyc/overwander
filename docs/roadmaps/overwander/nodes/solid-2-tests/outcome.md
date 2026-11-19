# Outcome: solid-2-tests

## Built

- Posture: `test.projects` in `vite.config.ts`, two projects.
  - `client`: `test/components/**`, no `environment` set, so the Solid plugin compiles for the browser (`isServer` false, a signal write applies after a microtask).
  - `server`: the rest of `test/**` (fuzz `.test.ts` files included) plus the `*.ssr.test.tsx` files, `environment: 'node'`, the server build of Solid.
  - A component test that calls `renderToString` is named `*.ssr.test.tsx`. It runs in `server` and is excluded from `client`. `news.test.tsx` is now `news.ssr.test.tsx`.
- The `test.environment: 'node'` stopgap is gone.
- `test/components/forms.test.tsx` now calls `flush()` before every read of the form stack (the client posture applies writes after a microtask).
- `test/components/resource-reads.test.ts` deleted (it tested the removed 1.x module).
- `vitest.fuzz.ts` and `vitest.sim.ts` drop `projects` from the root config they merge and set `environment: 'node'` themselves. `vitest list --filesOnly` shows fuzz: its 2 `.fuzz.ts` files once each, sim: `ai.sim.ts`. The default run lists `client` 8 and `server` 290 (289 plus the ssr file), `vitest.db.ts` 32.
- No DOM library is installed and none was added: the client project runs on Vitest's Node runtime with the browser build of Solid, which is all the 9 component tests need.

## Why this posture

- With no `environment` and no split, only 2 files failed (`forms.test.tsx`, `news.test.tsx`; 7 tests). The five files that failed in the spike pass since the earlier children.
- Both failures are posture facts: the forms stack is client state (needs `flush()`), the news test renders on the server.
- The engine, data and server modules never run in a tab, so they keep the server build, which is what the old stopgap gave them.
- Component tests run as the browser runs them, so a missing `flush()` fails here instead of in a tab.

## Suite times

All `pnpm test`, 298 files. The machine's speed changed during the session (another project's Vitest, a VM and a browser were running), so only runs close in time compare.

| Run | Wall | CPU (user+sys) | Result |
| --- | --- | --- | --- |
| Stopgap (`environment: 'node'`), machine quiet | 94.6 s | 603 s | 298 files, 5959 tests pass |
| No stopgap, no split | 186.7 s | not kept | 2 files fail (7 tests) |
| `test.projects`, contended | 501 s, 532 s | 1,216 s, 1,150 s | 13 and 6 failures, all 20 s to 90 s timeouts |
| `test.projects`, quieter | 417 s | 1,219 s | 4 timeouts |
| Stopgap config re-run right after, same machine state | 431 s | not kept | 5 timeouts |

- The last two rows are the fair pair: split 417 s against stopgap 431 s. The split costs nothing measurable; the 95 s run was a faster machine state, not the posture.
- Every file that timed out passes alone: `damaging-moves`, `experts`, `spawn-life`, `raid-sites`, `tera-sites`, `placement-invariants`, `world-windows`, `yaml-mapper`, `species-sprite-animation` (7 s to 39 s each).
- Under load the failing set changes run to run (13, 6, 4 tests), so it is contention, not one test.

## Acceptance

- [x] `pnpm typecheck` exit 0 (no errors anywhere). `rtk proxy pnpm exec oxlint src test` exit 0, warnings only. `oxfmt --check` clean.
- [x] `pnpm test`: passes apart from load timeouts that pass alone (list above). On the quiet 95 s run it passed in full (5959 tests); the final split config was not seen fully green in one run because of the load, each timed-out file was re-run alone and passed.
- [x] `pnpm test:db`, alone: 32 files, 171 tests pass, 67.5 s.
- [x] Times before and after: above.
- [x] Built server (`pnpm build` 43 s, `node --env-file=.env.development .output/server/index.mjs` on port 3123 with `BETTER_AUTH_URL` set to that port, against `pnpm db`):
  - A page's server calls carry `x-server-function-build: 099c0c6a0e399d71` (seen in Playwright on `/_server/data/listAnnouncements-7b56653c`).
  - A POST naming build `deadbeefdeadbeef` gets 409 with `x-server-function-unknown: true` and `x-server-function-build` set to the real one. A call with the right build gets past the check (400 on my empty body).
  - A call with no build header also reaches the handler (400), so a client that does not stamp is not refused by Solid; the app's own client always stamps.

## Runtime checks on the built server (alice and bob, `pnpm db` only)

Reached:

- Portal dialog (alice beside the town portal).
- Gym Seat dialog ("Take the seat").
- Honey Tree dialog.
- Auction listing: alice listed a Catching Charm through Add, pick, "Put it up for a day", "Sure?"; the row is in `auctions`.
- Auction bid: bob hovered the lot, pressed Bid, "Bid 1 gold"; `auctions.bid` is 1 with bob as bidder, his gold 999,999.
- Quest claim: alice claimed "Over the Hill" (quest 25 in `quest_claims`) after the teleports finished its "discover 3 biomes".
- Raid lobby: a seeded Max raid row for the current window opens the lobby (G-Max Snorlax, "You are hosting", Invite, Start disabled without a pokemon).

Not reached:

- Safari: no landmark is near; a wild pokemon beside the player did not open one in the attempts made. The wild encounter dialog was reached on the dev server by `solid-2-shell-routes`.
- A raid fight (alice owns no pokemon), a bid war, a collect after the auction ends.

Seeding done in `pnpm db`'s database only (`overwander_dev`): `pnpm seed`, a Catching Charm in alice's bag, 1,000,000 gold on every profile, alice and bob's `positions` rows moved to the landmarks, one `raids` row. The dev database was stopped at the end.

The build embeds the world seed and generation from the root `.env` (`VITE_WORLD_SEED`, `VITE_WORLD_GENERATION=2`), as Vite always does; the server itself read only `.env.development`. I found the seed by grepping `.output/public`, and did not open the root `.env`.

## Dev warnings

Fixed in `src`:

- `auction-tab/board.tsx`: `createLotActions` read `props.player` and `props.viewOnly` in the component body, which is where the "condition" and "condition value" warnings came from (the props are backed by a parent `Show`). They are getters now. The dev run shows none. The suspects named in review (`lot()` in the footer, `taking()`) were not the cause: the warning appears with item lots only.
- `profile-sheet/index.tsx`: `createProfileState` takes `viewOnly` and `section` through `untrack` (read once per opening).
- `forms/terms.tsx`: `CounterTerms` rows `<For keyed={(row) => row.label}>` (the `UNSTABLE_LIST_IDENTITY` from the duel lobby's rule chips).

- `overworld-tab/board.tsx`: the accessors handed to the walk and the windows (`view`, `buddy`, `elsewhere`, `uid`, `user`) are wrapped in `untrack` where they are handed over. The dev run no longer warns on them.
- `catch-picker/box.tsx`: `draft` read in the two effect applies is `untrack`ed.
- `StatHexagon.tsx`: `<For keyed={false}>`, so the index is a number and the item an accessor read in JSX.
- `styled/hover-card/index.tsx`: `setReference` inside `untrack`, as `TooltipHost` does. The dev run shows no hover warning.

Left:

- `UNSTABLE_LIST_IDENTITY` on the gift shelf and `ASYNC_WATERFALL` notes (dev server slowness, 8 s to 30 s flights) were not chased.
- An unnamed `STRICT_READ_UNTRACKED` "in an effect callback" that always follows Floating UI's `"merge"` warning: treated as the same upstream read.
- Upstream: Floating UI's `"merge"` read (still logged once when the auction hover card opens), terracotta `TabPanel`.
- `readRequestLocale`'s start-up "RequestEvent is missing" warnings: left, optional and not a locale bug.

## Deviations

- The dev run for the warnings used `pnpm dev --port 3000`, because Better Auth trusts only `BETTER_AUTH_URL` (port 3000) and returned 403 on other ports. The `pnpm db` database was recreated (in memory) and reseeded for it.
- Two early `pkill -f vitest` calls of mine ran while another project's Vitest was on the machine and may have stopped it once. Later cleanup used the PID I launched.
- The auction bid, raid lobby and quest claim were reached by moving rows in the throwaway database (positions, gold, a raid row, an item), not by playing to them.

## Decisions for the orchestrator

- Whether to add a time budget: `pnpm test` is 417 s to 530 s on a loaded machine, and 20 s timeouts fail under contention. Raising `testTimeout` or capping workers would stop the flakes; I left both alone.
- Whether `solid-2-conventions` should record the posture rule: component tests call `flush()` after a write and before a read; a test that calls `renderToString` is named `*.ssr.test.tsx`.
