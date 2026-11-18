# Outcome: solid-2-shell-routes

## Built

- Branch `refactor/solid-2-shell-routes`, cut from `feat/solid-2` (9659e9a4b). The app renders end to end on `pnpm dev`: sign in, walk, dialogs, a duel started and finished, the admin and demo routes.
- Typecheck: 77 errors before (76 in the owned paths, 1 in `test/`), 2 after, both in `test/components/resource-reads.test.ts` (it imports the deleted module; `solid-2-tests`). 0 in `src`.
- Resources (Decision 1):
  - Async memo under the existing `Loading`, with a key memo where the key comes from props: `AdminPlayer`, `AdminPlayers`, `AdminRaids`, `AdminSwitches` (`refetch` to `refresh(switches)`), `AdminWorld` (keyed on the chunk seed), `PlayerPicker` (asks nothing for an empty search, as the 1.x falsy source did), `BattleData`, `pick-catch`, `pick-catch-then`, `teach-move` (both reads), the teaser's fight, `BattleViewDemo`'s names.
  - `createLoad` where the reader draws an empty state or reads in the declaring body: `pick-team` (saved teams and each saved team's party), `LoginForm`'s sign-in providers.
  - `CatchSheetDemo` hands the sheet answered `Load` objects through a local `answerWith(value)`.
  - `src/components/app/resource-reads.ts` deleted; nothing in `src` imports it.
- Effects split (Decision 2), cleanups returned from the apply: `game-context` (the session starts per user), `command-bar` (the slash key), command-bar offers (scroll into view), `teach-move`'s `askTeachings` (`on` gone), the demo effects (`MoveDemo`, `RaidDemoBoard`, `ShadowDemo`, `WeatherDemo`, `WeatherMap`, `WorldDemo`, `BattleViewDemo`). Shadow's draw loop that only read a ref became `onSettled`. `client-signal` turns on in `onSettled`.
- Owned-scope writes (Decision 3), all by derivation; no `{ ownedWrite: true }` in the owned paths:
  - `routes/index.tsx` `lastTrading`: `createSignal((was) => game.trading() ?? was ?? null)`.
  - `GameMenu` gold and trainer: read off one `watchLive` of the profile instead of an effect writing two signals.
- `from` during the server render: `routes/index.tsx` (`Banned`), `routes/admin.tsx` (`Gate`) and `GameMenu` now follow the profile through `watchLive`, which opens nothing on the server and reopens for another uid. `Gate` keeps its "row on its way" against "no row" split by wrapping the answer: `{ record }`.
- Contexts (Decision 9): `useAuth`, `useGame` and `useStaff` drop the dead null check (a missing provider is a bug, and `useContext` throws). `StaffProvider` takes `uid` and `role` and provides accessors for both (`staff.uid()` in `AdminPlayer`); the 1.x copy of `props.uid` is gone. `AuthProvider` reads the path once in `onSettled` through `untrack`.
- Router: `src/auth/sprites.ts` exports plain `'use server'` functions taking one `FormData` (a native encoding in 2.0, no rich-args needed). The sprite processor forms post through `createSubmission(pack, reset)` in `sprite-processor/shared.tsx` (`pending`, `result`, `error`, `submit`), which clears the file pickers on success in the handler rather than in an effect. `useSearchParams`, `useLocation`, `useParams` and `useNavigate` work unchanged (admin sections, `/admin/player/:id`, `/battle/:id`, demo query strings checked).
- `GameMenu`: `<Dynamic>` gone (a plain component lookup for the fixed menu icon, `<entry.icon>`, and a local `Icon` in the two weather blocks that already re-run whole). Boolean `aria-*` through `spellAria` in `GameMenu`, command bar, offers, `pick-catch-then`, `pick-move`, `teach-move`.
- `entry-server.tsx`: `nonce: context.nonce ?? undefined`. The Document's `<Errored>` is kept, now that the app renders: it is the last stop for a render error, which a page shows as text instead of a bare 500. A designed error screen is not this node's call.

## Runtime check (`pnpm db`, `pnpm seed`, `pnpm dev`, Playwright, alice and bob)

Works:

- Landing, signed out: title card, sign-in form, passkey button. No 2.0 warnings once the provider list moved to `createLoad`.
- Sign in as alice: the overworld draws, the menu, the clock, the weather capsule.
- Walk: arrow keys move the player and the camera, across a chunk edge; click-to-walk sets a goal.
- Dialogs from the menu: Boxes, Bag, Pokedex, Profile, World map, Quests, Battle, Raids, Notices, Gifts, News, Settings.
- Forms and NPCs: the vendor's conversation and shop counter (Enter on a vendor), the wild encounter dialog (Enter on a Magnemite), the gift claim (Snivy for alice and for bob).
- Catch sheet (Boxes, press a pokemon), its Actions menu; dex entry; settings Security after the password step (two-step and passkeys panes); profile sheet with friends, battle history and replays; profile editor (nickname saved, "Profile saved.").
- Duel: alice hosts, invites bob (live invite in bob's Battle panel), bob joins, both form a team (`PickTeamForm`), both ready, Start. The fight runs and ends: "Victory" on alice's side, "Defeat" on bob's, with damage shares and the best pokemon; "Leave battle" returns to the overworld. Run twice. The replay route `/battle/<id>` plays the recorded fight.
- Trade offer dialog (Profile, Friends, Trade) and its "Pick yours" form (the only pokemon is refused, a game rule).
- Admin, signed in as alice: overview, players (search list), one player, raids, switches, world map, gifts, auctions. 404 page.
- Demos: auction (board and the sell side), aura, battle, board, catch sheet, gifts, kit, move, pokedex, raid, shadow, teaser (`?scene=raid`), weather, world. Sprite processor page. Reset password page (no token).
- `/demo` alone answers 404: the folder has no index route, as before.

Not reached, with why:

- Honey tree, Portal, Gym seat and Safari dialogs: each needs the player walked to that landmark, and none stands near the seeded players. Owed to the story check.
- Auctions with a bid and a listing: the seeded data has nothing rare enough for the block (bag and records both say so), so no lot can be listed or bid on. The board and the sell side render.
- Raid lobby: no raid gathers in the current window ("New raids in 103 minutes").
- Quests with a claim: nothing is complete on a fresh account.

Console, by owner (all `STRICT_READ_UNTRACKED` unless named):

- Fixed here: `BattleData` (`PENDING_ASYNC_UNTRACKED_READ`), `LoginForm` (`SILENT_HOLD`), `BattleViewDemo` and the teaser (search params and the fight read in a body), `styled/search` (`terms` and `typed` in the value effect's apply, now `untrack`), `TooltipHost` (Floating UI's `setReference` in the ref callback, now inside `untrack`).
- `solid-2-overworld-battle`: `overworld-tab/board.tsx` hands `view`, `buddy`, `user` and `elsewhere` accessors to `src/game/overworld/walk.ts` and `windows.ts`, which read them from effect applies (hundreds per minute of walking), and `OverworldBoard` reads `view` in its body (`overworld-tab/index.tsx:70`). `WorldMapCanvas`/`WorldMapDialog` read a `Show` condition untracked.
- `solid-2-catches`: `catch-picker/box.tsx` `draft` read in an effect apply; `StatHexagon`'s `For` (12 per sheet); `UNSTABLE_LIST_IDENTITY` on the gift shelf.
- `solid-2-social`: `ProfileSheet`'s `Sheet` body, `ProfileTab` and `AuctionBoard` `Show` conditions; `SILENT_HOLD` on the duel lobby's `names`; `UNSTABLE_LIST_IDENTITY` on the lobby rows.
- `solid-2-styled` / upstream: `HoverCard`'s ref callback (same Floating UI read as `TooltipHost`; the same `untrack` fixes it), `"merge"` read in Floating UI's own effect, terracotta's `TabPanel` reading its props in its body (`GameMenu`'s tabs; library).
- Server, `src/i18n/server.ts` (no node owns it): `RequestEvent is missing` logged about 1,700 times in one session. `readRequestLocale` calls `getRequestEvent()` outside a request (registry loads, the live socket) and after `await`s; 2.0's dev build warns each time. If it is also missed inside server functions after an `await`, their messages fall back to English for a ja or es player: worth checking.
- `GET /api/auth/token` answers 401 twice on the signed-out landing (the id token asked before there is a session). Not 2.0-specific as far as this check can tell.
- `ResizeObserver loop completed with undelivered notifications` in the browser, harmless.

## Deviations

- `src/components/catches/catch-picker/box.tsx` (owned by `solid-2-catches`): a press on a square set the draft and then reported `draft()` to a live caller, which in 2.0 still holds the value from before the write, so the caller set its picks back to the old list and the effect reset the draft. The team picker could not pick anything, and no duel, raid or gym team could be formed. `press` and `pickRun` now report the list they computed. Fixed because it blocked this node's battle check; the orchestrator may move it.
- `src/components/styled/search/index.tsx` and `src/components/styled/tooltip.tsx`: the warnings the brief allowed (`untrack` around the reads above).
- `{ ownedWrite: true }`: none written, so the comment criterion holds trivially.

## Stubs left

- None in the owned paths. `test/components/resource-reads.test.ts` tests the deleted module: `solid-2-tests` deletes it. Its typecheck error names `src/components/app/resource-reads`, so the acceptance grep prints that one line.

## Gotchas

- **Read after write in a handler that reports to a caller.** `setX(next); props.onPick(x())` hands the caller the old value in 2.0. Pass the computed value. The sweep over `src/components` and `src/routes` found no other case.
- **A `from` in a memo opens on the server.** Every profile follower in the shell now goes through `watchLive`, which seeds null and skips the server. A follower that has to tell "not answered" from "answered null" wraps the answer (`{ record }`).
- **A fallback-less `Loading` around something that only appears later still holds the whole transition** (`SILENT_HOLD` on the sign-in card). Where the reader can draw without it, `createLoad` is the shape.
- **Demo pages that stage from the URL** read the search params once: `untrack(() => ({ ...params }))`. A tracked read in an apply (`MoveDemo`'s `giant`) must move to the compute, or the switch stops restaging.
- The dev server is slow under two browsers: the first page can take 20 s and an async memo 20 s to settle, which shows up as `ASYNC_WATERFALL` warnings with large numbers. Not a regression to chase.
- `/demo` has no index page (404), as on 1.x.
- `pnpm start` was not run: it reads the root `.env`, which points at the production database.

## Proposed learnings

- A handler that writes a signal and tells its caller passes the value it wrote, never a read of the signal | writes land at the next flush in 2.0 | `src/components` | no
- A subscription a shell screen follows goes through `watchLive`, never a bare `from` | `from` in a memo subscribes during the server render | `src/components`, `src/routes` | partly (grep for `from(` outside `watch.ts` and `store-signal.ts`)
- `getRequestEvent()` is asked only where a request is in hand | 2.0 warns on every call outside one, and a call after `await` may miss the request | `src/i18n`, `src/server` | no

## Patterns invented (for `solid-2-conventions`)

- `createSubmission(pack, reset)` replaces `action` plus `useSubmission` for a form posting to a server function: a plain call with `pending`/`result`/`error` signals, the reset done in the success handler.
- A follower whose "not answered" and "answered empty" differ wraps the answer in an object before it reaches `watchLive`.
- A test or demo stand-in for a `Load` is an answered object (`answerWith(() => value)`).
- `untrack(() => floating.refs.setReference(element))` in a ref callback silences Floating UI's own read.
- A memo that only waits on a loader resolves to `true` and is read by a `Show`, never read bare in a body.

## Verification

- `pnpm typecheck`: 77 errors before, 2 after (both `test/components/resource-reads.test.ts`); 0 in `src`.
- Acceptance grep: prints only the `resource-reads.test.ts` line that names the deleted module.
- `pnpm exec vitest run` on the test files that import owned paths (`command-arguments`, `create-load`, `demo-move`, `forms`, `keys`, `resource-reads`, `official-names`, `fuzz/world/sky`, `overworld/raid/battle`, `server/sprite-processor`): 9 files, 107 tests pass; `resource-reads.test.ts` fails to import the deleted module (`solid-2-tests`).
- `pnpm exec oxlint` on the owned paths and the three outside files (through `rtk proxy`): exit 0, warnings only (`max-depth` in `BoardDemo`, `no-unassigned-vars` on ref lets, `no-base-to-string` on `FormData` reads in `sprites.ts`).
- `pnpm exec oxfmt --check` on the same: clean.
- `pnpm exec vite build`: exit 0, real 18.5 s (user 23.5 s). `.output/server/index.mjs` and `.output/nitro.json` written. 260 `INEFFECTIVE_DYNAMIC_IMPORT` warnings for the locale YAML (also loaded statically by the registries), not chased.
- Runtime check as above. `pnpm dev` stopped, `pnpm db:stop` run; `ps` shows no vite or `pnpm dev` process.
- Not run: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`, `pnpm start`.

## Size

- Estimated L, actual L.

## Review

A fresh review found nothing blocking.

- `catch-picker/box.tsx` `pickMany`: the inline reset read `value` in the same tick as the caller's write, so it would restore the picks before the press. No caller reaches it today (every inline multiple picker is `live`); the reset now runs on the next microtask.
- `src/i18n/server.ts`: not a locale bug. `getRequestEvent()` reads an `AsyncLocalStorage` that the plugin opens around every request and server-function call, and a probe with concurrent requests awaiting microtasks, timers, `setImmediate` and emitters kept each request's event. The "RequestEvent is missing" warnings come from calls outside any request (start-up registry loading), which fall back to English as intended. Silencing them is optional.
- `GameMenu` gold is null before the first answer, but the purse reads `gold() ?? 0`, so it still shows 0.
