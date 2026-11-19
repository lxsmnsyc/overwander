# Outcome: solid-2-overworld-battle

## Built

- Branch `refactor/solid-2-overworld-battle`, cut from `feat/solid-2` (7ed8b5133). 24 files changed under `src/components/overworld`, `src/components/battle` and `src/components/app/store-signal.ts`. Nothing under `src/components/moves` needed a change.
- `createStoreSignal` (Decision 4): `createMemo(() => from((next) => { next(store.get()); return store.subscribe(next); }), { equals: false })`. The current value is handed over during the subscribe, so the first read never waits. A store change now lands at the next flush, like any 2.0 write, not synchronously as in 1.x. Same signature and callers.
- Resources (Decision 1), 13 of them:
  - Each `createResource(source, fetcher)` became a key memo plus an async memo that reads it (`LobbyParty`, `SpectatorList`, `TeamsPreview`, `BattleHistory` rows, `GymSeatDialog`, battle view names, Safari). 1.x compared the source, so a caller that rebuilt an equal key did not refetch; without the key memo every rebuild would ask again. Where the key was one prop the memo reads it directly (`WatchBattle`, `BattleHistory` claims, the overworld tab).
  - A source that was null is now a sync `null`/`0`/`[]`/`undefined` from the same compute, so nothing waits on it.
  - `refetch()` became `refresh(memo)`. `settled(...)` became a plain read: `Loading` already keeps shown content through a refresh.
  - `readable`/`failed`: `HoneyTreeDialog` and `PortalDialog` wrap the body in `<Errored>` whose fallback renders the same body with a count of 0 and `describeFailure(error())` as its note. Safari's bag keeps a failure as an answer instead (`readBag` resolves to `{ entries, failed }`), because its `<Dialog>` lives inside the reading body and its effects read the bag (see Deviations).
  - `.latest` (never wait): `GymSeatDialog` puts the holder plate and the lineup each under a nested `<Loading>` whose fallback is the empty look. Safari's dex ownership is read by the title and inside the catch handler, where a read with no answer throws, so it became a longhand load (key memo, effect with a `live` flag, `owned` signal undefined until it lands).
  - `mutate` (Safari bag): a writable async signal, `createSignal((): Promise<Bag> | null => ...)`, written with an updater on each spend.
  - The 1.x `from(producer)` signals (`BattleHistory` list, `LobbyInviteDialog` friends) became `createMemo(() => from(...))`. The friends list sits under its own `<Loading>` with the old empty note as fallback, so the invite sheet does not wait on it.
- The overworld tab mounts the board under `<Show when={[buddy(), fled()]}>`, inside the existing `<Loading>`. The walk, its windows and the interactions read `view()` from timers and handlers, and in 2.0 an untracked read of a memo with no value yet throws `NotReadyError` (1.x gave `undefined`).
- Effects split (Decision 2): `board.tsx` (12), `WorldMapCanvas` (2), `chunk-canvas`, `follow-unit`, `BattleTopBar`, `overworld-tab/index.tsx`, Safari (3). `on(...)` went with them; the one deferred `on` kept `{ defer: true }`, and its side read of `placed` is `untrack(placed)` so being placed does not replay the last move. Cleanups are returned from the apply.
- `WorldMapCanvas` (the codemod's stub): the two effects created inside `onSettled` moved to the body. The canvas pages are made by the first apply that draws (`getSurface`). The rings read a `Marks` object that the second effect stores, so the ground effect and its frame loop compose with the last marks instead of reading props outside a tracking scope. `settledAt` takes the towns list from the compute.
- Owned-scope writes (Decision 3), all by derivation; no `{ ownedWrite: true }` anywhere in the owned paths:
  - `DuelRulesDialog` draft: `createSignal((was) => props.isOpen || was == null ? props.rules : was)`.
  - `StopDialog` picks: `createSignal((was) => props.challenge == null ? (was ?? []) : [])`.
  - `BattleParty` party: `createSignal(() => readParty(...))`, which also drops the body-level props read.
- Memos with an initial value (`createMemo(fn, init, opts)`) lost the middle argument: `contributions`, `sides`, `Inspector`'s `shown`, `standingsAsk`, `walkGoal`, Safari's `session`. The previous value is `undefined` on the first run and the computes now say so.
- `batch` in `BattleParty`: dropped (writes batch per flush). `<Dynamic>` in `WeatherIcon`: `dynamic(() => ...)`. `aria-pressed` in `BattleTopBar`: `spellAria`. `tabIndex` on the results title: `tabindex`.
- `BattleTopBar` hung its battle listeners in the body and read `props.battle` again in `onCleanup`, the teardown bug `BattleParty` documents. It now subscribes in `onSettled` with the battle held. The battle view takes `props.active` once, through `untrack`.
- Typecheck, whole branch: 444 errors before (98 in the owned paths), 346 after (0 in the owned paths).

## Deviations

- Safari's bag reports a failed read as a value (`{ entries: null, failed }`), not through `<Errored>` (Decision 1). The body that reads it also renders the `<Dialog>`, and two effects read the bag, so an `<Errored>` would have to replace the whole dialog, and an effect's throw has no boundary between it and the page. It catches a promise rejection, not a reactive read, so `CAUGHT_REACTIVE_READ` does not apply.
- Safari's dex ownership is a longhand load, not an async memo: it is read in a click handler and in the dialog title, and neither may wait. This is styled's "longhand loads stay effects where the reader must not wait" pattern. It is also reset to `undefined` when the species changes, where 1.x `.latest` showed the previous species' answer until the new one landed.
- `GymSeatDialog`'s holder plate and lineup now show their empty look under nested `<Loading>`s. 1.x `.latest` did the same.
- No file outside the owned paths changed.

## Stubs left

- None in the owned paths. `src/components/app/resource-reads.ts` (`settled`, `answered`, `readable`, `failed`) still types the 1.x `Resource`. Nothing in the owned paths imports it now; `solid-2-shell-routes` or `solid-2-conventions` decides whether it goes.

## Gotchas

- **No "never wait" read exists in 2.0.** `latest(fn)` on a memo with no value yet throws `NotReadyError`, an initial value does not stop an async memo from suspending, and catching the throw in a memo logs `CAUGHT_REACTIVE_READ` and stops working after the first time. For a read that must not wait use a nested `<Loading>` with the empty look as fallback, or a longhand load. `answered` (resource-reads) has no 2.0 equivalent.
- **An untracked read of a pending memo throws.** Handlers, timers and `src/game` modules handed an accessor (`walk.attach({ view })`, `boardWindows.attach(...)`) read outside tracking. 1.x got `undefined` there; 2.0 throws. Mount the code that reads from timers only once the data has landed (`<Show when={[a(), b()]}>` under the `Loading`).
- **1.x `createResource` compared its source.** A straight `createMemo(() => fetch(key()))` refetches whenever any read inside it changes. Put the key in its own memo (strings compare by value) and read that.
- **An effect apply that returns a non-function halts the whole reactive system** (`REACTIVITY_HALTED: effect callback returned an invalid cleanup value`). `(v) => setX(v)` or `(v) => list.push(v)` as a concise arrow returns a value. Write applies with braces.
- **`createMemo(fn, initial)` is gone.** The second argument is options now. `createMemo(fn, null, { equals })` fails typecheck, but `createMemo(fn, [])` can slip through as an options object where the types are loose. The first `prev` is `undefined`.
- **Store changes through `createStoreSignal` land at the next flush.** A handler that sets a `src/game` store and then reads the signal sees the old value, the same as any 2.0 write.
- **oxlint `promise-function-async`** flags every async-memo compute that returns a promise or a plain value. Use `async` where it always returns a promise; otherwise annotate the union return (`(): Promise<T> | null => ...`). Do not make a compute `async` just to quiet the rule: an async compute is always pending at first, even for its null case.
- Writes inside an effect apply are allowed and silent; reads there are untracked (`untrack(...)` says it on purpose).

## Proposed learnings

- A key memo goes in front of every async memo whose key is built from props | 1.x resources compared their source; async memos re-run on any read | `src/components` | no
- Code that reads an async memo from a timer, handler or game module mounts only after it has landed | untracked reads of pending memos throw `NotReadyError` | `src/components`, `src/game` callers | no
- Effect applies are written with braces | a returned non-function halts reactivity | `src` | yes (lint: forbid a concise arrow as `createEffect`'s second argument)
- A read that must never wait is a nested `Loading` or a longhand load, never a caught read | 2.0 has no non-suspending read | `src/components` | partly (grep for `NotReadyError` catches)

## Verification

- `pnpm typecheck 2>&1 | grep -E 'src/components/(overworld|battle|moves)|store-signal'`: prints nothing. Whole branch: 444 before, 346 after.
- `pnpm exec oxlint src/components/overworld src/components/battle src/components/moves src/components/app/store-signal.ts` (through `rtk proxy`): exit 0, warnings only (`no-unassigned-vars` on compiler-assigned `ref` lets, present before). No error kind added.
- `pnpm exec oxfmt --check` on the owned paths: clean.
- `pnpm exec vitest run test/battle/item-tray-reading.test.ts test/overworld/world-map.test.ts test/components test/game` (the two tests that import owned paths, plus the component and store tests): 20 files, 112 tests passed.
- Node experiments against the dev build of solid-js 2.0.0 (scratch, not committed): `from` subscription timing and disposal, `latest`/untracked reads of pending memos, a writable async signal with an updater, writes from apply, from bodies, memos and `onSettled` through a store.
- Runtime: `/` still renders only the shell's error (the shell's `createResource` and one-argument effects, `solid-2-shell-routes`), so the overworld cannot be walked yet. A scratch harness module (deleted, never committed) on `pnpm dev` with `pnpm db`, driven by Playwright: a `createStoreSignal` count followed two `store.set` calls; `WorldMapCanvas` painted its 200x200 page and repainted on pan; no reactivity diagnostics from the owned code. `pnpm db:stop` run, dev server killed, `ps` shows no vite or `pnpm dev`.
- Not run: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`.
- Still owed once the shell renders (`solid-2-shell-routes` or the story check): walk the overworld, open the Honey tree, Portal, Gym seat and Safari dialogs, and start and finish a battle.

## Size

- Estimated L, actual L.
